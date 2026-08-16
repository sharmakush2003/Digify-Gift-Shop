'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import './auth.css';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, signup, resetPassword, updatePassword } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Synchronously determine if we are in reset mode from the URL
  const isResetMode = searchParams.get('reset') === 'true';
  const [resetSent, setResetSent] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if logged in and not in reset mode
  useEffect(() => {
    if (user && !isResetMode) {
      router.push('/');
    }
  }, [user, router, isResetMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isResetMode) {
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
        await updatePassword(password);
        setSuccess('Password updated successfully! Redirecting to home page...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else if (isForgotPassword) {
        await resetPassword(email);
        setSuccess('A password reset link has been sent to your email. Please check your inbox.');
        setResetSent(true);
      } else {
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
      }
    } catch (err) {
      let errorMessage = 'Action failed. Please try again.';
      if (err.message) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again or create an account.';
        } else if (err.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists.';
        } else if (err.message.includes('Password should be')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    }

    setLoading(false);
  };

  if (user && !isResetMode) return null; // Redirecting

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

          {/* Render tabs only when NOT in forgot password or reset mode */}
          {!isForgotPassword && !isResetMode && (
            <div className="auth-tabs">
              <button 
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              >
                Create Account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {isForgotPassword && !resetSent && (
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Reset Password</h3>
            )}
            {isForgotPassword && !resetSent && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Enter your email address and we will send you a link to reset your password.
              </p>
            )}

            {isResetMode && (
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Set New Password</h3>
            )}
            {isResetMode && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Create a new secure password for your account.
              </p>
            )}

            {error && (
              <div className="auth-error" style={{ padding: '0.8rem 1rem', background: '#fdf3f2', color: '#b94a48', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.2rem', border: '1px solid #fbc7c6' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success" style={{ padding: '0.8rem 1rem', background: '#f4f9f4', color: '#3c763d', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.2rem', border: '1px solid #d6e9c6' }}>
                {success}
              </div>
            )}

            {/* Email Reset Sent view */}
            {isForgotPassword && resetSent ? (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setResetSent(false); setEmail(''); setError(''); setSuccess(''); }}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '1rem' }}
                >
                  BACK TO SIGN IN
                </button>
              </div>
            ) : (
              <>
                {/* 1. Full name (only in Sign Up mode) */}
                {!isLogin && !isForgotPassword && !isResetMode && (
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

                {/* 2. Email Address (except in Reset Mode) */}
                {!isResetMode && (
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
                )}

                {/* 3. Password Input */}
                {!isForgotPassword && (
                  <div className="auth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>{isResetMode ? 'New Password' : 'Password'}</label>
                      {isLogin && !isResetMode && (
                        <button 
                          type="button" 
                          onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500', padding: 0 }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* 4. Confirm Password Input (Reset Mode only) */}
                {isResetMode && (
                  <div className="auth-form-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Processing...' : isResetMode ? 'UPDATE PASSWORD' : isForgotPassword ? 'SEND RESET LINK' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>

                {isForgotPassword && (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </>
            )}
          </form>

        </div>
      </div>
    </main>
  );
}
