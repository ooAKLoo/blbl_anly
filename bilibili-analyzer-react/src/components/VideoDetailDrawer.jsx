import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Play, MessageSquare, MessageCircle, Star, X } from 'lucide-react';
import { formatNumber, getImageUrl } from '../utils';

export default function VideoDetailDrawer({
  visible = false,
  title = '',
  videos = [],
  onClose
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const averagePlayCount = useMemo(() => {
    if (videos.length === 0) return 0;
    const total = videos.reduce((sum, v) => sum + v.play_count, 0);
    return Math.round(total / videos.length);
  }, [videos]);

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
        className={`w-full max-w-[900px] max-h-[85vh] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ${
          isAnimating ? 'drawer-content-enter' : 'drawer-content-exit'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.06] bg-neutral-50">
          <h3 className="text-lg font-semibold text-neutral-900 m-0">{title}</h3>
          <div className="flex gap-4 text-sm text-neutral-600 mr-auto">
            <span>共 {videos.length} 个视频</span>
            {videos.length > 0 && (
              <span>
                平均播放: {formatNumber(averagePlayCount)}
              </span>
            )}
          </div>
          <button
            className="ml-auto inline-flex items-center justify-center gap-2 px-[18px] py-2.5 border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-transparent text-neutral-600 border border-black/10 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {videos.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-neutral-400">
              <span>暂无视频</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {videos.map((video, index) => (
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
