import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../utils';

const Sidebar = forwardRef(function Sidebar({
  savedUpList = [],
  currentMid = null,
  currentView = 'home',
  onAddUp,
  onLoadUp,
  onDeleteUp,
  onOpenSettings,
  onExportCsv,
  onGoHome,
  onCollapseChange
}, ref) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetMid: null
  });

  useImperativeHandle(ref, () => ({
    collapsed
  }));

  useEffect(() => {
    setSidebarVisible(!collapsed);
  }, [collapsed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [contextMenu.visible]);

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const handleItemClick = (mid) => {
    if (onLoadUp) {
      onLoadUp(mid);
    }
  };

  const handleContextMenu = (event, mid) => {
    event.preventDefault();
    event.stopPropagation();
    closeContextMenu();
    setTimeout(() => {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetMid: mid
      });
    }, 0);
  };

  const handleExportClick = () => {
    if (contextMenu.targetMid && onExportCsv) {
      onExportCsv(contextMenu.targetMid);
    }
    closeContextMenu();
  };

  const handleDeleteClick = () => {
    if (contextMenu.targetMid && onDeleteUp) {
      onDeleteUp(contextMenu.targetMid);
    }
    closeContextMenu();
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      targetMid: null
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        className={`sidebar-toggle ${!collapsed ? 'active' : ''}`}
        onClick={toggleCollapse}
        title="切换侧边栏"
      >
        {collapsed ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H9V3Z" fill="currentColor"/>
            <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </button>

      {/* Sidebar */}
      {sidebarVisible && (
        <aside className={`sidebar ${!collapsed ? 'sidebar-enter' : 'sidebar-exit'}`}>
          {/* Header */}
          <div className="sidebar-header">
            <div
              className={`logo ${currentView === 'home' ? 'active' : ''}`}
              onClick={onGoHome}
            >
              <div className="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <span className="logo-text">首页</span>
            </div>
          </div>

          {/* Divider */}
          <div className="divider"></div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-header">
                <span className="nav-section-title">UP主列表</span>
                {savedUpList.length > 0 && (
                  <span className="nav-section-count">{savedUpList.length}</span>
                )}
              </div>

              {savedUpList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span>暂无UP主</span>
                  <span className="empty-hint">点击下方按钮添加</span>
                </div>
              ) : (
                <div className="up-list">
                  {savedUpList.map((up) => (
                    <div
                      key={up.mid}
                      className={`nav-item ${currentMid === up.mid && currentView === 'detail' ? 'active' : ''}`}
                      onClick={() => handleItemClick(up.mid)}
                      onContextMenu={(e) => handleContextMenu(e, up.mid)}
                    >
                      <div className="avatar-wrapper">
                        <img
                          src={getImageUrl(up.face)}
                          className="avatar"
                          referrerPolicy="no-referrer"
                          alt={up.name}
                        />
                        <div className="avatar-ring"></div>
                      </div>
                      <span className="nav-item-text">{up.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Context Menu */}
          {createPortal(
            contextMenu.visible && (
              <div
                className={`context-menu ${contextMenu.visible ? 'context-menu-enter' : 'context-menu-exit'}`}
                style={{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }}
              >
                <div className="context-menu-item" onClick={handleExportClick}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
                  </svg>
                  <span>导出 CSV</span>
                </div>
                <div className="context-menu-divider"></div>
                <div className="context-menu-item context-menu-item-danger" onClick={handleDeleteClick}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  <span>删除</span>
                </div>
              </div>
            ),
            document.body
          )}

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="divider"></div>
            <div className="footer-actions">
              <button className="action-btn primary" onClick={onAddUp} title="添加UP主">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14m-7-7h14"/>
                </svg>
                <span>添加UP主</span>
              </button>
              <button className="action-btn secondary" onClick={onOpenSettings} title="设置">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
});

export default Sidebar;
