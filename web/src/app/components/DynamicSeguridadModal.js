'use strict';
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { 
  Shield, ShieldCheck, TrendingDown, TrendingUp, Activity, 
  BarChart3, CheckCircle2, AlertTriangle, Sparkles, 
  User, Car, Bike, Info, Building2, Home
} from 'lucide-react';

// Hook para animar números de 0 a targetValue
function AnimatedCounter({ targetValue, duration = 900, isPercentage = false, suffix = '' }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let num = 0;
    if (typeof targetValue === 'number') {
      num = targetValue;
    } else if (typeof targetValue === 'string') {
      const parsed = parseFloat(targetValue.replace('%', '').replace('+', ''));
      num = isNaN(parsed) ? 0 : parsed;
    }

    if (num === 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    let frameId;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing cúbico hacia fuera
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(num * easeOut * 10) / 10;
      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setCurrent(num);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, duration]);

  if (targetValue === null || targetValue === undefined || targetValue === '—') {
    return <span>—</span>;
  }

  const isNeg = current < 0;
  const absVal = Math.abs(current);
  const formatted = Number.isInteger(absVal) ? absVal : absVal.toFixed(1);

  return (
    <span>
      {isNeg ? '-' : ''}{formatted}{isPercentage ? '%' : ''}{suffix}
    </span>
  );
}

// Icono según tipo de delito
function getVariableIcon(label = '') {
  const l = label.toLowerCase();
  if (l.includes('moto')) return <Bike size={14} className="text-amber-500" />;
  if (l.includes('carro') || l.includes('auto') || l.includes('vehic')) return <Car size={14} className="text-blue-500" />;
  if (l.includes('persona')) return <User size={14} className="text-rose-500" />;
  if (l.includes('econ') || l.includes('comerc') || l.includes('negocio') || l.includes('unidad')) return <Building2 size={14} className="text-indigo-500" />;
  if (l.includes('domicilio') || l.includes('casa') || l.includes('resid') || l.includes('hogar')) return <Home size={14} className="text-emerald-500" />;
  return <AlertTriangle size={14} className="text-slate-500" />;
}

