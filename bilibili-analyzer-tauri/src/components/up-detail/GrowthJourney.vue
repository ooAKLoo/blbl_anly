<template>
  <div class="story-container" ref="containerRef">
    <!-- Hero Header - 英雄时刻 -->
    <HeroSection
      ref="heroRef"
      :up-name="upName"
      :total-days="totalDays"
      :journey-start="journeyStart"
      :video-count="videos.length"
      :first-video-plays="firstVideoPlays"
      :total-plays="totalPlays"
      :growth-multiple="growthMultipleNum"
      @visible="onHeroVisible"
    />

    <!-- Story Stream - 故事流（时间轴） -->
    <StoryTimeline
      ref="timelineRef"
      :videos="videos"
      :up-name="upName"
      :total-days="totalDays"
      :video-count="videos.length"
      :growth-multiple="growthMultipleNum"
    />

    <!-- 结尾 - 数据总结 -->
    <div class="ending-wrapper">
      <EndingSection
        ref="endingRef"
        :up-name="upName"
        :total-days="totalDays"
        :first-video-plays="firstVideoPlays"
        :total-plays="totalPlays"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import HeroSection from './growth-journey/HeroSection.vue';
import StoryTimeline from './growth-journey/StoryTimeline.vue';
import EndingSection from './growth-journey/EndingSection.vue';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: 'UP主' },
  isActive: { type: Boolean, default: false }
});

// ============ Refs ============
const containerRef = ref(null);
const heroRef = ref(null);
const timelineRef = ref(null);
const endingRef = ref(null);

// ============ 基础计算属性 ============
const sortedVideos = computed(() => {
  return [...props.videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
});

const journeyStart = computed(() => {
  if (sortedVideos.value.length === 0) return '';
  const date = new Date(sortedVideos.value[0].publish_time);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

const totalDays = computed(() => {
  if (sortedVideos.value.length < 2) return 0;
  const first = new Date(sortedVideos.value[0].publish_time);
  const last = new Date(sortedVideos.value[sortedVideos.value.length - 1].publish_time);
  return Math.ceil((last - first) / (1000 * 60 * 60 * 24));
});

const totalPlays = computed(() => {
  return props.videos.reduce((sum, v) => sum + v.play_count, 0);
});

const firstVideoPlays = computed(() => {
  if (sortedVideos.value.length === 0) return 0;
  return sortedVideos.value[0].play_count;
});

const growthMultiple = computed(() => {
  if (sortedVideos.value.length < 10) return '1.0';
  const first10 = sortedVideos.value.slice(0, 10);
  const last10 = sortedVideos.value.slice(-10);
  const firstAvg = first10.reduce((s, v) => s + v.play_count, 0) / 10;
  const lastAvg = last10.reduce((s, v) => s + v.play_count, 0) / 10;
  if (firstAvg === 0) return lastAvg > 0 ? '99' : '1.0';
  return (lastAvg / firstAvg).toFixed(1);
});

const growthMultipleNum = computed(() => {
  return parseFloat(growthMultiple.value) || 1;
});

// ============ 事件处理 ============
function onHeroVisible() {
  // Hero 区域可见时的处理（如果需要）
}

// ============ 初始化和重置 ============
function initAll() {
  nextTick(() => {
    setTimeout(() => {
      // 初始化 Hero
      if (heroRef.value) {
        heroRef.value.setupObserver();
      }
      // 初始化 Timeline
      if (timelineRef.value) {
        timelineRef.value.init();
      }
      // 初始化 Ending
      if (endingRef.value) {
        endingRef.value.setupObserver();
      }
    }, 100);
  });
}

function resetAll() {
  if (heroRef.value) {
    heroRef.value.reset();
  }
  if (timelineRef.value) {
    timelineRef.value.reset();
  }
  if (endingRef.value) {
    endingRef.value.reset();
  }
}

// ============ 生命周期 ============
watch(() => props.isActive, (active) => {
  if (active && props.videos.length > 0) {
    resetAll();
    initAll();
  }
}, { immediate: true });

watch(() => props.videos, () => {
  if (props.isActive && props.videos.length > 0) {
    resetAll();
    nextTick(() => {
      initAll();
    });
  }
}, { deep: true });

onMounted(() => {
  if (props.isActive && props.videos.length > 0) {
    initAll();
  }
});

onUnmounted(() => {
  // 子组件会自行清理
});
</script>

<style scoped>
/* ============ 基础容器 ============ */
.story-container {
  @apply min-h-screen pb-20;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.ending-wrapper {
  @apply max-w-4xl mx-auto px-4 sm:px-6;
}
</style>
