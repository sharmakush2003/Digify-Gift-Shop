"use client";

import React, { useState } from "react";
import { parseVideoUrl } from "../utils/videoUtils";

export default function ProductVideoPlayer({ videoUrl, productName }) {
  const [hasEmbedError, setHasEmbedError] = useState(false);
  const videoData = parseVideoUrl(videoUrl);

  if (!videoUrl || videoData.type === 'none') {
    return null;
  }

  const { type, embedUrl, originalUrl, videoId, isShort } = videoData;

  return (
    <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          {type === 'youtube' && <i className="fa-brands fa-youtube" style={{ color: "#ff0000", fontSize: "1.2rem" }}></i>}
          {type === 'instagram' && <i className="fa-brands fa-instagram" style={{ color: "#e1306c", fontSize: "1.2rem" }}></i>}
          {type === 'other' && <i className="fa-solid fa-circle-play" style={{ color: "#d97706", fontSize: "1.2rem" }}></i>}
          <span>Product Demo Video</span>
        </h3>
        
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.78rem",
              fontWeight: "600",
              color: type === 'instagram' ? "#e1306c" : type === 'youtube' ? "#cc0000" : "#d97706",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              backgroundColor: type === 'instagram' ? "#fcf0f5" : type === 'youtube' ? "#fff0f0" : "#fffbe6",
              padding: "4px 10px",
              borderRadius: "20px",
              border: `1px solid ${type === 'instagram' ? '#f9ceee' : type === 'youtube' ? '#ffd8d8' : '#fef08a'}`
            }}
          >
            <span>Open in {type === 'youtube' ? 'YouTube' : type === 'instagram' ? 'Instagram' : 'App'}</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
          </a>
        )}
      </div>

      {!hasEmbedError && embedUrl ? (
        <div 
          style={{
            position: "relative",
            width: "100%",
            paddingTop: isShort ? "125%" : "56.25%", // 9:16 portrait for shorts/reels or 16:9 for normal youtube
            maxHeight: isShort ? "480px" : "360px",
            backgroundColor: "#0f172a",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}
        >
          <iframe
            src={embedUrl}
            title={`${productName || 'Product'} Video Demo`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: "12px"
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setHasEmbedError(true)}
          ></iframe>
        </div>
      ) : (
        /* Fallback if embedding is blocked or unavailable */
        <div 
          style={{
            padding: "1.2rem",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            textAlign: "center"
          }}
        >
          <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#475569" }}>
            Watch the video demo directly on {type === 'instagram' ? 'Instagram' : 'YouTube'}:
          </p>
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-add-to-cart-attractive"
            style={{
              display: "inline-flex",
              width: "auto",
              padding: "8px 18px",
              fontSize: "0.88rem",
              background: type === 'instagram' ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'
            }}
          >
            <i className={`fa-brands fa-${type === 'instagram' ? 'instagram' : 'youtube'}`}></i>
            <span>Watch Demo Video</span>
          </a>
        </div>
      )}
    </div>
  );
}
