import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // Full category objects { _id, name, parent, showOnHomepage }
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

    // Map DB category to UI format
    const mapCategory = (c, allCats = []) => {
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
    };

    // Derived: flat list of category names (backward compat)
    const categoryNames = categories.map(c => c.name);

    // Derived: main (root) categories
    const mainCategories = categories.filter(c => !c.parent);

    // Derived: sub-categories grouped by parent name
    const getSubcategories = (parentName) => {
        return categories.filter(c => c.parentName === parentName);
    };

    // Derived: homepage categories
    const homepageCategories = categories.filter(c => c.showOnHomepage && c.parent);

    // Fetch products and categories
    const loadCatalog = async () => {
        try {
            // Load Categories
            const catRes = await fetch(`${API_URL}/categories`);
            if (!catRes.ok) {
                throw new Error(`Categories API returned status ${catRes.status}`);
            }
            const catResult = await catRes.json();
            let mappedCats = [];
            if (catResult.data?.categories?.length > 0) {
                mappedCats = catResult.data.categories.map(mapCategory);
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
            const prodRes = await fetch(`${API_URL}/products?limit=100`);
            if (!prodRes.ok) {
                throw new Error(`Products API returned status ${prodRes.status}`);
            }
            const prodResult = await prodRes.json();
            const items = prodResult.data.products || [];
            setProducts(items.map(mapProduct));
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

    const uploadFileToCloudinary = async (file, sigData) => {
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
    };

    const processClientSideUploadAndSubmit = async (formData, method, url, sigData) => {
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
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(jsonBody)
        });
        return res;
    };

    const addProduct = async (product) => {
        try {
            const isFormData = product instanceof FormData;
            let res;

            if (isFormData) {
                // Try client-side upload first
                let useClientUpload = false;
                let sigData = null;
                try {
                    const sigRes = await fetch(`${API_URL}/products/upload-signature`, {
                        headers: getHeaders()
                    });
                    if (sigRes.ok) {
                        const sigResult = await sigRes.json();
                        if (sigResult && sigResult.status === 'success' && !sigResult.data.useLocalFallback) {
                            sigData = sigResult.data;
                            useClientUpload = true;
                        }
                    }
                } catch (err) {
                    console.warn('Failed to fetch upload signature, falling back to server-side upload:', err);
                }

                if (useClientUpload && sigData) {
                    res = await processClientSideUploadAndSubmit(product, 'POST', `${API_URL}/products`, sigData);
                } else {
                    const headers = { ...getHeaders() };
                    delete headers['Content-Type'];
                    res = await fetch(`${API_URL}/products`, {
                        method: 'POST',
                        headers,
                        body: product
                    });
                }
            } else {
                res = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(product)
                });
            }

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
            const localProd = products.find(p => p.id === id);
            const dbId = localProd ? localProd.id : id;

            const isFormData = updatedProduct instanceof FormData;
            let res;

            if (isFormData) {
                // Try client-side upload first
                let useClientUpload = false;
                let sigData = null;
                try {
                    const sigRes = await fetch(`${API_URL}/products/upload-signature`, {
                        headers: getHeaders()
                    });
                    if (sigRes.ok) {
                        const sigResult = await sigRes.json();
                        if (sigResult && sigResult.status === 'success' && !sigResult.data.useLocalFallback) {
                            sigData = sigResult.data;
                            useClientUpload = true;
                        }
                    }
                } catch (err) {
                    console.warn('Failed to fetch upload signature, falling back to server-side upload:', err);
                }

                if (useClientUpload && sigData) {
                    res = await processClientSideUploadAndSubmit(updatedProduct, 'PATCH', `${API_URL}/products/${dbId}`, sigData);
                } else {
                    const headers = { ...getHeaders() };
                    delete headers['Content-Type'];
                    res = await fetch(`${API_URL}/products/${dbId}`, {
                        method: 'PATCH',
                        headers,
                        body: updatedProduct
                    });
                }
            } else {
                res = await fetch(`${API_URL}/products/${dbId}`, {
                    method: 'PATCH',
                    headers: getHeaders(),
                    body: JSON.stringify(updatedProduct)
                });
            }

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

    const addCategory = async (categoryName, parentId = null, showOnHomepage = false) => {
        const name = categoryName.trim();
        if (!name) return false;

        try {
            const res = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name, parentId, showOnHomepage })
            });

            if (res.ok) {
                const result = await res.json();
                setCategories(prev => {
                    const newCat = mapCategory(result.data.category, prev);
                    return [...prev, newCat];
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error('Add category error:', err);
            return false;
        }
    };

    const updateCategory = async (categoryId, updates) => {
        try {
            const res = await fetch(`${API_URL}/categories/${categoryId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const result = await res.json();
                setCategories(prev => {
                    const updatedCat = mapCategory(result.data.category, prev);
                    return prev.map(c => c._id === categoryId ? updatedCat : c);
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error('Update category error:', err);
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
                setCategories(prev => prev.filter(c => c.name !== categoryName));
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
        <ProductContext.Provider value={{
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
        }}>
            {!loading && children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
