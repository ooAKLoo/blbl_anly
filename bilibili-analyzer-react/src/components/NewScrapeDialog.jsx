import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function NewScrapeDialog({
  open = false,
  mid = '',
  isLoading = false,
  progress = null,
  onClose,
  onStart,
  onStop
}) {
  const [localMid, setLocalMid] = useState(mid || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setLocalMid(mid || '');
  }, [mid]);

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

  const progressPercent = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress]);

  const progressText = useMemo(() => {
    if (!progress) return '';
    return `${progress.message} (${progress.current}/${progress.total})`;
  }, [progress]);

  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  const handleStartScrape = () => {
    if (!localMid) return;
    if (onStart) {
      onStart({ mid: localMid });
    }
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
          <h2>添加 UP主</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="dialog-body">
          <div className="input-group">
            <label className="input-label">UP主 MID</label>
            <input
              value={localMid}
              onChange={(e) => setLocalMid(e.target.value)}
              type="text"
              className="input"
              placeholder="输入 UP主的 MID，例如 22541325"
              disabled={isLoading}
            />
            <span className="input-hint">可在 UP主空间页面 URL 中找到 MID</span>
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: progressPercent + '%' }}></div>
              </div>
              <span className="progress-text">{progressText}</span>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {!isLoading && (
            <button className="btn btn-ghost" onClick={handleClose}>取消</button>
          )}
          {isLoading && (
            <button className="btn btn-danger" onClick={onStop}>
              停止
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleStartScrape}
            disabled={!localMid || isLoading}
          >
            {isLoading ? '爬取中...' : '开始爬取'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
