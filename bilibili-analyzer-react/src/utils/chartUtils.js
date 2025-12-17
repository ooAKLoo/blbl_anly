/**
 * 图表路径生成工具函数
 * 用于 EndingSection 的 SVG 图表绑制
 */

/**
 * 生成平滑曲线路径（贝塞尔曲线）
 * @param {Array<{x: number, y: number}>} points - 数据点数组
 * @returns {string} SVG path d 属性
 */
export function generateSmoothPath(points) {
  if (!points || points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
  }

  return path;
}

/**
 * 生成带区域填充的路径
 * @param {Array<{x: number, y: number}>} points - 数据点数组
 * @param {number} baseline - 基线 Y 坐标
 * @returns {string} SVG path d 属性
 */
export function generateAreaPath(points, baseline) {
  if (!points || points.length < 2) return '';

  let path = `M ${points[0].x} ${baseline}`;
  path += ` L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
    path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
  }

  path += ` L ${points[points.length - 1].x} ${baseline} Z`;
  return path;
}

/**
 * 将数据点缩放到 SVG 坐标
 * @param {Array<{timeProgress: number, cumulative: number}>} data - 原始数据
 * @param {{width: number, height: number, padding: number}} dimensions - 图表尺寸
 * @returns {Array<{x: number, y: number, cumulative: number, timeProgress: number}>}
 */
export function scalePointsToSVG(data, dimensions) {
  if (!data || data.length < 2) return [];

  const { width, height, padding } = dimensions;
  const maxY = Math.max(...data.map(d => d.cumulative));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return data.map(d => ({
    x: padding + d.timeProgress * chartWidth,
    y: height - padding - (d.cumulative / maxY) * chartHeight,
    cumulative: d.cumulative,
    timeProgress: d.timeProgress
  }));
}

/**
 * 根据时间进度插值获取当前点位置
 * @param {Array<{x: number, y: number, timeProgress: number}>} points - 缩放后的点
 * @param {number} timeProgress - 当前时间进度 (0-1)
 * @returns {{x: number, y: number}}
 */
export function interpolatePoint(points, timeProgress) {
  if (!points || points.length === 0) return { x: 0, y: 0 };

  for (let i = 1; i < points.length; i++) {
    if (timeProgress <= points[i].timeProgress) {
      const prev = points[i - 1];
      const curr = points[i];
      const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

      return {
        x: prev.x + (curr.x - prev.x) * segmentProgress,
        y: prev.y + (curr.y - prev.y) * segmentProgress
      };
    }
  }

  return points[points.length - 1];
}

/**
 * 生成迷你图表路径（用于小型统计卡片）
 * @param {Array} videos - 视频数组
 * @param {{width: number, height: number, padding: number}} dimensions - 图表尺寸
 * @returns {{linePath: string, areaPath: string}}
 */
export function generateMiniChartPaths(videos, dimensions = { width: 120, height: 40, padding: 4 }) {
  if (!videos || videos.length < 2) return { linePath: '', areaPath: '' };

  const sorted = [...videos].sort((a, b) => 
    new Date(a.publish_time) - new Date(b.publish_time)
  );

  const { width, height, padding } = dimensions;
  const maxY = Math.max(...sorted.map(v => v.play_count));
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = sorted.map((v, i) => ({
    x: padding + (i / (sorted.length - 1)) * chartWidth,
    y: height - padding - (v.play_count / maxY) * chartHeight
  }));

  const linePath = generateSmoothPath(points);
  const areaPath = generateAreaPath(points, height - padding);

  return { linePath, areaPath };
}
