<template>
  <div class="space-y-8">
    <!-- 筛选器 -->
    <VideoFilterBar
      :time-range="timeRange"
      :duration="duration"
      @update:time-range="$emit('update:timeRange', $event)"
      @update:duration="$emit('update:duration', $event)"
    >
      <template #right>
        <button
          @click="copyAnalysisReport"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Copy :size="14" />
          {{ copySuccess ? '已复制' : '复制报告' }}
        </button>
      </template>
    </VideoFilterBar>

    <!-- 分析报告内容 -->
    <div v-if="videos.length > 0" class="space-y-8">

      <!-- ==================== 第一层：核心结论 ==================== -->
      <section class="report-card bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">账号诊断结论</h2>
            <p class="text-neutral-500 text-xs mt-1">{{ videos.length }} 个视频 · {{ dataTimeRange }}</p>
          </div>
        </div>
        <p class="text-base text-neutral-200 leading-relaxed">{{ reportSummary.headline }}</p>
      </section>

      <!-- ==================== 第二层：关键发现 + 行动建议 ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 关键发现 -->
        <section class="report-card">
          <h2 class="section-title">
            <Lightbulb :size="16" class="text-amber-500" />
            关键发现
          </h2>
          <div class="space-y-4">
            <div v-for="(finding, index) in reportFindings" :key="index" class="flex items-start gap-3">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                finding.type === 'positive' ? 'bg-emerald-50 text-emerald-500' :
                finding.type === 'negative' ? 'bg-rose-50 text-rose-500' :
                'bg-blue-50 text-blue-500'
              ]">
                <component :is="finding.icon" :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-neutral-900">{{ finding.title }}</h3>
                <p class="text-sm text-neutral-500 mt-0.5 leading-relaxed">{{ finding.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 行动建议 -->
        <section class="report-card">
          <h2 class="section-title">
            <Target :size="16" class="text-blue-500" />
            行动建议
          </h2>
          <div class="space-y-4">
            <div v-for="(rec, index) in reportRecommendations" :key="index" class="flex items-start gap-3">
              <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-neutral-900">{{ rec.title }}</h4>
                <p class="text-sm text-neutral-500 mt-0.5 leading-relaxed">{{ rec.description }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ==================== 第三层：数据洞察详情 ==================== -->
      <section class="report-card">
        <h2 class="section-title">
          <BarChart3 :size="16" class="text-violet-500" />
          数据洞察
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(insight, index) in reportInsights" :key="index" class="flex items-start gap-4">
            <div class="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <component :is="insight.icon" :size="18" class="text-neutral-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-sm font-medium text-neutral-900">{{ insight.title }}</h3>
                <span class="text-sm font-semibold text-blue-600 tabular-nums">{{ insight.metric }}</span>
              </div>
              <p class="text-sm text-neutral-500 leading-relaxed">{{ insight.description }}</p>
              <div v-if="insight.details" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="(detail, i) in insight.details"
                  :key="i"
                  class="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded"
                >
                  {{ detail }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 第四层：长尾深度分析 ==================== -->
      <div v-if="longTailHealth || quadrantAnalysis" class="space-y-6">
        <div class="flex items-center gap-3">
          <h2 class="text-base font-semibold text-neutral-800">深度分析</h2>
          <div class="h-px flex-1 bg-neutral-200"></div>
          <span class="text-xs text-neutral-400">长尾理论 · 利基识别</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 内容结构分析 -->
          <section v-if="longTailHealth" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">内容结构</h3>

            <!-- 健康度状态 -->
            <div class="flex items-center gap-3 p-3 rounded-xl mb-4" :class="[
              longTailHealth.healthLevel === 'excellent' ? 'bg-emerald-50' :
              longTailHealth.healthLevel === 'good' ? 'bg-blue-50' :
              longTailHealth.healthLevel === 'risky' ? 'bg-rose-50' : 'bg-neutral-50'
            ]">
              <component
                :is="longTailHealth.healthLevel === 'excellent' ? Sparkles :
                     longTailHealth.healthLevel === 'risky' ? TrendingDown : Activity"
                :size="18"
                :class="[
                  longTailHealth.healthLevel === 'excellent' ? 'text-emerald-500' :
                  longTailHealth.healthLevel === 'good' ? 'text-blue-500' :
                  longTailHealth.healthLevel === 'risky' ? 'text-rose-500' : 'text-neutral-500'
                ]"
              />
              <div>
                <div class="text-sm font-medium text-neutral-900">{{ longTailHealth.healthDesc }}</div>
                <div class="text-xs text-neutral-500">前 20% 视频贡献 {{ longTailHealth.top20Contribution }}% 播放量</div>
              </div>
            </div>

            <!-- 头腰尾分布 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">头部（2x均值以上）</span>
                <span class="text-sm font-semibold text-amber-600 tabular-nums">{{ longTailHealth.head.count }} 个 · {{ longTailHealth.head.ratio }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">腰部（稳定内容）</span>
                <span class="text-sm font-semibold text-blue-600 tabular-nums">{{ longTailHealth.waist.count }} 个 · {{ longTailHealth.waist.ratio }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">长尾（0.5x均值以下）</span>
                <span class="text-sm font-semibold text-neutral-600 tabular-nums">{{ longTailHealth.tail.count }} 个 · {{ longTailHealth.tail.ratio }}%</span>
              </div>
            </div>

            <!-- 长尾有效性 -->
            <div class="mt-4 pt-4 border-t border-neutral-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-neutral-500">长尾有效性</span>
                <span class="text-sm font-semibold tabular-nums">{{ longTailHealth.effectiveTail.ratio }}%</span>
              </div>
              <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all"
                  :style="{ width: longTailHealth.effectiveTail.ratio + '%' }"
                ></div>
              </div>
              <p class="text-xs text-neutral-400 mt-2">有效长尾 = 播放低但互动率达标的内容</p>
            </div>
          </section>

          <!-- 四象限分析 -->
          <section v-if="quadrantAnalysis" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">内容四象限</h3>

            <div class="grid grid-cols-2 gap-3">
              <!-- 明星内容 -->
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-amber-700">明星内容</span>
                  <span class="text-lg font-bold text-amber-600 tabular-nums">{{ quadrantAnalysis.quadrants.star.count }}</span>
                </div>
                <p class="text-[11px] text-amber-600/70">高播放 · 高互动</p>
              </div>

              <!-- 利基宝藏 -->
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100 relative">
                <div class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded font-medium">
                  蓝海
                </div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-emerald-700">利基宝藏</span>
                  <span class="text-lg font-bold text-emerald-600 tabular-nums">{{ quadrantAnalysis.quadrants.niche.count }}</span>
                </div>
                <p class="text-[11px] text-emerald-600/70">低播放 · 高互动</p>
              </div>

              <!-- 流量内容 -->
              <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-blue-700">流量内容</span>
                  <span class="text-lg font-bold text-blue-600 tabular-nums">{{ quadrantAnalysis.quadrants.traffic.count }}</span>
                </div>
                <p class="text-[11px] text-blue-600/70">高播放 · 低互动</p>
              </div>

              <!-- 待优化 -->
              <div class="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-neutral-600">待优化</span>
                  <span class="text-lg font-bold text-neutral-500 tabular-nums">{{ quadrantAnalysis.quadrants.weak.count }}</span>
                </div>
                <p class="text-[11px] text-neutral-500">低播放 · 低互动</p>
              </div>
            </div>

            <!-- 利基内容列表 -->
            <div v-if="quadrantAnalysis.quadrants.niche.videos.length > 0" class="mt-4 pt-4 border-t border-neutral-100">
              <p class="text-xs text-neutral-500 mb-2">利基宝藏内容（值得深挖）</p>
              <div class="space-y-1.5">
                <div
                  v-for="(v, i) in quadrantAnalysis.quadrants.niche.videos.slice(0, 2)"
                  :key="i"
                  class="text-xs text-neutral-600 truncate"
                >
                  · {{ v.title }}
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 被低估的内容 -->
        <section v-if="undervaluedContent && undervaluedContent.videos.length > 0" class="report-card">
          <h3 class="text-sm font-semibold text-neutral-900 mb-1">被低估的潜力内容</h3>
          <p class="text-xs text-neutral-500 mb-4">{{ undervaluedContent.insight }}</p>

          <div class="space-y-2">
            <div
              v-for="(video, index) in undervaluedContent.videos.slice(0, 3)"
              :key="index"
              class="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0"
            >
              <span class="text-xs text-neutral-400 w-4">{{ index + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-neutral-900 truncate">{{ video.title }}</p>
                <div class="flex items-center gap-3 mt-0.5">
                  <span class="text-xs text-neutral-400">{{ formatNumber(video.play_count) }} 播放</span>
                  <span class="text-xs text-neutral-400">·</span>
                  <span class="text-xs text-emerald-600">{{ video.engagementRate.toFixed(2) }}% 互动率</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 蓝海机会 -->
        <div v-if="blueOceanTiming || blueOceanDuration" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 蓝海时段 -->
          <section v-if="blueOceanTiming" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">
              <Clock :size="14" class="inline mr-1.5 text-cyan-500" />
              发布时段分析
            </h3>

            <div v-if="blueOceanTiming.blueOcean.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">蓝海时段（竞争少、效果好）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(h, i) in blueOceanTiming.blueOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-lg"
                >
                  {{ h.label }}
                  <span class="text-cyan-500 text-xs ml-1">{{ h.efficiency }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanTiming.redOcean.length > 0">
              <p class="text-xs text-neutral-500 mb-2">红海时段（竞争激烈）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(h, i) in blueOceanTiming.redOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg"
                >
                  {{ h.label }}
                </span>
              </div>
            </div>
          </section>

          <!-- 蓝海时长 -->
          <section v-if="blueOceanDuration" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">
              <Timer :size="14" class="inline mr-1.5 text-violet-500" />
              内容时长分析
            </h3>

            <div v-if="blueOceanDuration.mainstream.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">主流时长</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(d, i) in blueOceanDuration.mainstream"
                  :key="i"
                  class="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg"
                >
                  {{ d.label }}
                  <span class="text-neutral-400 text-xs ml-1">{{ d.ratio }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanDuration.blueOcean.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">蓝海时长（占比少但效果好）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(d, i) in blueOceanDuration.blueOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg"
                >
                  {{ d.label }}
                  <span class="text-violet-500 text-xs ml-1">{{ d.efficiency }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanDuration.depthPreference" class="p-3 bg-amber-50 rounded-lg">
              <p class="text-xs font-medium text-amber-700">
                {{ blueOceanDuration.depthPreference.type === 'long' ? '粉丝偏好深度长内容' : '短视频更受欢迎' }}
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="text-center text-xs text-neutral-400 py-2">
        以上分析基于 {{ videos.length }} 个视频数据，由算法自动生成
      </div>

      <!-- ==================== 第五层：AI 工具 ==================== -->
      <section class="report-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-neutral-900">AI 深度分析</h2>
          <span class="text-xs text-neutral-400">点击复制提示词</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1">
          <div
            v-for="(prompt, index) in aiPromptTemplates"
            :key="index"
            class="group flex items-center gap-2 py-2.5 cursor-pointer hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors"
            @click="copyPrompt(prompt)"
          >
            <component :is="prompt.icon" :size="14" class="text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
            <span class="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors truncate">{{ prompt.title }}</span>
          </div>
        </div>

        <!-- 复制成功提示 -->
        <Transition name="toast">
          <div
            v-if="promptCopySuccess"
            class="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm rounded-full shadow-lg z-50"
          >
            <CheckCircle :size="16" class="text-emerald-400" />
            已复制到剪贴板
          </div>
        </Transition>
      </section>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
      <div class="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
        <FileText :size="24" class="text-neutral-400" />
      </div>
      <h3 class="text-base font-semibold text-neutral-900 mb-1">暂无数据</h3>
      <p class="text-sm text-neutral-500">请调整筛选条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import VideoFilterBar from '../VideoFilterBar.vue';
import { formatNumber, copyToClipboard, parseDurationMinutes } from '../../utils';
import { useVideoMetrics } from '../../composables/useVideoMetrics';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  Flame,
  Copy,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Activity,
  Wand2,
  BookOpen,
  Crosshair,
  Repeat,
  Users,
  Calendar,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Timer,
  Gem,
  Layers,
  Compass,
  Sailboat,
  Radar,
  Search,
  ExternalLink
} from 'lucide-vue-next';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: '' },
  timeRange: { type: String, default: 'all' },
  duration: { type: String, default: 'all' }
});

defineEmits(['update:timeRange', 'update:duration']);

const copySuccess = ref(false);
const promptCopySuccess = ref(false);

// 使用 composable
const videosRef = computed(() => props.videos);
const {
  totalPlays,
  totalDanmu,
  totalComments,
  totalFavorites,
  avgPlays,
  avgEngagementRate,
  hitRate,
  monthlyPublishRate,
  avgDuration,
  dataTimeRange,
  getAccountLevel,
  getBestDuration,
  getBestPublishTime,
  getPublishFrequency,
  getTrendAnalysis,
  getHitVideoFeatures,
  generateDataSummary,
  getUndervaluedContent,
  getLongTailHealth,
  getBlueOceanTiming,
  getBlueOceanDuration,
  getQuadrantAnalysis
} = useVideoMetrics(videosRef);

// 报告摘要
const reportSummary = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return { headline: '' };

  const level = getAccountLevel(avgPlays.value);
  const trend = getTrendAnalysis(videoList);
  const freq = getPublishFrequency(videoList);

  let headline = `该账号为${level.desc}`;

  if (freq) {
    headline += `，${freq.frequency}更新（月均 ${freq.monthlyRate} 条）`;
  }

  headline += `，场均播放 ${formatNumber(avgPlays.value)}`;

  if (trend) {
    if (trend.trend === 'up') {
      headline += '，近期数据呈上升趋势';
    } else if (trend.trend === 'down') {
      headline += '，近期数据有所回落';
    } else {
      headline += '，整体表现稳定';
    }
  }

  headline += '。';

  return { headline, level, trend, freq };
});

// 关键发现
const reportFindings = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return [];

  const findings = [];

  const bestDur = getBestDuration(videoList);
  if (bestDur) {
    findings.push({
      title: '最佳内容时长',
      description: `${bestDur.label}的视频表现最好，平均播放 ${formatNumber(Math.round(bestDur.avgPlay))}`,
      type: 'positive',
      icon: Clock
    });
  }

  const bestTime = getBestPublishTime(videoList);
  if (bestTime) {
    findings.push({
      title: '黄金发布时间',
      description: `推荐时段：${bestTime.topHours.join('、')}`,
      type: 'positive',
      icon: Calendar
    });
  }

  const trend = getTrendAnalysis(videoList);
  if (trend) {
    findings.push({
      title: trend.trend === 'up' ? '数据上升中' : trend.trend === 'down' ? '数据波动' : '表现稳定',
      description: trend.description,
      type: trend.trend === 'up' ? 'positive' : trend.trend === 'down' ? 'negative' : 'neutral',
      icon: trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Activity
    });
  }

  const hitFeatures = getHitVideoFeatures(videoList, avgPlays.value);
  if (hitFeatures && hitFeatures.count >= 2) {
    findings.push({
      title: `${hitFeatures.count} 个爆款`,
      description: `爆款率 ${hitFeatures.rate}%，平均时长 ${hitFeatures.avgDuration} 分钟`,
      type: 'positive',
      icon: Flame
    });
  }

  return findings.slice(0, 4);
});

// 数据洞察
const reportInsights = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return [];

  const insights = [];

  const plays = videoList.map(v => v.play_count).sort((a, b) => a - b);
  const median = plays[Math.floor(plays.length / 2)];
  const maxPlay = plays[plays.length - 1];
  const minPlay = plays[0];
  const playRange = maxPlay / Math.max(1, minPlay);

  insights.push({
    title: '播放量分布',
    description: playRange > 50 ? '数据波动较大' : playRange > 10 ? '分布较分散' : '相对稳定',
    metric: `中位数 ${formatNumber(median)}`,
    icon: BarChart3,
    details: [`最高 ${formatNumber(maxPlay)}`, `最低 ${formatNumber(minPlay)}`]
  });

  const engRate = parseFloat(avgEngagementRate.value);
  insights.push({
    title: '互动质量',
    description: engRate >= 5 ? '互动率优秀' : engRate >= 2 ? '互动率良好' : engRate >= 1 ? '互动率一般' : '互动率偏低',
    metric: `${engRate.toFixed(2)}%`,
    icon: MessageSquare,
    details: [`弹幕 ${formatNumber(totalDanmu.value)}`, `评论 ${formatNumber(totalComments.value)}`]
  });

  const freq = getPublishFrequency(videoList);
  if (freq) {
    insights.push({
      title: '发布节奏',
      description: freq.suggestion,
      metric: `${freq.monthlyRate} 条/月`,
      icon: CalendarDays,
      details: [`${freq.frequency}更新`]
    });
  }

  const durations = videoList.map(v => parseDurationMinutes(v.duration));
  const avgDur = durations.reduce((s, d) => s + d, 0) / durations.length;

  insights.push({
    title: '内容时长',
    description: `平均时长 ${avgDur.toFixed(1)} 分钟`,
    metric: `${avgDur.toFixed(1)} 分`,
    icon: Timer
  });

  return insights;
});

