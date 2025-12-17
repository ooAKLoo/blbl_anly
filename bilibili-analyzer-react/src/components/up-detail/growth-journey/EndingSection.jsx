import { useState, useRef, useEffect, useMemo } from 'react';
import { formatNumber } from '../../../utils';
import { generateMiniChartPaths } from '../../../utils/chartUtils';
import { useGrowthData } from '../../../hooks/useGrowthData';
import { GrowthChart } from './ending';

const EndingSection = ({ upName = 'UP主', totalDays = 0, firstVideoPlays = 0, videos = [] }) => {
  const endingRef = useRef(null);
  const animationRef = useRef(null);
  const hasStartedRef = useRef(false);

  const [state, setState] = useState({ progress: 0, displayDays: '0', displayPlays: '0' });

  const { growthData, milestones, getPlayProgressAtTime, journeyLabels } = useGrowthData(videos);

  // 迷你图表数据
  const avgDays = useMemo(() => {
    if (!videos || videos.length < 2) return 0;
    return Math.round(totalDays / videos.length);
  }, [videos, totalDays]);

  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;
  const { linePath, areaPath } = useMemo(() => generateMiniChartPaths(videos), [videos]);

  // 播放动画 - 线性时间驱动
  // 早期视频稀疏 → 点移动慢 → 感受创作初期的沉淀
  const playAnimation = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    setState({ progress: 0, displayDays: '0', displayPlays: '0' });

    const duration = 10000; // 延长到 10 秒
    const startTime = performance.now();

    const animate = (currentTime) => {
      const t = Math.min((currentTime - startTime) / duration, 1);
      // 平滑缓动
      const easedT = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // 直接用时间进度，点位与时间轴同步
      const timeProgress = easedT;
      const animData = getPlayProgressAtTime(timeProgress);

      setState({
        progress: timeProgress,
        displayDays: Math.floor(totalDays * timeProgress).toLocaleString(),
        displayPlays: formatNumber(animData.cumulative)
      });

      if (t < 1) animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // 使用原生 IntersectionObserver，指定滚动容器为 root
  useEffect(() => {
    if (!endingRef.current || hasStartedRef.current) return;

    const scrollContainer = endingRef.current.closest('.growth-journey-overlay');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          observer.disconnect();
          playAnimation();
        }
      },
      { root: scrollContainer, threshold: 0.15 }
    );

    observer.observe(endingRef.current);
    return () => {
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [getPlayProgressAtTime, totalDays]);

  const isComplete = state.progress >= 1;

  return (
    <div ref={endingRef} className="ending-section relative min-h-screen flex flex-col justify-center px-4 overflow-hidden">
      {/* 主内容区 - 动画时放大，完成后恢复正常大小并上移 */}
      <div className={`transition-all duration-1000 ease-out origin-center ${isComplete ? 'scale-100 -translate-y-16' : 'scale-[1.08] translate-y-0'}`}>
        {/* 图表 */}
        <div className="w-full max-w-[1100px] mx-auto">
          <GrowthChart
            growthData={growthData}
            milestones={milestones}
            progress={state.progress}
            onReplay={playAnimation}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2" style={{ paddingLeft: '4.17%', paddingRight: '4.17%' }}>
            <span>{journeyLabels.start}</span>
            <span>{journeyLabels.end}</span>
          </div>
        </div>
      </div>

      {/* 底部信息区 - 结语 + 统计，形成水平布局 */}
      <div className={`absolute bottom-0 left-0 right-0 px-8 pb-10 transition-all duration-700 ${isComplete ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-[1100px] mx-auto flex items-end justify-between">
          {/* 左侧：结语文字 */}
          <div className="max-w-2xl">
            <p className="text-base text-slate-500 leading-relaxed">
              从 <span className="text-slate-700">{journeyLabels.start}</span> 的第一个视频开始，
              <span className="text-blue-600">{upName}</span> 用 <span className="text-slate-700 tabular-nums">{state.displayDays}</span> 天，
              将 <span className="text-slate-700">{formatNumber(firstVideoPlays)}</span> 播放变成了 <span className="text-blue-600 tabular-nums">{state.displayPlays}</span>。
            </p>
            <p className="text-sm text-slate-400 mt-3 italic">故事还在继续。</p>
          </div>

          {/* 右侧：统计数据 */}
          <div className="flex items-end gap-4 opacity-60">
            <svg viewBox="0 0 100 40" className="w-20 h-8">
              <defs>
                <linearGradient id="miniGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#miniGrad)" />
              <path d={linePath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-xl font-semibold text-slate-400 tabular-nums">{avgDays}</span>
                <span className="text-xs text-slate-400">天/更</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{years}年{days}天 · {videos?.length || 0}作品</div>
            </div>
          </div>
        </div>
      </div>

      {/* 动画进行中的实时数据显示 */}
      <div className={`absolute bottom-0 left-0 right-0 pb-12 text-center transition-opacity duration-300 ${state.progress > 0 && !isComplete ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-base text-slate-500 leading-relaxed">
          从 <span className="text-slate-700">{journeyLabels.start}</span> 的第一个视频开始，
          <span className="text-blue-600">{upName}</span> 用 <span className="text-slate-700 tabular-nums">{state.displayDays}</span> 天，
          将 <span className="text-slate-700">{formatNumber(firstVideoPlays)}</span> 播放变成了 <span className="text-blue-600 tabular-nums">{state.displayPlays}</span>。
        </p>
      </div>
    </div>
  );
};

export default EndingSection;
