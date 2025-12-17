import { useMemo } from 'react';
import { formatNumber } from '../../../../utils';
import {
  generateSmoothPath,
  generateAreaPath,
  scalePointsToSVG,
  interpolatePoint
} from '../../../../utils/chartUtils';

// 图表尺寸配置 - 放大尺寸
const CHART_DIMENSIONS = { width: 1200, height: 500, padding: 80 };

/**
 * 成长曲线图表组件
 * 显示累积播放量的动态折线图
 */
const GrowthChart = ({
  growthData,
  milestones,
  animationProgress,
  pathLength,
  onPathRef
}) => {
  // 缩放数据点到 SVG 坐标
  const scaledPoints = useMemo(() =>
    scalePointsToSVG(growthData, CHART_DIMENSIONS),
    [growthData]
  );

  // 生成路径
  const linePath = useMemo(() =>
    generateSmoothPath(scaledPoints),
    [scaledPoints]
  );

  const areaPath = useMemo(() =>
    generateAreaPath(scaledPoints, CHART_DIMENSIONS.height - CHART_DIMENSIONS.padding),
    [scaledPoints]
  );

  // 当前追踪点
  const currentPoint = useMemo(() =>
    interpolatePoint(scaledPoints, animationProgress),
    [scaledPoints, animationProgress]
  );

  // 绘制进度
  const pathDrawProgress = useMemo(() => {
    const { width, padding } = CHART_DIMENSIONS;
    const chartWidth = width - padding * 2;
    const currentX = currentPoint.x - padding;
    return Math.max(0, Math.min(1, currentX / chartWidth));
  }, [currentPoint]);

  // 可见里程碑
  const visibleMilestones = useMemo(() => {
    if (scaledPoints.length === 0) return [];

    const { width, height, padding } = CHART_DIMENSIONS;
    const maxY = Math.max(...growthData.map(d => d.cumulative));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    return milestones.map(m => {
      const x = padding + m.timeProgress * chartWidth;
      const y = height - padding - (m.cumulative / maxY) * chartHeight;
      const isPassed = animationProgress >= m.timeProgress;
      const isActive = isPassed && animationProgress < m.timeProgress + 0.05;

      return {
        ...m,
        x,
        y,
        opacity: isPassed ? 1 : 0,
        isActive,
        showLabel: isPassed && animationProgress > m.timeProgress + 0.02
      };
    });
  }, [scaledPoints, milestones, animationProgress, growthData]);

  // 当前时间日期标签
  const currentDateLabel = useMemo(() => {
    if (growthData.length === 0) return '';

    for (let i = 1; i < growthData.length; i++) {
      if (animationProgress <= growthData[i].timeProgress) {
        const prev = growthData[i - 1];
        const curr = growthData[i];
        const segmentProgress = (animationProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);
        const date = new Date(prev.date.getTime() + (curr.date.getTime() - prev.date.getTime()) * segmentProgress);
        return `${date.getFullYear()}.${date.getMonth() + 1}`;
      }
    }

    const lastDate = growthData[growthData.length - 1].date;
    return `${lastDate.getFullYear()}.${lastDate.getMonth() + 1}`;
  }, [animationProgress, growthData]);

  // 当前累计播放
  const currentCumulative = useMemo(() => {
    if (growthData.length === 0) return 0;

    for (let i = 1; i < growthData.length; i++) {
      if (animationProgress <= growthData[i].timeProgress) {
        const prev = growthData[i - 1];
        const curr = growthData[i];
        const segmentProgress = (animationProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);
        return Math.floor(prev.cumulative + (curr.cumulative - prev.cumulative) * segmentProgress);
      }
    }

    return growthData[growthData.length - 1].cumulative;
  }, [animationProgress, growthData]);

  return (
    <div className="relative w-full">
      {/* 当前时间/播放量实时显示 */}
      {animationProgress > 0 && animationProgress < 1 && (
        <div
          className="absolute top-2 z-10 pointer-events-none -translate-x-1/2 transition-[left] duration-100"
          style={{ left: `calc(${pathDrawProgress * 100}% + 20px)` }}
        >
          <div className="text-xs text-slate-400 mb-0.5">{currentDateLabel}</div>
          <div className="text-sm font-bold text-blue-600 tabular-nums">{formatNumber(currentCumulative)}</div>
        </div>
      )}

      <svg
        className="w-full h-auto"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: '400px' }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="milestoneGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 裁剪区域 */}
        <clipPath id="areaClip">
          <rect x={0} y={0} width={80 + pathDrawProgress * 1040} height={420} />
        </clipPath>

        {/* 里程碑垂直标记线 */}
        <g>
          {visibleMilestones.map(milestone => (
            <line
              key={milestone.id}
              x1={milestone.x}
              y1={80}
              x2={milestone.x}
              y2={420}
              stroke={milestone.color}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={milestone.opacity * 0.3}
            />
          ))}
        </g>

        {/* 区域填充 */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          clipPath="url(#areaClip)"
        />

        {/* 主线条 */}
        <path
          ref={onPathRef}
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength * (1 - pathDrawProgress)
          }}
          filter="url(#glow)"
        />

        {/* 里程碑点 */}
        <g>
          {visibleMilestones.map(milestone => (
            <g key={milestone.id}>
              <circle
                cx={milestone.x}
                cy={milestone.y}
                r={milestone.isActive ? 12 : 8}
                fill={milestone.color}
                opacity={milestone.opacity}
                filter={milestone.isActive ? 'url(#milestoneGlow)' : ''}
                className="transition-all duration-300"
              />
              {milestone.showLabel && (
                <g
                  transform={`translate(${milestone.x}, ${milestone.y - 24})`}
                  style={{ opacity: milestone.opacity }}
                  className="transition-opacity duration-300"
                >
                  <text
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="13"
                    fontWeight="500"
                  >
                    {milestone.label}
                  </text>
                </g>
              )}
            </g>
          ))}
        </g>

        {/* 当前追踪点 */}
        {animationProgress > 0 && (
          <g>
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="10"
              fill="#3b82f6"
              filter="url(#glow)"
              className="current-dot"
            />
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="10"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              className="pulse-ring"
            />
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="10"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              className="pulse-ring-2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GrowthChart;
