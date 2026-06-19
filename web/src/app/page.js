'use strict';
'use client';

import { useState } from 'react';

const CATEGORIAS_INFO = {
  'Senderos Seguros': {
    image: '/imagenes_categorias/senderos_seguros/senderos_seguros.png',
    summary: 'Corredores peatonales diseñados estratégicamente para mitigar índices delictivos y mejorar la seguridad de transeúntes.',
    content: (
      <div className="article-content">
        <h1>Senderos Seguros</h1>
        <div className="info-alert">
          Los <strong>Senderos Seguros</strong> son corredores de circulación diseñados estratégicamente para mejorar la percepción de seguridad en el espacio público, mitigar los índices delictivos y promover el flujo de transeúntes en zonas identificadas como vulnerables.
        </div>
        <p>Su origen se inspira en proyectos exitosos de ciudades como México, adaptados a la realidad de la capital ecuatoriana para erradicar problemáticas como el acoso y la violencia de género en las calles.</p>

        <h3>Metodología de Identificación y Priorización</h3>
        <p>Para identificar los corredores que requieren intervención prioritaria, las secretarías metropolitanas analizan el territorio utilizando una <strong>matriz técnica basada en 6 dimensiones urbanas y 18 indicadores</strong>:</p>
        <ul>
          <li><strong>Seguridad ciudadana:</strong> Monitoreo de actos delictivos (robos a personas), focos de venta de droga y estadísticas de atropellamientos a transeúntes.</li>
          <li><strong>Equidad socioespacial:</strong> Densidad poblacional, cercanía a unidades educativas, equipamientos de salud y Necesidades Básicas Insatisfechas (NBI).</li>
          <li><strong>Perspectiva de género:</strong> Reportes administrativos de violencia de género y acoso en la vía pública.</li>
          <li><strong>Sostenibilidad urbana:</strong> Índices de uso de suelo múltiple, uso residencial urbano de alta densidad (RUA) y presencia de áreas verdes.</li>
          <li><strong>Capital social:</strong> Proximidad y articulación con centros comunitarios como Casas Somos, Centros de Desarrollo Infantil (CDI) y Centros de Equidad y Justicia (CEJ).</li>
          <li><strong>Acceso a transporte público:</strong> Conectividad e intermodalidad con paradas del Metro, paradas de Buses de Tránsito Rápido (BTR) y paradas de buses convencionales.</li>
        </ul>

        <h3>Tipos de Intervención en el Territorio</h3>
        <p>Las obras se dividen en dos líneas de acción complementarias:</p>
        <ol style={{ paddingLeft: '1.5rem', margin: '1rem 0' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Físicas Permanentes:</strong> Ampliación geométrica de aceras, soterramiento de cables de servicios, instalación de baldosas podotáctiles para accesibilidad universal, iluminación con tecnología LED, contenedores para separación de desechos y pacificación vial mediante estrategias de calmado de tránsito (como orejas de elefante o resaltos peatonales).</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>De Reactivación Itinerante o Permanente:</strong> Aplicación de urbanismo táctico con diseños coloridos sobre las calzadas, galerías de murales artísticos, ferias de producción cultural y activación de circuitos económicos locales en coordinación con la comunidad.</li>
        </ol>

        <h3>Proyectos Emblemáticos Ejecutados</h3>
        <ul>
          <li><strong>Av. Patria (1.270 m):</strong> Rediseño integral de aceras, soterramiento de cables, iluminación LED de alta potencia, paisajismo con plantas endémicas y la construcción de la Plaza de la Memoria. Beneficia a más de 200.000 habitantes.</li>
          <li><strong>Av. Colón (2.000 m):</strong> Eje multimodal que articula el transporte público. Incluye reformas geométricas para accesibilidad, alcorques para arbolado urbano, luminarias solares y sistemas de videovigilancia.</li>
          <li><strong>Intervenciones Zonales:</strong> Proyectos adaptados a las particularidades de cada sector en: <em>Los Chillos</em> (El Tingo), <em>Eloy Alfaro</em> (Av. Michelena), <em>Quitumbe</em> (Chillogallo), <em>Manuela Sáenz</em> (Caldas y Antepara), <em>Calderón</em> (Av. Carapungo) e <em>Eugenio Espejo</em> (Isla Tortuga).</li>
        </ul>
      </div>
    )
  },
  'Zonas Metro': {
    image: '/imagenes_categorias/zonas_metro/zonas_metro.jpg',
    summary: 'Modelo de ordenamiento físico-espacial en los exteriores de las estaciones para ordenar el flujo peatonal masivo.',
    content: (
      <div className="article-content">
        <h1>Zonas Metro</h1>
        <div className="info-alert">
          Para ordenar la alta concentración peatonal y el flujo masivo en los exteriores de las estaciones del Metro de Quito, se diseñó un <strong>modelo de ordenamiento físico-espacial</strong> que divide los accesos en tres zonas concéntricas:
        </div>
        <ul>
          <li><strong>Zona A - Aglomeración:</strong> Es el área colindante inmediata a la boca de ingreso del Metro. Está destinada de forma <strong>exclusiva</strong> a garantizar la entrada y salida fluida y segura de los pasajeros, por lo que debe mantenerse completamente libre de obstáculos.</li>
          <li><strong>Zona B - Concentración:</strong> Funciona como una franja o área de amortiguamiento urbano. En este espacio se permite la instalación regulada de <strong>mobiliario confortable</strong> (bancas, basureros, iluminación) diseñado para la permanencia o espera de los usuarios.</li>
          <li><strong>Zona C - Dispersión:</strong> Es el área abierta perimetral. Está perfilada como el lugar idóneo para la colocación de <strong>señalética de orientación</strong>, paradas de transporte complementario y casetas de <strong>comerciantes autónomos regularizados</strong> bajo el debido proceso de autorización.</li>
        </ul>

        <h3>Tótems de Identidad Metropolitana</h3>
        <p>Cada estación cuenta con un <strong>hito vertical unificado</strong> que le otorga identidad al entorno urbano. Este elemento técnico cuenta con las siguientes especificaciones y componentes:</p>
        <blockquote>
          <strong>Dimensiones estructurales:</strong> 4.04 metros de altura × 0.70 metros de ancho.
        </blockquote>
        <ul>
          <li><strong>Identificación:</strong> Incorpora el logo iconográfico de la estación y su nombre visible a larga distancia.</li>
          <li><strong>Orientación:</strong> Integra mapas detallados del sector y de la red completa del sistema de transporte.</li>
          <li><strong>Accesibilidad universal:</strong> Incluye un <strong>Mapa Háptico</strong> con texturas y relieves en braille especialmente diseñado para personas con discapacidad visual.</li>
          <li><strong>Información y servicios:</strong> Cuenta con espacios inferiores destinados a paneles informativos de la ciudad o publicidad regulada.</li>
        </ul>
      </div>
    )
  },
  'Rehabilitación del Espacio Público': {
    image: '/imagenes_categorias/rehabilitacion_espacio_publico/rehabilitacion_ch.png',
    summary: 'Revitalización de calles patrimoniales y viaductos para conectar peatonalmente y reactivar el comercio nocturno.',
    content: (
      <div className="article-content">
        <h1>Rehabilitación del Espacio Público</h1>
        <div className="info-alert">
          El plan de revitalización urbana busca devolver las calles al peatón, recuperando la memoria histórica y promoviendo la reactivación comercial, turística y cultural tanto de día como de noche.
        </div>

        <h3>Intervención en la Calle Benalcázar (Plaza de San Francisco)</h3>
        <p>Se modificó la sección vial tradicional mediante la <strong>ampliación de la plataforma peatonal</strong> en el primer tramo de la Av. Benalcázar, eliminando las plazas de estacionamiento vehicular que congestionaban la acera. Esta obra contempla:</p>
        <ul>
          <li><strong>Terrazas Urbanas:</strong> Autorización para la colocación de mesas en las veredas por parte de cafeterías y restaurantes (con un ancho máximo de 2.50 m). Esto promueve la estrategia de <em>"ojos en la calle"</em> y mejora la seguridad ciudadana a través de la activación económica.</li>
          <li><strong>Galerías Culturales Urbanas:</strong> Utilización de muros ciegos y fachadas patrimoniales para la proyección nocturna de imágenes informativas, artísticas y culturales de la ciudad (<em>mapping</em>), como en la fachada de la Iglesia de la Compañía de Jesús.</li>
        </ul>

        <h3>Recuperación del Viaducto de la 24 de Mayo</h3>
        <p>Transformación integral de la infraestructura del viaducto subterráneo para <strong>conectar de forma segura la superficie con el transporte masivo</strong>. El proyecto incorpora:</p>
        <ul>
          <li><strong>Bahía técnica:</strong> Espacio exclusivo para la carga y descarga segura de pasajeros.</li>
          <li><strong>Seguridad vial:</strong> Señalización técnica diseñada para la reducción de velocidad vehicular.</li>
          <li><strong>Túnel peatonal:</strong> Conexión subterránea bajo la calle Cuenca que guía de forma directa a los usuarios hacia el hall del subsuelo de la estación del Metro.</li>
        </ul>
      </div>
    )
  },
  'Bicentenario': {
    image: '/imagenes_categorias/bicentenario/bicentenario.png',
    summary: 'Megaproyecto de renovación urbana de 105 hectáreas que integra humedales, ciclovías, deportes y una arena para conciertos.',
    content: (
      <div className="article-content">
        <h1>Bicentenario</h1>
        <div className="info-alert">
          La repotenciación de las 105 hectáreas del antiguo aeropuerto representa el proyecto de renovación y revitalización urbana más ambicioso del Distrito Metropolitano. Proyectado bajo las normativas del Plan de Uso y Gestión del Suelo (PUGS), este espacio técnico tiene el potencial de albergar vivienda y servicios para una población de hasta 304.000 habitantes, frenando la expansión descontrolada de las periferias.
        </div>

        <h3>Sostenibilidad e Infraestructura Verde-Azul</h3>
        <p>Con el fin de mitigar los efectos del cambio climático en la zona centro-norte, el parque implementa soluciones ambientales estratégicas:</p>
        <ul>
          <li><strong>Suelo permeable:</strong> Incremento del 5% de su superficie de absorción.</li>
          <li><strong>Red Verde-Azul:</strong> Consolidación de 8 hectáreas que contemplan la creación de <strong>6 cuerpos de agua y humedales</strong> diseñados para la captación técnica de aguas lluvias, la regulación del microclima y el fomento de la biodiversidad urbana.</li>
        </ul>

        <h3>Deporte, Comercio y Recreación Replicable</h3>
        <p>El megaproyecto organiza su espacio público a través de módulos replicables de equipamiento de alta calidad:</p>
        <ul>
          <li><strong>67 Canchas Deportivas:</strong> 21 de fútbol, 19 de voleibol, 11 de básquet, 7 de tenis, 5 múltiples, 3 de balonmano y 1 de béisbol.</li>
          <li><strong>Movilidad Activa:</strong> Construcción de <strong>12 km de caminerías internas</strong> iluminadas (divididas en 5 tipologías de diseño de estancia) y una red de <strong>14.4 km de ciclovías</strong> con carril segregado.</li>
          <li><strong>14 Plazas Comerciales:</strong> Equipadas con <strong>360 kioscos modulares</strong> de madera (1.80 × 1.80 m) integrados a zonas de vegetación y descanso para promover y ordenar el comercio local.</li>
          <li><strong>Zonas Temáticas:</strong> Incorporación de 12 áreas de juegos infantiles (con zonas especiales para la primera infancia), 38 zonas de picnic/descanso y 5 parques caninos (<em>dogparks</em>).</li>
        </ul>

        <h3>Grandes Hitos de Entretenimiento Masivo</h3>
        <ul>
          <li><strong>Arena de Espectáculos Quito:</strong> Megaestructura equipada con un escenario principal con capacidad para <strong>50.000 espectadores</strong>, diseñado para insertar a la capital en el circuito internacional de grandes conciertos, festivales y ferias masivas.</li>
          <li><strong>Anfiteatro Polifuncional:</strong> Espacio cultural al aire libre totalmente integrado al paisaje del parque, el cual utiliza relieves técnicos y graderíos naturales de césped para albergar eventos artísticos y comunitarios.</li>
        </ul>
      </div>
    )
  },
  'Arena del Sur': {
    image: '/imagenes_categorias/arena_del_sur/arena_del_sur.png',
    summary: 'Infraestructura cultural multifuncional en Quitumbe con centro cultural y plaza de espectáculos al aire libre.',
    content: (
      <div className="article-content">
        <h1>Quitumbe: Arena Cultural del Sur</h1>
        <div className="info-alert">
          Es un equipamiento cultural metropolitano de infraestructura inclusiva y multifuncional impulsado por la Alcaldía Metropolitana de Quito. Está diseñado para fortalecer la integración social, el acceso equitativo a la cultura y la dinamización comunitaria en el sur de la ciudad.
        </div>

        <h3>Cifras Clave del Proyecto</h3>
        <ul>
          <li><strong>Área de intervención:</strong> 33.944,72 m²</li>
          <li><strong>Inversión estimada:</strong> USD 6,2 millones</li>
          <li><strong>Ubicación:</strong> Centralidad Urbana Quitumbe</li>
        </ul>

        <h3>Componentes Principales (Plan de Intervención)</h3>
        <p>El proyecto articula sus actividades e infraestructura en dos grandes bloques de equipamiento:</p>
        <ol style={{ paddingLeft: '1.5rem', margin: '1rem 0' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Centro Cultural Quitumbe:</strong> Un nodo de encuentro enfocado en la educación y las artes que incluye biblioteca, talleres artísticos, salas de danza, expresión corporal, auditorios y áreas educativas.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Plaza de Espectáculos Quitumbe:</strong> Una infraestructura al aire libre dotada de una gran cubierta de diseño contemporáneo, optimizada para albergar eventos recreativos y conciertos masivos.</li>
        </ol>

        <h3>Propósito e Impacto</h3>
        <ul>
          <li><strong>Encuentro ciudadano:</strong> Funciona como un espacio para articular actividades artísticas, educativas y recreativas.</li>
          <li><strong>Fomento de la cohesión:</strong> Busca promover la apropiación pacífica del espacio público, la cohesión social y el bienestar de la población del sur de Quito.</li>
        </ul>
      </div>
    )
  }
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    return (
      <div>
        <div className="view-back-button">
          <button 
            className="btn btn-outline" 
            onClick={() => setActiveCategory(null)}
          >
            ← Volver a Áreas de Intervención
          </button>
        </div>
        {CATEGORIAS_INFO[activeCategory].content}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Áreas de Intervención</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Explora los principales ejes de intervención institucional del Distrito Metropolitano de Quito.
      </p>

      <div className="info-grid">
        {Object.entries(CATEGORIAS_INFO).map(([nombre, info]) => (
          <div key={nombre} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
              className="info-card-image" 
              style={{ backgroundImage: `url('${info.image}')` }}
            />
            <h3 style={{ marginBottom: '0.5rem' }}>{nombre}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '1.25rem' }}>
              {info.summary}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setActiveCategory(nombre)}
            >
              Ver detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
