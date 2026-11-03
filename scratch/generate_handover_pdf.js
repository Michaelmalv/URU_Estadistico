const fs = require('fs');
const path = require('path');

class HandoverPDF {
  constructor() {
    this.pages = [];
    this.currentPage = null;
    this.pageWidth = 595.28;  // A4
    this.pageHeight = 841.89; // A4
    this.margin = 38;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.cursorY = this.pageHeight - this.margin;
    this.contentStream = '';
    this.pageNumber = 0;
  }

  addPage() {
    if (this.currentPage) {
      this.currentPage.stream = this.contentStream;
    }
    this.pageNumber++;
    this.contentStream = '';
    this.cursorY = this.pageHeight - 55;
    const page = {
      number: this.pageNumber,
      stream: ''
    };
    this.pages.push(page);
    this.currentPage = page;
    this.drawHeader();
  }

  drawHeader() {
    this.contentStream += `
q
0.08 0.18 0.36 rg
${this.margin} ${this.pageHeight - 26} ${this.contentWidth} 3.0 re f
0.80 0.85 0.92 RG
0.5 w
${this.margin} ${this.pageHeight - 38} m ${this.pageWidth - this.margin} ${this.pageHeight - 38} l S
BT
/F2 7 Tf
0.20 0.28 0.42 rg
${this.margin} ${this.pageHeight - 35} Td
(MUNICIPIO DEL DISTRITO METROPOLITANO DE QUITO | SECRETARIA DE HABITAT Y ORDENAMIENTO TERRITORIAL) Tj
ET
BT
/F2 7 Tf
0.10 0.35 0.65 rg
${this.pageWidth - this.margin - 145} ${this.pageHeight - 35} Td
(TRANSFERENCIA TECNOLOGICA Y DESPLIEGUE AUTONOMO) Tj
ET
Q
`;
  }

  drawFooter() {
    const totalPages = this.pages.length;
    for (let i = 0; i < this.pages.length; i++) {
      const p = this.pages[i];
      const footerStr = `
q
0.82 0.86 0.92 RG
0.5 w
${this.margin} 30 m ${this.pageWidth - this.margin} 30 l S
BT
/F1 7 Tf
0.40 0.45 0.55 rg
${this.margin} 21 Td
(Manual Tecnico de Entrega, Cuentas Propias y Despliegue - Portal de Proyectos Estrategicos DMQ) Tj
ET
BT
/F2 7 Tf
0.12 0.22 0.38 rg
${this.pageWidth - this.margin - 65} 21 Td
(Pagina ${i + 1} de ${totalPages}) Tj
ET
Q
`;
      p.stream += footerStr;
    }
  }

  checkPageBreak(neededHeight) {
    if (this.cursorY - neededHeight < 40) {
      this.addPage();
    }
  }

  addTitle(text) {
    this.contentStream += `
q
BT
/F2 12 Tf
0.08 0.18 0.36 rg
${this.margin} ${this.cursorY} Td
(${this.escapeText(text)}) Tj
ET
Q
`;
    this.cursorY -= 15;
  }

  addSubtitle(text) {
    this.contentStream += `
q
BT
/F2 8.5 Tf
0.12 0.38 0.70 rg
${this.margin} ${this.cursorY} Td
(${this.escapeText(text)}) Tj
ET
Q
`;
    this.cursorY -= 12;
  }

