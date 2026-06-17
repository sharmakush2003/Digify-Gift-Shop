'use client';

import './admin.css';
import { useEffect } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export default function AdminPage() {
  useEffect(() => {
    document.body.classList.remove('preload');
    // JavaScript Operations for Digisoft ERP Dashboard (Admin Portal)




let products = [];
let orders = [];
let currentOrderFilter = "All";
let currentOrderSearch = "";
let currentEditingReviews = [];

const erpHierarchy = {
  "Crockery & Dining": {
    "Dinnerware": ["Dinner Sets", "Dinner Plates", "Quarter Plates", "Side Plates", "Bowls", "Soup Bowls", "Serving Bowls"],
    "Drinkware": ["Tea Cups & Saucers", "Coffee Mugs", "Glasses", "Wine Glasses", "Beer Mugs", "Water Tumblers", "Shot Glasses"],
    "Serveware": ["Serving Trays", "Platters", "Cake Stands", "Serving Dishes", "Dip Bowls", "Snack Sets"],
    "Kitchen Containers": ["Storage Jars", "Spice Containers", "Oil Bottles", "Lunch Boxes", "Airtight Containers"]
  },
  "Kitchen & Cooking": {
    "Cookware": ["Kadhai", "Frying Pan", "Sauce Pan", "Casserole", "Pressure Cooker"],
    "Kitchen Tools": ["Knives", "Peelers", "Choppers", "Graters", "Measuring Cups"],
    "Baking": ["Cake Moulds", "Baking Trays", "Rolling Pins", "Cookie Cutters"]
  },
  "Home Décor": {
    "Decorative Items": ["Showpieces", "Figurines", "Decorative Bowls", "Decorative Trays"],
    "Wall Décor": ["Wall Clocks", "Wall Art", "Paintings", "Mirrors", "Wall Shelves"]
  },
  "Gifting": {
    "Gift Sets": ["Tea Set Gifts", "Dinner Set Gifts", "Home Décor Gift Packs"],
    "Festival Gifts": ["Diwali Gifts", "Rakhi Gifts"],
    "Wedding Gifts": ["Wedding Gifts", "Anniversary Gifts", "Corporate Gifts", "Customized Mugs", "Gift Hampers", "Executive Gifts"]
  },
  "Religious & Spiritual": {
    "Pooja Items": ["Diyas", "Agarbatti Stands", "Pooja Thalis"],
    "Idols": ["Ganesh Idols", "Lakshmi Idols", "Buddha Statues"]
  },
  "Seasonal Collection": {
    "Festive Collection": ["Diwali Décor", "Christmas Décor", "New Year Décor"],
    "Wedding Collection": ["Return Gifts", "Decorative Trays", "Gift Packing Items"]
  }
};

const setupHierarchicalSelects = (deptSelectEl, catSelectEl, subSelectEl, initialDept = "", initialCat = "", initialSub = "") => {
  if (!deptSelectEl || !catSelectEl || !subSelectEl) return;

  // Populate departments
  deptSelectEl.innerHTML = Object.keys(erpHierarchy).map(dept => `<option value="${dept}">${dept}</option>`).join('');

  const updateCategoryOptions = (selectedDept) => {
    const dept = selectedDept || deptSelectEl.value;
    if (erpHierarchy[dept]) {
      catSelectEl.innerHTML = Object.keys(erpHierarchy[dept]).map(cat => `<option value="${cat}">${cat}</option>`).join('');
    } else {
      catSelectEl.innerHTML = '';
    }
  };

  const updateSubCategoryOptions = (selectedDept, selectedCat) => {
    const dept = selectedDept || deptSelectEl.value;
    const cat = selectedCat || catSelectEl.value;
    if (erpHierarchy[dept] && erpHierarchy[dept][cat]) {
      subSelectEl.innerHTML = erpHierarchy[dept][cat].map(sub => `<option value="${sub}">${sub}</option>`).join('');
    } else {
      subSelectEl.innerHTML = '';
    }
  };

  deptSelectEl.onchange = () => {
    updateCategoryOptions();
    updateSubCategoryOptions();
  };

  catSelectEl.onchange = () => {
    updateSubCategoryOptions();
  };

  // Set initial values if provided
  if (initialDept) {
    deptSelectEl.value = initialDept;
  }
  updateCategoryOptions(initialDept);
  if (initialCat) {
    catSelectEl.value = initialCat;
  }
  updateSubCategoryOptions(initialDept, initialCat);
  if (initialSub) {
    subSelectEl.value = initialSub;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initERP();
});

// Subscribe to products real-time changes
onSnapshot(collection(db, 'products'), (snapshot) => {
  products = snapshot.docs.map(doc => doc.data());
  products.sort((a, b) => a.id - b.id);
  renderMetrics();
  renderInventoryTable();
});

// Subscribe to orders real-time changes
onSnapshot(collection(db, 'orders'), (snapshot) => {
  orders = snapshot.docs.map(doc => doc.data());
  orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  renderMetrics();
  renderOrdersTable();
});

const getProducts = () => products;
const getOrders = () => orders;

const showToast = (title, message, type = "success") => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === "warning") {
    toast.style.borderColor = "#ff4a4a";
    toast.style.borderLeftColor = "#ff4a4a";
  } else if (type === "info") {
    toast.style.borderColor = "#00aaff";
    toast.style.borderLeftColor = "#00aaff";
  }

  toast.innerHTML = `
    <div class="toast-icon" style="display: flex; align-items: center; justify-content: center;">
      ${type === "success" 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` 
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      }
    </div>
    <div class="toast-body">
      <h5>${title}</h5>
      <p>${message}</p>
    </div>
    <div class="toast-close" style="display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 500);
  });

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 500);
    }
  }, 4000);
};

