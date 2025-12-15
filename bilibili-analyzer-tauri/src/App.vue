<template>
  <div class="app-wrapper">
    <!-- 左侧UP主列表侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h3 v-if="!sidebarCollapsed">已保存的UP主</h3>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>
      <div v-if="!sidebarCollapsed" class="sidebar-content">
        <div v-if="savedUpList.length === 0" class="empty-list">
          暂无保存的UP主
        </div>
        <div
          v-for="up in savedUpList"
          :key="up.mid"
          class="up-item"
          :class="{ active: currentMid === up.mid }"
          @click="loadSavedUp(up.mid)"
        >
          <img :src="up.face" class="up-avatar" />
          <div class="up-name">{{ up.name }}</div>
          <button class="delete-btn" @click.stop="deleteSavedUp(up.mid)" title="删除">×</button>
        </div>
      </div>
    </aside>

    <div class="app-container">
      <!-- 顶部标题栏 -->
      <header class="header">
        <h1>B站UP主视频数据分析器</h1>
        <span class="subtitle">Powered by Tauri + Vue + ECharts + SQLite</span>
      </header>

      <!-- 配置面板 -->
      <div class="config-panel">
        <div class="input-group">
          <label>UP主 MID:</label>
          <input
            v-model="mid"
            type="number"
            placeholder="例如: 517327498"
            :disabled="isLoading"
          />
        </div>
        <div class="input-group cookie-input">
          <label>Cookie (可选):</label>
          <input
            v-model="cookie"
            type="text"
            placeholder="遇到-403错误时需要填写"
            :disabled="isLoading"
          />
        </div>
        <div class="input-group">
          <label>最大页数:</label>
          <input
            v-model.number="maxPages"
            type="number"
            min="1"
            max="200"
            :disabled="isLoading"
          />
        </div>
        <button
          class="btn btn-primary"
          @click="startScraping"
          :disabled="isLoading || !mid"
        >
          {{ isLoading ? '爬取中...' : '开始爬取' }}
        </button>
        <button
          class="btn btn-secondary"
          @click="stopScraping"
          :disabled="!isLoading"
        >
          停止
        </button>
        <button
          class="btn btn-success"
          @click="exportData"
          :disabled="videos.length === 0"
        >
          导出CSV
        </button>
      </div>

    <!-- 进度条 -->
    <div v-if="isLoading" class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="progress-text">{{ progressText }}</span>
    </div>

    <!-- UP主信息卡片 -->
    <div v-if="upInfo" class="up-info-card">
      <img :src="upInfo.face" class="avatar" />
      <div class="up-details">
        <h2>{{ upInfo.name }}</h2>
        <p class="sign">{{ upInfo.sign }}</p>
        <span class="level">Lv.{{ upInfo.level }}</span>
      </div>
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ videos.length }}</span>
          <span class="stat-label">视频数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(totalPlays) }}</span>
          <span class="stat-label">总播放</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(totalDanmu) }}</span>
          <span class="stat-label">总弹幕</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(avgPlays) }}</span>
          <span class="stat-label">平均播放</span>
        </div>
      </div>
    </div>

    <!-- 可视化图表区域 -->
    <div v-if="videos.length > 0" class="charts-container">
      <!-- 第一行：核心指标 -->
      <div class="chart-row">
        <div class="chart-box">
          <h3>播放量分布</h3>
          <div ref="playDistChart" class="chart"></div>
        </div>
        <div class="chart-box">
          <h3>视频时长分布</h3>
          <div ref="durationChart" class="chart"></div>
        </div>
      </div>

      <!-- 第二行：时间趋势 -->
      <div class="chart-row">
        <div class="chart-box wide">
          <h3>月度发布趋势与播放量</h3>
          <div ref="monthlyTrendChart" class="chart"></div>
        </div>
      </div>

      <!-- 第三行：互动分析 -->
      <div class="chart-row">
        <div class="chart-box">
          <h3>播放量 vs 弹幕数</h3>
          <div ref="scatterChart" class="chart"></div>
        </div>
        <div class="chart-box">
          <h3>发布时间热力图</h3>
          <div ref="heatmapChart" class="chart"></div>
        </div>
      </div>

      <!-- 第四行：TOP视频 -->
      <div class="chart-row">
        <div class="chart-box wide">
          <h3>TOP15 播放量视频</h3>
          <div ref="topVideosChart" class="chart tall"></div>
        </div>
      </div>

      <!-- 第五行：年度对比 -->
      <div class="chart-row">
        <div class="chart-box">
          <h3>年度发布数量</h3>
          <div ref="yearlyCountChart" class="chart"></div>
        </div>
        <div class="chart-box">
          <h3>年度平均播放量</h3>
          <div ref="yearlyAvgChart" class="chart"></div>
        </div>
      </div>
    </div>

    <!-- 视频列表 -->
    <div v-if="videos.length > 0" class="video-list-container">
      <h3>视频列表 ({{ videos.length }}个)</h3>
      <div class="video-list">
        <div
          v-for="(video, index) in displayedVideos"
          :key="video.bvid"
          class="video-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <img :src="video.cover_url" class="cover" />
          <div class="video-info">
            <a :href="video.video_url" target="_blank" class="title">
              {{ video.title }}
            </a>
            <div class="meta">
              <span>{{ video.publish_time }}</span>
              <span>{{ video.duration }}</span>
              <span>播放: {{ formatNumber(video.play_count) }}</span>
              <span>弹幕: {{ formatNumber(video.danmu_count) }}</span>
            </div>
          </div>
        </div>
      </div>
      <button
        v-if="displayedVideos.length < videos.length"
        class="btn btn-load-more"
        @click="loadMore"
      >
        加载更多 ({{ displayedVideos.length }}/{{ videos.length }})
      </button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import * as echarts from 'echarts';

