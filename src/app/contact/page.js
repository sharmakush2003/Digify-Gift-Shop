export default function ContactPage() {
  const inputStyle = {
    width: "100%",
    padding: "1rem",
    border: "1px solid var(--border)",
    background: "var(--bg-main)",
    color: "var(--text-main)",
    fontSize: "0.95rem",
    fontFamily: "var(--font-sans)",
    outline: "none",
    transition: "var(--transition)"
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--text-muted)",
    marginBottom: "0.5rem"
  };

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

        {/* Contact Form Side */}
        <div>
          <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-row">
              <div>
                <label htmlFor="name" style={labelStyle}>Full Name</label>
                <input type="text" id="name" style={inputStyle} placeholder="John Doe" required />
              </div>
              <div>
                <label htmlFor="email" style={labelStyle}>Email Address</label>
                <input type="email" id="email" style={inputStyle} placeholder="john@example.com" required />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" style={labelStyle}>Subject</label>
              <input type="text" id="subject" style={inputStyle} placeholder="How can we help you?" required />
            </div>

            <div>
              <label htmlFor="message" style={labelStyle}>Message</label>
              <textarea id="message" rows="5" style={{ ...inputStyle, resize: "vertical" }} placeholder="Write your message here..." required></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>
              Send Message
            </button>
          </form>
        </div>
        
      </div>
    </main>
  );
}