// 行动建议
const reportRecommendations = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return [];

  const recs = [];

  const bestDur = getBestDuration(videoList);
  if (bestDur) {
    recs.push({
      title: '优化内容时长',
      description: `${bestDur.label} 的视频表现最佳，建议多产出该时长内容`
    });
  }

  const bestTime = getBestPublishTime(videoList);
  if (bestTime) {
    recs.push({
      title: '把握发布时机',
      description: `推荐在 ${bestTime.topHours.join('、')} 发布视频`
    });
  }

  const engRate = parseFloat(avgEngagementRate.value);
  if (engRate < 2) {
    recs.push({
      title: '提升互动引导',
      description: '建议在视频中增加互动引导，提高观众参与度'
    });
  }

  const trend = getTrendAnalysis(videoList);
  if (trend && trend.trend === 'down') {
    recs.push({
      title: '分析下滑原因',
      description: '建议分析近期内容与之前爆款的差异'
    });
  }

  return recs.slice(0, 4);
});

// 长尾分析
const undervaluedContent = computed(() => getUndervaluedContent(props.videos));
const longTailHealth = computed(() => getLongTailHealth(props.videos));
const blueOceanTiming = computed(() => getBlueOceanTiming(props.videos));
const blueOceanDuration = computed(() => getBlueOceanDuration(props.videos));
const quadrantAnalysis = computed(() => getQuadrantAnalysis(props.videos));

