import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Sidebar from './components/Sidebar';
import NewScrapeDialog from './components/NewScrapeDialog';
import SettingsDialog from './components/SettingsDialog';
import UpDetailPage from './components/UpDetailPage';
import HomePage from './components/HomePage';

function App() {
  // Dialog states
  const [showNewScrapeDialog, setShowNewScrapeDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // View state: 'home' | 'detail'
  const [currentView, setCurrentView] = useState('home');

  // Data states
  const [mid, setMid] = useState('');
  const [cookie, setCookie] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [upInfo, setUpInfo] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, page: 0, message: '' });

  // Sidebar states
  const sidebarRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [savedUpList, setSavedUpList] = useState([]);
  const [currentMid, setCurrentMid] = useState(null);

  // Detail page ref
  const detailPageRef = useRef(null);

  // 用于对比功能的UP主数据缓存
  const [upDataMap, setUpDataMap] = useState({});

  // Methods
  const loadSavedUpList = async () => {
    try {
      const list = await invoke('get_saved_up_list');
      setSavedUpList(list);
    } catch (error) {
      console.error('加载UP主列表失败:', error);
    }
  };

  const loadSavedUp = async (upMid) => {
    try {
      const result = await invoke('load_up_videos', { mid: upMid });
      if (result.success) {
        setVideos(result.videos);
        setUpInfo(result.up_info);
        setCurrentMid(upMid);
        setMid(upMid);
        setCurrentView('detail');

        // 同时缓存到 upDataMap
        setUpDataMap(prev => ({
          ...prev,
          [upMid]: {
            up_info: result.up_info,
            videos: result.videos
          }
        }));
      }
    } catch (error) {
      alert('加载失败: ' + error);
    }
  };

  // 为对比功能加载UP主数据（不切换视图）
  const loadUpDataForCompare = async (upMid) => {
    if (upDataMap[upMid]) return; // 已缓存

    try {
      const result = await invoke('load_up_videos', { mid: upMid });
      if (result.success) {
        setUpDataMap(prev => ({
          ...prev,
          [upMid]: {
            up_info: result.up_info,
            videos: result.videos
          }
        }));
      }
    } catch (error) {
      console.error('加载UP主数据失败:', error);
    }
  };

  // 返回首页
  const goToHome = () => {
    setCurrentView('home');
    setCurrentMid(null);
  };

  const deleteSavedUp = async (upMid) => {
    if (!confirm('确定要删除这个UP主的数据吗？')) return;

    try {
      await invoke('delete_saved_up', { mid: upMid });
      await loadSavedUpList();

      if (currentMid === upMid) {
        setVideos([]);
        setUpInfo(null);
        setCurrentMid(null);
      }
    } catch (error) {
      alert('删除失败: ' + error);
    }
  };

  const handleSaveCookie = async (newCookie) => {
    setCookie(newCookie);
    try {
      await invoke('set_cookie', { cookie: newCookie });
    } catch (error) {
      console.error('保存Cookie失败:', error);
    }
  };

  const handleStartScrape = async ({ mid: newMid }) => {
    setMid(newMid);
    await startScraping(newMid);
  };

  const normalizeMid = (input) => {
    const str = String(input ?? '').trim();
    if (!str) return null;
    const matches = str.match(/\d+/g);
    if (!matches || matches.length === 0) return null;
    const midNum = parseInt(matches[matches.length - 1], 10);
    return Number.isNaN(midNum) ? null : midNum;
  };

  const isNotLoggedInError = (err) => {
    const msg = String(err ?? '');
    return msg.includes('账号未登录') || msg.includes('code -101');
  };

  const startScraping = async (targetMid) => {
    const midToUse = targetMid || mid;
    if (!midToUse) return;

    const normalizedMid = normalizeMid(midToUse);
    if (normalizedMid === null) {
      alert('请输入有效的 MID 或 UP 主空间 URL');
      return;
    }

    setIsLoading(true);
    setVideos([]);
    setUpInfo(null);
    setProgress({ current: 0, total: 0, page: 0, message: '初始化...' });

    try {
      setMid(String(normalizedMid));
      setProgress({ current: 0, total: 0, page: 0, message: '获取WBI签名...' });
      await invoke('init_wbi_keys');

      setProgress({ current: 0, total: 0, page: 0, message: '开始爬取视频...' });
      const result = await invoke('scrape_videos', {
        mid: normalizedMid
      });

      if (result.success) {
        setVideos(result.videos);
        setUpInfo(result.up_info);
        setCurrentMid(normalizedMid);

        await loadSavedUpList();
        setShowNewScrapeDialog(false);
      } else {
        if (isNotLoggedInError(result.error)) {
          alert('账号未登录，无法获取 WBI keys。请在“设置”中填写 Cookie 后再试。');
          setShowSettingsDialog(true);
        } else {
          alert('爬取失败: ' + (result.error || '未知错误'));
        }
      }
    } catch (error) {
      console.error('爬取失败:', error);
      if (isNotLoggedInError(error)) {
        alert('账号未登录，无法获取 WBI keys。请在“设置”中填写 Cookie 后再试。');
        setShowSettingsDialog(true);
      } else {
        alert('错误: ' + error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 增量刷新当前UP主的视频
  const refreshUpVideos = async () => {
    if (!currentMid || isRefreshing) return;

    setIsRefreshing(true);
    setProgress({ current: 0, total: 0, page: 0, message: '初始化刷新...' });

    try {
      await invoke('init_wbi_keys');
      const result = await invoke('refresh_up_videos', {
        mid: parseInt(currentMid)
      });

      if (result.success) {
        setVideos(result.videos);
        if (result.up_info) {
          setUpInfo(result.up_info);
        }

        // 更新 upDataMap 缓存
        setUpDataMap(prev => ({
          ...prev,
          [currentMid]: {
            up_info: result.up_info || upInfo,
            videos: result.videos
          }
        }));
      } else {
        if (isNotLoggedInError(result.error)) {
          alert('账号未登录，无法获取 WBI keys。请在“设置”中填写 Cookie 后再试。');
          setShowSettingsDialog(true);
        } else {
          alert('刷新失败: ' + (result.error || '未知错误'));
        }
      }
    } catch (error) {
      if (isNotLoggedInError(error)) {
        alert('账号未登录，无法获取 WBI keys。请在“设置”中填写 Cookie 后再试。');
        setShowSettingsDialog(true);
      } else {
        alert('刷新错误: ' + error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const stopScraping = async () => {
    try {
      await invoke('stop_scraping');
    } catch (error) {
      console.error('停止失败:', error);
    }
  };

  const exportData = async () => {
    if (videos.length === 0) return;

    const filename = `${upInfo?.name || mid}_videos_${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      await invoke('export_csv', {
        videos: videos,
        path: filename
      });
      alert(`数据已导出: ${filename}`);
    } catch (error) {
      alert('导出失败: ' + error);
    }
  };

  const loadSavedCookie = async () => {
    try {
      const savedCookie = await invoke('get_cookie');
      if (savedCookie) {
        setCookie(savedCookie);
      }
    } catch (error) {
      console.error('加载Cookie失败:', error);
    }
  };

  // 加载所有已保存UP主的数据（用于首页TOP榜单）
  const loadAllUpData = async () => {
    for (const up of savedUpList) {
      if (!upDataMap[up.mid]) {
        try {
          const result = await invoke('load_up_videos', { mid: up.mid });
          if (result.success) {
            setUpDataMap(prev => ({
              ...prev,
              [up.mid]: {
                up_info: result.up_info,
                videos: result.videos
              }
            }));
          }
        } catch (error) {
          console.error(`加载UP主 ${up.mid} 数据失败:`, error);
        }
      }
    }
  };

  useEffect(() => {
    let unlistenFn;

    const setupListener = async () => {
      unlistenFn = await listen('scrape-progress', (event) => {
        setProgress(event.payload);
      });

      await loadSavedCookie();
      await loadSavedUpList();
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  // 加载所有UP主数据用于首页
  useEffect(() => {
    if (savedUpList.length > 0) {
      loadAllUpData();
    }
  }, [savedUpList]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        ref={sidebarRef}
        savedUpList={savedUpList}
        currentMid={currentMid}
        currentView={currentView}
        onAddUp={() => setShowNewScrapeDialog(true)}
        onLoadUp={loadSavedUp}
        onDeleteUp={deleteSavedUp}
        onOpenSettings={() => setShowSettingsDialog(true)}
        onExportCsv={exportData}
        onGoHome={goToHome}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`flex-1 h-screen overflow-x-hidden overflow-y-auto bg-neutral-100 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-[60px]' : 'ml-[264px]'
        }`}
      >
        {/* Home Page (对比分析) */}
        {currentView === 'home' && (
          <HomePage
            savedUpList={savedUpList}
            upDataMap={upDataMap}
            onLoadUpData={loadUpDataForCompare}
            onViewUpDetail={loadSavedUp}
          />
        )}

        {/* UP Detail Page */}
        {currentView === 'detail' && upInfo && (
          <UpDetailPage
            ref={detailPageRef}
            upInfo={upInfo}
            videos={videos}
            sidebarCollapsed={sidebarCollapsed}
            onRefresh={refreshUpVideos}
            isRefreshing={isRefreshing}
          />
        )}

        {/* Empty State (当详情页没有数据时) */}
        {currentView === 'detail' && !upInfo && (
          <div className="flex items-center justify-center min-h-screen p-10">
            <div className="text-center max-w-md">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400 mb-6 mx-auto">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
              </svg>
              <h2 className="text-2xl font-semibold mb-3 text-neutral-900">开始分析 UP主数据</h2>
              <p className="text-neutral-600 mb-6 text-[0.95rem]">点击左上角 "+" 按钮添加 UP主，开始爬取和分析视频数据</p>
              <button
                className="inline-flex items-center justify-center gap-2 px-[18px] py-2.5 border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => setShowNewScrapeDialog(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14m-7-7h14"/>
                </svg>
                添加 UP主
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <NewScrapeDialog
        open={showNewScrapeDialog}
        onClose={() => setShowNewScrapeDialog(false)}
        mid={mid}
        isLoading={isLoading}
        progress={progress}
        onStart={handleStartScrape}
        onStop={stopScraping}
      />

      <SettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        cookie={cookie}
        onSave={handleSaveCookie}
      />
    </div>
  );
}

export default App;
