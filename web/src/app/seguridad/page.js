'use strict';
'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import dynamic from 'next/dynamic';

const MapboxMap = dynamic(() => import('../components/MapboxMap'), { ssr: false });

const INCIDENTES = [
  'Daño a propiedad pública y privada',
  'Escándalos',
  'Eventos clandestinos',
  'Libadores',
  'Venta y consumo de sustancias',
];
const DELITOS = [
  'Robo a carros', 'Robo a motos', 'Robo a personas',
  'Robo a unidades económicas', 'Robo de autopartes', 'Robo a domicilios',
];
const ALL_VARS = [...INCIDENTES, ...DELITOS];
const PERIODOS = ['2023', '2024', '2025', '2026*'];

function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const getProyectoDisplayName = (nombre) => {
  if (nombre === 'El Labrador: Bulevar y Parque de la Resiliencia') {
    return 'El Labrador';
  }
  return nombre;
};

export default function SeguridadPage() {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [seguridadData, setSeguridadData] = useState([]);
  const [fichas, setFichas] = useState([]);
  
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState('');
  
  const [añosAnterior, setAñosAnterior] = useState(['2024']);
  const [añosActual, setAñosActual] = useState(['2025']);

  const [catalogoImagenes, setCatalogoImagenes] = useState({});

  // Cargar datos al montar
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.success) {
          setProyectos(data.proyectos);
          setSeguridadData(data.seguridad);
          setFichas(data.fichas);
          
          // Extraer categorias únicas
          const cats = [...new Set(data.proyectos.map(p => p.categoria))].filter(Boolean).sort();
          setCategorias(cats);
          
          if (cats.length > 0) {
            setSelectedCategoria(cats[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching security data:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCatalogo() {
      try {
        const res = await fetch('/imagenes_senderos/catalogo.json');
        const data = await res.json();
        setCatalogoImagenes(data);
      } catch (err) {
        console.warn('No se pudo cargar el catalogo de imagenes:', err);
      }
    }

    fetchData();
    fetchCatalogo();
  }, []);

  // Al cambiar categoria, seleccionar primer proyecto de esa categoria que tenga datos de seguridad
  useEffect(() => {
    if (selectedCategoria) {
      const filtered = proyectos.filter(
        p => p.categoria === selectedCategoria && seguridadData.some(s => s.proyecto_id === p.id)
      );
      if (filtered.length > 0) {
        setSelectedProyecto(filtered[0].nombre);
      } else {
        setSelectedProyecto('');
      }
    }
  }, [selectedCategoria, proyectos, seguridadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando datos del portal...</p>
      </div>
    );
  }

  const currentProjectObj = proyectos.find(p => p.nombre === selectedProyecto);
  const currentFichas = fichas.filter(f => f.proyecto_id === currentProjectObj?.id);
  const currentStats = seguridadData.filter(s => s.proyecto_id === currentProjectObj?.id);

  // Lógica de Proyección 2026 (blend 60/40)
  const proyecciones2026 = {};
  if (currentProjectObj) {
    ALL_VARS.forEach(varName => {
      const val26Obs = currentStats.find(s => s.anio === '2026*' && s.variable === varName)?.valor;
      if (val26Obs === undefined || val26Obs === null) {
        proyecciones2026[varName] = null;
        return;
      }
      const mensual26Obs = val26Obs / 4.0; // 4 meses de observación
      
      const prevVals = [];
      ['2023', '2024', '2025'].forEach(y => {
        const v = currentStats.find(s => s.anio === y && s.variable === varName)?.valor;
        if (v !== undefined && v !== null) {
          prevVals.push(v);
        }
      });

      let mensualPrev = null;
      if (prevVals.length > 0) {
        mensualPrev = (prevVals.reduce((a, b) => a + b, 0) / prevVals.length) / 12.0;
      }

      const BLEND_FACTOR = 0.6;
      const projScaling = mensual26Obs * 12.0;
      const projPrev = mensualPrev !== null ? mensualPrev * 12.0 : null;

      if (projPrev === null) {
        proyecciones2026[varName] = projScaling;
      } else {
        proyecciones2026[varName] = BLEND_FACTOR * projScaling + (1 - BLEND_FACTOR) * projPrev;
      }
    });
  }

  // Filtrar años disponibles para Años Actual
  const getAñosActualDisponibles = () => {
    if (añosAnterior.length === 0) return PERIODOS;
    const yearsNum = añosAnterior.map(y => parseInt(y.replace('*', '')));
    const maxAnt = Math.max(...yearsNum);
    return PERIODOS.filter(y => {
      const yNum = parseInt(y.replace('*', ''));
      return yNum > maxAnt;
    });
  };

  const handlesAñosAnteriorChange = (year) => {
    let nextAnt;
    if (añosAnterior.includes(year)) {
      nextAnt = añosAnterior.filter(y => y !== year);
    } else {
      nextAnt = [...añosAnterior, year];
    }
    setAñosAnterior(nextAnt);

    // Ajustar años actuales si chocan
    const maxAnt = nextAnt.length > 0 ? Math.max(...nextAnt.map(y => parseInt(y.replace('*', '')))) : 0;
    setAñosActual(prev => prev.filter(y => parseInt(y.replace('*', '')) > maxAnt));
  };

  const handleAñosActualChange = (year) => {
    if (añosActual.includes(year)) {
      setAñosActual(añosActual.filter(y => y !== year));
    } else {
      setAñosActual([...añosActual, year]);
    }
  };

  // Obtener valor para el año
  const getVal = (varName, year) => {
    if (year === '2026*') {
      // Devolver la proyección si existe
      return proyecciones2026[varName] !== undefined ? Math.round(proyecciones2026[varName]) : null;
    }
    const record = currentStats.find(s => s.anio === year && s.variable === varName);
    return record ? record.valor : null;
  };

  // Calcular Tasa
  const calculateTasa = (varName) => {
    if (añosAnterior.length === 0 || añosActual.length === 0) return null;
    const lastAnt = añosAnterior[añosAnterior.length - 1];
    const firstAct = añosActual[0];
    const valA = getVal(varName, lastAnt);
    const valB = getVal(varName, firstAct);
    if (valA === null || valB === null || valA === 0) return null;
    return (valB - valA) / valA;
  };

  // Preparar datos para los gráficos
  const getChartData = (varsList) => {
    const todos = [...añosAnterior, ...añosActual];
    return varsList.map(v => {
      const row = { name: v };
      todos.forEach(y => {
        const val = getVal(v, y);
        row[y === '2026*' ? '2026 (Proyectado)' : y] = val || 0;
      });
      return row;
    });
  };

  // Obtener imágenes del catálogo local
  const getProjectImages = () => {
    if (!currentProjectObj) return { extension: null, antes_despues: null };
    const key = normalizeText(currentProjectObj.nombre);
    const info = catalogoImagenes[key];
    if (!info) return { extension: null, antes_despues: null };
    
    return {
      extension: info.extension ? info.extension.replace('data/', '/') : null,
      antes_despues: info.antes_despues ? info.antes_despues.replace('data/', '/') : null
    };
  };

  const images = getProjectImages();

  // Exportar datos a CSV
  const exportToCSV = () => {
    if (!currentProjectObj) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Categoria,Proyecto,Ubicacion,Extension,Fecha Inauguracion,Anio,Variable,Valor,Tipo\n';

    // Agregar estadísticas reales
    currentStats.forEach(s => {
      csvContent += `"${currentProjectObj.categoria}","${currentProjectObj.nombre}","${currentProjectObj.ubicacion}","${currentProjectObj.extension}","${currentProjectObj.fecha_inauguracion}","${s.anio}","${s.variable}",${s.valor},"Observado"\n`;
    });

    // Agregar proyecciones 2026
    ALL_VARS.forEach(varName => {
      const val = proyecciones2026[varName];
      if (val !== null && val !== undefined) {
        csvContent += `"${currentProjectObj.categoria}","${currentProjectObj.nombre}","${currentProjectObj.ubicacion}","${currentProjectObj.extension}","${currentProjectObj.fecha_inauguracion}","2026_proyeccion","${varName}",${Math.round(val)},"Proyectado"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${normalizeText(currentProjectObj.nombre)}_seguridad.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartColors = ['#1a5276', '#2e86c1', '#5dade2', '#1e8449', '#27ae60', '#82e0aa'];

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Resumen de Seguridad por Proyecto</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Analiza los indicadores de seguridad de incidentes y delitos registrados en cada intervención.
      </p>

      {/* Fila de Filtros */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Categoría</span>
          <select 
            className="filter-select"
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
          >
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Proyecto</span>
          <select 
            className="filter-select"
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
          >
            {proyectos
              .filter(p => p.categoria === selectedCategoria)
              .filter(p => seguridadData.some(s => s.proyecto_id === p.id))
              .map(p => <option key={p.id} value={p.nombre}>{getProyectoDisplayName(p.nombre)}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 250px' }}>
          <span className="filter-label">Años Anterior</span>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
            {PERIODOS.slice(0, -1).map(year => (
              <label key={year} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={añosAnterior.includes(year)}
                  onChange={() => handlesAñosAnteriorChange(year)}
                />
                {year}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group" style={{ flex: '1 1 250px' }}>
          <span className="filter-label">Años Actual</span>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
            {getAñosActualDisponibles().map(year => (
              <label key={year} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={añosActual.includes(year)}
                  onChange={() => handleAñosActualChange(year)}
                />
                {year === '2026*' ? '2026 (Proyectado)' : year}
              </label>
            ))}
          </div>
        </div>
      </div>

      {currentProjectObj && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Ficha Técnica */}
          {currentFichas.length > 0 && (
            <div className="ficha-sendero">
              <div className="ficha-header">
                Ficha del Sendero Seguro — {getProyectoDisplayName(currentProjectObj.nombre)}
              </div>
              <div className="ficha-grid">
                <div className="ficha-item">
                  <span className="ficha-label">Ejecutor</span>
                  <span className="ficha-value">{currentFichas[0].ejecutor || '—'}</span>
                </div>
                <div className="ficha-item">
                  <span className="ficha-label">Presupuesto</span>
                  <span className="ficha-value">{currentFichas[0].presupuesto || '—'}</span>
                </div>
                <div className="ficha-item">
                  <span className="ficha-label">Extensión</span>
                  <span className="ficha-value">{currentFichas[0].extension || '—'}</span>
                </div>
                <div className="ficha-item">
                  <span className="ficha-label">Beneficiarios</span>
                  <span className="ficha-value">{currentFichas[0].beneficiarios || '—'}</span>
                </div>
                <div className="ficha-item">
                  <span className="ficha-label">Fecha de Inauguración</span>
                  <span className="ficha-value">{currentFichas[0].fecha || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-accent" onClick={exportToCSV}>
              💾 Exportar CSV
            </button>
          </div>

          {/* Desglose de Proyección 2026 */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Proyecciones 2026 (Obs. / Proy.)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Método: Media Móvil 2023-2025 (Blend 60/40). Muestra los datos observados acumulados y el total del año proyectado.
            </p>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Observado 2026 (Ene-Abr)</th>
                    <th>Estimado Restante</th>
                    <th>Total Proyectado 2026</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_VARS.map(v => {
                    const obs = currentStats.find(s => s.anio === '2026*' && s.variable === v)?.valor || 0;
                    const proy = proyecciones2026[v] || 0;
                    const restante = Math.max(0, Math.round(proy - obs));
                    return (
                      <tr key={v}>
                        <td><strong>{v}</strong></td>
                        <td>{obs || '-'}</td>
                        <td>{restante || '-'}</td>
                        <td><strong>{Math.round(proy) || '-'}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficos de barras interactivos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
            {/* Gráfico Incidentes */}
            <div className="card" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Incidentes de Seguridad (ECU 911)</h3>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData(INCIDENTES)} margin={{ top: 10, right: 30, left: 0, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9 }} 
                      interval={0} 
                      angle={-40} 
                      textAnchor="end" 
                      height={90}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {[...añosAnterior, ...añosActual].map((y, idx) => (
                      <Bar 
                        key={y} 
                        dataKey={y === '2026*' ? '2026 (Proyectado)' : y} 
                        fill={chartColors[idx % chartColors.length]} 
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Delitos */}
            <div className="card" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Delitos Registrados (PPNN)</h3>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData(DELITOS)} margin={{ top: 10, right: 30, left: 0, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9 }} 
                      interval={0} 
                      angle={-40} 
                      textAnchor="end" 
                      height={90}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {[...añosAnterior, ...añosActual].map((y, idx) => (
                      <Bar 
                        key={y} 
                        dataKey={y === '2026*' ? '2026 (Proyectado)' : y} 
                        fill={chartColors[(idx + 3) % chartColors.length]} 
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa de Años */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Tabla Comparativa de Incidentes y Delitos</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    {añosAnterior.map(y => <th key={y}>{y}</th>)}
                    {añosActual.map(y => <th key={y}>{y === '2026*' ? '2026 (Proy)' : y}</th>)}
                    <th>Tasa {añosAnterior[añosAnterior.length - 1]} → {añosActual[0]}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={2 + añosAnterior.length + añosActual.length} style={{ backgroundColor: 'rgba(36, 54, 127, 0.05)', fontWeight: 'bold' }}>
                      INCIDENTES DE SEGURIDAD
                    </td>
                  </tr>
                  {INCIDENTES.map(v => {
                    const tasa = calculateTasa(v);
                    const isUp = tasa && tasa > 0;
                    return (
                      <tr key={v}>
                        <td style={{ paddingLeft: '2rem' }}>{v}</td>
                        {añosAnterior.map(y => <td key={y}>{getVal(v, y) ?? '-'}</td>)}
                        {añosActual.map(y => <td key={y}>{getVal(v, y) ?? '-'}</td>)}
                        <td>
                          {tasa !== null ? (
                            <span className={`rate-badge ${isUp ? 'rate-up' : 'rate-down'}`}>
                              {isUp ? '+' : ''}{(tasa * 100).toFixed(0)}%
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={2 + añosAnterior.length + añosActual.length} style={{ backgroundColor: 'rgba(36, 54, 127, 0.05)', fontWeight: 'bold' }}>
                      DELITOS
                    </td>
                  </tr>
                  {DELITOS.map(v => {
                    const tasa = calculateTasa(v);
                    const isUp = tasa && tasa > 0;
                    return (
                      <tr key={v}>
                        <td style={{ paddingLeft: '2rem' }}>{v}</td>
                        {añosAnterior.map(y => <td key={y}>{getVal(v, y) ?? '-'}</td>)}
                        {añosActual.map(y => <td key={y}>{getVal(v, y) ?? '-'}</td>)}
                        <td>
                          {tasa !== null ? (
                            <span className={`rate-badge ${isUp ? 'rate-up' : 'rate-down'}`}>
                              {isUp ? '+' : ''}{(tasa * 100).toFixed(0)}%
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapa Interactivo (Mapbox) */}
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Mapa Interactivo del Proyecto</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Visualiza la ubicación geográfica y la extensión lineal del sendero seguro en Quito.
            </p>
            <MapboxMap 
              projectKey={normalizeText(currentProjectObj.nombre)} 
              projectName={getProyectoDisplayName(currentProjectObj.nombre)} 
            />
          </div>

          {/* Registros Antes / Después (Impacto Visual) */}
          {images.antes_despues && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Impacto Visual (Antes / Después)</h3>
              <div>
                <img 
                  src={images.antes_despues} 
                  alt="Impacto visual antes y después" 
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
