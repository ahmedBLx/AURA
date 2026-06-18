import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const AdminPage = () => {
    const { user, users, logout } = useAuth();
    const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, loadCatalog } = useProducts();
    const navigate = useNavigate();

    // UI & Layout States
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'categories' | 'orders' | 'customers'
    const theme = 'dark';
    const [orders, setOrders] = useState([]);
    const [realtimeToast, setRealtimeToast] = useState(null);
    
    // Search, Filter, Sort States
    const [prodSearch, setProdSearch] = useState('');
    const [prodCatFilter, setProdCatFilter] = useState('All');
    const [prodStockFilter, setProdStockFilter] = useState('All'); // 'All' | 'Low' | 'Out'
    const [prodSort, setProdSort] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'

    const [orderSearch, setOrderSearch] = useState('');
    const [orderPaymentFilter, setOrderPaymentFilter] = useState('All');
    const [orderSort, setOrderSort] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'
    const [activeOrderStatusTab, setActiveOrderStatusTab] = useState('Pending'); // 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled'

    const [custSearch, setCustSearch] = useState('');
    const [custSort, setCustSort] = useState('orders-desc'); // 'name-asc' | 'name-desc' | 'orders-desc' | 'orders-asc'

    // Form states
    const [editId, setEditId] = useState('');
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodImage, setProdImage] = useState('assets/sneaker_white.png');
    const [imageFile, setImageFile] = useState(null);
    const [prodImages, setProdImages] = useState([]); // Array of { id, url, file }
    const [prodDesc, setProdDesc] = useState('');
    const [selectedCats, setSelectedCats] = useState([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [prodStock, setProdStock] = useState(10);
    const [selectedSizes, setSelectedSizes] = useState(['39', '40', '41', '42', '43', '44', '45']);
    const [womenSoon, setWomenSoon] = useState(true);

    // Categories Form State
    const [newCatName, setNewCatName] = useState('');

    // Modal Details States
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null); // stores product object to confirm deletion
    const [isProductModalOpen, setIsProductModalOpen] = useState(false); // controls the Add/Edit Product Modal

    // Load orders
    const loadOrders = async () => {
        const token = localStorage.getItem('aura_token');
        try {
            const res = await fetch('http://localhost:5002/api/v1/orders', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const result = await res.json();
                const mappedOrders = result.data.orders.map(o => ({
                    id: o.orderId,
                    dbId: o._id,
                    date: new Date(o.createdAt).toLocaleString('en-US', { hour12: true }),
                    name: o.customerName,
                    phone: o.customerPhone,
                    alternativePhone: o.customerAlternativePhone || '',
                    governorate: o.customerGovernorate,
                    city: o.customerCity,
                    address: `${o.customerAddress}, ${o.customerCity}, ${o.customerGovernorate}`,
                    notes: o.notes,
                    paymentMethod: o.paymentMethod,
                    items: o.items.map(item => {
                        const prod = item.product;
                        const imgUrl = prod && prod.img 
                            ? (prod.img.startsWith('http') || prod.img.startsWith('assets') || prod.img.startsWith('data:') ? prod.img : `http://localhost:5002/${prod.img}`)
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
                    status: o.status
                }));
                setOrders(mappedOrders);
                localStorage.setItem('aura_orders', JSON.stringify(mappedOrders));
                return;
            }
        } catch (err) {
            console.error('Failed to load orders from API:', err);
        }

        // Fallback
        const storedOrders = localStorage.getItem('aura_orders');
        if (storedOrders) {
            setOrders(JSON.parse(storedOrders));
        }
    };

    const loadSettings = async () => {
        const token = localStorage.getItem('aura_token');
        try {
            const res = await fetch('http://localhost:5002/api/v1/settings', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const result = await res.json();
                const settings = result.data.settings;
                const ws = settings.find(s => s.key === 'women_soon');
                if (ws) {
                    setWomenSoon(ws.value === true || ws.value === 'true');
                }
            }
        } catch (err) {
            console.error('Failed to load settings in AdminPage:', err);
        }
    };

    const handleToggleWomenSoon = async () => {
        const token = localStorage.getItem('aura_token');
        const newValue = !womenSoon;
        try {
            const res = await fetch('http://localhost:5002/api/v1/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    key: 'women_soon',
                    value: newValue,
                    description: 'Whether the Women section is in Coming Soon mode'
                })
            });
            if (res.ok) {
                setWomenSoon(newValue);
            } else {
                alert('Failed to update setting');
            }
        } catch (err) {
            console.error('Error toggling setting:', err);
            alert('Network error updating setting');
        }
    };

    useEffect(() => {
        loadOrders();
        loadSettings();
    }, []);

    useEffect(() => {
        const socket = io('http://localhost:5002');

        socket.on('connect', () => {
            console.log('Admin Socket Connected');
        });

        socket.on('newOrder', (data) => {
            console.log('Real-time order received:', data);
            loadOrders();
            
            // Set toast data
            setRealtimeToast({
                orderId: data.orderId,
                customerName: data.customerName,
                total: data.total
            });

            // Auto dismiss after 6 seconds
            setTimeout(() => {
                setRealtimeToast(null);
            }, 6000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Status transitions
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        const token = localStorage.getItem('aura_token');
        try {
            const res = await fetch(`http://localhost:5002/api/v1/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                await loadOrders();
                if (loadCatalog) {
                    await loadCatalog();
                }
                if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
                    setSelectedOrderDetails(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                const errResult = await res.json();
                alert(errResult.message || "Failed to update order status.");
            }
        } catch (err) {
            console.error('Update status error:', err);
            alert("Network connection error.");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm(`Are you sure you want to delete order ${orderId}?`)) {
            const token = localStorage.getItem('aura_token');
            try {
                const res = await fetch(`http://localhost:5002/api/v1/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    await loadOrders();
                    if (loadCatalog) {
                        await loadCatalog();
                    }
                    if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
                        setSelectedOrderDetails(null);
                    }
                } else {
                    const errResult = await res.json();
                    alert(errResult.message || "Failed to delete order.");
                }
            } catch (err) {
                console.error('Delete order error:', err);
                alert("Network connection error.");
            }
        }
    };

    const handleClearCompletedOrders = async () => {
        const token = localStorage.getItem('aura_token');
        try {
            const res = await fetch('http://localhost:5002/api/v1/orders/completed', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const result = await res.json();
                alert(result.message || "Completed orders successfully cleared.");
                await loadOrders();
                if (loadCatalog) {
                    await loadCatalog();
                }
            } else {
                const errResult = await res.json();
                alert(errResult.message || "Failed to clear completed orders.");
            }
        } catch (err) {
            console.error('Clear completed orders error:', err);
            alert("Network connection error.");
        }
    };

    const handlePrintCompletedOrdersReport = () => {
        const completedOrders = orders.filter(o => o.status === 'Completed');
        if (completedOrders.length === 0) {
            alert("No completed orders to print!");
            return;
        }

        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

        // Generate a beautiful, print-ready HTML page
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to print the report.");
            return;
        }

        const ordersHtml = completedOrders.map(o => {
            const itemsList = o.items.map(item => `
                <tr style="border-bottom: 1px solid #E5E7EB;">
                    <td style="padding: 8px; font-weight: 500;">${item.name}</td>
                    <td style="padding: 8px; text-align: center; color: #4B5563;">${item.size}</td>
                    <td style="padding: 8px; text-align: right; color: #111827;">${item.price.toLocaleString()} EGP</td>
                    <td style="padding: 8px; text-align: center; color: #4B5563;">x${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600; color: #111827;">${(item.price * item.quantity).toLocaleString()} EGP</td>
                </tr>
            `).join('');

            return `
            <div style="border: 1px solid #D1D5DB; border-radius: 12px; padding: 20px; margin-bottom: 24px; background: #FFFFFF; page-break-inside: avoid; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 13px; font-weight: 600; color: #C5A880; text-transform: uppercase; letter-spacing: 0.05em;">Order ID</span>
                        <h3 style="margin: 2px 0 0 0; font-size: 18px; color: #111827; font-family: 'Montserrat', sans-serif;">${o.id}</h3>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 13px; font-weight: 600; color: #9CA3AF; text-transform: uppercase;">Date Completed</span>
                        <div style="margin-top: 2px; font-size: 14px; color: #4B5563;">${o.date}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 13px; color: #4B5563;">
                    <div>
                        <strong style="color: #111827; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Customer Info</strong>
                        <span style="font-size: 14px; font-weight: 600; color: #111827; display: block;">${o.name}</span>
                        <span>Phone: ${o.phone}</span>
                        ${o.alternativePhone ? `<br/><span>Alt Phone: ${o.alternativePhone}</span>` : ''}
                    </div>
                    <div>
                        <strong style="color: #111827; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Shipping Details</strong>
                        <span>Address: ${o.address}</span>
                        <br/><span>Payment: ${o.paymentMethod}</span>
                    </div>
                </div>

                ${o.notes ? `
                <div style="background-color: #F9FAFB; padding: 10px; border-left: 3px solid #C5A880; font-size: 12px; margin-bottom: 16px; color: #4B5563; font-style: italic;">
                    <strong>Customer Notes:</strong> "${o.notes}"
                </div>
                ` : ''}

                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 12px;">
                    <thead>
                        <tr style="background-color: #F3F4F6; color: #374151; font-weight: 600;">
                            <th style="padding: 8px;">Product</th>
                            <th style="padding: 8px; text-align: center;">Size</th>
                            <th style="padding: 8px; text-align: right;">Price</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 8px;">
                    <span style="font-weight: 600; color: #4B5563; margin-right: 12px; font-size: 14px;">Order Total:</span>
                    <strong style="color: #C5A880; font-size: 18px;">${o.total.toLocaleString()} EGP</strong>
                </div>
            </div>
            `;
        }).join('');

        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Completed Orders Summary Report - AURA</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Outfit', sans-serif;
                    background-color: #F9FAFB;
                    color: #111827;
                    margin: 0;
                    padding: 40px 20px;
                }
                .report-container {
                    max-width: 900px;
                    margin: 0 auto;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #111827;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo-section h1 {
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    margin: 0;
                    font-size: 28px;
                }
                .logo-section span {
                    color: #C5A880;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .summary-stats {
                    background-color: #111827;
                    color: #FFFFFF;
                    border-radius: 12px;
                    padding: 24px;
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 35px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .stat-box h4 {
                    margin: 0 0 6px 0;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #9CA3AF;
                    letter-spacing: 0.05em;
                }
                .stat-box div {
                    font-size: 24px;
                    font-weight: 700;
                    font-family: 'Montserrat', sans-serif;
                }
                .stat-box.gold div {
                    color: #C5A880;
                }
                @media print {
                    body {
                        background-color: #FFFFFF;
                        padding: 0;
                    }
                    .summary-stats {
                        border: 1px solid #111827;
                        box-shadow: none;
                        color: #111827;
                        background: #FFFFFF;
                    }
                    .stat-box h4 {
                        color: #4B5563;
                    }
                    .stat-box div {
                        color: #111827 !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <header class="report-header">
                    <div class="logo-section">
                        <h1>AURA</h1>
                        <span>Completed Orders Report</span>
                    </div>
                    <div style="text-align: right; font-size: 13px; color: #4B5563;">
                        <strong>Generated On:</strong> ${new Date().toLocaleString('en-US', { hour12: true })}
                    </div>
                </header>

                <section class="summary-stats">
                    <div class="stat-box">
                        <h4>Total Orders</h4>
                        <div>${completedOrders.length}</div>
                    </div>
                    <div class="stat-box gold">
                        <h4>Total Revenue</h4>
                        <div>${totalRevenue.toLocaleString()} EGP</div>
                    </div>
                    <div class="stat-box">
                        <h4>Report Scope</h4>
                        <div style="font-size: 15px; margin-top: 8px;">COMPLETED ONLY</div>
                    </div>
                </section>

                <main>
                    ${ordersHtml}
                </main>

                <footer style="margin-top: 50px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em;">
                    End of Completed Orders Report — AURA Stores
                </footer>
            </div>
        </body>
        </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();

        // Give the styles some time to render then trigger print
        setTimeout(() => {
            printWindow.print();
            
            // After printing, prompt for deletion
            setTimeout(() => {
                if (window.confirm("Completed orders printed. Would you like to permanently clear all completed orders from the database to clean up space?")) {
                    handleClearCompletedOrders();
                }
            }, 500);
        }, 300);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAddNewProductClick = () => {
        resetForm();
        setIsProductModalOpen(true);
    };

    const handleEditClick = (p) => {
        setEditId(p.id);
        setProdName(p.name);
        setProdPrice(p.price);
        setProdImage(p.img);
        setImageFile(null);
        setProdDesc(p.desc);
        setSelectedCats(p.categories || []);
        setDiscountPercent(p.discountPercent || 0);
        setProdStock(p.stock !== undefined ? p.stock : 10);
        setSelectedSizes(p.sizes || ['39', '40', '41', '42', '43', '44', '45']);
        
        // Handle secondary images pre-population
        if (p.images && p.images.length > 0 && !(p.images.length === 1 && p.images[0] === p.img)) {
            setProdImages(p.images.map((img, idx) => ({
                id: `existing-${idx}-${Date.now()}`,
                url: img,
                file: null
            })));
        } else {
            setProdImages([]);
        }
        
        setIsProductModalOpen(true);
    };

    const resetForm = () => {
        setEditId('');
        setProdName('');
        setProdPrice('');
        setProdImage('assets/sneaker_white.png');
        setImageFile(null);
        setProdDesc('');
        setSelectedCats([]);
        setDiscountPercent(0);
        setProdStock(10);
        setSelectedSizes(['39', '40', '41', '42', '43', '44', '45']);
        setProdImages([]);
    };

    const handleSubmitProduct = (e) => {
        e.preventDefault();
        
        const priceVal = parseInt(prodPrice, 10);
        if (isNaN(priceVal)) return;

        const discVal = parseInt(discountPercent, 10);
        const finalDiscount = isNaN(discVal) ? 0 : Math.max(0, Math.min(100, discVal));

        const stockVal = parseInt(prodStock, 10);
        const finalStock = isNaN(stockVal) ? 10 : Math.max(0, stockVal);

        let categoriesList = [...selectedCats];
        if (categoriesList.length === 0) {
            alert("Error: You must select at least one category (e.g. Men, Women, etc.) before saving this product!");
            return;
        }

        if (finalDiscount > 0 && !categoriesList.includes('Offers')) {
            categoriesList.push('Offers');
        } else if (finalDiscount === 0 && categoriesList.includes('Offers')) {
            categoriesList = categoriesList.filter(c => c !== 'Offers');
        }

        const formData = new FormData();
        formData.append('name', prodName.trim());
        formData.append('price', priceVal);
        formData.append('desc', prodDesc.trim());
        formData.append('discountPercent', finalDiscount);
        formData.append('stock', finalStock);
        formData.append('categories', JSON.stringify(categoriesList));
        formData.append('sizes', JSON.stringify(selectedSizes));

        if (imageFile) {
            formData.append('img', imageFile);
        } else {
            // Strip API url prefixes to store clean relative path
            let relativeImg = prodImage;
            if (relativeImg.startsWith('http://localhost:5002/')) {
                relativeImg = relativeImg.replace('http://localhost:5002/', '');
            } else if (relativeImg.startsWith('http://localhost:5000/')) {
                relativeImg = relativeImg.replace('http://localhost:5000/', '');
            }
            formData.append('img', relativeImg);
        }

        // Handle secondary images compilation
        const existingImages = [];
        prodImages.forEach(img => {
            if (img.file === null) {
                let relativeUrl = img.url;
                if (relativeUrl.startsWith('http://localhost:5002/')) {
                    relativeUrl = relativeUrl.replace('http://localhost:5002/', '');
                } else if (relativeUrl.startsWith('http://localhost:5000/')) {
                    relativeUrl = relativeUrl.replace('http://localhost:5000/', '');
                }
                existingImages.push(relativeUrl);
            } else {
                formData.append('images', img.file);
            }
        });
        formData.append('existingImages', JSON.stringify(existingImages));

        if (editId) {
            updateProduct(editId, formData);
        } else {
            addProduct(formData);
        }

        setIsProductModalOpen(false);
        resetForm();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProdImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMultipleImagesUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => {
            return {
                id: `new-${Date.now()}-${Math.random()}`,
                url: URL.createObjectURL(file),
                file: file
            };
        });

        setProdImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveAdditionalImage = (id) => {
        setProdImages(prev => {
            const target = prev.find(img => img.id === id);
            if (target && target.url.startsWith('blob:')) {
                URL.revokeObjectURL(target.url);
            }
            return prev.filter(img => img.id !== id);
        });
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (newCatName.trim()) {
            const success = addCategory(newCatName.trim());
            if (success) {
                setNewCatName('');
            } else {
                alert('Category already exists.');
            }
        }
    };

    const handleDeleteCategory = (cat) => {
        if (['Men', 'Women', 'Offers', 'Special Collection'].includes(cat)) {
            alert('Cannot delete core system categories.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete the category "${cat}"? This will remove it from all products.`)) {
            deleteCategory(cat);
        }
    };

    const triggerDeleteProduct = (p) => {
        setProductToDelete(p);
    };

    const confirmDeleteProduct = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
        }
    };

    // Calculate unique customers list from orders
    const getUniqueCustomers = () => {
        const customerList = [];
        orders.forEach(o => {
            const existing = customerList.find(c => 
                c.phone === o.phone || 
                c.name.toLowerCase() === o.name.toLowerCase()
            );
            if (existing) {
                existing.ordersCount += 1;
                existing.totalSpent += o.total;
            } else {
                customerList.push({
                    name: o.name,
                    email: 'N/A (Guest)',
                    phone: o.phone || 'N/A',
                    ordersCount: 1,
                    totalSpent: o.total
                });
            }
        });

        return customerList.filter(c => 
            c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
            c.phone.includes(custSearch)
        ).sort((a, b) => {
            if (custSort === 'name-asc') return a.name.localeCompare(b.name);
            if (custSort === 'name-desc') return b.name.localeCompare(a.name);
            if (custSort === 'orders-asc') return a.ordersCount - b.ordersCount;
            return b.ordersCount - a.ordersCount;
        });
    };

    // Filtered Products
    const getFilteredProducts = () => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.desc.toLowerCase().includes(prodSearch.toLowerCase());
            const matchesCategory = prodCatFilter === 'All' || (p.categories && p.categories.includes(prodCatFilter));
            let matchesStock = true;
            if (prodStockFilter === 'Low') matchesStock = (p.stock !== undefined ? p.stock : 10) <= 5 && (p.stock !== undefined ? p.stock : 10) > 0;
            if (prodStockFilter === 'Out') matchesStock = (p.stock !== undefined ? p.stock : 10) === 0;

            return matchesSearch && matchesCategory && matchesStock;
        }).sort((a, b) => {
            if (prodSort === 'name-asc') return a.name.localeCompare(b.name);
            if (prodSort === 'name-desc') return b.name.localeCompare(a.name);
            if (prodSort === 'price-asc') return a.price - b.price;
            if (prodSort === 'price-desc') return b.price - a.price;
            if (prodSort === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
            return (b.stock || 0) - (a.stock || 0);
        });
    };

    // Filtered Orders
    const getFilteredOrders = () => {
        return orders.filter(o => {
            const matchesStatus = o.status === activeOrderStatusTab;
            const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                  o.name.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                  o.phone.includes(orderSearch);
            const matchesPayment = orderPaymentFilter === 'All' || o.paymentMethod === orderPaymentFilter;

            return matchesStatus && matchesSearch && matchesPayment;
        }).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (orderSort === 'date-asc') return dateA - dateB;
            if (orderSort === 'date-desc') return dateB - dateA;
            if (orderSort === 'total-asc') return a.total - b.total;
            return b.total - a.total;
        });
    };

    // Metrics calculations
    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
    const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;
    const lowStockCount = products.filter(p => (p.stock !== undefined ? p.stock : 10) <= 5).length;
    const totalRevenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0);
    const lowStockProductsList = products.filter(p => (p.stock !== undefined ? p.stock : 10) <= 5);

    return (
        <div className={`admin-app-wrapper ${theme}-theme`} style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent', fontFamily: 'var(--font-body)' }}>
            <style>{`
                /* CSS Dynamic Theme Variables */
                .dark-theme {
                    --color-primary: #000000;
                    --color-primary-light: transparent;
                    --color-bg-light: rgba(255, 255, 255, 0.02);
                    --color-card-dark: rgba(255, 255, 255, 0.03);
                    --color-text-dark: #F3F4F6;
                    --color-text-muted: #9CA3AF;
                    --border-color: rgba(255, 255, 255, 0.08);
                    --input-bg: rgba(255, 255, 255, 0.05);
                    --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                }
                .light-theme {
                    --color-primary: #FFFFFF;
                    --color-primary-light: #F9FAFB;
                    --color-bg-light: #F3F4F6;
                    --color-card-dark: #FFFFFF;
                    --color-text-dark: #111827;
                    --color-text-muted: #4B5563;
                    --border-color: rgba(0, 0, 0, 0.08);
                    --input-bg: rgba(0, 0, 0, 0.03);
                    --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
                }

                .admin-sidebar {
                    width: 280px;
                    background-color: rgba(10, 10, 10, 0.6) !important;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-right: 1px solid var(--border-color);
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    flex-shrink: 0;
                    color: #FFFFFF;
                }
                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: var(--font-heading);
                    font-weight: 600;
                    font-size: 22px;
                    letter-spacing: 0.15em;
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                }
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 20px;
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.65);
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    border: none;
                    text-align: left;
                    width: 100%;
                    background: none;
                }
                .sidebar-link:hover, .sidebar-link.active {
                    background-color: rgba(197, 168, 128, 0.12);
                    color: var(--color-gold);
                }
                .sidebar-footer {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                    padding-top: 20px;
                }
                .admin-content-area {
                    flex: 1;
                    padding: 40px;
                    overflow-y: auto;
                    color: var(--color-text-dark);
                    background-color: transparent;
                    transition: background-color 0.3s, color 0.3s;
                }
                .admin-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 36px;
                }
                .admin-page-title {
                    font-family: var(--font-heading);
                    font-size: 26px;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    color: var(--color-text-dark);
                }
                .admin-theme-toggle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    background-color: var(--color-card-dark);
                    color: var(--color-text-dark);
                    transition: var(--transition-smooth);
                }
                .admin-theme-toggle:hover {
                    border-color: var(--color-gold);
                }
                
                /* Metrics Cards */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 24px;
                    margin-bottom: 40px;
                }
                .metric-card-premium {
                    background-color: var(--color-card-dark);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: var(--card-shadow);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    color: var(--color-text-dark);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .metric-label-premium {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--color-text-muted);
                }
                .metric-value-premium {
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--color-text-dark);
                }
                .metric-sub {
                    font-size: 11px;
                    color: var(--color-text-muted);
                }
                
                /* Inventory warnings, charts */
                .dashboard-details-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 32px;
                }
                
                /* Controls list - search, sort, filter */
                .controls-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 24px;
                    align-items: center;
                }
                .control-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .control-input-group label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }
                .admin-search-input, .admin-select-input {
                    background-color: var(--input-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: var(--color-text-dark);
                    font-size: 13px;
                    outline: none;
                    transition: var(--transition-smooth);
                }
                .admin-search-input:focus, .admin-select-input:focus {
                    border-color: var(--color-gold);
                }
                .admin-select-input option {
                    background-color: #111827 !important;
                    color: #FFFFFF !important;
                }
                
                /* Styled category toggle tags */
                .cat-tag-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    background-color: transparent;
                    color: var(--color-text-dark);
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .cat-tag-checkbox:hover {
                    border-color: var(--color-gold);
                }
                .cat-tag-checkbox.active {
                    background-color: rgba(197, 168, 128, 0.15);
                    border-color: var(--color-gold);
                    color: var(--color-gold);
                }
                
                /* Tab Bar for Orders */
                .order-tabs-bar {
                    display: flex;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 24px;
                    gap: 16px;
                }
                .order-tab-btn {
                    padding: 12px 16px;
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    position: relative;
                    transition: var(--transition-smooth);
                    background: none;
                    border: none;
                }
                .order-tab-btn.active {
                    color: var(--color-gold);
                }
                .order-tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: var(--color-gold);
                }
                
                /* Confirmation Modal / details modal dialog */
                .admin-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.65);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .admin-modal-box {
                    background-color: var(--color-card-dark);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 600px;
                    width: 100%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    color: var(--color-text-dark);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .inventory-table-container {
                    background-color: var(--color-card-dark);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: var(--card-shadow);
                    overflow-x: auto;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .admin-table th {
                    padding: 12px 16px;
                    border-bottom: 2px solid var(--border-color);
                    font-size: 13px;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }
                .admin-table td {
                    padding: 16px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 13px;
                    vertical-align: middle;
                    color: var(--color-text-dark);
                }
                .admin-table tbody tr {
                    transition: var(--transition-smooth);
                }
                .admin-table tbody tr:hover {
                    background-color: rgba(197, 168, 128, 0.04);
                }
                .inventory-name {
                    font-weight: 600;
                    color: var(--color-text-dark);
                }
                .inventory-price {
                    font-weight: 700;
                    color: var(--color-gold);
                }
                .inventory-desc {
                    color: var(--color-text-muted);
                    max-width: 200px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: block;
                }
                
                /* Sidebar Light Overrides */
                .light-theme .admin-sidebar {
                    background-color: #111827 !important;
                    color: #FFFFFF;
                    border-right-color: rgba(255,255,255,0.05);
                }
                .light-theme .admin-sidebar .sidebar-link {
                    color: rgba(255,255,255,0.7);
                }
                .light-theme .admin-sidebar .sidebar-link.active,
                .light-theme .admin-sidebar .sidebar-link:hover {
                    background-color: rgba(197, 168, 128, 0.15);
                    color: var(--color-gold);
                }
                .light-theme .admin-sidebar .sidebar-footer {
                    border-top-color: rgba(255,255,255,0.08);
                }

                /* Buttons & Actions Styling */
                .action-btn {
                    padding: 6px 14px;
                    font-size: 12px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    border: none;
                    font-family: inherit;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .edit-action {
                    background-color: var(--input-bg);
                    color: var(--color-text-dark);
                    border: 1px solid var(--border-color);
                }
                .edit-action:hover {
                    background-color: var(--color-gold);
                    color: #000000;
                    border-color: var(--color-gold);
                }
                .delete-action {
                    background-color: rgba(239, 68, 68, 0.1);
                    color: #EF4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .delete-action:hover {
                    background-color: #EF4444;
                    color: #FFFFFF;
                    border-color: #EF4444;
                }
                .form-submit-btn {
                    padding: 12px 24px;
                    background-color: var(--color-gold);
                    color: #000000;
                    border: 1px solid var(--color-gold);
                    border-radius: var(--border-radius-pill);
                    font-weight: 600;
                    cursor: pointer;
                    letter-spacing: 0.05em;
                    transition: var(--transition-smooth);
                    font-family: inherit;
                }
                .form-submit-btn:hover {
                    background-color: transparent;
                    color: var(--color-gold);
                    border-color: var(--color-gold);
                }
                .form-cancel-btn {
                    padding: 12px 20px;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-pill);
                    background: none;
                    color: var(--color-text-dark);
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    font-family: inherit;
                }
                .form-cancel-btn:hover {
                    background-color: var(--input-bg);
                    color: var(--color-text-dark);
                }
                .admin-logout-btn:hover {
                    border-color: #EF4444 !important;
                    color: #EF4444 !important;
                    background-color: rgba(239, 68, 68, 0.08) !important;
                }

                @media (max-width: 1024px) {
                    .admin-app-wrapper {
                        flex-direction: column;
                    }
                    .admin-sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                        padding: 20px;
                    }
                    .dashboard-details-row {
                        grid-template-columns: 1fr;
                    }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {/* SIDEBAR NAVIGATION */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg className="brand-logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '64px', height: '64px' }}>
                        <circle cx="60" cy="28" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        <circle cx="60" cy="52" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                        <path d="M 12 105 L 22 85 L 32 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 40 85 L 40 95 C 40 105 60 105 60 95 L 60 85" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 68 105 L 68 85 H 74 C 81 85 81 95 74 95 H 68 M 74 95 L 80 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 96 105 L 106 85 L 116 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="117" y="88" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif" fontWeight="bold">®</text>
                    </svg>
                </div>

                <div className="sidebar-nav">
                    <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <span>Dashboard</span>
                    </button>
                    <button className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <span>Products Manager</span>
                    </button>
                    <button className={`sidebar-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                        <span>Categories</span>
                    </button>
                    <button className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <span>Orders</span>
                    </button>
                    <button className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
                        <span>Customers Tracker</span>
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Admin: {user ? user.name : 'AURA'}</span>
                    </div>
                    <button className="admin-logout-btn" onClick={handleLogout} style={{ width: '100%', padding: '12px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'transparent' }}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="admin-content-area">
                <header className="admin-header-row">
                    <h1 className="admin-page-title">{activeTab.toUpperCase()}</h1>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        System Live • {new Date().toLocaleDateString()}
                    </div>
                </header>

                {/* ========================================================
                    TAB 1: OVERVIEW DASHBOARD
                    ======================================================== */}
                {activeTab === 'dashboard' && (
                    <div>
                        {/* Settings Panel for Coming Soon */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '15px', color: 'var(--color-gold)', margin: '0 0 4px 0', fontWeight: '600', letterSpacing: '0.05em' }}>WOMEN'S COLLECTION STATUS</h3>
                                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.4' }}>
                                    Toggle the "Coming Soon" overlay on the Women category page. If enabled, customers will see the Coming Soon countdown screen.
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: womenSoon ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
                                    {womenSoon ? 'COMING SOON ACTIVE' : 'LIVE CATALOG ACTIVE'}
                                </span>
                                <button 
                                    onClick={handleToggleWomenSoon}
                                    style={{
                                        backgroundColor: womenSoon ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                        border: womenSoon ? '1px solid #EF4444' : '1px solid #10B981',
                                        color: womenSoon ? '#EF4444' : '#10B981',
                                        padding: '10px 20px',
                                        borderRadius: '30px',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        letterSpacing: '0.05em'
                                    }}
                                >
                                    {womenSoon ? 'DISABLE SOON (MAKE LIVE)' : 'ENABLE SOON'}
                                </button>
                            </div>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card-premium">
                                <span className="metric-label-premium">TOTAL REVENUE</span>
                                <div className="metric-value-premium" style={{ color: 'var(--color-gold)' }}>{totalRevenue.toLocaleString()} EGP</div>
                                <span className="metric-sub">From {completedOrdersCount} completed orders</span>
                            </div>
                            <div className="metric-card-premium">
                                <span className="metric-label-premium">TOTAL PRODUCTS</span>
                                <div className="metric-value-premium">{products.length}</div>
                                <span className="metric-sub">{categories.length} active categories</span>
                            </div>
                            <div className="metric-card-premium">
                                <span className="metric-label-premium">INCOMING ORDERS</span>
                                <div className="metric-value-premium">{pendingOrdersCount}</div>
                                <span className="metric-sub">Pending customer verification</span>
                            </div>
                            <div className="metric-card-premium">
                                <span className="metric-label-premium">LOW STOCK ALERT</span>
                                <div className="metric-value-premium" style={{ color: lowStockCount > 0 ? '#EF4444' : 'inherit' }}>{lowStockCount}</div>
                                <span className="metric-sub">Products with stock &le; 5</span>
                            </div>
                        </div>

                        <div className="dashboard-details-row">
                            {/* Inventory Warnings list */}
                            <div className="inventory-table-container">
                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-dark)' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                                    INVENTORY ALERT: LOW STOCK LEVELS
                                </h3>
                                
                                {lowStockProductsList.length === 0 ? (
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '16px 0' }}>All product inventory stock levels are healthy.</div>
                                ) : (
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>IMAGE</th>
                                                <th>PRODUCT MODEL</th>
                                                <th>STOCK LEVEL</th>
                                                <th>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockProductsList.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="inventory-img-box">
                                                            <img src={p.img} alt={p.name} className="inventory-img" />
                                                        </div>
                                                    </td>
                                                    <td><span className="inventory-name">{p.name}</span></td>
                                                    <td>
                                                        <span style={{ fontWeight: '700', color: p.stock === 0 ? '#EF4444' : '#F59E0B' }}>
                                                            {p.stock !== undefined ? p.stock : 10} pieces left
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: p.stock === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: p.stock === 0 ? '#EF4444' : '#F59E0B', fontWeight: '600' }}>
                                                            {p.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Info card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="metric-card-premium">
                                    <span className="metric-label-premium">TOTAL CUSTOMERS</span>
                                    <div className="metric-value-premium">{getUniqueCustomers().length}</div>
                                    <span className="metric-sub">Registered shoppers & guests</span>
                                </div>
                                <div className="metric-card-premium" style={{ backgroundColor: 'rgba(197, 168, 128, 0.05)', borderColor: 'var(--color-gold)' }}>
                                    <span className="metric-label-premium" style={{ color: 'var(--color-gold)' }}>System Insights</span>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-dark)', marginTop: '8px' }}>
                                        Make sure to regularly process pending orders. Transitioning orders to <strong>Completed</strong> automatically deducts stock and locks the transaction details.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 2: PRODUCTS MANAGER
                    ======================================================== */}
                {activeTab === 'products' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* SEARCH & FILTERS CONTROLS */}
                        <div className="controls-row" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', flex: 1 }}>
                                <div className="control-input-group" style={{ minWidth: '220px' }}>
                                    <label htmlFor="p-search">Search Catalog</label>
                                    <input type="text" id="p-search" className="admin-search-input" placeholder="Search by name, desc..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                                </div>
                                <div className="control-input-group">
                                    <label htmlFor="p-cat">Category</label>
                                    <select id="p-cat" className="admin-select-input" value={prodCatFilter} onChange={e => setProdCatFilter(e.target.value)}>
                                        <option value="All">All Categories</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="control-input-group">
                                    <label htmlFor="p-stock">Stock Alert</label>
                                    <select id="p-stock" className="admin-select-input" value={prodStockFilter} onChange={e => setProdStockFilter(e.target.value)}>
                                        <option value="All">All Inventory</option>
                                        <option value="Low">Low Stock (&le;5)</option>
                                        <option value="Out">Out of Stock (0)</option>
                                    </select>
                                </div>
                                <div className="control-input-group">
                                    <label htmlFor="p-sort">Sort By</label>
                                    <select id="p-sort" className="admin-select-input" value={prodSort} onChange={e => setProdSort(e.target.value)}>
                                        <option value="name-asc">Model Name (A-Z)</option>
                                        <option value="name-desc">Model Name (Z-A)</option>
                                        <option value="price-asc">Price (Low to High)</option>
                                        <option value="price-desc">Price (High to Low)</option>
                                        <option value="stock-asc">Stock (Low to High)</option>
                                        <option value="stock-desc">Stock (High to Low)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                <button 
                                    type="button" 
                                    className="form-submit-btn" 
                                    onClick={handleAddNewProductClick}
                                    style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span> ADD NEW SNEAKER
                                </button>
                            </div>
                        </div>

                        {/* LIST TABLE (Full Width) */}
                        <div className="inventory-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>IMAGE</th>
                                        <th>NAME</th>
                                        <th>PRICE</th>
                                        <th>CATEGORIES</th>
                                        <th>STOCK</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredProducts().map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="inventory-img-box">
                                                    <img src={p.img} alt={p.name} className="inventory-img" />
                                                </div>
                                            </td>
                                            <td><span className="inventory-name">{p.name}</span></td>
                                            <td><span className="inventory-price">${p.price}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
                                                    {p.categories && p.categories.map(cat => (
                                                        <span key={cat} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(197, 168, 128, 0.15)', color: 'var(--color-gold)', border: '1px solid rgba(197, 168, 128, 0.2)', fontWeight: '600' }}>
                                                            {cat}
                                                        </span>
                                                    ))}
                                                    {(!p.categories || p.categories.length === 0) && (
                                                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: '600', color: (p.stock || 0) <= 5 ? '#EF4444' : 'inherit' }}>
                                                    {p.stock !== undefined ? p.stock : 10} pcs
                                                </span>
                                                {(p.stock || 0) <= 5 && (
                                                    <span style={{ display: 'block', fontSize: '9px', color: '#EF4444' }}>Low Inventory</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="inventory-actions">
                                                    <button className="action-btn edit-action" onClick={() => handleEditClick(p)}>Edit</button>
                                                    <button className="action-btn delete-action" onClick={() => triggerDeleteProduct(p)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 3: CATEGORIES MANAGER
                    ======================================================== */}
                {activeTab === 'categories' && (
                    <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '400px' }}>
                            <div className="inventory-table-container">
                                <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--color-text-dark)' }}>ACTIVE PRODUCT CATEGORIES</h3>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>CATEGORY NAME</th>
                                            <th>SYSTEM STATUS</th>
                                            <th>PRODUCTS LINKED</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map(cat => {
                                            const isCore = ['Men', 'Women', 'Offers', 'Special Collection'].includes(cat);
                                            const linkedCount = products.filter(p => p.categories && p.categories.includes(cat)).length;
                                            return (
                                                <tr key={cat}>
                                                    <td><strong style={{ color: 'var(--color-gold)' }}>{cat}</strong></td>
                                                    <td>
                                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: isCore ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: isCore ? '#10B981' : 'var(--color-text-muted)', fontWeight: '600' }}>
                                                            {isCore ? 'CORE SYSTEM' : 'CUSTOM'}
                                                        </span>
                                                    </td>
                                                    <td>{linkedCount} items</td>
                                                    <td>
                                                        {!isCore ? (
                                                            <button className="action-btn delete-action" onClick={() => handleDeleteCategory(cat)}>Delete</button>
                                                        ) : (
                                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Locked</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-form-container" style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--color-card-dark)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                            <h3 style={{ color: 'var(--color-gold)', marginBottom: '16px' }}>CREATE CATEGORY</h3>
                            <form className="admin-form" onSubmit={handleAddCategory}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label htmlFor="new-cat">Category Name</label>
                                    <input type="text" id="new-cat" required placeholder="e.g. Summer Drop" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                                </div>
                                <button type="submit" className="form-submit-btn" style={{ width: '100%', marginTop: '16px' }}>
                                    ADD CATEGORY
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 4: ORDERS MANAGER
                    ======================================================== */}
                {activeTab === 'orders' && (
                    <div>
                        {/* TAB BAR BY STATUS */}
                        <div className="order-tabs-bar">
                            {['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(status => {
                                const count = orders.filter(o => o.status === status).length;
                                return (
                                    <button 
                                        key={status} 
                                        className={`order-tab-btn ${activeOrderStatusTab === status ? 'active' : ''}`}
                                        onClick={() => setActiveOrderStatusTab(status)}
                                    >
                                        {status.toUpperCase()} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* FILTERS */}
                        <div className="controls-row">
                            <div className="control-input-group" style={{ flex: 1 }}>
                                <label htmlFor="ord-search">Search Orders</label>
                                <input type="text" id="ord-search" className="admin-search-input" placeholder="Search by ID, name, phone..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                            </div>
                            <div className="control-input-group">
                                <label htmlFor="ord-pay">Payment Mode</label>
                                <select id="ord-pay" className="admin-select-input" value={orderPaymentFilter} onChange={e => setOrderPaymentFilter(e.target.value)}>
                                    <option value="All">All Payments</option>
                                    <option value="Cash on Delivery">Cash on Delivery</option>
                                    <option value="Visa / Credit Card">Visa / Credit Card</option>
                                </select>
                            </div>
                            <div className="control-input-group">
                                <label htmlFor="ord-sort">Sort By</label>
                                <select id="ord-sort" className="admin-select-input" value={orderSort} onChange={e => setOrderSort(e.target.value)}>
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="total-desc">Total (High to Low)</option>
                                    <option value="total-asc">Total (Low to High)</option>
                                </select>
                            </div>
                        </div>

                        {activeOrderStatusTab === 'Completed' && orders.filter(o => o.status === 'Completed').length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px', padding: '0 4px' }}>
                                <button 
                                    type="button"
                                    className="action-btn edit-action" 
                                    onClick={handlePrintCompletedOrdersReport}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: '600' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                    Print Completed Orders Report
                                </button>
                                <button 
                                    type="button"
                                    className="action-btn delete-action" 
                                    onClick={handleClearCompletedOrders}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: '600' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    Clear Completed Orders
                                </button>
                            </div>
                        )}

                        {/* LIST TABLE */}
                        <div className="inventory-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ORDER ID</th>
                                        <th>CUSTOMER</th>
                                        <th>PAYMENT METHOD</th>
                                        <th>ITEMS COUNT</th>
                                        <th>TOTAL VALUE</th>
                                        <th>QUICK ACTION</th>
                                        <th>VIEW DETAILS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredOrders().length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                                                No orders match this status or filter query.
                                            </td>
                                        </tr>
                                    ) : (
                                        getFilteredOrders().map(o => (
                                            <tr key={o.id}>
                                                <td><span style={{ fontWeight: '600', color: 'var(--color-gold)' }}>{o.id}</span><br /><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{o.date}</span></td>
                                                <td><strong>{o.name}</strong><br /><span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{o.phone}</span></td>
                                                <td>{o.paymentMethod || 'Cash on Delivery'}</td>
                                                <td>{o.items.reduce((sum, it) => sum + it.quantity, 0)} item(s)</td>
                                                <td><strong style={{ color: 'var(--color-gold)' }}>{o.total.toLocaleString()} EGP</strong></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {o.status === 'Pending' && (
                                                            <>
                                                                <button className="action-btn edit-action" onClick={() => handleUpdateOrderStatus(o.id, 'Processing')}>Process</button>
                                                                <button className="action-btn delete-action" onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}>Cancel</button>
                                                            </>
                                                        )}
                                                        {o.status === 'Processing' && (
                                                            <>
                                                                <button className="action-btn edit-action" onClick={() => handleUpdateOrderStatus(o.id, 'Shipped')}>Ship</button>
                                                                <button className="action-btn delete-action" onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}>Cancel</button>
                                                            </>
                                                        )}
                                                        {o.status === 'Shipped' && (
                                                            <>
                                                                <button className="action-btn edit-action" onClick={() => handleUpdateOrderStatus(o.id, 'Completed')} style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}>Deliver</button>
                                                                <button className="action-btn delete-action" onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}>Cancel</button>
                                                            </>
                                                        )}
                                                        {o.status === 'Completed' && (
                                                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Completed ✓</span>
                                                        )}
                                                        {o.status === 'Cancelled' && (
                                                            <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>Cancelled ✗</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="action-btn edit-action" onClick={() => setSelectedOrderDetails(o)}>Details</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 5: CUSTOMERS TRACKER
                    ======================================================== */}
                {activeTab === 'customers' && (
                    <div>
                        {/* SEARCH & SORT */}
                        <div className="controls-row">
                            <div className="control-input-group" style={{ flex: 1 }}>
                                <label htmlFor="c-search">Search Customers</label>
                                <input type="text" id="c-search" className="admin-search-input" placeholder="Search by name, email..." value={custSearch} onChange={e => setCustSearch(e.target.value)} />
                            </div>
                            <div className="control-input-group">
                                <label htmlFor="c-sort">Sort By</label>
                                <select id="c-sort" className="admin-select-input" value={custSort} onChange={e => setCustSort(e.target.value)}>
                                    <option value="orders-desc">Orders Placed (High-Low)</option>
                                    <option value="orders-asc">Orders Placed (Low-High)</option>
                                    <option value="name-asc">Customer Name (A-Z)</option>
                                    <option value="name-desc">Customer Name (Z-A)</option>
                                </select>
                            </div>
                        </div>

                        {/* LIST TABLE */}
                        <div className="inventory-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>CUSTOMER NAME</th>
                                        <th>EMAIL ADDRESS</th>
                                        <th>PHONE NUMBER</th>
                                        <th>TOTAL ORDERS PLACED</th>
                                        <th>TOTAL REVENUE SPENT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getUniqueCustomers().length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                                                No shoppers registered or found matching search criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        getUniqueCustomers().map((c, index) => (
                                            <tr key={index}>
                                                <td><strong>{c.name}</strong></td>
                                                <td>{c.email}</td>
                                                <td><span style={{ color: 'var(--color-gold)' }}>{c.phone}</span></td>
                                                <td>{c.ordersCount} order(s)</td>
                                                <td><strong style={{ color: 'var(--color-gold)' }}>{c.totalSpent.toLocaleString()} EGP</strong></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* ADD / EDIT PRODUCT MODAL */}
            {isProductModalOpen && (
                <div className="admin-modal-backdrop" onClick={(e) => e.target.classList.contains('admin-modal-backdrop') && setIsProductModalOpen(false)}>
                    <div className="admin-modal-box" style={{ maxWidth: '550px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-gold)' }}>
                                {editId ? 'EDIT SNEAKER MODEL' : 'ADD NEW SNEAKER'}
                            </h3>
                            <button onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--color-text-muted)', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none' }}>&times;</button>
                        </div>
                        
                        <form className="admin-form" onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="prod-name">Sneaker Model Name</label>
                                <input type="text" id="prod-name" required placeholder="e.g. AURA RETRO (WHITE)" value={prodName} onChange={e => setProdName(e.target.value)} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label htmlFor="prod-price">Retail Price ($)</label>
                                    <input type="number" id="prod-price" required placeholder="e.g. 190" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label htmlFor="prod-stock">Stock Quantity</label>
                                    <input type="number" id="prod-stock" min="0" required placeholder="e.g. 15" value={prodStock} onChange={e => setProdStock(parseInt(e.target.value, 10) || 0)} />
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="prod-image">Image File / Path</label>
                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    <input type="text" id="prod-image" required placeholder="assets/sneaker_white.png or upload below" value={prodImage} onChange={e => setProdImage(e.target.value)} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="file" id="p-img-file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                        <button type="button" className="action-btn edit-action" onClick={() => document.getElementById('p-img-file').click()} style={{ padding: '8px 12px', fontSize: '11px' }}>
                                            Upload Local Image
                                        </button>
                                        {prodImage && prodImage.startsWith('data:') && (
                                            <span style={{ fontSize: '11px', color: 'var(--color-gold)' }}>✓ File Loaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Images Section */}
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label>Secondary Sneaker Images (Optional)</label>
                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="file" id="p-additional-imgs" accept="image/*" multiple style={{ display: 'none' }} onChange={handleMultipleImagesUpload} />
                                        <button type="button" className="action-btn edit-action" onClick={() => document.getElementById('p-additional-imgs').click()} style={{ padding: '8px 12px', fontSize: '11px' }}>
                                            Add More Images
                                        </button>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                            {prodImages.length} image(s) added
                                        </span>
                                    </div>
                                    {prodImages.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', backgroundColor: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                            {prodImages.map((img) => (
                                                <div key={img.id} style={{ position: 'relative', width: '64px', height: '52px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
                                                    <img src={img.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveAdditionalImage(img.id)}
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: '2px', 
                                                            right: '2px', 
                                                            backgroundColor: 'rgba(239, 68, 68, 0.9)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '50%', 
                                                            width: '16px', 
                                                            height: '16px', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            fontSize: '10px', 
                                                            cursor: 'pointer',
                                                            lineHeight: '1',
                                                            padding: '0'
                                                        }}
                                                        title="Remove Image"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label>Categories (Select Multiple)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                    {categories.map(cat => {
                                        const isActive = selectedCats.includes(cat);
                                        return (
                                            <button 
                                                type="button" 
                                                key={cat} 
                                                className={`cat-tag-checkbox ${isActive ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (isActive) {
                                                        setSelectedCats(selectedCats.filter(c => c !== cat));
                                                    } else {
                                                        setSelectedCats([...selectedCats, cat]);
                                                    }
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                             <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="prod-discount">Discount Percentage (%)</label>
                                <input type="number" id="prod-discount" min="0" max="100" placeholder="e.g. 20 (optional)" value={discountPercent === 0 ? '' : discountPercent} onChange={e => setDiscountPercent(parseInt(e.target.value, 10) || 0)} />
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label>Available Sizes (Select Multiple)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                    {['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(sz => {
                                        const isActive = selectedSizes.includes(sz);
                                        return (
                                            <button 
                                                type="button" 
                                                key={sz} 
                                                className={`cat-tag-checkbox ${isActive ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (isActive) {
                                                        setSelectedSizes(selectedSizes.filter(s => s !== sz));
                                                    } else {
                                                        setSelectedSizes([...selectedSizes, sz]);
                                                    }
                                                }}
                                            >
                                                {sz}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="prod-desc">Description Details</label>
                                <textarea id="prod-desc" rows="3" required placeholder="Product features, materials and fit..." value={prodDesc} onChange={e => setProdDesc(e.target.value)} style={{ resize: 'none' }}></textarea>
                            </div>

                            <div className="form-btns-row" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="form-cancel-btn" onClick={() => setIsProductModalOpen(false)} style={{ flex: 1 }}>
                                    CANCEL
                                </button>
                                <button type="submit" className="form-submit-btn" style={{ flex: 2 }}>
                                    {editId ? 'SAVE CHANGES' : 'ADD SNEAKER'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ORDER DETAILS MODAL */}
            {selectedOrderDetails && (
                <div className="admin-modal-backdrop" onClick={(e) => e.target.classList.contains('admin-modal-backdrop') && setSelectedOrderDetails(null)}>
                    <div className="admin-modal-box" style={{ maxWidth: '750px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                                ORDER DETAILS: <span style={{ color: 'var(--color-gold)' }}>{selectedOrderDetails.id}</span>
                            </h2>
                            <button onClick={() => setSelectedOrderDetails(null)} style={{ color: 'var(--color-text-muted)', fontSize: '20px', cursor: 'pointer', background: 'none', border: 'none' }}>&times;</button>
                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>CUSTOMER NAME</span>
                                <strong style={{ fontSize: '14px' }}>{selectedOrderDetails.name}</strong>
                                
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginTop: '12px' }}>PHONE NUMBER</span>
                                <strong>{selectedOrderDetails.phone}</strong>
                                
                                {selectedOrderDetails.alternativePhone && (
                                    <>
                                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginTop: '12px' }}>ALTERNATIVE PHONE</span>
                                        <strong>{selectedOrderDetails.alternativePhone}</strong>
                                    </>
                                )}

                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginTop: '12px' }}>SHIPPING ADDRESS</span>
                                <span style={{ fontStyle: 'italic' }}>{selectedOrderDetails.address}</span>
                            </div>
                            
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>ORDER DATE</span>
                                <strong>{selectedOrderDetails.date}</strong>
                                
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginTop: '12px' }}>PAYMENT METHOD</span>
                                <strong>{selectedOrderDetails.paymentMethod || 'Cash on Delivery'}</strong>
                                
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginTop: '12px' }}>ADDITIONAL NOTES</span>
                                <span style={{ fontStyle: 'italic', color: selectedOrderDetails.notes ? 'inherit' : 'var(--color-text-muted)' }}>
                                    {selectedOrderDetails.notes || 'No notes left by customer.'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>PRODUCTS ORDERED</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                                {selectedOrderDetails.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--input-bg)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={item.img} alt={item.name} style={{ width: '40px', height: '32px', objectFit: 'contain' }} />
                                            <div>
                                                <span style={{ fontWeight: '600', fontSize: '13px' }}>{item.name}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Size: {item.size}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px' }}>
                                            {item.quantity} x {item.price} EGP = <strong>{item.quantity * item.price} EGP</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '15px' }}>
                                <span>Total Price:</span>
                                <strong style={{ color: 'var(--color-gold)', fontSize: '17px' }}>{selectedOrderDetails.total.toLocaleString()} EGP</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '12px', marginRight: '8px' }}>Status:</span>
                                <select 
                                    className="admin-select-input" 
                                    value={selectedOrderDetails.status} 
                                    onChange={(e) => handleUpdateOrderStatus(selectedOrderDetails.id, e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="action-btn delete-action" onClick={() => handleDeleteOrder(selectedOrderDetails.id)}>Delete Order</button>
                                <button className="action-btn edit-action" onClick={() => setSelectedOrderDetails(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT DELETE CONFIRMATION MODAL */}
            {productToDelete && (
                <div className="admin-modal-backdrop" onClick={(e) => e.target.classList.contains('admin-modal-backdrop') && setProductToDelete(null)}>
                    <div className="admin-modal-box" style={{ maxWidth: '420px', textAlign: 'center' }}>
                        <div style={{ color: '#EF4444', fontSize: '32px', marginBottom: '12px' }}>⚠</div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>CONFIRM PRODUCT DELETION</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
                            Are you sure you want to permanently delete <strong>{productToDelete.name}</strong> from the catalog? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="form-cancel-btn" onClick={() => setProductToDelete(null)} style={{ flex: 1 }}>
                                CANCEL
                            </button>
                            <button className="form-submit-btn" onClick={confirmDeleteProduct} style={{ flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }}>
                                CONFIRM DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time Order Toast alert banner */}
            {realtimeToast && (
                <div className="realtime-toast-alert" style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: 'rgba(197, 168, 128, 0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--color-gold)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    color: '#FFFFFF',
                    maxWidth: '360px',
                    animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981' }}></span>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gold)' }}>Incoming Order</span>
                        <button onClick={() => setRealtimeToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        {realtimeToast.customerName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                        Placed order <strong>{realtimeToast.orderId}</strong> for a total of <span style={{ color: 'var(--color-gold)', fontWeight: '700' }}>{realtimeToast.total.toLocaleString()} EGP</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
