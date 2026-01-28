<template>
  <!-- Floating Toggle Button (always visible) -->
  <button
    class="sidebar-toggle"
    :class="{ active: !collapsed }"
    @click="toggleCollapse"
    title="切换侧边栏"
  >
    <svg v-if="collapsed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" stroke="currentColor" stroke-width="2"/>
      <path d="M9 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H9V3Z" fill="currentColor"/>
      <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" stroke-width="2"/>
    </svg>
  </button>

  <Transition name="sidebar">
    <aside v-show="!collapsed" class="sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="logo" @click="$emit('go-home')" :class="{ active: currentView === 'home' }">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <span class="logo-text">首页</span>
        </div>
      </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-section-header">
          <span class="nav-section-title">UP主列表</span>
          <span class="nav-section-count" v-if="savedUpList.length > 0">{{ savedUpList.length }}</span>
        </div>

        <div v-if="savedUpList.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span>暂无UP主</span>
          <span class="empty-hint">点击下方按钮添加</span>
        </div>

        <div class="up-list" v-else>
          <div
            v-for="up in savedUpList"
            :key="up.mid"
            class="nav-item"
            :class="{ active: currentMid === up.mid && currentView === 'detail' }"
            @click="handleItemClick(up.mid)"
            @contextmenu.prevent="handleContextMenu($event, up.mid)"
          >
            <div class="avatar-wrapper">
              <img :src="getImageUrl(up.face)" class="avatar" referrerpolicy="no-referrer" />
              <div class="avatar-ring"></div>
            </div>
            <span class="nav-item-text">{{ up.name }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Context Menu -->
    <Teleport to="body">
      <Transition name="context-menu">
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        >
          <div class="context-menu-item" @click.stop="handleExportClick">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
            </svg>
            <span>导出 CSV</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item context-menu-item-danger" @click.stop="handleDeleteClick">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            <span>删除</span>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="divider"></div>
      <div class="footer-actions">
        <button class="action-btn primary" @click="$emit('add-up')" title="添加UP主">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
          <span>添加UP主</span>
        </button>
        <button class="action-btn secondary" @click="$emit('open-settings')" title="设置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>
    </aside>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getImageUrl } from '../utils';

// Props
defineProps({
  savedUpList: {
    type: Array,
    required: true,
  },
  currentMid: {
    type: Number,
    default: null,
  },
  currentView: {
    type: String,
    default: 'home',
  },
});

// Emits
const emit = defineEmits(['add-up', 'load-up', 'delete-up', 'open-settings', 'export-csv', 'go-home']);

// Local state
const collapsed = ref(false);
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetMid: null,
});

// Methods
function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

function handleItemClick(mid) {
  emit('load-up', mid);
}

function handleContextMenu(event, mid) {
  event.stopPropagation();
  closeContextMenu();
  setTimeout(() => {
    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      targetMid: mid,
    };
  }, 0);
}

function handleExportClick() {
  if (contextMenu.value.targetMid) {
    emit('export-csv', contextMenu.value.targetMid);
  }
  closeContextMenu();
}

function handleDeleteClick() {
  if (contextMenu.value.targetMid) {
    emit('delete-up', contextMenu.value.targetMid);
  }
  closeContextMenu();
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenu.value.targetMid = null;
}

function handleClickOutside(event) {
  if (contextMenu.value.visible) {
    closeContextMenu();
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
});

// Expose collapsed state for parent component
defineExpose({
  collapsed,
});
</script>

<style scoped>
/* Floating Toggle Button */
.sidebar-toggle {
  @apply fixed w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer z-[101] border-0;
  @apply bg-white text-neutral-500;
  /* 与首页图标水平对齐: sidebar top(12px) + header pt(12px) + logo py(8px) = 32px */
  top: 32px;
  /* 与设置按钮竖直对齐: sidebar left(12px) + sidebar width(240px) - padding right(12px) - button width(40px) + (40-32)/2 = 204px */
  left: 204px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.08);
  transition: left 0.2s ease, top 0.2s ease;
}

.sidebar-toggle:not(.active) {
  top: 16px;
  left: 16px;
}

