'use client';

import React, { useState } from 'react';
import { 
  Images, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Layers, 
  Eye,
  Camera
} from 'lucide-react';
import galeriaData from '@/lib/galeria_proyectos.json';

const normalize = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

export default function GaleriaProyectoView({ projectName, onOpenModalImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!projectName) return null;

  const normalizedQuery = normalize(projectName);
  const galleryConfig = galeriaData.find(g => {
    const itemNorm = normalize(g.proyecto);
    return itemNorm === normalizedQuery || 
           normalizedQuery.includes(itemNorm) || 
           itemNorm.includes(normalizedQuery);
  });

  if (!galleryConfig || !galleryConfig.imagenes || galleryConfig.imagenes.length === 0) {
    return null;
  }

  const images = galleryConfig.imagenes;
  const currentImage = images[currentIndex] || images[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (onOpenModalImage) {
      onOpenModalImage({
        src: currentImage.src,
        alt: currentImage.alt || currentImage.titulo,
        title: `${currentIndex + 1}. ${currentImage.titulo}`,
        edicion: currentImage.etiqueta,
        description: currentImage.descripcion
      });
    }
  };

  return (
    <div className="card project-gallery-card" style={{ marginBottom: '2rem' }}>
      {/* Encabezado */}
      <div className="project-gallery-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="gallery-header-icon">
            <Camera size={22} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {galleryConfig.titulo || `Imágenes del Proyecto — ${projectName}`}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {galleryConfig.subtitulo || 'Fotografía aérea y espacial de la intervención'}
            </p>
          </div>
        </div>

        {/* Contador de Imágenes */}
        <div className="gallery-counter-badge">
          <Layers size={14} />
          <span>Imagen {currentIndex + 1} de {images.length}</span>
        </div>
      </div>

      {/* Visor Principal con Carrusel */}
      <div className="gallery-viewport-container">
        {/* Flecha Izquierda (si hay más de 1 imagen) */}
        {images.length > 1 && (
          <button 
            className="gallery-nav-arrow left" 
            onClick={handlePrev}
            title="Imagen anterior (Flecha Izquierda)"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Contenedor de la Imagen */}
        <div 
          className="gallery-image-main-wrapper"
          onClick={handleImageClick}
          title="Haz clic para ampliar en pantalla completa"
        >
          <img 
            key={currentImage.src}
            src={currentImage.src} 
            alt={currentImage.alt || currentImage.titulo} 
            className="gallery-main-image"
          />

          {/* Overlay con pista de ampliación y etiqueta */}
          <div className="gallery-image-overlay">
            <div className="gallery-overlay-top">
              {currentImage.etiqueta && (
                <span className="gallery-tag-pill">
                  {currentImage.etiqueta}
                </span>
              )}
              <div className="gallery-zoom-button">
                <Maximize2 size={16} />
                <span>Ampliar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flecha Derecha (si hay más de 1 imagen) */}
        {images.length > 1 && (
          <button 
            className="gallery-nav-arrow right" 
            onClick={handleNext}
            title="Imagen siguiente (Flecha Derecha)"
            aria-label="Imagen siguiente"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Descripción y Detalles de la Imagen Actual */}
      <div className="gallery-caption-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--color-primary)' }}>#{currentIndex + 1}</span> {currentImage.titulo}
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card-alt, rgba(0,0,0,0.05))', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            {currentImage.tipo || 'Fotografía en Alta Definición'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          {currentImage.descripcion}
        </p>
      </div>

      {/* Selector de Miniaturas / Botones Directos */}
      <div 
        className="gallery-thumbnails-row"
        style={images.length === 1 ? { gridTemplateColumns: '1fr' } : {}}
      >
        {images.map((img, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              className={`gallery-thumb-btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              title={`Ver: ${img.titulo}`}
            >
              <div className="gallery-thumb-preview">
                <img src={img.src} alt={img.titulo} />
                <span className="gallery-thumb-number">{idx + 1}</span>
              </div>
              <div className="gallery-thumb-info">
                <span className="gallery-thumb-label">{img.etiqueta || `Foto ${idx + 1}`}</span>
                <span className="gallery-thumb-sub">
                  {img.subtitulo || img.titulo}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
