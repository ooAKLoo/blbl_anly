<template>
  <div class="space-y-6">
    <!-- 筛选器 -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">时间范围</span>
        <div class="flex items-center gap-1">
          <button
            v-for="option in timeRangeOptions"
            :key="option.value"
            @click="$emit('update:timeRange', option.value)"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
              timeRange === option.value
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="w-px h-4 bg-neutral-200"></div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">视频时长</span>
        <div class="flex items-center gap-1">
          <button
            v-for="option in durationOptions"
            :key="option.value"
            @click="$emit('update:duration', option.value)"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
              duration === option.value
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <button
          @click="copyAnalysisReport"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Copy :size="14" />
          {{ copySuccess ? '已复制' : '复制报告' }}
        </button>
      </div>
    </div>

    <!-- 分析报告内容 -->
    <div v-if="videos.length > 0" class="space-y-5">

      <!-- 核心结论卡片 -->
      <section class="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold mb-1">账号数据洞察报告</h2>
            <p class="text-neutral-400 text-sm">基于 {{ videos.length }} 个视频 · {{ dataTimeRange }}</p>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
            <Sparkles :size="14" class="text-amber-400" />
            <span class="text-xs font-medium">智能分析</span>
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-4 mb-4">
          <p class="text-base leading-relaxed">{{ reportSummary.headline }}</p>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold tabular-nums">{{ formatNumber(avgPlays) }}</div>
            <div class="text-xs text-neutral-400 mt-1">场均播放</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold tabular-nums">{{ hitRate }}%</div>
            <div class="text-xs text-neutral-400 mt-1">爆款率</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold tabular-nums">{{ avgEngagementRate }}%</div>
            <div class="text-xs text-neutral-400 mt-1">互动率</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold tabular-nums">{{ monthlyPublishRate }}</div>
            <div class="text-xs text-neutral-400 mt-1">月均发布</div>
          </div>
        </div>
      </section>

      <!-- 关键发现 -->
      <section>
        <h2 class="section-title">
          <Lightbulb :size="16" />
          关键发现
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(finding, index) in reportFindings" :key="index" class="bg-white rounded-xl p-5">
            <div class="flex items-start gap-3">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                finding.type === 'positive' ? 'bg-emerald-50 text-emerald-500' :
                finding.type === 'negative' ? 'bg-rose-50 text-rose-500' :
                'bg-blue-50 text-blue-500'
              ]">
                <component :is="finding.icon" :size="16" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 mb-1">{{ finding.title }}</h3>
                <p class="text-sm text-neutral-600 leading-relaxed">{{ finding.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 数据洞察 -->
      <section>
        <h2 class="section-title">
          <TrendingUp :size="16" />
          数据洞察
        </h2>
        <div class="bg-white rounded-2xl divide-y divide-neutral-100">
          <div v-for="(insight, index) in reportInsights" :key="index" class="p-5">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <component :is="insight.icon" :size="18" class="text-neutral-500" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-neutral-900">{{ insight.title }}</h3>
                  <span v-if="insight.metric" class="text-sm font-semibold text-blue-600">{{ insight.metric }}</span>
                </div>
                <p class="text-sm text-neutral-600 leading-relaxed">{{ insight.description }}</p>
                <div v-if="insight.details" class="flex flex-wrap gap-2 mt-3">
                  <span
                    v-for="(detail, i) in insight.details"
                    :key="i"
                    class="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-md"
                  >
                    {{ detail }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 行动建议 -->
      <section>
        <h2 class="section-title">
          <Target :size="16" />
          行动建议
        </h2>
        <div class="bg-white rounded-2xl p-5">
          <div class="space-y-4">
            <div v-for="(rec, index) in reportRecommendations" :key="index" class="flex items-start gap-3">
              <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                {{ index + 1 }}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-neutral-900 mb-1">{{ rec.title }}</h4>
                <p class="text-sm text-neutral-600 leading-relaxed">{{ rec.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 数据说明 -->
      <div class="text-center text-xs text-neutral-400 py-4">
        以上分析基于筛选范围内的 {{ videos.length }} 个视频数据，由算法自动生成，仅供参考
      </div>

      <!-- AI 深度分析 Prompt 模板 -->
      <section class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">
            <Wand2 :size="16" />
            AI 深度分析
          </h2>
          <span class="text-xs text-neutral-400">复制提示词，粘贴到你喜欢的 AI 工具中</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(prompt, index) in aiPromptTemplates"
            :key="index"
            class="group bg-white rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-100"
            @click="copyPrompt(prompt)"
          >
            <div class="flex items-start gap-3">
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                prompt.color
              ]">
                <component :is="prompt.icon" :size="18" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-semibold text-neutral-900">{{ prompt.title }}</h3>
                  <span class="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Copy :size="12" />
                    点击复制
                  </span>
                </div>
                <p class="text-xs text-neutral-500 leading-relaxed line-clamp-2">{{ prompt.description }}</p>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  <span
                    v-for="(tag, i) in prompt.tags"
                    :key="i"
                    class="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] rounded-full"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 复制成功提示 -->
        <Transition name="toast">
          <div
            v-if="promptCopySuccess"
            class="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm rounded-full shadow-lg z-50"
          >
            <CheckCircle :size="16" class="text-emerald-400" />
            已复制到剪贴板，可粘贴到 AI 工具中使用
          </div>
        </Transition>
      </section>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
      <div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
        <FileText :size="28" class="text-neutral-400" />
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 mb-2">暂无数据</h3>
      <p class="text-sm text-neutral-500 text-center max-w-md">
        当前筛选条件下没有视频数据，请调整筛选条件后重试
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatNumber } from '../../utils';
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
  Timer
} from 'lucide-vue-next';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: '' },
  timeRange: { type: String, default: 'all' },
  duration: { type: String, default: 'all' }
});

