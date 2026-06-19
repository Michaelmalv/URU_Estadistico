'use strict';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { TrendingUp, RotateCw } from 'lucide-react';

const getProyectoDisplayName = (nombre) => {
  if (nombre === 'El Labrador: Bulevar y Parque de la Resiliencia') {
    return 'El Labrador';
  }
  return nombre;
};

export default function EconomiaPage() {
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [proyectos, setProyectos] = useState([]);
  
  // Filtros
  const [categoriaUi, setCategoriaUi] = useState('Todas');
  const [fechaFilter, setFechaFilter] = useState('Todas');
  const [selectedProyecto, setSelectedProyecto] = useState('');

  // Resultados
  const [economiaResult, setEconomiaResult] = useState(null);

  // Cargar proyectos iniciales
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success) {
          setProyectos(data.proyectos);
        }
      } catch (err) {
        console.error('Error fetching initial projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  // Filtrar proyectos según los filtros de UI
  const getProyectosFiltrados = useCallback(() => {
    return proyectos.filter(p => {
      // Filtrar por categoría
      if (categoriaUi !== 'Todas') {
        if (categoriaUi === 'Rehabilitación de Espacio Público') {
          if (p.categoria !== 'Recuperación de espacios público' && p.categoria !== 'Plan de Rehabilitación Centro Histórico de Quito') {
            return false;
          }
        } else {
          const catMap = {
            'Senderos Seguros': 'Senderos Seguros',
            'Zonas Metro': 'Zonas Metro'
          };
          if (p.categoria !== catMap[categoriaUi]) return false;
        }
      }

      // Filtrar por fecha
      const tieneFecha = p.fecha_inauguracion && p.fecha_inauguracion.trim() !== '' && p.fecha_inauguracion.toLowerCase() !== 'no';
      if (fechaFilter === 'Con fecha de inauguración/entrega' && !tieneFecha) return false;
      if (fechaFilter === 'Sin fecha de inauguración/entrega' && tieneFecha) return false;

      return true;
    });
  }, [proyectos, categoriaUi, fechaFilter]);

  const proyectosFiltrados = getProyectosFiltrados();

  // Resetear el proyecto seleccionado al cambiar los filtros
  useEffect(() => {
    if (proyectosFiltrados.length > 0) {
      // Evitar resetear innecesariamente si el proyecto actual sigue disponible
      const index = proyectosFiltrados.findIndex(p => p.nombre === selectedProyecto);
      if (index === -1) {
        setSelectedProyecto(proyectosFiltrados[0].nombre);
      }
    } else {
      setSelectedProyecto('');
    }
  }, [proyectosFiltrados, selectedProyecto]);

  // Cargar estadísticas económicas del proyecto seleccionado
  const fetchEconomiaStats = useCallback(async (proyectoNombre) => {
    if (!proyectoNombre) {
      setEconomiaResult(null);
      return;
    }
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/economia?sector=${encodeURIComponent(proyectoNombre)}`);
      const data = await res.json();
      if (data.success) {
        setEconomiaResult(data);
      } else {
        setEconomiaResult(null);
      }
    } catch (err) {
      console.error('Error loading economy statistics:', err);
      setEconomiaResult(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchEconomiaStats(selectedProyecto);
  }, [selectedProyecto, fetchEconomiaStats]);

  if (loadingProjects) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando filtros y proyectos...</p>
      </div>
    );
  }

  // Preparar consistencia
  const abiertosCalc = economiaResult?.abiertos || 0;
  const renovadosCalc = economiaResult?.renovados || 0;
  const abiertosMov = economiaResult?.control_mov?.emision || 0;
  const renovadosMov = economiaResult?.control_mov?.renovacion || 0;
  const showConsistencyError = (abiertosCalc !== abiertosMov || renovadosCalc !== renovadosMov);

  // Formatear referencia para subtítulo de gráfica
  const getReferenciaTxt = () => {
    if (!economiaResult?.fecha_referencia) return 'sin fecha de referencia';
    const ref = economiaResult.fecha_referencia;
    if (ref.precision === 'year') return `año ${ref.year}`;
    if (ref.precision === 'month') {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${meses[ref.month - 1]} ${ref.year}`;
    }
    // Date standard
    return new Date(ref.date).toLocaleDateString('es-EC');
  };

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Conteo Económico por Sector</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Cruza las fechas de las patentes y permisos económicos con la entrega del proyecto para analizar aperturas y renovaciones.
      </p>

      {/* Fila de Filtros */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Categoría</span>
          <select 
            className="filter-select"
            value={categoriaUi}
            onChange={(e) => setCategoriaUi(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Senderos Seguros">Senderos Seguros</option>
            <option value="Zonas Metro">Zonas Metro</option>
            <option value="Rehabilitación de Espacio Público">Rehabilitación de Espacio Público</option>
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Fecha de Inauguración</span>
          <select 
            className="filter-select"
            value={fechaFilter}
            onChange={(e) => setFechaFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Con fecha de inauguración/entrega">Con fecha de inauguración/entrega</option>
            <option value="Sin fecha de inauguración/entrega">Sin fecha de inauguración/entrega</option>
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Sector</span>
          <select 
            className="filter-select"
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
          >
            {proyectosFiltrados.map(p => (
              <option key={p.id} value={p.nombre}>{getProyectoDisplayName(p.nombre)}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingStats ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Analizando cruces económicos...</p>
        </div>
      ) : economiaResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Métricas Rápidas */}
          <div className="metric-row">
            <div className="metric-card metric-card-horizontal metric-card-abiertos">
              <div className="metric-icon-wrapper">
                <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Negocios Abiertos (Nuevos)</span>
                <span className="metric-value">{abiertosCalc}</span>
              </div>
            </div>
            <div className="metric-card metric-card-horizontal metric-card-renovados">
              <div className="metric-icon-wrapper">
                <RotateCw size={24} strokeWidth={2.5} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Negocios Renovados</span>
                <span className="metric-value">{renovadosCalc}</span>
              </div>
            </div>
          </div>

          {/* Consistencia */}
          {showConsistencyError && (
            <div className="info-alert" style={{ backgroundColor: 'rgba(192, 57, 43, 0.08)', borderLeftColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
              ⚠️ Diferencia en control de consistencia: Abiertos graficados = {abiertosCalc} (por Emisión = {abiertosMov}); Renovados graficados = {renovadosCalc} (por Renovación = {renovadosMov}).
            </div>
          )}

          {/* Gráfico y Tabla */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Gráfico */}
            <div className="card" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Comparativa económica: {getProyectoDisplayName(selectedProyecto)}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Referencia: {economiaResult.fecha_txt} | Comparación con {getReferenciaTxt()}.
              </p>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={economiaResult.resumen} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="categoria" 
                      tickFormatter={(v) => v === 'abierto' ? 'Abiertos' : 'Renovados'}
                      tick={{ fontSize: 12, fontWeight: 'bold' }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name, props) => [value, props.payload.categoria === 'abierto' ? 'Abiertos' : 'Renovados']} />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={80}>
                      {economiaResult.resumen.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.categoria === 'abierto' ? '#27ae60' : '#1f4e79'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla y Excluidos */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3>Resumen de Registros Comerciales</h3>
              <div className="table-container" style={{ marginTop: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Abiertos (Emisión)</strong></td>
                      <td>{abiertosCalc}</td>
                    </tr>
                    <tr>
                      <td><strong>Renovados</strong></td>
                      <td>{renovadosCalc}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {economiaResult.excluidos_fecha > 0 && (
                <div className="info-alert" style={{ margin: 0 }}>
                  ℹ️ Registros comerciales excluidos por estar impresos antes de la fecha de inauguración del proyecto: <strong>{economiaResult.excluidos_fecha}</strong>
                </div>
              )}

              {economiaResult.fecha_referencia && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Fecha base de referencia: <strong>{economiaResult.fecha_txt}</strong>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="info-alert">
          ⚠️ No se encontraron registros de patentes económicas para este sector en los archivos cargados.
        </div>
      )}
    </div>
  );
}
