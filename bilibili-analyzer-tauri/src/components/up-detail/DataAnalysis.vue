<template>
  <div class="space-y-6">
    <!-- 筛选器 -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <!-- 时间筛选 -->
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">时间范围</span>
        <div class="flex items-center gap-1">
          <button
            v-for="option in timeRangeOptions"
            :key="option.value"
            @click="$emit('update:timeRange', option.value)"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
              timeRange === option.value
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="w-px h-4 bg-neutral-200"></div>

      <!-- 时长筛选 -->
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">视频时长</span>
        <div class="flex items-center gap-1">
          <button
            v-for="option in durationOptions"
            :key="option.value"
            @click="$emit('update:duration', option.value)"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
              duration === option.value
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 筛选结果 -->
      <div class="flex items-center gap-2 ml-auto">
        <span class="text-xs text-neutral-400">
          已筛选 <strong class="text-neutral-600">{{ analysisVideos.length }}</strong> / {{ allVideos.length }} 个视频
        </span>
        <span v-if="hasActiveFilter" class="text-xs text-neutral-400">·</span>
        <span v-if="hasActiveFilter" class="text-xs text-neutral-400">{{ dataTimeRange }}</span>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <section>
      <h2 class="section-title">
        <Zap :size="16" />
        数据概览
      </h2>
      <div class="bg-white rounded-2xl overflow-hidden">
        <!-- 核心指标 -->
        <div class="px-5 py-5">
          <div class="grid grid-cols-5 gap-6">
            <!-- 总播放 - 主指标，更突出 -->
            <div class="col-span-1">
              <div class="text-2xl font-semibold text-neutral-900 tabular-nums">{{ formatNumber(totalPlays) }}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <Play :size="12" class="text-neutral-400" />
                <span class="text-xs text-neutral-500">总播放量</span>
              </div>
            </div>

            <!-- 均播放 -->
            <div class="col-span-1">
              <div class="text-2xl font-semibold text-neutral-900 tabular-nums">{{ formatNumber(avgPlays) }}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <Calculator :size="12" class="text-neutral-400" />
                <span class="text-xs text-neutral-500">场均播放</span>
                <span v-if="hasActiveFilter" :class="[
                  'text-xs font-medium',
                  avgPlaysChange >= 0 ? 'text-emerald-500' : 'text-rose-500'
                ]">
                  {{ avgPlaysChange >= 0 ? '+' : '' }}{{ avgPlaysChange.toFixed(1) }}%
                </span>
              </div>
            </div>

            <!-- 爆款率 -->
            <div class="col-span-1">
              <div class="text-2xl font-semibold text-neutral-900 tabular-nums">{{ hitRate }}<span class="text-base font-normal text-neutral-400">%</span></div>
              <div class="flex items-center gap-1.5 mt-1">
                <Flame :size="12" class="text-neutral-400" />
                <span class="text-xs text-neutral-500">爆款率</span>
              </div>
            </div>

            <!-- 互动率 -->
            <div class="col-span-1">
              <div class="text-2xl font-semibold text-neutral-900 tabular-nums">{{ avgEngagementRate }}<span class="text-base font-normal text-neutral-400">%</span></div>
              <div class="flex items-center gap-1.5 mt-1">
                <Zap :size="12" class="text-neutral-400" />
                <span class="text-xs text-neutral-500">互动率</span>
              </div>
            </div>

            <!-- 月均发布 -->
            <div class="col-span-1">
              <div class="text-2xl font-semibold text-neutral-900 tabular-nums">{{ monthlyPublishRate }}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <CalendarDays :size="12" class="text-neutral-400" />
                <span class="text-xs text-neutral-500">月均发布</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 次要指标 -->
        <div class="px-2 pb-2">
          <div class="bg-neutral-100/70 rounded-2xl px-4 py-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-8">
                <div class="flex items-center gap-2">
                  <MessageSquare :size="14" class="text-neutral-400" />
                  <span class="text-sm text-neutral-600"><strong class="font-semibold">{{ formatNumber(totalDanmu) }}</strong> 弹幕</span>
                </div>
                <div class="flex items-center gap-2">
                  <MessageCircle :size="14" class="text-neutral-400" />
                  <span class="text-sm text-neutral-600"><strong class="font-semibold">{{ formatNumber(totalComments) }}</strong> 评论</span>
                </div>
                <div class="flex items-center gap-2">
                  <Star :size="14" class="text-neutral-400" />
                  <span class="text-sm text-neutral-600"><strong class="font-semibold">{{ formatNumber(totalFavorites) }}</strong> 收藏</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock :size="14" class="text-neutral-400" />
                  <span class="text-sm text-neutral-600">均时长 <strong class="font-semibold">{{ avgDuration }}</strong></span>
                </div>
              </div>
              <div class="text-xs text-neutral-400">
                数据范围：{{ dataTimeRange }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Charts Grid - Organized by Category -->
    <div v-if="analysisVideos.length > 0" class="space-y-6">
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
            <h3 class="chart-title">视频时长分布与平均播放量</h3>
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
            <h3 class="chart-title">最佳发布时间（按平均播放量）</h3>
            <p class="text-xs text-neutral-400 -mt-2 mb-2">颜色越红表示该时段发布的视频平均播放量越高</p>
            <div ref="heatmapChart" class="h-[280px]"></div>
          </div>
        </div>
      </section>

      <!-- 内容分析 -->
      <section>
        <h2 class="section-title">
          <Target :size="16" />
          内容表现
        </h2>
        <div class="chart-card">
          <h3 class="chart-title">播放量 vs 弹幕数</h3>
          <p class="text-xs text-neutral-400 -mt-2 mb-3">点击散点查看视频详情</p>
          <div ref="scatterChart" class="h-[280px]"></div>
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
          <p class="text-xs text-neutral-400 -mt-2 mb-2">点击纵坐标可筛选高于该播放量的视频，再次点击取消筛选</p>
          <div ref="timelineChart" class="h-[320px]"></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, toRefs } from 'vue';
