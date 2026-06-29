'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import '../auth/auth.css';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const { orders } = useApp();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleViewOrders = () => {
    if (!orders || orders.length === 0) {
      triggerToast("There is no order by your account, please order something to view the history.");
    } else {
      // In the future, this can open a modal or route to an orders page
      triggerToast("Loading your order history...");
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="account-page-wrapper" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg-main)', paddingTop: '60px' }}>
      {/* Luxury Hero Banner */}
      <div style={{ background: 'var(--bg-alt)', padding: '4rem 2rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: 'var(--dark)', marginBottom: '1rem', letterSpacing: '2px', lineHeight: '1.2' }}>
          Welcome, {user?.displayName ? user.displayName.split(' ')[0] : 'Guest'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Orient Member Portal
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Profile Card */}
        <div style={{ background: 'white', padding: '2rem 1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
            <div style={{ width: '70px', height: '70px', minWidth: '70px', flexShrink: 0, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>
              {user?.displayName ? String(user.displayName).charAt(0).toUpperCase() : (user?.email ? String(user.email).charAt(0).toUpperCase() : 'U')}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--dark)', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Orient Member'}</h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Member Since</div>
              <div style={{ color: 'var(--dark)', fontSize: '1.1rem' }}>{user?.metadata?.creationTime ? String(user.metadata.creationTime).substring(0, 16) : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>Last Access</div>
              <div style={{ color: 'var(--dark)', fontSize: '1.1rem' }}>{user?.metadata?.lastSignInTime ? String(user.metadata.lastSignInTime).substring(0, 16) : 'N/A'}</div>
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '2.5rem', padding: '15px', fontSize: '1rem', letterSpacing: '2px' }} onClick={handleLogout}>
            SECURE LOGOUT
          </button>
        </div>

        {/* Placeholder Cards for Luxury Feel */}
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: '0.8' }}></i>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--dark)', marginBottom: '10px' }}>Order History</h3>
          <p style={{ color: 'var(--text-muted)' }}>View your past purchases and track current bespoke orders.</p>
          <button onClick={handleViewOrders} style={{ marginTop: 'auto', background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s' }}>View Orders</button>
        </div>

        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <i className="fa-regular fa-heart" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: '0.8' }}></i>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--dark)', marginBottom: '10px' }}>Curated Wishlist</h3>
          <p style={{ color: 'var(--text-muted)' }}>Access the exclusive collections you've saved for later.</p>
          <Link href="/catalog?wishlist=true" style={{ marginTop: 'auto', display: 'inline-block', background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.3s' }}>View Wishlist</Link>
        </div>

      </div>

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--primary)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
