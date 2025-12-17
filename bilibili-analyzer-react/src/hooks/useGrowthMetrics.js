import { useMemo } from 'react';

/**
 * 成长历程数据计算 hook
 * 为 GrowthJourney 页面提供所有数据计算逻辑
 */
export function useGrowthMetrics(videos) {
  // ============ 基础数据 ============

  // 按发布时间排序的视频列表
  const sortedVideos = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    return [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
  }, [videos]);

  // 创作起点日期
  const journeyStart = useMemo(() => {
    if (sortedVideos.length === 0) return '';
    const date = new Date(sortedVideos[0].publish_time);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }, [sortedVideos]);

  // 创作总天数
  const totalDays = useMemo(() => {
    if (sortedVideos.length < 2) return 0;
    const first = new Date(sortedVideos[0].publish_time);
    const last = new Date(sortedVideos[sortedVideos.length - 1].publish_time);
    return Math.ceil((last - first) / (1000 * 60 * 60 * 24));
  }, [sortedVideos]);

  // 总播放量
  const totalPlays = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.play_count, 0);
  }, [videos]);

  // 首个视频播放量
  const firstVideoPlays = useMemo(() => {
    if (sortedVideos.length === 0) return 0;
    return sortedVideos[0].play_count;
  }, [sortedVideos]);

  // 场均播放
  const avgPlay = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    return totalPlays / videos.length;
  }, [videos, totalPlays]);

  // 最高播放视频
  const maxPlayVideo = useMemo(() => {
    if (sortedVideos.length === 0) return null;
    return sortedVideos.reduce((max, v) => v.play_count > max.play_count ? v : max, sortedVideos[0]);
  }, [sortedVideos]);

  // 成长倍数（前10个 vs 后10个视频的均播对比）
  const growthMultiple = useMemo(() => {
    if (sortedVideos.length < 10) return 1;
    const first10 = sortedVideos.slice(0, 10);
    const last10 = sortedVideos.slice(-10);
    const firstAvg = first10.reduce((s, v) => s + v.play_count, 0) / 10;
    const lastAvg = last10.reduce((s, v) => s + v.play_count, 0) / 10;
    if (firstAvg === 0) return lastAvg > 0 ? 99 : 1;
    return parseFloat((lastAvg / firstAvg).toFixed(1));
  }, [sortedVideos]);

  // ============ 故事化标签系统 ============

  // 格式化数字：让大数字更易读
  const formatTagNumber = (num) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  // 故事化标签
  const creatorTags = useMemo(() => {
    const vids = sortedVideos;
    if (vids.length === 0) return [];

    const days = totalDays || 1;
    const allTags = [];

    // 基础数据
    const avg = avgPlay;
    const firstPlay = firstVideoPlays;
    const maxPlay = maxPlayVideo?.play_count || 0;

    // ========== 一、「起点」故事标签 ==========
    if (firstPlay < 100) {
      allTags.push({ text: `从${firstPlay}次播放开始`, type: 'origin', priority: 95 });
    } else if (firstPlay < 500) {
      allTags.push({ text: `从${firstPlay}次播放开始`, type: 'origin', priority: 90 });
    } else if (firstPlay < 1000) {
      allTags.push({ text: '沉默的起点', type: 'origin', priority: 70 });
    } else if (firstPlay > avg * 3 && firstPlay > 10000) {
      allTags.push({ text: '出道即巅峰', type: 'origin', priority: 85 });
    }

    // ========== 二、「转折点」故事标签 ==========
    const absoluteHitThreshold = 10000;

    if (firstPlay >= absoluteHitThreshold) {
      allTags.push({ text: '首发即爆款', type: 'breakthrough', priority: 80 });
    } else {
      const firstHitIndex = vids.findIndex(v => v.play_count >= absoluteHitThreshold);
      if (firstHitIndex > 30) {
        allTags.push({ text: `第${firstHitIndex + 1}个视频才被看见`, type: 'breakthrough', priority: 92 });
      } else if (firstHitIndex > 10) {
        allTags.push({ text: `第${firstHitIndex + 1}个视频才爆发`, type: 'breakthrough', priority: 85 });
      } else if (firstHitIndex > 5) {
        allTags.push({ text: `第${firstHitIndex + 1}个视频才起飞`, type: 'breakthrough', priority: 75 });
      }
    }

    // 连续爆款
    const relativeHitThreshold = Math.max(avg * 0.8, 10000);
    let maxConsecutiveHits = 0;
    let currentStreak = 0;
    vids.forEach(v => {
      if (v.play_count > relativeHitThreshold) {
        currentStreak++;
        maxConsecutiveHits = Math.max(maxConsecutiveHits, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    if (maxConsecutiveHits >= 20) {
      allTags.push({ text: `连续${maxConsecutiveHits}个爆款`, type: 'streak', priority: 78 });
    } else if (maxConsecutiveHits >= 10) {
      allTags.push({ text: `连续${maxConsecutiveHits}个爆款`, type: 'streak', priority: 72 });
    }

    // ========== 三、「反差」故事标签 ==========
    const ratio = maxPlay / Math.max(firstPlay, 1);

    if (ratio >= 1000 && firstPlay < 1000) {
      allTags.push({
        text: `从${formatTagNumber(firstPlay)}到${formatTagNumber(maxPlay)}`,
        type: 'contrast',
        priority: 98
      });
    } else if (ratio >= 100) {
      allTags.push({ text: `播放增长${Math.floor(ratio)}倍`, type: 'contrast', priority: 88 });
    } else if (ratio >= 10) {
      allTags.push({ text: `播放增长${Math.floor(ratio)}倍`, type: 'contrast', priority: 78 });
    }

    // 后半程爆发
    const midIndex = Math.floor(vids.length / 2);
    if (vids.length >= 20) {
      const firstHalfAvg = vids.slice(0, midIndex).reduce((s, v) => s + v.play_count, 0) / midIndex;
      const secondHalfAvg = vids.slice(midIndex).reduce((s, v) => s + v.play_count, 0) / (vids.length - midIndex);
      if (secondHalfAvg > firstHalfAvg * 3) {
        allTags.push({ text: '后半程爆发', type: 'contrast', priority: 82 });
      }
    }

    // ========== 四、「极端值」故事标签 ==========

    // 最长沉默期
    let maxGapDays = 0;
    for (let i = 1; i < vids.length; i++) {
      const gap = new Date(vids[i].publish_time) - new Date(vids[i - 1].publish_time);
      const gapDays = gap / (1000 * 60 * 60 * 24);
      maxGapDays = Math.max(maxGapDays, gapDays);
    }
    if (maxGapDays > 180) {
      allTags.push({ text: `最长沉默${Math.floor(maxGapDays)}天`, type: 'extreme', priority: 72 });
    } else if (maxGapDays > 90) {
      allTags.push({ text: `曾消失${Math.floor(maxGapDays)}天`, type: 'extreme', priority: 65 });
    }

    // 爆款率
    const hitCount = vids.filter(v => v.play_count > relativeHitThreshold).length;
    const hitRate = hitCount / vids.length;
    if (hitRate > 0.5 && vids.length >= 10) {
      allTags.push({ text: `${Math.round(hitRate * 100)}%都是爆款`, type: 'extreme', priority: 86 });
    } else if (hitRate > 0.3 && vids.length >= 10) {
      allTags.push({ text: '高爆款率选手', type: 'extreme', priority: 70 });
    }

    // 深度内容
    const avgDuration = vids.reduce((sum, v) => {
      const parts = String(v.duration || '0:0').split(':');
      const minutes = parts.length >= 2 ? parseInt(parts[0]) + parseInt(parts[1]) / 60 : 0;
      return sum + minutes;
    }, 0) / vids.length;

    if (avgDuration > 20) {
      allTags.push({ text: `平均${Math.round(avgDuration)}分钟深度内容`, type: 'content', priority: 68 });
    } else if (avgDuration > 15) {
      allTags.push({ text: '深度内容创作者', type: 'content', priority: 60 });
    }

    // 凌晨创作者
    const lateNightCount = vids.filter(v => {
      const hour = new Date(v.publish_time).getHours();
      return hour >= 0 && hour < 5;
    }).length;
    if (lateNightCount / vids.length > 0.3) {
      allTags.push({ text: '凌晨还在创作', type: 'extreme', priority: 55 });
    }

    // ========== 五、「互动」故事标签 ==========
    const totalDanmu = vids.reduce((sum, v) => sum + (v.danmu_count || 0), 0);
    const totalComments = vids.reduce((sum, v) => sum + (v.comment_count || 0), 0);
    const avgDanmu = totalDanmu / vids.length;
    const danmuRate = totalDanmu / (totalPlays || 1);
    const commentRate = totalComments / (totalPlays || 1);

    if (avgDanmu > 10000) {
      allTags.push({ text: `场均${formatTagNumber(Math.round(avgDanmu))}弹幕`, type: 'engagement', priority: 76 });
    } else if (avgDanmu > 5000) {
      allTags.push({ text: '弹幕狂欢', type: 'engagement', priority: 66 });
    } else if (danmuRate > 0.02) {
      allTags.push({ text: '弹幕超活跃', type: 'engagement', priority: 62 });
    }

    if (commentRate > 0.01) {
      allTags.push({ text: '评论区很热闹', type: 'engagement', priority: 58 });
    }

    // ========== 六、「坚持」故事标签 ==========
    const years = Math.floor(days / 365);
    if (days >= 2000) {
      allTags.push({ text: `坚持了${Math.floor(days)}天`, type: 'persistence', priority: 84 });
    } else if (years >= 5) {
      allTags.push({ text: `${years}年老创作者`, type: 'persistence', priority: 74 });
    } else if (days >= 1000) {
      allTags.push({ text: '千日坚持', type: 'persistence', priority: 73 });
    } else if (years >= 3) {
      allTags.push({ text: `创作${years}年`, type: 'persistence', priority: 64 });
    }

    // 作品数量里程碑
    if (vids.length >= 500) {
      allTags.push({ text: `${vids.length}个作品`, type: 'milestone', priority: 71 });
    } else if (vids.length >= 200) {
      allTags.push({ text: `${vids.length}个作品`, type: 'milestone', priority: 56 });
    }

    // ========== 标签筛选与排序 ==========
    const sortedTags = allTags.sort((a, b) => b.priority - a.priority);
    const typeCount = {};
    const finalTags = [];

    for (const tag of sortedTags) {
      if (finalTags.length >= 5) break;
      const count = typeCount[tag.type] || 0;
      if (count < 2) {
        finalTags.push(tag);
        typeCount[tag.type] = count + 1;
      }
    }

    return finalTags;
  }, [sortedVideos, totalDays, avgPlay, firstVideoPlays, maxPlayVideo, totalPlays]);

  return {
    // 基础数据
    sortedVideos,
    journeyStart,
    totalDays,
    totalPlays,
    firstVideoPlays,
    avgPlay,
    maxPlayVideo,
    growthMultiple,
    // 标签
    creatorTags,
    // 工具函数
    formatTagNumber
  };
}
