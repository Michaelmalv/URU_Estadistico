'use strict';

import CategoryHub from '../components/CategoryHub';

export const metadata = {
  title: 'Soterramiento | Portal de Evaluación de Proyectos Estratégicos',
  description: 'Plan Maestro de Soterramiento de Redes e Infraestructura en el Distrito Metropolitano de Quito.',
};

export default function SoterramientoPage() {
  return (
    <CategoryHub
      categoryKey="Soterramiento"
      title="Soterramiento"
      subtitle="Plan integral de soterramiento de redes eléctricas y de telecomunicaciones para la regeneración urbana y seguridad de Quito."
      defaultSubTab="informacion"
    />
  );
}