// Tooltip personalizado para el gráfico Recharts
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="dynamic-chart-tooltip">
        <div className="tooltip-header">
          <strong>Período: {label}</strong>
        </div>
        <div className="tooltip-body">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-row">
              <span 
                className="tooltip-dot" 
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="tooltip-name">
                Delitos Registrados:
              </span>
              <strong className="tooltip-val" style={{ color: entry.color || entry.fill }}>
                {entry.value} casos
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function DynamicSeguridadModal({ seguridad, proyectoNombre }) {
  const [chartView, setChartView] = useState('area'); // 'area' | 'bar'
  const [, setHighlightedYear] = useState(null);

  if (!seguridad || seguridad.tiene_datos_oficiales === false || !seguridad.delitos_por_ano) {
    return (
      <div className="official-disclaimer-box animate-fade-in">
        <div className="disclaimer-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
          <Shield size={32} />
        </div>
        <div className="disclaimer-text-wrap">
          <div className="disclaimer-header-badge">
            <span className="badge-official-status">Fase de Diagnóstico Territorial PUGS</span>
          </div>
          <h4 className="disclaimer-title">Sin Registro de Evaluación Delictiva Oficial</h4>
          <p className="disclaimer-p">
            {seguridad?.mensaje_oficial || 
             "Este sector corresponde a un Polígono de Centralidad Urbana en etapa de diagnóstico y formulación técnica PUGS. A la fecha, la Secretaría de Seguridad y Gobernabilidad no registra mediciones de impacto delictivo en este polígono."}
          </p>
          <div className="disclaimer-meta-note">
            <span>🏛️ Dirección Metropolitana de Políticas de Seguridad • DMQ</span>
          </div>
        </div>
      </div>
    );
  }

  const delitos = seguridad.delitos_por_ano || {};

  // Preparar datos para Recharts (exclusivo para Delitos oficiales)
  const chartData = useMemo(() => {
    return [
      {
        yearKey: '2023',
        label: '2023',
        delitos: delitos['2023'] ?? 0,
        isProy: false,
        isReal: false
      },
      {
        yearKey: '2024',
        label: '2024',
        delitos: delitos['2024'] ?? 0,
        isProy: false,
        isReal: false
      },
      {
        yearKey: '2025',
        label: '2025',
        delitos: delitos['2025'] ?? 0,
        isProy: false,
        isReal: false
      },
      {
        yearKey: '2026_real',
        label: '2026 (Real)',
        delitos: delitos['2026_real'] ?? 0,
        isProy: false,
        isReal: true
      },
      {
        yearKey: '2026_proy',
        label: '2026 (Proy)',
        delitos: delitos['2026_proy'] ?? 0,
        isProy: true,
        isReal: false
      }
    ];
  }, [delitos]);

  // Cálculos de máximos para barras de proporción
  const maxDelito = Math.max(...chartData.map(d => d.delitos), 1);

  // Variaciones anuales relativas al año base (2023)
  const baseDelitos = delitos['2023'] || 0;
  const getDelitoDelta = (val, key) => {
    if (key === '2023') return { text: 'Base 2023', type: 'base' };
    if (baseDelitos === 0) return null;
    const diff = val - baseDelitos;
    const pct = Math.round((diff / baseDelitos) * 100);
    if (pct < 0) return { text: `${pct}%`, type: 'drop' };
    if (pct > 0) return { text: `+${pct}%`, type: 'up' };
    return { text: '0%', type: 'neutral' };
  };

  const reduccionPct = seguridad.reduccion_delitos_pct;
  const hasReduction = reduccionPct !== null && reduccionPct !== undefined;

  return (
    <div className="dynamic-seguridad-container">
      {/* ============================================================== */}
      {/* 1. HERO BANNER DINÁMICO DE IMPACTO EN SEGURIDAD               */}
      {/* ============================================================== */}
      <div className="security-dynamic-hero-banner">
        <div className="hero-banner-glass-glow" />
        <div className="hero-banner-content">
          <div className="hero-left-stat">
            <div className="shield-icon-glow">
              <ShieldCheck size={38} className="shield-svg" />
              <div className="pulse-ring" />
            </div>
            <div className="hero-stat-texts">
              <span className="hero-eyebrow">
                <Sparkles size={13} className="hero-sparkle-icon" />
                Evaluación Oficial de Impacto Delictivo
              </span>
              <div className="hero-main-pct-row">
                <span className="hero-pct-value">
                  {hasReduction ? (
                    <AnimatedCounter targetValue={reduccionPct} isPercentage={true} duration={1000} />
                  ) : (
                    'OFICIAL'
                  )}
                </span>
                <span className="hero-pct-caption">
                  {hasReduction && reduccionPct <= 0 ? 'Disminución delictiva consolidada' : 'Variación delictiva oficial registrada'}
                </span>
              </div>
            </div>
          </div>

          <div className="hero-right-kpis">
            <div className="hero-kpi-chip">
              <span className="hero-kpi-lbl">Pico Delictivo (2023)</span>
              <strong className="hero-kpi-val text-red">
                <AnimatedCounter targetValue={delitos['2023'] ?? 0} /> casos
              </strong>
            </div>
            <div className="hero-kpi-chip highlight-chip">
              <span className="hero-kpi-lbl">Corte Actual (2026 Real)</span>
              <strong className="hero-kpi-val text-green">
                <AnimatedCounter targetValue={delitos['2026_real'] ?? 0} /> casos
              </strong>
            </div>
            <div className="hero-kpi-chip">
              <span className="hero-kpi-lbl">Estado de Intervención</span>
              <span className="hero-kpi-badge">
                <CheckCircle2 size={12} />
                Mitigación Sostenida
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. VISUALIZADOR GRÁFICO INTERACTIVO (RECHARTS DINÁMICO)       */}
      {/* ============================================================== */}
      <div className="dynamic-chart-card">
        <div className="chart-card-header">
          <div className="chart-title-group">
            <div className="chart-icon-box">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="chart-main-title">Tendencia Visual Interanual (2023 – 2026)</h4>
              <p className="chart-subtitle">
                Evolución histórica y proyección de Delitos Registrados en el área de intervención
              </p>
            </div>
          </div>

          <div className="chart-controls-group">
            {/* Selector de Tipo de Gráfico */}
            <div className="segmented-toggle-type">
              <button 
                className={`type-btn ${chartView === 'area' ? 'active' : ''}`}
                onClick={() => setChartView('area')}
                title="Gráfico de Área Suave"
              >
                <TrendingDown size={15} />
                <span>Curvas</span>
              </button>
              <button 
                className={`type-btn ${chartView === 'bar' ? 'active' : ''}`}
                onClick={() => setChartView('bar')}
                title="Gráfico de Barras Comparativas"
              >
                <BarChart3 size={15} />
                <span>Barras</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico Recharts con Animación Fluida */}
        <div className="chart-render-area" style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  {/* Gradiente Delitos (Esmeralda / Menta) */}
                  <linearGradient id="colorDelitos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={11.5} 
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, fontSize: '12px', fontWeight: 600 }}
                  formatter={() => 'Delitos Registrados'}
                />

                <Area
                  type="monotone"
                  dataKey="delitos"
                  name="delitos"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDelitos)"
                  isAnimationActive={true}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 3 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={11.5} 
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, fontSize: '12px', fontWeight: 600 }}
                  formatter={() => 'Delitos Registrados'}
                />

                <Bar
                  dataKey="delitos"
                  name="delitos"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TARJETAS COMPARATIVAS DE DELITOS CON ANIMACIÓN Y DELTAS    */}
      {/* ============================================================== */}
      <div className="dynamic-metric-card-block">
        <div className="block-header">
          <div className="block-title-row">
            <span className="block-badge-pill green">Delitos</span>
            <span className="block-headline">Evolución de Delitos Registrados por Año</span>
          </div>
          <span className="block-source-tag">Fuente: Reporte de Seguridad DMQ</span>
        </div>

        <div className="animated-year-grid">
          {chartData.map((item, idx) => {
            const val = item.delitos;
            const delta = getDelitoDelta(val, item.yearKey);
            const heightPct = maxDelito > 0 ? Math.max((val / maxDelito) * 100, 6) : 6;
            const isZero = val === 0;

            return (
              <div 
                key={item.yearKey}
                className={`anim-year-card ${item.isProy ? 'is-projected' : ''} ${item.isReal ? 'is-real' : ''} ${isZero ? 'is-zero-success' : ''}`}
                style={{ animationDelay: `${idx * 0.08}s` }}
                onMouseEnter={() => setHighlightedYear(item.yearKey)}
                onMouseLeave={() => setHighlightedYear(null)}
              >
                <div className="card-top-tag">
                  <span>{item.label}</span>
                  {item.isReal && <span className="real-cut-badge">Corte Ene-Abr</span>}
                  {item.isProy && <span className="proy-badge">Proy. Anual</span>}
                </div>

                <div className="card-number-wrapper">
                  <strong className="anim-big-number">
                    <AnimatedCounter targetValue={val} />
                  </strong>
                  <span className="card-number-sub">Delitos Totales</span>
                </div>

                {/* Micro barra animada de proporción */}
                <div className="card-sparkline-track">
                  <div 
                    className="card-sparkline-bar green-bar" 
                    style={{ width: `${heightPct}%` }}
                  />
                </div>

                {/* Badge de Variación vs 2023 */}
                {delta && (
                  <div className={`card-delta-badge delta-${delta.type}`}>
                    {delta.type === 'drop' && <TrendingDown size={11} />}
                    {delta.type === 'up' && <TrendingUp size={11} />}
                    <span>{delta.text}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. DESGLOSE COMPARATIVO POR TIPOLOGÍA DELICTIVA                */}
      {/* ============================================================== */}
      <div className="dynamic-breakdown-card">
        <div className="breakdown-card-header">
          <div className="breakdown-title-wrap">
            <h4 className="breakdown-heading">Desglose Detallado por Tipología Delictiva</h4>
            <p className="breakdown-desc">
              Comportamiento específico por tipo de delito en el corte observado y proyectado
            </p>
          </div>
          <span className="block-source-tag">
            {seguridad.top_delitos?.length || 0} tipologías delictivas
          </span>
        </div>

        <div className="breakdown-content-wrap animate-fade-in">
          {seguridad.top_delitos && seguridad.top_delitos.length > 0 ? (
            <div className="modern-table-responsive">
              <table className="interactive-metric-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Tipología Delictiva</th>
                    <th className="text-center">2023</th>
                    <th className="text-center">2024</th>
                    <th className="text-center">2025</th>
                    <th className="text-center col-real">2026 (Real Ene-Abr)</th>
                    <th className="text-center col-proy">2026 (Proy Anual)</th>
                    <th style={{ width: '22%' }}>Impacto Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {seguridad.top_delitos.map((td, i) => {
                    const v23 = td.valores?.['2023'] ?? 0;
                    const vReal = td.valores?.['2026_real'] ?? 0;
                    const vProy = td.valores?.['2026_proy'] ?? 0;
                    const has23 = typeof v23 === 'number' && v23 > 0;
                    const pct = has23 ? Math.round(((vProy - v23) / v23) * 100) : null;

                    return (
                      <tr key={i} className="interactive-tr">
                        <td className="font-semibold text-slate-800">
                          <div className="variable-label-cell">
                            {getVariableIcon(td.label)}
                            <span>{td.label}</span>
                          </div>
                        </td>
                        <td className="text-center font-medium text-slate-600">{td.valores?.['2023'] ?? 0}</td>
                        <td className="text-center font-medium text-slate-600">{td.valores?.['2024'] ?? 0}</td>
                        <td className="text-center font-medium text-slate-600">{td.valores?.['2025'] ?? 0}</td>
                        <td className="text-center col-real">
                          <span className={`num-pill ${vReal === 0 ? 'zero-pill' : 'count-pill'}`}>
                            {vReal}
                          </span>
                        </td>
                        <td className="text-center col-proy">
                          <span className={`num-pill-proy ${vProy === 0 ? 'zero-proy' : ''}`}>
                            {vProy}
                          </span>
                        </td>
                        <td>
                          {has23 ? (
                            vProy === 0 ? (
                              <span className="status-badge-success">
                                <CheckCircle2 size={12} />
                                <span>-100% Sin casos proyectados</span>
                              </span>
                            ) : pct < 0 ? (
                              <span className="status-badge-drop">
                                <TrendingDown size={12} />
                                <span>{pct}% Disminución</span>
                              </span>
                            ) : pct > 0 ? (
                              <span className="status-badge-drop" style={{ color: '#ea580c', background: '#fff7ed', borderColor: '#fed7aa' }}>
                                <TrendingUp size={12} />
                                <span>+{pct}% Variación</span>
                              </span>
                            ) : (
                              <span className="status-badge-neutral">
                                0% Estable
                              </span>
                            )
                          ) : (
                            vProy === 0 ? (
                              <span className="status-badge-neutral">
                                Sin incidencia previa
                              </span>
                            ) : (
                              <span className="status-badge-drop" style={{ color: '#ea580c', background: '#fff7ed', borderColor: '#fed7aa' }}>
                                <TrendingUp size={12} />
                                <span>+{vProy} casos nuevos</span>
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-subtext">No se registran delitos específicos desglosados para este sector.</p>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. NOTA METODOLÓGICA Y FUENTE OFICIAL                          */}
      {/* ============================================================== */}
      <div className="security-methodology-footer">
        <div className="footer-info-icon">
          <Info size={16} />
        </div>
        <div className="footer-info-content">
          <strong>Fuente Institucional y Metodología:</strong>{' '}
          {seguridad.descripcion || `Datos oficiales procesados por la Secretaría de Seguridad y Gobernabilidad del Distrito Metropolitano de Quito para ${proyectoNombre}. Corte observado 2026 correspondiente al período Enero - Abril.`}
        </div>
      </div>
    </div>
  );
}
