import OptimizedImage from '../components/OptimizedImage';
import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import QuickViewModal from '../components/QuickViewModal';
import SocialMedia from '../components/SocialMedia';

const ShopPage = () => {
    const { products } = useProducts();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // UI States
    const [isFilterTrayActive, setIsFilterTrayActive] = useState(false);
    const [isSearchOverlayActive, setIsSearchOverlayActive] = useState(false);
    const [layout, setLayout] = useState('grid'); // 'grid' | 'list'
    const [favorites, setFavorites] = useState({}); // { [productId]: boolean }

    // Search and Filter states
    const [inlineQuery, setInlineQuery] = useState('');
    const [overlayQuery, setOverlayQuery] = useState('');
    const [selectedCollections, setSelectedCollections] = useState({
        nomad: false,
        eclipse: false,
        horizon: false,
        retro: false
    });
    const [selectedPrices, setSelectedPrices] = useState({
        under200: false,
        over200: false
    });

    // Quick View state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Auto-open Quick View on URL parameter "?view=id"
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId && products.length > 0) {
            const prod = products.find((p) => p.id === viewId);
            if (prod) {
                setSelectedProduct(prod);
                setIsQuickViewOpen(true);
            }
        }
    }, [searchParams, products]);

    // Category filter from URL parameter "?category=Name"
    const urlCategory = searchParams.get('category') || '';

    const handleOpenQuickView = (prod) => {
        setSelectedProduct(prod);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setSelectedProduct(null);
        // Clear URL search params
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('view');
        router.replace(pathname + '?' + newParams.toString(), { scroll: false });
    };

    // Toggle Favorite state
    const toggleFavorite = (e, prodId) => {
        e.stopPropagation();
        setFavorites((prev) => ({
            ...prev,
            [prodId]: !prev[prodId]
        }));
    };

    // Filter collection checkbox change
    const handleCollectionChange = (key) => {
        setSelectedCollections((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Filter price checkbox change
    const handlePriceChange = (key) => {
        setSelectedPrices((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Reset all storefront filters
    const resetFilters = () => {
        setInlineQuery('');
        setOverlayQuery('');
        setSelectedCollections({
            nomad: false,
            eclipse: false,
            horizon: false,
            retro: false
        });
        setSelectedPrices({
            under200: false,
            over200: false
        });
        setIsFilterTrayActive(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setIsSearchOverlayActive(false);
    };

    // Filtering logic
    const filteredProducts = products.filter((p) => {
        // Search filter matching
        const searchQuery = (inlineQuery || overlayQuery).toLowerCase().trim();
        if (searchQuery) {
            const nameMatch = p.name.toLowerCase().includes(searchQuery);
            const descMatch = p.desc ? p.desc.toLowerCase().includes(searchQuery) : false;
            if (!nameMatch && !descMatch) return false;
        }

        // Collection filter matching
        const activeCollections = Object.keys(selectedCollections).filter((key) => selectedCollections[key]);
        if (activeCollections.length > 0) {
            const matchesCollection = activeCollections.some((col) => 
                p.id.toLowerCase().includes(col) || p.name.toLowerCase().includes(col)
            );
            if (!matchesCollection) return false;
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

        // URL category filter
        if (urlCategory) {
            if (!p.categories || !p.categories.includes(urlCategory)) return false;
        }

        return true;
    });

    return (
        <main style={{ minHeight: '80vh' }}>

            {/* BREADCRUMB */}
            <div className="breadcrumb-container">
                <div className="breadcrumb-inner">
                    <span className="breadcrumb-item">AURA</span>
                    <span className="breadcrumb-slash">/</span>
                    <span className="breadcrumb-item active">Shop Collection</span>
                </div>
            </div>

            {/* DISCOVER CONTROLS SECTION */}
            <section className="discover-section">
                <div className="discover-container">
                    <div className="discover-left">
                        <h2 className="discover-title">Discover</h2>
                        
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

                        {/* Inline Expanding Search */}
                        <div className={`toolbar-search-wrapper ${isSearchOverlayActive ? 'expanded' : ''}`}>
                            <input 
                                type="text" 
                                id="search-input"
                                className="toolbar-search-input"
                                placeholder="Search..." 
                                value={overlayQuery}
                                onChange={(e) => setOverlayQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            />
                            <button 
                                className={`control-btn search-btn ${isSearchOverlayActive ? 'active' : ''}`} 
                                id="search-btn"
                                onClick={() => setIsSearchOverlayActive(!isSearchOverlayActive)}
                                aria-label="Toggle search input"
                            >
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* MULTI-CRITERIA FILTER TRAY */}
            <section 
                className={`filter-tray ${isFilterTrayActive ? 'active' : ''}`} 
                id="filter-tray" 
                style={{ 
                    display: isFilterTrayActive ? 'flex' : 'none', 
                    backgroundColor: 'rgba(10, 10, 10, 0.4)', 
                    backdropFilter: 'blur(16px)', 
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
            >
                {/* Collections Filter */}
                <div className="filter-group">
                    <span className="filter-group-title">Filter by Collection</span>
                    <div className="filter-checkboxes">
                        {['nomad', 'eclipse', 'horizon', 'retro'].map((col) => (
                            <label key={col} className="filter-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    value={col}
                                    checked={selectedCollections[col]}
                                    onChange={() => handleCollectionChange(col)}
                                />
                                <span className="filter-checkbox-custom"></span>
                                {col.charAt(0).toUpperCase() + col.slice(1)} Series
                            </label>
                        ))}
                    </div>
                </div>

                {/* Price Filter */}
                <div className="filter-group">
                    <span className="filter-group-title">Filter by Price</span>
                    <div className="filter-checkboxes">
                        <label className="filter-checkbox-label">
                            <input 
                                type="checkbox" 
                                value="under-200"
                                checked={selectedPrices.under200}
                                onChange={() => handlePriceChange('under200')}
                            />
                            <span className="filter-checkbox-custom"></span>
                            Under 200 EGP
                        </label>
                        <label className="filter-checkbox-label">
                            <input 
                                type="checkbox" 
                                value="over-200"
                                checked={selectedPrices.over200}
                                onChange={() => handlePriceChange('over200')}
                            />
                            <span className="filter-checkbox-custom"></span>
                            200 EGP & Above
                        </label>
                    </div>
                </div>

                {/* Inline Search */}
                <div className="filter-group search-filter-group">
                    <span className="filter-group-title">Active Search Query</span>
                    <div className="search-indicator-box">
                        <input 
                            type="text" 
                            id="inline-search"
                            placeholder="Type to filter..."
                            value={inlineQuery}
                            onChange={(e) => setInlineQuery(e.target.value)}
                            className="inline-search-input"
                        />
                    </div>
                </div>
            </section>

            {/* PRODUCT CATALOG GRID SECTION */}
            <section className="products-section">
                {(overlayQuery || inlineQuery) && (
                    <div className="search-results-badge">
                        <span>Search results for: <strong>"{overlayQuery || inlineQuery}"</strong></span>
                        <button 
                            onClick={() => { setOverlayQuery(''); setInlineQuery(''); }} 
                            className="clear-search-badge-btn"
                            title="Clear search"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <div className={`product-grid ${layout === 'list' ? 'list-layout' : ''}`} id="product-grid">
                    {filteredProducts.length === 0 ? (
                        <div className="catalog-no-results" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
                            <svg className="icon no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <h3>NO SNEAKERS FOUND</h3>
                            <p>No items match your active filters or search terms. Try modifying your selections.</p>
                        </div>
                    ) : (
                        filteredProducts.map((p) => (
                            <div className="product-card item-card" key={p.id} data-id={p.id} onClick={() => handleOpenQuickView(p)}>
                                <div className="card-image-box">
                                    <span className="badge badge-new">NEW</span>
                                    <OptimizedImage src={p.img} alt={p.name} className="product-img" aspectRatio="4/3" />
                                    <div className="card-overlay-actions">
                                        <button className="quick-view-btn" onClick={() => handleOpenQuickView(p)}>Quick View</button>
                                    </div>
                                </div>
                                <div className="card-info-box">
                                    <div className="info-left">
                                        <h3 className="product-name">{p.name}</h3>
                                        <span className="product-price">{p.price} EGP</span>
                                    </div>
                                    <div className="info-right">
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
            </section>

            {/* Quick View Details Modal */}
            <QuickViewModal 
                product={selectedProduct} 
                isOpen={isQuickViewOpen} 
                onClose={handleCloseQuickView} 
            />

            {/* Social Media floating panel */}
            <SocialMedia />
        </main>
    );
};

export default ShopPage;
