/**
 * 工具函数集合
 */

/**
 * 格式化数字显示（万、亿）
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}

/**
 * 格式化坐标轴数字（紧凑格式）
 * @param {number} value - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatAxisNumber(value) {
  if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿';
  if (value >= 10000) return (value / 10000).toFixed(0) + '万';
  return value;
}

/**
 * 解析视频时长为秒数
 * @param {string} duration - 时长字符串 (如 "12:34" 或 "1:23:45")
 * @returns {number} 秒数
 */
export function parseDuration(duration) {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/**
 * 解析视频时长为分钟数
 * @param {string} duration - 时长字符串 (如 "12:34" 或 "1:23:45")
 * @returns {number} 分钟数
 */
export function parseDurationMinutes(duration) {
  const parts = duration.split(':');
  if (parts.length === 2) return parseInt(parts[0]);
  if (parts.length === 3) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return 0;
}

/**
 * 排序选项配置
 */
export const sortOptions = [
  { value: 'time_desc', label: '最新发布', iconName: 'Calendar' },
  { value: 'time_asc', label: '最早发布', iconName: 'Calendar' },
  { value: 'play_desc', label: '播放最高', iconName: 'TrendingUp' },
  { value: 'play_asc', label: '播放最低', iconName: 'ArrowDownWideNarrow' },
  { value: 'danmu_desc', label: '弹幕最多', iconName: 'MessageSquare' },
  { value: 'danmu_asc', label: '弹幕最少', iconName: 'MessageSquare' },
  { value: 'engagement_desc', label: '互动率最高', iconName: 'TrendingUp' },
  { value: 'duration_desc', label: '时长最长', iconName: 'Timer' },
  { value: 'duration_asc', label: '时长最短', iconName: 'Timer' },
];

/**
 * 视频排序函数
 * @param {Array} videos - 视频数组
 * @param {string} sortBy - 排序方式
 * @returns {Array} 排序后的视频数组
 */
export function sortVideos(videos, sortBy) {
  return [...videos].sort((a, b) => {
    switch (sortBy) {
      case 'time_desc':
        return new Date(b.publish_time) - new Date(a.publish_time);
      case 'time_asc':
        return new Date(a.publish_time) - new Date(b.publish_time);
      case 'play_desc':
        return b.play_count - a.play_count;
      case 'play_asc':
        return a.play_count - b.play_count;
      case 'danmu_desc':
        return b.danmu_count - a.danmu_count;
      case 'danmu_asc':
        return a.danmu_count - b.danmu_count;
      case 'engagement_desc':
        return (b.danmu_count / b.play_count) - (a.danmu_count / a.play_count);
      case 'duration_desc':
        return parseDuration(b.duration) - parseDuration(a.duration);
      case 'duration_asc':
        return parseDuration(a.duration) - parseDuration(b.duration);
      default:
        return 0;
    }
  });
}

/**
 * 播放量区间配置
 */
export const playCountBins = {
  bins: [0, 500000, 1000000, 1500000, 2000000, 3000000, 5000000, Infinity],
  labels: ['<50万', '50-100万', '100-150万', '150-200万', '200-300万', '300-500万', '>500万']
};

/**
 * 时长区间配置
 */
export const durationBins = {
  bins: [0, 5, 10, 15, 20, 30, 60, Infinity],
  labels: ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分']
};

/**
 * 按区间分组视频
 * @param {Array} videos - 视频数组
 * @param {Array} bins - 区间数组
 * @param {Function} getValue - 获取视频对应值的函数
 * @returns {Array} 分组后的视频数组
 */
export function groupVideosByBins(videos, bins, getValue) {
  const groups = bins.slice(0, -1).map(() => []);
  videos.forEach(v => {
    const value = getValue(v);
    for (let i = 0; i < bins.length - 1; i++) {
      if (value >= bins[i] && value < bins[i + 1]) {
        groups[i].push(v);
        break;
      }
    }
  });
  return groups;
}

/**
 * 星期标签
 */
export const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * 小时标签
 */
export const hourLabels = Array.from({ length: 24 }, (_, i) => i + '时');
