import { useState, useRef, useEffect } from 'react';
import { formatNumber } from '../../../utils';
import { useGrowthData } from '../../../hooks/useGrowthData';
import { GrowthChart, EndingNarrative } from './ending';

const EndingSection = ({ upName = 'UP主', totalDays = 0, firstVideoPlays = 0, videos = [] }) => {
  const endingRef = useRef(null);
  const mainPath = useRef(null);
  const animationRef = useRef(null);
  const hasStartedRef = useRef(false);

  const [state, setState] = useState({ progress: 0, displayDays: '0', displayPlays: '0' });
  const [pathLength, setPathLength] = useState(1000);

  const { growthData, milestones, getPlayProgressAtTime, journeyLabels } = useGrowthData(videos);

  // 使用原生 IntersectionObserver，指定滚动容器为 root
  useEffect(() => {
    if (!endingRef.current || hasStartedRef.current) return;

    const scrollContainer = endingRef.current.closest('.growth-journey-overlay');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          observer.disconnect();

          // 启动动画
          if (mainPath.current) {
            setPathLength(mainPath.current.getTotalLength() || 1000);
          }

          const duration = 5000;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const t = Math.min((currentTime - startTime) / duration, 1);
            const progress = 1 - Math.pow(1 - t, 3);
            const animData = getPlayProgressAtTime(progress);

            setState({
              progress,
              displayDays: Math.floor(totalDays * progress).toLocaleString(),
              displayPlays: formatNumber(animData.cumulative)
            });

            if (t < 1) animationRef.current = requestAnimationFrame(animate);
          };

          animationRef.current = requestAnimationFrame(animate);
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

  return (
    <div ref={endingRef} className="ending-section relative min-h-screen flex flex-col justify-center px-4">
      {/* 图表 */}
      <div className="w-full max-w-[1400px] mx-auto">
        <GrowthChart
          growthData={growthData}
          milestones={milestones}
          progress={state.progress}
          pathLength={pathLength}
          onPathRef={(el) => { mainPath.current = el; }}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 px-12">
          <span>{journeyLabels.start}</span>
          <span>{journeyLabels.end}</span>
        </div>
      </div>

      {/* 结语 */}
      <div className="mt-6">
        <EndingNarrative
          upName={upName}
          journeyStartLabel={journeyLabels.start}
          displayDays={state.displayDays}
          displayPlays={state.displayPlays}
          firstVideoPlays={firstVideoPlays}
          videos={videos}
          totalDays={totalDays}
          isComplete={state.progress >= 1}
        />
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { r: 8; } 50% { r: 10; } }
        @keyframes expand { 0% { r: 8; opacity: 0.6; } 100% { r: 24; opacity: 0; } }
        .dot-pulse { animation: pulse 2s ease-in-out infinite; }
        .dot-expand { animation: expand 2s ease-out infinite; }
      `}</style>
    </div>
  );
};

export default EndingSection;
