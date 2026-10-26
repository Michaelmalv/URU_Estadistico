'use strict';
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Building2, Shield, DollarSign, Info, Sparkles, MapPin, 
  Layers, Search, Compass, CheckCircle2, TrendingUp, Maximize2, 
  X, ChevronRight, Award, Eye, FileText, ArrowUpRight, ChevronDown, Check,
  Database, AlertTriangle, ArrowLeft, Train, TreePine, Zap, BarChart2
} from 'lucide-react';
import centralidadesData from '@/lib/centralidades_data.json';
import centralidadesGeoJson from '@/lib/centralidades.json';
import proyectosGeometriasGeoJson from '@/lib/proyectos_geometrias.json';
import DynamicSeguridadModal from './DynamicSeguridadModal';

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
    color: '#fb923c',
    bg: '#fff7ed',
    border: '#fed7aa',
    text: '#ea580c'
  },
  'Zonal': {
    color: '#fdba74',
    bg: '#fffaf5',
    border: '#ffedd5',
    text: '#ea580c'
  },
  'Sectorial': {
    color: '#fcd34d',
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

const normalizeBadge = (badge) => {
  if (!badge) return 'Ejecutado';
  const b = badge.toString().trim();
  const lower = b.toLowerCase();
  if (lower.includes('inaugur') || lower.includes('operac') || lower.includes('complet') || lower.includes('ejecutad')) {
    return 'Ejecutado';
  }
  return b;
};

const getBadgeStyle = (badge) => {
  const norm = normalizeBadge(badge);
  const b = norm.toLowerCase();
  if (b.includes('ejecutad')) {
    return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', bullet: '#059669' };
  }
  if (b.includes('ejecuc') || b.includes('obra')) {
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', bullet: '#2563eb' };
  }
  return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', bullet: '#d97706' };
};

const getProjectFallbackImage = (proj) => {
  if (!proj) return '/header.jpeg';
  const tipo = (proj.tipo || '').toLowerCase();
  const nombre = (proj.nombre || '').toLowerCase();
  if (tipo.includes('metro') || nombre.includes('metro')) return '/imagenes_categorias/zonas_metro/Zonas metro.jpg';
  if (tipo.includes('sendero') || nombre.includes('sendero')) return '/imagenes_categorias/senderos_seguros/Senderos Seguros.png';
  if (tipo.includes('soterramiento') || nombre.includes('soterramiento')) return '/imagenes_categorias/soterramiento/soterramiento_portada.png';
  if (tipo.includes('bicentenario') || nombre.includes('bicentenario')) return '/imagenes_categorias/repotenciacion_parque_bicentenario/Repotenciación del Bicentenario.png';
  if (tipo.includes('arena del sur') || nombre.includes('arena del sur')) return '/imagenes_categorias/arena_del_sur/Arena del Sur.png';
  if (tipo.includes('quitop') || nombre.includes('quitop')) return '/imagenes_categorias/quitopia/Quitopia.png';
  if (tipo.includes('histórico') || nombre.includes('histórico')) return '/imagenes_categorias/rehabilitacion_espacio_publico/Rehabilitación del Centro Historico.jpg';
  if (nombre.includes('10 de agosto')) return '/imagenes_categorias/recuperacion_urbana_av_10_de_agosto/recuperación_urbana_av10deAgosto.png';
  return '/header.jpeg';
};

const hasProjectSeguridad = (proj) => {
  if (!proj || !proj.seguridad) return false;
  if (proj.seguridad.tiene_datos_oficiales === false) return false;
  if (!proj.seguridad.delitos_por_ano) return false;
  const delitos = proj.seguridad.delitos_por_ano || {};
  const incidentes = proj.seguridad.incidentes_por_ano || {};
  const hasValues = Object.values(delitos).some(v => Number(v) > 0) || Object.values(incidentes).some(v => Number(v) > 0);
  const hasTop = Array.isArray(proj.seguridad.top_delitos) && proj.seguridad.top_delitos.length > 0;
  return hasValues || hasTop;
};

const hasProjectEconomia = (proj) => {
  if (!proj || !proj.economia) return false;
  if (proj.economia.tiene_datos_oficiales === false) return false;
  if (proj.economia.licencias_emitidas === null || proj.economia.licencias_emitidas === undefined) return false;
  return true;
};

const hasProjectSuelo = (proj) => {
  if (!proj || !proj.valor_suelo) return false;
  if (proj.valor_suelo.tiene_datos_oficiales === false) return false;
  if (proj.valor_suelo.valor_m2 === null || proj.valor_suelo.valor_m2 === undefined) return false;
  return true;
};

const getProjectDimensionsCount = (proj) => {
  if (!proj) return 1;
  let count = 1;
  if (hasProjectSeguridad(proj)) count++;
  if (hasProjectEconomia(proj)) count++;
  if (hasProjectSuelo(proj)) count++;
  return count;
};

export default function CentralidadesView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const beaconMarkersRef = useRef([]);
  const blinkIntervalRef = useRef(null);

  // Estados de selección y filtros (null al inicio para mostrar Vista General de Centralidades)
  const [selectedCentralidad, setSelectedCentralidad] = useState(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState('info'); // 'info', 'seguridad', 'economia', 'suelo'
  const [hierarchyFilter, setHierarchyFilter] = useState('Todas'); // 'Todas', 'Metropolitana', 'Zonal', 'Sectorial'
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos' | 'Ejecutado' | 'En Ejecución' | 'Planificado'
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [modalImage, setModalImage] = useState(null);
  const [floatingProject, setFloatingProject] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'paused' | 'checking'
  const [dbStats, setDbStats] = useState(null);

  // Asegurar que si el proyecto flotante no tiene la dimensión activa, vuelva a 'info'
  useEffect(() => {
    if (floatingProject) {
      if (activeProjectTab === 'seguridad' && !hasProjectSeguridad(floatingProject)) {
        setActiveProjectTab('info');
      } else if (activeProjectTab === 'economia' && !hasProjectEconomia(floatingProject)) {
        setActiveProjectTab('info');
      } else if (activeProjectTab === 'suelo' && !hasProjectSuelo(floatingProject)) {
        setActiveProjectTab('info');
      }
    }
  }, [floatingProject, activeProjectTab]);

  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  // Conteos de proyectos según estado de ejecución
  const allProjectsList = centralidadesData.flatMap(c => c.proyectos || []);
  const countTodos = allProjectsList.length;
  const countEjecutado = allProjectsList.filter(p => normalizeBadge(p.badge) === 'Ejecutado').length;
  const countEnEjecucion = allProjectsList.filter(p => normalizeBadge(p.badge) === 'En Ejecución').length;
  const countPlanificado = allProjectsList.filter(p => normalizeBadge(p.badge) === 'Planificado').length;

  const STATUS_OPTIONS = [
    { key: 'Todos', label: 'Todos', count: countTodos, activeClass: 'status-todos', color: '#0f172a' },
    { key: 'Ejecutado', label: 'Ejecutado', count: countEjecutado, activeClass: 'status-ejecutado', color: '#059669', dotClass: 'green' },
    { key: 'En Ejecución', label: 'En Ejecución', count: countEnEjecucion, activeClass: 'status-enejecucion', color: '#2563eb', dotClass: 'blue' },
    { key: 'Planificado', label: 'Planificado', count: countPlanificado, activeClass: 'status-planificado', color: '#d97706', dotClass: 'amber' }
  ];

  // Listado filtrado de proyectos según el estado seleccionado
  const filteredProjectsByStatus = useMemo(() => {
    const list = [];
    centralidadesData.forEach((c) => {
      (c.proyectos || []).forEach((p) => {
        const norm = normalizeBadge(p.badge || p.estado);
        if (statusFilter === 'Todos' || norm === statusFilter) {
          list.push({
            proj: p,
            centralidad: c,
            normBadge: norm
          });
        }
      });
    });
    return list;
  }, [statusFilter]);

  // Si se selecciona En Ejecución o Planificado (pocos proyectos), mostrar desplegado por defecto
  useEffect(() => {
    if (statusFilter === 'En Ejecución' || statusFilter === 'Planificado') {
      setIsProjectListOpen(true);
    } else {
      setIsProjectListOpen(false);
    }
  }, [statusFilter]);

  // Renderizador de cada tarjeta de proyecto dentro del filtro de estado lateral
  const renderStatusProjectItem = (item) => {
    const { proj, centralidad, normBadge } = item;
    const isSelected = floatingProject?.id === proj.id;
    const borderClass = normBadge === 'En Ejecución' 
      ? 'active-border-blue' 
      : normBadge === 'Planificado' 
      ? 'active-border-amber' 
      : 'active-border-green';
    const bStyle = getBadgeStyle(proj.badge);

    return (
      <div
        key={proj.id}
        className={`status-project-card ${borderClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => {
          setSelectedCentralidad(centralidad);
          const pIdx = centralidad.proyectos?.findIndex(x => x.id === proj.id);
          setSelectedProjectIndex(pIdx >= 0 ? pIdx : 0);
          setActiveProjectTab('info');
          setFloatingProject(proj);
          focusProject(proj);
        }}
        title={`Enfocar en mapa y ver 4 dimensiones de ${proj.nombre}`}
      >
        <div className="status-proj-card-top">
          <strong className="status-proj-card-name">
            {['repotenciacion-parque-bicentenario', 'bulevar-tribuna-shyris', 'arena-del-sur-quitumbe', 'parque-navarro-floresta', 'sendero-isla-tortuga'].includes(proj.id) && (
              <span style={{ marginRight: '4px', fontSize: '13px' }}>📍</span>
            )}
            {proj.nombre}
          </strong>
          <span 
            className="status-proj-card-badge"
            style={{
              backgroundColor: bStyle.bg,
              color: bStyle.text,
              border: `1px solid ${bStyle.border}`
            }}
          >
            {normBadge}
          </span>
        </div>
        <div className="status-proj-card-meta">
          <span className="status-proj-card-loc">
            📍 <span>{centralidad.nombre}</span> • <span style={{ opacity: 0.85 }}>{centralidad.jerarquia}</span>
          </span>
          <span className="status-proj-card-cue">
            Ver en mapa ➔
          </span>
        </div>
      </div>
    );
  };

  // Función cartográfica: Encender proyectos del estado seleccionado con parpadeo dinámico y balizas radar
  const applyStatusFilterToMap = (map, filterVal) => {
    if (!map || !map.isStyleLoaded()) return;

    // Detener cualquier animación de parpadeo previa y limpiar balizas
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    beaconMarkersRef.current.forEach(m => m.remove());
    beaconMarkersRef.current = [];

    const isAll = !filterVal || filterVal === 'Todos';

    if (isAll) {
      // ESTADO 'TODOS': Restaurar estética equilibrada estándar
      if (map.getLayer('proyectos-geom-line-main')) {
        map.setPaintProperty('proyectos-geom-line-main', 'line-opacity', 1.0);
        map.setPaintProperty('proyectos-geom-line-main', 'line-width', [
          'interpolate', ['linear'], ['zoom'],
          10, 3.5,
          13, 6,
          16, 9
        ]);
      }
      if (map.getLayer('proyectos-geom-line-casing')) {
        map.setPaintProperty('proyectos-geom-line-casing', 'line-opacity', 0.5);
      }
      if (map.getLayer('proyectos-geom-metro-fill')) {
        map.setPaintProperty('proyectos-geom-metro-fill', 'fill-opacity', 0.38);
      }
      if (map.getLayer('proyectos-geom-metro-outline')) {
        map.setPaintProperty('proyectos-geom-metro-outline', 'line-opacity', 0.95);
        map.setPaintProperty('proyectos-geom-metro-outline', 'line-width', 3);
      }
      if (map.getLayer('proyectos-geom-soterramiento-fill')) {
        map.setPaintProperty('proyectos-geom-soterramiento-fill', 'fill-opacity', 0.45);
      }
      if (map.getLayer('proyectos-geom-soterramiento-outline')) {
        map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-opacity', 0.95);
        map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-width', 3.5);
      }
      if (map.getLayer('proyectos-geom-soterramiento-line')) {
        map.setPaintProperty('proyectos-geom-soterramiento-line', 'line-opacity', 1.0);
      }
      if (map.getLayer('proyectos-geom-fill')) {
        map.setPaintProperty('proyectos-geom-fill', 'fill-opacity', 0.35);
      }
      if (map.getLayer('proyectos-geom-polygon-outline')) {
        map.setPaintProperty('proyectos-geom-polygon-outline', 'line-opacity', 0.95);
        map.setPaintProperty('proyectos-geom-polygon-outline', 'line-width', 4);
      }
      if (map.getLayer('proyectos-geom-point-pulse')) {
        map.setPaintProperty('proyectos-geom-point-pulse', 'circle-opacity', 0.3);
      }
      if (map.getLayer('proyectos-geom-point-core')) {
        map.setPaintProperty('proyectos-geom-point-core', 'circle-opacity', 1.0);
        map.setPaintProperty('proyectos-geom-point-core', 'circle-stroke-opacity', 1.0);
      }
      if (map.getLayer('proyectos-geom-labels')) {
        map.setPaintProperty('proyectos-geom-labels', 'text-opacity', 1.0);
      }

      markersRef.current.forEach(({ el }) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.transform = '';
      });
      return;
    }

    // ESTADO FILTRADO ('Ejecutado', 'En Ejecución', 'Planificado'):
    // 1. Configurar capas atenuadas para los demás (0.08) y resaltadas iniciales para el activo
    const matchFilter = ['==', ['coalesce', ['get', 'badge'], ['get', 'estado'], ''], filterVal];

    if (map.getLayer('proyectos-geom-line-main')) {
      map.setPaintProperty('proyectos-geom-line-main', 'line-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
      map.setPaintProperty('proyectos-geom-line-main', 'line-width', [
        'case', matchFilter,
        ['interpolate', ['linear'], ['zoom'], 10, 7.5, 13, 12, 16, 17],
        ['interpolate', ['linear'], ['zoom'], 10, 2, 13, 3, 16, 4]
      ]);
    }
    if (map.getLayer('proyectos-geom-line-casing')) {
      map.setPaintProperty('proyectos-geom-line-casing', 'line-opacity', [
        'case', matchFilter, 0.95, 0.04
      ]);
    }
    if (map.getLayer('proyectos-geom-metro-fill')) {
      map.setPaintProperty('proyectos-geom-metro-fill', 'fill-opacity', [
        'case', matchFilter, 0.70, 0.05
      ]);
    }
    if (map.getLayer('proyectos-geom-metro-outline')) {
      map.setPaintProperty('proyectos-geom-metro-outline', 'line-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
      map.setPaintProperty('proyectos-geom-metro-outline', 'line-width', [
        'case', matchFilter, 5.5, 1.5
      ]);
    }
    if (map.getLayer('proyectos-geom-soterramiento-fill')) {
      map.setPaintProperty('proyectos-geom-soterramiento-fill', 'fill-opacity', [
        'case', matchFilter, 0.72, 0.05
      ]);
    }
    if (map.getLayer('proyectos-geom-soterramiento-outline')) {
      map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
      map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-width', [
        'case', matchFilter, 5.5, 1.5
      ]);
    }
    if (map.getLayer('proyectos-geom-soterramiento-line')) {
      map.setPaintProperty('proyectos-geom-soterramiento-line', 'line-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
    }
    if (map.getLayer('proyectos-geom-fill')) {
      map.setPaintProperty('proyectos-geom-fill', 'fill-opacity', [
        'case', matchFilter, 0.75, 0.04
      ]);
    }
    if (map.getLayer('proyectos-geom-polygon-outline')) {
      map.setPaintProperty('proyectos-geom-polygon-outline', 'line-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
      map.setPaintProperty('proyectos-geom-polygon-outline', 'line-width', [
        'case', matchFilter, 6.5, 1.5
      ]);
    }
    if (map.getLayer('proyectos-geom-labels')) {
      map.setPaintProperty('proyectos-geom-labels', 'text-opacity', [
        'case', matchFilter, 1.0, 0.08
      ]);
    }

    markersRef.current.forEach(({ el, badge }) => {
      if (!el) return;
      const norm = normalizeBadge(badge);
      if (norm === filterVal) {
        el.style.opacity = '1';
        el.style.filter = 'drop-shadow(0 0 14px rgba(249, 115, 22, 0.95))';
        el.style.transform = 'scale(1.2)';
      } else {
        el.style.opacity = '0.12';
        el.style.filter = 'grayscale(100%)';
        el.style.transform = 'scale(0.85)';
      }
    });

    // 2. PARPADEO RÍTMICO CARTOGRÁFICO (Blinking Animation):
    // Alterna dinámicamente opacidad y grosor de los proyectos activos cada 580ms para que destaquen visiblemente
    let isBlinkPhase = false;
    blinkIntervalRef.current = setInterval(() => {
      if (!map || !map.isStyleLoaded()) return;
      isBlinkPhase = !isBlinkPhase;

      if (map.getLayer('proyectos-geom-line-main')) {
        map.setPaintProperty('proyectos-geom-line-main', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 1.0 : 0.20, 0.08
        ]);
        map.setPaintProperty('proyectos-geom-line-main', 'line-width', [
          'case', matchFilter,
          ['interpolate', ['linear'], ['zoom'], 10, isBlinkPhase ? 8 : 4, 13, isBlinkPhase ? 13 : 6, 16, isBlinkPhase ? 18 : 8],
          ['interpolate', ['linear'], ['zoom'], 10, 2, 13, 3, 16, 4]
        ]);
      }
      if (map.getLayer('proyectos-geom-line-casing')) {
        map.setPaintProperty('proyectos-geom-line-casing', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 0.95 : 0.15, 0.04
        ]);
      }
      if (map.getLayer('proyectos-geom-fill')) {
        map.setPaintProperty('proyectos-geom-fill', 'fill-opacity', [
          'case', matchFilter, isBlinkPhase ? 0.78 : 0.18, 0.04
        ]);
      }
      if (map.getLayer('proyectos-geom-polygon-outline')) {
        map.setPaintProperty('proyectos-geom-polygon-outline', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 1.0 : 0.20, 0.08
        ]);
        map.setPaintProperty('proyectos-geom-polygon-outline', 'line-width', [
          'case', matchFilter, isBlinkPhase ? 7 : 2.5, 1.5
        ]);
      }
      if (map.getLayer('proyectos-geom-metro-fill')) {
        map.setPaintProperty('proyectos-geom-metro-fill', 'fill-opacity', [
          'case', matchFilter, isBlinkPhase ? 0.72 : 0.18, 0.04
        ]);
      }
      if (map.getLayer('proyectos-geom-metro-outline')) {
        map.setPaintProperty('proyectos-geom-metro-outline', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 1.0 : 0.20, 0.08
        ]);
      }
      if (map.getLayer('proyectos-geom-soterramiento-fill')) {
        map.setPaintProperty('proyectos-geom-soterramiento-fill', 'fill-opacity', [
          'case', matchFilter, isBlinkPhase ? 0.75 : 0.18, 0.04
        ]);
      }
      if (map.getLayer('proyectos-geom-soterramiento-outline')) {
        map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 1.0 : 0.20, 0.08
        ]);
        map.setPaintProperty('proyectos-geom-soterramiento-outline', 'line-width', [
          'case', matchFilter, isBlinkPhase ? 6.5 : 2, 1.5
        ]);
      }
      if (map.getLayer('proyectos-geom-soterramiento-line')) {
        map.setPaintProperty('proyectos-geom-soterramiento-line', 'line-opacity', [
          'case', matchFilter, isBlinkPhase ? 1.0 : 0.20, 0.08
        ]);
      }
    }, 580);

    // 3. BALIZAS RADAR PULSANTES CON ETIQUETAS (Para En Ejecución y Planificado)
    if (filterVal === 'En Ejecución' || filterVal === 'Planificado') {
      const beaconClass = filterVal === 'En Ejecución' ? 'beacon-blue' : 'beacon-amber';
      const tagText = filterVal === 'En Ejecución' ? 'EN EJECUCIÓN' : 'PLANIFICADO';

      centralidadesData.forEach((c) => {
        (c.proyectos || []).forEach((p) => {
          if (normalizeBadge(p.badge || p.estado) === filterVal && p.coordenadas) {
            const bEl = document.createElement('div');
            bEl.className = `project-radar-beacon ${beaconClass}`;
            bEl.innerHTML = `
              <div class="beacon-radar-wave"></div>
              <div class="beacon-radar-wave delayed"></div>
              <div class="beacon-core-dot"></div>
              <div class="beacon-floating-label">
                <span class="beacon-tag">${tagText}</span>
                <span>${p.nombre}</span>
              </div>
            `;

            bEl.addEventListener('click', (e) => {
              e.stopPropagation();
              setSelectedCentralidad(c);
              const pIdx = c.proyectos.findIndex(x => x.id === p.id);
              setSelectedProjectIndex(pIdx >= 0 ? pIdx : 0);
              setActiveProjectTab('info');
              setFloatingProject(p);
              focusProject(p);
            });

            const marker = new mapboxgl.Marker({ element: bEl, anchor: 'center' })
              .setLngLat(p.coordenadas)
              .addTo(map);

            beaconMarkersRef.current.push(marker);
          }
        });
      });
    }
  };


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
      center: [-78.4850, -0.1700],
      zoom: 11.2,
      pitch: 28,
      bearing: -8
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
            'Metropolitana', '#fb923c',
            'Zonal', '#fdba74',
            'Sectorial', '#fed7aa',
            '#fdba74'
          ],
          'fill-opacity': 0.28
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
            'Metropolitana', '#f97316',
            'Zonal', '#fb923c',
            'Sectorial', '#f59e0b',
            '#fb923c'
          ],
          'line-width': 2.0,
          'line-opacity': 0.9
        }
      });

      // Capa de Resalte para la Centralidad seleccionada
      map.addLayer({
        id: 'centralidades-highlight',
        type: 'line',
        source: 'centralidades-source',
        paint: {
          'line-color': '#f97316',
          'line-width': 3.8,
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

      // Relleno CAFÉ distintivo para Polígonos de Soterramientos
      map.addLayer({
        id: 'proyectos-geom-soterramiento-fill',
        type: 'fill',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'is_soterramiento'], true]],
        paint: {
          'fill-color': '#78350f',
          'fill-opacity': 0.45
        }
      });

      // Contorno CAFÉ para Polígonos de Soterramientos
      map.addLayer({
        id: 'proyectos-geom-soterramiento-outline',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['==', ['get', 'is_soterramiento'], true]],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#78350f',
          'line-width': 3.5,
          'line-opacity': 0.95
        }
      });

      // Líneas CAFÉ para Soterramientos tipo LineString
      map.addLayer({
        id: 'proyectos-geom-soterramiento-line',
        type: 'line',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'LineString'], ['==', ['get', 'is_soterramiento'], true]],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#78350f',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 3.5,
            13, 6,
            16, 9
          ],
          'line-opacity': 1
        }
      });

      // Relleno suave amarillo para proyectos tipo Polígono convencionales (parques, bulevares zonales)
      map.addLayer({
        id: 'proyectos-geom-fill',
        type: 'fill',
        source: 'proyectos-geometrias-source',
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true], ['!=', ['get', 'is_soterramiento'], true]],
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
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Polygon'], ['!=', ['get', 'is_metro'], true], ['!=', ['get', 'is_soterramiento'], true]],
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
        filter: ['all', ['==', ['get', 'geom_tipo'], 'LineString'], ['!=', ['get', 'is_soterramiento'], true]],
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
        filter: ['all', ['==', ['get', 'geom_tipo'], 'LineString'], ['!=', ['get', 'is_soterramiento'], true]],
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

      // CAPAS CARTOGRÁFICAS PARA PROYECTOS ARQUITECTÓNICOS (PUNTO / FIGURA DE UBICACIÓN)
      map.addLayer({
        id: 'proyectos-geom-point-pulse',
        type: 'circle',
        source: 'proyectos-geometrias-source',
        filter: ['==', ['get', 'geom_tipo'], 'Point'],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 8,
            13, 14,
            16, 22
          ],
          'circle-color': '#fb923c',
          'circle-opacity': 0.3,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#f97316',
          'circle-stroke-opacity': 0.8
        }
      });

      map.addLayer({
        id: 'proyectos-geom-point-core',
        type: 'circle',
        source: 'proyectos-geometrias-source',
        filter: ['==', ['get', 'geom_tipo'], 'Point'],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 5,
            13, 8,
            16, 12
          ],
          'circle-color': '#f97316',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.addLayer({
        id: 'proyectos-geom-selected-point',
        type: 'circle',
        source: 'proyectos-geometrias-source',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 14,
            13, 20,
            16, 28
          ],
          'circle-color': '#fed7aa',
          'circle-opacity': 0.75,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#f97316'
        },
        filter: ['all', ['==', ['get', 'geom_tipo'], 'Point'], ['==', ['get', 'id'], '']]
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
        'proyectos-geom-metro-outline',
        'proyectos-geom-soterramiento-fill',
        'proyectos-geom-soterramiento-outline',
        'proyectos-geom-soterramiento-line',
        'proyectos-geom-point-core',
        'proyectos-geom-point-pulse'
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
                <span style="font-weight: 800; color: #ea580c; text-transform: uppercase; font-size: 11px;">[${jer}]</span>
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

      // Hover en Trazados / Contornos y Puntos de Proyectos Estratégicos
      projectInteractiveLayers.forEach((layerId) => {
        map.on('mousemove', layerId, (e) => {
          centralidadPopup.remove();
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            const p = e.features[0].properties;
            const isMetro = p.is_metro === true || p.is_metro === 'true';
            const isSot = p.is_soterramiento === true || p.is_soterramiento === 'true';
            const isPoint = p.geom_tipo === 'Point';

            projectPopup.setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family: inherit; font-size: 12px; padding: 5px 8px; max-width: 270px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
                    <span style="font-weight: 800; color: ${isMetro ? '#0284c7' : isSot ? '#78350f' : isPoint ? '#c2410c' : '#b45309'}; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.04em;">
                      ${isMetro ? '🚇 POLÍGONO AZUL: ZONA METRO (LÍNEA 1)' : isSot ? '⚡ POLÍGONO CAFÉ: SOTERRAMIENTO DE REDES' : isPoint ? '📍 PROYECTO ARQUITECTÓNICO (PUNTO)' : '━━ TRAZADO DE PROYECTO'}
                    </span>
                    <span style="font-size: 9.5px; background: ${isMetro ? '#e0f2fe' : isSot ? '#fef3c7' : isPoint ? '#fff7ed' : '#fffbeb'}; color: ${isMetro ? '#0369a1' : isSot ? '#78350f' : isPoint ? '#c2410c' : '#b45309'}; padding: 1px 5px; border-radius: 4px; font-weight: 700;">
                      ${normalizeBadge(p.badge || p.estado)}
                    </span>
                  </div>
                  <strong style="display: block; color: #0f172a; font-size: 13px; line-height: 1.3; margin: 3px 0 5px 0;">
                    ${p.nombre}
                  </strong>
                  <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 5px 7px; margin-bottom: 4px; font-size: 11px; color: #9a3412;">
                    📍 <strong>Centralidad:</strong> ${p.centralidad_nombre} 
                    <span style="font-weight: 700;">(${p.centralidad_jerarquia})</span>
                  </div>
                  <div style="font-size: 10px; color: #ea580c; font-weight: 700;">
                    👉 Clic para ver más información
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

        // Clic en Trazado o Punto de Proyecto: abre pantalla flotante y resalta centralidad
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

      // CREACIÓN DE FIGURAS DE UBICACIÓN (PINS ARQUITECTÓNICOS REFERENCIALES)
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      const pointFeatures = proyectosGeometriasGeoJson.features.filter(f => f.geometry.type === 'Point' || f.properties.geom_tipo === 'Point');
      pointFeatures.forEach((f) => {
        const el = document.createElement('div');
        el.className = 'architectural-pin-marker';
        el.setAttribute('data-id', f.properties.id);
        
        const shortName = f.properties.nombre.includes('Navarro') 
          ? 'Plaza Navarro' 
          : f.properties.nombre.includes('QUITOPIA') 
          ? 'QUITOPIA La Y' 
          : f.properties.nombre.includes('Bicentenario')
          ? 'Parque Bicentenario'
          : f.properties.nombre.includes('Shyris')
          ? 'Bulevar Shyris'
          : f.properties.nombre.includes('Arena del Sur')
          ? 'Arena del Sur'
          : f.properties.nombre;

        el.innerHTML = `
          <div class="pin-radar-ring"></div>
          <div class="pin-icon-container">
            <svg width="28" height="36" viewBox="0 0 24 32" fill="none" class="pin-svg-graphic">
              <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="#f97316"/>
              <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12C1.5 19.8 10.8 29.3 12 30.5C13.2 29.3 22.5 19.8 22.5 12C22.5 6.201 17.799 1.5 12 1.5Z" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="11" r="5.5" fill="#ffffff"/>
              <path d="M9 13.5V10L12 8L15 10V13.5H9Z" fill="#fb923c"/>
              <rect x="11" y="11" width="2" height="2.5" fill="#ffffff"/>
            </svg>
            <div class="pin-name-tooltip">📍 ${shortName}</div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const cent = centralidadesData.find(c => c.id === f.properties.centralidad_id);
          if (cent) {
            setSelectedCentralidad(cent);
            const pIdx = cent.proyectos.findIndex(p => p.id === f.properties.id);
            const proj = cent.proyectos[pIdx >= 0 ? pIdx : 0];
            if (proj) {
              setSelectedProjectIndex(pIdx >= 0 ? pIdx : 0);
              setActiveProjectTab('info');
              setFloatingProject(proj);
              focusProject(proj);
            }
          }
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(f.geometry.coordinates)
          .addTo(map);

        markersRef.current.push({ 
          marker, 
          el, 
          jerarquia: f.properties.centralidad_jerarquia, 
          badge: normalizeBadge(f.properties.badge || f.properties.estado) 
        });
      });

      if (selectedCentralidad) {
        focusCentralidad(selectedCentralidad);
      } else {
        fitAllCentralidades();
      }

      // Aplicar filtro de estado cartográfico activo
      applyStatusFilterToMap(map, statusFilter);
    });

    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
      beaconMarkersRef.current.forEach(m => m.remove());
      beaconMarkersRef.current = [];
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
    };
  }, [mapStyle]);

  // Actualizar filtro de jerarquía en el mapa (tanto polígonos de centralidades como líneas y puntos de proyectos)
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
      if (mapRef.current.getLayer('proyectos-geom-point-pulse')) {
        mapRef.current.setFilter('proyectos-geom-point-pulse', ['==', ['get', 'geom_tipo'], 'Point']);
      }
      if (mapRef.current.getLayer('proyectos-geom-point-core')) {
        mapRef.current.setFilter('proyectos-geom-point-core', ['==', ['get', 'geom_tipo'], 'Point']);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', null);
      }

      markersRef.current.forEach(({ marker }) => {
        const el = marker.getElement();
        if (el) el.style.display = 'flex';
      });
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
      if (mapRef.current.getLayer('proyectos-geom-point-pulse')) {
        mapRef.current.setFilter('proyectos-geom-point-pulse', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-point-core')) {
        mapRef.current.setFilter('proyectos-geom-point-core', ['==', ['get', 'id'], 'none']);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', ['==', ['get', 'is_metro'], true]);
      }

      markersRef.current.forEach(({ marker }) => {
        const el = marker.getElement();
        if (el) el.style.display = 'none';
      });

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
      if (mapRef.current.getLayer('proyectos-geom-point-pulse')) {
        mapRef.current.setFilter('proyectos-geom-point-pulse', ['all', ['==', ['get', 'geom_tipo'], 'Point'], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-point-core')) {
        mapRef.current.setFilter('proyectos-geom-point-core', ['all', ['==', ['get', 'geom_tipo'], 'Point'], ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]]);
      }
      if (mapRef.current.getLayer('proyectos-geom-labels')) {
        mapRef.current.setFilter('proyectos-geom-labels', ['==', ['get', 'centralidad_jerarquia'], hierarchyFilter]);
      }

      markersRef.current.forEach(({ marker, jerarquia }) => {
        const el = marker.getElement();
        if (el) el.style.display = (jerarquia === hierarchyFilter) ? 'flex' : 'none';
      });
    }
  }, [hierarchyFilter]);

  // Efecto reactivo: Encender proyectos del estado seleccionado y atenuar los demás en el mapa
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    applyStatusFilterToMap(mapRef.current, statusFilter);
  }, [statusFilter]);

  // Actualizar resalte de la centralidad seleccionada
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    mapRef.current.setFilter('centralidades-highlight', ['==', ['get', 'id'], selectedCentralidad ? selectedCentralidad.id : '']);
  }, [selectedCentralidad]);

  // Actualizar resalte para la línea/contorno o punto del proyecto seleccionado
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const currentProj = floatingProject || (selectedCentralidad?.proyectos && selectedCentralidad.proyectos[selectedProjectIndex]);
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
    if (mapRef.current.getLayer('proyectos-geom-selected-point')) {
      mapRef.current.setFilter('proyectos-geom-selected-point', ['all', ['==', ['get', 'geom_tipo'], 'Point'], ['==', ['get', 'id'], targetId]]);
    }
  }, [floatingProject, selectedProjectIndex, selectedCentralidad]);

  const fitAllCentralidades = () => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(
      [[-78.58, -0.34], [-78.38, 0.01]],
      {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        pitch: 28,
        bearing: -8,
        duration: 1800,
        maxZoom: 12
      }
    );
  };

  const handleResetToOverview = () => {
    setSelectedCentralidad(null);
    setSelectedProjectIndex(0);
    setFloatingProject(null);
    fitAllCentralidades();
  };

  const focusCentralidad = (centralidad) => {
    if (!mapRef.current || !centralidad) return;

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
      if (feat.geometry.type === 'Point') {
        mapRef.current.flyTo({
          center: feat.geometry.coordinates,
          zoom: 16.5,
          pitch: 42,
          bearing: -8,
          duration: 1600
        });
        return;
      }

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

  const activeProject = selectedCentralidad 
    ? (selectedCentralidad.proyectos[selectedProjectIndex] || selectedCentralidad.proyectos[0])
    : null;
  const currentTheme = selectedCentralidad 
    ? (HIERARCHY_THEME[selectedCentralidad.jerarquia] || HIERARCHY_THEME['Zonal'])
    : HIERARCHY_THEME['Zonal'];

  const modalCentralidad = selectedCentralidad || (floatingProject ? centralidadesData.find(c => c.proyectos.some(p => p.id === floatingProject.id)) : null) || { jerarquia: 'DMQ', nombre: 'Distrito Metropolitano', admin_zonal: 'DMQ' };
  const modalTheme = HIERARCHY_THEME[modalCentralidad.jerarquia] || HIERARCHY_THEME['Zonal'];

  return (
    <div className="centralidades-light-dashboard">
      {/* ============================================================== */}
      {/* BARRA LATERAL (SIDEBAR) RE-DISEÑADA: LIGERA, ESPACIOSA Y CLARA */}
      {/* ============================================================== */}
      <aside className="centralidades-sidebar-light">
        {/* 1. Cabecera Ejecutiva Compacta y Moderna */}
        <div className="sidebar-header-executive">
          {/* Fila Superior: Título + Badge de Modelo + Estado Supabase */}
          <div className="sidebar-header-top-row">
            <div className="sidebar-brand-group">
              <h2 className="sidebar-main-title">Centralidades Urbanas</h2>
              <span className="badge-sthv-compact">
                <Compass size={11} />
                <span>PMDOT • PUGS</span>
              </span>
            </div>

            {dbStatus === 'connected' ? (
              <span className="db-status-pill-compact" title={`Supabase Conectado (${dbStats?.proyectos || 43} Proyectos)`}>
                <span className="db-status-dot online" />
                <span>{dbStats?.proyectos || 43} Proy.</span>
              </span>
            ) : dbStatus === 'paused' ? (
              <span className="db-status-pill-compact paused" title="Base de Datos Pausada">
                <AlertTriangle size={11} />
                <span>Pausada</span>
              </span>
            ) : (
              <span className="db-status-pill-compact connecting">
                <span>Conectando...</span>
              </span>
            )}
          </div>

          {dbStatus === 'paused' && (
            <div className="db-paused-alert-compact">
              ⚠️ <strong>Base de datos pausada:</strong> Reactive el proyecto en Supabase para sincronizar estadísticas en vivo.
            </div>
          )}

          {/* Fila 2: Buscador y Selector Directo en 2 columnas paralelas */}
          <div className="toolbar-search-select-grid">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon-light" />
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
                value={selectedCentralidad ? selectedCentralidad.id : ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleResetToOverview();
                  } else {
                    const found = centralidadesData.find(c => c.id === e.target.value);
                    if (found) handleSelectCentralidad(found);
                  }
                }}
                className="select-field-light"
              >
                <option value="">🗺️ Todas las Centralidades</option>
                {filteredCentralidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} [{c.jerarquia}]
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-arrow-light" />
            </div>
          </div>

          {/* Fila 3: Filtros Compactos (Jerarquía y Estado) */}
          <div className="compact-filters-container">
            {/* Filtros de Jerarquía */}
            <div className="compact-filter-strip">
              <span className="compact-filter-tag">Jerarquía:</span>
              <div className="compact-filter-pills-row">
                {['Todas', 'Metropolitana', 'Zonal', 'Sectorial', 'Zonas Metro'].map((jer) => {
                  const count = jer === 'Todas' 
                    ? centralidadesData.length 
                    : centralidadesData.filter(c => c.jerarquia === jer).length;
                  return (
                    <button
                      key={jer}
                      type="button"
                      className={`compact-pill-btn ${hierarchyFilter === jer ? 'active-hierarchy' : ''}`}
                      onClick={() => setHierarchyFilter(jer)}
                      title={`Jerarquía: ${jer}`}
                    >
                      <span>{jer === 'Zonas Metro' ? 'Metro' : jer}</span>
                      <span className="compact-pill-badge">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtros de Estado */}
            <div className="compact-filter-strip">
              <span className="compact-filter-tag">Estado:</span>
              <div className="compact-filter-pills-row">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = statusFilter === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`compact-pill-btn ${isActive ? `active-status ${opt.activeClass}` : ''}`}
                      onClick={() => setStatusFilter(prev => prev === opt.key ? 'Todos' : opt.key)}
                      title={`Estado: ${opt.label} (${opt.count})`}
                    >
                      {opt.color && (
                        <span 
                          className="compact-status-dot" 
                          style={{ backgroundColor: isActive ? '#ffffff' : opt.color }} 
                        />
                      )}
                      <span>{opt.label}</span>
                      <span className="compact-pill-badge">{opt.count}</span>
                    </button>
                  );
                })}
                {statusFilter !== 'Todos' && (
                  <button 
                    type="button"
                    className="compact-reset-btn"
                    onClick={() => setStatusFilter('Todos')}
                    title="Restablecer filtro a Todos"
                  >
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Contenedor de Contenido con Desplazamiento Suave y Máximo Espacio */}
        <div className="sidebar-scrollable-body">
          {/* Si hay un filtro de estado activo (distinto de Todos), mostrar panel en el cuerpo scrollable con amplio espacio */}
          {statusFilter !== 'Todos' && (
            <div className="status-filtered-body-panel">
              <div className="status-filtered-body-header">
                <div className="status-filtered-title-group">
                  <span 
                    className="status-pill-dot" 
                    style={{ 
                      backgroundColor: statusFilter === 'En Ejecución' ? '#2563eb' : statusFilter === 'Planificado' ? '#d97706' : '#059669',
                      width: '8px',
                      height: '8px'
                    }} 
                  />
                  <strong>Proyectos con Estado: {statusFilter}</strong>
                  <span className={`status-dropdown-badge ${statusFilter === 'Ejecutado' ? 'green' : statusFilter === 'En Ejecución' ? 'blue' : 'amber'}`}>
                    {filteredProjectsByStatus.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="status-filtered-clear-btn"
                  onClick={() => setStatusFilter('Todos')}
                  title="Restablecer a Todos"
                >
                  ✕ Quitar Filtro
                </button>
              </div>
              <p className="status-filtered-help-text">
                📍 Resaltados con balizas activas en el mapa 3D. Haz clic en un proyecto para enfocarlo:
              </p>
              <div className="status-filtered-cards-grid">
                {filteredProjectsByStatus.map(renderStatusProjectItem)}
              </div>
            </div>
          )}
          {!selectedCentralidad ? (
            /* ============================================================== */
            /* RESUMEN EJECUTIVO GENERAL CUANDO RECIÉN SE INGRESA             */
            /* ============================================================== */
            <div className="overview-summary-container">
              {/* Tarjeta Hero Panorámica */}
              <div className="overview-hero-card">
                <div className="overview-hero-header">
                  <div className="overview-hero-icon-box">
                    <Compass size={24} />
                  </div>
                  <div className="overview-hero-text">
                    <span className="overview-hero-pill">PMDOT / PUGS • DMQ</span>
                    <h3 className="overview-hero-title">Modelo Territorial DMQ</h3>
                  </div>
                </div>
                <p className="overview-hero-desc">
                  Estructura policéntrica del Distrito Metropolitano de Quito con <strong>22 centralidades urbanas</strong> y la <strong>Red Estratégica Metro</strong>. Conectando proximidad, espacio público, seguridad integral y reactivación económica.
                </p>
              </div>

              {/* Matriz de Indicadores Clave (KPIs) */}
              <div className="overview-kpi-grid">
                <div className="overview-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Building2 size={20} />
                  </div>
                  <div className="kpi-data-wrap">
                    <span className="kpi-main-number">23</span>
                    <span className="kpi-main-lbl">Centralidades</span>
                    <span className="kpi-sub-breakdown">5 Metrop. • 11 Zonales • 6 Sect.</span>
                  </div>
                </div>

                <div className="overview-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <Sparkles size={20} />
                  </div>
                  <div className="kpi-data-wrap">
                    <span className="kpi-main-number">
                      {centralidadesData.reduce((acc, c) => acc + (c.proyectos?.length || 0), 0)}
                    </span>
                    <span className="kpi-main-lbl">Proyectos Estratégicos</span>
                    <span className="kpi-sub-breakdown">Senderos, Metro, Bulevares</span>
                  </div>
                </div>

                <div className="overview-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Layers size={20} />
                  </div>
                  <div className="kpi-data-wrap">
                    <span className="kpi-main-number">~3.984</span>
                    <span className="kpi-main-lbl">Hectáreas Totales</span>
                    <span className="kpi-sub-breakdown">Área Urbana Consolidada</span>
                  </div>
                </div>

                <div className="overview-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div className="kpi-data-wrap">
                    <span className="kpi-main-number">4</span>
                    <span className="kpi-main-lbl">Dimensiones Clave</span>
                    <span className="kpi-sub-breakdown">Info • Seguridad • Eco • Suelo</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Ejes de Intervención */}
              <div className="overview-interventions-card">
                <span className="overview-section-label">Ejes de Desarrollo Urbano</span>
                <div className="overview-interventions-pills">
                  <div className="intervention-pill-item blue">
                    <span className="int-title">🚇 Movilidad y Metro</span>
                    <span className="int-desc">Línea 1 y zonas de influencia directa a 15 estaciones.</span>
                  </div>
                  <div className="intervention-pill-item emerald">
                    <span className="int-title">🛡️ Seguridad Integral</span>
                    <span className="int-desc">Senderos seguros iluminados y cámaras conectadas.</span>
                  </div>
                  <div className="intervention-pill-item green">
                    <span className="int-title">🌳 Espacio Público</span>
                    <span className="int-desc">Parques zonales, bulevares y pacificación vial.</span>
                  </div>
                  <div className="intervention-pill-item amber">
                    <span className="int-title">📈 Suelo y Plusvalía</span>
                    <span className="int-desc">Monitoreo de valor AIVA e incentivos de inversión.</span>
                  </div>
                </div>
              </div>

              {/* Directorio General de Centralidades y sus Proyectos Respectivos */}
              <div className="overview-directory-section">
                <div className="directory-header-row">
                  <span className="directory-header-title">
                    Directorio de Centralidades ({filteredCentralidades.length})
                  </span>
                  <span className="directory-hint">
                    Haz clic en <strong>Ver Detalle</strong> o en cualquier proyecto para enfocarlo en el mapa 3D:
                  </span>
                </div>

                <div className="overview-centralidades-list">
                  {filteredCentralidades.map((c) => {
                    const theme = HIERARCHY_THEME[c.jerarquia] || HIERARCHY_THEME['Zonal'];
                    return (
                      <div key={c.id} className="overview-centralidad-card">
                        <div className="card-top-header">
                          <div className="card-top-left">
                            <span 
                              className="overview-badge"
                              style={{
                                backgroundColor: theme.bg,
                                color: theme.text,
                                borderColor: theme.border
                              }}
                            >
                              {c.jerarquia}
                            </span>
                            <h4 className="overview-c-name">{c.nombre}</h4>
                            <span className="overview-c-sub">
                              📐 {c.superficie_ha.toFixed(1)} ha • 🏛️ {c.admin_zonal}
                            </span>
                          </div>
                          <button
                            className="overview-explore-btn"
                            onClick={() => handleSelectCentralidad(c)}
                            title={`Explorar centralidad ${c.nombre}`}
                          >
                            <span>Ver Detalle</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </div>

                        <p className="overview-c-desc">{c.descripcion_territorial}</p>

                        {c.proyectos && c.proyectos.length > 0 && (
                          <div className="overview-projects-block">
                            <span className="overview-projects-tag">
                              Proyectos Estratégicos ({c.proyectos.length}):
                            </span>
                            <div className="overview-projects-chips">
                              {c.proyectos.map((proj, pIdx) => {
                                const bStyle = getBadgeStyle(proj.badge);
                                const normBadge = normalizeBadge(proj.badge);
                                const isStatusMatch = statusFilter === 'Todos' || normBadge === statusFilter;
                                return (
                                  <div
                                    key={proj.id}
                                    className="overview-project-chip"
                                    style={{
                                      opacity: isStatusMatch ? 1 : 0.35,
                                      filter: isStatusMatch ? 'none' : 'grayscale(60%)',
                                      transition: 'all 0.25s ease'
                                    }}
                                    onClick={() => {
                                      setSelectedCentralidad(c);
                                      setSelectedProjectIndex(pIdx);
                                      setActiveProjectTab('info');
                                      setFloatingProject(proj);
                                      focusProject(proj);
                                    }}
                                    title={`Abrir ficha flotante de ${proj.nombre}`}
                                  >
                                    {proj.id === 'repotenciacion-parque-bicentenario' ? (
                                      <span style={{ fontSize: '13px', lineHeight: 1, marginRight: '3px' }}>📍</span>
                                    ) : (
                                      <span 
                                        className="chip-proj-dot" 
                                        style={{ backgroundColor: bStyle.bullet }} 
                                      />
                                    )}
                                    <span className="chip-proj-name">{proj.nombre}</span>
                                    <span 
                                      className="chip-badge"
                                      style={{
                                        backgroundColor: bStyle.bg,
                                        borderColor: bStyle.border,
                                        color: bStyle.text
                                      }}
                                    >
                                      {normalizeBadge(proj.badge)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* DETALLE DE LA CENTRALIDAD SELECCIONADA                         */
            /* ============================================================== */
            <>
              {/* Botón para volver al Resumen General */}
              <button 
                className="back-to-overview-btn"
                onClick={handleResetToOverview}
                title="Volver al resumen general de todas las centralidades"
              >
                <ArrowLeft size={16} />
                <span>← Volver al Resumen General (Todas las Centralidades)</span>
              </button>

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
                    const normBadge = normalizeBadge(proj.badge);
                    const isStatusMatch = statusFilter === 'Todos' || normBadge === statusFilter;
                    return (
                      <button
                        key={proj.id}
                        className={`project-tab-card ${isSelected ? 'active' : ''}`}
                        style={{
                          opacity: isStatusMatch ? 1 : 0.4,
                          filter: isStatusMatch ? 'none' : 'grayscale(50%)',
                          transition: 'all 0.25s ease'
                        }}
                        onClick={() => {
                          setSelectedProjectIndex(pIdx);
                          setActiveProjectTab('info');
                          setFloatingProject(proj);
                          focusProject(proj);
                        }}
                        title="Haz clic para ver más información (detalles, seguridad, economía y suelo)"
                      >
                        <div className="project-tab-main-info">
                          <div className="title-row">
                            {['repotenciacion-parque-bicentenario', 'bulevar-tribuna-shyris', 'arena-del-sur-quitumbe', 'parque-navarro-floresta', 'sendero-isla-tortuga'].includes(proj.id) ? (
                              <span className="location-pin-emoji" style={{ fontSize: '15px', marginRight: '4px', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} title="Proyecto con ubicación geográfica puntual">📍</span>
                            ) : (
                              <span className="status-bullet" style={{ backgroundColor: bStyle.bullet }} />
                            )}
                            <strong className="proj-tab-title">{proj.nombre}</strong>
                          </div>
                          <div className="type-and-cue-row">
                            <span className="proj-tab-type">{proj.tipo}</span>
                            <span className="open-cue-text">
                              <Maximize2 size={11} /> Ver más información
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
                          {normalizeBadge(proj.badge)}
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
                      {normalizeBadge(activeProject.badge)}
                    </span>
                  </div>

                  <h4 className="active-proj-name">
                    {activeProject.id === 'repotenciacion-parque-bicentenario' && (
                      <span style={{ marginRight: '5px' }}>📍</span>
                    )}
                    {activeProject.nombre}
                  </h4>
                  <p className="active-proj-summary-snippet">{activeProject.resumen}</p>

                  {/* Botón Principal para Ver Más Información */}
                  <button 
                    className="btn-trigger-floating-modal"
                    onClick={() => {
                      setActiveProjectTab('info');
                      setFloatingProject(activeProject);
                    }}
                    title="Ver más información del proyecto"
                  >
                    <Maximize2 size={15} />
                    <span>Ver más información</span>
                    <ArrowUpRight size={15} />
                  </button>

                  {/* Botones de Acceso Rápido Directo a Cada Dimensión que exista */}
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
                    {hasProjectSeguridad(activeProject) && (
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
                    )}
                    {hasProjectEconomia(activeProject) && (
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
                    )}
                    {hasProjectSuelo(activeProject) && (
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
                    )}
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
                      className={`chip-button-light ${selectedCentralidad?.id === c.id ? 'active' : ''}`}
                      onClick={() => handleSelectCentralidad(c)}
                    >
                      <span>{c.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
          <span className="legend-head">PROYECTOS ESTRATÉGICOS</span>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#fb923c' }} />
            <span>Metropolitana (5)</span>
          </div>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#fdba74' }} />
            <span>Zonal (11)</span>
          </div>
          <div className="legend-row">
            <span className="legend-circle" style={{ backgroundColor: '#fed7aa' }} />
            <span>Sectorial (6)</span>
          </div>
          <div className="legend-divider-light" />
          <div className="legend-row">
            <span className="legend-polygon-metro-blue" />
            <span>Color Azul: Zonas Metro (15)</span>
          </div>
          <div className="legend-row">
            <span className="legend-polygon-soterramiento-brown" />
            <span>Color Café: Soterramientos ({proyectosGeometriasGeoJson.features.filter(f => f.properties?.is_soterramiento).length})</span>
          </div>
          <div className="legend-row">
            <span className="legend-line-project-yellow" />
            <span>Trazados / Contornos ({proyectosGeometriasGeoJson.features.filter(f => f.geometry?.type !== 'Point' && !f.properties?.is_metro && !f.properties?.is_soterramiento).length})</span>
          </div>
          <div className="legend-row" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '20px', flexShrink: 0 }}>
              <svg width="16" height="20" viewBox="0 0 24 32" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(249, 115, 22, 0.4))' }}>
                <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="#f97316"/>
                <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12C1.5 19.8 10.8 29.3 12 30.5C13.2 29.3 22.5 19.8 22.5 12C22.5 6.201 17.799 1.5 12 1.5Z" stroke="#ffffff" stroke-width="2"/>
                <circle cx="12" cy="11" r="5.5" fill="#ffffff"/>
                <path d="M9 13.5V10L12 8L15 10V13.5H9Z" fill="#fb923c"/>
                <rect x="11" y="11" width="2" height="2.5" fill="#ffffff"/>
              </svg>
            </span>
            <span>Puntos y Equipamientos</span>
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
                      backgroundColor: modalTheme.bg, 
                      color: modalTheme.text,
                      borderColor: modalTheme.border 
                    }}
                  >
                    Centralidad {modalCentralidad.jerarquia}: {modalCentralidad.nombre}
                  </span>
                  <span 
                    className="proj-tab-badge"
                    style={{
                      backgroundColor: getBadgeStyle(floatingProject.badge).bg,
                      borderColor: getBadgeStyle(floatingProject.badge).border,
                      color: getBadgeStyle(floatingProject.badge).text
                    }}
                  >
                    {normalizeBadge(floatingProject.badge)}
                  </span>
                </div>
                <button 
                  className="floating-modal-close-btn" 
                  onClick={() => setFloatingProject(null)}
                  title="Cerrar ventana (Esc)"
                  aria-label="Cerrar ventana"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="floating-modal-title">
                {floatingProject.id === 'repotenciacion-parque-bicentenario' && (
                  <span style={{ marginRight: '6px' }}>📍</span>
                )}
                {floatingProject.nombre}
              </h2>
              <div className="floating-modal-subtitle">
                <MapPin size={15} color="#ea580c" />
                <span>{floatingProject.tipo} • Administración Zonal {modalCentralidad.admin_zonal}</span>
              </div>
            </div>

            {/* Selector de Dimensiones en el Modal */}
            <div className="floating-modal-tabs">
              <button
                className={`floating-tab-btn ${activeProjectTab === 'info' ? 'active tab-info' : ''}`}
                onClick={() => setActiveProjectTab('info')}
              >
                <Info size={16} />
                <span>Información General</span>
              </button>
              {hasProjectSeguridad(floatingProject) && (
                <button
                  className={`floating-tab-btn ${activeProjectTab === 'seguridad' ? 'active tab-seguridad' : ''}`}
                  onClick={() => setActiveProjectTab('seguridad')}
                >
                  <Shield size={16} />
                  <span>Seguridad</span>
                </button>
              )}
              {hasProjectEconomia(floatingProject) && (
                <button
                  className={`floating-tab-btn ${activeProjectTab === 'economia' ? 'active tab-economia' : ''}`}
                  onClick={() => setActiveProjectTab('economia')}
                >
                  <TrendingUp size={16} />
                  <span>Economía</span>
                </button>
              )}
              {hasProjectSuelo(floatingProject) && (
                <button
                  className={`floating-tab-btn ${activeProjectTab === 'suelo' ? 'active tab-suelo' : ''}`}
                  onClick={() => setActiveProjectTab('suelo')}
                >
                  <DollarSign size={16} />
                  <span>Valor del Suelo</span>
                </button>
              )}
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

                  <div 
                    className="photo-card-light floating-photo-card"
                    onClick={() => setModalImage({
                      src: floatingProject.imagen_destacada || getProjectFallbackImage(floatingProject),
                      title: floatingProject.nombre,
                      description: floatingProject.resumen
                    })}
                    title="Haz clic para ver la fotografía en pantalla completa"
                  >
                    <img 
                      src={floatingProject.imagen_destacada || getProjectFallbackImage(floatingProject)} 
                      alt={floatingProject.nombre}
                      onError={(e) => {
                        const fallback = getProjectFallbackImage(floatingProject);
                        if (e.target.src !== fallback) {
                          e.target.src = fallback;
                        }
                      }}
                    />
                    <div className="photo-zoom-hint-light">
                      <Maximize2 size={16} />
                      <span>Ver Fotografía en Pantalla Completa</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SEGURIDAD DINÁMICA CON ANIMACIONES Y GRÁFICOS */}
              {activeProjectTab === 'seguridad' && (
                <div className="floating-tab-pane">
                  <DynamicSeguridadModal 
                    seguridad={floatingProject.seguridad} 
                    proyectoNombre={floatingProject.nombre} 
                  />
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
