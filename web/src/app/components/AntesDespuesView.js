'use strict';
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import antesDespuesData from '@/lib/antes_despues.json';
import { 
  Columns, SlidersHorizontal, Maximize2, X, Sparkles, Clock, 
  CheckCircle2, AlertCircle, ArrowLeftRight
} from 'lucide-react';

const getProyectoDisplayName = (nombre) => {
  if (nombre === 'El Labrador: Bulevar y Parque de la Resiliencia') {
    return 'El Labrador';
  }
  return nombre;
};

export default function AntesDespuesView({ projectName, onOpenModalImage = null }) {
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showSection, setShowSection] = useState(true);
  const [localModalImage, setLocalModalImage] = useState(null);

  const containerRef = useRef(null);

  // Buscar los datos de antes/después del proyecto
  const projectData = antesDespuesData.find(
    p => p.proyecto.toLowerCase().trim() === (projectName || '').toLowerCase().trim()
  );

  // Si no hay datos registrados para este proyecto, no renderizar o devolver null
  if (!projectData || !projectData.antes || !projectData.despues) {
    return null;
  }

  const handleOpenImage = (imgObj, tipo) => {
    const payload = {
      src: imgObj.imagen,
      alt: `${projectData.titulo} — ${tipo}`,
      title: `${projectData.titulo} (${tipo})`,
      edicion: imgObj.fecha || tipo,
      description: imgObj.descripcion || projectData.descripcion
    };
    if (onOpenModalImage) {
      onOpenModalImage(payload);
    } else {
      setLocalModalImage(payload);
    }
  };

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="card antes-despues-card" style={{ transition: 'all 0.3s ease' }}>
      {/* Header Colapsable */}
      <div 
        className="antes-despues-header"
        onClick={() => setShowSection(!showSection)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          paddingBottom: showSection ? '1.25rem' : '0',
          borderBottom: showSection ? '1px solid var(--border-color)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="antes-despues-icon-badge">
            <ArrowLeftRight size={20} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Transformación Urbana: Antes y Después — {getProyectoDisplayName(projectName)}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {projectData.subtitulo || 'Comparativa visual de intervención y modernización del espacio público'}
            </p>
          </div>
        </div>

        <span style={{ 
          display: 'inline-block', 
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          transition: 'transform 0.2s', 
          transform: showSection ? 'rotate(90deg)' : 'rotate(0deg)' 
        }}>
          ▶
        </span>
      </div>

      {showSection && (
        <div style={{ marginTop: '1.5rem' }}>
          {/* Barra de Controles y Selector de Modo */}
          <div className="antes-despues-toolbar">
            <p className="antes-despues-desc-text">
              {projectData.descripcion}
            </p>

            <div className="antes-despues-mode-tabs">
              <button
                type="button"
                className={`antes-despues-mode-btn ${viewMode === 'slider' ? 'active' : ''}`}
                onClick={() => setViewMode('slider')}
                title="Deslizador interactivo para comparar"
              >
                <SlidersHorizontal size={16} />
                <span>Deslizador</span>
              </button>
              <button
                type="button"
                className={`antes-despues-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => setViewMode('side-by-side')}
                title="Ver ambas fotos lado a lado"
              >
                <Columns size={16} />
                <span>Lado a Lado</span>
              </button>
            </div>
          </div>

          {/* MODO 1: DESLIZADOR INTERACTIVO (SLIDER) */}
          {viewMode === 'slider' && (
            <div className="antes-despues-slider-wrapper">
              <div 
                ref={containerRef}
                className="antes-despues-slider-container"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  handleMove(e.clientX);
                }}
                onTouchStart={(e) => {
                  setIsDragging(true);
                  if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
                }}
              >
                {/* Imagen DESPUÉS (Fondo base) */}
                <img 
                  src={projectData.despues.imagen} 
                  alt={projectData.despues.etiqueta}
                  className="antes-despues-img-base"
                />

                {/* Imagen ANTES (Capa recortada arriba) */}
                <div 
                  className="antes-despues-img-overlay"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img 
                    src={projectData.antes.imagen} 
                    alt={projectData.antes.etiqueta}
                    className="antes-despues-img-top"
                  />
                </div>

                {/* Línea divisoria y manija interactiva */}
                <div 
                  className="antes-despues-divider-line"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="antes-despues-handle">
                    <ArrowLeftRight size={18} color="#ffffff" />
                  </div>
                </div>

                {/* Badges Flotantes de Estado */}
                <div className="antes-despues-badge badge-antes">
                  <span className="badge-dot dot-antes"></span>
                  <span>ANTES</span>
                </div>

                <div className="antes-despues-badge badge-despues">
                  <span className="badge-dot dot-despues"></span>
                  <span>DESPUÉS</span>
                </div>

                {/* Botón para abrir en pantalla completa la vista activa */}
                <button
                  type="button"
                  className="antes-despues-zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImage(sliderPosition > 50 ? projectData.antes : projectData.despues, sliderPosition > 50 ? 'ANTES' : 'DESPUÉS');
                  }}
                  title="Ampliar imagen"
                >
                  <Maximize2 size={16} />
                  <span>Ampliar</span>
                </button>
              </div>

              {/* Control de barra deslizante inferior para accesibilidad */}
              <div className="antes-despues-slider-controls">
                <span className="slider-label-hint">◀ Desliza para comparar la transformación ▶</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="antes-despues-range-input"
                  aria-label="Posición de comparación antes y después"
                />
              </div>
            </div>
          )}

          {/* MODO 2: LADO A LADO (DUAL CARDS) */}
          {viewMode === 'side-by-side' && (
            <div className="antes-despues-grid">
              {/* Tarjeta ANTES */}
              <div className="antes-despues-card-item card-antes">
                <div className="card-item-header">
                  <div className="card-item-badge badge-antes-pill">
                    <span className="badge-dot dot-antes"></span>
                    <span>ANTES</span>
                  </div>
                  {projectData.antes.fecha && (
                    <span className="card-item-date">
                      <Clock size={14} /> {projectData.antes.fecha}
                    </span>
                  )}
                </div>

                <div 
                  className="card-item-image-wrapper"
                  onClick={() => handleOpenImage(projectData.antes, 'ANTES')}
                  title="Haz clic para ampliar la imagen del ANTES"
                >
                  <img 
                    src={projectData.antes.imagen} 
                    alt={projectData.antes.etiqueta}
                    className="card-item-img"
                  />
                  <div className="card-item-zoom-hint">
                    <Maximize2 size={16} />
                    <span>Ampliar</span>
                  </div>
                </div>

                <div className="card-item-caption">
                  <p>{projectData.antes.descripcion}</p>
                </div>
              </div>

              {/* Tarjeta DESPUÉS */}
              <div className="antes-despues-card-item card-despues">
                <div className="card-item-header">
                  <div className="card-item-badge badge-despues-pill">
                    <span className="badge-dot dot-despues"></span>
                    <span>DESPUÉS</span>
                  </div>
                  {projectData.despues.fecha && (
                    <span className="card-item-date">
                      <CheckCircle2 size={14} color="#10b981" /> {projectData.despues.fecha}
                    </span>
                  )}
                </div>

                <div 
                  className="card-item-image-wrapper"
                  onClick={() => handleOpenImage(projectData.despues, 'DESPUÉS')}
                  title="Haz clic para ampliar la imagen del DESPUÉS"
                >
                  <img 
                    src={projectData.despues.imagen} 
                    alt={projectData.despues.etiqueta}
                    className="card-item-img"
                  />
                  <div className="card-item-zoom-hint">
                    <Maximize2 size={16} />
                    <span>Ampliar</span>
                  </div>
                </div>

                <div className="card-item-caption">
                  <p>{projectData.despues.descripcion}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Lightbox Local si no se provee controlador externo */}
      {localModalImage && (
        <div 
          className="lightbox-overlay"
          onClick={() => setLocalModalImage(null)}
        >
          <div 
            className="lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="lightbox-close-btn"
              onClick={() => setLocalModalImage(null)}
              title="Cerrar (Esc)"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>

            <div className="lightbox-image-wrapper">
              <img 
                src={localModalImage.src} 
                alt={localModalImage.alt || 'Imagen ampliada'} 
                className="lightbox-image"
              />
            </div>

            {(localModalImage.title || localModalImage.description) && (
              <div className="lightbox-caption">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {localModalImage.title && <h3 className="lightbox-title">{localModalImage.title}</h3>}
                  {localModalImage.edicion && <span className="lightbox-edition">{localModalImage.edicion}</span>}
                </div>
                {localModalImage.description && <p className="lightbox-desc">{localModalImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
