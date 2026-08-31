'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

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
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters for security.');
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
      setError(err.message || 'Failed to update password. Please try again or request a new link.');
    }
    setLoading(false);
  };

  return (
    <main style={{ 
      minHeight: "100vh", 
      width: "100vw",
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", 
      padding: "20px",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 99999
    }}>
      {/* Background Decorative Elements */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #d4af37, #fde047, #d4af37)" }}></div>
      <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(212,175,55,0.05) 0%, rgba(0,0,0,0) 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }}></div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "460px", zIndex: 1 }}>
        
        {/* Main Card */}
        <div style={{ 
          width: "100%", 
          background: "rgba(20, 20, 20, 0.95)", 
          padding: "45px 40px", 
          borderRadius: "16px", 
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.15)", 
          backdropFilter: "blur(10px)",
          position: "relative",
          marginBottom: "20px"
        }}>
          
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
              <div style={{ width: "70px", height: "70px", background: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #d4af37", overflow: "hidden", padding: "10px" }}>
                <Image src="/images/logo.jpg" alt="Orient Crockeries" width={50} height={50} style={{ objectFit: 'contain' }} />
              </div>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: "700", letterSpacing: "4px", color: "#d4af37", marginBottom: "1rem", textTransform: "uppercase", fontFamily: "var(--font-serif)" }}>
              Orient Crockeries
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "#ffffff", fontSize: "1.8rem", margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
              Set New Password
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginTop: "0", lineHeight: "1.5" }}>
              Create a new secure password for your account.
            </p>
          </div>

          {error && (
            <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '25px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)', display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginTop: "3px" }}></i>
              <div>{error}</div>
            </div>
          )}
          
          {success && (
            <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '8px', marginBottom: '25px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.3)', display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-circle-check"></i>
              <div>{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", letterSpacing: "0.5px", marginBottom: "8px", color: "#d1d5db" }}>NEW PASSWORD</label>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-key" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}></i>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  style={{ 
                    width: "100%", 
                    padding: "14px 14px 14px 45px", 
                    borderRadius: "8px", 
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)", 
                    fontSize: "1rem", 
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.border = "1px solid #d4af37"}
                  onBlur={(e) => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", letterSpacing: "0.5px", marginBottom: "8px", color: "#d1d5db" }}>CONFIRM PASSWORD</label>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-check-double" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}></i>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  style={{ 
                    width: "100%", 
                    padding: "14px 14px 14px 45px", 
                    borderRadius: "8px", 
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)", 
                    fontSize: "1rem", 
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.border = "1px solid #d4af37"}
                  onBlur={(e) => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                background: "linear-gradient(135deg, #d4af37 0%, #b89125 100%)", 
                color: "#000000", 
                padding: "16px", 
                borderRadius: "8px", 
                border: "none", 
                cursor: loading ? "not-allowed" : "pointer", 
                fontWeight: "700", 
                fontSize: "1.05rem",
                letterSpacing: "1px",
                marginTop: "15px",
                boxShadow: "0 8px 20px rgba(212,175,55,0.25)",
                opacity: loading ? 0.7 : 1,
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px"
              }}
              onMouseOver={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                <>
                  UPDATE PASSWORD <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d4af37", fontSize: "0.8rem", fontWeight: "600", letterSpacing: "1px" }}>
            <i className="fa-solid fa-shield-halved"></i>
            <span>SECURE CONNECTION</span>
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <span>Designed & Managed by</span>
            <span style={{ color: "#9ca3af", fontWeight: "600" }}>Digify Soft Solutions</span>
          </div>
        </div>

      </div>
    </main>
  );
}
