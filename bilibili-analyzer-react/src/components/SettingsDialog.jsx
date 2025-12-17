import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SettingsDialog({
  open = false,
  cookie = '',
  onClose,
  onSave
}) {
  const [localCookie, setLocalCookie] = useState(cookie || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setLocalCookie(cookie || '');
  }, [cookie]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localCookie);
    }
    handleClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className={`dialog-overlay ${isAnimating ? 'dialog-enter-active' : 'dialog-leave-active'}`}
      onClick={handleOverlayClick}
    >
      <div className={`dialog-content ${isAnimating ? '' : 'dialog-content-exit'}`}>
        <div className="dialog-header">
          <h2>设置</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="dialog-body">
          <div className="setting-section">
            <div className="setting-header">
              <label className="setting-label">Cookie</label>
              <span className="setting-hint">可选 - 遇到 -403 错误时需要填写</span>
            </div>
            <textarea
              value={localCookie}
              onChange={(e) => setLocalCookie(e.target.value)}
              className="input textarea"
              placeholder="从浏览器复制 Cookie..."
              rows="4"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-ghost" onClick={handleClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
