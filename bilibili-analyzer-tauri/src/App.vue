<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar
      ref="sidebarRef"
      :saved-up-list="savedUpList"
      :current-mid="currentMid"
      @add-up="showNewScrapeDialog = true"
      @load-up="loadSavedUp"
      @delete-up="deleteSavedUp"
      @open-settings="showSettingsDialog = true"
      @export-csv="exportData"
    />

    <!-- Main Content -->
    <main class="flex-1 h-screen overflow-x-hidden overflow-y-auto bg-neutral-100 transition-all duration-200" :class="sidebarRef?.collapsed ? 'ml-[92px]' : 'ml-[292px]'">
      <!-- Empty State -->
      <div v-if="!upInfo && videos.length === 0" class="flex items-center justify-center min-h-screen p-10">
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

      <!-- Data View -->
      <div v-else class="px-8 py-6 max-w-[1600px] mx-auto overflow-x-hidden">
        <!-- UP Info Header -->
        <header v-if="upInfo" class="flex flex-wrap items-center gap-6 p-6 bg-white rounded-xl border border-black/[0.06] mb-6 overflow-hidden">
          <img :src="upInfo.face" class="w-[72px] h-[72px] rounded-full border-2 border-blue-500" referrerpolicy="no-referrer" />
          <div class="flex-1">
            <h1 class="text-xl font-semibold mb-1">{{ upInfo.name }}</h1>
            <p class="text-neutral-600 text-sm max-w-xs overflow-hidden text-ellipsis whitespace-nowrap mb-2">{{ upInfo.sign }}</p>
            <span class="inline-block bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-900 px-2.5 py-0.5 rounded-[10px] text-xs font-semibold">Lv.{{ upInfo.level }}</span>
          </div>
          <div class="flex flex-wrap gap-3">
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ videos.length }}</span>
              <span class="text-xs text-neutral-400">视频数</span>
            </div>
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ formatNumber(totalPlays) }}</span>
              <span class="text-xs text-neutral-400">总播放</span>
            </div>
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ formatNumber(totalDanmu) }}</span>
              <span class="text-xs text-neutral-400">总弹幕</span>
            </div>
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ formatNumber(avgPlays) }}</span>
              <span class="text-xs text-neutral-400">平均播放</span>
            </div>
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ avgEngagementRate }}%</span>
              <span class="text-xs text-neutral-400">平均互动率</span>
            </div>
            <div class="text-center py-2.5 px-4 bg-neutral-50 rounded-lg min-w-[80px]">
              <span class="block text-xl font-semibold text-blue-500 mb-0.5">{{ hitRate }}%</span>
              <span class="text-xs text-neutral-400">爆款率</span>
            </div>
          </div>
        </header>

        <!-- Charts Grid -->
        <div v-if="videos.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">播放量分布 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击柱子查看视频</span></h3>
            <div ref="playDistChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">视频时长分布 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击扇区查看视频</span></h3>
            <div ref="durationChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">月度发布趋势与播放量 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击柱子查看该月视频</span></h3>
            <div ref="monthlyTrendChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">发布小时 vs 平均播放量（黄金时间） <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击查看该时段视频</span></h3>
            <div ref="hourlyPlayChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">视频时长 vs 平均播放量</h3>
            <div ref="durationPlayChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">播放量 vs 弹幕数（互动深度）</h3>
            <div ref="scatterChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">发布时间热力图 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击格子查看视频</span></h3>
            <div ref="heatmapChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">TOP15 播放量视频 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击直接打开视频</span></h3>
            <div ref="topVideosChart" class="h-[380px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">TOP15 高互动视频（弹幕/播放比） <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击直接打开视频</span></h3>
            <div ref="topEngagementChart" class="h-[380px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">年度发布数量</h3>
            <div ref="yearlyCountChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">年度平均播放量</h3>
            <div ref="yearlyAvgChart" class="h-[280px]"></div>
          </div>
          <div class="bg-white rounded-xl border border-black/[0.06] p-5 lg:col-span-2">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">全部视频播放量时间线</h3>
            <div ref="timelineChart" class="h-[380px]"></div>
          </div>
        </div>

        <!-- Video List -->
        <section v-if="videos.length > 0" class="bg-white rounded-xl border border-black/[0.06] p-5">
          <!-- Chart Filter Badge -->
          <div v-if="chartFilter" class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20 mb-3 text-sm text-blue-500 font-medium">
            <span>📊 图表筛选已激活</span>
            <button class="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-blue-500/30 rounded-md text-blue-500 text-xs cursor-pointer transition-all duration-150 hover:bg-white hover:border-blue-500 hover:scale-[1.02]" @click="clearChartFilter">
              <X :size="14" />
              清除筛选
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <h3 class="text-sm font-semibold mr-auto">视频列表</h3>
            <div class="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-black/[0.06] flex-1 max-w-md mx-4">
              <Search :size="16" class="text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="搜索标题关键词（如：张三、死刑）"
                class="flex-1 border-0 bg-transparent text-neutral-900 text-sm outline-none placeholder:text-neutral-400"
              />
              <button v-if="searchKeyword" class="bg-transparent border-0 text-neutral-400 cursor-pointer p-0.5 flex items-center justify-center rounded-full transition-all duration-150 hover:bg-neutral-200 hover:text-neutral-900" @click="searchKeyword = ''">
                <X :size="14" />
              </button>
            </div>
            <div class="relative" ref="sortDropdownRef">
              <button class="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-black/[0.06] rounded-lg text-neutral-900 text-sm cursor-pointer transition-all duration-150 hover:bg-neutral-100 hover:border-black/10" @click="sortDropdownOpen = !sortDropdownOpen">
                <ArrowUpDown :size="14" />
                <span>{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
                <ChevronDown :size="14" :class="sortDropdownOpen ? 'rotate-180' : ''" class="text-neutral-400 transition-transform duration-150" />
              </button>
              <Transition name="dropdown">
                <div v-if="sortDropdownOpen" class="absolute top-[calc(100%_+_4px)] right-0 min-w-[160px] p-1.5 bg-white border border-black/[0.06] rounded-lg shadow-lg z-[100]">
                  <div
                    v-for="option in sortOptions"
                    :key="option.value"
                    class="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-600 cursor-pointer rounded-md transition-all duration-150"
                    :class="sortBy === option.value ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-neutral-100 hover:text-neutral-900'"
                    @click="selectSort(option.value)"
                  >
                    <component :is="option.icon" :size="14" />
                    <span>{{ option.label }}</span>
                    <Check v-if="sortBy === option.value" :size="14" class="ml-auto text-blue-500" />
                  </div>
                </div>
              </Transition>
            </div>
            <span class="text-xs text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-xl">{{ filteredVideos.length }} / {{ videos.length }} 个视频</span>
          </div>
          <div v-if="searchKeyword && filteredVideos.length > 0" class="flex gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg mb-3 text-sm text-neutral-600">
            <span>关键词 "<strong class="text-blue-500">{{ searchKeyword }}</strong>" 的视频：</span>
            <span>平均播放 <strong class="text-blue-500">{{ formatNumber(filteredAvgPlays) }}</strong></span>
            <span>平均互动率 <strong class="text-blue-500">{{ filteredEngagementRate }}%</strong></span>
          </div>
          <div class="flex flex-col gap-2 max-h-[600px] overflow-y-auto" ref="videoListRef" @scroll="handleVideoListScroll">
            <div
              v-for="(video, index) in displayedVideos"
              :key="video.bvid"
              class="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg transition-colors duration-150 hover:bg-neutral-100"
            >
              <span class="w-8 text-center font-semibold text-blue-500 text-sm">{{ index + 1 }}</span>
              <img :src="video.cover_url" class="w-[120px] h-[68px] object-cover rounded-md" referrerpolicy="no-referrer" />
              <div class="flex-1 min-w-0">
                <a :href="video.video_url" target="_blank" class="block text-neutral-900 no-underline font-medium text-[0.9rem] mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-150 hover:text-blue-500">
                  {{ video.title }}
                </a>
                <div class="flex flex-wrap gap-3 text-xs text-neutral-400">
                  <span class="inline-flex items-center gap-1" title="发布时间">
                    <Calendar :size="14" class="opacity-70" />
                    {{ video.publish_time }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="视频时长">
                    <Clock :size="14" class="opacity-70" />
                    {{ video.duration }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="播放量">
                    <Play :size="14" class="opacity-70" />
                    {{ formatNumber(video.play_count) }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="弹幕数">
                    <MessageSquare :size="14" class="opacity-70" />
                    {{ formatNumber(video.danmu_count) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="displayedVideos.length < filteredVideos.length" class="text-center py-4 text-neutral-400 text-sm">
            <span>加载中... ({{ displayedVideos.length }}/{{ filteredVideos.length }})</span>
          </div>
          <div v-else class="text-center py-4 text-neutral-400 text-sm">
            <span>已加载全部 {{ filteredVideos.length }} 个视频</span>
          </div>
        </section>
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

    <!-- Video Drawer -->
    <Transition name="drawer">
      <div v-if="drawerVisible" class="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-5" @click="drawerVisible = false">
        <div class="w-full max-w-[900px] max-h-[85vh] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden" @click.stop>
          <div class="flex items-center gap-4 px-6 py-5 border-b border-black/[0.06] bg-neutral-50">
            <h3 class="text-lg font-semibold text-neutral-900 m-0">{{ drawerTitle }}</h3>
            <div class="flex gap-4 text-sm text-neutral-600 mr-auto">
              <span>共 {{ drawerVideos.length }} 个视频</span>
              <span v-if="drawerVideos.length > 0">
                平均播放: {{ formatNumber(Math.round(drawerVideos.reduce((sum, v) => sum + v.play_count, 0) / drawerVideos.length)) }}
              </span>
            </div>
            <button class="ml-auto inline-flex items-center justify-center gap-2 px-[18px] py-2.5 border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-transparent text-neutral-600 border border-black/10 hover:bg-neutral-100 hover:text-neutral-900" @click="drawerVisible = false">
              <X :size="20" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="drawerVideos.length === 0" class="text-center py-[60px] px-5 text-neutral-400">
              <span>暂无视频</span>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="(video, index) in drawerVideos"
                :key="video.bvid"
                class="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg transition-all duration-150 border border-transparent hover:bg-neutral-100 hover:border-blue-500/20 hover:translate-x-1"
              >
                <span class="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">{{ index + 1 }}</span>
                <img :src="video.cover_url" class="w-[140px] h-[79px] object-cover rounded-md flex-shrink-0" referrerpolicy="no-referrer" />
                <div class="flex-1 min-w-0">
                  <a :href="video.video_url" target="_blank" class="block text-neutral-900 no-underline font-medium text-[0.95rem] mb-2 leading-snug transition-colors duration-150 hover:text-blue-500">
                    {{ video.title }}
                  </a>
                  <div class="flex flex-wrap gap-3 text-xs text-neutral-400">
                    <span class="inline-flex items-center gap-1" title="发布时间">
                      <Calendar :size="14" class="opacity-70" />
                      {{ video.publish_time }}
                    </span>
                    <span class="inline-flex items-center gap-1" title="视频时长">
                      <Clock :size="14" class="opacity-70" />
                      {{ video.duration }}
                    </span>
                    <span class="inline-flex items-center gap-1" title="播放量">
                      <Play :size="14" class="opacity-70" />
                      {{ formatNumber(video.play_count) }}
                    </span>
                    <span class="inline-flex items-center gap-1" title="弹幕数">
                      <MessageSquare :size="14" class="opacity-70" />
                      {{ formatNumber(video.danmu_count) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import * as echarts from 'echarts';
import Sidebar from './components/Sidebar.vue';
import NewScrapeDialog from './components/NewScrapeDialog.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import {
  Calendar,
  Clock,
  Play,
  MessageSquare,
  Search,
  X,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Trash2,
  Download,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  TrendingUp,
  Timer,
  Check
} from 'lucide-vue-next';

// Dialog states
const showNewScrapeDialog = ref(false);
const showSettingsDialog = ref(false);

// Data states
const mid = ref('');
const cookie = ref('');
const isLoading = ref(false);
const videos = ref([]);
const upInfo = ref(null);
const progress = ref({ current: 0, total: 0, page: 0, message: '' });
const displayCount = ref(20);

// Sidebar states
const sidebarRef = ref(null);
const savedUpList = ref([]);
const currentMid = ref(null);

// Chart refs
const playDistChart = ref(null);
const durationChart = ref(null);
const monthlyTrendChart = ref(null);
const scatterChart = ref(null);
const heatmapChart = ref(null);
const topVideosChart = ref(null);
const yearlyCountChart = ref(null);
const yearlyAvgChart = ref(null);
const timelineChart = ref(null);
const hourlyPlayChart = ref(null);
const durationPlayChart = ref(null);
const topEngagementChart = ref(null);
const videoListRef = ref(null);

// 搜索和排序
const searchKeyword = ref('');
const sortBy = ref('time_desc');
const sortDropdownOpen = ref(false);
const sortDropdownRef = ref(null);

// 图表交互状态
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerVideos = ref([]);
const chartFilter = ref(null); // 用于图表筛选联动

const sortOptions = [
  { value: 'time_desc', label: '最新发布', icon: Calendar },
  { value: 'time_asc', label: '最早发布', icon: Calendar },
  { value: 'play_desc', label: '播放最高', icon: TrendingUp },
  { value: 'play_asc', label: '播放最低', icon: ArrowDownWideNarrow },
  { value: 'danmu_desc', label: '弹幕最多', icon: MessageSquare },
  { value: 'danmu_asc', label: '弹幕最少', icon: MessageSquare },
  { value: 'engagement_desc', label: '互动率最高', icon: TrendingUp },
  { value: 'duration_desc', label: '时长最长', icon: Timer },
  { value: 'duration_asc', label: '时长最短', icon: Timer },
];

function selectSort(value) {
  sortBy.value = value;
  sortDropdownOpen.value = false;
}

// 图表交互 - 打开抽屉显示视频明细
function openVideoDrawer(title, videosToShow) {
  drawerTitle.value = title;
  drawerVideos.value = videosToShow;
  drawerVisible.value = true;
}

// 图表交互 - 联动筛选视频列表
function applyChartFilter(filterFn, scrollToList = true) {
  chartFilter.value = filterFn;
  displayCount.value = 20;

  // 滚动到视频列表区域
  if (scrollToList) {
    nextTick(() => {
      const listSection = document.querySelector('.video-list-section');
      if (listSection) {
        listSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// 清除图表筛选
function clearChartFilter() {
  chartFilter.value = null;
}

// 点击外部关闭下拉菜单
function handleClickOutside(e) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    sortDropdownOpen.value = false;
  }
}

let charts = {};

// 解析时长为秒数
function parseDuration(duration) {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Computed
const filteredVideos = computed(() => {
  let result = videos.value;

  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(v => v.title.toLowerCase().includes(keyword));
  }

  // 图表筛选联动
  if (chartFilter.value) {
    result = result.filter(chartFilter.value);
  }

  // 排序
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc':
        return new Date(b.publish_time) - new Date(a.publish_time);
      case 'time_asc':
        return new Date(a.publish_time) - new Date(b.publish_time);
      case 'play_desc':
        return b.play_count - a.play_count;
      case 'play_asc':
        return a.play_count - b.play_count;
      case 'danmu_desc':
        return b.danmu_count - a.danmu_count;
      case 'danmu_asc':
        return a.danmu_count - b.danmu_count;
      case 'engagement_desc':
        return (b.danmu_count / b.play_count) - (a.danmu_count / a.play_count);
      case 'duration_desc':
        return parseDuration(b.duration) - parseDuration(a.duration);
      case 'duration_asc':
        return parseDuration(a.duration) - parseDuration(b.duration);
      default:
        return 0;
    }
  });

  return result;
});
const displayedVideos = computed(() => filteredVideos.value.slice(0, displayCount.value));
const totalPlays = computed(() => videos.value.reduce((sum, v) => sum + v.play_count, 0));
const totalDanmu = computed(() => videos.value.reduce((sum, v) => sum + v.danmu_count, 0));
const avgPlays = computed(() => {
  if (videos.value.length === 0) return 0;
  return Math.round(totalPlays.value / videos.value.length);
});

// 平均互动率 = 总弹幕 / 总播放 * 100
const avgEngagementRate = computed(() => {
  if (totalPlays.value === 0) return '0.00';
  return ((totalDanmu.value / totalPlays.value) * 100).toFixed(2);
});

// 爆款率 = 播放量超过平均值2倍的视频占比
const hitRate = computed(() => {
  if (videos.value.length === 0) return '0.0';
  const threshold = avgPlays.value * 2;
  const hitCount = videos.value.filter(v => v.play_count >= threshold).length;
  return ((hitCount / videos.value.length) * 100).toFixed(1);
});

// 筛选后的平均播放
const filteredAvgPlays = computed(() => {
  if (filteredVideos.value.length === 0) return 0;
  const total = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  return Math.round(total / filteredVideos.value.length);
});

// 筛选后的互动率
const filteredEngagementRate = computed(() => {
  if (filteredVideos.value.length === 0) return '0.00';
  const totalPlays = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  const totalDanmu = filteredVideos.value.reduce((sum, v) => sum + v.danmu_count, 0);
  if (totalPlays === 0) return '0.00';
  return ((totalDanmu / totalPlays) * 100).toFixed(2);
});

// Methods
function formatNumber(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}

function loadMore() {
  if (displayCount.value < filteredVideos.value.length) {
    displayCount.value += 20;
  }
}

function handleVideoListScroll(e) {
  const el = e.target;
  const threshold = 100; // 距离底部 100px 时触发加载
  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    loadMore();
  }
}

// 搜索关键词或排序变化时重置显示数量
watch([searchKeyword, sortBy], () => {
  displayCount.value = 20;
});

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

      await nextTick();
      setTimeout(() => renderAllCharts(), 100);
    }
  } catch (error) {
    alert('加载失败: ' + error);
  }
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

function handleSaveCookie(newCookie) {
  cookie.value = newCookie;
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
    await invoke('set_cookie', { cookie: cookie.value });

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

      await nextTick();
      setTimeout(() => renderAllCharts(), 100);
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

// 现代大厂风格图表主题配置
const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  // 标题样式：更深，更细
  title: {
    textStyle: { color: '#111827', fontSize: 14, fontWeight: 600 }
  },
  // 图例：底部或顶部，圆形图标，灰色文字
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: '#6B7280', fontSize: 12 }
  },
  // 提示框：毛玻璃效果，软阴影，无边框
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'transparent',
    padding: [12, 16],
    textStyle: { color: '#374151', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); backdrop-filter: blur(8px); border-radius: 8px;'
  },
  // 网格：去掉边框，留出更多空间
  grid: {
    top: 40,
    right: 20,
    bottom: 30,
    left: 20,
    containLabel: true
  },
  // X轴：去掉轴线，仅保留文字
  xAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 11, margin: 12 },
    splitLine: { show: false }
  },
  // Y轴：去掉轴线，虚线网格
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 11, margin: 12 },
    splitLine: {
      show: true,
      lineStyle: { type: 'dashed', color: '#F3F4F6' } // 极淡的虚线
    }
  }
};

