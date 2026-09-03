'use strict';

import CategoryHub from '../components/CategoryHub';

export const metadata = {
  title: 'Rehabilitación del Espacio Público | Portal de Evaluación de Proyectos Estratégicos',
  description: 'Evaluación integral de seguridad, economía y suelo en proyectos de Rehabilitación del Espacio Público y Centro Histórico.',
};

export default function RehabilitacionEspacioPublicoPage() {
  return (
    <CategoryHub
      categoryKey="Rehabilitación del Espacio Público"
      title="Rehabilitación del Espacio Público"
      subtitle="Intervenciones emblemáticas de recuperación urbana, bulevares y patrimonio en el Centro Histórico y sectores estratégicos."
      defaultSubTab="seguridad"
    />
  );
}
