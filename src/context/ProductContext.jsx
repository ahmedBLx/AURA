import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/$/, '');
    const API_URL = `${BASE_URL}/api/v1`;

    // Helper to get auth header
    const getHeaders = () => {
        const token = localStorage.getItem('aura_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    // Helper to map DB product to UI format
    const mapProduct = (p) => {
        const imgUrl = p.img && (p.img.startsWith('http') || p.img.startsWith('assets') || p.img.startsWith('data:'))
            ? p.img 
            : `${BASE_URL}/${p.img}`;
        const imagesList = p.images && p.images.length > 0
            ? p.images.map(img => img && (img.startsWith('http') || img.startsWith('assets') || img.startsWith('data:'))
                ? img
                : `${BASE_URL}/${img}`)
            : [imgUrl];
        return {
            id: p._id || p.id,
            name: p.name,
            price: p.price,
            img: imgUrl,
            images: imagesList,
            desc: p.desc,
            discountPercent: p.discountPercent || 0,
            isMen: p.categories?.includes('Men') || false,
            isWomen: p.categories?.includes('Women') || false,
            stock: p.stock !== undefined ? p.stock : 10,
            categories: p.categories || [],
            sizes: p.sizes || []
        };
    };

    // Fetch products and categories
    const loadCatalog = async () => {
        try {
            // Load Categories
            const catRes = await fetch(`${API_URL}/categories`);
            let mappedCats = ['Men', 'Women', 'Offers', 'Special Collection'];
            if (catRes.ok) {
                const catResult = await catRes.json();
                if (catResult.data?.categories?.length > 0) {
                    mappedCats = catResult.data.categories.map(c => c.name);
                }
            }
            setCategories(mappedCats);

            // Load Products
            const prodRes = await fetch(`${API_URL}/products?limit=100`);
            if (prodRes.ok) {
                const prodResult = await prodRes.json();
                const items = prodResult.data.products || [];
                setProducts(items.map(mapProduct));
            }
        } catch (err) {
            console.error('Failed to load catalog:', err);
            // Fallback to offline localStorage
            const storedProducts = JSON.parse(localStorage.getItem('aura_products'));
            if (storedProducts) {
                setProducts(storedProducts);
            }
            const storedCategories = JSON.parse(localStorage.getItem('aura_categories'));
            if (storedCategories) {
                setCategories(storedCategories);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCatalog();
    }, []);

    useEffect(() => {
        if (products && products.length > 0) {
            localStorage.setItem('aura_products', JSON.stringify(products));
        }
    }, [products]);

    useEffect(() => {
        if (categories && categories.length > 0) {
            localStorage.setItem('aura_categories', JSON.stringify(categories));
        }
    }, [categories]);

    const addProduct = async (product) => {
        try {
            const isFormData = product instanceof FormData;
            const headers = { ...getHeaders() };
            if (isFormData) {
                delete headers['Content-Type'];
            }

            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers,
                body: isFormData ? product : JSON.stringify(product)
            });

            if (res.ok) {
                const result = await res.json();
                const newProd = mapProduct(result.data.product);
                setProducts(prev => [...prev, newProd]);
                return { success: true };
            } else {
                const errResult = await res.json();
                return { success: false, message: errResult.message || "Failed to add product." };
            }
        } catch (err) {
            console.error('Add product error:', err);
            return { success: false, message: "Network connection error." };
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            // Find _id from local id mapping (e.g. nomad -> _id)
            const localProd = products.find(p => p.id === id);
            const dbId = localProd ? localProd.id : id;

            const isFormData = updatedProduct instanceof FormData;
            const headers = { ...getHeaders() };
            if (isFormData) {
                delete headers['Content-Type'];
            }

            const res = await fetch(`${API_URL}/products/${dbId}`, {
                method: 'PATCH',
                headers,
                body: isFormData ? updatedProduct : JSON.stringify(updatedProduct)
            });

            if (res.ok) {
                const result = await res.json();
                const updated = mapProduct(result.data.product);
                setProducts(prev => prev.map(p => p.id === id ? updated : p));
                return { success: true };
            } else {
                const errResult = await res.json();
                return { success: false, message: errResult.message || "Failed to update product." };
            }
        } catch (err) {
            console.error('Update product error:', err);
            return { success: false, message: "Network connection error." };
        }
    };

    const deleteProduct = async (id) => {
        try {
            const localProd = products.find(p => p.id === id);
            const dbId = localProd ? localProd.id : id;

            const res = await fetch(`${API_URL}/products/${dbId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
                return { success: true };
            } else {
                const errResult = await res.json();
                return { success: false, message: errResult.message || "Failed to delete product." };
            }
        } catch (err) {
            console.error('Delete product error:', err);
            return { success: false, message: "Network connection error." };
        }
    };

    const addCategory = async (categoryName) => {
        const name = categoryName.trim();
        if (!name) return false;

        try {
            const res = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                setCategories(prev => [...prev, name]);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Add category error:', err);
            return false;
        }
    };

    const deleteCategory = async (categoryName) => {
        try {
            const res = await fetch(`${API_URL}/categories/${encodeURIComponent(categoryName)}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (res.ok) {
                setCategories(prev => prev.filter(c => c !== categoryName));
                // Remove category from products locally
                setProducts(prev => prev.map(p => {
                    if (p.categories && p.categories.includes(categoryName)) {
                        return { ...p, categories: p.categories.filter(c => c !== categoryName) };
                    }
                    return p;
                }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Delete category error:', err);
            return false;
        }
    };

    return (
        <ProductContext.Provider value={{ products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, loading, loadCatalog }}>
            {!loading && children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
