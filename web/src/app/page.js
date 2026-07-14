'use strict';
'use client';

import { useState } from 'react';
import { CATEGORIAS_INFO } from './components/categorias_info';



export default function Home() {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    return (
      <div>
        <div className="view-back-button">
          <button 
            className="btn btn-outline" 
            onClick={() => setActiveCategory(null)}
          >
            ← Volver a Áreas de Intervención
          </button>
        </div>
        {CATEGORIAS_INFO[activeCategory].content}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Áreas de Intervención</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Explora los principales ejes de intervención institucional del Distrito Metropolitano de Quito.
      </p>

      <div className="info-grid">
        {Object.entries(CATEGORIAS_INFO).map(([nombre, info]) => (
          <div key={nombre} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
              className="info-card-image" 
              style={{ backgroundImage: `url('${info.image}')` }}
            />
            <h3 style={{ marginBottom: '0.5rem' }}>{nombre}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '1.25rem' }}>
              {info.summary}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setActiveCategory(nombre)}
            >
              Ver detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
