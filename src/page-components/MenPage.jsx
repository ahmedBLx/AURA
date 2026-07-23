import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '../context/ProductContext';
import QuickViewModal from '../components/QuickViewModal';
import SocialMedia from '../components/SocialMedia';
import SubCategoryProductCarousel from '../components/SubCategoryProductCarousel';
import OptimizedImage from '../components/OptimizedImage';

const MenPage = () => {
    const { products, categories } = useProducts();
    const router = useRouter();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [favorites, setFavorites] = useState({});
    const [layout, setLayout] = useState('grid');
    const [isFilterTrayActive, setIsFilterTrayActive] = useState(false);
    const [isSearchOverlayActive, setIsSearchOverlayActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrices, setSelectedPrices] = useState({
        under200: false,
        over200: false
    });

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

    // Filter enabled subcategories for Men (memoized)
    const menSubCategories = useMemo(() => {
        return categories.filter(
            (c) => c.parentName === 'Men' && c.showOnHomepage === true
        );
    }, [categories]);

    // Filter products dynamically for Men's collection (memoized)
    const menProducts = useMemo(() => {
        return products.filter(
            (p) => (p.categories && p.categories.includes('Men')) || p.isMen === true
        );
    }, [products]);

    // Apply main filters (search query & price) (stable callback)
    const getFilteredSubProducts = useCallback((subProducts) => {
        return subProducts.filter((p) => {
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
    }, [searchQuery, selectedPrices]);

    // Fallback: If no subcategories are enabled, filter all products (memoized)
    const mainFilteredProducts = useMemo(() => {
        return getFilteredSubProducts(menProducts);
    }, [menProducts, getFilteredSubProducts]);

    return (
        <main style={{ minHeight: '85vh', padding: '60px 80px', position: 'relative' }}>
            {/* BREADCRUMB */}
            <div className="breadcrumb-container" style={{ maxWidth: '1440px', margin: '0 auto 20px auto', padding: '0 0 20px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="breadcrumb-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        type="button"
                        onClick={() => router.push('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginRight: '12px',
                            transition: 'color 0.2s',
                            padding: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gold)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back
                    </button>
                    <span className="breadcrumb-item" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>AURA</span>
                    <span className="breadcrumb-slash">/</span>
                    <span className="breadcrumb-item active">Men Collection</span>
                </div>
            </div>
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
                        {/* Filter toggle removed */}
                    </div>

                    <div className="discover-right">

                        {/* Search Icon Trigger */}
                        {/* Inline Expanding Search */}
                        <div className={`toolbar-search-wrapper ${isSearchOverlayActive ? 'expanded' : ''}`}>
                            <input 
                                type="text" 
                                id="search-input"
                                className="toolbar-search-input"
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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


            {/* Search query badge */}
            {searchQuery && (
                <div className="search-results-badge" style={{ marginBottom: '24px' }}>
                    <span>Search results for: <strong>"{searchQuery}"</strong></span>
                    <button onClick={() => setSearchQuery('')} className="clear-search-badge-btn" title="Clear search">&times;</button>
                </div>
            )}

            {/* CAROUSELS OR FALLBACK PRODUCT GRID */}
            <div className="men-collections-carousels-container">
                {menSubCategories.length === 0 ? (
                    // Fallback to simple grid if no subcategories are enabled
                    <div className={`product-grid ${layout === 'list' ? 'list-layout' : ''}`} id="men-product-grid">
                        {mainFilteredProducts.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
                                <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No matches found</p>
                                <p>No items match your active filters or search terms.</p>
                            </div>
                        ) : (
                            mainFilteredProducts.map((p) => {
                                const discountPercent = p.discountPercent || 0;
                                const hasDiscount = discountPercent > 0;
                                const salePrice = Math.round(p.price * (1 - discountPercent / 100));
                                return (
                                    <div className="product-card item-card" key={p.id} data-id={p.id} onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)} style={{ cursor: 'pointer' }}>
                                        <div className="card-image-box">
                                            {hasDiscount && (
                                                <span className="badge badge-special" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
                                                    {discountPercent}% OFF
                                                </span>
                                            )}
                                            <span className="badge badge-new">MEN</span>
                                            <OptimizedImage src={p.img} alt={p.name} className="product-img" aspectRatio="4/3" />
                                            {layout !== 'list' && (
                                                <div className="card-overlay-actions">
                                                    <button className="quick-view-btn" onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)}>Quick View</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-info-box">
                                            <div className="info-left">
                                                <h3 className="product-name">{p.name}</h3>
                                                {hasDiscount ? (
                                                     <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                                         <span className="product-price" style={{ color: '#EF4444', fontWeight: 'bold' }}>{salePrice} EGP</span>
                                                         <span style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.price} EGP</span>
                                                     </div>
                                                 ) : (
                                                     <span className="product-price">{p.price} EGP</span>
                                                 )}
                                            </div>
                                            <div className="info-right">
                                                {layout === 'list' && (
                                                    <button 
                                                        className="quick-view-btn" 
                                                        onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)}
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
                                                    <svg className="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                    <span className="favorite-text">Favorite</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    // Render individual carousels for each sub-category
                    menSubCategories.map((cat) => {
                        const subProducts = menProducts.filter(p => p.categories && p.categories.includes(cat.name));
                        const filteredSubProducts = getFilteredSubProducts(subProducts);
                        if (filteredSubProducts.length === 0) return null;
                        
                        return (
                            <SubCategoryProductCarousel
                                key={cat._id}
                                category={cat}
                                products={filteredSubProducts}
                                layout={layout}
                                favorites={favorites}
                                toggleFavorite={toggleFavorite}
                                handleQuickView={handleQuickView}
                                showFavoriteBtn={true}
                                badgeLabel="MEN"
                            />
                        );
                    })
                )}
            </div>

            {/* Quick View Details Modal */}
            <QuickViewModal 
                product={selectedProduct} 
                isOpen={isQuickViewOpen} 
                onClose={() => setIsQuickViewOpen(false)} 
            />

            <SocialMedia />
        </main>
    );
};

export default MenPage;
