'use strict';
'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Info, Shield, TrendingUp, Landmark } from 'lucide-react';
import InformacionGeneralView from './InformacionGeneralView';
import SeguridadView from './SeguridadView';
import EconomiaView from './EconomiaView';
import ValorSueloView from './ValorSueloView';

import soterramientoData from '@/lib/soterramiento.json';

function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const getProyectoDisplayName = (nombre) => {
  if (!nombre) return '';
  if (nombre === 'El Labrador: Bulevar y Parque de la Resiliencia') {
    return 'El Labrador';
  }
  return nombre;
};

function CategoryHubInner({
  categoryKey,
  title,
  subtitle,
  defaultSubTab = 'info-general'
}) {
  const searchParams = useSearchParams();
  const queryProyecto = searchParams ? searchParams.get('proyecto') : null;
  const queryTab = searchParams ? searchParams.get('tab') : null;

  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [loading, setLoading] = useState(true);

  const isSoterramiento = categoryKey === 'Soterramiento';
  const initializedQueryRef = useRef(false);

  const subTabs = useMemo(() => {
    if (isSoterramiento) {
      return [
        { id: 'info-general', label: 'Información General', icon: Info },
      ];
    }
    return [
      { id: 'info-general', label: 'Información General', icon: Info },
      { id: 'seguridad', label: 'Seguridad', icon: Shield },
      { id: 'economia', label: 'Economía', icon: TrendingUp },
      { id: 'valor-suelo', label: 'Valor de Suelo', icon: Landmark },
    ];
  }, [isSoterramiento]);

  // Sincronizar subpestaña inicial desde la URL si existe
  useEffect(() => {
    if (queryTab) {
      const tabMap = {
        'info': 'info-general',
        'info-general': 'info-general',
        'seguridad': 'seguridad',
        'economia': 'economia',
        'suelo': 'valor-suelo',
        'valor-suelo': 'valor-suelo'
      };
      const mapped = tabMap[queryTab];
      if (mapped) {
        if (isSoterramiento) {
          setActiveSubTab('info-general');
        } else {
          setActiveSubTab(mapped);
        }
      }
    }
  }, [queryTab, isSoterramiento]);

  useEffect(() => {
    if (isSoterramiento && activeSubTab !== 'info-general') {
      setActiveSubTab('info-general');
    }
  }, [isSoterramiento, activeSubTab]);

  // Si cambia el parámetro de proyecto en la URL, permitir re-sincronizar
  useEffect(() => {
    initializedQueryRef.current = false;
  }, [queryProyecto]);

  // Cargar proyectos disponibles desde la API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success && data.proyectos) {
          setProyectos(data.proyectos);
        }
      } catch (err) {
        console.error('Error fetching projects in CategoryHub:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Filtrar proyectos según la categoría activa
  const availableProjects = useMemo(() => {
    if (categoryKey === 'Soterramiento') {
      return soterramientoData.map(s => ({
        id: s.id,
        nombre: s.nombre,
        categoria: 'Soterramiento',
        ...s
      }));
    }

    if (!proyectos || proyectos.length === 0) return [];

    if (categoryKey === 'Corredores Vivos') {
      return proyectos.filter(p => p.categoria === 'Corredores Vivos');
    }
    if (categoryKey === 'Zonas Metro') {
      return proyectos.filter(p => p.categoria === 'Zonas Metro');
    }
    if (
      categoryKey === 'Rehabilitación del Espacio Público' ||
      categoryKey === 'Rehabilitación de Espacio Público' ||
      categoryKey === 'Rehabilitación del Espacio Público y Centro Histórico'
    ) {
      return proyectos.filter(
        p =>
          p.categoria === 'Plan de Rehabilitación Centro Histórico de Quito' ||
          p.categoria === 'Recuperación de espacios público' ||
          p.categoria === 'Rehabilitación del Espacio Público'
      );
    }
    return proyectos.filter(p => p.categoria === categoryKey);
  }, [proyectos, categoryKey]);

  // Inicializar o ajustar el proyecto seleccionado
  useEffect(() => {
    if (availableProjects.length > 0) {
      if (queryProyecto && !initializedQueryRef.current) {
        const normQuery = normalizeText(queryProyecto);
        const matched = availableProjects.find(p => {
          const normNombre = normalizeText(p.nombre);
          const normDb = normalizeText(p.db_nombre_oficial || '');
          const normId = normalizeText(p.id || '');
          return normNombre === normQuery || normDb === normQuery || normId === normQuery ||
                 normNombre.includes(normQuery) || normQuery.includes(normNombre);
        });
        if (matched) {
          setSelectedProyecto(matched.nombre);
          initializedQueryRef.current = true;
          return;
        }
      }

      const exists = availableProjects.some(p => p.nombre === selectedProyecto);
      if (!exists) {
        setSelectedProyecto(availableProjects[0].nombre);
      }
    } else {
      setSelectedProyecto('');
    }
  }, [availableProjects, queryProyecto, selectedProyecto]);

  return (
    <div className="category-hub">
      {/* 1. Encabezado de la Categoría */}
      <div className="category-hub-header">
        <div className="category-hub-title-wrapper">
          <h1 className="category-hub-title">{title || categoryKey}</h1>
          {subtitle && <p className="category-hub-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* 2. Selector de Proyecto / Intervención (PRIMERO) */}
      {availableProjects.length > 0 && (
        <div className="filter-row" style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
          <div className="filter-group" style={{ flexGrow: 1 }}>
            <span className="filter-label">PROYECTO / INTERVENCIÓN</span>
            <select
              className="filter-select"
              value={selectedProyecto}
              onChange={(e) => {
                initializedQueryRef.current = true;
                setSelectedProyecto(e.target.value);
              }}
            >
              {availableProjects.map((p) => (
                <option key={p.id || p.nombre} value={p.nombre}>
                  {getProyectoDisplayName(p.nombre)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Subpestañas (SEGUNDO, DEBAJO DEL SELECTOR) */}
      <nav className="subnav-tabs-wrapper" style={{ marginBottom: '1.5rem' }}>
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

      {/* 4. Contenido de la Subpestaña Activa con Proyecto Persistente */}
      <div className="subnav-content-container">
        {activeSubTab === 'info-general' && (
          <div className="subtab-panel fade-in">
            <InformacionGeneralView
              fixedCategoria={categoryKey}
              externalSelectedProyecto={selectedProyecto}
              onSelectProyecto={setSelectedProyecto}
            />
          </div>
        )}

        {activeSubTab === 'seguridad' && (
          <div className="subtab-panel fade-in">
            <SeguridadView
              fixedCategoria={categoryKey}
              hideCategorySelector={true}
              hideProjectSelector={true}
              externalSelectedProyecto={selectedProyecto}
              onSelectProyecto={setSelectedProyecto}
            />
          </div>
        )}

        {activeSubTab === 'economia' && (
          <div className="subtab-panel fade-in">
            <EconomiaView
              fixedCategoria={categoryKey}
              hideCategorySelector={true}
              hideProjectSelector={true}
              externalSelectedProyecto={selectedProyecto}
              onSelectProyecto={setSelectedProyecto}
            />
          </div>
        )}

        {activeSubTab === 'valor-suelo' && (
          <div className="subtab-panel fade-in">
            <ValorSueloView
              fixedCategoria={categoryKey}
              hideCategorySelector={true}
              hideProjectSelector={true}
              externalSelectedProyecto={selectedProyecto}
              onSelectProyecto={setSelectedProyecto}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryHub(props) {
  return (
    <Suspense fallback={<div className="category-hub" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando información...</div>}>
      <CategoryHubInner {...props} />
    </Suspense>
  );
}

