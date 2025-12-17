import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { formatNumber } from '../../../utils';
import { useGrowthData } from '../../../hooks/useGrowthData';
import { GrowthChart, EndingNarrative } from './ending';

const INITIAL_STATE = { progress: 0, displayDays: '0', displayPlays: '0' };

const EndingSection = forwardRef(({
  upName = 'UP主',
  totalDays = 0,
  firstVideoPlays = 0,
  videos = []
}, ref) => {
  const endingRef = useRef(null);
  const mainPath = useRef(null);
  const animationFrameRef = useRef(null);
  const isInView = useInView(endingRef, { once: false, amount: 0.3 });

  const [hasAnimated, setHasAnimated] = useState(false);
  const [state, setState] = useState(INITIAL_STATE);
  const [pathLength, setPathLength] = useState(1000);

  const { growthData, milestones, getPlayProgressAtTime, journeyLabels } = useGrowthData(videos);

  // 启动动画
  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);

      setTimeout(() => {
        if (mainPath.current) {
          setPathLength(mainPath.current.getTotalLength() || 1000);
        }

        const duration = 8000;
        const startTime = performance.now();

        const animate = (currentTime) => {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const animData = getPlayProgressAtTime(progress);

          setState({
            progress,
            displayDays: Math.floor(totalDays * progress).toLocaleString(),
            displayPlays: formatNumber(animData.cumulative)
          });

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      }, 500);
    }
  }, [isInView, hasAnimated, getPlayProgressAtTime, totalDays]);

  // 清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 重置方法
  const reset = useCallback(() => {
    setHasAnimated(false);
    setState(INITIAL_STATE);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  return (
    <motion.div
      ref={endingRef}
      className="relative h-screen flex flex-col justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: hasAnimated ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
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
    </motion.div>
  );
});

EndingSection.displayName = 'EndingSection';
export default EndingSection;
