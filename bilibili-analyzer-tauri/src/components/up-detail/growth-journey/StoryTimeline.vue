<template>
  <div class="story-stream" ref="storyStreamRef">
    <!-- 时间轴区域 -->
    <div class="story-nodes">
      <!-- 时间轴中线 -->
      <div class="timeline-center-line" ref="timelineRef">
        <div class="timeline-progress" :style="{ height: timelineProgress + '%' }"></div>
      </div>
      <!-- 故事节点 -->
      <div
        v-for="(node, index) in storyNodes"
        :key="node.id"
        :ref="el => setNodeRef(el, index)"
        class="story-node"
        :class="[
          { 'is-right': index % 2 !== 0 },
          { 'is-visible': visibleNodes.has(index) }
        ]"
      >
        <!-- 时间轴节点标记 - 统一圆点 -->
        <div class="node-marker" :class="node.markerColor">
          <div class="node-marker-dot"></div>
        </div>

        <!-- 日期显示 -->
        <div class="node-date">{{ node.dateDisplay }}</div>

        <!-- 内容卡片 -->
        <div
          class="node-card"
          :class="[node.cardClass, { 'cursor-pointer': node.video }]"
          @click="node.video ? openVideo(node.video) : null"
        >
          <!-- 视频封面 -->
          <div v-if="node.video && node.showCover" class="node-cover">
            <img
              :src="getImageUrl(node.video.cover)"
              :alt="node.video.title"
              class="node-cover-img"
              referrerpolicy="no-referrer"
            />
            <div class="node-cover-overlay">
              <Play :size="32" class="text-white" fill="currentColor" />
            </div>
            <div class="node-cover-stats">
              <span><Play :size="12" /> {{ formatNumber(node.video.play_count) }}</span>
              <span><MessageSquare :size="12" /> {{ formatNumber(node.video.danmu_count) }}</span>
            </div>
          </div>

          <!-- 装饰性背景图标 -->
          <component
            v-if="!node.showCover"
            :is="node.icon"
            class="node-card-bg-icon"
            :size="80"
          />

          <div class="node-card-content">
            <div class="node-card-header">
              <component :is="node.icon" :size="18" :class="node.iconColor" />
              <h3 class="node-card-title">{{ node.title }}</h3></div>

            <p class="node-card-desc">{{ node.description }}</p>

            <!-- 关联视频（无封面时显示） -->
            <div v-if="node.video && !node.showCover" class="node-video-link">
              <div class="node-video-play">
                <Play :size="12" fill="currentColor" />
              </div>
              <div class="node-video-info">
                <div class="node-video-title">{{ node.video.title }}</div>
                <div class="node-video-meta">播放: {{ formatNumber(node.video.play_count) }}</div>
              </div>
            </div>

            <!-- 视频标题（有封面时显示） -->
            <div v-if="node.video && node.showCover" class="node-video-title-only">
              {{ node.video.title }}
            </div>

            <!-- 额外统计 -->
            <div v-if="node.stats" class="node-stats">
              <span v-for="(stat, i) in node.stats" :key="i" class="node-stat-item">
                {{ stat }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创作节奏 - 中间插叙卡片 -->
    <div
      class="persistence-interlude"
      ref="persistenceRef"
      :class="{ 'is-visible': persistenceVisible }"
    >
      <div class="persistence-badge">
        <Flame :size="16" class="text-orange-400" />
        <span>创作节奏</span>
      </div>

      <div class="persistence-grid">
        <div class="persistence-item">
          <h4 class="persistence-title">更新频率</h4>
          <p class="persistence-text">
            平均每
            <strong class="text-blue-600 text-2xl">
              <CountUp :end="avgPublishDays" :duration="1500" :start-on-visible="persistenceVisible" />
            </strong>
            天发布一个视频
          </p>
          <p class="persistence-insight">
            {{ Math.floor(totalDays / 365) }} 年 {{ totalDays % 365 }} 天，{{ videoCount }} 个作品
          </p>
          <div ref="miniChartRef" class="mini-chart"></div>
        </div>

        <div class="persistence-item">
          <h4 class="persistence-title">成长曲线</h4>
          <p class="persistence-text">
            <strong class="text-slate-700 text-2xl">
              <CountUp :end="valleyVideos" :duration="1200" :start-on-visible="persistenceVisible" />
            </strong>
            个视频低于平均播放
          </p>
          <p class="persistence-text">
            <strong class="text-emerald-500 text-2xl">
              <CountUp :end="breakThroughCount" :duration="1500" :start-on-visible="persistenceVisible" />
            </strong>
            次播放量创新高
          </p>
          <div class="persistence-quote">
            <Quote :size="14" />
            <span>{{ motivationText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成长曲线 -->
    <div
      class="growth-chart-section"
      ref="chartSectionRef"
      :class="{ 'is-visible': chartVisible }"
    >
      <div class="growth-chart-header">
        <TrendingUp :size="18" class="text-blue-500" />
        <h3>成长轨迹</h3>
      </div>
      <div ref="growthChartRef" class="growth-chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, h, defineComponent } from 'vue';
import * as echarts from 'echarts';
import { formatNumber, getImageUrl } from '../../../utils';
import { open } from '@tauri-apps/plugin-shell';
import {
  Play, Flame, CalendarDays, TrendingUp, Quote, Flag, Trophy,
  PartyPopper, Crown, PenTool, Milestone, MessageSquare
} from 'lucide-vue-next';

// ============ CountUp 组件 ============
const CountUp = defineComponent({
  name: 'CountUp',
  props: {
    end: { type: Number, required: true },
    duration: { type: Number, default: 2000 },
    startOnVisible: { type: Boolean, default: false },
    decimals: { type: Number, default: 0 },
    suffix: { type: String, default: '' },
    formatFn: { type: Function, default: null }
  },
  setup(props) {
    const current = ref(0);
    const hasStarted = ref(false);
    const lastEndValue = ref(props.end);

    const startAnimation = () => {
      hasStarted.value = true;
      const startTime = performance.now();
      const startValue = 0;
      const endValue = props.end;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / props.duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        current.value = startValue + (endValue - startValue) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          current.value = endValue;
        }
      };
      requestAnimationFrame(animate);
    };

    watch(() => props.end, (newEnd) => {
      if (newEnd !== lastEndValue.value) {
        lastEndValue.value = newEnd;
        hasStarted.value = false;
        current.value = 0;
        if (props.startOnVisible) {
          startAnimation();
        }
      }
    });

    watch(() => props.startOnVisible, (visible, oldVisible) => {
      if (visible && !oldVisible) {
        hasStarted.value = false;
        current.value = 0;
        lastEndValue.value = props.end;
        startAnimation();
      }
    }, { immediate: true });

    return () => {
      let displayValue;
      if (props.formatFn) {
        displayValue = props.formatFn(Math.round(current.value));
      } else if (props.decimals > 0) {
        displayValue = current.value.toFixed(props.decimals);
      } else {
        displayValue = Math.round(current.value).toLocaleString();
      }
      return h('span', { class: 'count-up' }, displayValue + props.suffix);
    };
  }
});

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: 'UP主' },
  totalDays: { type: Number, default: 0 },
  videoCount: { type: Number, default: 0 },
  growthMultiple: { type: Number, default: 1 }
});

