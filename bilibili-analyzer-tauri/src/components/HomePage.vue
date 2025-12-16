<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="max-w-[1400px] mx-auto px-6 py-6">
      <!-- Header -->
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">UP主对比分析</h1>
        <p class="text-sm text-neutral-500">选择多个UP主进行数据对比，分析视频表现差异</p>
      </header>

      <!-- UP主选择区域（核心入口） -->
      <div class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 mb-6">
        <div class="flex items-center gap-3">
          <!-- 添加UP主下拉（固定在左边） -->
          <div class="relative flex-shrink-0" ref="dropdownRef">
            <button
              v-if="savedUpList.length > 0"
              @click="showDropdown = !showDropdown"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-600 transition-colors"
            >
              <Plus :size="14" />
              添加对比
            </button>
            <div v-else class="text-sm text-neutral-400">
              暂无已保存的UP主，请先在侧边栏添加
            </div>

            <Transition name="dropdown">
              <div
                v-if="showDropdown"
                class="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
              >
                <!-- UP主列表 -->
                <div class="p-2 max-h-[300px] overflow-y-auto">
                  <label
                    v-for="up in savedUpList"
                    :key="up.mid"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      :checked="isUpSelected(up.mid)"
                      @change="toggleUp(up)"
                      class="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <img :src="getImageUrl(up.face)" class="w-8 h-8 rounded-full" referrerpolicy="no-referrer" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-neutral-900 truncate">{{ up.name }}</div>
                      <div class="text-xs text-neutral-400">{{ up.video_count }} 个视频</div>
                    </div>
                  </label>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 已选UP主标签 -->
          <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
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
          </div>

          <!-- 时间筛选 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-sm text-neutral-500">时间范围：</span>
            <div class="flex items-center p-1 bg-neutral-100 rounded-lg">
              <button
                v-for="option in timeRangeOptions"
                :key="option.value"
                @click="selectPresetRange(option.value)"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                  selectedTimeRange === option.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                {{ option.label }}
              </button>
              <button
                @click="selectedTimeRange = 'custom'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                  selectedTimeRange === 'custom'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                ]"
              >
                自定义
              </button>
            </div>
            <!-- 自定义日期输入 - Notion/Linear 风格 -->
            <div v-if="selectedTimeRange === 'custom'" class="flex items-center">
              <div class="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm hover:border-neutral-300 transition-colors">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 border-r border-neutral-100">
                  <Calendar :size="14" class="text-neutral-400" />
                  <input
                    type="text"
                    :value="customStartDate"
                    @input="onDateInput($event, 'start')"
                    placeholder="开始日期"
                    maxlength="10"
                    class="w-20 text-sm text-neutral-700 bg-transparent outline-none placeholder:text-neutral-300"
                  />
                </div>
                <span class="px-2 text-neutral-300 text-sm">→</span>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5">
                  <input
                    type="text"
                    :value="customEndDate"
                    @input="onDateInput($event, 'end')"
                    placeholder="结束日期"
                    maxlength="10"
                    class="w-20 text-sm text-neutral-700 bg-transparent outline-none placeholder:text-neutral-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="selectedUps.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
          <Users :size="28" class="text-neutral-400" />
        </div>
        <h3 class="text-lg font-semibold text-neutral-900 mb-2">选择UP主开始对比</h3>
        <p class="text-sm text-neutral-500 text-center max-w-md">
          从上方添加 2-5 个UP主，即可对比他们的热门视频和播放量表现
        </p>
      </div>

      <!-- 对比内容区域 -->
      <div v-else class="space-y-6">
        <!-- 热门视频榜（基于已选UP主） -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <Trophy :size="20" class="text-amber-500" />
              <h2 class="text-lg font-semibold text-neutral-900">热门视频榜</h2>
            </div>
            <div class="flex items-center gap-3">
              <!-- TOP N 输入 -->
              <div class="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-lg">
                <span class="text-xs font-medium text-neutral-500">TOP</span>
                <input
                  type="text"
                  :value="topN"
                  @input="onTopNInput"
                  class="w-8 px-1 py-0.5 text-xs font-medium text-center bg-white rounded border-0 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- 分列榜单 -->
          <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${Math.min(selectedUpTopVideosMap.length, 4)}, 1fr)` }">
            <div
              v-for="upData in selectedUpTopVideosMap"
              :key="upData.mid"
              class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              <!-- UP主头部 -->
              <div
                class="flex items-center gap-3 p-4 border-b"
                :style="{ borderColor: getUpColor(upData.mid) + '30', backgroundColor: getUpColor(upData.mid) + '08' }"
              >
                <img :src="getImageUrl(upData.face)" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" />
                <div class="flex-1 min-w-0">
                  <h3
                    class="text-sm font-semibold truncate"
                    :style="{ color: getUpColor(upData.mid) }"
                  >{{ upData.name }}</h3>
                  <p class="text-xs text-neutral-400">{{ upData.videos.length }} 个视频</p>
                </div>
              </div>

              <!-- 视频列表 -->
              <div class="divide-y divide-neutral-50 max-h-[500px] overflow-y-auto">
                <div
                  v-for="(video, index) in upData.videos"
                  :key="video.bvid"
                  class="flex items-start gap-2 p-3 hover:bg-neutral-50 transition-colors cursor-pointer group"
                  @click="openVideo(video)"
                >
                  <!-- 排名区域：个人榜 + 总榜 -->
                  <div class="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                    <!-- 个人榜排名 -->
                    <span
                      :class="[
                        'w-6 h-6 flex items-center justify-center rounded text-xs font-bold',
                        index === 0 ? 'bg-amber-400 text-white' :
                        index === 1 ? 'bg-neutral-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-neutral-100 text-neutral-500'
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                    <!-- 总榜排名 -->
                    <span
                      v-if="getGlobalRank(video.bvid) <= topN"
                      class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium"
                      :title="`所有已选UP主总榜第 ${getGlobalRank(video.bvid)} 名`"
                    >
                      #{{ getGlobalRank(video.bvid) }}
                    </span>
                  </div>

                  <!-- 封面 -->
                  <div class="relative w-[72px] h-[40px] rounded overflow-hidden flex-shrink-0">
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
        <div class="flex items-center gap-4">
          <div class="flex-1 h-px bg-neutral-200"></div>
          <span class="text-sm text-neutral-400">数据对比分析</span>
          <div class="flex-1 h-px bg-neutral-200"></div>
        </div>
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
                <!-- 基础数据 -->
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
                  <td class="py-3 px-4 text-neutral-600">总播放量</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).totalPlay) }}
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
                  <td class="py-3 px-4 text-neutral-600">最高播放</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ formatNumber(getUpStats(up.mid).maxPlay) }}
                  </td>
                </tr>
                <!-- 内容特征 -->
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">平均时长</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ getUpStats(up.mid).avgDuration }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">标题平均长度</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ getUpStats(up.mid).avgTitleLength }}字
                  </td>
                </tr>
                <!-- 发布规律 -->
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">发布频率</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ getUpStats(up.mid).publishFrequency }}
                  </td>
                </tr>
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">黄金发布时间</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    <HoverCardRoot :open-delay="200" :close-delay="100">
                      <HoverCardTrigger as-child>
                        <span class="inline-flex items-center gap-1 cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 transition-colors">
                          {{ getUpStats(up.mid).bestPublishTime }}
                          <Info :size="12" class="text-neutral-400" />
                        </span>
                      </HoverCardTrigger>
                      <HoverCardPortal>
                        <HoverCardContent
                          :side-offset="8"
                          side="top"
                          align="end"
                          class="z-50 w-80 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                        >
                          <div class="p-3 border-b border-neutral-100 bg-neutral-50">
                            <div class="flex items-center gap-2">
                              <div
                                class="w-2 h-2 rounded-full"
                                :style="{ backgroundColor: getUpColor(up.mid) }"
                              ></div>
                              <span class="text-sm font-medium text-neutral-700">{{ up.name }} 黄金发布时间分析</span>
                            </div>
                            <p class="text-xs text-neutral-500 mt-1">基于播放量 TOP 30% 的视频统计</p>
                          </div>
                          <div class="p-3">
                            <!-- 时段分布 -->
                            <div class="mb-3">
                              <div class="text-xs text-neutral-500 mb-2">高播放时段分布</div>
                              <div class="flex flex-wrap gap-1.5">
                                <span
                                  v-for="(count, slot) in getPublishTimeDetail(up.mid).slots"
                                  :key="slot"
                                  class="px-2 py-0.5 text-xs rounded-full"
                                  :class="slot === getUpStats(up.mid).bestPublishTime
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'bg-neutral-100 text-neutral-600'"
                                >
                                  {{ slot }} {{ count }}条
                                </span>
                              </div>
                            </div>
                            <!-- 代表视频 -->
                            <div>
                              <div class="text-xs text-neutral-500 mb-2">代表视频</div>
                              <div class="space-y-2 max-h-40 overflow-y-auto">
                                <div
                                  v-for="video in getPublishTimeDetail(up.mid).topVideos.slice(0, 3)"
                                  :key="video.bvid"
                                  class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                  @click="openVideo(video)"
                                >
                                  <img
                                    :src="getImageUrl(video.cover)"
                                    class="w-16 h-9 rounded object-cover flex-shrink-0"
                                    referrerpolicy="no-referrer"
                                  />
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                                    <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                      <span>{{ formatPublishTime(video.publish_time) }}</span>
                                      <span>{{ formatNumber(video.play_count) }}播放</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCardPortal>
                    </HoverCardRoot>
                  </td>
                </tr>
                <!-- 爆款表现 -->
                <tr class="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td class="py-3 px-4 text-neutral-600">爆款率</td>
                  <td
                    v-for="up in selectedUps"
                    :key="up.mid"
                    class="text-right py-3 px-4 font-medium text-neutral-900"
                  >
                    {{ getUpStats(up.mid).hitRate }}%
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

        <!-- 爆款标题词云对比 -->
        <div class="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-medium text-neutral-700">爆款标题词云对比</h3>
              <p class="text-xs text-neutral-400 mt-0.5">基于播放量 TOP 30% 的视频标题分词统计</p>
            </div>
          </div>
          <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${Math.min(selectedUps.length, 3)}, 1fr)` }">
            <div
              v-for="up in selectedUps"
              :key="up.mid"
              class="border border-neutral-100 rounded-lg overflow-hidden"
            >
              <div
                class="flex items-center gap-2 px-3 py-2 border-b"
                :style="{ borderColor: getUpColor(up.mid) + '30', backgroundColor: getUpColor(up.mid) + '08' }"
              >
                <img :src="getImageUrl(up.face)" class="w-6 h-6 rounded-full" referrerpolicy="no-referrer" />
                <span class="text-sm font-medium" :style="{ color: getUpColor(up.mid) }">{{ up.name }}</span>
              </div>
              <div :ref="el => setWordCloudRef(up.mid, el)" class="h-[200px]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { Plus, X, Users, Trophy, Play, Calendar, Info } from 'lucide-vue-next';
