import OptimizedImage from './OptimizedImage';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCart } from '../context/CartContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState('42');
    const [addedStatus, setAddedStatus] = useState(false);
    const [activeImg, setActiveImg] = useState('');
    const openTimeRef = useRef(0);

    const productSizes = useMemo(() => (
        (product && product.sizes && product.sizes.length > 0)
            ? product.sizes
            : ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
    ), [product]);

    // Combine main image and secondary images
    const allImages = useMemo(() => {
        const images = product ? [product.img] : [];
        if (product && product.images && product.images.length > 0) {
            product.images.forEach(img => {
                if (img && img !== product.img && !images.includes(img)) {
                    images.push(img);
                }
            });
        }
        return images;
    }, [product]);

    // Reset button status and active image on close or product change
    useEffect(() => {
        if (!isOpen) {
            setAddedStatus(false);
            setSelectedSize('42');
            setActiveImg('');
        } else if (product) {
            openTimeRef.current = Date.now();
            const sizes = (product.sizes && product.sizes.length > 0)
                ? product.sizes
                : ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'];
            setSelectedSize(sizes.includes('42') ? '42' : sizes[0]);
            setActiveImg(product.img);
        }
    }, [isOpen, product]);


    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    if (!isOpen || !product) return null;

    const discountPercent = product.discountPercent || 0;
    const hasDiscount = discountPercent > 0;
    const salePrice = Math.round(product.price * (1 - discountPercent / 100));

    const handleAddToBag = () => {
        addToCart(product, selectedSize);
        setAddedStatus(true);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            setAddedStatus(false);
            onClose();
        }, 1000);
    };

    return (
        <div 
            className="modal-backdrop active" 
            onClick={(e) => {
                if (Date.now() - openTimeRef.current > 400 && e.target.classList.contains('modal-backdrop')) {
                    onClose();
                }
            }}
        >
            <div className="modal-content" style={{ position: 'relative' }}>
                <button 
                    type="button"
                    className="modal-back-arrow-btn" 
                    onClick={onClose} 
                    aria-label="Go back"
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        transition: 'color 0.2s',
                        zIndex: 25
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gold)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div className="modal-body">
                    {/* Left Column Image & Gallery */}
                    <div className="modal-image-col">
                        <div className="modal-main-image-container">
                            <OptimizedImage src={activeImg || product.img} alt={product.name} className="object-contain" aspectRatio="4/3" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'all 0.3s ease' }} />
                        </div>
                        
                        {allImages.length > 1 && (
                            <div className="modal-thumbnails-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
                                {allImages.map((img, idx) => {
                                    const isActive = activeImg === img;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImg(img)}
                                            onMouseEnter={() => setActiveImg(img)}
                                            style={{
                                                width: '64px',
                                                height: '52px',
                                                border: isActive ? '2px solid var(--color-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '6px',
                                                padding: '2px',
                                                cursor: 'pointer',
                                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0,
                                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                                outline: 'none'
                                            }}
                                            aria-label={`View image option ${idx + 1}`}
                                        >
                                            <OptimizedImage src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="object-contain" aspectRatio="4/3" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column details */}
                    <div className="modal-info-col">
                        <span className="modal-brand-tag">AURA SNEAKERS</span>
                        <h2>{product.name}</h2>
                        {hasDiscount ? (
                            <div className="modal-price" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '16px' }}>{product.price} EGP</span>
                                <span style={{ color: 'var(--color-gold)' }}>{salePrice} EGP</span>
                            </div>
                        ) : (
                            <div className="modal-price">{product.price} EGP</div>
                        )}
                        <p className="modal-desc">{product.desc}</p>

                        {/* Size Selection */}
                        <div className="size-selector">
                            <span className="selector-label">SELECT SIZE</span>
                            <div className="sizes-grid">
                                {productSizes.map((size) => (
                                    <button 
                                        key={size}
                                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            className="add-to-cart-btn" 
                            id="modal-add-to-cart"
                            onClick={handleAddToBag}
                            style={{
                                backgroundColor: addedStatus ? '#10B981' : 'var(--color-primary)',
                                borderColor: addedStatus ? '#10B981' : 'var(--color-gold)'
                            }}
                        >
                            {addedStatus ? 'ADDED TO BAG ✓' : 'ADD TO BAG'}
                        </button>
                        
                        <button 
                            type="button"
                            className="modal-back-catalog-btn" 
                            onClick={onClose}
                            style={{
                                width: '100%',
                                marginTop: '12px',
                                padding: '12px',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--color-text-muted)',
                                fontWeight: '600',
                                borderRadius: 'var(--border-radius-pill)',
                                fontSize: '13px',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-gold)';
                                e.currentTarget.style.color = 'var(--color-gold)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            CONTINUE SHOPPING / رجوع للمتجر
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
