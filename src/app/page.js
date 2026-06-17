'use client';

import { useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

export default function Home() {
  useEffect(() => {
    // Force remove preload on mount
    document.body.classList.remove('preload');
    
    


let products = [];
let orders = [];
let wishlist = JSON.parse(localStorage.getItem('digisoft_wishlist')) || [];
let appliedCoupon = null;
let couponDiscountValue = 0;
let redeemedPoints = 0;
let loyaltyPointsBalance = 0;

// CONFIGURATION: Replace with your actual Razorpay Test Key ID from the Razorpay Dashboard (e.g. "rzp_test_...")
const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_TEST_KEY_ID";

class ConfettiEngine {
  constructor() {
    this.canvas = document.getElementById('confetti-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#C5A059', '#D4AF37', '#ffffff', '#E2E8F0', '#A68445'];
    this.active = false;
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  start(durationMs = 2500, amount = 100) {
    if (!this.canvas) return;
    this.active = true;
    this.resizeCanvas();
    
    // Spawn initial particles
    for (let i = 0; i < amount; i++) {
      this.particles.push(this.createParticle());
    }

    const startTime = Date.now();
    const tick = () => {
      if (!this.active) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > durationMs && this.particles.length === 0) {
        this.stop();
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.fillStyle = p.color;
        
        if (p.shape === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.r, 0, 2 * Math.PI);
          this.ctx.fill();
        } else {
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        this.ctx.restore();

        if (p.y > this.canvas.height) {
          if (Date.now() - startTime < durationMs) {
            this.particles[i] = this.createParticle(true);
          } else {
            this.particles.splice(i, 1);
          }
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  stop() {
    this.active = false;
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  createParticle(atTop = false) {
    const shape = Math.random() > 0.5 ? 'rect' : 'circle';
    return {
      x: Math.random() * this.canvas.width,
      y: atTop ? -20 : Math.random() * -this.canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 3,
      r: Math.random() * 4 + 3,
      w: Math.random() * 8 + 4,
      h: Math.random() * 12 + 6,
      shape: shape,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8
    };
  }
}

let confetti = null;
document.addEventListener('DOMContentLoaded', () => {
  confetti = new ConfettiEngine();
});

const injectJSONLD = (productList) => {
  let existing = document.getElementById('seo-jsonld');
  if (existing) existing.remove();

  const schema = {
    "@context": "https://schema.org",
    "@type": "GiftStore",
    "name": "Digisoft Gift Shop",
    "description": "Discover the world's best collection of premium and customized gifts at Digisoft Gift Shop.",
    "url": window.location.origin,
    "telephone": "+1-555-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "101, Luxury Boulevard, Suite A",
      "addressLocality": "New York",
      "addressRegion": "NY",
      "postalCode": "10001",
      "addressCountry": "US"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "20:00"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Luxury Gifting Catalogue",
      "itemListElement": productList.slice(0, 5).map((p, idx) => ({
        "@type": "OfferCatalogItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "image": (p.image.startsWith('http') ? p.image : window.location.origin + p.image),
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": p.price,
            "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      }))
    }
  };

  const script = document.createElement('script');
  script.id = 'seo-jsonld';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
};

const showFirebaseError = (err) => {
  console.error("Firebase/Firestore Error Details:", err);
  const existing = document.getElementById('firebase-error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'firebase-error-banner';
  banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#ff4a4a; color:white; padding:12px; text-align:center; z-index:999999; font-weight:bold; font-family:sans-serif; box-shadow:0 2px 10px rgba(0,0,0,0.5);';
  banner.innerHTML = `⚠️ Cloud Database (Firestore) Connection Issue: <span style="text-decoration:underline;">${err.message}</span>. Please verify your Firestore Database security rules.`;
  document.body.prepend(banner);
};

const seedDatabaseIfEmpty = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const needsReseed = querySnapshot.empty || querySnapshot.docs.some(d => !d.data().department);
    if (needsReseed) {
      const initialProducts = [
        { id: 1, name: "Golden Eternal Rose", price: 129.00, image: "/images/rose.jpg", department: "Gifting", category: "Festival Gifts", subCategory: "Diwali Gifts", stock: 12, fragile: true, microwave: false },
        { id: 2, name: "Luxury Watch Set", price: 450.00, image: "/images/watch.jpg", department: "Gifting", category: "Gift Sets", subCategory: "Home Décor Gift Packs", stock: 6, fragile: true, microwave: false },
        { id: 3, name: "Customized Leather Journal", price: 59.00, image: "/images/journal.jpg", department: "Gifting", category: "Wedding Gifts", subCategory: "Executive Gifts", stock: 20, fragile: false, microwave: false },
        { id: 4, name: "Artisan Chocolate Box", price: 85.00, image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=1935&auto=format&fit=crop", department: "Gifting", category: "Wedding Gifts", subCategory: "Gift Hampers", stock: 15, fragile: false, microwave: false },
        { id: 5, name: "Diamond Stud Earrings", price: 899.00, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop", department: "Gifting", category: "Wedding Gifts", subCategory: "Wedding Gifts", stock: 3, fragile: true, microwave: false },
        { id: 6, name: "Crystal Scented Candle", price: 45.00, image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1974&auto=format&fit=crop", department: "Home Décor", category: "Decorative Items", subCategory: "Showpieces", stock: 25, fragile: true, microwave: false },
        { id: 7, name: "Premium Bone China Set", price: 299.00, image: "/images/crockery_dinner_set.png", department: "Crockery & Dining", category: "Dinnerware", subCategory: "Dinner Sets", stock: 8, fragile: true, microwave: true },
        { id: 8, name: "Artisan Ceramic Teapot", price: 75.00, image: "/images/crockery_teapot.png", department: "Crockery & Dining", category: "Drinkware", subCategory: "Tea Cups & Saucers", stock: 10, fragile: true, microwave: true },
        { id: 9, name: "Crystal Wine Glass Set", price: 120.00, image: "/images/crockery_wine_glasses.png", department: "Crockery & Dining", category: "Drinkware", subCategory: "Wine Glasses", stock: 14, fragile: true, microwave: false },
        { id: 10, name: "Matte Ceramic Plates", price: 85.00, image: "/images/crockery_plates.png", department: "Crockery & Dining", category: "Dinnerware", subCategory: "Dinner Plates", stock: 18, fragile: true, microwave: true }
      ];
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id.toString()), prod);
      }
    }
  } catch (err) {
    showFirebaseError(err);
  }
};

seedDatabaseIfEmpty();

// Subscribe to products real-time changes
onSnapshot(collection(db, 'products'), (snapshot) => {
  products = snapshot.docs.map(doc => doc.data());
  products.sort((a, b) => a.id - b.id);
  renderProducts();
  injectJSONLD(products);
  if (currentDetailProductId) {
    const updatedProduct = products.find(p => p.id === currentDetailProductId);
    if (updatedProduct) {
      renderDetailModalContent(updatedProduct);
    }
  }
}, (err) => {
  showFirebaseError(err);
});

// Subscribe to orders real-time changes
onSnapshot(collection(db, 'orders'), (snapshot) => {
  orders = snapshot.docs.map(doc => doc.data());
  orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}, (err) => {
  showFirebaseError(err);
});

const getProducts = () => products;
const getOrders = () => orders;

// Render Products
let currentDetailProductId = null;

const renderDetailModalContent = (product) => {
  const imgEl = document.getElementById('detail-product-image');
  const catEl = document.getElementById('detail-product-category');
  const nameEl = document.getElementById('detail-product-name');
  const priceEl = document.getElementById('detail-product-price');
  const mrpEl = document.getElementById('detail-product-mrp');
  const discountEl = document.getElementById('detail-product-discount');
  const descEl = document.getElementById('detail-product-description');
  const soldEl = document.getElementById('detail-product-sold-badge');
  const starsAvgEl = document.getElementById('detail-product-stars-avg');
  const ratingTextEl = document.getElementById('detail-product-rating-text');
  const stockEl = document.getElementById('detail-product-stock-badge');
  const addToCartBtn = document.getElementById('detail-add-to-cart-btn');
  const wishlistBtn = document.getElementById('detail-wishlist-btn');

  if (imgEl) {
    imgEl.src = product.image;
    imgEl.alt = product.name;
  }
  if (catEl) {
    catEl.textContent = (product.department ? product.department + ' > ' : '') + (product.category || 'Gifts');
  }
  if (nameEl) {
    nameEl.textContent = product.name;
  }
  if (priceEl) {
    priceEl.textContent = '₹' + product.price.toLocaleString('en-IN');
  }
  
  if (mrpEl && discountEl) {
    // Generate a comparative MRP (roughly 1.4x the price, rounded to end in 9 or 0)
    const fakeMRP = Math.round((product.price * 1.4) / 10) * 10 - 1;
    const discountPercent = Math.round(((fakeMRP - product.price) / fakeMRP) * 100);
    mrpEl.textContent = '₹' + fakeMRP.toLocaleString('en-IN');
    discountEl.textContent = `(${discountPercent}% OFF)`;
  }

  if (descEl) {
    descEl.textContent = product.description || 'No description available.';
  }
  if (soldEl) {
    soldEl.textContent = `${product.soldCount || 0}+ sold`;
  }

  const avgRating = product.rating || 0;
  if (starsAvgEl) {
    starsAvgEl.textContent = avgRating > 0 ? avgRating.toFixed(1) : '0.0';
  }
  if (ratingTextEl) {
    ratingTextEl.textContent = `(${product.reviewCount || 0} customer reviews)`;
  }

  if (stockEl) {
    if (product.stock > 0) {
      stockEl.textContent = 'In Stock';
      stockEl.style.background = 'rgba(37, 211, 102, 0.08)';
      stockEl.style.color = '#25D366';
      stockEl.style.border = '1px solid rgba(37, 211, 102, 0.15)';
    } else {
      stockEl.textContent = 'Out of Stock';
      stockEl.style.background = 'rgba(255, 74, 74, 0.08)';
      stockEl.style.color = '#ff4a4a';
      stockEl.style.border = '1px solid rgba(255, 74, 74, 0.15)';
    }
  }

  if (addToCartBtn) {
    if (product.stock <= 0) {
      addToCartBtn.style.opacity = '0.5';
      addToCartBtn.style.pointerEvents = 'none';
      addToCartBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg> Out of Stock
      `;
    } else {
      addToCartBtn.style.opacity = '1';
      addToCartBtn.style.pointerEvents = 'auto';
      addToCartBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg> Add to Cart
      `;
    }
  }

  if (wishlistBtn) {
    const isWishlisted = wishlist.some(item => item.id === product.id);
    wishlistBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--primary)' : 'none'}" stroke="${isWishlisted ? 'var(--primary)' : 'currentColor'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
  }

  // Render review list
  const reviewsContainer = document.getElementById('detail-reviews-list-container');
  if (reviewsContainer) {
    if (!product.reviews || product.reviews.length === 0) {
      reviewsContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin:35px 0;">No customer reviews yet. Be the first to review this product!</p>`;
    } else {
      const sortedReviews = [...product.reviews].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      reviewsContainer.innerHTML = sortedReviews.map(rev => {
        const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        const dateStr = rev.timestamp ? new Date(rev.timestamp).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A';
        const initialLikes = Math.floor((parseInt(rev.id ? rev.id.substring(rev.id.length - 3) : "0") || Math.random() * 100) % 6);
        return `
          <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--glass-border); border-radius: 12px; padding: 12px; display:flex; flex-direction:column; gap:6px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center;">
                <span style="font-weight:700; color:var(--text-main); font-size:0.85rem;">${rev.reviewerName}</span>
                <span class="verified-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verified Purchase
                </span>
              </div>
              <span style="color:var(--accent); font-size:0.75rem; letter-spacing:1px;">${stars}</span>
            </div>
            <p style="margin:0; font-size:0.82rem; color:var(--text-muted); line-height:1.45; font-weight:400;">${rev.comment}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
              <div class="helpful-btn-widget" style="display:inline-flex; align-items:center; gap:4px; font-size:0.7rem; color:var(--text-muted); cursor:pointer; transition:var(--transition);" onclick="this.style.color='#25D366'; const countSpan=this.querySelector('.help-count'); countSpan.textContent=parseInt(countSpan.textContent)+1; this.onclick=null;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                <span>Helpful (<span class="help-count">${initialLikes}</span>)</span>
              </div>
              <span style="font-size:0.65rem; color:rgba(255,255,255,0.25);">${dateStr}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render ratings distribution widget
  const ratingDistributionWidget = document.getElementById('rating-distribution-widget');
  if (ratingDistributionWidget) {
    const reviews = product.reviews || [];
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    const total = reviews.length;
    let widgetHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px dashed var(--glass-border); padding-bottom:8px; margin-bottom:5px;">
        <span style="font-size:0.82rem; font-weight:700; color:var(--text-main);">Rating Distribution</span>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${total} Reviews</span>
      </div>
    `;

    for (let stars = 5; stars >= 1; stars--) {
      const count = counts[stars];
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      widgetHTML += `
        <div style="display:flex; align-items:center; gap:10px; font-size:0.75rem;">
          <span style="width:40px; color:var(--text-muted); font-weight:600; display:flex; align-items:center; gap:2px;">
            <span>${stars}</span>
            <span style="color:var(--primary); font-size:0.8rem;">★</span>
          </span>
          <div style="flex-grow:1; height:6px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:3px; overflow:hidden;">
            <div style="width:${percent}%; height:100%; background:linear-gradient(to right, var(--primary), var(--accent)); border-radius:3px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
          <span style="width:30px; text-align:right; color:var(--text-muted); font-weight:600;">${percent}%</span>
        </div>
      `;
    }
    ratingDistributionWidget.innerHTML = widgetHTML;
  }
};

const openProductDetails = (productId) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentDetailProductId = productId;
  renderDetailModalContent(product);

  const detailOverlay = document.getElementById('product-detail-overlay');
  if (detailOverlay) {
    detailOverlay.classList.add('active');
    updateBodyScrollState();
  }
};

const initProductDetailModal = () => {
  const detailOverlay = document.getElementById('product-detail-overlay');
  const closeBtn = document.getElementById('close-detail-modal-btn');
  const addToCartBtn = document.getElementById('detail-add-to-cart-btn');
  const buyNowBtn = document.getElementById('detail-buy-now-btn');
  const wishlistBtn = document.getElementById('detail-wishlist-btn');
  const writeReviewForm = document.getElementById('write-review-form');

  if (closeBtn && detailOverlay) {
    closeBtn.addEventListener('click', () => {
      detailOverlay.classList.remove('active');
      currentDetailProductId = null;
      updateBodyScrollState();
    });
    
    detailOverlay.addEventListener('click', (e) => {
      if (e.target === detailOverlay) {
        detailOverlay.classList.remove('active');
        currentDetailProductId = null;
        updateBodyScrollState();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailOverlay && detailOverlay.classList.contains('active')) {
      detailOverlay.classList.remove('active');
      currentDetailProductId = null;
      updateBodyScrollState();
    }
  });

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (currentDetailProductId) {
        addToCart(currentDetailProductId);
      }
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (currentDetailProductId) {
        const product = products.find(p => p.id === currentDetailProductId);
        if (!product || product.stock <= 0) return;

        const cartItem = cart.find(item => item.product.id === currentDetailProductId);
        if (!cartItem) {
          cart.push({ product, quantity: 1 });
          updateCartUI();
        }

        // Close details modal
        detailOverlay.classList.remove('active');
        currentDetailProductId = null;

        // Open checkout modal directly
        const checkoutOverlay = document.getElementById('checkout-overlay');
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
          checkoutBtn.click();
        } else if (checkoutOverlay) {
          checkoutOverlay.classList.add('active');
          updateBodyScrollState();
        }
      }
    });
  }

  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      if (currentDetailProductId) {
        toggleWishlist(currentDetailProductId);
      }
    });
  }

  // Interactive Clickable Star Rating handling
  const ratingStars = document.querySelectorAll('.interactive-star-row span');
  const ratingValInput = document.getElementById('review-cust-rating');

  if (ratingStars && ratingValInput) {
    const updateStarsDisplay = (val) => {
      ratingValInput.value = val;
      ratingStars.forEach(star => {
        const starVal = parseInt(star.getAttribute('data-val'));
        if (starVal <= val) {
          star.style.color = 'var(--accent)';
          star.style.textShadow = '0 0 8px rgba(212, 175, 55, 0.5)';
        } else {
          star.style.color = 'rgba(255, 255, 255, 0.15)';
          star.style.textShadow = 'none';
        }
      });
    };

    // Set default selection to 5 stars
    updateStarsDisplay(5);

    ratingStars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-val'));
        updateStarsDisplay(val);
      });

      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.getAttribute('data-val'));
        ratingStars.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-val'));
          if (sVal <= val) {
            s.style.color = 'var(--accent)';
            s.style.textShadow = '0 0 8px rgba(212, 175, 55, 0.5)';
          } else {
            s.style.color = 'rgba(255, 255, 255, 0.15)';
            s.style.textShadow = 'none';
          }
        });
      });

      star.addEventListener('mouseleave', () => {
        const activeVal = parseInt(ratingValInput.value) || 5;
        updateStarsDisplay(activeVal);
      });
    });
  }

  if (writeReviewForm) {
    writeReviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentDetailProductId) return;

      const name = document.getElementById('review-cust-name').value.trim();
      const rating = parseInt(ratingValInput.value) || 5;
      const comment = document.getElementById('review-cust-comment').value.trim();

      if (!name || !comment) {
        showToast("Validation Error", "Please fill in all fields before submitting.", "warning");
        return;
      }

      const product = products.find(p => p.id === currentDetailProductId);
      if (!product) return;

      const newReview = {
        id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        reviewerName: name,
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString()
      };

      const updatedReviews = product.reviews ? [...product.reviews, newReview] : [newReview];
      const reviewCount = updatedReviews.length;
      const sum = updatedReviews.reduce((s, r) => s + r.rating, 0);
      const avgRating = Math.round((sum / reviewCount) * 10) / 10;

      try {
        await updateDoc(doc(db, 'products', currentDetailProductId.toString()), {
          reviews: updatedReviews,
          rating: avgRating,
          reviewCount: reviewCount
        });
        showToast("Review Submitted", "Thank you! Your review has been added.", "success");
        writeReviewForm.reset();
        
        // Reset stars selector display back to 5 stars
        if (updateStarsDisplay) {
          updateStarsDisplay(5);
        } else {
          ratingValInput.value = "5";
          ratingStars.forEach(s => {
            s.style.color = 'var(--accent)';
            s.style.textShadow = '0 0 8px rgba(212, 175, 55, 0.5)';
          });
        }
      } catch (err) {
        showToast("Submission Failed", err.message, "warning");
      }
    });
  }
};

