<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="max-w-[1400px] mx-auto px-6">
      <!-- Unified Sticky Header -->
      <header v-if="upInfo" class="sticky top-0 z-40 bg-neutral-50 pt-4 pb-2">
        <!-- UP Info Row -->
        <div class="flex items-center gap-4 mb-3">
          <img :src="getImageUrl(upInfo.face)" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h1 class="text-base font-semibold text-neutral-900 truncate">{{ upInfo.name }}</h1>
              <span class="text-xs text-neutral-400">Lv.{{ upInfo.level }}</span>
              <span class="text-neutral-200">·</span>
              <span class="text-xs text-neutral-400">{{ videos.length }} 个视频</span>
            </div>
            <p class="text-xs text-neutral-400 truncate mt-0.5">{{ upInfo.sign || '这个人很懒，什么都没写' }}</p>
          </div>
          <!-- 成长历程入口按钮 -->
          <button
            @click="showGrowthJourney = true"
            class="growth-entry-btn group"
          >
            <span class="growth-entry-icon">
              <Sparkles :size="12" />
            </span>
            <span class="growth-entry-text">成长历程</span>
            <ChevronRight :size="14" class="text-neutral-300 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        <!-- Tab Navigation -->
        <nav class="flex items-center gap-6 border-b border-neutral-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'relative py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full"
            ></span>
          </button>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="py-6">
        <!-- Tab Content: 数据分析 -->
        <DataAnalysis
          v-show="activeTab === 'analysis'"
          :analysis-videos="filteredVideos"
          :all-videos="videos"
          :time-range="selectedTimeRange"
          :duration="selectedDuration"
          @update:time-range="selectedTimeRange = $event"
          @update:duration="selectedDuration = $event"
          @open-drawer="openDrawer"
        />

        <!-- Tab Content: 视频列表 -->
        <VideoList
          v-show="activeTab === 'videos'"
          :videos="videos"
        />

        <!-- Tab Content: 洞察报告 -->
        <InsightReport
          v-show="activeTab === 'text-analysis'"
          :videos="videos"
          :up-name="upInfo?.name"
          :time-range="selectedTimeRange"
          :duration="selectedDuration"
          @update:time-range="selectedTimeRange = $event"
          @update:duration="selectedDuration = $event"
        />
      </main>

      <!-- 成长历程全屏覆盖层 -->
      <Transition name="growth-journey">
        <div v-if="showGrowthJourney" class="growth-journey-overlay">
          <!-- 关闭按钮 - 低调悬浮 -->
          <button
            @click="showGrowthJourney = false"
            class="growth-close-btn"
            title="关闭"
          >
            <X :size="18" strokeWidth="1.5" />
          </button>
          <GrowthJourney
            :videos="videos"
            :up-name="upInfo?.name"
            :is-active="showGrowthJourney"
          />
        </div>
      </Transition>

      <!-- Video Detail Drawer -->
      <VideoDetailDrawer
        v-model:visible="drawerVisible"
        :title="drawerTitle"
        :videos="drawerVideos"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, toRef } from 'vue';
import { getImageUrl } from '../utils';
import { useVideoFilter } from '../composables/useVideoFilter';
import { Sparkles, X, ChevronRight } from 'lucide-vue-next';

// Sub-components
import DataAnalysis from './up-detail/DataAnalysis.vue';
import VideoList from './up-detail/VideoList.vue';
import InsightReport from './up-detail/InsightReport.vue';
import GrowthJourney from './up-detail/GrowthJourney.vue';
import VideoDetailDrawer from './VideoDetailDrawer.vue';

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

// Tab state
const activeTab = ref('analysis');
const tabs = [
  { id: 'analysis', label: '数据分析' },
  { id: 'videos', label: '视频列表' },
  { id: 'text-analysis', label: '洞察报告' }
];

// 成长历程显示状态
const showGrowthJourney = ref(false);

// 使用筛选 composable
const {
  selectedTimeRange,
  selectedDuration,
  filteredVideos
} = useVideoFilter(toRef(props, 'videos'));

// 图表交互状态（Drawer）
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerVideos = ref([]);

// Drawer 操作函数
function openDrawer({ title, videos }) {
  drawerTitle.value = title;
  drawerVideos.value = videos;
  drawerVisible.value = true;
}
</script>

<style scoped>
/* ============ 成长历程入口按钮 ============ */
.growth-entry-btn {
  @apply flex items-center gap-2 px-3 py-1.5 transition-all duration-300;
}

.growth-entry-icon {
  @apply flex items-center justify-center w-5 h-5 rounded-md;
  @apply bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500;
}

.growth-entry-text {
  @apply text-xs font-medium text-neutral-500 group-hover:text-neutral-700 transition-colors;
}

/* ============ 成长历程全屏覆盖层 ============ */
.growth-journey-overlay {
  @apply fixed inset-0 z-50 bg-white overflow-y-auto;
}

/* 关闭按钮 - 极简低调设计 */
.growth-close-btn {
  @apply fixed top-6 right-6 z-[60];
  @apply w-9 h-9 flex items-center justify-center;
  @apply text-neutral-300 hover:text-neutral-500;
  @apply rounded-full transition-all duration-300;
  @apply hover:bg-neutral-100/80;
  /* 默认几乎透明，悬停时显现 */
  opacity: 0.6;
}

.growth-close-btn:hover {
  opacity: 1;
}

/* 进入/离开动画 */
.growth-journey-enter-active {
  animation: growth-journey-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.growth-journey-leave-active {
  animation: growth-journey-out 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes growth-journey-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes growth-journey-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
