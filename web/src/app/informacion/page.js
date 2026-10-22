'use strict';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIAS_INFO } from '../components/categorias_info';
import { ArrowRight, CalendarClock, Sparkles, MapPin, Building2, Layers } from 'lucide-react';

const CATEGORY_ROUTES = {
  'Corredores Vivos': '/corredores-vivos',
  'Zonas Metro': '/zonas-metro',
  'Rehabilitación del Espacio Público': '/rehabilitacion-espacio-publico',
  'Soterramiento': '/soterramiento',
  'Quitopia': '/centralidades',
  'Recuperación Urbana Av. 10 de Agosto': '/centralidades',
  'Arena del Bicentenario': '/centralidades',
  'Arena del Sur': '/centralidades',
  'Repotenciación Parque Bicentenario': '/centralidades'
};

// Claves de los proyectos que corresponden a la viñeta desplegable de Proyectos Planificados
const PROYECTOS_PLANIFICADOS_KEYS = [
  'Arena del Bicentenario',
  'Arena del Sur',
  'Repotenciación Parque Bicentenario'
];

export default function InformacionPage() {
  const [activeCategory, setActiveCategory] = useState(null);

  // Separar categorías principales de los proyectos planificados
  const mainCategories = Object.entries(CATEGORIAS_INFO).filter(
    ([nombre]) => !PROYECTOS_PLANIFICADOS_KEYS.includes(nombre)
  );

  const plannedProjects = Object.entries(CATEGORIAS_INFO).filter(
    ([nombre]) => PROYECTOS_PLANIFICADOS_KEYS.includes(nombre)
  );

  if (activeCategory) {
    return (
      <div className="category-hub" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="view-back-button" style={{ marginBottom: '1.5rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setActiveCategory(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px' }}
          >
            ← Volver a Áreas de Intervención
          </button>
        </div>
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          {CATEGORIAS_INFO[activeCategory]?.content}
        </div>
      </div>
    );
  }

  const renderCard = (nombre, info, isPlanned = false) => {
    const targetRoute = CATEGORY_ROUTES[nombre] || '/centralidades';
    return (
      <div 
        key={nombre} 
        className="card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '14px', 
          overflow: 'hidden', 
          border: isPlanned ? '1px solid #fed7aa' : '1px solid #e2e8f0',
          boxShadow: isPlanned ? '0 4px 14px rgba(249, 115, 22, 0.07)' : '0 4px 12px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          position: 'relative',
          transition: 'all 0.25s ease'
        }}
      >
        <div 
          className="info-card-image" 
          style={{ 
            height: '190px',
            backgroundImage: `url('${info.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: isPlanned ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            position: 'relative'
          }}
        >
          {isPlanned && (
            <span 
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(254, 243, 199, 0.95)',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(4px)'
              }}
            >
              <span>📌</span> Planificado
            </span>
          )}
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <h3 style={{ marginBottom: '0.65rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {nombre}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.55, flexGrow: 1, marginBottom: '1.5rem' }}>
            {info.summary}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0.6rem 0.8rem', borderRadius: '8px' }}
              onClick={() => setActiveCategory(nombre)}
            >
              Ficha Técnica
            </button>
            <Link 
              href={targetRoute}
              className="btn btn-primary" 
              style={{ 
                fontSize: '0.88rem', 
                fontWeight: 600, 
                padding: '0.6rem 0.8rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                textDecoration: 'none'
              }}
            >
              <span>Ir a Datos</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Cabecera Principal */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Municipio del Distrito Metropolitano de Quito
        </span>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
          Áreas de Intervención Estratégica
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '850px', lineHeight: 1.5 }}>
          Conozca los principales ejes institucionales de regeneración urbana, seguridad ciudadana, dinamización comercial y puesta en valor del suelo en el Distrito Metropolitano de Quito.
        </p>
      </div>

      {/* 1. Ejes y Programas Principales (Ejecutados y en Proceso) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Ejes Programáticos de Intervención Urbana
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Planes y proyectos emblemáticos de ejecución continua en el territorio metropolitano.
            </p>
          </div>
          <span 
            style={{ 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              background: '#eff6ff', 
              color: '#1d4ed8', 
              border: '1px solid #bfdbfe', 
              padding: '4px 12px', 
              borderRadius: '999px' 
            }}
          >
            {mainCategories.length} Ejes Activos
          </span>
        </div>

        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {mainCategories.map(([nombre, info]) => renderCard(nombre, info, false))}
        </div>
      </div>

      {/* 2. CATEGORÍA PERMANENTE DE PROYECTOS PLANIFICADOS */}
      <div 
        className="planned-projects-permanent-section"
        style={{
          marginTop: '3.5rem',
          borderRadius: '16px',
          border: '1.5px solid #fed7aa',
          background: 'linear-gradient(180deg, #fffaf5 0%, #ffffff 100%)',
          boxShadow: '0 6px 24px rgba(249, 115, 22, 0.06)',
          overflow: 'hidden'
        }}
      >
        {/* Encabezado Permanente */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 1.75rem 1.25rem 1.75rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flex: 1, minWidth: '260px' }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: '#ffedd5', 
                color: '#ea580c', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #fdba74'
              }}
            >
              <CalendarClock size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cartera de Inversión y Planificación DMQ
                </span>
                <span 
                  style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    background: '#ea580c', 
                    color: '#ffffff', 
                    padding: '2px 8px', 
                    borderRadius: '999px' 
                  }}
                >
                  {plannedProjects.length} Proyectos
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0 0' }}>
                Proyectos Planificados
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Megaproyectos de renovación y equipamiento urbano en fases de estructuración técnica y preinversión.
              </p>
            </div>
          </div>

          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              background: '#fff7ed', 
              color: '#c2410c', 
              border: '1px solid #fed7aa', 
              padding: '0.45rem 1rem', 
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <span>📌 Cartera Estratégica</span>
          </div>
        </div>

        {/* Contenido Permanente Visible */}
        <div style={{ padding: '0 1.75rem 1.75rem 1.75rem', borderTop: '1px solid #fed7aa', paddingTop: '1.25rem' }}>
          <div 
            style={{ 
              marginBottom: '1.5rem', 
              padding: '0.85rem 1.1rem', 
              background: '#fff7ed', 
              border: '1px solid #ffedd5', 
              borderRadius: '10px', 
              fontSize: '0.88rem', 
              color: '#9a3412',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={16} style={{ flexShrink: 0, color: '#ea580c' }} />
            <span>
              Los siguientes proyectos corresponden a iniciativas estratégicas en estructuración (<strong>Arena del Bicentenario</strong>, <strong>Arena del Sur</strong> y <strong>Repotenciación Parque Bicentenario</strong>) con estudios de diseño e impacto territorial.
            </span>
          </div>

          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {plannedProjects.map(([nombre, info]) => renderCard(nombre, info, true))}
          </div>
        </div>
      </div>
    </div>
  );
}