const renderProducts = (filteredProducts = null) => {
  products = getProducts();
  const listToRender = filteredProducts || products;
  
  const container = document.getElementById('product-container');
  if (!container) return;

  if (listToRender.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 20px;">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <h3>No treasures found matching your search.</h3>
        <p>Try searching for categories like "Premium", "Anniversary", or "Customized".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = listToRender.map(product => {
    const isOutOfStock = product.stock <= 0;
    const isWishlisted = wishlist.some(item => item.id === product.id);
    return `
      <div class="product-card" data-id="${product.id}" style="animation: fadeInUp 0.5s ease forwards; cursor: pointer;">
        <div class="product-img" style="position:relative;">
          <img src="${product.image}" alt="${product.name}">
          ${isOutOfStock ? `<div style="position:absolute; top:10px; left:10px; background:#ff4a4a; color:white; font-size:0.7rem; font-weight:800; padding:4px 8px; border-radius:4px;">OUT OF STOCK</div>` : ''}
          <div class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}" style="position:absolute; top:10px; right:10px; width:36px; height:36px; border-radius:50%; background:rgba(10,10,10,0.6); backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; transition:all 0.3s ease;">
            <svg class="heart-icon" width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--primary)' : 'none'}" stroke="${isWishlisted ? 'var(--primary)' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        </div>
        <div class="product-info">
          <p style="color: var(--primary); font-size: 0.72rem; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">
            ${product.department ? `${product.department} &gt; ` : ''}${product.category || 'Gifts'}
          </p>
          <h3 style="margin-bottom: 12px; height: 42px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.name}</h3>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <p class="product-price" style="margin: 0; font-weight: 700; font-size: 1.15rem; color: var(--primary);">₹${product.price.toLocaleString('en-IN')}</p>
              <span style="font-size:0.75rem; color:${product.stock < 3 ? '#ff4a4a' : 'var(--text-muted)'}; font-weight:600; display:block; margin-top:2px;">
                ${isOutOfStock ? 'Sold Out' : `${product.stock} available`}
              </span>
            </div>
            <div class="add-btn ${isOutOfStock ? 'disabled' : ''}" data-id="${product.id}" style="${isOutOfStock ? 'pointer-events:none; opacity:0.4; background:#444;' : 'cursor:pointer;'} display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click listeners
  container.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute('data-id'));
      addToCart(productId);
    });
  });

  container.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute('data-id'));
      toggleWishlist(productId);
    });
  });

  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const productId = parseInt(card.getAttribute('data-id'));
      openProductDetails(productId);
    });
  });
};

// Cart Logic
let cart = JSON.parse(localStorage.getItem('digisoft_cart')) || [];

const addToCart = (productId) => {
  products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;

  const cartItem = cart.find(item => item.product.id === productId);
  if (cartItem) {
    if (cartItem.quantity >= product.stock) {
      showToast("Inventory Limit Reached", "We only have " + product.stock + " items of this product left in stock.", "warning");
      return;
    }
    cartItem.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }

  showToast("Added to Cart", product.name + " has been added to your shopping cart.", "success");
  updateCartUI();
};

const toggleWishlist = (productId) => {
  products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const index = wishlist.findIndex(item => item.id === productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast("Removed from Wishlist", product.name + " has been removed from your wishlist.", "success");
  } else {
    wishlist.push(product);
    showToast("Added to Wishlist", product.name + " has been added to your wishlist.", "success");
  }
  
  localStorage.setItem('digisoft_wishlist', JSON.stringify(wishlist));
  renderProducts();
  updateWishlistUI();

  if (currentDetailProductId === productId) {
    const wishlistBtn = document.getElementById('detail-wishlist-btn');
    if (wishlistBtn) {
      const isWishlisted = wishlist.some(item => item.id === productId);
      wishlistBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--primary)' : 'none'}" stroke="${isWishlisted ? 'var(--primary)' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      `;
    }
  }
};

const updateWishlistUI = () => {
  const wishlistCount = document.getElementById('wishlist-count');
  const wishlistBody = document.getElementById('wishlist-body-items');
  
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
  }
  
  if (!wishlistBody) return;
  
  if (wishlist.length === 0) {
    wishlistBody.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <p>Your wishlist is empty</p>
      </div>
    `;
    return;
  }
  
  wishlistBody.innerHTML = wishlist.map(product => {
    const isOutOfStock = product.stock <= 0;
    return `
      <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding: 12px 0;">
        <img src="${product.image}" alt="${product.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
        <div style="flex-grow:1; margin-left: 12px;">
          <h4 style="font-size:0.9rem; margin-bottom:4px; font-weight:600;">${product.name}</h4>
          <p style="color:var(--primary); font-size:0.85rem; font-weight:700;">₹${product.price.toLocaleString('en-IN')}</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-primary add-from-wishlist-btn" data-id="${product.id}" style="${isOutOfStock ? 'opacity:0.5; pointer-events:none;' : ''} padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; display:flex; align-items:center;" ${isOutOfStock ? 'disabled' : ''}>
            Add to Cart
          </button>
          <button class="remove-from-wishlist-btn" data-id="${product.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; padding: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Bind events
  wishlistBody.querySelectorAll('.add-from-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      addToCart(id);
      const index = wishlist.findIndex(item => item.id === id);
      if (index > -1) {
        wishlist.splice(index, 1);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        renderProducts();
        updateWishlistUI();
      }
    });
  });
  
  wishlistBody.querySelectorAll('.remove-from-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const index = wishlist.findIndex(item => item.id === id);
      if (index > -1) {
        wishlist.splice(index, 1);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        renderProducts();
        updateWishlistUI();
      }
    });
  });
};

const updateCartUI = () => {
  // Save cart to local storage
  localStorage.setItem('digisoft_cart', JSON.stringify(cart));

  const cartBody = document.getElementById('cart-body-items');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTax = document.getElementById('cart-tax');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');

  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>Your shopping cart is empty</p>
      </div>
    `;
    cartSubtotal.textContent = "₹0.00";
    cartTax.textContent = "₹0.00";
    cartTotal.textContent = "₹0.00";
    cartCount.textContent = "0";
    return;
  }

  let subtotal = 0;
  cartBody.innerHTML = cart.map(item => {
    const totalItemPrice = item.product.price * item.quantity;
    subtotal += totalItemPrice;
    return `
      <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding: 12px 0;">
        <img src="${item.product.image}" alt="${item.product.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
        <div style="flex-grow:1; margin-left: 12px;">
          <h4 style="font-size:0.9rem; margin-bottom:4px; font-weight:600;">${item.product.name}</h4>
          <p style="color:var(--primary); font-size:0.85rem; font-weight:700;">₹${item.product.price.toLocaleString('en-IN')}</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="cart-qty-btn decrease-qty" data-id="${item.product.id}" style="width:24px; height:24px; border-radius:50%; border:1px solid var(--glass-border); background:none; color:white; cursor:pointer;">-</button>
          <span style="font-size:0.9rem; font-weight:600; min-width:15px; text-align:center;">${item.quantity}</span>
          <button class="cart-qty-btn increase-qty" data-id="${item.product.id}" style="width:24px; height:24px; border-radius:50%; border:1px solid var(--glass-border); background:none; color:white; cursor:pointer;">+</button>
        </div>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  cartSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  cartTax.textContent = `₹${tax.toLocaleString('en-IN')}`;
  cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Bind cart events
  cartBody.querySelectorAll('.decrease-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const item = cart.find(item => item.product.id === id);
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        cart = cart.filter(item => item.product.id !== id);
      }
      updateCartUI();
    });
  });

  cartBody.querySelectorAll('.increase-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const item = cart.find(item => item.product.id === id);
      const product = products.find(p => p.id === id);
      if (item.quantity < product.stock) {
        item.quantity++;
      } else {
        showToast("Inventory Limit", `We only have ${product.stock} items in stock.`, "warning");
      }
      updateCartUI();
    });
  });
};

