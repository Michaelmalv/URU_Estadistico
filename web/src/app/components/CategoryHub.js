'use strict';
'use client';

import { useState } from 'react';
import { Shield, TrendingUp, Landmark } from 'lucide-react';
import SeguridadView from './SeguridadView';
import EconomiaView from './EconomiaView';
import ValorSueloView from './ValorSueloView';

export default function CategoryHub({
  categoryKey,
  title,
  subtitle,
  defaultSubTab = 'seguridad'
}) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  const subTabs = [
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'economia', label: 'Economía', icon: TrendingUp },
    { id: 'valor-suelo', label: 'Valor de Suelo', icon: Landmark },
  ];

  return (
    <div className="category-hub">
      {/* Encabezado de la Categoría */}
      <div className="category-hub-header">
        <div className="category-hub-title-wrapper">
          <h1 className="category-hub-title">{title || categoryKey}</h1>
          {subtitle && <p className="category-hub-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* Barra de Subpestañas */}
      <nav className="subnav-tabs-wrapper">
        <div className="subnav-tabs">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`subnav-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contenido de la Subpestaña Activa */}
      <div className="subnav-content-container">
        {activeSubTab === 'seguridad' && (
          <div className="subtab-panel fade-in">
            <SeguridadView fixedCategoria={categoryKey} hideCategorySelector={true} />
          </div>
        )}

        {activeSubTab === 'economia' && (
          <div className="subtab-panel fade-in">
            <EconomiaView fixedCategoria={categoryKey} hideCategorySelector={true} />
          </div>
        )}

        {activeSubTab === 'valor-suelo' && (
          <div className="subtab-panel fade-in">
            <ValorSueloView fixedCategoria={categoryKey} hideCategorySelector={true} />
          </div>
        )}
      </div>
    </div>
  );
}
