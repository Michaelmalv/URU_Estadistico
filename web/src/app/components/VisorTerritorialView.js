'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, Shield, DollarSign, Train, Building2, Eye, Sparkles,
  Layers, Search, Navigation, Award, ExternalLink, Maximize2,
  TrendingUp, CheckCircle2, ChevronRight, X, Compass, Info, ArrowUpRight
} from 'lucide-react';
import sectorsData from '@/lib/territorial_sectors.json';
import MAP_COORDINATES from './map_coordinates.json';
import soterramientoData from '@/lib/soterramiento.json';
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

const CATEGORY_COLORS = {
  'Corredores Vivos': '#10b981',
  'Zonas Metro': '#3b82f6',
  'Rehabilitación del Espacio Público': '#f59e0b',
  'Plan de Rehabilitación Centro Histórico': '#f97316',
  'Soterramiento': '#8b5cf6'
};

export default function VisorTerritorialView({ onNavigateToProject = null }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [selectedSector, setSelectedSector] = useState(sectorsData[0]); // Por defecto Av. Colón
  const [activeTab, setActiveTab] = useState('plusvalia'); // 'plusvalia', 'seguridad', 'economia', 'proyectos'
  const [activeFilterMode, setActiveFilterMode] = useState('todos'); // 'todos', 'inversion', 'seguridad', 'metro'
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [modalImage, setModalImage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = getFallbackToken();
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-78.4900, -0.1900], // Vista panorámica de Quito
      zoom: 12.2,
      pitch: 35, // Vista semi 3D
      bearing: -10
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      renderMarkers(map);
      updateSelectedGeometry(map, selectedSector);
    });

    return () => {
      map.remove();
    };
  }, [mapStyle]);

  // Renderizar pines y marcadores
  const renderMarkers = (mapInstance) => {
    if (!mapInstance) return;

    // Limpiar marcadores previos
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filtrar sectores según el modo
    const filtered = sectorsData.filter(s => {
      if (activeFilterMode === 'inversion') return s.valor_suelo?.valor_m2 >= 1000;
      if (activeFilterMode === 'seguridad') return s.seguridad?.camaras >= 10;
      if (activeFilterMode === 'metro') return s.estacion_metro_cercana;
      return true;
    });

    filtered.forEach(sector => {
      const color = CATEGORY_COLORS[sector.categoria] || '#3b82f6';

      // Crear elemento HTML personalizado para el pin con micro-animación
      const el = document.createElement('div');
      el.className = 'territorial-marker-pin';
      el.style.backgroundColor = color;
      el.style.boxShadow = `0 0 15px ${color}88, 0 4px 10px rgba(0,0,0,0.3)`;
      
      const dot = document.createElement('div');
      dot.className = 'territorial-marker-inner';
      el.appendChild(dot);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectSector(sector);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(sector.coordenadas)
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });
  };

  // Re-renderizar marcadores cuando cambia el filtro
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      renderMarkers(mapRef.current);
    }
  }, [activeFilterMode]);

  // Actualizar trazado/geometría del sector seleccionado
  const updateSelectedGeometry = (mapInstance, sector) => {
    if (!mapInstance || !sector) return;

    const normKey = sector.nombre.toLowerCase().trim()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();

    const config = MAP_COORDINATES[normKey];

    // Remover capas y fuentes previas de selección
    if (mapInstance.getLayer('selected-route-line')) mapInstance.removeLayer('selected-route-line');
    if (mapInstance.getLayer('selected-route-fill')) mapInstance.removeLayer('selected-route-fill');
    if (mapInstance.getSource('selected-route')) mapInstance.removeSource('selected-route');

    if (config && config.geojson) {
      mapInstance.addSource('selected-route', {
        type: 'geojson',
        data: config.geojson
      });

      const geomType = config.geojson.geometry?.type;

      if (geomType === 'Polygon') {
        mapInstance.addLayer({
          id: 'selected-route-fill',
          type: 'fill',
          source: 'selected-route',
          paint: {
            'fill-color': CATEGORY_COLORS[sector.categoria] || '#3b82f6',
            'fill-opacity': 0.25
          }
        });
        mapInstance.addLayer({
          id: 'selected-route-line',
          type: 'line',
          source: 'selected-route',
          paint: {
            'line-color': CATEGORY_COLORS[sector.categoria] || '#3b82f6',
            'line-width': 3.5,
            'line-opacity': 0.9
          }
        });
      } else {
        mapInstance.addLayer({
          id: 'selected-route-line',
          type: 'line',
          source: 'selected-route',
          paint: {
            'line-color': CATEGORY_COLORS[sector.categoria] || '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.85
          }
        });
      }
    }
  };

  const handleSelectSector = (sector) => {
    setSelectedSector(sector);
    setDrawerOpen(true);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: sector.coordenadas,
        zoom: sector.zoom || 15.2,
        pitch: 45,
        bearing: -15,
        duration: 1800,
        essential: true
      });
      updateSelectedGeometry(mapRef.current, sector);
    }
  };

  const filteredSectorsList = sectorsData.filter(s => 
    s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.parroquia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.administracion_zonal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="territorial-viewer-container">
      {/* 1. Header Hero con KPIs Globales de Quito */}
      <div className="territorial-hero-header">
        <div className="hero-title-group">
          <div className="hero-badge">
            <Compass size={15} />
            <span>GEO-PORTAL DE INTELIGENCIA URBANA</span>
          </div>
          <h1 className="hero-main-title">
            Visor Territorial 360° — <span className="highlight-gradient">Quito Transforma</span>
          </h1>
          <p className="hero-sub-text">
            Explora las oportunidades de inversión, plusvalía del suelo, seguridad ciudadana y la infraestructura estratégica intervenida en el Distrito Metropolitano.
          </p>
        </div>

        {/* KPIs Resumen */}
        <div className="hero-kpis-grid">
          <div className="kpi-mini-card">
            <span className="kpi-mini-val">38+</span>
            <span className="kpi-mini-lbl">Proyectos Estratégicos</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-val">15</span>
            <span className="kpi-mini-lbl">Zonas Metro Conectadas</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-val">+9.8%</span>
            <span className="kpi-mini-lbl">Plusvalía Promedio</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-val">100%</span>
            <span className="kpi-mini-lbl">Alumbrado LED Seguro</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Control de Modos y Búsqueda */}
      <div className="territorial-controls-bar">
        <div className="filter-modes-group">
          <button 
            className={`mode-filter-btn ${activeFilterMode === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveFilterMode('todos')}
          >
            <Sparkles size={16} />
            <span>Vista Integral 360°</span>
          </button>
          <button 
            className={`mode-filter-btn ${activeFilterMode === 'inversion' ? 'active' : ''}`}
            onClick={() => setActiveFilterMode('inversion')}
          >
            <DollarSign size={16} />
            <span>Modo Inversión & Plusvalía</span>
          </button>
          <button 
            className={`mode-filter-btn ${activeFilterMode === 'seguridad' ? 'active' : ''}`}
            onClick={() => setActiveFilterMode('seguridad')}
          >
            <Shield size={16} />
            <span>Modo Seguridad & Vida</span>
          </button>
          <button 
            className={`mode-filter-btn ${activeFilterMode === 'metro' ? 'active' : ''}`}
            onClick={() => setActiveFilterMode('metro')}
          >
            <Train size={16} />
            <span>Conectividad Metro</span>
          </button>
        </div>

        {/* Buscador de Zonas */}
        <div className="sector-search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar sector (ej. Colón, Patria, Shyris...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sector-search-input"
          />
        </div>
      </div>

      {/* 3. Escenario Principal: Mapa 3D + Drawer Lateral 360° */}
      <div className="territorial-stage">
        {/* Contenedor del Mapa Mapbox */}
        <div className="territorial-map-wrapper">
          <div ref={mapContainerRef} className="territorial-map-canvas" />

          {/* Selector de Estilo de Mapa flotante */}
          <div className="map-style-floating-picker">
            <button 
              className={`style-btn ${mapStyle.includes('streets') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
              title="Mapa Vial"
            >
              Vial
            </button>
            <button 
              className={`style-btn ${mapStyle.includes('satellite') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
              title="Satélite HD"
            >
              Satélite
            </button>
            <button 
              className={`style-btn ${mapStyle.includes('dark') ? 'active' : ''}`}
              onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
              title="Modo Oscuro"
            >
              Noche
            </button>
          </div>

          {/* Botón flotante para abrir Drawer si está cerrado */}
          {!drawerOpen && (
            <button 
              className="open-drawer-floating-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <Info size={18} />
              <span>Ver Ficha 360° de {selectedSector.nombre}</span>
            </button>
          )}
        </div>

        {/* Drawer Lateral Inteligente 360° */}
        {drawerOpen && (
          <aside className="territorial-drawer">
            {/* Cabecera del Drawer */}
            <div className="drawer-header">
              <div>
                <span className="drawer-category-badge" style={{ backgroundColor: `${CATEGORY_COLORS[selectedSector.categoria] || '#3b82f6'}22`, color: CATEGORY_COLORS[selectedSector.categoria] || '#3b82f6' }}>
                  {selectedSector.categoria}
                </span>
                <h2 className="drawer-title">{selectedSector.nombre}</h2>
                <span className="drawer-location">{selectedSector.parroquia} • Zonal {selectedSector.administracion_zonal}</span>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                title="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score de Atractivo Urbano */}
            <div className="drawer-score-card">
              <div className="score-left">
                <span className="score-label">Índice de Atractivo Urbano</span>
                <div className="score-progress-bar">
                  <div className="score-fill" style={{ width: `${selectedSector.score_atractivo}%` }} />
                </div>
              </div>
              <div className="score-value">
                <span>{selectedSector.score_atractivo}</span>
                <small>/100</small>
              </div>
            </div>

            {/* Sub-Pestañas del Drawer */}
            <div className="drawer-tabs-nav">
              <button 
                className={`drawer-tab-btn ${activeTab === 'plusvalia' ? 'active' : ''}`}
                onClick={() => setActiveTab('plusvalia')}
              >
                <DollarSign size={15} />
                <span>Plusvalía</span>
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'seguridad' ? 'active' : ''}`}
                onClick={() => setActiveTab('seguridad')}
              >
                <Shield size={15} />
                <span>Seguridad</span>
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'economia' ? 'active' : ''}`}
                onClick={() => setActiveTab('economia')}
              >
                <Building2 size={15} />
                <span>Economía</span>
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'proyectos' ? 'active' : ''}`}
                onClick={() => setActiveTab('proyectos')}
              >
                <Layers size={15} />
                <span>Proyectos</span>
              </button>
            </div>

            {/* Contenido Dinámico de la Pestaña */}
            <div className="drawer-tab-content">
              {/* TAB 1: PLUSVALÍA & VALOR DEL SUELO */}
              {activeTab === 'plusvalia' && (
                <div className="tab-pane">
                  <div className="metric-highlight-box">
                    <span className="metric-title">Valor Promedio de Suelo (AIVA)</span>
                    <div className="metric-number-row">
                      <span className="metric-big-number">${selectedSector.valor_suelo.valor_m2.toFixed(2)}</span>
                      <span className="metric-unit">USD / m²</span>
                    </div>
                    <span className="metric-trend-badge">
                      <TrendingUp size={14} /> {selectedSector.valor_suelo.tendencia}
                    </span>
                  </div>

                  <div className="info-detail-card">
                    <span className="detail-label">Zona Homologada AIVA:</span>
                    <strong className="detail-val">{selectedSector.valor_suelo.aiva}</strong>
                  </div>

                  <div className="info-detail-card">
                    <span className="detail-label">Rango Comercial:</span>
                    <strong className="detail-val">{selectedSector.valor_suelo.rango}</strong>
                  </div>

                  <p className="tab-description-text">
                    {selectedSector.valor_suelo.descripcion}
                  </p>
                </div>
              )}

              {/* TAB 2: SEGURIDAD & EQUIPAMIENTO */}
              {activeTab === 'seguridad' && (
                <div className="tab-pane">
                  <div className="security-badges-grid">
                    <div className="security-stat-box">
                      <Shield size={20} color="#10b981" />
                      <span className="sec-val">{selectedSector.seguridad.camaras}</span>
                      <span className="sec-lbl">Cámaras 24/7</span>
                    </div>
                    <div className="security-stat-box">
                      <Sparkles size={20} color="#3b82f6" />
                      <span className="sec-val">{selectedSector.seguridad.luminarias_led}</span>
                      <span className="sec-lbl">Luces LED</span>
                    </div>
                    <div className="security-stat-box">
                      <CheckCircle2 size={20} color="#f59e0b" />
                      <span className="sec-val">{selectedSector.seguridad.cruces_seguros}</span>
                      <span className="sec-lbl">Cruces Tácticos</span>
                    </div>
                  </div>

                  <div className="info-detail-card">
                    <span className="detail-label">Nivel de Seguridad Urbana:</span>
                    <strong className="detail-val" style={{ color: '#10b981' }}>{selectedSector.seguridad.nivel}</strong>
                  </div>

                  <p className="tab-description-text">
                    {selectedSector.seguridad.descripcion}
                  </p>
                </div>
              )}

              {/* TAB 3: ECONOMÍA & INVERSIÓN PRIVADA */}
              {activeTab === 'economia' && (
                <div className="tab-pane">
                  <div className="economic-summary-box">
                    <span className="eco-title">Dinamismo Comercial</span>
                    <strong className="eco-val">{selectedSector.economia.negocios_activos}</strong>
                    <p className="eco-sub">{selectedSector.economia.atractivo_comercial}</p>
                  </div>

                  {selectedSector.economia.inversiones_privadas?.length > 0 && (
                    <div className="investment-cases-section">
                      <h4 className="section-mini-heading">Inversión Privada Atraída</h4>
                      {selectedSector.economia.inversiones_privadas.map((inv, idx) => (
                        <div key={idx} className="investment-case-card">
                          <strong className="inv-title">{inv.titulo}</strong>
                          <span className="inv-type">{inv.tipo}</span>
                          <p className="inv-desc">{inv.impacto}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PROYECTOS & METRO */}
              {activeTab === 'proyectos' && (
                <div className="tab-pane">
                  {/* Conexión Metro */}
                  <div className="metro-connection-card">
                    <div className="metro-icon-circle">
                      <Train size={22} color="#ffffff" />
                    </div>
                    <div>
                      <strong className="metro-station-name">{selectedSector.estacion_metro_cercana}</strong>
                      <span className="metro-distance-text">Distancia: {selectedSector.distancia_metro}</span>
                    </div>
                  </div>

                  <h4 className="section-mini-heading">Infraestructura y Obras en el Radio</h4>
                  <ul className="nearby-projects-list">
                    {selectedSector.proyectos_cercanos.map((proj, pIdx) => (
                      <li key={pIdx} className="nearby-project-item">
                        <CheckCircle2 size={16} color="#10b981" />
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Imagen Destacada con Zoom */}
                  {selectedSector.imagen_destacada && (
                    <div 
                      className="drawer-media-preview"
                      onClick={() => setModalImage({
                        src: selectedSector.imagen_destacada,
                        title: selectedSector.nombre_completo,
                        description: selectedSector.descripcion_corta
                      })}
                      title="Haz clic para ampliar"
                    >
                      <img src={selectedSector.imagen_destacada} alt={selectedSector.nombre} />
                      <div className="media-zoom-overlay">
                        <Maximize2 size={16} />
                        <span>Ver Fotografía HD</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer con Lista de Selección Rápida de Sectores */}
            <div className="drawer-footer-list">
              <span className="footer-list-label">Otros Sectores Estratégicos:</span>
              <div className="sector-chips-carousel">
                {filteredSectorsList.map(sec => (
                  <button
                    key={sec.id}
                    className={`sector-chip-btn ${selectedSector.id === sec.id ? 'active' : ''}`}
                    onClick={() => handleSelectSector(sec)}
                  >
                    {sec.nombre}
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
