import { useMemo } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { formatNumber, getImageUrl } from '../../../../utils';
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

  // 里程碑 - 计算百分比位置用于绝对定位
  const visibleMilestones = useMemo(() => {
    if (scaledPoints.length === 0) return [];
    const maxY = Math.max(...growthData.map(d => d.cumulative));
    const chartW = CHART.width - CHART.padding * 2;
    const chartH = CHART.height - CHART.padding * 2;

    return milestones.map(m => {
      const x = CHART.padding + m.timeProgress * chartW;
      const y = CHART.height - CHART.padding - (m.cumulative / maxY) * chartH;
      const passed = point.x >= x;
      // 转换为百分比用于 HTML 绝对定位
      const xPercent = (x / CHART.width) * 100;
      const yPercent = (y / CHART.height) * 100;
      return { ...m, x, y, xPercent, yPercent, passed };
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

      {/* 里程碑点 - HTML 绝对定位 + HoverCard */}
      {visibleMilestones.map(m => m.passed && (
        <HoverCard.Root key={m.id} openDelay={100} closeDelay={100}>
          <HoverCard.Trigger asChild>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${m.xPercent}%`, top: `${m.yPercent}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-2 h-2 rounded-full bg-white border-2 transition-transform hover:scale-150"
                style={{ borderColor: m.color }}
              />
              {/* 里程碑标签 */}
              {point.x > m.x + 30 && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-5 text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {m.label}
                </span>
              )}
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="w-72 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-0 overflow-hidden z-50"
              sideOffset={8}
            >
              {m.video && (
                <>
                  {/* 封面图 */}
                  <div className="relative aspect-video bg-slate-100">
                    <img
                      src={getImageUrl(m.video.cover)}
                      alt={m.video.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* 里程碑标签 */}
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.label}
                    </div>
                  </div>
                  {/* 视频信息 */}
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                      {m.video.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{new Date(m.video.publish_time).toLocaleDateString('zh-CN')}</span>
                      <span>·</span>
                      <span>{formatNumber(m.video.play_count || 0)} 播放</span>
                      {m.video.like_count != null && (
                        <>
                          <span>·</span>
                          <span>{formatNumber(m.video.like_count)} 点赞</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                      累计播放达到 <span className="text-slate-600 font-medium">{formatNumber(m.cumulative)}</span>
                    </div>
                  </div>
                </>
              )}
              <HoverCard.Arrow className="fill-white" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      ))}
    </div>
  );
};

export default GrowthChart;
