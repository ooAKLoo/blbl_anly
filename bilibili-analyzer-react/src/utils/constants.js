/**
 * 应用常量配置
 */

// ============ 筛选选项 ============

export const TIME_RANGE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

export const DURATION_OPTIONS = [
  { value: 'all', label: '全部时长' },
  { value: 'short', label: '<5分钟' },
  { value: 'medium', label: '5-20分钟' },
  { value: 'long', label: '>20分钟' }
];

// ============ 排序选项 ============

export const SORT_OPTIONS = [
  { value: 'time_desc', label: '最新发布', icon: 'Calendar' },
  { value: 'time_asc', label: '最早发布', icon: 'Calendar' },
  { value: 'play_desc', label: '播放最高', icon: 'TrendingUp' },
  { value: 'play_asc', label: '播放最低', icon: 'ArrowDownWideNarrow' },
  { value: 'danmu_desc', label: '弹幕最多', icon: 'MessageSquare' },
  { value: 'engagement_desc', label: '互动率最高', icon: 'TrendingUp' },
  { value: 'duration_desc', label: '时长最长', icon: 'Timer' },
  { value: 'duration_asc', label: '时长最短', icon: 'Timer' },
];

// ============ 账号等级阈值 ============

export const ACCOUNT_LEVEL_THRESHOLDS = [
  { minAvgPlay: 500000, level: '头部', desc: '头部创作者' },
  { minAvgPlay: 100000, level: '腰部', desc: '优质创作者' },
  { minAvgPlay: 30000, level: '成长', desc: '成长型创作者' },
  { minAvgPlay: 10000, level: '潜力', desc: '潜力创作者' },
  { minAvgPlay: 0, level: '起步', desc: '新晋创作者' }
];

// ============ 趋势分析阈值 ============

export const TREND_THRESHOLDS = {
  strongUp: 30,
  modUp: 10,
  modDown: -10,
  strongDown: -30
};

// ============ 时长分组配置 ============

export const DURATION_BINS = [
  { min: 0, max: 5, label: '5分钟以内' },
  { min: 5, max: 10, label: '5-10分钟' },
  { min: 10, max: 15, label: '10-15分钟' },
  { min: 15, max: 20, label: '15-20分钟' },
  { min: 20, max: 30, label: '20-30分钟' },
  { min: 30, max: Infinity, label: '30分钟以上' }
];

// ============ 分析阈值配置 ============

export const ANALYSIS_THRESHOLDS = {
  minSampleForDuration: 3,    // 时长分组最少样本数
  minSampleForHour: 2,        // 小时分组最少样本数
  minSampleForTrend: 10,      // 趋势分析最少视频数
  minPlayForEngagement: 10000 // 计算互动率的最低播放量
};
