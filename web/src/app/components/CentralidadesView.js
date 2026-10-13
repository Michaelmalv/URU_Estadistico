'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Building2, Shield, DollarSign, Info, Sparkles, MapPin, 
  Layers, Search, Compass, CheckCircle2, TrendingUp, Maximize2, 
  X, ChevronRight, Award, Eye, FileText, ArrowUpRight
} from 'lucide-react';
import centralidadesData from '@/lib/centralidades_data.json';
import centralidadesGeoJson from '@/lib/centralidades.json';
import AntesDespuesView from './AntesDespuesView';
import GaleriaProyectoView from './GaleriaProyectoView';

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

const HIERARCHY_COLORS = {
  'Metropolitana': {
    fill: '#2563eb',
    stroke: '#60a5fa',
    badgeBg: 'rgba(37, 99, 235, 0.2)',
    badgeText: '#60a5fa'
  },
  'Zonal': {
    fill: '#059669',
    stroke: '#34d399',
    badgeBg: 'rgba(5, 150, 105, 0.2)',
    badgeText: '#34d399'
  },
  'Sectorial': {
    fill: '#d97706',
    stroke: '#fbbf24',
    badgeBg: 'rgba(217, 119, 6, 0.2)',
    badgeText: '#fbbf24'
  }
};

