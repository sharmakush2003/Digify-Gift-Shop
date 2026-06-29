export default function DeliveryPage() {
  return (
    <main className="container">
      <h1 className="page-title">Delivery & Shipping</h1>
      
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", marginBottom: "4rem" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", lineHeight: "1.8" }}>
          At Orient Crockeries, we are excited to introduce our new home delivery services exclusively across Jaipur. Shopping for premium tableware and hospitality supplies has never been easier.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        <div style={{ background: "var(--bg-surface)", padding: "2.5rem", border: "1px solid var(--border)", textAlign: "center" }}>
          <i className="fa-solid fa-map-location-dot" style={{ fontSize: "2rem", color: "var(--primary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--dark)", marginBottom: "1rem" }}>Delivery Areas</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            We currently deliver to all major pin codes within the Jaipur city limits. For locations outside Jaipur, please contact our support team to arrange a special shipping request via our trusted courier partners.
          </p>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: "2.5rem", border: "1px solid var(--border)", textAlign: "center" }}>
          <i className="fa-regular fa-clock" style={{ fontSize: "2rem", color: "var(--primary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--dark)", marginBottom: "1rem" }}>Timeframes</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Standard home deliveries within Jaipur are typically fulfilled within 24 to 48 hours. For bulk hotel or restaurant supplies, please allow 3-5 business days for processing and dispatch.
          </p>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: "2.5rem", border: "1px solid var(--border)", textAlign: "center" }}>
          <i className="fa-solid fa-box-open" style={{ fontSize: "2rem", color: "var(--primary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--dark)", marginBottom: "1rem" }}>Safe & Secure</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Crockery and glassware are fragile. Our expert packaging team ensures every item is securely bubble-wrapped and boxed to prevent any damage. We guarantee 100% safe arrival.
          </p>
        </div>
        
      </div>

      <div style={{ marginTop: "4rem", padding: "3rem", background: "var(--bg-alt)", border: "1px solid var(--border)", textAlign: "center" }}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--dark)", marginBottom: "1rem" }}>Need exact location pinning?</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
          During checkout, you can now drop a Google Map pin to ensure our delivery executives reach your exact location without any hassle. (Feature coming soon)
        </p>
      </div>

    </main>
  );
}
