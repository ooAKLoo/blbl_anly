/**
 * 时间分析工具函数
 * 集中处理视频发布时间的分析逻辑
 */

/**
 * 获取发布时间的时段标签
 * @param {Date} date - 发布日期
 * @returns {string} 时段标签（上午/中午/下午/晚间/深夜）
 */
export function getTimeSlot(date) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '中午';
  if (hour >= 14 && hour < 18) return '下午';
  if (hour >= 18 && hour < 22) return '晚间';
  return '深夜';
}

/**
 * 获取星期类型
 * @param {Date} date - 日期
 * @returns {string} '工作日' 或 '周末'
 */
export function getDayType(date) {
  const day = date.getDay();
  return (day === 0 || day === 6) ? '周末' : '工作日';
}

/**
 * 获取完整的发布时段标签（工作日/周末 + 时段）
 * @param {Date|string} publishTime - 发布时间
 * @returns {string} 例如：'工作日上午'、'周末晚间'
 */
export function getPublishSlot(publishTime) {
  const date = new Date(publishTime);
  const dayType = getDayType(date);
  const timeSlot = getTimeSlot(date);
  return `${dayType}${timeSlot}`;
}

/**
 * 分析最佳发布时间
 * @param {Array} videos - 视频数组
 * @param {number} topPercentage - 取播放量前 N% 的视频进行分析，默认 0.3 (30%)
 * @returns {Object} 包含 bestSlot, slots, topVideos, topHours
 */
export function analyzeBestPublishTime(videos, topPercentage = 0.3) {
  if (!videos || videos.length === 0) {
    return {
      bestSlot: '-',
      slots: {},
      topVideos: [],
      topHours: []
    };
  }

  // 取播放量前 N% 的视频
  const topCount = Math.max(3, Math.ceil(videos.length * topPercentage));
  const topVideos = [...videos]
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, topCount);

  // 统计时段分布
  const slots = {};
  const hourCounts = {};

  topVideos.forEach(v => {
    const date = new Date(v.publish_time);
    const slot = getPublishSlot(v.publish_time);
    const hour = date.getHours();

    slots[slot] = (slots[slot] || 0) + 1;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // 找出最佳时段
  const bestSlot = Object.entries(slots)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // 找出最佳小时（前 3 个）
  const topHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  return {
    bestSlot,
    slots,
    topVideos,
    topHours
  };
}

/**
 * 格式化发布时间用于显示
 * @param {string} publishTime - 发布时间
 * @returns {string} 格式化后的时间，例如：'12/15 周五 18:30'
 */
export function formatPublishTime(publishTime) {
  const date = new Date(publishTime);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${weekday} ${hour}:${minute}`;
}

/**
 * 格式化发布时段用于显示（包含时间）
 * @param {string} publishTime - 发布时间
 * @returns {string} 例如：'工作日上午 9:00'
 */
export function formatPublishSlot(publishTime) {
  const date = new Date(publishTime);
  const slot = getPublishSlot(publishTime);
  const hour = date.getHours();
  return `${slot} ${hour}:00`;
}
