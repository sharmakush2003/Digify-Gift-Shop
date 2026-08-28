"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import "./delivery.css";

export default function DeliveryPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [ordersList, setOrdersList] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned");
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [prevAssignedCount, setPrevAssignedCount] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Check session authorization on load
  useEffect(() => {
    const isAuth = sessionStorage.getItem("orient_delivery_authenticated") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch orders when authenticated or active tab changes
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, activeTab]);

  // Periodic polling for live dispatch alerts
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadOrders(true); // Silent reload in background
    }, 15000); // 15 seconds heartbeat

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const playAlertSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
      audio.volume = 0.8;
      audio.play().catch(e => console.log("Audio alert blocked by browser autoplay policy:", e));
    } catch (err) {
      console.warn("Failed to play notification chime audio:", err);
    }
  };

  const loadOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch', pin: '1994' })
      });
      const { data, error, success, orders } = await res.json();
      if (!success) throw new Error("Failed to fetch orders");
      const fetchedData = orders || data;

      let fetchedOrders = fetchedData ? fetchedData.map(dbOrder => ({
        id: dbOrder.order_number || dbOrder.id,
        date: dbOrder.created_at,
        customerName: dbOrder.guest_email ? dbOrder.guest_email.split('@')[0] : 'Customer',
        shippingAddress: dbOrder.shipping_address?.raw_text || 'N/A',
        total: dbOrder.final_total || 0,
        delivery_otp: dbOrder.shipping_address?.delivery_otp || null,
        paymentStatus: dbOrder.payment_status === 'SUCCESS' ? 'Paid' : 'Pending',
        status: (dbOrder.order_status === 'NEW' || dbOrder.order_status === 'PAYMENT_PENDING') ? 'Pending' : (dbOrder.order_status === 'PACKED' ? 'Packed' : (dbOrder.order_status === 'DISPATCHED' ? 'Shipped' : (dbOrder.order_status === 'DELIVERED' ? 'Delivered' : 'Pending'))),
      })) : [];
      fetchedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Filter assigned deliveries to monitor for new dispatches
      const activeOrders = fetchedOrders.filter(
        (o) => o.status === "Packed" || o.status === "Shipped" || o.status === "Pending"
      );
      const currentCount = activeOrders.length;

      setPrevAssignedCount((prev) => {
        // If count of assigned dispatches has increased, play alarm chime!
        if (prev !== null && currentCount > prev) {
          playAlertSound();
          triggerToast("New Dispatch Order Assigned!");
        }
        return currentCount;
      });

      setOrdersList(fetchedOrders);
    } catch (e) {
      console.error("Error loading delivery dispatches from Supabase:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    // Default PIN: 1994 (Heritage establishment year of Orient Crockeries)
    if (pinInput === "1994") {
      setIsAuthenticated(true);
      setAuthError("");
      sessionStorage.setItem("orient_delivery_authenticated", "true");
    } else {
      setAuthError("Invalid Passcode. Access Denied.");
      setPinInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("orient_delivery_authenticated");
    setPinInput("");
    setPrevAssignedCount(null);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateStatus = async (orderId, currentOrder, nextStatus) => {
    if (nextStatus === "Delivered") {
      if (!otpInput || otpInput !== currentOrder.delivery_otp) {
        triggerToast("Invalid OTP. Please ask the customer for the correct OTP.");
        return;
      }
    }

    try {
      const courierStatus = nextStatus === "Shipped" ? "In Transit" : (nextStatus === "Delivered" ? "Delivered" : "Returned");
      const paymentStatus = nextStatus === "Delivered" ? "SUCCESS" : (currentOrder.paymentStatus === "Paid" ? "SUCCESS" : currentOrder.paymentStatus);

      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          pin: '1994',
          orderId: orderId,
          updateData: {
            order_status: nextStatus === 'Pending' ? 'NEW' : (nextStatus === 'Packed' ? 'PACKED' : (nextStatus === 'Shipped' ? 'DISPATCHED' : (nextStatus === 'Delivered' ? 'DELIVERED' : 'RETURNED'))),
            payment_status: paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING'
          }
        })
      });
      
      const { success, error } = await res.json();
      if (!success) throw new Error(error || "Update failed");

      // Trigger Google Sheets Webhook Update
      try {
        const webhookUrl = "https://script.google.com/macros/s/AKfycbxIM1-jcgl3NUqhoYt7IQIHY9LI6z0IT7c3WI_ZSJwajYORUbgKLnTnw5GJLBbhj-OY8g/exec";
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            orderId: orderId,
            status: nextStatus,
            courierStatus: courierStatus,
            paymentStatus: paymentStatus
          })
        });
      } catch (err) {
        console.error("Error syncing update to Google Sheets webhook:", err);
      }

      setOtpInput("");
      triggerToast(`Order status updated to ${nextStatus}`);
      loadOrders();
    } catch (e) {
      console.error("Failed to update status in Supabase:", e);
      triggerToast("Update failed. Please retry.");
    }
  };

  // Filter orders by tab
  const displayedOrders = ordersList.filter((order) => {
    const isCompleted = order.status === "Delivered";
    const isCancelled = order.status === "Cancelled";
    
    if (activeTab === "assigned") {
      // Show Packed or Out for Delivery (Shipped) orders
      return !isCompleted && !isCancelled && (order.status === "Packed" || order.status === "Shipped" || order.status === "Pending");
    } else {
      // Completed dispatches
      return isCompleted;
    }
  });

  // Calculate quick metrics
  const pendingCount = ordersList.filter(o => o.status === "Packed" || o.status === "Shipped" || o.status === "Pending").length;
  const completedTodayCount = ordersList.filter(o => {
    if (o.status !== "Delivered") return false;
    const orderDate = new Date(o.date).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  }).length;

  if (!isAuthenticated) {
    return (
      <div className="lock-screen-overlay">
        <form onSubmit={handleVerifyPin} className="lock-card">
          <div className="lock-icon-header">
            <i className="fa-solid fa-lock"></i>
          </div>
          <div className="lock-logo">ORIENT</div>
          <div className="lock-subtitle">DELIVERY STAFF PORTAL</div>
          <input
            type="password"
            maxLength={6}
            placeholder="••••"
            className="lock-pin-input"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
          <button type="submit" className="lock-btn">
            Authorize Device
          </button>
          {authError && <p className="error-text">{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="delivery-container">
      {/* Header bar */}
      <header className="delivery-header">
        <div className="delivery-brand">
          <h2>Orient Rider</h2>
          <p>Dispatches registry</p>
        </div>
        <button onClick={handleLogout} className="logout-icon-btn" aria-label="Log Out">
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </header>

      {/* Stats Board */}
      <section className="delivery-metrics">
        <div className="delivery-metric-card">
          <span className="metric-label">To Deliver</span>
          <span className="metric-val">{pendingCount}</span>
          <span className="metric-desc">Pending dispatches</span>
        </div>
        <div className="delivery-metric-card">
          <span className="metric-label">Completed Today</span>
          <span className="metric-val">{completedTodayCount}</span>
          <span className="metric-desc">Cleared orders</span>
        </div>
      </section>

      {/* Navigation tabs */}
      <nav className="delivery-tabs">
        <button
          className={`delivery-tab-btn ${activeTab === "assigned" ? "active" : ""}`}
          onClick={() => setActiveTab("assigned")}
        >
          Assigned Dispatches
        </button>
        <button
          className={`delivery-tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed History
        </button>
      </nav>

      {/* Main loading & orders queue list */}
      <main className="delivery-list-section">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#C5A059", marginBottom: "15px" }}></i>
            <p style={{ fontSize: "0.85rem" }}>Retrieving dispatches from database...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.01)" }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: "2.5rem", color: "#A0AEC0", marginBottom: "15px" }}></i>
            <p style={{ fontSize: "0.85rem", color: "#718096" }}>No dispatches in this category.</p>
          </div>
        ) : (
          displayedOrders.map((order) => {
            const isCOD = order.paymentMethod === "cod" || order.paymentStatus === "Pending";
            const orderDateStr = new Date(order.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={order.id} className="delivery-card">
                <div className="card-top">
                  <div>
                    <span className="order-id-label">ID: #{order.id}</span>
                    <span className="order-date-label">{orderDateStr}</span>
                  </div>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="customer-detail-row">
                  <span className="customer-name">{order.customerName}</span>
                  <a href={`tel:${order.customerPhone}`} className="call-btn" title="Call Customer">
                    <i className="fa-solid fa-phone"></i>
                  </a>
                </div>

                <div className="address-box">
                  <strong>Delivery Address:</strong>
                  <p style={{ margin: "5px 0 0 0" }}>{order.shippingAddress || order.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress || order.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn"
                  >
                    <i className="fa-solid fa-location-arrow"></i> Navigate using GPS Maps
                  </a>
                </div>

                <div className={`cod-banner ${isCOD ? "cod" : "prepaid"}`}>
                  <span className="cod-label">{isCOD ? "Collect Cash (COD)" : "Prepaid Order"}</span>
                  <span className="cod-amount">₹{order.total.toLocaleString("en-IN")}</span>
                </div>

                {/* Collapsible item details view */}
                <div 
                  className="items-summary-toggle"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <i className={`fa-solid ${expandedOrder === order.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  {expandedOrder === order.id ? "Hide items details" : "Show items list"}
                </div>

                {expandedOrder === order.id && (
                  <div className="items-list">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-name">
                          <span className="item-qty">{item.quantity}x</span> {item.name}
                        </span>
                        <span style={{ color: "#718096" }}>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions button strip */}
                {activeTab === "assigned" && (
                  <div className="action-row" style={{ flexDirection: 'column', gap: '15px' }}>
                    {order.status === "Packed" || order.status === "Pending" ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, order, "Shipped")}
                        className="action-btn-primary"
                        style={{ width: "100%" }}
                      >
                        <i className="fa-solid fa-truck-ramp-box"></i> Start Delivery
                      </button>
                    ) : (
                      <>
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Payment Collection</h4>
                          {order.paymentStatus === 'Paid' ? (
                            <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                              <i className="fa-solid fa-check-circle"></i> Prepaid Order - No collection needed.
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.2rem' }}>To Collect: ₹{order.total}</p>
                              {/* Dummy QR Code */}
                              <div style={{ background: '#fff', padding: '10px', display: 'inline-block', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px' }}>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=orientcrockeries@upi&pn=OrientCrockeries&am=0" alt="UPI QR Code" style={{ width: '150px', height: '150px' }} />
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Customer can scan to pay via UPI</p>
                            </div>
                          )}
                        </div>

                        <div style={{ background: '#fff9e6', padding: '15px', borderRadius: '8px', border: '1px dashed #d4af37' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Proof of Delivery (OTP)</h4>
                          <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 10px 0' }}>Ask the customer for the 6-digit OTP shown in their account.</p>
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px', marginBottom: '10px' }}
                            maxLength={6}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleUpdateStatus(order.id, order, "Delivered")}
                              className="action-btn-primary"
                              style={{ flex: 1 }}
                            >
                              <i className="fa-solid fa-circle-check"></i> Verify & Deliver
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, order, "Returned")}
                              className="action-btn-secondary"
                              style={{ padding: '10px 15px' }}
                            >
                              <i className="fa-solid fa-circle-xmark"></i> Return
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Floating Toast Notification */}
      <div className={`toast toast-success ${showToast ? "show" : ""}`} style={{ zIndex: 99999 }}>
        <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "1.1rem" }}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
