'use strict';
import React from 'react';

export const CATEGORIAS_INFO = {
  'Senderos Seguros': {
    image: '/imagenes_categorias/senderos_seguros/Senderos Seguros.png',
    summary: 'Corredores peatonales diseñados estratégicamente para mitigar índices delictivos y mejorar la seguridad de transeúntes.',
    content: (
      <div className="article-content">
        <h1>Senderos Seguros</h1>
        <p>Los <strong>Senderos Seguros</strong> son corredores de circulación diseñados estratégicamente para mejorar la percepción de seguridad en el espacio público, mitigar los índices delictivos y promover el flujo de transeúntes en zonas identificadas como vulnerables.</p>
        <p>Su origen se inspira en proyectos exitosos de ciudades como México, adaptados a la realidad de la capital ecuatoriana para erradicar problemáticas como el acoso y la violencia de género en las calles.</p>
        <h3>Metodología de Identificación y Priorización</h3>
        <p>Para identificar los corredores que requieren intervención prioritaria, las secretarías metropolitanas analizan el territorio utilizando una <strong>matriz técnica basada en 6 dimensiones urbanas y 18 indicadores</strong>:</p>
        <ul>
          <li><strong>Seguridad ciudadana:</strong> Monitoreo de actos delictivos (robos a personas), focos de venta de droga y estadísticas de atropellamientos a transeúntes.</li>
          <li><strong>Equidad socioespacial:</strong> Densidad poblacional, cercanía a unidades educativas, equipamientos de salud y Necesidades Básicas Insatisfechas (NBI).</li>
          <li><strong>Perspectiva de género:</strong> Reportes administrativos de violencia de género y acoso en la vía pública.</li>
          <li><strong>Sostenibilidad urbana:</strong> Índices de uso de suelo múltiple, uso residencial urbano de alta densidad (RUA) y presencia de áreas verdes.</li>
          <li><strong>Capital social:</strong> Proximidad y articulación con centros comunitarios como Casas Somos, Centros de Desarrollo Infantil (CDI) y Centros de Equidad y Justicia (CEJ).</li>
          <li><strong>Acceso a transporte público:</strong> Conectividad e intermodalidad con paradas del Metro, paradas de Buses de Tránsito Rápido (BTR) y paradas de buses convencionales.</li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/senderos_seguros/extracted_1.png" alt="Detalle" />
        </div>
        <h3>Tipos de Intervención en el Territorio</h3>
        <p>Las obras se dividen en dos líneas de acción complementarias:</p>
        <ul>
          <li><strong>Físicas Permanentes:</strong> Ampliación geométrica de aceras, soterramiento de cables de servicios, instalación de baldosas podotáctiles para accesibilidad universal, iluminación con tecnología LED, contenedores para separación de desechos y pacificación vial mediante estrategias de calmado de tránsito (como orejas de elefante o resaltos peatonales).</li>
          <li><strong>De Reactivación Itinerante o Permanente:</strong> Aplicación de urbanismo táctico con diseños coloridos sobre las calzadas, galerías de murales artísticos, ferias de producción cultural y activación de circuitos económicos locales en coordinación con la comunidad.</li>
        </ul>
        <h3>Proyectos Emblemáticos Ejecutados</h3>
        <ul>
          <li><strong>Av. Patria (1.270 m):</strong> Rediseño integral de aceras, soterramiento de cables, iluminación LED de alta potencia, paisajismo con plantas endémicas y la construcción de la Plaza de la Memoria. Beneficia a más de 200.000 habitantes.</li>
          <li><strong>Av. Colón (2.000 m):</strong> Eje multimodal que articula el transporte público. Incluye reformas geométricas para accesibilidad, alcorques para arbolado urbano, luminarias solares y sistemas de videovigilancia.</li>
          <li><strong>Intervenciones Zonales:</strong> Proyectos adaptados a las particularidades de cada sector en: Los Chillos (El Tingo), Eloy Alfaro (Av. Michelena), Quitumbe (Chillogallo), Manuela Sáenz (Caldas y Antepara), Calderón (Av. Carapungo) e Eugenio Espejo (Isla Tortuga).</li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/senderos_seguros/extracted_2.png" alt="Detalle" />
        </div>
      </div>
    )
  },

  'Zonas Metro': {
    image: '/imagenes_categorias/zonas_metro/Zonas metro.jpg',
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
    image: '/imagenes_categorias/rehabilitacion_espacio_publico/Rehabilitación del Centro Historico.jpg',
    summary: 'Revitalización de calles patrimoniales para conectar peatonalmente y reactivar el comercio nocturno.',
    content: (
      <div className="article-content">
        <h1>Rehabilitación del Espacio Público</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}>1. Bulevar Tribuna de los Shyris</p>
        <ul>
          <li><strong>Concepto del Proyecto:</strong> Transformación radical de la Av. De los Shyris mediante el derrocamiento de la antigua Tribuna para dar paso a un espacio público vanguardista enfocado en las personas, la movilidad activa y la mitigación del riesgo urbano. </li>
          <li><strong>Inversión y Beneficiarios:</strong> Cuenta con una inversión referencial de <strong>USD 950.000,00</strong>, beneficiando de forma directa a más de 400.000 usuarios recurrentes del sector de La Carolina. </li>
          <li><strong>Fases y Componentes de Obra:</strong> </li>
        </ul>
        <p>Fase 1 (Pacificadores): Construcción de amplias plataformas de pacificación vial y mejoramiento de cruces peatonales accesibles en las intersecciones con las calles Holanda (950 m²) y Bélgica (800 m²), incorporando adoquines podotáctiles y bolardos disuasivos. </p>
        <p>Fase 2 (Bulevar y Arborización): Derrocamiento de la estructura de la tribuna, ampliación y reconfiguración de la acera este, arborización con especies nativas y la instalación de 21 estructuras arquitectónicas con <strong>iluminación LED ornamental</strong> rotativa. </p>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/rehabilitacion_espacio_publico/extracted_1.jpeg" alt="Detalle" />
        </div>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/rehabilitacion_espacio_publico/extracted_2.jpeg" alt="Detalle" />
        </div>
        <h3>2. Calle Benalcázar (Eje Centro Histórico)</h3>
        <ul>
          <li><strong>Estrategia de Intervención:</strong> Proyecto prioritario enmarcado en la <strong>Primera Fase de Recuperación Urbana del Centro Histórico (CHQ)</strong>, orientado a revertir el paradigma del uso del vehículo y rescatar la caminabilidad patrimonial.</li>
          <li><strong>Alcance de la Obra:</strong> Intervención a lo largo de un eje continuo de <strong>0.8km</strong> de longitud que sirve como conector directo hacia la estación de Metro San Francisco y los principales equipamientos culturales del casco colonial.</li>
        </ul>
        <h3>Mejoras en el Espacio Público:</h3>
        <p>Ensanchamiento general de aceras y colocación de bandas podotáctiles para accesibilidad universal. </p>
        <p>Implementación de plataformas únicas y nivelación de calzada en cruces peatonales críticos para reducir la velocidad vehicular a un máximo de 30km/h. </p>
        <p>Arborización urbana mediante la dotación de alcorques técnicos e instalación de mobiliario con iluminación pública peatonal homogénea. </p>
        <h3>3. Calle Rocafuerte (Conectividad San Roque - La Loma)</h3>
        <ul>
          <li><strong>Alcance e Inversión:</strong> Proyecto integral a cargo del Instituto Metropolitano de Patrimonio (IMP) y la SHOT, con una extensión de <strong>0.9km</strong> ejecutados entre el Arco de Santo Domingo y la Plaza de la Mama Cuchara (alcanzando los 1.90km en el circuito general de intervención). Representa una inversión aproximada de <strong>USD 1.16</strong> <strong>millones</strong>.</li>
          <li><strong>Espacio Público Ganado:</strong> Recuperación de <strong>2.830 m²</strong> de superficie de rodadura que pasó a ser de uso exclusivo para el peatón mediante ampliación geométrica de aceras.</li>
          <li><strong>Beneficiarios Directos:</strong> 20.250 habitantes de los barrios residenciales tradicionales de La Loma y San Roque, priorizando las zonas seguras al contorno de la UEM Fernández Madrid.</li>
          <li><strong>Manejo Urbano Integrado:</strong> Redistribución de los flujos de tráfico vehicular, operativos interinstitucionales de control del comercio autónomo informal (AMC y Cuerpo de Agentes) y campañas de seguridad vial los fines de semana. </li>
        </ul>
        <h3>4. Parque Navarro (Plaza de las Tripas - La Floresta)</h3>
        <ul>
          <li><strong>Concepto del Proyecto:</strong> Regeneración urbana y patrimonial profunda de la plaza icónica de la gastronomía quiteña tradicional en el barrio de La Floresta, rescatando un espacio que se encontraba en condiciones de deterioro. </li>
          <li><strong>Metodología y Co-diseño:</strong> Desarrollado bajo un esquema de <strong>diseño participativo y asambleas comunitarias</strong> con moradores del sector y la Asociación de Vendedoras "Santa Marianita de Jesús". </li>
        </ul>
        <h3>Componentes de Revitalización:</h3>
        <p>Módulos Gastronómicos Técnicos: Diseño e instalación de casetas modulares homologadas con altos criterios de salubridad pública y manejo de alimentos. </p>
        <p>Infraestructura Comunitaria: Renovación de caminerías, iluminación ornamental de alta eficiencia, áreas de estancia dotadas de mobiliario y habilitación de zonas verdes seguras para los usuarios. </p>
        <p>Dinámica Social: El proyecto consolidó un modelo de reactivación económica barrial donde el 58% de los usuarios recurrentes oscila entre los 18 y 34 años, atrayendo turismo local e internacional. </p>
      </div>
    )
  },

  'Repotenciación Parque Bicentenario': {
    image: '/imagenes_categorias/repotenciacion_parque_bicentenario/Repotenciación del Bicentenario.png',
    summary: 'Consolidación del espacio verde del antiguo aeropuerto mediante arborización nativa y nuevas áreas recreativas.',
    content: (
      <div className="article-content">
        <h1>Repotenciación Parque Bicentenario</h1>
        <div className="info-alert">
          El proyecto de <strong>Repotenciación del Parque Metropolitano Bicentenario</strong> consolida este espacio histórico como el principal pulmón verde, recreativo, cultural y de desarrollo urbano del norte de Quito. Aprovechando los terrenos del antiguo aeropuerto, la intervención no solo amplía la cobertura vegetal de la ciudad, sino que introduce un modelo de centralidad urbana sostenible. 
        </div>
        <p>Bajo la coordinación técnica de la Secretaría de Hábitat y Ordenamiento Territorial (SHOT) y en cumplimiento del Plan de Uso y Gestión del Suelo (PUGS), el parque equilibra la preservación ecológica con la inserción de infraestructura deportiva de alto rendimiento y espacios masivos para la cultura y el turismo internacional. </p>
        <h3>Ficha Técnica y Datos de Impacto</h3>
        <ul>
          <li><strong>Área Total de Intervención:</strong> Una macro-infraestructura de <strong>115 Hectáreas</strong> de terreno público integrado, consolidándose como uno de los parques urbanos más grandes del Distrito Metropolitano. </li>
          <li><strong>Población Beneficiaria:</strong> Impacto positivo directo sobre <strong>73.051 habitantes</strong> de la parroquia La Concepción y zonas de influencia, proyectando recibir a más de 150.000 visitantes mensuales. </li>
          <li><strong>Inversión Pública Referencial:</strong> <strong>USD $74.530.000,00</strong> financiados y ejecutados de manera plurianual y por fases a través de la EPMMOP. </li>
          <li><strong>Cronograma y Estado Técnico:</strong> El diseño vial y el trazado arquitectónico definitivo concluyeron sus aprobaciones a finales de 2025. Durante el presente año <strong>2026</strong>, se ejecutan de manera prioritaria las ingenierías civiles, eléctricas e hidrosanitarias en red con la EEQ y la EPMAPS, avanzando en el desarrollo de la Fase 2 (44.5Ha) y Fase 3 (42.5Ha). </li>
        </ul>
        <h3>Zonificación Estratégica y Componentes del Parque</h3>
        <p>El desarrollo del parque metropolitano se divide en zonas especializadas para garantizar un uso múltiple y equilibrado del suelo: </p>
        <h3>1. Zona Recreativa Deportiva y de Alto Rendimiento</h3>
        <ul>
          <li><strong>Red de Caminerías e Iluminación:</strong> Construcción de <strong>12km de caminerías internas</strong> distribuidas en 5 tipologías que integran ciclovías, espacios de estancia y áreas comerciales modulares. </li>
          <li><strong>Circuito de Ruedas:</strong> Implementación de una pista técnica de BMX, tres pistas especializadas de velocidad/patinaje y una red perimetral de 14.4km de ciclovías exclusivas. </li>
          <li><strong>Canchas Multifuncionales:</strong> El complejo deportivo integra <strong>67 canchas</strong> planificadas para el esparcimiento (21 de fútbol, 19 de voleibol, 11 de básquet, 7 de tenis, 3 de balonmano, 1 de béisbol y 5 de uso múltiple). </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/repotenciacion_parque_bicentenario/extracted_1.png" alt="Detalle" />
        </div>
        <h3>2. Zona de Conservación Ecológica y Cuerpos de Agua</h3>
        <ul>
          <li><strong>Reserva Forestal:</strong> Siembra masiva de árboles nativos agrupados por zonas climáticas para potenciar la biodiversidad, la captura de carbono y la recuperación de suelos. </li>
          <li><strong>Lagunas Reguladoras:</strong> Creación de <strong>15.000 m² en cuerpos de agua</strong> (6 humedales y lagunas de retención) diseñados como infraestructura verde-azul para la captación de aguas lluvias y control de escorrentías. </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/repotenciacion_parque_bicentenario/extracted_2.png" alt="Detalle" />
        </div>
        <h3>3. Zona de Espectáculos y Encuentro Cultural</h3>
        <ul>
          <li><strong>Arena de Espectáculos Quito:</strong> Un gran nodo cultural modular y flexible diseñado con un escenario principal con capacidad para <strong>50.000 espectadores</strong> y un escenario secundario para 4.000 personas, insertando de forma definitiva a la capital en el circuito internacional de eventos masivos. </li>
          <li><strong>Anfiteatro Polifuncional:</strong> Una estructura al aire libre totalmente integrada a la topografía del parque, diseñada para expresiones artísticas locales y comunitarias. </li>
          <li><strong>Equipamiento Vecinal:</strong> Distribución técnica de 14 plazas duras, 18 zonas lúdicas de primera infancia, 38 áreas de picnic equipadas, 12 zonas de gimnasios biosaludables al aire libre, 10 bloques de baños públicos y 5 parques caninos (dogparks) organizados.</li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/repotenciacion_parque_bicentenario/extracted_3.png" alt="Detalle" />
        </div>
      </div>
    )
  },

  'Quitopia': {
    image: '/imagenes_categorias/quitopia/Quitopia.png',
    summary: 'Red de centros de desarrollo comunitario y cuidado integral para el bienestar social de las familias.',
    content: (
      <div className="article-content">
        <h1>Quitopía</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}>Un Sistema Integrado de Cuidados e Innovación</p>
        <div className="info-alert">
          Las Quitopías representan el modelo de gestión territorial más ambicioso del Distrito Metropolitano de Quito. Funcionan como una <strong>red descentralizada de equipamientos comunitarios multisectoriales</strong> que superan la fragmentación institucional para garantizar los derechos, el cuidado, la cultura y la convivencia social de las familias de la capital. 
        </div>
        <p>Inspirado en los mejores referentes globales de urbanismo social, este proyecto transforma infraestructuras subutilizadas en centralidades vivas donde se articulan de manera directa los servicios públicos, la academia y la comunidad. </p>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_1.png" alt="Detalle" />
        </div>
        <h3>Ficha Técnica y Datos de Impacto (Nodo Piloto: Quitopía "La Y")</h3>
        <ul>
          <li><strong>Área Total de Intervención:</strong> Un ecosistema urbano integral de <strong>19.544,98m²</strong> distribuidos de manera estratégica en tres frentes de obra: </li>
        </ul>
        <p>Edificio de Equipamiento Público Central: 6.800,00m². </p>
        <p>Parque Vecinal y Pasaje Peatonal Recreativo: 8.060,83m². </p>
        <p>Proyecto Integral Vial y Obras de Urbanización: 4.684,15m². </p>
        <ul>
          <li><strong>Inversión Pública Consolidada:</strong> <strong>USD 10'398.332,77</strong> financiados por el Municipio de Quito y distribuidos en edificación matriz (USD 8'862.893,44), espacio público verde (USD 678.486,17) y urbanización periférica (USD 856.953,16). </li>
          <li><strong>Cronograma y Estado de Obra:</strong> Las intervenciones viales y del pasaje peatonal arrancaron en marzo de 2025, mientras que la edificación central inició en noviembre de 2025. El proyecto registra un avance físico general del 75% y su entrega definitiva está programada para <strong>julio de 2026</strong>. </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_2.png" alt="Detalle" />
        </div>
        <h3>Componentes y Servicios del Complejo Integrado</h3>
        <p>La Quitopía rompe los esquemas tradicionales dividiendo su infraestructura en tres grandes bloques funcionales diseñados para todas las edades: </p>
        <h3>1. Edificio de Capacitación, Innovación y Cultura (Bloque A)</h3>
        <p>Un espacio tecnológico de libre acceso orientado a fortalecer el tejido productivo y las capacidades digitales de la ciudadanía a través de actividades continuas: </p>
        <p><strong>FabLab</strong> <strong>Metropolitano:</strong> Laboratorios públicos equipados para el prototipado digital, la programación avanzada, la robótica y talleres experimentales de Inteligencia Artificial. </p>
        <ul>
          <li><strong>Expresión y Multimedia:</strong> Un estudio y cabina de grabación profesional con convocatorias abiertas para colectivos musicales y comunitarios. </li>
          <li><strong>Salas Multifuncionales:</strong> Espacios destinados a la danza, artes plásticas, expresión corporal y un gimnasio público con programas de entrenamiento funcional guiado. </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_3.png" alt="Detalle" />
        </div>
        <h3>2. Edificio Centro de los Cuidados (Bloque B)</h3>
        <p>La columna vertebral del proyecto, diseñada para aliviar la carga de trabajo doméstico y de cuidado, brindando un soporte integral a las familias: </p>
        <p><strong>Centro Infantil "Quito</strong> <strong>Wawas</strong><strong>":</strong> Un espacio seguro y lúdico para el cuidado y la estimulación de la primera infancia. </p>
        <ul>
          <li><strong>Lactario:</strong> Área especializada, higiénica y confortable habilitada para la libre lactancia. </li>
          <li><strong>Cuidado Intergeneracional:</strong> Módulos de lavandería comunitaria bajo reserva, y salas destinadas a actividades lúdicas, talleres de memoria y diálogo para adultos mayores. </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_4.png" alt="Detalle" />
        </div>
        <h3>3. Edificio Teatro - Polideportivo (Bloque C)</h3>
        <p>El punto de encuentro para el esparcimiento masivo, la cultura y la salud preventiva: </p>
        <ul>
          <li><strong>Teatro - Cinemateca:</strong> Una moderna sala con capacidad para 450 personas diseñada para lanzamientos artísticos, proyecciones culturales y encuentros ciudadanos. </li>
          <li><strong>Infraestructura Deportiva:</strong> Préstamo de canchas por horas, copas interbarriales y programas permanentes de salud preventiva en articulación con las entidades municipales. </li>
        </ul>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_5.png" alt="Detalle" />
        </div>
        <h3>Sostenibilidad Urbana y Gestión Ambiental</h3>
        <p>El entorno exterior de la Quitopía funciona como un amortiguador ecológico de la ciudad. Incorpora soluciones basadas en la naturaleza, como <strong>jardines de lluvia y humedales</strong> conectados a un tanque de retención de aguas lluvias, diseñados específicamente para mitigar las históricas inundaciones de la Av. 10 de Agosto. Todo el perímetro cuenta con criterios de accesibilidad universal, soterramiento de redes, pacificación de tránsito y un parque lineal que integra la vida vecinal con el comercio local regularizado. </p>
        <div className="detail-image-container">
          <img src="/imagenes_categorias/quitopia/extracted_6.png" alt="Detalle" />
        </div>
      </div>
    )
  },

  'Recuperación Urbana Av. 10 de Agosto': {
    image: '/imagenes_categorias/recuperacion_urbana_av_10_de_agosto/recuperación_urbana_av10deAgosto.png',
    summary: 'Estrategia de revitalización del eje vial longitudinal de la 10 de Agosto para mejorar movilidad y vivienda.',
    content: (
      <div className="article-content">
        <h1>Recuperación Urbana Av. 10 de Agosto</h1>
        <div className="info-alert">
          El proyecto de <strong>Revitalización de la Av. 10 de</strong> <strong>Agosto</strong> es una estrategia de renovación urbana de gran escala y con enfoque humano, diseñada para recuperar el dinamismo residencial, económico y social de uno de los ejes viales longitudinales más emblemáticos y conectores de Quito. 
        </div>
        <p>Alineado con las directrices del Plan de Uso y Gestión del Suelo (PUGS) y el Plan Maestro de Movilidad Sostenible, el proyecto revierte el modelo tradicional dando prioridad absoluta a la movilidad activa, implementando infraestructura verde resiliente y promoviendo el acceso a vivienda pública inclusiva. </p>
        <h3>Ficha Técnica y Datos de Impacto (Polígono 1 de 3)</h3>
        <ul>
          <li><strong>Superficie de Intervención:</strong> Un área de <strong>15.000 m²</strong> priorizados en el primer tramo estratégico del eje vial. </li>
          <li><strong>Inversión Pública Directa:</strong> <strong>USD 1,5millones</strong> financiados por el Municipio de Quito para la ejecución física y arquitectónica del Polígono 1. </li>
          <li><strong>Plazos y Cronograma de Entregas:</strong> Las intervenciones principales de repavimentación, soterramiento y reformas geométricas complementarias se encuentran planificadas en fases sucesivas que inician a finales de <strong>2026</strong> y concluyen en el <strong>2027</strong>. </li>
          <li><strong>Entidades Involucradas:</strong> Coordinación y articulación técnica liderada por la SHOT, Secretaría de Movilidad, la Empresa Pública Metropolitana de Movilidad y Obras Públicas (<strong>EPMMOP</strong> como ejecutor principal) y la EPMTPQ. </li>
        </ul>
        <h3>Ejes Estructurantes de la Transformación Urbana</h3>
        <p>La revitalización integral del polígono transforma el espacio público mediante tres componentes fundamentales: </p>
        <h3>1. Reconfiguración Vial y Conectividad Eficiente</h3>
        <ul>
          <li><strong>Espacio para las Personas:</strong> Ensanchamiento técnico de aceras y reducción de carriles para vehículos de combustión, abriendo espacio para la micromovilidad. </li>
          <li><strong>Accesibilidad Universal:</strong> Eliminación de barreras arquitectónicas mediante la nivelación de calzadas, construcción de resaltos peatonales continuos y la obligatoriedad de pisos podotáctiles en vados y cruces seguros. </li>
          <li><strong>Infraestructura de Transporte:</strong> Rediseño e integración de paradas de transporte público (BRT y sistema convencional) ubicadas de forma ordenada dentro de las franjas de servicio técnico. </li>
        </ul>
        <h3>2. Red Verde Urbana y Soluciones Ambientales</h3>
        <ul>
          <li><strong>Mitigación de Inundaciones:</strong> Implementación pionera de <strong>Sistemas Urbanos de Drenaje Sostenible (SUDS)</strong> y jardines de lluvia permeables integrados al parterre central y aceras laterales, diseñados para captar y regular de forma natural las aguas lluvias. </li>
          <li><strong>Arborización Técnica:</strong> Siembra masiva de árboles nativos y alcorques de protección que actúan como sumideros de carbono y mejoran el microclima, disminuyendo el impacto de las islas de calor urbanas. </li>
        </ul>
        <h3>3. Seguridad, Economía y Residencialidad</h3>
        <ul>
          <li><strong>Plaza de Comercio Seguro:</strong> Habilitación de una zona dedicada al comercio regularizado y autónomo bajo un estricto censo, combatiendo la informalidad mediante módulos ordenados. </li>
          <li><strong>Ojos en la Calle:</strong> Activación de fachadas vivas y zonas comerciales en planta baja que, junto a una iluminación pública eficiente orientada al peatón y sistemas disuasivos conectados, mejoran drásticamente la seguridad real y percibida. </li>
          <li><strong>Incentivos Inmobiliarios:</strong> Aplicación de políticas urbanas que facilitan un mayor aprovechamiento de la edificabilidad para proyectos de vivienda colectiva inclusiva y usos mixtos, repoblando el corazón del norte de Quito. </li>
        </ul>
      </div>
    )
  },

  'Arena del Bicentenario': {
    image: '/imagenes_categorias/bicentenario/bicentenario.png',
    summary: 'Megaproyecto de renovación urbana de 105 hectáreas que integra humedales, ciclovías, deportes y una arena para conciertos.',
    content: (
      <div className="article-content">
        <h1>Arena del Bicentenario</h1>
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
    image: '/imagenes_categorias/arena_del_sur/Arena del Sur.png',
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
          <li><strong>Encuentro ciudadano:</strong> Funciona como un espacio para activar actividades artísticas, educativas y recreativas.</li>
          <li><strong>Fomento de la cohesión:</strong> Busca promover la apropiación pacífica del espacio público, la cohesión social y el bienestar de la población del sur de Quito.</li>
        </ul>
      </div>
    )
  }
};