// Toast helper
const showToast = (title, message, type = "success") => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === "warning") {
    toast.style.borderColor = "#ffaa00";
    toast.style.borderLeftColor = "#ffaa00";
  }
  toast.innerHTML = `
    <div class="toast-icon" style="display: flex; align-items: center; justify-content: center;">
      ${type === "success" 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` 
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      }
    </div>
    <div class="toast-body">
      <h5>${title}</h5>
      <p>${message}</p>
    </div>
    <div class="toast-close" style="display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 500);
  });

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 500);
    }
  }, 5000);
};

const calculateCheckoutTotals = () => {
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Calculate coupon discount
  couponDiscountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon === 'WELCOME10') {
      couponDiscountValue = subtotal * 0.10;
    } else if (appliedCoupon === 'GIFT15') {
      couponDiscountValue = subtotal * 0.15;
    } else if (appliedCoupon === 'FESTIVE25') {
      couponDiscountValue = subtotal * 0.25;
    } else if (appliedCoupon === 'DIGI500') {
      if (subtotal >= 1500) {
        couponDiscountValue = 500;
      } else {
        appliedCoupon = null;
        couponDiscountValue = 0;
        const couponMsg = document.getElementById('coupon-message');
        if (couponMsg) {
          couponMsg.textContent = "Coupon DIGI500 requires minimum subtotal of ₹1,500.";
          couponMsg.className = "error";
        }
      }
    }
  }

  const taxableValue = Math.max(0, subtotal - couponDiscountValue);
  const tax = taxableValue * 0.18;
  const totalBeforeLoyalty = taxableValue + tax;

  // Calculate loyalty points discount
  redeemedPoints = 0;
  const redeemCheckbox = document.getElementById('redeem-points-checkbox');
  if (redeemCheckbox && redeemCheckbox.checked) {
    const pointsToRedeem = Math.min(loyaltyPointsBalance, Math.floor(totalBeforeLoyalty));
    redeemedPoints = pointsToRedeem;
  }

  const finalTotal = Math.max(0, totalBeforeLoyalty - redeemedPoints);
  const pointsEarned = Math.floor(finalTotal / 100);

  // Update checkout modal totals UI
  const subtotalEl = document.getElementById('checkout-subtotal');
  const discountEl = document.getElementById('checkout-discount');
  const discountRow = document.getElementById('checkout-discount-row');
  const taxEl = document.getElementById('checkout-tax');
  const loyaltyEl = document.getElementById('checkout-loyalty-discount');
  const loyaltyRow = document.getElementById('checkout-loyalty-row');
  const grandTotalEl = document.getElementById('checkout-grand-total');

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (discountRow) {
    if (couponDiscountValue > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-₹${couponDiscountValue.toLocaleString('en-IN')}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  if (taxEl) taxEl.textContent = `₹${tax.toLocaleString('en-IN')}`;
  if (loyaltyRow) {
    if (redeemedPoints > 0) {
      loyaltyRow.style.display = 'flex';
      loyaltyEl.textContent = `-₹${redeemedPoints.toLocaleString('en-IN')}`;
    } else {
      loyaltyRow.style.display = 'none';
    }
  }
  if (grandTotalEl) grandTotalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

  return {
    subtotal,
    couponApplied: appliedCoupon,
    couponDiscount: couponDiscountValue,
    tax,
    loyaltyPointsRedeemed: redeemedPoints,
    loyaltyPointsEarned: pointsEarned,
    total: finalTotal
  };
};

// Helper to update body scroll lock based on active overlays
const updateBodyScrollState = () => {
  const activeOverlays = document.querySelectorAll('.checkout-overlay.active');
  if (activeOverlays.length > 0) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
};

// UI Drawer Triggers
const initStoreUI = () => {
  const cartTrigger = document.getElementById('cart-trigger-btn');
  const closeCart = document.getElementById('close-cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const closeCheckout = document.getElementById('close-checkout-btn');
  const checkoutForm = document.getElementById('checkout-form-modal');

  const wishlistTrigger = document.getElementById('wishlist-trigger-btn');
  const closeWishlist = document.getElementById('close-wishlist-btn');
  const wishlistDrawer = document.getElementById('wishlist-drawer');

  // Checkout inputs
  const nameInput = document.getElementById('cust-name');
  const emailInput = document.getElementById('cust-email');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');

  // Load saved checkout details
  if (nameInput) nameInput.value = localStorage.getItem('digisoft_checkout_name') || '';
  if (emailInput) emailInput.value = localStorage.getItem('digisoft_checkout_email') || '';
  if (phoneInput) phoneInput.value = localStorage.getItem('digisoft_checkout_phone') || '';
  if (addressInput) addressInput.value = localStorage.getItem('digisoft_checkout_address') || '';

  // Listen to input changes to save
  nameInput?.addEventListener('input', (e) => localStorage.setItem('digisoft_checkout_name', e.target.value));
  emailInput?.addEventListener('input', (e) => localStorage.setItem('digisoft_checkout_email', e.target.value));
  phoneInput?.addEventListener('input', (e) => {
    localStorage.setItem('digisoft_checkout_phone', e.target.value);
  });
  addressInput?.addEventListener('input', (e) => localStorage.setItem('digisoft_checkout_address', e.target.value));

  if (cartTrigger && cartDrawer) {
    cartTrigger.addEventListener('click', () => cartDrawer.classList.add('active'));
  }
  if (closeCart && cartDrawer) {
    closeCart.addEventListener('click', () => cartDrawer.classList.remove('active'));
  }
  if (wishlistTrigger && wishlistDrawer) {
    wishlistTrigger.addEventListener('click', () => {
      updateWishlistUI();
      wishlistDrawer.classList.add('active');
    });
  }
  if (closeWishlist && wishlistDrawer) {
    closeWishlist.addEventListener('click', () => wishlistDrawer.classList.remove('active'));
  }

  if (checkoutBtn && checkoutOverlay) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast("Cart Empty", "Add products to your cart before checking out.", "warning");
        return;
      }
      cartDrawer.classList.remove('active');
      checkoutOverlay.classList.add('active');
      localStorage.setItem('digisoft_checkout_active', 'true');
      updateBodyScrollState();
      
      // Reset coupon and loyalty point selections
      appliedCoupon = null;
      couponDiscountValue = 0;
      redeemedPoints = 0;
      const couponInput = document.getElementById('coupon-code-input');
      const couponMsg = document.getElementById('coupon-message');
      const pointsCheckbox = document.getElementById('redeem-points-checkbox');
      const loyaltyContainer = document.getElementById('loyalty-redeem-container');
      const phoneInput = document.getElementById('cust-phone');
      
      if (couponInput) couponInput.value = "";
      if (couponMsg) {
        couponMsg.textContent = "";
        couponMsg.className = "";
      }
      if (pointsCheckbox) pointsCheckbox.checked = false;
      if (loyaltyContainer) loyaltyContainer.style.display = 'none';

      // Load checkout summary items
      const summaryItemsEl = document.getElementById('checkout-summary-items');
      if (summaryItemsEl) {
        summaryItemsEl.innerHTML = cart.map(item => `
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>${item.product.name} (x${item.quantity})</span>
            <span>₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
          </div>
        `).join('');
      }

      // Check if phone number is pre-filled, and fetch points
      if (phoneInput && phoneInput.value.trim().length >= 10) {
        phoneInput.dispatchEvent(new Event('change'));
      }

      calculateCheckoutTotals();
      
      // Setup mock abandoned cart timer: trigger nudge if closed/idle
      sessionStorage.setItem('digisoft_abandoned_cart', JSON.stringify(cart));
      sessionStorage.setItem('digisoft_checkout_entered', 'true');
    });
  }
  if (closeCheckout && checkoutOverlay) {
    closeCheckout.addEventListener('click', () => {
      checkoutOverlay.classList.remove('active');
      localStorage.removeItem('digisoft_checkout_active');
      updateBodyScrollState();
    });
  }

  // Restore active checkout state on load if cart is not empty
  const savedCheckoutActive = localStorage.getItem('digisoft_checkout_active') === 'true';
  if (savedCheckoutActive && checkoutOverlay && cart.length > 0) {
    checkoutOverlay.classList.add('active');
    // Safety cleanup: Ensure sibling overlays are hidden
    document.getElementById('razorpay-sim-overlay')?.classList.remove('active');
    document.getElementById('order-success-overlay')?.classList.remove('active');
    updateBodyScrollState();
  } else {
    // If not restoring checkout overlay, clean up all overlay classes
    ['checkout-overlay', 'razorpay-sim-overlay', 'order-success-overlay'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
    updateBodyScrollState();
  }

  // Hook up Coupon Code listener
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-code-input');
  const couponMsg = document.getElementById('coupon-message');

  if (applyCouponBtn && couponInput && couponMsg) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      if (!code) {
        appliedCoupon = null;
        calculateCheckoutTotals();
        couponMsg.textContent = "";
        couponMsg.className = "";
        return;
      }

      const validCodes = ['WELCOME10', 'GIFT15', 'FESTIVE25', 'DIGI500'];
      if (!validCodes.includes(code)) {
        couponMsg.textContent = "Invalid Coupon Code.";
        couponMsg.className = "error";
        appliedCoupon = null;
        calculateCheckoutTotals();
        return;
      }

      if (code === 'DIGI500' && subtotal < 1500) {
        couponMsg.textContent = "Flat ₹500 off requires minimum subtotal of ₹1,500.";
        couponMsg.className = "error";
        appliedCoupon = null;
        calculateCheckoutTotals();
        return;
      }

      appliedCoupon = code;
      calculateCheckoutTotals();
      couponMsg.textContent = `Coupon ${code} applied successfully!`;
      couponMsg.className = "success";
      
      // Trigger satisfying confetti blast
      if (confetti) {
        confetti.start(1500, 60);
      }
    });
  }

  // Hook up Loyalty points check box listener
  const redeemCheckbox = document.getElementById('redeem-points-checkbox');
  if (redeemCheckbox) {
    redeemCheckbox.addEventListener('change', () => {
      calculateCheckoutTotals();
    });
  }

  // Fetch Loyalty points when phone number is input
  if (phoneInput) {
    phoneInput.addEventListener('change', async (e) => {
      const phone = e.target.value.trim();
      if (phone.length >= 10) {
        try {
          const customerDoc = await getDoc(doc(db, 'customers', phone));
          let points = 0;
          if (customerDoc.exists()) {
            points = customerDoc.data().loyaltyPoints || 0;
          }
          loyaltyPointsBalance = points;
          
          const pointsBalEl = document.getElementById('loyalty-points-balance');
          if (pointsBalEl) pointsBalEl.textContent = points;

          const redeemContainer = document.getElementById('loyalty-redeem-container');
          if (points > 0 && redeemContainer) {
            redeemContainer.style.display = 'block';
          } else if (redeemContainer) {
            redeemContainer.style.display = 'none';
            if (redeemCheckbox) redeemCheckbox.checked = false;
          }
          calculateCheckoutTotals();
        } catch (err) {
          console.error("Error fetching loyalty points:", err);
        }
      }
    });
  }

  // Hook up custom Clickable Payment Selector Cards
  const payCardCod = document.getElementById('pay-card-cod');
  const payCardOnline = document.getElementById('pay-card-online');
  const payModeCodInput = document.getElementById('pay-mode-cod');
  const payModeOnlineInput = document.getElementById('pay-mode-online');

  if (payCardCod && payCardOnline && payModeCodInput && payModeOnlineInput) {
    payCardCod.addEventListener('click', () => {
      payCardCod.classList.add('active');
      payCardOnline.classList.remove('active');
      payModeCodInput.checked = true;
      payCardCod.style.borderColor = 'var(--primary)';
      payCardCod.style.background = 'rgba(197, 160, 89, 0.08)';
      payCardOnline.style.borderColor = 'var(--glass-border)';
      payCardOnline.style.background = 'rgba(255, 255, 255, 0.02)';
      
      // Update checkout totals in case payment mode selection affects calculations later
      calculateCheckoutTotals();
    });

    payCardOnline.addEventListener('click', () => {
      payCardOnline.classList.add('active');
      payCardCod.classList.remove('active');
      payModeOnlineInput.checked = true;
      payCardOnline.style.borderColor = 'var(--primary)';
      payCardOnline.style.background = 'rgba(197, 160, 89, 0.08)';
      payCardCod.style.borderColor = 'var(--glass-border)';
      payCardCod.style.background = 'rgba(255, 255, 255, 0.02)';
      
      calculateCheckoutTotals();
    });
  }

  const saveOrderAndCompleteCheckout = async (newOrder) => {
    // Deduct Stock levels in Firestore
    products = getProducts();
    for (const cartItem of newOrder.items) {
      const p = products.find(prod => prod.id === cartItem.product.id);
      if (p) {
        const newStock = Math.max(0, p.stock - cartItem.quantity);
        await updateDoc(doc(db, 'products', p.id.toString()), { stock: newStock });
      }
    }

    await setDoc(doc(db, 'orders', newOrder.id), newOrder);

    // Update Loyalty Points in Firestore
    if (newOrder.customer.phone) {
      const customerRef = doc(db, 'customers', newOrder.customer.phone);
      try {
        const customerDoc = await getDoc(customerRef);
        let currentPoints = 0;
        if (customerDoc.exists()) {
          currentPoints = customerDoc.data().loyaltyPoints || 0;
        }
        
        const newBalance = Math.max(0, currentPoints - (newOrder.loyaltyPointsRedeemed || 0) + (newOrder.loyaltyPointsEarned || 0));
        
        await setDoc(customerRef, {
          name: newOrder.customer.name,
          email: newOrder.customer.email,
          phone: newOrder.customer.phone,
          loyaltyPoints: newBalance,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        
        console.log(`Loyalty points updated for ${newOrder.customer.phone}: ${newBalance} points`);
      } catch (err) {
        console.error("Error updating customer loyalty points in Firestore:", err);
      }
    }

    // Compile Invoice HTML
    const successInvoiceContent = document.getElementById('success-invoice-content');
    if (successInvoiceContent) {
      const dateStr = new Date(newOrder.timestamp).toLocaleDateString('en-IN');
      successInvoiceContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--primary); padding-bottom:12px; margin-bottom:15px;">
          <div>
            <h3 style="margin:0; font-size:1.4rem; font-weight:800; color:var(--text-main); letter-spacing:-0.5px;">DIGISOFT</h3>
            <p style="margin:0; font-size:0.75rem; color:var(--text-muted);">Premium Gifts & Dinnerware</p>
          </div>
          <div style="text-align:right;">
            <span style="background:var(--primary); color:#000; font-size:0.7rem; font-weight:800; padding:3px 8px; border-radius:50px; text-transform:uppercase; letter-spacing:0.5px;">
              ${newOrder.paymentMode === 'COD' ? 'COD Pending' : 'Paid'}
            </span>
            <p style="margin:3px 0 0 0; font-size:0.75rem; color:var(--text-muted);">INV-${newOrder.id.substring(3)}</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px; font-size:0.82rem; line-height:1.4; border-bottom:1px solid var(--glass-border); padding-bottom:12px; margin-bottom:15px; color:var(--text-muted);">
          <div>
            <h5 style="color:var(--primary); font-size:0.75rem; text-transform:uppercase; margin:0 0 5px 0; letter-spacing:0.5px;">Shipping To:</h5>
            <p style="margin:0 0 2px 0; color:var(--text-main); font-weight:600;">${newOrder.customer.name}</p>
            <p style="margin:0 0 2px 0;">Phone: ${newOrder.customer.phone}</p>
            <p style="margin:0;">Address: ${newOrder.customer.address}</p>
          </div>
          <div>
            <h5 style="color:var(--primary); font-size:0.75rem; text-transform:uppercase; margin:0 0 5px 0; letter-spacing:0.5px;">Order Info:</h5>
            <p style="margin:0 0 2px 0;">Date: ${dateStr}</p>
            <p style="margin:0 0 2px 0;">Method: ${newOrder.paymentMode}</p>
            <p style="margin:0;">AWB: BD-AWB-${newOrder.id.substring(3)}</p>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:15px; font-size:0.82rem; color:var(--text-main);">
          <thead>
            <tr style="border-bottom:1px solid var(--glass-border); text-align:left; color:var(--primary); font-size:0.75rem; text-transform:uppercase;">
              <th style="padding:6px 0;">Item Description</th>
              <th style="padding:6px 0; text-align:center; width:50px;">Qty</th>
              <th style="padding:6px 0; text-align:right; width:80px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${newOrder.items.map(item => `
              <tr style="border-bottom:1px dashed var(--glass-border);">
                <td style="padding:8px 0; color:var(--text-main); font-weight:600;">${item.product.name}</td>
                <td style="padding:8px 0; text-align:center; color:var(--text-muted);">${item.quantity}</td>
                <td style="padding:8px 0; text-align:right; color:var(--text-main);">₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align:right; font-size:0.82rem; display:flex; flex-direction:column; gap:5px; border-top:1px solid var(--glass-border); padding-top:10px; color:var(--text-muted);">
          <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span> <span style="font-weight:600; color:var(--text-main);">₹${newOrder.subtotal.toLocaleString('en-IN')}</span></div>
          
          ${newOrder.couponApplied ? `
            <div style="display:flex; justify-content:space-between; color:var(--primary);">
              <span>Discount (${newOrder.couponApplied}):</span> 
              <span>-₹${newOrder.couponDiscount.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between;"><span>GST (18%):</span> <span style="color:var(--text-main);">₹${newOrder.tax.toLocaleString('en-IN')}</span></div>
          
          ${newOrder.loyaltyPointsRedeemed ? `
            <div style="display:flex; justify-content:space-between; color:#38a169;">
              <span>Points Redeemed:</span> 
              <span>-₹${newOrder.loyaltyPointsRedeemed.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:800; color:var(--primary); border-top:2px double var(--primary); padding-top:8px; margin-top:5px;">
            <span>Grand Total:</span> 
            <span>₹${newOrder.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div style="margin-top:15px; background:rgba(197, 160, 89, 0.05); border:1.5px dashed rgba(197, 160, 89, 0.2); padding:10px; border-radius:8px; text-align:center; font-size:0.75rem; color:var(--text-main);">
          🎉 You earned <b>${newOrder.loyaltyPointsEarned} Loyalty Points</b> on this purchase!
        </div>
      `;
    }

    // Clear Cart states
    cart = [];
    updateCartUI();
    sessionStorage.removeItem('digisoft_abandoned_cart');
    sessionStorage.removeItem('digisoft_checkout_entered');
    localStorage.removeItem('digisoft_checkout_active');

    // Clear saved checkout inputs
    localStorage.removeItem('digisoft_checkout_name');
    localStorage.removeItem('digisoft_checkout_email');
    localStorage.removeItem('digisoft_checkout_phone');
    localStorage.removeItem('digisoft_checkout_address');
    
    const nameInput = document.getElementById('cust-name');
    const emailInput = document.getElementById('cust-email');
    const phoneInput = document.getElementById('cust-phone');
    const addressInput = document.getElementById('cust-address');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (addressInput) addressInput.value = '';
    
    checkoutOverlay.classList.remove('active');
    const simOverlay = document.getElementById('razorpay-sim-overlay');
    if (simOverlay) {
      simOverlay.classList.remove('active');
    }
    renderProducts();
    
    // Open Order Success Modal (Invoice Display)
    const successOverlay = document.getElementById('order-success-overlay');
    if (successOverlay) {
      successOverlay.classList.add('active');
    }
    updateBodyScrollState();

    showToast("Order Confirmed!", `Your order ${newOrder.id} has been placed.`, "success");
    
    // Trigger full screen checkout confetti celebration
    if (confetti) {
      confetti.start(4000, 150);
    }
  };

  // Handle Checkout submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('cust-name').value;
      const email = document.getElementById('cust-email').value;
      const phone = document.getElementById('cust-phone').value;
      const address = document.getElementById('cust-address').value;
      const paymentMode = document.querySelector('input[name="payment-mode"]:checked').value;

      // Calculate totals dynamically
      const calculations = calculateCheckoutTotals();
      const orderId = "OD-" + Math.floor(100000 + Math.random() * 900000);

      const newOrder = {
        id: orderId,
        customer: { name, email, phone, address },
        items: [...cart],
        subtotal: calculations.subtotal,
        couponApplied: calculations.couponApplied,
        couponDiscount: calculations.couponDiscount,
        tax: calculations.tax,
        loyaltyPointsRedeemed: calculations.loyaltyPointsRedeemed,
        loyaltyPointsEarned: calculations.loyaltyPointsEarned,
        total: calculations.total,
        paymentMode,
        paymentStatus: paymentMode === "ONLINE" ? "Paid" : "COD Pending",
        status: "Pending",
        courierStatus: "Pending",
        timestamp: new Date().toISOString()
      };

      if (paymentMode === "ONLINE") {
        if (RAZORPAY_KEY_ID === "YOUR_RAZORPAY_TEST_KEY_ID") {
          // If the user hasn't configured their key, show a friendly warning and use the simulated modal as a fallback
          const simOverlay = document.getElementById('razorpay-sim-overlay');
          const simOrderId = document.getElementById('razorpay-sim-order-id');
          const simAmount = document.getElementById('razorpay-sim-amount');
          
          showToast("Demo Mode", "Please configure your Razorpay Key ID at the top of src/main.js to see the real UPI & QR screen. Opening demo simulator.", "warning");
          
          if (simOverlay && simOrderId && simAmount) {
            simOrderId.textContent = newOrder.id;
            simAmount.textContent = `₹${newOrder.total.toLocaleString('en-IN')}`;
            simOverlay.classList.add('active');
            updateBodyScrollState();
            
            // Bind button events
            const successBtn = document.getElementById('razorpay-sim-success-btn');
            const failBtn = document.getElementById('razorpay-sim-fail-btn');
            const cancelBtn = document.getElementById('razorpay-sim-cancel-btn');
            
            const cleanup = () => {
              simOverlay.classList.remove('active');
              updateBodyScrollState();
            };
            
            successBtn.onclick = async () => {
              cleanup();
              newOrder.paymentStatus = "Paid";
              newOrder.transactionId = "pay_mock_" + Math.floor(10000000 + Math.random() * 90000000);
              await saveOrderAndCompleteCheckout(newOrder);
            };
            
            failBtn.onclick = () => {
              cleanup();
              showToast("Payment Failed", "The simulated transaction was rejected by Razorpay.", "warning");
            };
            
            cancelBtn.onclick = () => {
              cleanup();
              showToast("Payment Cancelled", "You cancelled the simulated payment transaction.", "warning");
            };
          } else {
            // Fallback if overlay element is missing
            showToast("Simulation Error", "Mock payment interface not found. Placing order via COD.", "warning");
            newOrder.paymentMode = "COD";
            newOrder.paymentStatus = "COD Pending";
            await saveOrderAndCompleteCheckout(newOrder);
          }
          return;
        }

        // Open the official Razorpay Checkout window
        if (typeof Razorpay === "undefined") {
          showToast("Razorpay SDK not loaded", "Razorpay script failed to load. Placing order via COD.", "warning");
          newOrder.paymentMode = "COD";
          newOrder.paymentStatus = "COD Pending";
          await saveOrderAndCompleteCheckout(newOrder);
          return;
        }

        const options = {
          "key": RAZORPAY_KEY_ID,
          "amount": Math.round(newOrder.total * 100), // amount in paise
          "currency": "INR",
          "name": "Digisoft Gift Shop",
          "description": `Payment for Order ${newOrder.id}`,
          "image": "https://img.icons8.com/color/96/gift.png",
          "handler": async function (response) {
            newOrder.paymentStatus = "Paid";
            newOrder.transactionId = response.razorpay_payment_id;
            await saveOrderAndCompleteCheckout(newOrder);
          },
          "prefill": {
            "name": name,
            "email": email,
            "contact": phone
          },
          "theme": {
            "color": "#C5A059"
          },
          "modal": {
            "ondismiss": function() {
              showToast("Payment Cancelled", "You closed the payment popup.", "warning");
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        await saveOrderAndCompleteCheckout(newOrder);
      }
    });
  }

  // Bind Order Success Modal buttons
  const successOverlay = document.getElementById('order-success-overlay');
  const closeSuccess = document.getElementById('close-success-modal-btn');
  const continueShopping = document.getElementById('continue-shopping-btn');
  const printSuccessInvoice = document.getElementById('print-success-invoice-btn');

  if (closeSuccess && successOverlay) {
    closeSuccess.addEventListener('click', () => {
      successOverlay.classList.remove('active');
      updateBodyScrollState();
    });
  }
  if (continueShopping && successOverlay) {
    continueShopping.addEventListener('click', () => {
      successOverlay.classList.remove('active');
      updateBodyScrollState();
    });
  }
  if (printSuccessInvoice) {
    printSuccessInvoice.addEventListener('click', () => {
      const printContents = document.getElementById('success-invoice-content').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Tax Invoice - Digisoft</title>
            <style>
              body { font-family: 'Outfit', 'Segoe UI', sans-serif; color: #2d3748; padding: 40px; line-height: 1.5; background: #fff !important; }
              table { width: 100%; border-collapse: collapse; margin: 25px 0; }
              th { background: #f7fafc; border-bottom: 2px solid #2d3748; padding: 12px; text-align: left; color: #1a202c !important; font-size: 0.8rem; text-transform: uppercase; }
              td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #2d3748 !important; font-size: 0.85rem; }
              h3, h4, h5, p, span, b { color: #1a202c !important; }
              .header { border-bottom: 3px solid #1a202c; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
              .title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; color: #1a202c; }
              .meta-right { text-align: right; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="header">
              <div>
                <div class="title">DIGISOFT GIFT SHOP</div>
                <p style="font-size:0.9rem; margin-top:5px; color:#555;">Omnichannel Commerce Solutions</p>
              </div>
              <div class="meta-right">
                <h3 style="margin:0; font-size:1.3rem;">TAX INVOICE</h3>
              </div>
            </div>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  }
};


// Conversational AI Bot Logic on storefront
const initStoreChatbot = () => {
  const trigger = document.getElementById('chat-trigger');
  const windowEl = document.getElementById('chat-window');
  const closeBtn = document.getElementById('close-chat-widget');
  const sendBtn = document.getElementById('chat-widget-send');
  const inputEl = document.getElementById('chat-widget-input');
  const chatBody = document.getElementById('chat-widget-messages');

  if (!trigger || !windowEl || !closeBtn || !sendBtn || !inputEl || !chatBody) return;

  let chatCheckoutState = null;

  trigger.addEventListener('click', () => {
    windowEl.classList.toggle('active');
  });

  closeBtn.addEventListener('click', () => {
    windowEl.classList.remove('active');
  });

  const appendMsg = (sender, text) => {
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  };

  const getAIResponse = (text) => {
    const typing = appendMsg('typing', 'typing...');
    const normText = text.toLowerCase().trim();

    let reply = "";

    // A. Check if we are waiting for user details to complete chat checkout
    if (chatCheckoutState) {
      const nameMatch = text.match(/name:\s*([^\n]+)/i);
      const emailMatch = text.match(/email:\s*([^\n]+)/i);
      const phoneMatch = text.match(/phone:\s*([^\n]+)/i);
      const addressMatch = text.match(/address:\s*([^\n]+)/i);

      if (nameMatch && emailMatch && phoneMatch && addressMatch) {
        if (cart.length === 0) {
          setTimeout(() => {
            typing.remove();
            appendMsg('bot', "Oops! Your shopping cart is empty. Please select a product first by typing 'buy [product name]'.");
            chatCheckoutState = null;
          }, 1000);
          return;
        }

        const orderId = "OD-" + Math.floor(100000 + Math.random() * 900000);
        let subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        let tax = subtotal * 0.18;
        let total = subtotal + tax;

        const newOrder = {
          id: orderId,
          customer: {
            name: nameMatch[1].trim(),
            email: emailMatch[1].trim(),
            phone: phoneMatch[1].trim(),
            address: addressMatch[1].trim()
          },
          items: [...cart],
          subtotal,
          tax,
          total,
          paymentMode: "COD",
          paymentStatus: "COD Pending",
          status: "Pending",
          courierStatus: "Pending",
          timestamp: new Date().toISOString()
        };

        setTimeout(async () => {
          typing.remove();
          await saveOrderAndCompleteCheckout(newOrder);
          appendMsg('bot', `🎉 **Order Placed Successfully via Chat!**\n\n*Order ID:* **${orderId}**\n*Total:* ₹${total.toLocaleString('en-IN')}\n*Payment:* Cash on Delivery\n\nWe have registered your details in the ERP. A confirmation invoice alert has been sent to your WhatsApp number: **${newOrder.customer.phone}**! 🚚`);
          chatCheckoutState = null;
        }, 1500);
        return;
      } else {
        // Some details missing
        setTimeout(() => {
          typing.remove();
          appendMsg('bot', `I received your input, but I need all delivery details in the exact format to confirm your order. Please reply with:\n\n**Name: [Your Name]**\n**Email: [Your Email]**\n**Phone: [WhatsApp Number]**\n**Address: [Delivery Address]**`);
        }, 1000);
        return;
      }
    }
    
    // 1. Order Tracking
    if (normText.includes("track") || normText.match(/od-\d{6}/)) {
      orders = getOrders();
      // Find order ID matches
      const match = normText.match(/od-\d{6}/);
      if (match) {
        const orderId = match[0].toUpperCase();
        const o = orders.find(ord => ord.id === orderId);
        if (o) {
          reply = `🔍 *Order Found!*
          *ID:* ${o.id}
          *Customer:* ${o.customer.name}
          *Total Amount:* ₹${o.total.toLocaleString('en-IN')}
          *Payment Mode:* ${o.paymentMode} (${o.paymentStatus})
          *Courier Status:* ${o.courierStatus} (Internal Status: ${o.status})
          
          Our ERP is showing your package is currently in the *${o.courierStatus}* stage. 🚚`;
        } else {
          reply = `I couldn't find any order with ID *${orderId}* in our database. Can you please double check your order receipt?`;
        }
      } else {
        reply = `To track your shipment, please provide your Order ID in the format *OD-XXXXXX*. (For example: "Track order OD-726481")`;
      }
    }
    // 2. Conversational Sales - Placing Orders via Chat
    else if (normText.includes("buy") || normText.includes("order") || normText.includes("purchase") || normText.includes("checkout")) {
      products = getProducts();
      let matchedProd = null;
      products.forEach(p => {
        const cleanedQuery = normText.replace(/(buy|order|purchase|checkout|item|product|set|box|journal|rose|glass|teapot|plates)/g, "").trim();
        if (cleanedQuery.length >= 2 && (p.name.toLowerCase().includes(cleanedQuery) || cleanedQuery.includes(p.name.toLowerCase()))) {
          matchedProd = p;
        }
      });

      if (matchedProd) {
        addToCart(matchedProd.id);
        chatCheckoutState = { product: matchedProd };
        reply = `🛍️ I've added **${matchedProd.name}** (₹${matchedProd.price.toLocaleString('en-IN')}) to your shopping cart!\n\nTo place your order immediately via chat, please reply with your details in this format:\n\n**Name: [Your Name]**\n**Email: [Your Email]**\n**Phone: [WhatsApp Number]**\n**Address: [Delivery Address]**`;
      } else if (normText.includes("checkout") || normText.includes("cart") || normText.includes("place")) {
        if (cart.length > 0) {
          chatCheckoutState = { checkoutCart: true };
          const itemsStr = cart.map(item => `• ${item.product.name} (x${item.quantity})`).join('\n');
          reply = `Sure! Let's place your order for the items currently in your cart:\n${itemsStr}\n\nPlease reply with your delivery details in this format to complete the checkout:\n\n**Name: [Your Name]**\n**Email: [Your Email]**\n**Phone: [WhatsApp Number]**\n**Address: [Delivery Address]**`;
        } else {
          reply = `Your cart is currently empty! Tell me what product you would like to buy (e.g. *"buy watch set"* or *"order rose"*).`;
        }
      } else {
        reply = `Which item would you like to buy? We have:\n• *Premium Bone China Set* (₹299)\n• *Golden Eternal Rose* (₹129)\n• *Luxury Watch Set* (₹450)\n• *Customized Leather Journal* (₹59)\n\nType *"buy [item name]"* to order!`;
      }
    }
    // 3. Product stock inquiry
    else if (normText.includes("stock") || normText.includes("price") || normText.includes("available") || normText.includes("cost") || normText.includes("have")) {
      products = getProducts();
      let matchedProd = null;
      products.forEach(p => {
        if (
          normText.includes(p.name.toLowerCase()) || 
          p.name.toLowerCase().includes(normText) ||
          (p.department && normText.includes(p.department.toLowerCase())) ||
          (p.category && normText.includes(p.category.toLowerCase())) ||
          (p.subCategory && normText.includes(p.subCategory.toLowerCase()))
        ) {
          matchedProd = p;
        }
      });

      if (matchedProd) {
        const stockStatus = matchedProd.stock > 0 
          ? `We currently have *${matchedProd.stock} units* available in our ERP inventory.`
          : `We are currently *Out of Stock* for this item.`;

        reply = `📦 *Product Inquiry:*
        *Name:* ${matchedProd.name}
        *Price:* ₹${matchedProd.price.toLocaleString('en-IN')}
        *Hierarchy:* ${matchedProd.department || '-'} > ${matchedProd.category || '-'} > ${matchedProd.subCategory || '-'}
        *Tags:* ${matchedProd.fragile ? 'Fragile' : ''} ${matchedProd.microwave ? 'Microwave-Safe' : ''}
        
        ${stockStatus}
        
        👉 *Want to buy this?* Reply with *"buy ${matchedProd.name}"* or *"order ${matchedProd.name}"* to place your order directly via chat!`;
      } else {
        reply = `We carry a wide range of crockery, customized journals, watches, and hampers. What specific item are you looking for? You can ask about "ceramic plates" or "Bone China Set"!`;
      }
    }
    // 4. Microwave safe
    else if (normText.includes("microwave") || normText.includes("safe") || normText.includes("oven")) {
      reply = `🥣 *Microwave & Dishwasher Safety:*
      
      All our *Premium Bone China Sets* and *Matte Ceramic Plates* are certified 100% Microwave and Oven safe. 
      
      Our luxury watch boxes and eternal gold roses are *NOT* safe for microwave use.`;
    }
    // 5. Hindi
    else if (normText.includes("hindi") || normText.includes("हिंदी") || normText.includes("नमस्ते")) {
      reply = `नमस्ते! 🌸 मैं आपकी सहायता हिंदी में भी कर सकता हूँ। 
      आप मुझसे हमारे उपहारों की कीमत, स्टॉक स्तर, या आपके आर्डर के tracking status के बारे में पूछ सकते हैं।`;
    }
    // 6. Default FAQ
    else {
      reply = `I can help you shop and track orders:
      👉 Ask: *"Track order OD-XXXXXX"*
      👉 Ask: *"Do you have crockery in stock?"*
      👉 Ask: *"Show pricing for watch box"*
      👉 Type: *"buy watch set"* or *"order eternal rose"* to order directly via chat!`;
    }

    setTimeout(() => {
      typing.remove();
      appendMsg('bot', reply);
    }, 1000);
  };

  const submitWidgetChat = () => {
    const text = inputEl.value.trim();
    if (!text) return;

    appendMsg('user', text);
    inputEl.value = '';
    getAIResponse(text);
  };

  sendBtn.addEventListener('click', submitWidgetChat);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitWidgetChat();
  });
};