// 状态
const mid = ref(517327498);
const cookie = ref('');
const maxPages = ref(100);
const isLoading = ref(false);
const videos = ref([]);
const upInfo = ref(null);
const progress = ref({ current: 0, total: 0, page: 0, message: '' });
const displayCount = ref(20);

// 侧边栏相关状态
const sidebarCollapsed = ref(false);
const savedUpList = ref([]);
const currentMid = ref(null);

// 图表引用
const playDistChart = ref(null);
const durationChart = ref(null);
const monthlyTrendChart = ref(null);
const scatterChart = ref(null);
const heatmapChart = ref(null);
const topVideosChart = ref(null);
const yearlyCountChart = ref(null);
const yearlyAvgChart = ref(null);

// 图表实例
let charts = {};

// 计算属性
const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0;
  return Math.round((progress.value.current / progress.value.total) * 100);
});

const progressText = computed(() => {
  return `${progress.value.message} (${progress.value.current}/${progress.value.total})`;
});

const displayedVideos = computed(() => {
  return videos.value.slice(0, displayCount.value);
});

const totalPlays = computed(() => {
  return videos.value.reduce((sum, v) => sum + v.play_count, 0);
});

const totalDanmu = computed(() => {
  return videos.value.reduce((sum, v) => sum + v.danmu_count, 0);
});

const avgPlays = computed(() => {
  if (videos.value.length === 0) return 0;
  return Math.round(totalPlays.value / videos.value.length);
});

// 方法
function formatNumber(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}

function loadMore() {
  displayCount.value += 20;
}

// 加载已保存的UP主列表
async function loadSavedUpList() {
  try {
    savedUpList.value = await invoke('get_saved_up_list');
  } catch (error) {
    console.error('加载UP主列表失败:', error);
  }
}

// 加载指定UP主的保存数据
async function loadSavedUp(upMid) {
  try {
    const result = await invoke('load_up_videos', { mid: upMid });
    if (result.success) {
      videos.value = result.videos;
      upInfo.value = result.up_info;
      currentMid.value = upMid;
      mid.value = upMid;

      await nextTick();
      setTimeout(() => {
        renderAllCharts();
      }, 100);
    }
  } catch (error) {
    alert('加载失败: ' + error);
  }
}

// 删除已保存的UP主
async function deleteSavedUp(upMid) {
  if (!confirm('确定要删除这个UP主的数据吗？')) return;

  try {
    await invoke('delete_saved_up', { mid: upMid });
    await loadSavedUpList();

    // 如果删除的是当前显示的UP主，清空显示
    if (currentMid.value === upMid) {
      videos.value = [];
      upInfo.value = null;
      currentMid.value = null;
    }
  } catch (error) {
    alert('删除失败: ' + error);
  }
}

