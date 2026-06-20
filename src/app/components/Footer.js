'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="luxury-footer">
      <div className="footer-top-accent"></div>
      <div className="footer-container">
        <div className="footer-grid luxury-footer-grid">
          
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-logo-container">
              <span className="footer-logo">ORIENT</span>
              <span className="footer-logo-tagline">Crockeries</span>
            </div>
            <p className="footer-brand-desc">
              Curating and crafting the world's finest dinnerware, professional cookware, and organic acacia woodcraft for five-star hospitality and exquisite homes since 1994.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Pinterest">
                <i className="fa-brands fa-pinterest-p"></i>
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="footer-nav-col">
            <h4 className="footer-heading">Collections</h4>
            <ul className="footer-links">
              <li><Link href="/catalog?department=Crockery+%26+Dining">Fine Dining</Link></li>
              <li><Link href="/catalog?department=Cookware">Professional Cookware</Link></li>
              <li><Link href="/catalog?department=Woodcraft">Organic Woodcraft</Link></li>
              <li><Link href="/catalog?category=Gift+Sets">Bespoke Gifting</Link></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Maison Orient</h4>
            <ul className="footer-links">
              <li><Link href="/about">Our Heritage</Link></li>
              <li><Link href="/care">Care & Maintenance</Link></li>
              <li><Link href="/contact">Concierge Services</Link></li>
              <li><Link href="/delivery">Shipping & Returns</Link></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom-bar">
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <span className="separator">&bull;</span>
            <a href="#">Terms of Service</a>
            <span className="separator">&bull;</span>
            <a href="#">Cookie Preferences</a>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Orient Crockeries. Developed by <span>Digify Soft Solutions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
