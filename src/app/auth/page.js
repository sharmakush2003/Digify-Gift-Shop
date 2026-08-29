'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import './auth.css';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, signup, sendOtp, verifyOtp, resetPassword, updatePassword } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // URL params for password reset mode
  const isResetMode = searchParams.get('reset') === 'true';
  const [resetSent, setResetSent] = useState(false);
  
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if logged in and not in reset mode
  useEffect(() => {
    if (user && !isResetMode) {
      router.push('/');
    }
  }, [user, router, isResetMode]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await sendOtp(phone);
      setOtpSent(true);
      setCountdown(60);
      setSuccess(`OTP sent to +91 ${cleanPhone.slice(-10)}! (Use demo code 123456 or SMS OTP)`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtp(phone, otpCode, name);
      setSuccess('Verified successfully! Logging in...');
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    }
    setLoading(false);
  };

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
          if (authMethod === 'otp') {
            await handleVerifyOtp(e);
            return;
          }
          await login(email, password);
        } else {
          if (!name.trim()) {
            setError('Please enter your full name.');
            setLoading(false);
            return;
          }
          const cleanPhone = phone.replace(/\D/g, '');
          if (phone && cleanPhone.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            setLoading(false);
            return;
          }
          await signup(email, password, name, phone);
        }
      }
    } catch (err) {
      let errorMessage = 'Action failed. Please try again.';
      if (err.message) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again or create an account.';
        } else if (err.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    }

    setLoading(false);
  };

  if (user && !isResetMode) return null;

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

          {/* Top Auth Mode Tabs (Sign In vs Create Account) */}
          {!isForgotPassword && !isResetMode && (
            <div className="auth-tabs">
              <button 
                type="button"
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Sub-toggle for Sign In: Password vs Mobile OTP */}
          {isLogin && !isForgotPassword && !isResetMode && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: 'var(--bg-alt)', padding: '4px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => { setAuthMethod('password'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: authMethod === 'password' ? 'var(--dark)' : 'transparent',
                  color: authMethod === 'password' ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i> Email &amp; Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('otp'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: authMethod === 'otp' ? 'var(--dark)' : 'transparent',
                  color: authMethod === 'otp' ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-mobile-screen" style={{ marginRight: '6px' }}></i> Mobile OTP
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
                {/* 1. Full name (Sign Up mode only) */}
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

                {/* 2. Email Address (Sign Up or Email Password Sign In) */}
                {!isResetMode && (!isLogin || authMethod === 'password') && (
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

                {/* 3. Mobile Number Field (Sign Up OR Mobile OTP Sign In) */}
                {!isForgotPassword && !isResetMode && (!isLogin || authMethod === 'otp') && (
                  <div className="auth-form-group">
                    <label>Mobile Number {!isLogin && <span style={{ textTransform: 'none', color: 'var(--primary)' }}>(+91 India)</span>}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '0.8rem 0.9rem', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--dark)' }}>
                        +91
                      </span>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        required={isLogin && authMethod === 'otp'}
                        maxLength={14}
                        placeholder="98765 43210"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Password Input (Password Login or Sign Up) */}
                {!isForgotPassword && (!isLogin || authMethod === 'password') && (
                  <div className="auth-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>{isResetMode ? 'New Password' : 'Password'}</label>
                      {isLogin && !isResetMode && authMethod === 'password' && (
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
                      required={!isLogin || authMethod === 'password'} 
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* 5. OTP Code Input & Resend (Mobile OTP Login Mode) */}
                {isLogin && authMethod === 'otp' && (
                  <>
                    {!otpSent ? (
                      <button 
                        type="button" 
                        onClick={handleSendOtp}
                        disabled={loading || !phone}
                        className="btn btn-accent"
                        style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
                      >
                        {loading ? 'Sending OTP...' : 'SEND OTP VIA SMS'}
                      </button>
                    ) : (
                      <div className="auth-form-group" style={{ marginTop: '0.5rem' }}>
                        <label>Enter 6-Digit OTP Code</label>
                        <input 
                          type="text" 
                          value={otpCode} 
                          onChange={(e) => setOtpCode(e.target.value)} 
                          maxLength={6}
                          required 
                          placeholder="Enter 6-digit code (e.g. 123456)"
                          style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Didn\'t receive code?'}
                          </span>
                          <button
                            type="button"
                            disabled={countdown > 0}
                            onClick={handleSendOtp}
                            style={{ background: 'none', border: 'none', color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: '600', cursor: countdown > 0 ? 'default' : 'pointer' }}
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 6. Confirm Password Input (Reset Mode only) */}
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

                {/* Main Submit Button (Except when waiting to send OTP) */}
                {(!isLogin || authMethod === 'password' || otpSent) && (
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Processing...' : isResetMode ? 'UPDATE PASSWORD' : isForgotPassword ? 'SEND RESET LINK' : isLogin ? (authMethod === 'otp' ? 'VERIFY & SIGN IN' : 'SIGN IN') : 'CREATE ACCOUNT'}
                  </button>
                )}

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
