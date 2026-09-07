"use client";

import React, { useEffect } from "react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  subMessage = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'info'
  item = null, // { image, name, id, price, category, subtitle }
  isLoading = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";

  const iconClass = isDanger 
    ? "fa-solid fa-trash-can" 
    : (isWarning ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-question");

  const iconColor = isDanger 
    ? "#ef4444" 
    : (isWarning ? "#f59e0b" : "#4318ff");

  const iconBg = isDanger 
    ? "rgba(239, 68, 68, 0.12)" 
    : (isWarning ? "rgba(245, 158, 11, 0.12)" : "rgba(67, 24, 255, 0.12)");

  const iconBorder = isDanger 
    ? "rgba(239, 68, 68, 0.3)" 
    : (isWarning ? "rgba(245, 158, 11, 0.3)" : "rgba(67, 24, 255, 0.3)");

  const confirmBtnBg = isDanger 
    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" 
    : (isWarning ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #4318ff 0%, #3311db 100%)");

  const confirmBtnShadow = isDanger 
    ? "0 4px 14px rgba(239, 68, 68, 0.35)" 
    : (isWarning ? "0 4px 14px rgba(245, 158, 11, 0.35)" : "0 4px 14px rgba(67, 24, 255, 0.35)");

  return (
    <div 
      className="admin-confirm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="admin-confirm-card" role="dialog" aria-modal="true">
        {/* Close X button */}
        {!isLoading && (
          <button 
            type="button" 
            className="admin-confirm-close" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}

        {/* Icon & Title Header */}
        <div className="admin-confirm-header">
          <div 
            className="admin-confirm-icon-wrapper"
            style={{ 
              backgroundColor: iconBg, 
              borderColor: iconBorder,
              color: iconColor 
            }}
          >
            <i className={iconClass}></i>
          </div>
          <h3 className="admin-confirm-title">{title}</h3>
          <p className="admin-confirm-message">{message}</p>
        </div>

        {/* Optional Item Details Card */}
        {item && (
          <div className="admin-confirm-item-preview">
            {item.image && (
              <div className="admin-confirm-item-thumb">
                <img src={item.image} alt={item.name || "Preview"} />
              </div>
            )}
            <div className="admin-confirm-item-info">
              {item.id && <span className="admin-confirm-item-sku">#SKU-{item.id}</span>}
              <h4 className="admin-confirm-item-name">{item.name || "Selected Item"}</h4>
              <div className="admin-confirm-item-meta">
                {item.category && <span className="admin-confirm-badge">{item.category}</span>}
                {item.price !== undefined && item.price !== null && (
                  <span className="admin-confirm-price">₹{Number(item.price).toFixed(2)}</span>
                )}
                {item.stock !== undefined && (
                  <span className="admin-confirm-stock">
                    {item.stock <= 0 ? "Out of Stock" : `${item.stock} in stock`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-warning text */}
        {subMessage && (
          <div className="admin-confirm-warning-note">
            <i className="fa-solid fa-shield-halved"></i>
            <span>{subMessage}</span>
          </div>
        )}

        {/* Actions buttons */}
        <div className="admin-confirm-actions">
          <button
            type="button"
            className="admin-confirm-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="admin-confirm-btn-submit"
            style={{
              background: confirmBtnBg,
              boxShadow: confirmBtnShadow
            }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDanger && <i className="fa-solid fa-trash-can"></i>}
                {isWarning && <i className="fa-solid fa-check"></i>}
                {!isDanger && !isWarning && <i className="fa-solid fa-arrow-right"></i>}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
