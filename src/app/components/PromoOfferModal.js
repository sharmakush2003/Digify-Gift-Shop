"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const DEFAULT_CONFIG = {
  enabled: true,
  title: "Special Offer - Free Gift Voucher",
  subtitle: "Experience luxury dining with Orient Crockeries today. Get flat ₹500 OFF on your first purchase!",
  couponCode: "WELCOME500",
  discountText: "FLAT ₹500 OFF",
  minOrderText: "On orders above ₹1,999",
  bannerTitle: "Scale Your Elegance",
  bannerSubtitle: "Join the future of luxury hospitality with Orient Crockeries.",
  bannerImageUrl: "",
  delaySeconds: 1.5,
};

export default function PromoOfferModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [toastMessage, setToastMessage] = useState("");

  const isAdminOrDelivery = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/reset-password') || pathname.startsWith('/auth/verify'));

  const loadConfig = () => {
    try {
      // Check 7-day dismissal status
      const hideUntil = localStorage.getItem("orient_hide_promo_popup");
      if (hideUntil) {
        const timestamp = parseInt(hideUntil, 10);
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < SEVEN_DAYS_MS) {
          return null; // Suppressed by user preference
        }
      }

      // Load admin config
      const saved = localStorage.getItem("orient_promo_popup_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enabled === false) return null;
        return { ...DEFAULT_CONFIG, ...parsed };
      }
      return DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  };

  useEffect(() => {
    if (isAdminOrDelivery) return;

    const activeConfig = loadConfig();
    if (!activeConfig) return;

    setConfig(activeConfig);

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, (activeConfig.delaySeconds || 1.5) * 1000);

    return () => clearTimeout(timer);
  }, [isAdminOrDelivery]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("orient_hide_promo_popup", Date.now().toString());
    }
    setIsOpen(false);
  };

  const handleClaim = () => {
    if (config.couponCode) {
      navigator.clipboard?.writeText(config.couponCode);
      setToastMessage(`✓ Coupon Code '${config.couponCode}' copied to clipboard!`);
      setTimeout(() => setToastMessage(""), 3500);
    }
    handleClose();
  };

  if (isAdminOrDelivery || !isOpen) return null;

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        zIndex: 9999, 
        backgroundColor: "rgba(15, 23, 42, 0.75)", 
        backdropFilter: "blur(8px)", 
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "16px",
        animation: "fadeInModal 0.3s ease-out"
      }}
      onClick={handleClose}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @media (max-width: 640px) {
          .promo-modal-card {
            grid-template-columns: 1fr !important;
            max-width: 92vw !important;
            border-radius: 24px !important;
          }
          .promo-desktop-banner {
            display: none !important;
          }
          .promo-mobile-banner {
            display: flex !important;
          }
          .promo-content-padding {
            padding: 1.4rem 1.2rem 1.2rem 1.2rem !important;
          }
        }
        @media (min-width: 641px) {
          .promo-mobile-banner {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="promo-modal-card"
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: "100%", 
          maxWidth: "680px", 
          backgroundColor: "#ffffff", 
          borderRadius: "24px", 
          overflow: "hidden", 
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)", 
          display: "grid", 
          gridTemplateColumns: "1fr 1.1fr",
          position: "relative"
        }}
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={handleClose}
          aria-label="Close promo popup"
          style={{ 
            position: "absolute", 
            top: "12px", 
            right: "12px", 
            width: "32px", 
            height: "32px", 
            borderRadius: "50%", 
            backgroundColor: "rgba(255, 255, 255, 0.9)", 
            border: "1px solid rgba(0, 0, 0, 0.1)", 
            color: "#334155", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            cursor: "pointer", 
            fontSize: "0.95rem",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* MOBILE TOP BANNER HEADER (Visible on Mobile Screens) */}
        <div 
          className="promo-mobile-banner"
          style={{ 
            background: config.bannerImageUrl 
              ? `url(${config.bannerImageUrl}) center/cover no-repeat` 
              : "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)", 
            padding: "1.8rem 1.2rem 1.2rem 1.2rem", 
            color: "#ffffff", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: config.bannerImageUrl ? "rgba(0,0,0,0.45)" : "transparent" }}></div>
          <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.3)", marginBottom: "8px" }}>
              <i className="fa-solid fa-gift" style={{ color: "#fde047", fontSize: "0.9rem" }}></i>
              <span style={{ fontSize: "0.7rem", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" }}>ORIENT EXCLUSIVE</span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "4px 0 2px 0", color: "#ffffff", fontFamily: "var(--font-serif, serif)" }}>
              {config.bannerTitle || "Scale Your Elegance"}
            </h3>
            <p style={{ fontSize: "0.78rem", opacity: 0.9, margin: 0 }}>
              {config.bannerSubtitle || "Join the future of luxury hospitality."}
            </p>
          </div>
        </div>

        {/* DESKTOP LEFT BANNER (Visible on Desktop Screens) */}
        <div 
          className="promo-desktop-banner"
          style={{ 
            background: config.bannerImageUrl 
              ? `url(${config.bannerImageUrl}) center/cover no-repeat` 
              : "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)", 
            padding: "2.5rem 1.8rem", 
            color: "#ffffff", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center",
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: config.bannerImageUrl ? "rgba(0,0,0,0.45)" : "transparent" }}></div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }}>
              <i className="fa-solid fa-gift" style={{ fontSize: "1.9rem", color: "#fde047" }}></i>
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", margin: "0 0 10px 0", color: "#ffffff", lineHeight: "1.25", fontFamily: "var(--font-serif, serif)" }}>
              {config.bannerTitle || "Scale Your Elegance"}
            </h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.92, margin: 0, lineHeight: "1.5" }}>
              {config.bannerSubtitle || "Join the future of retail with Orient Crockeries."}
            </p>
          </div>
        </div>

        {/* RIGHT / MAIN CONTENT BODY */}
        <div 
          className="promo-content-padding"
          style={{ padding: "2.2rem 1.8rem 1.6rem 1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "1px", display: "block" }}>
              Orient Exclusive Offer
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 8px 0", lineHeight: "1.3" }}>
              {config.title || "Special Offer - Free Gift Voucher"}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              {config.subtitle || "Experience luxury dining with Orient Crockeries today."}
            </p>

            {/* STYLISH COUPON CARD */}
            <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", border: "2px dashed #3b82f6", padding: "14px 12px", borderRadius: "14px", textAlign: "center", marginBottom: "18px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", display: "inline-block", backgroundColor: "#dbeafe", padding: "2px 8px", borderRadius: "10px" }}>
                {config.discountText || "FLAT ₹500 OFF"}
              </span>
              <div style={{ fontSize: "1.45rem", fontWeight: "900", color: "#1e293b", margin: "6px 0 2px 0", letterSpacing: "2.5px", fontFamily: "monospace" }}>
                {config.couponCode || "WELCOME500"}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>
                {config.minOrderText || "On orders above ₹1,999"}
              </span>
            </div>
          </div>

          <div>
            {/* ACTION BUTTON WITH VIBRANT ANIMATION */}
            <button 
              type="button"
              onClick={handleClaim}
              style={{ 
                width: "100%", 
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", 
                color: "#ffffff", 
                border: "none", 
                padding: "13px 16px", 
                borderRadius: "12px", 
                fontWeight: "800", 
                fontSize: "0.95rem", 
                cursor: "pointer", 
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                letterSpacing: "0.5px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
              }}
            >
              <i className="fa-solid fa-copy"></i>
              <span>CLAIM OFFER & COPY CODE</span>
            </button>

            {/* DON'T SHOW FOR 7 DAYS CHECKBOX */}
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "0.78rem", color: "#64748b", cursor: "pointer", userSelect: "none" }}>
              <input 
                type="checkbox" 
                checked={dontShowAgain} 
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ accentColor: "#2563eb", cursor: "pointer", width: "15px", height: "15px" }}
              />
              <span>Don't show this for 7 days</span>
            </label>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div style={{ position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#059669", color: "#fff", padding: "12px 24px", borderRadius: "30px", fontWeight: "700", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", zIndex: 10000, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
