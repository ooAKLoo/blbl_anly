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

  const posPercent = point.x > 0 ? ((point.x - CHART.padding) / (CHART.width - CHART.padding * 2)) * 100 : 0;

  return (
    <div className="relative w-full cursor-pointer" onClick={onReplay}>
      {/* 跟随圆点的数据显示 */}
      {progress > 0 && progress < 1 && point.x > 0 && (
        <div className="absolute top-2 z-10 -translate-x-1/2 pointer-events-none" style={{ left: `${posPercent}%` }}>
          <div className="text-xs text-slate-400">{currentData.date}</div>
          <div className="text-sm font-bold text-blue-600 tabular-nums">{formatNumber(currentData.cumulative)}</div>
        </div>
      )}

      <svg className="w-full h-auto" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <clipPath id="clip">
          <rect x={0} y={0} width={clipWidth} height={CHART.height} />
        </clipPath>

        {/* 里程碑线 - 只画到里程碑点的位置 */}
        {visibleMilestones.map(m => m.passed && (
          <line key={m.id} x1={m.x} y1={CHART.height - CHART.padding} x2={m.x} y2={m.y}
            stroke={m.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        ))}

        {/* 区域 */}
        <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#clip)" />

        {/* 线条 - 用 clipPath 裁剪，与 tracking dot 使用同一个 clipWidth */}
        <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3"
          strokeLinecap="round" clipPath="url(#clip)" />

        {/* 里程碑点 */}
        {visibleMilestones.map(m => m.passed && (
          <g key={m.id}>
            <circle cx={m.x} cy={m.y} r="6" fill={m.color} />
            {point.x > m.x + 20 && (
              <text x={m.x} y={m.y - 16} textAnchor="middle" fill="#64748b" fontSize="12">{m.label}</text>
            )}
          </g>
        ))}

        {/* 追踪点 */}
        {progress > 0 && point.x > 0 && (
          <g>
            <circle cx={point.x} cy={point.y} r="6" fill="#3b82f6" className="dot-pulse" />
            <circle cx={point.x} cy={point.y} r="6" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.4" className="dot-expand" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GrowthChart;
