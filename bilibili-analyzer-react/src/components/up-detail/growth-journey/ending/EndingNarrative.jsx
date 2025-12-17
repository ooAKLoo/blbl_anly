import { useMemo } from 'react';
import { formatNumber } from '../../../../utils';
import { generateMiniChartPaths } from '../../../../utils/chartUtils';

/**
 * 结语区域组件
 * 显示成长总结文案和更新频率统计
 */
const EndingNarrative = ({
  upName,
  journeyStartLabel,
  displayDays,
  firstVideoPlays,
  totalPlays,
  videos,
  totalDays,
  animationProgress
}) => {
  // 计算更新频率
  const avgPublishDays = useMemo(() => {
    if (!videos || videos.length < 2) return 0;
    return Math.round(totalDays / videos.length);
  }, [videos, totalDays]);

  const totalYears = Math.floor(totalDays / 365);
  const totalDaysRemainder = totalDays % 365;

  // 迷你图表路径
  const { linePath: miniChartPath, areaPath: miniChartAreaPath } = useMemo(() => 
    generateMiniChartPaths(videos),
    [videos]
  );

  const isComplete = animationProgress >= 1;

  return (
    <div className={`ending-footer animate-item ${isComplete ? 'is-visible' : ''}`} style={{ '--delay': '0.5s' }}>
      {/* 左侧：结语文字 */}
      <div className="ending-narrative">
        <p className="narrative-text">
          从 <strong>{journeyStartLabel}</strong> 的第一个视频开始，<br/>
          <span className="highlight">{upName}</span> 用 <strong>{displayDays}</strong> 天，<br/>
          将 <strong>{formatNumber(firstVideoPlays)}</strong> 播放变成了 <strong>{formatNumber(totalPlays)}</strong>。
        </p>
        {isComplete && (
          <p className="narrative-ending">
            故事还在继续。
          </p>
        )}
      </div>

      {/* 右侧：印戳 */}
      <div className={`rhythm-stamp ${isComplete ? 'is-visible' : ''}`}>
        <div className="stamp-header">
          <span className="stamp-number">{avgPublishDays}</span>
          <span className="stamp-unit">天/更</span>
        </div>
        <div className="stamp-chart">
          <svg viewBox="0 0 120 40" className="mini-line-chart">
            <path
              d={miniChartPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={miniChartAreaPath}
              fill="url(#miniGradient)"
            />
            <defs>
              <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="stamp-detail">
          {totalYears}年{totalDaysRemainder}天 · {videos?.length || 0}个作品
        </div>
      </div>
    </div>
  );
};

export default EndingNarrative;
