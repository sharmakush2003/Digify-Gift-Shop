'use client';
import { useState, useEffect } from 'react';
import { getImageStyle } from '../utils/imageUtils';

export default function ProductImageZoomViewer({ product, activeImage, getValidImageUrl }) {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Lightbox zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDistStart, setTouchDistStart] = useState(null);
  const [currentImg, setCurrentImg] = useState(activeImage || product?.image);

  useEffect(() => {
    setCurrentImg(activeImage || product?.image);
  }, [activeImage, product]);

  const imagesList = product?.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product?.image || '/placeholder.jpg'];

  const targetUrl = currentImg || product?.image;
  const validUrl = getValidImageUrl ? getValidImageUrl(targetUrl) : targetUrl;
  const baseImgStyle = getImageStyle(product, targetUrl, 'contain');

  // Smooth mouse tracking for desktop hover
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
    setZoomLevel(1); // Default clean 1.0x scale on open
    setPanPos({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
    setPanPos({ x: 0, y: 0 });
  };

  // Keyboard ESC shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLightboxOpen) closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Mouse / Touch Drag & Pinch Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };

  const handleMouseDrag = (e) => {
    if (isDragging) {
      setPanPos({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTouchDistStart(null);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPos.x, y: e.touches[0].clientY - panPos.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistStart(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      setPanPos({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistStart) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistStart;
      setZoomLevel((prev) => Math.max(1, Math.min(3.5, prev * (factor > 1 ? 1.04 : 0.96))));
      setTouchDistStart(dist);
    }
  };

  const handleWheel = (e) => {
    if (!isLightboxOpen) return;
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoomLevel((prev) => Math.max(1, Math.min(3.5, prev + delta)));
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Prominent & Attractive Zoom Prompt Banner inside Product Modal */}
      <div 
        onClick={openLightbox}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '7px 14px',
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '8px',
          marginBottom: '10px',
          fontSize: '0.8rem',
          fontWeight: '700',
          color: '#1d4ed8',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
      >
        <i className="fa-solid fa-magnifying-glass-plus" style={{ color: '#2563eb', fontSize: '0.9rem' }}></i>
        <span>Click photo for HD Zoom & Full Details</span>
      </div>

      {/* Product Image Frame */}
      <div 
        className="clean-product-img-box"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={openLightbox}
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'zoom-in',
          userSelect: 'none',
          border: '1px solid #cbd5e1'
        }}
      >
        <img 
          src={validUrl} 
          alt={product?.name || 'Product Image'} 
          style={{
            width: '100%',
            height: '100%',
            padding: '0.8rem',
            objectFit: baseImgStyle.objectFit || 'contain',
            objectPosition: baseImgStyle.objectPosition || '50% 50%',
            transform: isHovering ? 'scale(1.05)' : (baseImgStyle.transform || 'none'),
            transition: 'transform 0.2s ease-out'
          }}
        />

        {/* Sleek corner zoom badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          color: '#1e293b',
          border: '1px solid #cbd5e1',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.74rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          <i className="fa-solid fa-expand" style={{ color: '#2563eb' }}></i>
          <span>HD Zoom</span>
        </div>
      </div>

      {/* Fullscreen Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px'
          }}
          onWheel={handleWheel}
          onMouseMove={handleMouseDrag}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Top Bar - Non-overlapping absolute Close Button & Controls */}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close Zoom View"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              zIndex: 100010,
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
          >
            &times;
          </button>

          {/* Top Left Helper Text & On-Screen Zoom Controls */}
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            zIndex: 100005,
            padding: '6px 44px 6px 6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-up-down-left-right" style={{ color: '#38bdf8', fontSize: '0.8rem' }}></i>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#e2e8f0' }}>
                Pinch / Double-tap to zoom
              </span>
            </div>

            {/* Quick Zoom Buttons (+ / - / Reset) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '2px 6px',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)'
            }}>
              <button 
                type="button" 
                onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.3))}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer', padding: '2px 6px' }}
                title="Zoom Out"
              >
                <i className="fa-solid fa-minus"></i>
              </button>

              <button 
                type="button" 
                onClick={() => { setZoomLevel(1); setPanPos({ x: 0, y: 0 }); }}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button 
                type="button" 
                onClick={() => setZoomLevel(prev => Math.min(3.5, prev + 0.3))}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer', padding: '2px 6px' }}
                title="Zoom In"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          {/* Clean Fullscreen Image View */}
          <div 
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '10px 0'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={() => {
              if (zoomLevel <= 1.1) {
                setZoomLevel(2.0);
              } else {
                setZoomLevel(1);
                setPanPos({ x: 0, y: 0 });
              }
            }}
          >
            <img 
              src={validUrl} 
              alt={product?.name}
              style={{
                maxHeight: '82vh',
                maxWidth: '92vw',
                objectFit: 'contain',
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Bottom Thumbnail Selector */}
          {imagesList.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '30px',
              maxWidth: '90vw',
              overflowX: 'auto',
              zIndex: 100005,
              backdropFilter: 'blur(6px)'
            }}>
              {imagesList.map((img, idx) => {
                const thumbUrl = getValidImageUrl ? getValidImageUrl(img) : img;
                const isSelected = (currentImg === img || (!currentImg && product?.image === img));
                return (
                  <img 
                    key={idx}
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => {
                      setCurrentImg(img);
                      setPanPos({ x: 0, y: 0 });
                      setZoomLevel(1);
                    }}
                    style={{
                      width: '44px',
                      height: '44px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                      opacity: isSelected ? 1 : 0.4,
                      transition: 'all 0.2s ease'
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