import { HoverCardRoot, HoverCardTrigger, HoverCardPortal, HoverCardContent } from 'radix-vue';
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

// 词云相关
const wordCloudRefs = ref({});
const wordCloudCharts = {};

function setWordCloudRef(mid, el) {
  if (el) {
    wordCloudRefs.value[mid] = el;
  }
}

const selectedTimeRange = ref('all');
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

// 自定义日期范围（默认值：一年前到今天）
const today = new Date();
const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const customStartDate = ref(formatDate(oneYearAgo));
const customEndDate = ref(formatDate(today));

// 日期输入处理，自动补充 "-"
function onDateInput(event, type) {
  let value = event.target.value;
  // 只保留数字和 "-"
  value = value.replace(/[^\d-]/g, '');
  // 去掉多余的 "-"，只在正确位置保留
  const digits = value.replace(/-/g, '');

  // 自动补充 "-"
  let formatted = '';
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 4 || i === 6) {
      formatted += '-';
    }
    formatted += digits[i];
  }

  if (type === 'start') {
    customStartDate.value = formatted;
  } else {
    customEndDate.value = formatted;
  }

  // 更新输入框的值
  event.target.value = formatted;
}

// 选择预设时间范围
function selectPresetRange(value) {
  selectedTimeRange.value = value;
}

