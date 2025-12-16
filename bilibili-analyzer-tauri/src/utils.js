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
