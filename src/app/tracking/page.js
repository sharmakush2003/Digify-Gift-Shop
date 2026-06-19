"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOrders } from "../db";
import Link from "next/link";

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");

  const [orderIdInput, setOrderIdInput] = useState(orderIdParam || "");
  const [activeOrder, setActiveOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (orderIdParam) {
      locateOrder(orderIdParam);
    }
  }, [orderIdParam]);

  const locateOrder = (id) => {
    const orders = getOrders();
    const match = orders.find(o => o.id.trim().toUpperCase() === id.trim().toUpperCase());
    
    if (match) {
      setActiveOrder(match);
      setErrorMsg("");
    } else {
      setActiveOrder(null);
      setErrorMsg(`Could not find any order with code ${id}. Verify your order reference.`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      locateOrder(orderIdInput.trim());
    }
  };

  // Timeline tracker steps based on order status
  const getTimelineSteps = (status, dateStr) => {
    const dateObj = new Date(dateStr);
    const formatDate = (daysToAdd) => {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + daysToAdd);
      return d.toLocaleDateString() + " &bull; " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const steps = [
      {
        title: "Order Placed & Confirmed",
        desc: "Order has been processed successfully and sent to our central warehouse.",
        time: formatDate(0),
        completed: true,
        active: status === "Pending"
      },
      {
        title: "Packed & Bubble Wrapped",
        desc: "Products packed securely in 5-ply cartons with double bubble wrap layers.",
        time: status !== "Pending" ? formatDate(1) : "Awaiting warehousing...",
        completed: ["Packed", "Shipped", "Delivered"].includes(status),
        active: status === "Packed"
      },
      {
        title: "Dispatched (BlueDart Logistics)",
        desc: "Handed over to BlueDart Courier Service (AWB #84128509). Fragile insurance active.",
        time: ["Shipped", "Delivered"].includes(status) ? formatDate(2) : "Awaiting shipping...",
        completed: ["Shipped", "Delivered"].includes(status),
        active: status === "Shipped"
      },
      {
        title: "Delivered Successfully",
        desc: "Shipment arrived at receiver's address. Thank you for choosing Orient Crockeries.",
        time: status === "Delivered" ? formatDate(3) : "Awaiting transit arrival...",
        completed: status === "Delivered",
        active: status === "Delivered"
      }
    ];

    return steps;
  };

  return (
    <div className="container" style={{ marginTop: "30px", maxWidth: "800px" }}>
      <h1 className="page-title">Shipment Tracking</h1>

      {/* Search Order bar */}
      <div className="checkout-card" style={{ marginBottom: "3rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px" }}>
          <div style={{ flexGrow: 1, position: "relative" }}>
            <i className="fa-solid fa-barcode search-icon-inside"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Enter your Order Reference Number (e.g. ORD-123456)" 
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }}>
            Track Order
          </button>
        </form>
        {errorMsg && <p style={{ color: "var(--error)", fontSize: "0.85rem", marginTop: "10px", textAlign: "center" }}>{errorMsg}</p>}
      </div>

      {activeOrder ? (
        <div className="tracking-card">
          <div className="tracking-header">
            <span>Order Code: <b>{activeOrder.id}</b></span>
            <h2 className="tracking-status-large">
              {activeOrder.status === "Pending" ? "Processing Order" : 
               activeOrder.status === "Packed" ? "Ready to Dispatch" : 
               activeOrder.status === "Shipped" ? "In Transit" : "Delivered"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
              Carrier: BlueDart Air Express | Courier Status: <b>{activeOrder.courierStatus}</b>
            </p>
          </div>

          {/* Timeline Tracking */}
          <div className="tracking-timeline">
            {getTimelineSteps(activeOrder.status, activeOrder.date).map((step, idx) => (
              <div 
                key={idx} 
                className={`timeline-step ${step.completed ? "completed" : ""} ${step.active ? "active" : ""}`}
              >
                <div className="timeline-bullet"></div>
                <h4 className="timeline-title">{step.title}</h4>
                <p className="timeline-time" dangerouslySetInnerHTML={{ __html: step.time }}></p>
                <p className="timeline-desc">{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", fontSize: "0.85rem" }}>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>Delivery Address</h4>
            <p style={{ color: "var(--text-muted)" }}>
              {activeOrder.customerName}<br />
              {activeOrder.shippingAddress}
            </p>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Total Paid: <b>₹{activeOrder.total.toFixed(2)}</b></span>
              <span>Payment: <b>{activeOrder.paymentStatus} ({activeOrder.paymentId})</b></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: "3rem" }}>
          <i className="fa-solid fa-truck-ramp-box" style={{ fontSize: "2.5rem", color: "var(--primary)", marginBottom: "1.5rem" }}></i>
          <h3 className="empty-title">Awaiting Search Input</h3>
          <p className="empty-desc">Enter your order ID in the search bar above to fetch live courier dispatch details.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "10rem 2rem" }}><h2>Loading Logistics Timeline...</h2></div>}>
      <TrackingContent />
    </Suspense>
  );
}