// 专门用于坐标轴的紧凑格式化
function formatAxisNumber(value) {
  if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿';
  if (value >= 10000) return (value / 10000).toFixed(0) + '万';
  return value;
}

function renderAllCharts() {
  if (videos.value.length === 0) return;
  renderPlayDistChart();
  renderDurationChart();
  renderMonthlyTrendChart();
  renderHourlyPlayChart();
  renderDurationPlayChart();
  renderScatterChart();
  renderHeatmapChart();
  renderTopVideosChart();
  renderTopEngagementChart();
  renderYearlyCountChart();
  renderYearlyAvgChart();
  renderTimelineChart();
}

function initChart(ref, name) {
  if (!ref.value) return null;
  if (charts[name]) charts[name].dispose();
  charts[name] = echarts.init(ref.value);
  return charts[name];
}

function renderPlayDistChart() {
  const chart = initChart(playDistChart, 'playDist');
  if (!chart) return;

  const plays = videos.value.map(v => v.play_count);
  const bins = [0, 500000, 1000000, 1500000, 2000000, 3000000, 5000000, Infinity];
  const labels = ['<50万', '50-100万', '100-150万', '150-200万', '200-300万', '300-500万', '>500万'];

  // 将视频按区间分组
  const videosByBin = labels.map(() => []);
  videos.value.forEach(v => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (v.play_count >= bins[i] && v.play_count < bins[i + 1]) {
        videosByBin[i].push(v);
        break;
      }
    }
  });

  const counts = videosByBin.map(arr => arr.length);

  chart.setOption({
    ...chartTheme,
    grid: { ...chartTheme.grid, bottom: 50 },
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: (params) => {
        const idx = params[0].dataIndex;
        const binVideos = videosByBin[idx];
        const count = counts[idx];

        let html = `<div style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${labels[idx]}</div>
          <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px;">共 <span style="color: #3B82F6; font-weight: 600;">${count}</span> 个视频</div>`;

        if (binVideos.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">前5个视频:</div>';

          const topVideos = binVideos.slice(0, 5);
          topVideos.forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 30 ? v.title.slice(0, 30) + '...' : v.title}</div>`;
          });

          if (binVideos.length > 5) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #3B82F6;">还有 ${binVideos.length - 5} 个视频...</div>`;
          }

          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div>';
          html += '</div>';
        }

        html += '</div>';
        return html;
      }
    },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: labels,
      axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 0, interval: 0 }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: {
        ...chartTheme.yAxis.axisLabel,
        formatter: formatAxisNumber
      }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 32,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3B82F6' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
        ]),
        borderRadius: [6, 6, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#2563EB'
        }
      }
    }]
  });

  // 添加点击事件
  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    const binVideos = videosByBin[idx];

    // 方式1: 打开抽屉显示明细
    openVideoDrawer(`播放量区间: ${labels[idx]}`, binVideos);

    // 方式2: 同时联动筛选视频列表
    applyChartFilter((v) => {
      return v.play_count >= bins[idx] && v.play_count < bins[idx + 1];
    });
  });
}

