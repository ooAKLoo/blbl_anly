import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import HeroSection from './growth-journey/HeroSection';
import StoryTimeline from './growth-journey/StoryTimeline';
import EndingSection from './growth-journey/EndingSection';
import { useGrowthMetrics } from '../../hooks';

const GrowthJourney = ({ videos = [], upName = 'UP主', upFace = '', isActive = false }) => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const timelineRef = useRef(null);
  const endingRef = useRef(null);

  const heroWrapperRef = useRef(null);
  const storyWrapperRef = useRef(null);
  const endingWrapperRef = useRef(null);

  // 获取滚动容器（父级的 .growth-journey-overlay）
  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
    // 查找滚动容器
    const overlay = containerRef.current?.closest('.growth-journey-overlay');
    if (overlay) {
      setScrollContainer(overlay);
    }
  }, []);

  // 基于滚动容器的滚动进度
  const { scrollY } = useScroll({
    container: scrollContainer ? { current: scrollContainer } : undefined,
  });

  // Hero 视差效果 - 基于滚动像素值
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);

  // Story 和 Ending 的可见性检测 - 需要指定 root
  const isStoryInView = useInView(storyWrapperRef, {
    once: false,
    amount: 0.15,
    root: scrollContainer ? { current: scrollContainer } : undefined,
  });
  const isEndingInView = useInView(endingWrapperRef, {
    once: false,
    amount: 0.15,
    root: scrollContainer ? { current: scrollContainer } : undefined,
  });

  // ============ 使用 hook 获取计算数据 ============
  const {
    sortedVideos,
    journeyStart,
    totalDays,
    totalPlays,
    firstVideoPlays,
    growthMultiple,
    creatorTags
  } = useGrowthMetrics(videos);

  // ============ 统一的 section 操作 ============
  const getSectionRefs = useCallback(() => [
    { ref: heroRef, init: 'setupObserver', reset: 'reset' },
    { ref: timelineRef, init: 'init', reset: 'reset' },
    { ref: endingRef, init: 'setupObserver', reset: 'reset' },
  ], []);

  const initAll = useCallback(() => {
    setTimeout(() => {
      getSectionRefs().forEach(({ ref, init }) => {
        ref.current?.[init]?.();
      });
    }, 100);
  }, [getSectionRefs]);

  const resetAll = useCallback(() => {
    getSectionRefs().forEach(({ ref, reset }) => {
      ref.current?.[reset]?.();
    });
  }, [getSectionRefs]);

  useEffect(() => {
    if (!isActive || videos.length === 0) return;

    resetAll();
    const timer = setTimeout(initAll, 0);
    return () => clearTimeout(timer);
  }, [isActive, videos, resetAll, initAll]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      }}
    >
      {/* Hero Section */}
      <div ref={heroWrapperRef} className="relative">
        <motion.div
          style={{
            opacity: heroOpacity,
            scale: heroScale,
            y: heroY,
          }}
        >
          <HeroSection
            ref={heroRef}
            upName={upName}
            upFace={upFace}
            totalDays={totalDays}
            journeyStart={journeyStart}
            videoCount={videos.length}
            firstVideoPlays={firstVideoPlays}
            totalPlays={totalPlays}
            growthMultiple={growthMultiple}
            creatorTags={creatorTags}
          />
        </motion.div>
      </div>

      {/* Story Timeline */}
      <motion.div
        ref={storyWrapperRef}
        initial={{ opacity: 0, y: 80 }}
        animate={isStoryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <StoryTimeline
          ref={timelineRef}
          videos={videos}
          upName={upName}
          totalDays={totalDays}
          videoCount={videos.length}
          growthMultiple={growthMultiple}
        />
      </motion.div>

      {/* Ending Section */}
      <motion.div
        ref={endingWrapperRef}
        initial={{ opacity: 0 }}
        animate={isEndingInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <EndingSection
          ref={endingRef}
          upName={upName}
          totalDays={totalDays}
          firstVideoPlays={firstVideoPlays}
          videos={sortedVideos}
        />
      </motion.div>
    </div>
  );
};

export default GrowthJourney;