// Search Logic
const initSearch = () => {
  const searchBtn = document.getElementById('search-btn');
  const closeBtn = document.getElementById('close-search');
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const productSection = document.getElementById('featured');

  searchBtn.addEventListener('click', () => {
    overlay.classList.add('active');
    setTimeout(() => input.focus(), 500);
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.department && p.department.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(term))
    );
    renderProducts(filtered);
    renderSearchPreviews(filtered, term);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      overlay.classList.remove('active');
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });
};

// Render Search Previews in Overlay
const renderSearchPreviews = (filteredProducts, term) => {
  const previewContainer = document.getElementById('search-results-preview');
  if (!previewContainer) return;

  if (!term) {
    previewContainer.innerHTML = '';
    return;
  }

  if (filteredProducts.length === 0) {
    previewContainer.innerHTML = `
      <div style="grid-column: 1/-1; padding: 20px; color: var(--text-muted);">
        <p>No results found for "${term}"</p>
      </div>
    `;
    return;
  }

  previewContainer.innerHTML = filteredProducts.slice(0, 4).map(product => `
    <div class="preview-item" onclick="document.getElementById('search-input').value = '${product.name}'; document.getElementById('search-input').dispatchEvent(new Event('keydown', {key: 'Enter'})); ">
      <img src="${product.image}" alt="${product.name}">
      <h4>${product.name}</h4>
      <p>₹${product.price.toLocaleString('en-IN')}</p>
    </div>
  `).join('');
};

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.padding = '1rem 5%';
    nav.style.background = 'rgba(10, 10, 10, 0.95)';
  } else {
    nav.style.padding = '1.5rem 5%';
    nav.style.background = 'rgba(10, 10, 10, 0.8)';
  }
});

