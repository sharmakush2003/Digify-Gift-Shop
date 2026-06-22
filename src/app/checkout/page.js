"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { saveOrder } from "../db";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, clearCart } = useApp();
  const router = useRouter();

  // Retrieve checkout figures from localStorage
  const [shippingFee, setShippingFee] = useState(0);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);

  // Billing form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Checkout phases: 'billing' | 'payment_selection' | 'paying' | 'receipt'
  const [checkoutPhase, setCheckoutPhase] = useState("billing");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    // Load values calculated on cart page
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShippingFee(parseFloat(localStorage.getItem("orient_checkout_shipping") || "0"));
    setPromoDiscount(parseFloat(localStorage.getItem("orient_checkout_promo_disc") || "0"));
    setPromoCode(localStorage.getItem("orient_checkout_promo_code") || "");
    setOrderTotal(parseFloat(localStorage.getItem("orient_checkout_total") || "0"));

    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768);
  }, []);

  // Compute subtotal and GST details item by item
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Tax calculations
  const taxItems = cart.map(item => {
    const rate = item.gst || 18; // 18% or 5%
    const itemTotal = item.price * item.quantity;
    
    // For inclusive GST: Tax Amount = Total Price - (Total Price / (1 + GST Rate / 100))
    const taxAmt = itemTotal - (itemTotal / (1 + rate / 100));
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;

    return {
      ...item,
      cgst,
      sgst,
      rate,
      taxableValue: itemTotal - taxAmt
    };
  });

  const totalCGST = taxItems.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = taxItems.reduce((sum, item) => sum + item.sgst, 0);

  const totalGST = totalCGST + totalSGST;

  const handleSubmitBilling = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !street || !city || !state || !zip) {
      alert("Please fill in all shipping fields.");
      return;
    }
    setCheckoutPhase("payment_selection");
  };

  const handleAutoDetect = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const streetLine = [addr.building, addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ");
            setStreet(streetLine || data.display_name || "");
            setCity(addr.city || addr.town || addr.village || addr.state_district || "");
            setState(addr.state || "");
            setZip(addr.postcode || "");
          } else {
            alert("Could not detect address details. Please enter manually.");
          }
        } catch (err) {
          console.error(err);
          alert("Error fetching address details.");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Failed to get location. Please ensure location permissions are granted.");
        setIsDetecting(false);
      }
    );
  };

  const simulatePayment = () => {
    setCheckoutPhase("paying");
    setPaymentStatus("Initializing Secure Payment Interface...");
    setTimeout(() => {
      setPaymentStatus("Authenticating Payment Details...");
      setTimeout(() => {
        setPaymentStatus("Recording transaction and generating invoice...");
        setTimeout(() => {
          completeOrder();
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const completeOrder = async () => {
    // Save order in Firestore
    const orderId = "ORD-" + Math.floor(Math.random() * 900000 + 100000);
    const orderData = {
      id: orderId,
      date: new Date().toISOString(),
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: `${street}, ${city}, ${state} - ${zip}`,
      items: cart,
      subtotal: subtotal,
      shipping: shippingFee,
      discount: promoDiscount,
      total: orderTotal,
      gstAmount: totalGST,
      status: "Pending",
      courierStatus: "In Warehouse",
      paymentStatus: "Paid",
      paymentId: "pay_" + Math.random().toString(36).substr(2, 9)
    };

    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      await addDoc(collection(db, "orders"), orderData);
    } catch (err) {
      console.error("Error saving order to Firestore:", err);
      // Fallback to local
      saveOrder(orderData);
    }

    setCreatedOrder(orderData);
    clearCart(); // Wipe cart
    setCheckoutPhase("receipt");
  };

  return (
    <div className="container" style={{ marginTop: "30px" }}>
      <h1 className="page-title">Secure Checkout</h1>

      {checkoutPhase === "billing" && (
        <div className="checkout-layout">
          {/* Shipping Form */}
          <form onSubmit={handleSubmitBilling} className="checkout-card">
            <h2 className="checkout-section-title">Shipping &amp; Billing Details</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <span className="form-label">Full Name</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <span className="form-label">Email Address</span>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="form-group full-width">
                <span className="form-label">Phone Number</span>
                <input 
                  type="tel" 
                  className="form-input" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              <div className="form-group full-width">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="form-label" style={{ marginBottom: 0 }}>Street Address</span>
                  <button 
                    type="button" 
                    onClick={handleAutoDetect} 
                    disabled={isDetecting} 
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "var(--primary)", 
                      fontSize: "0.75rem", 
                      cursor: "pointer", 
                      fontWeight: "600", 
                      letterSpacing: "1px", 
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className={isDetecting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-location-crosshairs"}></i>
                    {isDetecting ? "Detecting..." : "Auto-detect"}
                  </button>
                </div>
                <textarea 
                  rows="3" 
                  className="form-input" 
                  required 
                  style={{ resize: "none" }}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                ></textarea>
              </div>
              <div className="form-group">
                <span className="form-label">City</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <span className="form-label">State</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={state} 
                  onChange={(e) => setState(e.target.value)} 
                />
              </div>
              <div className="form-group full-width">
                <span className="form-label">ZIP / Postal Code</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={zip} 
                  onChange={(e) => setZip(e.target.value)} 
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "2rem" }}>
              Proceed to Payment &bull; ₹{orderTotal.toFixed(2)}
            </button>
          </form>

          {/* Pricing Summary Side column */}
          <aside className="cart-summary-box">
            <h2 className="summary-title">Review Invoice Details</h2>
            
            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1.5rem" }}>
              {taxItems.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.85rem" }}>
                  <span>{item.name} <b>x{item.quantity}</b></span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-row" style={{ borderTop: "1px dashed var(--border)", paddingTop: "1rem" }}>
              <span>Taxable Value (Before Taxes)</span>
              <span>₹{(subtotal - totalGST).toFixed(2)}</span>
            </div>
            
            <div className="summary-row" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              <span>Central GST (CGST)</span>
              <span>₹{totalCGST.toFixed(2)}</span>
            </div>

            <div className="summary-row" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
              <span>State GST (SGST)</span>
              <span>₹{totalSGST.toFixed(2)}</span>
            </div>

            {promoDiscount > 0 && (
              <div className="summary-row" style={{ color: "var(--success)" }}>
                <span>Promo Discount ({promoCode})</span>
                <span>-₹{promoDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping Fee</span>
              <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}</span>
            </div>

            <div className="summary-row total">
              <span>Grand Total</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      )}

      {/* Payment Selection Phase */}
      {checkoutPhase === "payment_selection" && (
        <div style={{ padding: "4rem 2rem", background: "var(--bg-surface)", border: "1px solid var(--border)", maxWidth: "550px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1.5rem", color: "var(--dark)" }}>Select Payment Method</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem", fontSize: "1.1rem" }}>Amount to Pay: <b style={{ color: "var(--dark)" }}>₹{orderTotal.toFixed(2)}</b></p>
          
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem" }}>Detected UPI Apps</p>
              
              <a 
                 href={`upi://pay?pa=orientcrockeries@upi&pn=Orient%20Crockeries&am=${orderTotal.toFixed(2)}&cu=INR`} 
                 onClick={() => { setCheckoutPhase("paying"); setPaymentStatus("Awaiting confirmation from UPI App..."); setTimeout(completeOrder, 6000); }} 
                 className="btn" 
                 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", border: "1px solid #4CAF50", color: "#4CAF50", background: "rgba(76, 175, 80, 0.05)" }}>
                <i className="fa-brands fa-google-pay" style={{ fontSize: "1.8rem" }}></i> Open GPay / PhonePe / BHIM
              </a>

              <a 
                 href={`paytmmp://pay?pa=orientcrockeries@upi&pn=Orient%20Crockeries&am=${orderTotal.toFixed(2)}&cu=INR`} 
                 onClick={() => { setCheckoutPhase("paying"); setPaymentStatus("Awaiting confirmation from Paytm..."); setTimeout(completeOrder, 6000); }} 
                 className="btn" 
                 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", border: "1px solid #00b9f5", color: "#00b9f5", background: "rgba(0, 185, 245, 0.05)" }}>
                <i className="fa-solid fa-wallet" style={{ fontSize: "1.2rem" }}></i> Pay via Paytm
              </a>
              
              <div style={{ margin: "1.5rem 0", color: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{ width: "40px", height: "1px", background: "var(--border)" }}></span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>OR</span>
                <span style={{ width: "40px", height: "1px", background: "var(--border)" }}></span>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "2.5rem" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700", color: "var(--primary)", marginBottom: "1rem" }}>Scan QR to Pay</p>
              <div style={{ width: "160px", height: "160px", background: "var(--bg-main)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: "8px" }}>
                 <i className="fa-solid fa-qrcode" style={{ fontSize: "5rem", color: "var(--primary)" }}></i>
              </div>
              <div style={{ margin: "2rem 0 1.5rem 0", color: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{ width: "40px", height: "1px", background: "var(--border)" }}></span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>OR</span>
                <span style={{ width: "40px", height: "1px", background: "var(--border)" }}></span>
              </div>
            </div>
          )}

          <button onClick={simulatePayment} className="btn btn-primary btn-full">
            Pay with Card / Netbanking
          </button>
        </div>
      )}

      {/* Payment Processing simulation overlay */}
      {checkoutPhase === "paying" && (
        <div style={{ textAlign: "center", padding: "8rem 2rem", background: "var(--bg-surface)", border: "1px solid var(--border)", maxWidth: "600px", margin: "0 auto" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "3rem", color: "var(--primary)", marginBottom: "2rem" }}></i>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", marginBottom: "1rem" }}>Processing Payment</h2>
          <p style={{ color: "var(--text-muted)" }}>{paymentStatus}</p>
        </div>
      )}

      {/* Tax Invoice Printable Receipt */}
      {checkoutPhase === "receipt" && createdOrder && (
        <div>
          <div className="invoice-container">
            {/* Header info */}
            <div className="invoice-header">
              <div>
                <span className="logo" style={{ fontSize: "1.6rem" }}>ORIENT</span>
                <span className="logo-tagline" style={{ display: "block", fontSize: "0.55rem" }}>Crockeries</span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  G-42, Crockery Market, Delhi, IN<br />
                  GSTIN: 07AAACO8412K1Z5
                </p>
              </div>
              <div className="invoice-meta">
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--primary)" }}>TAX INVOICE</h3>
                <p>Invoice #: <b>{createdOrder.id}</b></p>
                <p>Date: <b>{new Date(createdOrder.date).toLocaleDateString()}</b></p>
                <p>Payment Mode: <b>Card / UPI (Paid)</b></p>
              </div>
            </div>

            {/* Address rows */}
            <div className="invoice-address-grid">
              <div className="address-block">
                <h4>Billed &amp; Shipped To</h4>
                <p>
                  <b>{createdOrder.customerName}</b><br />
                  Phone: {createdOrder.customerPhone}<br />
                  Email: {createdOrder.customerEmail}<br />
                  Address: {createdOrder.shippingAddress}
                </p>
              </div>
              <div className="address-block" style={{ textAlign: "right" }}>
                <h4>Logistics Partner</h4>
                <p>
                  <b>BlueDart Air Cargo</b><br />
                  Fragile Insurance Coverage: Yes<br />
                  Handling Class: Fragile Ceramic/Ironware
                </p>
              </div>
            </div>

            {/* Table items */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>HSN</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th style={{ textAlign: "right" }}>GST%</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {taxItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{item.hsn}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{(item.price / (1 + item.rate/100)).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{item.rate}%</td>
                    <td style={{ textAlign: "right" }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Grand calculations breakdown */}
            <div className="invoice-total-details">
              <div className="invoice-total-row">
                <span>Taxable Amount</span>
                <span>₹{(createdOrder.subtotal - totalGST).toFixed(2)}</span>
              </div>
              <div className="invoice-total-row">
                <span>CGST Amount</span>
                <span>₹{totalCGST.toFixed(2)}</span>
              </div>
              <div className="invoice-total-row">
                <span>SGST Amount</span>
                <span>₹{totalSGST.toFixed(2)}</span>
              </div>
              {createdOrder.discount > 0 && (
                <div className="invoice-total-row" style={{ color: "var(--success)" }}>
                  <span>Discounts Applied</span>
                  <span>-₹{createdOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="invoice-total-row">
                <span>Shipping &amp; Handling</span>
                <span>{createdOrder.shipping === 0 ? "FREE" : `₹${createdOrder.shipping.toFixed(2)}`}</span>
              </div>
              <div className="invoice-total-row grand-total">
                <span>Grand Total (Incl. Tax)</span>
                <span>₹{createdOrder.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ marginTop: "2rem", fontSize: "0.75rem", borderTop: "1px dashed var(--border)", paddingTop: "1rem", color: "var(--text-muted)", textAlign: "center" }}>
              Thank you for shopping at Orient Crockeries! The items are packed with dual air cushion bubble sheets to ensure safe arrival.
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginTop: "3rem" }}>
            <button 
              className="btn btn-outline" 
              onClick={() => window.print()}
            >
              <i className="fa-solid fa-print"></i> Print Invoice
            </button>
            <Link 
              href={`/tracking?orderId=${createdOrder.id}`} 
              className="btn btn-primary"
            >
              Track Shipment on BlueDart &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
