<template>
  <div class="story-container" ref="containerRef">
    <!-- Hero Header - 英雄时刻 -->
    <HeroSection
      ref="heroRef"
      :up-name="upName"
      :up-face="upFace"
      :total-days="totalDays"
      :journey-start="journeyStart"
      :video-count="videos.length"
      :first-video-plays="firstVideoPlays"
      :total-plays="totalPlays"
      :growth-multiple="growthMultiple"
      :creator-tags="creatorTags"
      @visible="onHeroVisible"
    />

    <!-- Story Stream - 故事流（时间轴） -->
    <StoryTimeline
      ref="timelineRef"
      :videos="videos"
      :up-name="upName"
      :total-days="totalDays"
      :video-count="videos.length"
      :growth-multiple="growthMultiple"
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
import { ref, toRef, watch, nextTick, onMounted, onUnmounted } from 'vue';
import HeroSection from './growth-journey/HeroSection.vue';
import StoryTimeline from './growth-journey/StoryTimeline.vue';
import EndingSection from './growth-journey/EndingSection.vue';
import { useGrowthMetrics } from '../../composables/useGrowthMetrics';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: 'UP主' },
  upFace: { type: String, default: '' },
  isActive: { type: Boolean, default: false }
});

// ============ Refs ============
const containerRef = ref(null);
const heroRef = ref(null);
const timelineRef = ref(null);
const endingRef = ref(null);

// ============ 使用 composable 获取计算数据 ============
const videosRef = toRef(props, 'videos');
const {
  sortedVideos,
  journeyStart,
  totalDays,
  totalPlays,
  firstVideoPlays,
  growthMultiple,
  creatorTags
} = useGrowthMetrics(videosRef);

// ============ 事件处理 ============
function onHeroVisible() {
  // Hero 区域可见时的处理（如果需要）
}

// ============ 初始化和重置 ============
function initAll() {
  nextTick(() => {
    setTimeout(() => {
      if (heroRef.value) {
        heroRef.value.setupObserver();
      }
      if (timelineRef.value) {
        timelineRef.value.init();
      }
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