const emit = defineEmits(['chart-visible']);

// ============ Refs ============
const storyStreamRef = ref(null);
const timelineRef = ref(null);
const persistenceRef = ref(null);
const chartSectionRef = ref(null);
const miniChartRef = ref(null);
const growthChartRef = ref(null);

const nodeRefs = ref([]);
const setNodeRef = (el, index) => {
  if (el) nodeRefs.value[index] = el;
};

// ============ 可见性状态 ============
const visibleNodes = ref(new Set());
const persistenceVisible = ref(false);
const chartVisible = ref(false);
const timelineProgress = ref(0);

let miniChart = null;
let growthChart = null;
let observers = [];

// ============ 基础计算属性 ============
const sortedVideos = computed(() => {
  return [...props.videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
});

const avgPublishDays = computed(() => {
  if (sortedVideos.value.length < 2) return 0;
  return Math.round(props.totalDays / sortedVideos.value.length);
});

const valleyVideos = computed(() => {
  if (props.videos.length === 0) return 0;
  const avgPlay = props.videos.reduce((s, v) => s + v.play_count, 0) / props.videos.length;
  return props.videos.filter(v => v.play_count < avgPlay * 0.3).length;
});

const breakThroughCount = computed(() => {
  let count = 0;
  let maxPlay = 0;
  sortedVideos.value.forEach(v => {
    if (v.play_count > maxPlay * 1.5 && maxPlay > 0) {
      count++;
    }
    maxPlay = Math.max(maxPlay, v.play_count);
  });
  return count;
});

const motivationText = computed(() => {
  const multiple = props.growthMultiple;
  if (isNaN(multiple) || multiple < 1) return '播放量保持稳定';
  if (multiple >= 10) return `播放量增长 ${multiple.toFixed(0)} 倍`;
  if (multiple >= 5) return `播放量增长 ${multiple.toFixed(1)} 倍`;
  if (multiple >= 2) return `播放量稳步增长 ${multiple.toFixed(1)} 倍`;
  return '播放量保持稳定';
});

// ============ 故事节点构建 ============
function formatDateCN(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const storyNodes = computed(() => {
  if (props.videos.length === 0) return [];

  const nodes = [];
  const videos = sortedVideos.value;
  const avgPlay = videos.reduce((s, v) => s + v.play_count, 0) / videos.length;
  const usedVideoBvids = new Set();

  // 1. 第一个视频 - 起点
  const firstVideo = videos[0];
  usedVideoBvids.add(firstVideo.bvid);
  nodes.push({
    id: 'start',
    date: new Date(firstVideo.publish_time),
    dateDisplay: formatDateCN(firstVideo.publish_time),
    type: 'start',
    title: '第一个视频',
    description: `这是 ${props.upName} 的起点。${formatNumber(firstVideo.play_count)} 次播放，一切从这里开始。`,
    icon: Flag,
    markerColor: 'marker-blue',
    iconColor: 'text-blue-500',
    cardClass: 'card-start',
    video: firstVideo,
    showCover: true
  });

  // 追踪变量
  let maxPlay = firstVideo.play_count;
  let cumulativePlays = firstVideo.play_count;
  const playMilestones = [100000, 500000, 1000000, 5000000, 10000000];
  const videoMilestones = [10, 50, 100, 200, 500];
  const achievedPlayMilestones = new Set();
  const yearsSeen = new Set([new Date(firstVideo.publish_time).getFullYear()]);

  videos.forEach((v, index) => {
    if (index === 0) return;

    const currDate = new Date(v.publish_time);
    const currYear = currDate.getFullYear();
    cumulativePlays += v.play_count;

    // 跨年节点
    if (!yearsSeen.has(currYear)) {
      yearsSeen.add(currYear);
      const prevYear = currYear - 1;
      const prevYearVideos = videos.filter(v => new Date(v.publish_time).getFullYear() === prevYear);
      const prevYearPlays = prevYearVideos.reduce((s, v) => s + v.play_count, 0);
      nodes.push({
        id: `year-${currYear}`,
        date: currDate,
        dateDisplay: `${currYear}年`,
        type: 'year',
        title: `${currYear}`,
        description: prevYearVideos.length > 0
          ? `${prevYear} 年发布了 ${prevYearVideos.length} 个视频，获得 ${formatNumber(prevYearPlays)} 次播放。新的一年继续。`
          : `创作进入第 ${currYear - new Date(firstVideo.publish_time).getFullYear() + 1} 年。`,
        icon: CalendarDays,
        markerColor: 'marker-slate',
        iconColor: 'text-slate-600',
        cardClass: 'card-year',
        video: null,
        showCover: false
      });
    }

    if (usedVideoBvids.has(v.bvid)) {
      playMilestones.forEach(milestone => {
        if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
          achievedPlayMilestones.add(milestone);
        }
      });
      maxPlay = Math.max(maxPlay, v.play_count);
      return;
    }

    const candidateEvents = [];

    // 播放量突破
    if (v.play_count > maxPlay * 2.5 && v.play_count > avgPlay * 1.5) {
      const growthTimes = (v.play_count / maxPlay).toFixed(1);
      const videosBefore = index;
      candidateEvents.push({
        priority: 1,
        node: {
          id: `breakthrough-${v.bvid}`,
          date: currDate,
          dateDisplay: formatDateCN(v.publish_time),
          type: 'breakthrough',
          title: '被看见的那天',
          description: `播放量达到 ${formatNumber(v.play_count)}，是之前最高记录的 ${growthTimes} 倍。在这之前，是 ${videosBefore} 个视频的积累。`,
          icon: PartyPopper,
          markerColor: 'marker-rose',
          iconColor: 'text-rose-500',
          cardClass: 'card-breakthrough',
          video: v,
          showCover: true
        }
      });
    }

    // 累计播放里程碑
    const newMilestones = [];
    playMilestones.forEach(milestone => {
      if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
        newMilestones.push(milestone);
      }
    });

    if (newMilestones.length > 0) {
      const biggestMilestone = Math.max(...newMilestones);
      const milestoneText = biggestMilestone >= 10000000 ? '千万' :
                           biggestMilestone >= 1000000 ? '百万' :
                           biggestMilestone >= 100000 ? '十万' : formatNumber(biggestMilestone);
      candidateEvents.push({
        priority: 2,
        milestone: biggestMilestone,
        allMilestones: newMilestones,
        node: {
          id: `cumulative-${biggestMilestone}`,
          date: currDate,
          dateDisplay: formatDateCN(v.publish_time),
          type: 'cumulative',
          title: `累计${milestoneText}播放`,
          description: `第 ${index + 1} 个视频发布时，总播放量突破 ${formatNumber(biggestMilestone)}。`,
          icon: Trophy,
          markerColor: 'marker-amber',
          iconColor: 'text-amber-500',
          cardClass: 'card-milestone',
          video: v,
          showCover: biggestMilestone >= 500000,
          stats: [`累计 ${formatNumber(cumulativePlays)} 播放`]
        }
      });
    }

    // 视频数量里程碑
    const videoCount = index + 1;
    if (videoMilestones.includes(videoCount)) {
      const daysToReach = Math.ceil((currDate - new Date(firstVideo.publish_time)) / (1000 * 60 * 60 * 24));
      const milestoneMessages = {
        10: `第 10 个作品。用了 ${daysToReach} 天，${props.upName} 完成了从 0 到 10 的积累。`,
        50: `第 50 个作品。创作已经成为习惯。`,
        100: `第 100 个作品。${daysToReach} 天，100 个视频，这份坚持本身就是答案。`,
        200: `第 200 个作品。持续创作 ${Math.floor(daysToReach / 365)} 年多，${props.upName} 依然在更新。`,
        500: `第 500 个作品。这是一个传奇数字。`
      };
      candidateEvents.push({
        priority: videoCount >= 100 ? 1.5 : 3,
        node: {
          id: `count-${videoCount}`,
          date: currDate,
          dateDisplay: formatDateCN(v.publish_time),
          type: 'count',
          title: `第 ${videoCount} 个作品`,
          description: milestoneMessages[videoCount],
          icon: videoCount >= 100 ? Crown : Milestone,
          markerColor: videoCount >= 100 ? 'marker-purple' : 'marker-cyan',
          iconColor: videoCount >= 100 ? 'text-purple-500' : 'text-cyan-500',
          cardClass: videoCount >= 100 ? 'card-major-count' : 'card-count',
          video: v,
          showCover: videoCount >= 100
        }
      });
    }

    if (candidateEvents.length > 0) {
      candidateEvents.sort((a, b) => a.priority - b.priority);
      const chosen = candidateEvents[0];
      nodes.push(chosen.node);
      usedVideoBvids.add(v.bvid);
      if (chosen.allMilestones) {
        chosen.allMilestones.forEach(m => achievedPlayMilestones.add(m));
      }
    }

    newMilestones.forEach(m => achievedPlayMilestones.add(m));
    maxPlay = Math.max(maxPlay, v.play_count);
  });

  // 检测最长断更期
  if (videos.length >= 5) {
    let maxGap = 0;
    let maxGapIndex = -1;
    for (let i = 1; i < videos.length; i++) {
      const gap = new Date(videos[i].publish_time) - new Date(videos[i-1].publish_time);
      const gapDays = gap / (1000 * 60 * 60 * 24);
      if (gapDays > maxGap && gapDays >= 60) {
        maxGap = gapDays;
        maxGapIndex = i;
      }
    }
    if (maxGapIndex > 0 && !usedVideoBvids.has(videos[maxGapIndex].bvid)) {
      const silentDays = Math.floor(maxGap);
      const returnVideo = videos[maxGapIndex];
      nodes.push({
        id: 'silence',
        date: new Date(returnVideo.publish_time),
        dateDisplay: formatDateCN(returnVideo.publish_time),
        type: 'silence',
        title: `沉默的 ${silentDays} 天`,
        description: `这段时间没有更新。我们不知道发生了什么，但 ${props.upName} 回来了。`,
        icon: Flame,
        markerColor: 'marker-slate',
        iconColor: 'text-slate-500',
        cardClass: 'card-silence',
        video: returnVideo,
        showCover: false
      });
      usedVideoBvids.add(returnVideo.bvid);
    }
  }

  // 最新作品
  const lastVideo = videos[videos.length - 1];
  if (videos.length > 1 && !usedVideoBvids.has(lastVideo.bvid)) {
    nodes.push({
      id: 'now',
      date: new Date(lastVideo.publish_time),
      dateDisplay: '最近',
      type: 'current',
      title: '最新作品',
      description: `第 ${videos.length} 个作品。故事还在继续。`,
      icon: PenTool,
      markerColor: 'marker-emerald',
      iconColor: 'text-emerald-500',
      cardClass: 'card-current',
      video: lastVideo,
      showCover: true
    });
  }

  // 排序并限制数量
  const sorted = nodes.sort((a, b) => a.date - b.date);
  if (sorted.length > 15) {
    const priorityOrder = { start: 0, breakthrough: 1, current: 2, silence: 3, cumulative: 4, count: 5, year: 6 };
    const scored = sorted.map(n => ({ ...n, score: priorityOrder[n.type] ?? 10 }));
    scored.sort((a, b) => a.score - b.score);
    const kept = scored.slice(0, 15);
    return kept.sort((a, b) => a.date - b.date);
  }
  return sorted;
});

