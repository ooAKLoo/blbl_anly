<template>
  <div
    class="story-ending"
    ref="endingRef"
    :class="{ 'is-visible': isVisible }"
  >
    <!-- 分割线 -->
    <div class="ending-divider animate-item" :class="{ 'is-visible': isVisible }" style="--delay: 0s"></div>

    <!-- 标题：成长轨迹 -->
    <h2 class="section-title animate-item" :class="{ 'is-visible': isVisible }" style="--delay: 0.1s">成长轨迹</h2>

    <!-- 核心可视化区域 -->
    <div class="visualization-container animate-item" :class="{ 'is-visible': isVisible }" style="--delay: 0.2s" ref="vizContainer">
      <!-- 累积播放量折线图 -->
      <div class="chart-area">
        <!-- 当前时间/播放量实时显示（跟随光标） -->
        <div
          v-if="animationProgress > 0 && animationProgress < 1"
          class="live-indicator"
          :style="{ left: `calc(${pathDrawProgress * 100}% + 20px)` }"
        >
          <div class="live-date">{{ currentDateLabel }}</div>
          <div class="live-plays">{{ formatNumber(currentAnimationData.cumulative) }}</div>
        </div>

        <svg ref="chartSvg" class="growth-chart" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="1" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <!-- 里程碑发光 -->
            <filter id="milestoneGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- 裁剪区域 -->
          <clipPath id="areaClip">
            <rect :x="0" :y="0" :width="50 + pathDrawProgress * 900" :height="280" />
          </clipPath>

          <!-- 里程碑垂直标记线（在区域填充之前，作为背景） -->
          <g class="milestone-lines">
            <template v-for="milestone in visibleMilestones" :key="milestone.id">
              <line
                :x1="milestone.x"
                :y1="60"
                :x2="milestone.x"
                :y2="340"
                :stroke="milestone.color"
                stroke-width="1"
                stroke-dasharray="4 4"
                :opacity="milestone.opacity * 0.3"
              />
            </template>
          </g>

          <!-- 区域填充 -->
          <path
            :d="areaPath"
            fill="url(#areaGradient)"
            clip-path="url(#areaClip)"
          />

          <!-- 主线条 -->
          <path
            ref="mainPath"
            :d="linePath"
            fill="none"
            stroke="url(#lineGradient)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            :style="{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - pathDrawProgress)
            }"
            filter="url(#glow)"
          />

          <!-- 里程碑点 -->
          <g class="milestones">
            <template v-for="milestone in visibleMilestones" :key="milestone.id">
              <circle
                :cx="milestone.x"
                :cy="milestone.y"
                :r="milestone.isActive ? 10 : 6"
                :fill="milestone.color"
                :opacity="milestone.opacity"
                :filter="milestone.isActive ? 'url(#milestoneGlow)' : ''"
                class="milestone-dot"
              />
              <!-- 里程碑标签 -->
              <g
                v-if="milestone.showLabel"
                :transform="`translate(${milestone.x}, ${milestone.y - 20})`"
                class="milestone-label"
                :style="{ opacity: milestone.opacity }"
              >
                <text
                  text-anchor="middle"
                  fill="#64748b"
                  font-size="11"
                  font-weight="500"
                >
                  {{ milestone.label }}
                </text>
              </g>
            </template>
          </g>

          <!-- 当前追踪点 -->
          <g v-if="animationProgress > 0">
            <circle
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="8"
              fill="#3b82f6"
              filter="url(#glow)"
              class="current-dot"
            />
            <!-- 脉冲效果 -->
            <circle
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="8"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              class="pulse-ring"
            />
            <!-- 第二层脉冲 -->
            <circle
              :cx="currentPoint.x"
              :cy="currentPoint.y"
              r="8"
              fill="none"
              stroke="#3b82f6"
              stroke-width="1"
              class="pulse-ring-2"
            />
          </g>
        </svg>

        <!-- 时间轴 -->
        <div class="time-axis">
          <span class="time-label">{{ journeyStartLabel }}</span>
          <span class="time-label">{{ journeyEndLabel }}</span>
        </div>
      </div>
    </div>

    <!-- 核心数据展示 - 简化为大数字 -->
    <div class="hero-stats animate-item" :class="{ 'is-visible': isVisible, 'animate-in': animationProgress >= 1 }" style="--delay: 0.3s">
      <div class="stat-item primary">
        <span class="stat-value">{{ displayPlays }}</span>
        <span class="stat-label">累积播放</span>
      </div>
    </div>

    <!-- 次要数据 -->
    <div class="secondary-stats animate-item" :class="{ 'is-visible': isVisible }" style="--delay: 0.4s">
      <div class="stat-pill">
        <span class="pill-value">{{ displayDays }}</span>
        <span class="pill-label">天</span>
      </div>
      <div class="stat-pill">
        <span class="pill-value">{{ props.videos?.length || 0 }}</span>
        <span class="pill-label">个作品</span>
      </div>
      <div class="stat-pill highlight" v-if="props.growthMultiple > 1">
        <span class="pill-value">{{ displayGrowth }}×</span>
        <span class="pill-label">成长</span>
      </div>
    </div>

    <!-- 结语区域：左侧文字 + 右侧印戳 -->
    <div class="ending-footer animate-item" :class="{ 'is-visible': isVisible }" style="--delay: 0.5s">
      <!-- 左侧：结语文字 -->
      <div class="ending-narrative">
        <p class="narrative-text">
          从 <strong>{{ journeyStartLabel }}</strong> 的第一个视频开始，<br/>
          <span class="highlight">{{ upName }}</span> 用 <strong>{{ displayDays }}</strong> 天，<br/>
          将 <strong>{{ formatNumber(firstVideoPlays) }}</strong> 播放变成了 <strong>{{ formatNumber(totalPlays) }}</strong>。
        </p>
        <p class="narrative-ending" v-if="animationProgress >= 1">
          故事还在继续。
        </p>
      </div>

      <!-- 右侧：印戳 -->
      <div class="rhythm-stamp" :class="{ 'is-visible': animationProgress >= 1 }">
        <div class="stamp-header">
          <span class="stamp-number">{{ avgPublishDays }}</span>
          <span class="stamp-unit">天/更</span>
        </div>
        <div class="stamp-chart">
          <svg viewBox="0 0 120 40" class="mini-line-chart">
            <path
              :d="miniChartPath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              :d="miniChartAreaPath"
              fill="url(#miniGradient)"
            />
            <defs>
              <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="stamp-detail">
          {{ totalYears }}年{{ totalDaysRemainder }}天 · {{ props.videos?.length || 0 }}个作品
        </div>
      </div>
    </div>

    <!-- 重播按钮 -->
    <button
      v-if="animationProgress >= 1"
      class="replay-button"
      @click="replay"
    >
      <svg class="replay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 4v6h6M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      再看一次
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { formatNumber } from '../../../utils';

