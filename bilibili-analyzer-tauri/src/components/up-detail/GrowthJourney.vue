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
      :growth-multiple="growthMultipleNum"
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
  upFace: { type: String, default: '' },
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

// ============ 个性化标签计算 ============
const creatorTags = computed(() => {
  const videos = sortedVideos.value;
  if (videos.length === 0) return [];

  const tags = [];

  // 1. 更新频率标签
  const days = totalDays.value || 1;
  const avgDaysPerVideo = days / videos.length;
  if (avgDaysPerVideo <= 1) {
    tags.push({ text: '日更战士', type: 'frequency' });
  } else if (avgDaysPerVideo <= 7) {
    tags.push({ text: '周更达人', type: 'frequency' });
  } else if (avgDaysPerVideo <= 30) {
    tags.push({ text: '月更选手', type: 'frequency' });
  } else {
    tags.push({ text: '精品路线', type: 'frequency' });
  }

  // 2. 创作时段标签
  const hourCounts = new Array(24).fill(0);
  videos.forEach(v => {
    const hour = new Date(v.publish_time).getHours();
    hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  if (peakHour >= 0 && peakHour < 6) {
    tags.push({ text: '深夜创作者', type: 'time' });
  } else if (peakHour >= 6 && peakHour < 12) {
    tags.push({ text: '早起型选手', type: 'time' });
  } else if (peakHour >= 18 || peakHour < 22) {
    tags.push({ text: '黄金时段', type: 'time' });
  }

  // 3. 周末创作者检测
  const weekendCount = videos.filter(v => {
    const day = new Date(v.publish_time).getDay();
    return day === 0 || day === 6;
  }).length;
  if (weekendCount / videos.length > 0.5) {
    tags.push({ text: '周末战士', type: 'time' });
  }

  // 4. 互动特征标签
  const totalDanmu = videos.reduce((sum, v) => sum + (v.danmu_count || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0);
  const avgDanmuRate = totalDanmu / (totalPlays.value || 1);
  const avgCommentRate = totalComments / (totalPlays.value || 1);

  if (avgDanmuRate > 0.01) { // 弹幕率 > 1%
    tags.push({ text: '弹幕收割机', type: 'engagement' });
  }
  if (avgCommentRate > 0.005) { // 评论率 > 0.5%
    tags.push({ text: '评论区热闹', type: 'engagement' });
  }

  // 5. 收藏特征标签
  const totalFavorites = videos.reduce((sum, v) => sum + (v.favorite_count || 0), 0);
  const avgFavoriteRate = totalFavorites / (totalPlays.value || 1);
  if (avgFavoriteRate > 0.03) { // 收藏率 > 3%
    tags.push({ text: '收藏夹常客', type: 'quality' });
  }

  // 6. 成长曲线标签
  const multiple = growthMultipleNum.value;
  if (multiple >= 10) {
    tags.push({ text: '爆发式成长', type: 'growth' });
  } else if (multiple >= 3) {
    tags.push({ text: '稳步上升', type: 'growth' });
  } else if (multiple >= 1.5) {
    tags.push({ text: '持续进步', type: 'growth' });
  }

  // 7. 坚持程度标签
  if (days >= 1000) {
    tags.push({ text: '千日坚持', type: 'persistence' });
  } else if (days >= 365) {
    tags.push({ text: '年更老兵', type: 'persistence' });
  }

  if (videos.length >= 100) {
    tags.push({ text: '百视频创作者', type: 'milestone' });
  } else if (videos.length >= 50) {
    tags.push({ text: '五十视频达成', type: 'milestone' });
  }

  // 8. 高产标签
  if (videos.length >= 200 && avgDaysPerVideo <= 7) {
    tags.push({ text: '高产创作者', type: 'productivity' });
  }

  // 返回前5个最有代表性的标签
  return tags.slice(0, 5);
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