// ============ Intersection Observer ============
function setupObservers() {
  observers.forEach(obs => obs.disconnect());
  observers = [];

  // 节点观察器
  const nodeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const index = nodeRefs.value.indexOf(entry.target);
        if (index !== -1) {
          if (entry.isIntersecting) {
            visibleNodes.value.add(index);
            visibleNodes.value = new Set(visibleNodes.value);
          }
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  nodeRefs.value.forEach(el => {
    if (el) nodeObserver.observe(el);
  });
  observers.push(nodeObserver);

  // Persistence 观察器
  if (persistenceRef.value) {
    const persistenceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            persistenceVisible.value = true;
          }
        });
      },
      { threshold: 0.3 }
    );
    persistenceObserver.observe(persistenceRef.value);
    observers.push(persistenceObserver);
  }

  // Chart 观察器
  if (chartSectionRef.value) {
    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            chartVisible.value = true;
            emit('chart-visible');
            nextTick(() => {
              renderGrowthChart();
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    chartObserver.observe(chartSectionRef.value);
    observers.push(chartObserver);
  }
}

// 滚动进度追踪
function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  timelineProgress.value = Math.min(scrollPercent * 1.2, 100);
}

// 更新时间线位置
function updateTimelinePosition() {
  if (!timelineRef.value || nodeRefs.value.length === 0) return;

  const container = timelineRef.value.parentElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const firstNode = nodeRefs.value[0];
  const lastNode = nodeRefs.value[nodeRefs.value.length - 1];

  if (!firstNode || !lastNode) return;

  const firstRect = firstNode.getBoundingClientRect();
  const lastRect = lastNode.getBoundingClientRect();

  const firstCenter = firstRect.top + firstRect.height / 2 - containerRect.top;
  const lastCenter = lastRect.top + lastRect.height / 2 - containerRect.top;

  container.style.setProperty('--timeline-top', `${firstCenter}px`);
  container.style.setProperty('--timeline-bottom', `${containerRect.height - lastCenter}px`);
}

