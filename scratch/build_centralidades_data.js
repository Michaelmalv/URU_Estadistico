const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../web/src/lib/centralidades.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

const territorialSectorsPath = path.join(__dirname, '../web/src/lib/territorial_sectors.json');
const territorialSectors = JSON.parse(fs.readFileSync(territorialSectorsPath, 'utf8'));

const soterramientoPath = path.join(__dirname, '../web/src/lib/soterramiento.json');
const soterramientoList = JSON.parse(fs.readFileSync(soterramientoPath, 'utf8'));

// Mapa de correspondencia entre Centralidades y Proyectos
const CENTRALIDAD_PROJECTS_MAP = {
  'mariscal': {
    admin_zonal: 'La Mariscal / Eugenio Espejo',
    descripcion_territorial: 'Centralidad metropolitana financiera, turística y universitaria de alta densidad. Articulada por la Av. Colón, Av. 12 de Octubre, Av. Patria y la Estación Colón del Metro.',
    equipamientos_clave: ['Estación Metro Colón', 'Plaza Foch', 'PUCE', 'EPN', 'Hospital de Niños Baca Ortiz'],
    proyectos: [
      {
        id: 'corredor-av-colon',
        nombre: 'Corredor Vivo Av. Colón',
        tipo: 'Corredor Vivo / Regeneración Peatonal',
        badge: 'Inaugurado y Operativo',
        longitud_km: '2.1 km',
        presupuesto: '$2.85M',
        financiamiento: 'Municipio de Quito / EPMMOP',
        estado: 'Completado',
        resumen: 'Eje estructurante norte-centro con ciclovía segregada, señalización táctica, soterramiento de cables y amplia oferta comercial y gastronómica.',
        seguridad: {
          nivel: 'Alto (Sendero Seguro)',
          camaras: 12,
          luminarias_led: 142,
          cruces_seguros: 8,
          bolardos: 180,
          descripcion: 'Alumbrado LED repotenciado, señalización táctica tricolor, cámaras de vigilancia y aceras anchas con accesibilidad universal.'
        },
        economia: {
          negocios_activos: '+120 comercios, hoteles y servicios corporativos',
          atractivo_comercial: 'Polo gastronómico, bancario y de entretenimiento nocturno seguro.',
          inversiones_privadas: [
            {
              titulo: "Carl's Jr. Freestanding Colón",
              tipo: 'Franquicia Internacional',
              impacto: 'Apertura del primer freestanding de la cadena en Quito con área infantil, drive-thru y horario extendido.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS AV. COLÓN',
          valor_m2: 1285.50,
          rango: 'Alto / Comercial y Corporativo',
          tendencia: '+9.2% de plusvalía anual',
          descripcion: 'Demanda inmobiliaria potenciada por la renovación integral del perfil vial y soterrado de redes.'
        },
        imagen_destacada: '/imagenes_senderos/av_colon/cruce_peatonal.jpg',
        galeria_id: 'Av. Colón',
        antes_despues_id: null
      },
      {
        id: 'soterramiento-av-colon',
        nombre: 'Soterramiento de Cables Av. Colón (Fases 1 y 2)',
        tipo: 'Soterramiento de Redes Aéreas',
        badge: 'Ejecutado',
        longitud_km: '2.1 km soterrados',
        presupuesto: '$1.45M',
        financiamiento: 'Fondo Municipal de Soterramiento',
        estado: 'Operativo',
        resumen: 'Retiro del 100% del tallarín de cables aéreos de media y baja tensión y telecomunicaciones, canalizados bajo aceras con cajas subterráneas.',
        seguridad: {
          nivel: 'Muy Alto (Despeje Aéreo)',
          camaras: 12,
          luminarias_led: 142,
          cruces_seguros: 8,
          bolardos: 180,
          descripcion: 'Eliminación del riesgo de colapso de postes y cables de media tensión, mayor visibilidad y campo visual despejado.'
        },
        economia: {
          negocios_activos: '+120 establecimientos',
          atractivo_comercial: 'Despeje estético total de fachadas corporativas y hoteleras.',
          inversiones_privadas: [
            {
              titulo: 'Inversión en Redes de Fibra Subterránea',
              tipo: 'Telecomunicaciones Privadas',
              impacto: 'Modernización del tendido subterráneo de telecomunicaciones de alta velocidad para edificios corporativos.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS AV. COLÓN',
          valor_m2: 1285.50,
          rango: 'Alto / Comercial',
          tendencia: '+9.2% anual',
          descripcion: 'Valorización inmediata de predios frentistas por descontaminación visual del entorno.'
        },
        imagen_destacada: '/imagenes_senderos/av_colon/cruce_peatonal.jpg',
        galeria_id: 'Av. Colón',
        antes_despues_id: null
      }
    ]
  },

  'el-ejido-alameda': {
    admin_zonal: 'Manuela Sáenz / Eugenio Espejo',
    descripcion_territorial: 'Centralidad zonal de articulación entre el Hipercentro y el Centro Histórico. Nodo cívico, cultural y universitario en torno a los Parques El Ejido y La Alameda.',
    equipamientos_clave: ['Estación Metro El Ejido', 'Casa de la Cultura Ecuatoriana', 'Parque El Ejido', 'Parque La Alameda', 'Observatorio Astronómico'],
    proyectos: [
      {
        id: 'corredor-av-patria',
        nombre: 'Corredor Vivo Av. Patria',
        tipo: 'Corredor Vivo / Eje Cultural',
        badge: 'Inaugurado y Operativo',
        longitud_km: '1.8 km',
        presupuesto: '$2.40M',
        financiamiento: 'Municipio de Quito / EPMMOP',
        estado: 'Completado',
        resumen: 'Conector icónico entre el Parque El Ejido y La Mariscal con cruces tácticos de colores, ciclovía segregada e iluminación monumental.',
        seguridad: {
          nivel: 'Muy Alto (Iluminación & Monitoreo)',
          camaras: 16,
          luminarias_led: 168,
          cruces_seguros: 10,
          bolardos: 220,
          descripcion: '168 luminarias LED de última generación, cruces peatonales tácticos multicolor y conexión visual diáfana con parques.'
        },
        economia: {
          negocios_activos: '+150 empresas, entidades bancarias y centros culturales',
          atractivo_comercial: 'Cercanía a Casa de la Cultura, Pontificia Universidad Católica (PUCE), EPN y hoteles de lujo.',
          inversiones_privadas: [
            {
              titulo: 'Banco Internacional S.A. (Proyecto 50 Años)',
              tipo: 'Revalorización Edilicia Corporativa',
              impacto: 'Inversión privada en la modernización de fachadas y áreas peatonales sobre la Av. Patria.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS PATRIA',
          valor_m2: 1340.00,
          rango: 'Muy Alto / Corporativo y Cultural',
          tendencia: '+10.4% de plusvalía anual',
          descripcion: 'Consolidación como distrito financiero y cultural de primer orden con alta valorización por metro cuadrado.'
        },
        imagen_destacada: '/antes_despues/av_patria/despues.jpg',
        galeria_id: null,
        antes_despues_id: 'Av. Patria'
      },
      {
        id: 'soterramiento-av-patria',
        nombre: 'Soterramiento de Cables Av. Patria',
        tipo: 'Soterramiento de Redes Aéreas',
        badge: 'Ejecutado',
        longitud_km: '1.8 km soterrados',
        presupuesto: '$1.20M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Eliminación completa de redes aéreas que distorsionaban la perspectiva visual del Parque El Ejido y la Casa de la Cultura.',
        seguridad: {
          nivel: 'Muy Alto',
          camaras: 16,
          luminarias_led: 168,
          cruces_seguros: 10,
          bolardos: 220,
          descripcion: 'Optimización de luminarias y despeje de ramas y cables sobre las aceras peatonales.'
        },
        economia: {
          negocios_activos: '+150 comercios',
          atractivo_comercial: 'Incremento del flujo peatonal en eventos culturales de la CCE.',
          inversiones_privadas: [
            {
              titulo: 'Renovación de Oficinas Corporativas Patria',
              tipo: 'Inversión Inmobiliaria Privada',
              impacto: 'Rehabilitación de lobbies y plantas bajas abiertas al espacio público.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS PATRIA',
          valor_m2: 1340.00,
          rango: 'Muy Alto',
          tendencia: '+10.4% anual',
          descripcion: 'Mejora estética radical del frente del Parque El Ejido.'
        },
        imagen_destacada: '/antes_despues/av_patria/despues.jpg',
        galeria_id: null,
        antes_despues_id: 'Av. Patria'
      }
    ]
  },

  'la-carolina': {
    admin_zonal: 'Eugenio Espejo',
    descripcion_territorial: 'Principal centralidad metropolitana de negocios y servicios corporativos del Ecuador. Concentra sedes bancarias, centros comerciales y el Parque La Carolina.',
    equipamientos_clave: ['Estación Metro La Carolina', 'Estación Metro Iñaquito', 'Parque La Carolina', 'Centro Comercial CCI', 'Mall El Jardín'],
    proyectos: [
      {
        id: 'bulevar-tribuna-shyris',
        nombre: 'Bulevar Tribuna de los Shyris',
        tipo: 'Espacio Público / Bulevar Peatonal',
        badge: 'Inaugurado y Operativo',
        longitud_km: '1.4 km',
        presupuesto: '$3.10M',
        financiamiento: 'Municipio de Quito / EPMMOP',
        estado: 'Completado',
        resumen: 'Demolición de la antigua tribuna de cemento y construcción de un bulevar contemporáneo con pórticos escultóricos, ciclovía y jardines.',
        seguridad: {
          nivel: 'Excelente (Sendero Modelo)',
          camaras: 20,
          luminarias_led: 195,
          cruces_seguros: 12,
          bolardos: 280,
          descripcion: 'Visibilidad total 360°, eliminación de zonas oscuras, pórticos iluminados y patrullaje metropolitano continuo.'
        },
        economia: {
          negocios_activos: '+280 sedes corporativas, cafeterías gourmet y bancos',
          atractivo_comercial: 'El epicentro financiero y de ocio familiar más cotizado del DMQ.',
          inversiones_privadas: [
            {
              titulo: 'Torres Corporativas y Nuevas Cafeterías Shyris',
              tipo: 'Desarrollo Mixto y Gastronomía',
              impacto: 'Atracción masiva de terrazas gastronómicas y dinamización del comercio diurno y nocturno.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS LA CAROLINA',
          valor_m2: 1420.00,
          rango: 'Máximo DMQ / Financiero',
          tendencia: '+11.8% de plusvalía anual',
          descripcion: 'El suelo urbano de mayor valorización por metro cuadrado del Distrito Metropolitano.'
        },
        imagen_destacada: '/antes_despues/tribuna_de_los_shyris/despues.jpg',
        galeria_id: null,
        antes_despues_id: 'Bulevar Tribuna de los Shyris'
      },
      {
        id: 'soterramiento-shyris',
        nombre: 'Soterramiento de Redes Bulevar Shyris',
        tipo: 'Soterramiento de Redes Aéreas',
        badge: 'Ejecutado',
        longitud_km: '1.4 km',
        presupuesto: '$1.60M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Infraestructura subterránea de ductos para energía y telecomunicaciones que liberó visualmente el frente del Parque La Carolina.',
        seguridad: {
          nivel: 'Excelente',
          camaras: 20,
          luminarias_led: 195,
          cruces_seguros: 12,
          bolardos: 280,
          descripcion: 'Aceras totalmente transitables sin obstáculos de postes ni cables.'
        },
        economia: {
          negocios_activos: '+280 establecimientos',
          atractivo_comercial: 'Revalorización de plantas bajas comerciales.',
          inversiones_privadas: [
            {
              titulo: 'Inversión en Terrazas de Restaurantes Shyris',
              tipo: 'Comercio Exterior y Terrazas',
              impacto: 'Ampliación de áreas de servicio al aire libre sin interferencias.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS LA CAROLINA',
          valor_m2: 1420.00,
          rango: 'Máximo DMQ',
          tendencia: '+11.8% anual',
          descripcion: 'Consolidación del skyline corporativo de Quito.'
        },
        imagen_destacada: '/antes_despues/tribuna_de_los_shyris/despues.jpg',
        galeria_id: null,
        antes_despues_id: 'Bulevar Tribuna de los Shyris'
      }
    ]
  },

  'la-y': {
    admin_zonal: 'Eugenio Espejo',
    descripcion_territorial: 'Centralidad sectorial de alta conectividad y nodo de transferencia de transporte (Trolebús, Metro La Y y Av. 10 de Agosto). Enfoque en deporte y espacio verde.',
    equipamientos_clave: ['Estación Metro Iñaquito / La Y', 'Terminal Trolebús La Y', 'Parque Isla Tortuga', 'Polideportivo La Y', 'QUITOPIA La Y'],
    proyectos: [
      {
        id: 'sendero-isla-tortuga',
        nombre: 'Sendero Seguro Isla Tortuga / QUITOPIA La Y',
        tipo: 'Sendero Seguro / Equipamiento Recreativo',
        badge: 'Inaugurado y Operativo',
        longitud_km: '0.9 km',
        presupuesto: '$1.15M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Recuperación de áreas verdes, adoquín geométrico ornamental, nuevo complejo de juegos infantiles y conexión peatonal directa con el Metro.',
        seguridad: {
          nivel: 'Muy Alto (Parque Familiar Seguro)',
          camaras: 8,
          luminarias_led: 85,
          cruces_seguros: 6,
          bolardos: 120,
          descripcion: 'Aceras con guía podotáctil, postes de iluminación ornamental cálida y vigilancia metropolitana.'
        },
        economia: {
          negocios_activos: '+65 comercios de cercanía, farmacias y cafeterías',
          atractivo_comercial: 'Afluencia continua de usuarios del transporte público intermodal.',
          inversiones_privadas: [
            {
              titulo: 'Comercios de Servicios en Eje La Y',
              tipo: 'Comercio Minorista y Salud',
              impacto: 'Apertura de nuevos locales comerciales y centros médicos de atención ambulatoria.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS LA Y',
          valor_m2: 980.00,
          rango: 'Medio-Alto / Residencial y Servicios',
          tendencia: '+7.8% de plusvalía anual',
          descripcion: 'Revalorización de condominios residenciales del entorno por acceso directo al Metro.'
        },
        imagen_destacada: '/imagenes_senderos/isla_tortuga/aerea_plaza_sendero.jpg',
        galeria_id: 'Isla Tortuga',
        antes_despues_id: null
      }
    ]
  },

  'centro-historico': {
    admin_zonal: 'Manuela Sáenz',
    descripcion_territorial: 'Centralidad metropolitana patrimonial, cívica y turística declarada Primer Patrimonio Cultural de la Humanidad por la UNESCO. Sede de los poderes del Estado y Alcaldía.',
    equipamientos_clave: ['Estación Metro San Francisco', 'Plaza Grande', 'Plaza San Francisco', 'Plaza del Teatro', 'Basílica del Voto Nacional'],
    proyectos: [
      {
        id: 'peatonalizacion-calle-benalcazar',
        nombre: 'Sendero Seguro Calle Benalcázar',
        tipo: 'Sendero Seguro / Peatonalización Patrimonial',
        badge: 'Inaugurado',
        longitud_km: '1.2 km',
        presupuesto: '$1.80M',
        financiamiento: 'IMP / Municipio de Quito',
        estado: 'Completado',
        resumen: 'Peatonalización integral con piedra andesita pulida, soterramiento de acometidas patrimoniales y mobiliario urbano de bronce y madera.',
        seguridad: {
          nivel: 'Alto (Control Patrimonial)',
          camaras: 18,
          luminarias_led: 110,
          cruces_seguros: 8,
          bolardos: 160,
          descripcion: 'Iluminación patrimonial LED cálida, postes estilo colonial repotenciados y cámaras del ECU-911.'
        },
        economia: {
          negocios_activos: '+210 comercios tradicionales, artesanías y restaurantes',
          atractivo_comercial: 'Alta afluencia de turismo nacional y extranjero.',
          inversiones_privadas: [
            {
              titulo: 'Restauración de Hoteles Boutique y Cafeterías',
              tipo: 'Turismo y Hospitalidad',
              impacto: 'Inversión privada en casonas patrimoniales convertidas en hoteles boutique.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS CENTRO HISTÓRICO',
          valor_m2: 1150.00,
          rango: 'Alto / Patrimonial',
          tendencia: '+8.1% de plusvalía anual',
          descripcion: 'Incentivos de conservación y plusvalía potenciada por la parada San Francisco del Metro.'
        },
        imagen_destacada: '/imagenes_senderos/calle_benalcazar/Benalcazar_inicio.png',
        galeria_id: null,
        antes_despues_id: null
      },
      {
        id: 'sendero-calle-rocafuerte',
        nombre: 'Sendero Seguro Calle Rocafuerte',
        tipo: 'Sendero Seguro / Conector Patrimonial',
        badge: 'Inaugurado',
        longitud_km: '1.1 km',
        presupuesto: '$1.35M',
        financiamiento: 'Municipio de Quito / IMP',
        estado: 'Completado',
        resumen: 'Recuperación del eje tradicional entre el Convento de San Francisco y el Mercado de San Roque, con ensanchamiento de veredas y accesibilidad universal.',
        seguridad: {
          nivel: 'Medio-Alto (Sendero Recuperado)',
          camaras: 14,
          luminarias_led: 95,
          cruces_seguros: 6,
          bolardos: 140,
          descripcion: 'Recuperación de la percepción de seguridad con iluminación dirigida y agentes de control.'
        },
        economia: {
          negocios_activos: '+180 comercios y talleres artesanales',
          atractivo_comercial: 'Ruta gastronómica y comercial tradicional.',
          inversiones_privadas: [
            {
              titulo: 'Reapertura de Comercios Tradicionales',
              tipo: 'Comercio Minorista',
              impacto: 'Regularización LUAE con incremento de aperturas de negocios en la calle Rocafuerte.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS ROCAFUERTE',
          valor_m2: 1080.00,
          rango: 'Medio-Alto / Comercial',
          tendencia: '+7.4% anual',
          descripcion: 'Consolidación del comercio formal en el centro sur patrimonial.'
        },
        imagen_destacada: '/imagenes_senderos/calle_rocafuerte/Rocafuerte_inicio.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  },

  'la-floresta': {
    admin_zonal: 'Eugenio Espejo',
    descripcion_territorial: 'Centralidad sectorial artística, residencial y gastronómica. Famosa por sus casonas de estilo neocolonial, galerías de arte y el emblemático Parque Navarro.',
    equipamientos_clave: ['Parque Navarro (Las Vicuñas)', 'Plaza Brasilia', 'Cine Ocho y Medio', 'Universidad Andina Simón Bolívar'],
    proyectos: [
      {
        id: 'parque-navarro-floresta',
        nombre: 'Parque Navarro — Corredor Gastronómico La Floresta',
        tipo: 'Espacio Público / Corredor Gastronómico',
        badge: 'Inaugurado y Operativo',
        longitud_km: '0.6 km',
        presupuesto: '$890K',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Readecuación integral de la plaza gastronómica tradicional con quioscos de acero inoxidable homologados, bancas ecológicas y soterramiento perimetral.',
        seguridad: {
          nivel: 'Muy Alto (Espacio Convivencial)',
          camaras: 8,
          luminarias_led: 64,
          cruces_seguros: 5,
          bolardos: 90,
          descripcion: 'Plaza iluminada 24/7 con control sanitario y patrullaje preventivo de policía comunitaria.'
        },
        economia: {
          negocios_activos: '+95 restaurantes, cafeterías de especialidad y galerías',
          atractivo_comercial: 'Uno de los polos gastronómicos y culturales nocturnos más frecuentados de Quito.',
          inversiones_privadas: [
            {
              titulo: 'Asociación de Emprendimientos Gastronómicos Navarro',
              tipo: 'Economía Popular y Solidaria',
              impacto: 'Formalización de 25 módulos gastronómicos tradicionales con estándares sanitarios de excelencia.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS LA FLORESTA',
          valor_m2: 1180.00,
          rango: 'Alto / Residencial y Bohemio',
          tendencia: '+8.9% de plusvalía anual',
          descripcion: 'Alta demanda para proyectos de vivienda vertical boutique y estudios de diseño.'
        },
        imagen_destacada: '/imagenes_senderos/parque_navarro/parque_navarro_1.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  },

  'solanda-san-bartolo': {
    admin_zonal: 'Eloy Alfaro',
    descripcion_territorial: 'Centralidad zonal del sur de Quito con la mayor densidad demográfica y comercial del sur. Eje articulado por la Av. Ajaví y la Estación Metro Solanda.',
    equipamientos_clave: ['Estación Metro Solanda', 'Mercado Mayorista de Quito', 'Parque Ecológico Solanda', 'Corredor Comercial Calle J'],
    proyectos: [
      {
        id: 'sendero-av-ajavi',
        nombre: 'Sendero Seguro y Soterramiento Av. Ajaví',
        tipo: 'Sendero Seguro / Soterramiento',
        badge: 'Inaugurado',
        longitud_km: '1.7 km',
        presupuesto: '$2.10M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Regeneración vial completa de la Av. Ajaví entre Av. Mariscal Sucre y Av. Pedro Vicente Maldonado con soterramiento de cables y parterres verdes.',
        seguridad: {
          nivel: 'Alto (Sendero Seguro del Sur)',
          camaras: 14,
          luminarias_led: 135,
          cruces_seguros: 8,
          bolardos: 175,
          descripcion: 'Iluminación LED de alta potencia que redujo sustancialmente la incidencia delictiva nocturna.'
        },
        economia: {
          negocios_activos: '+190 locales comerciales, bancos y ferreterías',
          atractivo_comercial: 'Corredor comercial más dinámico de la parroquia Solanda.',
          inversiones_privadas: [
            {
              titulo: 'Comercios de Servicios y Cooperativas de Ahorro',
              tipo: 'Financiero y Comercio',
              impacto: 'Apertura de agencias bancarias y cooperativas sobre la renovada Av. Ajaví.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS SOLANDA - AJAVÍ',
          valor_m2: 620.00,
          rango: 'Medio / Comercial Popular',
          tendencia: '+6.8% de plusvalía anual',
          descripcion: 'Incremento sostenido de la plusvalía por la cercanía a la Estación Metro Solanda.'
        },
        imagen_destacada: '/imagenes_senderos/av_ajavi/inicio_av_ajavi.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  },

  'chimbacalle-la-villaflora-la-magdalena': {
    admin_zonal: 'Eloy Alfaro',
    descripcion_territorial: 'Centralidad zonal histórica y comercial del sur centro. Nodo tradicional con la icónica estación ferroviaria de Chimbacalle y el Bulevar de la Michelena.',
    equipamientos_clave: ['Estación Metro Cardenal de la Torre', 'Estación Ferrocarril Chimbacalle', 'Bulevar Michelena', 'Parque de las Diversidades'],
    proyectos: [
      {
        id: 'bulevar-av-michelena',
        nombre: 'Bulevar Comercial Av. Michelena (El Pintado)',
        tipo: 'Espacio Público / Bulevar Peatonal',
        badge: 'Operativo',
        longitud_km: '1.3 km',
        presupuesto: '$1.65M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Bulevar peatonal y comercial con soterramiento de cables, iluminación escénica y aceras amplias con arbolado urbano.',
        seguridad: {
          nivel: 'Alto (Bulevar Seguro)',
          camaras: 12,
          luminarias_led: 120,
          cruces_seguros: 7,
          bolardos: 150,
          descripcion: 'Monitoreo integrado con UPC local y cruces cebras con semaforización inclusiva.'
        },
        economia: {
          negocios_activos: '+230 locales de ropa, calzado, tecnología y gastronomía',
          atractivo_comercial: 'El corazón del comercio minorista popular del sur de Quito.',
          inversiones_privadas: [
            {
              titulo: 'Cadenas Nacionales de Calzado y Retail',
              tipo: 'Comercio Retail',
              impacto: 'Establecimiento de tiendas ancla sobre la Av. Michelena.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS MICHELENA - VILLAFLORA',
          valor_m2: 710.00,
          rango: 'Medio / Comercial',
          tendencia: '+7.1% de plusvalía anual',
          descripcion: 'Revalorización de locales comerciales sobre acera frentista.'
        },
        imagen_destacada: '/imagenes_senderos/av_michelena/Michelena_final.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  },

  'bicentenario': {
    admin_zonal: 'Eugenio Espejo',
    descripcion_territorial: 'Centralidad metropolitana del norte con el parque urbano más extenso de Quito (antiguo aeropuerto). Polo de eventos masivos, convenciones y proyectos de regeneración urbana.',
    equipamientos_clave: ['Parque Bicentenario (125 ha)', 'Centro de Convenciones Metropolitano', 'Estación Metro El Labrador', 'Colegio Benalcázar'],
    proyectos: [
      {
        id: 'repotenciacion-parque-bicentenario',
        nombre: 'Repotenciación Integral Parque Bicentenario',
        tipo: 'Espacio Público / Parque Metropolitano',
        badge: 'En Ejecución / Operativo',
        longitud_km: '125 hectáreas',
        presupuesto: '$4.50M',
        financiamiento: 'Municipio de Quito / Cooperación Internacional',
        estado: 'Fase 2',
        resumen: 'Desarrollo del humedal artificial, pistas atléticas reglamentarias, áreas de juegos infantiles y arborización con especies nativas.',
        seguridad: {
          nivel: 'Excelente (Parque Seguro)',
          camaras: 24,
          luminarias_led: 310,
          cruces_seguros: 14,
          bolardos: 200,
          descripcion: 'Cámaras de vigilancia 360°, torres de salvamento y patrullaje de agentes metropolitanos en bicicleta.'
        },
        economia: {
          negocios_activos: 'Ferias masivas, Centro de Convenciones y concesiones gastronómicas',
          atractivo_comercial: 'Epicentro de ferias internacionales, conciertos y eventos culturales.',
          inversiones_privadas: [
            {
              titulo: 'Centro de Convenciones y Eventos Privados',
              tipo: 'Turismo MICE',
              impacto: 'Generación de millones de dólares en congresos y exhibiciones empresariales.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS BICENTENARIO',
          valor_m2: 1050.00,
          rango: 'Alto / Residencial y Servicios',
          tendencia: '+9.5% de plusvalía anual',
          descripcion: 'Atracción de desarrollos inmobiliarios verticales con vista panorámica al parque.'
        },
        imagen_destacada: '/repotenciacion_parque_bicentenario/Repotenciación del Bicentenario.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  },

  'cotocollao-ofelia': {
    admin_zonal: 'La Delicia',
    descripcion_territorial: 'Centralidad zonal del norte tradicional y nodo intermodal con la terminal de transporte La Ofelia y los senderos de Colinas del Norte y La Roldós.',
    equipamientos_clave: ['Terminal La Ofelia', 'Parque Central de Cotocollao', 'Mercado de Cotocollao', 'Complejo Deportivo Roldós'],
    proyectos: [
      {
        id: 'sendero-la-roldos',
        nombre: 'Sendero Seguro La Roldós Oe13 — Colinas del Norte',
        tipo: 'Sendero Seguro / Equipamiento Barrial',
        badge: 'Inaugurado',
        longitud_km: '1.2 km',
        presupuesto: '$1.42M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Pavimentación con adoquín ornamental, accesibilidad universal con franja podotáctil, parada de buses con cubierta, luminarias LED y cancha de césped sintético.',
        seguridad: {
          nivel: 'Alto (Transformación Barrial)',
          camaras: 10,
          luminarias_led: 92,
          cruces_seguros: 7,
          bolardos: 130,
          descripcion: 'Recuperación de un entorno antes oscuro en un sendero vibrante y vigilado.'
        },
        economia: {
          negocios_activos: '+80 bazares, tiendas de abarrotes, farmacias y ferreterías',
          atractivo_comercial: 'Comercio barrial reactivado con mayor horario de atención nocturna.',
          inversiones_privadas: [
            {
              titulo: 'Ampliación de Microempresas Barriales',
              tipo: 'Economía Barrial',
              impacto: 'Locatarios extendieron su atención hasta las 22h00 gracias a la iluminación LED.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS LA ROLDÓS',
          valor_m2: 480.00,
          rango: 'Medio-Bajo / Residencial y Comercial',
          tendencia: '+5.9% de plusvalía anual',
          descripcion: 'Crecimiento de plusvalía y titulación predial en el noroccidente de Quito.'
        },
        imagen_destacada: '/antes_despues/la_roldos/despues.jpg',
        galeria_id: null,
        antes_despues_id: 'La Roldós Oe13-Colinas del Norte'
      }
    ]
  },

  'quitumbe': {
    admin_zonal: 'Quitumbe',
    descripcion_territorial: 'Centralidad metropolitana del extremo sur de Quito. Diseñada como la nueva ciudad gubernamental y de transporte del sur, articulada por la Terminal Terrestre y Talleres del Metro.',
    equipamientos_clave: ['Terminal Terrestre Quitumbe', 'Estación Metro Quitumbe', 'Plataforma Gubernamental del Sur', 'Parque Las Cuadras'],
    proyectos: [
      {
        id: 'arena-del-sur-quitumbe',
        nombre: 'Arena del Sur y Espacio Público Quitumbe',
        tipo: 'Espacio Público / Equipamiento Deportivo',
        badge: 'Operativo',
        longitud_km: '2.2 km de entorno',
        presupuesto: '$3.80M',
        financiamiento: 'Municipio de Quito',
        estado: 'Completado',
        resumen: 'Centro cultural y deportivo con caminerías iluminadas, conexión con la Estación Quitumbe y ciclovías periurbanas.',
        seguridad: {
          nivel: 'Muy Alto (Área Protegida)',
          camaras: 18,
          luminarias_led: 180,
          cruces_seguros: 10,
          bolardos: 160,
          descripcion: 'Perímetro vigilado y alumbrado de alta eficiencia para usuarios interprovinciales.'
        },
        economia: {
          negocios_activos: '+160 negocios de hotelería, encomiendas y gastronomía',
          atractivo_comercial: 'Punto de entrada de cientos de miles de viajeros al DMQ cada mes.',
          inversiones_privadas: [
            {
              titulo: 'Hoteles de Tránsito y Terminales Logísticas',
              tipo: 'Logística y Hospedaje',
              impacto: 'Inversión privada orientada al pasajero de conexión del Metro y buses interprovinciales.'
            }
          ]
        },
        valor_suelo: {
          aiva: 'AIVAS QUITUMBE',
          valor_m2: 590.00,
          rango: 'Medio / Institucional y Transporte',
          tendencia: '+7.5% de plusvalía anual',
          descripcion: 'Potencial de consolidación de nuevas manzanas residenciales e institucionales.'
        },
        imagen_destacada: '/arena_del_sur/Arena del Sur.png',
        galeria_id: null,
        antes_despues_id: null
      }
    ]
  }
};

// Generar registro completo de las 22 Centralidades
const allCentralidadesData = geojson.features.map(f => {
  const p = f.properties;
  const mapped = CENTRALIDAD_PROJECTS_MAP[p.id] || null;

  const defaultProjects = [
    {
      id: `diagnostico-${p.id}`,
      nombre: `Plan de Intervención Integral ${p.nombre}`,
      tipo: 'Diagnóstico Territorial & PMO',
      badge: 'Planificado en PUGS',
      longitud_km: `${(p.superficie_ha / 10).toFixed(1)} km de red vial`,
      presupuesto: `$${(p.superficie_ha * 8.5).toFixed(0)}K est.`,
      financiamiento: 'Municipio del Distrito Metropolitano de Quito',
      estado: 'Fase de Priorización',
      resumen: `Centralidad ${p.jerarquia.toLowerCase()} de ${p.superficie_ha.toFixed(1)} hectáreas con proyección de soterramiento de cables, iluminación LED y cruces peatonales seguros.`,
      seguridad: {
        nivel: 'En Proceso de Repotenciación',
        camaras: Math.round(p.superficie_ha * 0.08),
        luminarias_led: Math.round(p.superficie_ha * 0.9),
        cruces_seguros: Math.max(3, Math.round(p.superficie_ha * 0.05)),
        bolardos: Math.round(p.superficie_ha * 0.8),
        descripcion: `Equipamiento urbano y plan de seguridad preventiva para la centralidad ${p.nombre}.`
      },
      economia: {
        negocios_activos: `+${Math.round(p.superficie_ha * 1.1)} unidades productivas y de comercio`,
        atractivo_comercial: `Centralidad ${p.jerarquia.toLowerCase()} que abastece al tejido barrial circundante.`,
        inversiones_privadas: [
          {
            titulo: `Dinamización Comercial de ${p.nombre}`,
            tipo: 'Comercio y Servicios',
            impacto: 'Atracción de inversión de proximidad y formalización de patentes municipales.'
          }
        ]
      },
      valor_suelo: {
        aiva: `AIVAS ${p.nombre.toUpperCase()}`,
        valor_m2: p.jerarquia === 'Metropolitana' ? 1100 : (p.jerarquia === 'Zonal' ? 680 : 510),
        rango: `${p.jerarquia} / Planificado`,
        tendencia: '+6.2% promedio anual',
        descripcion: `Suelo urbano con potencial de densificación y desarrollo según la normativa PUGS de la STHV.`
      },
      imagen_destacada: '/zonas_metro/Zonas metro.jpg',
      galeria_id: null,
      antes_despues_id: null
    }
  ];

  return {
    id: p.id,
    nombre: p.nombre,
    jerarquia: p.jerarquia,
    superficie_ha: p.superficie_ha,
    descripcion_territorial: mapped ? mapped.descripcion_territorial : (p.descripcion || `Centralidad ${p.jerarquia.toLowerCase()} de Quito según el PUGS de la Secretaría de Territorio, Hábitat y Vivienda.`),
    admin_zonal: mapped ? mapped.admin_zonal : 'DMQ',
    equipamientos_clave: mapped ? mapped.equipamientos_clave : ['Equipamiento Educativo', 'Parque Barrial', 'Comercio Local'],
    centroid: p.centroid,
    bbox: p.bbox,
    proyectos: mapped ? mapped.proyectos : defaultProjects
  };
});

const outDataPath = path.join(__dirname, '../web/src/lib/centralidades_data.json');
fs.writeFileSync(outDataPath, JSON.stringify(allCentralidadesData, null, 2), 'utf8');
console.log(`Generated ${allCentralidadesData.length} centralidades in:`, outDataPath);