const emit = defineEmits(['update:timeRange', 'update:duration']);

// 筛选选项
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

const durationOptions = [
  { value: 'all', label: '全部时长' },
  { value: 'short', label: '<5分钟' },
  { value: 'medium', label: '5-20分钟' },
  { value: 'long', label: '>20分钟' }
];

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
  generateDataSummary
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
      description: `${bestDur.label}的视频表现最好，平均播放量达到 ${formatNumber(Math.round(bestDur.avgPlay))}，共有 ${bestDur.count} 个视频。`,
      type: 'positive',
      icon: Clock
    });
  }

  const bestTime = getBestPublishTime(videoList);
  if (bestTime) {
    findings.push({
      title: '黄金发布时间',
      description: `${bestTime.bestHour}:00 发布的视频平均播放量最高，达到 ${formatNumber(Math.round(bestTime.avgPlay))}。推荐时段：${bestTime.topHours.join('、')}。`,
      type: 'positive',
      icon: Clock
    });
  }

  const trend = getTrendAnalysis(videoList);
  if (trend) {
    findings.push({
      title: trend.trend === 'up' ? '数据上升中' : trend.trend === 'down' ? '数据波动中' : '表现稳定',
      description: trend.description,
      type: trend.trend === 'up' ? 'positive' : trend.trend === 'down' ? 'negative' : 'neutral',
      icon: trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Activity
    });
  }

  const hitFeatures = getHitVideoFeatures(videoList, avgPlays.value);
  if (hitFeatures && hitFeatures.count >= 2) {
    findings.push({
      title: `${hitFeatures.count} 个爆款视频`,
      description: `爆款率 ${hitFeatures.rate}%，爆款视频平均时长约 ${hitFeatures.avgDuration} 分钟${hitFeatures.topHour ? `，多在 ${hitFeatures.topHour}:00 发布` : ''}。`,
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
    description: `中位数 ${formatNumber(median)}，最高 ${formatNumber(maxPlay)}，最低 ${formatNumber(minPlay)}。${playRange > 50 ? '数据波动较大，需关注内容稳定性。' : playRange > 10 ? '播放量分布较为分散。' : '播放量相对稳定。'}`,
    metric: `中位数 ${formatNumber(median)}`,
    icon: BarChart3,
    details: [`最高 ${formatNumber(maxPlay)}`, `最低 ${formatNumber(minPlay)}`, `波动 ${playRange.toFixed(0)}x`]
  });

  const engRate = parseFloat(avgEngagementRate.value);
  let engDesc;
  if (engRate >= 5) engDesc = '互动率优秀，观众参与度很高';
  else if (engRate >= 2) engDesc = '互动率良好，观众有一定参与热情';
  else if (engRate >= 1) engDesc = '互动率一般，可尝试增加互动引导';
  else engDesc = '互动率偏低，建议优化内容增加观众参与';

  insights.push({
    title: '互动质量',
    description: engDesc,
    metric: `${engRate.toFixed(2)}%`,
    icon: MessageSquare,
    details: [`弹幕 ${formatNumber(totalDanmu.value)}`, `评论 ${formatNumber(totalComments.value)}`, `收藏 ${formatNumber(totalFavorites.value)}`]
  });

  const freq = getPublishFrequency(videoList);
  if (freq) {
    insights.push({
      title: '发布节奏',
      description: freq.suggestion,
      metric: `${freq.monthlyRate} 条/月`,
      icon: CalendarDays,
      details: [`周均 ${freq.weeklyRate} 条`, `${freq.frequency}更新`]
    });
  }

  const durations = videoList.map(v => {
    const parts = v.duration.split(':');
    return parts.length === 2 ? parseInt(parts[0]) : parseInt(parts[0]) * 60 + parseInt(parts[1]);
  });
  const avgDur = durations.reduce((s, d) => s + d, 0) / durations.length;
  const shortCount = durations.filter(d => d < 5).length;
  const longCount = durations.filter(d => d > 20).length;
  const shortRatio = (shortCount / videoList.length * 100).toFixed(0);
  const longRatio = (longCount / videoList.length * 100).toFixed(0);

  insights.push({
    title: '内容时长',
    description: `平均时长 ${avgDur.toFixed(1)} 分钟，${shortRatio}% 为短视频（<5分钟），${longRatio}% 为长视频（>20分钟）。`,
    metric: `均时长 ${avgDur.toFixed(1)}分`,
    icon: Timer,
    details: [`短视频 ${shortRatio}%`, `长视频 ${longRatio}%`]
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
      description: `数据显示 ${bestDur.label} 的视频表现最佳，建议多产出该时长范围的内容，可作为主力内容形式。`
    });
  }

  const bestTime = getBestPublishTime(videoList);
  if (bestTime) {
    recs.push({
      title: '把握发布时机',
      description: `推荐在 ${bestTime.topHours.join('、')} 发布视频，这些时段的视频平均播放量更高。`
    });
  }

  const engRate = parseFloat(avgEngagementRate.value);
  if (engRate < 2) {
    recs.push({
      title: '提升互动引导',
      description: '当前互动率偏低，建议在视频中增加互动引导，如提问、投票、评论区互动等，提高观众参与度。'
    });
  }

  const freq = getPublishFrequency(videoList);
  if (freq && parseFloat(freq.monthlyRate) < 4) {
    recs.push({
      title: '提高更新频率',
      description: '当前月均发布不足 4 条，建议适当提高更新频率，保持账号活跃度和粉丝黏性。'
    });
  }

  const trend = getTrendAnalysis(videoList);
  if (trend && trend.trend === 'down') {
    recs.push({
      title: '分析下滑原因',
      description: '近期数据有所回落，建议分析近期内容与之前爆款的差异，找出影响因素并调整创作方向。'
    });
  }

  return recs.slice(0, 4);
});

