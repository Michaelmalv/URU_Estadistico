import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CACHE_TTL = 0; // Disable cache for real-time updates

export async function GET() {
  const now = Date.now();
  const cachedData = global.cachedData || null;
  const lastFetchTime = global.lastFetchTime || null;

  if (cachedData && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(cachedData);
  }

  try {
    // 1. Obtener todos los proyectos
    const { data: proyectos, error: projError } = await supabase
      .from('proyectos')
      .select('*')
      .order('nombre', { ascending: true });

    if (projError) throw projError;

    // 2. Obtener estadísticas de seguridad (paginado para superar el límite de 1000 de Postgrest)
    let seguridad = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: segError } = await supabase
        .from('seguridad_estadisticas')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (segError) throw segError;

      if (pageData && pageData.length > 0) {
        seguridad = seguridad.concat(pageData);
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    // 3. Obtener fichas de senderos
    const { data: fichas, error: fichError } = await supabase
      .from('senderos_fichas')
      .select('*');

    if (fichError) throw fichError;

    // 4. Obtener valor de suelo
    const { data: valorSuelo, error: sueloError } = await supabase
      .from('valor_suelo')
      .select('*');

    if (sueloError) throw sueloError;

    const ALLOWED_PROJECT_NAMES = [
      'Av. Colón',
      'Av. Patria',
      'Escalinatas Rocafuerte',
      'Isla Tortuga',
      'La Roldós Oe13-Colinas del Norte',
      'Bulevar Tribuna de los Shyris',
      'Parque Navarro - Plaza de las tripas',
      'Calle Rocafuerte',
      'Calle Benalcazar'
    ];

    const filteredProyectos = (proyectos || []).filter(p => ALLOWED_PROJECT_NAMES.includes(p.nombre));
    const allowedIds = new Set(filteredProyectos.map(p => p.id));

    const filteredSeguridad = (seguridad || []).filter(s => allowedIds.has(s.proyecto_id));
    const filteredFichas = (fichas || []).filter(f => allowedIds.has(f.proyecto_id));
    
    const normalizeName = (name) => name ? name.toLowerCase().trim().replace(/[\s\-_]+/g, ' ') : '';
    const normalizedAllowed = ALLOWED_PROJECT_NAMES.map(normalizeName);
    const filteredValorSuelo = (valorSuelo || []).filter(v => normalizedAllowed.includes(normalizeName(v.proyecto)));

    const resultData = {
      success: true,
      proyectos: filteredProyectos,
      seguridad: filteredSeguridad,
      fichas: filteredFichas,
      valorSuelo: filteredValorSuelo,
    };
    global.cachedData = resultData;
    global.lastFetchTime = now;

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
