import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getImageUrl, formatNumber } from '../utils';

const sidebarVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

const sidebarTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

function SortableUpItem({ up, isActive, onItemClick, onContextMenu }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: up.mid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`nav-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onItemClick(up.mid)}
      onContextMenu={(e) => onContextMenu(e, up.mid)}
      {...attributes}
      {...listeners}
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
      <div className="nav-item-info">
        <span className="nav-item-text">{up.name}</span>
        {up.follower != null && (
          <span className="nav-item-follower">{formatNumber(up.follower)} 粉丝</span>
        )}
      </div>
    </div>
  );
}

const Sidebar = forwardRef(function Sidebar({
  savedUpList = [],
  currentMid = null,
  currentView = 'home',
  onAddUp,
  onLoadUp,
  onDeleteUp,
  onReorderUp,
  onOpenSettings,
  onExportCsv,
  onGoHome,
  onCollapseChange
}, ref) {
  const [collapsed, setCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetMid: null
  });
  const contextMenuRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useImperativeHandle(ref, () => ({
    collapsed
  }));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
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

  const handleExportClick = (e) => {
    e.stopPropagation();
    const mid = contextMenu.targetMid;
    closeContextMenu();
    if (mid && onExportCsv) {
      onExportCsv(mid);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    const mid = contextMenu.targetMid;
    closeContextMenu();
    if (mid && onDeleteUp) {
      onDeleteUp(mid);
    }
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      targetMid: null
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = savedUpList.findIndex((u) => u.mid === active.id);
    const newIndex = savedUpList.findIndex((u) => u.mid === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...savedUpList];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const newMids = reordered.map((u) => u.mid);
    onReorderUp?.(newMids);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        className="sidebar-toggle"
        onClick={toggleCollapse}
        title="切换侧边栏"
        animate={{
          top: collapsed ? 16 : 32,
          left: collapsed ? 16 : 204,
        }}
        transition={sidebarTransition}
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
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            className="sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={sidebarTransition}
          >
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={savedUpList.map((u) => u.mid)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="up-list">
                        {savedUpList.map((up) => (
                          <SortableUpItem
                            key={up.mid}
                            up={up}
                            isActive={currentMid === up.mid && currentView === 'detail'}
                            onItemClick={handleItemClick}
                            onContextMenu={handleContextMenu}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </nav>

            {/* Context Menu */}
            {createPortal(
              <AnimatePresence>
                {contextMenu.visible && (
                  <motion.div
                    ref={contextMenuRef}
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
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
                  </motion.div>
                )}
              </AnimatePresence>,
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
});

export default Sidebar;
