'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Building2, Shield, DollarSign, Info, Sparkles, MapPin, 
  Layers, Search, Compass, CheckCircle2, TrendingUp, Maximize2, 
  X, ChevronRight, Award, Eye, FileText, ArrowUpRight, ChevronDown
} from 'lucide-react';
import centralidadesData from '@/lib/centralidades_data.json';
import centralidadesGeoJson from '@/lib/centralidades.json';

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
    badgeBg: 'rgba(37, 99, 235, 0.22)',
    badgeText: '#60a5fa'
  },
  'Zonal': {
    fill: '#059669',
    stroke: '#34d399',
    badgeBg: 'rgba(5, 150, 105, 0.22)',
    badgeText: '#34d399'
  },
  'Sectorial': {
    fill: '#d97706',
    stroke: '#fbbf24',
    badgeBg: 'rgba(217, 119, 6, 0.22)',
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

      // Capa de Contorno
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
          'line-opacity': 0.95
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
          'text-halo-width': 2.5
        }
      });

      // Hover Popup
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

      // Clic en polígono
      map.on('click', 'centralidades-fill', (e) => {
        if (e.features.length > 0) {
          const clickedId = e.features[0].properties.id;
          const found = centralidadesData.find(c => c.id === clickedId);
          if (found) {
            handleSelectCentralidad(found);
          }
        }
      });

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

  // Actualizar resalte
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
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
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
  const hierarchyStyle = HIERARCHY_COLORS[selectedCentralidad.jerarquia] || HIERARCHY_COLORS['Zonal'];

  return (
    <div className="centralidades-dashboard-layout">
      {/* ============================================================== */}
      {/* 1. BARRA LATERAL PERMANENTE DE INFORMACIÓN TERRITORIAL (SIDEBAR) */}
      {/* ============================================================== */}
      <aside className="centralidades-sidebar">
        {/* Cabecera Institucional del Sidebar */}
        <div className="sidebar-top-header">
          <div className="sidebar-badge">
            <Compass size={14} />
            <span>STHV • SECRETARÍA DE TERRITORIO</span>
          </div>
          <h2 className="sidebar-title">Centralidades Urbanas</h2>
          <p className="sidebar-subtitle">
            Plan Metropolitano de Ordenamiento Territorial (PMDOT / PUGS)
          </p>

          {/* Filtros de Jerarquía Urbana */}
          <div className="sidebar-hierarchy-pills">
            {['Todas', 'Metropolitana', 'Zonal', 'Sectorial'].map((jer) => {
              const count = jer === 'Todas' 
                ? centralidadesData.length 
                : centralidadesData.filter(c => c.jerarquia === jer).length;
              return (
                <button
                  key={jer}
                  className={`hierarchy-pill ${hierarchyFilter === jer ? 'active' : ''}`}
                  onClick={() => setHierarchyFilter(jer)}
                >
                  <span>{jer === 'Todas' ? 'Todas' : jer}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Buscador de Centralidades y Proyectos */}
          <div className="sidebar-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar centralidad o proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Selector Rápido de Centralidad Dropdown */}
          <div className="centralidad-select-wrapper">
            <label className="select-label">Centralidad Activa:</label>
            <div className="custom-select-box">
              <select
                value={selectedCentralidad.id}
                onChange={(e) => {
                  const found = centralidadesData.find(c => c.id === e.target.value);
                  if (found) handleSelectCentralidad(found);
                }}
                className="centralidad-native-select"
              >
                {filteredCentralidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.jerarquia}] {c.nombre} ({c.superficie_ha.toFixed(0)} ha)
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CUERPO DEL SIDEBAR: FICHA DE CENTRALIDAD Y PROYECTOS            */}
        {/* ============================================================== */}
        <div className="sidebar-content-scroll">
          {/* Ficha Territorial de la Centralidad */}
          <div className="centralidad-info-card">
            <div className="centralidad-card-header">
              <span 
                className="hierarchy-tag"
                style={{ backgroundColor: hierarchyStyle.badgeBg, color: hierarchyStyle.badgeText }}
              >
                Centralidad {selectedCentralidad.jerarquia}
              </span>
              <h3 className="centralidad-card-name">{selectedCentralidad.nombre}</h3>
              <div className="centralidad-quick-stats">
                <span>📐 {selectedCentralidad.superficie_ha.toFixed(1)} ha</span>
                <span>•</span>
                <span>🏛️ Zonal {selectedCentralidad.admin_zonal}</span>
              </div>
            </div>

            <p className="centralidad-desc">{selectedCentralidad.descripcion_territorial}</p>

            {selectedCentralidad.equipamientos_clave?.length > 0 && (
              <div className="equipments-tags-row">
                {selectedCentralidad.equipamientos_clave.map((eq, i) => (
                  <span key={i} className="eq-tag">{eq}</span>
                ))}
              </div>
            )}
          </div>

          {/* Sección de Proyectos en esta Centralidad */}
          <div className="centralidad-projects-section">
            <div className="projects-header-row">
              <span className="section-title">
                PROYECTOS EN ESTA CENTRALIDAD ({selectedCentralidad.proyectos.length})
              </span>
            </div>

            <div className="projects-cards-list">
              {selectedCentralidad.proyectos.map((proj, pIdx) => (
                <button
                  key={proj.id}
                  className={`project-select-card ${selectedProjectIndex === pIdx ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedProjectIndex(pIdx);
                    setActiveProjectTab('info');
                  }}
                >
                  <div className="proj-card-left">
                    <span className="proj-indicator" />
                    <div>
                      <strong className="proj-title">{proj.nombre}</strong>
                      <span className="proj-category">{proj.tipo}</span>
                    </div>
                  </div>
                  <span className="proj-status-chip">{proj.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detalle Técnico del Proyecto Seleccionado: Las 4 Pestañas */}
          {activeProject && (
            <div className="project-detail-box">
              <div className="detail-box-top">
                <span className="detail-subtitle">{activeProject.tipo}</span>
                <h4 className="detail-project-title">{activeProject.nombre}</h4>
              </div>

              {/* Pestañas de las 4 Dimensiones Técnicas */}
              <div className="project-tabs-navigation">
                <button
                  className={`tab-btn ${activeProjectTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveProjectTab('info')}
                >
                  <Info size={14} />
                  <span>Información</span>
                </button>
                <button
                  className={`tab-btn ${activeProjectTab === 'seguridad' ? 'active' : ''}`}
                  onClick={() => setActiveProjectTab('seguridad')}
                >
                  <Shield size={14} />
                  <span>Seguridad</span>
                </button>
                <button
                  className={`tab-btn ${activeProjectTab === 'economia' ? 'active' : ''}`}
                  onClick={() => setActiveProjectTab('economia')}
                >
                  <TrendingUp size={14} />
                  <span>Economía</span>
                </button>
                <button
                  className={`tab-btn ${activeProjectTab === 'suelo' ? 'active' : ''}`}
                  onClick={() => setActiveProjectTab('suelo')}
                >
                  <DollarSign size={14} />
                  <span>Suelo</span>
                </button>
              </div>

              {/* Contenido de la Pestaña Activa */}
              <div className="project-tab-body">
                {/* 1. INFORMACIÓN GENERAL */}
                {activeProjectTab === 'info' && (
                  <div className="tab-pane-content">
                    <div className="project-kpi-row">
                      <div className="kpi-box">
                        <span className="kpi-lbl">Longitud</span>
                        <strong className="kpi-val">{activeProject.longitud_km}</strong>
                      </div>
                      <div className="kpi-box">
                        <span className="kpi-lbl">Presupuesto</span>
                        <strong className="kpi-val">{activeProject.presupuesto}</strong>
                      </div>
                      <div className="kpi-box">
                        <span className="kpi-lbl">Financiamiento</span>
                        <strong className="kpi-val" style={{ fontSize: '0.78rem' }}>{activeProject.financiamiento}</strong>
                      </div>
                    </div>

                    <p className="project-summary-text">{activeProject.resumen}</p>

                    {activeProject.imagen_destacada && (
                      <div 
                        className="project-photo-card"
                        onClick={() => setModalImage({
                          src: activeProject.imagen_destacada,
                          title: activeProject.nombre,
                          description: activeProject.resumen
                        })}
                        title="Haz clic para ampliar"
                      >
                        <img src={activeProject.imagen_destacada} alt={activeProject.nombre} />
                        <div className="photo-zoom-overlay">
                          <Maximize2 size={16} />
                          <span>Ampliar Fotografía</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SEGURIDAD */}
                {activeProjectTab === 'seguridad' && (
                  <div className="tab-pane-content">
                    <div className="security-stats-grid">
                      <div className="sec-stat-card">
                        <Shield size={18} color="#10b981" />
                        <span className="sec-number">{activeProject.seguridad.camaras}</span>
                        <span className="sec-label">Cámaras 24/7</span>
                      </div>
                      <div className="sec-stat-card">
                        <Sparkles size={18} color="#3b82f6" />
                        <span className="sec-number">{activeProject.seguridad.luminarias_led}</span>
                        <span className="sec-label">Luces LED</span>
                      </div>
                      <div className="sec-stat-card">
                        <CheckCircle2 size={18} color="#f59e0b" />
                        <span className="sec-number">{activeProject.seguridad.cruces_seguros}</span>
                        <span className="sec-label">Cruces Cebras</span>
                      </div>
                    </div>

                    <div className="info-badge-card">
                      <span className="info-badge-lbl">Nivel de Seguridad Urbana:</span>
                      <strong className="info-badge-val" style={{ color: '#10b981' }}>
                        {activeProject.seguridad.nivel}
                      </strong>
                    </div>

                    <p className="project-summary-text">{activeProject.seguridad.descripcion}</p>
                  </div>
                )}

                {/* 3. ECONOMÍA */}
                {activeProjectTab === 'economia' && (
                  <div className="tab-pane-content">
                    <div className="economic-highlight-card">
                      <span className="eco-header-title">Dinamismo Comercial</span>
                      <strong className="eco-header-val">{activeProject.economia.negocios_activos}</strong>
                      <p className="eco-header-sub">{activeProject.economia.atractivo_comercial}</p>
                    </div>

                    {activeProject.economia.inversiones_privadas?.length > 0 && (
                      <div className="inversiones-container">
                        <span className="section-title">INVERSIÓN PRIVADA ATRAÍDA:</span>
                        {activeProject.economia.inversiones_privadas.map((inv, idx) => (
                          <div key={idx} className="inversion-item">
                            <strong className="inv-name">{inv.titulo}</strong>
                            <span className="inv-tag">{inv.tipo}</span>
                            <p className="inv-text">{inv.impacto}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. VALOR DEL SUELO */}
                {activeProjectTab === 'suelo' && (
                  <div className="tab-pane-content">
                    <div className="land-val-card">
                      <span className="land-card-title">Avalúo Homologado de Suelo (AIVA)</span>
                      <div className="land-number-row">
                        <span className="land-val-big">${activeProject.valor_suelo.valor_m2.toFixed(2)}</span>
                        <span className="land-val-unit">USD / m²</span>
                      </div>
                      <span className="land-trend-pill">
                        <TrendingUp size={14} /> {activeProject.valor_suelo.tendencia}
                      </span>
                    </div>

                    <div className="info-badge-card">
                      <span className="info-badge-lbl">Zona Homologada AIVA:</span>
                      <strong className="info-badge-val">{activeProject.valor_suelo.aiva}</strong>
                    </div>

                    <div className="info-badge-card">
                      <span className="info-badge-lbl">Rango Comercial:</span>
                      <strong className="info-badge-val">{activeProject.valor_suelo.rango}</strong>
                    </div>

                    <p className="project-summary-text">{activeProject.valor_suelo.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carrusel Rápido de Centralidades */}
          <div className="sidebar-bottom-chips">
            <span className="section-title">TODAS LAS CENTRALIDADES:</span>
            <div className="chips-row">
              {filteredCentralidades.map((c) => (
                <button
                  key={c.id}
                  className={`chip-item ${selectedCentralidad.id === c.id ? 'active' : ''}`}
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
      {/* 2. ESCENARIO CARTOGRÁFICO MAPBOX 3D (CANVAS PRINCIPAL)          */}
      {/* ============================================================== */}
      <main className="centralidades-map-stage">
        <div ref={mapContainerRef} className="map-fullscreen-canvas" />

        {/* Selector Flotante de Estilo de Mapa */}
        <div className="map-floating-styles">
          <button 
            className={`map-style-btn ${mapStyle.includes('streets') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
          >
            Vial
          </button>
          <button 
            className={`map-style-btn ${mapStyle.includes('satellite') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
          >
            Satélite HD
          </button>
          <button 
            className={`map-style-btn ${mapStyle.includes('dark') ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
          >
            Noche
          </button>
        </div>

        {/* Leyenda Cartográfica Flotante */}
        <div className="map-floating-legend">
          <span className="legend-title">JERARQUÍA DE CENTRALIDADES</span>
          <div className="legend-item">
            <span className="legend-color-dot" style={{ backgroundColor: '#2563eb' }} />
            <span>Metropolitana (5)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-dot" style={{ backgroundColor: '#059669' }} />
            <span>Zonal (11)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-dot" style={{ backgroundColor: '#d97706' }} />
            <span>Sectorial (6)</span>
          </div>
        </div>
      </main>

      {/* Lightbox / Modal de Fotografía HD */}
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
