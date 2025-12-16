<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="max-w-[1400px] mx-auto px-6">
      <!-- Unified Sticky Header -->
      <header v-if="upInfo" class="sticky top-0 z-40 bg-neutral-50 pt-4 pb-2">
        <!-- UP Info Row -->
        <div class="flex items-center gap-4 mb-3">
          <img :src="upFaceUrl" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" />
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base font-semibold text-neutral-900 truncate">{{ upInfo.name }}</h1>
              <span class="text-xs text-neutral-400">Lv.{{ upInfo.level }}</span>
              <span class="text-neutral-200">·</span>
              <span class="text-xs text-neutral-400">{{ videos.length }} 个视频</span>
            </div>
            <p class="text-xs text-neutral-400 truncate mt-0.5">{{ upInfo.sign || '这个人很懒，什么都没写' }}</p>
          </div>
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
          :analysis-videos="analysisVideos"
          :all-videos="videos"
          :time-range="selectedTimeRange"
          :duration="selectedDuration"
          :time-range-options="timeRangeOptions"
          :duration-options="durationOptions"
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
import { ref, computed } from 'vue';
import { getImageUrl, parseDurationMinutes } from '../utils';

// Sub-components
import DataAnalysis from './up-detail/DataAnalysis.vue';
import VideoList from './up-detail/VideoList.vue';
import InsightReport from './up-detail/InsightReport.vue';
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

// 数据分析筛选
const selectedTimeRange = ref('all');
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

const selectedDuration = ref('all');
const durationOptions = [
  { value: 'all', label: '全部时长' },
  { value: 'short', label: '<5分钟' },
  { value: 'medium', label: '5-20分钟' },
  { value: 'long', label: '>20分钟' }
];

// 图表交互状态（Drawer）
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerVideos = ref([]);

// UP 头像 URL
const upFaceUrl = computed(() => {
  if (!props.upInfo) return '';
  return getImageUrl(props.upInfo.face);
});

// Computed - 数据分析筛选后的视频
const analysisVideos = computed(() => {
  let result = props.videos;

  // 时间范围筛选
  if (selectedTimeRange.value !== 'all') {
    const now = new Date();
    let startDate;

    switch (selectedTimeRange.value) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    if (startDate) {
      result = result.filter(v => new Date(v.publish_time) >= startDate);
    }
  }

  // 时长筛选
  if (selectedDuration.value !== 'all') {
    result = result.filter(v => {
      const minutes = parseDurationMinutes(v.duration);
      switch (selectedDuration.value) {
        case 'short':
          return minutes < 5;
        case 'medium':
          return minutes >= 5 && minutes <= 20;
        case 'long':
          return minutes > 20;
        default:
          return true;
      }
    });
  }

  return result;
});

// Drawer 操作函数
function openDrawer({ title, videos }) {
  drawerTitle.value = title;
  drawerVideos.value = videos;
  drawerVisible.value = true;
}
</script>

<style scoped>
.section-title {
  @apply flex items-center gap-2 text-sm font-medium text-neutral-600 mb-3;
}
</style>