import * as echarts from 'echarts';
import { useVideoMetrics } from '../../composables/useVideoMetrics';
import { formatNumber, formatAxisNumber, parseDuration, parseDurationMinutes } from '../../utils';
import { chartTheme, distributionColors, heatmapColors, colors, gradients, highlightColor, secondaryAxis } from '../../theme';
import { open } from '@tauri-apps/plugin-shell';
import {
  Zap,
  Play,
  Calculator,
  Flame,
  CalendarDays,
  MessageSquare,
  MessageCircle,
  Star,
  Clock,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Calendar
} from 'lucide-vue-next';

const props = defineProps({
  analysisVideos: {
    type: Array,
    required: true
  },
  allVideos: {
    type: Array,
    required: true
  },
  timeRange: String,
  duration: String,
  timeRangeOptions: Array,
  durationOptions: Array
});

const emit = defineEmits(['update:timeRange', 'update:duration', 'open-drawer']);

const { analysisVideos, allVideos } = toRefs(props);
// Use composable for metrics
const {
  totalPlays,
  avgPlays,
  avgPlaysChange,
  hitRate,
  avgEngagementRate,
  monthlyPublishRate,
  totalDanmu,
  totalComments,
  totalFavorites,
  avgDuration,
  dataTimeRange
} = useVideoMetrics(analysisVideos, allVideos);

const hasActiveFilter = computed(() => {
  return props.timeRange !== 'all' || props.duration !== 'all';
});

// Chart refs
const playDistChart = ref(null);
const durationChart = ref(null);
const monthlyTrendChart = ref(null);
const scatterChart = ref(null);
const heatmapChart = ref(null);
const topVideosChart = ref(null);
const topEngagementChart = ref(null);
const yearlyCountChart = ref(null);
const yearlyAvgChart = ref(null);
const timelineChart = ref(null);
const hourlyPlayChart = ref(null);

let charts = {};

// Watchers
watch(() => props.analysisVideos, (newVideos) => {
  if (newVideos.length > 0) {
    setTimeout(() => renderAllCharts(), 100);
  }
}, { immediate: true });

function initChart(ref, name) {
  if (!ref.value) return null;
  if (charts[name]) charts[name].dispose();
  charts[name] = echarts.init(ref.value);
  return charts[name];
}

function renderAllCharts() {
  if (props.analysisVideos.length === 0) return;
  renderPlayDistChart();
  renderDurationChart();
  renderMonthlyTrendChart();
  renderHourlyPlayChart();
  renderScatterChart();
  renderHeatmapChart();
  renderTopVideosChart();
  renderTopEngagementChart();
  renderYearlyCountChart();
  renderYearlyAvgChart();
  renderTimelineChart();
}

function openVideoDrawer(title, videosToShow) {
  emit('open-drawer', { title, videos: videosToShow });
}

// Chart Rendering Logic (Copied and adapted)
// ... (I will paste the chart functions here, referencing props.analysisVideos)

