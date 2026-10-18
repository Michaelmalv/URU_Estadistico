'use strict';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIAS_INFO } from '../components/categorias_info';
import { ArrowRight, Layers, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

const CATEGORY_ROUTES = {
  'Corredores Vivos': '/corredores-vivos',
  'Zonas Metro': '/zonas-metro',
  'Rehabilitación del Espacio Público': '/rehabilitacion-espacio-publico',
  'Soterramiento': '/soterramiento'
};

export default function InformacionPage() {
  const [activeCategory, setActiveCategory] = useState(null);

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

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1360px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
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

      <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {Object.entries(CATEGORIAS_INFO).map(([nombre, info]) => {
          const targetRoute = CATEGORY_ROUTES[nombre] || '/';
          return (
            <div 
              key={nombre} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: '14px', 
                overflow: 'hidden', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                background: '#ffffff',
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
                  borderBottom: '1px solid #e2e8f0'
                }}
              />
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
        })}
      </div>
    </div>
  );
}
