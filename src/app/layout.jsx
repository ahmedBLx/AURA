import React from 'react';
import { Montserrat, Outfit } from 'next/font/google';
import '../index.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ProductProvider } from '../context/ProductContext';
import { CartProvider } from '../context/CartContext';
import { AdminProvider } from '../context/AdminContext';
import ClientLayout from '../components/ClientLayout';
import ErrorBoundary from '../components/ErrorBoundary';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'AURA - Dare To Dream',
  description: 'Production-ready e-commerce platform for AURA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preload" as="image" href="/assets/hero_banner_new.png" fetchPriority="high" />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ProductProvider>
                <CartProvider>
                  <AdminProvider>
                    <ClientLayout>
                      {children}
                    </ClientLayout>
                  </AdminProvider>
                </CartProvider>
              </ProductProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
