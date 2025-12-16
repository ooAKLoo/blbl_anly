<template>
  <div class="growth-journey">
    <!-- 顶部概览卡片 -->
    <section class="overview-card">
      <div class="overview-header">
        <div>
          <h2 class="text-lg font-semibold text-white tracking-tight">{{ upName }} 的创作旅程</h2>
          <p class="text-neutral-400 text-sm mt-1">
            从 {{ journeyStart }} 开始，已坚持创作 <strong class="text-white">{{ totalDays }}</strong> 天
          </p>
        </div>
        <div class="overview-stats">
          <div class="stat-item">
            <span class="stat-value">{{ videos.length }}</span>
            <span class="stat-label">作品</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(totalPlays) }}</span>
            <span class="stat-label">总播放</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ growthMultiple }}x</span>
            <span class="stat-label">成长倍数</span>
          </div>
        </div>
      </div>

      <!-- 成长曲线缩略图 -->
      <div ref="miniChartRef" class="mini-chart"></div>

      <!-- 激励语 -->
      <div class="motivation-quote">
        <Sparkles :size="16" class="text-amber-400" />
        <span>{{ motivationText }}</span>
      </div>
    </section>

    <!-- 成长阶段识别 -->
    <section v-if="growthPhases.length > 0" class="phases-section">
      <h3 class="section-title">
        <Layers :size="16" />
        成长阶段
      </h3>
      <div class="phases-grid">
        <div
          v-for="(phase, index) in growthPhases"
          :key="index"
          class="phase-card"
          :class="phase.type"
        >
          <div class="phase-icon">
            <component :is="phase.icon" :size="20" />
          </div>
          <div class="phase-content">
            <h4 class="phase-name">{{ phase.name }}</h4>
            <p class="phase-period">{{ phase.period }}</p>
            <p class="phase-desc">{{ phase.description }}</p>
            <div class="phase-stats">
              <span>{{ phase.videoCount }} 个视频</span>
              <span>·</span>
              <span>均播 {{ formatNumber(phase.avgPlay) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 成长时间线 -->
    <section class="timeline-section">
      <h3 class="section-title">
        <History :size="16" />
        成长时间线
      </h3>

      <div class="timeline-container">
        <div class="timeline-line"></div>

        <TransitionGroup name="milestone" tag="div" class="milestones">
          <div
            v-for="(milestone, index) in visibleMilestones"
            :key="milestone.id"
            class="milestone-item"
            :class="[milestone.type, { 'is-major': milestone.isMajor }]"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="milestone-marker">
              <component :is="milestone.icon" :size="milestone.isMajor ? 18 : 14" />
            </div>
            <div class="milestone-content">
              <div class="milestone-date">{{ milestone.date }}</div>
              <h4 class="milestone-title">{{ milestone.title }}</h4>
              <p v-if="milestone.description" class="milestone-desc">{{ milestone.description }}</p>
              <div v-if="milestone.video" class="milestone-video" @click="openVideo(milestone.video)">
                <Play :size="12" />
                <span class="truncate">{{ milestone.video.title }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <button
          v-if="milestones.length > visibleCount"
          @click="showMore"
          class="show-more-btn"
        >
          <ChevronDown :size="16" />
          查看更多 ({{ milestones.length - visibleCount }} 个)
        </button>
      </div>
    </section>

    <!-- 坚持的力量 -->
    <section class="persistence-section">
      <h3 class="section-title">
        <Flame :size="16" />
        坚持的力量
      </h3>

      <div class="persistence-grid">
        <!-- 发布节奏 -->
        <div class="persistence-card">
          <div class="persistence-header">
            <CalendarDays :size="18" class="text-blue-500" />
            <span>发布节奏</span>
          </div>
          <div class="persistence-content">
            <div class="big-number">{{ avgPublishDays }}</div>
            <div class="big-label">天发布一个视频</div>
          </div>
          <p class="persistence-insight">{{ publishRhythmInsight }}</p>
        </div>

        <!-- 最长坚持 -->
        <div class="persistence-card">
          <div class="persistence-header">
            <Award :size="18" class="text-amber-500" />
            <span>连续创作</span>
          </div>
          <div class="persistence-content">
            <div class="big-number">{{ longestStreak }}</div>
            <div class="big-label">周连续发布</div>
          </div>
          <p class="persistence-insight">{{ streakInsight }}</p>
        </div>

        <!-- 低谷期 -->
        <div class="persistence-card">
          <div class="persistence-header">
            <Heart :size="18" class="text-rose-500" />
            <span>低谷坚持</span>
          </div>
          <div class="persistence-content">
            <div class="big-number">{{ valleyVideos }}</div>
            <div class="big-label">个低谷期作品</div>
          </div>
          <p class="persistence-insight">{{ valleyInsight }}</p>
        </div>

        <!-- 成长突破 -->
        <div class="persistence-card highlight">
          <div class="persistence-header">
            <Rocket :size="18" class="text-emerald-500" />
            <span>成长突破</span>
          </div>
          <div class="persistence-content">
            <div class="big-number text-emerald-500">{{ breakThroughCount }}</div>
            <div class="big-label">次突破新高</div>
          </div>
          <p class="persistence-insight">{{ breakThroughInsight }}</p>
        </div>
      </div>
    </section>

    <!-- 成长拐点分析 -->
    <section v-if="turningPoints.length > 0" class="turning-points-section">
      <h3 class="section-title">
        <TrendingUp :size="16" />
        成长拐点
      </h3>
      <p class="section-subtitle">这些视频改变了账号的发展轨迹</p>

      <div class="turning-points-list">
        <div
          v-for="(point, index) in turningPoints"
          :key="index"
          class="turning-point-card"
          @click="openVideo(point.video)"
        >
          <div class="tp-rank">{{ index + 1 }}</div>
          <div class="tp-content">
            <div class="tp-header">
              <span class="tp-date">{{ point.date }}</span>
              <span class="tp-impact" :class="point.impactType">
                {{ point.impactLabel }}
              </span>
            </div>
            <h4 class="tp-title">{{ point.video.title }}</h4>
            <div class="tp-stats">
              <span>
                <Play :size="12" />
                {{ formatNumber(point.video.play_count) }}
              </span>
              <span class="tp-change">
                {{ point.changeDirection === 'up' ? '+' : '' }}{{ point.changePercent }}%
                {{ point.changeDirection === 'up' ? '增长' : '变化' }}
              </span>
            </div>
            <p class="tp-analysis">{{ point.analysis }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 成长曲线详图 -->
    <section class="growth-chart-section">
      <h3 class="section-title">
        <BarChart3 :size="16" />
        成长曲线
      </h3>
      <div ref="growthChartRef" class="growth-chart"></div>
    </section>

    <!-- 底部鼓励语 -->
    <section class="encouragement-section">
      <div class="encouragement-content">
        <Quote :size="32" class="quote-icon" />
        <p class="encouragement-text">{{ encouragementText }}</p>
        <div class="encouragement-footer">
          <span>{{ upName }}</span>
          <span>·</span>
          <span>{{ videos.length }} 个作品的见证</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { formatNumber } from '../../utils';
import { chartTheme, colors, gradients } from '../../theme';
import { open } from '@tauri-apps/plugin-shell';
import {
  Sparkles,
  Layers,
  History,
  Play,
  ChevronDown,
  Flame,
  CalendarDays,
  Award,
  Heart,
  Rocket,
  TrendingUp,
  BarChart3,
  Quote,
  Flag,
  Star,
  Zap,
  Target,
  Trophy,
  Milestone,
  PartyPopper,
  Sunrise,
  Mountain,
  Crown
} from 'lucide-vue-next';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: 'UP主' },
  isActive: { type: Boolean, default: false }
});

const miniChartRef = ref(null);
const growthChartRef = ref(null);
let miniChart = null;
let growthChart = null;

const visibleCount = ref(8);

// 排序后的视频列表（按发布时间）
const sortedVideos = computed(() => {
  return [...props.videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
});

// 旅程开始时间
const journeyStart = computed(() => {
  if (sortedVideos.value.length === 0) return '';
  const date = new Date(sortedVideos.value[0].publish_time);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

// 总天数
const totalDays = computed(() => {
  if (sortedVideos.value.length < 2) return 0;
  const first = new Date(sortedVideos.value[0].publish_time);
  const last = new Date(sortedVideos.value[sortedVideos.value.length - 1].publish_time);
  return Math.ceil((last - first) / (1000 * 60 * 60 * 24));
});

// 总播放
const totalPlays = computed(() => {
  return props.videos.reduce((sum, v) => sum + v.play_count, 0);
});

// 成长倍数（最后10个视频均播 vs 前10个视频均播）
const growthMultiple = computed(() => {
  if (sortedVideos.value.length < 10) return '1.0';
  const first10 = sortedVideos.value.slice(0, 10);
  const last10 = sortedVideos.value.slice(-10);
  const firstAvg = first10.reduce((s, v) => s + v.play_count, 0) / 10;
  const lastAvg = last10.reduce((s, v) => s + v.play_count, 0) / 10;
  if (firstAvg === 0) return lastAvg > 0 ? '∞' : '1.0';
  return (lastAvg / firstAvg).toFixed(1);
});

// 激励语
const motivationText = computed(() => {
  const multiple = parseFloat(growthMultiple.value);
  if (isNaN(multiple)) return '每一次创作都是成长的积累';
  if (multiple >= 10) return '十倍增长！每一步坚持都没有白费';
  if (multiple >= 5) return '五倍飞跃！持续创作迎来质变';
  if (multiple >= 2) return '稳步成长，量变终将引发质变';
  if (multiple >= 1) return '保持稳定，下一个爆款正在路上';
  return '低谷是积蓄力量的时刻';
});

// 成长阶段分析
const growthPhases = computed(() => {
  if (sortedVideos.value.length < 5) return [];

  const phases = [];
  const videos = sortedVideos.value;
  const avgPlay = videos.reduce((s, v) => s + v.play_count, 0) / videos.length;

  // 按时间分段分析
  const segmentSize = Math.ceil(videos.length / 4);
  const segments = [];
  for (let i = 0; i < videos.length; i += segmentSize) {
    const segment = videos.slice(i, i + segmentSize);
    const segmentAvg = segment.reduce((s, v) => s + v.play_count, 0) / segment.length;
    segments.push({
      videos: segment,
      avgPlay: segmentAvg,
      startDate: new Date(segment[0].publish_time),
      endDate: new Date(segment[segment.length - 1].publish_time)
    });
  }

  // 判断各阶段类型
  segments.forEach((seg, i) => {
    const formatDate = (d) => `${d.getFullYear()}.${d.getMonth() + 1}`;
    const period = `${formatDate(seg.startDate)} - ${formatDate(seg.endDate)}`;

    let phase;
    const prevAvg = i > 0 ? segments[i - 1].avgPlay : 0;
    const growthRate = prevAvg > 0 ? (seg.avgPlay - prevAvg) / prevAvg : 0;

    if (i === 0) {
      phase = {
        type: 'start',
        name: '起步期',
        icon: Sunrise,
        description: '从0到1的开始，每一个作品都是勇敢的尝试',
        color: 'blue'
      };
    } else if (growthRate > 0.5 && seg.avgPlay > avgPlay) {
      phase = {
        type: 'explosive',
        name: '爆发期',
        icon: Rocket,
        description: '厚积薄发，数据迎来爆发式增长',
        color: 'amber'
      };
    } else if (seg.avgPlay > avgPlay * 1.2) {
      phase = {
        type: 'stable',
        name: '稳定期',
        icon: Crown,
        description: '找到节奏，持续稳定产出优质内容',
        color: 'emerald'
      };
    } else if (growthRate > 0.2) {
      phase = {
        type: 'growth',
        name: '成长期',
        icon: TrendingUp,
        description: '不断尝试，数据稳步上升',
        color: 'cyan'
      };
    } else if (growthRate < -0.2) {
      phase = {
        type: 'adjustment',
        name: '调整期',
        icon: Mountain,
        description: '经历低谷，但坚持就是胜利',
        color: 'neutral'
      };
    } else {
      phase = {
        type: 'accumulation',
        name: '积累期',
        icon: Layers,
        description: '厚积薄发，为下一次突破蓄力',
        color: 'violet'
      };
    }

    phases.push({
      ...phase,
      period,
      videoCount: seg.videos.length,
      avgPlay: Math.round(seg.avgPlay)
    });
  });

  return phases;
});

// 里程碑事件
const milestones = computed(() => {
  if (sortedVideos.value.length === 0) return [];

  const events = [];
  const videos = sortedVideos.value;
  let cumulativePlays = 0;
  let maxPlay = 0;
  const playMilestones = [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
  const achievedPlayMilestones = new Set();

  videos.forEach((video, index) => {
    const date = new Date(video.publish_time);
    const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

    // 第一个视频
    if (index === 0) {
      events.push({
        id: `first-${video.bvid}`,
        type: 'first',
        isMajor: true,
        date: dateStr,
        title: '发布第一个视频',
        description: '创作之旅正式开启',
        icon: Flag,
        video
      });
    }

    // 累计播放里程碑
    cumulativePlays += video.play_count;
    playMilestones.forEach(milestone => {
      if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
        achievedPlayMilestones.add(milestone);
        events.push({
          id: `cumulative-${milestone}`,
          type: 'cumulative',
          isMajor: milestone >= 100000,
          date: dateStr,
          title: `累计播放突破 ${formatNumber(milestone)}`,
          description: `这是第 ${index + 1} 个视频发布时达成`,
          icon: Trophy,
          video
        });
      }
    });

    // 播放量新高
    if (video.play_count > maxPlay * 1.5 && maxPlay > 0) {
      events.push({
        id: `record-${video.bvid}`,
        type: 'record',
        isMajor: video.play_count > maxPlay * 3,
        date: dateStr,
        title: video.play_count > maxPlay * 3 ? '播放量大爆发' : '刷新播放记录',
        description: `达到 ${formatNumber(video.play_count)} 播放，是之前最高的 ${(video.play_count / maxPlay).toFixed(1)} 倍`,
        icon: video.play_count > maxPlay * 3 ? PartyPopper : Star,
        video
      });
    }
    maxPlay = Math.max(maxPlay, video.play_count);

    // 发布数量里程碑
    const videoMilestones = [10, 50, 100, 200, 500, 1000];
    if (videoMilestones.includes(index + 1)) {
      events.push({
        id: `count-${index + 1}`,
        type: 'count',
        isMajor: index + 1 >= 100,
        date: dateStr,
        title: `第 ${index + 1} 个作品`,
        description: index + 1 >= 100 ? '百个作品的坚持，了不起！' : '持续创作中',
        icon: Milestone,
        video
      });
    }
  });

  // 按时间排序
  return events.sort((a, b) => {
    const dateA = new Date(a.date.replace(/\./g, '-'));
    const dateB = new Date(b.date.replace(/\./g, '-'));
    return dateA - dateB;
  });
});

const visibleMilestones = computed(() => milestones.value.slice(0, visibleCount.value));

function showMore() {
  visibleCount.value = Math.min(visibleCount.value + 10, milestones.value.length);
}

// 平均发布天数
const avgPublishDays = computed(() => {
  if (sortedVideos.value.length < 2) return 0;
  const days = totalDays.value;
  return Math.round(days / sortedVideos.value.length);
});

// 发布节奏洞察
const publishRhythmInsight = computed(() => {
  const days = avgPublishDays.value;
  if (days <= 2) return '高产创作者，保持热情的同时也要注意休息';
  if (days <= 7) return '周更节奏，持续稳定的产出';
  if (days <= 14) return '双周更新，质量优先的创作节奏';
  if (days <= 30) return '月更创作者，每一个作品都精心打磨';
  return '佛系更新，享受创作的过程';
});

// 最长连续发布周数
const longestStreak = computed(() => {
  if (sortedVideos.value.length < 2) return 0;

  let maxStreak = 0;
  let currentStreak = 1;
  let lastWeek = getWeekNumber(new Date(sortedVideos.value[0].publish_time));

  for (let i = 1; i < sortedVideos.value.length; i++) {
    const week = getWeekNumber(new Date(sortedVideos.value[i].publish_time));
    if (week === lastWeek + 1 || week === lastWeek) {
      if (week === lastWeek + 1) currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
    lastWeek = week;
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return maxStreak;
});

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 连续发布洞察
const streakInsight = computed(() => {
  const weeks = longestStreak.value;
  if (weeks >= 52) return '超过一年的连续更新，堪称铁人！';
  if (weeks >= 26) return '半年的坚持，毅力惊人';
  if (weeks >= 12) return '三个月不断更，难能可贵';
  if (weeks >= 4) return '月度连续创作，形成了好习惯';
  return '还可以尝试更持续的创作节奏';
});

// 低谷期视频数
const valleyVideos = computed(() => {
  const avgPlay = props.videos.reduce((s, v) => s + v.play_count, 0) / props.videos.length;
  return props.videos.filter(v => v.play_count < avgPlay * 0.3).length;
});

// 低谷洞察
const valleyInsight = computed(() => {
  const count = valleyVideos.value;
  const total = props.videos.length;
  const ratio = count / total;

  if (ratio < 0.1) return '很少有低谷，保持得很好';
  if (ratio < 0.2) return '低谷期的坚持最终换来了成长';
  if (ratio < 0.3) return '经历了不少低谷，但从未放弃';
  return '每一次低谷都是下一次爆发的蓄力';
});

// 突破次数（播放量创新高次数）
const breakThroughCount = computed(() => {
  let count = 0;
  let maxPlay = 0;
  sortedVideos.value.forEach(v => {
    if (v.play_count > maxPlay * 1.2 && maxPlay > 0) {
      count++;
    }
    maxPlay = Math.max(maxPlay, v.play_count);
  });
  return count;
});

// 突破洞察
const breakThroughInsight = computed(() => {
  const count = breakThroughCount.value;
  if (count >= 10) return '多次突破天花板，持续进化中';
  if (count >= 5) return '不断刷新记录，成长肉眼可见';
  if (count >= 2) return '有过突破，说明潜力巨大';
  return '下一个突破正在路上';
});

// 成长拐点（改变账号轨迹的关键视频）
const turningPoints = computed(() => {
  if (sortedVideos.value.length < 10) return [];

  const points = [];
  const videos = sortedVideos.value;

  // 计算每个视频发布后的趋势变化
  for (let i = 5; i < videos.length - 5; i++) {
    const before5 = videos.slice(i - 5, i);
    const after5 = videos.slice(i + 1, i + 6);

    const beforeAvg = before5.reduce((s, v) => s + v.play_count, 0) / 5;
    const afterAvg = after5.reduce((s, v) => s + v.play_count, 0) / 5;
    const currentPlay = videos[i].play_count;

    // 判断是否为拐点
    const changePercent = ((afterAvg - beforeAvg) / beforeAvg * 100).toFixed(0);
    const isSignificant = Math.abs(changePercent) > 30 && currentPlay > beforeAvg * 1.5;

    if (isSignificant) {
      const date = new Date(videos[i].publish_time);
      points.push({
        video: videos[i],
        date: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
        changePercent: Math.abs(changePercent),
        changeDirection: changePercent > 0 ? 'up' : 'down',
        impactType: changePercent > 50 ? 'major' : 'normal',
        impactLabel: changePercent > 50 ? '重大拐点' : '趋势变化',
        analysis: changePercent > 0
          ? `这个视频后，平均播放量提升了 ${changePercent}%`
          : `这个视频后，账号进入调整期`,
        beforeAvg,
        afterAvg
      });
    }
  }

  // 取影响最大的前5个
  return points
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
});

// 鼓励语
const encouragementText = computed(() => {
  const multiple = parseFloat(growthMultiple.value);
  const days = totalDays.value;
  const count = props.videos.length;

  if (multiple >= 5 && days > 365) {
    return `${days} 天，${count} 个作品，${multiple} 倍的成长。时间会回报每一个认真创作的人。`;
  }
  if (count >= 100) {
    return '一百个作品的背后，是一百次的热爱与坚持。这份毅力，本身就是成功。';
  }
  if (multiple >= 2) {
    return '数据在增长，更重要的是，你在成长。继续前行，未来可期。';
  }
  if (days > 180) {
    return '半年的坚持，已经超越了大多数人。创作的意义，不只是数据。';
  }
  return '每一次点击发布，都是勇气的证明。创作之路，你已经在路上。';
});

// 打开视频
async function openVideo(video) {
  if (video?.video_url) {
    await open(video.video_url);
  }
}

// 渲染迷你图表
function renderMiniChart() {
  if (!miniChartRef.value || sortedVideos.value.length < 2) return;

  if (miniChart) miniChart.dispose();
  miniChart = echarts.init(miniChartRef.value);

  const data = sortedVideos.value.map((v, i) => [i, v.play_count]);

  miniChart.setOption({
    grid: { top: 5, right: 5, bottom: 5, left: 5 },
    xAxis: { type: 'value', show: false, min: 0, max: sortedVideos.value.length - 1 },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data,
      smooth: 0.4,
      showSymbol: false,
      lineStyle: { width: 2, color: 'rgba(255, 255, 255, 0.6)' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 255, 255, 0.3)' },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' }
        ])
      }
    }]
  });
}

