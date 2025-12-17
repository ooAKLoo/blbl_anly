<template>
  <header class="hero-header" ref="heroRef">
    <!-- 梦幻背景装饰 -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
      <div class="sparkle sparkle-1"></div>
      <div class="sparkle sparkle-2"></div>
      <div class="sparkle sparkle-3"></div>

    </div>

    <!-- 主内容区：左右分栏 -->
    <div class="hero-container" :class="{ 'is-visible': isVisible }">
      <!-- 左侧：核心信息 -->
      <div class="hero-left">
        <!-- UP主名称 + 标签 -->
        <div class="hero-intro animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0s">
          <span class="intro-label">成长历程</span>
          <h1 class="hero-title">
            <span class="title-name">{{ upName }}</span>
            <span class="title-suffix">的创作故事</span>
          </h1>
        </div>

        <!-- 核心数字：天数 -->
        <div class="hero-days animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0.15s">
          <div class="days-number">
            <CountUp :end="totalDays" :duration="2500" :start-on-visible="isVisible" />
          </div>
          <div class="days-label">
            <span class="label-text">天的坚持</span>
            <span class="label-date">始于 {{ journeyStart }}</span>
          </div>
        </div>

        <!-- 情感叙事 -->
        <div class="hero-narrative animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0.3s">
          <p v-if="firstVideoPlays < 10000" class="narrative-text">
            从 <span class="highlight">{{ formatNumber(firstVideoPlays) }}</span> 次播放开始，一步步走到今天
          </p>
          <p v-else class="narrative-text">
            出道即巅峰，首个视频就收获 <span class="highlight">{{ formatNumber(firstVideoPlays) }}</span> 次播放
          </p>
        </div>

        <!-- 成长数据卡片 -->
        <div class="hero-stats">
          <div class="stat-card stat-primary animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0.45s">
            <div class="stat-value">
              <CountUp :end="totalPlays" :duration="3000" :start-on-visible="isVisible" :format-fn="formatNumber" />
            </div>
            <div class="stat-label">累计播放</div>
          </div>
          <div class="stat-card animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0.55s">
            <div class="stat-value">
              <CountUp :end="videoCount" :duration="2000" :start-on-visible="isVisible" />
            </div>
            <div class="stat-label">个作品</div>
          </div>
          <div class="stat-card animate-item" :class="{ 'is-visible': isVisible }" style="--item-delay: 0.65s">
            <div class="stat-value">
              <CountUp :end="growthMultiple" :duration="2000" :decimals="0" :start-on-visible="isVisible" />
              <span class="stat-suffix">x</span>
            </div>
            <div class="stat-label">播放增长</div>
          </div>
        </div>
      </div>

      <!-- 右侧：头像 + 环绕标签 -->
      <div class="hero-right">
        <div class="avatar-orbit" :class="{ 'is-visible': isVisible }">
          <!-- 中心头像 -->
          <div class="avatar-center">
            <img
              v-if="upFace"
              :src="getImageUrl(upFace)"
              class="avatar-img"
              referrerpolicy="no-referrer"
              alt=""
            />
            <div v-else class="avatar-placeholder">
              {{ upName.charAt(0) }}
            </div>
          </div>

          <!-- 环绕标签 -->
          <div class="orbit-tags">
            <span
              v-for="(tag, index) in creatorTags"
              :key="tag.text"
              class="orbit-tag"
              :class="[`tag-type-${tag.type}`, { 'is-visible': isVisible }]"
              :style="getOrbitTagStyle(index, creatorTags.length)"
            >
              {{ tag.text }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div class="hero-scroll-hint" :class="{ 'is-visible': isVisible }">
      <span>向下探索 TA 的故事</span>
      <div class="scroll-arrow">
        <ChevronDown :size="20" />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, h, defineComponent, watch, onMounted, onUnmounted, computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { formatNumber, getImageUrl } from '../../../utils';

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
  upName: { type: String, default: 'UP主' },
  upFace: { type: String, default: '' },
  totalDays: { type: Number, default: 0 },
  journeyStart: { type: String, default: '' },
  videoCount: { type: Number, default: 0 },
  firstVideoPlays: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  growthMultiple: { type: Number, default: 1 },
  creatorTags: { type: Array, default: () => [] }
});

const emit = defineEmits(['visible']);

const heroRef = ref(null);
const isVisible = ref(false);
let observer = null;

