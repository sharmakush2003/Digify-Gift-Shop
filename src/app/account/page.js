'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import Link from 'next/link';
import { supabase } from '../../supabase';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const { orders, wishlist } = useApp();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [viewingOrders, setViewingOrders] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  


  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleViewOrders = () => {
    if (!orders || orders.length === 0) {
      triggerToast("There are no past orders associated with your account yet.");
    } else {
      setViewingOrders(true);
      setTimeout(() => {
        const el = document.getElementById("order-history-section");
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(212, 175, 55, 0.2)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', letterSpacing: '1px' }}>Authenticating Orient Portal...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const userInitial = user?.displayName ? String(user.displayName).charAt(0).toUpperCase() : (user?.email ? String(user.email).charAt(0).toUpperCase() : 'M');
  const userName = user?.user_metadata?.full_name || user?.displayName || 'Orient Patron';
  const userEmail = user?.email || 'N/A';
  const userPhone = user?.user_metadata?.phone || user?.phone || 'Not provided';
  const userStreet = user?.user_metadata?.street || 'Not provided';
  const userArea = user?.user_metadata?.area || '';
  const userPincode = user?.user_metadata?.pincode || '';
  const joinedDate = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Member';

  const handleEditProfile = () => {
    setEditName(userName);
    setEditPhone(userPhone === 'Not provided' ? '' : userPhone);
    setEditStreet(userStreet === 'Not provided' ? '' : userStreet);
    setEditArea(userArea);
    setEditPincode(userPincode);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return triggerToast("Name cannot be empty.");
    setIsSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: editName.trim(),
          phone: editPhone.trim(),
          street: editStreet.trim(),
          area: editArea,
          pincode: editPincode.trim()
        }
      });
      if (error) throw error;
      
      // Also update in public users table
      await supabase.from('users').update({ full_name: editName.trim() }).eq('id', user.id);
      
      triggerToast("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (err) {
      triggerToast("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-page-wrapper">
      {/* Luxury Hero Banner */}
      <div className="account-hero-banner">
        <div className="account-hero-content">
          <div className="account-avatar-large">
            <span>{userInitial}</span>
          </div>
          <div className="account-hero-info">
            <span className="account-badge-vip">
              <i className="fa-solid fa-crown"></i> PRIVILEGE MEMBER
            </span>
            <h1 className="account-user-name">Welcome, {userName}</h1>
            <p className="account-user-email">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="account-main-container">
        
        {/* Quick Stats Bar */}
        <div className="account-stats-row">
          <div className="account-stat-card">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders ? orders.length : 0}</span>
          </div>
          <div className="account-stat-card">
            <span className="stat-label">Saved Wishlist</span>
            <span className="stat-value">{wishlist ? wishlist.length : 0}</span>
          </div>
          <div className="account-stat-card">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">{joinedDate}</span>
          </div>
        </div>

        {/* Dashboard Grid Cards */}
        <div className="account-grid-layout">
          
          {/* Card 1: Account Profile Info */}
          <div className="account-card profile-card">
            <div>
              <div className="card-header">
                <div className="card-icon-circle">
                  <i className="fa-solid fa-user-gear"></i>
                </div>
                <div>
                  <h3 className="card-title">Profile Settings</h3>
                  <p className="card-subtitle">Manage personal account credentials</p>
                </div>
              </div>
              
              <div className="profile-details-list">
                {isEditingProfile ? (
                  <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                    <span className="detail-label">Full Name</span>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ padding: '0.8rem', width: '100%', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: '1rem' }}
                    />
                    
                    <span className="detail-label" style={{ marginTop: '10px' }}>Phone Number</span>
                    <input 
                      type="tel" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ padding: '0.8rem', width: '100%', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: '1rem' }}
                    />

                    <span className="detail-label" style={{ marginTop: '10px' }}>Street Address</span>
                    <input 
                      type="text" 
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      style={{ padding: '0.8rem', width: '100%', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: '1rem' }}
                    />

                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <span className="detail-label">Area (Jaipur)</span>
                        <select 
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          style={{ padding: '0.8rem', width: '100%', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: '1rem', marginTop: '10px' }}
                        >
                          <option value="">Select Area...</option>
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
                      <div style={{ flex: 1 }}>
                        <span className="detail-label">PIN Code</span>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                          style={{ padding: '0.8rem', width: '100%', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: '1rem', marginTop: '10px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={handleSaveProfile} disabled={isSaving} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button onClick={() => setIsEditingProfile(false)} disabled={isSaving} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Full Name</span>
                      <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {userName} 
                        <button onClick={handleEditProfile} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }} title="Edit Details">
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-val">{userEmail}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone Number</span>
                      <span className="detail-val">{userPhone}</span>
                    </div>
                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                      <span className="detail-label">Shipping Address</span>
                      <span className="detail-val">
                        {userStreet !== 'Not provided' ? (
                          <>
                            {userStreet}
                            {userArea && `, ${userArea}`}
                            {userPincode && <><br/>Jaipur, Rajasthan - {userPincode}</>}
                          </>
                        ) : 'Not provided'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Account Status</span>
                      <span className="status-pill-verified">
                        <i className="fa-solid fa-circle-check"></i> Verified Member
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button className="btn-logout-full" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>SECURE LOGOUT</span>
            </button>
          </div>

          {/* Card 2: Order History */}
          <div className="account-card feature-card">
            <div>
              <div className="card-header">
                <div className="card-icon-circle gold">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <div>
                  <h3 className="card-title">Order History</h3>
                  <p className="card-subtitle">Track purchases &amp; download tax invoices</p>
                </div>
              </div>

              <div className="card-body-text">
                <p>Review past purchases, current delivery status, and generate GST compliant invoice PDFs anytime.</p>
              </div>
            </div>

            <button className="btn-card-action" onClick={handleViewOrders}>
              <i className="fa-solid fa-receipt"></i>
              <span>{viewingOrders ? "Viewing Order History Below" : "View Order History"}</span>
            </button>
          </div>

          {/* Card 3: Wishlist */}
          <div className="account-card feature-card">
            <div>
              <div className="card-header">
                <div className="card-icon-circle crimson">
                  <i className="fa-solid fa-heart"></i>
                </div>
                <div>
                  <h3 className="card-title">Curated Wishlist</h3>
                  <p className="card-subtitle">Saved tableware &amp; hospitality sets</p>
                </div>
              </div>

              <div className="card-body-text">
                <p>Quickly access tableware items you saved for your upcoming events, home dining, or hospitality venues.</p>
              </div>
            </div>

            <Link href="/catalog?wishlist=true" className="btn-card-action outline">
              <i className="fa-solid fa-arrow-right"></i>
              <span>Explore Wishlist ({wishlist ? wishlist.length : 0})</span>
            </Link>
          </div>

        </div>

        {/* Orders List Section */}
        {viewingOrders && orders && orders.length > 0 && (
          <div id="order-history-section" className="orders-section-wrapper">
            <div className="orders-section-header">
              <h2>Your Order History</h2>
              <span className="orders-count-badge">{orders.length} Orders</span>
            </div>
            
            <div className="orders-list">
              {orders.map((order, i) => (
                <div key={order.id || i} className="order-item-card">
                  <div className="order-item-top">
                    <div>
                      <span className="order-id-tag">Order #{order.id}</span>
                      <p className="order-date-text">
                        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="order-status-box">
                      <span className="status-badge-pill">{order.status || 'Pending'}</span>
                      {order.status === 'Shipped' && order.delivery_otp && (
                        <div className="otp-box">
                          <span className="otp-label">Delivery OTP</span>
                          <strong className="otp-code">{order.delivery_otp}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-item-middle">
                    <div className="order-items-preview">
                      <span className="items-heading">Purchased Items ({order.items?.length || 0}):</span>
                      <div className="items-tags-scroll">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="item-chip">
                            <span className="qty">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-price-action">
                      <div className="price-display">
                        <span className="price-label">Total Amount</span>
                        <span className="price-val">₹{Number(order.total).toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => generateInvoicePDF(order)}
                        className="btn-invoice-pdf"
                      >
                        <i className="fa-solid fa-file-pdf"></i> Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showToast && (
        <div className="account-toast">
          <i className="fa-solid fa-circle-info"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
