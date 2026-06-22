'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartItemCount, wishlist } = useApp();
  const { user, setShowLoginModal } = useAuth();
  const [mobileActive, setMobileActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>


      <nav className={`${scrolled ? 'nav-scrolled' : ''}`}>
        {/* Hamburger Menu Toggle (Mobile) */}
        <button 
          className="menu-trigger mobile-only-btn" 
          onClick={() => setMobileActive(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Logo Branding */}
        <Link href="/" className="logo-container">
          <span className="logo">ORIENT</span>
          <span className="logo-tagline">Crockeries</span>
        </Link>

        {/* Navigation Links */}
        <ul className={`nav-links ${mobileActive ? 'active' : ''}`} id="nav-links-menu">
          <li className="nav-mobile-only menu-header-container">
            <div className="logo-container">
              <span className="logo">ORIENT</span>
              <span className="logo-tagline">Crockeries</span>
            </div>
            <button 
              className="menu-close-x-btn" 
              onClick={() => setMobileActive(false)}
              aria-label="Close menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </li>
          
          <li><Link href="/" onClick={() => setMobileActive(false)}>Home</Link></li>
          <li><Link href="/catalog" onClick={() => setMobileActive(false)}>Shop Dining</Link></li>
          <li><Link href="/about" onClick={() => setMobileActive(false)}>Our Story</Link></li>
          <li><Link href="/care" onClick={() => setMobileActive(false)}>Care Guide</Link></li>
          <li><Link href="/delivery" onClick={() => setMobileActive(false)}>Delivery & Shipping</Link></li>
          <li><Link href="/contact" onClick={() => setMobileActive(false)}>Contact</Link></li>
          <li>
            {user ? (
              <Link 
                href="/account"
                className="nav-link-btn" 
                onClick={() => setMobileActive(false)}
              >
                My Account
              </Link>
            ) : (
              <Link href="/auth" className="nav-link-btn" onClick={() => setMobileActive(false)}>
                Sign In / Sign Up
              </Link>
            )}
          </li>
        </ul>

        {/* Header Icons / Action Buttons */}
        <div className="nav-icons">

          {/* Wishlist Link */}
          <Link href="/catalog?wishlist=true" className="nav-icon-btn" title="Wishlist">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {wishlist.length > 0 && (
              <span className="badge">{wishlist.length}</span>
            )}
          </Link>

          {/* Shopping Cart Link */}
          <Link href="/cart" className="nav-icon-btn" title="Shopping Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItemCount > 0 && (
              <span className="badge cart-badge">{cartItemCount}</span>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}