function renderDurationChart() {
  const chart = initChart(durationChart, 'duration');
  if (!chart) return;

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  // 将视频按时长区间分组
  const videosByBin = labels.map(() => []);
  videos.value.forEach(v => {
    const parts = v.duration.split(':');
    let minutes = 0;
    if (parts.length === 2) minutes = parseInt(parts[0]);
    if (parts.length === 3) minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);

    for (let i = 0; i < bins.length - 1; i++) {
      if (minutes >= bins[i] && minutes < bins[i + 1]) {
        videosByBin[i].push(v);
        break;
      }
    }
  });

  const counts = videosByBin.map(arr => arr.length);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'item',
      confine: true,
      formatter: (params) => {
        const idx = params.dataIndex;
        const binVideos = videosByBin[idx];

        let html = `<div style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${params.name}</div>
          <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px;">共 <span style="color: #3B82F6; font-weight: 600;">${params.value}</span> 个视频 (${params.percent}%)</div>`;

        if (binVideos.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">前5个视频:</div>';

          const topVideos = binVideos.slice(0, 5);
          topVideos.forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 30 ? v.title.slice(0, 30) + '...' : v.title} (${v.duration})</div>`;
          });

          if (binVideos.length > 5) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #3B82F6;">还有 ${binVideos.length - 5} 个视频...</div>`;
          }

          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div>';
          html += '</div>';
        }

        html += '</div>';
        return html;
      }
    },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#ffffff',
        borderWidth: 3
      },
      label: {
        show: true,
        formatter: '{b}: {c}',
        color: '#6B7280',
        fontSize: 11
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        label: {
          fontWeight: 600,
          color: '#111827'
        }
      },
      data: labels.map((name, i) => ({ name, value: counts[i] })),
      color: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF', '#9CA3AF']
    }]
  });

  // 添加点击事件
  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    const binVideos = videosByBin[idx];

    openVideoDrawer(`时长区间: ${labels[idx]}`, binVideos);

    applyChartFilter((v) => {
      const parts = v.duration.split(':');
      let minutes = 0;
      if (parts.length === 2) minutes = parseInt(parts[0]);
      if (parts.length === 3) minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return minutes >= bins[idx] && minutes < bins[idx + 1];
    });
  });
}

