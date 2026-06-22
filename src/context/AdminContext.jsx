'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';

let socketInstance = null;

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const { user } = useAuth();
    const { loadCatalog } = useProducts();
    const isAdmin = user && user.role === 'admin';

    const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

    // Core Dashboard & Admin States
    const [activeTab, setActiveTab] = useState('dashboard');
    const [orders, setOrders] = useState([]);
    const [realtimeToast, setRealtimeToast] = useState(null);
    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [loyaltyCustomers, setLoyaltyCustomers] = useState([]);
    const [isFetchingLoyalty, setIsFetchingLoyalty] = useState(false);
    const [womenSoon, setWomenSoon] = useState(true);
    const [shippingRates, setShippingRates] = useState([]);

    const realtimeToastTimerRef = useRef(null);
    const controllersRef = useRef(new Map());

    const getCancelSignal = useCallback((actionName) => {
        if (controllersRef.current.has(actionName)) {
            controllersRef.current.get(actionName).abort();
        }
        const controller = new AbortController();
        controllersRef.current.set(actionName, controller);
        return controller.signal;
    }, []);

    // Clean up all controllers on unmount
    useEffect(() => {
        return () => {
            controllersRef.current.forEach(c => c.abort());
            controllersRef.current.clear();
        };
    }, []);

    // Load orders
    const loadOrders = useCallback(async () => {
        if (!isAdmin) return;
        const signal = getCancelSignal('loadOrders');
        try {
            const result = await apiClient.get('orders', { signal });
            if (signal.aborted) return;
            const mappedOrders = result.data.orders.map(o => ({
                id: o.orderId,
                dbId: o._id,
                date: new Date(o.createdAt).toLocaleString('en-US', { hour12: true }),
                name: o.customerName,
                phone: o.customerPhone,
                alternativePhone: o.customerAlternativePhone || '',
                governorate: o.customerGovernorate,
                city: o.customerCity,
                address: o.orderType === 'Store Reservation' ? 'N/A (Store Reservation)' : `${o.customerAddress}, ${o.customerCity}, ${o.customerGovernorate}`,
                notes: o.notes,
                paymentMethod: o.paymentMethod,
                orderType: o.orderType || 'Delivery',
                items: o.items.map(item => {
                    const prod = item.product;
                    const imgUrl = prod && prod.img 
                        ? (prod.img.startsWith('http') || prod.img.startsWith('assets') || prod.img.startsWith('data:') ? prod.img : `${BASE_URL}/${prod.img}`)
                        : 'assets/sneaker_white.png';
                    return {
                        id: prod ? (prod._id || prod.id) : item._id,
                        name: item.productName,
                        price: item.price,
                        size: item.size,
                        quantity: item.quantity,
                        img: imgUrl
                    };
                }),
                total: o.total,
                shippingCost: o.shippingCost || 0,
                status: o.status
            }));
            setOrders(mappedOrders);
            localStorage.setItem('aura_orders', JSON.stringify(mappedOrders));
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Failed to load orders from API:', err);
            const storedOrders = localStorage.getItem('aura_orders');
            if (storedOrders) {
                setOrders(JSON.parse(storedOrders));
            }
        }
    }, [isAdmin, BASE_URL, getCancelSignal]);

    // Load settings
    const loadSettings = useCallback(async () => {
        if (!isAdmin) return;
        const signal = getCancelSignal('loadSettings');
        try {
            const result = await apiClient.get('settings', { signal });
            if (signal.aborted) return;
            const settings = result.data.settings;
            const ws = settings.find(s => s.key === 'women_soon');
            if (ws) {
                setWomenSoon(ws.value === true || ws.value === 'true');
            }
            const sr = settings.find(s => s.key === 'shipping_rates');
            if (sr && Array.isArray(sr.value)) {
                setShippingRates(sr.value);
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Failed to load settings in AdminContext:', err);
        }
    }, [isAdmin, getCancelSignal]);

    // Load dashboard metrics
    const loadDashboardMetrics = useCallback(async () => {
        if (!isAdmin) return;
        const signal = getCancelSignal('loadDashboardMetrics');
        try {
            const result = await apiClient.get('dashboard/metrics', { signal });
            if (signal.aborted) return;
            setDashboardMetrics(result.data.metrics);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Failed to load dashboard metrics:', err);
        }
    }, [isAdmin, getCancelSignal]);

    // Load loyalty customers
    const loadLoyaltyCustomers = useCallback(async (searchVal = '', sortVal = 'spent-desc') => {
        if (!isAdmin) return;
        const signal = getCancelSignal('loadLoyaltyCustomers');
        setIsFetchingLoyalty(true);
        try {
            const result = await apiClient.get(`customers?search=${encodeURIComponent(searchVal)}&sort=${sortVal}`, { signal });
            if (signal.aborted) return;
            setLoyaltyCustomers(result.data.customers || []);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Failed to load loyalty customers:', err);
        } finally {
            if (!signal.aborted) {
                setIsFetchingLoyalty(false);
            }
        }
    }, [isAdmin, getCancelSignal]);

    // Update order status
    const updateOrderStatus = useCallback(async (orderId, newStatus) => {
        try {
            await apiClient.patch(`orders/${orderId}/status`, { status: newStatus });
            await loadOrders();
            await loadDashboardMetrics();
            if (loadCatalog) {
                await loadCatalog();
            }
            return true;
        } catch (err) {
            console.error('Update status error:', err);
            alert(err.message || "Failed to update order status.");
            return false;
        }
    }, [loadOrders, loadDashboardMetrics, loadCatalog]);

    // Delete order
    const deleteOrder = useCallback(async (orderId) => {
        try {
            await apiClient.delete(`orders/${orderId}`);
            await loadOrders();
            await loadDashboardMetrics();
            if (loadCatalog) {
                await loadCatalog();
            }
            return true;
        } catch (err) {
            console.error('Delete order error:', err);
            alert(err.message || "Failed to delete order.");
            return false;
        }
    }, [loadOrders, loadDashboardMetrics, loadCatalog]);

    // Toggle Women section "Coming Soon"
    const toggleWomenSoon = useCallback(async (newValue) => {
        try {
            await apiClient.post('settings', {
                key: 'women_soon',
                value: newValue,
                description: 'Whether the Women section is in Coming Soon mode'
            });
            setWomenSoon(newValue);
            return true;
        } catch (err) {
            console.error('Error toggling setting:', err);
            alert('Failed to update setting');
            return false;
        }
    }, []);

    // Save shipping rates
    const saveShippingRates = useCallback(async (updatedRates) => {
        try {
            await apiClient.post('settings', {
                key: 'shipping_rates',
                value: updatedRates,
                description: 'Shipping rates for governorates'
            });
            setShippingRates(updatedRates);
            return true;
        } catch (err) {
            console.error('Error saving shipping rates:', err);
            alert('Failed to save shipping rates');
            return false;
        }
    }, []);

    // Clear completed orders from database
    const clearCompletedOrders = useCallback(async () => {
        try {
            const result = await apiClient.delete('orders/completed');
            alert(result.message || "Completed orders successfully cleared.");
            await loadOrders();
            await loadDashboardMetrics();
            if (loadCatalog) {
                await loadCatalog();
            }
            return true;
        } catch (err) {
            console.error('Clear completed orders error:', err);
            alert(err.message || "Failed to clear completed orders.");
            return false;
        }
    }, [loadOrders, loadDashboardMetrics, loadCatalog]);

    // Sync Socket.IO connection and poll fallbacks safely only when logged in as Admin
    useEffect(() => {
        if (!isAdmin) {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
            return;
        }

        let pollInterval = null;
        const isVercel = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');

        if (isVercel) {
            console.log('Detected Vercel environment. Falling back to active REST polling every 30s for metrics.');
            pollInterval = setInterval(() => {
                loadOrders();
                loadDashboardMetrics();
            }, 30000);
            return () => {
                if (pollInterval) clearInterval(pollInterval);
            };
        }

        // Initialize single instance
        if (!socketInstance) {
            socketInstance = io(BASE_URL, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                timeout: 5000,
            });
        } else if (!socketInstance.connected) {
            socketInstance.connect();
        }

        const socket = socketInstance;

        const handleConnect = () => {
            console.log('Admin Socket Connected successfully');
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        };

        const handleConnectError = () => {
            console.log('Socket.IO connection failed, falling back to rest polling');
            if (!pollInterval) {
                pollInterval = setInterval(() => {
                    loadOrders();
                    loadDashboardMetrics();
                }, 30000);
            }
        };

        const handleNewOrder = (data) => {
            console.log('New Order Socket Event:', data);
            loadOrders();
            loadDashboardMetrics();
            setRealtimeToast({
                orderId: data.orderId,
                customerName: data.customerName,
                total: data.total
            });
            if (realtimeToastTimerRef.current) {
                clearTimeout(realtimeToastTimerRef.current);
            }
            realtimeToastTimerRef.current = setTimeout(() => {
                setRealtimeToast(null);
            }, 6000);
        };

        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('newOrder', handleNewOrder);

        const handleBeforeUnload = () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
            socket.off('newOrder', handleNewOrder);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            if (pollInterval) clearInterval(pollInterval);
            if (realtimeToastTimerRef.current) {
                clearTimeout(realtimeToastTimerRef.current);
            }
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
        };
    }, [isAdmin, BASE_URL, loadOrders, loadDashboardMetrics]);

    const value = useMemo(() => ({
        activeTab,
        setActiveTab,
        orders,
        setOrders,
        realtimeToast,
        setRealtimeToast,
        dashboardMetrics,
        loyaltyCustomers,
        isFetchingLoyalty,
        womenSoon,
        shippingRates,
        loadOrders,
        loadSettings,
        loadDashboardMetrics,
        loadLoyaltyCustomers,
        updateOrderStatus,
        deleteOrder,
        toggleWomenSoon,
        saveShippingRates,
        clearCompletedOrders
    }), [
        activeTab,
        orders,
        realtimeToast,
        dashboardMetrics,
        loyaltyCustomers,
        isFetchingLoyalty,
        womenSoon,
        shippingRates,
        loadOrders,
        loadSettings,
        loadDashboardMetrics,
        loadLoyaltyCustomers,
        updateOrderStatus,
        deleteOrder,
        toggleWomenSoon,
        saveShippingRates,
        clearCompletedOrders
    ]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
