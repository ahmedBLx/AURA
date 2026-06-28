import OptimizedImage from './OptimizedImage';
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getPublicSettings } from '../services/publicSettings';

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
    const [shippingRates, setShippingRates] = useState([]);
    const [orderType, setOrderType] = useState('Delivery');
    
    // Loyalty and checkout states
    const [email, setEmail] = useState('');
    const [checkoutStep, setCheckoutStep] = useState('phone'); // 'phone' | 'details'
    const [usePoints, setUsePoints] = useState(false);
    const [loyaltyDetails, setLoyaltyDetails] = useState(null);
    const [isSearchingPhone, setIsSearchingPhone] = useState(false);

    const API_URL = `${(process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')}/api/v1`;

    useEffect(() => {
        let isMounted = true;

        const fetchShippingRates = async () => {
            try {
                const settings = await getPublicSettings();
                if (!isMounted) return;
                const ratesSetting = settings.find(s => s.key === 'shipping_rates');
                if (ratesSetting && Array.isArray(ratesSetting.value)) {
                    setShippingRates(ratesSetting.value);
                }
            } catch (err) {
                console.error("Error fetching shipping rates:", err);
            }
        };
        fetchShippingRates();

        return () => {
            isMounted = false;
        };
    }, []);

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
            setOrderType('Delivery');
            setError('');
            setEmail('');
            setCheckoutStep('phone');
            setUsePoints(false);
            setLoyaltyDetails(null);
            setIsSearchingPhone(false);
        }
    }, [cartOpen]);

    const handlePhoneLookup = async (e) => {
        e.preventDefault();
        if (!phone.trim()) {
            setError('Please enter a valid phone number.');
            return;
        }
        if (phone.trim().length < 8) {
            setError('Please enter a valid phone number.');
            return;
        }

        setIsSearchingPhone(true);
        setError('');
        try {
            // 1. Check if customer profile exists
            const res = await fetch(`${API_URL.replace('/v1', '')}/customers/phone/${encodeURIComponent(phone.trim())}`);
            if (res.ok) {
                const result = await res.json();
                if (result.status === 'success' && result.data.found) {
                    const c = result.data.customer;
                    setName(c.fullName || '');
                    setGovernorate(c.city || '');
                    setAddress(c.address || '');
                    setEmail(c.email || '');
                } else {
                    setName('');
                    setGovernorate('');
                    setAddress('');
                    setEmail('');
                }
            }

            // 2. Fetch loyalty points calculations
            const ptsRes = await fetch(`${API_URL.replace('/v1', '')}/points/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: phone.trim(),
                    cartSubtotal: cartSubtotal
                })
            });

            if (ptsRes.ok) {
                const ptsResult = await ptsRes.json();
                if (ptsResult.status === 'success') {
                    setLoyaltyDetails(ptsResult.data);
                }
            }

            setCheckoutStep('details');
        } catch (err) {
            console.error('Lookup error:', err);
            setError('Error searching phone details. Please try again.');
        } finally {
            setIsSearchingPhone(false);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        if (orderType === 'Store Reservation') {
            if (!name.trim() || !phone.trim() || !alternativePhone.trim()) {
                setError('Please fill in all required details (Name and two phone numbers).');
                return;
            }
        } else {
            if (!name.trim() || !phone.trim() || !address.trim() || !governorate.trim() || !city.trim() || !paymentMethod) {
                setError('Please fill in all required details.');
                return;
            }
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
                customerAddress: orderType === 'Store Reservation' ? '' : address.trim(),
                customerGovernorate: orderType === 'Store Reservation' ? '' : governorate.trim(),
                customerCity: orderType === 'Store Reservation' ? '' : city.trim(),
                notes: notes.trim(),
                paymentMethod: orderType === 'Store Reservation' ? 'Pay in Store' : paymentMethod,
                email: email.trim(),
                usePoints: usePoints,
                orderType: orderType,
            });
            setSuccessOrderId(orderId);
        } catch (err) {
            setError(err.message || "Failed to place order. Please try again.");
        }
    };

    if (!cartOpen) return null;

    return (
        <div className="cart-backdrop active" onClick={(e) => e.target.classList.contains('cart-backdrop') && setCartOpen(false)}>
            <div className="cart-sidebar">
                <div className="cart-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {!successOrderId && (
                            <button 
                                type="button"
                                className="cart-back-header-btn"
                                onClick={() => {
                                    if (isCheckingOut) {
                                        if (checkoutStep === 'details') {
                                            setCheckoutStep('phone');
                                        } else {
                                            setIsCheckingOut(false);
                                        }
                                    } else {
                                        setCartOpen(false);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-gold)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.2s',
                                    width: '32px',
                                    height: '32px'
                                }}
                                title="Go back"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>
                        )}
                        <h3 style={{ margin: 0 }}>{successOrderId ? 'THANK YOU' : (isCheckingOut ? 'CHECKOUT' : 'YOUR BAG')}</h3>
                    </div>
                    <button className="close-cart-btn" onClick={() => setCartOpen(false)} aria-label="Close cart drawer" style={{ position: 'static' }}>
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
                        {orderType === 'Store Reservation' ? (
                            <>
                                <h3>RESERVATION CONFIRMED</h3>
                                <p style={{ fontSize: '15px', fontWeight: '500' }}>Thank you for reserving with AURA, {name}!</p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Reservation ID: <strong>{successOrderId}</strong></p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                                    حجزك صالح لمدة <strong>24 ساعة فقط</strong> من وقت الطلب. يرجى التوجه إلى المحل لاستلام القطعة خلال هذه المدة وإلا سيتم إلغاء الحجز تلقائياً.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3>ORDER CONFIRMED</h3>
                                <p style={{ fontSize: '15px', fontWeight: '500' }}>Thank you for shopping with AURA, {name}!</p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Order ID: <strong>{successOrderId}</strong></p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                                    {paymentMethod === 'Online Payment' ? (
                                        <strong>ℹ️ سيتم التواصل مع حضرتك لتأكيد الطلب وإتمام عملية الدفع.</strong>
                                    ) : (
                                        <>
                                            We have registered your order. Our customer care team will call you shortly at <span style={{ color: 'var(--color-gold)', fontWeight: '600' }}>{phone}</span> to verify shipping to:
                                            <br />
                                            <span style={{ fontStyle: 'italic', display: 'block', marginTop: '6px', backgroundColor: 'var(--input-bg)', padding: '8px', borderRadius: '4px' }}>
                                                {address}, {city}, {governorate}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </>
                        )}

                        {/* Loyalty Points Alert */}
                        <div style={{
                            marginTop: '12px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(197, 168, 128, 0.06)',
                            border: '1px solid rgba(197, 168, 128, 0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            textAlign: 'center'
                        }}>
                            <span style={{ color: 'var(--color-gold)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-gold)" style={{ stroke: 'none' }}>
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                AURA LOYALTY PROGRAM
                            </span>
                            <span className="loyalty-message-text" style={{ fontWeight: '500' }}>
                                {orderType === 'Store Reservation'
                                    ? 'بمجرد استلام الحجز من المحل وتأكيد الطلب، ستتم إضافة نقاط الولاء مباشرة إلى حسابك.'
                                    : 'بمجرد استلام الأوردر وتأكيد التوصيل، ستتم إضافة نقاط الولاء مباشرة إلى حسابك.'}
                            </span>
                        </div>
                        
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
                    checkoutStep === 'phone' ? (
                        /* Stage 1: Phone Verification Form */
                        <form className="checkout-form" onSubmit={handlePhoneLookup}>
                            <h4>DELIVERY PHONE LOOKUP</h4>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '8px' }}>
                                Enter your phone number to check for existing delivery details and available loyalty rewards.
                            </p>
                            
                            {error && (
                                <div style={{ color: '#EF4444', fontSize: '13px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            <div className="checkout-group">
                                <label htmlFor="chk-lookup-phone">Mobile Phone Number *</label>
                                <input 
                                    type="tel" 
                                    id="chk-lookup-phone" 
                                    className="checkout-input" 
                                    required 
                                    placeholder="e.g. 01011112222"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={isSearchingPhone}
                                />
                            </div>

                            <div className="checkout-group" style={{ marginTop: '12px' }}>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>Order Option / خيار الطلب *</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                    <label style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '12px', borderRadius: '12px', border: `1px solid ${orderType === 'Delivery' ? 'var(--color-gold)' : 'var(--border-color)'}`,
                                        backgroundColor: orderType === 'Delivery' ? 'rgba(197, 168, 128, 0.1)' : 'transparent',
                                        cursor: 'pointer', fontSize: '13px', color: 'var(--btn-cancel-color)', fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input type="radio" name="orderType" value="Delivery" checked={orderType === 'Delivery'} onChange={() => setOrderType('Delivery')} style={{ accentColor: 'var(--color-gold)' }} />
                                        Delivery (دليفري)
                                    </label>
                                    <label style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '12px', borderRadius: '12px', border: `1px solid ${orderType === 'Store Reservation' ? 'var(--color-gold)' : 'var(--border-color)'}`,
                                        backgroundColor: orderType === 'Store Reservation' ? 'rgba(197, 168, 128, 0.1)' : 'transparent',
                                        cursor: 'pointer', fontSize: '13px', color: 'var(--btn-cancel-color)', fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input type="radio" name="orderType" value="Store Reservation" checked={orderType === 'Store Reservation'} onChange={() => setOrderType('Store Reservation')} style={{ accentColor: 'var(--color-gold)' }} />
                                        In-Store (حجز في المحل)
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="form-cancel-btn" 
                                    onClick={() => setIsCheckingOut(false)}
                                    disabled={isSearchingPhone}
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
                                    disabled={isSearchingPhone}
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
                                    {isSearchingPhone ? 'VERIFYING...' : 'CONTINUE'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Stage 2: Checkout Details Form State */
                        <form className="checkout-form" onSubmit={handlePlaceOrder}>
                            <h4>{orderType === 'Store Reservation' ? 'STORE RESERVATION DETAILS' : 'GUEST DELIVERY DETAILS'}</h4>
                            
                            {error && (
                                <div style={{ color: '#EF4444', fontSize: '13px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            {/* Verified phone card */}
                            <div style={{ 
                                padding: '12px 16px', 
                                borderRadius: '10px', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '13px'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Verified Phone</span>
                                    <strong>{phone}</strong>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setCheckoutStep('phone');
                                        setUsePoints(false);
                                        setLoyaltyDetails(null);
                                    }}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--color-gold)', 
                                        cursor: 'pointer', 
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Change
                                </button>
                            </div>

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

                            <div className="checkout-group">
                                <label htmlFor="chk-alt-phone">Alternative Phone {orderType === 'Store Reservation' ? '*' : '(Optional)'}</label>
                                <input 
                                    type="tel" 
                                    id="chk-alt-phone" 
                                    className="checkout-input" 
                                    required={orderType === 'Store Reservation'}
                                    placeholder="Secondary Mobile"
                                    value={alternativePhone}
                                    onChange={(e) => setAlternativePhone(e.target.value)}
                                />
                            </div>

                            {orderType !== 'Store Reservation' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="checkout-group">
                                            <label htmlFor="chk-gov">Governorate *</label>
                                            <select 
                                                id="chk-gov" 
                                                className="checkout-input" 
                                                required 
                                                value={governorate}
                                                onChange={(e) => setGovernorate(e.target.value)}
                                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--btn-cancel-color)', cursor: 'pointer' }}
                                            >
                                                <option value="">Select Governorate</option>
                                                {shippingRates.map((rate, idx) => (
                                                    <option key={idx} value={rate.governorate}>
                                                        {rate.governorate} ({rate.cost} EGP)
                                                    </option>
                                                ))}
                                            </select>
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
                                </>
                            )}

                            <div className="checkout-group">
                                <label htmlFor="chk-notes">Additional Notes (Optional)</label>
                                <textarea 
                                    id="chk-notes" 
                                    className="checkout-input" 
                                    rows="2" 
                                    placeholder="Any special instructions..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>

                            {orderType === 'Store Reservation' ? (
                                <div style={{ 
                                    padding: '12px 16px', 
                                    borderRadius: '12px', 
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                                    color: '#EF4444', 
                                    fontSize: '13px', 
                                    lineHeight: '1.4', 
                                    fontWeight: '500',
                                    marginTop: '8px'
                                }}>
                                    ⚠️ حجز القطعة صالح لمدة 24 ساعة فقط في المحل، وإلا سيتم إلغاء الحجز تلقائياً.
                                </div>
                            ) : (
                                <>
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
                                            <option value="Online Payment" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--btn-cancel-color)' }}>Online Payment</option>
                                        </select>
                                    </div>

                                    {paymentMethod === 'Online Payment' && (
                                        <div style={{ 
                                            padding: '12px 16px', 
                                            borderRadius: '12px', 
                                            backgroundColor: 'rgba(197, 168, 128, 0.1)', 
                                            border: '1px solid rgba(197, 168, 128, 0.3)', 
                                            color: 'var(--color-gold)', 
                                            fontSize: '13px', 
                                            lineHeight: '1.4', 
                                            fontWeight: '500',
                                            marginTop: '8px'
                                        }}>
                                            ℹ️ سيتم التواصل مع حضرتك لاتمام عمليه الدفع
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Loyalty points card */}
                            {loyaltyDetails && (
                                <div style={{ 
                                    padding: '18px', 
                                    borderRadius: '16px', 
                                    background: 'linear-gradient(135deg, rgba(197, 168, 128, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%)', 
                                    border: '1px solid rgba(197, 168, 128, 0.25)', 
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: '700', letterSpacing: '0.1em' }}>AURA Loyalty Rewards</span>
                                            <h5 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-gold)" style={{ stroke: 'none' }}>
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                </svg>
                                                {loyaltyDetails.currentPoints.toLocaleString()} Points
                                            </h5>
                                        </div>
                                    </div>

                                    {loyaltyDetails.currentPoints < 1000 ? (
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                            You currently have <strong>{loyaltyDetails.currentPoints}</strong> points. A minimum of <strong>1000 points</strong> is required to claim rewards.
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: '0 0 10px 0' }}>
                                                You can redeem <strong>{loyaltyDetails.pointsToUse.toLocaleString()} points</strong> for an instant discount of <strong style={{ color: 'var(--color-gold)' }}>{loyaltyDetails.maxDiscount.toLocaleString()} EGP</strong>.
                                            </p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setUsePoints(true)}
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '8px 12px', 
                                                        borderRadius: '20px', 
                                                        border: 'none', 
                                                        backgroundColor: usePoints ? 'var(--color-gold)' : 'var(--input-bg)', 
                                                        color: usePoints ? '#000000' : 'var(--btn-cancel-color)', 
                                                        fontWeight: '600',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    USE POINTS
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setUsePoints(false)}
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '8px 12px', 
                                                        borderRadius: '20px', 
                                                        border: 'none', 
                                                        backgroundColor: !usePoints ? 'var(--color-gold)' : 'var(--input-bg)', 
                                                        color: !usePoints ? '#000000' : 'var(--btn-cancel-color)', 
                                                        fontWeight: '600',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    KEEP POINTS
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Summary box */}
                            {(() => {
                                const isStoreReservation = orderType === 'Store Reservation';
                                const selectedRate = isStoreReservation
                                    ? null
                                    : shippingRates.find(r => {
                                        const rGov = typeof r?.governorate === 'string' ? r.governorate.trim().toLowerCase() : '';
                                        const gGov = typeof governorate === 'string' ? governorate.trim().toLowerCase() : '';
                                        return rGov && gGov && rGov === gGov;
                                    });
                                const shippingCost = isStoreReservation ? 0 : (selectedRate ? Number(selectedRate.cost) : 0);
                                
                                const discountApplied = (usePoints && loyaltyDetails) ? loyaltyDetails.maxDiscount : 0;
                                const finalTotal = Math.max(0, cartSubtotal - discountApplied) + shippingCost;
                                const pointsEarnedAfterPurchase = Math.max(0, Math.round(finalTotal));

                                return (
                                    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                            <span>Subtotal</span>
                                            <span>{cartSubtotal.toLocaleString()} EGP</span>
                                        </div>
                                        {discountApplied > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', marginBottom: '8px', fontWeight: '500' }}>
                                                <span>Loyalty Discount</span>
                                                <span>-{discountApplied.toLocaleString()} EGP</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                            <span>Shipping</span>
                                            <span>{isStoreReservation ? '0 EGP (In-store pickup)' : (selectedRate ? `${shippingCost.toLocaleString()} EGP` : 'Select governorate')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '600', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px', marginBottom: '8px' }}>
                                            <span>Total Price</span>
                                            <span style={{ color: 'var(--color-gold)' }}>{finalTotal.toLocaleString()} EGP</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', borderTop: '1px dotted var(--border-color)', paddingTop: '8px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-gold)" style={{ stroke: 'none' }}>
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                            Earn {pointsEarnedAfterPurchase.toLocaleString()} points after purchase
                                        </div>
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                <button 
                                    type="button" 
                                    className="form-cancel-btn" 
                                    onClick={() => setCheckoutStep('phone')}
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
                    )
                ) : (
                    /* Default Cart Items List State */
                    <>
                        <div className="cart-items-list" id="cart-items-container">
                            {cart.length === 0 ? (
                                <div className="cart-empty-state" id="cart-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <svg className="icon empty-bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                        <circle cx="9" cy="21" r="1"></circle>
                                        <circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                    <p>YOUR BAG IS EMPTY</p>
                                    <span style={{ fontSize: '12px', marginBottom: '20px' }}>Start adding styles to see them display here.</span>
                                    <button 
                                        type="button"
                                        onClick={() => setCartOpen(false)}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: 'var(--border-radius-pill)',
                                            border: '1px solid var(--color-gold)',
                                            backgroundColor: 'transparent',
                                            color: 'var(--color-gold)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                                            e.currentTarget.style.color = '#000000';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'var(--color-gold)';
                                        }}
                                    >
                                        CONTINUE SHOPPING
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div className="cart-item" key={`${item.id}-${item.size}`}>
                                        <div className="cart-item-img-box">
                                            <OptimizedImage src={item.img} alt={item.name} className="cart-item-img" aspectRatio="4/3" />
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
                                <button 
                                    type="button"
                                    className="form-cancel-btn" 
                                    onClick={() => setCartOpen(false)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px', 
                                        borderRadius: 'var(--border-radius-pill)', 
                                        border: '1px solid var(--btn-cancel-border)', 
                                        backgroundColor: 'transparent', 
                                        color: 'var(--btn-cancel-color)', 
                                        fontWeight: '600', 
                                        cursor: 'pointer',
                                        marginTop: '10px',
                                        textAlign: 'center',
                                        fontSize: '13px'
                                    }}
                                >
                                    CONTINUE SHOPPING
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