// 渲染成长曲线图
function renderGrowthChart() {
  if (!growthChartRef.value || sortedVideos.value.length < 2) return;

  if (growthChart) growthChart.dispose();
  growthChart = echarts.init(growthChartRef.value);

  const videos = sortedVideos.value;

  // 按月聚合
  const monthlyData = {};
  videos.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalPlay: 0, maxPlay: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].totalPlay += v.play_count;
    monthlyData[month].maxPlay = Math.max(monthlyData[month].maxPlay, v.play_count);
  });

  const months = Object.keys(monthlyData).sort();
  const avgPlays = months.map(m => Math.round(monthlyData[m].totalPlay / monthlyData[m].count));
  const counts = months.map(m => monthlyData[m].count);

  // 计算累计播放
  let cumulative = 0;
  const cumulativePlays = months.map(m => {
    cumulative += monthlyData[m].totalPlay;
    return cumulative;
  });

  growthChart.setOption({
    ...chartTheme,
    tooltip: {
      ...chartTheme.tooltip,
      trigger: 'axis',
      formatter: params => {
        const month = params[0].axisValue;
        const data = monthlyData[month];
        return `<div>
          <strong>${month}</strong><br/>
          发布 ${data.count} 个视频<br/>
          均播放 ${formatNumber(Math.round(data.totalPlay / data.count))}<br/>
          累计播放 ${formatNumber(params[2]?.value || 0)}
        </div>`;
      }
    },
    legend: {
      ...chartTheme.legend,
      data: ['月均播放', '发布数量', '累计播放']
    },
    grid: { top: 50, right: 70, bottom: 60, left: 60 },
    xAxis: {
      ...chartTheme.xAxis,
      type: 'category',
      data: months,
      axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 45, interval: Math.floor(months.length / 12) }
    },
    yAxis: [
      {
        ...chartTheme.yAxis,
        type: 'value',
        name: '播放量',
        position: 'left',
        axisLabel: { formatter: v => formatNumber(v) }
      },
      {
        ...chartTheme.yAxis,
        type: 'value',
        name: '累计',
        position: 'right',
        axisLabel: { formatter: v => formatNumber(v) }
      }
    ],
    series: [
      {
        name: '月均播放',
        type: 'bar',
        data: avgPlays,
        barMaxWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '发布数量',
        type: 'line',
        data: counts,
        smooth: 0.3,
        showSymbol: false,
        lineStyle: { width: 2, color: '#93C5FD' }
      },
      {
        name: '累计播放',
        type: 'line',
        yAxisIndex: 1,
        data: cumulativePlays,
        smooth: 0.4,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#10B981', type: 'dashed' }
      }
    ]
  });
}

