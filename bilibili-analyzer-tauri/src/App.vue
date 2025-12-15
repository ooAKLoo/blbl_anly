<template>
  <div class="app">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div v-if="!sidebarCollapsed" class="logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>Bilibili Analyzer</span>
        </div>
        <button class="icon-btn add-btn" @click="showNewScrapeDialog = true" title="添加UP主">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav" v-if="!sidebarCollapsed">
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
            @click="loadSavedUp(up.mid)"
          >
            <img :src="up.face" class="avatar-sm" />
            <span class="nav-item-text">{{ up.name }}</span>
            <button class="icon-btn icon-btn-sm delete-btn" @click.stop="deleteSavedUp(up.mid)" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <button class="icon-btn settings-btn" @click="showSettingsDialog = true" title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>设置</span>
        </button>
      </div>

      <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
        </svg>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Empty State -->
      <div v-if="!upInfo && videos.length === 0" class="empty-main">
        <div class="empty-main-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
          </svg>
          <h2>开始分析 UP主数据</h2>
          <p>点击左上角 "+" 按钮添加 UP主，开始爬取和分析视频数据</p>
          <button class="btn btn-primary" @click="showNewScrapeDialog = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"/>
            </svg>
            添加 UP主
          </button>
        </div>
      </div>

      <!-- Data View -->
      <div v-else class="data-view">
        <!-- UP Info Header -->
        <header v-if="upInfo" class="up-header">
          <img :src="upInfo.face" class="up-avatar" />
          <div class="up-info">
            <h1>{{ upInfo.name }}</h1>
            <p class="up-sign">{{ upInfo.sign }}</p>
            <span class="level-badge">Lv.{{ upInfo.level }}</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ videos.length }}</span>
              <span class="stat-label">视频数</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ formatNumber(totalPlays) }}</span>
              <span class="stat-label">总播放</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ formatNumber(totalDanmu) }}</span>
              <span class="stat-label">总弹幕</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ formatNumber(avgPlays) }}</span>
              <span class="stat-label">平均播放</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ avgEngagementRate }}%</span>
              <span class="stat-label">平均互动率</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ hitRate }}%</span>
              <span class="stat-label">爆款率</span>
            </div>
          </div>
          <button class="btn btn-ghost export-btn" @click="exportData" :disabled="videos.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
            </svg>
            导出 CSV
          </button>
        </header>

        <!-- Charts Grid -->
        <div v-if="videos.length > 0" class="charts-grid">
          <div class="chart-card">
            <h3>播放量分布</h3>
            <div ref="playDistChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>视频时长分布</h3>
            <div ref="durationChart" class="chart"></div>
          </div>
          <div class="chart-card span-2">
            <h3>月度发布趋势与播放量</h3>
            <div ref="monthlyTrendChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>发布小时 vs 平均播放量（黄金时间）</h3>
            <div ref="hourlyPlayChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>视频时长 vs 平均播放量</h3>
            <div ref="durationPlayChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>播放量 vs 弹幕数（互动深度）</h3>
            <div ref="scatterChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>发布时间热力图</h3>
            <div ref="heatmapChart" class="chart"></div>
          </div>
          <div class="chart-card span-2">
            <h3>TOP15 播放量视频</h3>
            <div ref="topVideosChart" class="chart chart-tall"></div>
          </div>
          <div class="chart-card span-2">
            <h3>TOP15 高互动视频（弹幕/播放比）</h3>
            <div ref="topEngagementChart" class="chart chart-tall"></div>
          </div>
          <div class="chart-card">
            <h3>年度发布数量</h3>
            <div ref="yearlyCountChart" class="chart"></div>
          </div>
          <div class="chart-card">
            <h3>年度平均播放量</h3>
            <div ref="yearlyAvgChart" class="chart"></div>
          </div>
          <div class="chart-card span-2">
            <h3>全部视频播放量时间线</h3>
            <div ref="timelineChart" class="chart chart-tall"></div>
          </div>
        </div>

        <!-- Video List -->
        <section v-if="videos.length > 0" class="video-list-section">
          <div class="section-header">
            <h3>视频列表</h3>
            <div class="search-box">
              <Search :size="16" />
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="搜索标题关键词（如：张三、死刑）"
                class="search-input"
              />
              <button v-if="searchKeyword" class="clear-btn" @click="searchKeyword = ''">
                <X :size="14" />
              </button>
            </div>
            <div class="sort-dropdown" ref="sortDropdownRef">
              <button class="sort-trigger" @click="sortDropdownOpen = !sortDropdownOpen">
                <ArrowUpDown :size="14" />
                <span>{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
                <ChevronDown :size="14" :class="{ 'rotate': sortDropdownOpen }" />
              </button>
              <Transition name="dropdown">
                <div v-if="sortDropdownOpen" class="sort-menu">
                  <div
                    v-for="option in sortOptions"
                    :key="option.value"
                    class="sort-option"
                    :class="{ active: sortBy === option.value }"
                    @click="selectSort(option.value)"
                  >
                    <component :is="option.icon" :size="14" />
                    <span>{{ option.label }}</span>
                    <Check v-if="sortBy === option.value" :size="14" class="check-icon" />
                  </div>
                </div>
              </Transition>
            </div>
            <span class="video-count">{{ filteredVideos.length }} / {{ videos.length }} 个视频</span>
          </div>
          <div v-if="searchKeyword && filteredVideos.length > 0" class="search-stats">
            <span>关键词 "<strong>{{ searchKeyword }}</strong>" 的视频：</span>
            <span>平均播放 <strong>{{ formatNumber(filteredAvgPlays) }}</strong></span>
            <span>平均互动率 <strong>{{ filteredEngagementRate }}%</strong></span>
          </div>
          <div class="video-list" ref="videoListRef" @scroll="handleVideoListScroll">
            <div
              v-for="(video, index) in displayedVideos"
              :key="video.bvid"
              class="video-item"
            >
              <span class="video-rank">{{ index + 1 }}</span>
              <img :src="video.cover_url" class="video-cover" />
              <div class="video-meta">
                <a :href="video.video_url" target="_blank" class="video-title">
                  {{ video.title }}
                </a>
                <div class="video-stats">
                  <span class="stat-item" title="发布时间">
                    <Calendar :size="14" />
                    {{ video.publish_time }}
                  </span>
                  <span class="stat-item" title="视频时长">
                    <Clock :size="14" />
                    {{ video.duration }}
                  </span>
                  <span class="stat-item" title="播放量">
                    <Play :size="14" />
                    {{ formatNumber(video.play_count) }}
                  </span>
                  <span class="stat-item" title="弹幕数">
                    <MessageSquare :size="14" />
                    {{ formatNumber(video.danmu_count) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="displayedVideos.length < filteredVideos.length" class="loading-indicator">
            <span>加载中... ({{ displayedVideos.length }}/{{ filteredVideos.length }})</span>
          </div>
          <div v-else class="loading-indicator">
            <span>已加载全部 {{ filteredVideos.length }} 个视频</span>
          </div>
        </section>
      </div>
    </main>

    <!-- Dialogs -->
    <NewScrapeDialog
      v-model="showNewScrapeDialog"
      :mid="mid"
      :max-pages="maxPages"
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
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import * as echarts from 'echarts';
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
const maxPages = ref(100);
const isLoading = ref(false);
const videos = ref([]);
const upInfo = ref(null);
const progress = ref({ current: 0, total: 0, page: 0, message: '' });
const displayCount = ref(20);

// Sidebar states
const sidebarCollapsed = ref(false);
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

async function handleStartScrape({ mid: newMid, maxPages: newMaxPages }) {
  mid.value = newMid;
  maxPages.value = newMaxPages;
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
      mid: parseInt(mid.value),
      maxPages: maxPages.value
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

// Chart theme for light mode
const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#666666' },
  title: { textStyle: { color: '#1a1a1a' } },
  legend: { textStyle: { color: '#666666' } },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0,0,0,0.1)',
    textStyle: { color: '#1a1a1a' }
  },
  xAxis: {
    axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    axisLabel: { color: '#666666' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
  },
  yAxis: {
    axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    axisLabel: { color: '#666666' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
  }
};

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

  const counts = labels.map(() => 0);
  plays.forEach(p => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (p >= bins[i] && p < bins[i + 1]) {
        counts[i]++;
        break;
      }
    }
  });

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 30 } },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '视频数量' },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#7c4dff' },
          { offset: 1, color: '#5c6bc0' }
        ]),
        borderRadius: [4, 4, 0, 0]
      }
    }]
  });
}