function renderMonthlyTrendChart() {
  const chart = initChart(monthlyTrendChart, 'monthlyTrend');
  if (!chart) return;

  const monthlyData = {};
  const monthlyVideos = {};

  videos.value.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalPlays: 0 };
      monthlyVideos[month] = [];
    }
    monthlyData[month].count++;
    monthlyData[month].totalPlays += v.play_count;
    monthlyVideos[month].push(v);
  });

  const months = Object.keys(monthlyData).sort();
  const counts = months.map(m => monthlyData[m].count);
  const avgPlaysData = months.map(m => Math.round(monthlyData[m].totalPlays / monthlyData[m].count));

  chart.setOption({
    ...chartTheme,
    grid: { ...chartTheme.grid, bottom: 60 },
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: params => {
        const month = params[0].axisValue;
        const monthVids = monthlyVideos[month];

        let html = `<div style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${month}</div>
          <div style="color: #6B7280; font-size: 12px;">发布数量: <span style="color: #3B82F6; font-weight: 600;">${params[0].value}</span></div>
          <div style="color: #6B7280; font-size: 12px;">平均播放: <span style="color: #8B5CF6; font-weight: 600;">${formatNumber(params[1].value)}</span></div>`;

        if (monthVids && monthVids.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">该月视频:</div>';

          const topVideos = monthVids.slice(0, 3);
          topVideos.forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 28 ? v.title.slice(0, 28) + '...' : v.title}</div>`;
          });

          if (monthVids.length > 3) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #3B82F6;">还有 ${monthVids.length - 3} 个...</div>`;
          }

          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div>';
          html += '</div>';
        }

        html += '</div>';
        return html;
      }
    },
    legend: { ...chartTheme.legend, data: ['发布数量', '平均播放量'] },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: months,
      axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 45, interval: Math.floor(months.length / 12) }
    },
    yAxis: [
      {
        ...chartTheme.yAxis,
        type: 'value',
        name: '',
        position: 'left',
        axisLabel: {
          ...chartTheme.yAxis.axisLabel,
          formatter: formatAxisNumber
        }
      },
      {
        ...chartTheme.yAxis,
        type: 'value',
        name: '',
        position: 'right',
        axisLabel: {
          ...chartTheme.yAxis.axisLabel,
          formatter: formatAxisNumber
        }
      }
    ],
    series: [
      {
        name: '发布数量',
        type: 'bar',
        data: counts,
        barMaxWidth: 32,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: {
          itemStyle: { color: '#2563EB' }
        }
      },
      {
        name: '平均播放量',
        type: 'line',
        yAxisIndex: 1,
        data: avgPlaysData,
        smooth: 0.4,
        showSymbol: false,
        itemStyle: { color: '#8B5CF6' },
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.15)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0)' }
          ])
        }
      }
    ]
  });

  // 添加点击事件 (只对柱状图生效)
  chart.off('click');
  chart.on('click', (params) => {
    if (params.seriesType === 'bar') {
      const month = params.name;
      const monthVids = monthlyVideos[month];

      openVideoDrawer(`发布月份: ${month}`, monthVids);

      applyChartFilter((v) => {
        return v.publish_time.startsWith(month);
      });
    }
  });
}

