import { useRef, useEffect } from 'react';
import HeroSection from './growth-journey/HeroSection';
import StoryTimeline from './growth-journey/StoryTimeline';
import EndingSection from './growth-journey/EndingSection';
import { useGrowthMetrics } from '../../hooks';
import './GrowthJourney.css';

const GrowthJourney = ({ videos = [], upName = 'UP主', upFace = '', isActive = false }) => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const timelineRef = useRef(null);
  const endingRef = useRef(null);

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

  // ============ 初始化和重置 ============
  const initAll = () => {
    setTimeout(() => {
      if (heroRef.current) {
        heroRef.current.setupObserver();
      }
      if (timelineRef.current) {
        timelineRef.current.init();
      }
      if (endingRef.current) {
        endingRef.current.setupObserver();
      }
    }, 100);
  };

  const resetAll = () => {
    if (heroRef.current) {
      heroRef.current.reset();
    }
    if (timelineRef.current) {
      timelineRef.current.reset();
    }
    if (endingRef.current) {
      endingRef.current.reset();
    }
  };

  // ============ 生命周期 ============
  useEffect(() => {
    if (isActive && videos.length > 0) {
      resetAll();
      initAll();
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && videos.length > 0) {
      resetAll();
      setTimeout(() => {
        initAll();
      }, 0);
    }
  }, [videos]);

  useEffect(() => {
    if (isActive && videos.length > 0) {
      initAll();
    }
  }, []);

  const onHeroVisible = () => {
    // Hero 区域可见时的处理（如果需要）
  };

  return (
    <div className="story-container" ref={containerRef}>
      {/* Hero Header - 英雄时刻 */}
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
        onVisible={onHeroVisible}
      />

      {/* Story Stream - 故事流（时间轴） */}
      <StoryTimeline
        ref={timelineRef}
        videos={videos}
        upName={upName}
        totalDays={totalDays}
        videoCount={videos.length}
        growthMultiple={growthMultiple}
      />

      {/* 结尾 - 成长轨迹可视化 */}
      <div className="ending-wrapper">
        <EndingSection
          ref={endingRef}
          upName={upName}
          totalDays={totalDays}
          firstVideoPlays={firstVideoPlays}
          totalPlays={totalPlays}
          videos={sortedVideos}
          growthMultiple={growthMultiple}
        />
      </div>
    </div>
  );
};

export default GrowthJourney;
