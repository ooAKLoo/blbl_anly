<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="max-w-[1400px] mx-auto px-6 py-6">
      <!-- Header -->
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">数据总览</h1>
        <p class="text-sm text-neutral-500">查看所有UP主的热门视频，或选择多个UP主进行对比分析</p>
      </header>

      <!-- 全部UP主 TOP N 视频榜单 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <Trophy :size="20" class="text-amber-500" />
            <h2 class="text-lg font-semibold text-neutral-900">热门视频榜</h2>
          </div>
          <div class="flex items-center gap-3">
            <!-- 展示模式切换 -->
            <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
              <button
                @click="topViewMode = 'merged'"
                :class="[
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
                  topViewMode === 'merged'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <LayoutList :size="12" />
                总榜
              </button>
              <button
                @click="topViewMode = 'split'"
                :class="[
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
                  topViewMode === 'split'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <Columns3 :size="12" />
                分列
              </button>
            </div>
            <!-- 时间筛选 -->
            <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
              <button
                v-for="option in topTimeRangeOptions"
                :key="option.value"
                @click="topTimeRange = option.value"
                :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
                  topTimeRange === option.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
            <!-- TOP N 选择 -->
            <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
              <button
                v-for="n in topNOptions"
                :key="n"
                @click="topN = n"
                :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
                  topN === n
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                TOP {{ n }}
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="savedUpList.length === 0 || Object.keys(upDataMap).length === 0" class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 text-center">
          <div class="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Play :size="20" class="text-neutral-400" />
          </div>
          <p class="text-neutral-500 text-sm">暂无视频数据，请先在侧边栏添加UP主</p>
        </div>

        <!-- 融合榜单模式 -->
        <div v-else-if="topViewMode === 'merged'" class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <div class="divide-y divide-neutral-100">
            <div
              v-for="(video, index) in allTopVideos"
              :key="video.bvid"
              class="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
              @click="openVideo(video)"
            >
              <!-- 排名 -->
              <div class="w-8 text-center flex-shrink-0">
                <span
                  v-if="index < 3"
                  :class="[
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white',
                    index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-neutral-400' : 'bg-amber-600'
                  ]"
                >
                  {{ index + 1 }}
                </span>
                <span v-else class="text-sm font-medium text-neutral-400">{{ index + 1 }}</span>
              </div>

              <!-- 封面 -->
              <div class="relative w-[120px] h-[68px] rounded-lg overflow-hidden flex-shrink-0">
                <img
                  :src="getImageUrl(video.cover)"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerpolicy="no-referrer"
                  loading="lazy"
                />
                <span class="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] rounded">
                  {{ video.duration }}
                </span>
              </div>

              <!-- 视频信息 -->
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                  {{ video.title }}
                </h4>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                  <span class="flex items-center gap-1">
                    <img :src="getImageUrl(video.up_face)" class="w-4 h-4 rounded-full" referrerpolicy="no-referrer" />
                    {{ video.up_name }}
                  </span>
                  <span>{{ video.publish_time.slice(0, 10) }}</span>
                </div>
              </div>

              <!-- 播放量 -->
              <div class="text-right flex-shrink-0">
                <div class="text-base font-semibold text-neutral-900">{{ formatNumber(video.play_count) }}</div>
                <div class="text-xs text-neutral-400 flex items-center justify-end gap-1">
                  <Play :size="10" />
                  播放
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分列榜单模式 -->
        <div v-else class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${Math.min(upTopVideosMap.length, 4)}, 1fr)` }">
          <div
            v-for="upData in upTopVideosMap"
            :key="upData.mid"
            class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <!-- UP主头部 -->
            <div class="flex items-center gap-3 p-4 border-b border-neutral-100 bg-neutral-50/50">
              <img :src="getImageUrl(upData.face)" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" />
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900 truncate">{{ upData.name }}</h3>
                <p class="text-xs text-neutral-400">{{ upData.videos.length }} 个视频</p>
              </div>
            </div>

            <!-- 视频列表 -->
            <div class="divide-y divide-neutral-50 max-h-[500px] overflow-y-auto">
              <div
                v-for="(video, index) in upData.videos"
                :key="video.bvid"
                class="flex items-start gap-3 p-3 hover:bg-neutral-50 transition-colors cursor-pointer group"
                @click="openVideo(video)"
              >
                <!-- 排名 -->
                <span
                  :class="[
                    'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs font-bold',
                    index === 0 ? 'bg-amber-400 text-white' :
                    index === 1 ? 'bg-neutral-300 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-neutral-100 text-neutral-400'
                  ]"
                >
                  {{ index + 1 }}
                </span>

                <!-- 封面 -->
                <div class="relative w-[80px] h-[45px] rounded overflow-hidden flex-shrink-0">
                  <img
                    :src="getImageUrl(video.cover)"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                  />
                </div>

                <!-- 信息 -->
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-medium text-neutral-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                    {{ video.title }}
                  </h4>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                    <span class="flex items-center gap-0.5">
                      <Play :size="8" />
                      {{ formatNumber(video.play_count) }}
                    </span>
                    <span>{{ video.publish_time.slice(5, 10) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 分隔线 -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-1 h-px bg-neutral-200"></div>
        <span class="text-sm text-neutral-400">UP主对比分析</span>
        <div class="flex-1 h-px bg-neutral-200"></div>
      </div>

      <!-- UP主选择区域 -->
      <div class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 mb-6">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm text-neutral-500">已选UP主：</span>

          <!-- 已选UP主标签 -->
          <div
            v-for="up in selectedUps"
            :key="up.mid"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            :style="{ backgroundColor: getUpColor(up.mid) + '15', color: getUpColor(up.mid) }"
          >
            <img :src="getImageUrl(up.face)" class="w-5 h-5 rounded-full" referrerpolicy="no-referrer" />
            <span class="font-medium">{{ up.name }}</span>
            <button
              @click="removeUp(up.mid)"
              class="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
            >
              <X :size="12" />
            </button>
          </div>

          <!-- 添加UP主下拉 -->
          <div class="relative" ref="dropdownRef">
            <button
              v-if="availableUps.length > 0"
              @click="showDropdown = !showDropdown"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-600 transition-colors"
            >
              <Plus :size="14" />
              添加对比
            </button>
            <div v-else-if="savedUpList.length === 0" class="text-sm text-neutral-400">
              暂无已保存的UP主，请先在侧边栏添加
            </div>

            <Transition name="dropdown">
              <div
                v-if="showDropdown && availableUps.length > 0"
                class="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 p-2"
              >
                <div
                  v-for="up in availableUps"
                  :key="up.mid"
                  @click="addUp(up)"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <img :src="getImageUrl(up.face)" class="w-8 h-8 rounded-full" referrerpolicy="no-referrer" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-neutral-900 truncate">{{ up.name }}</div>
                    <div class="text-xs text-neutral-400">{{ up.video_count }} 个视频</div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 时间筛选 -->
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-sm text-neutral-500">时间范围：</span>
            <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
              <button
                v-for="option in timeRangeOptions"
                :key="option.value"
                @click="selectedTimeRange = option.value"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                  selectedTimeRange === option.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 对比内容区域 -->
      <div v-if="selectedUps.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
          <Users :size="28" class="text-neutral-400" />
        </div>
        <h3 class="text-lg font-semibold text-neutral-900 mb-2">选择UP主开始对比</h3>
        <p class="text-sm text-neutral-500 text-center max-w-md">
          从上方添加 2-5 个UP主，即可在时间轴上对比他们的视频播放量表现
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- 时间轴散点图 -->
        <div class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-neutral-700">播放量时间轴对比</h3>
            <div class="flex items-center gap-4">
              <div
                v-for="up in selectedUps"
                :key="up.mid"
                class="flex items-center gap-1.5 text-xs"
              >
                <span
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: getUpColor(up.mid) }"
                ></span>
                <span class="text-neutral-600">{{ up.name }}</span>
              </div>
            </div>
          </div>
          <div ref="scatterChartRef" class="h-[400px]"></div>
          <p class="text-xs text-neutral-400 mt-2">点击圆点可查看视频详情并跳转</p>
        </div>

        <!-- 同期统计表格 -->
        <div class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
          <h3 class="text-sm font-medium text-neutral-700 mb-4">同期数据对比</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-100">
                  <th class="text-left py-3 px-4 font-medium text-neutral-500">指标</th>
                  <th
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium"
                    :style="{ color: getUpColor(up.mid) }"
                  >
                    {{ up.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">视频数量</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ getUpStats(up.mid).videoCount }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">平均播放</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).avgPlay) }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">最高播放</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).maxPlay) }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">中位数播放</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).medianPlay) }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">总播放量</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).totalPlay) }}
                  </td>
                </tr>
                <tr class="hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">相对流量</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-semibold"
                    :style="{ color: getUpColor(up.mid) }"
                  >
                    {{ getUpStats(up.mid).relativeFlow }}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { Plus, X, Users, Trophy, Play, LayoutList, Columns3 } from 'lucide-vue-next';
import { formatNumber, getImageUrl } from '../utils';
import { open } from '@tauri-apps/plugin-shell';

const props = defineProps({
  savedUpList: {
    type: Array,
    default: () => []
  },
  upDataMap: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['load-up-data', 'view-up-detail']);

// 颜色配置
const upColors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
];

// 状态
const selectedUps = ref([]);
const showDropdown = ref(false);
const dropdownRef = ref(null);
const scatterChartRef = ref(null);
let scatterChart = null;

const selectedTimeRange = ref('all');
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

// TOP N 视频榜单相关
const topN = ref(20);
const topNOptions = [10, 20, 50];
const topTimeRange = ref('all');
const topViewMode = ref('merged'); // 'merged' | 'split'
const topTimeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' }
];

// 全部UP主的TOP N视频
const allTopVideos = computed(() => {
  // 收集所有UP主的视频
  let allVideos = [];

  for (const up of props.savedUpList) {
    const upData = props.upDataMap[up.mid];
    if (upData && upData.videos) {
      // 为每个视频添加UP主信息
      const videosWithUpInfo = upData.videos.map(v => ({
        ...v,
        up_mid: up.mid,
        up_name: upData.up_info?.name || up.name,
        up_face: upData.up_info?.face || up.face
      }));
      allVideos = allVideos.concat(videosWithUpInfo);
    }
  }

  // 时间筛选
  if (topTimeRange.value !== 'all') {
    const now = new Date();
    let startDate;

    switch (topTimeRange.value) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    if (startDate) {
      allVideos = allVideos.filter(v => new Date(v.publish_time) >= startDate);
    }
  }

  // 按播放量排序，取TOP N
  return allVideos
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, topN.value);
});

// 分列模式下每个UP主的TOP N视频
const upTopVideosMap = computed(() => {
  const result = [];

  for (const up of props.savedUpList) {
    const upData = props.upDataMap[up.mid];
    if (upData && upData.videos) {
      let videos = [...upData.videos];

      // 时间筛选
      if (topTimeRange.value !== 'all') {
        const now = new Date();
        let startDate;

        switch (topTimeRange.value) {
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }

        if (startDate) {
          videos = videos.filter(v => new Date(v.publish_time) >= startDate);
        }
      }

      // 按播放量排序并取TOP N
      videos = videos
        .sort((a, b) => b.play_count - a.play_count)
        .slice(0, topN.value);

      result.push({
        mid: up.mid,
        name: upData.up_info?.name || up.name,
        face: upData.up_info?.face || up.face,
        videos
      });
    }
  }

  return result;
});

// 打开视频
async function openVideo(video) {
  if (video.video_url) {
    await open(video.video_url);
  }
}

// 可添加的UP主（排除已选）
const availableUps = computed(() => {
  const selectedMids = selectedUps.value.map(u => u.mid);
  return props.savedUpList.filter(up => !selectedMids.includes(up.mid));
});

// 获取UP主颜色
function getUpColor(mid) {
  const index = selectedUps.value.findIndex(u => u.mid === mid);
  return upColors[index % upColors.length];
}

// 添加UP主
async function addUp(up) {
  if (selectedUps.value.length >= 5) {
    alert('最多选择5个UP主进行对比');
    return;
  }

  selectedUps.value.push(up);
  showDropdown.value = false;

  // 如果没有数据，请求加载
  if (!props.upDataMap[up.mid]) {
    emit('load-up-data', up.mid);
  }
}

// 移除UP主
function removeUp(mid) {
  selectedUps.value = selectedUps.value.filter(u => u.mid !== mid);
}

// 根据时间筛选获取视频
function getFilteredVideos(mid) {
  const videos = props.upDataMap[mid]?.videos || [];

  if (selectedTimeRange.value === 'all') {
    return videos;
  }

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
    return videos.filter(v => new Date(v.publish_time) >= startDate);
  }
  return videos;
}

// 获取UP主基础统计数据
function getBaseStats(mid) {
  const videos = getFilteredVideos(mid);

  if (videos.length === 0) {
    return {
      videoCount: 0,
      avgPlay: 0,
      maxPlay: 0,
      medianPlay: 0,
      totalPlay: 0
    };
  }

  const plays = videos.map(v => v.play_count).sort((a, b) => a - b);
  const totalPlay = plays.reduce((sum, p) => sum + p, 0);
  const avgPlay = Math.round(totalPlay / plays.length);
  const maxPlay = plays[plays.length - 1];
  const medianPlay = plays[Math.floor(plays.length / 2)];

  return {
    videoCount: videos.length,
    avgPlay,
    maxPlay,
    medianPlay,
    totalPlay
  };
}

// 获取UP主统计数据（包含相对流量计算）
function getUpStats(mid) {
  const base = getBaseStats(mid);

  // 计算所有UP主的平均播放，找出最低值作为基准
  const allAvgPlays = selectedUps.value
    .map(up => getBaseStats(up.mid).avgPlay)
    .filter(v => v > 0);

  const minAvg = allAvgPlays.length > 0 ? Math.min(...allAvgPlays) : 1;

  return {
    ...base,
    relativeFlow: base.avgPlay > 0 ? (base.avgPlay / minAvg).toFixed(1) : 0
  };
}

// 渲染散点图
function renderScatterChart() {
  if (!scatterChartRef.value) return;

  if (scatterChart) {
    scatterChart.dispose();
  }
  scatterChart = echarts.init(scatterChartRef.value);

  const series = selectedUps.value.map(up => {
    const videos = getFilteredVideos(up.mid);
    const color = getUpColor(up.mid);

    return {
      name: up.name,
      type: 'scatter',
      symbolSize: (data) => {
        // 根据播放量动态调整大小
        const play = data[1];
        const size = Math.max(8, Math.min(20, Math.log10(play + 1) * 4));
        return size;
      },
      data: videos.map(v => ({
        value: [new Date(v.publish_time).getTime(), v.play_count],
        video: v,
        upName: up.name
      })),
      itemStyle: {
        color: color,
        opacity: 0.7
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          shadowBlur: 10,
          shadowColor: color
        },
        scale: 1.5
      }
    };
  });

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#374151',
        fontSize: 13
      },
      formatter: (params) => {
        const video = params.data.video;
        if (!video) return '';
        const title = video.title.length > 35 ? video.title.slice(0, 35) + '...' : video.title;
        const date = video.publish_time.slice(0, 10);
        return `
          <div style="max-width: 300px;">
            <div style="font-weight: 600; color: ${params.color}; margin-bottom: 4px;">${params.data.upName}</div>
            <div style="font-weight: 500; margin-bottom: 8px;">${title}</div>
            <div style="color: #6B7280; font-size: 12px;">
              发布时间：${date}<br/>
              播放量：${formatNumber(video.play_count)}
            </div>
            <div style="color: #3B82F6; font-size: 12px; margin-top: 8px;">点击打开视频</div>
          </div>
        `;
      }
    },
    legend: {
      show: false
    },
    grid: {
      top: 20,
      right: 30,
      bottom: 50,
      left: 60
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        formatter: (value) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      },
      splitLine: {
        show: true,
        lineStyle: { color: '#F3F4F6', type: 'dashed' }
      }
    },
    yAxis: {
      type: 'value',
      name: '播放量',
      nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        formatter: (value) => {
          if (value >= 10000000) return (value / 10000000).toFixed(1) + '千万';
          if (value >= 10000) return (value / 10000).toFixed(0) + '万';
          return value;
        }
      },
      splitLine: {
        lineStyle: { color: '#F3F4F6', type: 'dashed' }
      }
    },
    series
  };

  scatterChart.setOption(option);

  // 点击事件
  scatterChart.off('click');
  scatterChart.on('click', async (params) => {
    const video = params.data?.video;
    if (video && video.video_url) {
      await open(video.video_url);
    }
  });
}

// 点击外部关闭下拉
function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
}

// 监听变化重新渲染
watch([selectedUps, selectedTimeRange, () => props.upDataMap], () => {
  if (selectedUps.value.length > 0) {
    setTimeout(() => renderScatterChart(), 100);
  }
}, { deep: true });

// 窗口大小变化
function handleResize() {
  if (scatterChart) {
    scatterChart.resize();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  if (scatterChart) {
    scatterChart.dispose();
  }
});
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
