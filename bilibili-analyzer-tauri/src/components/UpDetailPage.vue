<template>
  <div class="min-h-screen bg-neutral-50/50">
    <!-- Sticky Header -->
    <header v-if="upInfo" class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div class="max-w-[1400px] mx-auto px-6 py-4">
        <div class="flex items-center gap-5">
          <!-- Avatar -->
          <img :src="upFaceUrl" class="w-14 h-14 rounded-full ring-2 ring-black/[0.04] shadow-sm" referrerpolicy="no-referrer" />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-lg font-semibold text-neutral-900 truncate">{{ upInfo.name }}</h1>
              <span class="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-semibold rounded-full">
                Lv.{{ upInfo.level }}
              </span>
            </div>
            <p class="text-sm text-neutral-500 truncate max-w-md">{{ upInfo.sign || '这个人很懒，什么都没写' }}</p>
          </div>

          <!-- Key Metrics -->
          <div class="hidden md:flex items-center gap-1">
            <div class="metric-card">
              <span class="metric-value">{{ videos.length }}</span>
              <span class="metric-label">视频</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ formatNumber(avgPlays) }}</span>
              <span class="metric-label">均播放</span>
            </div>
            <div class="metric-card">
              <span class="metric-value text-amber-500">{{ hitRate }}%</span>
              <span class="metric-label">爆款率</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-[1400px] mx-auto px-6 py-6">
      <!-- Tab Navigation -->
      <nav class="flex items-center gap-1 p-1 bg-neutral-100/80 rounded-xl mb-6 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
          ]"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
          <span v-if="tab.id === 'videos'" class="ml-1 px-1.5 py-0.5 text-[10px] bg-neutral-100 rounded-full text-neutral-500">
            {{ videos.length }}
          </span>
        </button>
      </nav>

      <!-- Tab Content: 数据分析 -->
      <div v-show="activeTab === 'analysis'" class="space-y-6">
        <!-- Data Range Info -->
        <div class="flex items-center gap-2 text-sm text-neutral-500">
          <BarChart3 :size="14" class="text-neutral-400" />
          <span>统计范围：<strong class="text-neutral-700">{{ videos.length }}</strong> 个视频</span>
          <span class="text-neutral-300">·</span>
          <span>{{ dataTimeRange }}</span>
        </div>

        <!-- Stats Overview Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div class="stat-card">
            <div class="stat-icon bg-blue-50 text-blue-500"><Play :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ formatNumber(totalPlays) }}</span>
              <span class="stat-card-label">总播放</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-purple-50 text-purple-500"><MessageSquare :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ formatNumber(totalDanmu) }}</span>
              <span class="stat-card-label">总弹幕</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-emerald-50 text-emerald-500"><TrendingUp :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ formatNumber(avgPlays) }}</span>
              <span class="stat-card-label">均播放</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-orange-50 text-orange-500"><Zap :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ avgEngagementRate }}%</span>
              <span class="stat-card-label">互动率</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-rose-50 text-rose-500"><Flame :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ hitRate }}%</span>
              <span class="stat-card-label">爆款率</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-cyan-50 text-cyan-500"><Clock :size="18" /></div>
            <div>
              <span class="stat-card-value">{{ avgDuration }}</span>
              <span class="stat-card-label">均时长</span>
            </div>
          </div>
        </div>

        <!-- Charts Grid - Organized by Category -->
        <div v-if="videos.length > 0" class="space-y-6">
          <!-- 核心数据 -->
          <section>
            <h2 class="section-title">
              <BarChart3 :size="16" />
              核心数据分析
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="chart-card">
                <h3 class="chart-title">播放量分布</h3>
                <div ref="playDistChart" class="h-[260px]"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">视频时长分布</h3>
                <div ref="durationChart" class="h-[260px]"></div>
              </div>
            </div>
          </section>

          <!-- 时间趋势 -->
          <section>
            <h2 class="section-title">
              <TrendingUp :size="16" />
              时间趋势
            </h2>
            <div class="chart-card">
              <h3 class="chart-title">月度发布趋势与播放量</h3>
              <div ref="monthlyTrendChart" class="h-[280px]"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div class="chart-card">
                <h3 class="chart-title">发布小时 vs 平均播放量</h3>
                <div ref="hourlyPlayChart" class="h-[260px]"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">发布时间热力图</h3>
                <div ref="heatmapChart" class="h-[260px]"></div>
              </div>
            </div>
          </section>

          <!-- 内容分析 -->
          <section>
            <h2 class="section-title">
              <Target :size="16" />
              内容表现
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="chart-card">
                <h3 class="chart-title">时长 vs 平均播放量</h3>
                <div ref="durationPlayChart" class="h-[260px]"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">播放量 vs 弹幕数</h3>
                <div ref="scatterChart" class="h-[260px]"></div>
              </div>
            </div>
          </section>

          <!-- TOP榜单 -->
          <section>
            <h2 class="section-title">
              <Award :size="16" />
              TOP 榜单
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="chart-card">
                <h3 class="chart-title">TOP15 播放量视频</h3>
                <div ref="topVideosChart" class="h-[360px]"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">TOP15 高互动视频</h3>
                <div ref="topEngagementChart" class="h-[360px]"></div>
              </div>
            </div>
          </section>

          <!-- 年度回顾 -->
          <section>
            <h2 class="section-title">
              <Calendar :size="16" />
              年度回顾
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="chart-card">
                <h3 class="chart-title">年度发布数量</h3>
                <div ref="yearlyCountChart" class="h-[260px]"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">年度平均播放量</h3>
                <div ref="yearlyAvgChart" class="h-[260px]"></div>
              </div>
            </div>
            <div class="chart-card mt-4">
              <h3 class="chart-title">全部视频播放量时间线</h3>
              <div ref="timelineChart" class="h-[320px]"></div>
            </div>
          </section>
        </div>
      </div>

      <!-- Tab Content: 视频列表 -->
      <div v-show="activeTab === 'videos'" class="space-y-4">
        <!-- Search & Filter Bar -->
        <div class="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div class="flex items-center gap-2 flex-1 min-w-[240px] max-w-md px-3 py-2 bg-neutral-50 rounded-lg">
            <Search :size="16" class="text-neutral-400" />
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜索视频标题..."
              class="flex-1 bg-transparent border-0 outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
            />
            <button v-if="searchKeyword" @click="searchKeyword = ''" class="text-neutral-400 hover:text-neutral-600">
              <X :size="14" />
            </button>
          </div>

          <div class="relative" ref="sortDropdownRef">
            <button
              @click="sortDropdownOpen = !sortDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-sm text-neutral-600 transition-colors"
            >
              <ArrowUpDown :size="14" />
              {{ sortOptions.find(o => o.value === sortBy)?.label }}
              <ChevronDown :size="14" :class="sortDropdownOpen ? 'rotate-180' : ''" class="transition-transform" />
            </button>
            <Transition name="dropdown">
              <div v-if="sortDropdownOpen" class="absolute top-full mt-1 right-0 w-44 p-1.5 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50">
                <button
                  v-for="option in sortOptions"
                  :key="option.value"
                  @click="selectSort(option.value)"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    sortBy === option.value
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  ]"
                >
                  <component :is="option.icon" :size="14" />
                  {{ option.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- View Mode Toggle -->
          <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-1.5 rounded-md transition-all duration-150',
                viewMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              ]"
              title="网格视图"
            >
              <LayoutGrid :size="16" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-1.5 rounded-md transition-all duration-150',
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              ]"
              title="列表视图"
            >
              <List :size="16" />
            </button>
          </div>

          <span class="text-xs text-neutral-400 ml-auto">
            {{ filteredVideos.length }} / {{ videos.length }} 个视频
          </span>
        </div>

        <!-- Search Stats -->
        <div v-if="searchKeyword && filteredVideos.length > 0" class="flex items-center gap-6 px-4 py-3 bg-blue-50/50 rounded-xl text-sm">
          <span class="text-neutral-600">关键词 "<strong class="text-blue-600">{{ searchKeyword }}</strong>"</span>
          <span class="text-neutral-500">平均播放 <strong class="text-blue-600">{{ formatNumber(filteredAvgPlays) }}</strong></span>
          <span class="text-neutral-500">互动率 <strong class="text-blue-600">{{ filteredEngagementRate }}%</strong></span>
        </div>

        <!-- Video Grid View (Virtual Scroll) -->
        <VirtualGrid
          v-if="viewMode === 'grid'"
          ref="virtualGridRef"
          :items="filteredVideos"
          key-field="bvid"
          :min-column-width="280"
          :gap="16"
          :item-height="290"
          :buffer="3"
          class="virtual-grid-wrapper"
        >
          <template #default="{ item: video, index }">
            <div class="video-card group h-full flex flex-col">
              <div class="relative aspect-video rounded-lg overflow-hidden flex-shrink-0">
                <img :src="getVideoCoverUrl(video)" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerpolicy="no-referrer" loading="lazy" />
                <span class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                  {{ video.duration }}
                </span>
                <span class="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
                  #{{ index + 1 }}
                </span>
              </div>
              <div class="flex flex-col flex-1 pt-3">
                <a :href="video.video_url" target="_blank" class="block text-sm font-medium text-neutral-900 hover:text-blue-600 line-clamp-2 h-10 transition-colors">
                  {{ video.title }}
                </a>
                <div class="flex items-center gap-3 text-xs text-neutral-500 mt-auto">
                  <span class="flex items-center gap-1">
                    <Play :size="12" />
                    {{ formatNumber(video.play_count) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <MessageSquare :size="12" />
                    {{ formatNumber(video.danmu_count) }}
                  </span>
                  <span class="ml-auto">{{ formatDate(video.publish_time) }}</span>
                </div>
              </div>
            </div>
          </template>
        </VirtualGrid>

        <!-- Video List View (Virtual Scroll) -->
        <VirtualGrid
          v-else
          ref="virtualListRef"
          :items="filteredVideos"
          key-field="bvid"
          :min-column-width="9999"
          :gap="8"
          :item-height="96"
          :buffer="5"
          class="virtual-list-wrapper"
        >
          <template #default="{ item: video, index }">
            <div class="flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50/80 transition-colors group">
              <!-- Rank -->
              <span class="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">
                {{ index + 1 }}
              </span>

              <!-- Thumbnail -->
              <div class="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                <img :src="getVideoCoverUrl(video)" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerpolicy="no-referrer" loading="lazy" />
                <span class="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] rounded">
                  {{ video.duration }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <a :href="video.video_url" target="_blank" class="block text-sm font-medium text-neutral-900 hover:text-blue-600 truncate mb-2 transition-colors">
                  {{ video.title }}
                </a>
                <div class="flex items-center gap-4 text-xs text-neutral-500">
                  <span class="flex items-center gap-1">
                    <Calendar :size="12" class="opacity-60" />
                    {{ formatDate(video.publish_time) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Play :size="12" class="opacity-60" />
                    {{ formatNumber(video.play_count) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <MessageSquare :size="12" class="opacity-60" />
                    {{ formatNumber(video.danmu_count) }}
                  </span>
                  <span class="flex items-center gap-1 text-amber-500">
                    <Zap :size="12" />
                    {{ ((video.danmu_count / video.play_count) * 100).toFixed(2) }}%
                  </span>
                </div>
              </div>
            </div>
          </template>
        </VirtualGrid>

        <!-- Video Count Footer -->
        <div v-if="filteredVideos.length > 0" class="text-center py-4 text-sm text-neutral-400">
          共 {{ filteredVideos.length }} 个视频
        </div>
      </div>

      <!-- Tab Content: 文本分析 -->
      <div v-show="activeTab === 'text-analysis'" class="space-y-6">
        <!-- Placeholder for future text analysis feature -->
        <div class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText :size="28" class="text-neutral-400" />
          </div>
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">文本分析</h3>
          <p class="text-sm text-neutral-500 text-center max-w-md mb-6">
            分析视频标题、评论和弹幕的关键词、情感倾向等文本数据，帮助你更好地理解观众偏好。
          </p>
          <span class="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
            即将推出
          </span>
        </div>
      </div>
    </main>

    <!-- Video Drawer -->
    <VideoDetailDrawer
      v-model:visible="drawerVisible"
      :title="drawerTitle"
      :videos="drawerVideos"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import VideoDetailDrawer from './VideoDetailDrawer.vue';
import VirtualGrid from './VirtualGrid.vue';
import { formatNumber, formatAxisNumber, parseDuration, parseDurationMinutes, getImageUrl } from '../utils';
import { chartTheme, distributionColors, heatmapColors, colors, gradients, highlightColor, secondaryAxis } from '../theme';
import {
  Calendar,
  Clock,
  Play,
  MessageSquare,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  ArrowDownWideNarrow,
  Timer,
  BarChart3,
  Target,
  Award,
  FileText,
  Zap,
  Flame,
  LayoutGrid,
  List
} from 'lucide-vue-next';

const props = defineProps({
  upInfo: {
    type: Object,
    default: null
  },
  videos: {
    type: Array,
    default: () => []
  }
});

// Tab state
const activeTab = ref('analysis');
const tabs = [
  { id: 'analysis', label: '数据分析', icon: BarChart3 },
  { id: 'videos', label: '视频列表', icon: Play },
  { id: 'text-analysis', label: '文本分析', icon: FileText }
];

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
const virtualGridRef = ref(null);
const virtualListRef = ref(null);

// 搜索和排序
const searchKeyword = ref('');
const sortBy = ref('time_desc');
const sortDropdownOpen = ref(false);
const sortDropdownRef = ref(null);
const viewMode = ref('grid'); // 'grid' | 'list'

// 图表交互状态
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerVideos = ref([]);

let charts = {};

const sortOptions = [
  { value: 'time_desc', label: '最新发布', icon: Calendar },
  { value: 'time_asc', label: '最早发布', icon: Calendar },
  { value: 'play_desc', label: '播放最高', icon: TrendingUp },
  { value: 'play_asc', label: '播放最低', icon: ArrowDownWideNarrow },
  { value: 'danmu_desc', label: '弹幕最多', icon: MessageSquare },
  { value: 'engagement_desc', label: '互动率最高', icon: TrendingUp },
  { value: 'duration_desc', label: '时长最长', icon: Timer },
  { value: 'duration_asc', label: '时长最短', icon: Timer },
];

// Computed
const totalPlays = computed(() => props.videos.reduce((sum, v) => sum + v.play_count, 0));
const totalDanmu = computed(() => props.videos.reduce((sum, v) => sum + v.danmu_count, 0));

const upFaceUrl = computed(() => {
  if (!props.upInfo) return '';
  return getImageUrl(props.upInfo.face);
});

function getVideoCoverUrl(video) {
  return getImageUrl(video.cover);
}

const avgPlays = computed(() => {
  if (props.videos.length === 0) return 0;
  return Math.round(totalPlays.value / props.videos.length);
});

const avgEngagementRate = computed(() => {
  if (totalPlays.value === 0) return '0.00';
  return ((totalDanmu.value / totalPlays.value) * 100).toFixed(2);
});

const hitRate = computed(() => {
  if (props.videos.length === 0) return '0.0';
  const threshold = avgPlays.value * 2;
  const hitCount = props.videos.filter(v => v.play_count >= threshold).length;
  return ((hitCount / props.videos.length) * 100).toFixed(1);
});

const avgDuration = computed(() => {
  if (props.videos.length === 0) return '0:00';
  const totalSeconds = props.videos.reduce((sum, v) => sum + parseDuration(v.duration), 0);
  const avgSeconds = Math.round(totalSeconds / props.videos.length);
  const minutes = Math.floor(avgSeconds / 60);
  const seconds = avgSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const dataTimeRange = computed(() => {
  if (props.videos.length === 0) return '';
  const dates = props.videos.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const formatYM = (d) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${formatYM(earliest)} - ${formatYM(latest)}`;
});

const filteredVideos = computed(() => {
  let result = props.videos;

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(v => v.title.toLowerCase().includes(keyword));
  }

  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc': return new Date(b.publish_time) - new Date(a.publish_time);
      case 'time_asc': return new Date(a.publish_time) - new Date(b.publish_time);
      case 'play_desc': return b.play_count - a.play_count;
      case 'play_asc': return a.play_count - b.play_count;
      case 'danmu_desc': return b.danmu_count - a.danmu_count;
      case 'engagement_desc': return (b.danmu_count / b.play_count) - (a.danmu_count / a.play_count);
      case 'duration_desc': return parseDuration(b.duration) - parseDuration(a.duration);
      case 'duration_asc': return parseDuration(a.duration) - parseDuration(b.duration);
      default: return 0;
    }
  });

  return result;
});

const filteredAvgPlays = computed(() => {
  if (filteredVideos.value.length === 0) return 0;
  const total = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  return Math.round(total / filteredVideos.value.length);
});

const filteredEngagementRate = computed(() => {
  if (filteredVideos.value.length === 0) return '0.00';
  const totalPlays = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  const totalDanmu = filteredVideos.value.reduce((sum, v) => sum + v.danmu_count, 0);
  if (totalPlays === 0) return '0.00';
  return ((totalDanmu / totalPlays) * 100).toFixed(2);
});

// Methods
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function selectSort(value) {
  sortBy.value = value;
  sortDropdownOpen.value = false;
}

function openVideoDrawer(title, videosToShow) {
  drawerTitle.value = title;
  drawerVideos.value = videosToShow;
  drawerVisible.value = true;
}

function handleClickOutside(e) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    sortDropdownOpen.value = false;
  }
}

// 搜索或排序变化时滚动回顶部
watch([searchKeyword, sortBy], () => {
  if (virtualGridRef.value) virtualGridRef.value.scrollToTop();
  if (virtualListRef.value) virtualListRef.value.scrollToTop();
});

watch(() => props.videos, (newVideos) => {
  if (newVideos.length > 0) {
    setTimeout(() => renderAllCharts(), 100);
  }
}, { immediate: true });

// 图表相关方法
function initChart(ref, name) {
  if (!ref.value) return null;
  if (charts[name]) charts[name].dispose();
  charts[name] = echarts.init(ref.value);
  return charts[name];
}

function renderAllCharts() {
  if (props.videos.length === 0) return;
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

function renderPlayDistChart() {
  const chart = initChart(playDistChart, 'playDist');
  if (!chart) return;

  const bins = [0, 500000, 1000000, 1500000, 2000000, 3000000, 5000000, Infinity];
  const labels = ['<50万', '50-100万', '100-150万', '150-200万', '200-300万', '300-500万', '>500万'];

  const videosByBin = labels.map(() => []);
  props.videos.forEach(v => {
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
        return `<div style="font-size: 13px;"><strong>${labels[idx]}</strong><br/>共 ${count} 个视频<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 0, interval: 0 } },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 32,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
        borderRadius: [6, 6, 0, 0]
      },
      emphasis: { itemStyle: { color: colors.blue600 } }
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`播放量区间: ${labels[idx]}`, videosByBin[idx]);
  });
}

function renderDurationChart() {
  const chart = initChart(durationChart, 'duration');
  if (!chart) return;

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  const videosByBin = labels.map(() => []);
  props.videos.forEach(v => {
    const minutes = parseDurationMinutes(v.duration);
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
    grid: { top: 20, right: 50, bottom: 30, left: 20, containLabel: true },
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'none' },
      confine: true,
      formatter: (params) => {
        const idx = params[0].dataIndex;
        return `<div style="font-size: 13px;"><strong>${labels[idx]}</strong><br/>共 ${counts[idx]} 个视频<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 0, rotate: 0 } },
    yAxis: { ...chartTheme.yAxis, type: 'value' },
    series: [{
      type: 'bar',
      data: counts.map((value, i) => ({
        value,
        itemStyle: { color: distributionColors[i], borderRadius: [20, 20, 20, 20] }
      })),
      barWidth: '50%',
      barMaxWidth: 40,
      showBackground: true,
      backgroundStyle: { color: 'rgba(243, 244, 246, 0.6)', borderRadius: [20, 20, 20, 20] },
      label: { show: true, position: 'top', formatter: (params) => params.value > 0 ? params.value : '', color: '#6B7280', fontSize: 11, fontWeight: 500 }
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`时长区间: ${labels[idx]}`, videosByBin[idx]);
  });
}

function renderMonthlyTrendChart() {
  const chart = initChart(monthlyTrendChart, 'monthlyTrend');
  if (!chart) return;

  const monthlyData = {};
  const monthlyVideos = {};

  props.videos.forEach(v => {
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
        return `<div><strong>${month}</strong><br/>发布: ${params[0].value} 个<br/>均播放: ${formatNumber(params[1]?.value || 0)}</div>`;
      }
    },
    legend: { ...chartTheme.legend, data: ['发布数量', '平均播放量'] },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: months, axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 45, interval: Math.floor(months.length / 12) } },
    yAxis: [
      { ...chartTheme.yAxis, type: 'value', position: 'left', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
      { ...chartTheme.yAxis, type: 'value', position: 'right', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } }
    ],
    series: [
      { name: '发布数量', type: 'bar', data: counts, barMaxWidth: 32, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar), borderRadius: [6, 6, 0, 0] } },
      { name: '平均播放量', type: 'line', yAxisIndex: 1, data: avgPlaysData, smooth: 0.4, showSymbol: false, itemStyle: { color: secondaryAxis.line }, lineStyle: { width: 2.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, secondaryAxis.area) } }
    ]
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params.seriesType === 'bar') {
      const month = params.name;
      openVideoDrawer(`发布月份: ${month}`, monthlyVideos[month]);
    }
  });
}

function renderHourlyPlayChart() {
  const chart = initChart(hourlyPlayChart, 'hourlyPlay');
  if (!chart) return;

  const hourlyData = {};
  const hourlyVideos = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { count: 0, totalPlays: 0 };
    hourlyVideos[i] = [];
  }

  props.videos.forEach(v => {
    const hour = new Date(v.publish_time).getHours();
    hourlyData[hour].count++;
    hourlyData[hour].totalPlays += v.play_count;
    hourlyVideos[hour].push(v);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i + '时');
  const avgPlaysData = hours.map((_, i) => hourlyData[i].count > 0 ? Math.round(hourlyData[i].totalPlays / hourlyData[i].count) : 0);
  const sortedHours = [...avgPlaysData.map((v, i) => ({ hour: i, avg: v }))].sort((a, b) => b.avg - a.avg).slice(0, 3).map(h => h.hour);

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', confine: true },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hours },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{
      type: 'bar',
      barMaxWidth: 32,
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: sortedHours.includes(i)
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, highlightColor.gradient)
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
          borderRadius: [6, 6, 0, 0]
        }
      }))
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`发布时间: ${idx}时`, hourlyVideos[idx]);
  });
}

function renderDurationPlayChart() {
  const chart = initChart(durationPlayChart, 'durationPlay');
  if (!chart) return;

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];
  const durationData = labels.map(() => ({ count: 0, totalPlays: 0 }));

  props.videos.forEach(v => {
    const minutes = parseDurationMinutes(v.duration);
    for (let i = 0; i < bins.length - 1; i++) {
      if (minutes >= bins[i] && minutes < bins[i + 1]) {
        durationData[i].count++;
        durationData[i].totalPlays += v.play_count;
        break;
      }
    }
  });

  const avgPlaysData = durationData.map(d => d.count > 0 ? Math.round(d.totalPlays / d.count) : 0);
  const bestIndex = avgPlaysData.indexOf(Math.max(...avgPlaysData));

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{
      type: 'bar',
      barMaxWidth: 32,
      data: avgPlaysData.map((v, i) => ({
        value: v,
        itemStyle: {
          color: i === bestIndex
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, highlightColor.gradient)
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
          borderRadius: [6, 6, 0, 0]
        }
      }))
    }]
  });
}

function renderScatterChart() {
  const chart = initChart(scatterChart, 'scatter');
  if (!chart) return;

  const data = props.videos.map(v => [v.play_count, v.danmu_count]);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'item',
      formatter: p => `播放: ${formatNumber(p.value[0])}<br/>弹幕: ${formatNumber(p.value[1])}`
    },
    xAxis: { ...chartTheme.xAxis, type: 'value', name: '播放量', axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber } },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '弹幕数', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'scatter', symbolSize: 6, data: data, itemStyle: { color: colors.blue500, opacity: 0.6 } }]
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

  props.videos.forEach(v => {
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
    tooltip: { ...chartTheme.tooltip, confine: true },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hours },
    yAxis: { ...chartTheme.yAxis, type: 'category', data: weekdays },
    visualMap: { min: 0, max: maxCount, calculable: true, orient: 'horizontal', left: 'center', bottom: 5, inRange: { color: heatmapColors } },
    series: [{ type: 'heatmap', data: data, itemStyle: { borderRadius: 4, borderWidth: 3, borderColor: '#ffffff' } }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const weekday = params.value[1];
    const hour = params.value[0];
    const key = `${weekday}-${hour}`;
    const vids = videoMap[key] || [];
    if (vids.length > 0) {
      openVideoDrawer(`${weekdays[weekday]} ${hour}时发布的视频`, vids);
    }
  });
}

function renderTopVideosChart() {
  const chart = initChart(topVideosChart, 'topVideos');
  if (!chart) return;

  const topVideosData = [...props.videos].sort((a, b) => b.play_count - a.play_count).slice(0, 15);
  const titles = topVideosData.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
  const plays = topVideosData.map(v => v.play_count);

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', confine: true },
    grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
    xAxis: { ...chartTheme.xAxis, type: 'value', axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber } },
    yAxis: { ...chartTheme.yAxis, type: 'category', data: titles.reverse(), axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' } },
    series: [{ type: 'bar', data: plays.reverse(), barMaxWidth: 24, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.barHorizontal), borderRadius: [0, 6, 6, 0] } }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const video = topVideosData[14 - params.dataIndex];
    window.open(video.video_url, '_blank');
  });
}

function renderTopEngagementChart() {
  const chart = initChart(topEngagementChart, 'topEngagement');
  if (!chart) return;

  const videosWithEngagement = props.videos
    .filter(v => v.play_count >= 10000)
    .map(v => ({ ...v, engagementRate: (v.danmu_count / v.play_count) * 100 }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 15);

  const titles = videosWithEngagement.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
  const rates = videosWithEngagement.map(v => v.engagementRate.toFixed(2));

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', confine: true },
    grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
    xAxis: { ...chartTheme.xAxis, type: 'value', axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: v => v + '%' } },
    yAxis: { ...chartTheme.yAxis, type: 'category', data: titles.reverse(), axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' } },
    series: [{ type: 'bar', data: rates.reverse(), barMaxWidth: 24, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.barHorizontal), borderRadius: [0, 6, 6, 0] } }]
  });

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
  props.videos.forEach(v => {
    const year = v.publish_time.slice(0, 4);
    yearlyData[year] = (yearlyData[year] || 0) + 1;
  });

  const years = Object.keys(yearlyData).sort();
  const counts = years.map(y => yearlyData[y]);

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: years },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'bar', data: counts, barMaxWidth: 48, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: '#6B7280', fontSize: 11, fontWeight: 600 } }]
  });
}

function renderYearlyAvgChart() {
  const chart = initChart(yearlyAvgChart, 'yearlyAvg');
  if (!chart) return;

  const yearlyData = {};
  props.videos.forEach(v => {
    const year = v.publish_time.slice(0, 4);
    if (!yearlyData[year]) yearlyData[year] = { count: 0, totalPlays: 0 };
    yearlyData[year].count++;
    yearlyData[year].totalPlays += v.play_count;
  });

  const years = Object.keys(yearlyData).sort();
  const avgPlaysData = years.map(y => Math.round(yearlyData[y].totalPlays / yearlyData[y].count));

  chart.setOption({
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: years },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'line', data: avgPlaysData, smooth: 0.4, showSymbol: false, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.area) }, itemStyle: { color: colors.blue500 }, lineStyle: { width: 2.5 } }]
  });
}

function renderTimelineChart() {
  const chart = initChart(timelineChart, 'timeline');
  if (!chart) return;

  const sortedVideos = [...props.videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
  const titles = sortedVideos.map((v, i) => `#${i + 1}`);
  const plays = sortedVideos.map(v => v.play_count);

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      formatter: p => {
        const video = sortedVideos[p[0].dataIndex];
        return `<div style="max-width: 280px;"><strong>${video.title}</strong><br/>发布: ${video.publish_time}<br/>播放: ${formatNumber(video.play_count)}</div>`;
      }
    },
    grid: { left: '8%', right: '4%', bottom: '22%', top: '10%' },
    dataZoom: [
      { type: 'slider', show: true, start: 0, end: 100, bottom: 8, height: 18, borderColor: 'transparent', backgroundColor: '#F3F4F6', fillerColor: 'rgba(59, 130, 246, 0.2)', handleStyle: { color: colors.primary } }
    ],
    xAxis: { ...chartTheme.xAxis, type: 'category', data: titles, axisLabel: { ...chartTheme.xAxis.axisLabel, interval: Math.floor(sortedVideos.length / 20), rotate: 0 }, name: '视频序号', nameLocation: 'middle', nameGap: 25 },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'bar', data: plays, barMaxWidth: 16, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors.primary }, { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }]), borderRadius: [3, 3, 0, 0] } }]
  });
}