function renderDurationChart() {
  const chart = initChart(durationChart, 'duration');
  if (!chart) return;

  const durations = videos.value.map(v => {
    const parts = v.duration.split(':');
    if (parts.length === 2) return parseInt(parts[0]);
    if (parts.length === 3) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return 0;
  });

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  const counts = labels.map(() => 0);
  durations.forEach(d => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (d >= bins[i] && d < bins[i + 1]) {
        counts[i]++;
        break;
      }
    }
  });

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}', color: '#666666' },
      data: labels.map((name, i) => ({ name, value: counts[i] })),
      color: ['#5c6bc0', '#7c4dff', '#448aff', '#00bcd4', '#26a69a', '#66bb6a', '#ffca28']
    }]
  });
}

function renderMonthlyTrendChart() {
  const chart = initChart(monthlyTrendChart, 'monthlyTrend');
  if (!chart) return;

  const monthlyData = {};
  videos.value.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { count: 0, totalPlays: 0 };
    monthlyData[month].count++;
    monthlyData[month].totalPlays += v.play_count;
  });

  const months = Object.keys(monthlyData).sort();
  const counts = months.map(m => monthlyData[m].count);
  const avgPlaysData = months.map(m => Math.round(monthlyData[m].totalPlays / monthlyData[m].count));

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    legend: { ...chartTheme.legend, data: ['发布数量', '平均播放量'] },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: months,
      axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 45, interval: Math.floor(months.length / 12) }
    },
    yAxis: [
      { ...chartTheme.yAxis, type: 'value', name: '发布数量', position: 'left' },
      { ...chartTheme.yAxis, type: 'value', name: '平均播放量', position: 'right' }
    ],
    series: [
      {
        name: '发布数量',
        type: 'bar',
        data: counts,
        itemStyle: { color: '#5c6bc0', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '平均播放量',
        type: 'line',
        yAxisIndex: 1,
        data: avgPlaysData,
        smooth: true,
        itemStyle: { color: '#7c4dff' },
        lineStyle: { width: 2 }
      }
    ]
  });
}

