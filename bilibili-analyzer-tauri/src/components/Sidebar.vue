<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <div class="sidebar-header">
      <div v-if="!collapsed" class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span>Bilibili Analyzer</span>
      </div>
      <button class="icon-btn add-btn" @click="$emit('add-up')" title="添加UP主">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14m-7-7h14"/>
        </svg>
      </button>
    </div>

    <nav class="sidebar-nav" v-if="!collapsed">
      <div class="nav-section">
        <div class="nav-section-title">已保存的 UP主</div>
        <div v-if="savedUpList.length === 0" class="empty-state">
          <span>暂无数据</span>
        </div>
        <div
          v-for="up in savedUpList"
          :key="up.mid"
          class="nav-item"
          :class="{ active: currentMid === up.mid }"
          @click="handleItemClick(up.mid)"
          @contextmenu.prevent="handleContextMenu($event, up.mid)"
        >
          <img :src="getImageUrl(up.face)" class="avatar-sm" referrerpolicy="no-referrer" />
          <span class="nav-item-text">{{ up.name }}</span>
        </div>
      </div>
    </nav>

    <!-- Context Menu (using Teleport to avoid overflow issues) -->
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

    <div class="sidebar-footer" v-if="!collapsed">
      <button class="icon-btn settings-btn" @click="$emit('open-settings')" title="设置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>设置</span>
      </button>
    </div>

    <button class="collapse-btn" @click="toggleCollapse">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path :d="collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
      </svg>
    </button>
  </aside>
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
});

// Emits
const emit = defineEmits(['add-up', 'load-up', 'delete-up', 'open-settings', 'export-csv']);

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
  // Close any existing menu first
  closeContextMenu();
  // Open new menu on next tick to avoid immediate close
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
  // Use capture phase to ensure we catch the click before other handlers
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
.sidebar {
  @apply w-[260px] fixed top-4 left-4 flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-200 z-[100];
  height: calc(100vh - 32px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.sidebar.collapsed {
  @apply w-[60px];
}

.sidebar-header {
  @apply flex items-center justify-between px-4 pt-5 pb-4 min-h-[56px];
}

.logo {
  @apply flex items-center gap-2.5 text-gray-900 font-semibold text-[0.9rem];
}

.logo svg {
  @apply text-blue-500;
}

.sidebar-nav {
  @apply flex-1 overflow-y-auto p-3 px-2;
}

.nav-section {
  @apply mb-4;
}

.nav-section-title {
  @apply text-[0.7rem] font-semibold uppercase tracking-wide text-gray-400 px-3 py-2;
}

.empty-state {
  @apply px-3 py-4 text-gray-400 text-sm text-center;
}

.nav-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 mb-0.5 relative;
}

.nav-item:hover {
  @apply bg-gray-50;
}

.nav-item.active {
  @apply bg-blue-50;
}

.nav-item-text {
  @apply flex-1 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap;
}

.nav-item.active .nav-item-text {
  @apply text-gray-900 font-medium;
}

.avatar-sm {
  @apply w-7 h-7 rounded-full object-cover;
}

/* Context Menu */
.context-menu {
  @apply fixed bg-white rounded-lg p-1 z-[1000] min-w-[140px];
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.context-menu-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 text-gray-600 text-sm;
}

.context-menu-item:hover {
  @apply bg-gray-50 text-gray-900;
}

.context-menu-item-danger:hover {
  @apply bg-red-50 text-red-500;
}

.context-menu-item svg {
  @apply flex-shrink-0;
}

.context-menu-divider {
  @apply h-px bg-gray-100 my-1 mx-2;
}

/* Context Menu Transition */
.context-menu-enter-active,
.context-menu-leave-active {
  @apply transition-all duration-150 ease-in-out;
}

.context-menu-enter-from {
  @apply opacity-0 scale-95;
}

.context-menu-leave-to {
  @apply opacity-0 scale-95;
}

.sidebar-footer {
  @apply px-3 py-3 pb-4;
}

.settings-btn {
  @apply flex items-center gap-2.5 w-full px-3 py-2.5 text-gray-600 text-sm rounded-lg transition-colors duration-150;
}

.settings-btn:hover {
  @apply text-gray-900 bg-gray-50;
}

.collapse-btn {
  @apply absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer text-gray-400 transition-all duration-150 z-10;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.collapse-btn:hover {
  @apply bg-gray-50 text-gray-900;
}

/* Icon Button */
.icon-btn {
  @apply bg-transparent border-0 text-gray-600 cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-150;
}

.icon-btn:hover {
  @apply bg-gray-50 text-gray-900;
}

.icon-btn-sm {
  @apply p-1;
}

.add-btn {
  @apply bg-blue-500 text-white;
}

.add-btn:hover {
  @apply bg-blue-600 text-white;
}
</style>