function renderHourlyPlayChart() {
  const chart = initChart(hourlyPlayChart, 'hourlyPlay');
  if (!chart) return;

  // 按小时统计
  const hourlyData = {};
  const hourlyVideos = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { count: 0, totalPlays: 0 };
    hourlyVideos[i] = [];
  }

  videos.value.forEach(v => {
    const hour = new Date(v.publish_time).getHours();
    hourlyData[hour].count++;
    hourlyData[hour].totalPlays += v.play_count;
    hourlyVideos[hour].push(v);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i + '时');
  const avgPlaysData = hours.map((_, i) =>
    hourlyData[i].count > 0 ? Math.round(hourlyData[i].totalPlays / hourlyData[i].count) : 0
  );
  const counts = hours.map((_, i) => hourlyData[i].count);

  // 找出黄金时间（平均播放量最高的前3个小时）
  const sortedHours = [...avgPlaysData.map((v, i) => ({ hour: i, avg: v }))]
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(h => h.hour);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: p => {
        const idx = p[0].dataIndex;
        const hourVids = hourlyVideos[idx];
        const isGolden = sortedHours.includes(idx);

        let html = `<div style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: ${isGolden ? '#F59E0B' : '#111827'}; font-size: 13px;">
            ${p[0].name} ${isGolden ? '⭐ 黄金时段' : ''}
          </div>
          <div style="color: #6B7280; font-size: 12px;">发布数: <span style="font-weight: 600;">${counts[idx]}</span></div>
          <div style="color: #6B7280; font-size: 12px;">平均播放: <span style="color: ${isGolden ? '#F59E0B' : '#3B82F6'}; font-weight: 600;">${formatNumber(p[0].value)}</span></div>`;

        if (hourVids.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">前3个视频:</div>';

          const topVideos = hourVids.slice(0, 3);
          topVideos.forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 28 ? v.title.slice(0, 28) + '...' : v.title}</div>`;
          });

          if (hourVids.length > 3) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: ${isGolden ? '#F59E0B' : '#3B82F6'};">还有 ${hourVids.length - 3} 个...</div>`;
          }

          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div>';
          html += '</div>';
        }

        html += '</div>';
        return html;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hours },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'bar',
      barMaxWidth: 32,
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: sortedHours.includes(i)
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#F59E0B' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.2)' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
              ]),
          borderRadius: [6, 6, 0, 0]
        }
      })),
      emphasis: {
        itemStyle: {
          color: (params) => sortedHours.includes(params.dataIndex) ? '#D97706' : '#2563EB'
        }
      }
    }]
  });

  // 添加点击事件
  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    const hourVids = hourlyVideos[idx];

    openVideoDrawer(`发布时间: ${idx}时`, hourVids);

    applyChartFilter((v) => {
      const hour = new Date(v.publish_time).getHours();
      return hour === idx;
    });
  });
}

