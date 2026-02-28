import React, { useState, useMemo, useRef, useEffect } from 'react';
import VirtualGrid from '../VirtualGrid';
import { formatNumber, getImageUrl, formatDate, formatDateTime, sortVideos, parseDuration } from '../../utils';
import { SORT_OPTIONS } from '../../utils/constants';
import {
  Calendar,
  Play,
  MessageSquare,
  MessageCircle,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  ArrowDownWideNarrow,
  Timer,
  LayoutGrid,
  List as ListIcon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Icon 映射
const iconMap = {
  Calendar,
  TrendingUp,
  ArrowDownWideNarrow,
  MessageSquare,
  Timer
};

/**
 * 格式化秒数为可读时长
 */
function formatDurationText(seconds) {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0 && s === 0) return '0s';
  if (m === 0) return `${s}s`;
  return `${m}m`;
}

/**
 * VideoList 组件
 *
 * 视频列表组件，支持搜索、排序、网格/列表视图切换
 * 使用虚拟滚动优化大量视频的渲染性能
 *
 * @param {Array} videos - 视频列表数据
 */
export default function VideoList({ videos = [] }) {
  // 搜索和排序状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('time_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // 时长过滤状态
  const [durationRange, setDurationRange] = useState([0, Infinity]);
  const [isDurationFilterActive, setIsDurationFilterActive] = useState(false);

  // Refs
  const sortDropdownRef = useRef(null);
  const virtualGridRef = useRef(null);
  const virtualListRef = useRef(null);

  // 处理排序选择
  const selectSort = (value) => {
    setSortBy(value);
    setSortDropdownOpen(false);
  };

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 获取视频封面 URL
  const getVideoCoverUrl = (video) => {
    return getImageUrl(video.cover);
  };

  // 计算视频时长范围（秒）
  const durationBounds = useMemo(() => {
    if (videos.length === 0) return { min: 0, max: 3600 };
    const durations = videos.map(v => parseDuration(v.duration || '0:00'));
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    return { min, max: Math.max(max, 60) }; // 至少60秒
  }, [videos]);

  // 初始化时长范围
  useEffect(() => {
    if (!isDurationFilterActive) {
      setDurationRange([durationBounds.min, durationBounds.max]);
    }
  }, [durationBounds, isDurationFilterActive]);

  // 筛选和排序后的视频列表
  const filteredVideos = useMemo(() => {
    let result = videos;

    // 搜索筛选
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(keyword));
    }

    // 时长筛选
    if (isDurationFilterActive) {
      result = result.filter(v => {
        const sec = parseDuration(v.duration || '0:00');
        return sec >= durationRange[0] && sec <= durationRange[1];
      });
    }

    // 排序
    return sortVideos(result, sortBy);
  }, [videos, searchKeyword, sortBy, durationRange, isDurationFilterActive]);

  // 计算筛选后的平均播放量
  const filteredAvgPlays = useMemo(() => {
    if (filteredVideos.length === 0) return 0;
    const total = filteredVideos.reduce((sum, v) => sum + v.play_count, 0);
    return Math.round(total / filteredVideos.length);
  }, [filteredVideos]);

  // 计算筛选后的互动率
  const filteredEngagementRate = useMemo(() => {
    if (filteredVideos.length === 0) return '0.00';
    const totalPlays = filteredVideos.reduce((sum, v) => sum + v.play_count, 0);
    const totalEngagement = filteredVideos.reduce((sum, v) =>
      sum + v.danmu_count + (v.comment_count || 0), 0);
    if (totalPlays === 0) return '0.00';
    return ((totalEngagement / totalPlays) * 100).toFixed(2);
  }, [filteredVideos]);

  // 搜索或排序变化时滚动回顶部
  useEffect(() => {
    if (virtualGridRef.current?.scrollToTop) {
      virtualGridRef.current.scrollToTop();
    }
    if (virtualListRef.current?.scrollToTop) {
      virtualListRef.current.scrollToTop();
    }
  }, [searchKeyword, sortBy]);

  // 获取排序选项标签
  const currentSortLabel = useMemo(() => {
    return SORT_OPTIONS.find(o => o.value === sortBy)?.label || '排序';
  }, [sortBy]);

  // 转换排序选项，添加图标组件
  const sortOptionsWithIcons = useMemo(() => {
    return SORT_OPTIONS.map(opt => ({
      ...opt,
      IconComponent: iconMap[opt.icon] || Calendar
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 搜索框 */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md px-3 py-2 bg-white rounded-lg">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索视频标题..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 排序下拉 */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg text-sm text-neutral-600 transition-colors"
          >
            <ArrowUpDown size={14} />
            {currentSortLabel}
            <ChevronDown
              size={14}
              className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* 排序下拉菜单 */}
          {sortDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 w-44 p-1.5 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {sortOptionsWithIcons.map((option) => {
                const IconComponent = option.IconComponent;
                return (
                  <button
                    key={option.value}
                    onClick={() => selectSort(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      sortBy === option.value
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <IconComponent size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="relative flex items-center p-1 bg-white rounded-lg">
          {/* Morph indicator */}
          <motion.div
            layoutId="viewmode-indicator"
            className="absolute w-[28px] h-[28px] bg-neutral-100 rounded-md"
            style={{ left: viewMode === 'grid' ? 4 : 32 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
          <button
            onClick={() => setViewMode('grid')}
            className={`relative z-[1] p-1.5 rounded-md transition-colors duration-150 ${
              viewMode === 'grid' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
            }`}
            title="网格视图"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`relative z-[1] p-1.5 rounded-md transition-colors duration-150 ${
              viewMode === 'list' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
            }`}
            title="列表视图"
          >
            <ListIcon size={16} />
          </button>
        </div>

        {/* 时长过滤 Slider */}
        <div className="flex items-center gap-2 px-3 h-9 bg-white rounded-lg">
          <button
            onClick={() => setIsDurationFilterActive(!isDurationFilterActive)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isDurationFilterActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Clock size={14} />
            <span>时长</span>
          </button>

          <AnimatePresence>
            {isDurationFilterActive && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="relative w-[180px] h-6 shrink-0">
                  {/* 双滑块 Range Slider - track 内缩留出圆点空间 */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-1.5 right-1.5 h-1 bg-neutral-200 rounded-full">
                    <div
                      className="absolute h-full bg-neutral-400 rounded-full"
                      style={{
                        left: `${((durationRange[0] - durationBounds.min) / (durationBounds.max - durationBounds.min)) * 100}%`,
                        right: `${100 - ((durationRange[1] - durationBounds.min) / (durationBounds.max - durationBounds.min)) * 100}%`
                      }}
                    />
                    {/* 滑块指示器 - 放在 track 内，百分比基于 track 宽度 */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-600 rounded-full shadow-sm pointer-events-none -ml-1.5"
                      style={{
                        left: `${((durationRange[0] - durationBounds.min) / (durationBounds.max - durationBounds.min)) * 100}%`
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-600 rounded-full shadow-sm pointer-events-none -ml-1.5"
                      style={{
                        left: `${((durationRange[1] - durationBounds.min) / (durationBounds.max - durationBounds.min)) * 100}%`
                      }}
                    />
                  </div>
                  {/* 最小值滑块 - 只处理左半区域 */}
                  <input
                    type="range"
                    min={durationBounds.min}
                    max={durationBounds.max}
                    value={durationRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), durationRange[1] - 60);
                      setDurationRange([val, durationRange[1]]);
                    }}
                    className="absolute top-0 left-1.5 right-1.5 h-full opacity-0 cursor-pointer"
                    style={{
                      zIndex: 30,
                      clipPath: `inset(0 ${100 - ((durationRange[0] + durationRange[1]) / 2 - durationBounds.min) / (durationBounds.max - durationBounds.min) * 100}% 0 0)`
                    }}
                  />
                  {/* 最大值滑块 - 只处理右半区域 */}
                  <input
                    type="range"
                    min={durationBounds.min}
                    max={durationBounds.max}
                    value={durationRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), durationRange[0] + 60);
                      setDurationRange([durationRange[0], val]);
                    }}
                    className="absolute top-0 left-1.5 right-1.5 h-full opacity-0 cursor-pointer"
                    style={{
                      zIndex: 20,
                    }}
                  />
                </div>

                {/* 时长范围显示 */}
                <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap tabular-nums">
                  {formatDurationText(durationRange[0])}<span className="mx-0.5 text-neutral-300">~</span>{formatDurationText(durationRange[1])}
                </span>

                {/* 重置按钮 */}
                <button
                  onClick={() => {
                    setDurationRange([durationBounds.min, durationBounds.max]);
                    setIsDurationFilterActive(false);
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                  title="重置时长过滤"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-xs text-neutral-400 ml-auto">
          {filteredVideos.length} / {videos.length} 个视频
        </span>
      </div>

      {/* Search Stats */}
      {searchKeyword && filteredVideos.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 bg-blue-50/50 rounded-xl text-sm">
          <span className="text-neutral-600">
            关键词 "<strong className="text-blue-600">{searchKeyword}</strong>"
          </span>
          <span className="text-neutral-500">
            平均播放 <strong className="text-blue-600">{formatNumber(filteredAvgPlays)}</strong>
          </span>
          <span className="text-neutral-500">
            互动率 <strong className="text-blue-600">{filteredEngagementRate}%</strong>
          </span>
        </div>
      )}

      {/* Video Grid View (Virtual Scroll) */}
      {viewMode === 'grid' ? (
        <VirtualGrid
          ref={virtualGridRef}
          items={filteredVideos}
          keyField="bvid"
          minColumnWidth={280}
          gap={16}
          itemHeight={290}
          buffer={3}
          className="virtual-grid-wrapper"
        >
          {({ item: video, index }) => (
            <div className="video-card group h-full flex flex-col bg-white rounded-xl p-3">
              <div className="relative aspect-video rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={getVideoCoverUrl(video)}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                  {video.duration}
                </span>
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
                  #{index + 1}
                </span>
              </div>
              <div className="flex flex-col flex-1 pt-3">
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-neutral-900 hover:text-blue-600 line-clamp-2 h-10 transition-colors"
                >
                  {video.title}
                </a>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-auto">
                  <span className="flex items-center gap-1">
                    <Play size={12} />
                    {formatNumber(video.play_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {formatNumber(video.danmu_count)}
                  </span>
                  <span className="ml-auto">{formatDate(video.publish_time)}</span>
                </div>
              </div>
            </div>
          )}
        </VirtualGrid>
      ) : (
        /* Video List View (Virtual Scroll) */
        <VirtualGrid
          ref={virtualListRef}
          items={filteredVideos}
          keyField="bvid"
          minColumnWidth={9999}
          gap={8}
          itemHeight={96}
          buffer={5}
          className="virtual-list-wrapper"
        >
          {({ item: video, index }) => (
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50/80 transition-colors group">
              {/* Rank */}
              <span className="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">
                {index + 1}
              </span>

              {/* Thumbnail */}
              <div className="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={getVideoCoverUrl(video)}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] rounded">
                  {video.duration}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-neutral-900 hover:text-blue-600 truncate mb-2 transition-colors"
                >
                  {video.title}
                </a>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="opacity-60" />
                    {formatDateTime(video.publish_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play size={12} className="opacity-60" />
                    {formatNumber(video.play_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} className="opacity-60" />
                    {formatNumber(video.danmu_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} className="opacity-60" />
                    {formatNumber(video.comment_count || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </VirtualGrid>
      )}
    </div>
  );
}
