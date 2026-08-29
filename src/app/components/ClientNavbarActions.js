"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function ClientNavbarActions() {
  const { cart, wishlist } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartItems = mounted ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const totalWishlistItems = mounted ? wishlist.length : 0;

  return (
    <div className="nav-actions">
      <button className="nav-action-btn" aria-label="Search Catalog">
        <i className="fa-solid fa-magnifying-glass"></i>
      </button>
      <button className="nav-action-btn" aria-label="Wishlist">
        <i className="fa-solid fa-heart"></i>
        {totalWishlistItems > 0 && <span className="nav-badge">{totalWishlistItems}</span>}
      </button>
      <button className="nav-action-btn" aria-label="Shopping Cart">
        <i className="fa-solid fa-bag-shopping"></i>
        {totalCartItems > 0 && <span className="nav-badge">{totalCartItems}</span>}
      </button>
    </div>
  );
}