const props = defineProps({
  upName: { type: String, default: 'UP主' },
  totalDays: { type: Number, default: 0 },
  firstVideoPlays: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  videos: { type: Array, default: () => [] },
  growthMultiple: { type: Number, default: 1 }
});

const emit = defineEmits(['visible']);

// Refs
const endingRef = ref(null);
const vizContainer = ref(null);
const chartSvg = ref(null);
const mainPath = ref(null);

// 状态
const isVisible = ref(false);
const animationProgress = ref(0);
const pathLength = ref(1000);
const displayDays = ref('0');
const displayPlays = ref('0');
const displayGrowth = ref('1.0');

let observer = null;
let animationFrame = null;

// ============ 数据计算 ============

// 计算累积播放量数据点（按真实时间轴）
const growthData = computed(() => {
  if (!props.videos || props.videos.length === 0) {
    return [{ timeProgress: 0, cumulative: 0, date: new Date() }];
  }

  const sorted = [...props.videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  const firstDate = new Date(sorted[0].publish_time).getTime();
  const lastDate = new Date(sorted[sorted.length - 1].publish_time).getTime();
  const totalTimeSpan = lastDate - firstDate || 1;

  let cumulative = 0;
  return sorted.map((v, i) => {
    cumulative += v.play_count;
    const currentDate = new Date(v.publish_time).getTime();
    return {
      index: i,
      cumulative,
      playCount: v.play_count,
      date: new Date(v.publish_time),
      timeProgress: (currentDate - firstDate) / totalTimeSpan,
      title: v.title
    };
  });
});

// 时间到数据映射
const timeToDataMap = computed(() => {
  const data = growthData.value;
  if (data.length < 2) return [];

  const maxCumulative = data[data.length - 1].cumulative;

  return data.map(d => ({
    timeProgress: d.timeProgress,
    playProgress: d.cumulative / maxCumulative,
    cumulative: d.cumulative,
    videoCount: d.index + 1,
    date: d.date
  }));
});

// 根据时间进度获取数据
function getPlayProgressAtTime(timeProgress) {
  const map = timeToDataMap.value;
  if (map.length < 2) return { playProgress: 0, cumulative: 0, videoCount: 0, date: new Date() };

  for (let i = 1; i < map.length; i++) {
    if (timeProgress <= map[i].timeProgress) {
      const prev = map[i - 1];
      const curr = map[i];
      const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

      return {
        playProgress: prev.playProgress + (curr.playProgress - prev.playProgress) * segmentProgress,
        cumulative: Math.floor(prev.cumulative + (curr.cumulative - prev.cumulative) * segmentProgress),
        videoCount: prev.videoCount + Math.floor((curr.videoCount - prev.videoCount) * segmentProgress),
        date: new Date(prev.date.getTime() + (curr.date.getTime() - prev.date.getTime()) * segmentProgress)
      };
    }
  }

  const last = map[map.length - 1];
  return { playProgress: last.playProgress, cumulative: last.cumulative, videoCount: last.videoCount, date: last.date };
}

const currentAnimationData = computed(() => {
  return getPlayProgressAtTime(animationProgress.value);
});

// 当前日期标签
const currentDateLabel = computed(() => {
  const date = currentAnimationData.value.date;
  return `${date.getFullYear()}.${date.getMonth() + 1}`;
});

// ============ 里程碑系统 ============

// 计算关键里程碑
const milestones = computed(() => {
  const data = growthData.value;
  if (data.length < 2) return [];

  const result = [];
  const maxCumulative = data[data.length - 1].cumulative;

  // 1. 首个视频
  result.push({
    id: 'first',
    index: 0,
    type: 'first',
    label: '起点',
    color: '#6366f1',
    timeProgress: data[0].timeProgress,
    cumulative: data[0].cumulative
  });

  // 2. 播放量里程碑（1万、10万、100万、1000万、1亿）
  const playMilestones = [10000, 100000, 1000000, 10000000, 100000000];
  playMilestones.forEach(threshold => {
    const idx = data.findIndex(d => d.cumulative >= threshold);
    if (idx > 0 && threshold <= maxCumulative) {
      const labels = {
        10000: '1万',
        100000: '10万',
        1000000: '100万',
        10000000: '1000万',
        100000000: '1亿'
      };
      result.push({
        id: `play-${threshold}`,
        index: idx,
        type: 'play-milestone',
        label: labels[threshold],
        color: '#10b981',
        timeProgress: data[idx].timeProgress,
        cumulative: data[idx].cumulative
      });
    }
  });

  // 3. 最高播放视频
  let maxPlayIdx = 0;
  let maxPlay = 0;
  data.forEach((d, i) => {
    if (d.playCount > maxPlay) {
      maxPlay = d.playCount;
      maxPlayIdx = i;
    }
  });
  if (maxPlayIdx > 0 && maxPlay > 10000) {
    result.push({
      id: 'peak',
      index: maxPlayIdx,
      type: 'peak',
      label: '爆款',
      color: '#f59e0b',
      timeProgress: data[maxPlayIdx].timeProgress,
      cumulative: data[maxPlayIdx].cumulative
    });
  }

  return result;
});

// SVG 路径计算
const chartDimensions = { width: 1000, height: 400, padding: 60 };

const scaledPoints = computed(() => {
  const data = growthData.value;
  if (data.length < 2) return [];

  const { width, height, padding } = chartDimensions;
  const maxY = Math.max(...data.map(d => d.cumulative));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return data.map((d) => ({
    x: padding + d.timeProgress * chartWidth,
    y: height - padding - (d.cumulative / maxY) * chartHeight,
    cumulative: d.cumulative,
    timeProgress: d.timeProgress
  }));
});

// 里程碑点位置
const visibleMilestones = computed(() => {
  const points = scaledPoints.value;
  if (points.length === 0) return [];

  const { width, height, padding } = chartDimensions;
  const maxY = Math.max(...growthData.value.map(d => d.cumulative));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return milestones.value.map(m => {
    const x = padding + m.timeProgress * chartWidth;
    const y = height - padding - (m.cumulative / maxY) * chartHeight;
    const isPassed = animationProgress.value >= m.timeProgress;
    const isActive = isPassed && animationProgress.value < m.timeProgress + 0.05;

    return {
      ...m,
      x,
      y,
      opacity: isPassed ? 1 : 0,
      isActive,
      showLabel: isPassed && animationProgress.value > m.timeProgress + 0.02
    };
  });
});

// 生成平滑曲线路径
const linePath = computed(() => {
  const points = scaledPoints.value;
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
  }

  return path;
});

