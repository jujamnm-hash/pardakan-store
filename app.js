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
    const reportEndDate = document. getElementById('reportEndDate');
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
            image_url:  'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=500'
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
            stock_quantity:  30,
            category: 'Thermal',
            image_url:  'https://images.unsplash.com/photo-1616594266467-81e92a99f2e9?w=500'
        },
        {
            id: 4,
            name: 'پەردەی Decorative - زێڕین',
            description: 'پەردەی ڕازاوە بە نەخشی جوان',
            price: 65000,
            stock_quantity:  25,
            category: 'Decorative',
            image_url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=500'
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
        filtered. sort((a, b) => a.name.localeCompare(b.name, 'ar'));
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
    document. getElementById('sortFilter').value = 'name';
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
    
    const existingItem = cart. find(item => item.id === productId);
    
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
    
    const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        total_amount: total,
        items: cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
        }))
    };
    
    try {
        await apiRequest('/orders', 'POST', orderData);
        showNotification('وەسڵەکەت بە سەرکەوتوویی تۆمارکرا!  سوپاس بۆ کڕینەکەت', 'success');
        
        cart = [];
        saveCart();
        updateCartBadge();
        
        document.getElementById('checkoutForm').reset();
        
        const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
        if (checkoutModal) checkoutModal.hide();
        
        await loadProducts();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا لە تۆمارکردنی وەسڵ', 'error');
    }
}

// =========================================
// Admin Functions
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
    if (section) section.classList.remove('d-none');
    
    if (event && event.target) event.target.classList.add('active');
    
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
        case 'reports':
            break;
    }
}

async function loadDashboard() {
    try {
        const products = await apiRequest('/products');
        const orders = await apiRequest('/orders');
        
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders. length;
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        
        const lowStock = products.filter(p => p.stock_quantity < 10).length;
        document.getElementById('lowStockCount').textContent = lowStock;
    } catch (error) {
        document.getElementById('totalProducts').textContent = allProducts.length;
        document. getElementById('totalOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = formatCurrency(0);
        document.getElementById('lowStockCount').textContent = allProducts.filter(p => p. stock_quantity < 10).length;
    }
}

async function loadAdminProducts() {
    try {
        const products = await apiRequest('/products');
        allProducts = products;
        renderAdminProducts(products);
    } catch (error) {
        renderAdminProducts(allProducts);
    }
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
    currentEditProductId = productId;
    
    if (productId) {
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            document.getElementById('productModalTitle').textContent = 'دەستکاریکردنی بەرهەم';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock_quantity;
            document.getElementById('productImage').value = product.image_url || '';
        }
    } else {
        document.getElementById('productModalTitle').textContent = 'زیادکردنی بەرهەم';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function editProduct(productId) {
    openProductModal(productId);
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const image = document. getElementById('productImage').value.trim();
    
    if (!name || !category || isNaN(price) || isNaN(stock)) {
        showNotification('تکایە هەموو خانە پێویستەکان پڕبکەرەوە', 'error');
        return;
    }
    
    const productData = {
        name,
        description,
        category,
        price,
        stock_quantity: stock,
        image_url: image || null
    };
    
    try {
        if (id) {
            await apiRequest(`/products/${id}`, 'PUT', productData);
            showNotification('بەرهەم بە سەرکەوتوویی نوێکرایەوە', 'success');
        } else {
            await apiRequest('/products', 'POST', productData);
            showNotification('بەرهەم بە سەرکەوتوویی زیادکرا', 'success');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        await loadProducts();
        await loadAdminProducts();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا لە پاشەکەوتکردن', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم بەرهەمە؟')) return;
    
    try {
        await apiRequest(`/products/${productId}`, 'DELETE');
        showNotification('بەرهەم سڕایەوە', 'success');
        await loadProducts();
        await loadAdminProducts();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا لە سڕینەوە', 'error');
    }
}

async function loadOrders() {
    try {
        const orders = await apiRequest('/orders');
        allOrders = orders;
        renderOrders(orders);
    } catch (error) {
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
}

function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
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
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>
                <select class="form-select form-select-sm badge-status status-${order.status}" 
                        onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ?  'selected' : ''}>چاوەڕوان</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' :  ''}>تەواوبوو</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>هەڵوەشاوە</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiRequest(`/orders/${orderId}/status`, 'PUT', { status: newStatus });
        showNotification('دۆخی وەسڵ نوێکرایەوە', 'success');
        await loadOrders();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا', 'error');
    }
}