const initERP = () => {
  // Check if session was active to prevent auth panel flashing
  const wasLoggedIn = localStorage.getItem('isErpAdmin') === 'true';
  const authPanel = document.getElementById('auth-panel');
  if (wasLoggedIn && authPanel) {
    authPanel.classList.remove('active');
  }

  // Navigation tabs
  const tabOrdersBtn = document.getElementById('tab-orders-btn');
  const tabInventoryBtn = document.getElementById('tab-inventory-btn');
  const panelOrders = document.getElementById('erp-orders-panel');
  const panelInventory = document.getElementById('erp-inventory-panel');

  const setTab = (tabId) => {
    if (tabId === 'inventory') {
      tabInventoryBtn?.classList.add('active');
      tabOrdersBtn?.classList.remove('active');
      panelInventory?.classList.add('active');
      panelOrders?.classList.remove('active');
    } else {
      tabOrdersBtn?.classList.add('active');
      tabInventoryBtn?.classList.remove('active');
      panelOrders?.classList.add('active');
      panelInventory?.classList.remove('active');
    }
  };

  if (tabOrdersBtn && tabInventoryBtn && panelOrders && panelInventory) {
    tabOrdersBtn.addEventListener('click', () => {
      setTab('orders');
      localStorage.setItem('activeErpTab', 'orders');
    });

    tabInventoryBtn.addEventListener('click', () => {
      setTab('inventory');
      localStorage.setItem('activeErpTab', 'inventory');
    });

    // Restore saved tab
    const savedTab = localStorage.getItem('activeErpTab');
    if (savedTab) {
      setTab(savedTab);
    }
  }

  // Auth Panel flow configurations using Firebase Authentication
  const loginForm = document.getElementById('login-form');

  // Monitor Authentication state real-time using Firebase Auth
  onAuthStateChanged(auth, (user) => {
    const welcomeTag = document.getElementById('welcome-user-tag');
    if (user) {
      localStorage.setItem('isErpAdmin', 'true');
      if (authPanel) authPanel.classList.remove('active');
      if (welcomeTag) {
        welcomeTag.textContent = `Welcome back, ${user.email}! (Internal DB Portal)`;
      }
    } else {
      localStorage.removeItem('isErpAdmin');
      if (authPanel) authPanel.classList.add('active');
    }
  });

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Signed in successfully!");
      } catch (err) {
        alert("Authentication Failed: " + err.message);
      }
    });
  }

  // Handle Logout Button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        alert("Logged out successfully.");
      } catch (err) {
        alert("Error during logout: " + err.message);
      }
    });
  }

  // Load Data
  renderMetrics();
  renderOrdersTable();
  renderInventoryTable();

  // Modals close triggers
  const stockModal = document.getElementById('edit-stock-modal');
  document.getElementById('close-stock-modal-btn')?.addEventListener('click', () => {
    stockModal.classList.remove('active');
  });

  const comboModal = document.getElementById('add-combo-modal');
  document.getElementById('add-combo-btn')?.addEventListener('click', () => {
    comboModal.classList.add('active');
    setupHierarchicalSelects(
      document.getElementById('combo-department'),
      document.getElementById('combo-category'),
      document.getElementById('combo-subcategory')
    );
  });
  document.getElementById('close-combo-modal-btn')?.addEventListener('click', () => {
    comboModal.classList.remove('active');
  });

  // Invoice Close Trigger
  const invoiceModal = document.getElementById('invoice-modal');
  document.getElementById('close-invoice-modal')?.addEventListener('click', () => {
    invoiceModal.classList.remove('active');
  });

  // Add manual review click listener
  const addReviewBtn = document.getElementById('add-review-manual-btn');
  if (addReviewBtn) {
    addReviewBtn.addEventListener('click', () => {
      const name = document.getElementById('new-review-name').value.trim();
      const rating = parseInt(document.getElementById('new-review-rating').value);
      const comment = document.getElementById('new-review-comment').value.trim();

      if (!name) {
        alert("Please enter a reviewer name.");
        return;
      }
      if (!comment) {
        alert("Please enter a comment.");
        return;
      }

      const newReview = {
        id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        reviewerName: name,
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString()
      };

      currentEditingReviews.push(newReview);
      renderEditingReviews();

      // Reset fields
      document.getElementById('new-review-name').value = '';
      document.getElementById('new-review-comment').value = '';
    });
  }

  // Handle SKU update submit
  document.getElementById('edit-stock-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-sku-id').value);
    const name = document.getElementById('edit-sku-name').value;
    const image = document.getElementById('edit-sku-image').value;
    const price = parseFloat(document.getElementById('edit-sku-price').value);
    const stock = parseInt(document.getElementById('edit-sku-stock').value);
    const fragile = document.getElementById('edit-sku-fragile').checked;
    const microwave = document.getElementById('edit-sku-microwave').checked;
    const department = document.getElementById('edit-sku-department').value;
    const category = document.getElementById('edit-sku-category').value;
    const subCategory = document.getElementById('edit-sku-subcategory').value;
    const description = document.getElementById('edit-sku-description').value;
    const soldCount = parseInt(document.getElementById('edit-sku-sold-count').value) || 0;

    // Calculate rating and reviewCount
    const reviewCount = currentEditingReviews.length;
    let rating = 0;
    if (reviewCount > 0) {
      const sum = currentEditingReviews.reduce((s, r) => s + r.rating, 0);
      rating = Math.round((sum / reviewCount) * 10) / 10;
    }

    try {
      await updateDoc(doc(db, 'products', id.toString()), {
        name,
        image,
        price,
        stock,
        fragile,
        microwave,
        department,
        category,
        subCategory,
        description,
        soldCount,
        reviews: currentEditingReviews,
        rating,
        reviewCount
      });
      showToast("SKU Updated", `Product "${name}" details updated successfully.`, "success");
      stockModal.classList.remove('active');
    } catch (err) {
      showToast("Update Failed", err.message, "warning");
    }
  });

  // Handle Combo submit
  document.getElementById('add-combo-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('combo-name').value;
    const price = parseFloat(document.getElementById('combo-price').value);
    const stock = parseInt(document.getElementById('combo-stock').value);
    const image = document.getElementById('combo-image').value;
    const department = document.getElementById('combo-department').value;
    const category = document.getElementById('combo-category').value;
    const subCategory = document.getElementById('combo-subcategory').value;

    let products = getProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newCombo = {
      id: newId,
      name,
      price,
      image,
      department,
      category,
      subCategory,
      stock,
      fragile: true,
      microwave: false
    };
    
    try {
      await setDoc(doc(db, 'products', newId.toString()), newCombo);
      showToast("Combo Registered", `Hamper "${name}" registered in registry.`, "success");
      document.getElementById('add-combo-form').reset();
      comboModal.classList.remove('active');
    } catch (err) {
      showToast("Registration Failed", err.message, "warning");
    }
  });

  // Search and Filter logic for orders queue
  const searchInput = document.getElementById('order-search-input');
  if (searchInput) {
    // Restore saved search term
    const savedSearch = localStorage.getItem('activeErpSearch');
    if (savedSearch) {
      currentOrderSearch = savedSearch;
      searchInput.value = savedSearch;
    }

    searchInput.addEventListener('input', (e) => {
      currentOrderSearch = e.target.value;
      localStorage.setItem('activeErpSearch', currentOrderSearch);
      renderOrdersTable();
    });
  }

  const filterButtons = document.querySelectorAll('.filter-status-btn');

  // Restore saved filter
  const savedFilter = localStorage.getItem('activeErpFilter');
  if (savedFilter) {
    currentOrderFilter = savedFilter;
    filterButtons.forEach(btn => {
      if (btn.getAttribute('data-filter') === savedFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.getAttribute('data-filter');
      localStorage.setItem('activeErpFilter', currentOrderFilter);
      renderOrdersTable();
    });
  });
};

