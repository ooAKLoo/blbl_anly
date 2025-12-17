import React, { useMemo, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  Play,
  MessageSquare,
  MessageCircle,
  Star,
  X,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  ArrowDownWideNarrow,
  Timer
} from 'lucide-react';
import { formatNumber, getImageUrl, sortVideos } from '../utils';
import { SORT_OPTIONS } from '../utils/constants';

// Icon 映射
const iconMap = {
  Calendar,
  TrendingUp,
  ArrowDownWideNarrow,
  MessageSquare,
  Timer
};

export default function VideoDetailDrawer({
  visible = false,
  title = '',
  videos = [],
  onClose
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sortBy, setSortBy] = useState('time_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setSortBy('time_desc'); // 重置排序
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 排序后的视频
  const sortedVideos = useMemo(() => {
    return sortVideos([...videos], sortBy);
  }, [videos, sortBy]);

  const averagePlayCount = useMemo(() => {
    if (videos.length === 0) return 0;
    const total = videos.reduce((sum, v) => sum + v.play_count, 0);
    return Math.round(total / videos.length);
  }, [videos]);

  // 获取当前排序标签
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

  const selectSort = (value) => {
    setSortBy(value);
    setSortDropdownOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-5 ${
        isAnimating ? 'drawer-enter' : 'drawer-exit'
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full max-w-[900px] max-h-[85vh] bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden p-2 ${
          isAnimating ? 'drawer-content-enter' : 'drawer-content-exit'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-200/60 rounded-xl mb-2">
          <h3 className="text-sm font-semibold text-neutral-900 m-0">{title}</h3>
          <div className="flex gap-3 text-xs text-neutral-500">
            <span>{videos.length} 个视频</span>
            {videos.length > 0 && (
              <span>均播 {formatNumber(averagePlayCount)}</span>
            )}
          </div>

          {/* 排序下拉 */}
          <div className="relative ml-auto" ref={sortDropdownRef}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/80 hover:bg-white rounded-lg text-xs text-neutral-600 transition-colors"
            >
              <ArrowUpDown size={12} />
              {currentSortLabel}
              <ChevronDown
                size={12}
                className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* 排序下拉菜单 */}
            {sortDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-36 p-1 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {sortOptionsWithIcons.map((option) => {
                  const IconComponent = option.IconComponent;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectSort(option.value)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        sortBy === option.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <IconComponent size={12} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-300/50 transition-colors duration-150"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedVideos.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-neutral-400">
              <span>暂无视频</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedVideos.map((video, index) => (
                <div
                  key={video.bvid}
                  className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg transition-all duration-150 border border-transparent hover:bg-neutral-100 hover:border-blue-500/20 hover:translate-x-1"
                >
                  <span className="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">{index + 1}</span>
                  <img
                    src={getImageUrl(video.cover)}
                    className="w-[140px] h-[79px] object-cover rounded-md flex-shrink-0"
                    referrerPolicy="no-referrer"
                    alt={video.title}
                  />
                  <div className="flex-1 min-w-0">
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-neutral-900 no-underline font-medium text-[0.95rem] mb-2 leading-snug transition-colors duration-150 hover:text-blue-500"
                    >
                      {video.title}
                    </a>
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                      <span className="inline-flex items-center gap-1" title="发布时间">
                        <Calendar size={14} className="opacity-70" />
                        {video.publish_time}
                      </span>
                      <span className="inline-flex items-center gap-1" title="视频时长">
                        <Clock size={14} className="opacity-70" />
                        {video.duration}
                      </span>
                      <span className="inline-flex items-center gap-1" title="播放量">
                        <Play size={14} className="opacity-70" />
                        {formatNumber(video.play_count)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="弹幕数">
                        <MessageSquare size={14} className="opacity-70" />
                        {formatNumber(video.danmu_count)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="评论数">
                        <MessageCircle size={14} className="opacity-70" />
                        {formatNumber(video.comment_count || 0)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="收藏数">
                        <Star size={14} className="opacity-70" />
                        {formatNumber(video.favorite_count || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
