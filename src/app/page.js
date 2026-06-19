"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "./context/AppContext";

export default function Home() {
  const { products, addToCart, wishlist, toggleWishlist, isInWishlist } = useApp();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Filter 4 featured products to display on home page
  const featuredProducts = products
    .filter(p => [1, 7, 11, 13, 107].includes(p.id) || p.rating >= 4.8)
    .slice(0, 4);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    triggerToast(`Added ${product.name} to Cart`);
  };

  const handleToggleWishlist = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    const inWish = wishlist.some(item => item.id === product.id);
    triggerToast(inWish ? `Removed ${product.name} from Wishlist` : `Saved ${product.name} to Wishlist`);
  };

  return (
    <main style={{ marginTop: "60px" }}>
      {/* Hero Banner Section (Luxury Split Layout) */}
      <section className="hero-split">
        <div className="hero-split-text">
          <p className="hero-subtitle">ORIENT CROCKERIES</p>
          <h1 className="hero-title">Dining Elevated</h1>
          <p className="hero-desc">
            Est. 1994. Curating and crafting the world's finest dinnerware, professional cookware, and organic acacia woodcraft. For five-star hospitality and exquisite homes.
          </p>
          <div className="cta-group">
            <Link href="/catalog" className="btn btn-primary">
              Explore Collections
            </Link>
            <a href="#collections" className="btn btn-outline">
              Shop by Category
            </a>
          </div>
        </div>
        <div 
          className="hero-split-image" 
          style={{ backgroundImage: `url('/images/crockery_dinner_set.png')` }}
        ></div>
      </section>

      {/* Trust Anchors */}
      <section className="section" style={{ padding: "3rem 6%", borderBottom: "1px solid var(--border)" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          textAlign: "center"
        }}>
          <div>
            <i className="fa-solid fa-hands-holding" style={{ fontSize: "1.8rem", color: "var(--primary)", marginBottom: "1rem" }}></i>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Artisanal Craft</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Handmade details by local craftsmen</p>
          </div>
          <div>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: "1.8rem", color: "var(--primary)", marginBottom: "1rem" }}></i>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Food Safe &amp; Lead-Free</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Premium clay &amp; organic finishes</p>
          </div>
          <div>
            <i className="fa-solid fa-check-double" style={{ fontSize: "1.8rem", color: "var(--primary)", marginBottom: "1rem" }}></i>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Hospitality Grade</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Durable, microwave &amp; dishwasher safe</p>
          </div>
          <div>
            <i className="fa-solid fa-truck-fast" style={{ fontSize: "1.8rem", color: "var(--primary)", marginBottom: "1rem" }}></i>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Secure Delivery</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>BlueDart courier with fragile insurance</p>
          </div>
        </div>
      </section>

      {/* Categories Showcase (Shop by Collection) */}
      <section className="section" id="collections">
        <div className="section-header">
          <p className="section-subtitle">Curated Offerings</p>
          <h2 className="section-title">Shop by Collection</h2>
        </div>
        <div className="category-grid">
          {/* Dining */}
          <Link href="/catalog?department=Crockery+%26+Dining" className="category-card">
            <img src="/images/crockery_dinner_set.png" alt="Fine Dining" className="category-img" />
            <div className="category-overlay">
              <h3 className="category-name">Fine Dining</h3>
              <span className="category-link">Discover Dinnerware &rarr;</span>
            </div>
          </Link>

          {/* Cookware */}
          <Link href="/catalog?department=Cookware" className="category-card">
            <img src="/images/stahl_hybrid_kadai.png" alt="Cookware" className="category-img" />
            <div className="category-overlay">
              <h3 className="category-name">Cookware</h3>
              <span className="category-link">Discover Culinary &rarr;</span>
            </div>
          </Link>

          {/* Woodcraft */}
          <Link href="/catalog?department=Woodcraft" className="category-card">
            <img src="/images/acacia_wood_casserole.png" alt="Woodcraft" className="category-img" />
            <div className="category-overlay">
              <h3 className="category-name">Acacia Woodcraft</h3>
              <span className="category-link">Discover Organics &rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Brand Heritage / Story */}
      <section className="section section-alt brand-heritage-layout">
        <div>
          <img 
            src="/images/customized.png" 
            alt="Craftsmanship" 
            className="heritage-img-element"
          />
        </div>
        <div style={{ paddingRight: "2rem" }}>
          <p className="section-subtitle" style={{ textAlign: "left" }}>SINCE 1994</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.8rem", color: "var(--dark)", marginBottom: "1.5rem" }}>
            The Art of Tablescaping
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.8" }}>
            At Orient Crockeries, we believe every meal is a celebration. Over the last three decades, we have partnered with India's leading five-star hotels and fine dining establishments, providing plates, cups, and bowls that blend performance with high design.
          </p>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: "1.8" }}>
            Our select woodcraft collection is sourced from organic, sustainably harvested Acacia trees. Each board, mug, and casserole features natural grains and elegant finishes, bringing rustic luxury to your hospitality spreads.
          </p>
          <div className="heritage-stats-row">
            <div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary)", fontWeight: "bold" }}>30+</span>
              <p style={{ fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Years Heritage</p>
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary)", fontWeight: "bold" }}>1000+</span>
              <p style={{ fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Establishments Supplied</p>
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary)", fontWeight: "bold" }}>100%</span>
              <p style={{ fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Food Safe Cert</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="section">
        <div className="section-header">
          <p className="section-subtitle">Exquisite Highlights</p>
          <h2 className="section-title">Featured Pieces</h2>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => {
            const inWish = isInWishlist(product.id);
            return (
              <div 
                key={product.id} 
                className="product-card" 
                onClick={() => setSelectedProduct(product)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-img-wrapper">
                  {product.stock <= 0 && <span className="product-badge out-stock">Out of Stock</span>}
                  {product.rating >= 4.9 && product.stock > 0 && <span className="product-badge">Best Seller</span>}
                  <img src={product.image} alt={product.name} className="product-image" />
                  <button 
                    className={`wishlist-btn ${inWish ? "active" : ""}`}
                    onClick={(e) => handleToggleWishlist(product, e)}
                    aria-label="Toggle Wishlist"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={inWish ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-title">{product.name}</h3>
                  <div className="product-price-row">
                    <span className="product-price">₹{product.price.toFixed(2)}</span>
                    <button 
                      className="product-action-btn"
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? "Unavailable" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
          <Link href="/catalog" className="btn btn-outline" style={{ padding: "0.8rem 3rem" }}>
            View Full Catalog
          </Link>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="section section-alt" style={{ textAlign: "center" }}>
        <div className="section-header">
          <p className="section-subtitle">Patron Stories</p>
          <h2 className="section-title">The Choice of Connoisseurs</h2>
        </div>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontStyle: "italic", color: "var(--dark)", marginBottom: "2rem" }}>
            "We have partnered with Orient Crockeries for the dining service at our premium resort. Their bespoke bone china plates and organic wood platters have completely elevated our presentation. Exceptionally durable and beautifully crafted."
          </p>
          <span style={{ fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--primary)" }}>
            &mdash; Executive Chef Rohit Sen, The Leela Regency
          </span>
        </div>
      </section>

      {/* Specifications Modal */}
      {selectedProduct && (
        <div className="modal-overlay active" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-img-side">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
            </div>
            <div className="modal-content-side">
              <div className="modal-header">
                <span className="modal-meta-label">{selectedProduct.department}</span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <p className="modal-desc">{selectedProduct.description}</p>
              </div>

              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Barcode</span>
                  <span className="spec-value">{selectedProduct.barcode}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">HSN Code</span>
                  <span className="spec-value">{selectedProduct.hsn}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">GST Rate</span>
                  <span className="spec-value">{selectedProduct.gst}%</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fragile status</span>
                  <span className="spec-value">{selectedProduct.fragile ? "Fragile Item" : "Standard"}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Microwave safe</span>
                  <span className="spec-value">{selectedProduct.microwave ? "Safe" : "Not Recommended"}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Availability</span>
                  <span className="spec-value" style={{ color: selectedProduct.stock > 0 ? "var(--success)" : "var(--error)" }}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} In Stock` : "Sold Out"}
                  </span>
                </div>
              </div>

              <div className="modal-cart-actions">
                <button 
                  className="btn btn-primary btn-full"
                  onClick={(e) => {
                    handleAddToCart(selectedProduct, e);
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stock <= 0}
                >
                  {selectedProduct.stock <= 0 ? "Temporarily Unavailable" : "Add to Shopping Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <div className={`toast toast-success ${showToast ? "show" : ""}`}>
        <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "1.1rem" }}></i>
        <span>{toastMessage}</span>
      </div>
    </main>
  );
}