function renderDurationPlayChart() {
  const chart = initChart(durationPlayChart, 'durationPlay');
  if (!chart) return;

  // 时长分段
  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  const durationData = labels.map(() => ({ count: 0, totalPlays: 0 }));

  videos.value.forEach(v => {
    const parts = v.duration.split(':');
    let minutes = 0;
    if (parts.length === 2) minutes = parseInt(parts[0]);
    if (parts.length === 3) minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);

    for (let i = 0; i < bins.length - 1; i++) {
      if (minutes >= bins[i] && minutes < bins[i + 1]) {
        durationData[i].count++;
        durationData[i].totalPlays += v.play_count;
        break;
      }
    }
  });

  const avgPlaysData = durationData.map(d => d.count > 0 ? Math.round(d.totalPlays / d.count) : 0);

  // 找出最佳时长
  const maxAvg = Math.max(...avgPlaysData);
  const bestIndex = avgPlaysData.indexOf(maxAvg);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      formatter: p => {
        const isBest = p[0].dataIndex === bestIndex;
        return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #111827; font-size: 13px;">${p[0].name} ${isBest ? '⭐ 最佳时长' : ''}</div>
          <div style="color: #6B7280; font-size: 12px;">视频数: <span style="font-weight: 600;">${durationData[p[0].dataIndex].count}</span></div>
          <div style="color: #6B7280; font-size: 12px;">平均播放: <span style="color: ${isBest ? '#10B981' : '#3B82F6'}; font-weight: 600;">${formatNumber(p[0].value)}</span></div>
        </div>`;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'bar',
      barMaxWidth: 32,
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: i === bestIndex
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#10B981' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.2)' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
              ]),
          borderRadius: [6, 6, 0, 0]
        }
      })),
      emphasis: {
        itemStyle: {
          color: (params) => params.dataIndex === bestIndex ? '#059669' : '#2563EB'
        }
      }
    }]
  });
}

function renderScatterChart() {
  const chart = initChart(scatterChart, 'scatter');
  if (!chart) return;

  const data = videos.value.map(v => [v.play_count, v.danmu_count]);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'item',
      formatter: p => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="color: #6B7280; font-size: 12px;">播放: <span style="color: #3B82F6; font-weight: 600;">${formatNumber(p.value[0])}</span></div>
        <div style="color: #6B7280; font-size: 12px;">弹幕: <span style="color: #10B981; font-weight: 600;">${formatNumber(p.value[1])}</span></div>
      </div>`
    },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      name: '播放量',
      nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
      axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '弹幕数',
      nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'scatter',
      symbolSize: 6,
      data: data,
      itemStyle: {
        color: '#10B981',
        opacity: 0.6,
        borderWidth: 1,
        borderColor: '#ffffff'
      },
      emphasis: {
        itemStyle: {
          color: '#059669',
          opacity: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(16, 185, 129, 0.5)'
        }
      }
    }]
  });
}

