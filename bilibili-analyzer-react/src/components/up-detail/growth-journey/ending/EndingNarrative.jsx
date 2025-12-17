import { useMemo } from 'react';
import { formatNumber } from '../../../../utils';
import { generateMiniChartPaths } from '../../../../utils/chartUtils';

const EndingNarrative = ({
  upName,
  journeyStartLabel,
  displayDays,
  displayPlays,
  firstVideoPlays,
  videos,
  totalDays,
  isComplete
}) => {
  const avgDays = useMemo(() => {
    if (!videos || videos.length < 2) return 0;
    return Math.round(totalDays / videos.length);
  }, [videos, totalDays]);

  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;

  const { linePath, areaPath } = useMemo(() => generateMiniChartPaths(videos), [videos]);

  return (
    <>
      <div className="text-center">
        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
          从 <strong className="text-slate-800">{journeyStartLabel}</strong> 的第一个视频开始，
          <span className="text-blue-600 font-medium">{upName}</span> 用 <strong className="text-slate-800 tabular-nums">{displayDays}</strong> 天，
          将 <strong className="text-slate-800">{formatNumber(firstVideoPlays)}</strong> 播放变成了 <strong className="text-blue-600 tabular-nums">{displayPlays}</strong>。
        </p>
        {isComplete && <p className="text-sm text-slate-400 mt-2 italic">故事还在继续。</p>}
      </div>

      {/* 右下角迷你图表 */}
      <div className={`absolute right-8 bottom-8 transition-opacity duration-500 ${isComplete ? 'opacity-50' : 'opacity-0'}`}>
        <div className="flex items-end gap-3">
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl font-bold text-slate-400 tabular-nums">{avgDays}</span>
              <span className="text-xs text-slate-400">天/更</span>
            </div>
            <div className="text-[10px] text-slate-400">{years}年{days}天 · {videos?.length || 0}作品</div>
          </div>
          <svg viewBox="0 0 100 40" className="w-24 h-10">
            <defs>
              <linearGradient id="miniGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#miniGrad)" />
            <path d={linePath} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default EndingNarrative;
