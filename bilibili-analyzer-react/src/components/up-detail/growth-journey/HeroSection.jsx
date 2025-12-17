import { useRef, forwardRef, useImperativeHandle, useCallback, useMemo, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatNumber, getImageUrl } from '../../../utils';
import { CountUp } from '../../common';

// ============ 配置常量 ============

// 环绕标签布局配置：key 为标签数量
const ORBIT_LAYOUTS = {
  3: [
    { angle: -90, radius: 115 },
    { angle: 150, radius: 125 },
    { angle: 30, radius: 125 },
  ],
  4: [
    { angle: -90, radius: 115 },
    { angle: 0, radius: 130 },
    { angle: 180, radius: 130 },
    { angle: 90, radius: 120 },
  ],
  5: [
    { angle: -90, radius: 115 },
    { angle: -18, radius: 130 },
    { angle: 54, radius: 130 },
    { angle: 126, radius: 130 },
    { angle: 198, radius: 130 },
  ],
};

// ============ 动画变体 ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const slideInLeftVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 120 },
  },
};

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100, delay: 0.3 },
  },
};

const scrollHintVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 120 },
  },
  hover: {
    y: -4,
    boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)',
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
};

// ============ 主组件 ============

const HeroSection = forwardRef(({
  upName = 'UP主',
  upFace = '',
  totalDays = 0,
  journeyStart = '',
  videoCount = 0,
  firstVideoPlays = 0,
  totalPlays = 0,
  growthMultiple = 1,
  creatorTags = [],
}, ref) => {
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: false, amount: 0.3 });
  const [hasAnimated, setHasAnimated] = useState(false);

  if (isInView && !hasAnimated) {
    setHasAnimated(true);
  }

  // ============ 计算环绕标签位置 ============

  const getOrbitPosition = useCallback((index, total) => {
    const layout = ORBIT_LAYOUTS[total] || ORBIT_LAYOUTS[5];
    const pos = layout[index] || { angle: -90 + index * (360 / total), radius: 125 };
    const angleRad = (pos.angle * Math.PI) / 180;
    return {
      x: Math.cos(angleRad) * pos.radius,
      y: Math.sin(angleRad) * pos.radius,
      delay: 0.5 + index * 0.08,
    };
  }, []);

  // ============ 重置方法 ============

  const reset = useCallback(() => setHasAnimated(false), []);
  const setupObserver = useCallback(() => {}, []);

  useImperativeHandle(ref, () => ({ reset, setupObserver }), [reset, setupObserver]);

  // ============ 叙事文案计算 ============

  const narrativeContent = useMemo(() => {
    if (firstVideoPlays < 10000) {
      return {
        text: '从',
        highlight: formatNumber(firstVideoPlays),
        suffix: '次播放开始，一步步走到今天'
      };
    }
    return {
      text: '出道即巅峰，首个视频就收获',
      highlight: formatNumber(firstVideoPlays),
      suffix: '次播放'
    };
  }, [firstVideoPlays]);

  // ============ 渲染 ============

  return (
    <header
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 25%, #fdf4ff 50%, #eff6ff 75%, #faf5ff 100%)',
      }}
    >
      {/* 梦幻背景装饰 */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* 漂浮光斑 */}
        <div
          className="absolute rounded-full opacity-60 animate-blob"
          style={{
            width: 400, height: 400,
            background: 'linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%)',
            top: '-10%', left: '-5%',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute rounded-full opacity-60 animate-blob"
          style={{
            width: 350, height: 350,
            background: 'linear-gradient(135deg, #fbcfe8 0%, #fce7f3 100%)',
            top: '20%', right: '-10%',
            filter: 'blur(80px)',
            animationDelay: '-5s',
            animationDuration: '25s',
          }}
        />
        <div
          className="absolute rounded-full opacity-60 animate-blob"
          style={{
            width: 300, height: 300,
            background: 'linear-gradient(135deg, #bae6fd 0%, #e0f2fe 100%)',
            bottom: '-5%', left: '30%',
            filter: 'blur(80px)',
            animationDelay: '-10s',
            animationDuration: '22s',
          }}
        />
        <div
          className="absolute rounded-full opacity-60 animate-blob"
          style={{
            width: 250, height: 250,
            background: 'linear-gradient(135deg, #d9f99d 0%, #ecfccb 100%)',
            bottom: '20%', right: '20%',
            filter: 'blur(80px)',
            animationDelay: '-15s',
            animationDuration: '28s',
          }}
        />
        {/* 闪烁星星 */}
        <div
          className="absolute rounded-full animate-sparkle"
          style={{
            width: 6, height: 6,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)',
            top: '15%', left: '20%',
          }}
        />
        <div
          className="absolute rounded-full animate-sparkle"
          style={{
            width: 8, height: 8,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)',
            top: '40%', right: '15%',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute rounded-full animate-sparkle"
          style={{
            width: 5, height: 5,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)',
            bottom: '30%', left: '40%',
            animationDelay: '2s',
          }}
        />
      </div>

      {/* 主内容区：左右分栏 */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16"
        variants={containerVariants}
        initial="hidden"
        animate={hasAnimated ? 'visible' : 'hidden'}
      >
        {/* 左侧：核心信息 */}
        <div className="flex-1 flex flex-col gap-8">
          {/* UP主名称 + 标签 */}
          <motion.div className="flex flex-col gap-3" variants={slideInLeftVariants}>
            <span className="inline-block px-3 py-1 text-xs font-medium uppercase rounded-full bg-black/[0.04] text-slate-400 tracking-widest w-fit">
              成长历程
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-indigo-950">
              <span>{upName}</span>
              <span className="block mt-1 font-normal text-slate-600 text-[0.65em]">的创作故事</span>
            </h1>
          </motion.div>

          {/* 核心数字：天数 */}
          <motion.div className="flex items-end gap-4" variants={slideInLeftVariants}>
            <div className="text-7xl md:text-8xl font-black text-indigo-950 leading-none tracking-tighter tabular-nums">
              <CountUp end={totalDays} duration={2500} startOnVisible={hasAnimated} />
            </div>
            <div className="flex flex-col pb-3">
              <span className="text-lg font-medium text-indigo-950">天的坚持</span>
              <span className="text-sm text-slate-400">始于 {journeyStart}</span>
            </div>
          </motion.div>

          {/* 情感叙事 */}
          <motion.div className="py-4 pl-5 border-l-2 border-indigo-500" variants={slideInLeftVariants}>
            <p className="text-base leading-relaxed text-slate-600">
              {narrativeContent.text}{' '}
              <span className="font-semibold text-indigo-950">{narrativeContent.highlight}</span>{' '}
              {narrativeContent.suffix}
            </p>
          </motion.div>

          {/* 成长数据卡片 */}
          <motion.div className="flex flex-wrap gap-3" variants={slideInLeftVariants}>
            <motion.div
              className="flex-1 min-w-[90px] p-4 rounded-xl text-center text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 24px rgba(99, 102, 241, 0.3)',
              }}
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-2xl font-bold tracking-tight tabular-nums">
                <CountUp end={totalPlays} duration={3000} startOnVisible={hasAnimated} formatFn={formatNumber} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide opacity-90">累计播放</div>
            </motion.div>
            <motion.div
              className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 backdrop-blur-sm border border-white/50 shadow-md"
              style={{ boxShadow: '0 4px 24px rgba(99, 102, 241, 0.08)' }}
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-2xl font-bold text-indigo-950 tracking-tight tabular-nums">
                <CountUp end={videoCount} duration={2000} startOnVisible={hasAnimated} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">个作品</div>
            </motion.div>
            <motion.div
              className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 backdrop-blur-sm border border-white/50 shadow-md"
              style={{ boxShadow: '0 4px 24px rgba(99, 102, 241, 0.08)' }}
              variants={statCardVariants}
              whileHover="hover"
            >
              <div className="text-2xl font-bold text-indigo-950 tracking-tight tabular-nums">
                <CountUp end={growthMultiple} duration={2000} decimals={0} startOnVisible={hasAnimated} />
                <span className="text-base font-medium text-slate-400">x</span>
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">播放增长</div>
            </motion.div>
          </motion.div>
        </div>

        {/* 右侧：头像 + 环绕标签 */}
        <div className="relative flex-1 flex items-center justify-center min-h-[260px] md:min-h-[400px] md:-mr-30">
          <div className="relative w-60 h-60 md:w-80 md:h-80">
            {/* 中心头像 */}
            <motion.div
              className="absolute top-1/2 left-1/2 z-10"
              variants={avatarVariants}
              initial="hidden"
              animate={hasAnimated ? 'visible' : 'hidden'}
              style={{ x: '-50%', y: '-50%' }}
            >
              {upFace ? (
                <img
                  src={getImageUrl(upFace)}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover"
                  style={{
                    boxShadow: '0 0 0 4px rgba(255,255,255,0.8), 0 0 0 6px rgba(99,102,241,0.2), 0 20px 40px rgba(99,102,241,0.2)',
                  }}
                  referrerPolicy="no-referrer"
                  alt=""
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-2xl md:text-4xl font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 0 0 4px rgba(255,255,255,0.8), 0 0 0 6px rgba(99,102,241,0.2), 0 20px 40px rgba(99,102,241,0.2)',
                  }}
                >
                  {upName.charAt(0)}
                </div>
              )}
            </motion.div>

            {/* 环绕标签 */}
            <div className="absolute top-1/2 left-1/2">
              <AnimatePresence>
                {hasAnimated && creatorTags.map((tag, index) => {
                  const pos = getOrbitPosition(index, creatorTags.length);
                  return (
                    <motion.span
                      key={tag.text}
                      className="absolute px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap bg-white text-slate-600 border border-indigo-500/15 shadow-sm cursor-default hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent hover:shadow-lg transition-colors"
                      initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: `calc(-50% + ${pos.x}px)`,
                        y: `calc(-50% + ${pos.y}px)`,
                      }}
                      transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 100,
                        delay: pos.delay,
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {tag.text}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 滚动提示 */}
      <motion.div
        className="absolute bottom-10 flex flex-col items-center gap-2 text-sm text-slate-400"
        variants={scrollHintVariants}
        initial="hidden"
        animate={hasAnimated ? 'visible' : 'hidden'}
      >
        <span className="tracking-wide">向下探索 TA 的故事</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>

      {/* 动画 keyframes - 需要在 tailwind.config.js 中配置或使用 style 标签 */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { transform: translate(30px, -30px) rotate(5deg) scale(1.05); }
          50% { transform: translate(-20px, 20px) rotate(-5deg) scale(0.95); }
          75% { transform: translate(10px, 10px) rotate(3deg) scale(1.02); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-blob { animation: blob 20s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
      `}</style>
    </header>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