// AI Prompt 模板
const aiPromptTemplates = computed(() => {
  const dataSummary = generateDataSummary(props.upName);

  return [
    {
      title: '内容选题策略分析',
      description: '基于高播放视频的标题特征，分析什么样的选题更容易获得高播放',
      icon: Crosshair,
      color: 'bg-blue-500',
      tags: ['选题方向', '标题优化', '爆款规律'],
      prompt: `你是一位资深的 B站内容运营专家，精通数据分析和内容策略。请基于以下账号数据，进行深度的内容选题分析。

${dataSummary}

请从以下维度进行分析：

1. **高播放视频的标题特征分析**
   - 分析 TOP5 视频标题的共同特征（关键词、句式、情绪词等）
   - 总结这些标题吸引点击的核心要素

2. **低播放视频的问题诊断**
   - 对比分析低播放视频标题与高播放视频的差异
   - 指出可能导致低播放的标题问题

3. **选题方向建议**
   - 基于数据推断该账号的核心受众画像
   - 推荐 5 个具体的选题方向，并说明理由
   - 给出 3 个具体的标题优化示例

4. **内容差异化建议**
   - 如何在当前内容基础上做差异化创新
   - 值得尝试的新内容形式

请用数据说话，给出具体、可执行的建议。`
    },
    {
      title: '发布策略优化',
      description: '分析最佳发布时间、更新频率，制定科学的发布计划',
      icon: Calendar,
      color: 'bg-emerald-500',
      tags: ['发布时间', '更新频率', '排期规划'],
      prompt: `你是一位 B站运营数据分析师，擅长通过数据优化发布策略。请基于以下账号数据，给出发布策略优化建议。

${dataSummary}

请分析并给出建议：

1. **最佳发布时间分析**
   - 基于发布时间分布和播放表现，推断最佳发布时间段
   - 工作日 vs 周末的发布策略差异
   - 给出具体的推荐发布时间表

2. **更新频率优化**
   - 当前更新频率是否合理？
   - 基于账号定位，建议的最佳更新频率
   - 如何平衡产出质量和数量

3. **内容排期建议**
   - 设计一个为期 4 周的内容排期模板
   - 不同类型内容的穿插策略
   - 如何利用热点和节日节点

4. **持续增长策略**
   - 如何建立稳定的内容产出节奏
   - 避免断更和不规律更新的方法

请结合数据，给出可落地执行的具体方案。`
    },
    {
      title: '竞品对标分析',
      description: '分析当前数据表现，提供可对标的竞品研究方向',
      icon: Users,
      color: 'bg-violet-500',
      tags: ['竞品分析', '差距定位', '学习方向'],
      prompt: `你是一位 B站行业研究分析师，擅长竞品分析和市场定位。请基于以下账号数据，帮我进行竞品对标分析。

${dataSummary}

请从以下角度分析：

1. **账号定位诊断**
   - 基于数据判断该账号目前处于什么发展阶段
   - 核心竞争力和差异化优势是什么
   - 当前存在的主要短板

2. **对标账号画像**
   - 描述应该对标什么类型的账号（不需要具体账号名）
   - 对标账号应该具备哪些特征
   - 场均播放、更新频率等指标的对标参考值

3. **差距分析**
   - 与理想对标账号相比，可能存在哪些差距
   - 哪些差距是短期可以弥补的
   - 哪些需要长期积累

4. **学习方向建议**
   - 建议重点学习对标账号的哪些方面
   - 具体的研究方法和关注点
   - 避免盲目模仿的注意事项

5. **差异化破局思路**
   - 如何在同类内容中建立辨识度
   - 可以尝试的创新方向

请给出专业、客观的分析建议。`
    },
    {
      title: '增长瓶颈诊断',
      description: '深度分析当前数据表现，找出增长瓶颈并给出突破建议',
      icon: TrendingUp,
      color: 'bg-amber-500',
      tags: ['增长诊断', '瓶颈分析', '突破策略'],
      prompt: `你是一位资深的内容创作者增长顾问，精通 B站平台算法和增长策略。请基于以下账号数据，进行增长瓶颈诊断。

${dataSummary}

请进行以下分析：

1. **整体健康度评估**
   - 基于各项指标，给账号打一个健康度评分（1-10分）
   - 指出数据中的亮点和问题点
   - 与同体量账号的横向对比（基于你的经验判断）

2. **增长瓶颈诊断**
   - 当前最主要的增长瓶颈是什么？
   - 是流量获取问题还是内容留存问题？
   - 爆款率和互动率反映了什么问题？

3. **播放量波动分析**
   - 播放量波动大的可能原因
   - 如何提高内容表现的稳定性
   - 建立「保底播放量」的策略

4. **突破策略建议**
   - 短期（1个月内）可以做的优化
   - 中期（1-3个月）需要调整的方向
   - 长期（3-6个月）的增长规划

5. **风险预警**
   - 当前策略可能存在的风险
   - 需要避免的运营误区

请给出专业、可执行的诊断报告。`
    },
    {
      title: '爆款复制方法论',
      description: '分析历史爆款规律，总结可复制的爆款方法论',
      icon: Repeat,
      color: 'bg-rose-500',
      tags: ['爆款分析', '规律总结', '复制方法'],
      prompt: `你是一位 B站爆款内容研究专家，擅长从数据中提炼爆款规律。请基于以下账号数据，帮我总结爆款方法论。

${dataSummary}

请进行以下分析：

1. **爆款定义与识别**
   - 基于该账号数据，如何定义「爆款」
   - 爆款率 ${hitRate.value}% 处于什么水平
   - 爆款视频有哪些共同特征

2. **爆款要素拆解**
   - 从标题角度：爆款标题的核心公式
   - 从时长角度：最容易出爆款的时长区间
   - 从发布时间：爆款视频的发布时间规律
   - 从选题角度：什么类型选题更容易爆

3. **爆款复制清单**
   - 给出一个「爆款检查清单」，发布前逐项检查
   - 至少包含 10 个检查项
   - 每个检查项说明为什么重要

4. **提升爆款率的具体策略**
   - 如何将爆款率从 ${hitRate.value}% 提升到更高水平
   - 3 个最值得尝试的优化方向
   - 需要避免的常见错误

5. **爆款内容的二次利用**
   - 如何基于爆款做延伸内容
   - 爆款素材的复用策略

请用结构化的方式输出，便于实际应用。`
    },
    {
      title: '数据全景分析报告',
      description: '生成一份完整的账号数据分析报告，适合汇报或复盘使用',
      icon: BookOpen,
      color: 'bg-slate-700',
      tags: ['完整报告', '数据复盘', '专业汇报'],
      prompt: `你是一位专业的数据分析师，擅长撰写结构化的分析报告。请基于以下账号数据，生成一份完整的数据分析报告。

${dataSummary}

请按以下结构输出报告：

---

# ${props.upName || 'UP主'} 数据分析报告

## 一、执行摘要
（200字以内，概括核心发现和关键建议）

## 二、数据概览
### 2.1 核心指标
（用表格呈现关键指标及其含义）

### 2.2 数据健康度评估
（综合评分及各维度得分）

## 三、深度分析
### 3.1 内容表现分析
- 播放量分布特征
- 爆款内容规律
- 内容稳定性评估

### 3.2 用户互动分析
- 互动率解读
- 观众活跃度评估
- 粉丝黏性判断

### 3.3 运营效率分析
- 发布频率评估
- 时间投入产出比
- 内容产出效率

## 四、问题诊断
（列出 3-5 个主要问题，按优先级排序）

## 五、优化建议
### 5.1 短期优化（1个月内）
### 5.2 中期规划（1-3个月）
### 5.3 长期方向（3-6个月）

## 六、总结
（简要总结和鼓励性建议）

---

请确保报告专业、客观、可执行。`
    }
  ];
});