function renderHeatmapChart() {
  const chart = initChart(heatmapChart, 'heatmap');
  if (!chart) return;

  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const hours = Array.from({ length: 24 }, (_, i) => i + '时');

  const data = [];
  const countMap = {};
  const videoMap = {};

  videos.value.forEach(v => {
    const date = new Date(v.publish_time);
    const weekday = (date.getDay() + 6) % 7;
    const hour = date.getHours();
    const key = `${weekday}-${hour}`;
    countMap[key] = (countMap[key] || 0) + 1;
    if (!videoMap[key]) videoMap[key] = [];
    videoMap[key].push(v);
  });

  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      data.push([h, w, countMap[`${w}-${h}`] || 0]);
    }
  }

  const maxCount = Math.max(...data.map(d => d[2]));

  chart.setOption({
    ...chartTheme,
    grid: { ...chartTheme.grid, bottom: 60 },
    tooltip: {
      ...chartTheme.tooltip,
      confine: true,
      formatter: p => {
        const weekday = p.value[1];
        const hour = p.value[0];
        const count = p.value[2];
        const key = `${weekday}-${hour}`;
        const vids = videoMap[key] || [];

        let html = `<div style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${weekdays[weekday]} ${hour}时</div>
          <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px;">共 <span style="color: #3B82F6; font-weight: 600;">${count}</span> 个视频</div>`;

        if (vids.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">视频列表:</div>';

          const topVideos = vids.slice(0, 3);
          topVideos.forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 28 ? v.title.slice(0, 28) + '...' : v.title}</div>`;
          });

          if (vids.length > 3) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #3B82F6;">还有 ${vids.length - 3} 个...</div>`;
          }

          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div>';
          html += '</div>';
        }

        html += '</div>';
        return html;
      }
    },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: hours,
      splitArea: { show: true, areaStyle: { color: ['transparent', '#FAFAFA'] } }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'category',
      data: weekdays,
      splitArea: { show: true, areaStyle: { color: ['transparent', '#FAFAFA'] } }
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 5,
      textStyle: { color: '#9CA3AF', fontSize: 11 },
      inRange: { color: ['#F3F4F6', '#DBEAFE', '#93C5FD', '#60A5FA', '#3B82F6'] }
    },
    series: [{
      type: 'heatmap',
      data: data,
      label: { show: false },
      itemStyle: {
        borderRadius: 4,
        borderWidth: 3,
        borderColor: '#ffffff'
      },
      emphasis: {
        itemStyle: {
          borderColor: '#3B82F6',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(59, 130, 246, 0.5)'
        }
      }
    }]
  });

  // 添加点击事件
  chart.off('click');
  chart.on('click', (params) => {
    const weekday = params.value[1];
    const hour = params.value[0];
    const key = `${weekday}-${hour}`;
    const vids = videoMap[key] || [];

    if (vids.length > 0) {
      openVideoDrawer(`${weekdays[weekday]} ${hour}时发布的视频`, vids);

      applyChartFilter((v) => {
        const date = new Date(v.publish_time);
        const vWeekday = (date.getDay() + 6) % 7;
        const vHour = date.getHours();
        return vWeekday === weekday && vHour === hour;
      });
    }
  });
}

function renderTopVideosChart() {
  const chart = initChart(topVideosChart, 'topVideos');
  if (!chart) return;

  const topVideosData = [...videos.value]
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, 15);

  const titles = topVideosData.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
  const plays = topVideosData.map(v => v.play_count);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: p => {
        const video = topVideosData[14 - p[0].dataIndex];
        return `<div style="max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${video.title}</div>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 12px;">
            <span style="color: #9CA3AF;">播放量:</span>
            <span style="font-weight: 600; color: #3B82F6;">${formatNumber(video.play_count)}</span>
            <span style="color: #9CA3AF;">弹幕数:</span>
            <span style="color: #6B7280;">${formatNumber(video.danmu_count)}</span>
            <span style="color: #9CA3AF;">发布时间:</span>
            <span style="color: #6B7280;">${video.publish_time}</span>
            <span style="color: #9CA3AF;">视频时长:</span>
            <span style="color: #6B7280;">${video.duration}</span>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击打开视频链接</div>
        </div>`;
      }
    },
    grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'category',
      data: titles.reverse(),
      axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: plays.reverse(),
      barMaxWidth: 24,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#2563EB' },
          { offset: 1, color: '#60A5FA' }
        ]),
        borderRadius: [0, 6, 6, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1D4ED8' },
            { offset: 1, color: '#3B82F6' }
          ])
        }
      }
    }]
  });

  // 添加点击事件 - 打开视频链接
  chart.off('click');
  chart.on('click', (params) => {
    const video = topVideosData[14 - params.dataIndex];
    window.open(video.video_url, '_blank');
  });
}

