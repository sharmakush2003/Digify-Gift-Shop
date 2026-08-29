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
    const { data, error } = await supabase.from('coupons').insert([{
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_cart_value: parseFloat(formData.min_cart_value),
      is_active: formData.is_active
    }]);
    if (error) {
      setMessage("Error creating coupon: " + error.message);
    } else {
      setMessage("Coupon created successfully!");
      setFormData({ code: "", discount_type: "PERCENTAGE", discount_value: "", min_cart_value: "0", is_active: true });
      fetchCoupons();
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
    fetchCoupons();
  };

  return (
    <div className="erp-content-box">
      <div className="panel-header">
        <h3>Discount & Promotion Engine</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Create and manage promo codes</p>
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
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center" }}>Loading coupons...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>No coupons found. Create one to get started.</td></tr>
                ) : (
                  coupons.map(coupon => (
                    <tr key={coupon.id}>
                      <td style={{ fontWeight: "bold" }}>{coupon.code}</td>
                      <td>{coupon.discount_type}</td>
                      <td>{coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                      <td>₹{coupon.min_cart_value}</td>
                      <td>
                        <span className={`status-badge ${coupon.is_active ? 'paid' : 'failed'}`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                        >
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