.sidebar-toggle:hover {
  @apply bg-neutral-50 text-neutral-700;
}

/* Sidebar Container */
.sidebar {
  @apply w-[240px] fixed top-3 left-3 bottom-3 flex flex-col bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden z-[100];
}

/* Sidebar Transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

/* Header */
.sidebar-header {
  @apply px-3 pt-3 pb-2;
}

.logo {
  @apply flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200;
}

.logo:hover {
  @apply bg-neutral-100/80;
}

.logo.active {
  @apply bg-blue-50;
}

.logo-icon {
  @apply w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center transition-all duration-200;
}

.logo.active .logo-icon {
  @apply bg-blue-100;
}

.logo-icon svg {
  @apply text-neutral-500 transition-colors duration-200;
}

.logo.active .logo-icon svg {
  @apply text-blue-600;
}

.logo-text {
  @apply text-sm font-semibold text-neutral-700 tracking-tight transition-colors duration-200;
}

.logo.active .logo-text {
  @apply text-blue-700;
}

/* Divider */
.divider {
  @apply h-px bg-neutral-100 mx-4;
}

/* Navigation */
.sidebar-nav {
  @apply flex-1 overflow-y-auto px-3 py-3;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}

.nav-section {
  @apply space-y-1;
}

.nav-section-header {
  @apply flex items-center justify-between px-3 py-2;
}

.nav-section-title {
  @apply text-[11px] font-semibold uppercase tracking-wider text-neutral-400;
}

.nav-section-count {
  @apply text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.empty-icon {
  @apply w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center mb-3;
}

.empty-icon svg {
  @apply text-neutral-300;
}

.empty-state > span:first-of-type {
  @apply text-sm font-medium text-neutral-400;
}

.empty-hint {
  @apply text-xs text-neutral-300 mt-1;
}

/* UP List */
.up-list {
  @apply space-y-0.5;
}

.nav-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 relative;
}

.nav-item:hover {
  @apply bg-neutral-50;
}

.nav-item.active {
  @apply bg-blue-50;
}

.avatar-wrapper {
  @apply relative flex-shrink-0;
}

.avatar {
  @apply w-8 h-8 rounded-lg object-cover transition-transform duration-200;
}

.nav-item:hover .avatar {
  @apply scale-105;
}

.avatar-ring {
  @apply absolute inset-0 rounded-lg ring-2 ring-transparent transition-all duration-200;
}

.nav-item.active .avatar-ring {
  @apply ring-blue-200;
}

.nav-item-text {
  @apply flex-1 text-[13px] font-medium text-neutral-600 truncate transition-colors duration-200;
}

.nav-item.active .nav-item-text {
  @apply text-blue-700 font-semibold;
}


/* Context Menu */
.context-menu {
  @apply fixed bg-white/95 backdrop-blur-lg rounded-xl p-1.5 z-[1000] min-w-[160px];
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 16px 32px rgba(0, 0, 0, 0.08);
}

.context-menu-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 text-neutral-600 text-[13px] font-medium;
}

.context-menu-item:hover {
  @apply bg-neutral-100 text-neutral-900;
}

.context-menu-item-danger:hover {
  @apply bg-red-50 text-red-600;
}

.context-menu-item svg {
  @apply flex-shrink-0 opacity-60;
}

.context-menu-divider {
  @apply h-px bg-neutral-100 my-1;
}

/* Context Menu Transition */
.context-menu-enter-active,
.context-menu-leave-active {
  @apply transition-all duration-150 ease-out;
}

.context-menu-enter-from,
.context-menu-leave-to {
  @apply opacity-0 scale-95 translate-y-1;
}

/* Footer */
.sidebar-footer {
  @apply px-3 pb-3 pt-0;
}

.footer-actions {
  @apply flex items-center gap-2 pt-3;
}

.action-btn {
  @apply flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border-0 cursor-pointer;
}

.action-btn.primary {
  @apply flex-1 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 active:scale-[0.98];
}

.action-btn.secondary {
  @apply w-10 h-10 bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700;
}

.action-btn svg {
  @apply flex-shrink-0;
}

</style>
