<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar
      ref="sidebarRef"
      :saved-up-list="savedUpList"
      :current-mid="currentMid"
      :current-view="currentView"
      @add-up="showNewScrapeDialog = true"
      @load-up="loadSavedUp"
      @delete-up="deleteSavedUp"
      @open-settings="showSettingsDialog = true"
      @export-csv="exportData"
      @go-home="goToHome"
    />

    <!-- Main Content -->
    <main class="flex-1 h-screen overflow-x-hidden overflow-y-auto bg-neutral-100 transition-all duration-200" :class="sidebarRef?.collapsed ? 'ml-[92px]' : 'ml-[292px]'">
      <!-- Home Page (对比分析) -->
      <HomePage
        v-if="currentView === 'home'"
        :saved-up-list="savedUpList"
        :up-data-map="upDataMap"
        @load-up-data="loadUpDataForCompare"
        @view-up-detail="loadSavedUp"
      />

      <!-- UP Detail Page -->
      <UpDetailPage
        v-else-if="currentView === 'detail' && upInfo"
        ref="detailPageRef"
        :up-info="upInfo"
        :videos="videos"
      />

      <!-- Empty State (当详情页没有数据时) -->
      <div v-else class="flex items-center justify-center min-h-screen p-10">
        <div class="text-center max-w-md">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-neutral-400 mb-6 mx-auto">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
          </svg>
          <h2 class="text-2xl font-semibold mb-3 text-neutral-900">开始分析 UP主数据</h2>
          <p class="text-neutral-600 mb-6 text-[0.95rem]">点击左上角 "+" 按钮添加 UP主，开始爬取和分析视频数据</p>
          <button class="inline-flex items-center justify-center gap-2 px-[18px] py-2.5 border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-blue-500 text-white hover:bg-blue-600" @click="showNewScrapeDialog = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"/>
            </svg>
            添加 UP主
          </button>
        </div>
      </div>
    </main>

    <!-- Dialogs -->
    <NewScrapeDialog
      v-model="showNewScrapeDialog"
      :mid="mid"
      :is-loading="isLoading"
      :progress="progress"
      @start="handleStartScrape"
      @stop="stopScraping"
    />

    <SettingsDialog
      v-model="showSettingsDialog"
      :cookie="cookie"
      @save="handleSaveCookie"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Sidebar from './components/Sidebar.vue';
import NewScrapeDialog from './components/NewScrapeDialog.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import UpDetailPage from './components/UpDetailPage.vue';
import HomePage from './components/HomePage.vue';

// Dialog states
const showNewScrapeDialog = ref(false);
const showSettingsDialog = ref(false);

// View state: 'home' | 'detail'
const currentView = ref('home');

// Data states
const mid = ref('');
const cookie = ref('');
const isLoading = ref(false);
const videos = ref([]);
const upInfo = ref(null);
const progress = ref({ current: 0, total: 0, page: 0, message: '' });

// Sidebar states
const sidebarRef = ref(null);
const savedUpList = ref([]);
const currentMid = ref(null);

// Detail page ref
const detailPageRef = ref(null);

// 用于对比功能的UP主数据缓存
const upDataMap = ref({});

// Methods
async function loadSavedUpList() {
  try {
    savedUpList.value = await invoke('get_saved_up_list');
  } catch (error) {
    console.error('加载UP主列表失败:', error);
  }
}

async function loadSavedUp(upMid) {
  try {
    const result = await invoke('load_up_videos', { mid: upMid });
    if (result.success) {
      videos.value = result.videos;
      upInfo.value = result.up_info;
      currentMid.value = upMid;
      mid.value = upMid;
      currentView.value = 'detail';

      // 同时缓存到 upDataMap
      upDataMap.value[upMid] = {
        up_info: result.up_info,
        videos: result.videos
      };
    }
  } catch (error) {
    alert('加载失败: ' + error);
  }
}

// 为对比功能加载UP主数据（不切换视图）
async function loadUpDataForCompare(upMid) {
  if (upDataMap.value[upMid]) return; // 已缓存

  try {
    const result = await invoke('load_up_videos', { mid: upMid });
    if (result.success) {
      upDataMap.value[upMid] = {
        up_info: result.up_info,
        videos: result.videos
      };
    }
  } catch (error) {
    console.error('加载UP主数据失败:', error);
  }
}

// 返回首页
function goToHome() {
  currentView.value = 'home';
  currentMid.value = null;
}

