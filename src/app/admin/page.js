"use client";

import React, { useState, useEffect } from "react";
import { 
  getProducts, 
  saveProducts, 
  getOrders, 
  updateOrderStatus, 
  updateProduct
} from "../db";
import Link from "next/link";
import "./admin.css";

export default function AdminPage() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab & Search states
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "inventory"
  const [orderFilter, setOrderFilter] = useState("Active"); // "Active" | "Delivered" | "All"
  const [orderSearch, setOrderSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  // Data states (locally stored)
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  // Editing modals states
  const [editingProduct, setEditingProduct] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // New Combo hamper states
  const [newComboName, setNewComboName] = useState("");
  const [newComboPrice, setNewComboPrice] = useState("");
  const [newComboStock, setNewComboStock] = useState("");
  const [newComboImage, setNewComboImage] = useState("");
  const [newComboDept, setNewComboDept] = useState("Crockery & Dining");
  const [newComboCat, setNewComboCat] = useState("Dinnerware");
  const [newComboSub, setNewComboSub] = useState("Dinner Sets");

  // New Review manual input states
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");

  // Toast Notification states
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Check if session was active
    const wasLoggedIn = localStorage.getItem("orient_is_admin") === "true";
    if (wasLoggedIn) {
      setIsLoggedIn(true);
    }
    loadDbData();
  }, []);

  const loadDbData = () => {
    setProductsList(getProducts());
    setOrdersList(getOrders());
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Mock authentication logic
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail.trim() === "admin@orient.com" && loginPassword === "admin123") {
      setIsLoggedIn(true);
      setAuthError("");
      localStorage.setItem("orient_is_admin", "true");
      triggerToast("Logged in successfully to Orient ERP");
    } else {
      setAuthError("Invalid administrator credentials. Access Denied.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("orient_is_admin");
    triggerToast("Logged out successfully");
  };

  // Order status management
  const handleProcessOrder = (orderId, nextStatus) => {
    updateOrderStatus(orderId, nextStatus);
    loadDbData();
    triggerToast(`Order ${orderId} marked as ${nextStatus}`);
  };

  // Metric computations
  const totalRevenue = ordersList.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = ordersList.filter(o => o.status !== "Delivered").length;
  const lowStockCount = productsList.filter(p => p.stock < 5).length;

  // Filters for order listing
  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    
    const matchesStatus = orderFilter === "All" ||
                          (orderFilter === "Active" && order.status !== "Delivered") ||
                          (orderFilter === "Delivered" && order.status === "Delivered");
    
    return matchesSearch && matchesStatus;
  });

  // Filters for products inventory
  const filteredProducts = productsList.filter(p => 
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.barcode.includes(inventorySearch) ||
    p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Edit stock update
  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Calculate ratings based on edited review entries
    const reviews = editingProduct.reviews || [];
    let rating = editingProduct.rating || 0;
    if (reviews.length > 0) {
      const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
      rating = Math.round((totalRatings / reviews.length) * 10) / 10;
    }

    const updated = {
      ...editingProduct,
      price: parseFloat(editingProduct.price),
      stock: parseInt(editingProduct.stock),
      soldCount: parseInt(editingProduct.soldCount) || 0,
      gst: parseFloat(editingProduct.gst) || 18,
      rating,
      reviewCount: reviews.length
    };

    updateProduct(editingProduct.id, updated);
    loadDbData();
    setEditingProduct(null);
    triggerToast(`Updated Product: ${updated.name}`);
  };

  // Add review manually to product stock
  const handleAddReviewManually = (e) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

    const newRev = {
      id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      reviewerName: newReviewAuthor.trim(),
      rating: parseInt(newReviewRating),
      comment: newReviewText.trim(),
      timestamp: new Date().toISOString()
    };

    setEditingProduct(prev => ({
      ...prev,
      reviews: [...(prev.reviews || []), newRev]
    }));

    setNewReviewAuthor("");
    setNewReviewText("");
    setNewReviewRating(5);
  };

  const handleDeleteReview = (revId) => {
    setEditingProduct(prev => ({
      ...prev,
      reviews: (prev.reviews || []).filter(r => r.id !== revId)
    }));
  };

  // Add combo hamper
  const handleAddCombo = (e) => {
    e.preventDefault();
    if (!newComboName || !newComboPrice || !newComboStock) {
      alert("Please fill in core hamper details.");
      return;
    }

    const newId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 : 101;
    const newCombo = {
      id: newId,
      name: newComboName,
      price: parseFloat(newComboPrice),
      stock: parseInt(newComboStock),
      image: newComboImage || "/images/acacia_wood_casserole.png",
      department: newComboDept,
      category: newComboCat,
      subCategory: newComboSub,
      fragile: true,
      microwave: false,
      barcode: "000" + Math.floor(Math.random() * 900000 + 100000),
      hsn: "9505",
      gst: 18,
      soldCount: 0,
      description: "Luxurious curated dining hamper by Orient Crockeries.",
      rating: 5.0,
      reviewCount: 0,
      reviews: []
    };

    const combined = [...productsList, newCombo];
    saveProducts(combined);
    loadDbData();
    setShowComboModal(false);
    setNewComboName("");
    setNewComboPrice("");
    setNewComboStock("");
    setNewComboImage("");
    triggerToast(`Registered new Gift Hamper: ${newComboName}`);
  };

  // Render Authentication form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="auth-container active" style={{ marginTop: "60px" }}>
        <div className="auth-card">
          <div className="auth-header">
            <span className="logo" style={{ fontSize: "1.8rem" }}>ORIENT</span>
            <span className="logo-tagline" style={{ display: "block", fontSize: "0.55rem" }}>Crockeries</span>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginTop: "1rem" }}>ERP Administrator Access</h2>
            <p>Verification required to connect local databases</p>
          </div>
          
          <form onSubmit={handleLogin} className="auth-form active">
            <div className="form-group">
              <span className="form-label">Administrator Email</span>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@orient.com" 
                required 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <span className="form-label">Password</span>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Password" 
                required 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
              />
            </div>
            {authError && <p style={{ color: "var(--error)", fontSize: "0.8rem", textAlign: "center" }}>{authError}</p>}
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Secure Credentials Login
            </button>
            <p className="auth-toggle-text" style={{ fontSize: "0.75rem" }}>
              Mock Admin Account: <b>admin@orient.com</b> | password: <b>admin123</b>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-page" style={{ marginTop: "60px", minHeight: "100vh", backgroundColor: "var(--bg-main)", paddingBottom: "5rem" }}>
      {/* Announcement/Header Stats Bar */}
      <div className="erp-dashboard-header" style={{ padding: "4rem 6% 2rem 6%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem" }}>DigiSoft ERP Dashboard</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Orient Crockeries Operations Registry &bull; Local Storage Mode</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout Portal
          </button>
        </div>

        {/* Metric widgets grid */}
        <div className="erp-metrics-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="metric-card">
            <span className="card-title">Consolidated Revenue</span>
            <h3>₹{totalRevenue.toLocaleString("en-IN")}</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total cash volume cleared</p>
          </div>
          <div className="metric-card">
            <span className="card-title">Active Orders</span>
            <h3>{pendingOrdersCount}</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Awaiting packing &amp; dispatch</p>
          </div>
          <div className="metric-card">
            <span className="card-title">Low Stock Items</span>
            <h3 style={{ color: lowStockCount > 0 ? "var(--error)" : "inherit" }}>{lowStockCount}</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Stock units below 5</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="erp-main-section" style={{ padding: "0 6%" }}>
        <div className="erp-tabs">
          <button 
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fa-solid fa-dolly"></i> Orders Queue
          </button>
          <button 
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="fa-solid fa-boxes-stacked"></i> Inventory Registry
          </button>
        </div>

        {/* Tab 1: Orders Queue */}
        {activeTab === "orders" && (
          <div className="erp-content-box">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>Shipment Dispatches Queue</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Change statuses to trigger simulated BlueDart tracking logs</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <select 
                  className="sort-select"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  style={{ borderRadius: "8px" }}
                >
                  <option value="Active">Active Dispatches</option>
                  <option value="Delivered">Completed Deliveries</option>
                  <option value="All">All Transactions</option>
                </select>
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Search by ID or customer..." 
                  style={{ width: "240px", borderRadius: "8px" }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th>Invoice Total</th>
                    <th>Status</th>
                    <th>Courier Logs</th>
                    <th>Next Milestone Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No orders recorded matching criteria. Place a mock checkout to populate this panel.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: "700" }}>{order.id}</td>
                        <td style={{ fontWeight: "600" }}>{order.customerName}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>₹{order.total.toFixed(2)}</td>
                        <td>
                          <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{order.courierStatus}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {order.status === "Pending" && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ borderColor: "#00aaff", color: "#00aaff" }}
                                onClick={() => handleProcessOrder(order.id, "Packed")}
                              >
                                <i className="fa-solid fa-box"></i> Pack SKU
                              </button>
                            )}
                            {order.status === "Packed" && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                                onClick={() => handleProcessOrder(order.id, "Shipped")}
                              >
                                <i className="fa-solid fa-truck-fast"></i> Ship BlueDart
                              </button>
                            )}
                            {order.status === "Shipped" && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ borderColor: "var(--success)", color: "var(--success)" }}
                                onClick={() => handleProcessOrder(order.id, "Delivered")}
                              >
                                <i className="fa-solid fa-circle-check"></i> Complete
                              </button>
                            )}
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => setInvoiceOrder(order)}
                            >
                              <i className="fa-solid fa-receipt"></i> Print Tax Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === "inventory" && (
          <div className="erp-content-box">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>Product Registry Management</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Configure prices, adjust stock levels, and review user submissions</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Search name, category, barcode..." 
                  style={{ width: "260px", borderRadius: "8px" }}
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={() => setShowComboModal(true)}>
                  <i className="fa-solid fa-circle-plus"></i> Create Gift Hamper
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>SKU ID</th>
                    <th>Image</th>
                    <th>Product Title</th>
                    <th>Department</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock status</th>
                    <th>Flags</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>#SKU-{p.id}</td>
                      <td>
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: "40px", height: "40px", objectFit: "cover", border: "1px solid var(--border)" }} 
                        />
                      </td>
                      <td style={{ fontWeight: "600" }}>{p.name}</td>
                      <td>{p.department}</td>
                      <td>{p.category}</td>
                      <td>₹{p.price.toFixed(2)}</td>
                      <td style={{ 
                        color: p.stock < 5 ? "var(--error)" : "inherit",
                        fontWeight: p.stock < 5 ? "bold" : "normal"
                      }}>
                        {p.stock === 0 ? "Out of Stock" : `${p.stock} units`}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {p.fragile && <span style={{ background: "rgba(169,68,66,0.1)", color: "var(--error)", padding: "2px 6px", fontSize: "0.65rem", fontWeight: "700" }}>FRAGILE</span>}
                          {p.microwave && <span style={{ background: "rgba(58,95,67,0.1)", color: "var(--success)", padding: "2px 6px", fontSize: "0.65rem", fontWeight: "700" }}>MICROWAVE SAFE</span>}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => setEditingProduct({ ...p })}
                        >
                          <i className="fa-regular fa-pen-to-square"></i> Edit Product
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal Form */}
      {editingProduct && (
        <div className="modal-overlay active" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px", gridTemplateColumns: "1.2fr 1fr" }}>
            <button className="modal-close-btn" onClick={() => setEditingProduct(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <form onSubmit={handleUpdateProduct} className="modal-content-side" style={{ borderRight: "1px solid var(--border)", overflowY: "auto", maxHeight: "80vh" }}>
              <span className="modal-meta-label">Edit product specifications</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem" }}>#SKU-{editingProduct.id} Settings</h2>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Product Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Price (₹)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Stock Units</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Barcode</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.barcode || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">HSN Code</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingProduct.hsn || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">GST Rate (%)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingProduct.gst || 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gst: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Department</span>
                  <select 
                    className="sort-select"
                    value={editingProduct.department}
                    onChange={(e) => setEditingProduct({ ...editingProduct, department: e.target.value })}
                  >
                    <option value="Gifting">Gifting</option>
                    <option value="Crockery & Dining">Crockery & Dining</option>
                    <option value="Cookware">Cookware</option>
                    <option value="Woodcraft">Woodcraft</option>
                    <option value="Home Décor">Home Décor</option>
                  </select>
                </div>
                <div className="form-group full-width" style={{ flexDirection: "row", gap: "20px", marginTop: "10px" }}>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.fragile}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fragile: e.target.checked })}
                    />
                    <span>Fragile Handling</span>
                  </label>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.microwave}
                      onChange={(e) => setEditingProduct({ ...editingProduct, microwave: e.target.checked })}
                    />
                    <span>Microwave Safe</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Save Product Changes
              </button>
            </form>

            {/* Editing Product Reviews Side panel */}
            <div className="modal-content-side" style={{ overflowY: "auto", maxHeight: "80vh" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", marginBottom: "1rem" }}>Product Reviews Review</h3>
              
              {/* Manual Review additions */}
              <div style={{ padding: "12px", border: "1px solid var(--border)", backgroundColor: "var(--bg-alt)", marginBottom: "1.5rem" }}>
                <span className="modal-meta-label">Inject Customer Review</span>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    type="text" 
                    className="loyalty-input" 
                    placeholder="Author Name"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                  />
                  <select 
                    className="sort-select" 
                    value={newReviewRating} 
                    onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                    style={{ padding: "4px" }}
                  >
                    <option value="5">5★</option>
                    <option value="4">4★</option>
                    <option value="3">3★</option>
                  </select>
                </div>
                <textarea 
                  rows="2" 
                  className="form-input" 
                  placeholder="Review review details..."
                  style={{ resize: "none", fontSize: "0.8rem", width: "100%", padding: "6px" }}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                />
                <button 
                  className="btn btn-outline btn-sm btn-full" 
                  style={{ marginTop: "8px", padding: "4px" }}
                  onClick={handleAddReviewManually}
                >
                  Insert Review
                </button>
              </div>

              {/* Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(!editingProduct.reviews || editingProduct.reviews.length === 0) ? (
                  <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>No customer reviews injected.</p>
                ) : (
                  editingProduct.reviews.map(rev => (
                    <div key={rev.id} style={{ fontSize: "0.8rem", padding: "8px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                        <span>{rev.reviewerName} ({rev.rating}★)</span>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                      <p style={{ color: "var(--text-muted)" }}>{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Hamper / Combo Modal */}
      {showComboModal && (
        <div className="modal-overlay active" onClick={() => setShowComboModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", gridTemplateColumns: "1fr" }}>
            <button className="modal-close-btn" onClick={() => setShowComboModal(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <form onSubmit={handleAddCombo} className="modal-content-side">
              <span className="modal-meta-label">Hamper Registration</span>
              <h2 className="modal-title" style={{ fontSize: "1.6rem", marginBottom: "1.5rem" }}>Register Gift Hamper / Combo</h2>
              
              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group full-width">
                  <span className="form-label">Hamper Title Name</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="E.g. Diwali Teapot Gold Premium Set"
                    value={newComboName} 
                    onChange={(e) => setNewComboName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Price (₹)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    placeholder="2500"
                    value={newComboPrice} 
                    onChange={(e) => setNewComboPrice(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Stock Units</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    placeholder="10"
                    value={newComboStock} 
                    onChange={(e) => setNewComboStock(e.target.value)} 
                  />
                </div>
                <div className="form-group full-width">
                  <span className="form-label">Image URL Path</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="/images/acacia_wood_casserole.png"
                    value={newComboImage} 
                    onChange={(e) => setNewComboImage(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Department</span>
                  <select 
                    className="sort-select"
                    value={newComboDept}
                    onChange={(e) => setNewComboDept(e.target.value)}
                  >
                    <option value="Gifting">Gifting</option>
                    <option value="Crockery & Dining">Crockery & Dining</option>
                    <option value="Cookware">Cookware</option>
                    <option value="Woodcraft">Woodcraft</option>
                    <option value="Home Décor">Home Décor</option>
                  </select>
                </div>
                <div className="form-group">
                  <span className="form-label">Category Group</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Gift Hampers"
                    value={newComboCat}
                    onChange={(e) => setNewComboCat(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Register in Database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal for Print Review */}
      {invoiceOrder && (
        <div className="modal-overlay active" onClick={() => setInvoiceOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px", gridTemplateColumns: "1fr", maxHeight: "90vh", padding: "10px" }}>
            <button className="modal-close-btn" onClick={() => setInvoiceOrder(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-content-side" style={{ overflowY: "auto", maxHeight: "80vh" }}>
              
              {/* Printed invoice wrapper */}
              <div style={{ border: "1px solid var(--border)", padding: "2rem", backgroundColor: "white", color: "black" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid black", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: "bold" }}>ORIENT</span>
                    <span style={{ display: "block", fontSize: "0.55rem", letterSpacing: "2px", textTransform: "uppercase" }}>Crockeries</span>
                    <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "5px" }}>Delhi Warehouse Outlet, IN</p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--primary)" }}>TAX INVOICE</h3>
                    <p>Reference ID: <b>{invoiceOrder.id}</b></p>
                    <p>Date: <b>{new Date(invoiceOrder.date).toLocaleDateString()}</b></p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
                  <div>
                    <h4>Delivery To</h4>
                    <p><b>{invoiceOrder.customerName}</b><br />{invoiceOrder.shippingAddress}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <h4>Courier Carrier</h4>
                    <p>BlueDart Air Cargo<br />Status: {invoiceOrder.courierStatus}</p>
                  </div>
                </div>

                <table className="invoice-table" style={{ fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th>Piece Description</th>
                      <th>Barcode</th>
                      <th>Qty</th>
                      <th style={{ textAlign: "right" }}>Inclusive Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOrder.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td style={{ color: "#666" }}>{item.barcode}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ width: "240px", marginLeft: "auto", fontSize: "0.8rem", marginTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Subtotal</span>
                    <span>₹{invoiceOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Discounts</span>
                    <span>-₹{(invoiceOrder.discount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Shipping Fee</span>
                    <span>{invoiceOrder.shipping === 0 ? "FREE" : `₹${invoiceOrder.shipping.toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1.5px solid black", fontWeight: "bold", fontSize: "1.1rem" }}>
                    <span>Grand Total</span>
                    <span>₹{invoiceOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
                <button className="btn btn-outline" onClick={() => window.print()}>
                  <i className="fa-solid fa-print"></i> Trigger Print System
                </button>
                <button className="btn btn-primary" onClick={() => setInvoiceOrder(null)}>
                  Close Review
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <div className={`toast toast-success ${showToast ? "show" : ""}`}>
        <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "1.1rem" }}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
