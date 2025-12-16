<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="max-w-[1400px] mx-auto px-6">
      <!-- Unified Sticky Header -->
      <header v-if="upInfo" class="sticky top-0 z-40 bg-neutral-50 pt-4 pb-2">
        <!-- UP Info Row -->
        <div class="flex items-center gap-4 mb-3">
          <img :src="getImageUrl(upInfo.face)" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" />
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

        <!-- Tab Content: 成长历程 -->
        <GrowthJourney
          v-show="activeTab === 'growth'"
          :videos="videos"
          :up-name="upInfo?.name"
          :is-active="activeTab === 'growth'"
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
import { ref, toRef } from 'vue';
import { getImageUrl } from '../utils';
import { useVideoFilter } from '../composables/useVideoFilter';

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
  { id: 'text-analysis', label: '洞察报告' },
  { id: 'growth', label: '成长历程' }
];

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
