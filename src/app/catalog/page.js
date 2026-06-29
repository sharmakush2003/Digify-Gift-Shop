"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import Link from "next/link";

function CatalogContent() {
  const { products, addToCart, wishlist, toggleWishlist, isInWishlist } = useApp();
  const searchParams = useSearchParams();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedFragile, setSelectedFragile] = useState("all");
  const [selectedMicrowave, setSelectedMicrowave] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  
  // Modal & Toast States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

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
                    onClick={() => setSelectedProduct(product)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="product-img-wrapper">
                      {product.stock <= 0 && <span className="product-badge out-stock">Out of Stock</span>}
                      {product.rating >= 4.9 && product.stock > 0 && <span className="product-badge">Premium Selection</span>}
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
              <img src={selectedProduct.image} alt={selectedProduct.name} />
            </div>
            <div className="modal-content-side">
              <div className="modal-header">
                <span className="modal-meta-label">{selectedProduct.department}</span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <p className="modal-desc">{selectedProduct.description || "Indulging design and elite utility from Orient Crockeries, crafted to perfection."}</p>
              </div>

              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Barcode</span>
                  <span className="spec-value">{selectedProduct.barcode || "00000000"}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">HSN Code</span>
                  <span className="spec-value">{selectedProduct.hsn || "6911"}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">GST Rate</span>
                  <span className="spec-value">{selectedProduct.gst || 18}%</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fragile status</span>
                  <span className="spec-value">{selectedProduct.fragile ? "Fragile handling" : "Standard"}</span>
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
