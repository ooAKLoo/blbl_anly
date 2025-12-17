import { X } from 'lucide-react';
import HeroSection from './growth-journey/HeroSection';
import StoryTimeline from './growth-journey/StoryTimeline';
import EndingSection from './growth-journey/EndingSection';
import { useGrowthMetrics } from '../../hooks';

const GrowthJourney = ({ videos = [], upName = 'UP主', upFace = '', onClose }) => {
  const {
    sortedVideos, journeyStart, totalDays, totalPlays,
    firstVideoPlays, growthMultiple, creatorTags
  } = useGrowthMetrics(videos);

  return (
    <div
      className="relative"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)' }}
    >
      {onClose && (
        <button onClick={onClose} className="growth-close-btn" title="关闭">
          <X size={18} strokeWidth="1.5" />
        </button>
      )}

      {/* Hero Section */}
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

      {/* Story Timeline */}
      <StoryTimeline videos={videos} upName={upName} />

      {/* Ending Section */}
      <div className="ending-section-wrapper">
        <EndingSection
          upName={upName}
          upFace={upFace}
          totalDays={totalDays}
          firstVideoPlays={firstVideoPlays}
          videos={sortedVideos}
        />
      </div>
    </div>
  );
};

export default GrowthJourney;
