import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { useNavigate } from 'react-router-dom';
import SocialMedia from '../components/SocialMedia';
import QuickViewModal from '../components/QuickViewModal';

// Sub-component for auto-scrolling product carousel per subcategory
const SubCategoryProductCarousel = ({ category, products, navigate, handleQuickView }) => {
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
        if (!container) return;

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
    }, [products, handleScrollStart, handleScrollEnd]);

    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    return (
        <section className="category-carousel-section" style={{ padding: '20px 0' }}>
            <div className="category-carousel-header">
                <div className="category-carousel-title-row">
                    <div className="category-carousel-line"></div>
                    <div className="category-title-wrapper">
                        <h2 className="category-carousel-title glowing-category-title">
                            {category.name}
                        </h2>
                        <span className="category-carousel-eyebrow">
                            {category.parentName || 'COLLECTION'}
                        </span>
                    </div>
                    <div className="category-carousel-line"></div>
                </div>
                
                <button 
                    onClick={() => navigate(`/shop?category=${encodeURIComponent(category.name)}`)}
                    className="view-all-btn view-all-hover-effect"
                >
                    View All 
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
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
                {totalSlides > 1 && (
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
                    className="category-carousel-track"
                    ref={carouselRef}
                    onTouchStart={handleScrollStart}
                    onTouchEnd={handleScrollEnd}
                    onMouseDown={handleScrollStart}
                    onScroll={handleScroll}
                    style={{
                        gap: '24px',
                        padding: '24px 12px',
                        scrollSnapType: 'x mandatory',
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
                                    flex: '0 0 280px',
                                    scrollSnapAlign: 'start',
                                    cursor: 'pointer',
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
                                    <img src={p.img} alt={p.name} className="product-img" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                                </div>
                                <div className="card-info-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <h3 className="product-name" style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, color: 'var(--color-text-dark)' }}>{p.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {hasDiscount ? (
                                            <>
                                                <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '11px' }}>{p.price} EGP</span>
                                                <span className="product-price" style={{ color: 'var(--color-gold)', fontWeight: '700', fontSize: '13px' }}>{salePrice} EGP</span>
                                            </>
                                        ) : (
                                            <span className="product-price" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-dark)' }}>{p.price} EGP</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sleek horizontal scroll progress indicator */}
                {totalSlides > 1 && (
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

const LandingPage = ({ onOpenAuth }) => {
    const { user } = useAuth();
    const { products, homepageCategories } = useProducts();
    const navigate = useNavigate();

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Filter by Special Collection category (no fallback to random products)
    const specials = products.filter(p => p.categories && p.categories.includes('Special Collection'));

    const handleHeroCta = () => {
        setIsCategoryModalOpen(prev => !prev);
    };

    const handleQuickView = (p, salePrice) => {
        setSelectedProduct({
            ...p,
            price: salePrice
        });
        setIsQuickViewOpen(true);
    };

    const handleSpecialClick = (p) => {
        const discountPercent = p.discountPercent || 0;
        const salePrice = Math.round(p.price * (1 - discountPercent / 100));
        setSelectedProduct({
            ...p,
            price: salePrice
        });
        setIsQuickViewOpen(true);
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

                    {/* Premium Loyalty Rewards Banner */}
                    <div className="hero-loyalty-banner" aria-label="Loyalty Rewards Program">
                        <div className="loyalty-marquee-container">
                            <div className="loyalty-marquee-track">
                                <div className="loyalty-marquee-group">
                                    <span className="loyalty-marquee-item">
                                        <span className="loyalty-icon">🎁</span>
                                        <span>اكسب 1000 نقطة مع كل 1000 جنيه شراء</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span className="loyalty-icon">🎁</span>
                                        <span>Earn 1000 pts for every 1000 EGP purchase</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>استخدم 1000 نقطة وخصم 100 جنيه على طلبك الجاي</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Get 100 EGP off your next order with 1000 pts</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>الحد الأدنى لاستخدام النقاط 1000 نقطة</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Min redemption is 1000 points</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>نقاطك بتتسجل تلقائيًا برقم موبايلك</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Points are saved automatically with your phone number</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                </div>
                                <div className="loyalty-marquee-group" aria-hidden="true">
                                    <span className="loyalty-marquee-item">
                                        <span className="loyalty-icon">🎁</span>
                                        <span>اكسب 1000 نقطة مع كل 1000 جنيه شراء</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span className="loyalty-icon">🎁</span>
                                        <span>Earn 1000 pts for every 1000 EGP purchase</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>استخدم 1000 نقطة وخصم 100 جنيه على طلبك الجاي</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Get 100 EGP off your next order with 1000 pts</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>الحد الأدنى لاستخدام النقاط 1000 نقطة</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Min redemption is 1000 points</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>نقاطك بتتسجل تلقائيًا برقم موبايلك</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                    <span className="loyalty-marquee-item">
                                        <span>Points are saved automatically with your phone number</span>
                                    </span>
                                    <span className="loyalty-sep">•</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                PRODUCT CAROUSELS FOR ENABLED SUB-CATEGORIES
                ============================================ */}
            {homepageCategories.filter(cat => cat.parentName === 'Special Collection').map(cat => {
                const catProducts = products.filter(p => p.categories && p.categories.includes(cat.name));
                if (catProducts.length === 0) return null;
                return (
                    <SubCategoryProductCarousel 
                        key={cat._id} 
                        category={cat} 
                        products={catProducts} 
                        navigate={navigate} 
                        handleQuickView={handleQuickView}
                    />
                );
            })}

            {/* SPECIALS SHOWCASE SECTION */}
            {specials.length > 0 && (
                <section className="specials-section" id="specials-section">
                    <div className="specials-wrapper">
                        <div className="specials-side-title">
                            <span>EXCLUSIVES</span>
                        </div>
                        
                        <div className="specials-content">
                            <div className="specials-header">
                                <h2 className="specials-title">AURA Specials</h2>
                                <span className="specials-subtitle" style={{ display: 'block', marginTop: '4px' }}>Curated Drops</span>
                            </div>
                            
                            <div className="specials-grid" id="specials-grid">
                                {specials.map((p) => (
                                    <div 
                                        className="product-card item-card specials-card" 
                                        data-id={p.id} 
                                        key={p.id}
                                        onClick={() => handleSpecialClick(p)}
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


            {/* Quick View Details Modal */}
            <QuickViewModal 
                product={selectedProduct} 
                isOpen={isQuickViewOpen} 
                onClose={() => setIsQuickViewOpen(false)} 
            />

            {/* Social Media floating panel */}
            <SocialMedia />
        </main>
    );
};

export default LandingPage;