// ============ 图表渲染 ============
function renderMiniChart() {
  if (!miniChartRef.value || sortedVideos.value.length < 2) return;
  if (miniChart) miniChart.dispose();
  miniChart = echarts.init(miniChartRef.value);

  const data = sortedVideos.value.map((v, i) => [i, v.play_count]);

  miniChart.setOption({
    grid: { top: 10, right: 0, bottom: 0, left: 0 },
    xAxis: { type: 'value', show: false, min: 0, max: sortedVideos.value.length - 1 },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data,
      smooth: 0.5,
      showSymbol: false,
      lineStyle: { width: 3, color: '#3b82f6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0)' }
        ])
      }
    }]
  });
}

function renderGrowthChart() {
  if (!growthChartRef.value || sortedVideos.value.length < 2) return;
  if (growthChart) growthChart.dispose();
  growthChart = echarts.init(growthChartRef.value);

  const videos = sortedVideos.value;
  const monthlyData = {};

  videos.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalPlay: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].totalPlay += v.play_count;
  });

  const months = Object.keys(monthlyData).sort();
  const avgPlays = months.map(m => Math.round(monthlyData[m].totalPlay / monthlyData[m].count));

  let cumulative = 0;
  const cumulativePlays = months.map(m => {
    cumulative += monthlyData[m].totalPlay;
    return cumulative;
  });

  growthChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'transparent',
      padding: [12, 16],
      textStyle: { color: '#374151', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
      formatter: params => {
        const month = params[0].axisValue;
        const data = monthlyData[month];
        return `<div style="font-family: system-ui;">
          <strong>${month}</strong><br/>
          <span style="color: #6b7280;">发布 ${data.count} 个视频</span><br/>
          <span style="color: #3b82f6;">均播放 ${formatNumber(Math.round(data.totalPlay / data.count))}</span>
        </div>`;
      }
    },
    grid: { top: 40, right: 50, bottom: 50, left: 50 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        rotate: 45,
        interval: Math.max(0, Math.floor(months.length / 8) - 1)
      }
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#9ca3af', fontSize: 11, formatter: v => formatNumber(v) }
      },
      {
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11, formatter: v => formatNumber(v) }
      }
    ],
    series: [
      {
        name: '月均播放',
        type: 'bar',
        data: avgPlays,
        barMaxWidth: 20,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '累计播放',
        type: 'line',
        yAxisIndex: 1,
        data: cumulativePlays,
        smooth: 0.4,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#10b981', type: 'dashed' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.1)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ])
        }
      }
    ]
  });
}