async function startScraping() {
  if (!mid.value) return;

  isLoading.value = true;
  videos.value = [];
  upInfo.value = null;
  progress.value = { current: 0, total: 0, page: 0, message: '初始化...' };

  try {
    // 设置 Cookie
    await invoke('set_cookie', { cookie: cookie.value });

    // 初始化 WBI keys
    progress.value.message = '获取WBI签名...';
    await invoke('init_wbi_keys');

    // 开始爬取
    progress.value.message = '开始爬取视频...';
    const result = await invoke('scrape_videos', {
      mid: parseInt(mid.value),
      maxPages: maxPages.value
    });

    if (result.success) {
      videos.value = result.videos;
      upInfo.value = result.up_info;
      currentMid.value = parseInt(mid.value);

      // 更新保存的UP主列表
      await loadSavedUpList();

      // 等待 DOM 更新后渲染图表
      await nextTick();
      setTimeout(() => {
        renderAllCharts();
      }, 100);
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
    // 简单导出到当前目录
    await invoke('export_csv', {
      videos: videos.value,
      path: filename
    });
    alert(`数据已导出: ${filename}`);
  } catch (error) {
    alert('导出失败: ' + error);
  }
}

// 图表渲染函数
function renderAllCharts() {
  if (videos.value.length === 0) return;

  renderPlayDistChart();
  renderDurationChart();
  renderMonthlyTrendChart();
  renderScatterChart();
  renderHeatmapChart();
  renderTopVideosChart();
  renderYearlyCountChart();
  renderYearlyAvgChart();
}

function initChart(ref, name) {
  if (!ref.value) return null;
  if (charts[name]) {
    charts[name].dispose();
  }
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
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '视频数量' },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#188df0' }
        ])
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
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      data: labels.map((name, i) => ({ name, value: counts[i] }))
    }]
  });
}

function renderMonthlyTrendChart() {
  const chart = initChart(monthlyTrendChart, 'monthlyTrend');
  if (!chart) return;

  // 按月统计
  const monthlyData = {};
  videos.value.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalPlays: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].totalPlays += v.play_count;
  });

  const months = Object.keys(monthlyData).sort();
  const counts = months.map(m => monthlyData[m].count);
  const avgPlays = months.map(m => Math.round(monthlyData[m].totalPlays / monthlyData[m].count));

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['发布数量', '平均播放量'] },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { rotate: 45, interval: Math.floor(months.length / 12) }
    },
    yAxis: [
      { type: 'value', name: '发布数量', position: 'left' },
      { type: 'value', name: '平均播放量', position: 'right' }
    ],
    series: [
      {
        name: '发布数量',
        type: 'bar',
        data: counts,
        itemStyle: { color: '#5470c6' }
      },
      {
        name: '平均播放量',
        type: 'line',
        yAxisIndex: 1,
        data: avgPlays,
        smooth: true,
        itemStyle: { color: '#ee6666' }
      }
    ]
  });
}

function renderScatterChart() {
  const chart = initChart(scatterChart, 'scatter');
  if (!chart) return;

  const data = videos.value.map(v => [v.play_count, v.danmu_count]);

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: p => `播放: ${formatNumber(p.value[0])}<br/>弹幕: ${formatNumber(p.value[1])}`
    },
    xAxis: {
      type: 'value',
      name: '播放量',
      axisLabel: { formatter: v => formatNumber(v) }
    },
    yAxis: {
      type: 'value',
      name: '弹幕数',
      axisLabel: { formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: data,
      itemStyle: {
        color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
          { offset: 0, color: '#91cc75' },
          { offset: 1, color: '#3ba272' }
        ])
      }
    }]
  });
}

function renderHeatmapChart() {
  const chart = initChart(heatmapChart, 'heatmap');
  if (!chart) return;

  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const hours = Array.from({ length: 24 }, (_, i) => i + '时');

  // 统计每个时间段的发布数量
  const data = [];
  const countMap = {};

  videos.value.forEach(v => {
    const date = new Date(v.publish_time);
    const weekday = (date.getDay() + 6) % 7; // 转换为周一=0
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
    tooltip: {
      formatter: p => `${weekdays[p.value[1]]} ${p.value[0]}时: ${p.value[2]}个视频`
    },
    xAxis: { type: 'category', data: hours, splitArea: { show: true } },
    yAxis: { type: 'category', data: weekdays, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#f0f9e8', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac'] }
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

  const topVideos = [...videos.value]
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, 15);

  const titles = topVideos.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
  const plays = topVideos.map(v => v.play_count);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: p => {
        const video = topVideos[p[0].dataIndex];
        return `${video.title}<br/>播放量: ${formatNumber(video.play_count)}`;
      }
    },
    grid: { left: '20%', right: '10%' },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: v => formatNumber(v) }
    },
    yAxis: {
      type: 'category',
      data: titles.reverse(),
      axisLabel: { width: 150, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: plays.reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#fac858' },
          { offset: 1, color: '#ee6666' }
        ])
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
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value', name: '视频数量' },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: { color: '#73c0de' },
      label: { show: true, position: 'top' }
    }]
  });
}

