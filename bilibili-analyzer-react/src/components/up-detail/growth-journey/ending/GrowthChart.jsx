import { useMemo } from 'react';
import { formatNumber } from '../../../../utils';
import { generateSmoothPath, generateAreaPath, scalePointsToSVG } from '../../../../utils/chartUtils';

const CHART = { width: 1200, height: 400, padding: 50 };

const GrowthChart = ({ growthData, milestones, progress, onReplay }) => {
  const scaledPoints = useMemo(() => scalePointsToSVG(growthData, CHART), [growthData]);
  const linePath = useMemo(() => generateSmoothPath(scaledPoints), [scaledPoints]);
  const areaPath = useMemo(() => generateAreaPath(scaledPoints, CHART.height - CHART.padding), [scaledPoints]);

  // 基于 progress 计算 clipPath 的宽度和 tracking dot 的位置，保证完全同步
  const clipWidth = CHART.padding + progress * (CHART.width - CHART.padding * 2);

  // 在 scaledPoints 中找到 clipWidth 对应的 y 值
  const point = useMemo(() => {
    if (scaledPoints.length < 2 || progress <= 0) return { x: 0, y: 0 };

    for (let i = 1; i < scaledPoints.length; i++) {
      if (scaledPoints[i].x >= clipWidth) {
        const prev = scaledPoints[i - 1];
        const curr = scaledPoints[i];
        const t = (clipWidth - prev.x) / (curr.x - prev.x || 1);
        return { x: clipWidth, y: prev.y + (curr.y - prev.y) * t };
      }
    }
    const last = scaledPoints[scaledPoints.length - 1];
    return { x: last.x, y: last.y };
  }, [scaledPoints, clipWidth, progress]);

  // 里程碑
  const visibleMilestones = useMemo(() => {
    if (scaledPoints.length === 0) return [];
    const maxY = Math.max(...growthData.map(d => d.cumulative));
    const chartW = CHART.width - CHART.padding * 2;
    const chartH = CHART.height - CHART.padding * 2;

    return milestones.map(m => {
      const x = CHART.padding + m.timeProgress * chartW;
      const y = CHART.height - CHART.padding - (m.cumulative / maxY) * chartH;
      const passed = point.x >= x;
      return { ...m, x, y, passed };
    });
  }, [scaledPoints, milestones, point.x, growthData]);

  // 当前数据
  const currentData = useMemo(() => {
    if (growthData.length === 0) return { date: '', cumulative: 0 };

    for (let i = 1; i < growthData.length; i++) {
      if (progress <= growthData[i].timeProgress) {
        const prev = growthData[i - 1], curr = growthData[i];
        const t = (progress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);
        const date = new Date(prev.date.getTime() + (curr.date.getTime() - prev.date.getTime()) * t);
        return {
          date: `${date.getFullYear()}.${date.getMonth() + 1}`,
          cumulative: Math.floor(prev.cumulative + (curr.cumulative - prev.cumulative) * t)
        };
      }
    }
    const last = growthData[growthData.length - 1];
    return { date: `${last.date.getFullYear()}.${last.date.getMonth() + 1}`, cumulative: last.cumulative };
  }, [progress, growthData]);

  const isComplete = progress >= 1;

  return (
    <div className="relative w-full cursor-pointer" onClick={onReplay}>
      <svg className="w-full h-auto" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <clipPath id="clip">
          <rect x={0} y={0} width={clipWidth} height={CHART.height} />
        </clipPath>

        {/* 里程碑线 - 只画到里程碑点的位置 */}
        {visibleMilestones.map(m => m.passed && (
          <line key={m.id} x1={m.x} y1={CHART.height - CHART.padding} x2={m.x} y2={m.y}
            stroke={m.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
        ))}

        {/* 区域 */}
        <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#clip)" />

        {/* 线条 */}
        <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
          strokeLinecap="round" clipPath="url(#clip)" />

        {/* 里程碑点 */}
        {visibleMilestones.map(m => m.passed && (
          <g key={m.id}>
            <circle cx={m.x} cy={m.y} r="4" fill="white" stroke={m.color} strokeWidth="2" />
            {point.x > m.x + 30 && (
              <text x={m.x} y={m.y - 12} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">{m.label}</text>
            )}
          </g>
        ))}

        {/* 追踪点与实时数据 */}
        {progress > 0 && point.x > 0 && !isComplete && (
          <g>
            {/* 垂直引导线 */}
            <line x1={point.x} y1={point.y} x2={point.x} y2={CHART.height - CHART.padding}
              stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

            {/* 追踪点 */}
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#3b82f6" strokeWidth="2.5" />

            {/* 实时数据标签 */}
            <g transform={`translate(${point.x}, ${point.y - 20})`}>
              <text textAnchor="middle" y="-8" fill="#94a3b8" fontSize="11">{currentData.date}</text>
              <text textAnchor="middle" y="6" fill="#3b82f6" fontSize="13" fontWeight="600">{formatNumber(currentData.cumulative)}</text>
            </g>
          </g>
        )}

        {/* 终点标记 */}
        {isComplete && point.x > 0 && (
          <g>
            <circle cx={point.x} cy={point.y} r="6" fill="#3b82f6" opacity="0.15" />
            <circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GrowthChart;
