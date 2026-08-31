'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/delivery'))) {
    return null;
  }

  return (
    <footer className="luxury-footer">
      <div className="footer-top-accent"></div>
      

      <div className="footer-container">
        <div className="footer-grid luxury-footer-grid">
          
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-logo-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
              <Image src="/images/logo.jpg" alt="Orient Crockeries Logo" width={65} height={65} style={{ objectFit: 'contain', borderRadius: '4px' }} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="footer-logo" style={{ fontSize: '1.6rem', letterSpacing: '2px', whiteSpace: 'nowrap' }}>Orient Crockeries</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Curating and crafting the world&apos;s finest dinnerware, professional cookware, and organic acacia woodcraft for five-star hospitality and exquisite homes since 1994.
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
              <a href="#" className="social-icon" aria-label="YouTube">
                <i className="fa-brands fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="footer-nav-wrapper">
            <div className="footer-nav-col">
              <h4 className="footer-heading">Collections</h4>
              <ul className="footer-links">
                <li><Link href="/catalog?department=Crockery+%26+Dining">Fine Dining</Link></li>
                <li><Link href="/catalog?department=Cookware">Professional Cookware</Link></li>
                <li><Link href="/catalog?department=Woodcraft">Organic Woodcraft</Link></li>
                <li><Link href="/catalog?category=Gift+Sets">Bespoke Gifting</Link></li>
              </ul>
            </div>

          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Orient Crockeries. Developed by <span>Digify Soft Solutions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
