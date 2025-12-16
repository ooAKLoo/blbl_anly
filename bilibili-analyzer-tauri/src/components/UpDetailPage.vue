<template>
  <div class="px-8 py-6 max-w-[1600px] mx-auto overflow-x-hidden">
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
        <h3 class="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">视频时长分布 <span class="text-[0.7rem] font-normal text-neutral-400 opacity-0 hover:opacity-100 transition-opacity duration-200">💡 点击柱子查看视频</span></h3>
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
import { formatNumber, formatAxisNumber, parseDuration } from '../utils';
import { chartTheme, durationChartColors, heatmapColors, colors, gradients } from '../theme';
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
  Check
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
const displayCount = ref(20);

// 图表交互状态
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerVideos = ref([]);
const chartFilter = ref(null);

let charts = {};

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

// Computed
const totalPlays = computed(() => props.videos.reduce((sum, v) => sum + v.play_count, 0));
const totalDanmu = computed(() => props.videos.reduce((sum, v) => sum + v.danmu_count, 0));
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

const filteredVideos = computed(() => {
  let result = props.videos;

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(v => v.title.toLowerCase().includes(keyword));
  }

  if (chartFilter.value) {
    result = result.filter(chartFilter.value);
  }

  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc': return new Date(b.publish_time) - new Date(a.publish_time);
      case 'time_asc': return new Date(a.publish_time) - new Date(b.publish_time);
      case 'play_desc': return b.play_count - a.play_count;
      case 'play_asc': return a.play_count - b.play_count;
      case 'danmu_desc': return b.danmu_count - a.danmu_count;
      case 'danmu_asc': return a.danmu_count - b.danmu_count;
      case 'engagement_desc': return (b.danmu_count / b.play_count) - (a.danmu_count / a.play_count);
      case 'duration_desc': return parseDuration(b.duration) - parseDuration(a.duration);
      case 'duration_asc': return parseDuration(a.duration) - parseDuration(b.duration);
      default: return 0;
    }
  });

  return result;
});

const displayedVideos = computed(() => filteredVideos.value.slice(0, displayCount.value));

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
function selectSort(value) {
  sortBy.value = value;
  sortDropdownOpen.value = false;
}

function openVideoDrawer(title, videosToShow) {
  drawerTitle.value = title;
  drawerVideos.value = videosToShow;
  drawerVisible.value = true;
}

function applyChartFilter(filterFn) {
  chartFilter.value = filterFn;
  displayCount.value = 20;
}

function clearChartFilter() {
  chartFilter.value = null;
}

function loadMore() {
  if (displayCount.value < filteredVideos.value.length) {
    displayCount.value += 20;
  }
}

function handleVideoListScroll(e) {
  const el = e.target;
  const threshold = 100;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    loadMore();
  }
}

function handleClickOutside(e) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    sortDropdownOpen.value = false;
  }
}

watch([searchKeyword, sortBy], () => {
  displayCount.value = 20;
});

// 监听 videos 变化，重新渲染图表
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
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 0, interval: 0 } },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 32,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.primary),
        borderRadius: [6, 6, 0, 0]
      },
      emphasis: { itemStyle: { color: colors.primaryHover } }
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`播放量区间: ${labels[idx]}`, videosByBin[idx]);
    applyChartFilter((v) => v.play_count >= bins[idx] && v.play_count < bins[idx + 1]);
  });
}

function renderDurationChart() {
  const chart = initChart(durationChart, 'duration');
  if (!chart) return;

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  const videosByBin = labels.map(() => []);
  props.videos.forEach(v => {
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
  const total = props.videos.length;

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
        const binVideos = videosByBin[idx];
        const percent = total > 0 ? ((counts[idx] / total) * 100).toFixed(1) : 0;

        let html = `<div style="max-width: 320px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #111827; font-size: 13px;">${labels[idx]}</div>
          <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px;">共 <span style="color: #3B82F6; font-weight: 600;">${counts[idx]}</span> 个视频 (${percent}%)</div>`;

        if (binVideos.length > 0) {
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
          html += '<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">前5个视频:</div>';
          binVideos.slice(0, 5).forEach(v => {
            html += `<div style="margin: 4px 0; font-size: 11px; color: #6B7280;">• ${v.title.length > 30 ? v.title.slice(0, 30) + '...' : v.title} (${v.duration})</div>`;
          });
          if (binVideos.length > 5) {
            html += `<div style="margin-top: 6px; font-size: 11px; color: #3B82F6;">还有 ${binVideos.length - 5} 个视频...</div>`;
          }
          html += '<div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">💡 点击查看全部</div></div>';
        }
        html += '</div>';
        return html;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 0, rotate: 0 } },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '视频数', nameTextStyle: { color: '#9CA3AF', fontSize: 11, padding: [0, 40, 0, 0] } },
    series: [{
      type: 'bar',
      data: counts.map((value, i) => ({
        value,
        itemStyle: { color: durationChartColors[i], borderRadius: [20, 20, 20, 20] }
      })),
      barWidth: '50%',
      barMaxWidth: 40,
      showBackground: true,
      backgroundStyle: { color: 'rgba(243, 244, 246, 0.6)', borderRadius: [20, 20, 20, 20] },
      label: { show: true, position: 'top', formatter: (params) => params.value > 0 ? params.value : '', color: '#6B7280', fontSize: 11, fontWeight: 500 },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(59, 130, 246, 0.3)', shadowOffsetY: 4 } }
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`时长区间: ${labels[idx]}`, videosByBin[idx]);
    applyChartFilter((v) => {
      const parts = v.duration.split(':');
      let minutes = 0;
      if (parts.length === 2) minutes = parseInt(parts[0]);
      if (parts.length === 3) minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return minutes >= bins[idx] && minutes < bins[idx + 1];
    });
  });
}

