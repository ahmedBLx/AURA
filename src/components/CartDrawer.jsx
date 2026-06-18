import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
    const { 
        cart, 
        cartOpen, 
        setCartOpen, 
        cartSubtotal, 
        cartCount,
        updateQuantity, 
        removeFromCart,
        placeOrder 
    } = useCart();

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [alternativePhone, setAlternativePhone] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [successOrderId, setSuccessOrderId] = useState('');
    const [error, setError] = useState('');

    // Reset checkout states when cart opens or closes
    useEffect(() => {
        if (!cartOpen) {
            setIsCheckingOut(false);
            setSuccessOrderId('');
            setName('');
            setPhone('');
            setAlternativePhone('');
            setGovernorate('');
            setCity('');
            setAddress('');
            setNotes('');
            setPaymentMethod('Cash on Delivery');
            setError('');
        }
    }, [cartOpen]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !address.trim() || !governorate.trim() || !city.trim() || !paymentMethod) {
            setError('Please fill in all required details.');
            return;
        }
        if (phone.trim().length < 8) {
            setError('Please enter a valid phone number.');
            return;
        }
        
        try {
            setError('');
            const orderId = await placeOrder({
                customerName: name.trim(),
                customerPhone: phone.trim(),
                customerAlternativePhone: alternativePhone.trim(),
                customerAddress: address.trim(),
                customerGovernorate: governorate.trim(),
                customerCity: city.trim(),
                notes: notes.trim(),
                paymentMethod: paymentMethod
            });
            setSuccessOrderId(orderId);
        } catch (err) {
            setError(err.message || "Failed to place order. Please try again.");
        }
    };

    if (!cartOpen) return null;

    return (
        <div className="cart-backdrop active" onClick={(e) => e.target.classList.contains('cart-backdrop') && setCartOpen(false)}>
            <style>{`
                .checkout-form {
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    color: inherit;
                    height: 100%;
                    overflow-y: auto;
                }
                .checkout-form h4 {
                    font-family: var(--font-heading);
                    font-size: 16px;
                    letter-spacing: 0.05em;
                    color: inherit;
                    margin-bottom: 4px;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 8px;
                }
                .checkout-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .checkout-group label {
                    font-size: 11px;
                    color: var(--label-color);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }
                .checkout-input {
                    background-color: var(--input-bg);
                    border: 1px solid var(--input-border);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--btn-cancel-color);
                    font-family: var(--font-body);
                    font-size: 14px;
                    outline: none;
                    transition: var(--transition-smooth);
                }
                .checkout-input option {
                    background-color: #111827;
                    color: #ffffff;
                }
                html.light-theme .checkout-input option {
                    background-color: #ffffff;
                    color: #111827;
                }
                .checkout-input:focus {
                    border-color: var(--color-gold);
                    background-color: rgba(255, 255, 255, 0.06);
                }
                html.light-theme .checkout-input:focus {
                    background-color: rgba(0, 0, 0, 0.02);
                }
                .checkout-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 50px 30px;
                    text-align: center;
                    color: inherit;
                    gap: 16px;
                }
                .checkout-success h3 {
                    font-family: var(--font-heading);
                    font-size: 22px;
                    color: var(--color-gold);
                    letter-spacing: 0.05em;
                }
            `}</style>

            <div className="cart-sidebar">
                <div className="cart-sidebar-header">
                    <h3>{successOrderId ? 'THANK YOU' : (isCheckingOut ? 'CHECKOUT' : 'YOUR BAG')}</h3>
                    <button className="close-cart-btn" onClick={() => setCartOpen(false)} aria-label="Close cart drawer">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {successOrderId ? (
                    /* Success Confirmation State */
                    <div className="checkout-success">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '64px', height: '64px', marginBottom: '10px' }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h3>ORDER CONFIRMED</h3>
                        <p style={{ fontSize: '15px', fontWeight: '500' }}>Thank you for shopping with AURA, {name}!</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Order ID: <strong>{successOrderId}</strong></p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                            We have registered your order. Our customer care team will call you shortly at <span style={{ color: 'var(--color-gold)', fontWeight: '600' }}>{phone}</span> to verify shipping to:
                            <br />
                            <span style={{ fontStyle: 'italic', display: 'block', marginTop: '6px', backgroundColor: 'var(--input-bg)', padding: '8px', borderRadius: '4px' }}>
                                {address}, {city}, {governorate}
                            </span>
                        </p>
                        
                        <button 
                            className="cart-checkout-btn" 
                            onClick={() => setCartOpen(false)}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: 'var(--border-radius-pill)', 
                                backgroundColor: 'var(--color-gold)', 
                                color: 'var(--color-primary)', 
                                fontWeight: '600', 
                                border: 'none', 
                                letterSpacing: '0.1em',
                                cursor: 'pointer',
                                marginTop: '20px'
                            }}
                        >
                            CONTINUE SHOPPING
                        </button>
                    </div>
                ) : isCheckingOut ? (
                    /* Checkout Details Form State */
                    <form className="checkout-form" onSubmit={handlePlaceOrder}>
                        <h4>GUEST DELIVERY DETAILS</h4>
                        
                        {error && (
                            <div style={{ color: '#EF4444', fontSize: '13px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        <div className="checkout-group">
                            <label htmlFor="chk-name">Full Name *</label>
                            <input 
                                type="text" 
                                id="chk-name" 
                                className="checkout-input" 
                                required 
                                placeholder="Recipient Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="checkout-group">
                                <label htmlFor="chk-phone">Phone Number *</label>
                                <input 
                                    type="tel" 
                                    id="chk-phone" 
                                    className="checkout-input" 
                                    required 
                                    placeholder="Primary Mobile"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="checkout-group">
                                <label htmlFor="chk-alt-phone">Alternative Phone</label>
                                <input 
                                    type="tel" 
                                    id="chk-alt-phone" 
                                    className="checkout-input" 
                                    placeholder="Secondary Mobile"
                                    value={alternativePhone}
                                    onChange={(e) => setAlternativePhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="checkout-group">
                                <label htmlFor="chk-gov">Governorate *</label>
                                <input 
                                    type="text" 
                                    id="chk-gov" 
                                    className="checkout-input" 
                                    required 
                                    placeholder="e.g. Cairo"
                                    value={governorate}
                                    onChange={(e) => setGovernorate(e.target.value)}
                                />
                            </div>
                            <div className="checkout-group">
                                <label htmlFor="chk-city">City *</label>
                                <input 
                                    type="text" 
                                    id="chk-city" 
                                    className="checkout-input" 
                                    required 
                                    placeholder="e.g. Maadi"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="checkout-group">
                            <label htmlFor="chk-address">Detailed Shipping Address *</label>
                            <textarea 
                                id="chk-address" 
                                className="checkout-input" 
                                required 
                                rows="3" 
                                placeholder="Street, Building, Floor/Apt..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <div className="checkout-group">
                            <label htmlFor="chk-notes">Additional Notes (Optional)</label>
                            <textarea 
                                id="chk-notes" 
                                className="checkout-input" 
                                rows="2" 
                                placeholder="Any special delivery instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <div className="checkout-group">
                            <label htmlFor="chk-payment">Payment Method</label>
                            <select
                                id="chk-payment"
                                className="checkout-input"
                                required
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--btn-cancel-color)', cursor: 'pointer' }}
                            >
                                <option value="Cash on Delivery" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--btn-cancel-color)' }}>Cash on Delivery</option>
                                <option value="Visa / Credit Card" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--btn-cancel-color)' }}>Visa / Credit Card</option>
                            </select>
                        </div>

                        {/* Order Summary box */}
                        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                <span>Bag Total</span>
                                <span>{cartCount} item(s)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '600' }}>
                                <span>Total Price</span>
                                <span style={{ color: 'var(--color-gold)' }}>{cartSubtotal.toLocaleString()} EGP</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <button 
                                type="button" 
                                className="form-cancel-btn" 
                                onClick={() => setIsCheckingOut(false)}
                                style={{ 
                                    flex: 1,
                                    padding: '14px', 
                                    borderRadius: 'var(--border-radius-pill)', 
                                    border: '1px solid var(--btn-cancel-border)', 
                                    backgroundColor: 'transparent', 
                                    color: 'var(--btn-cancel-color)', 
                                    fontWeight: '600', 
                                    cursor: 'pointer' 
                                }}
                            >
                                BACK
                            </button>
                            <button 
                                type="submit" 
                                className="cart-checkout-btn" 
                                style={{ 
                                    flex: 2,
                                    padding: '14px', 
                                    borderRadius: 'var(--border-radius-pill)', 
                                    backgroundColor: 'var(--color-gold)', 
                                    color: 'var(--color-primary)', 
                                    fontWeight: '600', 
                                    border: 'none', 
                                    letterSpacing: '0.1em',
                                    cursor: 'pointer'
                                }}
                            >
                                PLACE ORDER
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Default Cart Items List State */
                    <>
                        <div className="cart-items-list" id="cart-items-container">
                            {cart.length === 0 ? (
                                <div className="cart-empty-state" id="cart-empty">
                                    <svg className="icon empty-bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                        <circle cx="9" cy="21" r="1"></circle>
                                        <circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    <p>YOUR BAG IS EMPTY</p>
                                    <span style={{ fontSize: '12px' }}>Start adding styles to see them display here.</span>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div className="cart-item" key={`${item.id}-${item.size}`}>
                                        <div className="cart-item-img-box">
                                            <img src={item.img} alt={item.name} className="cart-item-img" />
                                        </div>
                                        <div className="cart-item-details">
                                            <div className="cart-item-header">
                                                <h4 className="cart-item-name">{item.name} ({item.size})</h4>
                                                <button 
                                                    className="cart-item-remove-btn" 
                                                    onClick={() => removeFromCart(item.id, item.size)}
                                                    aria-label="Remove item"
                                                >
                                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="cart-item-actions">
                                                <div className="quantity-controls">
                                                    <button className="qty-btn qty-minus" onClick={() => updateQuantity(item.id, item.size, -1)}>-</button>
                                                    <span className="qty-val">{item.quantity}</span>
                                                    <button className="qty-btn qty-plus" onClick={() => updateQuantity(item.id, item.size, 1)}>+</button>
                                                </div>
                                                <span className="cart-item-price">{(item.price * item.quantity).toLocaleString()} EGP</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="cart-sidebar-footer" id="cart-footer" style={{ display: 'flex', flexDirection: 'column', padding: '30px', borderTop: '1px solid var(--border-color)', gap: '20px' }}>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span id="cart-subtotal-val">{cartSubtotal.toLocaleString()} EGP</span>
                                </div>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '600' }}>
                                    <span>Total</span>
                                    <span id="cart-total-val">{cartSubtotal.toLocaleString()} EGP</span>
                                </div>
                                <button 
                                    className="cart-checkout-btn" 
                                    onClick={() => setIsCheckingOut(true)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px', 
                                        borderRadius: 'var(--border-radius-pill)', 
                                        backgroundColor: 'var(--color-gold)', 
                                        color: 'var(--color-primary)', 
                                        fontWeight: '600', 
                                        border: 'none', 
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    PROCEED TO CHECKOUT
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