const erpHierarchy = {
  "Crockery & Dining": {
    "Dinnerware": ["Dinner Sets", "Dinner Plates", "Quarter Plates", "Side Plates", "Bowls", "Soup Bowls", "Serving Bowls"],
    "Drinkware": ["Tea Cups & Saucers", "Coffee Mugs", "Glasses", "Wine Glasses", "Beer Mugs", "Water Tumblers", "Shot Glasses"],
    "Serveware": ["Serving Trays", "Platters", "Cake Stands", "Serving Dishes", "Dip Bowls", "Snack Sets"],
    "Kitchen Containers": ["Storage Jars", "Spice Containers", "Oil Bottles", "Lunch Boxes", "Airtight Containers"]
  },
  "Kitchen & Cooking": {
    "Cookware": ["Kadhai", "Frying Pan", "Sauce Pan", "Casserole", "Pressure Cooker"],
    "Kitchen Tools": ["Knives", "Peelers", "Choppers", "Graters", "Measuring Cups"],
    "Baking": ["Cake Moulds", "Baking Trays", "Rolling Pins", "Cookie Cutters"]
  },
  "Home Décor": {
    "Decorative Items": ["Showpieces", "Figurines", "Decorative Bowls", "Decorative Trays"],
    "Wall Décor": ["Wall Clocks", "Wall Art", "Paintings", "Mirrors", "Wall Shelves"]
  },
  "Gifting": {
    "Gift Sets": ["Tea Set Gifts", "Dinner Set Gifts", "Home Décor Gift Packs"],
    "Festival Gifts": ["Diwali Gifts", "Rakhi Gifts"],
    "Wedding Gifts": ["Wedding Gifts", "Anniversary Gifts", "Corporate Gifts", "Customized Mugs", "Gift Hampers", "Executive Gifts"]
  },
  "Religious & Spiritual": {
    "Pooja Items": ["Diyas", "Agarbatti Stands", "Pooja Thalis"],
    "Idols": ["Ganesh Idols", "Lakshmi Idols", "Buddha Statues"]
  },
  "Seasonal Collection": {
    "Festive Collection": ["Diwali Décor", "Christmas Décor", "New Year Décor"],
    "Wedding Collection": ["Return Gifts", "Decorative Trays", "Gift Packing Items"]
  }
};

