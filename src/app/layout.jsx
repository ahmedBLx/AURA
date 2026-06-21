import React from 'react';
import '../index.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ProductProvider } from '../context/ProductContext';
import { CartProvider } from '../context/CartContext';
import { AdminProvider } from '../context/AdminContext';
import ClientLayout from '../components/ClientLayout';
import ErrorBoundary from '../components/ErrorBoundary';

export const metadata = {
  title: 'AURA - Dare To Dream',
  description: 'Production-ready e-commerce platform for AURA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
