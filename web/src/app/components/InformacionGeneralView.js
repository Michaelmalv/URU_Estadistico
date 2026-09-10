'use strict';
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import equipamientoData from '@/lib/equipamiento.json';
import eventosData from '@/lib/eventos.json';
import soterramientoData from '@/lib/soterramiento.json';
import AntesDespuesView from './AntesDespuesView';
import { 
  Building2, Calendar, Users, Route, Clock, MapPin, X, Maximize2,
  Coins, Footprints, Lightbulb, Wrench, Zap, TrafficCone, Paintbrush, 
  Sprout, Sofa, Fence, Construction, Video, Hammer, Info, Map as MapIcon, 
  Sparkles, ShieldCheck, FileText, CheckCircle2, ChevronDown, ChevronRight, 
  Layers, Table
} from 'lucide-react';

const MapboxMap = dynamic(() => import('./MapboxMap'), { ssr: false });

function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const getProyectoDisplayName = (nombre) => {
  if (nombre === 'El Labrador: Bulevar y Parque de la Resiliencia') {
    return 'El Labrador';
  }
  return nombre;
};

const NORM_EQUIPMENT_MAP = {
  'isla tortuga': 'Isla Tortuga',
  'la roldos oe13 colinas del norte': 'La Roldos',
  'av colon': 'Av Colón',
  'av patria': 'Av Patria',
  'calle rocafuerte': 'Calle Rocafuerte'
};

