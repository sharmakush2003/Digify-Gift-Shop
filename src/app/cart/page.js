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

  // Promo code & Gift Voucher state (supports additive stacking)
  const [promoInput, setPromoInput] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState([]); // [{ code, isAdditive, discountAmount, isGiftVoucher }]

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

  // Promo code / Gift Voucher validation via backend API
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    
    if (!code) return;

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          cartValue: cartSubtotal,
          cartItems: cart,
          activeCoupons: appliedCoupons
        })
      });

      const data = await response.json();

      if (data.success) {
        const newCoupon = {
          code: data.coupon.code,
          isAdditive: data.coupon.isAdditive,
          discountAmount: data.discountAmount,
          isGiftVoucher: data.coupon.isGiftVoucher
        };

        setAppliedCoupons(prev => {
          // Prevent duplicates if clicked multiple times quickly
          if (prev.some(c => c.code === newCoupon.code)) {
            return prev;
          }
          return [...prev, newCoupon];
        });
        showToast(`🎉 ${data.message} (-₹${data.discountAmount})`, "success");
        setPromoInput("");
      } else {
        showToast(`❌ ${data.message || "Invalid promotional code."}`, "error");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      showToast("❌ Error validating coupon. Please try again.", "error");
    }
  };

  const removeCouponByCode = (codeToRemove) => {
    setAppliedCoupons(prev => prev.filter(c => c.code !== codeToRemove));
    showToast(`Coupon ${codeToRemove} removed`, "success");
  };

  // Shipping Fee (Free shipping above ₹999, else ₹99)
  const shippingFee = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 99;

  // Total Combined Discount across all applied coupons/vouchers
  const totalDiscount = appliedCoupons.reduce((sum, c) => sum + (c.discountAmount || 0), 0);

  // Final Total
  const finalTotal = Math.max(0, cartSubtotal - totalDiscount);

  const handleCheckout = () => {
    // Save checkout calculations to localStorage to pass to checkout page
    localStorage.setItem("orient_checkout_shipping", "0"); // Will be calculated on checkout page
    localStorage.setItem("orient_checkout_loyalty_disc", "0");
    localStorage.setItem("orient_checkout_promo_disc", totalDiscount.toString());
    localStorage.setItem("orient_checkout_promo_code", appliedCoupons.map(c => c.code).join(", "));
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
                  {item.fragile && (
                    <div className="cart-item-meta">
                      <span style={{ color: "var(--primary)" }}><i className="fa-solid fa-triangle-exclamation"></i> Fragile Item</span>
                    </div>
                  )}
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

            {/* Promo & Gift Voucher Input Form */}
            <div style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
              <form onSubmit={handleApplyPromo} className="loyalty-form">
                <input 
                  type="text" 
                  className="loyalty-input" 
                  placeholder="Enter Promo Code or Gift Voucher" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" className="btn btn-outline btn-sm">Apply</button>
              </form>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Supports Exclusive and Additive (Stackable) coupons.
              </p>
            </div>

            {/* Applied Coupons Breakdown */}
            {appliedCoupons.map((c, index) => (
              <div key={`${c.code}-${index}`} className="summary-row" style={{ color: c.isAdditive ? "#10b981" : "var(--primary)" }}>
                <span>
                  {c.isGiftVoucher ? "🎁 Gift Voucher" : (c.isAdditive ? "➕ Additive Coupon" : "🔒 Coupon")} ({c.code}) 
                  <button 
                    onClick={() => removeCouponByCode(c.code)} 
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '6px' }}
                  >
                    (Remove)
                  </button>
                </span>
                <span>-₹{c.discountAmount.toFixed(2)}</span>
              </div>
            ))}

            <div className="summary-row">
              <span>Shipping Fee</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500", textAlign: "right", maxWidth: "60%" }}>Will be communicated with you after the order</span>
            </div>

            <div className="summary-row total-row" style={{ marginBottom: '1.5rem' }}>
              <span>Estimated Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary btn-full" onClick={handleCheckout}>
              Proceed to Checkout &rarr;
            </button>
          </aside>
        </div>
      )}


      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`toast toast-${toastType} show`}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
