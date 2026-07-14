import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ECO_CACHE_TTL = 600000; // 10 minutes cache

const MONTHS_ES = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
  'julio': 7, 'agosto': 8, 'septiembre': 9, 'setiembre': 9, 'octubre': 10,
  'noviembre': 11, 'diciembre': 12
};

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  const str = value.toString().strip ? value.toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    : String(value).trim().toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return str.replace(/benalzacar/g, 'benalcazar');
}

function parseFlexibleDate(value) {
  if (!value) return null;
  
  if (value instanceof Date) {
    return {
      date: value,
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      precision: 'date'
    };
  }

  const text = value.toString().trim();
  if (!text || ['no', 'nan', 'none', '-', '—'].includes(normalizeText(text))) {
    return null;
  }

  // YYYY-MM-DD
  const matchYmd = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchYmd) {
    const y = parseInt(matchYmd[1]);
    const m = parseInt(matchYmd[2]);
    const d = parseInt(matchYmd[3]);
    return {
      date: new Date(Date.UTC(y, m - 1, d)),
      year: y,
      month: m,
      day: d,
      precision: 'date'
    };
  }

  // Year only
  const matchYearOnly = text.match(/^\b(19|20)\d{2}\b$/);
  if (matchYearOnly) {
    const y = parseInt(text);
    return {
      date: new Date(Date.UTC(y, 0, 1)),
      year: y,
      month: null,
      day: null,
      precision: 'year'
    };
  }

  // Parse ES format: e.g. "15 de mayo de 2024"
  const norm = normalizeText(text);
  const mEs = norm.match(/(\d{1,2})\s*(?:de\s*)?([a-zñ]+)\s*(?:de\s*)?(\d{4})/);
  if (mEs) {
    const day = parseInt(mEs[1]);
    const monthName = mEs[2];
    const year = parseInt(mEs[3]);
    const month = MONTHS_ES[monthName];
    if (month) {
      return {
        date: new Date(Date.UTC(year, month - 1, day)),
        year,
        month,
        day,
        precision: 'date'
      };
    }
  }

  // Parse Month Year ES: e.g. "mayo 2024"
  const mMonth = norm.match(/([a-zñ]+)\s+(\d{4})/);
  if (mMonth) {
    const monthName = mMonth[1];
    const year = parseInt(mMonth[2]);
    const month = MONTHS_ES[monthName];
    if (month) {
      return {
        date: new Date(Date.UTC(year, month - 1, 1)),
        year,
        month,
        day: null,
        precision: 'month'
      };
    }
  }

  // General ISO string fallback
  const parsed = Date.parse(text);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    return {
      date: dt,
      year: dt.getFullYear(),
      month: dt.getMonth() + 1,
      day: dt.getDate(),
      precision: 'date'
    };
  }

  // Year search anywhere
  const mYearAny = norm.match(/\b(19|20)\d{2}\b/);
  if (mYearAny) {
    const year = parseInt(mYearAny[0]);
    return {
      date: new Date(Date.UTC(year, 0, 1)),
      year,
      month: null,
      day: null,
      precision: 'year'
    };
  }

  return null;
}

function buildSectorAliasMap(proyectos) {
  const aliasMap = {};
  proyectos.forEach((proj) => {
    aliasMap[normalizeText(proj.nombre)] = proj.nombre;
    if (proj.ubicacion) {
      aliasMap[normalizeText(proj.ubicacion)] = proj.nombre;
    }
  });
  return aliasMap;
}

function resolveSectorName(rawSector, aliasMap) {
  if (!rawSector) return null;
  if (!global.resolvedSectorsCache) {
    global.resolvedSectorsCache = {};
  }
  if (global.resolvedSectorsCache[rawSector] !== undefined) {
    return global.resolvedSectorsCache[rawSector];
  }

  const normalized = normalizeText(rawSector);
  if (!normalized) {
    global.resolvedSectorsCache[rawSector] = null;
    return null;
  }

  // Mapeos explícitos manuales para casos especiales
  if (normalized === 'entorno bicentenario' || normalized === 'bicentenario') {
    const canonical = 'El Labrador: Bulevar y Parque de la Resiliencia';
    global.resolvedSectorsCache[rawSector] = canonical;
    return canonical;
  }

  if (aliasMap[normalized]) {
    global.resolvedSectorsCache[rawSector] = aliasMap[normalized];
    return aliasMap[normalized];
  }
  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (alias && (alias.includes(normalized) || normalized.includes(alias))) {
      global.resolvedSectorsCache[rawSector] = canonical;
      return canonical;
    }
  }
  global.resolvedSectorsCache[rawSector] = null;
  return null;
}

function isAfterOrEqualReference(fechaImpresion, fechaReferencia) {
  if (!fechaImpresion || !fechaReferencia) return true;
  
  const refPrecision = fechaReferencia.precision;
  
  if (refPrecision === 'date') {
    // compare actual dates
    return new Date(fechaImpresion).getTime() >= new Date(fechaReferencia.date).getTime();
  }
  
  // compare years
  const impYear = new Date(fechaImpresion).getFullYear();
  return impYear >= fechaReferencia.year;
}

