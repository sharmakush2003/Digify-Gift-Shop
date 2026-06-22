'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import './auth.css';

export default function AuthPage() {
  const router = useRouter();
  const { user, login, signup, checkEmailExists } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      }
    } catch (err) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      // Map Firebase error codes to user-friendly messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again or create an account.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else {
        // Only log unexpected errors
        console.error("Auth error:", err);
      }
      
      setError(errorMessage);
    }

    setLoading(false);
  };

  if (user) return null; // Redirecting

  return (
    <main className="auth-page-container">
      <div className="auth-image-side">
        <div className="auth-image-overlay"></div>
        <div className="auth-image-content">
          <h1>Dining Elevated.</h1>
          <p>Join Orient Crockeries to access exclusive collections, bespoke gifting, and premium hospitality supplies.</p>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <span>ORIENT</span>
            <div>Crockeries</div>
          </div>

          <div className="auth-tabs">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="auth-form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="auth-form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Processing...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {isLogin && (
            <div className="auth-forgot" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <Link href="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', borderBottom: '1px dashed var(--text-muted)' }}>Login as Admin</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