async function viewOrderDetails(orderId) {
    try {
        const order = await apiRequest(`/orders/${orderId}`);
        
        const content = document.getElementById('orderDetailsContent');
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6>زانیاری کڕیار</h6>
                    <p><strong>ناو:</strong> ${order.customer_name}</p>
                    <p><strong>تەلەفۆن:</strong> ${order. customer_phone}</p>
                    <p><strong>ناونیشان:</strong> ${order. customer_address || 'نییە'}</p>
                </div>
                <div class="col-md-6">
                    <h6>زانیاری وەسڵ</h6>
                    <p><strong>ژمارە:</strong> #${order.id}</p>
                    <p><strong>بەروار:</strong> ${formatDate(order.created_at)}</p>
                    <p><strong>کۆی گشتی:</strong> ${formatCurrency(order.total_amount)}</p>
                </div>
            </div>
            
            <h6>بەرهەمەکان</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>بەرهەم</th>
                            <th>بڕ</th>
                            <th>نرخی تاک</th>
                            <th>کۆی گشتی</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item. quantity}</td>
                                <td>${formatCurrency(item. price)}</td>
                                <td>${formatCurrency(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا', 'error');
    }
}

async function loadInventory() {
    try {
        const products = await apiRequest('/products');
        renderInventory(products);
    } catch (error) {
        renderInventory(allProducts);
    }
}

function renderInventory(products) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    const lowStockProducts = products.filter(p => p.stock_quantity < 10);
    
    const alert = document.getElementById('lowStockAlert');
    const message = document.getElementById('lowStockMessage');
    
    if (lowStockProducts.length > 0) {
        alert.classList.remove('d-none');
        message.textContent = `${lowStockProducts.length} بەرهەم لە مەخزەن کەمن و پێویستە نوێبکرێنەوە`;
    } else {
        alert.classList.add('d-none');
    }
    
    tbody.innerHTML = products.map(product => {
        let stockStatus = product.stock_quantity === 0 ? 'تەواوبووە' : product.stock_quantity < 10 ? 'کەمە' : product.stock_quantity < 30 ? 'ناوەند' : 'باش';
        let stockClass = product.stock_quantity < 10 ? 'stock-low' : product.stock_quantity < 30 ? 'stock-medium' : 'stock-high';
        
        return `
            <tr>
                <td>${product.name}</td>
                <td><span class="badge bg-secondary">${product.category}</span></td>
                <td class="${stockClass}">${product.stock_quantity}</td>
                <td><span class="badge bg-${product.stock_quantity === 0 ? 'danger' : product.stock_quantity < 10 ? 'warning' : 'success'}">${stockStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="updateInventory(${product.id}, ${product.stock_quantity})">
                        <i class="bi bi-plus-circle"></i> نوێکردنەوە
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateInventory(productId, currentStock) {
    const newStock = prompt(`بڕی نوێ بنووسە (ئێستا:  ${currentStock}):`, currentStock);
    
    if (newStock === null) return;
    
    const stockValue = parseInt(newStock);
    
    if (isNaN(stockValue) || stockValue < 0) {
        showNotification('ژمارەیەکی دروست بنووسە', 'error');
        return;
    }
    
    updateProductStock(productId, stockValue);
}

async function updateProductStock(productId, newStock) {
    try {
        await apiRequest(`/inventory/${productId}`, 'PUT', { stock_quantity: newStock });
        showNotification('مەخزەن نوێکرایەوە', 'success');
        await loadInventory();
        await loadProducts();
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا', 'error');
    }
}

async function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showNotification('تکایە بەروارەکان هەڵبژێرە', 'error');
        return;
    }
    
    try {
        const data = await apiRequest(`/reports/sales? start_date=${startDate}&end_date=${endDate}`);
        
        document.getElementById('reportTotalSales').textContent = formatCurrency(data.total_sales);
        document.getElementById('reportOrderCount').textContent = data.order_count;
        document.getElementById('reportAvgOrder').textContent = formatCurrency(data.avg_order);
        
        showNotification('راپۆرت دروستکرا', 'success');
    } catch (error) {
        showNotification('هەڵەیەک ڕوویدا', 'error');
    }
}

// =========================================
// Utility Functions
// =========================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-IQ', {
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
    
    if (! toast) return;
    
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
