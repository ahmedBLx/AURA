'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart on mount
    const loadCart = useCallback(() => {
        try {
            const storedCart = localStorage.getItem('aura_cart');
            if (storedCart) {
                const parsed = JSON.parse(storedCart);
                if (Array.isArray(parsed)) {
                    setCart(parsed);
                    setIsLoaded(true);
                    return;
                }
            }
        } catch (err) {
            console.error("Error loading cart from localStorage:", err);
        }
        setCart([]);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    // Sync counts whenever cart state changes, but ONLY after it is loaded from storage
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('aura_cart', JSON.stringify(cart));
            } catch (err) {
                console.warn('Failed to save cart to localStorage:', err);
            }
        }
    }, [cart, isLoaded]);

    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    const addToCart = useCallback((product, size) => {
        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex(
                (item) => item.id === product.id && item.size === size
            );
            if (existingIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += 1;
                return newCart;
            } else {
                return [
                    ...prevCart,
                    {
                        id: product.id,
                        name: product.name,
                        price: product.price * (1 - (product.discountPercent || 0) / 100),
                        img: product.img,
                        size: size,
                        quantity: 1
                    }
                ];
            }
        });
        setCartOpen(true);
    }, []);

    const updateQuantity = useCallback((id, size, change) => {
        setCart((prevCart) => {
            return prevCart
                .map((item) => {
                    if (item.id === id && item.size === size) {
                        return { ...item, quantity: item.quantity + change };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0);
        });
    }, []);

    const removeFromCart = useCallback((id, size) => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        try {
            localStorage.removeItem('aura_cart');
        } catch (err) {
            console.warn('Failed to remove cart from localStorage:', err);
        }
    }, []);

    const placeOrder = useCallback(async (customerDetails) => {
        try {
            const orderItems = cart.map(item => ({
                productId: item.id,
                size: item.size,
                quantity: item.quantity
            }));

            const result = await apiClient.post('orders/create', {
                customerName: customerDetails.customerName,
                customerPhone: customerDetails.customerPhone,
                customerAlternativePhone: customerDetails.customerAlternativePhone || '',
                customerAddress: customerDetails.customerAddress,
                customerGovernorate: customerDetails.customerGovernorate,
                customerCity: customerDetails.customerCity,
                notes: customerDetails.notes || '',
                paymentMethod: customerDetails.paymentMethod || 'Cash on Delivery',
                items: orderItems,
                email: customerDetails.email || '',
                usePoints: customerDetails.usePoints || false,
                orderType: customerDetails.orderType || 'Delivery'
            });

            const createdOrder = result.data.order;
            
            // Clear cart locally
            clearCart();
            
            // Keep local copy of order history for offline accessibility
            try {
                const storedOrders = localStorage.getItem('aura_orders');
                let existingOrders = [];
                if (storedOrders) {
                    try {
                        existingOrders = JSON.parse(storedOrders);
                        if (!Array.isArray(existingOrders)) {
                            existingOrders = [];
                        }
                    } catch (parseErr) {
                        console.warn('Failed to parse local order history:', parseErr);
                    }
                }
                const updatedOrders = [createdOrder, ...existingOrders];
                localStorage.setItem('aura_orders', JSON.stringify(updatedOrders));
                localStorage.setItem('aura_orders_count', updatedOrders.length.toString());
            } catch (storageErr) {
                console.warn('Failed to cache order offline:', storageErr);
            }

            return createdOrder.orderId;
        } catch (err) {
            console.error('Checkout error:', err);
            throw err;
        }
    }, [cart, clearCart]);

    const value = useMemo(() => ({
        cart,
        cartOpen,
        setCartOpen,
        cartCount,
        cartSubtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        loadCart
    }), [
        cart,
        cartOpen,
        setCartOpen,
        cartCount,
        cartSubtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        loadCart
    ]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