async function openVideo(video) {
  if (video?.video_url) {
    await open(video.video_url);
  }
}

// ============ 重置方法 ============
function reset() {
  visibleNodes.value = new Set();
  persistenceVisible.value = false;
  chartVisible.value = false;
  nodeRefs.value = [];
}

function init() {
  nextTick(() => {
    setupObservers();
    renderMiniChart();
    updateTimelinePosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateTimelinePosition);
    handleScroll();
  });
}

// ============ 生命周期 ============
onMounted(() => {
  // 初始化由父组件控制
});

onUnmounted(() => {
  observers.forEach(obs => obs.disconnect());
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateTimelinePosition);
  if (miniChart) miniChart.dispose();
  if (growthChart) growthChart.dispose();
});

defineExpose({ reset, init, setupObservers, updateTimelinePosition, renderMiniChart });
</script>

<style scoped>
/* ============ Story Stream ============ */
.story-stream {
  @apply max-w-4xl mx-auto px-4 sm:px-6 relative;
}

.timeline-center-line {
  @apply absolute left-6 sm:left-1/2 w-px bg-slate-200/80 pointer-events-none;
  transform: translateX(-50%);
  top: var(--timeline-top, 5rem);
  bottom: var(--timeline-bottom, 5rem);
}

.timeline-progress {
  @apply absolute top-0 left-0 right-0 bg-gradient-to-b from-blue-400 to-blue-500;
  transition: height 0.1s ease-out;
}

