import Image from 'next/image';

export default function ContactPage() {

  return (
    <main className="container">
      <h1 className="page-title">Contact Us</h1>

      <div className="contact-layout">
        
        {/* Contact Information Side */}
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", color: "var(--dark)", marginBottom: "1rem" }}>
            We&apos;d Love to Hear From You
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "3rem", lineHeight: "1.8" }}>
            Have questions about customized crockery, bulk orders for hotels/restaurants, or home delivery? Reach out to our customer care team.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <i className="fa-solid fa-location-dot" style={{ fontSize: "1.2rem", color: "var(--primary)", marginTop: "4px" }}></i>
              <div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--dark)", marginBottom: "4px" }}>Our Showroom</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>22 Godown Market, Jaipur, Rajasthan</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <i className="fa-solid fa-phone" style={{ fontSize: "1.2rem", color: "var(--primary)", marginTop: "4px" }}></i>
              <div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--dark)", marginBottom: "4px" }}>Call Us</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>+91 (555) 123-4567</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <i className="fa-solid fa-envelope" style={{ fontSize: "1.2rem", color: "var(--primary)", marginTop: "4px" }}></i>
              <div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--dark)", marginBottom: "4px" }}>Email Support</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>support@orientcrockeries.com</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <i className="fa-regular fa-clock" style={{ fontSize: "1.2rem", color: "var(--primary)", marginTop: "4px" }}></i>
              <div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--dark)", marginBottom: "4px" }}>Hours of Operation</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Mon - Sat: 10:00 AM - 8:00 PM<br/>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Card Side */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ 
            width: "100%", 
            height: "100%", 
            minHeight: "400px", 
            borderRadius: "16px", 
            background: "linear-gradient(135deg, var(--bg-alt) 0%, var(--bg-main) 100%)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "3rem",
            textAlign: "center"
          }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              background: "var(--bg-main)", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
              marginBottom: "2rem"
            }}>
              <i className="fa-solid fa-headset" style={{ fontSize: "2rem", color: "var(--primary)" }}></i>
            </div>
            
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--dark)", marginBottom: "1rem" }}>
              We're Here to Help
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: "1.8", marginBottom: "2rem", maxWidth: "80%" }}>
              Whether you need assistance with an existing order, have a question about our premium collections, or want to discuss a bulk requirement, our dedicated support team is ready to assist you.
            </p>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <a href="mailto:support@orientcrockeries.com" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem", borderRadius: "30px", fontSize: "0.9rem", textDecoration: "none" }}>
                <i className="fa-solid fa-envelope" style={{ marginRight: "8px" }}></i> Email Us
              </a>
              <a href="tel:+915551234567" className="btn btn-outline" style={{ padding: "0.8rem 1.5rem", borderRadius: "30px", fontSize: "0.9rem", textDecoration: "none" }}>
                <i className="fa-solid fa-phone" style={{ marginRight: "8px" }}></i> Call Now
              </a>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