// 复制报告
async function copyAnalysisReport() {
  const summary = reportSummary.value;
  const findings = reportFindings.value;
  const insights = reportInsights.value;
  const recs = reportRecommendations.value;

  let text = `【${props.upName || 'UP主'} 数据分析报告】\n`;
  text += `数据范围：${dataTimeRange.value}，共 ${props.videos.length} 个视频\n\n`;

  text += `📊 核心结论\n${summary.headline}\n`;
  text += `• 场均播放：${formatNumber(avgPlays.value)}\n`;
  text += `• 爆款率：${hitRate.value}%\n`;
  text += `• 互动率：${avgEngagementRate.value}%\n`;
  text += `• 月均发布：${monthlyPublishRate.value} 条\n\n`;

  if (findings.length > 0) {
    text += `💡 关键发现\n`;
    findings.forEach((f, i) => {
      text += `${i + 1}. ${f.title}：${f.description}\n`;
    });
    text += '\n';
  }

  if (insights.length > 0) {
    text += `📈 数据洞察\n`;
    insights.forEach((ins, i) => {
      text += `${i + 1}. ${ins.title}（${ins.metric}）：${ins.description}\n`;
    });
    text += '\n';
  }

  if (recs.length > 0) {
    text += `🎯 行动建议\n`;
    recs.forEach((r, i) => {
      text += `${i + 1}. ${r.title}：${r.description}\n`;
    });
  }

  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    setTimeout(() => copySuccess.value = false, 2000);
  } catch (e) {
    console.error('复制失败', e);
  }
}

// 复制 Prompt
async function copyPrompt(prompt) {
  try {
    await navigator.clipboard.writeText(prompt.prompt);
    promptCopySuccess.value = true;
    setTimeout(() => promptCopySuccess.value = false, 2500);
  } catch (e) {
    console.error('复制失败', e);
  }
}
</script>

<style scoped>
.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-4;
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
  0% {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
}
</style>
