"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";

export default function CartPage() {
  const { 
    cart, 
    updateCartQty, 
    removeFromCart, 
    cartSubtotal 
  } = useApp();
  
  const router = useRouter();

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState("");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // 'success' or 'error'

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  // Promo code validation via backend API
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    
    if (!code) return;

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartValue: cartSubtotal })
      });

      const data = await response.json();

      if (data.success) {
        setPromoDiscount(data.discountAmount);
        setPromoApplied(data.coupon.code);
        setPromoInput("");
        showToast(`🎉 Yay! ${data.coupon.code} applied successfully! 🎈`, "success");
      } else {
        showToast(`❌ ${data.message || "Invalid promotional code."}`, "error");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      showToast("❌ Error validating coupon. Please try again.", "error");
    }
  };

  // Shipping Fee (Free shipping above ₹999, else ₹99)
  const shippingFee = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 99;

  // Final Total
  const finalTotal = Math.max(0, cartSubtotal - promoDiscount + shippingFee);

  const handleCheckout = () => {
    // Save checkout calculations to localStorage to pass to checkout page
    localStorage.setItem("orient_checkout_shipping", shippingFee.toString());
    localStorage.setItem("orient_checkout_loyalty_disc", "0");
    localStorage.setItem("orient_checkout_promo_disc", promoDiscount.toString());
    localStorage.setItem("orient_checkout_promo_code", promoApplied);
    localStorage.setItem("orient_checkout_total", finalTotal.toString());
    
    router.push("/checkout");
  };

  return (
    <div className="container" style={{ marginTop: "30px" }}>
      <h1 className="page-title">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-title" style={{ fontFamily: "var(--font-serif)" }}>Your Cart is Empty</h2>
          <p className="empty-desc">Discover our range of fine dining and professional cookware to fill it up.</p>
          <Link href="/catalog" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Items Table */}
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item-row">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div>
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    <span>Barcode: {item.barcode} | HSN: {item.hsn}</span>
                    {item.fragile && <span style={{ color: "var(--primary)", marginLeft: "10px" }}><i className="fa-solid fa-triangle-exclamation"></i> Fragile</span>}
                  </div>
                </div>
                
                {/* Quantity Editor */}
                <div className="qty-counter">
                  <button className="qty-btn" onClick={() => updateCartQty(item.id, item.quantity - 1)}>-</button>
                  <div className="qty-val">{item.quantity}</div>
                  <button className="qty-btn" onClick={() => updateCartQty(item.id, item.quantity + 1)}>+</button>
                </div>

                {/* Subtotal */}
                <div className="cart-item-price">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>

                {/* Delete */}
                <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label="Remove item">
                  <i className="fa-regular fa-trash-can"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Totals Summary Panel */}
          <aside className="cart-summary-box">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Promo Codes */}
            <div style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
              <form onSubmit={handleApplyPromo} className="loyalty-form">
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Enter Promo Code (e.g. WELCOME10)" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" className="btn btn-outline btn-sm">Apply</button>
              </form>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
                  Enter a valid coupon code to get a discount.
                </p>
            </div>

            {/* Calculations Breakdown */}
            {promoDiscount > 0 && (
              <div className="summary-row" style={{ color: "var(--success)" }}>
                <span>Promo Code ({promoApplied})</span>
                <span>-₹{promoDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Standard Shipping</span>
              <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}</span>
            </div>

            <div className="summary-row total">
              <span>Order Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>

            <button 
              className="btn btn-primary btn-full" 
              style={{ marginTop: "1.5rem" }}
              onClick={handleCheckout}
            >
              Secure Checkout
            </button>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Link href="/catalog" style={{ fontSize: "0.8rem", textDecoration: "underline", color: "var(--text-muted)" }}>
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
      
      {/* Floating Toast Notification */}
      <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'} ${toastMessage ? "show" : ""}`}>
        {toastType === 'success' ? (
          <i className="fa-solid fa-gift" style={{ color: "var(--primary)", fontSize: "1.2rem" }}></i>
        ) : (
          <i className="fa-solid fa-circle-exclamation" style={{ color: "var(--error)", fontSize: "1.2rem" }}></i>
        )}
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
