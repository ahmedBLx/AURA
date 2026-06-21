import OptimizedImage from './OptimizedImage';
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState('42');
    const [addedStatus, setAddedStatus] = useState(false);
    const [activeImg, setActiveImg] = useState('');
    const openTimeRef = useRef(0);

    const productSizes = (product && product.sizes && product.sizes.length > 0)
        ? product.sizes
        : ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'];

    // Combine main image and secondary images
    const allImages = product ? [product.img] : [];
    if (product && product.images && product.images.length > 0) {
        product.images.forEach(img => {
            if (img && img !== product.img && !allImages.includes(img)) {
                allImages.push(img);
            }
        });
    }

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
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div className="modal-body">
                    {/* Left Column Image & Gallery */}
                    <div className="modal-image-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="modal-main-image-container" style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
