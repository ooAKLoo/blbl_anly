import React from 'react';
import { motion } from 'framer-motion';
import { TIME_RANGE_OPTIONS, DURATION_OPTIONS } from '../utils/constants';

const springTransition = { type: 'spring', stiffness: 500, damping: 35 };

export default function VideoFilterBar({
  timeRange = 'all',
  duration = 'all',
  onUpdateTimeRange,
  onUpdateDuration,
  children
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* 时间筛选 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">时间范围</span>
        <div className="flex items-center gap-1">
          {TIME_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdateTimeRange?.(option.value)}
              className="relative px-2.5 py-1 text-xs font-medium rounded-md z-[1]"
            >
              {timeRange === option.value && (
                <motion.div
                  layoutId="filter-time-range-indicator"
                  className="absolute inset-0 bg-neutral-900 rounded-md"
                  transition={springTransition}
                />
              )}
              <span className={`relative z-[1] transition-colors duration-200 ${
                timeRange === option.value ? 'text-white' : 'text-neutral-500 hover:text-neutral-700'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-4 bg-neutral-200"></div>

      {/* 时长筛选 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">视频时长</span>
        <div className="flex items-center gap-1">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdateDuration?.(option.value)}
              className="relative px-2.5 py-1 text-xs font-medium rounded-md z-[1]"
            >
              {duration === option.value && (
                <motion.div
                  layoutId="filter-duration-indicator"
                  className="absolute inset-0 bg-neutral-900 rounded-md"
                  transition={springTransition}
                />
              )}
              <span className={`relative z-[1] transition-colors duration-200 ${
                duration === option.value ? 'text-white' : 'text-neutral-500 hover:text-neutral-700'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧插槽 */}
      <div className="flex items-center gap-2 ml-auto">
        {children}
      </div>
    </div>
  );
}
