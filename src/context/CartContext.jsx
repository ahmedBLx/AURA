import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [cartSubtotal, setCartSubtotal] = useState(0);

    const API_URL = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/$/, '')}/api/v1`;

    // Load cart on mount
    const loadCart = () => {
        const storedCart = localStorage.getItem('aura_cart');
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        } else {
            setCart([]);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    // Sync counts whenever cart state changes
    useEffect(() => {
        localStorage.setItem('aura_cart', JSON.stringify(cart));
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setCartCount(count);
        setCartSubtotal(subtotal);
    }, [cart]);

    const addToCart = (product, size) => {
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
    };

    const updateQuantity = (id, size, change) => {
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
    };

    const removeFromCart = (id, size) => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('aura_cart');
    };

    const placeOrder = async (customerDetails) => {
        try {
            const orderItems = cart.map(item => ({
                productId: item.id,
                size: item.size,
                quantity: item.quantity
            }));

            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerName: customerDetails.customerName,
                    customerPhone: customerDetails.customerPhone,
                    customerAlternativePhone: customerDetails.customerAlternativePhone || '',
                    customerAddress: customerDetails.customerAddress,
                    customerGovernorate: customerDetails.customerGovernorate,
                    customerCity: customerDetails.customerCity,
                    notes: customerDetails.notes || '',
                    paymentMethod: customerDetails.paymentMethod || 'Cash on Delivery',
                    items: orderItems
                })
            });

            if (res.ok) {
                const result = await res.json();
                const createdOrder = result.data.order;
                
                // Clear cart locally
                clearCart();
                
                // Keep local copy of order history for offline accessibility
                const existingOrders = JSON.parse(localStorage.getItem('aura_orders')) || [];
                const updatedOrders = [createdOrder, ...existingOrders];
                localStorage.setItem('aura_orders', JSON.stringify(updatedOrders));
                localStorage.setItem('aura_orders_count', updatedOrders.length.toString());

                return createdOrder.orderId;
            } else {
                const errResult = await res.json();
                throw new Error(errResult.message || "Failed to place order.");
            }
        } catch (err) {
            console.error('Checkout error:', err);
            throw err;
        }
    };

    return (
        <CartContext.Provider
            value={{
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
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
