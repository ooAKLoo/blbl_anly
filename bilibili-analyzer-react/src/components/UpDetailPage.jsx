import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, RefreshCw, X } from 'lucide-react';
import { getImageUrl } from '../utils';
import DataAnalysis from './up-detail/DataAnalysis';
import VideoList from './up-detail/VideoList';
import InsightReport from './up-detail/InsightReport';
import GrowthJourney from './up-detail/GrowthJourney';
import VideoDetailDrawer from './VideoDetailDrawer';

const UpDetailPage = forwardRef(({ upInfo, videos = [], sidebarCollapsed = false, onRefresh, isRefreshing = false }, ref) => {
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
            {/* 刷新按钮 */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isRefreshing
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
                }`}
                title="增量刷新：获取新发布的视频，更新已有视频数据"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
                <span>{isRefreshing ? '刷新中...' : '刷新数据'}</span>
              </button>
            )}
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
                className={`relative py-2.5 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="detail-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
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
              onOpenDrawer={openDrawer}
            />
          )}
        </main>

        {/* 成长历程覆盖层 */}
        <AnimatePresence>
          {showGrowthJourney && (
            <motion.div
              className="growth-journey-shell"
              initial={{ opacity: 0, top: 0, right: 0, bottom: 0, left: 0, borderRadius: 0 }}
              animate={sidebarCollapsed ? {
                opacity: 1,
                top: 0, right: 0, bottom: 0, left: 0,
                borderRadius: 0,
              } : {
                opacity: 1,
                top: 12, right: 12, bottom: 12, left: 264,
                borderRadius: 16,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* 关闭按钮：absolute 定位在 shell 内，不随内容滚动 */}
              <button
                onClick={() => setShowGrowthJourney(false)}
                className="growth-close-btn"
                title="关闭"
              >
                <X size={18} strokeWidth="1.5" />
              </button>

              <div className="growth-journey-scroll">
                <GrowthJourney
                  videos={videos}
                  upName={upInfo?.name}
                  upFace={upInfo?.face}
                  isActive={showGrowthJourney}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
