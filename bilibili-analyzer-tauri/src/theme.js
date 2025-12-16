/**
 * 主题配置 - 颜色、图表样式等
 */

/**
 * 主色调
 */
export const colors = {
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: 'rgba(59, 130, 246, 0.2)',

  success: '#10B981',
  successHover: '#059669',
  successLight: 'rgba(16, 185, 129, 0.2)',

  warning: '#F59E0B',
  warningHover: '#D97706',
  warningLight: 'rgba(245, 158, 11, 0.2)',

  danger: '#EF4444',
  dangerHover: '#DC2626',
  dangerLight: 'rgba(239, 68, 68, 0.2)',

  purple: '#8B5CF6',
  purpleHover: '#7C3AED',
  purpleLight: 'rgba(139, 92, 246, 0.15)',

  pink: '#EC4899',
  pinkHover: '#DB2777',
  pinkLight: 'rgba(236, 72, 153, 0.2)',

  indigo: '#6366F1',
  indigoHover: '#4F46E5',
  indigoLight: 'rgba(99, 102, 241, 0.2)',

  // 中性色
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  background: '#F9FAFB',
  white: '#ffffff'
};

/**
 * 渐变色配置
 */
export const gradients = {
  primary: [
    { offset: 0, color: '#3B82F6' },
    { offset: 1, color: 'rgba(59, 130, 246, 0.2)' }
  ],
  primaryHorizontal: [
    { offset: 0, color: '#2563EB' },
    { offset: 1, color: '#60A5FA' }
  ],
  success: [
    { offset: 0, color: '#10B981' },
    { offset: 1, color: 'rgba(16, 185, 129, 0.2)' }
  ],
  warning: [
    { offset: 0, color: '#F59E0B' },
    { offset: 1, color: 'rgba(245, 158, 11, 0.2)' }
  ],
  purple: [
    { offset: 0, color: '#8B5CF6' },
    { offset: 1, color: 'rgba(139, 92, 246, 0.15)' }
  ],
  pink: [
    { offset: 0, color: '#DB2777' },
    { offset: 1, color: '#F472B6' }
  ],
  indigo: [
    { offset: 0, color: '#6366F1' },
    { offset: 1, color: 'rgba(99, 102, 241, 0.2)' }
  ]
};

/**
 * 时长分布图颜色（渐变色系 - 从深蓝到浅蓝）
 */
export const durationChartColors = [
  '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'
];

/**
 * 热力图颜色
 */
export const heatmapColors = ['#F3F4F6', '#DBEAFE', '#93C5FD', '#60A5FA', '#3B82F6'];

/**
 * 现代大厂风格图表主题配置
 */
export const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  title: {
    textStyle: { color: '#111827', fontSize: 14, fontWeight: 600 }
  },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: '#6B7280', fontSize: 12 }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'transparent',
    padding: [12, 16],
    textStyle: { color: '#374151', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); backdrop-filter: blur(8px); border-radius: 8px;'
  },
  grid: {
    top: 40,
    right: 20,
    bottom: 30,
    left: 20,
    containLabel: true
  },
  xAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 11, margin: 12 },
    splitLine: { show: false }
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 11, margin: 12 },
    splitLine: {
      show: true,
      lineStyle: { type: 'dashed', color: '#F3F4F6' }
    }
  }
};

/**
 * 视频卡片样式配置
 */
export const videoCardStyle = {
  background: '#F9FAFB',
  backgroundHover: '#F3F4F6',
  borderRadius: '8px',
  rankColor: colors.primary,
  titleColor: colors.text,
  titleHoverColor: colors.primary,
  metaColor: colors.textMuted
};