export default function CentralidadesView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Estados de selección y filtros
  const [selectedCentralidad, setSelectedCentralidad] = useState(centralidadesData.find(c => c.id === 'mariscal') || centralidadesData[0]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState('info'); // 'info', 'seguridad', 'economia', 'suelo'
  const [hierarchyFilter, setHierarchyFilter] = useState('Todas'); // 'Todas', 'Metropolitana', 'Zonal', 'Sectorial'
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [modalImage, setModalImage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = getFallbackToken();

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-78.4900, -0.1950], // Panorámica de Quito
      zoom: 11.5,
      pitch: 35,
      bearing: -10
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      // Agregar fuente GeoJSON de las 22 Centralidades
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
            '#3b82f6'
          ],
          'fill-opacity': 0.35
        }
      });

      // Capa de Línea / Contorno
      map.addLayer({
        id: 'centralidades-line',
        type: 'line',
        source: 'centralidades-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'jerarquia'],
            'Metropolitana', '#60a5fa',
            'Zonal', '#34d399',
            'Sectorial', '#fbbf24',
            '#ffffff'
          ],
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      // Capa de Resalte para la seleccionada
      map.addLayer({
        id: 'centralidades-highlight',
        type: 'line',
        source: 'centralidades-source',
        paint: {
          'line-color': '#ffffff',
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
          'text-color': '#ffffff',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2
        }
      });

      // Interacción Hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'centralidad-hover-popup'
      });

      map.on('mousemove', 'centralidades-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          const feat = e.features[0];
          const name = feat.properties.nombre;
          const jer = feat.properties.jerarquia;
          const sup = parseFloat(feat.properties.superficie_ha).toFixed(1);

          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: inherit; font-size: 12px; padding: 4px;">
                <span style="font-weight: 800; color: #60a5fa; text-transform: uppercase;">[${jer}]</span>
                <strong style="display: block; color: #ffffff; font-size: 13px;">${name}</strong>
                <span style="color: #94a3b8;">${sup} hectáreas</span>
              </div>
            `)
            .addTo(map);
        }
      });

      map.on('mouseleave', 'centralidades-fill', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Interacción Clic en un polígono
      map.on('click', 'centralidades-fill', (e) => {
        if (e.features.length > 0) {
          const clickedId = e.features[0].properties.id;
          const found = centralidadesData.find(c => c.id === clickedId);
          if (found) {
            handleSelectCentralidad(found);
          }
        }
      });

      // Enfocar la centralidad inicial
      if (selectedCentralidad) {
        focusCentralidad(selectedCentralidad);
      }
    });

    return () => {
      map.remove();
    };
  }, [mapStyle]);

  // Actualizar filtro de jerarquía en el mapa
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    if (hierarchyFilter === 'Todas') {
      mapRef.current.setFilter('centralidades-fill', null);
      mapRef.current.setFilter('centralidades-line', null);
      mapRef.current.setFilter('centralidades-labels', null);
    } else {
      const f = ['==', ['get', 'jerarquia'], hierarchyFilter];
      mapRef.current.setFilter('centralidades-fill', f);
      mapRef.current.setFilter('centralidades-line', f);
      mapRef.current.setFilter('centralidades-labels', f);
    }
  }, [hierarchyFilter]);

  // Actualizar resalte cuando cambia la centralidad seleccionada
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    mapRef.current.setFilter('centralidades-highlight', ['==', ['get', 'id'], selectedCentralidad.id]);
  }, [selectedCentralidad]);

  const focusCentralidad = (centralidad) => {
    if (!mapRef.current) return;

    if (centralidad.bbox && centralidad.bbox.length === 4) {
      mapRef.current.fitBounds(
        [[centralidad.bbox[0], centralidad.bbox[1]], [centralidad.bbox[2], centralidad.bbox[3]]],
        {
          padding: { top: 70, bottom: 70, left: 70, right: 460 },
          pitch: 40,
          bearing: -10,
          duration: 1800,
          maxZoom: 15.5
        }
      );
    } else if (centralidad.centroid) {
      mapRef.current.flyTo({
        center: centralidad.centroid,
        zoom: 14.2,
        pitch: 40,
        bearing: -10,
        duration: 1800
      });
    }
  };

  const handleSelectCentralidad = (centralidad) => {
    setSelectedCentralidad(centralidad);
    setSelectedProjectIndex(0);
    setActiveProjectTab('info');
    setDrawerOpen(true);
    focusCentralidad(centralidad);
  };

  // Filtrado de la lista para el buscador y pestañas
  const filteredCentralidades = centralidadesData.filter(c => {
    const matchesHierarchy = hierarchyFilter === 'Todas' || c.jerarquia === hierarchyFilter;
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admin_zonal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.proyectos.some(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesHierarchy && matchesSearch;
  });

  const activeProject = selectedCentralidad.proyectos[selectedProjectIndex] || selectedCentralidad.proyectos[0];
  const hierarchyStyle = HIERARCHY_COLORS[selectedCentralidad.jerarquia] || HIERARCHY_COLORS['Zonal'];

  return (
    <div className="centralidades-container">
      {/* 1. Header Institucional - Secretaría de Territorio, Hábitat y Vivienda */}
      <div className="centralidades-hero-header">
        <div className="header-info-group">
          <div className="header-badge">
            <Compass size={15} />
            <span>SECRETARÍA DE TERRITORIO, HÁBITAT Y VIVIENDA • STHV</span>
          </div>
          <h1 className="header-title">
            Plataforma Estratégica de <span className="highlight-gradient">Centralidades Urbanas</span>
          </h1>
          <p className="header-description">
            Plan Metropolitano de Desarrollo y Ordenamiento Territorial (PMDOT / PUGS). Evalúa los 22 polígonos de centralidades del DMQ articulados a la infraestructura, seguridad, economía y plusvalía del suelo.
          </p>
        </div>

        {/* KPIs de Centralidades */}
        <div className="centralidades-kpis-grid">
          <div className="centralidad-kpi-card">
            <span className="kpi-num">22</span>
            <span className="kpi-txt">Centralidades Oficiales</span>
          </div>
          <div className="centralidad-kpi-card">
            <span className="kpi-num">5</span>
            <span className="kpi-txt">Metropolitanas</span>
          </div>
          <div className="centralidad-kpi-card">
            <span className="kpi-num">11</span>
            <span className="kpi-txt">Zonales</span>
          </div>
          <div className="centralidad-kpi-card">
            <span className="kpi-num">6</span>
            <span className="kpi-txt">Sectoriales</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Control: Filtros por Jerarquía y Buscador */}
      <div className="centralidades-controls-bar">
        <div className="hierarchy-filter-pills">
          {['Todas', 'Metropolitana', 'Zonal', 'Sectorial'].map((jer) => {
            const count = jer === 'Todas' 
              ? centralidadesData.length 
              : centralidadesData.filter(c => c.jerarquia === jer).length;
            return (
              <button
                key={jer}
                className={`hierarchy-pill-btn ${hierarchyFilter === jer ? 'active' : ''}`}
                onClick={() => setHierarchyFilter(jer)}
              >
                <span>{jer === 'Todas' ? 'Todas las Centralidades' : `${jer}es`}</span>
                <span className="pill-counter">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Buscador de Centralidades y Proyectos */}
        <div className="centralidad-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar centralidad o proyecto (ej. Mariscal, Colón, Shyris, Solanda...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 3. Escenario Cartográfico + Panel Lateral 360° */}
      <div className="centralidades-stage">
        {/* Mapa Mapbox */}
        <div className="centralidades-map-wrapper">
          <div ref={mapContainerRef} className="map-canvas" />

          {/* Selector de Capas de Mapa */}
          <div className="map-style-picker">
            <button 
              className={`style-btn ${mapStyle.includes('streets') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
            >
              Vial
            </button>
            <button 
              className={`style-btn ${mapStyle.includes('satellite') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
            >
              Satélite HD
            </button>
            <button 
              className={`style-btn ${mapStyle.includes('dark') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
            >
              Noche
            </button>
          </div>

          {/* Botón flotante para reabrir el panel si se cerró */}
          {!drawerOpen && (
            <button 
              className="open-drawer-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <FileText size={18} />
              <span>Ver Centralidad: {selectedCentralidad.nombre}</span>
            </button>
          )}
        </div>

        {/* Panel Inteligente de la Centralidad y sus Proyectos */}
        {drawerOpen && (
          <aside className="centralidad-drawer">
            {/* Cabecera de la Centralidad */}
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span 
                  className="hierarchy-badge"
                  style={{ backgroundColor: hierarchyStyle.badgeBg, color: hierarchyStyle.badgeText }}
                >
                  Centralidad {selectedCentralidad.jerarquia}
                </span>
                <h2 className="centralidad-title">{selectedCentralidad.nombre}</h2>
                <div className="centralidad-meta-row">
                  <span>📐 {selectedCentralidad.superficie_ha.toFixed(1)} hectáreas</span>
                  <span>•</span>
                  <span>🏛️ Zonal {selectedCentralidad.admin_zonal}</span>
                </div>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                title="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Diagnóstico Territorial de la Centralidad */}
            <div className="centralidad-summary-box">
              <p className="summary-text">{selectedCentralidad.descripcion_territorial}</p>
              {selectedCentralidad.equipamientos_clave?.length > 0 && (
                <div className="key-equipments-row">
                  {selectedCentralidad.equipamientos_clave.map((eq, i) => (
                    <span key={i} className="equipment-chip">{eq}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Proyectos en esta Centralidad */}
            <div className="projects-selector-section">
              <div className="section-label-row">
                <span className="section-label">
                  PROYECTOS EN ESTA CENTRALIDAD ({selectedCentralidad.proyectos.length})
                </span>
              </div>
              <div className="projects-pill-list">
                {selectedCentralidad.proyectos.map((proj, pIdx) => (
                  <button
                    key={proj.id}
                    className={`project-pill-btn ${selectedProjectIndex === pIdx ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProjectIndex(pIdx);
                      setActiveProjectTab('info');
                    }}
                  >
                    <span className="proj-dot" />
                    <span className="proj-name">{proj.nombre}</span>
                    <span className="proj-type-tag">{proj.tipo.split('/')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle Técnico del Proyecto Seleccionado */}
            {activeProject && (
              <div className="active-project-card">
                {/* Cabecera del Proyecto */}
                <div className="project-detail-header">
                  <div>
                    <span className="project-type-badge">{activeProject.tipo}</span>
                    <h3 className="project-detail-title">{activeProject.nombre}</h3>
                    <span className="project-badge-status">{activeProject.badge}</span>
                  </div>
                </div>

                {/* 4 Pestañas Temáticas del Proyecto */}
                <div className="project-tabs-nav">
                  <button
                    className={`proj-tab-btn ${activeProjectTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveProjectTab('info')}
                  >
                    <Info size={14} />
                    <span>Información</span>
                  </button>
                  <button
                    className={`proj-tab-btn ${activeProjectTab === 'seguridad' ? 'active' : ''}`}
                    onClick={() => setActiveProjectTab('seguridad')}
                  >
                    <Shield size={14} />
                    <span>Seguridad</span>
                  </button>
                  <button
                    className={`proj-tab-btn ${activeProjectTab === 'economia' ? 'active' : ''}`}
                    onClick={() => setActiveProjectTab('economia')}
                  >
                    <TrendingUp size={14} />
                    <span>Economía</span>
                  </button>
                  <button
                    className={`proj-tab-btn ${activeProjectTab === 'suelo' ? 'active' : ''}`}
                    onClick={() => setActiveProjectTab('suelo')}
                  >
                    <DollarSign size={14} />
                    <span>Suelo</span>
                  </button>
                </div>

                {/* Contenido de la Pestaña Activa */}
                <div className="project-tab-pane">
                  {/* TAB 1: INFORMACIÓN GENERAL */}
                  {activeProjectTab === 'info' && (
                    <div className="tab-pane-fade">
                      <div className="kpi-metrics-row">
                        <div className="metric-cell">
                          <span className="metric-lbl">Longitud / Alcance</span>
                          <strong className="metric-val">{activeProject.longitud_km}</strong>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-lbl">Presupuesto</span>
                          <strong className="metric-val">{activeProject.presupuesto}</strong>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-lbl">Financiamiento</span>
                          <strong className="metric-val" style={{ fontSize: '0.8rem' }}>{activeProject.financiamiento}</strong>
                        </div>
                      </div>

                      <p className="project-description-text">{activeProject.resumen}</p>

                      {/* Imagen con ampliación */}
                      {activeProject.imagen_destacada && (
                        <div 
                          className="project-image-preview"
                          onClick={() => setModalImage({
                            src: activeProject.imagen_destacada,
                            title: activeProject.nombre,
                            description: activeProject.resumen
                          })}
                        >
                          <img src={activeProject.imagen_destacada} alt={activeProject.nombre} />
                          <div className="zoom-hint">
                            <Maximize2 size={16} />
                            <span>Ampliar Fotografía</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SEGURIDAD */}
                  {activeProjectTab === 'seguridad' && (
                    <div className="tab-pane-fade">
                      <div className="security-kpis-grid">
                        <div className="sec-kpi-box">
                          <Shield size={20} color="#10b981" />
                          <span className="sec-val">{activeProject.seguridad.camaras}</span>
                          <span className="sec-lbl">Cámaras 24/7</span>
                        </div>
                        <div className="sec-kpi-box">
                          <Sparkles size={20} color="#3b82f6" />
                          <span className="sec-val">{activeProject.seguridad.luminarias_led}</span>
                          <span className="sec-lbl">Luces LED</span>
                        </div>
                        <div className="sec-kpi-box">
                          <CheckCircle2 size={20} color="#f59e0b" />
                          <span className="sec-val">{activeProject.seguridad.cruces_seguros}</span>
                          <span className="sec-lbl">Cruces Tácticos</span>
                        </div>
                      </div>

                      <div className="info-row-card">
                        <span className="info-row-lbl">Nivel de Seguridad Urbana:</span>
                        <strong className="info-row-val" style={{ color: '#10b981' }}>
                          {activeProject.seguridad.nivel}
                        </strong>
                      </div>

                      <p className="project-description-text">{activeProject.seguridad.descripcion}</p>
                    </div>
                  )}

                  {/* TAB 3: ECONOMÍA */}
                  {activeProjectTab === 'economia' && (
                    <div className="tab-pane-fade">
                      <div className="economic-summary-box">
                        <span className="eco-title">Dinamismo Comercial</span>
                        <strong className="eco-val">{activeProject.economia.negocios_activos}</strong>
                        <p className="eco-sub">{activeProject.economia.atractivo_comercial}</p>
                      </div>

                      {activeProject.economia.inversiones_privadas?.length > 0 && (
                        <div className="inversiones-list">
                          <span className="section-label">INVERSIÓN PRIVADA ATRAÍDA:</span>
                          {activeProject.economia.inversiones_privadas.map((inv, idx) => (
                            <div key={idx} className="inversion-card">
                              <strong className="inv-title">{inv.titulo}</strong>
                              <span className="inv-badge">{inv.tipo}</span>
                              <p className="inv-desc">{inv.impacto}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: VALOR DEL SUELO */}
                  {activeProjectTab === 'suelo' && (
                    <div className="tab-pane-fade">
                      <div className="land-value-box">
                        <span className="land-title">Avalúo Homologado de Suelo (AIVA)</span>
                        <div className="land-num-row">
                          <span className="land-number">${activeProject.valor_suelo.valor_m2.toFixed(2)}</span>
                          <span className="land-unit">USD / m²</span>
                        </div>
                        <span className="land-trend">
                          <TrendingUp size={15} /> {activeProject.valor_suelo.tendencia}
                        </span>
                      </div>

                      <div className="info-row-card">
                        <span className="info-row-lbl">Zona Homologada:</span>
                        <strong className="info-row-val">{activeProject.valor_suelo.aiva}</strong>
                      </div>

                      <div className="info-row-card">
                        <span className="info-row-lbl">Rango Comercial:</span>
                        <strong className="info-row-val">{activeProject.valor_suelo.rango}</strong>
                      </div>

                      <p className="project-description-text">{activeProject.valor_suelo.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Carrusel Inferior de Acceso Rápido a Centralidades */}
            <div className="drawer-footer">
              <span className="footer-title">EXPLORAR OTRAS CENTRALIDADES:</span>
              <div className="centralidades-chips-scroll">
                {filteredCentralidades.map((c) => (
                  <button
                    key={c.id}
                    className={`chip-btn ${selectedCentralidad.id === c.id ? 'active' : ''}`}
                    onClick={() => handleSelectCentralidad(c)}
                  >
                    <span>{c.nombre}</span>
                    <small>({c.proyectos.length} proj)</small>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Modal / Lightbox para ampliación de fotos */}
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
