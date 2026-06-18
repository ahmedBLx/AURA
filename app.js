document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. DATA LAYER (Dynamic catalog loaded from localStorage)
    // ==========================================
    let products = JSON.parse(localStorage.getItem('aura_products'));
    
    // Force reset product list cache if new retro shoe is missing or if backpack is in catalog
    if (products) {
        const hasRetro = products.some(p => p.id === 'retro');
        const hasBackpack = products.some(p => p.id === 'backpack') || products.some(p => p.img.includes('backpack'));
        if (!hasRetro || hasBackpack) {
            products = null;
        }
    }

    if (!products) {
        products = [
            {
                id: "nomad",
                name: "AURA NOMAD (MUSTARD)",
                price: 190,
                img: "assets/sneaker_mustard.png",
                desc: "Designed for modern lifestyle explorers. Features a lightweight, breathable knit structure, responsive sole cushioning, and our signature eco-friendly mustard-hued dye."
            },
            {
                id: "eclipse",
                name: "AURA ECLIPSE (CHARCOAL)",
                price: 190,
                img: "assets/sneaker_charcoal.png",
                desc: "The stealth choice for city trails. Crafted with charcoal black water-repellent yarn, a recycled rubber rugged outsole, and maximum-comfort heel stability panels."
            },
            {
                id: "horizon",
                name: "AURA HORIZON (CORAL)",
                price: 190,
                img: "assets/sneaker_coral.png",
                desc: "Step with vibrant energy. Built with flexible coral-peach mesh fibers, ultra-light shock-absorption technology, and breathable fabrics perfect for summer walks."
            },
            {
                id: "retro",
                name: "AURA RETRO (WHITE)",
                price: 220,
                img: "assets/sneaker_white.png",
                desc: "Step into a timeless legend. Featuring premium full-grain white leather with cement-grey speckle accents, responsive air cushioning, and vintage street court appeal."
            }
        ];
        localStorage.setItem('aura_products', JSON.stringify(products));
    }
    // User Accounts Database State
    let users = JSON.parse(localStorage.getItem('aura_users'));
    if (!users) {
        users = [
            {
                name: "Admin",
                email: "admin@aura.com",
                password: "adminpassword123",
                role: "admin"
            },
            {
                name: "Customer",
                email: "customer@aura.com",
                password: "customerpassword123",
                role: "customer"
            }
        ];
        localStorage.setItem('aura_users', JSON.stringify(users));
    }

    // Shopping Cart State
    let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];
    const cartBadge = document.querySelector('.cart-badge');

    // Page Route Router Detection
    const path = window.location.pathname.toLowerCase();
    const isShopPage = path.includes('shop.html');
    const isAdminPage = path.includes('admin.html');
    const isIndexPage = !isShopPage && !isAdminPage;

    // ==========================================
    // 2. ROUTING SECURITY ENFORCEMENT
    // ==========================================
    const sessionUser = localStorage.getItem('aura_username');
    const sessionRole = localStorage.getItem('aura_user_role');

    if (isIndexPage) {
        // Redirect admins away from landing gateway
        if (sessionUser && sessionRole === 'admin') {
            window.location.href = 'admin.html';
            return;
        }
        // Customers are allowed to browse landing page, don't redirect them
        initIndexGateway();
    } else if (isShopPage) {
        // Enforce customer session
        if (!sessionUser || sessionRole !== 'customer') {
            window.location.href = 'index.html';
            return;
        }
        initShopStorefront();
    } else if (isAdminPage) {
        // Enforce admin session
        if (!sessionUser || sessionRole !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        initAdminDashboard();
    }

    // ==========================================
    // 3. INDEX LANDING GATEWAY PAGE LOGIC
    // ==========================================
    function initIndexGateway() {
        const authModal = document.getElementById('auth-modal');
        const headerLoginBtn = document.getElementById('header-login-btn');
        const closeAuthModal = document.getElementById('close-auth-modal');
        const authSuccessState = document.getElementById('auth-success-state');
        const successMsg = document.getElementById('success-message');
        const authTabBtns = document.querySelectorAll('.auth-tab-btn');
        const authForms = document.querySelectorAll('.auth-form');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const lockedSigninTrigger = document.getElementById('locked-signin-trigger');
        const heroShopTrigger = document.getElementById('hero-shop-trigger');

        function openModal() {
            authModal.classList.add('active');
            resetAuthForms();
        }

        // Render Specials section products
        const specialsGrid = document.getElementById('specials-grid');
        if (specialsGrid) {
            specialsGrid.innerHTML = '';
            // Display first 3 products as Specials
            const specialsList = products.slice(0, 3);
            specialsList.forEach(p => {
                const cardHtml = `
                    <div class="product-card item-card specials-card" data-id="${p.id}">
                        <div class="card-image-box">
                            <span class="badge badge-special">SPECIAL</span>
                            <img src="${p.img}" alt="${p.name}" class="product-img">
                            <div class="card-overlay-actions">
                                <button class="quick-view-btn specials-action-btn">View Special</button>
                            </div>
                        </div>
                        <div class="card-info-box">
                            <div class="info-left">
                                <h3 class="product-name">${p.name}</h3>
                                <span class="product-price">$${p.price}</span>
                            </div>
                        </div>
                    </div>
                `;
                specialsGrid.insertAdjacentHTML('beforeend', cardHtml);
            });
            
            // Bind actions for Specials cards
            document.querySelectorAll('.specials-card').forEach(card => {
                card.addEventListener('click', () => {
                    const prodId = card.getAttribute('data-id');
                    if (sessionUser && sessionRole === 'customer') {
                        // Logged in: redirect to shop with view parameter to trigger quick view
                        window.location.href = `shop.html?view=${prodId}`;
                    } else {
                        // Guest: open auth modal to attract them
                        openModal();
                    }
                });
            });
        }

        const isCustomerLoggedIn = sessionUser && sessionRole === 'customer';

        if (isCustomerLoggedIn) {
            // Update header login button to show "Hi, [Name]" and act as Logout
            if (headerLoginBtn) {
                headerLoginBtn.classList.add('logged-in');
                const span = headerLoginBtn.querySelector('span');
                if (span) span.textContent = `Hi, ${sessionUser}`;
                
                headerLoginBtn.addEventListener('click', () => {
                    localStorage.removeItem('aura_username');
                    localStorage.removeItem('aura_user_role');
                    window.location.href = 'index.html';
                });
            }
            
            // Hide the locked catalog section
            const lockedCatalog = document.getElementById('locked-catalog-section');
            if (lockedCatalog) lockedCatalog.classList.add('hidden');
        } else {
            // Guest mode
            if (headerLoginBtn) headerLoginBtn.addEventListener('click', openModal);
            if (lockedSigninTrigger) lockedSigninTrigger.addEventListener('click', openModal);
        }

        // Hero Button click behavior
        if (heroShopTrigger) {
            if (isCustomerLoggedIn) {
                heroShopTrigger.textContent = "Enter Shop";
                heroShopTrigger.addEventListener('click', () => {
                    window.location.href = 'shop.html';
                });
            } else {
                heroShopTrigger.addEventListener('click', openModal);
            }
        }

        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => authModal.classList.remove('active'));
        }
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) authModal.classList.remove('active');
            });
        }

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.classList.contains('active')) {
                authModal.classList.remove('active');
            }
        });

        // Admin code visibility management
        const adminCodeGroup = document.getElementById('signup-admin-code-group');
        const adminCodeInput = document.getElementById('signup-admin-code');
        const roleRadios = document.querySelectorAll('input[name="auth-role"]');

        function updateAdminCodeFieldVisibility() {
            if (!adminCodeGroup) return;
            const activeTabBtn = document.querySelector('.auth-tab-btn.active');
            const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'login';
            const selectedRoleElement = document.querySelector('input[name="auth-role"]:checked');
            const selectedRole = selectedRoleElement ? selectedRoleElement.value : 'customer';

            if (activeTab === 'signup' && selectedRole === 'admin') {
                adminCodeGroup.style.display = 'block';
            } else {
                adminCodeGroup.style.display = 'none';
                if (adminCodeInput) adminCodeInput.value = '';
            }
        }

        roleRadios.forEach(radio => {
            radio.addEventListener('change', updateAdminCodeFieldVisibility);
        });

        // Tabs switching
        authTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                authTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tab}-form`) form.classList.add('active');
                });
                clearValidationErrors();
                updateAdminCodeFieldVisibility();
            });
        });

        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const input = btn.closest('.input-with-icon').querySelector('input');
                const isPassword = input.getAttribute('type') === 'password';
                input.setAttribute('type', isPassword ? 'text' : 'password');
                btn.style.color = isPassword ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.4)';
            });
        });

        // Form submits
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearValidationErrors();

            const email = document.getElementById('login-email');
            const pass = document.getElementById('login-password');
            const role = document.querySelector('input[name="auth-role"]:checked').value;

            let valid = true;
            if (!validateEmail(email.value)) { showInputError(email); valid = false; }
            if (pass.value.length < 1) { showInputError(pass); valid = false; }

            if (valid) {
                const registeredUser = users.find(u => u.email.toLowerCase() === email.value.toLowerCase() && u.password === pass.value && u.role === role);
                
                if (registeredUser) {
                    localStorage.setItem('aura_username', registeredUser.name);
                    localStorage.setItem('aura_user_role', role);
                    triggerAuthSuccess(role, "Sign in successful. Accessing store...");
                } else {
                    showInputError(email);
                    showInputError(pass);
                    const passGroup = pass.closest('.form-group');
                    if (passGroup) {
                        const errSpan = passGroup.querySelector('.error-text');
                        if (errSpan) errSpan.textContent = "Invalid credentials or role selection.";
                    }
                }
            }
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearValidationErrors();

            const name = document.getElementById('signup-name');
            const email = document.getElementById('signup-email');
            const pass = document.getElementById('signup-password');
            const terms = document.getElementById('signup-terms');
            const role = document.querySelector('input[name="auth-role"]:checked').value;

            let valid = true;
            if (name.value.trim().length < 2) { showInputError(name); valid = false; }
            
            // Check if email already registered
            const emailExists = users.some(u => u.email.toLowerCase() === email.value.toLowerCase());
            if (!validateEmail(email.value)) { 
                showInputError(email); 
                valid = false; 
            } else if (emailExists) {
                showInputError(email);
                const emailGroup = email.closest('.form-group');
                if (emailGroup) {
                    const errSpan = emailGroup.querySelector('.error-text');
                    if (errSpan) errSpan.textContent = "Email is already registered.";
                }
                valid = false;
            }

            if (pass.value.length < 8) { showInputError(pass); valid = false; }
            
            // Validate admin code if admin is selected
            if (role === 'admin') {
                if (!adminCodeInput || adminCodeInput.value !== 'A#D=M##NZ') {
                    if (adminCodeInput) showInputError(adminCodeInput);
                    valid = false;
                }
            }

            if (!terms.checked) valid = false;

            if (valid) {
                const first = name.value.trim().split(' ')[0];
                
                // Add new user to database
                const newUser = {
                    name: name.value.trim(),
                    email: email.value.trim(),
                    password: pass.value,
                    role: role
                };
                users.push(newUser);
                localStorage.setItem('aura_users', JSON.stringify(users));

                localStorage.setItem('aura_username', first);
                localStorage.setItem('aura_user_role', role);
                triggerAuthSuccess(role, "Account created. Redirecting...");
            }
        });

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function showInputError(input) {
            const group = input.closest('.form-group');
            if (group) group.classList.add('invalid');
        }

        function clearValidationErrors() {
            document.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
        }

        function resetAuthForms() {
            clearValidationErrors();
            loginForm.reset();
            signupForm.reset();
            document.querySelectorAll('.input-with-icon input').forEach(i => i.setAttribute('type', 'password'));
            document.querySelectorAll('.toggle-password').forEach(b => b.style.color = 'rgba(255, 255, 255, 0.4)');
            
            // Restore original error texts
            const loginPass = document.getElementById('login-password');
            const loginPassGroup = loginPass ? loginPass.closest('.form-group') : null;
            if (loginPassGroup) {
                const errSpan = loginPassGroup.querySelector('.error-text');
                if (errSpan) errSpan.textContent = "Password is required.";
            }
            
            const signupEmail = document.getElementById('signup-email');
            const signupEmailGroup = signupEmail ? signupEmail.closest('.form-group') : null;
            if (signupEmailGroup) {
                const errSpan = signupEmailGroup.querySelector('.error-text');
                if (errSpan) errSpan.textContent = "Please enter a valid email address.";
            }

            authSuccessState.classList.remove('active');
            if (authTabBtns.length > 0) authTabBtns[0].click();
            document.querySelector('input[name="auth-role"][value="customer"]').checked = true;
            updateAdminCodeFieldVisibility();
        }

        function triggerAuthSuccess(role, message) {
            successMsg.textContent = message;
            authSuccessState.classList.add('active');

            setTimeout(() => {
                authModal.classList.remove('active');
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'shop.html';
                }
            }, 1800);
        }
    }

    // ==========================================
    // 4. CUSTOMER SHOP STOREFRONT PAGE LOGIC
    // ==========================================
    function initShopStorefront() {
        const productGrid = document.getElementById('product-grid');
        const filterTray = document.getElementById('filter-tray');
        const filterToggle = document.getElementById('filter-toggle');
        const inlineSearchInput = document.getElementById('inline-search');
        const collectionFilters = document.querySelectorAll('.collection-filter');
        const priceFilters = document.querySelectorAll('.price-filter');
        const searchOverlayInput = document.getElementById('search-input');
        const filterCountSpan = document.querySelector('.filter-count');
        const headerLoginBtn = document.getElementById('header-login-btn');

        // Display user name in header
        if (headerLoginBtn) {
            headerLoginBtn.classList.add('logged-in');
            const span = headerLoginBtn.querySelector('span');
            if (span) span.textContent = `Hi, ${sessionUser}`;

            // Clicking acts as Logout
            headerLoginBtn.addEventListener('click', () => {
                localStorage.removeItem('aura_username');
                localStorage.removeItem('aura_user_role');
                window.location.href = 'index.html';
            });
        }

        // Slide toggle filter tray with single switch
        if (filterToggle && filterTray) {
            filterToggle.addEventListener('click', () => {
                const isActive = filterToggle.classList.toggle('active');
                filterTray.classList.toggle('active', isActive);
                if (!isActive) {
                    resetStorefrontFilters();
                }
            });
        }

        function renderShopCatalog(filteredList = products) {
            if (!productGrid) return;
            
            productGrid.innerHTML = '';

            // If no products match the filters
            if (filteredList.length === 0) {
                const noResultsHtml = `
                    <div class="catalog-no-results">
                        <svg class="icon no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                        <h3>NO SNEAKERS FOUND</h3>
                        <p>No items match your active filters or search terms. Try modifying your selections.</p>
                    </div>
                `;
                productGrid.insertAdjacentHTML('beforeend', noResultsHtml);
                if (filterCountSpan) filterCountSpan.textContent = "FILTER (0 products)";
                return;
            }

            // Append products (Note: Backpack promo card is completely omitted)
            filteredList.forEach(p => {
                const cardHtml = `
                    <div class="product-card item-card" data-id="${p.id}">
                        <div class="card-image-box">
                            <span class="badge badge-new">NEW</span>
                            <img src="${p.img}" alt="${p.name}" class="product-img">
                            <div class="card-overlay-actions">
                                <button class="quick-view-btn">Quick View</button>
                            </div>
                        </div>
                        <div class="card-info-box">
                            <div class="info-left">
                                <h3 class="product-name">${p.name}</h3>
                                <span class="product-price">$${p.price}</span>
                            </div>
                            <div class="info-right">
                                <button class="favorite-action-btn" aria-label="Add to Favorites">
                                    <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span class="favorite-text">Favorite</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                productGrid.insertAdjacentHTML('beforeend', cardHtml);
            });

            if (filterCountSpan) {
                filterCountSpan.textContent = `FILTER (${filteredList.length} products)`;
            }

            attachCardEventListeners();
        }

        // Multi-Criteria Filtering Logic
        function applyShopFilters() {
            const inlineQuery = inlineSearchInput ? inlineSearchInput.value.toLowerCase().trim() : "";
            const overlayQuery = searchOverlayInput ? searchOverlayInput.value.toLowerCase().trim() : "";
            
            const activeCollections = [];
            collectionFilters.forEach(checkbox => {
                if (checkbox.checked) activeCollections.push(checkbox.value);
            });

            const activePrices = [];
            priceFilters.forEach(checkbox => {
                if (checkbox.checked) activePrices.push(checkbox.value);
            });

            const filtered = products.filter(p => {
                // Search term match
                const nameMatch = p.name.toLowerCase().includes(inlineQuery) || p.name.toLowerCase().includes(overlayQuery);
                const descMatch = p.desc.toLowerCase().includes(inlineQuery) || p.desc.toLowerCase().includes(overlayQuery);
                if (inlineQuery || overlayQuery) {
                    if (!nameMatch && !descMatch) return false;
                }

                // Collection match
                if (activeCollections.length > 0) {
                    const matchesCollection = activeCollections.some(col => p.id.toLowerCase().includes(col));
                    if (!matchesCollection) return false;
                }

                // Price match
                if (activePrices.length > 0) {
                    const matchesPrice = activePrices.some(range => {
                        if (range === "under-200") return p.price < 200;
                        if (range === "over-200") return p.price >= 200;
                        return true;
                    });
                    if (!matchesPrice) return false;
                }

                return true;
            });

            renderShopCatalog(filtered);
        }

        // Bind filter event listeners
        if (inlineSearchInput) inlineSearchInput.addEventListener('input', applyShopFilters);
        if (searchOverlayInput) searchOverlayInput.addEventListener('input', applyShopFilters);
        collectionFilters.forEach(cb => cb.addEventListener('change', applyShopFilters));
        priceFilters.forEach(cb => cb.addEventListener('change', applyShopFilters));

        function resetStorefrontFilters() {
            if (inlineSearchInput) inlineSearchInput.value = "";
            if (searchOverlayInput) searchOverlayInput.value = "";
            collectionFilters.forEach(cb => cb.checked = false);
            priceFilters.forEach(cb => cb.checked = false);
            if (filterTray) filterTray.classList.remove('active');
            if (filterToggle) filterToggle.classList.remove('active');
            applyShopFilters();
        }

        // Search Overlay toggling
        const searchBtn = document.getElementById('search-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const closeSearch = document.getElementById('close-search');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                searchOverlay.classList.add('active');
                setTimeout(() => searchOverlayInput.focus(), 150);
            });
        }
        if (closeSearch) {
            closeSearch.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                if (searchOverlayInput) {
                    searchOverlayInput.value = "";
                    applyShopFilters();
                }
            });
        }

        // Initialize Storefront
        resetStorefrontFilters();
        updateCartBadge();
        renderCartItems();

        // Auto-open Quick View if 'view' parameter exists in URL
        const urlParams = new URLSearchParams(window.location.search);
        const autoViewId = urlParams.get('view');
        if (autoViewId) {
            const p = products.find(prod => prod.id === autoViewId);
            if (p) {
                currentSelectedProductId = autoViewId;
                modalImg.src = p.img;
                modalImg.alt = p.name;
                modalName.textContent = p.name;
                modalPrice.textContent = `$${p.price}`;
                modalDesc.textContent = p.desc;
                quickViewModal.classList.add('active');
            }
        }
    }

    // ==========================================
    // 5. ADMIN CONTROL PANEL LOGIC
    // ==========================================
    function initAdminDashboard() {
        const adminLogoutBtn = document.getElementById('admin-logout');
        const adminInventoryRows = document.getElementById('admin-inventory-rows');
        const adminProductForm = document.getElementById('admin-product-form');
        const formActionTitle = document.getElementById('form-action-title');
        const prodSubmitBtn = document.getElementById('prod-submit-btn');
        const prodCancelBtn = document.getElementById('prod-cancel-btn');

        const editIdInput = document.getElementById('edit-product-id');
        const prodNameInput = document.getElementById('prod-name');
        const prodPriceInput = document.getElementById('prod-price');
        const prodImageInput = document.getElementById('prod-image');
        const prodDescInput = document.getElementById('prod-desc');

        document.getElementById('admin-display-name').textContent = `Admin: ${sessionUser}`;

        function renderAdminInventoryTable() {
            if (!adminInventoryRows) return;
            
            adminInventoryRows.innerHTML = '';
            products.forEach(p => {
                const row = `
                    <tr>
                        <td>
                            <div class="inventory-img-box">
                                <img src="${p.img}" alt="${p.name}" class="inventory-img">
                            </div>
                        </td>
                        <td><span class="inventory-name">${p.name}</span></td>
                        <td><span class="inventory-price">$${p.price}</span></td>
                        <td><span class="inventory-desc" title="${p.desc}">${p.desc}</span></td>
                        <td>
                            <div class="inventory-actions">
                                <button class="action-btn edit-action" data-id="${p.id}">Edit</button>
                                <button class="action-btn delete-action" data-id="${p.id}">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
                adminInventoryRows.insertAdjacentHTML('beforeend', row);
            });

            // Set metrics counts
            document.getElementById('admin-items-count').textContent = `${products.length} items`;
            document.getElementById('admin-orders-count').textContent = localStorage.getItem('aura_orders_count') || 131;

            bindInventoryActions();
        }

        function bindInventoryActions() {
            // Edit
            document.querySelectorAll('.edit-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const p = products.find(prod => prod.id === id);
                    if (p) {
                        editIdInput.value = p.id;
                        prodNameInput.value = p.name;
                        prodPriceInput.value = p.price;
                        prodImageInput.value = p.img;
                        prodDescInput.value = p.desc;

                        formActionTitle.textContent = "EDIT SNEAKER INFO";
                        prodSubmitBtn.textContent = "SAVE CHANGES";
                        prodCancelBtn.classList.remove('hidden');
                    }
                });
            });

            // Delete
            document.querySelectorAll('.delete-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    products = products.filter(p => p.id !== id);
                    localStorage.setItem('aura_products', JSON.stringify(products));
                    renderAdminInventoryTable();
                });
            });
        }

        if (prodCancelBtn) {
            prodCancelBtn.addEventListener('click', () => {
                resetAdminForm();
            });
        }

        function resetAdminForm() {
            editIdInput.value = "";
            adminProductForm.reset();
            formActionTitle.textContent = "ADD NEW SNEAKER";
            prodSubmitBtn.textContent = "ADD SNEAKER";
            prodCancelBtn.classList.add('hidden');
        }

        if (adminProductForm) {
            adminProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const id = editIdInput.value.trim();
                const name = prodNameInput.value.trim();
                const price = parseInt(prodPriceInput.value);
                const img = prodImageInput.value;
                const desc = prodDescInput.value.trim();

                if (id) {
                    const idx = products.findIndex(p => p.id === id);
                    if (idx > -1) {
                        products[idx].name = name;
                        products[idx].price = price;
                        products[idx].img = img;
                        products[idx].desc = desc;
                    }
                } else {
                    const newId = "prod_" + Date.now();
                    products.push({ id: newId, name, price, img, desc });
                }

                localStorage.setItem('aura_products', JSON.stringify(products));
                renderAdminInventoryTable();
                resetAdminForm();
            });
        }

        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                localStorage.removeItem('aura_username');
                localStorage.removeItem('aura_user_role');
                window.location.href = 'index.html';
            });
        }

        // Initialize admin tables
        renderAdminInventoryTable();
    }

    // ==========================================
    // 6. SHARED HELPERS (Card actions, Chat, Cart)
    // ==========================================
    const quickViewModal = document.getElementById('quick-view-modal');
    const closeModal = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-product-img');
    const modalName = document.getElementById('modal-product-name');
    const modalPrice = document.getElementById('modal-product-price');
    const modalDesc = document.querySelector('.modal-desc');
    const sizeBtns = document.querySelectorAll('.size-btn');
    const addToCartBtn = document.getElementById('modal-add-to-cart');
    let currentSelectedProductId = "";

    function attachCardEventListeners() {
        // Favorite action
        document.querySelectorAll('.favorite-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('liked');
                const heartIcon = btn.querySelector('.heart-icon');
                if (btn.classList.contains('liked') && heartIcon) {
                    heartIcon.style.transform = 'scale(1.35)';
                    setTimeout(() => heartIcon.style.transform = 'scale(1)', 200);
                }
            });
        });

        // Quick View trigger
        document.querySelectorAll('.quick-view-btn').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                const productId = card.getAttribute('data-id');
                const p = products.find(prod => prod.id === productId);

                if (p) {
                    currentSelectedProductId = productId;
                    modalImg.src = p.img;
                    modalImg.alt = p.name;
                    modalName.textContent = p.name;
                    modalPrice.textContent = `$${p.price}`;
                    modalDesc.textContent = p.desc;
                    quickViewModal.classList.add('active');
                }
            });
        });
    }

    if (closeModal) closeModal.addEventListener('click', () => quickViewModal.classList.remove('active'));
    if (quickViewModal) {
        quickViewModal.addEventListener('click', (e) => {
            if (e.target === quickViewModal) quickViewModal.classList.remove('active');
        });
    }

    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const activeSizeBtn = document.querySelector('.size-btn.active');
            const size = activeSizeBtn ? activeSizeBtn.textContent : "US 9";
            
            addToCart(currentSelectedProductId, size);

            const originalText = addToCartBtn.textContent;
            addToCartBtn.textContent = "ADDED TO BAG ✓";
            addToCartBtn.style.backgroundColor = "#10B981";
            addToCartBtn.style.borderColor = "#10B981";

            setTimeout(() => {
                addToCartBtn.textContent = originalText;
                addToCartBtn.style.backgroundColor = "var(--color-primary)";
                addToCartBtn.style.borderColor = "var(--color-gold)";
                quickViewModal.classList.remove('active');
            }, 1000);
        });
    }

    function updateCartBadge() {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalQty;
            cartBadge.style.transform = 'scale(1.4)';
            cartBadge.style.backgroundColor = '#FFFFFF';
            setTimeout(() => {
                cartBadge.style.transform = 'scale(1)';
                cartBadge.style.backgroundColor = 'var(--color-gold)';
            }, 300);
        }
    }

    function addToCart(productId, size) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        const existingItem = cart.find(item => item.id === productId && item.size === size);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: prod.name,
                price: prod.price,
                img: prod.img,
                size: size,
                quantity: 1
            });
        }

        localStorage.setItem('aura_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCartItems();
        cartBackdrop.classList.add('active');
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;
        
        const emptyState = cartItemsContainer.querySelector('.cart-empty-state');
        cartItemsContainer.innerHTML = '';
        if (emptyState) {
            cartItemsContainer.appendChild(emptyState);
        }

        if (cart.length === 0) {
            cartEmpty.style.display = 'flex';
            cartFooter.style.display = 'none';
            return;
        }

        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'flex';

        let subtotal = 0;

        cart.forEach((item, index) => {
            subtotal += item.price * item.quantity;
            const itemHtml = `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-img-box">
                        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-header">
                            <h4 class="cart-item-name">${item.name} (${item.size})</h4>
                            <button class="cart-item-remove-btn" data-index="${index}">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn qty-minus" data-index="${index}">-</button>
                                <span class="qty-val">${item.quantity}</span>
                                <button class="qty-btn qty-plus" data-index="${index}">+</button>
                            </div>
                            <span class="cart-item-price">$${item.price * item.quantity}</span>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

        cartSubtotalVal.textContent = `$${subtotal.toFixed(2)}`;
        cartTotalVal.textContent = `$${subtotal.toFixed(2)}`;

        bindCartItemEvents();
    }

    function bindCartItemEvents() {
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                cart[idx].quantity++;
                saveCartState();
            });
        });

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity--;
                } else {
                    cart.splice(idx, 1);
                }
                saveCartState();
            });
        });

        document.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                cart.splice(idx, 1);
                saveCartState();
            });
        });
    }

    function saveCartState() {
        localStorage.setItem('aura_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCartItems();
    }

    // ==========================================
    // Live Chat Support Toggles
    // ==========================================
    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatWidget.classList.toggle('active');
            if (chatWidget.classList.contains('active')) {
                setTimeout(() => chatInput.focus(), 300);
            }
        });
    }
    if (chatClose) {
        chatClose.addEventListener('click', () => chatWidget.classList.remove('active'));
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            appendChatMessage(text, 'user-message');
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            setTimeout(() => {
                showChatTyping();
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                setTimeout(() => {
                    removeChatTyping();
                    const reply = getSmartSupportReply(text);
                    appendChatMessage(reply, 'bot-message');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 1200);
            }, 600);
        });
    }

    function appendChatMessage(content, className) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const html = `
            <div class="message ${className}">
                <p>${escapeHTMLString(content)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;
        if (chatMessages) chatMessages.insertAdjacentHTML('beforeend', html);
    }

    function showChatTyping() {
        const html = `
            <div class="message bot-message typing-indicator-msg" id="typing-indicator">
                <p style="display: flex; gap: 4px; align-items: center;">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </p>
            </div>
        `;
        if (chatMessages) chatMessages.insertAdjacentHTML('beforeend', html);

        const style = document.createElement('style');
        style.id = 'typing-dots-style';
        style.innerHTML = `
            .typing-indicator-msg .dot { width: 6px; height: 6px; background-color: var(--color-text-muted); border-radius: 50%; display: inline-block; animation: blink 1.4s infinite both; }
            .typing-indicator-msg .dot:nth-child(2) { animation-delay: .2s; }
            .typing-indicator-msg .dot:nth-child(3) { animation-delay: .4s; }
            @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        `;
        document.head.appendChild(style);
    }

    function removeChatTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        const style = document.getElementById('typing-dots-style');
        if (style) style.remove();
    }

    function escapeHTMLString(str) {
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }

    function getSmartSupportReply(userInput) {
        const text = userInput.toLowerCase();
        if (text.includes('price') || text.includes('cost') || text.includes('how much')) {
            return "Our premium AURA Nomad sneakers are $190, which includes free worldwide delivery. Retro series are $220.";
        }
        if (text.includes('size') || text.includes('fit')) {
            return "AURA sneakers run true to size. If you're in between sizes, we recommend selecting the larger size.";
        }
        if (text.includes('delivery') || text.includes('shipping') || text.includes('ship')) {
            return "We offer free standard shipping globally. Shipping takes about 2 to 4 business days.";
        }
        if (text.includes('return') || text.includes('refund')) {
            return "We have a 30-day hassle-free return policy. Simply request a return from your dashboard.";
        }
        return "Thank you for reaching out! A customer specialist will be online with you in a moment to help with your question: \"" + userInput + "\"";
    }
});
