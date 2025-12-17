<template>
  <header class="hero-header" ref="heroRef">
    <div class="hero-bg"></div>
    <div class="hero-particles">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <div class="hero-content" :class="{ 'is-visible': isVisible }">
      <div class="hero-badge">
        <Sparkles :size="14" />
        <span>{{ upName }} 的创作历程</span>
      </div>

      <h1 class="hero-title">
        <span class="hero-number text-blue-600">
          <CountUp :end="totalDays" :duration="2000" :start-on-visible="isVisible" />
        </span> 天前<br />
        {{ upName }} 发布了第一个视频
      </h1>

      <p class="hero-subtitle">
        从 {{ journeyStart }} 到现在，{{ videoCount }} 个作品，<br/>
        从 {{ formatNumber(firstVideoPlays) }} 播放到累计 {{ formatNumber(totalPlays) }} 播放。
      </p>

      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-value">
            <CountUp :end="videoCount" :duration="2000" :start-on-visible="isVisible" />
          </div>
          <div class="hero-stat-label">个作品</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">
            <CountUp :end="totalPlays" :duration="2500" :start-on-visible="isVisible" suffix="" :format-fn="formatNumber" />
          </div>
          <div class="hero-stat-label">次播放</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">
            <CountUp :end="growthMultiple" :duration="2000" :decimals="1" :start-on-visible="isVisible" suffix="x" />
          </div>
          <div class="hero-stat-label">播放增长</div>
        </div>
      </div>
    </div>

    <div class="hero-scroll-hint" :class="{ 'is-visible': isVisible }">
      <span>向下滚动</span>
      <ChevronDown :size="20" />
    </div>
  </header>
</template>

<script setup>
import { ref, h, defineComponent, watch, onMounted, onUnmounted } from 'vue';
import { Sparkles, ChevronDown } from 'lucide-vue-next';
import { formatNumber } from '../../../utils';

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
  totalDays: { type: Number, default: 0 },
  journeyStart: { type: String, default: '' },
  videoCount: { type: Number, default: 0 },
  firstVideoPlays: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  growthMultiple: { type: Number, default: 1 }
});

const emit = defineEmits(['visible']);

const heroRef = ref(null);
const isVisible = ref(false);
let observer = null;

function getParticleStyle(index) {
  const size = 2 + Math.random() * 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 5;
  const duration = 10 + Math.random() * 10;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
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
.hero-header {
  @apply relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden;
}

.hero-bg {
  @apply absolute inset-0 pointer-events-none;
  background: radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
}

.hero-particles {
  @apply absolute inset-0 overflow-hidden pointer-events-none;
}

.particle {
  @apply absolute rounded-full opacity-30;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  bottom: -10px;
  animation: float-up linear infinite;
}

@keyframes float-up {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

.hero-content {
  @apply relative z-10 space-y-6 max-w-2xl mx-auto;
  opacity: 0;
  transform: translateY(40px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-badge {
  @apply inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  color: #3b82f6;
}

.hero-title {
  @apply text-4xl md:text-5xl font-bold text-slate-800 tracking-tight leading-tight;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

.hero-number {
  @apply inline-block tabular-nums;
}

.hero-subtitle {
  @apply text-slate-500 leading-relaxed text-base;
}

.hero-stats {
  @apply grid grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-100;
}

.hero-stat {
  @apply text-center;
}

.hero-stat-value {
  @apply text-2xl md:text-3xl font-bold text-slate-900 tabular-nums;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

.hero-stat-label {
  @apply text-xs text-slate-400 mt-1;
}

.hero-scroll-hint {
  @apply absolute bottom-8 flex flex-col items-center gap-1 text-slate-400 text-xs;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease 0.5s;
}

.hero-scroll-hint.is-visible {
  opacity: 1;
  transform: translateY(0);
  animation: bounce 2s ease-in-out infinite 1s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.count-up {
  @apply tabular-nums;
}
</style>
