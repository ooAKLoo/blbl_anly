import { useState, useMemo, useCallback } from 'react';
import { parseDurationMinutes } from '../utils';

/**
 * 视频筛选 hook
 * 提供时间范围和时长筛选功能，支持自定义日期范围
 */
export function useVideoFilter(videos, options = {}) {
  const { enableCustomDateRange = false } = options;

  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  /**
   * 根据时间范围获取起始日期
   */
  function getStartDate(timeRange, customStart = null, customEnd = null) {
    if (timeRange === 'all') return null;

    if (timeRange === 'custom' && customStart) {
      return new Date(customStart);
    }

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
   * 获取结束日期（仅用于自定义范围）
   */
  function getEndDate(timeRange, customEnd = null) {
    if (timeRange === 'custom' && customEnd) {
      const endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    return null;
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
    const startDate = getStartDate(selectedTimeRange, customStartDate, customEndDate);
    const endDate = getEndDate(selectedTimeRange, customEndDate);

    if (startDate) {
      result = result.filter(v => {
        const publishDate = new Date(v.publish_time);
        return publishDate >= startDate && (!endDate || publishDate <= endDate);
      });
    }

    // 时长筛选
    if (selectedDuration !== 'all') {
      result = result.filter(v => matchesDuration(v, selectedDuration));
    }

    return result;
  }, [videos, selectedTimeRange, selectedDuration, customStartDate, customEndDate]);

  /**
   * 通用的视频筛选函数（可以直接传入视频数组）
   */
  const filterVideos = useCallback((videosToFilter) => {
    let result = videosToFilter;

    // 时间范围筛选
    const startDate = getStartDate(selectedTimeRange, customStartDate, customEndDate);
    const endDate = getEndDate(selectedTimeRange, customEndDate);

    if (startDate) {
      result = result.filter(v => {
        const publishDate = new Date(v.publish_time);
        return publishDate >= startDate && (!endDate || publishDate <= endDate);
      });
    }

    // 时长筛选
    if (selectedDuration !== 'all') {
      result = result.filter(v => matchesDuration(v, selectedDuration));
    }

    return result;
  }, [selectedTimeRange, selectedDuration, customStartDate, customEndDate]);

  return {
    // 筛选状态
    selectedTimeRange,
    setSelectedTimeRange,
    selectedDuration,
    setSelectedDuration,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    // 筛选结果
    filteredVideos,
    // 工具函数
    filterVideos,
    getStartDate: () => getStartDate(selectedTimeRange, customStartDate, customEndDate),
    getEndDate: () => getEndDate(selectedTimeRange, customEndDate)
  };
}
