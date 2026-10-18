'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Building2, Shield, DollarSign, Info, Sparkles, MapPin, 
  Layers, Search, Compass, CheckCircle2, TrendingUp, Maximize2, 
  X, ChevronRight, Award, Eye, FileText, ArrowUpRight, ChevronDown, Check,
  Database, AlertTriangle
} from 'lucide-react';
import centralidadesData from '@/lib/centralidades_data.json';
import centralidadesGeoJson from '@/lib/centralidades.json';
import proyectosGeometriasGeoJson from '@/lib/proyectos_geometrias.json';

const getFallbackToken = () => {
  if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  }
  try {
    const encoded = 'cGsuZXlKMUlqb2liV0ZzYjNCbGVuWWlMQ0poSWpvaVkyMXhhVE55T0RaMk1ESnRlREp5Y1hsdGVqRnphbkZ5WXlKOS4zRXFtbm9DTkNJNVVxRXljbmlCaWJn';
    if (typeof window !== 'undefined' && window.atob) {
      return window.atob(encoded);
    }
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
};

const HIERARCHY_THEME = {
  'Metropolitana': {
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8'
  },
  'Zonal': {
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857'
  },
  'Sectorial': {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309'
  },
  'Zonas Metro': {
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    text: '#0369a1'
  }
};

const getBadgeStyle = (badge) => {
  const b = (badge || '').toLowerCase();
  if (b.includes('inaugur') || b.includes('operac') || b.includes('ejecutad') || b.includes('complet')) {
    return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', bullet: '#059669' };
  }
  if (b.includes('ejecuc') || b.includes('obra')) {
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', bullet: '#2563eb' };
  }
  return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', bullet: '#d97706' };
};

