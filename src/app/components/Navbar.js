'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartItemCount, wishlist } = useApp();
  const { user, logout } = useAuth();
  const [mobileActive, setMobileActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu automatically whenever route changes
  useEffect(() => {
    setMobileActive(false);
  }, [pathname]);

  // Close mobile menu on window resize above 1024px or ESC key press
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileActive(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileActive(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/reset-password') || pathname.startsWith('/auth/verify'))) {
    return null;
  }

  const closeDrawer = () => {
    setMobileActive(false);
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop Dining', href: '/catalog' },
    { label: 'Track Order', href: '/tracking' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="site-header">
      {/* Top Announcement Bar */}
      <div className="top-announcement-bar">
        <span>
          <i className="fa-solid fa-crown" style={{ color: '#d4af37' }}></i>
          FINE DINING &amp; LUXURY HOSPITALITY SOLUTIONS
        </span>
      </div>

      {/* Mobile Nav Overlay Backdrop */}
      <div 
        className={`nav-backdrop ${mobileActive ? 'active' : ''}`} 
        onClick={closeDrawer}
      />

      <nav className={`${scrolled ? 'nav-scrolled' : ''}`}>
        {/* Hamburger Menu Toggle (Mobile & Tablet) */}
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
        <Link href="/" className="logo-container" onClick={closeDrawer}>
          <div className="logo-badge-wrapper">
            <Image src="/images/logo.jpg" alt="Orient Crockeries" width={40} height={40} style={{ objectFit: 'contain' }} priority />
          </div>
          <div className="logo-text-block">
            <span className="logo-title">Orient Crockeries</span>
            <span className="logo-subtitle">EST. 1994 &bull; LUXURY DINING</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <ul className={`nav-links ${mobileActive ? 'active' : ''}`} id="nav-links-menu">
          <li className="nav-mobile-only menu-header-container">
            <div className="logo-container">
              <div className="logo-badge-wrapper" style={{ width: '40px', height: '40px' }}>
                <Image src="/images/logo.jpg" alt="Orient Crockeries" width={40} height={40} style={{ objectFit: 'contain' }} />
              </div>
            </div>
            <button 
              className="menu-close-x-btn" 
              onClick={closeDrawer}
              aria-label="Close menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </li>
          
          <li>
            <Link href="/" className={`nav-item-link ${pathname === '/' ? 'active' : ''}`} onClick={closeDrawer}>Home</Link>
          </li>
          <li className="nav-dropdown-wrapper">
            <div className={`nav-item-link ${pathname?.startsWith('/catalog') ? 'active' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/catalog" onClick={closeDrawer} style={{ flex: 1 }}>Shop Dining</Link>
              <i className="fa-solid fa-chevron-down dropdown-icon"></i>
            </div>
            <ul className="nav-dropdown-menu">
              <li><Link href="/catalog?department=Crockery+%26+Dining" onClick={closeDrawer}>Fine Dining</Link></li>
              <li><Link href="/catalog?department=Cookware" onClick={closeDrawer}>Professional Cookware</Link></li>
              <li><Link href="/catalog?department=Woodcraft" onClick={closeDrawer}>Organic Woodcraft</Link></li>
              <li><Link href="/catalog?category=Gift+Sets" onClick={closeDrawer}>Bespoke Gifting</Link></li>
            </ul>
          </li>
          <li>
            <Link href="/contact" className={`nav-item-link ${pathname === '/contact' ? 'active' : ''}`} onClick={closeDrawer}>Contact</Link>
          </li>
          <li>
            <Link href="/account" className={`nav-item-link ${pathname === '/account' ? 'active' : ''}`} onClick={closeDrawer}>My Account</Link>
          </li>
        </ul>

        {/* Header Right Action Group */}
        <div className="nav-right-group">

          {/* User Account / Login Button */}
          {user ? (
            <div className="nav-user-group">
              <Link 
                href="/account"
                className={`nav-account-btn ${pathname === '/account' ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="nav-account-text">Account</span>
              </Link>
              <button 
                onClick={() => { logout(); closeDrawer(); router.push('/'); }}
                className="nav-logout-btn"
                title="Log Out"
                aria-label="Log Out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <Link 
              href="/auth" 
              className={`nav-auth-pill ${pathname === '/auth' ? 'active' : ''}`} 
              onClick={closeDrawer}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="auth-text">Sign In</span>
            </Link>
          )}

          {/* Nav Icons */}
          <div className="nav-icons">
            {/* Wishlist Link */}
            <Link href="/catalog?wishlist=true" className="nav-icon-btn" title="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {wishlist.length > 0 && (
                <span className="badge">{wishlist.length}</span>
              )}
            </Link>

            {/* Shopping Cart Link */}
            <Link href="/cart" className="nav-icon-btn" title="Shopping Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartItemCount > 0 && (
                <span className="badge cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