async function deleteSavedUp(upMid) {
  if (!confirm('确定要删除这个UP主的数据吗？')) return;

  try {
    await invoke('delete_saved_up', { mid: upMid });
    await loadSavedUpList();

    if (currentMid.value === upMid) {
      videos.value = [];
      upInfo.value = null;
      currentMid.value = null;
    }
  } catch (error) {
    alert('删除失败: ' + error);
  }
}

async function handleSaveCookie(newCookie) {
  cookie.value = newCookie;
  try {
    await invoke('set_cookie', { cookie: newCookie });
  } catch (error) {
    console.error('保存Cookie失败:', error);
  }
}

async function handleStartScrape({ mid: newMid }) {
  mid.value = newMid;
  await startScraping();
}

async function startScraping() {
  if (!mid.value) return;

  isLoading.value = true;
  videos.value = [];
  upInfo.value = null;
  progress.value = { current: 0, total: 0, page: 0, message: '初始化...' };

  try {
    progress.value.message = '获取WBI签名...';
    await invoke('init_wbi_keys');

    progress.value.message = '开始爬取视频...';
    const result = await invoke('scrape_videos', {
      mid: parseInt(mid.value)
    });

    if (result.success) {
      videos.value = result.videos;
      upInfo.value = result.up_info;
      currentMid.value = parseInt(mid.value);

      await loadSavedUpList();
      showNewScrapeDialog.value = false;
    } else {
      alert('爬取失败: ' + (result.error || '未知错误'));
    }
  } catch (error) {
    alert('错误: ' + error);
  } finally {
    isLoading.value = false;
  }
}

async function stopScraping() {
  try {
    await invoke('stop_scraping');
  } catch (error) {
    console.error('停止失败:', error);
  }
}

async function exportData() {
  if (videos.value.length === 0) return;

  const filename = `${upInfo.value?.name || mid.value}_videos_${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    await invoke('export_csv', {
      videos: videos.value,
      path: filename
    });
    alert(`数据已导出: ${filename}`);
  } catch (error) {
    alert('导出失败: ' + error);
  }
}

async function loadSavedCookie() {
  try {
    const savedCookie = await invoke('get_cookie');
    if (savedCookie) {
      cookie.value = savedCookie;
    }
  } catch (error) {
    console.error('加载Cookie失败:', error);
  }
}

// 加载所有已保存UP主的数据（用于首页TOP榜单）
async function loadAllUpData() {
  for (const up of savedUpList.value) {
    if (!upDataMap.value[up.mid]) {
      try {
        const result = await invoke('load_up_videos', { mid: up.mid });
        if (result.success) {
          upDataMap.value[up.mid] = {
            up_info: result.up_info,
            videos: result.videos
          };
        }
      } catch (error) {
        console.error(`加载UP主 ${up.mid} 数据失败:`, error);
      }
    }
  }
}

onMounted(async () => {
  await listen('scrape-progress', (event) => {
    progress.value = event.payload;
  });

  await loadSavedCookie();
  await loadSavedUpList();

  // 加载所有UP主数据用于首页
  await loadAllUpData();
});
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #F9FAFB;
  color: #111827;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 优化卡片样式 */
.bg-white.rounded-xl.border {
  border-color: rgba(229, 231, 235, 0.6) !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.01) !important;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.bg-white.rounded-xl.border:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
  border-color: rgba(229, 231, 235, 0.8) !important;
}

/* 优化主内容区域的滚动条 */
main::-webkit-scrollbar {
  width: 6px;
}

main::-webkit-scrollbar-track {
  background: transparent;
}

main::-webkit-scrollbar-thumb {
  background-color: #E5E7EB;
  border-radius: 3px;
  transition: background-color 0.2s;
}

main::-webkit-scrollbar-thumb:hover {
  background-color: #D1D5DB;
}

/* 优化视频列表滚动条 */
.flex.flex-col.gap-2::-webkit-scrollbar {
  width: 6px;
}

.flex.flex-col.gap-2::-webkit-scrollbar-track {
  background: transparent;
}

.flex.flex-col.gap-2::-webkit-scrollbar-thumb {
  background-color: #E5E7EB;
  border-radius: 3px;
}

.flex.flex-col.gap-2::-webkit-scrollbar-thumb:hover {
  background-color: #D1D5DB;
}

/* 优化背景色 */
.bg-neutral-100 {
  background-color: #F9FAFB !important;
}

.bg-neutral-50 {
  background-color: #FAFAFA !important;
}
</style>
