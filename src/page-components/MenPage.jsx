import OptimizedImage from '../components/OptimizedImage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import QuickViewModal from '../components/QuickViewModal';
import SocialMedia from '../components/SocialMedia';

// Sub-component for auto-scrolling product carousel per subcategory
const SubCategoryProductCarousel = ({ category, products, layout, favorites, toggleFavorite, handleQuickView }) => {
    const carouselRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [visibleRatio, setVisibleRatio] = useState(0.2);
    const resumeTimerRef = useRef(null);

    const totalSlides = products.length;

    const scrollToSlide = useCallback((index) => {
        if (!carouselRef.current || totalSlides === 0) return;
        const container = carouselRef.current;
        const card = container.querySelector('.product-card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 24; // width + gap
        container.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    }, [totalSlides]);

    // Auto-scroll every 3 seconds
    useEffect(() => {
        if (totalSlides <= 1 || isPaused) return;

        const timer = setInterval(() => {
            setCurrentSlide((prevSlide) => {
                const nextSlide = (prevSlide + 1) % totalSlides;
                scrollToSlide(nextSlide);
                return nextSlide;
            });
        }, 3000);

        return () => clearInterval(timer);
    }, [totalSlides, isPaused, scrollToSlide]);

    const handleScrollStart = useCallback(() => {
        setIsPaused(true);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    }, []);

    const handleScrollEnd = useCallback(() => {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 5000);
    }, []);

    const handleScroll = (e) => {
        const container = e.currentTarget;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
            setScrollProgress(container.scrollLeft / maxScroll);
            setVisibleRatio(container.clientWidth / container.scrollWidth);
        }
        
        const card = container.querySelector('.product-card');
        if (card) {
            const cardWidth = card.offsetWidth + 24;
            const newIndex = Math.round(container.scrollLeft / cardWidth);
            setCurrentSlide(newIndex);
        }
    };

    useEffect(() => {
        if (carouselRef.current) {
            const container = carouselRef.current;
            if (container.scrollWidth > 0) {
                setVisibleRatio(container.clientWidth / container.scrollWidth);
            }
        }
    }, [products]);

    const handleNext = () => {
        const next = (currentSlide + 1) % totalSlides;
        scrollToSlide(next);
        setCurrentSlide(next);
        setIsPaused(true);
        handleScrollEnd();
    };

    const handlePrev = () => {
        const prev = (currentSlide - 1 + totalSlides) % totalSlides;
        scrollToSlide(prev);
        setCurrentSlide(prev);
        setIsPaused(true);
        handleScrollEnd();
    };

    // Drag-to-scroll and mouse wheel horizontal scroll bindings
    useEffect(() => {
        const container = carouselRef.current;
        if (!container || layout === 'list') return;

        let isDown = false;
        let startX;
        let scrollLeftVal;

        const onMouseDown = (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeftVal = container.scrollLeft;
            handleScrollStart();
        };

        const onMouseLeave = () => {
            if (!isDown) return;
            isDown = false;
            container.classList.remove('active-dragging');
            handleScrollEnd();
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            container.classList.remove('active-dragging');
            handleScrollEnd();
        };

        const onMouseMove = (e) => {
            if (!isDown) return;
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            if (Math.abs(x - startX) > 5) {
                container.classList.add('active-dragging');
            }
            e.preventDefault();
            container.scrollLeft = scrollLeftVal - walk;
        };

        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mouseleave', onMouseLeave);
        container.addEventListener('mouseup', onMouseUp);
        container.addEventListener('mousemove', onMouseMove);

        return () => {
            container.removeEventListener('mousedown', onMouseDown);
            container.removeEventListener('mouseleave', onMouseLeave);
            container.removeEventListener('mouseup', onMouseUp);
            container.removeEventListener('mousemove', onMouseMove);
        };
    }, [layout, products, handleScrollStart, handleScrollEnd]);

    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    return (
        <section className="category-carousel-section" style={{ padding: '20px 0' }}>
            <div className="category-carousel-header" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '40px 0 20px 0',
                width: '100%',
                position: 'relative'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: '20px'
                }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 className="category-carousel-title glowing-category-title" style={{
                            fontSize: '20px',
                            textTransform: 'uppercase',
                            color: 'var(--color-gold)',
                            margin: 0,
                            letterSpacing: '0.1em',
                            whiteSpace: 'nowrap'
                        }}>
                            {category.name}
                        </h3>
                    </div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                </div>
            </div>

            <div className="category-frame-container">
                <style>{`
                .category-carousel-track::-webkit-scrollbar {
                    display: none;
                }
                .category-carousel-wrapper:hover .carousel-nav-btn {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .carousel-nav-btn {
                    opacity: 0;
                    pointer-events: none;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    width: 46px;
                    height: 46px;
                    border-radius: 50%;
                    background: rgba(10, 10, 10, 0.75) !important;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.12) !important;
                    color: var(--color-gold) !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                }
                .carousel-nav-btn:hover {
                    background-color: var(--color-gold) !important;
                    color: #000000 !important;
                    transform: translateY(-50%) scale(1.1) !important;
                    box-shadow: 0 0 20px rgba(197, 168, 128, 0.6) !important;
                }
                .carousel-nav-btn:active {
                    transform: translateY(-50%) scale(0.95) !important;
                }
                .badge-special {
                    background: linear-gradient(135deg, #EF4444, #B91C1C) !important;
                    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
                    border-radius: 6px !important;
                    padding: 3px 8px !important;
                    letter-spacing: 0.02em;
                }
                .quick-view-btn {
                    background: rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    color: #FFFFFF !important;
                    border-radius: 20px !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.05em;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .quick-view-btn:hover {
                    background: var(--color-gold) !important;
                    border-color: var(--color-gold) !important;
                    color: #000000 !important;
                    transform: scale(1.04) !important;
                    box-shadow: 0 6px 16px rgba(197, 168, 128, 0.35) !important;
                }
                .favorite-action-btn svg {
                    transition: all 0.3s ease;
                }
                .favorite-action-btn:hover svg {
                    color: #EF4444 !important;
                    fill: rgba(239, 68, 68, 0.15);
                    transform: scale(1.15);
                }
                .favorite-action-btn.liked svg {
                    color: #EF4444 !important;
                    fill: #EF4444 !important;
                }
                @media (max-width: 1024px) {
                    .carousel-nav-btn {
                        opacity: 0.8 !important;
                        pointer-events: auto !important;
                        width: 38px !important;
                        height: 38px !important;
                    }
                }
            `}</style>

            <div className="category-carousel-wrapper" style={{ maxWidth: '100%', position: 'relative' }}>
                {/* Navigation Buttons */}
                {totalSlides > 1 && layout !== 'list' && (
                    <>
                        <button onClick={handlePrev} className="carousel-nav-btn prev" style={{ left: '10px' }} aria-label="Previous Slide">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button onClick={handleNext} className="carousel-nav-btn next" style={{ right: '10px' }} aria-label="Next Slide">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </>
                )}

                <div
                    className={`category-carousel-track ${layout === 'list' ? 'list-layout' : ''}`}
                    ref={carouselRef}
                    onTouchStart={handleScrollStart}
                    onTouchEnd={handleScrollEnd}
                    onMouseDown={handleScrollStart}
                    onScroll={handleScroll}
                    style={{
                        gap: '24px',
                        padding: '24px 12px',
                        scrollSnapType: layout === 'list' ? 'none' : 'x mandatory',
                        display: 'flex',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {products.map((p) => {
                        const discountPercent = p.discountPercent || 0;
                        const hasDiscount = discountPercent > 0;
                        const salePrice = Math.round(p.price * (1 - discountPercent / 100));

                        return (
                            <div
                                className="product-card item-card"
                                key={p.id}
                                onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)}
                                style={{
                                    flex: layout === 'list' ? '1 1 100%' : '0 0 280px',
                                    scrollSnapAlign: 'start',
                                    margin: 0,
                                    backgroundColor: 'var(--color-card-dark)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '20px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div className="card-image-box" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                    {hasDiscount && (
                                        <span className="badge badge-special" style={{ backgroundColor: '#EF4444', color: '#FFFFFF', position: 'absolute', top: '12px', left: '12px', zIndex: 2, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                            {discountPercent}% OFF
                                        </span>
                                    )}
                                    <OptimizedImage src={p.img} alt={p.name} className="product-img" aspectRatio="4/3" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', transition: 'transform 0.4s ease' }} />
                                    {layout !== 'list' && (
                                        <div className="card-overlay-actions">
                                            <button className="quick-view-btn" onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)}>Quick View</button>
                                        </div>
                                    )}
                                </div>
                                <div className="card-info-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div className="info-left">
                                        <h3 className="product-name" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px', margin: 0 }}>{p.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            {hasDiscount ? (
                                                <>
                                                    <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '11px' }}>{p.price} EGP</span>
                                                    <span className="product-price" style={{ color: 'var(--color-gold)', fontWeight: '700', fontSize: '13px' }}>{salePrice} EGP</span>
                                                </>
                                            ) : (
                                                <span className="product-price" style={{ fontSize: '13px' }}>{p.price} EGP</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="info-right" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        {layout === 'list' && (
                                            <button 
                                                className="quick-view-btn" 
                                                onClick={() => handleQuickView(p, hasDiscount ? salePrice : p.price)}
                                                style={{ padding: '8px 18px', fontSize: '12px' }}
                                            >
                                                Quick View
                                            </button>
                                        )}
                                        <button 
                                            className={`favorite-action-btn ${favorites[p.id] ? 'liked' : ''}`} 
                                            onClick={(e) => toggleFavorite(e, p.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                            aria-label="Add to Favorites"
                                        >
                                            <svg className="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '18px', height: '18px' }}>
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sleek horizontal scroll progress indicator */}
                {totalSlides > 1 && layout !== 'list' && (
                    <div className="carousel-progress-container" style={{
                        marginTop: '25px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <div className="carousel-progress-track" style={{
                            width: '140px',
                            height: '2px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '2px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div className="carousel-progress-thumb" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${Math.max(15, Math.min(100, visibleRatio * 100))}%`,
                                transform: `translateX(${scrollProgress * (140 - 140 * visibleRatio)}px)`,
                                backgroundColor: 'var(--color-gold)',
                                borderRadius: '2px',
                                transition: 'transform 0.1s ease-out, width 0.3s ease-out',
                                boxShadow: '0 0 8px var(--color-gold)'
                            }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </section>
    );
};

const MenPage = () => {
    const { products, categories } = useProducts();
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setIsSearchOverlayActive(false);
    };

    // Filter enabled subcategories for Men
    const menSubCategories = categories.filter(
        (c) => c.parentName === 'Men' && c.showOnHomepage === true
    );

    // Filter products dynamically for Men's collection
    const menProducts = products.filter(
        (p) => (p.categories && p.categories.includes('Men')) || p.isMen === true
    );

    // Apply main filters (search query & price)
    const getFilteredSubProducts = (subProducts) => {
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
    };

    // Fallback: If no subcategories are enabled, filter all products
    const mainFilteredProducts = getFilteredSubProducts(menProducts);

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
                                                <span className="product-price">{hasDiscount ? salePrice : p.price} EGP</span>
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