export default function CentralidadesView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Estados de selección y filtros
  const [selectedCentralidad, setSelectedCentralidad] = useState(
    centralidadesData.find(c => c.id === 'cotocollao-ofelia') || 
    centralidadesData.find(c => c.id === 'mariscal') || 
    centralidadesData[0]
  );
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState('info'); // 'info', 'seguridad', 'economia', 'suelo'
  const [hierarchyFilter, setHierarchyFilter] = useState('Todas'); // 'Todas', 'Metropolitana', 'Zonal', 'Sectorial'
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [modalImage, setModalImage] = useState(null);
  const [floatingProject, setFloatingProject] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'paused' | 'checking'
  const [dbStats, setDbStats] = useState(null);

  // Verificar conexión en vivo con Supabase
  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success && data.proyectos && data.proyectos.length > 0) {
          setDbStatus('connected');
          setDbStats({
            proyectos: data.proyectos.length,
            seguridad: data.seguridad ? data.seguridad.length : 0,
            suelo: data.valorSuelo ? data.valorSuelo.length : 0
          });
        } else {
          setDbStatus('paused');
        }
      } catch (err) {
        setDbStatus('paused');
      }
    }
    checkDb();
  }, []);

  // Escuchar tecla Escape para cerrar modal flotante
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalImage) {
          setModalImage(null);
        } else if (floatingProject) {
          setFloatingProject(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalImage, floatingProject]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = getFallbackToken();

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-78.4900, -0.1950],
      zoom: 11.5,
      pitch: 35,
      bearing: -10
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      // 1. FUENTE Y CAPAS DE CENTRALIDADES (POLÍGONOS)
      map.addSource('centralidades-source', {
        type: 'geojson',
        data: centralidadesGeoJson
      });

      // Capa de Relleno según jerarquía
      map.addLayer({
        id: 'centralidades-fill',
        type: 'fill',
        source: 'centralidades-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'jerarquia'],
            'Metropolitana', '#2563eb',
            'Zonal', '#059669',
            'Sectorial', '#d97706',
            'Zonas Metro', '#0284c7',
            '#3b82f6'
          ],
          'fill-opacity': 0.32
        }
      });

      // Capa de Contorno de Centralidades
      map.addLayer({
        id: 'centralidades-line',
        type: 'line',
        source: 'centralidades-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'jerarquia'],
            'Metropolitana', '#2563eb',
            'Zonal', '#059669',
            'Sectorial', '#d97706',
            'Zonas Metro', '#0284c7',
            '#1e293b'
          ],
          'line-width': 2.5,
          'line-opacity': 0.95
        }
      });

      // Capa de Resalte para la Centralidad seleccionada
      map.addLayer({
        id: 'centralidades-highlight',
        type: 'line',
        source: 'centralidades-source',
        paint: {
          'line-color': '#0f172a',
          'line-width': 4.5,
          'line-opacity': 1
        },
        filter: ['==', ['get', 'id'], selectedCentralidad ? selectedCentralidad.id : '']
      });

      // Etiquetas con nombres de las Centralidades
      map.addLayer({
        id: 'centralidades-labels',
        type: 'symbol',
        source: 'centralidades-source',
        layout: {
          'text-field': ['get', 'nombre'],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-transform': 'uppercase'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.5
        }
      });

      // 2. FUENTE Y CAPAS DE TRAZADOS Y CONTORNOS DE PROYECTOS
      map.addSource('proyectos-geometrias-source', {
        type: 'geojson',
        data: proyectosGeometriasGeoJson
      });

      // Relleno cyan / azul distintivo para Polígonos de Zonas Metro
      map.addLayer({
        id: 'proyectos-geom-metro-fill',
        type: 'fill',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'is_metro'], true]],
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.38
        }
      });

      // Contorno cyan / azul para Polígonos de Zonas Metro
      map.addLayer({
        id: 'proyectos-geom-metro-outline',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'is_metro'], true]],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0284c7',
          'line-width': 3,
          'line-opacity': 0.95
        }
      });

      // Relleno suave amarillo para proyectos tipo Polígono convencionales (parques, bulevares zonales)
      map.addLayer({
        id: 'proyectos-geom-fill',
        type: 'fill',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true]],
        paint: {
          'fill-color': '#f2b705',
          'fill-opacity': 0.35
        }
      });

      // Contorno exterior amarillo para Polígonos de proyectos convencionales
      map.addLayer({
        id: 'proyectos-geom-polygon-outline',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true]],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f2b705',
          'line-width': 4,
          'line-opacity': 0.95
        }
      });

      // Sombra / Casing oscuro de contraste para Líneas y Senderos
      map.addLayer({
        id: 'proyectos-geom-line-casing',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['==', ['get', 'geom_tipo'], 'LineString'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0f172a',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 5,
            13, 8.5,
            16, 12
          ],
          'line-opacity': 0.5
        }
      });

      // LÍNEA AMARILLA PRINCIPAL DEL PROYECTO (Exacto como el diseño interactivo previo)
      map.addLayer({
        id: 'proyectos-geom-line-main',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['==', ['get', 'geom_tipo'], 'LineString'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f2b705',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 3.5,
            13, 6,
            16, 9
          ],
          'line-opacity': 1
        }
      });

      // RESALTE BLANCO / GLOW CUANDO UN PROYECTO ESTÁ ACTIVO/SELECCIONADO
      map.addLayer({
        id: 'proyectos-geom-selected-glow',
        type: 'line',
        source: 'proyectos-geometrias-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 8,
            13, 13,
            16, 18
          ],
          'line-opacity': 0.95
        },
        filter: ['==', ['get', 'id'], '']
      });

      map.addLayer({
        id: 'proyectos-geom-selected-core',
        type: 'line',
        source: 'proyectos-geometrias-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 5,
            13, 8,
            16, 13
          ],
          'line-opacity': 1
        },
        filter: ['==', ['get', 'id'], '']
      });

      map.addLayer({
        id: 'proyectos-geom-selected-polygon-fill',
        type: 'fill',
        source: 'proyectos-geometrias-source',
        paint: {
          'fill-color': '#facc15',
          'fill-opacity': 0.6
        },
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'id'], '']]
      });

      // Etiquetas con nombres de proyectos (visibles con zoom >= 12.5)
      map.addLayer({
        id: 'proyectos-geom-labels',
        type: 'symbol',
        source: 'proyectos-geometrias-source',
        minzoom: 12.5,
        layout: {
          'text-field': ['get', 'nombre'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            12.5, 9.5,
            14.5, 11,
            16.5, 12.5
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'symbol-placement': 'line-center',
          'text-max-angle': 30,
          'text-offset': [0, 1.3]
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.5
        }
      });

      // Popups interactivos
      const centralidadPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'centralidad-light-popup'
      });

      const projectPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'centralidad-light-popup',
        offset: 14
      });

      const projectInteractiveLayers = [
        'proyectos-geom-line-main',
        'proyectos-geom-fill',
        'proyectos-geom-polygon-outline',
        'proyectos-geom-metro-fill',
        'proyectos-geom-metro-outline'
      ];

      // Hover en Polígonos de Centralidades
      map.on('mousemove', 'centralidades-fill', (e) => {
        // Solo mostrar popup de centralidad si no se está sobre el trazado de un proyecto
        const featsUnder = map.queryRenderedFeatures(e.point, { layers: projectInteractiveLayers });
        if (featsUnder && featsUnder.length > 0) return;

        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const name = feat.properties.nombre;
          const jer = feat.properties.jerarquia;
          const sup = parseFloat(feat.properties.superficie_ha).toFixed(1);

          centralidadPopup.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: inherit; font-size: 12px; padding: 4px 6px;">
                <span style="font-weight: 800; color: #2563eb; text-transform: uppercase; font-size: 11px;">[${jer}]</span>
                <strong style="display: block; color: #0f172a; font-size: 13px; margin: 2px 0;">${name}</strong>
                <span style="color: #64748b; font-size: 11px;">${sup} hectáreas</span>
              </div>
            `)
            .addTo(map);
        }
      });

      map.on('mouseleave', 'centralidades-fill', () => {
        map.getCanvas().style.cursor = '';
        centralidadPopup.remove();
      });

      // Clic en Polígono de Centralidad
      map.on('click', 'centralidades-fill', (e) => {
        // Evitar que el clic en proyecto sea sobreescrito por la centralidad
        const featsUnder = map.queryRenderedFeatures(e.point, { layers: projectInteractiveLayers });
        if (featsUnder && featsUnder.length > 0) return;

        if (e.features && e.features.length > 0) {
          const clickedId = e.features[0].properties.id;
          const found = centralidadesData.find(c => c.id === clickedId);
          if (found) {
            handleSelectCentralidad(found);
          }
        }
      });

      // Hover en Trazados / Contornos de Proyectos Estratégicos
      projectInteractiveLayers.forEach((layerId) => {
        map.on('mousemove', layerId, (e) => {
          centralidadPopup.remove();
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            const p = e.features[0].properties;
            const isMetro = p.is_metro === true || p.is_metro === 'true';

            projectPopup.setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family: inherit; font-size: 12px; padding: 5px 8px; max-width: 270px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
                    <span style="font-weight: 800; color: ${isMetro ? '#0284c7' : '#b45309'}; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.04em;">
                      ${isMetro ? '🚇 POLÍGONO ZONA METRO (LÍNEA 1)' : '━━ TRAZADO DE PROYECTO'}
                    </span>
                    <span style="font-size: 9.5px; background: ${isMetro ? '#e0f2fe' : '#fef3c7'}; color: ${isMetro ? '#0369a1' : '#b45309'}; padding: 1px 5px; border-radius: 4px; font-weight: 700;">
                      ${p.badge}
                    </span>
                  </div>
                  <strong style="display: block; color: #0f172a; font-size: 13px; line-height: 1.3; margin: 3px 0 5px 0;">
                    ${p.nombre}
                  </strong>
                  <div style="background: ${isMetro ? '#f0f9ff' : '#fffbeb'}; border: 1px solid ${isMetro ? '#bae6fd' : '#fde68a'}; border-radius: 6px; padding: 5px 7px; margin-bottom: 4px; font-size: 11px; color: ${isMetro ? '#0369a1' : '#92400e'};">
                    📍 <strong>Centralidad:</strong> ${p.centralidad_nombre} 
                    <span style="font-weight: 700;">(${p.centralidad_jerarquia})</span>
                  </div>
                  <div style="font-size: 10px; color: #2563eb; font-weight: 700;">
                    👉 Clic para abrir las 4 Dimensiones
                  </div>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          projectPopup.remove();
        });

        // Clic en Trazado de Proyecto: abre pantalla flotante y resalta centralidad
        map.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const pProps = e.features[0].properties;
            const cent = centralidadesData.find(c => c.id === pProps.centralidad_id);
            if (cent) {
              setSelectedCentralidad(cent);
              const pIdx = cent.proyectos.findIndex(p => p.id === pProps.id);
              const proj = cent.proyectos[pIdx >= 0 ? pIdx : 0];
              if (proj) {
                setSelectedProjectIndex(pIdx >= 0 ? pIdx : 0);
                setActiveProjectTab('info');
                setFloatingProject(proj);
                focusProject(proj);
              }
            }
          }
        });
      });

      if (selectedCentralidad) {
        focusCentralidad(selectedCentralidad);
      }
    });

    return () => {
      map.remove();
    };
  }, [mapStyle]);

  // Actualizar filtro de jerarquía en el mapa (tanto polígonos de centralidades como líneas de proyectos)
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    if (hierarchyFilter === 'Todas') {
      mapRef.current.setFilter('centralidades-fill', null);
      mapRef.current.setFilter('centralidades-line', null);
      mapRef.current.setFilter('centralidades-labels', null);
      
      if (mapRef.current.getLayer('proyectos-geom-line-main')) {
        mapRef.current.setFilter('proyectos-geom-line-main', ['==', ['get', 'geom_tipo'], 'LineString']);
      }
      if (mapRef.current.getLayer('proyectos-geom-line-casing')) {
        mapRef.current.setFilter('proyectos-geom-line-casing', ['==', ['get', 'geom_tipo'], 'LineString']);
      }
      if (mapRef.current.getLayer('proyectos-geom-fill')) {
        mapRef.current.setFilter('proyectos-geom-fill', ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-polygon-outline')) {
        mapRef.current.setFilter('proyectos-geom-polygon-outline', ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-fill')) {
        mapRef.current.setFilter('proyectos-geom-metro-fill', ['==', ['get', 'is_metro'], true]);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-outline')) {
        mapRef.current.setFilter('proyectos-geom-metro-outline', ['==', ['get', 'is_metro'], true]);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', null);
      }
    } else if (hierarchyFilter === 'Zonas Metro') {
      // Enfocar únicamente en la red de 15 estaciones del Metro de Quito
      mapRef.current.setFilter('centralidades-fill', ['==', ['get', 'id'], 'none']);
      mapRef.current.setFilter('centralidades-line', ['==', ['get', 'id'], 'none']);
      mapRef.current.setFilter('centralidades-labels', ['==', ['get', 'id'], 'none']);

      if (mapRef.current.getLayer('proyectos-geom-line-main')) {
        mapRef.current.setFilter('proyectos-geom-line-main', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-line-casing')) {
        mapRef.current.setFilter('proyectos-geom-line-casing', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-fill')) {
        mapRef.current.setFilter('proyectos-geom-fill', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-polygon-outline')) {
        mapRef.current.setFilter('proyectos-geom-polygon-outline', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-fill')) {
        mapRef.current.setFilter('proyectos-geom-metro-fill', ['==', ['get', 'is_metro'], true]);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-outline')) {
        mapRef.current.setFilter('proyectos-geom-metro-outline', ['==', ['get', 'is_metro'], true]);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', ['==', ['get', 'is_metro'], true]);
      }

      // Encuadre completo al eje del Metro
      mapRef.current.fitBounds(
        [[-78.56, -0.32], [-78.46, -0.12]],
        { padding: { top: 70, bottom: 70, left: 70, right: 70 }, pitch: 35, bearing: -8, duration: 1800 }
      );
    } else {
      const f = ['==', ['get', 'jerarquia'], hierarchyFilter];
      mapRef.current.setFilter('centralidades-fill', f);
      mapRef.current.setFilter('centralidades-line', f);
      mapRef.current.setFilter('centralidades-labels', f);

      if (mapRef.current.getLayer('proyectos-geom-line-main')) {
        mapRef.current.setFilter('proyectos-geom-line-main', ['all', ['==', ['get', 'geom_tipo'], 'LineString'], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-line-casing')) {
        mapRef.current.setFilter('proyectos-geom-line-casing', ['all', ['==', ['get', 'geom_tipo'], 'LineString'], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-fill')) {
        mapRef.current.setFilter('proyectos-geom-fill', ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-polygon-outline')) {
        mapRef.current.setFilter('proyectos-geom-polygon-outline', ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-fill')) {
        mapRef.current.setFilter('proyectos-geom-metro-fill', ['all', ['==', ['get', 'is_metro'], true], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-metro-outline')) {
        mapRef.current.setFilter('proyectos-geom-metro-outline', ['all', ['==', ['get', 'is_metro'], true], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]);
      }
    }
  }, [hierarchyFilter]);

  // Actualizar resalte de la centralidad seleccionada
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    mapRef.current.setFilter('centralidades-highlight', ['==', ['get', 'id'], selectedCentralidad.id]);
  }, [selectedCentralidad]);

  // Actualizar resalte para la línea/contorno del proyecto seleccionado
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const currentProj = floatingProject || (selectedCentralidad.proyectos && selectedCentralidad.proyectos[selectedProjectIndex]);
    const targetId = currentProj ? currentProj.id : '';
    
    if (mapRef.current.getLayer('proyectos-geom-selected-glow')) {
      mapRef.current.setFilter('proyectos-geom-selected-glow', ['==', ['get', 'id'], targetId]);
    }
    if (mapRef.current.getLayer('proyectos-geom-selected-core')) {
      mapRef.current.setFilter('proyectos-geom-selected-core', ['==', ['get', 'id'], targetId]);
    }
    if (mapRef.current.getLayer('proyectos-geom-selected-polygon-fill')) {
      mapRef.current.setFilter('proyectos-geom-selected-polygon-fill', ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'id'], targetId]]);
    }
  }, [floatingProject, selectedProjectIndex, selectedCentralidad]);

  const focusCentralidad = (centralidad) => {
    if (!mapRef.current) return;

    if (centralidad.bbox && centralidad.bbox.length === 4) {
      mapRef.current.fitBounds(
        [[centralidad.bbox[0], centralidad.bbox[1]], [centralidad.bbox[2], centralidad.bbox[3]]],
        {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          pitch: 38,
          bearing: -8,
          duration: 1700,
          maxZoom: 15.5
        }
      );
    } else if (centralidad.centroid) {
      mapRef.current.flyTo({
        center: centralidad.centroid,
        zoom: 14.2,
        pitch: 38,
        bearing: -8,
        duration: 1700
      });
    }
  };

  const focusProject = (proj) => {
    if (!mapRef.current || !proj) return;
    const feat = proyectosGeometriasGeoJson.features.find(f => f.properties.id === proj.id);
    if (feat && feat.geometry) {
      let minX = 999, maxX = -999, minY = 999, maxY = -999;
      const coords = feat.geometry.type === 'Polygon' 
        ? feat.geometry.coordinates[0] 
        : feat.geometry.coordinates;
      
      coords.forEach(pt => {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      });

      if (maxX - minX < 0.001 && maxY - minY < 0.001) {
        mapRef.current.flyTo({
          center: [(minX + maxX)/2, (minY + maxY)/2],
          zoom: 15.5,
          pitch: 40,
          bearing: -8,
          duration: 1600
        });
      } else {
        mapRef.current.fitBounds([[minX, minY], [maxX, maxY]], {
          padding: { top: 90, bottom: 90, left: 90, right: 90 },
          pitch: 38,
          bearing: -8,
          duration: 1600,
          maxZoom: 16
        });
      }
    } else if (proj.coordenadas) {
      mapRef.current.flyTo({
        center: proj.coordenadas,
        zoom: 15.2,
        pitch: 40,
        bearing: -8,
        duration: 1600
      });
    }
  };

  const handleSelectCentralidad = (centralidad) => {
    setSelectedCentralidad(centralidad);
    setSelectedProjectIndex(0);
    setActiveProjectTab('info');
    focusCentralidad(centralidad);
  };

  // Filtrado de la lista
  const filteredCentralidades = centralidadesData.filter(c => {
    const matchesHierarchy = hierarchyFilter === 'Todas' || c.jerarquia === hierarchyFilter;
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admin_zonal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.proyectos.some(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesHierarchy && matchesSearch;
  });

  const activeProject = selectedCentralidad.proyectos[selectedProjectIndex] || selectedCentralidad.proyectos[0];
  const currentTheme = HIERARCHY_THEME[selectedCentralidad.jerarquia] || HIERARCHY_THEME['Zonal'];

  return (
    <div className="centralidades-light-dashboard">
      {/* ============================================================== */}
      {/* BARRA LATERAL (SIDEBAR) RE-DISEÑADA: LIGERA, ESPACIOSA Y CLARA */}
      {/* ============================================================== */}
      <aside className="centralidades-sidebar-light">
        {/* 1. Cabecera Ejecutiva Despejada */}
        <div className="sidebar-header-executive">
          <div className="header-badge-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span className="badge-sthv">
              <Compass size={13} />
              <span>STHV • SECRETARÍA DE TERRITORIO Y HÁBITAT</span>
            </span>
            {dbStatus === 'connected' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                <Database size={12} />
                <span>Supabase Conectado ({dbStats?.proyectos || 43} Proyectos)</span>
              </span>
            ) : dbStatus === 'paused' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '3px 8px', borderRadius: '999px', border: '1px solid #fecaca' }}>
                <AlertTriangle size={12} />
                <span>Base de Datos Pausada</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Conectando a Supabase...</span>
            )}
          </div>

          {dbStatus === 'paused' && (
            <div style={{ marginTop: '0.65rem', marginBottom: '0.35rem', padding: '0.6rem 0.8rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.78rem', lineHeight: 1.4 }}>
              ⚠️ <strong>Base de datos pausada o en reconexión:</strong> Reactive el proyecto en Supabase para sincronizar todas las estadísticas oficiales en vivo.
            </div>
          )}

          <h2 className="sidebar-main-title">Centralidades Urbanas</h2>
          <p className="sidebar-subtitle-text">
            Modelo territorial del DMQ (PMDOT / PUGS). Selecciona un sector en el mapa o en el buscador para ver sus proyectos estratégicos.
          </p>

          {/* Filtros de Jerarquía Urbana */}
          <div className="hierarchy-pills-row">
            {['Todas', 'Metropolitana', 'Zonal', 'Sectorial', 'Zonas Metro'].map((jer) => {
              const count = jer === 'Todas' 
                ? centralidadesData.length 
                : centralidadesData.filter(c => c.jerarquia === jer).length;
              return (
                <button
                  key={jer}
                  className={`hierarchy-pill-light ${hierarchyFilter === jer ? 'active' : ''}`}
                  onClick={() => setHierarchyFilter(jer)}
                >
                  <span>{jer === 'Todas' ? 'Todas' : jer}</span>
                  <span className="count-pill">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Buscador y Selector Directo */}
          <div className="toolbar-search-select-grid">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon-light" />
              <input
                type="text"
                placeholder="Buscar centralidad o proyecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-field-light"
              />
            </div>

            <div className="select-dropdown-wrapper">
              <select
                value={selectedCentralidad.id}
                onChange={(e) => {
                  const found = centralidadesData.find(c => c.id === e.target.value);
                  if (found) handleSelectCentralidad(found);
                }}
                className="select-field-light"
              >
                {filteredCentralidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} [{c.jerarquia}]
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="select-arrow-light" />
            </div>
          </div>
        </div>

        {/* 2. Contenedor de Contenido con Desplazamiento Suave */}
        <div className="sidebar-scrollable-body">
          {/* FICHA TERRITORIAL DE LA CENTRALIDAD */}
          <div className="centralidad-card-light">
            <div className="centralidad-card-top">
              <div className="title-and-badge">
                <span 
                  className="hierarchy-badge-light"
                  style={{ 
                    backgroundColor: currentTheme.bg, 
                    color: currentTheme.text,
                    borderColor: currentTheme.border 
                  }}
                >
                  Centralidad {selectedCentralidad.jerarquia}
                </span>
                <h3 className="centralidad-name-heading">{selectedCentralidad.nombre}</h3>
              </div>
            </div>

            {/* Fila de Métricas Clave (Hectáreas y Zonal) */}
            <div className="stats-badges-strip">
              <div className="stat-pill-item">
                <span className="stat-icon">📐</span>
                <span className="stat-text"><strong>{selectedCentralidad.superficie_ha.toFixed(1)}</strong> ha</span>
              </div>
              <div className="stat-pill-item">
                <span className="stat-icon">🏛️</span>
                <span className="stat-text">Zonal <strong>{selectedCentralidad.admin_zonal}</strong></span>
              </div>
            </div>

            <p className="centralidad-narrative">
              {selectedCentralidad.descripcion_territorial}
            </p>

            {/* Equipamientos Urbanos Clave */}
            {selectedCentralidad.equipamientos_clave?.length > 0 && (
              <div className="equipments-container">
                <span className="mini-section-label">Equipamientos en el área:</span>
                <div className="equipments-chips-wrap">
                  {selectedCentralidad.equipamientos_clave.map((eq, i) => (
                    <span key={i} className="equipment-chip-light">{eq}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE PROYECTOS DENTRO DE ESTA CENTRALIDAD */}
          <div className="projects-selection-section">
            <div className="section-title-bar">
              <span className="section-title-text">
                PROYECTOS ESTRATÉGICOS ({selectedCentralidad.proyectos.length})
              </span>
            </div>

            <div className="projects-segmented-list">
              {selectedCentralidad.proyectos.map((proj, pIdx) => {
                const isSelected = selectedProjectIndex === pIdx;
                const bStyle = getBadgeStyle(proj.badge);
                return (
                  <button
                    key={proj.id}
                    className={`project-tab-card ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProjectIndex(pIdx);
                      setActiveProjectTab('info');
                      setFloatingProject(proj);
                      focusProject(proj);
                    }}
                    title="Haz clic para abrir la pantalla flotante con información, seguridad, economía y suelo"
                  >
                    <div className="project-tab-main-info">
                      <div className="title-row">
                        <span className="status-bullet" style={{ backgroundColor: bStyle.bullet }} />
                        <strong className="proj-tab-title">{proj.nombre}</strong>
                      </div>
                      <div className="type-and-cue-row">
                        <span className="proj-tab-type">{proj.tipo}</span>
                        <span className="open-cue-text">
                          <Maximize2 size={11} /> Ver ficha flotante
                        </span>
                      </div>
                    </div>
                    <span 
                      className="proj-tab-badge"
                      style={{
                        backgroundColor: bStyle.bg,
                        borderColor: bStyle.border,
                        color: bStyle.text
                      }}
                    >
                      {proj.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FICHA RESUMEN DEL PROYECTO SELECCIONADO Y ACCESO DIRECTO A LA PANTALLA FLOTANTE */}
          {activeProject && (
            <div className="sidebar-active-project-card">
              <div className="active-proj-header">
                <div className="proj-lead-badge">
                  <Sparkles size={13} />
                  <span>PROYECTO SELECCIONADO</span>
                </div>
                <span 
                  className="proj-tab-badge"
                  style={{
                    backgroundColor: getBadgeStyle(activeProject.badge).bg,
                    borderColor: getBadgeStyle(activeProject.badge).border,
                    color: getBadgeStyle(activeProject.badge).text
                  }}
                >
                  {activeProject.badge}
                </span>
              </div>

              <h4 className="active-proj-name">{activeProject.nombre}</h4>
              <p className="active-proj-summary-snippet">{activeProject.resumen}</p>

              {/* Botón Principal para Abrir la Pantalla Flotante */}
              <button 
                className="btn-trigger-floating-modal"
                onClick={() => {
                  setActiveProjectTab('info');
                  setFloatingProject(activeProject);
                }}
                title="Abrir pantalla flotante con información, seguridad, economía y valor del suelo"
              >
                <Maximize2 size={15} />
                <span>Abrir Pantalla Flotante (4 Dimensiones)</span>
                <ArrowUpRight size={15} />
              </button>

              {/* Botones de Acceso Rápido Directo a Cada Dimensión */}
              <div className="mini-dimensions-grid">
                <button 
                  className="mini-dimension-btn"
                  onClick={() => {
                    setActiveProjectTab('info');
                    setFloatingProject(activeProject);
                  }}
                  title="Ver Información General"
                >
                  <Info size={13} />
                  <span>Información</span>
                </button>
                <button 
                  className="mini-dimension-btn"
                  onClick={() => {
                    setActiveProjectTab('seguridad');
                    setFloatingProject(activeProject);
                  }}
                  title="Ver Seguridad"
                >
                  <Shield size={13} color="#059669" />
                  <span>Seguridad</span>
                </button>
                <button 
                  className="mini-dimension-btn"
                  onClick={() => {
                    setActiveProjectTab('economia');
                    setFloatingProject(activeProject);
                  }}
                  title="Ver Economía"
                >
                  <TrendingUp size={13} color="#2563eb" />
                  <span>Economía</span>
                </button>
                <button 
                  className="mini-dimension-btn"
                  onClick={() => {
                    setActiveProjectTab('suelo');
                    setFloatingProject(activeProject);
                  }}
                  title="Ver Valor del Suelo"
                >
                  <DollarSign size={13} color="#d97706" />
                  <span>Suelo</span>
                </button>
              </div>
            </div>
          )}

          {/* Carrusel Rápido de Todas las Centralidades al Pie */}
          <div className="sidebar-footer-chips">
            <span className="mini-section-label">Explorar otras centralidades:</span>
            <div className="chips-scroll-wrap">
              {filteredCentralidades.map((c) => (
                <button
                  key={c.id}
                  className={`chip-button-light ${selectedCentralidad.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCentralidad(c)}
                >
                  <span>{c.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* CANVAS CARTOGRÁFICO MAPBOX 3D                                  */}
      {/* ============================================================== */}
      <main className="centralidades-map-viewport">
        <div ref={mapContainerRef} className="map-canvas-fill" />

        {/* Selector Flotante de Estilo de Mapa */}
        <div className="floating-map-styles">
          <button 
            className={`map-style-toggle ${mapStyle.includes('streets') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
          >
            Vial
          </button>
          <button 
            className={`map-style-toggle ${mapStyle.includes('satellite') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
          >
            Satélite HD
          </button>
          <button 
            className={`map-style-toggle ${mapStyle.includes('dark') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
          >
            Noche
          </button>
        </div>

        {/* Leyenda Cartográfica Flotante */}
        <div className="floating-hierarchy-legend">
          <span className="legend-head">MODELO TERRITORIAL DMQ</span>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#2563eb' }} />
            <span>Metropolitana (5)</span>
          </div>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#059669' }} />
            <span>Zonal (11)</span>
          </div>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#d97706' }} />
            <span>Sectorial (6)</span>
          </div>
          <div className="legend-divider-light" />
          <div className="legend-row">
            <span className="legend-line-project-yellow" />
            <span>Trazados / Contornos de Proyectos (27)</span>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* PANTALLA FLOTANTE DE DETALLE DEL PROYECTO (4 DIMENSIONES)      */}
      {/* ============================================================== */}
      {floatingProject && (
        <div 
          className="project-floating-backdrop" 
          onClick={() => setFloatingProject(null)}
        >
          <div 
            className="project-floating-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera de la Pantalla Flotante */}
            <div className="floating-modal-header">
              <div className="floating-modal-top-row">
                <div className="floating-modal-badges">
                  <span 
                    className="hierarchy-badge-light"
                    style={{ 
                      backgroundColor: currentTheme.bg, 
                      color: currentTheme.text,
                      borderColor: currentTheme.border 
                    }}
                  >
                    Centralidad {selectedCentralidad.jerarquia}: {selectedCentralidad.nombre}
                  </span>
                  <span 
                    className="proj-tab-badge"
                    style={{
                      backgroundColor: getBadgeStyle(floatingProject.badge).bg,
                      borderColor: getBadgeStyle(floatingProject.badge).border,
                      color: getBadgeStyle(floatingProject.badge).text
                    }}
                  >
                    {floatingProject.badge}
                  </span>
                </div>
                <button 
                  className="floating-modal-close-btn" 
                  onClick={() => setFloatingProject(null)}
                  title="Cerrar pantalla flotante (Esc)"
                  aria-label="Cerrar ventana"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="floating-modal-title">{floatingProject.nombre}</h2>
              <div className="floating-modal-subtitle">
                <MapPin size={15} color="#2563eb" />
                <span>{floatingProject.tipo} • Administración Zonal {selectedCentralidad.admin_zonal}</span>
              </div>
            </div>

            {/* Selector de las 4 Dimensiones en el Modal */}
            <div className="floating-modal-tabs">
              <button
                className={`floating-tab-btn ${activeProjectTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveProjectTab('info')}
              >
                <Info size={16} />
                <span>Información General</span>
              </button>
              <button
                className={`floating-tab-btn ${activeProjectTab === 'seguridad' ? 'active' : ''}`}
                onClick={() => setActiveProjectTab('seguridad')}
              >
                <Shield size={16} />
                <span>Seguridad</span>
              </button>
              <button
                className={`floating-tab-btn ${activeProjectTab === 'economia' ? 'active' : ''}`}
                onClick={() => setActiveProjectTab('economia')}
              >
                <TrendingUp size={16} />
                <span>Economía</span>
              </button>
              <button
                className={`floating-tab-btn ${activeProjectTab === 'suelo' ? 'active' : ''}`}
                onClick={() => setActiveProjectTab('suelo')}
              >
                <DollarSign size={16} />
                <span>Valor del Suelo</span>
              </button>
            </div>

            {/* Contenido Espacioso de la Dimensión Activa */}
            <div className="floating-modal-body">
              {/* 1. INFORMACIÓN GENERAL */}
              {activeProjectTab === 'info' && (
                <div className="floating-tab-pane">
                  <div className="kpi-cards-grid-3">
                    <div className="kpi-item-light">
                      <span className="kpi-lbl-light">Longitud de Intervención</span>
                      <strong className="kpi-val-light">{floatingProject.longitud_km}</strong>
                    </div>
                    <div className="kpi-item-light">
                      <span className="kpi-lbl-light">Presupuesto Referencial</span>
                      <strong className="kpi-val-light">{floatingProject.presupuesto}</strong>
                    </div>
                    <div className="kpi-item-light">
                      <span className="kpi-lbl-light">Fuente de Financiamiento</span>
                      <strong className="kpi-val-light" style={{ fontSize: '0.85rem' }}>
                        {floatingProject.financiamiento}
                      </strong>
                    </div>
                  </div>

                  <div className="floating-narrative-card">
                    <h4 className="card-subhead">Resumen Ejecutivo del Proyecto</h4>
                    <p className="tab-narrative-light">{floatingProject.resumen}</p>
                  </div>

                  {floatingProject.imagen_destacada && (
                    <div 
                      className="photo-card-light floating-photo-card"
                      onClick={() => setModalImage({
                        src: floatingProject.imagen_destacada,
                        title: floatingProject.nombre,
                        description: floatingProject.resumen
                      })}
                      title="Haz clic para ver la fotografía en pantalla completa"
                    >
                      <img src={floatingProject.imagen_destacada} alt={floatingProject.nombre} />
                      <div className="photo-zoom-hint-light">
                        <Maximize2 size={16} />
                        <span>Ver Fotografía en Pantalla Completa</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SEGURIDAD */}
              {activeProjectTab === 'seguridad' && (
                <div className="floating-tab-pane">
                  {!floatingProject.seguridad || floatingProject.seguridad.tiene_datos_oficiales === false || !floatingProject.seguridad.delitos_por_ano ? (
                    <div className="official-disclaimer-box">
                      <div className="disclaimer-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <Shield size={30} />
                      </div>
                      <div className="disclaimer-text-wrap">
                        <div className="disclaimer-header-badge">
                          <span className="badge-official-status">Fase de Diagnóstico Territorial PUGS</span>
                        </div>
                        <h4 className="disclaimer-title">Sin Registro de Evaluación Delictiva Oficial</h4>
                        <p className="disclaimer-p">
                          {floatingProject.seguridad?.mensaje_oficial || 
                           "Este sector corresponde a un Polígono de Centralidad Urbana en etapa de diagnóstico y formulación técnica PUGS. A la fecha, la Secretaría de Seguridad y Gobernabilidad no registra mediciones de impacto delictivo en este polígono."}
                        </p>
                        <div className="disclaimer-meta-note">
                          <span>🏛️ Dirección Metropolitana de Políticas de Seguridad • DMQ</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Banner de Reducción Total de Delitos */}
                      <div className="security-banner-stat">
                        <div className="sec-banner-icon">
                          <Shield size={28} color="#059669" />
                        </div>
                        <div className="sec-banner-content">
                          <span className="sec-banner-label">Evaluación de Impacto en Seguridad y Convivencia</span>
                          <div className="sec-banner-metrics">
                            <strong className="sec-banner-pct">
                              {floatingProject.seguridad.reduccion_delitos_pct !== null && floatingProject.seguridad.reduccion_delitos_pct !== undefined
                                ? `${floatingProject.seguridad.reduccion_delitos_pct > 0 ? '+' : ''}${floatingProject.seguridad.reduccion_delitos_pct}%`
                                : 'Oficial DMQ'}
                            </strong>
                            <span className="sec-banner-sub">
                              {floatingProject.seguridad.reduccion_delitos_pct !== null && floatingProject.seguridad.reduccion_delitos_pct !== undefined
                                ? 'Variación delictiva oficial registrada en el periodo evaluado'
                                : 'Cifra oficial registrada por la Secretaría de Seguridad del DMQ'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Histórico Consolidado de Delitos por Año */}
                      <div className="dimension-subcard">
                        <div className="subcard-header">
                          <span className="card-subhead">Evolución de Delitos Registrados por Año</span>
                          <span className="subhead-tag">Fuente: Reporte de Seguridad DMQ</span>
                        </div>
                        <div className="year-metric-cards-5">
                          {[
                            { key: '2023', label: '2023', sub: 'Delitos Totales' },
                            { key: '2024', label: '2024', sub: 'Delitos Totales' },
                            { key: '2025', label: '2025', sub: 'Delitos Totales' },
                            { key: '2026_real', label: '2026 (Real)', sub: 'Corte Ene-Abr', isReal: true },
                            { key: '2026_proy', label: '2026 (Proy)', sub: 'Proy. Anual', isProy: true }
                          ].map(item => (
                            <div key={item.key} className={`year-stat-box ${item.isProy ? 'projected' : ''} ${item.isReal ? 'real-cut' : ''}`}>
                              <span className="year-stat-tag">{item.label}</span>
                              <strong className="year-stat-num">
                                {floatingProject.seguridad.delitos_por_ano?.[item.key] ?? '—'}
                              </strong>
                              <span className="year-stat-lbl">{item.sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Histórico de Incidentes de Convivencia Ciudadana */}
                      <div className="dimension-subcard">
                        <div className="subcard-header">
                          <span className="card-subhead">Incidentes de Espacio Público y Convivencia</span>
                          <span className="subhead-tag">Libadores, Escándalos y Daño a Propiedad</span>
                        </div>
                        <div className="year-metric-cards-5">
                          {[
                            { key: '2023', label: '2023', sub: 'Incidentes Atendidos' },
                            { key: '2024', label: '2024', sub: 'Incidentes Atendidos' },
                            { key: '2025', label: '2025', sub: 'Incidentes Atendidos' },
                            { key: '2026_real', label: '2026 (Real)', sub: 'Corte Ene-Abr', isReal: true },
                            { key: '2026_proy', label: '2026 (Proy)', sub: 'Proy. Anual', isProy: true }
                          ].map(item => (
                            <div key={item.key} className={`year-stat-box incident-box ${item.isProy ? 'projected' : ''} ${item.isReal ? 'real-cut' : ''}`}>
                              <span className="year-stat-tag">{item.label}</span>
                              <strong className="year-stat-num">
                                {floatingProject.seguridad.incidentes_por_ano?.[item.key] ?? '—'}
                              </strong>
                              <span className="year-stat-lbl">{item.sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desglose de Delitos Principales si existen en el dataset */}
                      {floatingProject.seguridad.top_delitos?.length > 0 && (
                        <div className="dimension-subcard">
                          <div className="subcard-header">
                            <span className="card-subhead">Desglose Comparativo de Delitos por Variable</span>
                            <span className="subhead-tag">Observado Real (Ene-Abr) vs Proyección Anual</span>
                          </div>
                          <div className="table-responsive-clean">
                            <table className="clean-metric-table">
                              <thead>
                                <tr>
                                  <th>Tipo de Delito</th>
                                  <th>2023</th>
                                  <th>2024</th>
                                  <th>2025</th>
                                  <th style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>2026 (Real Ene-Abr)</th>
                                  <th style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>2026 (Proy Anual)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {floatingProject.seguridad.top_delitos.map((td, i) => (
                                  <tr key={i}>
                                    <td><strong>{td.label}</strong></td>
                                    <td>{td.valores?.['2023'] ?? '0'}</td>
                                    <td>{td.valores?.['2024'] ?? '0'}</td>
                                    <td>{td.valores?.['2025'] ?? '0'}</td>
                                    <td>
                                      <span className="table-highlight-real">
                                        {td.valores?.['2026_real'] ?? '0'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="table-highlight-green">
                                        {td.valores?.['2026_proy'] ?? '0'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Desglose de Incidentes si existen en el dataset */}
                      {floatingProject.seguridad.top_incidentes?.length > 0 && (
                        <div className="dimension-subcard">
                          <div className="subcard-header">
                            <span className="card-subhead">Desglose Comparativo de Incidentes por Variable</span>
                            <span className="subhead-tag">Observado Real (Ene-Abr) vs Proyección Anual</span>
                          </div>
                          <div className="table-responsive-clean">
                            <table className="clean-metric-table">
                              <thead>
                                <tr>
                                  <th>Tipo de Incidente</th>
                                  <th>2023</th>
                                  <th>2024</th>
                                  <th>2025</th>
                                  <th style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>2026 (Real Ene-Abr)</th>
                                  <th style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>2026 (Proy Anual)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {floatingProject.seguridad.top_incidentes.map((ti, i) => (
                                  <tr key={i}>
                                    <td><strong>{ti.label}</strong></td>
                                    <td>{ti.valores?.['2023'] ?? '0'}</td>
                                    <td>{ti.valores?.['2024'] ?? '0'}</td>
                                    <td>{ti.valores?.['2025'] ?? '0'}</td>
                                    <td>
                                      <span className="table-highlight-real">
                                        {ti.valores?.['2026_real'] ?? '0'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="table-highlight-blue">
                                        {ti.valores?.['2026_proy'] ?? '0'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="floating-narrative-card">
                        <h4 className="card-subhead">Intervención en Seguridad y Convivencia Ciudadana</h4>
                        <p className="tab-narrative-light">{floatingProject.seguridad.descripcion}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. ECONOMÍA */}
              {activeProjectTab === 'economia' && (
                <div className="floating-tab-pane">
                  {!floatingProject.economia || floatingProject.economia.tiene_datos_oficiales === false || floatingProject.economia.licencias_emitidas === null ? (
                    <div className="official-disclaimer-box">
                      <div className="disclaimer-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <TrendingUp size={30} />
                      </div>
                      <div className="disclaimer-text-wrap">
                        <div className="disclaimer-header-badge">
                          <span className="badge-official-status" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                            Fase de Diagnóstico Territorial PUGS
                          </span>
                        </div>
                        <h4 className="disclaimer-title">Sin Registro Oficial de Cruce LUAE</h4>
                        <p className="disclaimer-p">
                          {floatingProject.economia?.mensaje_oficial || 
                           "Sector en diagnóstico territorial. A la fecha no registra cruce predial de patentes o licencias LUAE en los reportes de obras ejecutadas del DMQ."}
                        </p>
                        <div className="disclaimer-meta-note">
                          <span>🏢 Dirección Metropolitana Tributaria • DMQ</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Balance de Licencias Comerciales LUAE */}
                      <div className="kpi-cards-grid-3">
                        <div className="kpi-item-light">
                          <TrendingUp size={24} color="#2563eb" />
                          <strong className="kpi-val-light" style={{ marginTop: '6px', color: '#2563eb' }}>
                            {floatingProject.economia.licencias_emitidas ?? '—'}
                          </strong>
                          <span className="kpi-lbl-light">Licencias Emitidas (Nuevas)</span>
                        </div>
                        <div className="kpi-item-light">
                          <CheckCircle2 size={24} color="#059669" />
                          <strong className="kpi-val-light" style={{ marginTop: '6px', color: '#059669' }}>
                            {floatingProject.economia.licencias_renovadas ?? '—'}
                          </strong>
                          <span className="kpi-lbl-light">Licencias Renovadas (Continuas)</span>
                        </div>
                        <div className="kpi-item-light">
                          <Building2 size={24} color="#d97706" />
                          <strong className="kpi-val-light" style={{ marginTop: '6px', color: '#d97706' }}>
                            {floatingProject.economia.total_licencias ?? '—'}
                          </strong>
                          <span className="kpi-lbl-light">Total Actividades Económicas</span>
                        </div>
                      </div>

                      <div className="eco-highlight-light">
                        <span className="eco-lbl">Dinamismo y Atracción Comercial</span>
                        <strong className="eco-val">{floatingProject.economia.negocios_activos}</strong>
                        <p className="eco-sub">{floatingProject.economia.atractivo_comercial}</p>
                      </div>

                      {floatingProject.economia.inversiones_privadas?.length > 0 && (
                        <div className="investments-block-light">
                          <span className="mini-section-label">Inversión privada dinamizada en el entorno:</span>
                          {floatingProject.economia.inversiones_privadas.map((inv, idx) => (
                            <div key={idx} className="investment-card-light">
                              <div className="inv-top-row">
                                <strong className="inv-title">{inv.titulo}</strong>
                                <span className="inv-badge">{inv.tipo}</span>
                              </div>
                              <p className="inv-desc">{inv.impacto}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 4. VALOR DEL SUELO */}
              {activeProjectTab === 'suelo' && (
                <div className="floating-tab-pane">
                  {!floatingProject.valor_suelo || floatingProject.valor_suelo.tiene_datos_oficiales === false || floatingProject.valor_suelo.valor_m2 === null ? (
                    <div className="official-disclaimer-box">
                      <div className="disclaimer-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                        <DollarSign size={30} />
                      </div>
                      <div className="disclaimer-text-wrap">
                        <div className="disclaimer-header-badge">
                          <span className="badge-official-status" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                            Fase de Delimitación Catastral
                          </span>
                        </div>
                        <h4 className="disclaimer-title">Sin Código AIVA Asignado Directamente</h4>
                        <p className="disclaimer-p">
                          {floatingProject.valor_suelo?.mensaje_oficial || 
                           "Polígono catastral en proceso de delimitación por la Dirección Metropolitana de Catastro / STHV. No cuenta con serie comparativa en la matriz de proyectos evaluados."}
                        </p>
                        <div className="disclaimer-meta-note">
                          <span>🗺️ Dirección Metropolitana de Catastro • STHV</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Tarjeta de Avalúo Homologado AIVA */}
                      <div className="land-highlight-light">
                        <span className="land-lbl">Avalúo Homologado de Suelo (AIVA)</span>
                        <div className="land-price-row">
                          <strong className="land-val">
                            ${floatingProject.valor_suelo.valor_m2 ? floatingProject.valor_suelo.valor_m2.toFixed(1) : '—'}
                          </strong>
                          <span className="land-unit">USD / m²</span>
                        </div>
                        <span className="land-trend-badge">
                          <TrendingUp size={14} /> {floatingProject.valor_suelo.tendencia}
                        </span>
                      </div>

                      {/* Comparativa Histórica de los Diferentes Años */}
                      <div className="dimension-subcard">
                        <div className="subcard-header">
                          <span className="card-subhead">Evolución Histórica del Valor de Suelo por Periodos</span>
                          <span className="subhead-tag">Normativa Catastral PUGS / STHV</span>
                        </div>
                        <div className="year-metric-cards-3">
                          <div className="year-stat-box soil-box">
                            <span className="year-stat-tag">Periodo 2022 — 2023</span>
                            <strong className="year-stat-num">
                              {floatingProject.valor_suelo.historico_anios?.['2022_2023'] !== undefined
                                ? `$${floatingProject.valor_suelo.historico_anios['2022_2023'].toFixed(1)}`
                                : '—'}
                            </strong>
                            <span className="year-stat-lbl">USD / m² (Base Catastral)</span>
                          </div>
                          <div className="year-stat-box soil-box">
                            <span className="year-stat-tag">Periodo 2024 — 2025</span>
                            <strong className="year-stat-num">
                              {floatingProject.valor_suelo.historico_anios?.['2024_2025'] !== undefined
                                ? `$${floatingProject.valor_suelo.historico_anios['2024_2025'].toFixed(1)}`
                                : '—'}
                            </strong>
                            <span className="year-stat-lbl">USD / m² (Intervención)</span>
                          </div>
                          <div className="year-stat-box soil-box highlighted-soil">
                            <span className="year-stat-tag">Periodo 2026 — 2027</span>
                            <strong className="year-stat-num">
                              {floatingProject.valor_suelo.historico_anios?.['2026_2027'] !== undefined
                                ? `$${floatingProject.valor_suelo.historico_anios['2026_2027'].toFixed(1)}`
                                : '—'}
                            </strong>
                            <span className="year-stat-lbl">USD / m² (Proyectado PUGS)</span>
                          </div>
                        </div>

                        {floatingProject.valor_suelo.plusvalia_porcentaje !== null && floatingProject.valor_suelo.plusvalia_porcentaje !== undefined && (
                          <div className="plusvalia-progress-card">
                            <div className="plusvalia-header">
                              <span>Plusvalía acumulada estimada entre periodos:</span>
                              <strong className={floatingProject.valor_suelo.plusvalia_porcentaje >= 0 ? 'text-green' : 'text-blue'}>
                                {floatingProject.valor_suelo.plusvalia_porcentaje > 0 ? '+' : ''}
                                {floatingProject.valor_suelo.plusvalia_porcentaje}%
                              </strong>
                            </div>
                            <div className="plusvalia-bar-bg">
                              <div 
                                className="plusvalia-bar-fill" 
                                style={{ width: `${Math.min(100, Math.max(15, Math.abs(floatingProject.valor_suelo.plusvalia_porcentaje) * 6))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="detail-row-card-light">
                        <span className="row-label">Zona Homologada AIVA:</span>
                        <strong className="row-value">{floatingProject.valor_suelo.aiva || 'Sin AIVA directa'}</strong>
                      </div>

                      <div className="detail-row-card-light">
                        <span className="row-label">Rango Comercial Estimado:</span>
                        <strong className="row-value">{floatingProject.valor_suelo.rango}</strong>
                      </div>

                      <div className="floating-narrative-card">
                        <h4 className="card-subhead">Plusvalía e Impacto Normativo PUGS</h4>
                        <p className="tab-narrative-light">{floatingProject.valor_suelo.descripcion}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Pie de Acciones del Modal */}
            <div className="floating-modal-footer">
              <button 
                className="modal-action-btn-secondary"
                onClick={() => {
                  focusProject(floatingProject);
                  setFloatingProject(null);
                }}
              >
                <Compass size={16} />
                <span>Centrar en el Mapa</span>
              </button>
              <button 
                className="modal-action-btn-primary"
                onClick={() => setFloatingProject(null)}
              >
                <span>Cerrar Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Lightbox de Ampliación de Fotos */}
      {modalImage && (
        <div className="lightbox-overlay" onClick={() => setModalImage(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setModalImage(null)}>
              <X size={22} />
            </button>
            <div className="lightbox-image-wrapper">
              <img src={modalImage.src} alt={modalImage.title} className="lightbox-image" />
            </div>
            <div className="lightbox-caption">
              <h3 className="lightbox-title">{modalImage.title}</h3>
              {modalImage.description && <p className="lightbox-desc">{modalImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
