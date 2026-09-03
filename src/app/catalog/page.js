"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { getImageStyle } from "../utils/imageUtils";
import ProductImageZoomViewer from "../components/ProductImageZoomViewer";
import ProductVideoEmbed from "../components/ProductVideoEmbed";

const getValidImageUrl = (src) => {
  if (!src || typeof src !== 'string') return "/images/acacia_wood_casserole.png";
  const trimmed = src.trim();
  if (!trimmed) return "/images/acacia_wood_casserole.png";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

function CatalogContent() {
  const { products, addToCart, wishlist, toggleWishlist, isInWishlist } = useApp();
  const searchParams = useSearchParams();

  // Multi-Dimension Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [priceRange, setPriceRange] = useState("all"); // 'all' | 'under999' | '1000-2499' | '2500-4999' | '5000+'
  const [selectedFragile, setSelectedFragile] = useState("all");
  const [selectedMicrowave, setSelectedMicrowave] = useState("all");
  const [sortOption, setSortOption] = useState("default");

  // Accordion Open/Closed States
  const [openSections, setOpenSections] = useState({
    depts: true,
    categories: true,
    brands: true,
    collections: true,
    price: true,
    handling: false
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
  const catParam = searchParams.get("category");
  const wishlistOnly = searchParams.get("wishlist") === "true";

  useEffect(() => {
    if (deptParam) {
      setSelectedDepts([deptParam]);
    } else {
      setSelectedDepts([]);
    }
    if (catParam) {
      setSelectedCategories([catParam]);
    }
  }, [deptParam, catParam]);

  // Helper function to map brand & collection dynamically for any product
  const getProductMeta = (product) => {
    const nameLower = (product.name || "").toLowerCase();
    const descLower = (product.description || "").toLowerCase();
    
    let brand = product.brand || "Orient Luxury";
    let collection = product.collection || "Festive Fine Dining";

    if (nameLower.includes("wood") || descLower.includes("wood")) {
      brand = "Mastercraft Wood";
      collection = "Artisanal Woodcraft";
    } else if (nameLower.includes("glass") || nameLower.includes("wine") || nameLower.includes("tea")) {
      brand = "Ocean Glassware";
      collection = "Modern Barware & Teaware";
    } else if (nameLower.includes("royal") || nameLower.includes("gold") || product.price > 2500) {
      brand = "Royal Porcelain";
      collection = "Royal Gold Edition";
    } else if (product.price > 1500) {
      brand = "Luminarc Opalware";
      collection = "Minimalist Modern Dining";
    } else if (product.department === "Cookware") {
      brand = "Borosil Premium";
      collection = "Chef Special Cookware";
    }

    return { brand, collection };
  };

  // Unique Departments, Categories, Brands & Collections
  const departments = Array.from(new Set(products.map(p => p.department))).filter(Boolean);
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const availableBrands = Array.from(new Set([
    "Orient Luxury", "Royal Porcelain", "Ocean Glassware", "Luminarc Opalware", "Borosil Premium", "Mastercraft Wood"
  ]));

  const availableCollections = Array.from(new Set([
    "Festive Fine Dining", "Royal Gold Edition", "Modern Barware & Teaware", "Minimalist Modern Dining", "Artisanal Woodcraft"
  ]));

  // Smooth scroll down to products grid when any filter is toggled
  const scrollToProductsGrid = () => {
    setTimeout(() => {
      const gridElem = document.getElementById("catalog-products-main");
      if (gridElem) {
        const topOffset = gridElem.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: topOffset, behavior: "smooth" });
      }
    }, 100);
  };

  // Toggle Handlers with auto smooth-scroll to product grid
  const handleDeptToggle = (dept) => {
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    scrollToProductsGrid();
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    scrollToProductsGrid();
  };

  const handleBrandToggle = (b) => {
    setSelectedBrands(prev => prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]);
    scrollToProductsGrid();
  };

  const handleCollectionToggle = (col) => {
    setSelectedCollections(prev => prev.includes(col) ? prev.filter(item => item !== col) : [...prev, col]);
    scrollToProductsGrid();
  };

  const handlePriceRangeChange = (val) => {
    setPriceRange(val);
    scrollToProductsGrid();
  };

  const handleFragileChange = (val) => {
    setSelectedFragile(val);
    scrollToProductsGrid();
  };

  const handleMicrowaveChange = (val) => {
    setSelectedMicrowave(val);
    scrollToProductsGrid();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDepts([]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedCollections([]);
    setPriceRange("all");
    setSelectedFragile("all");
    setSelectedMicrowave("all");
  };

  const totalActiveFiltersCount = selectedDepts.length + selectedCategories.length + selectedBrands.length + selectedCollections.length + (priceRange !== "all" ? 1 : 0) + (selectedFragile !== "all" ? 1 : 0) + (selectedMicrowave !== "all" ? 1 : 0) + (searchTerm ? 1 : 0);

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

  // Multi-Dimension Filtering Logic
  let filteredProducts = products.filter(product => {
    const meta = getProductMeta(product);

    // Search filter
    const matchesSearch = !searchTerm.trim() || 
                          product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meta.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meta.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    
    // Wishlist-only filter
    const matchesWishlist = !wishlistOnly || wishlist.some(item => item.id === product.id);

    // Department filter
    const matchesDept = selectedDepts.length === 0 || selectedDepts.includes(product.department);

    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);

    // Brand filter
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(meta.brand);

    // Collection filter
    const matchesCollection = selectedCollections.length === 0 || selectedCollections.includes(meta.collection);

    // Price Range filter
    const price = parseFloat(product.price || 0);
    const matchesPrice = priceRange === "all" ||
                         (priceRange === "under999" && price < 1000) ||
                         (priceRange === "1000-2499" && price >= 1000 && price <= 2499) ||
                         (priceRange === "2500-4999" && price >= 2500 && price <= 4999) ||
                         (priceRange === "5000+" && price >= 5000);

    // Fragile filter
    const matchesFragile = selectedFragile === "all" || 
      (selectedFragile === "fragile" && product.fragile) || 
      (selectedFragile === "standard" && !product.fragile);

    // Microwave filter
    const matchesMicrowave = selectedMicrowave === "all" || 
      (selectedMicrowave === "safe" && product.microwave) || 
      (selectedMicrowave === "not-safe" && !product.microwave);

    return matchesSearch && matchesWishlist && matchesDept && matchesCategory && matchesBrand && matchesCollection && matchesPrice && matchesFragile && matchesMicrowave;
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
        {/* Modern E-Commerce Filter Sidebar (Flipkart / Amazon Style) */}
        <aside className="filter-sidebar-pro">
          {wishlistOnly && (
            <div style={{ marginBottom: "1rem" }}>
              <Link href="/catalog" style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase" }}>
                &larr; Back to Full Catalog
              </Link>
            </div>
          )}

          {/* Filter Header Bar */}
          <div className="filter-header-bar">
            <h3 className="filter-header-title">
              <i className="fa-solid fa-sliders" style={{ color: "var(--primary)" }}></i> Filters
              {totalActiveFiltersCount > 0 && <span className="filter-badge-count">{totalActiveFiltersCount}</span>}
            </h3>
            {totalActiveFiltersCount > 0 && (
              <button onClick={handleResetFilters} className="btn-reset-filters">Clear All</button>
            )}
          </div>

          {/* 1. Departments Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("depts")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-layer-group" style={{ color: "#64748b" }}></i> Departments
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.depts ? "open" : ""}`}></i>
            </div>
            {openSections.depts && (
              <div className="accordion-body">
                {departments.map(dept => {
                  const count = products.filter(p => p.department === dept).length;
                  return (
                    <label key={dept} className="filter-item-pro">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedDepts.includes(dept)}
                          onChange={() => handleDeptToggle(dept)}
                        />
                        <span>{dept}</span>
                      </div>
                      <span className="filter-count-label">({count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Shop by Category Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("categories")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-tags" style={{ color: "#0284c7" }}></i> Shop by Category
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.categories ? "open" : ""}`}></i>
            </div>
            {openSections.categories && (
              <div className="accordion-body">
                {categories.map(cat => {
                  const count = products.filter(p => p.category === cat).length;
                  return (
                    <label key={cat} className="filter-item-pro">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                        />
                        <span>{cat}</span>
                      </div>
                      <span className="filter-count-label">({count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Shop by Brand Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("brands")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-[#d97706] fa-crown" style={{ color: "#d97706" }}></i> Shop by Brand
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.brands ? "open" : ""}`}></i>
            </div>
            {openSections.brands && (
              <div className="accordion-body">
                {availableBrands.map(b => (
                  <label key={b} className="filter-item-pro">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedBrands.includes(b)}
                        onChange={() => handleBrandToggle(b)}
                      />
                      <span>{b}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Shop by Collection Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("collections")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-gem" style={{ color: "#9333ea" }}></i> Shop by Collection
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.collections ? "open" : ""}`}></i>
            </div>
            {openSections.collections && (
              <div className="accordion-body">
                {availableCollections.map(col => (
                  <label key={col} className="filter-item-pro">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCollections.includes(col)}
                        onChange={() => handleCollectionToggle(col)}
                      />
                      <span>{col}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 5. Price Range Filter Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("price")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-indian-rupee-sign" style={{ color: "#16a34a" }}></i> Price Range
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.price ? "open" : ""}`}></i>
            </div>
            {openSections.price && (
              <div className="accordion-body">
                {[
                  { label: "All Prices", value: "all" },
                  { label: "Under ₹999", value: "under999" },
                  { label: "₹1,000 - ₹2,499", value: "1000-2499" },
                  { label: "₹2,500 - ₹4,999", value: "2500-4999" },
                  { label: "₹5,000 & Above", value: "5000+" }
                ].map(pr => (
                  <label key={pr.value} className="filter-item-pro">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input 
                        type="radio" 
                        name="priceRangeRadio" 
                        checked={priceRange === pr.value}
                        onChange={() => handlePriceRangeChange(pr.value)}
                      />
                      <span>{pr.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 6. Material Handling & Safety Accordion */}
          <div className="accordion-group">
            <div className="accordion-header" onClick={() => toggleSection("handling")}>
              <h4 className="accordion-title">
                <i className="fa-solid fa-shield-halved" style={{ color: "#ea580c" }}></i> Material & Safety
              </h4>
              <i className={`fa-solid fa-chevron-down accordion-arrow ${openSections.handling ? "open" : ""}`}></i>
            </div>
            {openSections.handling && (
              <div className="accordion-body">
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginTop: "4px" }}>Fragility</span>
                <label className="filter-item-pro">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input type="radio" name="fragile" checked={selectedFragile === "all"} onChange={() => handleFragileChange("all")} />
                    <span>All Items</span>
                  </div>
                </label>
                <label className="filter-item-pro">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input type="radio" name="fragile" checked={selectedFragile === "fragile"} onChange={() => handleFragileChange("fragile")} />
                    <span>Fragile Only</span>
                  </div>
                </label>

                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginTop: "8px" }}>Microwave Safety</span>
                <label className="filter-item-pro">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input type="radio" name="microwave" checked={selectedMicrowave === "all"} onChange={() => handleMicrowaveChange("all")} />
                    <span>All Items</span>
                  </div>
                </label>
                <label className="filter-item-pro">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input type="radio" name="microwave" checked={selectedMicrowave === "safe"} onChange={() => handleMicrowaveChange("safe")} />
                    <span>Microwave Safe</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* Catalog Main Panel */}
        <main id="catalog-products-main">
          {/* Active Filter Chips Bar */}
          {totalActiveFiltersCount > 0 && (
            <div className="active-chips-bar">
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>Active Filters:</span>
              
              {selectedDepts.map(d => (
                <span key={d} className="filter-chip">
                  Dept: {d} <button onClick={() => handleDeptToggle(d)}>×</button>
                </span>
              ))}

              {selectedCategories.map(c => (
                <span key={c} className="filter-chip">
                  Cat: {c} <button onClick={() => handleCategoryToggle(c)}>×</button>
                </span>
              ))}

              {selectedBrands.map(b => (
                <span key={b} className="filter-chip">
                  Brand: {b} <button onClick={() => handleBrandToggle(b)}>×</button>
                </span>
              ))}

              {selectedCollections.map(col => (
                <span key={col} className="filter-chip">
                  Collection: {col} <button onClick={() => handleCollectionToggle(col)}>×</button>
                </span>
              ))}

              {priceRange !== "all" && (
                <span className="filter-chip">
                  Price: {priceRange} <button onClick={() => setPriceRange("all")}>×</button>
                </span>
              )}

              {searchTerm && (
                <span className="filter-chip">
                  Search: "{searchTerm}" <button onClick={() => setSearchTerm("")}>×</button>
                </span>
              )}

              <button 
                onClick={handleResetFilters} 
                style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", marginLeft: "auto" }}
              >
                Reset All
              </button>
            </div>
          )}
          {/* Search Box */}
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon-inside"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by product name, department, or category..."
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
                        src={getValidImageUrl(product.image)} 
                        alt={product.name} 
                        fill 
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="product-image" 
                        style={getImageStyle(product, product.image, 'cover')}
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
              <ProductImageZoomViewer 
                product={selectedProduct} 
                activeImage={activeImage} 
                getValidImageUrl={getValidImageUrl} 
              />
              {selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                <div className="thumbnail-gallery" style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto', width: '100%', justifyContent: 'center' }}>
                  {selectedProduct.images.map((img, idx) => (
                    <Image 
                      key={idx} 
                      src={getValidImageUrl(img)} 
                      alt={`${selectedProduct.name} - view ${idx + 1}`} 
                      width={55}
                      height={55}
                      className={`thumbnail ${(activeImage === img || (!activeImage && selectedProduct.image === img)) ? 'active' : ''}`}
                      onClick={() => setActiveImage(img)}
                      style={{ ...getImageStyle(selectedProduct, img, 'cover'), cursor: 'pointer', borderRadius: '6px' }}
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

                {(selectedProduct.fragile === true || selectedProduct.fragile === "true" || selectedProduct.fragile === "fragile") && (
                  <div className="highlight-badge-card">
                    <div className="badge-icon-box fragile">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div className="badge-text-box">
                      <span className="badge-title">HANDLING</span>
                      <span className="badge-val">Fragile Handling ⚠️</span>
                    </div>
                  </div>
                )}

                {(selectedProduct.microwave === true || selectedProduct.microwave === "true" || selectedProduct.microwave === "safe") && (
                  <div className="highlight-badge-card">
                    <div className="badge-icon-box microwave-safe">
                      <i className="fa-solid fa-fire-burner"></i>
                    </div>
                    <div className="badge-text-box">
                      <span className="badge-title">MICROWAVE</span>
                      <span className="badge-val">Microwave Safe ♨️</span>
                    </div>
                  </div>
                )}

                {selectedProduct.warranty && selectedProduct.warranty !== "No Warranty" && (
                  <div className="highlight-badge-card">
                    <div className="badge-icon-box warranty" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
                      <i className="fa-solid fa-award"></i>
                    </div>
                    <div className="badge-text-box">
                      <span className="badge-title">WARRANTY</span>
                      <span className="badge-val">{selectedProduct.warranty}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Embedded YouTube & Instagram Video Showcase */}
              <ProductVideoEmbed product={selectedProduct} />

              {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>Customer Reviews</h3>
                    <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
                      {selectedProduct.reviews.length} {selectedProduct.reviews.length === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

      {/* Floating Filter Quick Action Button */}
      <div style={{ position: "fixed", bottom: "30px", left: "30px", zIndex: 990 }}>
        <button 
          type="button"
          onClick={() => {
            const sidebar = document.querySelector(".filter-sidebar-pro");
            if (sidebar) {
              const topOffset = sidebar.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: topOffset, behavior: "smooth" });
            }
          }}
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            border: "1.5px solid rgba(255, 255, 255, 0.2)",
            padding: "10px 18px",
            borderRadius: "30px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.5px",
            backdropFilter: "blur(10px)",
            transition: "transform 0.2s ease, boxShadow 0.2s ease"
          }}
          title="Jump to Catalog Filters"
        >
          <i className="fa-solid fa-sliders" style={{ color: "var(--primary)" }}></i>
          <span>Filter Catalog</span>
          {totalActiveFiltersCount > 0 && (
            <span style={{ background: "var(--primary)", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontSize: "0.72rem" }}>
              {totalActiveFiltersCount}
            </span>
          )}
        </button>
      </div>

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
