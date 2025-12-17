import { useState, useMemo } from 'react';
import { parseDurationMinutes } from '../utils';

/**
 * 视频筛选 hook
 * 提供时间范围和时长筛选功能
 */
export function useVideoFilter(videos) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  /**
   * 根据时间范围获取起始日期
   */
  function getStartDate(timeRange) {
    if (timeRange === 'all') return null;

    const now = new Date();
    switch (timeRange) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'thisYear':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null;
    }
  }

  /**
   * 检查视频时长是否符合筛选条件
   */
  function matchesDuration(video, durationFilter) {
    if (durationFilter === 'all') return true;

    const minutes = parseDurationMinutes(video.duration);
    switch (durationFilter) {
      case 'short':
        return minutes < 5;
      case 'medium':
        return minutes >= 5 && minutes <= 20;
      case 'long':
        return minutes > 20;
      default:
        return true;
    }
  }

  /**
   * 筛选后的视频列表
   */
  const filteredVideos = useMemo(() => {
    let result = videos;

    // 时间范围筛选
    const startDate = getStartDate(selectedTimeRange);
    if (startDate) {
      result = result.filter(v => new Date(v.publish_time) >= startDate);
    }

    // 时长筛选
    if (selectedDuration !== 'all') {
      result = result.filter(v => matchesDuration(v, selectedDuration));
    }

    return result;
  }, [videos, selectedTimeRange, selectedDuration]);

  return {
    selectedTimeRange,
    setSelectedTimeRange,
    selectedDuration,
    setSelectedDuration,
    filteredVideos
  };
}
