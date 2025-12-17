import { useState, useRef, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { formatNumber } from '../../../utils';
import { useGrowthData } from '../../../hooks/useGrowthData';
import { GrowthChart, EndingNarrative } from './ending';

// ============ 动画状态管理 ============

const INITIAL_ANIMATION_STATE = {
  progress: 0,
  displayDays: '0',
  displayPlays: '0',
  displayGrowth: '1.0'
};

// ============ 动画变体 ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 120 },
  },
};

const dividerVariants = {
  hidden: { width: 0, opacity: 0 },
  visible: {
    width: '8rem',
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const chartVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 80, delay: 0.2 },
  },
};

const statPillVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 120, delay: 0.4 + i * 0.1 },
  }),
};

const replayButtonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: {
    y: -2,
    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.2)',
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
  tap: { scale: 0.98 },
};

// ============ 主组件 ============

const EndingSection = forwardRef(({
  upName = 'UP主',
  totalDays = 0,
  firstVideoPlays = 0,
  totalPlays = 0,
  videos = [],
  growthMultiple = 1
}, ref) => {
  const endingRef = useRef(null);
  const mainPath = useRef(null);
  const isInView = useInView(endingRef, { once: false, amount: 0.3 });

  const [hasAnimated, setHasAnimated] = useState(false);
  const [animationState, setAnimationState] = useState(INITIAL_ANIMATION_STATE);
  const [pathLength, setPathLength] = useState(1000);

  const animationFrameRef = useRef(null);
  const startAnimationRef = useRef(null);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      setTimeout(() => {
        startAnimationRef.current?.();
      }, 500);
    }
  }, [isInView, hasAnimated]);

  // ============ 数据计算 ============

  const { growthData, milestones, getPlayProgressAtTime, journeyLabels } = useGrowthData(videos);

  // ============ 动画逻辑 ============

  const animateNumbers = useCallback((timeProgress) => {
    const animData = getPlayProgressAtTime(timeProgress);
    setAnimationState({
      progress: timeProgress,
      displayDays: Math.floor(totalDays * timeProgress).toLocaleString(),
      displayPlays: formatNumber(animData.cumulative),
      displayGrowth: (growthMultiple * animData.playProgress).toFixed(1)
    });
  }, [getPlayProgressAtTime, totalDays, growthMultiple]);

  const startAnimation = useCallback(() => {
    if (!hasAnimated) return;

    const duration = 8000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const timeProgress = Math.min(elapsed / duration, 1);

      animateNumbers(timeProgress);

      if (timeProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    setTimeout(() => {
      if (mainPath.current) {
        setPathLength(mainPath.current.getTotalLength() || 1000);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 0);
  }, [hasAnimated, animateNumbers]);

  useEffect(() => {
    startAnimationRef.current = startAnimation;
  }, [startAnimation]);

  const replay = useCallback(() => {
    setAnimationState(INITIAL_ANIMATION_STATE);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setTimeout(() => {
      startAnimationRef.current?.();
    }, 300);
  }, []);

  // ============ 重置方法 ============

  const reset = useCallback(() => {
    setHasAnimated(false);
    setAnimationState(INITIAL_ANIMATION_STATE);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const setupObserver = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
    setupObserver
  }), [reset, setupObserver]);

  // ============ 派生状态 ============

  const isComplete = animationState.progress >= 1;

  // ============ 渲染 ============

  return (
    <motion.div
      ref={endingRef}
      className="text-center min-h-screen flex flex-col justify-center py-16"
      variants={containerVariants}
      initial="hidden"
      animate={hasAnimated ? 'visible' : 'hidden'}
    >
      {/* 分割线 */}
      <motion.div
        className="h-px mx-auto mb-10"
        style={{ background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)' }}
        variants={dividerVariants}
      />

      {/* 核心可视化区域 */}
      <motion.div
        className="w-full max-w-[1400px] mx-auto px-4 mb-12"
        variants={chartVariants}
      >
        <GrowthChart
          growthData={growthData}
          milestones={milestones}
          animationProgress={animationState.progress}
          pathLength={pathLength}
          onPathRef={(el) => { mainPath.current = el; }}
        />

        {/* 时间轴 */}
        <div className="flex justify-between text-sm text-slate-400 mt-4 px-16">
          <span>{journeyLabels.start}</span>
          <span>{journeyLabels.end}</span>
        </div>
      </motion.div>

      {/* 核心数据展示 */}
      <motion.div
        className={`mb-6 transition-opacity ${isComplete ? 'opacity-100' : 'opacity-70'}`}
        variants={fadeUpVariants}
      >
        <motion.div
          className="inline-flex flex-col items-center"
          animate={{ opacity: isComplete ? 1 : 0.7, scale: isComplete ? 1 : 0.98 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <span
            className="text-5xl sm:text-6xl font-bold text-blue-600 tabular-nums font-serif tracking-tight"
            style={{ textShadow: '0 4px 30px rgba(59, 130, 246, 0.25)' }}
          >
            {animationState.displayPlays}
          </span>
          <span className="text-sm text-slate-500 mt-2">累积播放</span>
        </motion.div>
      </motion.div>

      {/* 次要数据 */}
      <motion.div
        className="flex justify-center items-center gap-3 mb-10 flex-wrap"
        variants={fadeUpVariants}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
          custom={0}
          variants={statPillVariants}
        >
          <span className="text-base font-semibold text-slate-700 tabular-nums">{animationState.displayDays}</span>
          <span className="text-sm text-slate-500">天</span>
        </motion.div>
        <motion.div
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
          custom={1}
          variants={statPillVariants}
        >
          <span className="text-base font-semibold text-slate-700 tabular-nums">{videos?.length || 0}</span>
          <span className="text-sm text-slate-500">个作品</span>
        </motion.div>
        {growthMultiple > 1 && (
          <motion.div
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-amber-300"
            style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
            custom={2}
            variants={statPillVariants}
          >
            <span className="text-base font-semibold text-amber-600 tabular-nums">{animationState.displayGrowth}x</span>
            <span className="text-sm text-amber-700">成长</span>
          </motion.div>
        )}
      </motion.div>

      {/* 结语区域 */}
      <EndingNarrative
        upName={upName}
        journeyStartLabel={journeyLabels.start}
        displayDays={animationState.displayDays}
        firstVideoPlays={firstVideoPlays}
        totalPlays={totalPlays}
        videos={videos}
        totalDays={totalDays}
        animationProgress={animationState.progress}
      />

      {/* 重播按钮 */}
      <AnimatePresence>
        {isComplete && (
          <motion.button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-slate-500 font-medium border border-slate-200 cursor-pointer hover:text-blue-600 hover:border-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}
            onClick={replay}
            variants={replayButtonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileHover="hover"
            whileTap="tap"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            再看一次
          </motion.button>
        )}
      </AnimatePresence>

      {/* 动画样式 */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { r: 8; }
          50% { r: 10; }
        }
        @keyframes pulseExpand {
          0% { r: 8; opacity: 0.6; }
          100% { r: 30; opacity: 0; }
        }
        .current-dot { animation: dotPulse 2s ease-in-out infinite; }
        .pulse-ring { animation: pulseExpand 2s ease-out infinite; }
        .pulse-ring-2 { animation: pulseExpand 2s ease-out infinite 0.5s; }
      `}</style>
    </motion.div>
  );
});

EndingSection.displayName = 'EndingSection';

export default EndingSection;
