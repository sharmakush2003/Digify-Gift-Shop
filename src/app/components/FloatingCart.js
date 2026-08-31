'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function FloatingCart() {
  const { cartItemCount } = useApp();
  const pathname = usePathname();

  // Hide on admin, delivery, and cart pages themselves
  if (
    pathname && 
    (pathname.startsWith('/admin') || 
     pathname.startsWith('/delivery') || 
     pathname === '/cart' || 
     pathname === '/checkout')
  ) {
    return null;
  }

  if (cartItemCount === 0) {
    return null;
  }

  return (
    <Link href="/cart" className="floating-cart-btn" aria-label="View Cart">
      <div className="floating-cart-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span className="floating-cart-badge">{cartItemCount}</span>
      </div>
    </Link>
  );
}