// 当 tab 切换到成长历程时，重新渲染图表
watch(() => props.isActive, (active) => {
  if (active && props.videos.length > 0) {
    nextTick(() => {
      // 延迟一帧确保 DOM 已经可见
      setTimeout(() => {
        renderMiniChart();
        renderGrowthChart();
      }, 50);
    });
  }
}, { immediate: true });

// 当视频数据变化时，如果当前 tab 是激活状态则重新渲染
watch(() => props.videos, () => {
  if (props.isActive && props.videos.length > 0) {
    nextTick(() => {
      renderMiniChart();
      renderGrowthChart();
    });
  }
});

onMounted(() => {
  if (props.isActive && props.videos.length > 0) {
    nextTick(() => {
      renderMiniChart();
      renderGrowthChart();
    });
  }
});
</script>

<style scoped>
.growth-journey {
  @apply space-y-8;
}

/* 概览卡片 */
.overview-card {
  @apply bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-6 text-white;
}

.overview-header {
  @apply flex items-start justify-between mb-4;
}

.overview-stats {
  @apply flex items-center gap-6;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold tabular-nums;
}

.stat-label {
  @apply text-xs text-neutral-400 block mt-0.5;
}

.mini-chart {
  @apply h-16 w-full opacity-70;
}

.motivation-quote {
  @apply flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300;
}

