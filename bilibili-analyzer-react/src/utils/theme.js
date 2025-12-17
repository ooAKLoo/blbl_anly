/**
 * 主题配置 - 颜色、图表样式等
 * 统一使用蓝色系，通过不同饱和度区分
 */

/**
 * 蓝色系主色调（从深到浅）
 */
export const colors = {
  // 主蓝色系 - 用于大部分图表
  blue900: '#1E3A8A',
  blue800: '#1E40AF',
  blue700: '#1D4ED8',
  blue600: '#2563EB',
  blue500: '#3B82F6',  // 主色
  blue400: '#60A5FA',
  blue300: '#93C5FD',
  blue200: '#BFDBFE',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',

  // 语义色（仅用于特殊场景）
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: 'rgba(59, 130, 246, 0.2)',

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
 * 蓝色系渐变配置
 */
export const gradients = {
  // 默认柱状图渐变（垂直）
  bar: [
    { offset: 0, color: '#3B82F6' },
    { offset: 1, color: 'rgba(59, 130, 246, 0.15)' }
  ],
  // 横向柱状图渐变
  barHorizontal: [
    { offset: 0, color: '#2563EB' },
    { offset: 1, color: '#60A5FA' }
  ],
  // 面积图渐变
  area: [
    { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
    { offset: 1, color: 'rgba(59, 130, 246, 0)' }
  ],
  // 深蓝渐变（用于强调）
  barDeep: [
    { offset: 0, color: '#1D4ED8' },
    { offset: 1, color: 'rgba(29, 78, 216, 0.15)' }
  ],
  // 浅蓝渐变
  barLight: [
    { offset: 0, color: '#60A5FA' },
    { offset: 1, color: 'rgba(96, 165, 250, 0.15)' }
  ]
};

/**
 * 时长/分布图颜色（蓝色系不同饱和度，从深到浅）
 */
export const distributionColors = [
  '#1D4ED8',  // 深蓝
  '#2563EB',
  '#3B82F6',  // 主蓝
  '#60A5FA',
  '#93C5FD',
  '#BFDBFE',
  '#DBEAFE'   // 浅蓝
];

/**
 * 热力图颜色（绿-黄-橙-红渐变，更直观的好坏对比）
 */
export const heatmapColors = [
  '#F3F4F6',  // 无数据 - 灰色
  '#D1FAE5',  // 低 - 浅绿
  '#6EE7B7',  // 较低 - 绿
  '#FCD34D',  // 中等 - 黄
  '#FB923C',  // 较高 - 橙
  '#EF4444'   // 高 - 红
];

/**
 * 高亮/强调色（用于最佳时段、最高值等）
 * 使用更深的蓝色，而非其他颜色
 */
export const highlightColor = {
  solid: '#1D4ED8',      // 深蓝高亮
  gradient: [
    { offset: 0, color: '#1D4ED8' },
    { offset: 1, color: 'rgba(29, 78, 216, 0.2)' }
  ]
};

/**
 * 双轴图表第二轴颜色（使用浅蓝色区分）
 */
export const secondaryAxis = {
  line: '#93C5FD',
  area: [
    { offset: 0, color: 'rgba(147, 197, 253, 0.3)' },
    { offset: 1, color: 'rgba(147, 197, 253, 0)' }
  ]
};

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