function renderYearlyAvgChart() {
  const chart = initChart(yearlyAvgChart, 'yearlyAvg');
  if (!chart) return;

  const yearlyData = {};
  videos.value.forEach(v => {
    const year = v.publish_time.slice(0, 4);
    if (!yearlyData[year]) {
      yearlyData[year] = { count: 0, totalPlays: 0 };
    }
    yearlyData[year].count++;
    yearlyData[year].totalPlays += v.play_count;
  });

  const years = Object.keys(yearlyData).sort();
  const avgPlays = years.map(y => Math.round(yearlyData[y].totalPlays / yearlyData[y].count));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: p => `${p[0].name}年<br/>平均播放: ${formatNumber(p[0].value)}`
    },
    xAxis: { type: 'category', data: years },
    yAxis: {
      type: 'value',
      name: '平均播放量',
      axisLabel: { formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'line',
      data: avgPlays,
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(250, 200, 88, 0.5)' },
          { offset: 1, color: 'rgba(250, 200, 88, 0.1)' }
        ])
      },
      itemStyle: { color: '#fac858' }
    }]
  });
}

// 监听进度事件
onMounted(async () => {
  await listen('scrape-progress', (event) => {
    progress.value = event.payload;
  });

  // 加载已保存的UP主列表
  await loadSavedUpList();

  // 窗口大小改变时重新渲染图表
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
      if (chart) chart.resize();
    });
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app-wrapper {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-header h3 {
  font-size: 0.95rem;
  white-space: nowrap;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty-list {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9rem;
}

.up-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 5px;
  position: relative;
}

.up-item:hover {
  background: #f0f0f0;
}

.up-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-left: 3px solid #667eea;
}

.up-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}

.up-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.up-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ee5253;
}

.app-container {
  flex: 1;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  overflow-y: auto;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 5px;
}

.header .subtitle {
  opacity: 0.8;
  font-size: 0.9rem;
}

.config-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-group.cookie-input {
  flex: 1;
  min-width: 200px;
}

.input-group label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.input-group input {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.btn-load-more {
  width: 100%;
  margin-top: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.progress-container {
  background: white;
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
}

.up-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.up-info-card .avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #667eea;
}

.up-details h2 {
  color: #333;
  margin-bottom: 5px;
}

.up-details .sign {
  color: #888;
  font-size: 0.9rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.up-details .level {
  display: inline-block;
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  margin-top: 5px;
}

.stats-summary {
  display: flex;
  gap: 30px;
  margin-left: auto;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: #888;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-row {
  display: flex;
  gap: 20px;
}

.chart-box {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.chart-box.wide {
  flex: 2;
}

.chart-box h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1rem;
}

.chart {
  height: 300px;
}

.chart.tall {
  height: 400px;
}

.video-list-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.video-list-container h3 {
  color: #333;
  margin-bottom: 15px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: background 0.3s;
}

.video-item:hover {
  background: #f0f0f0;
}

.video-item .rank {
  width: 30px;
  text-align: center;
  font-weight: bold;
  color: #667eea;
}

.video-item .cover {
  width: 120px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
}

.video-info {
  flex: 1;
}

.video-info .title {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-bottom: 5px;
}

.video-info .title:hover {
  color: #667eea;
}

.video-info .meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #888;
}

@media (max-width: 1200px) {
  .chart-row {
    flex-direction: column;
  }

  .chart-box.wide {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .config-panel {
    flex-direction: column;
  }

  .up-info-card {
    flex-direction: column;
    text-align: center;
  }

  .stats-summary {
    margin-left: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .video-item .cover {
    width: 80px;
    height: 50px;
  }

  .video-info .meta {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
