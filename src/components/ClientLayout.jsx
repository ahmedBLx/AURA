'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import GlobalBackground from './GlobalBackground';
import BodySync from './BodySync';
import ErrorTrap from './ErrorTrap';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.toLowerCase() === '/admin';

  return (
    <div className="app-shell">
      {/* App-wide error trap (diagnostic; only visible with ?debug=1) */}
      <ErrorTrap />

      {/* Dynamic theme and route body class syncing */}
      <BodySync />
      
      {/* Global background animation */}
      <GlobalBackground />

      {/* Show header except on admin page */}
      {!isAdminPage && <Header />}
      
      {children}

      {/* Show footer except on admin page */}
      {!isAdminPage && <Footer />}

      {/* Shopping Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
