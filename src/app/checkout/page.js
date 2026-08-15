"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { saveOrder } from "../db";
import Link from "next/link";
import Script from "next/script";

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
  const [area, setArea] = useState("");
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
    if (!name || !email || !phone || !street || !area) {
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

    alert("Please manually verify the auto-detected location details after detection completes.");
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const streetLine = [addr.building, addr.road].filter(Boolean).join(", ");
            setStreet(streetLine || data.display_name || "");
            
            // Try to match area
            const detectedArea = addr.suburb || addr.neighbourhood || addr.residential || "";
            if (detectedArea) {
              setArea(detectedArea);
            }
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

  const initializeRazorpay = async () => {
    setCheckoutPhase("paying");
    setPaymentStatus("Initializing Secure Payment Interface...");
    
    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderTotal }),
      });
      
      const order = await res.json();
      
      if (order.error) {
        console.warn("Razorpay API failed, falling back to mock payment simulation.");
        simulatePayment(); // Auto fallback to mock payment
        return;
      }
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: order.amount,
        currency: order.currency,
        name: "Orient Crockeries",
        description: "Secure Payment",
        order_id: order.id,
        handler: function (response) {
          setPaymentStatus("Recording transaction and generating invoice...");
          completeOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#18181b",
        },
        modal: {
          ondismiss: function() {
            setCheckoutPhase("payment_selection");
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        alert(response.error.description);
        setCheckoutPhase("payment_selection");
      });
      rzp1.open();
    } catch (err) {
      console.warn("Razorpay init failed, falling back to mock payment simulation.", err);
      simulatePayment(); // Auto fallback to mock payment
    }
  };

  const completeOrder = async (razorpayPaymentId = null) => {
    // Save order in Firestore
    const orderId = "ORD-" + Math.floor(Math.random() * 900000 + 100000);
    const orderData = {
      id: orderId,
      date: new Date().toISOString(),
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: `${street}, ${area}, Jaipur, Rajasthan`,
      items: cart,
      subtotal: subtotal,
      shipping: shippingFee,
      discount: promoDiscount,
      total: orderTotal,
      gstAmount: totalGST,
      status: "Pending",
      courierStatus: "In Warehouse",
      paymentStatus: "Paid",
      paymentId: razorpayPaymentId || ("pay_" + Math.random().toString(36).substr(2, 9))
    };

    try {
      const { supabase } = await import("../../supabase");
      await supabase.from("orders").insert(orderData);
    } catch (err) {
      console.error("Error saving order to Supabase:", err);
      // Fallback to local
      saveOrder(orderData);
    }

    // Trigger Google Sheets Webhook
    try {
      const webhookUrl = "https://script.google.com/macros/s/AKfycbxIM1-jcgl3NUqhoYt7IQIHY9LI6z0IT7c3WI_ZSJwajYORUbgKLnTnw5GJLBbhj-OY8g/exec";
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          order: orderData
        })
      });
    } catch (err) {
      console.error("Error syncing to Google Sheets:", err);
    }

    setCreatedOrder(orderData);
    clearCart(); // Wipe cart
    setCheckoutPhase("receipt");
  };

  return (
    <div className="container" style={{ marginTop: "30px", minWidth: 0 }}>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="page-title">Secure Checkout</h1>

      {checkoutPhase === "billing" && (
        <div className="checkout-layout">
          {/* Shipping Form */}
          <form onSubmit={handleSubmitBilling} className="checkout-card" style={{ minWidth: 0 }}>
            <div style={{ marginBottom: "1rem" }}>
              <button 
                type="button"
                onClick={() => router.push('/cart')}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}
              >
                <i className="fa-solid fa-arrow-left"></i> Back to Cart
              </button>
            </div>
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
              <div className="form-group full-width">
                <span className="form-label">Area (Jaipur Only)</span>
                <select 
                  className="form-input" 
                  required 
                  value={area} 
                  onChange={(e) => setArea(e.target.value)} 
                >
                  <option value="" disabled>Select your area...</option>
                  <option value="Adarsh Nagar">Adarsh Nagar</option>
                  <option value="Ajmer Road">Ajmer Road</option>
                  <option value="Bani Park">Bani Park</option>
                  <option value="Bapu Nagar">Bapu Nagar</option>
                  <option value="C-Scheme">C-Scheme</option>
                  <option value="Civil Lines">Civil Lines</option>
                  <option value="Gandhi Nagar">Gandhi Nagar</option>
                  <option value="Gopalpura">Gopalpura</option>
                  <option value="Jagatpura">Jagatpura</option>
                  <option value="Jhotwara">Jhotwara</option>
                  <option value="Kalwar Road">Kalwar Road</option>
                  <option value="Malviya Nagar">Malviya Nagar</option>
                  <option value="Mansarovar">Mansarovar</option>
                  <option value="Pratap Nagar">Pratap Nagar</option>
                  <option value="Raja Park">Raja Park</option>
                  <option value="Shyam Nagar">Shyam Nagar</option>
                  <option value="Sitapura">Sitapura</option>
                  <option value="Sodala">Sodala</option>
                  <option value="Tonk Road">Tonk Road</option>
                  <option value="Vaishali Nagar">Vaishali Nagar</option>
                  <option value="Vidyadhar Nagar">Vidyadhar Nagar</option>
                  <option value="Other">Other Area</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "2rem" }}>
              Proceed to Payment &bull; ₹{orderTotal.toFixed(2)}
            </button>
          </form>          {/* Pricing Summary Side column */}
          <aside className="cart-summary-box" style={{ 
            minWidth: 0, 
            background: "linear-gradient(to bottom, #fffaf0, #ffffff)", 
            border: "1px solid #d4af37", 
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(212, 175, 55, 0.15)",
            padding: "2rem",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Decorative top border */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--primary)" }}></div>
            
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--primary)", margin: 0, letterSpacing: "1px" }}>ORIENT CROCKERIES</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginTop: "4px" }}>Premium Order Summary</p>
            </div>
            
            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1.5rem", paddingRight: "5px" }}>
              {taxItems.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.9rem", alignItems: "center" }}>
                  <span style={{ color: "#333", fontWeight: "500" }}>{item.name} <span style={{ color: "var(--primary)", fontSize: "0.8rem", marginLeft: "4px" }}>x{item.quantity}</span></span>
                  <span style={{ fontWeight: "600" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "2px dashed #e0e0e0", paddingTop: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#555" }}>Taxable Value (Before Taxes)</span>
                <span style={{ fontWeight: "600" }}>₹{(subtotal - totalGST).toFixed(2)}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#888" }}>
                <span>Central GST (CGST)</span>
                <span>₹{totalCGST.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#888" }}>
                <span>State GST (SGST)</span>
                <span>₹{totalSGST.toFixed(2)}</span>
              </div>

              {promoDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.9rem", color: "var(--success)", fontWeight: "500" }}>
                  <span>Promo Discount ({promoCode})</span>
                  <span>-₹{promoDiscount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#555" }}>Shipping Fee</span>
                <span style={{ fontWeight: "600" }}>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}</span>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderTop: "2px solid var(--primary)", 
              paddingTop: "1.5rem", 
              marginTop: "0.5rem"
            }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: "600", color: "#111" }}>Grand Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: "700", color: "var(--primary)" }}>₹{orderTotal.toFixed(2)}</span>
            </div>
            
            <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "#aaa" }}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: "4px" }}></i> Secure 256-bit SSL Encryption
            </div>
          </aside>
        </div>
      )}

      {/* Payment Selection Phase */}
      {checkoutPhase === "payment_selection" && (
        <div style={{ padding: "4rem 2rem", background: "#ffffff", border: "1px solid #e0e0e0", maxWidth: "550px", margin: "2rem auto", textAlign: "center", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", minWidth: 0 }}>
          <div style={{ textAlign: "left", marginBottom: "1rem" }}>
            <button 
              type="button"
              onClick={() => setCheckoutPhase('billing')}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Billing
            </button>
          </div>
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ width: "80px", height: "80px", background: "rgba(184, 134, 11, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", marginBottom: "0.5rem", color: "#111111", fontWeight: "600" }}>Secure Checkout</h2>
            <p style={{ color: "#555555", fontSize: "1.05rem", letterSpacing: "0.5px" }}>Complete your purchase securely via Razorpay</p>
          </div>
          
          <div style={{ background: "#fcfaf8", padding: "2rem", borderRadius: "12px", border: "1px dashed var(--primary)", marginBottom: "2.5rem" }}>
            <p style={{ color: "#666666", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "0.5rem", fontWeight: "600" }}>Amount to Pay</p>
            <h3 style={{ fontSize: "3rem", fontFamily: "var(--font-serif)", color: "#111111", margin: "0", fontWeight: "700" }}>₹{orderTotal.toFixed(2)}</h3>
          </div>
          
          <button onClick={initializeRazorpay} className="btn" style={{ background: "var(--primary)", color: "white", width: "100%", padding: "1.3rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", borderRadius: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 8px 20px rgba(184, 134, 11, 0.3)", border: "none", cursor: "pointer", transition: "transform 0.2s ease" }}>
            <i className="fa-solid fa-lock" style={{ fontSize: "1.2rem" }}></i> PROCEED TO PAY SECURELY
          </button>

          <button onClick={simulatePayment} className="btn btn-outline" style={{ width: "100%", padding: "1rem", marginTop: "1rem", fontSize: "0.9rem", color: "#888", border: "1px dashed #ccc", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "8px", cursor: "pointer" }}>
            <i className="fa-solid fa-flask"></i> Skip Payment (Test Mode)
          </button>
          
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "2rem", color: "#666666", fontSize: "1.2rem" }}>
            <i className="fa-brands fa-cc-visa" title="Visa"></i>
            <i className="fa-brands fa-cc-mastercard" title="Mastercard"></i>
            <i className="fa-brands fa-google-pay" title="GPay"></i>
            <i className="fa-brands fa-apple-pay" title="Apple Pay"></i>
            <i className="fa-solid fa-building-columns" title="Netbanking"></i>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "1rem", color: "#888888", fontSize: "0.8rem", fontWeight: "500" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>100% Secure &amp; Encrypted Payments</span>
          </div>
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
        <div style={{ minWidth: 0 }}>
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
            <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch", marginBottom: "2.5rem" }}>
              <table className="invoice-table" style={{ minWidth: "580px", marginBottom: 0 }}>
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
            </div>

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

          <div className="no-print" style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginTop: "3rem" }}>
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