/* 成长阶段 */
.phases-section {
  @apply space-y-4;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-neutral-800;
}

.section-subtitle {
  @apply text-xs text-neutral-500 -mt-2 mb-4;
}

.phases-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.phase-card {
  @apply bg-white rounded-xl p-4 flex gap-3;
}

.phase-card.start .phase-icon { @apply bg-blue-50 text-blue-500; }
.phase-card.growth .phase-icon { @apply bg-cyan-50 text-cyan-500; }
.phase-card.explosive .phase-icon { @apply bg-amber-50 text-amber-500; }
.phase-card.stable .phase-icon { @apply bg-emerald-50 text-emerald-500; }
.phase-card.adjustment .phase-icon { @apply bg-neutral-100 text-neutral-500; }
.phase-card.accumulation .phase-icon { @apply bg-violet-50 text-violet-500; }

.phase-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0;
}

.phase-content {
  @apply flex-1 min-w-0;
}

.phase-name {
  @apply text-sm font-semibold text-neutral-900;
}

.phase-period {
  @apply text-xs text-neutral-400 mt-0.5;
}

.phase-desc {
  @apply text-xs text-neutral-500 mt-1.5 leading-relaxed;
}

.phase-stats {
  @apply flex items-center gap-2 text-xs text-neutral-400 mt-2;
}

