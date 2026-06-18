import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { useNavigate } from 'react-router-dom';
import LiveChat from '../components/LiveChat';

const LandingPage = ({ onOpenAuth }) => {
    const { user } = useAuth();
    const { products } = useProducts();
    const navigate = useNavigate();

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Filter by Special Collection category (no fallback to random products)
    const specials = products.filter(p => p.categories && p.categories.includes('Special Collection'));

    const handleHeroCta = () => {
        setIsCategoryModalOpen(prev => !prev);
    };

    const handleSpecialClick = (prodId) => {
        navigate(`/shop?view=${prodId}`);
    };

    return (
        <main style={{ minHeight: '80vh' }}>
            {/* HERO SECTION */}
            <section className="hero-section" style={{ backgroundImage: "url('/assets/hero_banner_new.png')" }}>
                <div className="hero-iridescent-overlay">
                    <svg className="iridescent-svg" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="irid-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
                                <stop offset="50%" stopColor="rgba(240, 0, 255, 0.2)" />
                                <stop offset="100%" stopColor="rgba(255, 255, 0, 0.05)" />
                            </linearGradient>
                            <linearGradient id="irid-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
                                <stop offset="40%" stopColor="rgba(0, 255, 120, 0.25)" />
                                <stop offset="100%" stopColor="rgba(0, 100, 255, 0)" />
                            </linearGradient>
                        </defs>
                        <path d="M-100 150 L300 -50 L400 120 L200 400 L-150 350 Z" fill="url(#irid-grad-1)" opacity="0.7" style={{ mixBlendMode: 'color-dodge' }} />
                        <path d="M50 -100 L450 80 L350 280 L-50 150 Z" fill="url(#irid-grad-2)" opacity="0.6" style={{ mixBlendMode: 'overlay' }} />
                    </svg>
                </div>

                <div className="hero-red-dot"></div>

                <div className="hero-content">
                    <span className="hero-brand-tagline">AURA</span>
                    <h1 className="hero-heading">Discover Your Perfect Pair</h1>
                    <p className="hero-subtitle">Step into comfort, style, and innovation.</p>
                    <div className="hero-ctas">
                        <div className="shop-now-dropdown-container">
                            <button className="hero-btn shop-btn" onClick={handleHeroCta} id="hero-shop-trigger">
                                Shop Now
                            </button>
                            
                            {isCategoryModalOpen && (
                                <>
                                    <div className="dropdown-backdrop" onClick={() => setIsCategoryModalOpen(false)}></div>
                                    <div className="shop-now-dropdown">
                                        <button className="dropdown-item" onClick={() => { navigate('/men'); setIsCategoryModalOpen(false); }}>
                                            <span className="dropdown-item-text">Men Collection</span>
                                            <svg className="dropdown-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                        <button className="dropdown-item" onClick={() => { navigate('/women'); setIsCategoryModalOpen(false); }}>
                                            <span className="dropdown-item-text">Women Collection</span>
                                            <svg className="dropdown-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                        <button className="dropdown-item" onClick={() => { navigate('/offers'); setIsCategoryModalOpen(false); }}>
                                            <span className="dropdown-item-text">Special Offers</span>
                                            <svg className="dropdown-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item explore" onClick={() => { navigate('/shop'); setIsCategoryModalOpen(false); }}>
                                            <span className="dropdown-item-text">Explore Catalog</span>
                                            <svg className="dropdown-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* SPECIALS SHOWCASE SECTION */}
            {specials.length > 0 && (
                <section className="specials-section" id="specials-section">
                    <div className="specials-wrapper">
                        <div className="specials-side-title">
                            <span>EXCLUSIVES</span>
                        </div>
                        
                        <div className="specials-content">
                            <div className="specials-header">
                                <span className="specials-subtitle">Curated Drops</span>
                                <h2 className="specials-title">AURA Specials</h2>
                            </div>
                            
                            <div className="specials-grid" id="specials-grid">
                                {specials.map((p) => (
                                    <div 
                                        className="product-card item-card specials-card" 
                                        data-id={p.id} 
                                        key={p.id}
                                        onClick={() => handleSpecialClick(p.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-image-box">
                                            <span className="badge badge-special" style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-primary)' }}>SPECIAL</span>
                                            <img src={p.img} alt={p.name} className="product-img" />
                                            <div className="card-overlay-actions">
                                                <button className="quick-view-btn specials-action-btn">View Special</button>
                                            </div>
                                        </div>
                                        <div className="card-info-box">
                                            <div className="info-left">
                                                <h3 className="product-name">{p.name}</h3>
                                                <span className="product-price">{p.price} EGP</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}





            {/* Live Chat Component */}
            <LiveChat />
        </main>
    );
};

export default LandingPage;
