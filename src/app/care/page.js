"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function CareGuide() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = parseInt(entry.target.getAttribute("data-step"), 10);
            setActiveStep(stepIndex);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    const steps = document.querySelectorAll(".care-step");
    steps.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  const stepsData = [
    {
      title: "1. Everyday Elegance",
      desc: "Our premium bone china and ceramics are designed for everyday luxury. They are highly chip-resistant and beautifully glazed. Handle them with care, and they will retain their luster indefinitely."
    },
    {
      title: "2. Microwave Safety (Do's)",
      desc: "<strong>DO:</strong> Place most of our standard ceramics and bone china in the microwave. They are thoroughly tested for high heat resistance.<br/><br/><strong>DON'T:</strong> Never microwave pieces with gold or metallic rims, as this will cause sparking and permanently damage the finish."
    },
    {
      title: "3. Dishwasher Guidelines",
      desc: "<strong>DO:</strong> Use mild, liquid detergents when washing in a machine. Load plates securely so they do not clink against other items during the wash cycle.<br/><br/><strong>DON'T:</strong> Avoid harsh, abrasive pods or excessively high temperature settings which can dull the glaze over time. Hand washing is always recommended for crystal and gold-rimmed items."
    },
    {
      title: "4. Thermal Shock Warning",
      desc: "<strong>DON'T:</strong> Never subject your ceramics or glass to sudden, extreme temperature changes (e.g., taking a plate from the freezer directly into a hot oven). This causes thermal shock, which will crack even the finest tableware."
    },
    {
      title: "5. Acacia Woodcraft Care",
      desc: "<strong>DO:</strong> Hand wash only with warm, soapy water and dry immediately. Once a month, rub food-safe mineral oil into the wood along the grain to prevent drying and cracking.<br/><br/><strong>DON'T:</strong> Never soak woodcraft in water or place it in the dishwasher."
    }
  ];

  return (
    <main style={{ marginTop: "60px", backgroundColor: "var(--bg-main)", minHeight: "100vh" }}>
      {/* Header */}
      <section className="section" style={{ paddingBottom: "2rem", textAlign: "center" }}>
        <p className="section-subtitle">The Art of Maintenance</p>
        <h1 className="section-title">Care & Maintenance</h1>
        <p style={{ maxWidth: "600px", margin: "0 auto", color: "var(--text-muted)" }}>
          Your Orient Crockeries pieces are investments in fine dining. Follow our interactive guide to ensure they last generations.
        </p>
      </section>

      {/* Interactive 2.5D Scroll Section */}
      <div className="care-interactive-container">
        
        {/* Left Side: Sticky Visual (The "2.5D Plate") */}
        <div className="care-visual-sticky">
          <div className={`care-plate-wrapper step-${activeStep}`}>
            <img src="/images/care_guide_plate.png" alt="Premium Tableware" className="care-plate-img" />
            
            {/* Overlay Elements for different steps */}
            <div className={`care-overlay overlay-microwave ${activeStep === 1 ? 'active' : ''}`}>
              <i className="fa-solid fa-fire-burner"></i>
            </div>
            <div className={`care-overlay overlay-water ${activeStep === 2 ? 'active' : ''}`}>
              <i className="fa-solid fa-droplet"></i>
            </div>
            <div className={`care-overlay overlay-crack ${activeStep === 3 ? 'active' : ''}`}>
              <i className="fa-solid fa-temperature-arrow-down"></i>
            </div>
            <div className={`care-overlay overlay-wood ${activeStep === 4 ? 'active' : ''}`}>
              <i className="fa-solid fa-leaf"></i>
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable Text Content */}
        <div className="care-text-scroll">
          {stepsData.map((step, index) => (
            <div 
              key={index} 
              className={`care-step ${activeStep === index ? 'is-active' : ''}`} 
              data-step={index}
            >
              <h3 className="care-step-title">{step.title}</h3>
              <p className="care-step-desc" dangerouslySetInnerHTML={{ __html: step.desc }}></p>
            </div>
          ))}
          <div className="care-step-spacer"></div>
        </div>
      </div>
      
      <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "var(--bg-surface)" }}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1.5rem", color: "var(--dark)" }}>Ready to elevate your dining?</h3>
        <Link href="/catalog" className="btn btn-primary">
          Explore Our Collection
        </Link>
      </div>
    </main>
  );
}
