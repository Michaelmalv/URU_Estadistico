'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Pestañas del portal: Se restauran todas las pestañas oficiales conectadas a la base de datos.
  const tabs = [
    { name: 'INFORMACIÓN', path: '/informacion', visible: true },
    { name: 'CENTRALIDADES URBANAS', path: '/', visible: true },
    { name: 'CORREDORES VIVOS', path: '/corredores-vivos', visible: true },
    { name: 'ZONAS METRO', path: '/zonas-metro', visible: true },
    { name: 'REHABILITACIÓN DEL ESPACIO PÚBLICO', path: '/rehabilitacion-espacio-publico', visible: true },
    { name: 'SOTERRAMIENTO', path: '/soterramiento', visible: true },
  ];

  return (
    <nav className="navbar-tabs">
      <div className="navbar-container">
        {tabs.filter(t => t.visible).map((tab) => {
          const isActive = pathname === tab.path || (tab.path !== '/' && pathname?.startsWith(tab.path));
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