export default function InformacionGeneralView({ 
  fixedCategoria = null, 
  externalSelectedProyecto = null,
  onSelectProyecto = null 
}) {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [selectedProyecto, setSelectedProyecto] = useState(externalSelectedProyecto || '');
  
  const [equipamientoTab, setEquipamientoTab] = useState('total');
  const [showEquipamiento, setShowEquipamiento] = useState(true);
  const [showEventos, setShowEventos] = useState(true);
  const [showMatrixTable, setShowMatrixTable] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success) {
          setProyectos(data.proyectos || []);
          setFichas(data.fichas || []);
        }
      } catch (err) {
        console.error('Error fetching data for InformacionGeneralView:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Sincronizar proyecto seleccionado
  useEffect(() => {
    if (externalSelectedProyecto) {
      setSelectedProyecto(externalSelectedProyecto);
      setEquipamientoTab('total');
    }
  }, [externalSelectedProyecto]);

  // Identificar si el proyecto seleccionado pertenece a la matriz de soterramiento
  const currentSoterramientoRecord = soterramientoData.find(
    s => s.nombre.toLowerCase().trim() === (selectedProyecto || '').toLowerCase().trim() ||
         s.nombre_original.toLowerCase().trim() === (selectedProyecto || '').toLowerCase().trim() ||
         normalizeText(s.nombre) === normalizeText(selectedProyecto)
  );

  const currentProjectObj = proyectos.find(p => p.nombre === selectedProyecto) || 
    (currentSoterramientoRecord ? { 
      id: currentSoterramientoRecord.id, 
      nombre: currentSoterramientoRecord.nombre, 
      categoria: 'Soterramiento' 
    } : null);

  const currentFichas = fichas.filter(f => f.proyecto_id === currentProjectObj?.id);
  const projectEventData = eventosData.find(e => e.proyecto === selectedProyecto);
  const projectEvents = projectEventData ? projectEventData.eventos : [];

  const formatMoney = (value) => {
    if (value === null || value === undefined) return '—';
    let formatted = value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (value >= 1000000) {
      const parts = formatted.split('.');
      if (parts.length >= 3) {
        formatted = parts[0] + "'" + parts.slice(1).join('.');
      }
    }
    return '$ ' + formatted;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('es-EC');
  };

  const formatArea = (value) => {
    if (value === null || value === undefined || value === 0) return '—';
    return value.toLocaleString('es-EC') + ' m²';
  };

  const formatLength = (value) => {
    if (value === null || value === undefined || value === 0) return '—';
    return value.toLocaleString('es-EC') + ' m';
  };

  const getEquipamientoData = () => {
    if (!currentProjectObj) return null;
    const norm = normalizeText(currentProjectObj.nombre);
    const excelName = NORM_EQUIPMENT_MAP[norm];
    if (!excelName) return null;

    const records = equipamientoData.filter(e => e.nombre_sendero === excelName);
    if (records.length === 0) return null;

    const hasAnyData = records.some(r => r.presupuesto !== null || r.luminarias_instaladas !== null || r.cruces_seguros !== null || r.acera_intervenida !== null);
    if (!hasAnyData) return null;

    if (records.length > 1) {
      const totalRecord = {
        nombre_sendero: excelName,
        administracion_zonal: records[0].administracion_zonal,
        barrios: records[0].barrios,
        fecha_inicio: null,
        fecha_fin: null,
        longitud_intervenida: records.map(r => r.longitud_intervenida).filter(Boolean).join(' / '),
        presupuesto: records.reduce((sum, r) => sum + (r.presupuesto || 0), 0),
        luminarias_instaladas: records.reduce((sum, r) => sum + (r.luminarias_instaladas || 0), 0),
        luminarias_reparadas: records.reduce((sum, r) => sum + (r.luminarias_reparadas || 0), 0),
        postes_intervenidos: records.reduce((sum, r) => sum + (r.postes_intervenidos || 0), 0),
        senales_instaladas: records.reduce((sum, r) => sum + (r.senales_instaladas || 0), 0),
        cruces_seguros: records.reduce((sum, r) => sum + (r.cruces_seguros || 0), 0),
        pintura_vial: records.reduce((sum, r) => sum + (r.pintura_vial || 0), 0),
        jardineria: records.reduce((sum, r) => sum + (r.jardineria || 0), 0),
        mobiliario_urbano: records.reduce((sum, r) => sum + (r.mobiliario_urbano || 0), 0),
        bolardos: records.reduce((sum, r) => sum + (r.bolardos || 0), 0),
        acera_intervenida: records.reduce((sum, r) => sum + (r.acera_intervenida || 0), 0),
        bacheo: records.reduce((sum, r) => sum + (r.bacheo || 0), 0),
        camaras: records.reduce((sum, r) => sum + (r.camaras || 0), 0),
        tipo: 'total'
      };
      return {
        records,
        hasTabs: true,
        total: totalRecord
      };
    }

    return {
      records,
      hasTabs: false,
      total: records[0]
    };
  };

  const equipDataInfo = getEquipamientoData();
  
  let activeEquipRecord = null;
  if (equipDataInfo) {
    if (equipDataInfo.hasTabs) {
      if (equipamientoTab === 'total') {
        activeEquipRecord = equipDataInfo.total;
      } else {
        activeEquipRecord = equipDataInfo.records.find(r => r.tipo === equipamientoTab);
      }
    } else {
      activeEquipRecord = equipDataInfo.total;
    }
  }

  // Totales agregados de la matriz de soterramiento
  const totalSoterramientoInversion = soterramientoData.reduce((sum, s) => sum + (s.inversion_telecom || 0), 0);
  const totalSoterramientoKm = soterramientoData.reduce((sum, s) => sum + (s.kilometros || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando información general del proyecto...</p>
      </div>
    );
  }

  if (!currentProjectObj && !currentSoterramientoRecord) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginTop: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0 }}>
          Selecciona un proyecto en la parte superior para visualizar su información general.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* VISTA A: SI ES UN PROYECTO DE LA MATRIZ DE SOTERRAMIENTO */}
      {currentSoterramientoRecord ? (
        <>
          {/* 1. Ficha del Proyecto de Soterramiento */}
          <div className="equipamiento-section">
            <div 
              className="equipamiento-header"
              onClick={() => setShowEquipamiento(!showEquipamiento)} 
              style={{ cursor: 'pointer', userSelect: 'none', marginBottom: showEquipamiento ? '1.25rem' : '0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Ficha del Proyecto y Detalle de Soterramiento — {currentSoterramientoRecord.nombre}
                </span>
                <span className={`status-badge-sot ${currentSoterramientoRecord.estado === 'EJECUTADO' ? 'ejecutado' : 'en-ejecucion'}`}>
                  <span className="status-dot-pulse"></span>
                  {currentSoterramientoRecord.estado} ({currentSoterramientoRecord.ano})
                </span>
              </div>
              <span style={{ 
                display: 'inline-block', 
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                transition: 'transform 0.2s', 
                transform: showEquipamiento ? 'rotate(90deg)' : 'rotate(0deg)' 
              }}>
                ▶
              </span>
            </div>

            {showEquipamiento && (
              <>
                <div className="equipamiento-grid">
                  {/* Inversión en Telecomunicaciones / Soterramiento */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper orange">
                      <Zap size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.25rem' }}>
                        {formatMoney(currentSoterramientoRecord.inversion_telecom)}
                      </span>
                      <span className="equip-label">Inversión Soterramiento / Redes</span>
                    </div>
                  </div>

                  {/* Longitud Intervenida */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Route size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.25rem' }}>
                        {currentSoterramientoRecord.kilometros !== null 
                          ? `${currentSoterramientoRecord.kilometros} km (${(currentSoterramientoRecord.kilometros * 1000).toLocaleString('es-EC')} m)`
                          : '—'}
                      </span>
                      <span className="equip-label">Longitud Intervenida</span>
                    </div>
                  </div>

                  {/* Entidad Ejecutora */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Building2 size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.25rem' }}>
                        {currentSoterramientoRecord.ejecutor || 'EPMMOP'}
                      </span>
                      <span className="equip-label">Entidad Ejecutora</span>
                    </div>
                  </div>

                  {/* Tipo de Proyecto */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Construction size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.15rem' }}>
                        {currentSoterramientoRecord.tipo_proyecto || 'REGENERACIÓN URBANA'}
                      </span>
                      <span className="equip-label">Tipo de Proyecto</span>
                    </div>
                  </div>

                  {/* Parroquia */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <MapPin size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.15rem' }}>
                        {currentSoterramientoRecord.parroquia || 'Distrito Metropolitano'}
                      </span>
                      <span className="equip-label">Parroquia / Sector</span>
                    </div>
                  </div>

                  {/* Vía Principal */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Route size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.15rem' }}>
                        {currentSoterramientoRecord.via_principal || currentSoterramientoRecord.nombre}
                      </span>
                      <span className="equip-label">Vía Principal</span>
                    </div>
                  </div>

                  {/* Año de Ejecución */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Calendar size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.25rem' }}>
                        {currentSoterramientoRecord.ano || '—'}
                      </span>
                      <span className="equip-label">Año de Intervención</span>
                    </div>
                  </div>

                  {/* Fuente de Financiamiento */}
                  <div className="equip-card">
                    <div className="equip-icon-wrapper blue">
                      <Coins size={24} />
                    </div>
                    <div className="equip-details">
                      <span className="equip-value" style={{ fontSize: '1.15rem' }}>
                        {currentSoterramientoRecord.fuente_financiamiento || 'Inversión Pública'}
                      </span>
                      <span className="equip-label">Fuente de Financiamiento</span>
                    </div>
                  </div>
                </div>

                {/* Coordenadas Georreferenciadas */}
                {currentSoterramientoRecord.coordenadas_inicial?.lat && (
                  <div className="soterramiento-coords-grid">
                    <div className="soterramiento-coord-box">
                      <MapPin size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                          LOCALIZACIÓN INICIAL (WGS84)
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Lat: {currentSoterramientoRecord.coordenadas_inicial.lat.toFixed(6)} | Lng: {currentSoterramientoRecord.coordenadas_inicial.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    <div className="soterramiento-coord-box">
                      <MapPin size={20} color="#10b981" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                          LOCALIZACIÓN FINAL (WGS84)
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Lat: {currentSoterramientoRecord.coordenadas_final.lat.toFixed(6)} | Lng: {currentSoterramientoRecord.coordenadas_final.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 2. Transformación Urbana: Antes y Después (si está disponible para el proyecto) */}
          <AntesDespuesView 
            projectName={currentSoterramientoRecord.nombre} 
            onOpenModalImage={setModalImage} 
          />

          {/* 3. Mapa Interactivo del Proyecto */}
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapIcon size={20} color="var(--color-primary)" /> Mapa Interactivo de Soterramiento
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Ubicación geográfica, punto inicial/final y trazado de soterramiento en <strong>{currentSoterramientoRecord.nombre}</strong>.
            </p>
            <MapboxMap 
              projectKey={normalizeText(currentSoterramientoRecord.nombre)} 
              projectName={currentSoterramientoRecord.nombre} 
            />
          </div>

          {/* 4. Marco Normativo & Sustento Técnico */}
          {currentSoterramientoRecord.observaciones && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                <ShieldCheck size={22} color="#10b981" /> Marco Normativo y Registro Técnico
              </h3>
              <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                  {currentSoterramientoRecord.observaciones}
                </p>
              </div>
            </div>
          )}

          {/* 5. Encadenamiento Económico (si existen eventos) */}
          {projectEvents && projectEvents.length > 0 && (
            <div className="card" style={{ transition: 'all 0.3s ease' }}>
              <div 
                className="eventos-header"
                onClick={() => setShowEventos(!showEventos)} 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#f59e0b" /> {projectEventData?.titulo_override || 'Encadenamiento económico y revalorización'} — {currentSoterramientoRecord.nombre}
                </span>
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s', 
                  transform: showEventos ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  ▶
                </span>
              </div>

              {showEventos && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="eventos-grid">
                    {projectEvents.map((evento, idx) => (
                      <div key={idx} className="evento-card">
                        {evento.imagen && (
                          <div 
                            className="evento-image-wrapper"
                            onClick={() => setModalImage({
                              src: evento.imagen,
                              alt: evento.titulo,
                              title: evento.titulo,
                              edicion: evento.edicion,
                              description: evento.descripcion
                            })}
                            title="Haz clic para ver en pantalla completa"
                          >
                            <img 
                              src={evento.imagen} 
                              alt={evento.titulo} 
                              className="evento-image"
                            />
                            <div className="evento-image-zoom-hint">
                              <Maximize2 size={16} />
                              <span>Ampliar</span>
                            </div>
                          </div>
                        )}
                        <div className="evento-content">
                          <h4 className="evento-title">{evento.titulo}</h4>
                          {evento.edicion && <span className="evento-edition">{evento.edicion}</span>}
                          
                          <div className="evento-meta">
                            <div className="evento-meta-item">
                              <Calendar size={16} />
                              <span>{evento.fecha}</span>
                            </div>
                            {evento.hora && (
                              <div className="evento-meta-item">
                                <Clock size={16} />
                                <span>{evento.hora}</span>
                              </div>
                            )}
                            <div className="evento-meta-item">
                              <MapPin size={16} />
                              <span>{evento.lugar}</span>
                            </div>
                          </div>

                          <p className="evento-description">{evento.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Matriz Consolidada de Soterramientos del DMQ (Panel Resumen Desplegable) */}
          <div className="card">
            <div 
              onClick={() => setShowMatrixTable(!showMatrixTable)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Table size={22} color="#3b82f6" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Matriz Consolidada de Soterramientos ({soterramientoData.length} Proyectos)
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Panorama distrital completo de inversión y cobertura de soterramiento en Quito
                  </p>
                </div>
              </div>
              <span style={{ 
                display: 'inline-block', 
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                transition: 'transform 0.2s', 
                transform: showMatrixTable ? 'rotate(90deg)' : 'rotate(0deg)' 
              }}>
                ▶
              </span>
            </div>

            {showMatrixTable && (
              <div style={{ marginTop: '1.5rem' }}>
                {/* Resumen Agregado */}
                <div className="soterramiento-matrix-summary">
                  <div className="soterramiento-stat-box">
                    <span className="soterramiento-stat-val">{soterramientoData.length}</span>
                    <span className="soterramiento-stat-lbl">Proyectos Estratégicos</span>
                  </div>
                  <div className="soterramiento-stat-box">
                    <span className="soterramiento-stat-val">{formatMoney(totalSoterramientoInversion)}</span>
                    <span className="soterramiento-stat-lbl">Inversión Total Acumulada</span>
                  </div>
                  <div className="soterramiento-stat-box">
                    <span className="soterramiento-stat-val">{totalSoterramientoKm.toFixed(2)} km</span>
                    <span className="soterramiento-stat-lbl">Longitud Total Soterrada</span>
                  </div>
                </div>

                {/* Tabla de la Matriz */}
                <div className="soterramiento-table-wrapper">
                  <table className="soterramiento-table">
                    <thead>
                      <tr>
                        <th>Nro.</th>
                        <th>Proyecto</th>
                        <th>Año</th>
                        <th>Estado</th>
                        <th>Longitud</th>
                        <th>Parroquia</th>
                        <th>Inversión (USD)</th>
                        <th>Ejecutor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soterramientoData.map((sot) => {
                        const isSelected = sot.nombre === currentSoterramientoRecord.nombre;
                        return (
                          <tr 
                            key={sot.id}
                            className={isSelected ? 'active-row' : ''}
                            onClick={() => onSelectProyecto && onSelectProyecto(sot.nombre)}
                            title="Haz clic para seleccionar este proyecto"
                          >
                            <td style={{ fontWeight: 700 }}>#{sot.nro}</td>
                            <td style={{ fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'inherit' }}>
                              {sot.nombre}
                            </td>
                            <td>{sot.ano}</td>
                            <td>
                              <span className={`status-badge-sot ${sot.estado === 'EJECUTADO' ? 'ejecutado' : 'en-ejecucion'}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                {sot.estado}
                              </span>
                            </td>
                            <td>{sot.kilometros !== null ? `${sot.kilometros} km` : '—'}</td>
                            <td>{sot.parroquia}</td>
                            <td style={{ fontWeight: 700 }}>{formatMoney(sot.inversion_telecom)}</td>
                            <td>{sot.ejecutor}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* VISTA B: SI ES UN PROYECTO CONVENCIONAL DE SENDEROS / ZONAS METRO / ESPACIO PÚBLICO */
        <>
          {/* 1. Ficha del Proyecto / Detalle de Obras y Equipamiento */}
          {(currentFichas.length > 0 || activeEquipRecord) && (
            <div className="equipamiento-section">
              <div 
                className="equipamiento-header"
                onClick={() => setShowEquipamiento(!showEquipamiento)} 
                style={{ cursor: 'pointer', userSelect: 'none', marginBottom: showEquipamiento ? '1.25rem' : '0' }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  {activeEquipRecord 
                    ? `Ficha del Proyecto y Detalle de Obras — ${getProyectoDisplayName(currentProjectObj.nombre)}`
                    : `Ficha del Proyecto — ${getProyectoDisplayName(currentProjectObj.nombre)}`}
                </span>
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s', 
                  transform: showEquipamiento ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  ▶
                </span>
              </div>

              {showEquipamiento && (
                <>
                  {activeEquipRecord && equipDataInfo?.hasTabs && (
                    <div className="equipamiento-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'total' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('total'); }}
                      >
                        Total
                      </button>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'vial' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('vial'); }}
                      >
                        Vial
                      </button>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'espacio publico' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('espacio publico'); }}
                      >
                        Espacio Público
                      </button>
                    </div>
                  )}

                  <div className="equipamiento-grid">
                    {currentFichas.length > 0 && (
                      <>
                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Building2 size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].ejecutor || '—'}</span>
                            <span className="equip-label">Ejecutor</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Calendar size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].fecha || '—'}</span>
                            <span className="equip-label">Fecha de Inauguración</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Users size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].beneficiarios || '—'}</span>
                            <span className="equip-label">Beneficiarios</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Route size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].extension || '—'}</span>
                            <span className="equip-label">Extensión</span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeEquipRecord ? (
                      activeEquipRecord.presupuesto !== null && (
                        <div className="equip-card">
                          <div className="equip-icon-wrapper orange">
                            <Coins size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value">{formatMoney(activeEquipRecord.presupuesto)}</span>
                            <span className="equip-label">Presupuesto / Inversión</span>
                          </div>
                        </div>
                      )
                    ) : (
                      Boolean(currentFichas.length > 0 && currentFichas[0]?.presupuesto) && (
                        <div className="equip-card">
                          <div className="equip-icon-wrapper orange">
                            <Coins size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].presupuesto}</span>
                            <span className="equip-label">Presupuesto / Inversión</span>
                          </div>
                        </div>
                      )
                    )}

                    {activeEquipRecord && (
                      <>
                        {activeEquipRecord.cruces_seguros !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Footprints size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.cruces_seguros)}</span>
                              <span className="equip-label">Cruces seguros</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.luminarias_instaladas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Lightbulb size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.luminarias_instaladas)}</span>
                              <span className="equip-label">Luminarias instaladas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.luminarias_reparadas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Wrench size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.luminarias_reparadas)}</span>
                              <span className="equip-label">Luminarias reparadas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.postes_intervenidos !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Zap size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.postes_intervenidos)}</span>
                              <span className="equip-label">Postes intervenidos</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.senales_instaladas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <TrafficCone size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.senales_instaladas)}</span>
                              <span className="equip-label">Señales instaladas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.pintura_vial !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Paintbrush size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.pintura_vial)}</span>
                              <span className="equip-label">Pintura vial / Muralismo</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.jardineria !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Sprout size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.jardineria)}</span>
                              <span className="equip-label">Jardinería / Paisajismo</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.mobiliario_urbano !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Sofa size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.mobiliario_urbano)}</span>
                              <span className="equip-label">Mobiliario urbano</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.bolardos !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Fence size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.bolardos)}</span>
                              <span className="equip-label">Bolardos y barandas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.acera_intervenida !== null && activeEquipRecord.acera_intervenida !== 0 && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Construction size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatLength(activeEquipRecord.acera_intervenida)}</span>
                              <span className="equip-label">Acera intervenida</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.bacheo !== null && activeEquipRecord.bacheo !== 0 && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Hammer size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.bacheo)}</span>
                              <span className="equip-label">Bacheo / Reparación vial</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.camaras !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Video size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.camaras)}</span>
                              <span className="equip-label">Cámaras de seguridad</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. Transformación Urbana: Antes y Después */}
          <AntesDespuesView 
            projectName={currentProjectObj.nombre} 
            onOpenModalImage={setModalImage} 
          />

          {/* 3. Mapa Interactivo del Proyecto */}
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapIcon size={20} color="var(--color-primary)" /> Mapa Interactivo del Proyecto
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Visualiza la ubicación geográfica y la extensión lineal del proyecto en el Distrito Metropolitano de Quito.
            </p>
            <MapboxMap 
              projectKey={normalizeText(currentProjectObj.nombre)} 
              projectName={getProyectoDisplayName(currentProjectObj.nombre)} 
            />
          </div>

          {/* 3. Encadenamiento Económico / Activaciones Comerciales y Edilicias */}
          {projectEvents && projectEvents.length > 0 && (
            <div className="card" style={{ transition: 'all 0.3s ease' }}>
              <div 
                className="eventos-header"
                onClick={() => setShowEventos(!showEventos)} 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#f59e0b" /> {projectEventData?.titulo_override || 'Encadenamiento económico: FERIAS'} — {getProyectoDisplayName(currentProjectObj.nombre)}
                </span>
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s', 
                  transform: showEventos ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  ▶
                </span>
              </div>

              {showEventos && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="eventos-grid">
                    {projectEvents.map((evento, idx) => (
                      <div key={idx} className="evento-card">
                        {evento.imagen && (
                          <div 
                            className="evento-image-wrapper"
                            onClick={() => setModalImage({
                              src: evento.imagen,
                              alt: evento.titulo,
                              title: evento.titulo,
                              edicion: evento.edicion,
                              description: evento.descripcion
                            })}
                            title="Haz clic para ver en pantalla completa"
                          >
                            <img 
                              src={evento.imagen} 
                              alt={evento.titulo} 
                              className="evento-image"
                            />
                            <div className="evento-image-zoom-hint">
                              <Maximize2 size={16} />
                              <span>Ampliar</span>
                            </div>
                          </div>
                        )}
                        <div className="evento-content">
                          <h4 className="evento-title">{evento.titulo}</h4>
                          {evento.edicion && (
                            <span 
                              className="evento-edition"
                              style={
                                evento.edicion.toLowerCase().includes('previo') || evento.edicion.toLowerCase().includes('antes')
                                  ? { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }
                                  : evento.edicion.toLowerCase().includes('finalizad') || evento.edicion.toLowerCase().includes('después') || evento.edicion.toLowerCase().includes('despues')
                                  ? { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }
                                  : {}
                              }
                            >
                              {evento.edicion}
                            </span>
                          )}
                          
                          <div className="evento-meta">
                            <div className="evento-meta-item">
                              <Calendar size={16} />
                              <span>{evento.fecha}</span>
                            </div>
                            {evento.hora && (
                              <div className="evento-meta-item">
                                <Clock size={16} />
                                <span>{evento.hora}</span>
                              </div>
                            )}
                            <div className="evento-meta-item">
                              <MapPin size={16} />
                              <span>{evento.lugar}</span>
                            </div>
                          </div>

                          <p className="evento-description">{evento.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal / Lightbox para ampliación de imagen */}
      {modalImage && (
        <div 
          className="lightbox-overlay"
          onClick={() => setModalImage(null)}
        >
          <div 
            className="lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="lightbox-close-btn"
              onClick={() => setModalImage(null)}
              title="Cerrar (Esc)"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>

            <div className="lightbox-image-wrapper">
              <img 
                src={modalImage.src} 
                alt={modalImage.alt || 'Imagen ampliada'} 
                className="lightbox-image"
              />
            </div>

            {(modalImage.title || modalImage.description) && (
              <div className="lightbox-caption">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {modalImage.title && <h3 className="lightbox-title">{modalImage.title}</h3>}
                  {modalImage.edicion && <span className="lightbox-edition">{modalImage.edicion}</span>}
                </div>
                {modalImage.description && <p className="lightbox-desc">{modalImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
