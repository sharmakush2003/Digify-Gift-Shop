"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../supabase";

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
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [toastMessage, setToastMessage] = useState("");

  const isAdminOrDelivery = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/reset-password') || pathname.startsWith('/auth/verify'));

  useEffect(() => {
    if (isAdminOrDelivery) return;

    // Check 7-day dismissal status
    const hideUntil = localStorage.getItem("orient_hide_promo_popup");
    if (hideUntil) {
      const timestamp = parseInt(hideUntil, 10);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < SEVEN_DAYS_MS) {
        return; // Suppressed by user preference
      }
    }

    const fetchConfig = async () => {
      let activeConfig = DEFAULT_CONFIG;
      try {
        const { data, error } = await supabase.from('promo_config').select('*').eq('id', 1).single();
        if (!error && data) {
          if (data.enabled === false) return;
          activeConfig = {
            ...DEFAULT_CONFIG,
            enabled: data.enabled ?? true,
            bannerImageUrl: data.image_url ?? '',
            ...data.config_json
          };
        } else {
          const saved = localStorage.getItem("orient_promo_popup_config");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.enabled === false) return;
            activeConfig = { ...DEFAULT_CONFIG, ...parsed };
          }
        }
      } catch (e) {
        activeConfig = DEFAULT_CONFIG;
      }

      setConfig(activeConfig);
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, (activeConfig.delaySeconds || 1.5) * 1000);

      return () => clearTimeout(timer);
    };

    fetchConfig();
  }, [isAdminOrDelivery]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("orient_hide_promo_popup", Date.now().toString());
    }
    setIsOpen(false);
  };

  const handleClaim = () => {
    if (!user) {
      handleClose();
      router.push('/auth');
      return;
    }

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
        @media (max-width: 640px) {
          .promo-modal-responsive {
            grid-template-columns: 1fr !important;
            max-width: 92vw !important;
          }
          .promo-desktop-banner {
            display: none !important;
          }
          .promo-mobile-banner {
            display: block !important;
          }
        }
        @media (min-width: 641px) {
          .promo-mobile-banner {
            display: none !important;
          }
        }
      `}</style>

      <div 
        style={{ 
          backgroundColor: "#ffffff", 
          borderRadius: "24px", 
          maxWidth: "680px", 
          width: "100%", 
          overflow: "hidden", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "240px 1fr"
        }}
        className="promo-modal-responsive"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={handleClose}
          style={{ 
            position: "absolute", 
            top: "16px", 
            right: "16px", 
            width: "32px", 
            height: "32px", 
            borderRadius: "50%", 
            backgroundColor: "rgba(15, 23, 42, 0.06)", 
            border: "none", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            zIndex: 10,
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.12)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.06)"}
        >
          <i className="fa-solid fa-xmark" style={{ color: "#475569", fontSize: "1rem" }}></i>
        </button>

        {/* MOBILE TOP BANNER */}
        <div 
          className="promo-mobile-banner"
          style={{ 
            background: config.bannerImageUrl 
              ? `url(${config.bannerImageUrl}) center/cover no-repeat` 
              : "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)", 
            padding: "1.5rem 1rem", 
            color: "#ffffff", 
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "20px", marginBottom: "8px" }}>
              <i className="fa-solid fa-gift" style={{ color: "#fde047", fontSize: "0.85rem" }}></i>
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

        {/* DESKTOP LEFT BANNER */}
        <div 
          className="promo-desktop-banner"
          style={{ 
            background: config.bannerImageUrl 
              ? `url(${config.bannerImageUrl}) center/cover no-repeat` 
              : "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)", 
            padding: "2rem", 
            color: "#ffffff", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center",
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" }}></div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <i className="fa-solid fa-gift" style={{ fontSize: "3rem", color: "#fde047", marginBottom: "16px" }}></i>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "800", margin: "0 0 10px 0", color: "#ffffff", lineHeight: "1.25", fontFamily: "var(--font-serif, serif)" }}>
              {config.bannerTitle || "Scale Your Elegance"}
            </h3>
          </div>
        </div>

        {/* RIGHT / MAIN CONTENT BODY */}
        <div 
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
              {user ? (config.subtitle || "Experience luxury dining with Orient Crockeries today.") : "Sign up or log in to unlock your ₹500 OFF voucher code!"}
            </p>

            {/* STYLISH COUPON CARD */}
            <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", border: "2px dashed #3b82f6", padding: "14px 12px", borderRadius: "14px", textAlign: "center", marginBottom: "18px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", display: "inline-block", backgroundColor: "#dbeafe", padding: "2px 8px", borderRadius: "10px" }}>
                {config.discountText || "FLAT ₹500 OFF"}
              </span>
              <div style={{ fontSize: user ? "1.45rem" : "1.1rem", fontWeight: "900", color: user ? "#1e293b" : "#2563eb", margin: "6px 0 2px 0", letterSpacing: user ? "2.5px" : "0.5px", fontFamily: user ? "monospace" : "inherit" }}>
                {user ? (config.couponCode || "WELCOME500") : "🔒 LOGIN TO UNLOCK CODE"}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>
                {config.minOrderText || "On orders above ₹1,999"}
              </span>
            </div>
          </div>

          <div>
            {/* ACTION BUTTON */}
            <button 
              type="button"
              onClick={handleClaim}
              style={{ 
                width: "100%", 
                background: user ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                color: "#ffffff", 
                border: "none", 
                padding: "13px 16px", 
                borderRadius: "12px", 
                fontWeight: "800", 
                fontSize: "0.95rem", 
                cursor: "pointer", 
                boxShadow: user ? "0 6px 20px rgba(37, 99, 235, 0.4)" : "0 6px 20px rgba(16, 185, 129, 0.4)",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                letterSpacing: "0.5px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <i className={user ? "fa-solid fa-copy" : "fa-solid fa-right-to-bracket"}></i>
              <span>{user ? "CLAIM OFFER & COPY CODE" : "LOGIN / SIGN UP TO CLAIM ₹500 OFF"}</span>
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