  addMetadataCard(items) {
    const cardHeight = Math.ceil(items.length / 2) * 12 + 8;
    this.contentStream += `
q
0.96 0.97 0.99 rg
${this.margin} ${this.cursorY - cardHeight + 6} ${this.contentWidth} ${cardHeight} re f
0.80 0.86 0.94 RG
0.75 w
${this.margin} ${this.cursorY - cardHeight + 6} ${this.contentWidth} ${cardHeight} re S
Q
`;
    let rowY = this.cursorY - 1;
    for (let i = 0; i < items.length; i += 2) {
      const it1 = items[i];
      const it2 = items[i + 1];

      this.contentStream += `
q
BT
/F2 7 Tf
0.18 0.26 0.38 rg
${this.margin + 8} ${rowY} Td
(${this.escapeText(it1.label)}: ) Tj
/F1 7 Tf
0.08 0.18 0.32 rg
(${this.escapeText(it1.val)}) Tj
ET
`;
      if (it2) {
        this.contentStream += `
BT
/F2 7 Tf
0.18 0.26 0.38 rg
${this.margin + 265} ${rowY} Td
(${this.escapeText(it2.label)}: ) Tj
/F1 7 Tf
0.08 0.48 0.22 rg
(${this.escapeText(it2.val)}) Tj
ET
`;
      }
      this.contentStream += `Q\n`;
      rowY -= 11;
    }
    this.cursorY -= (cardHeight + 4);
  }

  addSectionHeader(number, text) {
    this.checkPageBreak(25);
    this.cursorY -= 3;
    this.contentStream += `
q
0.94 0.96 0.99 rg
${this.margin} ${this.cursorY - 2} ${this.contentWidth} 15 re f
0.80 0.86 0.94 RG
0.75 w
${this.margin} ${this.cursorY - 2} ${this.contentWidth} 15 re S
0.10 0.25 0.55 rg
${this.margin} ${this.cursorY - 2} 3.5 15 re f
BT
/F2 8.5 Tf
0.08 0.18 0.36 rg
${this.margin + 8} ${this.cursorY + 2.5} Td
(${this.escapeText(`${number}. ${text.toUpperCase()}`)}) Tj
ET
Q
`;
    this.cursorY -= 18;
  }

  addParagraph(text, isBold = false, fontSize = 7.8, indent = 0) {
    const maxWidth = this.contentWidth - indent;
    const fontName = isBold ? '/F2' : '/F1';
    const lines = this.wrapText(text, fontSize, maxWidth, isBold);

    for (const line of lines) {
      this.checkPageBreak(fontSize + 3);
      this.contentStream += `
q
BT
${fontName} ${fontSize} Tf
0.15 0.18 0.22 rg
${this.margin + indent} ${this.cursorY} Td
(${this.escapeText(line)}) Tj
ET
Q
`;
      this.cursorY -= (fontSize + 2.7);
    }
  }

  addBulletItem(title, text) {
    this.checkPageBreak(20);
    const bulletSize = 2.5;
    const bulletY = this.cursorY - 0.5;

    this.contentStream += `
q
0.12 0.38 0.70 rg
${this.margin + 4} ${bulletY} ${bulletSize} ${bulletSize} re f
Q
`;

    this.addParagraph(title, true, 7.8, 12);
    if (text) {
      this.addParagraph(text, false, 7.5, 12);
    }
    this.cursorY -= 2;
  }

  addCodeBox(lines, fontSize = 7.2) {
    const lineHeight = fontSize + 3.8;
    const boxHeight = (lines.length * lineHeight) + 8;
    this.checkPageBreak(boxHeight + 6);
    this.cursorY -= 2;

    this.contentStream += `
q
0.06 0.08 0.14 rg
${this.margin + 8} ${this.cursorY - boxHeight + 8} ${this.contentWidth - 16} ${boxHeight} re f
0.18 0.25 0.38 RG
0.75 w
${this.margin + 8} ${this.cursorY - boxHeight + 8} ${this.contentWidth - 16} ${boxHeight} re S
Q
`;

    let lineY = this.cursorY - 2;
    for (const l of lines) {
      const isComment = l.trim().startsWith('#') || l.trim().startsWith('--');
      const isKeyword = l.trim().startsWith('CREATE') || l.trim().startsWith('ALTER') || l.trim().startsWith('INSERT');
      const col = isComment ? '0.45 0.55 0.65 rg' : isKeyword ? '0.35 0.75 0.95 rg' : '0.90 0.94 0.98 rg';

      this.contentStream += `
q
BT
/F1 ${fontSize} Tf
${col}
${this.margin + 15} ${lineY} Td
(${this.escapeText(l)}) Tj
ET
Q
`;
      lineY -= lineHeight;
    }
    this.cursorY -= (boxHeight + 2);
  }

