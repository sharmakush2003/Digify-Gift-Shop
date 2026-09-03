"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    min_cart_value: "0",
    is_additive: false,
    is_active: true
  });
  const [message, setMessage] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Creating...");
    
    // Check if user selected Additive
    const isAdditive = formData.is_additive;
    const finalType = isAdditive ? `${formData.discount_type}_ADDITIVE` : formData.discount_type;

    let payload = {
      code: formData.code.toUpperCase().trim(),
      discount_type: finalType,
      discount_value: parseFloat(formData.discount_value),
      min_cart_value: parseFloat(formData.min_cart_value),
      is_active: formData.is_active,
      is_additive: isAdditive
    };

    try {
      const response = await fetch('/api/admin/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      
      if (!resData.success) {
        setMessage("Error creating coupon: " + resData.message);
      } else {
        setMessage("Coupon created successfully!");
        setFormData({ code: "", discount_type: "PERCENTAGE", discount_value: "", min_cart_value: "0", is_additive: false, is_active: true });
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
      setMessage("Error creating coupon: " + err.message);
    }
    
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: newStatus } : c));

    try {
      const response = await fetch('/api/admin/coupons/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: newStatus })
      });

      const resData = await response.json();
      if (!resData.success) {
        // Rollback optimistic update if server request fails
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: currentStatus } : c));
        alert('Failed to update status: ' + (resData.message || 'Server error'));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      // Rollback
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: currentStatus } : c));
    }
  };

  return (
    <div className="erp-content-box">
      <div className="panel-header">
        <h3>Discount & Promotion Engine</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Create and manage promo codes & additive discount vouchers</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        {/* Create Coupon Form */}
        <div style={{ background: "var(--bg-surface)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <h4>Create New Coupon</h4>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
            <div>
              <label className="form-label">Coupon Code (e.g. FESTIVAL10)</label>
              <input type="text" className="form-input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)" }} />
            </div>
            <div>
              <label className="form-label">Discount Type</label>
              <select className="form-input" value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Coupon Stacking / Category</label>
              <select 
                className="form-input" 
                value={formData.is_additive ? "ADDITIVE" : "EXCLUSIVE"} 
                onChange={e => setFormData({...formData, is_additive: e.target.value === "ADDITIVE"})}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: formData.is_additive ? "rgba(212, 175, 55, 0.1)" : "inherit" }}
              >
                <option value="EXCLUSIVE">Single-Use / Exclusive (Cannot stack with other single-use coupons)</option>
                <option value="ADDITIVE">Additive / Stackable (Can be applied on top of existing coupons)</option>
              </select>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {formData.is_additive 
                  ? "✨ Additive coupons can stack with other active coupons in the shopping cart." 
                  : "🔒 Single-Use coupons cannot stack with other single-use promo codes."}
              </p>
            </div>
            <div>
              <label className="form-label">Discount Value</label>
              <input type="number" step="0.01" className="form-input" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)" }} />
            </div>
            <div>
              <label className="form-label">Min Cart Value (₹)</label>
              <input type="number" step="0.01" className="form-input" value={formData.min_cart_value} onChange={e => setFormData({...formData, min_cart_value: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)" }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "10px", width: "100%", padding: "10px" }}>Create Coupon</button>
            {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', fontSize: "0.9rem" }}>{message}</p>}
          </form>
        </div>
        {/* Coupons List */}
        <div>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: "center" }}>Loading coupons...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)" }}>No coupons found. Create one to get started.</td></tr>
                ) : (
                  coupons.map(coupon => {
                    const isAdditive = coupon.is_additive === true || (coupon.discount_type && coupon.discount_type.includes('ADDITIVE'));
                    const rawType = (coupon.discount_type || 'PERCENTAGE').replace('_ADDITIVE', '');
                    return (
                      <tr key={coupon.id}>
                        <td style={{ fontWeight: "bold" }}>{coupon.code}</td>
                        <td>{rawType}</td>
                        <td>
                          <span style={{ 
                            padding: "3px 8px", 
                            borderRadius: "12px", 
                            fontSize: "0.75rem", 
                            fontWeight: "600",
                            background: isAdditive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", 
                            color: isAdditive ? "#10b981" : "#ef4444" 
                          }}>
                            {isAdditive ? "➕ Additive" : "🔒 Exclusive"}
                          </span>
                        </td>
                        <td>{rawType === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                        <td>₹{coupon.min_cart_value}</td>
                        <td>
                          <span className={`status-badge ${coupon.is_active ? 'paid' : 'failed'}`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleStatus(coupon.id, coupon.is_active);
                            }}
                          >
                            {coupon.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
