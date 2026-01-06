// =========================================
// Global Variables & Configuration
// =========================================
const API_BASE_URL = 'http://localhost:5000/api';
let allProducts = [];
let allOrders = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentEditProductId = null;

// =========================================
// Initialization
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    loadProducts();
    
    // Set default dates for reports
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const reportStartDate = document.getElementById('reportStartDate');
    const reportEndDate = document.getElementById('reportEndDate');
    if (reportStartDate) reportStartDate.valueAsDate = firstDayOfMonth;
    if (reportEndDate) reportEndDate.valueAsDate = today;
});

// =========================================
// API Helper Functions
// =========================================
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options. body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('هەڵەیەک ڕوویدا لە پەیوەندیکردن بە سێرڤەر', 'error');
        throw error;
    }
}

// =========================================
// Product Functions
// =========================================
async function loadProducts() {
    try {
        const products = await apiRequest('/products');
        allProducts = products;
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        // Show demo products if API fails
        allProducts = getDemoProducts();
        renderProducts(allProducts);
    }
}

function getDemoProducts() {
    return [
        {
            id: 1,
            name: 'پەردەی Blackout - ڕەش',
            description: 'پەردەیەکی بەکواڵێتی بەرز، ڕووناکی بە تەواوی دەگرێت',
            price:  45000,
            stock_quantity: 50,
            category: 'Blackout',
            image_url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=500'
        },
        {
            id: 2,
            name: 'پەردەی Sheer - کرێمی',
            description: 'پەردەیەکی سووک و شەفاف، ڕووناکی نەرم دەبەخشێت',
            price: 35000,
            stock_quantity:  60,
            category: 'Sheer',
            image_url: 'https://images.unsplash.com/photo-1604709095912-ad5f1b729f9d?w=500'
        },
        {
            id: 3,
            name: 'پەردەی Thermal - قاوەیی',
            description: 'پەردەی گەرمی، پاراستن لە سەرما و گەرما',
            price: 55000,
            stock_quantity: 30,
            category: 'Thermal',
            image_url:  'https://images.unsplash.com/photo-1616594266467-81e92a99f2e9?w=500'
        }
    ];
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (! products || products.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-box-seam"></i>
                    <h4>هیچ بەرهەمێک نەدۆزرایەوە</h4>
                    <p>تکایە دواتر هەوڵبدەوە</p>
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="product-card">
                <img src="${product.image_url || 'https://via.placeholder.com/300x250?text=پەردە'}" 
                     alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/300x250?text=پەردە'">
                <div class="product-card-body">
                    <span class="product-category">${product.category}</span>
                    <h5 class="product-title">${product.name}</h5>
                    <p class="product-description">${product.description || 'وەسف نییە'}</p>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock ${product.stock_quantity < 10 ? 'low-stock' : ''}">
                        ${product.stock_quantity > 0 
                            ? `بەردەستە:  ${product.stock_quantity} دانە` 
                            : 'تەواوبووە'}
                    </div>
                    ${product.stock_quantity > 0 
                        ? `<button class="btn btn-primary" onclick="addToCart(${product.id})">
                            <i class="bi bi-cart-plus"></i> زیادکردن بۆ سەبەتە
                           </button>`
                        : `<button class="btn btn-secondary" disabled>تەواوبووە</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortFilter').value;
    
    let filtered = allProducts. filter(product => {
        const matchesSearch = product.name. toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = ! category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b. name, 'ar'));
    } else if (sortBy === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    renderProducts(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('sortFilter').value = 'name';
    renderProducts(allProducts);
}

// =========================================
// Cart Functions
// =========================================
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showNotification('بەرهەم نەدۆزرایەوە', 'error');
        return;
    }
    
    if (product.stock_quantity <= 0) {
        showNotification('ئەم بەرهەمە لە مەخزەن تەواوبووە', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
            existingItem.quantity++;
            showNotification('بڕی بەرهەم زیادکرا لە سەبەتە', 'success');
        } else {
            showNotification('بڕی بەردەست لە مەخزەن تەواوە', 'warning');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1,
            max_quantity: product.stock_quantity
        });
        showNotification('بەرهەم زیادکرا بۆ سەبەتە', 'success');
    }
    
    saveCart();
    updateCartBadge();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();
    showNotification('بەرهەم لابرا لە سەبەتە', 'info');
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    
    if (! item) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.max_quantity) {
        showNotification('بڕی داواکراو لە مەخزەن زیاترە', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.textContent = totalItems;
}

function openCart() {
    renderCart();
    const modal = new bootstrap.Modal(document.getElementById('cartModal'));
    modal.show();
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsDiv) return;
    
    if (cart.length === 0) {
        cartItemsDiv. innerHTML = `
            <div class="empty-state">
                <i class="bi bi-cart-x"></i>
                <h4>سەبەتەکەت بەتاڵە</h4>
                <p>هیچ بەرهەمێک زیاد نەکراوە</p>
            </div>
        `;
        if (cartTotal) cartTotal.textContent = '0 دینار';
        return;
    }
    
    cartItemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url || 'https://via.placeholder.com/80? text=پەردە'}" 
                 alt="${item. name}"
                 onerror="this.src='https://via.placeholder.com/80?text=پەردە'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-quantity-control">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">
                    <i class="bi bi-dash"></i>
                </button>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.quantity}" 
                       min="1" 
                       max="${item.max_quantity}"
                       onchange="updateCartQuantity(${item.id}, parseInt(this.value))">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item. id}, ${item.quantity + 1})">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id})">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = formatCurrency(total);
}

function clearCart() {
    if (cart.length === 0) {
        showNotification('سەبەتەکە پێشتر بەتاڵە', 'info');
        return;
    }
    
    if (confirm('دڵنیایت لە پاککردنەوەی هەموو بەرهەمەکان؟')) {
        cart = [];
        saveCart();
        updateCartBadge();
        renderCart();
        showNotification('سەبەتەکە پاککرایەوە', 'success');
    }
}

function openCheckout() {
    if (cart.length === 0) {
        showNotification('سەبەتەکەت بەتاڵە', 'error');
        return;
    }
    
    const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    if (cartModal) cartModal.hide();
    
    const checkoutModal = new bootstrap. Modal(document.getElementById('checkoutModal'));
    checkoutModal. show();
}

async function completeOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    
    if (!customerName || !customerPhone || !customerAddress) {
        showNotification('تکایە هەموو خانەکان پڕبکەرەوە', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    showNotification('وەسڵەکەت بە سەرکەوتوویی تۆمارکرا!  سوپاس بۆ کڕینەکەت', 'success');
    
    cart = [];
    saveCart();
    updateCartBadge();
    
    document.getElementById('checkoutForm').reset();
    
    const checkoutModal = bootstrap.Modal. getInstance(document.getElementById('checkoutModal'));
    if (checkoutModal) checkoutModal.hide();
}

// =========================================
// Admin Functions - View Management
// =========================================
function showCustomerView() {
    document.getElementById('customerView').classList.remove('d-none');
    document.getElementById('adminView').classList.add('d-none');
    loadProducts();
}

function showAdminView() {
    document.getElementById('customerView').classList.add('d-none');
    document.getElementById('adminView').classList.remove('d-none');
    showAdminSection('dashboard');
}

function showAdminSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const section = document.getElementById(`${sectionName}Section`);
    if (section) {
        section.classList. remove('d-none');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products': 
            loadAdminProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'inventory':
            loadInventory();
            break;
    }
}

// =========================================
// Admin Functions - Dashboard
// =========================================
async function loadDashboard() {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    const lowStockCount = document.getElementById('lowStockCount');
    
    if (totalProducts) totalProducts.textContent = allProducts.length;
    if (totalOrders) totalOrders.textContent = '0';
    if (totalRevenue) totalRevenue.textContent = formatCurrency(0);
    if (lowStockCount) lowStockCount.textContent = allProducts.filter(p => p. stock_quantity < 10).length;
}

// =========================================
// Admin Functions - Products Management
// =========================================
async function loadAdminProducts() {
    renderAdminProducts(allProducts);
}

function renderAdminProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) return;
    
    if (! products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-box-seam"></i>
                        <h5>هیچ بەرهەمێک نییە</h5>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td><span class="badge bg-secondary">${product.category}</span></td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="${product.stock_quantity < 10 ? 'stock-low' : product.stock_quantity < 30 ? 'stock-medium' : 'stock-high'}">
                    ${product.stock_quantity}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openProductModal(productId = null) {
    showNotification('ئەم تایبەتمەندیە بەردەست نییە لە وەشانی Demo', 'info');
}

function editProduct(productId) {
    openProductModal(productId);
}

function deleteProduct(productId) {
    showNotification('ئەم تایبەتمەندیە بەردەست نییە لە وەشانی Demo', 'info');
}

function saveProduct() {
    showNotification('ئەم تایبەتمەندیە بەردەست نییە لە وەشانی Demo', 'info');
}

// =========================================
// Admin Functions - Orders
// =========================================
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-receipt"></i>
                        <h5>هیچ وەسڵێک نییە</h5>
                    </div>
                </td>
            </tr>
        `;
    }
}

// =========================================
// Admin Functions - Inventory
// =========================================
async function loadInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (! tbody) return;
    
    tbody.innerHTML = allProducts.map(product => {
        let stockStatus = product.stock_quantity < 10 ? 'کەمە' : product.stock_quantity < 30 ? 'ناوەند' : 'باش';
        let stockClass = product.stock_quantity < 10 ? 'stock-low' : product.stock_quantity < 30 ? 'stock-medium' : 'stock-high';
        
        return `
            <tr>
                <td>${product.name}</td>
                <td><span class="badge bg-secondary">${product.category}</span></td>
                <td class="${stockClass}">${product.stock_quantity}</td>
                <td><span class="badge bg-${product.stock_quantity < 10 ? 'danger' : product. stock_quantity < 30 ?  'warning' : 'success'}">${stockStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showNotification('ئەم تایبەتمەندیە بەردەست نییە لە وەشانی Demo', 'info')">
                        <i class="bi bi-plus-circle"></i> نوێکردنەوە
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================
// Admin Functions - Reports
// =========================================
function generateReport() {
    showNotification('ئەم تایبەتمەندیە بەردەست نییە لە وەشانی Demo', 'info');
}

// =========================================
// Utility Functions
// =========================================
function formatCurrency(amount) {
    return new Intl. NumberFormat('ar-IQ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits:  0
    }).format(amount) + ' دینار';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    if (!toast) return;
    
    let icon, title, bgClass;
    switch(type) {
        case 'success':
            icon = 'bi-check-circle-fill';
            title = 'سەرکەوتوو';
            bgClass = 'bg-success';
            break;
        case 'error':  
            icon = 'bi-x-circle-fill';
            title = 'هەڵە';
            bgClass = 'bg-danger';
            break;
        case 'warning':
            icon = 'bi-exclamation-triangle-fill';
            title = 'ئاگاداری';
            bgClass = 'bg-warning';
            break;
        default:
            icon = 'bi-info-circle-fill';
            title = 'زانیاری';
            bgClass = 'bg-primary';
    }
    
    if (toastIcon) toastIcon.className = `bi ${icon} me-2`;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;
    
    const toastHeader = toast.querySelector('.toast-header');
    if (toastHeader) toastHeader.className = `toast-header text-white ${bgClass}`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}