function renderPlayDistChart() {
  const chart = initChart(playDistChart, 'playDist');
  if (!chart) return;

  const videos = props.analysisVideos;
  const plays = videos.map(v => v.play_count).sort((a, b) => a - b);
  const maxPlay = plays[plays.length - 1] || 0;

  let bins, labels;
  if (maxPlay <= 10000) {
    bins = [0, 1000, 3000, 5000, 10000, Infinity];
    labels = ['<1千', '1-3千', '3-5千', '5千-1万', '>1万'];
  } else if (maxPlay <= 100000) {
    bins = [0, 5000, 10000, 30000, 50000, 100000, Infinity];
    labels = ['<5千', '5千-1万', '1-3万', '3-5万', '5-10万', '>10万'];
  } else if (maxPlay <= 1000000) {
    bins = [0, 10000, 50000, 100000, 300000, 500000, 1000000, Infinity];
    labels = ['<1万', '1-5万', '5-10万', '10-30万', '30-50万', '50-100万', '>100万'];
  } else {
    bins = [0, 100000, 500000, 1000000, 2000000, 5000000, 10000000, Infinity];
    labels = ['<10万', '10-50万', '50-100万', '100-200万', '200-500万', '500-1000万', '>1000万'];
  }

  const videosByBin = labels.map(() => []);
  videos.forEach(v => {
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

  const videos = props.analysisVideos;
  const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
  const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

  const videosByBin = labels.map(() => []);
  const durationData = labels.map(() => ({ count: 0, totalPlays: 0 }));

  videos.forEach(v => {
    const minutes = parseDurationMinutes(v.duration);
    for (let i = 0; i < bins.length - 1; i++) {
      if (minutes >= bins[i] && minutes < bins[i + 1]) {
        videosByBin[i].push(v);
        durationData[i].count++;
        durationData[i].totalPlays += v.play_count;
        break;
      }
    }
  });

  const counts = videosByBin.map(arr => arr.length);
  const avgPlaysData = durationData.map(d => d.count > 0 ? Math.round(d.totalPlays / d.count) : 0);
  const bestIndex = avgPlaysData.indexOf(Math.max(...avgPlaysData.filter(v => v > 0)));

  chart.setOption({
    ...chartTheme,
    grid: { top: 30, right: 60, bottom: 30, left: 20, containLabel: true },
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      confine: true,
      formatter: (params) => {
        const idx = params[0].dataIndex;
        const avgPlay = avgPlaysData[idx];
        return `<div style="font-size: 13px;"><strong>${labels[idx]}</strong><br/>共 ${counts[idx]} 个视频<br/>均播放: ${formatNumber(avgPlay)}<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
      }
    },
    legend: { ...chartTheme.legend, data: ['视频数量', '平均播放量'], top: 0 },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: labels, axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 0, rotate: 0 } },
    yAxis: [
      { ...chartTheme.yAxis, type: 'value', position: 'left', name: '数量' },
      { ...chartTheme.yAxis, type: 'value', position: 'right', name: '播放量', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } }
    ],
    series: [
      {
        name: '视频数量',
        type: 'bar',
        data: counts.map((value, i) => ({
          value,
          itemStyle: { color: distributionColors[i], borderRadius: [4, 4, 0, 0] }
        })),
        barMaxWidth: 32
      },
      {
        name: '平均播放量',
        type: 'line',
        yAxisIndex: 1,
        data: avgPlaysData.map((v, i) => ({
          value: v,
          itemStyle: { color: i === bestIndex ? highlightColor.solid : secondaryAxis.line }
        })),
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: (value, params) => params.dataIndex === bestIndex ? 10 : 6,
        itemStyle: { color: secondaryAxis.line },
        lineStyle: { width: 2.5, color: secondaryAxis.line }
      }
    ]
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params.seriesType === 'bar') {
      const idx = params.dataIndex;
      openVideoDrawer(`时长区间: ${labels[idx]}`, videosByBin[idx]);
    }
  });
}

function renderMonthlyTrendChart() {
  const chart = initChart(monthlyTrendChart, 'monthlyTrend');
  if (!chart) return;

  const videos = props.analysisVideos;
  const monthlyData = {};
  const monthlyVideos = {};

  videos.forEach(v => {
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

  const videos = props.analysisVideos;
  const hourlyData = {};
  const hourlyVideos = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { count: 0, totalPlays: 0 };
    hourlyVideos[i] = [];
  }

  videos.forEach(v => {
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

function renderScatterChart() {
  const chart = initChart(scatterChart, 'scatter');
  if (!chart) return;

  const videos = props.analysisVideos;
  const scatterData = videos.map(v => ({
    value: [v.play_count, v.danmu_count],
    video: v
  }));

  chart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'item',
      formatter: (params) => {
        const video = params.data.video;
        if (!video) return '';
        const title = video.title.length > 30 ? video.title.slice(0, 30) + '...' : video.title;
        return `<div style="max-width: 280px;"><strong>${title}</strong><br/>播放: ${formatNumber(params.value[0])}<br/>弹幕: ${formatNumber(params.value[1])}<br/>弹幕率: ${((params.value[1] / params.value[0]) * 100).toFixed(2)}%<br/><span style="color:#3B82F6">点击打开视频</span></div>`;
      }
    },
    xAxis: { ...chartTheme.xAxis, type: 'value', name: '播放量', axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber } },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: '弹幕数', axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber } },
    series: [{
      type: 'scatter',
      symbolSize: 10,
      data: scatterData,
      itemStyle: { color: colors.blue500, opacity: 0.7 },
      emphasis: {
        itemStyle: { color: colors.blue600, opacity: 1, shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.5)' },
        scale: 1.8
      },
      cursor: 'pointer'
    }]
  });

  chart.off('click');
  chart.on('click', async (params) => {
    const video = params.data?.video;
    if (video && video.video_url) {
      await open(video.video_url);
    }
  });
}

function renderHeatmapChart() {
  const chart = initChart(heatmapChart, 'heatmap');
  if (!chart) return;

  const videos = props.analysisVideos;
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}时`);

  const statsMap = {};

  videos.forEach(v => {
    const date = new Date(v.publish_time);
    const weekday = (date.getDay() + 6) % 7;
    const hour = date.getHours();
    const key = `${weekday}-${hour}`;
    if (!statsMap[key]) {
      statsMap[key] = { count: 0, totalPlays: 0, videos: [] };
    }
    statsMap[key].count++;
    statsMap[key].totalPlays += v.play_count;
    statsMap[key].videos.push(v);
  });

  const data = [];
  let maxAvgPlay = 0;

  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      const key = `${w}-${h}`;
      const stats = statsMap[key];
      const avgPlay = stats ? Math.round(stats.totalPlays / stats.count) : 0;
      data.push([h, w, avgPlay, stats?.count || 0]);
      if (avgPlay > maxAvgPlay) maxAvgPlay = avgPlay;
    }
  }

  const bestSlot = data.reduce((best, curr) => curr[2] > best[2] ? curr : best, data[0]);

  chart.setOption({
    ...chartTheme,
    grid: { top: 10, right: 80, bottom: 60, left: 60 },
    tooltip: {
      ...chartTheme.tooltip,
      confine: true,
      formatter: (params) => {
        const [hour, weekday, avgPlay, count] = params.value;
        if (count === 0) return `${weekdays[weekday]} ${hour}时<br/>暂无数据`;
        const isBest = hour === bestSlot[0] && weekday === bestSlot[1];
        return `<div>
          <strong>${weekdays[weekday]} ${hour}时</strong>${isBest ? ' <span style="color:#EF4444">★ 最佳</span>' : ''}<br/>
          平均播放: <strong>${formatNumber(avgPlay)}</strong><br/>
          视频数: ${count} 个<br/>
          <span style="color:#3B82F6">点击查看详情</span>
        </div>`;
      }
    },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 1 }
    },
    yAxis: {
      ...chartTheme.yAxis,
      type: 'category',
      data: weekdays,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: maxAvgPlay || 1,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemHeight: 120,
      inRange: { color: heatmapColors },
      formatter: (value) => formatNumber(Math.round(value))
    },
    series: [{
      type: 'heatmap',
      data: data.map(d => [d[0], d[1], d[2]]),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.3)' } },
      itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#ffffff' }
    }]
  });

  chart.off('click');
  chart.on('click', (params) => {
    const [hour, weekday] = params.value;
    const key = `${weekday}-${hour}`;
    const stats = statsMap[key];
    if (stats && stats.videos.length > 0) {
      openVideoDrawer(`${weekdays[weekday]} ${hour}时发布`, stats.videos);
    }
  });
}

