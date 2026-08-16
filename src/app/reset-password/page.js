'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-alt)", padding: "20px" }}>
      <div style={{ maxWidth: "450px", width: "100%", background: "#ffffff", padding: "40px", borderRadius: "12px", boxShadow: "0 15px 35px rgba(0,0,0,0.05)", border: "1px solid var(--border)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", letterSpacing: "2px", color: "var(--dark)", marginBottom: "1rem" }}>
            ORIENT
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--dark)", fontSize: "1.8rem", marginBottom: "10px" }}>
            Set New Password
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "5px" }}>
            Create a new secure password for your account.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fdf3f2', color: '#b94a48', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid #fbc7c6' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '12px', background: '#f4f9f4', color: '#3c763d', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid #d6e9c6' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text)" }}>New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e1e1e1", fontSize: "1rem", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text)" }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e1e1e1", fontSize: "1rem", outline: "none" }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              background: "var(--primary)", 
              color: "#fff", 
              padding: "14px", 
              borderRadius: "8px", 
              border: "none", 
              cursor: "pointer", 
              fontWeight: "600", 
              fontSize: "1rem",
              marginTop: "10px",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