// 其他图表渲染函数（简化版本，完整版请参考原App.vue）
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
        return `<div><div style="font-weight: 600; margin-bottom: 8px; color: #111827;">${month}</div>
          <div style="color: #6B7280; font-size: 12px;">发布数量: <span style="color: #3B82F6; font-weight: 600;">${params[0].value}</span></div>
          <div style="color: #6B7280; font-size: 12px;">平均播放: <span style="color: #8B5CF6; font-weight: 600;">${formatNumber(params[1]?.value || 0)}</span></div></div>`;
      }
    },
    legend: { ...chartTheme.legend, data: ['发布数量', '平均播放量'] },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: months, axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 45, interval: Math.floor(months.length / 12) } },
    yAxis: [
      { ...chartTheme.yAxis, type: 'value', position: 'left', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
      { ...chartTheme.yAxis, type: 'value', position: 'right', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } }
    ],
    series: [
      { name: '发布数量', type: 'bar', data: counts, barMaxWidth: 32, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.primary), borderRadius: [6, 6, 0, 0] } },
      { name: '平均播放量', type: 'line', yAxisIndex: 1, data: avgPlaysData, smooth: 0.4, showSymbol: false, itemStyle: { color: colors.purple }, lineStyle: { width: 2.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.purple) } }
    ]
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params.seriesType === 'bar') {
      const month = params.name;
      openVideoDrawer(`发布月份: ${month}`, monthlyVideos[month]);
      applyChartFilter((v) => v.publish_time.startsWith(month));
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
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.warning)
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.primary),
          borderRadius: [6, 6, 0, 0]
        }
      }))
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const idx = params.dataIndex;
    openVideoDrawer(`发布时间: ${idx}时`, hourlyVideos[idx]);
    applyChartFilter((v) => new Date(v.publish_time).getHours() === idx);
  });
}

function renderDurationPlayChart() {
  const chart = initChart(durationPlayChart, 'durationPlay');
  if (!chart) return;

  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];
  const durationData = labels.map(() => ({ count: 0, totalPlays: 0 }));

  props.videos.forEach(v => {
    const parts = v.duration.split(':');
    let minutes = parts.length === 2 ? parseInt(parts[0]) : parseInt(parts[0]) * 60 + parseInt(parts[1]);
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
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.success)
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.primary),
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
      formatter: p => `<div style="color: #6B7280; font-size: 12px;">播放: <span style="color: #3B82F6; font-weight: 600;">${formatNumber(p.value[0])}</span></div>
        <div style="color: #6B7280; font-size: 12px;">弹幕: <span style="color: #10B981; font-weight: 600;">${formatNumber(p.value[1])}</span></div>`
    },
    xAxis: { ...chartTheme.xAxis, type: 'value', name: '播放量', axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber } },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '弹幕数', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'scatter', symbolSize: 6, data: data, itemStyle: { color: colors.success, opacity: 0.6 } }]
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
      applyChartFilter((v) => {
        const date = new Date(v.publish_time);
        return (date.getDay() + 6) % 7 === weekday && date.getHours() === hour;
      });
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
    series: [{ type: 'bar', data: plays.reverse(), barMaxWidth: 24, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.primaryHorizontal), borderRadius: [0, 6, 6, 0] } }]
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
    series: [{ type: 'bar', data: rates.reverse(), barMaxWidth: 24, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.pink), borderRadius: [0, 6, 6, 0] } }]
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
    series: [{ type: 'bar', data: counts, barMaxWidth: 48, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.indigo), borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: '#6B7280', fontSize: 11, fontWeight: 600 } }]
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
    series: [{ type: 'line', data: avgPlaysData, smooth: 0.4, showSymbol: false, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(99, 102, 241, 0.15)' }, { offset: 1, color: 'rgba(99, 102, 241, 0)' }]) }, itemStyle: { color: colors.indigo }, lineStyle: { width: 2.5 } }]
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
        return `<div style="max-width: 300px;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #111827;">${video.title}</div>
          <div style="color: #6B7280; font-size: 12px;">发布时间: ${video.publish_time}</div>
          <div style="color: #3B82F6; font-weight: 600; font-size: 12px; margin-top: 4px;">播放量: ${formatNumber(video.play_count)}</div>
        </div>`;
      }
    },
    grid: { left: '8%', right: '4%', bottom: '15%', top: '10%' },
    dataZoom: [
      { type: 'slider', show: true, start: 0, end: 100, bottom: 10, height: 20, borderColor: 'transparent', backgroundColor: '#F3F4F6', fillerColor: 'rgba(59, 130, 246, 0.2)', handleStyle: { color: colors.primary } },
      { type: 'inside', start: 0, end: 100 }
    ],
    xAxis: { ...chartTheme.xAxis, type: 'category', data: titles, axisLabel: { ...chartTheme.xAxis.axisLabel, interval: Math.floor(sortedVideos.length / 20), rotate: 0 }, name: '视频序号（按发布时间排序）', nameLocation: 'middle', nameGap: 30 },
    yAxis: { ...chartTheme.yAxis, type: 'value', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{ type: 'bar', data: plays, barMaxWidth: 16, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors.primary }, { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }]), borderRadius: [3, 3, 0, 0] } }]
  });
}

// 暴露渲染方法给父组件
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
</style>
