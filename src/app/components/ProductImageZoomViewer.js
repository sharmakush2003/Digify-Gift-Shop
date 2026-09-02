'use client';
import { useState, useEffect } from 'react';
import { getImageStyle } from '../utils/imageUtils';

export default function ProductImageZoomViewer({ product, activeImage, getValidImageUrl }) {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Lightbox zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(1.8);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
    setZoomLevel(1.8); // Default opening zoom scale
    setPanPos({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1.8);
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

  // Mouse / Touch Drag Handlers
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

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPos.x, y: e.touches[0].clientY - panPos.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      setPanPos({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleWheel = (e) => {
    if (!isLightboxOpen) return;
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomLevel((prev) => Math.max(1, Math.min(4, prev + delta)));
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
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px'
          }}
          onWheel={handleWheel}
          onMouseMove={handleMouseDrag}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Top Bar - Header & Close */}
          <div style={{
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            zIndex: 100000,
            padding: '4px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
                <i className="fa-solid fa-up-down-left-right" style={{ color: '#38bdf8', marginRight: '6px' }}></i>
                Drag or scroll to move image
              </span>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              &times;
            </button>
          </div>

          {/* Clean Main Image Pan & Zoom View */}
          <div 
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={() => {
              if (zoomLevel === 1) {
                setZoomLevel(2.2);
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
                maxHeight: '84vh',
                maxWidth: '94vw',
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
              zIndex: 100000,
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
                      setZoomLevel(1.8);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
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
