'use strict';
'use client';

import { useState } from 'react';
import { CATEGORIAS_INFO } from './components/categorias_info';
import VisorTerritorialView from './components/VisorTerritorialView';
import { Compass, LayoutGrid, Layers } from 'lucide-react';

export default function Home() {
  const [homeView, setHomeView] = useState('visor'); // 'visor' | 'ejes'
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
      {/* Selector de Vista Principal */}
      <div className="home-view-switcher">
        <button
          className={`home-switch-btn ${homeView === 'visor' ? 'active' : ''}`}
          onClick={() => setHomeView('visor')}
        >
          <Compass size={18} />
          <span>Visor Territorial 360°</span>
        </button>
        <button
          className={`home-switch-btn ${homeView === 'ejes' ? 'active' : ''}`}
          onClick={() => setHomeView('ejes')}
        >
          <LayoutGrid size={18} />
          <span>Ejes Estratégicos</span>
        </button>
      </div>

      {homeView === 'visor' ? (
        <VisorTerritorialView />
      ) : (
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
      )}
    </div>
  );
}