  addAlertBox(title, text, type = 'warning') {
    const lines = this.wrapText(text, 7.5, this.contentWidth - 24, false);
    const boxHeight = 13 + (lines.length * 9.5);
    this.checkPageBreak(boxHeight + 6);

    let bgColor = '0.99 0.98 0.94 rg';
    let borderColor = '0.85 0.65 0.20 RG';
    let barColor = '0.85 0.55 0.10 rg';
    let titleColor = '0.55 0.35 0.05 rg';

    if (type === 'success') {
      bgColor = '0.94 0.99 0.95 rg';
      borderColor = '0.25 0.70 0.35 RG';
      barColor = '0.15 0.60 0.25 rg';
      titleColor = '0.10 0.45 0.18 rg';
    } else if (type === 'info') {
      bgColor = '0.93 0.97 1.00 rg';
      borderColor = '0.25 0.60 0.85 RG';
      barColor = '0.10 0.45 0.75 rg';
      titleColor = '0.08 0.30 0.55 rg';
    }

    this.contentStream += `
q
${bgColor}
${this.margin} ${this.cursorY - boxHeight + 7} ${this.contentWidth} ${boxHeight} re f
${borderColor}
0.75 w
${this.margin} ${this.cursorY - boxHeight + 7} ${this.contentWidth} ${boxHeight} re S
${barColor}
${this.margin} ${this.cursorY - boxHeight + 7} 3.5 ${boxHeight} re f
BT
/F2 7.8 Tf
${titleColor}
${this.margin + 9} ${this.cursorY - 2} Td
(${this.escapeText(title)}) Tj
ET
Q
`;

    let textY = this.cursorY - 12;
    for (const line of lines) {
      this.contentStream += `
q
BT
/F1 7.4 Tf
0.15 0.20 0.25 rg
${this.margin + 9} ${textY} Td
(${this.escapeText(line)}) Tj
ET
Q
`;
      textY -= 9.5;
    }
    this.cursorY -= (boxHeight + 4);
  }