defineExpose({ renderAllCharts });

function handleResize() {
  Object.values(charts).forEach(chart => {
    if (chart) chart.resize();
  });
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  Object.values(charts).forEach(chart => {
    if (chart) chart.dispose();
  });
});
</script>

<style scoped>
/* Metric Cards in Header */
.metric-card {
  @apply flex flex-col items-center px-4 py-1;
}

.metric-value {
  @apply text-base font-semibold text-neutral-900 tabular-nums;
}

.metric-label {
  @apply text-[10px] text-neutral-500 mt-0.5;
}

/* Stats Cards */
.stat-card {
  @apply flex items-center gap-3 p-4 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)];
}

.stat-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0;
}

.stat-card-value {
  @apply block text-lg font-semibold text-neutral-900 tabular-nums;
}

.stat-card-label {
  @apply block text-xs text-neutral-500 mt-0.5;
}

/* Section Title */
.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-4;
}

/* Chart Card */
.chart-card {
  @apply bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5;
}

.chart-title {
  @apply text-sm font-medium text-neutral-700 mb-3;
}

/* Video Card */
.video-card {
  @apply bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-3;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Line Clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Virtual Scroll Wrapper */
.virtual-grid-wrapper {
  height: calc(100vh - 320px);
  min-height: 400px;
}

.virtual-list-wrapper {
  height: calc(100vh - 320px);
  min-height: 400px;
}
</style>
