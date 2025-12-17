import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import HeroSection from './growth-journey/HeroSection';
import StoryTimeline from './growth-journey/StoryTimeline';
import EndingSection from './growth-journey/EndingSection';
import { useGrowthMetrics } from '../../hooks';

const GrowthJourney = ({ videos = [], upName = 'UP主', upFace = '', onClose }) => {
  const containerRef = useRef(null);
  const heroWrapperRef = useRef(null);
  const storyWrapperRef = useRef(null);

  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
    const overlay = containerRef.current?.closest('.growth-journey-overlay');
    if (overlay) setScrollContainer(overlay);
  }, []);

  // Hero 视差效果
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroWrapperRef,
    container: scrollContainer ? { current: scrollContainer } : undefined,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(heroProgress, [0, 1], [0, -60]);

  // Story Timeline 滚动动画
  const { scrollYProgress: storyProgress } = useScroll({
    target: storyWrapperRef,
    container: scrollContainer ? { current: scrollContainer } : undefined,
    offset: ["start end", "end start"]
  });

  const storyOpacity = useTransform(storyProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]);
  const storyY = useTransform(storyProgress, [0, 0.15], [60, 0]);

  const {
    sortedVideos, journeyStart, totalDays, totalPlays,
    firstVideoPlays, growthMultiple, creatorTags
  } = useGrowthMetrics(videos);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)' }}
    >
      {onClose && (
        <button onClick={onClose} className="growth-close-btn" title="关闭">
          <X size={18} strokeWidth="1.5" />
        </button>
      )}

      {/* Hero Section */}
      <div ref={heroWrapperRef} className="relative">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}>
          <HeroSection
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
      <motion.div ref={storyWrapperRef} style={{ opacity: storyOpacity, y: storyY }}>
        <StoryTimeline videos={videos} upName={upName} />
      </motion.div>

      {/* Ending Section */}
      <div className="ending-section-wrapper">
        <EndingSection
          upName={upName}
          totalDays={totalDays}
          firstVideoPlays={firstVideoPlays}
          videos={sortedVideos}
        />
      </div>
    </div>
  );
};

export default GrowthJourney;