/* 时间线 */
.timeline-section {
  @apply space-y-4;
}

.timeline-container {
  @apply relative pl-6;
}

.timeline-line {
  @apply absolute left-2 top-0 bottom-0 w-0.5 bg-neutral-200;
}

.milestones {
  @apply space-y-4;
}

.milestone-item {
  @apply relative flex gap-4 opacity-0 animate-fade-in;
}

.milestone-item.is-major {
  @apply py-1;
}

.milestone-marker {
  @apply absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10;
  @apply bg-white border-2 border-neutral-200 text-neutral-400;
}

.milestone-item.is-major .milestone-marker {
  @apply w-6 h-6 -left-[26px];
}

.milestone-item.first .milestone-marker { @apply border-blue-400 text-blue-500 bg-blue-50; }
.milestone-item.cumulative .milestone-marker { @apply border-amber-400 text-amber-500 bg-amber-50; }
.milestone-item.record .milestone-marker { @apply border-emerald-400 text-emerald-500 bg-emerald-50; }
.milestone-item.count .milestone-marker { @apply border-violet-400 text-violet-500 bg-violet-50; }

.milestone-content {
  @apply bg-white rounded-xl p-4 flex-1 shadow-sm border border-neutral-100;
}

.milestone-item.is-major .milestone-content {
  @apply border-2;
}

