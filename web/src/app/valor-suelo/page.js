'use strict';
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const VALOR_SUELO_CATEGORIAS = {
  'Zonas Metro': [
    'AIVAS EL EJIDO', 'AIVAS ALAMEDA', 'AIVAS CARDENAL DE LA TORRE',
    'AIVAS EL LABRADOR', 'AIVAS EL RECREO', 'AIVAS IÑAQUITO',
    'AIVAS JIPIJAPA', 'AIVAS LA CAROLINA', 'AIVAS LA MAGDALENA',
    'AIVAS LA PRADERA', 'AIVAS MORAN VALVERDE', 'AIVAS QUITUMBE',
    'AIVAS SAN FRANCISCO', 'AIVAS SOLANDA', 'AIVAS UNIVERSIDAD CENTRAL',
  ],
  'Rehabilitación del Espacio Público y Centro Histórico': [
    'AIVAS PARQUE NAVARRO', 'AIVAS BENALCAZAR', 'AIVAS ROCAFUERTE',
    'AIVAS TRIBUNA DE LOS SHYRIS',
  ],
  'Senderos Seguros': [
    'AIVAS AV. AJAVÍ', 'AIVAS LA ECUATORIANA', 'AIVAS CALLE RUIZ DE CASTILLA',
    'AIVAS CALLE RÍO DE JANEIRO', 'AIVAS COMITÉ DEL PUEBLO', 'AIVAS LA MARISCAL',
    'AIVAS RAMÓN BORJA', 'AIVAS AV. 2 DE AGOSTO', 'AIVAS AV. CARAPUNGO',
    'AIVAS COLINAS DEL NORTE', 'AIVAS CALLE CALDAS Y ANTEPARA',
    'AIVAS CALLE JUAN MONTALVO', 'AIVAS CALLE GABRIEL GARCÍA MORENO',
    'AIVAS CALLE LIZARDO RUIZ', 'AIVAS VÍAS DEL FERROCARRIL',
    'AIVAS AV. CACHA', 'AIVAS CONOCOTO', 'AIVAS NANEGALITO',
    'AIVAS PATRIA', 'AIVAS AV. MICHELENA', 'AIVAS CALLE LUIS LÓPEZ',
    'AIVAS AV. COLÓN', 'AIVAS ISLA TORTUGA',
  ],
};

const CATEGORIAS_LIST = ['Todas', 'Zonas Metro', 'Rehabilitación del Espacio Público y Centro Histórico', 'Senderos Seguros'];

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return value.toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveValorSueloCategoria(proyecto) {
  const norm = normalizeText(proyecto);
  for (const [catName, list] of Object.entries(VALOR_SUELO_CATEGORIAS)) {
    for (const item of list) {
      if (norm === normalizeText(item)) return catName;
    }
  }
  return 'Sin categoría';
}