  addTable(headers, rows, customWidths = null) {
    const colWidths = customWidths || [140, 160, 219];
    const rowHeight = 13;
    const tableHeight = (rows.length + 1) * rowHeight;
    this.checkPageBreak(tableHeight + 8);

    this.contentStream += `
q
0.90 0.94 0.98 rg
${this.margin} ${this.cursorY - rowHeight + 7} ${this.contentWidth} ${rowHeight} re f
0.75 0.82 0.90 RG
0.75 w
${this.margin} ${this.cursorY - rowHeight + 7} ${this.contentWidth} ${rowHeight} re S
Q
`;

    let xPos = this.margin + 6;
    for (let i = 0; i < headers.length; i++) {
      this.contentStream += `
q
BT
/F2 7 Tf
0.10 0.20 0.35 rg
${xPos} ${this.cursorY - 1.5} Td
(${this.escapeText(headers[i])}) Tj
ET
Q
`;
      xPos += colWidths[i];
    }
    this.cursorY -= rowHeight;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const bg = (r % 2 === 0) ? '1 1 1 rg' : '0.97 0.98 0.99 rg';
      this.contentStream += `
q
${bg}
${this.margin} ${this.cursorY - rowHeight + 7} ${this.contentWidth} ${rowHeight} re f
0.85 0.88 0.92 RG
0.5 w
${this.margin} ${this.cursorY - rowHeight + 7} ${this.contentWidth} ${rowHeight} re S
Q
`;
      let rxPos = this.margin + 6;
      for (let c = 0; c < row.length; c++) {
        const isBoldCol = c === 0;
        this.contentStream += `
q
BT
${isBoldCol ? '/F2' : '/F1'} 7 Tf
0.15 0.18 0.22 rg
${rxPos} ${this.cursorY - 1.5} Td
(${this.escapeText(row[c])}) Tj
ET
Q
`;
        rxPos += colWidths[c];
      }
      this.cursorY -= rowHeight;
    }
    this.cursorY -= 4;
  }

  escapeText(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[áàäâ]/gi, 'a')
      .replace(/[éèëê]/gi, 'e')
      .replace(/[íìïî]/gi, 'i')
      .replace(/[óòöô]/gi, 'o')
      .replace(/[úùüû]/gi, 'u')
      .replace(/ñ/gi, 'n')
      .replace(/[¿¡]/g, '')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  }

  wrapText(text, fontSize, maxWidth, isBold = false) {
    const charWidth = isBold ? fontSize * 0.54 : fontSize * 0.48;
    const maxChars = Math.floor(maxWidth / charWidth);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + (currentLine ? ' ' : '') + w).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + w;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  buildPDF() {
    if (this.currentPage) {
      this.currentPage.stream = this.contentStream;
    }
    this.drawFooter();

    let pdf = '%PDF-1.4\n';
    const objects = [];

    const addObject = (content) => {
      objects.push(content);
      return objects.length;
    };

    const font1Id = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
    const font2Id = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

    const pageIds = [];
    const contentStreamIds = [];

    for (let i = 0; i < this.pages.length; i++) {
      const p = this.pages[i];
      const sId = addObject(`<< /Length ${Buffer.byteLength(p.stream, 'utf8')} >>\nstream\n${p.stream}\nendstream`);
      contentStreamIds.push(sId);
      const pageId = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${sId} 0 R /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> >>`);
      pageIds.push(pageId);
    }

    const pagesObjId = addObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);

    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`);

    // Patch parent in pages
    for (const pid of pageIds) {
      objects[pid - 1] = objects[pid - 1].replace('/Parent 0 0 R', `/Parent ${pagesObjId} 0 R`);
    }

    const offsets = [0];
    let pos = pdf.length;

    for (let i = 0; i < objects.length; i++) {
      offsets.push(pos);
      const str = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
      pdf += str;
      pos += Buffer.byteLength(str, 'utf8');
    }

    const xrefOffset = pos;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      const off = offsets[i].toString().padStart(10, '0');
      pdf += `${off} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }
}

// ==========================================
// GENERACIÓN COMPLETA DEL DOCUMENTO
// ==========================================
const doc = new HandoverPDF();

// ------------------------------------------
// PÁGINA 1: PORTADA, ARQUITECTURA Y GITHUB LOCAL
// ------------------------------------------
doc.addPage();
doc.addTitle('MANUAL DE TRANSFERENCIA TECNOLOGICA, COPIA Y DESPLIEGUE AUTONOMO');
doc.addSubtitle('Portal de Seguimiento y Evaluacion de Proyectos Estrategicos DMQ (PMDOT / PUGS)');
doc.addMetadataCard([
  { label: 'REPOSITORIO MAESTRO', val: 'https://github.com/Michaelmalv/URU_Estadistico.git' },
  { label: 'ESTADO', val: 'PRODUCCION / 100% OPERATIVO' },
  { label: 'REPOSITORIO VERCEL', val: 'https://github.com/Michaelmalv/Portal_Evaluacion_Proyectos_Estrategicos.git' },
  { label: 'STACK TECNOLOGICO', val: 'Next.js 16 - React 19 - Mapbox GL - Supabase - Vercel' }
]);

doc.addSectionHeader(1, 'Objetivo y Principio de Soberania Tecnologica');
doc.addParagraph(
  'El objetivo de este manual es garantizar que el equipo tecnico institucional (Municipio del DMQ / Secretaria de Territorio, Habitat y Vivienda) mantenga autonomia tecnica absoluta sobre el codigo, las bases de datos y la infraestructura web, asegurando que puedan clonar, programar, administrar y desplegar la plataforma sin depender de cuentas personales ajenas ni intermediarios.'
);
doc.addBulletItem(
  'Los 4 Pilares de Infraestructura Institucional:',
  '1) Repositorio GitHub propio para gobernanza del codigo. 2) Base de datos PostgreSQL propia en Supabase. 3) Cuenta y Access Token propio en Mapbox con restriccion de dominio. 4) Servidor Cloud propio en Vercel con integracion continua ante cada git push.'
);

doc.addSectionHeader(2, 'Repositorios GitHub y Clonacion Local Paso a Paso');
doc.addParagraph(
  'El proyecto cuenta con dos repositorios publicos oficiales listos para ser copiados:'
);
doc.addBulletItem(
  'Repositorio Maestro (Completo):',
  'https://github.com/Michaelmalv/URU_Estadistico.git  (Contiene la aplicacion web en /web, datos cartograficos SIRES, matrices Excel analiticas y scripts de automatizacion).'
);
doc.addBulletItem(
  'Repositorio Despliegue Produccion (Vercel Directo):',
  'https://github.com/Michaelmalv/Portal_Evaluacion_Proyectos_Estrategicos.git  (Subarbol optimizado exclusivamente para despliegue directo en Vercel sin subcarpetas).'
);

doc.addBulletItem(
  'Paso 2.1: Comandos para Clonar y Vincular a su Propio GitHub Institucional',
  'Ejecute en la terminal de su estacion de trabajo para clonar el codigo maestro y redirigirlo a su organizacion:'
);
doc.addCodeBox([
  '# 1. Clonar el repositorio maestro',
  '$ git clone https://github.com/Michaelmalv/URU_Estadistico.git',
  '$ cd URU_Estadistico',
  '',
  '# 2. Re-vincular hacia el GitHub institucional propio',
  '$ git remote set-url origin https://github.com/SuOrganizacion/URU_Estadistico.git',
  '',
  '# 3. Subir las ramas principales al nuevo repositorio',
  '$ git push -u origin main',
  '$ git push origin master'
]);

doc.addBulletItem(
  'Paso 2.2: Instalacion y Ejecucion Local del Proyecto',
  'Para programar, editar fichas o probar cambios en tiempo real, inicie el entorno de desarrollo:'
);
doc.addCodeBox([
  '# Navegar al directorio de la aplicacion web',
  '$ cd web',
  '',
  '# Instalar dependencias de Node.js (requiere Node v18, v20, v22 o superior)',
  '$ npm install',
  '',
  '# Iniciar el servidor local en desarrollo con Fast Refresh',
  '$ npm run dev'
]);
doc.addParagraph(
  'Abra en su navegador http://localhost:3000. Cualquier cambio que realice en los archivos .js o .css se refresca inmediatamente en pantalla.'
);

// ------------------------------------------
// PÁGINA 2: BASE DE DATOS SUPABASE E INYECCIÓN SQL COMPLETA
// ------------------------------------------
doc.addPage();
doc.addSectionHeader(3, 'Base de Datos Propia en Supabase e Inyeccion SQL Completa');
doc.addParagraph(
  'Para que las estadisticas de Seguridad, Economia (LUAEs) y Valor de Suelo funcionen con su propio backend, se incluye el script maestro de migracion e inyeccion SQL automatica con 1 clic.'
);

doc.addBulletItem(
  'Paso 3.1: Crear Proyecto Propio en Supabase (Gratuito / Cloud)',
  '1) Ingrese a https://supabase.com con el correo institucional. 2) Clic en "New Project". 3) Asigne nombre (ej. portal-estrategicos-dmq), defina contraseña segura y elija region cercana (South America / Sao Paulo o US East).'
);

doc.addBulletItem(
  'Paso 3.2: Ubicacion del Script de Inyeccion SQL Maestro',
  'En la raiz del repositorio clonado se encuentra el archivo maestro listo para ejecutar: scripts/supabase_migration_complete.sql (59 KB con esquema relacional, indices y seed data consolidado).'
);

doc.addBulletItem(
  'Paso 3.3: Ejecutar la Inyeccion SQL en el Panel de Supabase',
  '1) En el panel lateral izquierdo de Supabase, haga clic en "SQL Editor". 2) Haga clic en "New Query". 3) Abra "scripts/supabase_migration_complete.sql", copie todo el contenido y peguelo en el editor. 4) Presione el boton verde "RUN".'
);

doc.addParagraph(
  'Resumen de estructura DDL inyectada por el script para el funcionamiento del portal:',
  true
);
doc.addCodeBox([
  '-- Extension de identificadores y tablas relacionales maestras',
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  'CREATE TABLE proyectos (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), nombre TEXT UNIQUE NOT NULL, categoria TEXT, ubicacion TEXT, extension TEXT);',
  'CREATE TABLE seguridad_estadisticas (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE, anio TEXT NOT NULL, variable TEXT NOT NULL, valor NUMERIC, tipo TEXT DEFAULT "observado");',
  'CREATE TABLE economia_registros (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, sector_raw TEXT, movimiento_raw TEXT, fecha_impresion DATE);',
  'CREATE TABLE valor_suelo (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, proyecto TEXT NOT NULL, descripcion TEXT, valor_2022_2023 NUMERIC, valor_2024 NUMERIC, valor_2026 NUMERIC);',
  'CREATE TABLE senderos_fichas (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE, anio INT, ejecutor TEXT, presupuesto TEXT, extension TEXT, beneficiarios TEXT, fecha TEXT);'
], 6.3);

doc.addAlertBox(
  'REGLA OBLIGATORIA: POLITICAS DE LECTURA PUBLICA (ROW LEVEL SECURITY - RLS):',
  'Supabase bloquea por defecto las consultas web publicas. El script ejecuta automaticamente politicas RLS indispensables para que el frontend lea datos sin clave administrativa:',
  'warning'
);
doc.addCodeBox([
  '-- Activacion de RLS y permisos publicos de solo lectura para la aplicacion web',
  'ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY; ALTER TABLE seguridad_estadisticas ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE economia_registros ENABLE ROW LEVEL SECURITY; ALTER TABLE valor_suelo ENABLE ROW LEVEL SECURITY; ALTER TABLE senderos_fichas ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY "Lectura publica proyectos" ON proyectos FOR SELECT USING (true);',
  'CREATE POLICY "Lectura publica seguridad" ON seguridad_estadisticas FOR SELECT USING (true);',
  'CREATE POLICY "Lectura publica economia" ON economia_registros FOR SELECT USING (true);',
  'CREATE POLICY "Lectura publica valor suelo" ON valor_suelo FOR SELECT USING (true);',
  'CREATE POLICY "Lectura publica senderos" ON senderos_fichas FOR SELECT USING (true);'
], 6.5);

doc.addBulletItem(
  'Paso 3.4: Copiar Credenciales Institucionales de Supabase',
  'En Supabase vaya a Project Settings -> Data API y copie sus dos variables para la aplicacion:'
);
doc.addTable(
  ['PARAMETRO EN SUPABASE', 'VARIABLE DE ENTORNO', 'DESCRIPCION'],
  [
    ['Project URL', 'NEXT_PUBLIC_SUPABASE_URL', 'URL HTTPS del servidor (ej. https://xxxx.supabase.co)'],
    ['anon / public key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Clave publica segura para consultas frontend']
  ],
  [140, 175, 204]
);

// ------------------------------------------
// PÁGINA 3: MAPBOX Y DESPLIEGUE EN VERCEL
// ------------------------------------------
doc.addPage();
doc.addSectionHeader(4, 'Cuenta y Access Token Propio de Mapbox (OBLIGATORIO)');
doc.addAlertBox(
  'SOBERANIA CARTOGRAFICA Y SEGURIDAD OBLIGATORIA:',
  'Por normativas de ciberseguridad municipal, la institucion DEBE generar su propio token de Mapbox. Jamas utilice tokens personales de desarrolladores para evitar cortes imprevistos o bloqueos por limite de cuota.',
  'warning'
);
doc.addParagraph(
  'Mapbox otorga 50.000 cargas de mapa mensuales completamente gratis, suficientes para la demanda ciudadana e interna del portal.'
);
doc.addBulletItem(
  'Paso 4.1: Registro de Cuenta Mapbox',
  'Ingrese a https://account.mapbox.com y registre una cuenta oficial con el correo de la institucion.'
);
doc.addBulletItem(
  'Paso 4.2: Creacion de Token con Restriccion de Dominio',
  '1) En la seccion "Access Tokens", haga clic en "Create a token". 2) Asigne nombre: "Portal-DMQ-Produccion". 3) En el campo "URL Restrictions", escriba los dominios permitidos (ej. *.vercel.app y *.quito.gob.ec). Esto impide que externos consuman su cuota de mapas.'
);
doc.addBulletItem(
  'Paso 4.3: Variable de Entorno de Mapbox',
  'Copie el token generado (inicia con pk.eyJ1...). Este valor corresponde a: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.'
);

doc.addSectionHeader(5, 'Despliegue en Produccion Cloud con Vercel');
doc.addParagraph(
  'Vercel es la nube oficial de Next.js. Provee servidores de alta velocidad, certificados SSL HTTPS automaticos y publicacion continua ante cada actualizacion en GitHub.'
);

doc.addBulletItem(
  'Paso 5.1: Conectar el Repositorio de GitHub en Vercel',
  '1) Inicie sesion en https://vercel.com con la cuenta institucional. 2) Clic en "Add New..." -> "Project". 3) Seleccione el repositorio "URU_Estadistico" (o "Portal_Evaluacion_Proyectos_Estrategicos").'
);

doc.addAlertBox(
  'PASO CRITICO OBLIGATORIO: CONFIGURAR "ROOT DIRECTORY" EN "web"',
  'Si conecta el repositorio maestro URU_Estadistico, en la pantalla de configuracion de Vercel debe hacer clic en EDIT en "Root Directory" y escribir: web\n(Si no selecciona la carpeta "web", Vercel intentara compilar la raiz del repositorio y fallara al no encontrar package.json).',
  'warning'
);

doc.addBulletItem(
  'Paso 5.2: Inyectar las 3 Variables de Entorno en Vercel',
  'En la seccion "Environment Variables" de Vercel, pegue las 3 claves obtenidas:'
);
doc.addTable(
  ['VARIABLE EN VERCEL', 'VALOR A COLOCAR', 'PROPOSITO'],
  [
    ['NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.eyJ1... (Token propio Mapbox)', 'Renderizado de mapas 3D y trazados viales'],
    ['NEXT_PUBLIC_SUPABASE_URL', 'https://xyz.supabase.co', 'Conexion a la base de datos PostgreSQL'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGci... (Anon Key Supabase)', 'Lectura publica segura de estadisticas']
  ],
  [155, 175, 189]
);

doc.addBulletItem(
  'Paso 5.3: Clic en "Deploy" y Publicacion Exitosa',
  'Haga clic en el boton azul "Deploy". En 60 segundos la web estara activa con su dominio institucional. A partir de ahi, cada cambio guardado en GitHub actualizara la web automaticamente sin intervencion manual.'
);

doc.addBulletItem(
  'Archivo de Configuracion Local de Respaldo (web/.env.local)',
  'Cree un archivo llamado .env.local dentro de la subcarpeta /web con las mismas 3 variables para trabajar localmente:'
);
doc.addCodeBox([
  'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxx'
]);

// ------------------------------------------
// PÁGINA 4: ARQUITECTURA DE DATOS, RESILIENCIA Y CHECKLIST
// ------------------------------------------
doc.addPage();
doc.addSectionHeader(6, 'Arquitectura de Datos y Modificacion Futura de Proyectos');
doc.addParagraph(
  'Toda la estructura analitica, cartografica y estadistica esta desacoplada para facilitar auditorias y permitir agregar futuros proyectos facilmente:'
);
doc.addTable(
  ['ARCHIVO / RUTA', 'FORMATO / CONTENIDO', 'FUNCION EN EL SISTEMA'],
  [
    ['web/src/lib/centralidades_data.json', 'JSON (18 Centralidades, 69 proyectos)', 'Base documental maestra con fichas tecnicas, inversiones y estado'],
    ['web/src/lib/proyectos_geometrias.json', 'GeoJSON WGS84 (120 caracteristicas)', 'Geometrias exactas: 77 soterramientos, 15 metro, 23 viales y 5 puntos'],
    ['web/src/lib/soterramiento.json', 'JSON (38 proyectos SIRES DMQ)', 'Metricas del Plan Maestro de Soterramiento (kilometraje, tipo, ejecutor)'],
    ['web/src/app/components/CentralidadesView.js', 'React Component', 'Visor territorial, motor de filtros, jerarquias y balizas de radar'],
    ['scripts/supabase_migration_complete.sql', 'SQL DDL & DML (59 KB)', 'Inyeccion integral con todas las tablas e historicos 2019-2026'],
    ['data/Coordenadas Soterramiento Actualizado/', 'Shapefiles (.shp, .dbf, .prj)', 'Archivos cartograficos nativos municipales en UTM Zona 17S']
  ],
  [145, 160, 214]
);

doc.addSectionHeader(7, 'Sensibilidad del Proyecto, Resiliencia y Tolerancia a Fallos');
doc.addAlertBox(
  'ARQUITECTURA RESILIENTE DE ALTA DISPONIBILIDAD (MOTOR HIBRIDO):',
  'Para asegurar que el portal municipal nunca sufra caidas ni muestre pantallas en blanco si la base de datos entra en pausa por inactividad de Supabase, el portal cuenta con un mecanismo de respaldo automatico: si la conexion remota tarda o falla, el frontend consume de inmediato las fuentes locales precargadas en web/src/lib/, garantizando 100% de disponibilidad ciudadana 24 horas al dia los 7 dias de la semana.',
  'success'
);

doc.addParagraph(
  'Checklist Oficial de Verificacion para Puesta en Marcha Institucional:',
  true
);
doc.addBulletItem(
  '[✓] Codigo Fuente Clonado:',
  'Repositorio descargado en local y respaldado en la cuenta de GitHub institucional.'
);
doc.addBulletItem(
  '[✓] Base de Datos PostgreSQL Inyectada:',
  'Script scripts/supabase_migration_complete.sql ejecutado exitosamente con politicas RLS activas.'
);
doc.addBulletItem(
  '[✓] Token Cartografico Mapbox Generado:',
  'Token propio creado con restriccion a dominios institucionales autorizados.'
);
doc.addBulletItem(
  '[✓] Despliegue en Vercel Configurado:',
  'Root Directory establecido en "web" y las 3 variables de entorno inyectadas correctamente.'
);
doc.addBulletItem(
  '[✓] Funcionamiento Identico Comprobado:',
  'Pestañas operativas (Centralidades, Corredores Vivos, Zonas Metro, Espacio Publico, Soterramiento), mapas 3D con colores correctos y navegacion de fichas funcionando plenamente.'
);

doc.addAlertBox(
  'CERTIFICACION DE ENTREGA Y CONFORMIDAD TECNICA:',
  'El sistema se entrega en condicion "Llave en Mano", verificado punto a punto, con documentacion reproducible y arquitectura autosuficiente para el Municipio del Distrito Metropolitano de Quito.',
  'info'
);

// GUARDAR ARCHIVO
const pdfBuffer = doc.buildPDF();
const outputPath = path.join(__dirname, '..', 'MANUAL_DE_ENTREGA_Y_DESPLIEGUE.pdf');
fs.writeFileSync(outputPath, pdfBuffer);
console.log('PDF generado exitosamente en:', outputPath, 'Bytes:', pdfBuffer.length, 'Total Paginas:', doc.pages.length);
