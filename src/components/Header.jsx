import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

const Header = ({ onOpenAuth }) => {
    const { user } = useAuth();
    const { cartCount, setCartOpen } = useCart();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleAuthClick = () => {
        if (user) {
            navigate('/admin');
        } else {
            onOpenAuth();
        }
        setMobileMenuOpen(false);
    };

    const isAdmin = user && user.role === 'admin';

    return (
        <header className="main-header">
            <div className="header-container">
                {/* Brand Logo */}
                <Link to={isAdmin ? '/admin' : '/'} className="brand-logo" id="logo" onClick={() => setMobileMenuOpen(false)}>
                    <svg className="brand-logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="28" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        <circle cx="60" cy="52" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        <path d="M 12 105 L 22 85 L 32 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 40 85 L 40 95 C 40 105 60 105 60 95 L 60 85" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 68 105 L 68 85 H 74 C 81 85 81 95 74 95 H 68 M 74 95 L 80 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 96 105 L 106 85 L 116 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="117" y="88" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif" fontWeight="bold">®</text>
                    </svg>
                </Link>

                {/* Hamburger Menu Toggle */}
                <button 
                    className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>

                {/* Center Navigation (Desktop) */}
                <nav className="center-nav">
                    <Link to={isAdmin ? '/admin' : '/'} className="nav-link">Home</Link>
                    <span className="nav-separator">|</span>
                    <Link to="/men" className="nav-link">Men</Link>
                    <span className="nav-separator">|</span>
                    <Link to="/women" className="nav-link">Women</Link>
                    <span className="nav-separator">|</span>
                    <Link to="/offers" className="nav-link">Offers</Link>
                </nav>

                {/* Right Side Actions */}
                <div className="header-actions">
                    {/* Cart Button (Visible only to customers/guests, not admin) */}
                    {!isAdmin && (
                        <button 
                            className="icon-btn cart-btn" 
                            id="cart-btn"
                            onClick={() => {
                                setCartOpen(true);
                                setMobileMenuOpen(false);
                            }}
                            aria-label="Open Cart Bag"
                        >
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span className="cart-badge">{cartCount}</span>
                        </button>
                    )}

                    {/* Login / Logout / Dashboard Button */}
                    <button 
                        className={`login-btn ${user ? 'logged-in' : ''}`} 
                        id="header-login-btn"
                        onClick={handleAuthClick}
                    >
                        <svg className="icon user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{user ? `Hi, ${user.name.split(' ')[0]}` : 'Login'}</span>
                    </button>
                    <a href="#about" onClick={(e) => e.preventDefault()} className="about-link">ABOUT</a>
                </div>
            </div>

            {/* Mobile Nav Drawer */}
            <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
                <nav className="mobile-nav-links">
                    <Link to={isAdmin ? '/admin' : '/'} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link to="/men" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Men</Link>
                    <Link to="/women" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Women</Link>
                    <Link to="/offers" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Offers</Link>
                    <div className="mobile-nav-divider"></div>
                    <a href="#about" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }} className="mobile-nav-link">About Us</a>
                </nav>
            </div>
            {mobileMenuOpen && (
                <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
            )}
        </header>
    );
};

export default Header;