// 环绕标签样式生成：支持3-5个标签的动态布局
function getOrbitTagStyle(index, total) {
  // 根据标签数量动态调整布局
  // 核心原则：均匀分布，避免重叠，第一个标签在上方
  let positions;

  if (total <= 3) {
    // 3个标签：倒三角布局
    positions = [
      { angle: -90, radius: 115 },   // 顶部
      { angle: 150, radius: 125 },   // 左下
      { angle: 30, radius: 125 },    // 右下
    ];
  } else if (total === 4) {
    // 4个标签：菱形布局
    positions = [
      { angle: -90, radius: 115 },   // 顶部
      { angle: 0, radius: 130 },     // 右侧
      { angle: 180, radius: 130 },   // 左侧
      { angle: 90, radius: 120 },    // 底部
    ];
  } else {
    // 5个标签：五边形布局
    positions = [
      { angle: -90, radius: 115 },   // 顶部（最重要的标签）
      { angle: -18, radius: 130 },   // 右上
      { angle: 54, radius: 130 },    // 右下
      { angle: 126, radius: 130 },   // 左下
      { angle: 198, radius: 130 },   // 左上
    ];
  }

  const pos = positions[index] || { angle: -90 + index * (360 / total), radius: 125 };
  const angleRad = (pos.angle * Math.PI) / 180;

  const x = Math.cos(angleRad) * pos.radius;
  const y = Math.sin(angleRad) * pos.radius;

  // 入场延迟：头像先显示，标签依次快速出现
  const baseDelay = 0.4;
  const staggerDelay = 0.08;
  const delay = baseDelay + index * staggerDelay;

  return {
    '--orbit-x': `${x}px`,
    '--orbit-y': `${y}px`,
    '--enter-delay': `${delay}s`
  };
}

function setupObserver() {
  if (!heroRef.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          emit('visible');
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(heroRef.value);
}

onMounted(() => {
  setupObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

// 暴露重置方法
function reset() {
  isVisible.value = false;
}

defineExpose({ reset, setupObserver });
</script>

<style scoped>
/* ============ 设计系统变量 ============ */
.hero-header {
  --text-primary: #1e1b4b;
  --text-secondary: #4c4678;
  --text-tertiary: #8b85ad;
  --accent: #6366f1;
  --border-color: rgba(99, 102, 241, 0.15);

  @apply relative min-h-screen flex flex-col items-center justify-center overflow-hidden;
  background: linear-gradient(
    135deg,
    #faf5ff 0%,
    #f0f9ff 25%,
    #fdf4ff 50%,
    #eff6ff 75%,
    #faf5ff 100%
  );
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ============ 梦幻背景装饰 ============ */
.bg-decoration {
  @apply absolute inset-0 overflow-hidden;
  z-index: 0;
  pointer-events: none;
}

/* 漂浮光斑 */
.blob {
  @apply absolute rounded-full;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%);
  top: -10%;
  left: -5%;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #fbcfe8 0%, #fce7f3 100%);
  top: 20%;
  right: -10%;
  animation-delay: -5s;
  animation-duration: 25s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #bae6fd 0%, #e0f2fe 100%);
  bottom: -5%;
  left: 30%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.blob-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #d9f99d 0%, #ecfccb 100%);
  bottom: 20%;
  right: 20%;
  animation-delay: -15s;
  animation-duration: 28s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(30px, -30px) rotate(5deg) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) rotate(-5deg) scale(0.95);
  }
  75% {
    transform: translate(10px, 10px) rotate(3deg) scale(1.02);
  }
}

/* 闪烁星星 */
.sparkle {
  @apply absolute rounded-full;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%);
  animation: sparkle 3s ease-in-out infinite;
}

.sparkle-1 {
  width: 6px;
  height: 6px;
  top: 15%;
  left: 20%;
  animation-delay: 0s;
}

.sparkle-2 {
  width: 8px;
  height: 8px;
  top: 40%;
  right: 15%;
  animation-delay: 1s;
}

.sparkle-3 {
  width: 5px;
  height: 5px;
  bottom: 30%;
  left: 40%;
  animation-delay: 2s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============ 主内容区 ============ */
.hero-container {
  @apply relative z-10 w-full max-w-6xl mx-auto px-8 flex items-center gap-16;
}

.hero-container.is-visible {
  /* 容器不再需要整体动画，由子元素分别控制 */
}

/* ============ 左侧内容 ============ */
.hero-left {
  @apply flex-1 space-y-8;
}

/* 左侧元素渐进入场动画 */
.animate-item {
  opacity: 0;
  transform: translateX(-30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--item-delay, 0s);
}

.animate-item.is-visible {
  opacity: 1;
  transform: translateX(0);
}

.hero-intro {
  @apply space-y-3;
}

.intro-label {
  @apply inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-full;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-tertiary);
  letter-spacing: 0.1em;
}

.hero-title {
  @apply text-4xl md:text-5xl font-bold leading-tight tracking-tight;
  color: var(--text-primary);
}

.title-name {
  color: var(--text-primary);
}

