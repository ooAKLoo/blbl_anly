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
