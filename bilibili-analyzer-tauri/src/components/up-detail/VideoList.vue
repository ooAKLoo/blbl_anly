<template>
  <div class="space-y-4">
    <!-- Search & Filter Bar -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- 搜索框 -->
      <div class="flex items-center gap-2 flex-1 min-w-[240px] max-w-md px-3 py-2 bg-white rounded-lg">
        <Search :size="16" class="text-neutral-400" />
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索视频标题..."
          class="flex-1 bg-transparent border-0 outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
        />
        <button v-if="searchKeyword" @click="searchKeyword = ''" class="text-neutral-400 hover:text-neutral-600">
          <X :size="14" />
        </button>
      </div>

      <!-- 排序下拉 -->
      <div class="relative" ref="sortDropdownRef">
        <button
          @click="sortDropdownOpen = !sortDropdownOpen"
          class="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg text-sm text-neutral-600 transition-colors"
        >
          <ArrowUpDown :size="14" />
          {{ sortOptions.find(o => o.value === sortBy)?.label }}
          <ChevronDown :size="14" :class="sortDropdownOpen ? 'rotate-180' : ''" class="transition-transform" />
        </button>
        <Transition name="dropdown">
          <div v-if="sortDropdownOpen" class="absolute top-full mt-1 right-0 w-44 p-1.5 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              @click="selectSort(option.value)"
              :class="[
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                sortBy === option.value
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              ]"
            >
              <component :is="option.icon" :size="14" />
              {{ option.label }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- View Mode Toggle -->
      <div class="flex items-center p-1 bg-white rounded-lg">
        <button
          @click="viewMode = 'grid'"
          :class="[
            'p-1.5 rounded-md transition-all duration-150',
            viewMode === 'grid'
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600'
          ]"
          title="网格视图"
        >
          <LayoutGrid :size="16" />
        </button>
        <button
          @click="viewMode = 'list'"
          :class="[
            'p-1.5 rounded-md transition-all duration-150',
            viewMode === 'list'
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600'
          ]"
          title="列表视图"
        >
          <List :size="16" />
        </button>
      </div>

      <span class="text-xs text-neutral-400 ml-auto">
        {{ filteredVideos.length }} / {{ videos.length }} 个视频
      </span>
    </div>

    <!-- Search Stats -->
    <div v-if="searchKeyword && filteredVideos.length > 0" class="flex items-center gap-6 px-4 py-3 bg-blue-50/50 rounded-xl text-sm">
      <span class="text-neutral-600">关键词 "<strong class="text-blue-600">{{ searchKeyword }}</strong>"</span>
      <span class="text-neutral-500">平均播放 <strong class="text-blue-600">{{ formatNumber(filteredAvgPlays) }}</strong></span>
      <span class="text-neutral-500">互动率 <strong class="text-blue-600">{{ filteredEngagementRate }}%</strong></span>
    </div>

    <!-- Video Grid View (Virtual Scroll) -->
    <VirtualGrid
      v-if="viewMode === 'grid'"
      ref="virtualGridRef"
      :items="filteredVideos"
      key-field="bvid"
      :min-column-width="280"
      :gap="16"
      :item-height="290"
      :buffer="3"
      class="virtual-grid-wrapper"
    >
      <template #default="{ item: video, index }">
        <div class="video-card group h-full flex flex-col">
          <div class="relative aspect-video rounded-lg overflow-hidden flex-shrink-0">
            <img :src="getVideoCoverUrl(video)" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerpolicy="no-referrer" loading="lazy" />
            <span class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
              {{ video.duration }}
            </span>
            <span class="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
              #{{ index + 1 }}
            </span>
          </div>
          <div class="flex flex-col flex-1 pt-3">
            <a :href="video.video_url" target="_blank" class="block text-sm font-medium text-neutral-900 hover:text-blue-600 line-clamp-2 h-10 transition-colors">
              {{ video.title }}
            </a>
            <div class="flex items-center gap-3 text-xs text-neutral-500 mt-auto">
              <span class="flex items-center gap-1">
                <Play :size="12" />
                {{ formatNumber(video.play_count) }}
              </span>
              <span class="flex items-center gap-1">
                <MessageSquare :size="12" />
                {{ formatNumber(video.danmu_count) }}
              </span>
              <span class="ml-auto">{{ formatDate(video.publish_time) }}</span>
            </div>
          </div>
        </div>
      </template>
    </VirtualGrid>

    <!-- Video List View (Virtual Scroll) -->
    <VirtualGrid
      v-else
      ref="virtualListRef"
      :items="filteredVideos"
      key-field="bvid"
      :min-column-width="9999"
      :gap="8"
      :item-height="96"
      :buffer="5"
      class="virtual-list-wrapper"
    >
      <template #default="{ item: video, index }">
        <div class="flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50/80 transition-colors group">
          <!-- Rank -->
          <span class="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">
            {{ index + 1 }}
          </span>

          <!-- Thumbnail -->
          <div class="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
            <img :src="getVideoCoverUrl(video)" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerpolicy="no-referrer" loading="lazy" />
            <span class="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] rounded">
              {{ video.duration }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <a :href="video.video_url" target="_blank" class="block text-sm font-medium text-neutral-900 hover:text-blue-600 truncate mb-2 transition-colors">
              {{ video.title }}
            </a>
            <div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              <span class="flex items-center gap-1">
                <Calendar :size="12" class="opacity-60" />
                {{ formatDate(video.publish_time) }}
              </span>
              <span class="flex items-center gap-1">
                <Play :size="12" class="opacity-60" />
                {{ formatNumber(video.play_count) }}
              </span>
              <span class="flex items-center gap-1">
                <MessageSquare :size="12" class="opacity-60" />
                {{ formatNumber(video.danmu_count) }}
              </span>
              <span class="flex items-center gap-1">
                <MessageCircle :size="12" class="opacity-60" />
                {{ formatNumber(video.comment_count || 0) }}
              </span>
              <span class="flex items-center gap-1">
                <Star :size="12" class="opacity-60" />
                {{ formatNumber(video.favorite_count || 0) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </VirtualGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import VirtualGrid from '../VirtualGrid.vue';
import { formatNumber, parseDuration, getImageUrl } from '../../utils';
import {
  Calendar,
  Play,
  MessageSquare,
  MessageCircle,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  ArrowDownWideNarrow,
  Timer,
  LayoutGrid,
  List,
  Star
} from 'lucide-vue-next';

const props = defineProps({
  videos: {
    type: Array,
    default: () => []
  }
});

// 搜索和排序
const searchKeyword = ref('');
const sortBy = ref('time_desc');
const sortDropdownOpen = ref(false);
const sortDropdownRef = ref(null);
const viewMode = ref('grid'); // 'grid' | 'list'
const virtualGridRef = ref(null);
const virtualListRef = ref(null);

const sortOptions = [
  { value: 'time_desc', label: '最新发布', icon: Calendar },
  { value: 'time_asc', label: '最早发布', icon: Calendar },
  { value: 'play_desc', label: '播放最高', icon: TrendingUp },
  { value: 'play_asc', label: '播放最低', icon: ArrowDownWideNarrow },
  { value: 'danmu_desc', label: '弹幕最多', icon: MessageSquare },
  { value: 'engagement_desc', label: '互动率最高', icon: TrendingUp },
  { value: 'duration_desc', label: '时长最长', icon: Timer },
  { value: 'duration_asc', label: '时长最短', icon: Timer },
];

function selectSort(value) {
  sortBy.value = value;
  sortDropdownOpen.value = false;
}

function handleClickOutside(e) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    sortDropdownOpen.value = false;
  }
}

function getVideoCoverUrl(video) {
  return getImageUrl(video.cover);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

const filteredVideos = computed(() => {
  let result = props.videos;

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(v => v.title.toLowerCase().includes(keyword));
  }

  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc': return new Date(b.publish_time) - new Date(a.publish_time);
      case 'time_asc': return new Date(a.publish_time) - new Date(b.publish_time);
      case 'play_desc': return b.play_count - a.play_count;
      case 'play_asc': return a.play_count - b.play_count;
      case 'danmu_desc': return b.danmu_count - a.danmu_count;
      case 'engagement_desc': {
        const engA = (a.danmu_count + (a.comment_count || 0) + (a.favorite_count || 0)) / a.play_count;
        const engB = (b.danmu_count + (b.comment_count || 0) + (b.favorite_count || 0)) / b.play_count;
        return engB - engA;
      }
      case 'duration_desc': return parseDuration(b.duration) - parseDuration(a.duration);
      case 'duration_asc': return parseDuration(a.duration) - parseDuration(b.duration);
      default: return 0;
    }
  });

  return result;
});

const filteredAvgPlays = computed(() => {
  if (filteredVideos.value.length === 0) return 0;
  const total = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  return Math.round(total / filteredVideos.value.length);
});

const filteredEngagementRate = computed(() => {
  if (filteredVideos.value.length === 0) return '0.00';
  const totalPlays = filteredVideos.value.reduce((sum, v) => sum + v.play_count, 0);
  const totalEngagement = filteredVideos.value.reduce((sum, v) =>
    sum + v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0), 0);
  if (totalPlays === 0) return '0.00';
  return ((totalEngagement / totalPlays) * 100).toFixed(2);
});

// 搜索或排序变化时滚动回顶部
watch([searchKeyword, sortBy], () => {
  if (virtualGridRef.value) virtualGridRef.value.scrollToTop();
  if (virtualListRef.value) virtualListRef.value.scrollToTop();
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.virtual-grid-wrapper :deep(.vue-recycle-scroller__item-wrapper) {
  padding-bottom: 24px;
}

.virtual-list-wrapper :deep(.vue-recycle-scroller__item-wrapper) {
  padding-bottom: 24px;
}
</style>
