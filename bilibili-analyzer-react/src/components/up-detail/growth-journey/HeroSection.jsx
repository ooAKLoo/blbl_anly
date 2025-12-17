import { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatNumber, getImageUrl } from '../../../utils';
import { CountUp } from '../../common';

// 环绕标签布局
const ORBIT_LAYOUTS = {
  3: [{ angle: -90, radius: 115 }, { angle: 150, radius: 125 }, { angle: 30, radius: 125 }],
  4: [{ angle: -90, radius: 115 }, { angle: 0, radius: 130 }, { angle: 180, radius: 130 }, { angle: 90, radius: 120 }],
  5: [{ angle: -90, radius: 115 }, { angle: -18, radius: 130 }, { angle: 54, radius: 130 }, { angle: 126, radius: 130 }, { angle: 198, radius: 130 }],
};

const getOrbitPosition = (index, total) => {
  const layout = ORBIT_LAYOUTS[total] || ORBIT_LAYOUTS[5];
  const pos = layout[index] || { angle: -90 + index * (360 / total), radius: 125 };
  const rad = (pos.angle * Math.PI) / 180;
  return { x: Math.cos(rad) * pos.radius, y: Math.sin(rad) * pos.radius };
};

const HeroSection = ({
  upName = 'UP主',
  upFace = '',
  totalDays = 0,
  journeyStart = '',
  videoCount = 0,
  firstVideoPlays = 0,
  totalPlays = 0,
  growthMultiple = 1,
  creatorTags = [],
}) => {
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.3 });

  const narrativeContent = useMemo(() => {
    if (firstVideoPlays < 10000) {
      return { text: '从', highlight: formatNumber(firstVideoPlays), suffix: '次播放开始，一步步走到今天' };
    }
    return { text: '出道即巅峰，首个视频就收获', highlight: formatNumber(firstVideoPlays), suffix: '次播放' };
  }, [firstVideoPlays]);

  return (
    <header
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 25%, #fdf4ff 50%, #eff6ff 75%, #faf5ff 100%)' }}
    >
      {/* 简化的背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full opacity-50 blur-[80px] w-[400px] h-[400px] bg-gradient-to-br from-indigo-200 to-purple-200 -top-[10%] -left-[5%]" />
        <div className="absolute rounded-full opacity-50 blur-[80px] w-[300px] h-[300px] bg-gradient-to-br from-pink-200 to-rose-100 top-[20%] -right-[10%]" />
      </div>

      {/* 主内容 */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {/* 左侧信息 */}
        <motion.div
          className="flex-1 flex flex-col gap-8"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col gap-3">
            <span className="inline-block px-3 py-1 text-xs font-medium uppercase rounded-full bg-black/[0.04] text-slate-400 tracking-widest w-fit">
              成长历程
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-indigo-950">
              {upName}
              <span className="block mt-1 font-normal text-slate-600 text-[0.65em]">的创作故事</span>
            </h1>
          </div>

          <div className="flex items-end gap-4">
            <div className="text-7xl md:text-8xl font-black text-indigo-950 leading-none tracking-tighter tabular-nums">
              <CountUp end={totalDays} duration={2500} startOnVisible={isInView} />
            </div>
            <div className="flex flex-col pb-3">
              <span className="text-lg font-medium text-indigo-950">天的坚持</span>
              <span className="text-sm text-slate-400">始于 {journeyStart}</span>
            </div>
          </div>

          <div className="py-4 pl-5 border-l-2 border-indigo-500">
            <p className="text-base leading-relaxed text-slate-600">
              {narrativeContent.text} <span className="font-semibold text-indigo-950">{narrativeContent.highlight}</span> {narrativeContent.suffix}
            </p>
          </div>

          {/* 数据卡片 */}
          <div className="flex flex-wrap gap-3">
            <div
              className="flex-1 min-w-[90px] p-4 rounded-xl text-center text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}
            >
              <div className="text-2xl font-bold tabular-nums">
                <CountUp end={totalPlays} duration={3000} startOnVisible={isInView} formatFn={formatNumber} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide opacity-90">累计播放</div>
            </div>
            <div className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 backdrop-blur-sm border border-white/50">
              <div className="text-2xl font-bold text-indigo-950 tabular-nums">
                <CountUp end={videoCount} duration={2000} startOnVisible={isInView} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">个作品</div>
            </div>
            <div className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 backdrop-blur-sm border border-white/50">
              <div className="text-2xl font-bold text-indigo-950 tabular-nums">
                <CountUp end={growthMultiple} duration={2000} decimals={0} startOnVisible={isInView} />
                <span className="text-base font-medium text-slate-400">x</span>
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">播放增长</div>
            </div>
          </div>
        </motion.div>

        {/* 右侧头像 */}
        <motion.div
          className="relative flex-1 flex items-center justify-center min-h-[260px] md:min-h-[400px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative w-60 h-60 md:w-80 md:h-80">
            {/* 头像 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              {upFace ? (
                <img
                  src={getImageUrl(upFace)}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover"
                  style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.8), 0 0 0 6px rgba(99,102,241,0.2), 0 20px 40px rgba(99,102,241,0.2)' }}
                  referrerPolicy="no-referrer"
                  alt=""
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-2xl md:text-4xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 0 4px rgba(255,255,255,0.8), 0 20px 40px rgba(99,102,241,0.2)' }}
                >
                  {upName.charAt(0)}
                </div>
              )}
            </div>

            {/* 环绕标签 */}
            <div className="absolute top-1/2 left-1/2">
              {isInView && creatorTags.map((tag, index) => {
                const pos = getOrbitPosition(index, creatorTags.length);
                return (
                  <motion.span
                    key={tag.text}
                    className="absolute px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap bg-white text-slate-600 border border-indigo-500/15 shadow-sm hover:bg-indigo-500 hover:text-white transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, x: `calc(-50% + ${pos.x}px)`, y: `calc(-50% + ${pos.y}px)` }}
                    transition={{ delay: 0.5 + index * 0.08, duration: 0.4 }}
                  >
                    {tag.text}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 滚动提示 */}
      <motion.div
        className="absolute bottom-10 flex flex-col items-center gap-2 text-sm text-slate-400"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span className="tracking-wide">向下探索 TA 的故事</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </header>
  );
};

export default HeroSection;