export default function ValorSueloPage() {
  const [loading, setLoading] = useState(true);
  const [rawRecords, setRawRecords] = useState([]);
  
  // Filtros
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [selectedProyecto, setSelectedProyecto] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success && data.valorSuelo) {
          setRawRecords(data.valorSuelo);
        }
      } catch (err) {
        console.error('Error fetching land value data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Agrupar y resumir los registros por proyecto
  const proyectosResumen = useMemo(() => {
    if (rawRecords.length === 0) return [];
    
    // Agrupar por la llave normalizada del proyecto
    const grupos = {};
    rawRecords.forEach(record => {
      const pName = record.proyecto || 'Sin Nombre';
      const key = normalizeText(pName);
      if (!key) return;

      if (!grupos[key]) {
        grupos[key] = {
          proyecto: pName,
          proyectoKey: key,
          categoria: resolveValorSueloCategoria(pName),
          valores_2022: [],
          valores_2024: [],
          valores_2026: [],
          sectores: []
        };
      }

      if (record.valor_2022_2023 !== null && record.valor_2022_2023 !== undefined) {
        grupos[key].valores_2022.push(Number(record.valor_2022_2023));
      }
      if (record.valor_2024 !== null && record.valor_2024 !== undefined) {
        grupos[key].valores_2024.push(Number(record.valor_2024));
      }
      if (record.valor_2026 !== null && record.valor_2026 !== undefined) {
        grupos[key].valores_2026.push(Number(record.valor_2026));
      }
      if (record.descripcion) {
        grupos[key].sectores.push(record);
      }
    });

    // Calcular promedios
    return Object.values(grupos).map(g => {
      const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      return {
        proyecto: g.proyecto,
        proyectoKey: g.proyectoKey,
        categoria: g.categoria,
        valor_2022_2023: avg(g.valores_2022),
        valor_2024: avg(g.valores_2024),
        valor_2026: avg(g.valores_2026),
        sectores: g.sectores
      };
    }).sort((a, b) => a.proyecto.localeCompare(b.proyecto));
  }, [rawRecords]);

  // Filtrar los proyectos agrupados por categoría seleccionada
  const proyectosFiltrados = useMemo(() => {
    if (selectedCategoria === 'Todas') {
      return proyectosResumen;
    }
    return proyectosResumen.filter(p => p.categoria === selectedCategoria);
  }, [proyectosResumen, selectedCategoria]);

  // Sincronizar el proyecto seleccionado cuando cambie la categoría o los proyectos filtrados
  useEffect(() => {
    if (proyectosFiltrados.length > 0) {
      const index = proyectosFiltrados.findIndex(p => p.proyecto === selectedProyecto);
      if (index === -1) {
        setSelectedProyecto(proyectosFiltrados[0].proyecto);
      }
    } else {
      setSelectedProyecto('');
    }
  }, [proyectosFiltrados, selectedProyecto]);

  // Obtener proyecto actualmente seleccionado
  const currentProjectObj = useMemo(() => {
    return proyectosFiltrados.find(p => p.proyecto === selectedProyecto);
  }, [proyectosFiltrados, selectedProyecto]);

  // Preparar datos para gráfica Recharts
  const chartData = useMemo(() => {
    if (!currentProjectObj) return [];
    return [
      { name: '2022-2023', valor: currentProjectObj.valor_2022_2023 || 0, fill: '#64748b' },
      { name: '2024-2025', valor: currentProjectObj.valor_2024 || 0, fill: '#0f766e' },
      { name: '2026-2027', valor: currentProjectObj.valor_2026 || 0, fill: '#b45309' }
    ];
  }, [currentProjectObj]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando valor de suelo...</p>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'Sin dato';
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Valor de Suelo</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Agrupa todos los sectores de cada proyecto y compara el promedio del valor de suelo para 2022-2023, 2024-2025 y 2026-2027.
      </p>

      {/* Filtros */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Categoría</span>
          <select 
            className="filter-select"
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
          >
            {CATEGORIAS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Proyecto</span>
          <select 
            className="filter-select"
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
          >
            {proyectosFiltrados.map(p => (
              <option key={p.proyectoKey} value={p.proyecto}>{p.proyecto}</option>
            ))}
          </select>
        </div>
      </div>

      {currentProjectObj ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Gráfico y Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Gráfico Recharts */}
            <div className="card" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Comparativa de Valor de Suelo Promedio</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {currentProjectObj.proyecto}
              </p>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Valor Promedio']} />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tarjetas de Métricas de Periodos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="metric-card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                <span className="metric-label">Promedio 2022-2023</span>
                <span className="metric-value" style={{ color: '#64748b', fontSize: '2rem', display: 'block', marginTop: '0.25rem' }}>
                  {formatCurrency(currentProjectObj.valor_2022_2023)}
                </span>
              </div>
              <div className="metric-card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                <span className="metric-label">Promedio 2024-2025</span>
                <span className="metric-value" style={{ color: '#0f766e', fontSize: '2rem', display: 'block', marginTop: '0.25rem' }}>
                  {formatCurrency(currentProjectObj.valor_2024)}
                </span>
              </div>
              <div className="metric-card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                <span className="metric-label">Promedio 2026-2027</span>
                <span className="metric-value" style={{ color: '#b45309', fontSize: '2rem', display: 'block', marginTop: '0.25rem' }}>
                  {formatCurrency(currentProjectObj.valor_2026)}
                </span>
              </div>
            </div>

          </div>

          {/* Tabla de Desglose por Sector */}
          {currentProjectObj.sectores.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Sectores Utilizados en el Promedio</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Descripción / Sector</th>
                      <th>2022-2023</th>
                      <th>2024-2025</th>
                      <th>2026-2027</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProjectObj.sectores.map((sec, idx) => (
                      <tr key={idx}>
                        <td><strong>{sec.descripcion || '—'}</strong></td>
                        <td>{formatCurrency(sec.valor_2022_2023)}</td>
                        <td>{formatCurrency(sec.valor_2024)}</td>
                        <td>{formatCurrency(sec.valor_2026)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="info-alert">
          ⚠️ No hay datos de valor de suelo registrados para la categoría seleccionada.
        </div>
      )}
    </div>
  );
}