const initHierarchyFilter = () => {
  const deptSelect = document.getElementById('filter-department');
  const catSelect = document.getElementById('filter-category');
  const subSelect = document.getElementById('filter-subcategory');
  const resetBtn = document.getElementById('reset-filters-btn');
  const categoryCards = document.querySelectorAll('.category-card');
  const productSection = document.getElementById('featured');

  if (!deptSelect || !catSelect || !subSelect) return;

  // Populate departments
  deptSelect.innerHTML = '<option value="">All Departments</option>' + 
    Object.keys(erpHierarchy).map(dept => `<option value="${dept}">${dept}</option>`).join('');

  const updateCategoryOptions = () => {
    const dept = deptSelect.value;
    if (!dept) {
      catSelect.innerHTML = '<option value="">All Categories</option>';
      catSelect.disabled = true;
      subSelect.innerHTML = '<option value="">All Sub Categories</option>';
      subSelect.disabled = true;
    } else {
      catSelect.innerHTML = '<option value="">All Categories</option>' + 
        Object.keys(erpHierarchy[dept]).map(cat => `<option value="${cat}">${cat}</option>`).join('');
      catSelect.disabled = false;
      subSelect.innerHTML = '<option value="">All Sub Categories</option>';
      subSelect.disabled = true;
    }
  };

  const updateSubCategoryOptions = () => {
    const dept = deptSelect.value;
    const cat = catSelect.value;
    if (!dept || !cat) {
      subSelect.innerHTML = '<option value="">All Sub Categories</option>';
      subSelect.disabled = true;
    } else {
      subSelect.innerHTML = '<option value="">All Sub Categories</option>' + 
        erpHierarchy[dept][cat].map(sub => `<option value="${sub}">${sub}</option>`).join('');
      subSelect.disabled = false;
    }
  };

  const applyFilters = () => {
    const dept = deptSelect.value;
    const cat = catSelect.value;
    const sub = subSelect.value;

    let filtered = products;

    if (dept) {
      filtered = filtered.filter(p => p.department === dept);
    }
    if (cat) {
      filtered = filtered.filter(p => p.category === cat);
    }
    if (sub) {
      filtered = filtered.filter(p => p.subCategory === sub);
    }

    renderProducts(filtered);

    // Update dynamic breadcrumbs in UI
    const breadcrumbs = document.querySelector('.breadcrumbs-container');
    if (breadcrumbs) {
      let html = `<a href="#home" style="transition: color 0.3s;">Home</a> &nbsp;/&nbsp; <a href="#categories" style="transition: color 0.3s;">Shop</a>`;
      if (dept) {
        html += ` &nbsp;/&nbsp; <span style="font-weight: 500;">${dept}</span>`;
      }
      if (cat) {
        html += ` &nbsp;/&nbsp; <span style="font-weight: 500;">${cat}</span>`;
      }
      if (sub) {
        html += ` &nbsp;/&nbsp; <span style="color: var(--primary); font-weight: 600;">${sub}</span>`;
      } else {
        html += ` &nbsp;/&nbsp; <span style="color: var(--primary); font-weight: 600;">Featured Treasures</span>`;
      }
      breadcrumbs.innerHTML = html;
    }
  };

  deptSelect.addEventListener('change', () => {
    updateCategoryOptions();
    applyFilters();
  });

  catSelect.addEventListener('change', () => {
    updateSubCategoryOptions();
    applyFilters();
  });

  subSelect.addEventListener('change', applyFilters);

  resetBtn?.addEventListener('click', () => {
    deptSelect.value = "";
    updateCategoryOptions();
    applyFilters();
  });

  // Connect visual Category Cards to the hierarchical filter bar
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const categoryTitle = card.querySelector('h3').textContent.trim();
      
      if (categoryTitle.includes("Customized")) {
        deptSelect.value = "Gifting";
        updateCategoryOptions();
        catSelect.value = "Wedding Gifts";
        updateSubCategoryOptions();
        subSelect.value = "Executive Gifts";
      } else if (categoryTitle.includes("Dinner Sets")) {
        deptSelect.value = "Crockery & Dining";
        updateCategoryOptions();
        catSelect.value = "Dinnerware";
        updateSubCategoryOptions();
        subSelect.value = "Dinner Sets";
      } else if (categoryTitle.includes("Serveware")) {
        deptSelect.value = "Crockery & Dining";
        updateCategoryOptions();
        catSelect.value = "Serveware";
        updateSubCategoryOptions();
        subSelect.value = "";
      } else if (categoryTitle.includes("Hampers") || categoryTitle.includes("Combo")) {
        deptSelect.value = "Gifting";
        updateCategoryOptions();
        catSelect.value = "Wedding Gifts";
        updateSubCategoryOptions();
        subSelect.value = "Gift Hampers";
      }

      applyFilters();
      productSection?.scrollIntoView({ behavior: 'smooth' });
    });
  });
};

// Contact Form Submission & Toast Notifications
const initContactForm = () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;

    showToast("Message Sent!", `Thank you, ${name}. We have received your query and will reply to ${email} within 24 hours.`, "success");
    form.reset();
  });
};

// Initialize
const init = () => {
  try {
    // Safety reset for overlays and drawers on page load to prevent persistent active states on refresh
    ['checkout-overlay', 'razorpay-sim-overlay', 'order-success-overlay', 'product-detail-overlay', 'wishlist-drawer', 'cart-drawer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    // Clear persistent active status on page refresh to start clean
    localStorage.removeItem('digisoft_checkout_active');
    localStorage.removeItem('digisoft_cart_checkout_active');

    renderProducts();
    updateCartUI();
    updateWishlistUI();
    initSearch();
    initHierarchyFilter();
    initContactForm();
    initStoreUI();
    initStoreChatbot();
    initProductDetailModal();
  } catch (err) {
    console.error("Error during store initialization:", err);
  }
  
  // Mobile Hamburger Menu Toggle
  const menuToggle = document.getElementById('menu-toggle-btn');
  const navMenu = document.getElementById('nav-links-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      if (navMenu.classList.contains('active')) {
        menuToggle.classList.add('open');
      } else {
        menuToggle.classList.remove('open');
      }
    });

    document.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('open');
      }
    });
  }
  
  // Smooth scroll for nav links (fixed navigation error on invalid/missing selectors)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Close mobile menu on click
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('open');
      }
      
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }
      
      try {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      } catch (err) {
        console.warn(`Could not select target element for smooth scrolling: ${href}`, err);
      }
    });
  });
};

