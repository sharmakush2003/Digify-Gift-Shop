'use client';
import React from 'react';

export default function InstructionsTab() {
  return (
    <div className="erp-content-box" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* 24/7 Developer Support Header Banner */}
      <div 
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "24px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "10px", 
                backgroundColor: "#ecfdf5", 
                border: "1px solid #a7f3d0", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#059669", 
                fontSize: "1.2rem" 
              }}>
                <i className="fa-solid fa-headset"></i>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.45rem", fontWeight: "800", color: "#0f172a" }}>
                24/7 AutomateX Developer Support
              </h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0, maxWidth: "680px", lineHeight: "1.5" }}>
              Need technical help, bulk inventory uploads, custom feature requests, or troubleshooting? Contact us anytime.
            </p>
          </div>

          <a 
            href="https://automatexai.co.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 22px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.88rem",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-solid fa-globe"></i>
            <span>VISIT AUTOMATEX</span>
          </a>
        </div>

        {/* 4 Action Contact Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "14px",
          marginTop: "20px"
        }}>
          {/* Card 1: Direct Phone Call 1 */}
          <a 
            href="tel:+917425016636"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0
            }}>
              <i className="fa-solid fa-phone"></i>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", color: "#15803d", letterSpacing: "0.5px" }}>Direct Phone Call</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>+91 7425016636</div>
            </div>
          </a>

          {/* Card 2: Direct Phone Call 2 */}
          <a 
            href="tel:+919424466992"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0
            }}>
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", color: "#1d4ed8", letterSpacing: "0.5px" }}>Alternate Hotline</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>+91 9424466992</div>
            </div>
          </a>

          {/* Card 3: WhatsApp Support */}
          <a 
            href="https://wa.me/917425016636?text=Hi%20AutomateX%2C%20I%20need%20support%20for%20Orient%20Crockeries%20Website."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              flexShrink: 0
            }}>
              <i className="fa-brands fa-whatsapp"></i>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", color: "#047857", letterSpacing: "0.5px" }}>WhatsApp Support</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Chat on WhatsApp</div>
            </div>
          </a>

          {/* Card 4: Official Support Email */}
          <a 
            href="mailto:support@digifysoft.in"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0
            }}>
              <i className="fa-solid fa-envelope"></i>
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", color: "#b91c1c", letterSpacing: "0.5px" }}>Official Support Email</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>support@digifysoft.in</div>
            </div>
          </a>
        </div>
      </div>

      {/* System Documentation & Operational Guides */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e293b", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fa-solid fa-book-open" style={{ color: "var(--primary)" }}></i>
          Orient Crockery System Management Guides
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
       
        {/* Orders & Revenue */}
        <div style={{ padding: '22px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4318ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-dolly"></i>
            </span>
            Orders Queue & 6-Digit Delivery OTP
          </h4>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.5' }}>
            Manage customer orders from incoming checkout to delivery confirmation.
          </p>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', fontSize: '0.84rem', margin: 0, lineHeight: '1.5' }}>
            <li><strong>Pending Orders:</strong> New orders appear here. Click "Pack SKU" when the item is packed in the warehouse.</li>
            <li><strong>Packed Orders:</strong> Ready for dispatch. Click "Ship" to generate the secure 6-digit Delivery OTP.</li>
            <li><strong>Shipped Orders:</strong> Delivery rider enters the OTP upon handover to mark order Delivered.</li>
          </ul>
        </div>

        {/* Coupons & Promos */}
        <div style={{ padding: '22px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-ticket"></i>
            </span>
            Discount Coupons & Additive Promos
          </h4>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.5' }}>
            Configure marketing discount vouchers and additive discount rules.
          </p>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', fontSize: '0.84rem', margin: 0, lineHeight: '1.5' }}>
            <li><strong>Create Coupons:</strong> Set custom codes (e.g. WELCOME500), percentage or flat off, and min cart value.</li>
            <li><strong>Additive Stacking:</strong> Allow specific coupons to stack with existing sale promotions.</li>
            <li><strong>Active Toggle:</strong> Switch coupons on/off with zero data loss.</li>
          </ul>
        </div>

        {/* Bulk Upload Instructions */}
        <div style={{ padding: '22px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-file-csv"></i>
            </span>
            Bulk CSV & Image Import
          </h4>
          <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', fontSize: '0.84rem', margin: 0, lineHeight: '1.5' }}>
            <li>Click <strong>Bulk Import</strong> in the Inventory Registry tab.</li>
            <li>Select all product images at once (named after SKU, e.g. `201.jpg`).</li>
            <li>Upload your CSV file and click <strong>Start Bulk Import</strong>.</li>
          </ol>
        </div>

        {/* Single Product Instructions */}
        <div style={{ padding: '22px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fae8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-plus-circle"></i>
            </span>
            Single Product & Hamper Creation
          </h4>
          <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#334155', fontSize: '0.84rem', margin: 0, lineHeight: '1.5' }}>
            <li><strong>Single Add:</strong> Fill product specifications, pricing, stock, GST, and upload up to 5 photos.</li>
            <li><strong>Create Gift Hamper:</strong> Bundle multiple individual products together with combo pricing.</li>
            <li><strong>Edit / Delete:</strong> Safe action confirmation dialog protects against accidental edits or deletes.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