const areaPath = computed(() => {
  const points = scaledPoints.value;
  if (points.length < 2) return '';

  const { height, padding } = chartDimensions;
  const baseline = height - padding;

  let path = `M ${points[0].x} ${baseline}`;
  path += ` L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
  }

  path += ` L ${points[points.length - 1].x} ${baseline} Z`;
  return path;
});

const currentPoint = computed(() => {
  const points = scaledPoints.value;
  if (points.length === 0) return { x: 0, y: 0 };

  const timeProgress = animationProgress.value;

  for (let i = 1; i < points.length; i++) {
    if (timeProgress <= points[i].timeProgress) {
      const prev = points[i - 1];
      const curr = points[i];
      const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

      return {
        x: prev.x + (curr.x - prev.x) * segmentProgress,
        y: prev.y + (curr.y - prev.y) * segmentProgress
      };
    }
  }

  return points[points.length - 1];
});

const pathDrawProgress = computed(() => {
  const { width, padding } = chartDimensions;
  const chartWidth = width - padding * 2;
  const currentX = currentPoint.value.x - padding;
  return Math.max(0, Math.min(1, currentX / chartWidth));
});

// 时间轴标签
const journeyStartLabel = computed(() => {
  if (!props.videos || props.videos.length === 0) return '';
  const sorted = [...props.videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );
  const date = new Date(sorted[0].publish_time);
  return `${date.getFullYear()}.${date.getMonth() + 1}`;
});

const journeyEndLabel = computed(() => {
  if (!props.videos || props.videos.length === 0) return '现在';
  const sorted = [...props.videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );
  const date = new Date(sorted[sorted.length - 1].publish_time);
  const now = new Date();
  // 如果最后一个视频是最近30天内，显示"现在"
  if (now - date < 30 * 24 * 60 * 60 * 1000) {
    return '现在';
  }
  return `${date.getFullYear()}.${date.getMonth() + 1}`;
});

// 更新频率计算
const avgPublishDays = computed(() => {
  if (!props.videos || props.videos.length < 2) return 0;
  return Math.round(props.totalDays / props.videos.length);
});

const totalYears = computed(() => Math.floor(props.totalDays / 365));
const totalDaysRemainder = computed(() => props.totalDays % 365);

// 迷你折线图路径 - 展示每个视频的播放量起伏
const miniChartPath = computed(() => {
  if (!props.videos || props.videos.length < 2) return '';

  // 按时间排序的视频
  const sorted = [...props.videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  const width = 120;
  const height = 40;
  const padding = 4;

  const maxY = Math.max(...sorted.map(v => v.play_count));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = sorted.map((v, i) => ({
    x: padding + (i / (sorted.length - 1)) * chartWidth,
    y: height - padding - (v.play_count / maxY) * chartHeight
  }));

  // 使用平滑曲线
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }

  return path;
});

const miniChartAreaPath = computed(() => {
  if (!props.videos || props.videos.length < 2) return '';

  const sorted = [...props.videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  const width = 120;
  const height = 40;
  const padding = 4;

  const maxY = Math.max(...sorted.map(v => v.play_count));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = sorted.map((v, i) => ({
    x: padding + (i / (sorted.length - 1)) * chartWidth,
    y: height - padding - (v.play_count / maxY) * chartHeight
  }));

  let path = `M ${points[0].x} ${height - padding}`;
  path += ` L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  path += ` L ${points[points.length - 1].x} ${height - padding} Z`;

  return path;
});

