'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Building2, Shield, DollarSign, Info, Sparkles, MapPin, 
  Layers, Search, Compass, CheckCircle2, TrendingUp, Maximize2, 
  X, ChevronRight, Award, Eye, FileText, ArrowUpRight, ChevronDown, Check
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
          'fill-opacity': 0.32
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
            'Metropolitana', '#2563eb',
            'Zonal', '#059669',
            'Sectorial', '#d97706',
            '#1e293b'
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

      // Hover Popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'centralidad-light-popup'
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
          <div className="header-badge-row">
            <span className="badge-sthv">
              <Compass size={13} />
              <span>STHV • SECRETARÍA DE TERRITORIO Y HÁBITAT</span>
            </span>
          </div>

          <h2 className="sidebar-main-title">Centralidades Urbanas</h2>
          <p className="sidebar-subtitle-text">
            Modelo territorial del DMQ (PMDOT / PUGS). Selecciona un sector en el mapa o en el buscador para ver sus proyectos estratégicos.
          </p>

          {/* Filtros de Jerarquía Urbana */}
          <div className="hierarchy-pills-row">
            {['Todas', 'Metropolitana', 'Zonal', 'Sectorial'].map((jer) => {
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
          <span className="legend-head">JERARQUÍA DE CENTRALIDADES</span>
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
                  <div className="kpi-cards-grid-3">
                    <div className="kpi-item-light">
                      <Shield size={24} color="#059669" />
                      <strong className="kpi-val-light" style={{ marginTop: '6px' }}>
                        {floatingProject.seguridad.camaras}
                      </strong>
                      <span className="kpi-lbl-light">Cámaras 24/7 Conectadas</span>
                    </div>
                    <div className="kpi-item-light">
                      <Sparkles size={24} color="#2563eb" />
                      <strong className="kpi-val-light" style={{ marginTop: '6px' }}>
                        {floatingProject.seguridad.luminarias_led}
                      </strong>
                      <span className="kpi-lbl-light">Luminarias LED Nuevas</span>
                    </div>
                    <div className="kpi-item-light">
                      <CheckCircle2 size={24} color="#d97706" />
                      <strong className="kpi-val-light" style={{ marginTop: '6px' }}>
                        {floatingProject.seguridad.cruces_seguros}
                      </strong>
                      <span className="kpi-lbl-light">Cruces Peatonales Seguros</span>
                    </div>
                  </div>

                  <div className="detail-row-card-light">
                    <span className="row-label">Nivel de Seguridad Urbana:</span>
                    <strong className="row-value" style={{ color: '#059669', fontSize: '1.05rem' }}>
                      {floatingProject.seguridad.nivel}
                    </strong>
                  </div>

                  <div className="floating-narrative-card">
                    <h4 className="card-subhead">Intervención en Seguridad y Convivencia Ciudadana</h4>
                    <p className="tab-narrative-light">{floatingProject.seguridad.descripcion}</p>
                  </div>
                </div>
              )}

              {/* 3. ECONOMÍA */}
              {activeProjectTab === 'economia' && (
                <div className="floating-tab-pane">
                  <div className="eco-highlight-light">
                    <span className="eco-lbl">Dinamismo Comercial</span>
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
                </div>
              )}

              {/* 4. VALOR DEL SUELO */}
              {activeProjectTab === 'suelo' && (
                <div className="floating-tab-pane">
                  <div className="land-highlight-light">
                    <span className="land-lbl">Avalúo Homologado de Suelo (AIVA)</span>
                    <div className="land-price-row">
                      <strong className="land-val">${floatingProject.valor_suelo.valor_m2.toFixed(2)}</strong>
                      <span className="land-unit">USD / m²</span>
                    </div>
                    <span className="land-trend-badge">
                      <TrendingUp size={14} /> {floatingProject.valor_suelo.tendencia}
                    </span>
                  </div>

                  <div className="detail-row-card-light">
                    <span className="row-label">Zona Homologada AIVA:</span>
                    <strong className="row-value">{floatingProject.valor_suelo.aiva}</strong>
                  </div>

                  <div className="detail-row-card-light">
                    <span className="row-label">Rango Comercial Estimado:</span>
                    <strong className="row-value">{floatingProject.valor_suelo.rango}</strong>
                  </div>

                  <div className="floating-narrative-card">
                    <h4 className="card-subhead">Plusvalía e Impacto Normativo PUGS</h4>
                    <p className="tab-narrative-light">{floatingProject.valor_suelo.descripcion}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de Acciones del Modal */}
            <div className="floating-modal-footer">
              <button 
                className="modal-action-btn-secondary"
                onClick={() => {
                  focusCentralidad(selectedCentralidad);
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