// TOP N 视频榜单相关
const topN = ref(20);

// TOP N 输入处理
function onTopNInput(event) {
  const value = event.target.value.replace(/\D/g, ''); // 只保留数字
  const num = parseInt(value) || 1;
  topN.value = Math.min(Math.max(num, 1), 100); // 限制 1-100
  event.target.value = topN.value;
}

// 全局排名映射（用于在分列中显示总榜排名）
const globalRankMap = computed(() => {
  // 收集所有已选UP主的视频
  let allVideos = [];

  for (const up of selectedUps.value) {
    const upData = props.upDataMap[up.mid];
    if (upData && upData.videos) {
      allVideos = allVideos.concat(upData.videos);
    }
  }

  // 使用统一的时间筛选
  allVideos = filterVideosByTimeRange(allVideos);

  // 按播放量排序
  const sorted = allVideos.sort((a, b) => b.play_count - a.play_count);

  // 构建 bvid -> 排名 的映射
  const rankMap = {};
  sorted.forEach((video, index) => {
    rankMap[video.bvid] = index + 1;
  });

  return rankMap;
});

// 获取视频的全局排名
function getGlobalRank(bvid) {
  return globalRankMap.value[bvid] || 999;
}

// 分列模式下已选UP主的TOP N视频
const selectedUpTopVideosMap = computed(() => {
  const result = [];

  for (const up of selectedUps.value) {
    const upData = props.upDataMap[up.mid];
    if (upData && upData.videos) {
      // 使用统一的时间筛选
      let videos = filterVideosByTimeRange([...upData.videos]);

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

// 统一的时间筛选函数
function filterVideosByTimeRange(videos) {
  if (selectedTimeRange.value === 'all') {
    return videos;
  }

  const now = new Date();
  let startDate;
  let endDate;

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
    case 'custom':
      if (customStartDate.value) {
        startDate = new Date(customStartDate.value);
      }
      if (customEndDate.value) {
        endDate = new Date(customEndDate.value);
        endDate.setHours(23, 59, 59, 999); // 包含结束日期当天
      }
      break;
  }

  return videos.filter(v => {
    const publishDate = new Date(v.publish_time);
    if (startDate && publishDate < startDate) return false;
    if (endDate && publishDate > endDate) return false;
    return true;
  });
}

// 打开视频
async function openVideo(video) {
  if (video.video_url) {
    await open(video.video_url);
  }
}

// 获取UP主颜色
function getUpColor(mid) {
  const index = selectedUps.value.findIndex(u => u.mid === mid);
  return upColors[index % upColors.length];
}

// 检查UP主是否已选中
function isUpSelected(mid) {
  return selectedUps.value.some(u => u.mid === mid);
}

// 切换UP主选中状态
async function toggleUp(up) {
  if (isUpSelected(up.mid)) {
    // 取消选中
    selectedUps.value = selectedUps.value.filter(u => u.mid !== up.mid);
  } else {
    // 选中
    if (selectedUps.value.length >= 5) {
      alert('最多选择5个UP主进行对比');
      return;
    }
    selectedUps.value.push(up);
    // 如果没有数据，请求加载
    if (!props.upDataMap[up.mid]) {
      emit('load-up-data', up.mid);
    }
  }
}

// 移除UP主
function removeUp(mid) {
  selectedUps.value = selectedUps.value.filter(u => u.mid !== mid);
}

// 根据时间筛选获取视频
function getFilteredVideos(mid) {
  const videos = props.upDataMap[mid]?.videos || [];
  return filterVideosByTimeRange(videos);
}

// 解析时长字符串为秒数
function parseDuration(duration) {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// 格式化秒数为时长字符串
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}小时${remainMins}分` : `${hours}小时`;
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
      totalPlay: 0,
      avgDuration: '-',
      avgTitleLength: 0,
      publishFrequency: '-',
      bestPublishTime: '-',
      hitRate: 0
    };
  }

  const plays = videos.map(v => v.play_count).sort((a, b) => a - b);
  const totalPlay = plays.reduce((sum, p) => sum + p, 0);
  const avgPlay = Math.round(totalPlay / plays.length);
  const maxPlay = plays[plays.length - 1];
  const medianPlay = plays[Math.floor(plays.length / 2)];

  // 平均时长
  const durations = videos.map(v => parseDuration(v.duration)).filter(d => d > 0);
  const avgDurationSec = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const avgDuration = avgDurationSec > 0 ? formatDuration(avgDurationSec) : '-';

  // 标题平均长度
  const titleLengths = videos.map(v => v.title?.length || 0);
  const avgTitleLength = Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length);

  // 发布频率（基于时间范围内的视频数量）
  let publishFrequency = '-';
  if (videos.length >= 2) {
    const dates = videos.map(v => new Date(v.publish_time).getTime()).sort((a, b) => a - b);
    const spanDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
    if (spanDays > 0) {
      const videosPerWeek = (videos.length / spanDays) * 7;
      if (videosPerWeek >= 1) {
        publishFrequency = `周更${videosPerWeek.toFixed(1)}条`;
      } else {
        const videosPerMonth = (videos.length / spanDays) * 30;
        publishFrequency = `月更${videosPerMonth.toFixed(1)}条`;
      }
    }
  }

  // 黄金发布时间（播放量最高的视频发布时段统计）
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const timeSlots = {};
  // 取播放量前30%的视频分析发布时间
  const topVideos = [...videos].sort((a, b) => b.play_count - a.play_count).slice(0, Math.max(3, Math.ceil(videos.length * 0.3)));
  topVideos.forEach(v => {
    const date = new Date(v.publish_time);
    const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
    const hour = date.getHours();
    let timeSlot;
    if (hour >= 6 && hour < 12) timeSlot = '上午';
    else if (hour >= 12 && hour < 14) timeSlot = '中午';
    else if (hour >= 14 && hour < 18) timeSlot = '下午';
    else if (hour >= 18 && hour < 22) timeSlot = '晚间';
    else timeSlot = '深夜';

    const key = `${dayType}${timeSlot}`;
    timeSlots[key] = (timeSlots[key] || 0) + 1;
  });
  const bestPublishTime = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // 爆款率（播放量超过平均值2倍的视频占比）
  const hitThreshold = avgPlay * 2;
  const hitCount = videos.filter(v => v.play_count >= hitThreshold).length;
  const hitRate = Math.round((hitCount / videos.length) * 100);

  return {
    videoCount: videos.length,
    avgPlay,
    maxPlay,
    medianPlay,
    totalPlay,
    avgDuration,
    avgTitleLength,
    publishFrequency,
    bestPublishTime,
    hitRate
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

// 获取黄金发布时间详情（用于 HoverCard）
function getPublishTimeDetail(mid) {
  const videos = getFilteredVideos(mid);
  if (videos.length === 0) {
    return { slots: {}, topVideos: [] };
  }

  // 取播放量前30%的视频
  const topVideos = [...videos]
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, Math.max(3, Math.ceil(videos.length * 0.3)));

  // 统计时段分布
  const slots = {};
  topVideos.forEach(v => {
    const date = new Date(v.publish_time);
    const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
    const hour = date.getHours();
    let timeSlot;
    if (hour >= 6 && hour < 12) timeSlot = '上午';
    else if (hour >= 12 && hour < 14) timeSlot = '中午';
    else if (hour >= 14 && hour < 18) timeSlot = '下午';
    else if (hour >= 18 && hour < 22) timeSlot = '晚间';
    else timeSlot = '深夜';

    const key = `${dayType}${timeSlot}`;
    slots[key] = (slots[key] || 0) + 1;
  });

  // 按数量排序
  const sortedSlots = Object.fromEntries(
    Object.entries(slots).sort((a, b) => b[1] - a[1])
  );

  return {
    slots: sortedSlots,
    topVideos
  };
}

// 格式化发布时间（用于 HoverCard 显示）
function formatPublishTime(publishTime) {
  const date = new Date(publishTime);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${weekday} ${hour}:${minute}`;
}

// 停用词列表
const stopWords = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '他', '她', '它',
  '什么', '怎么', '为什么', '如何', '哪个', '哪些', '这个', '那个', '这些', '那些',
  '可以', '能', '会', '应该', '必须', '需要', '想', '要', '让', '把', '被', '给', '从', '向', '对', '与', '和', '或', '但', '而', '所以', '因为', '如果', '虽然',
  '吗', '呢', '吧', '啊', '哦', '嗯', '呀', '啦', '嘛', '哈', '哎',
  '第一', '第二', '第三', '一下', '一点', '一些', '一样', '一直', '一起',
  '还是', '已经', '正在', '开始', '结束', '之后', '之前', '以后', '以前', '然后', '最后', '终于',
  '真的', '其实', '可能', '应该', '大概', '肯定', '确实', '当然', '居然', '竟然', '简直',
  '非常', '特别', '十分', '更', '最', '太', '越', '比较', '相当', '极', '挺',
  '视频', '合集', '完整', '全集', '实录', '记录', '分享', '推荐', '必看', '建议', '注意',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'and', 'or', 'but', 'if', 'because', 'as', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in', 'on', 'up', 'down', 'out', 'off', 'over', 'under',
  'vol', 'ep', 'part', 'no'
]);

