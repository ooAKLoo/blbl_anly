import { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
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
  const [isVisible, setIsVisible] = useState(false);

  const narrativeContent = useMemo(() => {
    if (firstVideoPlays < 10000) {
      return { text: '从', highlight: formatNumber(firstVideoPlays), suffix: '次播放开始，一步步走到今天' };
    }
    return { text: '出道即巅峰，首个视频就收获', highlight: formatNumber(firstVideoPlays), suffix: '次播放' };
  }, [firstVideoPlays]);

  // IntersectionObserver 替代 framer-motion useInView
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 提前测量右栏偏移（layout 阶段，避免动画帧内强制回流）
  const centerOffsetRef = useRef(0);
  useLayoutEffect(() => {
    const rightCol = heroRef.current?.querySelector('[data-anim="right-col"]');
    if (!rightCol) return;
    const rect = rightCol.getBoundingClientRect();
    centerOffsetRef.current = (window.innerWidth / 2) - (rect.left + rect.width / 2);
  }, []);

  // GSAP 电影式分幕动画
  useEffect(() => {
    if (!isVisible || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

      // ── 初始态：右栏偏移到屏幕中央 ──
      const rightCol = heroRef.current.querySelector('[data-anim="right-col"]');
      gsap.set(rightCol, { x: centerOffsetRef.current });

      // ══════════════════════════════════════════
      // Phase 1 — 聚焦 (0 ~ 1.0s)
      // 头像独占画面正中，用户视线锁定人物
      // ══════════════════════════════════════════

      // 光斑只做 opacity（不做 scale，避免模糊元素重绘）
      tl.fromTo(
        '[data-anim="blob"]',
        { opacity: 0 },
        { opacity: 0.5, duration: 1.0, stagger: 0.15, ease: 'power2.out' },
        0
      );
      tl.fromTo(
        '[data-anim="avatar"]',
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.8)' },
        0.15
      );

      // ══════════════════════════════════════════
      // Phase 2 — 头像右移 + 身份揭示 (1.0 ~ 2.0s)
      // ══════════════════════════════════════════
      tl.to(rightCol, { x: 0, duration: 1.0, ease: 'power2.inOut' }, 1.0);

      tl.fromTo('[data-anim="badge"]',
        { xPercent: -110 }, { xPercent: 0, duration: 0.5 }, 1.2);

      tl.fromTo('[data-anim="name"]',
        { yPercent: 110 }, { yPercent: 0, duration: 0.6 }, 1.3);

      tl.fromTo('[data-anim="subtitle"]',
        { yPercent: 120 }, { yPercent: 0, duration: 0.5 }, 1.55);

      // 环绕标签
      const tags = heroRef.current.querySelectorAll('[data-anim="orbit-tag"]');
      if (tags.length) {
        gsap.set(tags, {
          xPercent: -50, yPercent: -50,
          x: (_, el) => Number(el.dataset.x || 0),
          y: (_, el) => Number(el.dataset.y || 0),
          scale: 0, opacity: 0,
        });
        tl.to(tags, {
          scale: 1, opacity: 1,
          duration: 0.35, stagger: 0.05, ease: 'back.out(2.5)',
        }, 1.8);
      }

      // ══════════════════════════════════════════
      // Phase 3 — 故事展开 (2.0 ~ 2.8s)
      // ══════════════════════════════════════════
      tl.fromTo('[data-anim="big-number"]',
        { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7 }, 2.0);

      tl.fromTo('[data-anim="day-label"]',
        { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, 2.2);

      tl.fromTo('[data-anim="quote-border"]',
        { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 0.4 }, 2.4);

      tl.fromTo('[data-anim="quote-text"]',
        { xPercent: -20, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.5 }, 2.5);

      // ══════════════════════════════════════════
      // Phase 4 — 数据佐证 (2.8 ~ 3.2s)
      // ══════════════════════════════════════════
      tl.fromTo('[data-anim="stat-card"]',
        { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)' }, 2.8);

      // ══════════════════════════════════════════
      // Phase 5 — 引导 (3.2s+)
      // ══════════════════════════════════════════
      tl.fromTo('[data-anim="scroll-hint"]',
        { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 3.3);
    }, heroRef);

    return () => ctx.revert();
  }, [isVisible]);

  return (
    <header
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#faf5ff_0%,#f0f9ff_25%,#fdf4ff_50%,#eff6ff_75%,#faf5ff_100%)]"
    >
      {/* 背景光斑 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div data-anim="blob" className="absolute rounded-full opacity-0 blur-[80px] w-[400px] h-[400px] bg-gradient-to-br from-indigo-200 to-purple-200 -top-[10%] -left-[5%] will-change-[opacity]" />
        <div data-anim="blob" className="absolute rounded-full opacity-0 blur-[80px] w-[300px] h-[300px] bg-gradient-to-br from-pink-200 to-rose-100 top-[20%] -right-[10%] will-change-[opacity]" />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* 左侧信息 */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            {/* badge — overflow-hidden 容器做 clip */}
            <div className="overflow-hidden w-fit">
              <span data-anim="badge" className="inline-block px-3 py-1 text-xs font-medium uppercase rounded-full bg-black/[0.04] text-slate-400 tracking-widest">
                成长历程
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-indigo-950">
              {/* name — line reveal from below */}
              <span className="overflow-hidden block">
                <span data-anim="name" className="block">{upName}</span>
              </span>
              {/* subtitle — line reveal from below */}
              <span className="overflow-hidden block mt-1">
                <span data-anim="subtitle" className="block font-normal text-slate-600 text-[0.65em]">的创作故事</span>
              </span>
            </h1>
          </div>

          <div className="flex items-end gap-4">
            {/* 大数字 — reveal from below */}
            <div className="overflow-hidden">
              <div data-anim="big-number" className="text-7xl md:text-8xl font-black text-indigo-950 leading-none tracking-tighter tabular-nums">
                <CountUp end={totalDays} duration={2500} startOnVisible={isVisible} />
              </div>
            </div>
            <div className="flex flex-col pb-3">
              <span data-anim="day-label" className="text-lg font-medium text-indigo-950">天的坚持</span>
              <span data-anim="day-label" className="text-sm text-slate-400">始于 {journeyStart}</span>
            </div>
          </div>

          {/* 引述 — 边框 + 文字分别动画 */}
          <div className="relative py-4 pl-5">
            <div data-anim="quote-border" className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500" />
            <p data-anim="quote-text" className="text-base leading-relaxed text-slate-600">
              {narrativeContent.text} <span className="font-semibold text-indigo-950">{narrativeContent.highlight}</span> {narrativeContent.suffix}
            </p>
          </div>

          {/* 数据卡片 */}
          <div className="flex flex-wrap gap-3">
            <div data-anim="stat-card" className="flex-1 min-w-[90px] p-4 rounded-xl text-center text-white bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <div className="text-2xl font-bold tabular-nums">
                <CountUp end={totalPlays} duration={3000} startOnVisible={isVisible} formatFn={formatNumber} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide opacity-90">累计播放</div>
            </div>
            <div data-anim="stat-card" className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 border border-white/60 bg-white/80">
              <div className="text-2xl font-bold text-indigo-950 tabular-nums">
                <CountUp end={videoCount} duration={2000} startOnVisible={isVisible} />
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">个作品</div>
            </div>
            <div data-anim="stat-card" className="flex-1 min-w-[90px] p-4 rounded-xl text-center bg-white/70 border border-white/60 bg-white/80">
              <div className="text-2xl font-bold text-indigo-950 tabular-nums">
                <CountUp end={growthMultiple} duration={2000} decimals={0} startOnVisible={isVisible} />
                <span className="text-base font-medium text-slate-400">x</span>
              </div>
              <div className="text-xs mt-1 uppercase tracking-wide text-slate-400">播放增长</div>
            </div>
          </div>
        </div>

        {/* 右侧头像 */}
        <div data-anim="right-col" className="relative flex-1 flex items-center justify-center min-h-[260px] md:min-h-[400px]">
          <div className="relative w-60 h-60 md:w-80 md:h-80">
            {/* 头像 */}
            <div data-anim="avatar" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              {upFace ? (
                <img
                  src={getImageUrl(upFace)}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-[0_0_0_4px_rgba(255,255,255,0.8),0_0_0_6px_rgba(99,102,241,0.2),0_20px_40px_rgba(99,102,241,0.2)]"
                  referrerPolicy="no-referrer"
                  alt=""
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-2xl md:text-4xl font-bold text-white bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_0_0_4px_rgba(255,255,255,0.8),0_20px_40px_rgba(99,102,241,0.2)]"
                >
                  {upName.charAt(0)}
                </div>
              )}
            </div>

            {/* 环绕标签 — GSAP: 先摆到目标位置(不可见)，再原地 pop */}
            <div className="absolute top-1/2 left-1/2">
              {creatorTags.map((tag, index) => {
                const pos = getOrbitPosition(index, creatorTags.length);
                return (
                  <span
                    key={tag.text}
                    data-anim="orbit-tag"
                    data-x={pos.x}
                    data-y={pos.y}
                    className="absolute top-1/2 left-1/2 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap bg-white text-slate-600 border border-indigo-500/15 shadow-sm hover:bg-indigo-500 hover:text-white transition-colors"
                  >
                    {tag.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div data-anim="scroll-hint" className="absolute bottom-10 flex flex-col items-center gap-2 text-sm text-slate-400">
        <span className="tracking-wide">向下探索 TA 的故事</span>
        <ChevronDown size={20} className="animate-bounce" />
      </div>
    </header>
  );
};

export default HeroSection;
