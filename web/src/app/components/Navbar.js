'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'INFORMACIÓN', path: '/' },
    { name: 'CORREDORES VIVOS', path: '/corredores-vivos' },
    { name: 'ZONAS METRO', path: '/zonas-metro' },
    { name: 'REHABILITACIÓN DEL ESPACIO PÚBLICO', path: '/rehabilitacion-espacio-publico' },
    { name: 'SOTERRAMIENTO', path: '/soterramiento' },
  ];

  return (
    <nav className="navbar-tabs">
      <div className="navbar-container">
        {tabs.map((tab) => {
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
