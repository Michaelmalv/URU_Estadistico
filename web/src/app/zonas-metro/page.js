'use strict';

import CategoryHub from '../components/CategoryHub';

export const metadata = {
  title: 'Zonas Metro | Portal de Evaluación de Proyectos Estratégicos',
  description: 'Evaluación integral de seguridad, economía y valor de suelo en las estaciones y áreas de influencia del Metro de Quito.',
};

export default function ZonasMetroPage() {
  return (
    <CategoryHub
      categoryKey="Zonas Metro"
      title="Zonas Metro"
      subtitle="Evaluación de impacto urbano, dinámicas comerciales y seguridad en las 15 estaciones del Metro de Quito."
      defaultSubTab="seguridad"
    />
  );
}
