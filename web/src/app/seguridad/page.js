'use strict';
'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import dynamic from 'next/dynamic';
import equipamientoData from '@/lib/equipamiento.json';
import eventosData from '@/lib/eventos.json';
import { 
  Coins, Footprints, Lightbulb, Wrench, Zap, TrafficCone, Paintbrush, Sprout, Sofa, Fence, Construction, Video, Hammer,
  Building2, Calendar, Users, Route, Clock, MapPin
} from 'lucide-react';

const MapboxMap = dynamic(() => import('../components/MapboxMap'), { ssr: false });

const INCIDENTES = [];
const DELITOS = [
  'Robo a personas',
  'Robo a unidades económicas',
  'Robo a domicilios',
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

const NORM_EQUIPMENT_MAP = {
  'isla tortuga': 'Isla Tortuga',
  'la roldos oe13 colinas del norte': 'La Roldos',
  'av colon': 'Av Colón',
  'av patria': 'Av Patria',
  'calle rocafuerte': 'Calle Rocafuerte'
};

export default function SeguridadPage() {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [seguridadData, setSeguridadData] = useState([]);
  const [fichas, setFichas] = useState([]);
  
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState('');
  
  const [añoBase, setAñoBase] = useState('2023');
  const [añoComparativo, setAñoComparativo] = useState('2026*');
  const [equipamientoTab, setEquipamientoTab] = useState('total');
  const [showEquipamiento, setShowEquipamiento] = useState(true);
  const [showEventos, setShowEventos] = useState(true);

  const añosAnterior = [añoBase];
  const añosActual = [añoComparativo];

  const [catalogoImagenes, setCatalogoImagenes] = useState({});

  const [expandIncidentes, setExpandIncidentes] = useState(false);
  const [expandDelitos, setExpandDelitos] = useState(false);
  const [showMetodologia, setShowMetodologia] = useState(false);

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
      setEquipamientoTab('total');
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
  const projectEventData = eventosData.find(e => e.proyecto === selectedProyecto);
  const projectEvents = projectEventData ? projectEventData.eventos : [];

  // Lógica de Proyección 2026 (blend 60/40)
  const proyecciones2026 = {};
  if (currentProjectObj) {
    ALL_VARS.forEach(varName => {
      const val26ObsRaw = currentStats.find(s => s.anio === '2026*' && s.variable === varName)?.valor;
      const val26Obs = (val26ObsRaw !== undefined && val26ObsRaw !== null) ? val26ObsRaw : 0;
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



  // Obtener valor para el año
  const getVal = (varName, year) => {
    if (year === '2026*') {
      const proj = proyecciones2026[varName];
      return (proj !== undefined && proj !== null) ? Math.round(proj) : null;
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

  // Calcular sumas para un grupo de variables y un año específico
  const getGroupSum = (varsList, year) => {
    let sum = 0;
    let hasValue = false;
    varsList.forEach(v => {
      const val = getVal(v, year);
      if (val !== null && val !== undefined) {
        sum += val;
        hasValue = true;
      }
    });
    return hasValue ? sum : null;
  };

  // Obtener valor real (sin proyecciones)
  const getRealVal = (varName, year) => {
    const record = currentStats.find(s => s.anio === year && s.variable === varName);
    return record ? record.valor : null;
  };

  const getRealGroupSum = (varsList, year) => {
    let sum = 0;
    let hasValue = false;
    varsList.forEach(v => {
      const val = getRealVal(v, year);
      if (val !== null && val !== undefined) {
        sum += val;
        hasValue = true;
      }
    });
    return hasValue ? sum : null;
  };

  // Calcular Tasa para el grupo de variables
  const calculateGroupTasa = (varsList) => {
    if (añosAnterior.length === 0 || añosActual.length === 0) return null;
    const lastAnt = añosAnterior[añosAnterior.length - 1];
    const firstAct = añosActual[0];
    const valA = getGroupSum(varsList, lastAnt);
    const valB = getGroupSum(varsList, firstAct);
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

  const formatMoney = (value) => {
    if (value === null || value === undefined) return '—';
    let formatted = value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (value >= 1000000) {
      const parts = formatted.split('.');
      if (parts.length >= 3) {
        formatted = parts[0] + "'" + parts.slice(1).join('.');
      }
    }
    return '$ ' + formatted;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('es-EC');
  };

  const formatArea = (value) => {
    if (value === null || value === undefined || value === 0) return '—';
    return value.toLocaleString('es-EC') + ' m²';
  };

  const formatLength = (value) => {
    if (value === null || value === undefined || value === 0) return '—';
    return value.toLocaleString('es-EC') + ' m';
  };

  const getEquipamientoData = () => {
    if (!currentProjectObj) return null;
    const norm = normalizeText(currentProjectObj.nombre);
    const excelName = NORM_EQUIPMENT_MAP[norm];
    if (!excelName) return null;

    const records = equipamientoData.filter(e => e.nombre_sendero === excelName);
    if (records.length === 0) return null;

    const hasAnyData = records.some(r => r.presupuesto !== null || r.luminarias_instaladas !== null || r.cruces_seguros !== null || r.acera_intervenida !== null);
    if (!hasAnyData) return null;

    if (records.length > 1) {
      const totalRecord = {
        nombre_sendero: excelName,
        administracion_zonal: records[0].administracion_zonal,
        barrios: records[0].barrios,
        fecha_inicio: null,
        fecha_fin: null,
        longitud_intervenida: records.map(r => r.longitud_intervenida).filter(Boolean).join(' / '),
        presupuesto: records.reduce((sum, r) => sum + (r.presupuesto || 0), 0),
        luminarias_instaladas: records.reduce((sum, r) => sum + (r.luminarias_instaladas || 0), 0),
        luminarias_reparadas: records.reduce((sum, r) => sum + (r.luminarias_reparadas || 0), 0),
        postes_intervenidos: records.reduce((sum, r) => sum + (r.postes_intervenidos || 0), 0),
        senales_instaladas: records.reduce((sum, r) => sum + (r.senales_instaladas || 0), 0),
        cruces_seguros: records.reduce((sum, r) => sum + (r.cruces_seguros || 0), 0),
        pintura_vial: records.reduce((sum, r) => sum + (r.pintura_vial || 0), 0),
        jardineria: records.reduce((sum, r) => sum + (r.jardineria || 0), 0),
        mobiliario_urbano: records.reduce((sum, r) => sum + (r.mobiliario_urbano || 0), 0),
        bolardos: records.reduce((sum, r) => sum + (r.bolardos || 0), 0),
        acera_intervenida: records.reduce((sum, r) => sum + (r.acera_intervenida || 0), 0),
        bacheo: records.reduce((sum, r) => sum + (r.bacheo || 0), 0),
        camaras: records.reduce((sum, r) => sum + (r.camaras || 0), 0),
        tipo: 'total'
      };
      return {
        records,
        hasTabs: true,
        total: totalRecord
      };
    }

    return {
      records,
      hasTabs: false,
      total: records[0]
    };
  };

  const equipDataInfo = getEquipamientoData();
  
  let activeEquipRecord = null;
  if (equipDataInfo) {
    if (equipDataInfo.hasTabs) {
      if (equipamientoTab === 'total') {
        activeEquipRecord = equipDataInfo.total;
      } else {
        activeEquipRecord = equipDataInfo.records.find(r => r.tipo === equipamientoTab);
      }
    } else {
      activeEquipRecord = equipDataInfo.total;
    }
  }

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

  const chartColors = ['#3b82f6', '#f59e0b'];

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Resumen de Seguridad por Proyecto</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Analiza los indicadores de delitos registrados en cada intervención.
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
            onChange={(e) => { setSelectedProyecto(e.target.value); setEquipamientoTab('total'); }}
          >
            {proyectos
              .filter(p => p.categoria === selectedCategoria)
              .filter(p => seguridadData.some(s => s.proyecto_id === p.id))
              .map(p => <option key={p.id} value={p.nombre}>{getProyectoDisplayName(p.nombre)}</option>)}
          </select>
        </div>

      </div>

      {currentProjectObj && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Ficha / Detalle de Obras Unificado */}
          {(currentFichas.length > 0 || activeEquipRecord) && (
            <div className="equipamiento-section">
              <div 
                className="equipamiento-header"
                onClick={() => setShowEquipamiento(!showEquipamiento)}
                style={{ cursor: 'pointer', userSelect: 'none', marginBottom: showEquipamiento ? '1.25rem' : '0' }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  {activeEquipRecord 
                    ? `Detalle de Obras y Equipamiento de Convivencia — ${getProyectoDisplayName(currentProjectObj.nombre)}`
                    : `Ficha del Corredor Vivo — ${getProyectoDisplayName(currentProjectObj.nombre)}`}
                </span>
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s', 
                  transform: showEquipamiento ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  ▶
                </span>
              </div>

              {showEquipamiento && (
                <>
                  {/* Pestañas de subcomponente (solo si tiene equipamiento con pestañas) */}
                  {activeEquipRecord && equipDataInfo.hasTabs && (
                    <div className="equipamiento-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'total' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('total'); }}
                      >
                        Total
                      </button>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'vial' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('vial'); }}
                      >
                        Vial
                      </button>
                      <button 
                        className={`equipamiento-tab-btn ${equipamientoTab === 'espacio publico' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setEquipamientoTab('espacio publico'); }}
                      >
                        Espacio Público
                      </button>
                    </div>
                  )}

                  <div className="equipamiento-grid">
                    {/* Campos Básicos de Ficha (siempre se muestran) */}
                    {currentFichas.length > 0 && (
                      <>
                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Building2 size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].ejecutor || '—'}</span>
                            <span className="equip-label">Ejecutor</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Calendar size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].fecha || '—'}</span>
                            <span className="equip-label">Fecha de Inauguración</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Users size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].beneficiarios || '—'}</span>
                            <span className="equip-label">Beneficiarios</span>
                          </div>
                        </div>

                        <div className="equip-card">
                          <div className="equip-icon-wrapper blue">
                            <Route size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].extension || '—'}</span>
                            <span className="equip-label">Extensión</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Presupuesto (Si tiene equipamiento, usa el detallado; si no, usa el de la ficha básica) */}
                    {activeEquipRecord ? (
                      activeEquipRecord.presupuesto !== null && (
                        <div className="equip-card">
                          <div className="equip-icon-wrapper orange">
                            <Coins size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value">{formatMoney(activeEquipRecord.presupuesto)}</span>
                            <span className="equip-label">Presupuesto / Inversión</span>
                          </div>
                        </div>
                      )
                    ) : (
                      currentFichas.length > 0 && currentFichas[0].presupuesto && (
                        <div className="equip-card">
                          <div className="equip-icon-wrapper orange">
                            <Coins size={24} />
                          </div>
                          <div className="equip-details">
                            <span className="equip-value" style={{ fontSize: '1.15rem' }}>{currentFichas[0].presupuesto}</span>
                            <span className="equip-label">Presupuesto / Inversión</span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Campos Detallados de Equipamiento (solo si tiene equipamiento) */}
                    {activeEquipRecord && (
                      <>
                        {activeEquipRecord.cruces_seguros !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Footprints size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.cruces_seguros)}</span>
                              <span className="equip-label">Cruces seguros</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.luminarias_instaladas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Lightbulb size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.luminarias_instaladas)}</span>
                              <span className="equip-label">Luminarias instaladas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.luminarias_reparadas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Wrench size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.luminarias_reparadas)}</span>
                              <span className="equip-label">Luminarias reparadas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.postes_intervenidos !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Zap size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.postes_intervenidos)}</span>
                              <span className="equip-label">Postes intervenidos</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.senales_instaladas !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <TrafficCone size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.senales_instaladas)}</span>
                              <span className="equip-label">Señales instaladas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.pintura_vial !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Paintbrush size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.pintura_vial)}</span>
                              <span className="equip-label">Pintura vial / Muralismo</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.jardineria !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Sprout size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.jardineria)}</span>
                              <span className="equip-label">Jardinería / Paisajismo</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.mobiliario_urbano !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Sofa size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.mobiliario_urbano)}</span>
                              <span className="equip-label">Mobiliario urbano</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.bolardos !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Fence size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.bolardos)}</span>
                              <span className="equip-label">Bolardos y barandas</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.acera_intervenida !== null && activeEquipRecord.acera_intervenida !== 0 && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Construction size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatLength(activeEquipRecord.acera_intervenida)}</span>
                              <span className="equip-label">Acera intervenida</span>
                        </div>
                          </div>
                        )}

                        {activeEquipRecord.bacheo !== null && activeEquipRecord.bacheo !== 0 && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Hammer size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatArea(activeEquipRecord.bacheo)}</span>
                              <span className="equip-label">Bacheo / Reparación vial</span>
                            </div>
                          </div>
                        )}

                        {activeEquipRecord.camaras !== null && (
                          <div className="equip-card">
                            <div className="equip-icon-wrapper blue">
                              <Video size={24} />
                            </div>
                            <div className="equip-details">
                              <span className="equip-value">{formatNumber(activeEquipRecord.camaras)}</span>
                              <span className="equip-label">Cámaras de seguridad</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sección de Eventos y Activación del Espacio Público */}
          {projectEvents && projectEvents.length > 0 && (
            <div className="card" style={{ transition: 'all 0.3s ease' }}>
              <div 
                className="eventos-header"
                onClick={() => setShowEventos(!showEventos)} 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎉 Encadenamiento económico: FERIAS — {getProyectoDisplayName(currentProjectObj.nombre)}
                </span>
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s', 
                  transform: showEventos ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  ▶
                </span>
              </div>

              {showEventos && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="eventos-grid">
                    {projectEvents.map((evento, idx) => (
                      <div key={idx} className="evento-card">
                        {evento.imagen && (
                          <div className="evento-image-wrapper">
                            <img 
                              src={evento.imagen} 
                              alt={evento.titulo} 
                              className="evento-image"
                            />
                          </div>
                        )}
                        <div className="evento-content">
                          <h4 className="evento-title">{evento.titulo}</h4>
                          {evento.edicion && <span className="evento-edition">{evento.edicion}</span>}
                          
                          <div className="evento-meta">
                            <div className="evento-meta-item">
                              <Calendar size={16} />
                              <span>{evento.fecha}</span>
                            </div>
                            {evento.hora && (
                              <div className="evento-meta-item">
                                <Clock size={16} />
                                <span>{evento.hora}</span>
                              </div>
                            )}
                            <div className="evento-meta-item">
                              <MapPin size={16} />
                              <span>{evento.lugar}</span>
                            </div>
                          </div>

                          <p className="evento-description">{evento.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-accent" onClick={exportToExcel}>
              📊 Descargar Excel
            </button>
          </div>

          {/* Metodología de Proyección 2026 (Colapsable) */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-color, #3b82f6)', padding: '1.25rem' }}>
            <div 
              onClick={() => setShowMetodologia(!showMetodologia)} 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                userSelect: 'none'
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--accent-color, #3b82f6)', fontSize: '1.15rem' }}>
                Metodología de Proyección Anual 2026
              </h3>
              <span style={{ 
                display: 'inline-block', 
                fontSize: '0.85rem',
                color: 'var(--accent-color, #3b82f6)',
                transition: 'transform 0.2s', 
                transform: showMetodologia ? 'rotate(90deg)' : 'rotate(0deg)' 
              }}>
                ▶
              </span>
            </div>
            
            {showMetodologia && (
              <div style={{ marginTop: '1.25rem' }}>
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
                      Se calcula el promedio histórico anual de los delitos registrados entre 2023 y 2025. Funciona como un regulador estadístico que evita sobrestimaciones causadas por picos atípicos.
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
            )}
          </div>

          {/* Gráficos de barras interactivos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Gráfico Delitos */}
            <div className="card" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Delitos Registrados (PPNN)</h3>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData(DELITOS)} margin={{ top: 25, right: 30, left: 0, bottom: 70 }}>
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
                    {[...añosAnterior, ...añosActual].map((y, idx) => {
                      const dKey = y === '2026*' ? '2026 (Proyectado)' : y;
                      return (
                        <Bar 
                          key={y} 
                          dataKey={dKey} 
                          fill={chartColors[idx % chartColors.length]} 
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList dataKey={dKey} position="top" style={{ fill: 'var(--text-color)', fontSize: 9, fontWeight: 'bold' }} />
                        </Bar>
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa de Años */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Tabla Comparativa de Delitos</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    {PERIODOS.slice(0, -1).map(y => (
                      <th key={y} style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
                            {y}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <button 
                              type="button" 
                              onClick={() => {
                                setAñoBase(y);
                                const baseIdx = PERIODOS.indexOf(y);
                                if (PERIODOS.indexOf(añoComparativo) <= baseIdx) {
                                  setAñoComparativo(PERIODOS[baseIdx + 1]);
                                }
                              }}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer',
                                backgroundColor: añoBase === y ? '#2563eb' : 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                opacity: añoBase === y ? 1 : 0.45,
                                transition: 'all 0.15s'
                              }}
                            >
                              Base
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setAñoComparativo(y)}
                              disabled={PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase)}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase) ? 'not-allowed' : 'pointer',
                                backgroundColor: añoComparativo === y ? '#d97706' : 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                opacity: añoComparativo === y ? 1 : (PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase) ? 0.15 : 0.45),
                                transition: 'all 0.15s'
                              }}
                            >
                              Comp
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    
                    {/* Columna Informativa de 2026 Real Ene-Abr */}
                    <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold', display: 'block' }}>
                        2026 (Real Ene-Abr)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        (Obs. 4 meses)
                      </span>
                    </th>

                    {/* Columna de 2026 Proyectado */}
                    {PERIODOS.slice(-1).map(y => (
                      <th key={y} style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
                            2026 (Proy)
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <button 
                              type="button" 
                              disabled={true}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: 'not-allowed',
                                backgroundColor: 'transparent',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                opacity: 0.15,
                                transition: 'all 0.15s'
                              }}
                            >
                              Base
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setAñoComparativo(y)}
                              disabled={PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase)}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase) ? 'not-allowed' : 'pointer',
                                backgroundColor: añoComparativo === y ? '#d97706' : 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                opacity: añoComparativo === y ? 1 : (PERIODOS.indexOf(y) <= PERIODOS.indexOf(añoBase) ? 0.15 : 0.45),
                                transition: 'all 0.15s'
                              }}
                            >
                              Comp
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    
                    <th style={{ minWidth: '130px' }}>
                      Tasa {añoBase.replace('*', '')} → {añoComparativo.replace('*', '')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila Principal de Delitos (Expandible) */}
                  <tr 
                    onClick={() => setExpandDelitos(!expandDelitos)} 
                    style={{ cursor: 'pointer', backgroundColor: 'rgba(36, 54, 127, 0.08)', fontWeight: 'bold' }}
                    className="parent-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          fontSize: '0.8rem',
                          transition: 'transform 0.2s', 
                          transform: expandDelitos ? 'rotate(90deg)' : 'rotate(0deg)' 
                        }}>
                          ▶
                        </span>
                        TOTAL DELITOS
                      </div>
                    </td>
                    {PERIODOS.slice(0, -1).map(y => (
                      <td key={y} style={{ textAlign: 'center', fontWeight: (y === añoBase || y === añoComparativo) ? 'bold' : 'normal', backgroundColor: y === añoBase ? 'rgba(37, 99, 235, 0.05)' : (y === añoComparativo ? 'rgba(217, 119, 6, 0.05)' : 'transparent') }}>
                        {getGroupSum(DELITOS, y) ?? '-'}
                      </td>
                    ))}
                    {/* Año 2026 Real Ene-Abr */}
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                      {getRealGroupSum(DELITOS, '2026*') ?? '-'}
                    </td>
                    {/* Año 2026 Proyectado */}
                    {PERIODOS.slice(-1).map(y => (
                      <td key={y} style={{ textAlign: 'center', fontWeight: (y === añoBase || y === añoComparativo) ? 'bold' : 'normal', backgroundColor: y === añoBase ? 'rgba(37, 99, 235, 0.05)' : (y === añoComparativo ? 'rgba(217, 119, 6, 0.05)' : 'transparent') }}>
                        {getGroupSum(DELITOS, y) ?? '-'}
                      </td>
                    ))}
                    <td>
                      {(() => {
                        const tasa = calculateGroupTasa(DELITOS);
                        const isUp = tasa && tasa > 0;
                        return tasa !== null ? (
                          <span className={`rate-badge ${isUp ? 'rate-up' : 'rate-down'}`}>
                            {isUp ? '+' : ''}{(tasa * 100).toFixed(0)}%
                          </span>
                        ) : 'N/A';
                      })()}
                    </td>
                  </tr>

                  {/* Filas Hijas de Delitos */}
                  {expandDelitos && DELITOS.map(v => {
                    const tasa = calculateTasa(v);
                    const isUp = tasa && tasa > 0;
                    return (
                      <tr key={v} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                        <td style={{ paddingLeft: '2.5rem', color: 'var(--text-muted)' }}>{v}</td>
                        {PERIODOS.slice(0, -1).map(y => (
                          <td key={y} style={{ textAlign: 'center', color: (y === añoBase || y === añoComparativo) ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: (y === añoBase || y === añoComparativo) ? 'bold' : 'normal', backgroundColor: y === añoBase ? 'rgba(37, 99, 235, 0.03)' : (y === añoComparativo ? 'rgba(217, 119, 6, 0.03)' : 'transparent') }}>
                            {getVal(v, y) ?? '-'}
                          </td>
                        ))}
                        {/* Año 2026 Real Ene-Abr */}
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                          {getRealVal(v, '2026*') ?? '-'}
                        </td>
                        {/* Año 2026 Proyectado */}
                        {PERIODOS.slice(-1).map(y => (
                          <td key={y} style={{ textAlign: 'center', color: (y === añoBase || y === añoComparativo) ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: (y === añoBase || y === añoComparativo) ? 'bold' : 'normal', backgroundColor: y === añoBase ? 'rgba(37, 99, 235, 0.03)' : (y === añoComparativo ? 'rgba(217, 119, 6, 0.03)' : 'transparent') }}>
                            {getVal(v, y) ?? '-'}
                          </td>
                        ))}
                        <td>
                          {tasa !== null ? (
                            <span className={`rate-badge ${isUp ? 'rate-up' : 'rate-down'}`} style={{ opacity: 0.85 }}>
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



        </div>
      )}
    </div>
  );
}
