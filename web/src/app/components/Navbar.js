'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Pestañas del portal: Se mantiene únicamente Centralidades Urbanas activa y visible.
  // Las demás se dejan reservadas en código para reanudarlas cuando el usuario lo solicite.
  const tabs = [
    { name: 'CENTRALIDADES URBANAS', path: '/', visible: true },
    // { name: 'CORREDORES VIVOS', path: '/corredores-vivos', visible: false },
    // { name: 'ZONAS METRO', path: '/zonas-metro', visible: false },
    // { name: 'REHABILITACIÓN DEL ESPACIO PÚBLICO', path: '/rehabilitacion-espacio-publico', visible: false },
    // { name: 'SOTERRAMIENTO', path: '/soterramiento', visible: false },
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
