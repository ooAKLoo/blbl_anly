import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * 获取本地图片的显示 URL
 * @param {string} localPath - 本地文件路径
 * @returns {string} 用于显示的 asset 协议 URL
 */
export function getImageUrl(localPath) {
  if (!localPath) return '';
  try {
    return convertFileSrc(localPath);
  } catch (e) {
    console.warn('转换本地图片路径失败:', e);
    return '';
  }
}

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
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|Date} dateStr - 日期字符串或 Date 对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * 格式化日期为中文格式 (如 "2024年1月15日")
 * @param {string|Date} dateStr - 日期字符串或 Date 对象
 * @returns {string} 中文格式的日期字符串
 */
export function formatDateCN(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 格式化日期为简短中文格式 (如 "2024.1")
 * @param {string|Date} dateStr - 日期字符串或 Date 对象
 * @returns {string} 简短中文格式的日期字符串
 */
export function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}`;
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('复制失败', e);
    return false;
  }
}

// ============ 视频排序函数 ============

/**
 * 计算视频互动率
 */
export function getEngagementRate(video) {
  const engagement = video.danmu_count + (video.comment_count || 0) + (video.favorite_count || 0);
  return video.play_count > 0 ? engagement / video.play_count : 0;
}

/**
 * 视频排序器映射
 */
export const videoSorters = {
  time_desc: (a, b) => new Date(b.publish_time) - new Date(a.publish_time),
  time_asc: (a, b) => new Date(a.publish_time) - new Date(b.publish_time),
  play_desc: (a, b) => b.play_count - a.play_count,
  play_asc: (a, b) => a.play_count - b.play_count,
  danmu_desc: (a, b) => b.danmu_count - a.danmu_count,
  engagement_desc: (a, b) => getEngagementRate(b) - getEngagementRate(a),
  duration_desc: (a, b) => parseDuration(b.duration) - parseDuration(a.duration),
  duration_asc: (a, b) => parseDuration(a.duration) - parseDuration(b.duration),
};

/**
 * 排序视频列表
 * @param {Array} videos - 视频数组
 * @param {string} sortKey - 排序键
 * @returns {Array} 排序后的视频数组
 */
export function sortVideos(videos, sortKey) {
  const sorter = videoSorters[sortKey];
  return sorter ? [...videos].sort(sorter) : videos;
}

// ============ 爆款检测算法 ============

/**
 * 检测全局爆款 - 对数空间 Z-Score
 * 在 UP 所有视频中播放量显著高的视频
 * @param {Array} videos - 视频数组，需包含 play_count 字段
 * @param {Object} options - 配置项
 * @param {number} options.threshold - Z-Score 阈值，默认 1.5
 * @param {number} options.minPlay - 最小播放量阈值，默认 10000
 * @param {number} options.maxCount - 最多返回数量，默认 10
 * @returns {Array} 爆款视频数组，包含 logZ 分数
 */
export function detectGlobalVirals(videos, options = {}) {
  const { threshold = 1.5, minPlay = 10000, maxCount = 10 } = options;

  if (!videos || videos.length < 5) return [];

  const plays = videos.map(v => v.play_count || 0);
  const logPlays = plays.map(p => Math.log10(Math.max(p, 1)));
  const logMean = logPlays.reduce((a, b) => a + b, 0) / logPlays.length;
  const logStd = Math.sqrt(
    logPlays.reduce((sum, p) => sum + (p - logMean) ** 2, 0) / logPlays.length
  );

  if (logStd === 0) return [];

  return videos
    .map((v, i) => ({
      ...v,
      index: i,
      logZ: (Math.log10(Math.max(v.play_count || 0, 1)) - logMean) / logStd
    }))
    .filter(v => v.logZ > threshold && v.play_count > minPlay)
    .sort((a, b) => b.logZ - a.logZ)
    .slice(0, maxCount);
}

/**
 * 检测局部突破 - 滑动窗口 Z-Score
 * 在当时阶段比前后视频显著高的视频
 * @param {Array} videos - 按时间排序的视频数组
 * @param {Object} options - 配置项
 * @param {number} options.windowSize - 窗口大小，默认 5
 * @param {number} options.threshold - 局部 Z-Score 阈值，默认 2
 * @param {number} options.minRatio - 最小倍数，默认 2
 * @param {number} options.maxCount - 最多返回数量，默认 5
 * @param {Array} options.excludeIndices - 需排除的索引（如已标记的全局爆款）
 * @returns {Array} 局部突破视频数组，包含 localZ 和 ratio
 */
export function detectLocalBreakouts(videos, options = {}) {
  const { windowSize = 5, threshold = 2, minRatio = 2, maxCount = 5, excludeIndices = [] } = options;

  if (!videos || videos.length < windowSize * 2 + 1) return [];

  const breakouts = [];

  for (let i = windowSize; i < videos.length - windowSize; i++) {
    if (excludeIndices.includes(i)) continue;

    const neighbors = [];
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i) neighbors.push(videos[j].play_count || 0);
    }

    const localMean = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
    const localStd = Math.sqrt(
      neighbors.reduce((sum, p) => sum + (p - localMean) ** 2, 0) / neighbors.length
    );

    const playCount = videos[i].play_count || 0;
    const localZ = localStd > 0 ? (playCount - localMean) / localStd : 0;
    const ratio = localMean > 0 ? playCount / localMean : 0;

    if (localZ > threshold && ratio > minRatio) {
      breakouts.push({
        ...videos[i],
        index: i,
        localZ,
        ratio
      });
    }
  }

  return breakouts
    .sort((a, b) => b.localZ - a.localZ)
    .slice(0, maxCount);
}

/**
 * 综合爆款检测 - 同时检测全局爆款和局部突破
 * @param {Array} videos - 视频数组
 * @param {Object} options - 配置项
 * @returns {Object} { globalVirals, localBreakouts, all }
 */
export function detectAllVirals(videos, options = {}) {
  if (!videos || videos.length < 5) {
    return { globalVirals: [], localBreakouts: [], all: [] };
  }

  // 按时间排序
  const sorted = [...videos].sort((a, b) =>
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  // 检测全局爆款
  const globalVirals = detectGlobalVirals(sorted, {
    threshold: options.globalThreshold || 1.5,
    minPlay: options.minPlay || 10000,
    maxCount: options.globalMaxCount || 3
  });

  // 检测局部突破（排除全局爆款）
  const globalIndices = globalVirals.map(v => v.index);
  const localBreakouts = detectLocalBreakouts(sorted, {
    windowSize: options.windowSize || 5,
    threshold: options.localThreshold || 2,
    minRatio: options.minRatio || 2,
    maxCount: options.localMaxCount || 2,
    excludeIndices: globalIndices
  });

  // 合并结果
  const all = [
    ...globalVirals.map(v => ({ ...v, type: 'viral' })),
    ...localBreakouts.map(v => ({ ...v, type: 'breakout' }))
  ].sort((a, b) => a.index - b.index);

  return { globalVirals, localBreakouts, all };
}
