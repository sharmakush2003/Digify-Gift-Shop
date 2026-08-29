"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import Link from "next/link";
import Image from "next/image";

function CatalogContent() {
  const { products, addToCart, wishlist, toggleWishlist, isInWishlist } = useApp();
  const searchParams = useSearchParams();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedFragile, setSelectedFragile] = useState("all");
  const [selectedMicrowave, setSelectedMicrowave] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [selectedProduct]);

  // Read URL parameters
  const deptParam = searchParams.get("department");
  const wishlistOnly = searchParams.get("wishlist") === "true";

  useEffect(() => {
    if (deptParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDepts([deptParam]);
    } else {
      setSelectedDepts([]);
    }
  }, [deptParam]);

  // Extract unique departments & categories from products
  const departments = Array.from(new Set(products.map(p => p.department))).filter(Boolean);

  const handleDeptToggle = (dept) => {
    setSelectedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCart(product, 1)) {
      triggerToast(`Added ${product.name} to Cart`);
    }
  };

  const handleToggleWishlist = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist(product)) {
      const inWish = wishlist.some(item => item.id === product.id);
      triggerToast(inWish ? `Removed ${product.name} from Wishlist` : `Saved ${product.name} to Wishlist`);
    }
  };

  // Filtering Logic
  let filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    
    // Wishlist-only filter
    const matchesWishlist = !wishlistOnly || wishlist.some(item => item.id === product.id);

    // Department filter
    const matchesDept = selectedDepts.length === 0 || selectedDepts.includes(product.department);

    // Fragile filter
    const matchesFragile = selectedFragile === "all" || 
      (selectedFragile === "fragile" && product.fragile) || 
      (selectedFragile === "standard" && !product.fragile);

    // Microwave filter
    const matchesMicrowave = selectedMicrowave === "all" || 
      (selectedMicrowave === "safe" && product.microwave) || 
      (selectedMicrowave === "not-safe" && !product.microwave);

    return matchesSearch && matchesWishlist && matchesDept && matchesFragile && matchesMicrowave;
  });

  // Sorting Logic
  if (sortOption === "price-low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === "rating") {
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortOption === "popularity") {
    filteredProducts.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  }

  return (
    <div className="container" style={{ marginTop: "30px" }}>
      <h1 className="page-title">
        {wishlistOnly ? "My Wishlist" : deptParam ? `${deptParam} Collection` : "The Dining Catalog"}
      </h1>

      <div className="catalog-layout">
        {/* Filter Sidebar */}
        <aside className="filter-sidebar">
          {wishlistOnly && (
            <div style={{ marginBottom: "1.5rem" }}>
              <Link href="/catalog" style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase" }}>
                &larr; Back to Full Catalog
              </Link>
            </div>
          )}

          {/* Department Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Departments</h4>
            <div className="filter-options">
              {departments.map(dept => (
                <label key={dept} className="filter-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedDepts.includes(dept)}
                    onChange={() => handleDeptToggle(dept)}
                  />
                  <span>{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fragility Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Material Handling</h4>
            <div className="filter-options">
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="fragile" 
                  checked={selectedFragile === "all"}
                  onChange={() => setSelectedFragile("all")}
                />
                <span>All Materials</span>
              </label>
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="fragile" 
                  checked={selectedFragile === "fragile"}
                  onChange={() => setSelectedFragile("fragile")}
                />
                <span>Fragile Only</span>
              </label>
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="fragile" 
                  checked={selectedFragile === "standard"}
                  onChange={() => setSelectedFragile("standard")}
                />
                <span>Standard Handling</span>
              </label>
            </div>
          </div>

          {/* Microwave Safety */}
          <div className="filter-group">
            <h4 className="filter-group-title">Microwave Safety</h4>
            <div className="filter-options">
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="microwave" 
                  checked={selectedMicrowave === "all"}
                  onChange={() => setSelectedMicrowave("all")}
                />
                <span>All Items</span>
              </label>
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="microwave" 
                  checked={selectedMicrowave === "safe"}
                  onChange={() => setSelectedMicrowave("safe")}
                />
                <span>Microwave Safe</span>
              </label>
              <label className="filter-checkbox-label">
                <input 
                  type="radio" 
                  name="microwave" 
                  checked={selectedMicrowave === "not-safe"}
                  onChange={() => setSelectedMicrowave("not-safe")}
                />
                <span>Not Recommended</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Catalog Main Panel */}
        <main>
          {/* Search Box */}
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon-inside"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by product name, category, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Actions Bar */}
          <div className="catalog-actions-bar">
            <span className="results-count">
              Showing {filteredProducts.length} premium creations
            </span>
            <div>
              <select 
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popularity">Bestselling</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-title">No Creations Found</h3>
              <p className="empty-desc">Adjust your filters or query search to discover other pieces.</p>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepts([]);
                  setSelectedFragile("all");
                  setSelectedMicrowave("all");
                  setSortOption("default");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => {
                const inWish = isInWishlist(product.id);
                return (
                  <div 
                    key={product.id} 
                    className="product-card" 
                    onClick={() => { setSelectedProduct(product); setActiveImage(null); }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="product-img-wrapper">
                      {(product.stock <= 0 || product.stockStatus === 'Out of Stock') && <span className="product-badge out-stock">Out of Stock</span>}
                      {product.rating >= 4.9 && product.stock > 30 && product.stockStatus !== 'Out of Stock' && <span className="product-badge">Premium Selection</span>}
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="product-image" 
                        style={{ objectFit: 'cover' }}
                      />
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
                      {product.stockStatus !== 'Out of Stock' && product.stock > 0 && product.stock <= 30 && (
                        <div style={{ color: '#d32f2f', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>
                          🔥 Only {product.stock} left
                        </div>
                      )}
                      <div className="product-price-row">
                        <span className="product-price">₹{product.price.toFixed(2)}</span>
                        <button 
                          className="product-action-btn"
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={product.stock <= 0 || product.stockStatus === 'Out of Stock'}
                        >
                          {(product.stock <= 0 || product.stockStatus === 'Out of Stock') ? "Unavailable" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Specifications Modal Overlay */}
      {selectedProduct && (
        <div className="modal-overlay active" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-img-side">
              <div style={{ position: 'relative', width: '100%', height: '350px', flex: 1, minHeight: '300px' }}>
                <Image 
                  src={activeImage || selectedProduct.image} 
                  alt={selectedProduct.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'contain', padding: '1rem', backgroundColor: 'var(--bg-alt)' }}
                  priority
                />
              </div>
              {selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                <div className="thumbnail-gallery" style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto', width: '100%', justifyContent: 'center' }}>
                  {selectedProduct.images.map((img, idx) => (
                    <Image 
                      key={idx} 
                      src={img} 
                      alt={`${selectedProduct.name} - view ${idx + 1}`} 
                      width={55}
                      height={55}
                      className={`thumbnail ${(activeImage === img || (!activeImage && selectedProduct.image === img)) ? 'active' : ''}`}
                      onClick={() => setActiveImage(img)}
                      style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '6px' }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="modal-content-side">
              <div className="modal-header" style={{ marginBottom: "1rem", borderBottom: "none", paddingBottom: 0 }}>
                <span className="modal-meta-label">
                  <i className="fa-solid fa-gem" style={{ fontSize: "0.75rem" }}></i>
                  {selectedProduct.department}
                </span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <p className="modal-desc">{selectedProduct.description || "Indulging design and elite utility from Orient Crockeries, crafted to perfection."}</p>
                
                {/* Repositioned & Attractive Add To Shopping Cart Action */}
                <div className="modal-cart-actions" style={{ marginTop: "1.2rem", marginBottom: "1rem" }}>
                  <button 
                    className="btn-add-to-cart-attractive"
                    onClick={(e) => {
                      handleAddToCart(selectedProduct, e);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock <= 0 || selectedProduct.stockStatus === 'Out of Stock'}
                  >
                    <i className="fa-solid fa-cart-shopping" style={{ fontSize: "1.1rem" }}></i>
                    <span>{(selectedProduct.stock <= 0 || selectedProduct.stockStatus === 'Out of Stock') ? "Temporarily Unavailable" : "Add to Shopping Cart"}</span>
                  </button>
                </div>
              </div>

              {/* Premium Feature Spec Badges */}
              <div className="product-highlights-badges">
                <div className="highlight-badge-card">
                  <div className="badge-icon-box gst">
                    <i className="fa-solid fa-percent"></i>
                  </div>
                  <div className="badge-text-box">
                    <span className="badge-title">GST RATE</span>
                    <span className="badge-val">{selectedProduct.gst || 18}% Incl.</span>
                  </div>
                </div>

                <div className="highlight-badge-card">
                  <div className={`badge-icon-box ${selectedProduct.fragile ? 'fragile' : 'standard'}`}>
                    <i className={`fa-solid ${selectedProduct.fragile ? 'fa-shield-halved' : 'fa-box-archive'}`}></i>
                  </div>
                  <div className="badge-text-box">
                    <span className="badge-title">HANDLING</span>
                    <span className="badge-val">{selectedProduct.fragile ? "Fragile Item" : "Standard"}</span>
                  </div>
                </div>

                <div className="highlight-badge-card">
                  <div className={`badge-icon-box ${selectedProduct.microwave ? 'microwave-safe' : 'microwave-warn'}`}>
                    <i className={`fa-solid ${selectedProduct.microwave ? 'fa-fire-burner' : 'fa-triangle-exclamation'}`}></i>
                  </div>
                  <div className="badge-text-box">
                    <span className="badge-title">MICROWAVE</span>
                    <span className="badge-val">{selectedProduct.microwave ? "Safe" : "Not Safe"}</span>
                  </div>
                </div>
              </div>

              {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>Customer Reviews</h3>
                    <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
                      {selectedProduct.reviews.length} {selectedProduct.reviews.length === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
                    {selectedProduct.reviews.map((review, idx) => {
                      const initial = review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : "U";
                      const dateObj = review.timestamp ? new Date(review.timestamp) : new Date();
                      const dateStr = dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
                      return (
                        <div key={idx} style={{ paddingBottom: "12px", borderBottom: idx !== selectedProduct.reviews.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 }}>
                              {initial}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", fontSize: "0.88rem", color: "#334155" }}>{review.reviewerName}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                                <div style={{ fontSize: "0.8rem", display: "flex", letterSpacing: "1px" }}>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} style={{ color: i < review.rating ? "#f59e0b" : "#e2e8f0" }}>★</span>
                                  ))}
                                </div>
                                <span style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: "500" }}>{dateStr}</span>
                              </div>
                            </div>
                            <div style={{ color: "#10b981", fontSize: "0.7rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#ecfdf5", padding: "3px 6px", borderRadius: "4px" }}>
                              <i className="fa-solid fa-circle-check"></i> Verified
                            </div>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "#475569", margin: "4px 0 0 0", lineHeight: "1.4", paddingLeft: "44px" }}>
                            {review.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification wrapper */}
      <div className={`toast toast-success ${showToast ? "show" : ""}`}>
        <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "1.1rem" }}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "10rem 2rem" }}><h2>Loading Curated Catalog...</h2></div>}>
      <CatalogContent />
    </Suspense>
  );
}
