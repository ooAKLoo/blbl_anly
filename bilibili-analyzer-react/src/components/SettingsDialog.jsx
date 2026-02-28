import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Orbit } from '@ooakloowj/orbit';

export default function SettingsDialog({
  open = false,
  cookie = '',
  onClose,
  onSave
}) {
  const [localCookie, setLocalCookie] = useState(cookie || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

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

  const handleSendFeedback = async () => {
    if (!feedbackContent.trim() || isSending) return;
    setIsSending(true);
    try {
      await Orbit.sendFeedback({ content: feedbackContent.trim(), contact: feedbackContact.trim() });
      setFeedbackSent(true);
      setFeedbackContent('');
      setFeedbackContact('');
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch (err) {
      console.error('发送反馈失败:', err);
    } finally {
      setIsSending(false);
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

          <div className="setting-section">
            <div className="setting-header">
              <label className="setting-label">反馈</label>
              <span className="setting-hint">遇到问题或有建议？告诉我们</span>
            </div>
            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              className="input textarea"
              placeholder="描述你遇到的问题或建议..."
              rows="3"
            />
            <input
              type="text"
              value={feedbackContact}
              onChange={(e) => setFeedbackContact(e.target.value)}
              className="input"
              placeholder="邮箱或其他联系方式（可选）"
              style={{ marginTop: 8 }}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
              disabled={!feedbackContent.trim() || isSending}
              onClick={handleSendFeedback}
            >
              {isSending ? '发送中...' : feedbackSent ? '已发送 ✓' : '发送反馈'}
            </button>
          </div>
        </div>

        <div className="dialog-footer" style={{ flexDirection: 'column', gap: 12 }}>
          <div className="flex items-center justify-end gap-3 w-full">
            <button className="btn btn-ghost" onClick={handleClose}>取消</button>
            <button className="btn btn-primary" onClick={handleSave}>保存</button>
          </div>
          <span className="text-xs opacity-40 select-none" style={{ marginTop: 4 }}>唔叽唔哩｜捕捉"附近"</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
