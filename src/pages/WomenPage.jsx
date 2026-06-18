import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import QuickViewModal from '../components/QuickViewModal';
import LiveChat from '../components/LiveChat';

const WomenPage = ({ onOpenAuth }) => {
    const { products } = useProducts();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [favorites, setFavorites] = useState({});
    const [layout, setLayout] = useState('grid'); // 'grid' | 'list'
    const [isFilterTrayActive, setIsFilterTrayActive] = useState(false);
    const [isSearchOverlayActive, setIsSearchOverlayActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrices, setSelectedPrices] = useState({
        under200: false,
        over200: false
    });

    // Settings Coming Soon state
    const [womenSoon, setWomenSoon] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Coming soon states (fallback when collection is empty)
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Filter products dynamically for Women's collection
    const womenProducts = products.filter((p) => (p.categories && p.categories.includes('Women')) || p.isWomen === true);

    const handlePriceChange = (key) => {
        setSelectedPrices((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedPrices({
            under200: false,
            over200: false
        });
        setIsFilterTrayActive(false);
    };

    const getFilteredProducts = () => {
        return womenProducts.filter((p) => {
            // Search filter matching
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query));
                if (!matchesSearch) return false;
            }

            // Price filter matching
            const activePrices = Object.keys(selectedPrices).filter((key) => selectedPrices[key]);
            if (activePrices.length > 0) {
                const matchesPrice = activePrices.some((range) => {
                    const priceVal = p.price * (1 - (p.discountPercent || 0) / 100);
                    if (range === 'under200') return priceVal < 200;
                    if (range === 'over200') return priceVal >= 200;
                    return true;
                });
                if (!matchesPrice) return false;
            }

            return true;
        });
    };

    const filteredProducts = getFilteredProducts();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('http://localhost:5002/api/v1/settings/public');
                if (res.ok) {
                    const result = await res.json();
                    const settings = result.data.settings;
                    const womenSoonSetting = settings.find(s => s.key === 'women_soon');
                    if (womenSoonSetting) {
                        setWomenSoon(womenSoonSetting.value === true || womenSoonSetting.value === 'true');
                    }
                }
            } catch (err) {
                console.error('Failed to load settings in WomenPage:', err);
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    const handleQuickView = (p) => {
        setSelectedProduct(p);
        setIsQuickViewOpen(true);
    };

    const toggleFavorite = (e, prodId) => {
        e.stopPropagation();
        setFavorites((prev) => ({
            ...prev,
            [prodId]: !prev[prodId]
        }));
    };

    const handleNotifySubmit = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
            setEmail('');
        }
    };

    // Spinner loading indicator
    if (loadingSettings) {
        return (
            <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(197, 168, 128, 0.1)', borderTop: '3px solid var(--color-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // If women_soon is disabled, display the catalog grid
    if (!womenSoon) {
        return (
            <main style={{ minHeight: '85vh', padding: '60px 80px', position: 'relative' }}>
                <style>{`
                    .women-header {
                        max-width: 1440px;
                        margin: 0 auto 36px auto;
                        text-align: center;
                    }
                    .women-subtitle {
                        font-family: var(--font-heading);
                        font-size: 13px;
                        font-weight: 600;
                        letter-spacing: 0.2em;
                        color: var(--color-gold);
                        text-transform: uppercase;
                        display: block;
                        margin-bottom: 8px;
                    }
                    .women-title {
                        font-family: var(--font-heading);
                        font-size: 36px;
                        font-weight: 500;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                    }
                    
                    @media (max-width: 1024px) {
                        main {
                            padding: 40px 20px !important;
                        }
                    }
                `}</style>

                <div className="women-header">
                    <span className="women-subtitle">PERFORMANCE & ELEGANCE</span>
                    <h1 className="women-title">WOMEN COLLECTION</h1>
                </div>

                {/* DISCOVER CONTROLS SECTION */}
                <section className="discover-section">
                    <div className="discover-container">
                        <div className="discover-left">
                            {/* Toggle Filter Button */}
                            <div className="toggle-container">
                                <button 
                                    className={`toggle-switch ${isFilterTrayActive ? 'active' : ''}`}
                                    id="filter-toggle"
                                    onClick={() => {
                                        setIsFilterTrayActive(!isFilterTrayActive);
                                        if (isFilterTrayActive) resetFilters();
                                    }}
                                    aria-label="Toggle Filters Tray"
                                >
                                    <span className="toggle-knob"></span>
                                </button>
                                <span className="filter-count" id="filter-count">
                                    FILTER ({filteredProducts.length} products)
                                </span>
                            </div>
                        </div>

                        <div className="discover-right">
                            {/* View control layout selectors */}
                            <div className="view-controls">
                                <button 
                                    className={`control-btn ${layout === 'grid' ? 'active' : ''}`}
                                    onClick={() => setLayout('grid')}
                                    aria-label="Grid Layout"
                                >
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                </button>
                                <button 
                                    className={`control-btn ${layout === 'list' ? 'active' : ''}`}
                                    onClick={() => setLayout('list')}
                                    aria-label="List Layout"
                                >
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Search Icon Trigger */}
                            <button 
                                className="control-btn search-btn" 
                                id="search-btn"
                                onClick={() => setIsSearchOverlayActive(true)}
                                aria-label="Open search overlay"
                            >
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </section>

                {/* MULTI-CRITERIA FILTER TRAY */}
                <div 
                    className={`filter-tray ${isFilterTrayActive ? 'active' : ''}`} 
                    id="filter-tray" 
                    style={{ 
                        display: isFilterTrayActive ? 'flex' : 'none', 
                        justifyContent: 'center', 
                        gap: '40px', 
                        padding: '24px 80px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        backdropFilter: 'blur(16px)', 
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    {/* Price Filter */}
                    <div className="filter-group">
                        <span className="filter-group-title">Filter by Price</span>
                        <div className="filter-checkboxes">
                            <label className="filter-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPrices.under200} 
                                    onChange={() => handlePriceChange('under200')} 
                                />
                                <span className="filter-checkbox-custom"></span>
                                Under 200 EGP
                            </label>
                            <label className="filter-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPrices.over200} 
                                    onChange={() => handlePriceChange('over200')} 
                                />
                                <span className="filter-checkbox-custom"></span>
                                200 EGP & Above
                            </label>
                        </div>
                    </div>

                    {/* Search query display if active */}
                    <div className="filter-group search-filter-group">
                        <span className="filter-group-title">Active Search Query</span>
                        <input 
                            type="text" 
                            className="inline-search-input" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type to filter..."
                        />
                    </div>
                </div>

                {/* FULL-SCREEN SEARCH OVERLAY */}
                {isSearchOverlayActive && (
                    <div className="search-overlay active" id="search-overlay">
                        <div className="search-overlay-backdrop" onClick={() => setIsSearchOverlayActive(false)}></div>
                        <div className="search-box-container">
                            <div className="search-bar-wrapper">
                                <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input 
                                    type="text" 
                                    className="search-bar-input" 
                                    id="search-input"
                                    placeholder="Search Women sneakers..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button className="close-search-btn" onClick={() => { setIsSearchOverlayActive(false); setSearchQuery(''); }} aria-label="Close search">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCT CATALOG GRID */}
                <div className={`product-grid ${layout === 'list' ? 'list-layout' : ''}`} id="women-product-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No matches found</p>
                            <p>No items match your active filters or search terms. Try modifying your selections.</p>
                        </div>
                    ) : (
                        filteredProducts.map((p) => (
                            <div className="product-card item-card" key={p.id} data-id={p.id}>
                                <div className="card-image-box">
                                    <span className="badge badge-new" style={{ backgroundColor: 'rgba(255, 94, 151, 0.15)', color: '#FF5E97', border: '1px solid rgba(255, 94, 151, 0.2)' }}>WOMEN</span>
                                    <img src={p.img} alt={p.name} className="product-img" />
                                    {layout !== 'list' && (
                                        <div className="card-overlay-actions">
                                            <button className="quick-view-btn" onClick={() => handleQuickView(p)}>Quick View</button>
                                        </div>
                                    )}
                                </div>
                                <div className="card-info-box">
                                    <div className="info-left">
                                        <h3 className="product-name">{p.name}</h3>
                                        <span className="product-price">{p.price} EGP</span>
                                    </div>
                                    <div className="info-right">
                                        {layout === 'list' && (
                                            <button 
                                                className="quick-view-btn" 
                                                onClick={() => handleQuickView(p)}
                                                style={{ marginRight: '16px', padding: '8px 18px', fontSize: '12px' }}
                                            >
                                                Quick View
                                            </button>
                                        )}
                                        <button 
                                            className={`favorite-action-btn ${favorites[p.id] ? 'liked' : ''}`} 
                                            onClick={(e) => toggleFavorite(e, p.id)}
                                            aria-label="Add to Favorites"
                                        >
                                            <svg className="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: favorites[p.id] ? 'scale(1.2)' : 'none' }}>
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                            </svg>
                                            <span className="favorite-text">Favorite</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick View Details Modal */}
                <QuickViewModal 
                    product={selectedProduct} 
                    isOpen={isQuickViewOpen} 
                    onClose={() => setIsQuickViewOpen(false)} 
                />

                <LiveChat />
            </main>
        );
    }

    // Fallback: Coming Soon Newsletter state when collection is empty
    return (
        <main className="women-page-container" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
            <style>{`
                .soon-card {
                    --border-color: rgba(255, 255, 255, 0.08);
                    --input-bg: rgba(255, 255, 255, 0.03);
                    --input-border: rgba(255, 255, 255, 0.1);
                    --input-bg-focus: rgba(255, 255, 255, 0.06);
                    --text-color: #FFFFFF;
                    --placeholder-color: rgba(255, 255, 255, 0.4);
                    background-color: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 60px 40px;
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
                    position: relative;
                    color: var(--text-color);
                }
                .soon-card::before {
                    content: '';
                    position: absolute;
                    top: -1.5px;
                    left: -1.5px;
                    right: -1.5px;
                    bottom: -1.5px;
                    background: linear-gradient(90deg, #00D2FF, #A044FF, #FF5E97, #00D2FF);
                    background-size: 300% 100%;
                    border-radius: var(--border-radius-lg);
                    z-index: -1;
                    animation: borderGlow 6s linear infinite;
                    opacity: 0.25;
                }
                .category-title {
                    font-family: var(--font-heading);
                    font-size: 14px;
                    letter-spacing: 0.3em;
                    color: var(--color-gold);
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                .main-title {
                    font-family: var(--font-heading);
                    font-size: 42px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-bottom: 24px;
                }
                .soon-glow-box {
                    position: relative;
                    margin: 40px auto;
                    width: 180px;
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .soon-pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid rgba(197, 168, 128, 0.3);
                    animation: radarPulse 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                .soon-pulse-ring-2 {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 94, 151, 0.2);
                    animation: radarPulse 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                    animation-delay: 1.5s;
                }
                .soon-text-circle {
                    width: 130px;
                    height: 130px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
                }
                .soon-label {
                    font-family: var(--font-heading);
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    background: linear-gradient(90deg, #00D2FF, #A044FF, #FF5E97, #00D2FF);
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: borderGlow 6s linear infinite;
                }
                .soon-desc {
                    font-size: 14px;
                    color: var(--color-text-muted);
                    line-height: 1.6;
                    max-width: 420px;
                    margin: 0 auto 32px auto;
                }
                .notify-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .notify-input-group {
                    display: flex;
                    border: 1px solid var(--input-border);
                    background-color: var(--input-bg);
                    border-radius: var(--border-radius-pill);
                    padding: 4px 6px;
                    transition: var(--transition-smooth);
                }
                .notify-input-group:focus-within {
                    border-color: var(--color-gold);
                    background-color: var(--input-bg-focus);
                }
                .notify-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--text-color);
                    padding: 10px 18px;
                    font-family: var(--font-body);
                    font-size: 13px;
                }
                .notify-input::placeholder {
                    color: var(--placeholder-color);
                }
                .notify-btn {
                    padding: 10px 24px;
                    border: none;
                    background-color: var(--color-gold);
                    color: var(--color-primary);
                    font-family: var(--font-heading);
                    font-weight: 600;
                    font-size: 12px;
                    letter-spacing: 0.05em;
                    border-radius: var(--border-radius-pill);
                    cursor: pointer;
                    transition: var(--transition-smooth);
                }
                .notify-btn:hover {
                    background-color: #FFFFFF;
                    color: var(--color-primary);
                }
                .success-msg {
                    font-size: 14px;
                    color: var(--color-gold);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background-color: rgba(197, 168, 128, 0.1);
                    border: 1px solid rgba(197, 168, 128, 0.2);
                    padding: 12px 20px;
                    border-radius: var(--border-radius-pill);
                    animation: fadeIn 0.4s ease-out;
                }
                
                @keyframes radarPulse {
                    0% {
                        transform: scale(0.7);
                        opacity: 0;
                    }
                    50% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.3);
                        opacity: 0;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                html.light-theme .soon-card {
                    --border-color: rgba(0, 0, 0, 0.08) !important;
                    --input-bg: rgba(0, 0, 0, 0.03) !important;
                    --input-border: rgba(0, 0, 0, 0.1) !important;
                    --input-bg-focus: rgba(0, 0, 0, 0.05) !important;
                    --text-color: #111827 !important;
                    --placeholder-color: rgba(0, 0, 0, 0.4) !important;
                    background-color: rgba(255, 255, 255, 0.95) !important;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08) !important;
                }
                html.light-theme .soon-text-circle {
                    background: rgba(0, 0, 0, 0.02) !important;
                    border: 1px solid rgba(0, 0, 0, 0.08) !important;
                }
                html.light-theme .soon-desc {
                    color: var(--color-text-muted) !important;
                }
            `}</style>

            <div className="soon-card">
                <span className="category-title">AURA FOOTWEAR</span>
                <h1 className="main-title">WOMEN COLLECTION</h1>
                
                <div className="soon-glow-box">
                    <div className="soon-pulse-ring"></div>
                    <div className="soon-pulse-ring-2"></div>
                    <div className="soon-text-circle">
                        <span className="soon-label">SOON</span>
                    </div>
                </div>

                <p className="soon-desc">
                    We are currently crafting a premium, limited-run collection of sneakers engineered specifically for women. Join our insider list to be notified the second we drop.
                </p>

                {!submitted ? (
                    <form className="notify-form" onSubmit={handleNotifySubmit}>
                        <div className="notify-input-group">
                            <input 
                                type="email" 
                                className="notify-input" 
                                placeholder="ENTER YOUR EMAIL FOR EARLY ACCESS" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button type="submit" className="notify-btn">NOTIFY ME</button>
                        </div>
                    </form>
                ) : (
                    <div className="success-msg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        YOU ARE ON THE INSIDER LIST
                    </div>
                )}
            </div>

            <LiveChat />
        </main>
    );
};

export default WomenPage;
