import { useMemo } from 'react';

/**
 * 处理成长数据的 hook
 * 将视频数据转换为成长曲线所需的数据格式
 * 
 * @param {Array} videos - 视频数组
 * @returns {Object} 包含成长数据、时间映射、里程碑等
 */
export function useGrowthData(videos) {
  // 按时间排序并计算累积数据
  const growthData = useMemo(() => {
    if (!videos || videos.length === 0) {
      return [{ timeProgress: 0, cumulative: 0, date: new Date() }];
    }

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const firstDate = new Date(sorted[0].publish_time).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].publish_time).getTime();
    const totalTimeSpan = lastDate - firstDate || 1;

    let cumulative = 0;
    return sorted.map((v, i) => {
      cumulative += v.play_count;
      const currentDate = new Date(v.publish_time).getTime();
      return {
        index: i,
        cumulative,
        playCount: v.play_count,
        date: new Date(v.publish_time),
        timeProgress: (currentDate - firstDate) / totalTimeSpan,
        title: v.title
      };
    });
  }, [videos]);

  // 时间到数据的映射
  const timeToDataMap = useMemo(() => {
    if (growthData.length < 2) return [];

    const maxCumulative = growthData[growthData.length - 1].cumulative;

    return growthData.map(d => ({
      timeProgress: d.timeProgress,
      playProgress: d.cumulative / maxCumulative,
      cumulative: d.cumulative,
      videoCount: d.index + 1,
      date: d.date
    }));
  }, [growthData]);

  // 根据时间进度获取数据的函数
  const getPlayProgressAtTime = (timeProgress) => {
    if (timeToDataMap.length < 2) {
      return { playProgress: 0, cumulative: 0, videoCount: 0, date: new Date() };
    }

    for (let i = 1; i < timeToDataMap.length; i++) {
      if (timeProgress <= timeToDataMap[i].timeProgress) {
        const prev = timeToDataMap[i - 1];
        const curr = timeToDataMap[i];
        const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

        return {
          playProgress: prev.playProgress + (curr.playProgress - prev.playProgress) * segmentProgress,
          cumulative: Math.floor(prev.cumulative + (curr.cumulative - prev.cumulative) * segmentProgress),
          videoCount: prev.videoCount + Math.floor((curr.videoCount - prev.videoCount) * segmentProgress),
          date: new Date(prev.date.getTime() + (curr.date.getTime() - prev.date.getTime()) * segmentProgress)
        };
      }
    }

    const last = timeToDataMap[timeToDataMap.length - 1];
    return { 
      playProgress: last.playProgress, 
      cumulative: last.cumulative, 
      videoCount: last.videoCount, 
      date: last.date 
    };
  };

  // 计算里程碑
  const milestones = useMemo(() => {
    if (growthData.length < 2) return [];

    const result = [];
    const maxCumulative = growthData[growthData.length - 1].cumulative;

    // 1. 首个视频
    result.push({
      id: 'first',
      index: 0,
      type: 'first',
      label: '起点',
      color: '#6366f1',
      timeProgress: growthData[0].timeProgress,
      cumulative: growthData[0].cumulative
    });

    // 2. 播放量里程碑
    const playMilestones = [10000, 100000, 1000000, 10000000, 100000000];
    const labels = {
      10000: '1万',
      100000: '10万',
      1000000: '100万',
      10000000: '1000万',
      100000000: '1亿'
    };

    playMilestones.forEach(threshold => {
      const idx = growthData.findIndex(d => d.cumulative >= threshold);
      if (idx > 0 && threshold <= maxCumulative) {
        result.push({
          id: `play-${threshold}`,
          index: idx,
          type: 'play-milestone',
          label: labels[threshold],
          color: '#10b981',
          timeProgress: growthData[idx].timeProgress,
          cumulative: growthData[idx].cumulative
        });
      }
    });

    // 3. 最高播放视频
    let maxPlayIdx = 0;
    let maxPlay = 0;
    growthData.forEach((d, i) => {
      if (d.playCount > maxPlay) {
        maxPlay = d.playCount;
        maxPlayIdx = i;
      }
    });
    
    if (maxPlayIdx > 0 && maxPlay > 10000) {
      result.push({
        id: 'peak',
        index: maxPlayIdx,
        type: 'peak',
        label: '爆款',
        color: '#f59e0b',
        timeProgress: growthData[maxPlayIdx].timeProgress,
        cumulative: growthData[maxPlayIdx].cumulative
      });
    }

    return result;
  }, [growthData]);

  // 时间标签
  const journeyLabels = useMemo(() => {
    if (!videos || videos.length === 0) {
      return { start: '', end: '现在' };
    }

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const startDate = new Date(sorted[0].publish_time);
    const endDate = new Date(sorted[sorted.length - 1].publish_time);
    const now = new Date();

    const start = `${startDate.getFullYear()}.${startDate.getMonth() + 1}`;
    const end = (now - endDate) < 30 * 24 * 60 * 60 * 1000 
      ? '现在' 
      : `${endDate.getFullYear()}.${endDate.getMonth() + 1}`;

    return { start, end };
  }, [videos]);

  return {
    growthData,
    timeToDataMap,
    getPlayProgressAtTime,
    milestones,
    journeyLabels
  };
}