// AI Prompt 模板
const aiPromptTemplates = computed(() => {
  const dataSummary = generateDataSummary(props.upName);

  return [
    {
      title: '选题策略',
      description: '分析高播放视频特征，给出选题建议',
      icon: Crosshair,
      color: 'bg-blue-500',
      prompt: `你是B站内容运营专家。请基于以下数据进行内容选题分析：\n\n${dataSummary}\n\n请分析：1.高播放视频标题特征 2.低播放视频问题 3.选题方向建议 4.标题优化示例`
    },
    {
      title: '发布策略',
      description: '优化发布时间和更新频率',
      icon: Calendar,
      color: 'bg-emerald-500',
      prompt: `你是B站运营分析师。请基于以下数据给出发布策略建议：\n\n${dataSummary}\n\n请分析：1.最佳发布时间 2.更新频率建议 3.内容排期模板`
    },
    {
      title: '增长诊断',
      description: '找出增长瓶颈和突破策略',
      icon: TrendingUp,
      color: 'bg-amber-500',
      prompt: `你是内容创作增长顾问。请基于以下数据进行增长诊断：\n\n${dataSummary}\n\n请分析：1.健康度评估 2.增长瓶颈 3.突破策略建议`
    },
    {
      title: '遗珠挖掘',
      description: '发现被低估的利基内容',
      icon: Gem,
      color: 'bg-teal-500',
      prompt: `你是长尾理论专家。请基于以下数据挖掘被低估的内容：\n\n${dataSummary}\n\n请分析：1.低播放高互动内容特征 2.利基市场价值 3.内容升级策略`
    },
    {
      title: '竞品分析',
      description: '分析竞品长尾寻找机会',
      icon: Search,
      color: 'bg-indigo-500',
      prompt: `你是竞争策略分析师。假设以下数据来自竞品账号：\n\n${dataSummary}\n\n请分析：1.竞品内容结构 2.长尾弱点 3.差异化机会`
    },
    {
      title: '爆款方法论',
      description: '总结可复制的爆款规律',
      icon: Repeat,
      color: 'bg-rose-500',
      prompt: `你是爆款内容研究专家。请基于以下数据总结爆款方法论：\n\n${dataSummary}\n\n请分析：1.爆款要素拆解 2.爆款检查清单 3.提升爆款率策略`
    },
    {
      title: '蓝海策略',
      description: '分析时段时长差异化机会',
      icon: Compass,
      color: 'bg-cyan-500',
      prompt: `你是蓝海战略专家。请基于以下数据分析差异化机会：\n\n${dataSummary}\n\n请分析：1.蓝海时段 2.蓝海时长 3.差异化发布计划`
    },
    {
      title: '竞品对标',
      description: '定位差距和学习方向',
      icon: Users,
      color: 'bg-violet-500',
      prompt: `你是行业研究分析师。请基于以下数据进行竞品对标分析：\n\n${dataSummary}\n\n请分析：1.账号定位 2.对标账号画像 3.差距分析 4.学习方向`
    },
    {
      title: '完整报告',
      description: '生成完整数据分析报告',
      icon: BookOpen,
      color: 'bg-slate-700',
      prompt: `你是专业数据分析师。请基于以下数据生成完整报告：\n\n${dataSummary}\n\n请按以下结构输出：一、执行摘要 二、数据概览 三、深度分析 四、问题诊断 五、优化建议 六、总结`
    },
    {
      title: '自定义',
      description: '复制数据用于自定义分析',
      icon: Wand2,
      color: 'bg-neutral-700',
      prompt: dataSummary
    }
  ];
});

