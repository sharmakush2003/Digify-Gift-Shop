"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
  const pillars = [
    { title: "35+ Years Industry Experience", icon: "fa-solid fa-hourglass-start" },
    { title: "10,000+ Products Under One Roof", icon: "fa-solid fa-store" },
    { title: "Wholesale & Retail Pricing", icon: "fa-solid fa-tags" },
    { title: "Home Delivery Across Jaipur", icon: "fa-solid fa-truck-ramp-box" },
    { title: "Hotel, Restaurant & Institutional Supply", icon: "fa-solid fa-hotel" },
    { title: "Trusted by Thousands of Customers", icon: "fa-solid fa-users" },
    { title: "Leading Brands & Quality Assurance", icon: "fa-solid fa-award" },
    { title: "Expert Product Guidance", icon: "fa-solid fa-lightbulb" }
  ];

  return (
    <div style={{ marginTop: "60px" }}>
      {/* Brand Header */}
      <section className="section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        <div className="section-header" style={{ marginBottom: "2rem" }}>
          <p className="section-subtitle">OUR HERITAGE</p>
          <h1 className="section-title">About Orient Crockeries</h1>
        </div>
      </section>

      {/* Main Copy Split Layout */}
      <section className="section" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "4rem", alignItems: "start" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--dark)", marginBottom: "1.5rem" }}>
            Jaipur&apos;s Complete Destination for Crockery &amp; Hospitality Solutions
          </h3>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            Welcome to Orient Crockeries, Jaipur&apos;s trusted destination for premium crockery, glassware, cutlery, kitchenware, and hospitality supplies. With over 35 years of experience in the crockery and hospitality industry, we have built a strong reputation for quality, reliability, competitive pricing, and exceptional customer service.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            Located in the heart of Jaipur&apos;s renowned 22 Godown Market, Orient Crockeries has been serving customers through its retail showroom for more than a decade, becoming a preferred choice for households, hotels, restaurants, cafés, caterers, banquet operators, institutions, corporate offices, retailers, and wholesalers across Rajasthan.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            As both wholesalers and retailers, we offer the unique advantage of extensive product variety at highly competitive prices. Our direct sourcing relationships with leading manufacturers and reputed brands enable us to provide genuine value without compromising on quality.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            Every product we offer is carefully selected for its quality, durability, functionality, contemporary design, and long-term value. Whether customers seek elegant dining solutions for their homes or durable hospitality products for commercial operations, our collection is designed to meet diverse requirements and budgets.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            Over the years, Orient Crockeries has proudly partnered with hotels, restaurants, cafés, catering companies, banquet venues, educational institutions, corporate organizations, and retail businesses, helping them create memorable dining and hospitality experiences.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            As we continue to grow, we are excited to introduce home delivery services across Jaipur, making it easier than ever for customers to access premium crockery and dining essentials from the comfort of their homes. Our goal is to combine the trust of a traditional family business with the convenience of modern retail.
          </p>
          <p style={{ color: "var(--text-main)", marginBottom: "1.2rem", lineHeight: "1.8" }}>
            At Orient Crockeries, we believe that every dining experience deserves the perfect presentation. Whether you are furnishing a new home, upgrading your restaurant, sourcing products for a hotel, planning a special event, or purchasing in bulk for your business, we are committed to providing the finest products, widest selection, and best value under one roof.
          </p>
          <p style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "1.05rem", fontStyle: "italic", borderLeft: "2px solid var(--primary)", paddingLeft: "15px", marginTop: "1.5rem" }}>
            Orient Crockeries is more than a crockery store — it is Jaipur&apos;s complete destination for crockery, glassware, cutlery, hotelware, kitchenware, and hospitality solutions.
          </p>
        </div>

        {/* Collection sidebar and image */}
        <div>
          <img 
            src="/images/crockery_teapot.png" 
            alt="Teapot Collection" 
            style={{ width: "100%", height: "350px", objectFit: "cover", border: "1px solid var(--border)", marginBottom: "2.5rem" }}
          />

          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "2rem" }}>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--primary)", marginBottom: "1.5rem" }}>
              Our Extensive Collection Includes
            </h4>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.8rem", listStyle: "none" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Premium Crockery &amp; Dinner Sets</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Bone China, Ceramic &amp; Porcelain Tableware</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Glassware &amp; Beverage Serving Solutions</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Stainless Steel Cutlery &amp; Serving Accessories</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Buffetware &amp; Banquet Essentials</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Hotelware &amp; Restaurant Supplies</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Barware &amp; Hospitality Products</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Kitchenware &amp; Utility Products</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-chevron-right" style={{ color: "var(--primary)", fontSize: "0.75rem" }}></i>
                <span>Gift Items &amp; Home Dining Collections</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="section section-alt">
        <div className="section-header">
          <p className="section-subtitle">THE ORIENT STANDARDS</p>
          <h2 className="section-title">Why Choose Orient Crockeries?</h2>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "2rem",
          marginTop: "2rem"
        }}>
          {pillars.map((pillar, idx) => (
            <div 
              key={idx} 
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                padding: "2rem 1.5rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "var(--bg-alt)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                marginBottom: "1.2rem"
              }}>
                <i className={pillar.icon}></i>
              </div>
              <h4 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                color: "var(--dark)",
                lineHeight: "1.3"
              }}>
                {pillar.title}
              </h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
