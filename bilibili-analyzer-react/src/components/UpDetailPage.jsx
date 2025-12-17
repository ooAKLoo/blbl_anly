import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils';
import DataAnalysis from './up-detail/DataAnalysis';
import VideoList from './up-detail/VideoList';
import InsightReport from './up-detail/InsightReport';
import GrowthJourney from './up-detail/GrowthJourney';
import VideoDetailDrawer from './VideoDetailDrawer';

const UpDetailPage = forwardRef(({ upInfo, videos = [], sidebarCollapsed = false }, ref) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('analysis');
  const tabs = [
    { id: 'analysis', label: '数据分析' },
    { id: 'videos', label: '视频列表' },
    { id: 'text-analysis', label: '洞察报告' }
  ];

  // 成长历程显示状态
  const [showGrowthJourney, setShowGrowthJourney] = useState(false);

  // 筛选状态 (这些会被传递给子组件)
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  // Drawer 状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerVideos, setDrawerVideos] = useState([]);

  // Drawer 操作函数
  const openDrawer = ({ title, videos }) => {
    setDrawerTitle(title);
    setDrawerVideos(videos);
    setDrawerVisible(true);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    switchTab: (tabId) => setActiveTab(tabId),
    openGrowthJourney: () => setShowGrowthJourney(true),
  }));

  // 成长历程显示时锁定 body 滚动
  useEffect(() => {
    if (showGrowthJourney) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showGrowthJourney]);

  // 计算筛选后的视频（用于 DataAnalysis）
  const getFilteredVideos = () => {
    let filtered = [...videos];

    // 时间范围筛选
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (selectedTimeRange) {
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        filtered = filtered.filter(v => new Date(v.publish_time) >= startDate);
      }
    }

    // 时长筛选
    if (selectedDuration !== 'all') {
      filtered = filtered.filter(v => {
        const duration = parseDuration(v.duration);
        switch (selectedDuration) {
          case 'short':
            return duration < 300; // < 5分钟
          case 'medium':
            return duration >= 300 && duration < 1200; // 5-20分钟
          case 'long':
            return duration >= 1200; // >= 20分钟
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // 解析时长字符串为秒数
  const parseDuration = (duration) => {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const filteredVideos = getFilteredVideos();

  if (!upInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`max-w-[1400px] px-6 transition-all duration-200 ${
        sidebarCollapsed ? 'mx-auto' : 'ml-0'
      }`}>
        {/* Unified Sticky Header */}
        <header className="sticky top-0 z-40 bg-neutral-50 pt-4 pb-2">
          {/* UP Info Row */}
          <div className="flex items-center gap-4 mb-3">
            <img
              src={getImageUrl(upInfo.face)}
              className="w-10 h-10 rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-neutral-900 truncate">{upInfo.name}</h1>
                <span className="text-xs text-neutral-400">Lv.{upInfo.level}</span>
                <span className="text-neutral-200">·</span>
                <span className="text-xs text-neutral-400">{videos.length} 个视频</span>
              </div>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {upInfo.sign || '这个人很懒，什么都没写'}
              </p>
            </div>
            {/* 成长历程入口按钮 */}
            <button
              onClick={() => setShowGrowthJourney(true)}
              className="growth-entry-btn group"
            >
              <span className="growth-entry-icon">
                <Sparkles size={12} />
              </span>
              <span className="growth-entry-text">成长历程</span>
              <ChevronRight
                size={14}
                className="text-neutral-300 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all"
              />
            </button>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-6 border-b border-neutral-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full"></span>
                )}
              </button>
            ))}
          </nav>
        </header>

        {/* Main Content */}
        <main className="py-6">
          {/* Tab Content: 数据分析 */}
          {activeTab === 'analysis' && (
            <DataAnalysis
              analysisVideos={filteredVideos}
              allVideos={videos}
              timeRange={selectedTimeRange}
              duration={selectedDuration}
              onUpdateTimeRange={setSelectedTimeRange}
              onUpdateDuration={setSelectedDuration}
              onOpenDrawer={openDrawer}
            />
          )}

          {/* Tab Content: 视频列表 */}
          {activeTab === 'videos' && (
            <VideoList videos={videos} />
          )}

          {/* Tab Content: 洞察报告 */}
          {activeTab === 'text-analysis' && (
            <InsightReport
              videos={videos}
              upName={upInfo?.name}
              timeRange={selectedTimeRange}
              duration={selectedDuration}
              onUpdateTimeRange={setSelectedTimeRange}
              onUpdateDuration={setSelectedDuration}
            />
          )}
        </main>

        {/* 成长历程全屏覆盖层 */}
        {showGrowthJourney && (
          <div className="growth-journey-overlay">
            <GrowthJourney
              videos={videos}
              upName={upInfo?.name}
              upFace={upInfo?.face}
              isActive={showGrowthJourney}
              onClose={() => setShowGrowthJourney(false)}
            />
          </div>
        )}

        {/* Video Detail Drawer */}
        <VideoDetailDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          title={drawerTitle}
          videos={drawerVideos}
        />
      </div>
    </div>
  );
});

UpDetailPage.displayName = 'UpDetailPage';

export default UpDetailPage;