function classifyBusiness(record, fechaReferencia) {
  const movimiento = normalizeText(record.movimiento_raw);
  const fechaImpresion = record.fecha_impresion;

  if (movimiento.includes('renov')) {
    return 'renovado';
  }
  if (movimiento.includes('emisi')) {
    return 'abierto';
  }

  if (fechaReferencia && fechaImpresion) {
    const refDate = new Date(fechaReferencia.date);
    const impDate = new Date(fechaImpresion);
    if (fechaReferencia.precision === 'date') {
      return impDate.getTime() < refDate.getTime() ? 'renovado' : 'abierto';
    } else {
      const refYear = fechaReferencia.year;
      const impYear = impDate.getFullYear();
      return impYear < refYear ? 'renovado' : 'abierto';
    }
  }

  return 'indeterminado';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sectorSeleccionado = searchParams.get('sector');

  if (searchParams.get('clearCache') === 'true') {
    global.resolvedSectorsCache = {};
    global.cachedEcoRecords = null;
    global.lastEcoFetchTime = null;
  }

  if (!sectorSeleccionado) {
    return NextResponse.json({ success: false, error: 'Falta el parámetro de sector' }, { status: 400 });
  }

  try {
    // 1. Obtener proyectos para construir alias (usar caché global si está disponible)
    let proyectos = [];
    if (global.cachedData && global.cachedData.proyectos) {
      proyectos = global.cachedData.proyectos;
    } else {
      const { data: projData, error: projError } = await supabase
        .from('proyectos')
        .select('*');
      if (projError) throw projError;
      proyectos = projData;
    }

    // Buscar proyecto específico
    const proyectoRef = proyectos.find(p => p.nombre === sectorSeleccionado);
    if (!proyectoRef) {
      return NextResponse.json({ success: false, error: 'Sector no encontrado en base de datos' }, { status: 404 });
    }

    const fechaReferencia = parseFlexibleDate(proyectoRef.fecha_inauguracion);

    // 2. Obtener registros de economía para el sector seleccionado de forma paginada
    let records = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: ecoError } = await supabase
        .from('economia_registros')
        .select('*')
        .eq('sector_raw', sectorSeleccionado)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (ecoError) throw ecoError;

      if (pageData && pageData.length > 0) {
        records = records.concat(pageData);
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    const aliasMap = buildSectorAliasMap(proyectos);
    const clasificados = [];
    const controlMov = { renovacion: 0, emision: 0 };
    let excluidosFecha = 0;

    const desgloseAnualMap = {};

    records.forEach((record) => {
      const sectorResuelto = resolveSectorName(record.sector_raw, aliasMap);
      if (sectorResuelto !== sectorSeleccionado) {
        return;
      }

      // Clasificación y desglose anual de todos los registros del sector (sin filtrar por fecha)
      const recordType = classifyBusiness(record, fechaReferencia);
      if (recordType !== 'indeterminado') {
        const anio = record.fecha_impresion ? new Date(record.fecha_impresion).getFullYear() : 'Desconocido';
        if (!desgloseAnualMap[anio]) {
          desgloseAnualMap[anio] = { abiertos: 0, renovados: 0 };
        }
        if (recordType === 'abierto') {
          desgloseAnualMap[anio].abiertos++;
        } else if (recordType === 'renovado') {
          desgloseAnualMap[anio].renovados++;
        }
      }

      // Filtro por fecha de inauguración para estadísticas principales del dashboard
      if (!isAfterOrEqualReference(record.fecha_impresion, fechaReferencia)) {
        excluidosFecha++;
        return;
      }

      const mov = normalizeText(record.movimiento_raw);
      if (mov.includes('renov')) {
        controlMov.renovacion++;
      } else if (mov.includes('emisi')) {
        controlMov.emision++;
      }

      if (recordType !== 'indeterminado') {
        clasificados.push(recordType);
      }
    });

    const abiertosCount = clasificados.filter(c => c === 'abierto').length;
    const renovadosCount = clasificados.filter(c => c === 'renovado').length;

    const resumen = [
      { categoria: 'abierto', cantidad: abiertosCount },
      { categoria: 'renovado', cantidad: renovadosCount }
    ];

    const desgloseAnual = Object.entries(desgloseAnualMap)
      .map(([anio, data]) => ({
        anio: anio === 'Desconocido' ? anio : parseInt(anio),
        abiertos: data.abiertos,
        renovados: data.renovados
      }))
      .sort((a, b) => {
        if (a.anio === 'Desconocido') return 1;
        if (b.anio === 'Desconocido') return -1;
        return a.anio - b.anio;
      });

    return NextResponse.json({
      success: true,
      abiertos: abiertosCount,
      renovados: renovadosCount,
      resumen,
      desglose_anual: desgloseAnual,
      excluidos_fecha: excluidosFecha,
      control_mov: controlMov,
      fecha_referencia: fechaReferencia,
      fecha_txt: proyectoRef.fecha_inauguracion || 'Sin fecha'
    });
  } catch (error) {
    console.error('Error en API economía:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
