import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import QuickViewModal from '../components/QuickViewModal';
import LiveChat from '../components/LiveChat';

const MenPage = ({ onOpenAuth }) => {
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
    
    // Filter products dynamically for Men's collection
    const menProducts = products.filter(
        (p) => (p.categories && p.categories.includes('Men')) || p.isMen === true
    );

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
        return menProducts.filter((p) => {
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

    return (
        <main style={{ minHeight: '85vh', padding: '60px 80px', position: 'relative' }}>
            <style>{`
                .men-header {
                    max-width: 1440px;
                    margin: 0 auto 36px auto;
                    text-align: center;
                }
                .men-subtitle {
                    font-family: var(--font-heading);
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: 0.2em;
                    color: var(--color-gold);
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 8px;
                }
                .men-title {
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

            <div className="men-header">
                <span className="men-subtitle">PERFORMANCE & STYLE</span>
                <h1 className="men-title">MEN COLLECTION</h1>
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
                                placeholder="Search Men sneakers..." 
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
            <div className={`product-grid ${layout === 'list' ? 'list-layout' : ''}`} id="men-product-grid">
                {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No matches found</p>
                        <p>No items match your active filters or search terms. Try modifying your selections.</p>
                    </div>
                ) : (
                    filteredProducts.map((p) => (
                    <div className="product-card item-card" key={p.id} data-id={p.id}>
                        <div className="card-image-box">
                            <span className="badge badge-new">MEN</span>
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
                )))}
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
};

export default MenPage;
