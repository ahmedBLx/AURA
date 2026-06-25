'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OptimizedImage from './OptimizedImage';

export default function SubCategoryProductCarousel({
    category,
    products,
    layout = 'grid',
    favorites = {},
    toggleFavorite,
    handleQuickView,
    showViewAll = false,
    onViewAllClick,
    showFavoriteBtn = false,
    badgeLabel
}) {
    const carouselRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [visibleRatio, setVisibleRatio] = useState(0.2);
    const resumeTimerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const isScrollingProgrammaticallyRef = useRef(false);
    const rafRef = useRef(null);

    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const totalSlides = products.length;

    const scrollToSlide = useCallback((index) => {
        if (!carouselRef.current || totalSlides === 0) return;
        const container = carouselRef.current;
        const card = container.querySelector('.product-card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 24; // width + gap
        isScrollingProgrammaticallyRef.current = true;
        container.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    }, [totalSlides]);

    // Auto-scroll every 4 seconds if not paused
    useEffect(() => {
        if (totalSlides <= 1 || isPaused || layout === 'list') return;

        const timer = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
        }, 4000);

        return () => clearInterval(timer);
    }, [totalSlides, isPaused, layout]);

    // Trigger visual scroll whenever currentSlide updates
    useEffect(() => {
        if (layout !== 'list' && totalSlides > 0) {
            scrollToSlide(currentSlide);
        }
    }, [currentSlide, layout, totalSlides, scrollToSlide]);

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
        // Capture the DOM node immediately — e.currentTarget is nullified
        // by React's synthetic event pooling before the rAF callback fires.
        const container = e.currentTarget;

        // Cancel any already-scheduled frame so we only process the latest
        // scroll position, preventing stale reads on fast scrolls.
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;

            // --- Progress bar update (throttled to rAF, ~60fps max) ---
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScroll = scrollWidth - clientWidth;

            if (maxScroll > 0) {
                setScrollProgress(scrollLeft / maxScroll);
                setVisibleRatio(clientWidth / scrollWidth);
            }

            // --- Snap-index detection (debounced, unchanged) ---
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                scrollTimeoutRef.current = null;

                if (isScrollingProgrammaticallyRef.current) {
                    isScrollingProgrammaticallyRef.current = false;
                    return;
                }

                const card = container.querySelector('.product-card');
                if (card) {
                    const cardWidth = card.offsetWidth + 24;
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    if (newIndex !== currentSlide) {
                        setCurrentSlide(newIndex);
                    }
                }
            }, 150);
        });
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

    // Consolidating cleanup on unmount at the top effect

    return (
        <section className="category-carousel-section" style={{ padding: '20px 0' }}>
            {showViewAll ? (
                /* Landing Page Header Layout */
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
                    
                    {onViewAllClick && (
                        <button 
                            onClick={onViewAllClick}
                            className="view-all-btn view-all-hover-effect"
                        >
                            View All 
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    )}
                </div>
            ) : (
                /* Catalog Pages Header Layout */
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
            )}

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
                            const finalPrice = hasDiscount ? salePrice : p.price;

                            return (
                                <div
                                    className="product-card item-card"
                                    key={p.id}
                                    onClick={() => handleQuickView(p, finalPrice)}
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
                                        {badgeLabel && !hasDiscount && (
                                            <span className="badge badge-new" style={badgeLabel === 'WOMEN' ? { backgroundColor: 'rgba(255, 94, 151, 0.15)', color: '#FF5E97', border: '1px solid rgba(255, 94, 151, 0.2)' } : undefined}>
                                                {badgeLabel}
                                            </span>
                                        )}
                                        <OptimizedImage src={p.img} alt={p.name} className="product-img" aspectRatio="4/3" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', transition: 'transform 0.4s ease' }} />
                                        {layout !== 'list' && (
                                            <div className="card-overlay-actions">
                                                <button className="quick-view-btn" onClick={(e) => { e.stopPropagation(); handleQuickView(p, finalPrice); }}>Quick View</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-info-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div className="info-left">
                                            <h3 className="product-name" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px', margin: 0 }}>
                                                {p.name}
                                            </h3>
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
                                        {(layout === 'list' || showFavoriteBtn) && (
                                            <div className="info-right" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                {layout === 'list' && (
                                                    <button 
                                                        className="quick-view-btn" 
                                                        onClick={(e) => { e.stopPropagation(); handleQuickView(p, finalPrice); }}
                                                        style={{ padding: '8px 18px', fontSize: '12px' }}
                                                    >
                                                        Quick View
                                                    </button>
                                                )}
                                                {showFavoriteBtn && toggleFavorite && (
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
                                                )}
                                            </div>
                                        )}
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
}