// 简单中文分词（基于正则，提取有意义的词组）
function segmentText(text) {
  if (!text) return [];

  // 移除特殊字符，保留中文、英文、数字
  const cleaned = text.toLowerCase()
    .replace(/[【】\[\]()（）《》<>「」『』""''！!？?。，,、；;：:～~·…—\-_|\/\\@#$%^&*+=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = [];

  // 提取英文单词（2字符以上）
  const englishWords = cleaned.match(/[a-zA-Z]{2,}/g) || [];
  words.push(...englishWords.filter(w => !stopWords.has(w.toLowerCase())));

  // 提取中文（2-6字符的词组）
  const chineseText = cleaned.replace(/[a-zA-Z0-9\s]/g, '');

  // 尝试提取2-4字的中文词组
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= chineseText.length - len; i++) {
      const word = chineseText.slice(i, i + len);
      if (!stopWords.has(word) && !/^\d+$/.test(word)) {
        words.push(word);
      }
    }
  }

  return words;
}

// 获取UP主爆款标题词频
function getHitTitleWords(mid) {
  const videos = getFilteredVideos(mid);
  if (videos.length === 0) return [];

  // 取播放量前30%的视频
  const avgPlay = videos.reduce((sum, v) => sum + v.play_count, 0) / videos.length;
  const hitThreshold = avgPlay * 1.5; // 稍微降低门槛，获取更多样本
  const hitVideos = videos
    .filter(v => v.play_count >= hitThreshold)
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, Math.max(10, Math.ceil(videos.length * 0.3)));

  if (hitVideos.length === 0) {
    // 如果没有爆款，取播放量最高的10个
    hitVideos.push(...videos.sort((a, b) => b.play_count - a.play_count).slice(0, 10));
  }

  // 统计词频
  const wordCount = {};
  hitVideos.forEach(v => {
    const words = segmentText(v.title);
    const seen = new Set(); // 同一标题内去重
    words.forEach(word => {
      if (!seen.has(word)) {
        seen.add(word);
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
  });

  // 转换为词云数据格式，按词频排序
  return Object.entries(wordCount)
    .filter(([word, count]) => count >= 2) // 至少出现2次
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50) // 最多50个词
    .map(([name, value]) => ({ name, value }));
}

// 渲染词云
function renderWordCloud(mid) {
  const el = wordCloudRefs.value[mid];
  if (!el) return;

  // 销毁旧实例
  if (wordCloudCharts[mid]) {
    wordCloudCharts[mid].dispose();
  }

  const chart = echarts.init(el);
  wordCloudCharts[mid] = chart;

  const words = getHitTitleWords(mid);
  const color = getUpColor(mid);

  const option = {
    tooltip: {
      show: true,
      formatter: (params) => {
        return `<div class="text-sm"><span class="font-medium">${params.name}</span><br/>出现 ${params.value} 次</div>`;
      }
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      sizeRange: [12, 32],
      rotationRange: [-45, 45],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
        color: function() {
          // 使用UP主主色调的不同透明度
          const opacity = 0.6 + Math.random() * 0.4;
          return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
        }
      },
      emphasis: {
        textStyle: {
          color: color
        }
      },
      data: words
    }]
  };

  chart.setOption(option);
}

// 渲染所有词云
function renderAllWordClouds() {
  nextTick(() => {
    selectedUps.value.forEach(up => {
      renderWordCloud(up.mid);
    });
  });
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
        fontSize: 11
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
watch([selectedUps, selectedTimeRange, customStartDate, customEndDate, () => props.upDataMap], () => {
  if (selectedUps.value.length > 0) {
    setTimeout(() => {
      renderScatterChart();
      renderAllWordClouds();
    }, 100);
  }
}, { deep: true });

// 窗口大小变化
function handleResize() {
  if (scatterChart) {
    scatterChart.resize();
  }
  // 词云也需要 resize
  Object.values(wordCloudCharts).forEach(chart => {
    if (chart) chart.resize();
  });
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
  // 清理词云实例
  Object.values(wordCloudCharts).forEach(chart => {
    if (chart) chart.dispose();
  });
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
