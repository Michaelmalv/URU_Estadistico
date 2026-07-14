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

  // Exportar datos a Excel
  const exportToExcel = async () => {
    if (!currentProjectObj) return;

    const fileName = `Reporte_Seguridad_${normalizeText(currentProjectObj.nombre)}.xlsx`;

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Seguridad');

      // Mostrar líneas de cuadrícula
      worksheet.views = [{ showGridLines: true }];

      const primaryColor = 'FF1E3A8A';
      const fontName = 'Segoe UI';

      // 1. Título del Reporte
      const rowTitle = worksheet.addRow(['Portal de Evaluación de Proyectos Estratégicos']);
      rowTitle.getCell(1).font = { name: fontName, size: 16, bold: true, color: { argb: primaryColor } };
      worksheet.mergeCells('A1:F1');

      // Subtítulo
      const rowSubtitle = worksheet.addRow(['Reporte de Indicadores de Seguridad y Convivencia Ciudadana']);
      rowSubtitle.getCell(1).font = { name: fontName, size: 10, color: { argb: 'FF64748B' } };
      worksheet.mergeCells('A2:F2');

      worksheet.addRow([]); // Espacio

      // 2. Información del Proyecto
      const sectionInfo = worksheet.addRow(['Información del Proyecto']);
      sectionInfo.getCell(1).font = { name: fontName, size: 13, bold: true, color: { argb: 'FF0F172A' } };
      worksheet.mergeCells('A4:F4');

      const metaData = [
        ['Categoría:', currentProjectObj.categoria || '—'],
        ['Proyecto:', currentProjectObj.nombre || '—'],
        ['Ubicación:', currentProjectObj.ubicacion || '—'],
        ['Extensión:', currentProjectObj.extension || '—'],
        ['Fecha de Inauguración:', currentProjectObj.fecha_inauguracion || '—']
      ];

      metaData.forEach(item => {
        const row = worksheet.addRow([item[0], item[1]]);
        row.getCell(1).font = { name: fontName, size: 10, bold: true, color: { argb: 'FF334155' } };
        row.getCell(2).font = { name: fontName, size: 10 };
        worksheet.mergeCells(`B${row.number}:F${row.number}`);
      });

      worksheet.addRow([]); // Espacio

      // 3. Histórico de Incidentes y Proyecciones
      const sectionHist = worksheet.addRow(['Histórico de Incidentes y Proyecciones']);
      sectionHist.getCell(1).font = { name: fontName, size: 13, bold: true, color: { argb: 'FF0F172A' } };
      worksheet.mergeCells('A11:F11');

      const headerRow = worksheet.addRow([
        'Variable / Indicador',
        '2023',
        '2024',
        '2025',
        '2026 (Obs. Ene-Abr)',
        '2026 (Proyectado Total)'
      ]);

      headerRow.eachCell((cell, colNum) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: primaryColor }
        };
        cell.font = { name: fontName, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        if (colNum > 1) {
          cell.alignment = { horizontal: 'right' };
        }
      });

      // Filas de datos
      ALL_VARS.forEach(v => {
        const v23 = currentStats.find(s => s.anio === '2023' && s.variable === v)?.valor ?? '—';
        const v24 = currentStats.find(s => s.anio === '2024' && s.variable === v)?.valor ?? '—';
        const v25 = currentStats.find(s => s.anio === '2025' && s.variable === v)?.valor ?? '—';
        const v26Obs = currentStats.find(s => s.anio === '2026*' && s.variable === v)?.valor ?? '—';
        const v26Proy = proyecciones2026[v] !== null && proyecciones2026[v] !== undefined ? Math.round(proyecciones2026[v]) : '—';

        const row = worksheet.addRow([v, v23, v24, v25, v26Obs, v26Proy]);
        row.getCell(1).font = { name: fontName, size: 10, bold: true };
        
        row.eachCell((cell, colNum) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };

          if (colNum > 1) {
            cell.alignment = { horizontal: 'right' };
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          }
        });
      });

      worksheet.addRow([]); // Espacio

      // Pie de página
      const footerRow = worksheet.addRow([`* Proyección 2026 calculada usando ponderación mixta (Media Móvil 60/40). Fuente de datos: ECU 911. Generado el ${new Date().toLocaleDateString('es-EC')}`]);
      footerRow.getCell(1).font = { name: fontName, size: 8, color: { argb: 'FF94A3B8' }, italic: true };
      worksheet.mergeCells(`A${footerRow.number}:F${footerRow.number}`);

      // Auto-ajuste de columnas
      worksheet.columns.forEach((column, i) => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          // Excluir combinadas
          if (
            cell.address.includes('A1') || 
            cell.address.includes('A2') || 
            cell.address.includes('A4') || 
            cell.address.includes('A11') || 
            cell.address.startsWith('A' + footerRow.number) ||
            (cell.row >= 5 && cell.row <= 9 && cell.col >= 2)
          ) {
            return;
          }
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        column.width = Math.max(maxLen + 4, 12);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
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
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-accent" onClick={exportToExcel}>
              📊 Descargar Excel
            </button>
          </div>

          {/* Metodología de Proyección 2026 */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-color, #3b82f6)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color, #3b82f6)' }}>Metodología de Proyección Anual 2026</h3>
            <p style={{ color: 'var(--text-color)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Para estimar los indicadores de seguridad de todo el año 2026, se utiliza un modelo de promedio ponderado que combina la tendencia observada del año actual con el comportamiento histórico:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#60a5fa' }}>1. Tendencia Reciente (Peso 60%)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  Se toma el valor observado de enero a abril de 2026 (4 meses), se calcula su promedio mensual y se proyecta para los 12 meses. Esto permite reflejar las dinámicas de seguridad del presente año.
                </p>
              </div>
              
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#60a5fa' }}>2. Base Histórica (Peso 40%)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  Se calcula el promedio histórico anual de los incidentes registrados entre 2023 y 2025. Funciona como un regulador estadístico que evita sobrestimaciones causadas por picos atípicos.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: '0.75rem', borderRadius: '6px', border: '1px dashed rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Fórmula de Ponderación Mixta:</strong>
              <code style={{ fontSize: '0.9rem', color: 'var(--accent-color, #60a5fa)', fontFamily: 'monospace' }}>
                Proyección 2026 = (Proyección Simple 2026 × 0.60) + (Media Histórica 2023-2025 × 0.40)
              </code>
            </div>
          </div>

          {/* Gráficos de barras interactivos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
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
