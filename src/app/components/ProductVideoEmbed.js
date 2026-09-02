'use client';
import React, { useState } from 'react';
import { getProductMediaUrls } from '../utils/imageUtils';

export function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return (match && match[1]) ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1` : null;
}

export function getInstagramEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/instagram\.com\/(reel|p|tv)\/([^/?#&]+)/i);
  if (!match) return null;
  const mediaType = match[1] === 'tv' ? 'reel' : match[1];
  const mediaId = match[2];
  return `https://www.instagram.com/${mediaType}/${mediaId}/embed`;
}

export default function ProductVideoEmbed({ product }) {
  const [ytError, setYtError] = useState(false);
  const [igError, setIgError] = useState(false);

  if (!product) return null;

  const { youtube_url, instagram_url } = getProductMediaUrls(product);

  // Fallbacks for direct fields if available
  const rawYt = youtube_url || product.youtube_url || product.videoUrl || product.video_url || '';
  const rawIg = instagram_url || product.instagram_url || (product.videoUrl && product.videoUrl.includes('instagram') ? product.videoUrl : '');

  // Detect cross-pasted URLs automatically
  let finalYtUrl = (rawYt || '').trim();
  let finalIgUrl = (rawIg || '').trim();

  if (finalYtUrl.includes('instagram.com')) {
    finalIgUrl = finalYtUrl;
    finalYtUrl = '';
  } else if (finalIgUrl.includes('youtube.com') || finalIgUrl.includes('youtu.be')) {
    finalYtUrl = finalIgUrl;
    finalIgUrl = '';
  }

  const ytEmbed = getYouTubeEmbedUrl(finalYtUrl);
  const igEmbed = getInstagramEmbedUrl(finalIgUrl);

  const isYtShort = finalYtUrl.includes('/shorts/');

  return (
    <div className="product-video-embed-section">
      {/* YouTube Embedded Video Player */}
      {finalYtUrl && (
        <div className="video-embed-card yt-card">
          <div className="video-header yt-header">
            <span className="video-header-title">
              <i className="fa-brands fa-youtube" style={{ color: '#ff0000' }}></i>
              <span>Product Video Demo</span>
            </span>
            <a 
              href={finalYtUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="video-header-btn yt-btn"
            >
              Open YouTube <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>

          {!ytError && ytEmbed ? (
            <div className={`yt-frame-wrapper ${isYtShort ? 'is-shorts' : ''}`}>
              <iframe 
                src={ytEmbed}
                title={`${product.name || 'Product'} Video`}
                scrolling="no"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, overflow: 'hidden' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setYtError(true)}
              />
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fff0f0' }}>
              <p style={{ fontSize: '0.85rem', color: '#c53030', margin: '0 0 8px 0' }}>Watch video directly on YouTube:</p>
              <a 
                href={finalYtUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ff0000', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <i className="fa-brands fa-youtube"></i> Watch Video Demo
              </a>
            </div>
          )}
        </div>
      )}

      {/* Instagram Reel Embedded Player */}
      {finalIgUrl && (
        <div className="video-embed-card ig-card">
          <div className="video-header ig-header">
            <span className="video-header-title">
              <i className="fa-brands fa-instagram"></i>
              <span>Instagram Reel Showcase</span>
            </span>
            <a 
              href={finalIgUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="video-header-btn ig-btn"
            >
              Open Reel <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>

          {!igError && igEmbed ? (
            <div className="ig-frame-wrapper">
              <iframe 
                src={igEmbed}
                title={`${product.name || 'Product'} Instagram Reel`}
                scrolling="no"
                allowFullScreen
                onError={() => setIgError(true)}
              />
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fdf2f8' }}>
              <p style={{ fontSize: '0.85rem', color: '#9d174d', margin: '0 0 8px 0' }}>Watch Reel directly on Instagram:</p>
              <a 
                href={finalIgUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <i className="fa-brands fa-instagram"></i> Watch Instagram Reel
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