.milestone-item.first.is-major .milestone-content { @apply border-blue-200 bg-blue-50/30; }
.milestone-item.cumulative.is-major .milestone-content { @apply border-amber-200 bg-amber-50/30; }
.milestone-item.record.is-major .milestone-content { @apply border-emerald-200 bg-emerald-50/30; }

.milestone-date {
  @apply text-xs text-neutral-400;
}

.milestone-title {
  @apply text-sm font-semibold text-neutral-900 mt-0.5;
}

.milestone-desc {
  @apply text-xs text-neutral-500 mt-1;
}

.milestone-video {
  @apply flex items-center gap-1.5 mt-2 text-xs text-blue-500 cursor-pointer hover:text-blue-600;
}

.show-more-btn {
  @apply flex items-center gap-1 mt-4 text-sm text-neutral-500 hover:text-neutral-700 transition-colors;
}

/* 坚持的力量 */
.persistence-section {
  @apply space-y-4;
}

.persistence-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.persistence-card {
  @apply bg-white rounded-xl p-5;
}

.persistence-card.highlight {
  @apply bg-gradient-to-br from-emerald-50 to-white border border-emerald-100;
}

.persistence-header {
  @apply flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3;
}

.persistence-content {
  @apply text-center py-3;
}

.big-number {
  @apply text-4xl font-bold text-neutral-900 tabular-nums;
}

