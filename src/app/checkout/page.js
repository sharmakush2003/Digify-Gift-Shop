"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { saveOrder } from "../db";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import Link from "next/link";
import Script from "next/script";

export default function CheckoutPage() {
  const { cart, clearCart } = useApp();
  const { user } = useAuth();
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
  const [area, setArea] = useState("Vaishali Nagar");
  const [shippingPincode, setShippingPincode] = useState("");
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingStreet, setBillingStreet] = useState("");
  const [billingArea, setBillingArea] = useState("Vaishali Nagar");
  const [billingPincode, setBillingPincode] = useState("");

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

  // Prefill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.email) setEmail(user.email);
      if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

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

  const handleProceedToPayment = () => {
    if (!name || !email || !phone || !street || !shippingPincode) {
      alert("Please fill all required shipping details.");
      return;
    }
    if (shippingPincode.length !== 6) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }
    if (!sameAsShipping && (!billingStreet || !billingPincode)) {
      alert("Please fill all required billing details.");
      return;
    }
    setCheckoutPhase("payment_selection");
    window.scrollTo({ top: 0, behavior: 'smooth' });
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


  const handleCOD = async () => {
    setCheckoutPhase("paying");
    setPaymentStatus("Processing Cash on Delivery Order...");
    
    // Call our secure backend to create order in DB
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: cart,
          couponCode: promoCode || null,
          shippingFee: shippingFee,
          customerDetails: {
            name, email, phone,
            shippingAddress: { street, area, city: 'Jaipur', state: 'Rajasthan', pincode: shippingPincode, raw_text: `${street}, ${area}, Jaipur, Rajasthan - ${shippingPincode}` },
            billingAddress: sameAsShipping ? 
              { street, area, city: 'Jaipur', state: 'Rajasthan', pincode: shippingPincode } : 
              { street: billingStreet, area: billingArea, city: 'Jaipur', state: 'Rajasthan', pincode: billingPincode }
          }
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setTimeout(() => {
        setPaymentStatus("Order Confirmed!");
        completeOrder(data.order, "COD");
      }, 1500);
    } catch (err) {
      alert("Checkout failed: " + err.message);
      setCheckoutPhase("payment_selection");
    }
  };

  const initializeRazorpay = async () => {
    setCheckoutPhase("paying");
    setPaymentStatus("Initializing Secure Payment Interface...");
    
    try {
      // Create order securely via backend
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: cart,
          couponCode: promoCode || null,
          shippingFee: shippingFee,
          customerDetails: {
            name, email, phone,
            shippingAddress: { street, area, city: 'Jaipur', state: 'Rajasthan', pincode: shippingPincode, raw_text: `${street}, ${area}, Jaipur, Rajasthan - ${shippingPincode}` },
            billingAddress: sameAsShipping ? 
              { street, area, city: 'Jaipur', state: 'Rajasthan', pincode: shippingPincode } : 
              { street: billingStreet, area: billingArea, city: 'Jaipur', state: 'Rajasthan', pincode: billingPincode }
          }
        }),
      });
      
      const order = await res.json();
      
      if (!order.success) {
        console.warn("Backend order creation failed.", order.message);
        handleCOD(); // Auto fallback to COD for demo
        return;
      }
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere', // Replace with real key
        amount: order.amount,
        currency: "INR",
        name: "Orient Crockeries",
        description: "Secure Payment",
        order_id: order.razorpayOrderId,
        handler: async function (response) {
          setPaymentStatus("Verifying transaction securely...");
          try {
            // Verify payment securely on backend
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                razorpay_order_id: response.razorpay_order_id, 
                razorpay_payment_id: response.razorpay_payment_id, 
                razorpay_signature: response.razorpay_signature, 
                order_db_id: order.order.id 
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              completeOrder(verifyData.order);
            } else {
              alert("Payment verification failed! " + verifyData.message);
              setCheckoutPhase("payment_selection");
            }
          } catch (e) {
            alert("Error during verification.");
            setCheckoutPhase("payment_selection");
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#18181b" },
        modal: { ondismiss: function() { setCheckoutPhase("payment_selection"); } }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        alert(response.error.description);
        setCheckoutPhase("payment_selection");
      });
      rzp1.open();
    } catch (err) {
      console.warn("Razorpay init failed, falling back to COD simulation.", err);
      handleCOD();
    }
  };

  const completeOrder = async (backendOrderData = null, method = "Online") => {
    // If backend order exists, use it, else fallback to mock structure
    const fallbackOrderId = "ORD-" + Math.floor(Math.random() * 900000 + 100000);
    const orderData = backendOrderData ? {
      id: backendOrderData.order_number || backendOrderData.id,
      order_number: backendOrderData.order_number,
      date: backendOrderData.created_at || new Date().toISOString(),
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: backendOrderData.shipping_address?.raw_text || `${street}, ${area}, Jaipur, Rajasthan - ${shippingPincode}`,
      items: cart,
      subtotal: backendOrderData.total_mrp || subtotal,
      shipping: backendOrderData.shipping_charge || shippingFee,
      discount: backendOrderData.discount_amount || promoDiscount,
      total: backendOrderData.final_total || orderTotal,
      status: "Pending",
      courierStatus: "In Warehouse",
      paymentStatus: method === "COD" ? "Pending (COD)" : "Paid",
      paymentId: method === "COD" ? "COD" : backendOrderData.payment_reference_id
    } : {
      id: fallbackOrderId,
      order_number: fallbackOrderId,
      date: new Date().toISOString(),
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: `${street}, ${area}, Jaipur, Rajasthan - ${shippingPincode}`,
      items: cart,
      subtotal: subtotal,
      shipping: shippingFee,
      discount: promoDiscount,
      total: orderTotal,
      gstAmount: totalGST,
      status: "Pending",
      courierStatus: "In Warehouse",
      paymentStatus: method === "COD" ? "Pending (COD)" : "Paid",
      paymentId: method === "COD" ? "COD" : "pay_" + Math.random().toString(36).substr(2, 9)
    };

    // Always save locally so fallback & UI work immediately
    saveOrder(orderData);
    setCreatedOrder(orderData);
    setCheckoutPhase("receipt");
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
  };

  return (
    <div className="container" style={{ marginTop: "30px", minWidth: 0 }}>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="page-title">Secure Checkout</h1>

      {checkoutPhase === "billing" && (
        <div className="checkout-layout">
          {/* Shipping Form */}
          <div className="checkout-card" style={{ minWidth: 0 }}>
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
                  readOnly={!!user}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={user ? { background: "var(--bg-inset)", cursor: "not-allowed" } : {}}
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
              <div className="form-group">
                <span className="form-label">PIN Code</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  maxLength={6}
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="billing-address-section" style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1rem" }}>Billing Address</h3>
              
              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <input 
                  type="checkbox" 
                  id="sameAsShipping" 
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <label htmlFor="sameAsShipping" style={{ cursor: "pointer", fontSize: "0.95rem" }}>Billing address is same as Shipping address</label>
              </div>

              {!sameAsShipping && (
                <div className="form-grid">
                  <div className="form-group full-width">
                    <span className="form-label">Street Address</span>
                    <textarea 
                      rows="3" 
                      className="form-input" 
                      required={!sameAsShipping}
                      style={{ resize: "none" }}
                      value={billingStreet}
                      onChange={(e) => setBillingStreet(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="form-group full-width">
                    <span className="form-label">Area (Jaipur Only)</span>
                    <select 
                      className="form-input" 
                      value={billingArea} 
                      onChange={(e) => setBillingArea(e.target.value)}
                    >
                      <option value="Vaishali Nagar">Vaishali Nagar</option>
                      <option value="Malviya Nagar">Malviya Nagar</option>
                      <option value="Mansarovar">Mansarovar</option>
                      <option value="C-Scheme">C-Scheme</option>
                      <option value="Bapu Nagar">Bapu Nagar</option>
                      <option value="Raja Park">Raja Park</option>
                      <option value="Jagatpura">Jagatpura</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label">City</span>
                    <input type="text" className="form-input" value="Jaipur" readOnly style={{ background: "var(--bg-inset)" }} />
                  </div>
                  <div className="form-group">
                    <span className="form-label">State</span>
                    <input type="text" className="form-input" value="Rajasthan" readOnly style={{ background: "var(--bg-inset)" }} />
                  </div>
                  <div className="form-group full-width">
                    <span className="form-label">PIN Code</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      required={!sameAsShipping}
                      maxLength={6}
                      value={billingPincode}
                      onChange={(e) => setBillingPincode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button"
              className="btn" 
              onClick={handleProceedToPayment}
              style={{ background: "var(--primary)", color: "white", width: "100%", padding: "1.3rem", fontSize: "1.1rem", marginTop: "2rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderRadius: "8px", boxShadow: "0 8px 20px rgba(184, 134, 11, 0.3)", border: "none", cursor: "pointer", transition: "transform 0.2s ease" }}
            >
              <i className="fa-solid fa-lock" style={{ fontSize: "1.2rem" }}></i> PROCEED TO PAYMENT
            </button>
          </div>

          {/* Pricing Summary Side column */}
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
                <span style={{ fontWeight: "600", fontSize: "0.75rem", textAlign: "right", maxWidth: "60%" }}>{shippingFee === 0 ? "Will be communicated with you after the order" : `₹${shippingFee.toFixed(2)}`}</span>
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
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button onClick={initializeRazorpay} className="btn" style={{ background: "var(--primary)", color: "white", width: "100%", padding: "1.3rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", borderRadius: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 8px 20px rgba(184, 134, 11, 0.3)", border: "none", cursor: "pointer", transition: "transform 0.2s ease" }}>
              <i className="fa-solid fa-credit-card" style={{ fontSize: "1.2rem" }}></i> PAY ONLINE (RAZORPAY)
            </button>
  
            <div style={{ position: "relative", margin: "1rem 0" }}>
              <div style={{ borderTop: "1px solid #e0e0e0" }}></div>
              <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#ffffff", padding: "0 15px", color: "#888", fontSize: "0.9rem", fontWeight: "600" }}>OR</span>
            </div>
  
            <button onClick={handleCOD} className="btn btn-outline" style={{ background: "#f8f9fa", color: "var(--dark)", width: "100%", padding: "1.3rem", fontSize: "1.1rem", border: "2px solid #e0e0e0", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", borderRadius: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s ease" }}>
              <i className="fa-solid fa-money-bill-wave" style={{ fontSize: "1.2rem", color: "#28a745" }}></i> CASH ON DELIVERY (COD)
            </button>
          </div>
          
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
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "linear-gradient(to bottom, #fffcf5, #ffffff)", border: "1px solid #d4af37", maxWidth: "650px", margin: "2rem auto", borderRadius: "16px", boxShadow: "0 20px 40px rgba(212, 175, 55, 0.15)" }}>
          <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem", fontSize: "3.5rem", boxShadow: "0 10px 20px rgba(184, 134, 11, 0.3)" }}>
            <i className="fa-solid fa-check"></i>
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1rem", color: "#111", letterSpacing: "1px" }}>Payment Successful!</h2>
          <p style={{ color: "#555", fontSize: "1.1rem", marginBottom: "2.5rem", lineHeight: "1.6" }}>
            Thank you for your purchase. Your order <b style={{ color: "var(--primary)" }}>{createdOrder.id}</b> has been received and is being processed for shipping.
          </p>
          
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              type="button"
              onClick={() => generateInvoicePDF(createdOrder)}
              className="btn"
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "1rem 1.8rem",
                borderRadius: "8px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                border: "none",
                boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
                transition: "transform 0.2s"
              }}
            >
              <i className="fa-solid fa-file-pdf"></i> Download Official Tax Invoice
            </button>
            <Link 
              href="/account" 
              className="btn btn-outline"
              style={{ padding: "1rem 1.8rem", borderRadius: "8px", fontWeight: "600" }}
            >
              View Past History
            </Link>
            <Link 
              href="/" 
              className="btn btn-outline"
              style={{ padding: "1rem 1.8rem", borderRadius: "8px", fontWeight: "600" }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