.title-suffix {
  @apply block mt-1 font-normal;
  color: var(--text-secondary);
  font-size: 0.65em;
}

/* 天数区域 */
.hero-days {
  @apply flex items-end gap-4;
}

.days-number {
  @apply text-7xl md:text-8xl font-black tabular-nums tracking-tighter;
  color: var(--text-primary);
  line-height: 0.9;
}

.days-label {
  @apply flex flex-col pb-3;
}

.label-text {
  @apply text-lg font-medium;
  color: var(--text-primary);
}

.label-date {
  @apply text-sm;
  color: var(--text-tertiary);
}

/* 叙事文案 */
.hero-narrative {
  @apply py-4 pl-5 border-l-2;
  border-color: var(--accent);
}

.narrative-text {
  @apply text-base leading-relaxed;
  color: var(--text-secondary);
}

.narrative-text .highlight {
  @apply font-semibold;
  color: var(--text-primary);
}

/* 数据统计卡片 */
.hero-stats {
  @apply flex gap-3;
}

.stat-card {
  @apply flex-1 p-4 rounded-xl text-center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}

.stat-card.stat-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.3);
}

.stat-card.stat-primary .stat-value,
.stat-card.stat-primary .stat-label {
  color: #fff;
}

.stat-value {
  @apply text-2xl font-bold tabular-nums tracking-tight;
  color: var(--text-primary);
}

.stat-suffix {
  @apply text-base font-medium;
  color: var(--text-tertiary);
}

.stat-label {
  @apply text-xs mt-1 uppercase tracking-wider;
  color: var(--text-tertiary);
}

/* ============ 右侧：头像 + 环绕标签 ============ */
.hero-right {
  @apply relative flex-1 flex items-center justify-center min-h-[400px];
  margin-right: -120px;
}

/* 头像轨道容器 */
.avatar-orbit {
  @apply relative;
  width: 320px;
  height: 320px;
}

/* 中心头像 */
.avatar-center {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
  z-index: 10;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-orbit.is-visible .avatar-center {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.avatar-img {
  @apply w-28 h-28 rounded-full object-cover;
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.8),
    0 0 0 6px rgba(99, 102, 241, 0.2),
    0 20px 40px rgba(99, 102, 241, 0.2);
}

.avatar-placeholder {
  @apply w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.8),
    0 0 0 6px rgba(99, 102, 241, 0.2),
    0 20px 40px rgba(99, 102, 241, 0.2);
}

/* 环绕标签容器 */
.orbit-tags {
  @apply absolute inset-0;
}

/* 环绕标签 */
.orbit-tag {
  @apply absolute px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap;
  top: 50%;
  left: 50%;
  background: #fff;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  /* 初始状态：更柔和的起始位置 */
  transform: translate(-50%, -50%) scale(0.95);
  opacity: 0;
}

.orbit-tag.is-visible {
  animation: tag-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--enter-delay, 0s);
}

/* 柔和渐显动画 - 减少弹跳感 */
@keyframes tag-fade-in {
  0% {
    transform: translate(
      calc(-50% + var(--orbit-x, 0px) * 0.7),
      calc(-50% + var(--orbit-y, 0px) * 0.7)
    ) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translate(
      calc(-50% + var(--orbit-x, 0px)),
      calc(-50% + var(--orbit-y, 0px))
    ) scale(1);
    opacity: 1;
  }
}

/* 所有标签统一白色风格 */

/* hover 效果 */
.orbit-tag:hover {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

/* ============ 滚动提示 ============ */
.hero-scroll-hint {
  @apply absolute bottom-10 flex flex-col items-center gap-2 text-sm;
  color: var(--text-tertiary);
  opacity: 0;
  transform: translateY(20px);
  transition: all 1s ease 1.2s;
}

.hero-scroll-hint.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-scroll-hint span {
  letter-spacing: 0.05em;
}

.scroll-arrow {
  animation: scroll-bounce 2s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .hero-container {
    @apply flex-col gap-10 py-16 px-6;
  }

  .hero-title {
    @apply text-3xl;
  }

  .days-number {
    @apply text-6xl;
  }

  .hero-right {
    @apply min-h-[260px] w-full;
  }

  .avatar-orbit {
    width: 240px;
    height: 240px;
  }

  .avatar-img,
  .avatar-placeholder {
    @apply w-20 h-20 text-2xl;
  }

  .orbit-tag {
    @apply px-2.5 py-1 text-xs;
  }

  .hero-stats {
    @apply flex-wrap gap-2;
  }

  .stat-card {
    @apply min-w-[90px] p-3;
  }

  .stat-value {
    @apply text-xl;
  }
}

/* ============ 通用 ============ */
.count-up {
  @apply tabular-nums;
}
</style>
