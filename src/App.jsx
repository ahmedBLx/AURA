import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import GlobalBackground from './components/GlobalBackground';

// Pages
import LandingPage from './pages/LandingPage';
import ShopPage from './pages/ShopPage';
import AdminPage from './pages/AdminPage';
import MenPage from './pages/MenPage';
import WomenPage from './pages/WomenPage';
import OffersPage from './pages/OffersPage';


// Route Guard for Admin (Dashboard access)
const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
};

// Layout wrapper to show/hide Header & Footer based on active route
const AppLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const { theme } = useTheme();

    const isAdminPage = location.pathname.toLowerCase() === '/admin';

    // Sync body class names dynamically on route change and theme change
    useEffect(() => {
        const path = location.pathname.toLowerCase();
        const prefix = theme === 'light' ? 'light' : 'dark';
        if (path === '/shop' || path === '/men' || path === '/women' || path === '/offers') {
            document.body.className = `${prefix}-shop`;
        } else if (path === '/admin') {
            document.body.className = `${prefix}-admin`;
        } else {
            document.body.className = `${prefix}-landing`;
        }
    }, [location.pathname, theme]);

    // Auto-redirect admins to /admin if they land on /
    if (user && user.role === 'admin' && !isAdminPage) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="app-shell">
            {/* Global animated background */}
            <GlobalBackground />

            {/* Render header for customer and landing pages, hide for admin dashboard */}
            {!isAdminPage && <Header onOpenAuth={() => setAuthModalOpen(true)} />}
            
            <Routes>
                {/* Public Landing Route */}
                <Route path="/" element={<LandingPage onOpenAuth={() => setAuthModalOpen(true)} />} />
                
                {/* Category & Offers Routes */}
                <Route path="/men" element={<MenPage onOpenAuth={() => setAuthModalOpen(true)} />} />
                <Route path="/women" element={<WomenPage onOpenAuth={() => setAuthModalOpen(true)} />} />
                <Route path="/offers" element={<OffersPage onOpenAuth={() => setAuthModalOpen(true)} />} />
                
                {/* Public Customer Shop Route */}
                <Route path="/shop" element={<ShopPage />} />
                
                {/* Protected Admin Dashboard Route */}
                <Route 
                    path="/admin" 
                    element={
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
                    } 
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Render footer except for admin dashboard */}
            {!isAdminPage && <Footer />}

            {/* Auth Modal Overlay */}
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

            {/* Cart Drawer Overlay */}
            <CartDrawer />
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ProductProvider>
                    <CartProvider>
                        <Router>
                            <AppLayout />
                        </Router>
                    </CartProvider>
                </ProductProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