.big-label {
  @apply text-xs text-neutral-500 mt-1;
}

.persistence-insight {
  @apply text-xs text-neutral-500 text-center mt-3 pt-3 border-t border-neutral-100;
}

/* 成长拐点 */
.turning-points-section {
  @apply space-y-4;
}

.turning-points-list {
  @apply space-y-3;
}

.turning-point-card {
  @apply bg-white rounded-xl p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow;
}

.tp-rank {
  @apply w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-bold text-neutral-600 flex-shrink-0;
}

.tp-content {
  @apply flex-1 min-w-0;
}

.tp-header {
  @apply flex items-center gap-2 mb-1;
}

.tp-date {
  @apply text-xs text-neutral-400;
}

.tp-impact {
  @apply text-xs px-1.5 py-0.5 rounded;
}

.tp-impact.major {
  @apply bg-amber-100 text-amber-700;
}

.tp-impact.normal {
  @apply bg-neutral-100 text-neutral-600;
}

.tp-title {
  @apply text-sm font-medium text-neutral-900 truncate;
}

.tp-stats {
  @apply flex items-center gap-3 text-xs text-neutral-500 mt-1;
}

.tp-stats span {
  @apply flex items-center gap-1;
}

.tp-change {
  @apply text-emerald-500 font-medium;
}

.tp-analysis {
  @apply text-xs text-neutral-500 mt-2;
}

/* 成长曲线 */
.growth-chart-section {
  @apply bg-white rounded-2xl p-6 space-y-4;
}

.growth-chart {
  @apply h-80;
}

/* 鼓励语 */
.encouragement-section {
  @apply bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-2xl p-8;
}

.encouragement-content {
  @apply text-center max-w-2xl mx-auto;
}

.quote-icon {
  @apply text-blue-200 mx-auto mb-4;
}

.encouragement-text {
  @apply text-lg text-neutral-700 leading-relaxed;
}

.encouragement-footer {
  @apply flex items-center justify-center gap-2 text-sm text-neutral-400 mt-4;
}

/* 动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

.milestone-enter-active {
  animation: fade-in 0.4s ease-out;
}

.milestone-leave-active {
  animation: fade-in 0.3s ease-in reverse;
}
</style>
