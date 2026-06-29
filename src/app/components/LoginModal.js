'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login, signup, user, logout, showAlert, setShowAlert, alertMessage } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (showAlert) {
    return (
      <div className="alert-overlay">
        <div className="alert-box">
          <div className="alert-header">
            <h3>Orient Crockeries</h3>
          </div>
          <div className="alert-body">
            <p>{alertMessage}</p>
          </div>
          <div className="alert-footer">
            <button className="alert-btn" onClick={() => { setShowAlert(false); setShowLoginModal(true); }}>
              OK
            </button>
          </div>
        </div>
        <style jsx>{`
          .alert-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            backdrop-filter: blur(4px);
            padding: 20px;
          }
          .alert-box {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.08);
          }
          .alert-header {
            padding: 18px 24px 12px 24px;
            border-bottom: 1px solid #f1f1f1;
          }
          .alert-header h3 {
            margin: 0;
            font-family: var(--font-serif, 'Cormorant Garamond', serif);
            font-size: 1.4rem;
            color: #111;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .alert-body {
            padding: 24px;
          }
          .alert-body p {
            margin: 0;
            font-family: var(--font-sans, 'Montserrat', sans-serif);
            font-size: 0.95rem;
            line-height: 1.5;
            color: #444;
          }
          .alert-footer {
            padding: 12px 24px 18px 24px;
            display: flex;
            justify-content: flex-end;
          }
          .alert-btn {
            padding: 10px 28px;
            background: #222;
            color: white;
            border: none;
            border-radius: 6px;
            font-family: var(--font-sans, 'Montserrat', sans-serif);
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 1px;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
          }
          .alert-btn:hover {
            background: #444;
          }
          .alert-btn:active {
            transform: scale(0.97);
          }
        `}</style>
      </div>
    );
  }

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <button className="close-btn" onClick={() => setShowLoginModal(false)}>
          &times;
        </button>
        
        <h2>{user ? 'My Account' : (isLogin ? 'Welcome Back' : 'Create Account')}</h2>
        
        {user ? (
          <div className="auth-user-info" style={{ textAlign: 'left', marginTop: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--dark)' }}>Profile Details</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email: {user?.email || 'N/A'}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Account Created: {user?.metadata?.creationTime ? String(user?.metadata?.creationTime) : 'N/A'}</p>
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '4px' }} onClick={() => { logout(); setShowLoginModal(false); }}>
              Log Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                minLength="6"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .modal-content.auth-modal {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .close-btn {
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        .auth-form .form-group {
          margin-bottom: 1.5rem;
        }
        .auth-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .auth-form input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        .btn-primary {
          width: 100%;
          padding: 12px;
          background: #222;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:disabled {
          background: #666;
        }
        .auth-error {
          color: #d32f2f;
          background: #ffebee;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 0.85rem;
        }
        .auth-switch {
          margin-top: 15px;
          text-align: center;
          font-size: 0.9rem;
        }
        .auth-switch button {
          background: none;
          border: none;
          color: #0066cc;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }
        .auth-user-info {
          text-align: center;
        }
        .auth-user-info p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
