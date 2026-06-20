import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

const Header = () => {
    const { user } = useAuth();
    const { cartCount, setCartOpen } = useCart();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleAuthClick = () => {
        if (user) {
            navigate('/admin');
        } else {
            navigate('/login');
        }
    };

    const handleAboutClick = (e) => {
        e.preventDefault();
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/');
            setTimeout(() => {
                const sec = document.getElementById('about');
                if (sec) {
                    sec.scrollIntoView({ behavior: 'smooth' });
                }
            }, 150);
        }
    };

    const isAdmin = user && user.role === 'admin';

    return (
        <header className="main-header">
            <div className="header-container">
                {/* Left Side Content: Empty layout spacer */}
                {/* Left Side Content: Theme Toggle Button */}
                <div className="header-left">
                    <button 
                        className="icon-btn theme-toggle-btn"
                        id="theme-toggle-btn"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <svg className="icon theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg className="icon theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Center Brand Logo (Perfectly balanced) */}
                <Link to={isAdmin ? '/admin' : '/'} className="brand-logo" id="logo">
                    <svg className="brand-logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Shorter center-to-center distance to bring circles closer together */}
                        <circle cx="60" cy="39" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        <circle cx="60" cy="49" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        {/* Visually balanced and consistent letters spacing (A-U-R-A) */}
                        <path d="M 12 105 L 21 85 L 30 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 38 85 L 38 95 C 38 105 56 105 56 95 L 56 85" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 64 85 H 73 C 82 85 82 95 73 95 L 82 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 90 105 L 99 85 L 108 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="111" y="87" fill="#FFFFFF" fontSize="7.5" fontFamily="var(--font-heading)" fontWeight="bold" opacity="0.8">®</text>
                    </svg>
                </Link>

                {/* Right Side Actions: Simplified Account, Cart */}
                <div className="header-right">
                    {/* Simplified Account Icon */}
                    <button 
                        className={`icon-btn account-btn ${user ? 'logged-in' : ''}`} 
                        id="header-login-btn"
                        onClick={handleAuthClick}
                        aria-label="User Account"
                        title={user ? `Hi, ${user.name.split(' ')[0]}` : 'Account'}
                    >
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>

                    {/* Cart Button */}
                    {!isAdmin && (
                        <button 
                            className="icon-btn cart-btn" 
                            id="cart-btn"
                            onClick={() => setCartOpen(true)}
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
                </div>
            </div>

            {/* Navigation Centered Row Under Brand Logo */}
            {!isAdmin && (
                <div className="header-nav-row">
                    <nav className="desktop-nav-centered">
                        <Link to="/" className="nav-link nav-home-link" aria-label="Home" title="Home">
                            <svg className="icon home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </Link>
                        <Link to="/men" className="nav-link">Men</Link>
                        <Link to="/women" className="nav-link">Women</Link>
                        <Link to="/offers" className="nav-link">Offers</Link>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