// Render Summary Metrics
const renderMetrics = () => {
  const products = getProducts();
  const orders = getOrders();

  const revEl = document.getElementById('metric-revenue');
  const ordEl = document.getElementById('metric-orders');
  const stockEl = document.getElementById('metric-lowstock');
  const badgeEl = document.getElementById('orders-count-badge');

  // Sum total
  let totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  if (ordEl) ordEl.textContent = orders.length.toString();
  if (badgeEl) badgeEl.textContent = orders.filter(o => o.status !== "Delivered").length.toString();

  // Low Stock Items (Stock < 5)
  let lowStockCount = products.filter(p => p.stock < 5).length;
  if (stockEl) {
    stockEl.textContent = lowStockCount.toString();
    const cardParent = stockEl.closest('.metric-card');
    if (lowStockCount > 0) {
      cardParent?.classList.add('font-danger');
    } else {
      cardParent?.classList.remove('font-danger');
    }
  }
};

// Render Inventory Table
const renderInventoryTable = () => {
  const products = getProducts();
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No inventory registered.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    return `
      <tr>
        <td>#SKU-${1000 + p.id}</td>
        <td><img src="${p.image}" alt="${p.name}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid var(--glass-border);"></td>
        <td style="font-weight:600; color:var(--text-main);">${p.name}</td>
        <td>${p.department || '-'}</td>
        <td>${p.category || '-'}</td>
        <td>${p.subCategory || '-'}</td>
        <td>₹${p.price.toLocaleString('en-IN')}</td>
        <td style="color:${p.stock < 5 ? '#ff4a4a' : 'inherit'}; font-weight:${p.stock < 5 ? '700' : 'normal'};">
          ${p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            ${p.fragile ? '<span style="background:rgba(255,74,74,0.1); color:#ff4a4a; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700;">FRAGILE</span>' : ''}
            ${p.microwave ? '<span style="background:rgba(0,170,255,0.1); color:#00aaff; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700;">MICROWAVE</span>' : ''}
          </div>
        </td>
        <td>
          <button class="btn btn-outline edit-sku-btn" data-id="${p.id}" style="padding:6px 12px; font-size:0.8rem; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind edit stock trigger
  tbody.querySelectorAll('.edit-sku-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const product = products.find(p => p.id === id);
      if (product) {
        document.getElementById('edit-sku-id').value = product.id;
        document.getElementById('edit-sku-name').value = product.name;
        document.getElementById('edit-sku-image').value = product.image;
        document.getElementById('edit-sku-price').value = product.price;
        document.getElementById('edit-sku-stock').value = product.stock;
        document.getElementById('edit-sku-fragile').checked = product.fragile;
        document.getElementById('edit-sku-microwave').checked = product.microwave;
        document.getElementById('edit-sku-description').value = product.description || '';
        document.getElementById('edit-sku-sold-count').value = product.soldCount || 0;

        currentEditingReviews = product.reviews ? [...product.reviews] : [];
        renderEditingReviews();

        const deptSelect = document.getElementById('edit-sku-department');
        const catSelect = document.getElementById('edit-sku-category');
        const subSelect = document.getElementById('edit-sku-subcategory');
        setupHierarchicalSelects(deptSelect, catSelect, subSelect, product.department || 'Gifting', product.category || 'Festival Gifts', product.subCategory || 'Diwali Gifts');

        document.getElementById('edit-stock-modal').classList.add('active');
      }
    });
  });
};

// Render Orders Table
const renderOrdersTable = () => {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  // Filter orders based on status tab and search term
  let filtered = [...orders];

  // 1. Status Filter
  if (currentOrderFilter === "Active") {
    filtered = filtered.filter(o => o.status !== "Delivered");
  } else if (currentOrderFilter === "Delivered") {
    filtered = filtered.filter(o => o.status === "Delivered");
  }

  // 2. Search Term Filter (Customer Name, Order ID, Status)
  if (currentOrderSearch) {
    const term = currentOrderSearch.toLowerCase().trim();
    filtered = filtered.filter(o => 
      o.id.toLowerCase().includes(term) ||
      o.customer.name.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term) ||
      o.courierStatus.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px 0;">No matching orders found in this view.</td></tr>`;
    return;
  }

  // Sort orders descending by date
  filtered.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML = filtered.map(o => {
    let nextActionBtn = "";
    if (o.status === "Pending") {
      nextActionBtn = `<button class="btn btn-outline process-order-btn" data-id="${o.id}" data-action="Packed" style="padding:6px 10px; font-size:0.75rem; background:#00aaff; color:black; border:none; display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Pack Order</button>`;
    } else if (o.status === "Packed") {
      nextActionBtn = `<button class="btn btn-outline process-order-btn" data-id="${o.id}" data-action="Shipped" style="padding:6px 10px; font-size:0.75rem; background:var(--primary); color:black; border:none; display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg> Ship Order</button>`;
    } else if (o.status === "Shipped") {
      nextActionBtn = `<button class="btn btn-outline process-order-btn" data-id="${o.id}" data-action="Delivered" style="padding:6px 10px; font-size:0.75rem; background:#25d366; color:black; border:none; display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Complete</button>`;
    } else {
      nextActionBtn = `<span style="font-size:0.8rem; color:#25d366; font-weight:700; display:inline-flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Finished</span>`;
    }

    const dateStr = new Date(o.timestamp).toLocaleString('en-IN', { hour12: true });

    return `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${o.id}</td>
        <td style="color:var(--text-main); font-weight:600;">${o.customer.name}</td>
        <td>${o.customer.phone}</td>
        <td>${dateStr}</td>
        <td>₹${o.total.toLocaleString('en-IN')}</td>
        <td>
          <span style="font-size:0.8rem; font-weight:600;">${o.paymentMode}</span><br>
          <span style="font-size:0.7rem; color:${o.paymentStatus === 'Paid' ? '#25d366' : '#ffaa00'}">${o.paymentStatus}</span>
        </td>
        <td>
          <span class="status-pill ${o.status.toLowerCase()}">${o.status}</span>
        </td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            ${nextActionBtn}
            <button class="btn btn-outline print-inv-btn" data-id="${o.id}" style="padding:6px 10px; font-size:0.75rem; display:flex; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Invoice
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind Process Action Trigger
  tbody.querySelectorAll('.process-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      updateOrderStatus(id, action);
    });
  });

  // Bind Print Trigger
  tbody.querySelectorAll('.print-inv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openInvoiceModal(id);
    });
  });
};

// Update order state and dispatch simulator event signals
const updateOrderStatus = async (orderId, newStatus) => {
  let orders = getOrders();
  const o = orders.find(ord => ord.id === orderId);
  if (o) {
    const courierStatus = newStatus === "Packed" ? "In Warehouse" : (newStatus === "Shipped" ? "In Transit" : "Delivered");
    const paymentStatus = newStatus === "Delivered" ? "Paid" : o.paymentStatus;
    
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        courierStatus: courierStatus,
        paymentStatus: paymentStatus
      });
      
      if (newStatus === "Packed") {
        showToast("Order Packed", `Order ${orderId} has been successfully packed.`, "success");
      } else if (newStatus === "Shipped") {
        showToast("Order Shipped", `Order ${orderId} has been dispatched via BlueDart.`, "success");
      } else if (newStatus === "Delivered") {
        showToast("Order Delivered", `Order ${orderId} has been marked as delivered.`, "success");
      }
    } catch (err) {
      showToast("Update Failed", err.message, "warning");
    }
  }
};

// Invoice Modal Rendering
const openInvoiceModal = (orderId) => {
  const orders = getOrders();
  const o = orders.find(ord => ord.id === orderId);
  if (!o) return;

  const invArea = document.getElementById('invoice-print-area');
  if (!invArea) return;

  // Check if any product is fragile
  const containsFragile = o.items.some(item => item.product.fragile);
  const dateStr = new Date(o.timestamp).toLocaleDateString('en-IN');

  const getHSN = (category) => {
    const cat = category ? category.toLowerCase() : "";
    if (cat.includes("dinner") || cat.includes("crockery")) return "6911";
    if (cat.includes("serveware")) return "6912";
    if (cat.includes("customized") || cat.includes("journal")) return "4820";
    if (cat.includes("watch") || cat.includes("premium")) return "9102";
    if (cat.includes("hamper") || cat.includes("combo")) return "9505";
    return "9506"; 
  };

  const priceToWords = (price) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    let num = Math.round(price);
    if (num === 0) return "Zero Rupees Only";
    
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
      return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    };
    
    return "Rupees " + convert(num) + " Only";
  };

  // Tax calculations
  const discount = o.couponDiscount || 0;
  const pointsRedeemed = o.loyaltyPointsRedeemed || 0;
  const pointsEarned = o.loyaltyPointsEarned || 0;
  
  const subtotal = o.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const baseTaxableValue = taxableSubtotal / 1.18;
  const totalCGST = baseTaxableValue * 0.09;
  const totalSGST = baseTaxableValue * 0.09;

  const itemRows = o.items.map((item, index) => {
    const inclusivePrice = item.product.price;
    const taxableValue = inclusivePrice / 1.18; // Base value without 18% GST
    const rowTaxableValue = taxableValue * item.quantity;
    const rowCGST = rowTaxableValue * 0.09;
    const rowSGST = rowTaxableValue * 0.09;
    const rowTotal = inclusivePrice * item.quantity;

    return `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; border: 1px solid #e2e8f0; padding: 10px;">${index + 1}</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px;">
          <b style="color: #1a202c;">${item.product.name}</b><br>
          <span style="font-size: 0.72rem; color: #718096;">Category: ${item.product.category} | ${item.product.fragile ? 'Fragile' : 'Standard'}</span>
        </td>
        <td style="text-align: center; border: 1px solid #e2e8f0; padding: 10px;">${getHSN(item.product.category)}</td>
        <td style="text-align: center; border: 1px solid #e2e8f0; padding: 10px;">${item.quantity}</td>
        <td style="text-align: right; border: 1px solid #e2e8f0; padding: 10px;">₹${taxableValue.toFixed(2)}</td>
        <td style="text-align: right; border: 1px solid #e2e8f0; padding: 10px;">₹${rowTaxableValue.toFixed(2)}</td>
        <td style="text-align: center; border: 1px solid #e2e8f0; padding: 10px;">9%</td>
        <td style="text-align: center; border: 1px solid #e2e8f0; padding: 10px;">9%</td>
        <td style="text-align: right; font-weight: 700; border: 1px solid #e2e8f0; padding: 10px; color: #1a202c;">₹${rowTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  invArea.innerHTML = `
    <div style="position: relative; font-family: 'Outfit', 'Segoe UI', sans-serif; color: #2d3748; padding: 10px 0; background: #fff;">
      
      <!-- Rotated Stamp -->
      <div style="position: absolute; top: 110px; right: 30px; width: 130px; height: 130px; border: 4px double ${o.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.85; pointer-events: none; font-family: 'Outfit', sans-serif; background: rgba(255, 255, 255, 0.9);">
        <span style="font-size: 0.8rem; font-weight: 800; color: ${o.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; letter-spacing: 1.5px; text-transform: uppercase;">DIGISOFT</span>
        <span style="font-size: 1.35rem; font-weight: 950; color: ${o.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; text-transform: uppercase; margin: 1px 0;">${o.paymentStatus === 'Paid' ? 'PAID' : 'COD'}</span>
        <span style="font-size: 0.65rem; font-weight: 700; color: ${o.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'};">${o.paymentStatus === 'Paid' ? 'ONLINE TRx' : 'UNPAID'}</span>
      </div>

      <div class="invoice-header" style="border-bottom: 3px solid #1a202c; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="inv-logo" style="font-size: 2.4rem; font-weight: 900; letter-spacing: -1.5px; color: #0f172a; line-height: 1.0; font-family: 'Outfit', sans-serif;">DIGISOFT</div>
          <p style="font-size: 0.85rem; color: #475569; font-weight: 600; margin-top: 5px; margin-bottom: 5px;">Digisoft Gift Shop Private Limited</p>
          <p style="font-size: 0.78rem; color: #64748b; line-height: 1.5; margin: 0;">
            101, Luxury Boulevard, Suite A, New York, NY 10001<br>
            Email: support@digisoftgiftshop.com | Helpline: +1 (555) 123-4567<br>
            <b>GSTIN: 36AAAAA1111A1Z0</b> (State Code: 36 - Telengana)
          </p>
        </div>
        <div class="invoice-meta" style="text-align: right; min-width: 250px; line-height: 1.6;">
          <h2 style="font-size: 2.0rem; font-weight: 950; color: #0f172a; letter-spacing: -0.5px; margin: 0 0 10px 0; border-bottom: 2px solid #C5A059; padding-bottom: 5px; text-transform: uppercase;">TAX INVOICE</h2>
          <p style="margin: 0; font-size: 0.85rem;"><b>Invoice ID:</b> INV-${o.id.substring(3)}</p>
          <p style="margin: 0; font-size: 0.85rem;"><b>Invoice Date:</b> ${dateStr}</p>
          <p style="margin: 0; font-size: 0.85rem;"><b>Purchase Order Ref:</b> ${o.id}</p>
          <p style="margin: 0; font-size: 0.85rem;"><b>Courier AWB:</b> BD-AWB-${o.id.substring(3)}</p>
        </div>
      </div>

      ${containsFragile ? `
        <div class="fragile-sticker" style="display:inline-flex; align-items:center; gap:8px; background: #fff1f0; border: 1px solid #ffa39e; color: #f5222d; padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg> Handle With Care: Fragile Crockery / Dinnerware included
        </div>
      ` : ''}

      <div class="invoice-details-grid" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 25px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; line-height: 1.5;">
          <h4 style="border-bottom: 1.5px solid #C5A059; padding-bottom: 4px; margin-top: 0; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">Billed & Shipped To:</h4>
          <p style="font-size: 0.95rem; margin: 0 0 4px 0; color: #0f172a;"><b>Customer Name:</b> ${o.customer.name}</p>
          <p style="font-size: 0.9rem; margin: 0 0 4px 0; color: #334155;"><b>Contact Phone:</b> ${o.customer.phone}</p>
          <p style="font-size: 0.9rem; margin: 0; color: #334155;"><b>Shipping Address:</b> ${o.customer.address}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; line-height: 1.5;">
          <h4 style="border-bottom: 1.5px solid #C5A059; padding-bottom: 4px; margin-top: 0; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">Transaction Details:</h4>
          <p style="font-size: 0.9rem; margin: 0 0 4px 0; color: #334155;"><b>Payment Method:</b> ${o.paymentMode} (${o.paymentMode === 'COD' ? 'Cash on Delivery' : 'Prepaid Gateway'})</p>
          <p style="font-size: 0.9rem; margin: 0 0 4px 0; color: #334155;"><b>Transaction Status:</b> <span style="font-weight: 700; color: ${o.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}">${o.paymentStatus}</span></p>
          <p style="font-size: 0.9rem; margin: 0; color: #334155;"><b>Shipping Status:</b> ${o.courierStatus} (BlueDart Express)</p>
        </div>
      </div>

      <table class="invoice-items-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 0.85rem;">
        <thead>
          <tr style="background: #1e293b; color: #fff;">
            <th style="padding: 10px; font-weight: 700; text-align: center; width: 40px; border: 1px solid #e2e8f0;">S.No</th>
            <th style="padding: 10px; font-weight: 700; text-align: left; border: 1px solid #e2e8f0;">Product Description</th>
            <th style="padding: 10px; font-weight: 700; text-align: center; width: 80px; border: 1px solid #e2e8f0;">HSN Code</th>
            <th style="padding: 10px; font-weight: 700; text-align: center; width: 50px; border: 1px solid #e2e8f0;">Qty</th>
            <th style="padding: 10px; font-weight: 700; text-align: right; width: 90px; border: 1px solid #e2e8f0;">Rate (Base)</th>
            <th style="padding: 10px; font-weight: 700; text-align: right; width: 100px; border: 1px solid #e2e8f0;">Taxable Amt</th>
            <th style="padding: 10px; font-weight: 700; text-align: center; width: 60px; border: 1px solid #e2e8f0;">CGST</th>
            <th style="padding: 10px; font-weight: 700; text-align: center; width: 60px; border: 1px solid #e2e8f0;">SGST</th>
            <th style="padding: 10px; font-weight: 700; text-align: right; width: 100px; border: 1px solid #e2e8f0;">Total Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 25px;">
        <div style="font-size: 0.82rem; color: #475569; line-height: 1.6;">
          <p style="margin: 0 0 10px 0;"><b>Amount Chargeable in Words:</b><br><span style="font-size: 0.9rem; font-weight: 700; color: #0f172a;">${priceToWords(o.total)}</span></p>
          
          ${pointsEarned > 0 ? `
            <p style="margin: 0 0 10px 0; color: #10b981; font-weight: 700; font-size: 0.85rem;">
              💚 Loyalty points earned on this order: ${pointsEarned} Points
            </p>
          ` : ''}

          <p style="font-size: 0.75rem; color: #64748b; margin-top: 15px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
            <b>Tax Declarations:</b><br>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Intrastate supply triggers split CGST 9% & SGST 9%.
          </p>
        </div>
        <div class="invoice-summary-block" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; font-size: 0.88rem; color: #334155; width: 100%;">
          <div style="display:flex; justify-content:space-between; width:100%;"><span>Gross Subtotal:</span> <b style="text-align: right; width: 120px;">₹${subtotal.toFixed(2)}</b></div>
          
          ${discount > 0 ? `
            <div style="display:flex; justify-content:space-between; width:100%; color: #C5A059;">
              <span>Coupon Discount:</span> 
              <span style="text-align: right; width: 120px;">-₹${discount.toFixed(2)}</span>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; width:100%;"><span>Taxable Subtotal:</span> <b style="text-align: right; width: 120px;">₹${baseTaxableValue.toFixed(2)}</b></div>
          <div style="display:flex; justify-content:space-between; width:100%;"><span>Add CGST (9%):</span> <span style="text-align: right; width: 120px;">₹${totalCGST.toFixed(2)}</span></div>
          <div style="display:flex; justify-content:space-between; width:100%;"><span>Add SGST (9%):</span> <span style="text-align: right; width: 120px;">₹${totalSGST.toFixed(2)}</span></div>
          <div style="display:flex; justify-content:space-between; width:100%;"><span>Integrated GST (IGST):</span> <span style="text-align: right; width: 120px;">₹0.00 (0%)</span></div>
          
          ${pointsRedeemed > 0 ? `
            <div style="display:flex; justify-content:space-between; width:100%; color: #10b981;">
              <span>Loyalty Points Redeemed:</span> 
              <span style="text-align: right; width: 120px;">-₹${pointsRedeemed.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="total" style="font-size: 1.35rem; font-weight: 950; color: #0f172a; border-top: 3px double #0f172a; padding-top: 8px; margin-top: 5px; width: 100%; display:flex; justify-content:space-between;">
            <span>Grand Total:</span> <span style="color: #C5A059; text-align: right; width: 120px;">₹${o.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; font-size: 0.85rem; color: #333;">
        <div class="invoice-notes" style="width: 60%; margin: 0; padding: 0; border: none;">
          <p style="font-weight: 700; color: #000; margin-bottom: 5px;">Invoice Terms:</p>
          <p style="margin: 0; line-height: 1.4;">
            1. Goods once sold are packed securely under warehouse surveillance.<br>
            2. Intrastate CGST & SGST mapped as per State Code 36 rules.<br>
            3. Computer-generated Tax Invoice - Requires no physical signature.
          </p>
        </div>
        <div style="text-align: right; min-width: 200px;">
          <p style="font-size: 0.82rem; margin-bottom: 45px; font-weight: 700; color: #000;">For DIGISOFT GIFT SHOP PVT. LTD.</p>
          <p style="border-top: 1px solid #888; padding-top: 5px; font-size: 0.8rem; display: inline-block; width: 180px; text-align: center;">Authorised Signatory</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('invoice-modal').classList.add('active');
};

const renderEditingReviews = () => {
  const container = document.getElementById('edit-sku-reviews-container');
  if (!container) return;

  if (currentEditingReviews.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin:10px 0;">No reviews registered for this product.</p>`;
    return;
  }

  container.innerHTML = currentEditingReviews.map((rev, idx) => {
    const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
    const dateStr = rev.timestamp ? new Date(rev.timestamp).toLocaleDateString('en-IN') : 'N/A';
    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed var(--glass-border); padding:8px 0; font-size:0.8rem;">
        <div style="flex-grow:1; padding-right:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span style="font-weight:700; color:var(--text-main);">${rev.reviewerName}</span>
            <span style="color:var(--primary); font-weight:600;">${stars}</span>
          </div>
          <p style="margin:0; color:var(--text-muted); font-size:0.75rem; line-height:1.3;">${rev.comment}</p>
          <span style="font-size:0.65rem; color:rgba(255,255,255,0.3);">${dateStr}</span>
        </div>
        <button type="button" class="btn-delete-review" data-idx="${idx}" style="background:none; border:none; color:#ff4a4a; cursor:pointer; font-weight:bold; font-size:0.9rem; padding: 2px 6px;">
          &times;
        </button>
      </div>
    `;
  }).join('');

  // Bind delete buttons
  container.querySelectorAll('.btn-delete-review').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      currentEditingReviews.splice(idx, 1);
      renderEditingReviews();
    });
  });
};

window.addEventListener('load', () => {
  document.body.classList.remove('preload');
});


  }, []);

  return (
    <>
      
  {/* Premium Login / Signup Screen */}
  <div className="auth-container active" id="auth-panel">
    <div className="auth-card">
      <div className="auth-header">
        <div className="logo">DIGISOFT <span className="badge">ERP SYSTEM</span></div>
        <h2 id="auth-title">Welcome Back</h2>
        <p id="auth-subtitle">Please enter your credentials to access operations.</p>
      </div>
      
      {/* Login Panel */}
      <form id="login-form" className="auth-form active">
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrap">
            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <input type="email" id="login-email" required placeholder="admin@digisoft.com" />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrap">
            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <input type="password" id="login-password" required placeholder="••••••••" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-block">Sign In</button>
        <p className="auth-toggle-text" style={{"fontSize":"0.8rem","opacity":"0.8","marginTop":"15px"}}>Please contact your developer for creating your admin account.</p>
      </form>
    </div>
  </div>

  {/* Nav Bar */}
  <nav className="erp-nav">
    <div className="logo">DIGISOFT <span className="badge">ERP SYSTEM</span></div>
    <ul className="nav-links">
      <li><a href="/index.html" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>Back to Store</a></li>
      <li><a href="#" id="admin-logout-btn" style={{"color":"#ff4a4a","display":"flex","alignItems":"center","gap":"4px"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>Logout</a></li>
    </ul>
    <div className="nav-icons">
      <div className="db-status"><span className="status-indicator online"></span> ERP Pipeline Active</div>
    </div>
  </nav>

  {/* Dashboard Overview Metrics */}
  <header className="erp-dashboard-header">
    <div className="section-container">
      <div className="section-tag" id="welcome-user-tag">Internal Database Portal</div>
      <h2>Warehouse Operations & Inventory Control</h2>
      <div className="erp-metrics-grid">
        <div className="metric-card">
          <span className="card-title">Total Sales Revenue</span>
          <h3 id="metric-revenue">₹0.00</h3>
          <p style={{"color":"#25D366","fontSize":"0.8rem","display":"flex","alignItems":"center","gap":"4px"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            Live ERP calculations
          </p>
        </div>
        <div className="metric-card">
          <span className="card-title">Processed Orders</span>
          <h3 id="metric-orders">0</h3>
          <p style={{"color":"var(--text-muted)","fontSize":"0.8rem"}}>Ready for dispatch</p>
        </div>
        <div className="metric-card font-danger">
          <span className="card-title">Low Stock Warnings</span>
          <h3 id="metric-lowstock" className="low-stock-count">0</h3>
          <p style={{"color":"#ff4a4a","fontSize":"0.8rem","display":"flex","alignItems":"center","gap":"4px"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Below 5 items
          </p>
        </div>
        <div className="metric-card">
          <span className="card-title">Average Gross Margin</span>
          <h3>64.8%</h3>
          <p style={{"color":"var(--text-muted)","fontSize":"0.8rem"}}>Gifts & Crockery avg.</p>
        </div>
      </div>
    </div>
  </header>

  {/* Main Grid Controls */}
  <main className="erp-main-section">
    <div className="section-container">
      <div className="erp-tabs">
        <button className="tab-btn active" id="tab-orders-btn" style={{"display":"flex","alignItems":"center","gap":"6px"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path>
            <path d="M14 14.5a2.5 2.5 0 0 0-5 0v1a2.5 2.5 0 0 0 5 0v-1Z"></path>
            <path d="M12 8V6"></path>
            <path d="M12 18v1"></path>
          </svg>
          Orders Queue (<span id="orders-count-badge">0</span>)
        </button>
        <button className="tab-btn" id="tab-inventory-btn" style={{"display":"flex","alignItems":"center","gap":"6px"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 8-6 4-6-4-6 4-2-1.33v6.66l2 1.33 6-4 6 4 6-4z"></path>
            <path d="m22 4-10-5-10 5 10 5z"></path>
            <path d="M2 14.67v6l10 5 10-5v-6"></path>
          </svg>
          Inventory Registry
        </button>
      </div>

      {/* Content Window */}
      <div className="erp-content-box">
        
        {/* Orders Management Panel */}
        <div className="erp-tab-content active" id="erp-orders-panel">
          <div className="panel-header">
            <h3>Pending Orders Dispatch Queue</h3>
          </div>
          
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","gap":"15px","marginBottom":"25px","flexWrap":"wrap"}}>
            <div style={{"position":"relative","width":"300px"}}>
              <svg style={{"position":"absolute","left":"12px","top":"12px","color":"var(--text-muted)"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="order-search-input" placeholder="Search by name, ID, or status..." style={{"paddingLeft":"40px !important"}} />
            </div>
            <div style={{"display":"flex","gap":"10px","flexWrap":"wrap"}} id="order-status-filters">
              <button className="btn btn-outline filter-status-btn active" data-filter="All" style={{"padding":"6px 12px","fontSize":"0.85rem"}}>All</button>
              <button className="btn btn-outline filter-status-btn" data-filter="Active" style={{"padding":"6px 12px","fontSize":"0.85rem"}}>Active Queue</button>
              <button className="btn btn-outline filter-status-btn" data-filter="Delivered" style={{"padding":"6px 12px","fontSize":"0.85rem"}}>Delivered (History)</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>WhatsApp Number</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Courier Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="orders-table-body">
                {/* Injected dynamically */}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Registry Panel */}
        <div className="erp-tab-content" id="erp-inventory-panel">
          <div className="panel-header" style={{"display":"flex","justifyContent":"space-between","alignItems":"center","flexWrap":"wrap","gap":"15px"}}>
            <div>
              <h3>Inventory Item Master List</h3>
              <p style={{"color":"var(--text-muted)","fontSize":"0.9rem"}}>Edit pricing, replenish stock levels, or adjust tagging configuration values.</p>
            </div>
            <button className="btn btn-primary" id="add-combo-btn" style={{"display":"flex","alignItems":"center","gap":"6px"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
              Create Combo Hamper
            </button>
          </div>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>SKU ID</th>
                  <th>Thumbnail</th>
                  <th>Product Name</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Base Price</th>
                  <th>Stock Count</th>
                  <th>Safety Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="inventory-table-body">
                {/* Injected dynamically */}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </main>

  {/* Edit Stock Modal popup */}
  <div className="erp-modal-overlay" id="edit-stock-modal">
    <div className="erp-modal">
      <div className="close-modal" id="close-stock-modal-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h3>Modify SKU Master Data</h3>
      <form id="edit-stock-form" style={{"marginTop":"1.5rem"}}>
        <input type="hidden" id="edit-sku-id" />
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Product Name</label>
          <input type="text" id="edit-sku-name" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Image URL</label>
          <input type="text" id="edit-sku-image" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Description</label>
          <textarea id="edit-sku-description" rows="3" style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","resize":"vertical","fontFamily":"inherit"}}></textarea>
        </div>
        <div className="form-row" style={{"display":"grid","gridTemplateColumns":"1fr 1fr 1fr","gap":"15px","marginBottom":"1.5rem"}}>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Department</label>
            <select id="edit-sku-department" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Category</label>
            <select id="edit-sku-category" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Sub Category</label>
            <select id="edit-sku-subcategory" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
        </div>
        <div className="form-row" style={{"display":"grid","gridTemplateColumns":"1fr 1fr 1fr","gap":"15px","marginBottom":"1.5rem"}}>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Price (₹)</label>
            <input type="number" id="edit-sku-price" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Stock Level</label>
            <input type="number" id="edit-sku-stock" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Products Sold</label>
            <input type="number" id="edit-sku-sold-count" min="0" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
          </div>
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"10px"}}>Security & Fragile Flags</label>
          <div style={{"display":"flex","gap":"20px"}}>
            <label style={{"display":"flex","alignItems":"center","gap":"8px","cursor":"pointer"}}>
              <input type="checkbox" id="edit-sku-fragile" />
              <span>Fragile Item Tag</span>
            </label>
            <label style={{"display":"flex","alignItems":"center","gap":"8px","cursor":"pointer"}}>
              <input type="checkbox" id="edit-sku-microwave" />
              <span>Microwave Safe</span>
            </label>
          </div>
        </div>
        
        {/* Ratings & Reviews Section */}
        <div className="form-group" style={{"marginBottom":"2rem","borderTop":"1px dashed var(--glass-border)","paddingTop":"1.5rem"}}>
          <label style={{"display":"block","fontSize":"0.95rem","color":"var(--primary)","fontWeight":"700","marginBottom":"10px"}}>Ratings & Customer Reviews</label>
          
          {/* Reviews list manager */}
          <div id="edit-sku-reviews-container" style={{"maxHeight":"180px","overflowY":"auto","background":"rgba(0,0,0,0.2)","border":"1px solid var(--glass-border)","borderRadius":"8px","padding":"10px","marginBottom":"15px"}}>
            <p style={{"fontSize":"0.8rem","color":"var(--text-muted)","textAlign":"center","margin":"10px 0"}}>No reviews registered for this product.</p>
          </div>

          {/* Add new review manually */}
          <div style={{"background":"rgba(197, 160, 89, 0.05)","border":"1px solid rgba(197, 160, 89, 0.2)","borderRadius":"8px","padding":"12px"}}>
            <h5 style={{"margin":"0 0 10px 0","color":"var(--text-main)","fontSize":"0.85rem","fontWeight":"600"}}>Add Review Manually</h5>
            <div className="form-row" style={{"display":"grid","gridTemplateColumns":"2fr 1fr","gap":"10px","marginBottom":"10px"}}>
              <input type="text" id="new-review-name" placeholder="Reviewer Name" style={{"width":"100%","padding":"8px","borderRadius":"6px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","fontSize":"0.8rem"}} />
              <select id="new-review-rating" style={{"width":"100%","padding":"8px","borderRadius":"6px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","fontSize":"0.8rem"}}>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div style={{"display":"flex","gap":"10px"}}>
              <textarea id="new-review-comment" rows="2" placeholder="Review Comment..." style={{"flexGrow":"1","padding":"8px","borderRadius":"6px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","fontSize":"0.8rem","resize":"none","fontFamily":"inherit"}}></textarea>
              <button type="button" className="btn btn-outline" id="add-review-manual-btn" style={{"padding":"0 15px","fontSize":"0.8rem","borderRadius":"6px","flexShrink":"0"}}>Add</button>
            </div>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary btn-block">Apply Master Update</button>
      </form>
    </div>
  </div>

  {/* Create Combo Modal popup */}
  <div className="erp-modal-overlay" id="add-combo-modal">
    <div className="erp-modal">
      <div className="close-modal" id="close-combo-modal-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h3>Create Gift Bundle / Combo hamper</h3>
      <form id="add-combo-form" style={{"marginTop":"1.5rem"}}>
        <div className="form-group" style={{"marginBottom":"1.2rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Combo Name</label>
          <input type="text" id="combo-name" placeholder="e.g. Luxury High-Tea hamper" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
        </div>
        <div className="form-row" style={{"display":"grid","gridTemplateColumns":"1fr 1fr 1fr","gap":"15px","marginBottom":"1.2rem"}}>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Department</label>
            <select id="combo-department" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Category</label>
            <select id="combo-category" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Sub Category</label>
            <select id="combo-subcategory" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}}>
            </select>
          </div>
        </div>
        <div className="form-row" style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"15px","marginBottom":"1.2rem"}}>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Package Price (₹)</label>
            <input type="number" id="combo-price" placeholder="e.g. 2999" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
          </div>
          <div className="form-group">
            <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Available Quantity</label>
            <input type="number" id="combo-stock" placeholder="e.g. 10" required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
          </div>
        </div>
        <div className="form-group" style={{"marginBottom":"2rem"}}>
          <label style={{"display":"block","fontSize":"0.85rem","color":"var(--text-main)","marginBottom":"6px"}}>Visual Image URL</label>
          <input type="text" id="combo-image" placeholder="https://images.unsplash.com/..." required style={{"width":"100%","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none"}} />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Register Bundle SKU</button>
      </form>
    </div>
  </div>

  {/* Invoices GST print popup window modal */}
  <div className="invoice-modal-overlay" id="invoice-modal">
    <div className="invoice-wrap">
      <div className="invoice-print-actions">
        <button className="btn btn-outline" id="close-invoice-modal" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Close
        </button>
        <button className="btn btn-primary" onClick="window.print()" style={{"display":"flex","alignItems":"center","gap":"4px"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Invoice (PDF)
        </button>
      </div>
      
      {/* Actual printable area */}
      <div className="invoice-container-print" id="invoice-print-area">
        {/* Renders dynamically */}
      </div>
    </div>
  </div>

  

    </>
  );
}
