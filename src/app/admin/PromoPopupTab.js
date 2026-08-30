"use client";

import React, { useState, useEffect } from "react";

const DEFAULT_CONFIG = {
  enabled: true,
  title: "Special Offer - Free Gift Voucher",
  subtitle: "Experience luxury dining with Orient Crockeries today. Get flat ₹500 OFF on your first purchase!",
  couponCode: "WELCOME500",
  discountText: "FLAT ₹500 OFF",
  minOrderText: "On orders above ₹1,999",
  bannerTitle: "Scale Your Elegance",
  bannerSubtitle: "Join the elite hospitality dining experience with Orient Crockeries.",
  bannerImageUrl: "",
  delaySeconds: 1.5,
};

export default function PromoPopupTab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("orient_promo_popup_config");
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Error loading promo popup config:", e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("orient_promo_popup_config", JSON.stringify(config));
      // Dispatch custom event for real-time sync across components
      window.dispatchEvent(new Event("orient_promo_config_updated"));
      setMessage("✓ Promo Popup settings saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("Failed to save settings.");
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset Popup configuration to default settings?")) {
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem("orient_promo_popup_config", JSON.stringify(DEFAULT_CONFIG));
      window.dispatchEvent(new Event("orient_promo_config_updated"));
      setMessage("Reset to default settings.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="erp-content-box" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.4rem", color: "#1e293b", margin: 0 }}>
              <i className="fa-solid fa-bullhorn" style={{ color: "var(--primary)", marginRight: "10px" }}></i>
              Front-End Discount Promo Popup Manager
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
              Configure special offer banner popups displayed to website visitors when they open Orient Crockeries.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label className="filter-checkbox-label" style={{ backgroundColor: config.enabled ? "#ecfdf5" : "#fef2f2", border: `1.5px solid ${config.enabled ? "#10b981" : "#ef4444"}`, padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontWeight: "700", color: config.enabled ? "#065f46" : "#991b1b" }}>
              <input 
                type="checkbox" 
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                style={{ accentColor: "#10b981", marginRight: "8px" }}
              />
              <span>{config.enabled ? "POPUP IS ACTIVE ON FRONT-END" : "POPUP IS CURRENTLY DISABLED"}</span>
            </label>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ padding: "12px 18px", backgroundColor: message.includes("✓") ? "#ecfdf5" : "#fff1f2", color: message.includes("✓") ? "#047857" : "#be123c", borderRadius: "10px", marginBottom: "1.5rem", fontWeight: "600", border: "1px solid currentColor" }}>
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "start" }}>
        
        {/* CONFIG FORM */}
        <form onSubmit={handleSave} style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1.5px solid #cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h4 style={{ margin: "0 0 1.2rem 0", color: "#334155", fontSize: "1.05rem", fontWeight: "700", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
            <i className="fa-solid fa-sliders" style={{ marginRight: "8px", color: "var(--primary)" }}></i> Edit Popup Content & Offer Text
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <span className="form-label">Offer Title Header</span>
              <input 
                type="text" 
                className="form-input"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                required
                placeholder="e.g. Special Offer - Free Gift Voucher"
              />
            </div>

            <div>
              <span className="form-label">Subtitle Description</span>
              <textarea 
                className="form-input"
                rows="2"
                value={config.subtitle}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                placeholder="Detailed offer details shown to user..."
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <span className="form-label">Coupon Code</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={config.couponCode}
                  onChange={(e) => setConfig({ ...config, couponCode: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. WELCOME500"
                  style={{ fontWeight: "700", letterSpacing: "1px" }}
                />
              </div>
              <div>
                <span className="form-label">Discount Badge Text</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={config.discountText}
                  onChange={(e) => setConfig({ ...config, discountText: e.target.value })}
                  placeholder="e.g. FLAT ₹500 OFF"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <span className="form-label">Min. Order Requirement</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={config.minOrderText}
                  onChange={(e) => setConfig({ ...config, minOrderText: e.target.value })}
                  placeholder="e.g. On orders above ₹1,999"
                />
              </div>
              <div>
                <span className="form-label">Pop-up Delay (Seconds)</span>
                <input 
                  type="number" 
                  step="0.5"
                  min="0"
                  className="form-input"
                  value={config.delaySeconds}
                  onChange={(e) => setConfig({ ...config, delaySeconds: parseFloat(e.target.value) || 0 })}
                  placeholder="1.5"
                />
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
              <span className="form-label">Banner Left Column Title</span>
              <input 
                type="text" 
                className="form-input"
                value={config.bannerTitle}
                onChange={(e) => setConfig({ ...config, bannerTitle: e.target.value })}
                placeholder="e.g. Scale Your Elegance"
              />
            </div>

            <div>
              <span className="form-label">Banner Tagline / Subtitle</span>
              <input 
                type="text" 
                className="form-input"
                value={config.bannerSubtitle}
                onChange={(e) => setConfig({ ...config, bannerSubtitle: e.target.value })}
                placeholder="e.g. Join the elite hospitality dining experience..."
              />
            </div>

            <div>
              <span className="form-label">Custom Banner Image URL (Optional)</span>
              <input 
                type="text" 
                className="form-input"
                value={config.bannerImageUrl}
                onChange={(e) => setConfig({ ...config, bannerImageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo... (or leave empty for luxury gradient)"
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "12px", fontWeight: "700" }}>
                <i className="fa-solid fa-floppy-disk" style={{ marginRight: "8px" }}></i> Save & Apply Configuration
              </button>
              <button type="button" className="btn btn-outline" onClick={handleReset} style={{ padding: "12px" }}>
                Reset Defaults
              </button>
            </div>
          </div>
        </form>

        {/* LIVE PREVIEW BOX */}
        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "1.5px solid #cbd5e1" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#334155", fontSize: "1.05rem", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><i className="fa-solid fa-eye" style={{ marginRight: "8px", color: "#0284c7" }}></i> Front-End Live Popup Preview</span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "10px", fontWeight: "600" }}>Interactive Mockup</span>
          </h4>

          {/* MOCKUP POPUP CARD */}
          <div style={{ position: "relative", width: "100%", background: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "0.9fr 1.1fr" }}>
            
            {/* LEFT BANNER SIDE */}
            <div style={{ 
              background: config.bannerImageUrl ? `url(${config.bannerImageUrl}) center/cover no-repeat` : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)", 
              padding: "1.8rem 1.2rem", 
              color: "#ffffff", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center", 
              alignItems: "center",
              textAlign: "center",
              position: "relative"
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundColor: config.bannerImageUrl ? "rgba(0,0,0,0.4)" : "transparent" }}></div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <i className="fa-solid fa-gift" style={{ fontSize: "2rem", marginBottom: "12px", color: "#fde047" }}></i>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "0 0 8px 0", color: "#fff", lineHeight: "1.2" }}>
                  {config.bannerTitle || "Scale Your Elegance"}
                </h3>
                <p style={{ fontSize: "0.78rem", opacity: 0.9, margin: 0, lineHeight: "1.4" }}>
                  {config.bannerSubtitle || "Join the future of retail with Orient Crockeries."}
                </p>
              </div>
            </div>

            {/* RIGHT FORM / OFFER SIDE */}
            <div style={{ padding: "1.5rem", position: "relative", background: "#ffffff" }}>
              <div style={{ position: "absolute", top: "10px", right: "12px", width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", cursor: "pointer" }}>
                ✕
              </div>

              <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.5px" }}>Exclusive Promotion</span>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 6px 0" }}>
                {config.title || "Special Offer - Free Trial"}
              </h4>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 14px 0", lineHeight: "1.3" }}>
                {config.subtitle || "Experience luxury dining with Orient Crockeries today."}
              </p>

              {/* COUPON CARD PREVIEW */}
              <div style={{ background: "#f8fafc", border: "1.5px dashed #3b82f6", padding: "12px", borderRadius: "10px", textAlign: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.7rem", color: "#2563eb", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" }}>{config.discountText || "FLAT OFFER"}</span>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", margin: "2px 0", letterSpacing: "2px" }}>
                  {config.couponCode || "WELCOME500"}
                </div>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{config.minOrderText || "On orders above ₹1,999"}</span>
              </div>

              {/* ACTION BUTTON */}
              <button 
                type="button" 
                style={{ width: "100%", backgroundColor: "#2563eb", color: "#ffffff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)" }}
              >
                CLAIM OFFER & COPY CODE
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "0.72rem", color: "#64748b" }}>
                <input type="checkbox" readOnly checked />
                <span>Don't show this for 7 days</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", padding: "10px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#475569" }}>
            <i className="fa-solid fa-lightbulb" style={{ color: "#eab308", marginRight: "6px" }}></i>
            <b>Pro Tip:</b> When a visitor clicks "CLAIM OFFER & COPY CODE", the coupon code is auto-copied to their clipboard and they are redirected directly to the shopping catalog!
          </div>
        </div>

      </div>
    </div>
  );
}
