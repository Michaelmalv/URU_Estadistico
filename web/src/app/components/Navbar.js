'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'INFORMACIÓN', path: '/' },
    { name: 'SEGURIDAD', path: '/seguridad' },
    { name: 'ECONOMÍA', path: '/economia' },
    { name: 'VALOR DE SUELO', path: '/valor-suelo' },
  ];

  return (
    <nav className="navbar-tabs">
      <div className="navbar-container">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
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