function renderTopVideosChart() {
  const chart = initChart(topVideosChart, 'topVideos');
  if (!chart) return;

  const videos = props.analysisVideos;
  const topVideosData = [...videos].sort((a, b) => b.play_count - a.play_count).slice(0, 15);
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
  chart.on('click', async (params) => {
    const video = topVideosData[14 - params.dataIndex];
    await open(video.video_url);
  });
}

function renderTopEngagementChart() {
  const chart = initChart(topEngagementChart, 'topEngagement');
  if (!chart) return;

  const videos = props.analysisVideos;
  const videosWithEngagement = videos
    .filter(v => v.play_count >= 10000)
    .map(v => ({
      ...v,
      engagementRate: ((v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0)) / v.play_count) * 100
    }))
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
  chart.on('click', async (params) => {
    const video = videosWithEngagement[14 - params.dataIndex];
    await open(video.video_url);
  });
}

function renderYearlyCountChart() {
  const chart = initChart(yearlyCountChart, 'yearlyCount');
  if (!chart) return;

  const videos = props.analysisVideos;
  const yearlyData = {};
  videos.forEach(v => {
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

  const videos = props.analysisVideos;
  const yearlyData = {};
  videos.forEach(v => {
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

  const videos = props.analysisVideos;
  const sortedVideos = [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));

  // 当前筛选阈值
  let currentThreshold = null;

  // 构建 dataset 源数据：[index, play_count, videoIndex]
  const sourceData = sortedVideos.map((v, i) => [i, v.play_count, i]);

  // 渲染图表的函数
  const renderChart = (threshold) => {
    const filteredData = threshold === null
      ? sourceData
      : sourceData.filter(d => d[1] >= threshold);

    const barColor = threshold === null
      ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors.primary }, { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }])
      : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: 'rgba(245, 158, 11, 0.4)' }]);

    const filteredCount = filteredData.length;
    const totalCount = sourceData.length;

    chart.setOption({
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        formatter: p => {
          if (!p || !p[0]) return '';
          const videoIdx = p[0].data[2];
          const video = sortedVideos[videoIdx];
          const thresholdInfo = threshold !== null
            ? `<br/><span style="color: #F59E0B">阈值: ${formatNumber(threshold)}</span>`
            : '';
          return `<div style="max-width: 280px;"><strong>${video.title}</strong><br/>发布: ${video.publish_time}<br/>播放: ${formatNumber(video.play_count)}${thresholdInfo}</div>`;
        }
      },
      grid: { left: '8%', right: '4%', bottom: '22%', top: '12%' },
      dataZoom: [
        { type: 'slider', show: true, start: 0, end: 100, bottom: 8, height: 18, borderColor: 'transparent', backgroundColor: '#F3F4F6', fillerColor: 'rgba(59, 130, 246, 0.2)', handleStyle: { color: colors.primary } }
      ],
      xAxis: {
        ...chartTheme.xAxis,
        type: 'category',
        axisLabel: { show: false },
        axisTick: { show: false },
        name: threshold !== null ? `筛选: ${filteredCount}/${totalCount} 个视频` : `共 ${totalCount} 个视频`,
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: { color: threshold !== null ? '#F59E0B' : '#9CA3AF', fontSize: 11 }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'value',
        axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber },
        axisLine: { lineStyle: { color: threshold !== null ? '#F59E0B' : '#E5E7EB' } },
        triggerEvent: true
      },
      series: [{
        type: 'bar',
        data: filteredData,
        encode: { x: 0, y: 1 },
        barMaxWidth: 16,
        itemStyle: { color: barColor, borderRadius: [3, 3, 0, 0] },
        markLine: threshold !== null ? {
          silent: true,
          symbol: 'none',
          animation: false,
          lineStyle: { color: '#F59E0B', width: 1.5, type: 'dashed' },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: `阈值: ${formatNumber(threshold)}`,
            color: '#F59E0B',
            fontSize: 11,
            fontWeight: 500
          },
          data: [{ yAxis: threshold }]
        } : { data: [] }
      }]
    }, { notMerge: true }); // notMerge 确保完全替换，避免残留数据
  };

  // 初始渲染
  renderChart(null);

  // 监听Y轴点击事件
  chart.getZr().off('click');
  chart.getZr().on('click', (params) => {
    const pointInPixel = [params.offsetX, params.offsetY];
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);

    // 检查点击是否在Y轴区域（X坐标小于grid左边界）
    const gridInfo = chart.getModel().getComponent('grid').coordinateSystem.getRect();
    if (params.offsetX < gridInfo.x && params.offsetX > 0) {
      const yValue = pointInGrid[1];
      if (yValue !== null && yValue >= 0) {
        // 如果已有阈值且点击相近位置，则取消筛选；否则设置新阈值
        if (currentThreshold !== null && currentThreshold > 0 && Math.abs(yValue - currentThreshold) / currentThreshold < 0.1) {
          currentThreshold = null;
        } else {
          currentThreshold = Math.round(yValue);
        }
        renderChart(currentThreshold);
      }
    }
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}
</script>