// ============ 动画 ============

function animateNumbers(timeProgress) {
  const animData = getPlayProgressAtTime(timeProgress);
  displayDays.value = Math.floor(props.totalDays * timeProgress).toLocaleString();
  displayPlays.value = formatNumber(animData.cumulative);
  displayGrowth.value = (props.growthMultiple * animData.playProgress).toFixed(1);
}

function startAnimation() {
  if (!isVisible.value) return;

  const duration = 8000;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const timeProgress = Math.min(elapsed / duration, 1);

    animationProgress.value = timeProgress;
    animateNumbers(timeProgress);

    if (timeProgress < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  nextTick(() => {
    if (mainPath.value) {
      pathLength.value = mainPath.value.getTotalLength() || 1000;
    }
    animationFrame = requestAnimationFrame(animate);
  });
}

function replay() {
  animationProgress.value = 0;
  displayDays.value = '0';
  displayPlays.value = '0';
  displayGrowth.value = '1.0';

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  setTimeout(() => {
    startAnimation();
  }, 300);
}

function setupObserver() {
  if (!endingRef.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true;
          emit('visible');
          setTimeout(() => {
            startAnimation();
          }, 500);
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(endingRef.value);
}

function reset() {
  isVisible.value = false;
  animationProgress.value = 0;
  displayDays.value = '0';
  displayPlays.value = '0';
  displayGrowth.value = '1.0';
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
}

onMounted(() => {
  setupObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  if (animationFrame) cancelAnimationFrame(animationFrame);
});

defineExpose({ reset, setupObserver });
</script>

<style scoped>
.story-ending {
  @apply text-center min-h-screen flex flex-col justify-center py-16;
}

/* 通用动画项 */
.animate-item {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}

.animate-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.ending-divider {
  @apply w-32 h-px mx-auto mb-10;
  background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
}

.ending-divider.is-visible {
  animation: dividerExpand 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes dividerExpand {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 8rem;
    opacity: 1;
  }
}

.section-title {
  @apply text-2xl font-semibold text-slate-700 mb-10;
  letter-spacing: 0.1em;
}

/* ============ 图表区域 ============ */
.visualization-container {
  @apply max-w-6xl mx-auto px-6 mb-12;
}

.visualization-container.is-visible {
  animation: chartReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

@keyframes chartReveal {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chart-area {
  @apply relative;
}

/* 实时指示器 */
.live-indicator {
  @apply absolute top-2 z-10 pointer-events-none;
  transform: translateX(-50%);
  transition: left 0.1s linear;
}

.live-date {
  @apply text-xs text-slate-400 mb-0.5;
}

.live-plays {
  @apply text-sm font-bold text-blue-600 tabular-nums;
}

.growth-chart {
  @apply w-full;
  height: auto;
  max-height: 450px;
}

/* 里程碑 */
.milestone-dot {
  transition: r 0.3s ease, opacity 0.3s ease;
}

.milestone-label {
  transition: opacity 0.3s ease;
}

/* 追踪点动画 */
.current-dot {
  animation: dotPulse 2s ease-in-out infinite;
}

.pulse-ring {
  animation: pulseExpand 2s ease-out infinite;
}

.pulse-ring-2 {
  animation: pulseExpand 2s ease-out infinite 0.5s;
}

@keyframes dotPulse {
  0%, 100% { r: 8; }
  50% { r: 10; }
}

@keyframes pulseExpand {
  0% { r: 8; opacity: 0.6; }
  100% { r: 30; opacity: 0; }
}

.time-axis {
  @apply flex justify-between text-xs text-slate-400 mt-3 px-12;
}

/* ============ 结语底部区域 ============ */
.ending-footer {
  @apply flex items-center justify-center gap-8 max-w-2xl mx-auto mb-8;
}

/* ============ 印戳式更新频率 ============ */
.rhythm-stamp {
  @apply flex-shrink-0 p-4 rounded-2xl text-center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  opacity: 0;
  transform: translateY(10px) rotate(2deg);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.rhythm-stamp.is-visible {
  opacity: 1;
  transform: translateY(0) rotate(-1deg);
}

.stamp-header {
  @apply flex items-baseline justify-center gap-1 mb-2;
}

.stamp-number {
  @apply text-2xl font-bold text-slate-700 tabular-nums;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

.stamp-unit {
  @apply text-xs font-medium text-slate-500;
}

.stamp-chart {
  @apply w-28 h-10 mx-auto;
}

.mini-line-chart {
  @apply w-full h-full;
}

.stamp-detail {
  @apply text-xs text-slate-400 mt-2;
}

/* ============ 核心数据展示 ============ */
.hero-stats {
  @apply mb-6;
}

.hero-stats.is-visible {
  opacity: 0.7;
}

.hero-stats.is-visible.animate-in {
  opacity: 1;
}

.stat-item.primary {
  @apply inline-flex flex-col items-center;
}

.stat-item.primary .stat-value {
  @apply text-5xl sm:text-6xl font-bold text-blue-600 tabular-nums;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  text-shadow: 0 4px 30px rgba(59, 130, 246, 0.25);
  letter-spacing: -0.02em;
}

.stat-item.primary .stat-label {
  @apply text-sm text-slate-500 mt-2;
}

/* 次要数据 */
.secondary-stats {
  @apply flex justify-center items-center gap-3 mb-10 flex-wrap;
}

.stat-pill {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-full;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
}

.stat-pill .pill-value {
  @apply text-base font-semibold text-slate-700 tabular-nums;
}

.stat-pill .pill-label {
  @apply text-sm text-slate-500;
}

.stat-pill.highlight {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
}

.stat-pill.highlight .pill-value {
  @apply text-amber-600;
}

.stat-pill.highlight .pill-label {
  @apply text-amber-700;
}

/* ============ 结语叙事 ============ */
.ending-narrative {
  @apply text-left;
}

.narrative-text {
  @apply text-slate-500 leading-relaxed text-base;
}

.narrative-text strong {
  @apply text-slate-700 font-semibold;
}

.narrative-text .highlight {
  @apply text-blue-600 font-semibold;
}

.narrative-ending {
  @apply text-slate-400 text-sm mt-4 italic;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============ 重播按钮 ============ */
.replay-button {
  @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-full;
  @apply text-sm text-slate-500 font-medium;
  @apply transition-all duration-300;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  animation: fadeInUp 0.5s ease-out;
}

.replay-button:hover {
  @apply text-blue-600 border-blue-200;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.replay-button:active {
  transform: translateY(0);
}

.replay-icon {
  @apply w-4 h-4;
}
</style>
