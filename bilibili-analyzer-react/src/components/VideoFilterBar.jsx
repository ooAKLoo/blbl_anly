import React from 'react';
import { TIME_RANGE_OPTIONS, DURATION_OPTIONS } from '../utils/constants';

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
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                timeRange === option.value
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {option.label}
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
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                duration === option.value
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {option.label}
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