function renderHourlyPlayChart() {
  const chart = initChart(hourlyPlayChart, 'hourlyPlay');
  if (!chart) return;

  // 按小时统计
  const hourlyData = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { count: 0, totalPlays: 0 };
  }

  videos.value.forEach(v => {
    const hour = new Date(v.publish_time).getHours();
    hourlyData[hour].count++;
    hourlyData[hour].totalPlays += v.play_count;
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
      formatter: p => `${p[0].name}<br/>发布数: ${counts[p[0].dataIndex]}<br/>平均播放: ${formatNumber(p[0].value)}`
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hours },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '平均播放量',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'bar',
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: sortedHours.includes(i)
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ffca28' },
                { offset: 1, color: '#ff9800' }
              ])
            : '#5c6bc0',
          borderRadius: [4, 4, 0, 0]
        }
      })),
      label: {
        show: false
      }
    }]
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
      formatter: p => `${p[0].name}<br/>视频数: ${durationData[p[0].dataIndex].count}<br/>平均播放: ${formatNumber(p[0].value)}`
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '平均播放量',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'bar',
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: i === bestIndex
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#26a69a' },
                { offset: 1, color: '#00897b' }
              ])
            : '#5c6bc0',
          borderRadius: [4, 4, 0, 0]
        }
      }))
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
      formatter: p => `播放: ${formatNumber(p.value[0])}<br/>弹幕: ${formatNumber(p.value[1])}`
    },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      name: '播放量',
      axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '弹幕数',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: data,
      itemStyle: { color: '#26a69a', opacity: 0.7 }
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

  videos.value.forEach(v => {
    const date = new Date(v.publish_time);
    const weekday = (date.getDay() + 6) % 7;
    const hour = date.getHours();
    const key = `${weekday}-${hour}`;
    countMap[key] = (countMap[key] || 0) + 1;
  });

  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      data.push([h, w, countMap[`${w}-${h}`] || 0]);
    }
  }

  const maxCount = Math.max(...data.map(d => d[2]));

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      formatter: p => `${weekdays[p.value[1]]} ${p.value[0]}时: ${p.value[2]}个视频`
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hours, splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(0,0,0,0.02)'] } } },
    yAxis: { ...chartTheme.yAxis, type: 'category', data: weekdays, splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(0,0,0,0.02)'] } } },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: '#666666' },
      inRange: { color: ['#f0f4ff', '#c5cae9', '#9fa8da', '#7986cb', '#5c6bc0'] }
    },
    series: [{
      type: 'heatmap',
      data: data,
      label: { show: false }
    }]
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
      formatter: p => {
        const video = topVideosData[14 - p[0].dataIndex];
        return `${video.title}<br/>播放量: ${formatNumber(video.play_count)}`;
      }
    },
    grid: { left: '22%', right: '10%' },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: v => formatNumber(v) }
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
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#5c6bc0' },
          { offset: 1, color: '#7c4dff' }
        ]),
        borderRadius: [0, 4, 4, 0]
      }
    }]
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
      formatter: p => {
        const video = videosWithEngagement[14 - p[0].dataIndex];
        return `${video.title}<br/>互动率: ${video.engagementRate.toFixed(2)}%<br/>播放: ${formatNumber(video.play_count)}<br/>弹幕: ${formatNumber(video.danmu_count)}`;
      }
    },
    grid: { left: '22%', right: '10%' },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'value',
      name: '互动率 (%)',
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
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#26a69a' },
          { offset: 1, color: '#00bcd4' }
        ]),
        borderRadius: [0, 4, 4, 0]
      }
    }]
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
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '视频数量' },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: { color: '#448aff', borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', color: '#666666' }
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
      formatter: p => `${p[0].name}年<br/>平均播放: ${formatNumber(p[0].value)}`
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: years },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '平均播放量',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'line',
      data: avgPlaysData,
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(124, 77, 255, 0.4)' },
          { offset: 1, color: 'rgba(124, 77, 255, 0.05)' }
        ])
      },
      itemStyle: { color: '#7c4dff' },
      lineStyle: { width: 2 }
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
        return `<div style="max-width: 300px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${video.title}</div>
          <div style="color: #666;">发布时间: ${video.publish_time}</div>
          <div style="color: #7c4dff; font-weight: 600;">播放量: ${formatNumber(video.play_count)}</div>
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
        backgroundColor: 'rgba(0,0,0,0.05)',
        fillerColor: 'rgba(92, 107, 192, 0.2)',
        handleStyle: { color: '#5c6bc0' },
        textStyle: { color: '#666666' }
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
      nameTextStyle: { color: '#666666', fontSize: 12 }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'value',
      name: '播放量',
      axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'bar',
      data: plays,
      barMaxWidth: 20,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#7c4dff' },
          { offset: 1, color: '#5c6bc0' }
        ]),
        borderRadius: [2, 2, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#9c7cff' },
            { offset: 1, color: '#7c8bd0' }
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
/* CSS Variables - Linear/Notion inspired light theme */
:root {
  --bg-primary: #f4f4f4;
  --bg-secondary: #ffffff;
  --bg-tertiary: #fafafa;
  --bg-hover: #f0f0f0;
  --bg-active: #e8e8e8;

  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.1);

  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;

  --accent-primary: #5c6bc0;
  --accent-secondary: #7c4dff;
  --accent-success: #26a69a;
  --accent-danger: #ff5252;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.app {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 260px;
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: width var(--transition-base);
  z-index: 100;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  min-height: 56px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.logo svg {
  color: var(--accent-primary);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}

.nav-section {
  margin-bottom: 16px;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 8px 12px;
}

.empty-state {
  padding: 16px 12px;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  margin-bottom: 2px;
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.active {
  background: var(--bg-active);
}

.nav-item-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item.active .nav-item-text {
  color: var(--text-primary);
}

.avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-subtle);
}

.delete-btn {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.nav-item:hover .delete-btn {
  opacity: 1;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-subtle);
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.settings-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.collapse-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-fast);
  z-index: 10;
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Icon Button */
.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.icon-btn-sm {
  padding: 4px;
}

.add-btn {
  background: var(--accent-primary);
  color: white;
}

.add-btn:hover {
  background: #6d7cd0;
  color: white;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--bg-primary);
  transition: margin-left var(--transition-base);
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
}

/* Empty Main */
.empty-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
}

.empty-main-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.empty-main-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.empty-main-content p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 0.95rem;
}

/* Data View */
.data-view {
  padding: 24px 32px;
  max-width: 1600px;
  margin: 0 auto;
  overflow-x: hidden;
}

/* UP Header */
.up-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  margin-bottom: 24px;
  overflow: hidden;
}

.up-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--accent-primary);
}

.up-info {
  flex: 1;
}

.up-info h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.up-sign {
  color: var(--text-secondary);
  font-size: 0.875rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.level-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ffca28, #ff9800);
  color: #1a1a1a;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  min-width: 80px;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-primary);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.export-btn {
  margin-left: auto;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: 20px;
}

.chart-card.span-2 {
  grid-column: span 2;
}

.chart-card h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart {
  height: 280px;
}

.chart-tall {
  height: 380px;
}

/* Video List */
.video-list-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: 20px;
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-right: auto;
}

.video-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 12px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.video-item:hover {
  background: var(--bg-hover);
}

.video-rank {
  width: 32px;
  text-align: center;
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 0.875rem;
}

.video-cover {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.video-meta {
  flex: 1;
  min-width: 0;
}

.video-title {
  display: block;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.video-title:hover {
  color: var(--accent-primary);
}

.video-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-item svg {
  opacity: 0.7;
}

.loading-indicator {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  flex: 1;
  max-width: 400px;
  margin: 0 16px;
}

.search-box svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.search-stats {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(92, 107, 192, 0.1), rgba(124, 77, 255, 0.1));
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.search-stats strong {
  color: var(--accent-primary);
}

.sort-dropdown {
  position: relative;
}

.sort-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sort-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
}

.sort-trigger svg.rotate {
  transform: rotate(180deg);
}

.sort-trigger svg {
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.sort-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sort-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sort-option.active {
  background: rgba(92, 107, 192, 0.1);
  color: var(--accent-primary);
}

.sort-option .check-icon {
  margin-left: auto;
  color: var(--accent-primary);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d7cd0;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .up-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    flex-wrap: wrap;
    justify-content: center;
  }

  .export-btn {
    margin-left: 0;
  }

  .video-cover {
    width: 80px;
    height: 45px;
  }

  .video-stats {
    flex-wrap: wrap;
    gap: 8px;
  }

  .data-view {
    padding: 16px;
  }
}
</style>
