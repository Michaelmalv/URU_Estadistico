'use strict';

import CategoryHub from '../components/CategoryHub';

export const metadata = {
  title: 'Corredores Vivos | Portal de Evaluación de Proyectos Estratégicos',
  description: 'Evaluación integral de seguridad, economía y valor de suelo en Corredores Vivos.',
};

export default function CorredoresVivosPage() {
  return (
    <CategoryHub
      categoryKey="Corredores Vivos"
      title="Corredores Vivos"
      subtitle="Corredores peatonales seguros y senderos urbanos diseñados para revitalizar el espacio público y mitigar la incidencia delictiva."
      defaultSubTab="seguridad"
    />
  );
}