// 复制报告
async function copyAnalysisReport() {
  const summary = reportSummary.value;
  const findings = reportFindings.value;
  const recs = reportRecommendations.value;

  let text = `【${props.upName || 'UP主'} 数据分析报告】\n`;
  text += `数据范围：${dataTimeRange.value}，共 ${props.videos.length} 个视频\n\n`;
  text += `${summary.headline}\n\n`;
  text += `核心指标：场均播放 ${formatNumber(avgPlays.value)} | 爆款率 ${hitRate.value}% | 互动率 ${avgEngagementRate.value}%\n\n`;

  if (findings.length > 0) {
    text += `关键发现：\n`;
    findings.forEach((f, i) => text += `${i + 1}. ${f.title}：${f.description}\n`);
    text += '\n';
  }

  if (recs.length > 0) {
    text += `行动建议：\n`;
    recs.forEach((r, i) => text += `${i + 1}. ${r.title}：${r.description}\n`);
  }

  const success = await copyToClipboard(text);
  if (success) {
    copySuccess.value = true;
    setTimeout(() => copySuccess.value = false, 2000);
  }
}

// 复制 Prompt
async function copyPrompt(prompt) {
  const success = await copyToClipboard(prompt.prompt);
  if (success) {
    promptCopySuccess.value = true;
    setTimeout(() => promptCopySuccess.value = false, 2000);
  }
}
</script>

<style scoped>
.report-card {
  @apply bg-white rounded-2xl p-6;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-4;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.25s ease-in forwards;
}

@keyframes toast-in {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes toast-out {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -10px); }
}
</style>