.story-nodes {
  @apply relative space-y-20 py-20;
}

/* ============ Story Node ============ */
.story-node {
  @apply relative;
  padding-left: 4rem;
  opacity: 0;
  transform: translateX(-30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-node.is-right {
  transform: translateX(30px);
}

.story-node.is-visible {
  opacity: 1;
  transform: translateX(0);
}

@media (min-width: 640px) {
  .story-node {
    @apply flex items-center;
    padding-left: 0;
  }

  .story-node .node-card {
    @apply w-[45%] ml-auto;
    margin-left: 55%;
  }

  .story-node .node-date {
    @apply absolute w-[45%] text-right pr-10;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  .story-node.is-right .node-date {
    @apply text-left pl-10;
    left: auto;
    right: 0;
  }

  .story-node.is-right .node-card {
    @apply mr-auto ml-0;
    margin-right: 55%;
    margin-left: 0;
  }

  .story-node {
    transform: translateX(-50px);
  }

  .story-node.is-right {
    transform: translateX(50px);
  }

  .story-node.is-visible {
    transform: translateX(0);
  }
}

.node-marker {
  @apply absolute w-4 h-4 rounded-full flex items-center justify-center z-10;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;
}

.node-marker-dot {
  @apply w-3 h-3 rounded-full bg-current;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 5px currentColor;
}

.story-node.is-visible .node-marker {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

@media (min-width: 640px) {
  .node-marker {
    left: 50%;
  }
}

.marker-blue { @apply text-blue-500; }
.marker-amber { @apply text-amber-500; }
.marker-rose { @apply text-rose-500; }
.marker-emerald { @apply text-emerald-500; }
.marker-purple { @apply text-purple-500; }
.marker-cyan { @apply text-cyan-500; }
.marker-slate { @apply text-slate-500; }

.node-date {
  @apply text-sm text-slate-400 mb-3 sm:mb-0;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  font-style: italic;
}

.node-card {
  @apply bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 relative overflow-hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.node-card:hover {
  @apply bg-white border-slate-300/80;
  transform: translateY(-2px);
}

/* 视频封面 */
.node-cover {
  @apply relative w-full aspect-video overflow-hidden;
}

.node-cover-img {
  @apply w-full h-full object-cover transition-transform duration-500;
}

.node-card:hover .node-cover-img {
  transform: scale(1.05);
}

.node-cover-overlay {
  @apply absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 transition-opacity duration-300;
}

.node-card:hover .node-cover-overlay {
  opacity: 1;
}

.node-cover-stats {
  @apply absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent;
  @apply flex items-center gap-3 text-white text-xs;
}

.node-cover-stats span {
  @apply flex items-center gap-1;
}

.node-card-bg-icon {
  @apply absolute -right-4 -bottom-4 text-slate-100 rotate-12;
  opacity: 0.5;
}

.node-card-content {
  @apply relative z-10 p-5;
}

.node-card-header {
  @apply flex items-center gap-2 mb-2;
}

.node-card-title {
  @apply font-bold text-slate-800 text-base;
}

.node-card-desc {
  @apply text-sm text-slate-600 leading-relaxed;
}

.node-video-link {
  @apply mt-4 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300;
  background: rgba(241, 245, 249, 0.8);
}

.node-video-link:hover {
  background: rgba(219, 234, 254, 0.6);
  transform: translateX(4px);
}

.node-video-play {
  @apply w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.node-video-info {
  @apply min-w-0 text-left;
}

.node-video-title {
  @apply text-xs font-medium text-slate-700 truncate;
}

.node-video-meta {
  @apply text-[10px] text-slate-400;
}

.node-video-title-only {
  @apply mt-3 text-sm font-medium text-slate-800 line-clamp-2;
}

.node-stats {
  @apply flex items-center gap-3 mt-3 text-xs text-slate-500;
}

.node-stat-item {
  @apply px-2 py-1 bg-slate-50 rounded;
}

/* ============ Persistence Interlude ============ */
.persistence-interlude {
  @apply relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 my-24 mx-0 sm:mx-4;
  opacity: 0;
  transform: translateY(40px) scale(0.95);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.persistence-interlude.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.persistence-badge {
  @apply absolute -top-5 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2;
}

.persistence-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-10 mt-6;
}

.persistence-item {
  @apply space-y-3;
}

.persistence-title {
  @apply text-xl font-bold text-slate-800;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

.persistence-text {
  @apply text-sm text-slate-600 leading-relaxed;
}

.persistence-insight {
  @apply text-xs text-slate-400 italic;
}

.persistence-quote {
  @apply flex items-start gap-2 text-xs text-slate-400 mt-4 bg-slate-50 p-4 rounded-xl;
}

.mini-chart {
  @apply h-24 w-full mt-4;
}

/* ============ Growth Chart Section ============ */
.growth-chart-section {
  @apply bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 my-8;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.growth-chart-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.growth-chart-header {
  @apply flex items-center gap-2 mb-4 text-slate-800 font-semibold;
}

.growth-chart {
  @apply h-72;
}

/* ============ Utilities ============ */
.count-up {
  @apply tabular-nums;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
