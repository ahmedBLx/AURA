'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // Full category objects { _id, name, parent, showOnHomepage }
    const [loading, setLoading] = useState(true);

    const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

    // Helper to map DB product to UI format
    const mapProduct = useCallback((p) => {
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
    }, [BASE_URL]);

    // Map DB category to UI format
    const mapCategory = useCallback((c, allCats = []) => {
        const parentId = c.parent ? (typeof c.parent === 'object' ? c.parent._id || c.parent : c.parent) : null;
        let parentName = null;
        if (c.parent && typeof c.parent === 'object' && c.parent.name) {
            parentName = c.parent.name;
        } else if (parentId) {
            const foundParent = allCats.find(cat => cat._id === parentId);
            if (foundParent) {
                parentName = foundParent.name;
            }
        }
        return {
            _id: c._id,
            name: c.name,
            parent: parentId ? { _id: parentId } : null,
            parentName: parentName,
            showOnHomepage: c.showOnHomepage || false,
        };
    }, []);

    // Derived: flat list of category names (backward compat)
    const categoryNames = useMemo(() => categories.map(c => c.name), [categories]);

    // Derived: main (root) categories
    const mainCategories = useMemo(() => categories.filter(c => !c.parent), [categories]);

    // Derived: sub-categories grouped by parent name
    const getSubcategories = useCallback((parentName) => {
        return categories.filter(c => c.parentName === parentName);
    }, [categories]);

    // Derived: homepage categories
    const homepageCategories = useMemo(() => categories.filter(c => c.showOnHomepage && c.parent), [categories]);

    // Fetch products and categories
    const loadCatalog = useCallback(async (signal) => {
        try {
            // Load Categories
            const catResult = await apiClient.get('categories', { signal });
            if (signal?.aborted) return;
            let mappedCats = [];
            if (catResult.data?.categories?.length > 0) {
                const rawCats = catResult.data.categories;
                mappedCats = rawCats.map(c => mapCategory(c, rawCats));
            }
            // If no categories from API, seed default main categories as objects
            if (mappedCats.length === 0) {
                mappedCats = [
                    { _id: 'men', name: 'Men', parent: null, parentName: null, showOnHomepage: false },
                    { _id: 'women', name: 'Women', parent: null, parentName: null, showOnHomepage: false },
                    { _id: 'offers', name: 'Offers', parent: null, parentName: null, showOnHomepage: false },
                    { _id: 'special', name: 'Special Collection', parent: null, parentName: null, showOnHomepage: false },
                ];
            }
            setCategories(mappedCats);

            // Load Products
            const prodResult = await apiClient.get('products?limit=100', { signal });
            if (signal?.aborted) return;
            const items = prodResult.data.products || [];
            setProducts(items.map(mapProduct));
        } catch (err) {
            if (err.name === 'AbortError') return;
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
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [mapCategory, mapProduct]);

    useEffect(() => {
        const controller = new AbortController();
        loadCatalog(controller.signal);
        return () => {
            controller.abort();
        };
    }, [loadCatalog]);

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

    const uploadFileToCloudinary = useCallback(async (file, sigData) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            throw new Error('Cloudinary client upload failed');
        }
        const result = await res.json();
        return result.secure_url;
    }, []);

    const processClientSideUploadAndSubmit = useCallback(async (formData, method, url, sigData) => {
        const jsonBody = {};
        
        // Retrieve simple fields
        const fields = ['name', 'price', 'desc', 'discountPercent', 'stock', 'categories', 'sizes'];
        fields.forEach(f => {
            const val = formData.get(f);
            if (val !== null) {
                jsonBody[f] = val;
            }
        });

        // Upload primary image if it's a File
        const imgField = formData.get('img');
        if (imgField instanceof File) {
            jsonBody.img = await uploadFileToCloudinary(imgField, sigData);
        } else if (imgField) {
            jsonBody.img = imgField;
        }

        // Upload new secondary images
        const secondaryImages = formData.getAll('images');
        const uploadedUrls = [];
        for (const file of secondaryImages) {
            if (file instanceof File) {
                const url = await uploadFileToCloudinary(file, sigData);
                uploadedUrls.push(url);
            }
        }

        // Existing images
        let finalImages = [];
        const existingImagesStr = formData.get('existingImages');
        if (existingImagesStr) {
            try {
                finalImages = JSON.parse(existingImagesStr);
            } catch (e) {
                finalImages = [];
            }
        }

        jsonBody.images = [...finalImages, ...uploadedUrls];

        // Submit JSON to backend
        return await apiClient.request(url, {
            method,
            body: jsonBody
        });
    }, [uploadFileToCloudinary]);

    const addProduct = useCallback(async (product) => {
        try {
            const isFormData = product instanceof FormData;
            let result;

            if (isFormData) {
                // Try client-side upload first
                let useClientUpload = false;
                let sigData = null;
                try {
                    const sigResult = await apiClient.get('products/upload-signature');
                    if (sigResult && sigResult.status === 'success' && !sigResult.data.useLocalFallback) {
                        sigData = sigResult.data;
                        useClientUpload = true;
                    }
                } catch (err) {
                    console.warn('Failed to fetch upload signature, falling back to server-side upload:', err);
                }

                if (useClientUpload && sigData) {
                    result = await processClientSideUploadAndSubmit(product, 'POST', 'products', sigData);
                } else {
                    result = await apiClient.post('products', product);
                }
            } else {
                result = await apiClient.post('products', product);
            }

            const newProd = mapProduct(result.data.product);
            setProducts(prev => [...prev, newProd]);
            return { success: true };
        } catch (err) {
            console.error('Add product error:', err);
            return { success: false, message: err.message || "Failed to add product." };
        }
    }, [processClientSideUploadAndSubmit, mapProduct]);

    const updateProduct = useCallback(async (id, updatedProduct) => {
        try {
            const isFormData = updatedProduct instanceof FormData;
            let result;

            if (isFormData) {
                // Try client-side upload first
                let useClientUpload = false;
                let sigData = null;
                try {
                    const sigResult = await apiClient.get('products/upload-signature');
                    if (sigResult && sigResult.status === 'success' && !sigResult.data.useLocalFallback) {
                        sigData = sigResult.data;
                        useClientUpload = true;
                    }
                } catch (err) {
                    console.warn('Failed to fetch upload signature, falling back to server-side upload:', err);
                }

                if (useClientUpload && sigData) {
                    result = await processClientSideUploadAndSubmit(updatedProduct, 'PATCH', `products/${id}`, sigData);
                } else {
                    result = await apiClient.patch(`products/${id}`, updatedProduct);
                }
            } else {
                result = await apiClient.patch(`products/${id}`, updatedProduct);
            }

            const updated = mapProduct(result.data.product);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return { success: true };
        } catch (err) {
            console.error('Update product error:', err);
            return { success: false, message: err.message || "Failed to update product." };
        }
    }, [processClientSideUploadAndSubmit, mapProduct]);

    const deleteProduct = useCallback(async (id) => {
        try {
            await apiClient.delete(`products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Delete product error:', err);
            return { success: false, message: err.message || "Failed to delete product." };
        }
    }, []);

    const addCategory = useCallback(async (categoryName, parentId = null, showOnHomepage = false) => {
        const name = categoryName.trim();
        if (!name) return false;

        try {
            const result = await apiClient.post('categories', { name, parentId, showOnHomepage });
            setCategories(prev => {
                const newCat = mapCategory(result.data.category, prev);
                return [...prev, newCat];
            });
            return true;
        } catch (err) {
            console.error('Add category error:', err);
            return false;
        }
    }, [mapCategory]);

    const updateCategory = useCallback(async (categoryId, updates) => {
        try {
            const result = await apiClient.patch(`categories/${categoryId}`, updates);
            setCategories(prev => {
                const updatedCat = mapCategory(result.data.category, prev);
                return prev.map(c => c._id === categoryId ? updatedCat : c);
            });
            return true;
        } catch (err) {
            console.error('Update category error:', err);
            return false;
        }
    }, [mapCategory]);

    const deleteCategory = useCallback(async (categoryName) => {
        try {
            await apiClient.delete(`categories/${encodeURIComponent(categoryName)}`);
            setCategories(prev => prev.filter(c => c.name !== categoryName));
            // Remove category from products locally
            setProducts(prev => prev.map(p => {
                if (p.categories && p.categories.includes(categoryName)) {
                    return { ...p, categories: p.categories.filter(c => c !== categoryName) };
                }
                return p;
            }));
            return true;
        } catch (err) {
            console.error('Delete category error:', err);
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        products,
        categories,         // Full category objects
        categoryNames,      // Flat name array (backward compat)
        mainCategories,     // Root categories only
        getSubcategories,   // Function: (parentName) => sub-cats
        homepageCategories, // Categories with showOnHomepage=true
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        loading,
        loadCatalog
    }), [
        products,
        categories,
        categoryNames,
        mainCategories,
        getSubcategories,
        homepageCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        loading,
        loadCatalog
    ]);

    return (
        <ProductContext.Provider value={value}>
            {/* Render children immediately — don't blank the whole app while the
                catalog loads. A slow/failed catalog fetch must not lock the UI;
                consumers already handle empty products/categories. */}
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