function renderTopEngagementChart() {
  const chart = initChart(topEngagementChart, 'topEngagement');
  if (!chart) return;

  // 计算互动率（弹幕/播放），过滤掉播放量太低的视频
  const videosWithEngagement = videos.value
    .filter(v => v.play_count >= 10000) // 至少1万播放
    .map(v => ({
      ...v,
      engagementRate: (v.danmu_count / v.play_count) * 100
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 15);

  const titles = videosWithEngagement.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
  const rates = videosWithEngagement.map(v => v.engagementRate.toFixed(2));

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: p => {
        const video = videosWithEngagement[14 - p[0].dataIndex];
        return `<div style="max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${video.title}</div>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 12px;">
            <span style="color: #9CA3AF;">互动率:</span>
            <span style="font-weight: 600; color: #EC4899;">${video.engagementRate.toFixed(2)}%</span>
            <span style="color: #9CA3AF;">播放量:</span>
            <span style="color: #6B7280;">${formatNumber(video.play_count)}</span>
            <span style="color: #9CA3AF;">弹幕数:</span>
            <span style="color: #6B7280;">${formatNumber(video.danmu_count)}</span>
            <span style="color: #9CA3AF;">发布时间:</span>
            <span style="color: #6B7280;">${video.publish_time}</span>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击打开视频链接</div>
        </div>`;
      }
    },
    grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: v => v + '%' }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'category',
      data: titles.reverse(),
      axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: rates.reverse(),
      barMaxWidth: 24,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#DB2777' },
          { offset: 1, color: '#F472B6' }
        ]),
        borderRadius: [0, 6, 6, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#BE185D' },
            { offset: 1, color: '#EC4899' }
          ])
        }
      }
    }]
  });

  // 添加点击事件 - 打开视频链接
  chart.off('click');
  chart.on('click', (params) => {
    const video = videosWithEngagement[14 - params.dataIndex];
    window.open(video.video_url, '_blank');
  });
}

function renderYearlyCountChart() {
  const chart = initChart(yearlyCountChart, 'yearlyCount');
  if (!chart) return;

  const yearlyData = {};
  videos.value.forEach(v => {
    const year = v.publish_time.slice(0, 4);
    yearlyData[year] = (yearlyData[year] || 0) + 1;
  });

  const years = Object.keys(yearlyData).sort();
  const counts = years.map(y => yearlyData[y]);

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: years },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 48,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#6366F1' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.2)' }
        ]),
        borderRadius: [6, 6, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        color: '#6B7280',
        fontSize: 11,
        fontWeight: 600
      },
      emphasis: {
        itemStyle: { color: '#4F46E5' }
      }
    }]
  });
}

function renderYearlyAvgChart() {
  const chart = initChart(yearlyAvgChart, 'yearlyAvg');
  if (!chart) return;

  const yearlyData = {};
  videos.value.forEach(v => {
    const year = v.publish_time.slice(0, 4);
    if (!yearlyData[year]) yearlyData[year] = { count: 0, totalPlays: 0 };
    yearlyData[year].count++;
    yearlyData[year].totalPlays += v.play_count;
  });

  const years = Object.keys(yearlyData).sort();
  const avgPlaysData = years.map(y => Math.round(yearlyData[y].totalPlays / yearlyData[y].count));

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      formatter: p => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="font-weight: 600; margin-bottom: 6px; color: #111827; font-size: 13px;">${p[0].name}年</div>
        <div style="color: #6B7280; font-size: 12px;">平均播放: <span style="color: #6366F1; font-weight: 600;">${formatNumber(p[0].value)}</span></div>
      </div>`
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: years },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'line',
      data: avgPlaysData,
      smooth: 0.4,
      showSymbol: false,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.15)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0)' }
        ])
      },
      itemStyle: { color: '#6366F1' },
      lineStyle: { width: 2.5 }
    }]
  });
}

function renderTimelineChart() {
  const chart = initChart(timelineChart, 'timeline');
  if (!chart) return;

  // 按发布时间排序（从早到晚）
  const sortedVideos = [...videos.value].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  const titles = sortedVideos.map((v, i) => `#${i + 1}`);
  const plays = sortedVideos.map(v => v.play_count);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      formatter: p => {
        const video = sortedVideos[p[0].dataIndex];
        return `<div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #111827; font-size: 13px;">${video.title}</div>
          <div style="color: #6B7280; font-size: 12px;">发布时间: ${video.publish_time}</div>
          <div style="color: #3B82F6; font-weight: 600; font-size: 12px; margin-top: 4px;">播放量: ${formatNumber(video.play_count)}</div>
        </div>`;
      }
    },
    grid: { left: '8%', right: '4%', bottom: '15%', top: '10%' },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: 100,
        bottom: 10,
        height: 20,
        borderColor: 'transparent',
        backgroundColor: '#F3F4F6',
        fillerColor: 'rgba(59, 130, 246, 0.2)',
        handleStyle: { color: '#3B82F6' },
        textStyle: { color: '#9CA3AF', fontSize: 11 }
      },
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ],
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: titles,
      axisLabel: {
        ...chartTheme.xAxis.axisLabel,
        interval: Math.floor(sortedVideos.length / 20),
        rotate: 0
      },
      name: '视频序号（按发布时间排序）',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#9CA3AF', fontSize: 11 }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
    },
    series: [{
      type: 'bar',
      data: plays,
      barMaxWidth: 16,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3B82F6' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }
        ]),
        borderRadius: [3, 3, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2563EB' },
            { offset: 1, color: '#3B82F6' }
          ])
        }
      }
    }]
  });
}

onMounted(async () => {
  await listen('scrape-progress', (event) => {
    progress.value = event.payload;
  });

  await loadSavedUpList();

  window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
      if (chart) chart.resize();
    });
  });

  // 点击外部关闭下拉菜单
  document.addEventListener('click', handleClickOutside);
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

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-active > div,
.drawer-leave-active > div {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from > div {
  transform: scale(0.96) translateY(16px);
}

.drawer-leave-to > div {
  transform: scale(0.96) translateY(16px);
}

/* 优化背景色 */
.bg-neutral-100 {
  background-color: #F9FAFB !important;
}

.bg-neutral-50 {
  background-color: #FAFAFA !important;
}
</style>