// Use robust readyState check to ensure init runs immediately if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('load', () => {
  document.body.classList.remove('preload');
});


  }, []);

  return (
    <>
      
  <nav>
    <a href="#home" className="logo-container">
      <div className="logo">DIGISOFT</div>
      <div className="logo-tagline">Premium Gift Shop</div>
    </a>
    <ul className="nav-links" id="nav-links-menu">
      <li><a href="#home">Home</a></li>
      <li><a href="#categories">Categories</a></li>
      <li><a href="#featured">Featured</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
      <li className="nav-mobile-only"><a href="tel:+15551234567" style={{"display":"flex","alignItems":"center","gap":"8px"}}><i className="fa-solid fa-phone"></i> Call Helpline</a></li>
      <li className="nav-mobile-only"><a href="/admin" style={{"display":"flex","alignItems":"center","gap":"8px"}}><i className="fa-solid fa-user-gear"></i> Admin Portal</a></li>
    </ul>
    <div className="nav-icons">
      <div className="nav-icon-btn search-trigger" id="search-btn" title="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <div className="nav-icon-btn" id="wishlist-trigger-btn" title="Wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span className="wishlist-badge-count" id="wishlist-count">0</span>
      </div>
      <div className="nav-icon-btn" id="cart-trigger-btn" title="Shopping Cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="cart-badge-count" id="cart-count">0</span>
      </div>
      <a href="tel:+15551234567" className="nav-icon-btn nav-desktop-only" title="Call Helpline">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </a>
      <a href="/admin" className="nav-icon-btn nav-desktop-only" title="Admin Portal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </a>
      {/* Hamburger Menu for Mobile */}
      <div id="menu-toggle-btn" style={{"cursor":"pointer","display":"none"}}>
        <svg className="icon-bars" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg className="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"display":"none"}}>
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
  </nav>

  {/* Search Overlay */}
  <div className="search-overlay" id="search-overlay">
    <div className="close-search" id="close-search">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
    <div className="search-container">
      <input type="text" id="search-input" placeholder="Search for gifts, categories..." />
      <div className="search-hint">Type your search and press <b>Enter</b> to see all results</div>
      <div id="search-results-preview" className="search-results-preview"></div>
    </div>
  </div>

  <header className="hero" id="home">
    <div className="hero-bg">
      <img src="/images/hero.png" alt="Luxury Gifts" />
    </div>
    <div className="hero-content">
      <h1>Crafting Memories with <span style={{"color":"var(--primary)"}}>Exquisite</span> Gifts</h1>
      <p>Explore a curated collection of premium gifts designed to make every moment unforgettable. From personalized
        treasures to luxury hampers.</p>
      <div className="cta-group">
        <button className="btn btn-primary">Shop Collection</button>
        <button className="btn btn-outline">View Categories</button>
      </div>
    </div>
  </header>

  <section className="section" id="categories">
    <div className="section-header">
      <h2>Shop by Category</h2>
      <div className="line"></div>
    </div>
    <div className="category-grid">
      <div className="category-card">
        <img src="/images/customized.png" alt="Customized Gifts" />
        <div className="category-overlay">
          <h3>Customized Gifts</h3>
          <p>Personalized with love</p>
        </div>
      </div>
      <div className="category-card">
        <img src="/images/crockery_dinner_set.png" alt="Dinner Sets" />
        <div className="category-overlay">
          <h3>Dinner Sets</h3>
          <p>Elegant designs for 6+ people</p>
        </div>
      </div>
      <div className="category-card">
        <img src="/images/crockery_teapot.png" alt="Serveware" />
        <div className="category-overlay">
          <h3>Serveware</h3>
          <p>Luxury teapots and bowls</p>
        </div>
      </div>
      <div className="category-card">
        <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop"
          alt="Combo Hampers" />
        <div className="category-overlay">
          <h3>Combo Hampers</h3>
          <p>Premium gift boxes and pairings</p>
        </div>
      </div>
    </div>
  </section>

  <section className="section" id="featured" style={{"background":"var(--bg-surface)"}}>
    <div className="breadcrumbs-container" style={{"maxWidth":"1200px","margin":"0 auto 20px auto","padding":"0 15px","fontSize":"0.85rem","color":"var(--text-muted)","textAlign":"left"}}>
      <a href="#home" style={{"transition":"color 0.3s"}}>Home</a> &nbsp;/&nbsp; 
      <a href="#categories" style={{"transition":"color 0.3s"}}>Shop</a> &nbsp;/&nbsp; 
      <span style={{"color":"var(--primary)","fontWeight":"600"}}>Featured Treasures</span>
    </div>
    <div className="section-header">
      <h2>Featured Treasures</h2>
      <div className="line"></div>
    </div>
    <div style={{"maxWidth":"1200px","margin":"0 auto 2rem auto","padding":"0 15px"}}>
      <div className="filter-controls-bar">
        <div className="filter-select-group">
          <label htmlFor="filter-department">Department</label>
          <select id="filter-department" className="filter-select">
            <option value="">All Departments</option>
          </select>
        </div>
        <div className="filter-select-group">
          <label htmlFor="filter-category">Category</label>
          <select id="filter-category" className="filter-select" disabled>
            <option value="">All Categories</option>
          </select>
        </div>
        <div className="filter-select-group">
          <label htmlFor="filter-subcategory">Sub Category</label>
          <select id="filter-subcategory" className="filter-select" disabled>
            <option value="">All Sub Categories</option>
          </select>
        </div>
        <button id="reset-filters-btn" className="btn btn-outline" style={{"padding":"0.75rem 1.5rem","fontSize":"0.85rem","borderRadius":"8px"}}>Clear Filters</button>
      </div>
    </div>
    <div className="product-grid" id="product-container">
      {/* Loading Skeletons */}
      <div className="product-card skeleton-card">
        <div className="product-img skeleton skeleton-img"></div>
        <div className="product-info">
          <div className="skeleton skeleton-text" style={{"width":"40%","height":"12px","marginBottom":"8px"}}></div>
          <div className="skeleton skeleton-text" style={{"width":"80%","height":"18px","marginBottom":"12px"}}></div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
            <div style={{"flexGrow":"1"}}>
              <div className="skeleton skeleton-text" style={{"width":"50%","height":"16px","marginBottom":"4px"}}></div>
              <div className="skeleton skeleton-text" style={{"width":"30%","height":"10px"}}></div>
            </div>
            <div className="skeleton skeleton-btn" style={{"width":"40px","height":"40px","borderRadius":"50%"}}></div>
          </div>
        </div>
      </div>
      <div className="product-card skeleton-card">
        <div className="product-img skeleton skeleton-img"></div>
        <div className="product-info">
          <div className="skeleton skeleton-text" style={{"width":"45%","height":"12px","marginBottom":"8px"}}></div>
          <div className="skeleton skeleton-text" style={{"width":"75%","height":"18px","marginBottom":"12px"}}></div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
            <div style={{"flexGrow":"1"}}>
              <div className="skeleton skeleton-text" style={{"width":"55%","height":"16px","marginBottom":"4px"}}></div>
              <div className="skeleton skeleton-text" style={{"width":"25%","height":"10px"}}></div>
            </div>
            <div className="skeleton skeleton-btn" style={{"width":"40px","height":"40px","borderRadius":"50%"}}></div>
          </div>
        </div>
      </div>
      <div className="product-card skeleton-card">
        <div className="product-img skeleton skeleton-img"></div>
        <div className="product-info">
          <div className="skeleton skeleton-text" style={{"width":"35%","height":"12px","marginBottom":"8px"}}></div>
          <div className="skeleton skeleton-text" style={{"width":"85%","height":"18px","marginBottom":"12px"}}></div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
            <div style={{"flexGrow":"1"}}>
              <div className="skeleton skeleton-text" style={{"width":"40%","height":"16px","marginBottom":"4px"}}></div>
              <div className="skeleton skeleton-text" style={{"width":"35%","height":"10px"}}></div>
            </div>
            <div className="skeleton skeleton-btn" style={{"width":"40px","height":"40px","borderRadius":"50%"}}></div>
          </div>
        </div>
      </div>
      <div className="product-card skeleton-card">
        <div className="product-img skeleton skeleton-img"></div>
        <div className="product-info">
          <div className="skeleton skeleton-text" style={{"width":"50%","height":"12px","marginBottom":"8px"}}></div>
          <div className="skeleton skeleton-text" style={{"width":"70%","height":"18px","marginBottom":"12px"}}></div>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
            <div style={{"flexGrow":"1"}}>
              <div className="skeleton skeleton-text" style={{"width":"60%","height":"16px","marginBottom":"4px"}}></div>
              <div className="skeleton skeleton-text" style={{"width":"20%","height":"10px"}}></div>
            </div>
            <div className="skeleton skeleton-btn" style={{"width":"40px","height":"40px","borderRadius":"50%"}}></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section className="section" id="about">
    <div className="about-container">
      <div className="about-info">
        <div className="section-header" style={{"textAlign":"left","marginBottom":"30px"}}>
          <h2>Our Story</h2>
          <div className="line" style={{"margin":"0"}}></div>
        </div>
        <h3>Crafting Memories, Delivering Joy</h3>
        <p>At Digisoft Gift Shop, we believe that a gift is more than just an object—it is a tangible expression of love, appreciation, and connection. Established with a passion for premium craftsmanship, we curate an exclusive collection of luxury and bespoke treasures designed to elevate life's special milestones.</p>
        <p>Whether you are celebrating a silver anniversary, thanking a corporate partner, or creating custom-engraved keepsakes, our goal remains the same: to provide premium, elegant, and heartfelt creations that leave an everlasting impression.</p>
      </div>
      <div className="about-pillars">
        <div className="pillar-card">
          <div className="pillar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 13L2 9z"></path>
              <path d="M11 3 8 9l4 13 4-13-3-6"></path>
              <path d="M2 9h20"></path>
            </svg>
          </div>
          <h4>Premium Curation</h4>
          <p>Handpicked luxury items sourced from master artisans globally.</p>
        </div>
        <div className="pillar-card">
          <div className="pillar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 4 5 5"></path>
              <path d="m3 20 12-12"></path>
              <path d="m19 3-1 1"></path>
              <path d="m20 2-2 2"></path>
              <path d="M13 2v2"></path>
              <path d="M9 3H7"></path>
            </svg>
          </div>
          <h4>Bespoke Customization</h4>
          <p>Personalized engraving and custom designs tailored to your vision.</p>
        </div>
        <div className="pillar-card">
          <div className="pillar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <h4>Worldwide Shipping</h4>
          <p>Secure, premium packaging with reliable global delivery services.</p>
        </div>
      </div>
    </div>
  </section>

  <section className="section" id="contact" style={{"background":"var(--bg-surface)"}}>
    <div className="section-header">
      <h2>Get in Touch</h2>
      <div className="line"></div>
    </div>
    <div className="contact-container">
      <div className="contact-details">
        <h3>We'd Love to Hear From You</h3>
        <p>Have questions about customizations, bulk corporate orders, or delivery? Reach out to our customer care team. We are here to assist you.</p>
        
        <div className="contact-info-list">
          <div className="contact-info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="info-text">
              <h4>Our Gallery</h4>
              <p>101, Luxury Boulevard, Suite A, New York, NY 10001</p>
            </div>
          </div>
          <div className="contact-info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="info-text">
              <h4>Call Us</h4>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="contact-info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div className="info-text">
              <h4>Email Support</h4>
              <p>support@digisoftgiftshop.com</p>
            </div>
          </div>
          <div className="contact-info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="info-text">
              <h4>Hours of Operation</h4>
              <p>Mon - Sat: 9:00 AM - 8:00 PM <br />Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-form-container">
        <form className="contact-form" id="contact-form">
          <div className="form-row">
            <div className="form-group">
              <input type="text" id="contact-name" required placeholder=" " />
              <label htmlFor="contact-name">Your Full Name</label>
            </div>
            <div className="form-group">
              <input type="email" id="contact-email" required placeholder=" " />
              <label htmlFor="contact-email">Email Address</label>
            </div>
          </div>
          <div className="form-group">
            <input type="text" id="contact-subject" required placeholder=" " />
            <label htmlFor="contact-subject">Subject</label>
          </div>
          <div className="form-group">
            <textarea id="contact-message" rows="5" required placeholder=" "></textarea>
            <label htmlFor="contact-message">Your Message</label>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            <span>Send Message</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"marginLeft":"8px","display":"inline-block","verticalAlign":"middle"}}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  </section>

  <footer>
    <div className="footer-grid">
      <div className="footer-col">
        <div className="logo" style={{"marginBottom":"20px"}}>DIGISOFT</div>
        <p style={{"color":"var(--text-muted)"}}>The world's premier destination for luxury gifting and personalized experiences. Crafting memories that last a lifetime.</p>
        <div className="social-links">
          <a href="#" className="social-icon" aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" className="social-icon" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="#" className="social-icon" aria-label="Twitter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="#" className="social-icon" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Explore</h4>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#categories">Categories</a></li>
          <li><a href="#featured">Featured</a></li>
          <li><a href="#about">About Us</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Support</h4>
        <ul>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Shipping Info</a></li>
          <li><a href="#">Return Policy</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Stay Inspired</h4>
        <div className="newsletter-box">
          <p style={{"color":"var(--text-muted)"}}>Join our exclusive circle for new arrivals and gift inspiration.</p>
          <div className="input-group">
            <input type="email" placeholder="Your Email Address" />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>&copy; 2026 Digisoft Gift Shop. All rights reserved.</p>
      <div className="dev-credit">
        Developed by <span>Digify Soft Solutions</span>
      </div>
    </div>
  </footer>



  {/* Cart Drawer */}
  <div className="cart-drawer" id="cart-drawer">
    <div className="cart-header">
      <h3>Your Gift Cart</h3>
      <div className="close-cart" id="close-cart-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
    <div className="cart-body" id="cart-body-items">
      {/* Dynamic cart rows will go here */}
    </div>
    <div className="cart-footer">
      <div className="price-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
      <div className="price-row"><span>GST (18%)</span><span id="cart-tax">$0.00</span></div>
      <div className="price-row total"><span>Total Amount</span><span id="cart-total">$0.00</span></div>
      <button className="btn btn-primary btn-block" id="checkout-btn">Proceed to Checkout</button>
    </div>
  </div>

  {/* Wishlist Drawer */}
  <div className="cart-drawer" id="wishlist-drawer">
    <div className="cart-header">
      <h3>Your Gift Wishlist</h3>
      <div className="close-cart" id="close-wishlist-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
    <div className="cart-body" id="wishlist-body-items">
      {/* Dynamic wishlist rows will go here */}
    </div>
  </div>

  {/* Checkout Modal */}
  <div className="checkout-overlay" id="checkout-overlay">
    <div className="checkout-modal">
      <div className="close-checkout" id="close-checkout-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h2>Order Checkout</h2>
      <form id="checkout-form-modal">
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <input type="text" id="cust-name" required placeholder=" " />
          <label htmlFor="cust-name">Full Name</label>
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <input type="email" id="cust-email" required placeholder=" " />
          <label htmlFor="cust-email">Email Address</label>
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <input type="tel" id="cust-phone" required placeholder=" " />
          <label htmlFor="cust-phone">WhatsApp Number</label>
        </div>
        <div className="form-group" style={{"marginBottom":"1.5rem"}}>
          <input type="text" id="cust-address" required placeholder=" " />
          <label htmlFor="cust-address">Delivery Address</label>
        </div>
        <div className="payment-group" style={{"marginBottom":"1.5rem"}}>
          <h4 style={{"fontSize":"1rem","fontWeight":"600","marginBottom":"0.8rem","color":"var(--primary)"}}>Payment Mode</h4>
          <div className="payment-cards" style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"12px"}}>
            {/* Hidden original inputs for form submission */}
            <input type="radio" name="payment-mode" id="pay-mode-cod" value="COD" defaultChecked style={{"display":"none"}} />
            <input type="radio" name="payment-mode" id="pay-mode-online" value="ONLINE" style={{"display":"none"}} />
            
            <div className="payment-card active" id="pay-card-cod" style={{"border":"2px solid var(--primary)","background":"rgba(197, 160, 89, 0.05)","padding":"15px","borderRadius":"12px","textAlign":"center","cursor":"pointer","transition":"all 0.3s ease","boxShadow":"0 0 10px rgba(197, 160, 89, 0.1)"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"marginBottom":"6px"}}>
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
              <h5 style={{"margin":"0","color":"var(--text-main)","fontSize":"0.85rem","fontWeight":"600"}}>Cash on Delivery</h5>
              <p style={{"margin":"3px 0 0 0","fontSize":"0.7rem","color":"var(--text-muted)"}}>Pay upon delivery</p>
            </div>
            
            <div className="payment-card" id="pay-card-online" style={{"border":"2px solid var(--glass-border)","background":"var(--glass)","padding":"15px","borderRadius":"12px","textAlign":"center","cursor":"pointer","transition":"all 0.3s ease"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{"marginBottom":"6px"}} className="card-stroke-icon">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <h5 style={{"margin":"0","color":"var(--text-main)","fontSize":"0.85rem","fontWeight":"600"}}>Prepaid Online</h5>
              <p style={{"margin":"3px 0 0 0","fontSize":"0.7rem","color":"var(--text-muted)"}}>Card / UPI / NetBanking</p>
            </div>
          </div>
        </div>
        
        {/* Coupon Code Field */}
        <div className="discount-group" style={{"marginBottom":"1.5rem"}}>
          <h4 style={{"fontSize":"1.0rem","fontWeight":"600","marginBottom":"0.8rem","color":"var(--primary)"}}>Coupon Code</h4>
          <div style={{"display":"flex","gap":"10px"}}>
            <input type="text" id="coupon-code-input" placeholder="Enter coupon (e.g. WELCOME10)" style={{"flexGrow":"1","padding":"10px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","textTransform":"uppercase"}} />
            <button type="button" className="btn btn-outline" id="apply-coupon-btn" style={{"padding":"10px 15px","borderRadius":"8px"}}>Apply</button>
          </div>
          <span id="coupon-message" style={{"fontSize":"0.8rem","display":"block","marginTop":"5px","fontWeight":"600"}}></span>
        </div>
        
        {/* Loyalty Rewards Points Block */}
        <div className="loyalty-group" id="loyalty-redeem-container" style={{"marginBottom":"1.5rem","display":"none"}}>
          <h4 style={{"fontSize":"1.0rem","fontWeight":"600","marginBottom":"0.8rem","color":"var(--primary)"}}>Loyalty Rewards</h4>
          <div style={{"background":"var(--bg-surface)","border":"1px solid var(--glass-border)","padding":"12px","borderRadius":"10px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
            <div>
              <p style={{"fontSize":"0.85rem","margin":"0","color":"var(--text-main)"}}>Available Points: <b id="loyalty-points-balance" style={{"color":"var(--primary)"}}>0</b></p>
              <p style={{"fontSize":"0.75rem","margin":"0","color":"var(--text-muted)"}}>1 Point = ₹1 Discount</p>
            </div>
            <label style={{"display":"flex","alignItems":"center","gap":"8px","cursor":"pointer","fontSize":"0.85rem","fontWeight":"600","color":"var(--text-main)"}}>
              <input type="checkbox" id="redeem-points-checkbox" />
              <span>Redeem Points</span>
            </label>
          </div>
        </div>

        {/* Live Order Summary inside Checkout Modal */}
        <div className="checkout-summary-box" style={{"marginTop":"1.5rem","marginBottom":"1.5rem","background":"var(--bg-surface)","border":"1px solid var(--glass-border)","padding":"1.2rem","borderRadius":"12px","fontSize":"0.9rem"}}>
          <h4 style={{"fontSize":"1.0rem","fontWeight":"600","marginBottom":"0.8rem","color":"var(--primary)","borderBottom":"1px dashed var(--glass-border)","paddingBottom":"5px","marginTop":"0"}}>Order Summary</h4>
          <div id="checkout-summary-items" style={{"maxHeight":"120px","overflowY":"auto","marginBottom":"10px","fontSize":"0.82rem","color":"var(--text-muted)"}}>
            {/* Dynamic items list */}
          </div>
          <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
            <div style={{"display":"flex","justifyContent":"space-between"}}><span>Subtotal:</span> <span id="checkout-subtotal">₹0.00</span></div>
            <div id="checkout-discount-row" style={{"display":"none","justifyContent":"space-between","color":"var(--primary)"}}><span>Coupon Discount:</span> <span id="checkout-discount">-₹0.00</span></div>
            <div style={{"display":"flex","justifyContent":"space-between"}}><span>GST (18%):</span> <span id="checkout-tax">₹0.00</span></div>
            <div id="checkout-loyalty-row" style={{"display":"none","justifyContent":"space-between","color":"#38a169"}}><span>Points Redeemed:</span> <span id="checkout-loyalty-discount">-₹0.00</span></div>
            <div style={{"display":"flex","justifyContent":"space-between","fontWeight":"700","color":"var(--text-main)","fontSize":"1.05rem","borderTop":"1px solid var(--glass-border)","paddingTop":"8px","marginTop":"4px"}}>
              <span>Grand Total:</span> <span id="checkout-grand-total">₹0.00</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" style={{"marginTop":"1rem","width":"100%","display":"flex","justifyContent":"center","alignItems":"center"}}>Confirm & Place Order</button>
      </form>
    </div>
  </div>

  {/* Simulated Razorpay Payment Modal */}
  <div className="checkout-overlay" id="razorpay-sim-overlay">
    <div className="checkout-modal" style={{"width":"420px","maxWidth":"90vw","borderTop":"5px solid var(--primary)","textAlign":"center","padding":"2.5rem 2rem","borderRadius":"20px"}}>
      <div style={{"display":"flex","justifyContent":"center","marginBottom":"15px"}}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h3 style={{"marginBottom":"5px","color":"var(--text-main)"}}>Razorpay Secured Payment</h3>
      <p style={{"color":"var(--text-muted)","fontSize":"0.85rem","marginBottom":"20px"}}>[TEST MODE SIMULATION]</p>
      
      <div style={{"background":"var(--bg-surface)","border":"1px solid var(--glass-border)","borderRadius":"12px","padding":"1.2rem","marginBottom":"25px","textAlign":"left","fontSize":"0.9rem","color":"var(--text-main)"}}>
        <p style={{"marginBottom":"5px"}}><b>Merchant:</b> Digisoft Gift Shop</p>
        <p style={{"marginBottom":"5px"}}><b>Order ID:</b> <span id="razorpay-sim-order-id">OD-XXXXXX</span></p>
        <p><b>Amount:</b> <span id="razorpay-sim-amount" style={{"color":"var(--primary)","fontWeight":"700"}}>₹0.00</span></p>
      </div>
      
      <div style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
        <button className="btn btn-primary" id="razorpay-sim-success-btn" style={{"width":"100%","justifyContent":"center","display":"flex","alignItems":"center","cursor":"pointer"}}>
          Simulate Successful Payment
        </button>
        <button className="btn btn-outline" id="razorpay-sim-fail-btn" style={{"width":"100%","justifyContent":"center","display":"flex","alignItems":"center","borderColor":"#ff4a4a","color":"#ff4a4a","cursor":"pointer"}}>
          Simulate Payment Failure
        </button>
        <button className="btn btn-outline" id="razorpay-sim-cancel-btn" style={{"width":"100%","justifyContent":"center","display":"flex","alignItems":"center","marginTop":"5px","cursor":"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  </div>

  {/* Order Success Receipt Modal */}
  <div className="checkout-overlay" id="order-success-overlay">
    <div className="checkout-modal success-modal" style={{"width":"580px","maxWidth":"95vw"}}>
      <div className="close-checkout" id="close-success-modal-btn" style={{"cursor":"pointer","display":"flex","alignItems":"center"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      
      <div style={{"textAlign":"center","marginBottom":"1.5rem"}}>
        <div style={{"display":"flex","justifyContent":"center","marginBottom":"10px"}}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 style={{"marginBottom":"5px","color":"var(--text-main)"}}>Order Placed Successfully!</h2>
        <p style={{"color":"var(--text-muted)","fontSize":"0.95rem"}}>Your TAX invoice has been generated below.</p>
      </div>

      <div id="success-invoice-content" style={{"background":"var(--bg-surface)","border":"1px solid var(--glass-border)","borderRadius":"12px","padding":"1.5rem","marginBottom":"1.5rem","fontSize":"0.9rem","maxHeight":"280px","overflowY":"auto","color":"var(--text-main)"}}>
        {/* Injected dynamically */}
      </div>

      <div style={{"display":"flex","gap":"1rem"}}>
        <button className="btn btn-outline" id="print-success-invoice-btn" style={{"flex":"1","justifyContent":"center","display":"flex","gap":"8px","alignItems":"center","cursor":"pointer"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg> Print Invoice
        </button>
        <button className="btn btn-primary" id="continue-shopping-btn" style={{"flex":"1","justifyContent":"center","display":"flex","gap":"8px","alignItems":"center","cursor":"pointer"}}>
          Continue
        </button>
      </div>
    </div>
  </div>

  {/* Product Detail Modal */}
  <div className="checkout-overlay" id="product-detail-overlay">
    <div className="checkout-modal details-premium-modal">
      <div className="close-checkout" id="close-detail-modal-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      
      <div className="detail-modal-layout">
        {/* Left column: Image Showcase */}
        <div className="detail-showcase-container">
          <div className="detail-image-wrapper" style={{"position":"relative"}}>
            <img id="detail-product-image" src={null} alt="" />
            <button className="btn btn-outline" id="detail-wishlist-btn" style={{"position":"absolute","top":"15px","right":"15px","zIndex":"10","width":"40px","height":"40px","borderRadius":"50%","padding":"0","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","transition":"var(--transition)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          {/* Features list */}
          <div className="detail-features-grid">
            <div className="detail-feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>100% Genuine</span>
            </div>
            <div className="detail-feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>Secure Shipping</span>
            </div>
          </div>
        </div>
        
        {/* Right column: Info details */}
        <div className="detail-info-container">
          <span id="detail-product-category">Category</span>
          <h2 id="detail-product-name">Product Name</h2>
          
          {/* Rating and Sold Count Badges */}
          <div className="detail-badges-row">
            <div id="detail-rating-pill">
              <span id="detail-product-stars-avg">4.5</span>
              <span>★</span>
            </div>
            <span id="detail-product-rating-text">(12 customer reviews)</span>
            <div id="detail-product-sold-badge">
              150+ sold
            </div>
            <div id="detail-product-stock-badge">
              In Stock
            </div>
          </div>
          
          {/* Comparative Pricing layout */}
          <div className="detail-price-row">
            <div id="detail-product-price">₹0.00</div>
            <div id="detail-product-mrp">₹0.00</div>
            <div id="detail-product-discount">(50% OFF)</div>
          </div>

          {/* Trust assurances badges */}
          <div className="detail-assurances-row">
            <span>⚡ Free Delivery</span>
            <span className="detail-separator">|</span>
            <span>💰 Cash on Delivery</span>
            <span className="detail-separator">|</span>
            <span>🕒 Same Day Ship</span>
          </div>
          
          <div className="detail-desc-container">
            <span className="detail-desc-title">Product Overview</span>
            <p id="detail-product-description">
              Product description goes here.
            </p>
          </div>
          
          {/* Primary Actions */}
          <div className="detail-actions-row">
            <button className="btn btn-primary" id="detail-add-to-cart-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Add to Cart
            </button>
            <button className="btn" id="detail-buy-now-btn">
              ⚡ Buy Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Reviews list & Write Review Form */}
      <div style={{"marginTop":"30px","borderTop":"1px solid var(--glass-border)","paddingTop":"25px"}}>
        <h4 style={{"margin":"0 0 20px 0","fontSize":"1.25rem","color":"var(--text-main)","fontWeight":"800","letterSpacing":"-0.5px","display":"flex","alignItems":"center","gap":"8px"}}>
          <span>Ratings & Reviews</span>
        </h4>
        
        <div className="reviews-split-layout" style={{"display":"grid","gridTemplateColumns":"1.3fr 1fr","gap":"30px","alignItems":"start"}}>
          {/* Left side: reviews list */}
          <div id="detail-reviews-list-container" style={{"maxHeight":"280px","overflowY":"auto","display":"flex","flexDirection":"column","gap":"12px","paddingRight":"10px"}}>
            <p style={{"fontSize":"0.85rem","color":"var(--text-muted)","textAlign":"center","margin":"20px 0"}}>No customer reviews yet. Be the first to review this product!</p>
          </div>
          
          {/* Right side: Rating Distribution & Write review form */}
          <div style={{"display":"flex","flexDirection":"column","gap":"20px"}}>
            {/* Stars Distribution Widget */}
            <div id="rating-distribution-widget" style={{"background":"rgba(255, 255, 255, 0.01)","border":"1px solid var(--glass-border)","borderRadius":"16px","padding":"15px","display":"flex","flexDirection":"column","gap":"8px"}}>
              {/* Stars bars injected here */}
            </div>

            {/* Write review form */}
            <div style={{"background":"rgba(255, 255, 255, 0.02)","border":"1px solid var(--glass-border)","borderRadius":"16px","padding":"18px","boxShadow":"0 8px 32px rgba(0,0,0,0.15)"}}>
              <h5 style={{"margin":"0 0 12px 0","color":"var(--text-main)","fontSize":"0.95rem","fontWeight":"700"}}>Share Your Experience</h5>
              <form id="write-review-form" style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
                <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                  <span style={{"fontSize":"0.75rem","fontWeight":"600","color":"var(--text-muted)"}}>Rate this product:</span>
                  <div className="interactive-star-row" style={{"display":"flex","gap":"6px","fontSize":"1.6rem","color":"rgba(255,255,255,0.15)","cursor":"pointer","userSelect":"none"}}>
                    <span data-val="1">★</span>
                    <span data-val="2">★</span>
                    <span data-val="3">★</span>
                    <span data-val="4">★</span>
                    <span data-val="5">★</span>
                  </div>
                  <input type="hidden" id="review-cust-rating" value="5" />
                </div>
                
                <div style={{"display":"flex","flexDirection":"column","gap":"4px"}}>
                  <input type="text" id="review-cust-name" required placeholder="Your Name" style={{"width":"100%","padding":"10px 12px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","fontSize":"0.85rem","fontFamily":"inherit"}} />
                </div>
                
                <div style={{"display":"flex","flexDirection":"column","gap":"4px"}}>
                  <textarea id="review-cust-comment" required rows="3" placeholder="Write your review here. What did you like or dislike?" style={{"width":"100%","padding":"10px 12px","borderRadius":"8px","background":"var(--glass)","border":"1px solid var(--glass-border)","color":"var(--text-main)","outline":"none","fontSize":"0.85rem","resize":"none","fontFamily":"inherit","lineHeight":"1.4"}}></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary btn-block" style={{"padding":"10px 0","fontSize":"0.85rem","borderRadius":"8px","justifyContent":"center","display":"flex","fontWeight":"700"}}>Submit Review</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  
  
  {/* Success Notification Toast Container */}
  <div className="toast-container" id="toast-container"></div>
  
  {/* Confetti Canvas */}
  <canvas id="confetti-canvas" style={{"position":"fixed","top":"0","left":"0","width":"100vw","height":"100vh","pointerEvents":"none","zIndex":"99999"}}></canvas>

    </>
  );
}
