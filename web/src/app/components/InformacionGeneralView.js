'use strict';
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import equipamientoData from '@/lib/equipamiento.json';
import eventosData from '@/lib/eventos.json';
import AntesDespuesView from './AntesDespuesView';
import { 
  Building2, Calendar, Users, Route, Clock, MapPin, X, Maximize2,
  Coins, Footprints, Lightbulb, Wrench, Zap, TrafficCone, Paintbrush, 
  Sprout, Sofa, Fence, Construction, Video, Hammer, Info, Map as MapIcon, Sparkles
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

  const currentProjectObj = proyectos.find(p => p.nombre === selectedProyecto);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando información general del proyecto...</p>
      </div>
    );
  }

  if (!currentProjectObj) {
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
              {activeEquipRecord && equipDataInfo.hasTabs && (
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
                  currentFichas.length > 0 && currentFichas[0].presupuesto && (
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
