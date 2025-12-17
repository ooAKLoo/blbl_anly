import { useMemo } from 'react';
import { formatNumber, parseDuration, parseDurationMinutes } from '../utils';
import { ACCOUNT_LEVEL_THRESHOLDS, DURATION_BINS, TREND_THRESHOLDS, ANALYSIS_THRESHOLDS } from '../utils/constants';

/**
 * 视频数据分析指标计算 hook
 * 提供各种统计指标和分析函数
 */
export function useVideoMetrics(analysisVideos, allVideos = null) {
  // ============ 基础统计指标 ============

  const totalPlays = useMemo(() => analysisVideos.reduce((sum, v) => sum + v.play_count, 0), [analysisVideos]);
  const totalDanmu = useMemo(() => analysisVideos.reduce((sum, v) => sum + v.danmu_count, 0), [analysisVideos]);
  const totalComments = useMemo(() => analysisVideos.reduce((sum, v) => sum + (v.comment_count || 0), 0), [analysisVideos]);
  const totalFavorites = useMemo(() => analysisVideos.reduce((sum, v) => sum + (v.favorite_count || 0), 0), [analysisVideos]);

  const avgPlays = useMemo(() => {
    if (analysisVideos.length === 0) return 0;
    return Math.round(totalPlays / analysisVideos.length);
  }, [analysisVideos.length, totalPlays]);

  const allVideosAvgPlays = useMemo(() => {
    if (!allVideos || allVideos.length === 0) return 0;
    const total = allVideos.reduce((sum, v) => sum + v.play_count, 0);
    return Math.round(total / allVideos.length);
  }, [allVideos]);

  const avgPlaysChange = useMemo(() => {
    if (allVideosAvgPlays === 0) return 0;
    return ((avgPlays - allVideosAvgPlays) / allVideosAvgPlays) * 100;
  }, [avgPlays, allVideosAvgPlays]);

  const avgEngagementRate = useMemo(() => {
    if (totalPlays === 0) return '0.00';
    const totalEngagement = totalDanmu + totalComments + totalFavorites;
    return ((totalEngagement / totalPlays) * 100).toFixed(2);
  }, [totalPlays, totalDanmu, totalComments, totalFavorites]);

  const hitRate = useMemo(() => {
    if (analysisVideos.length === 0) return '0.0';
    const threshold = avgPlays * 2;
    const hitCount = analysisVideos.filter(v => v.play_count >= threshold).length;
    return ((hitCount / analysisVideos.length) * 100).toFixed(1);
  }, [analysisVideos, avgPlays]);

  const monthlyPublishRate = useMemo(() => {
    if (analysisVideos.length === 0) return '0';
    const dates = analysisVideos.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const monthSpan = Math.max(1,
      (latest.getFullYear() - earliest.getFullYear()) * 12 +
      (latest.getMonth() - earliest.getMonth()) + 1
    );
    const rate = analysisVideos.length / monthSpan;
    return rate >= 10 ? Math.round(rate).toString() : rate.toFixed(1);
  }, [analysisVideos]);

  const avgDuration = useMemo(() => {
    if (analysisVideos.length === 0) return '0:00';
    const totalSeconds = analysisVideos.reduce((sum, v) => sum + parseDuration(v.duration), 0);
    const avgSeconds = Math.round(totalSeconds / analysisVideos.length);
    const minutes = Math.floor(avgSeconds / 60);
    const seconds = avgSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [analysisVideos]);

  const dataTimeRange = useMemo(() => {
    if (analysisVideos.length === 0) return '';
    const dates = analysisVideos.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const formatYM = (d) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${formatYM(earliest)} - ${formatYM(latest)}`;
  }, [analysisVideos]);

  // ============ 分析函数 ============

  function getAccountLevel(avgPlay) {
    return ACCOUNT_LEVEL_THRESHOLDS.find(t => avgPlay >= t.minAvgPlay) || ACCOUNT_LEVEL_THRESHOLDS[ACCOUNT_LEVEL_THRESHOLDS.length - 1];
  }

  function getBestDuration(videoList) {
    const stats = DURATION_BINS.map(bin => {
      const vids = videoList.filter(v => {
        const mins = parseDurationMinutes(v.duration);
        return mins >= bin.min && mins < bin.max;
      });
      const count = vids.length;
      const avgPlay = count > 0 ? vids.reduce((s, v) => s + v.play_count, 0) / count : 0;
      return { ...bin, count, avgPlay };
    }).filter(b => b.count >= ANALYSIS_THRESHOLDS.minSampleForDuration);

    if (stats.length === 0) return null;
    return stats.reduce((best, curr) => curr.avgPlay > best.avgPlay ? curr : best);
  }

  function getBestPublishTime(videoList) {
    const hourStats = {};
    for (let i = 0; i < 24; i++) hourStats[i] = { count: 0, totalPlay: 0 };

    videoList.forEach(v => {
      const hour = new Date(v.publish_time).getHours();
      hourStats[hour].count++;
      hourStats[hour].totalPlay += v.play_count;
    });

    const hourData = Object.entries(hourStats)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        count: data.count,
        avgPlay: data.count > 0 ? data.totalPlay / data.count : 0
      }))
      .filter(h => h.count >= ANALYSIS_THRESHOLDS.minSampleForHour);

    if (hourData.length === 0) return null;

    const best = hourData.reduce((b, c) => c.avgPlay > b.avgPlay ? c : b);
    const sortedByAvg = [...hourData].sort((a, b) => b.avgPlay - a.avgPlay).slice(0, 3);
    const hours = sortedByAvg.map(h => h.hour).sort((a, b) => a - b);

    return {
      bestHour: best.hour,
      avgPlay: best.avgPlay,
      topHours: hours.map(h => `${h}:00`)
    };
  }

  function getPublishFrequency(videoList) {
    if (videoList.length < 2) return null;

    const dates = videoList.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daySpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    const monthSpan = daySpan / 30;

    const monthlyRate = videoList.length / Math.max(1, monthSpan);
    const weeklyRate = videoList.length / Math.max(1, daySpan / 7);

    let frequency, suggestion;
    if (monthlyRate >= 12) {
      frequency = '高频';
      suggestion = '发布频率较高，注意保证内容质量';
    } else if (monthlyRate >= 4) {
      frequency = '稳定';
      suggestion = '发布节奏稳定，可继续保持';
    } else if (monthlyRate >= 1) {
      frequency = '适中';
      suggestion = '可适当提高发布频率以增加曝光';
    } else {
      frequency = '低频';
      suggestion = '建议增加发布频率，保持账号活跃度';
    }

    return { monthlyRate: monthlyRate.toFixed(1), weeklyRate: weeklyRate.toFixed(1), frequency, suggestion };
  }

  function getTrendAnalysis(videoList) {
    if (videoList.length < ANALYSIS_THRESHOLDS.minSampleForTrend) return null;

    const sorted = [...videoList].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const firstAvg = firstHalf.reduce((s, v) => s + v.play_count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v.play_count, 0) / secondHalf.length;

    const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend, description;
    if (changeRate > TREND_THRESHOLDS.strongUp) {
      trend = 'up';
      description = `近期表现明显上升，后半段视频均播放较前半段提升了 ${changeRate.toFixed(0)}%`;
    } else if (changeRate > TREND_THRESHOLDS.modUp) {
      trend = 'up';
      description = `整体呈上升趋势，后半段视频均播放提升了 ${changeRate.toFixed(0)}%`;
    } else if (changeRate < TREND_THRESHOLDS.strongDown) {
      trend = 'down';
      description = `近期表现有所下滑，后半段视频均播放下降了 ${Math.abs(changeRate).toFixed(0)}%`;
    } else if (changeRate < TREND_THRESHOLDS.modDown) {
      trend = 'down';
      description = `数据略有下降，后半段视频均播放下降了 ${Math.abs(changeRate).toFixed(0)}%`;
    } else {
      trend = 'stable';
      description = '整体表现稳定，前后期数据波动不大';
    }

    return { trend, changeRate, description, firstAvg, secondAvg };
  }

  function getHitVideoFeatures(videoList, avgPlay) {
    const hitThreshold = avgPlay * 2;
    const hitVideos = videoList.filter(v => v.play_count >= hitThreshold);

    if (hitVideos.length < 2) return null;

    const hitDurations = hitVideos.map(v => parseDurationMinutes(v.duration));
    const avgHitDuration = hitDurations.reduce((s, d) => s + d, 0) / hitDurations.length;

    const hitHours = hitVideos.map(v => new Date(v.publish_time).getHours());
    const hourCounts = {};
    hitHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      count: hitVideos.length,
      rate: ((hitVideos.length / videoList.length) * 100).toFixed(1),
      avgDuration: avgHitDuration.toFixed(0),
      topHour: topHour ? topHour[0] : null,
      titles: hitVideos.slice(0, 3).map(v => v.title)
    };
  }

  // ============ 长尾/利基分析函数 ============

  /**
   * 计算单个视频的互动率
   */
  function getVideoEngagementRate(video) {
    const engagement = video.danmu_count + (video.comment_count || 0) + (video.favorite_count || 0);
    return video.play_count > 0 ? (engagement / video.play_count) * 100 : 0;
  }

  /**
   * 获取"被低估的潜力内容"（低播放高互动）
   * 这些是位于长尾但具有高粉丝粘性的利基内容
   */
  function getUndervaluedContent(videoList) {
    if (videoList.length < 5) return null;

    const avgPlay = videoList.reduce((s, v) => s + v.play_count, 0) / videoList.length;
    const avgEngRate = videoList.reduce((s, v) => s + getVideoEngagementRate(v), 0) / videoList.length;

    // 筛选：播放量低于平均值，但互动率高于平均值的 1.5 倍
    const undervalued = videoList
      .map(v => ({
        ...v,
        engagementRate: getVideoEngagementRate(v)
      }))
      .filter(v => v.play_count < avgPlay && v.engagementRate > avgEngRate * 1.5)
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);

    if (undervalued.length === 0) return null;

    return {
      videos: undervalued,
      avgPlayThreshold: avgPlay,
      avgEngRateThreshold: avgEngRate * 1.5,
      insight: undervalued.length >= 3
        ? '发现多个被低估的内容，这可能代表一个尚未被充分挖掘的利基市场'
        : '存在少量被低估的内容，值得进一步研究其选题方向'
    };
  }

  /**
   * 获取长尾健康度分析
   * 分析头部、腰部、长尾的分布比例
   */
  function getLongTailHealth(videoList) {
    if (videoList.length < 10) return null;

    const avgPlay = videoList.reduce((s, v) => s + v.play_count, 0) / videoList.length;
    const sorted = [...videoList].sort((a, b) => b.play_count - a.play_count);

    // 定义头部（2倍均值以上）、腰部（0.5-2倍均值）、长尾（0.5倍均值以下）
    const head = videoList.filter(v => v.play_count >= avgPlay * 2);
    const waist = videoList.filter(v => v.play_count >= avgPlay * 0.5 && v.play_count < avgPlay * 2);
    const tail = videoList.filter(v => v.play_count < avgPlay * 0.5);

    // 分析长尾中的有效/无效内容
    const tailWithEngagement = tail.map(v => ({
      ...v,
      engagementRate: getVideoEngagementRate(v)
    }));

    const avgEngRate = videoList.reduce((s, v) => s + getVideoEngagementRate(v), 0) / videoList.length;
    const effectiveTail = tailWithEngagement.filter(v => v.engagementRate >= avgEngRate);
    const ineffectiveTail = tailWithEngagement.filter(v => v.engagementRate < avgEngRate * 0.5);

    // 计算头部贡献度（前20%视频贡献的播放量占比）
    const top20Count = Math.max(1, Math.floor(videoList.length * 0.2));
    const top20Plays = sorted.slice(0, top20Count).reduce((s, v) => s + v.play_count, 0);
    const totalPlays = videoList.reduce((s, v) => s + v.play_count, 0);
    const top20Contribution = (top20Plays / totalPlays * 100).toFixed(1);

    // 健康度评估
    let healthLevel, healthDesc;
    const headRatio = head.length / videoList.length;
    const effectiveTailRatio = effectiveTail.length / Math.max(1, tail.length);

    if (headRatio >= 0.15 && effectiveTailRatio >= 0.4) {
      healthLevel = 'excellent';
      healthDesc = '头尾均衡，长尾内容具有粘性价值';
    } else if (headRatio >= 0.1 || effectiveTailRatio >= 0.5) {
      healthLevel = 'good';
      healthDesc = '内容结构相对健康，有优化空间';
    } else if (headRatio < 0.05 && tail.length > videoList.length * 0.6) {
      healthLevel = 'risky';
      healthDesc = '过度依赖长尾，缺少头部内容支撑';
    } else {
      healthLevel = 'normal';
      healthDesc = '内容分布一般，建议优化选题策略';
    }

    return {
      head: { count: head.length, ratio: (head.length / videoList.length * 100).toFixed(1) },
      waist: { count: waist.length, ratio: (waist.length / videoList.length * 100).toFixed(1) },
      tail: { count: tail.length, ratio: (tail.length / videoList.length * 100).toFixed(1) },
      effectiveTail: { count: effectiveTail.length, ratio: tail.length > 0 ? (effectiveTail.length / tail.length * 100).toFixed(1) : '0' },
      ineffectiveTail: { count: ineffectiveTail.length, videos: ineffectiveTail.slice(0, 3) },
      top20Contribution,
      healthLevel,
      healthDesc,
      avgPlay
    };
  }

  /**
   * 获取蓝海时段分析（冷门但高效的发布时间）
   */
  function getBlueOceanTiming(videoList) {
    if (videoList.length < 20) return null;

    const hourStats = {};
    for (let i = 0; i < 24; i++) hourStats[i] = { count: 0, totalPlay: 0, videos: [] };

    videoList.forEach(v => {
      const hour = new Date(v.publish_time).getHours();
      hourStats[hour].count++;
      hourStats[hour].totalPlay += v.play_count;
      hourStats[hour].videos.push(v);
    });

    const hourData = Object.entries(hourStats)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        count: data.count,
        avgPlay: data.count > 0 ? data.totalPlay / data.count : 0,
        totalPlay: data.totalPlay
      }))
      .filter(h => h.count >= 1);

    // 找出发布量少但平均播放高的时段（蓝海）
    const totalCount = videoList.length;
    const avgPlayAll = videoList.reduce((s, v) => s + v.play_count, 0) / videoList.length;

    const blueOceanHours = hourData
      .filter(h => h.count < totalCount * 0.1 && h.avgPlay > avgPlayAll * 0.8 && h.count >= 2)
      .sort((a, b) => b.avgPlay - a.avgPlay);

    // 找出红海时段（竞争激烈）
    const redOceanHours = hourData
      .filter(h => h.count >= totalCount * 0.15)
      .sort((a, b) => b.count - a.count);

    if (blueOceanHours.length === 0 && redOceanHours.length === 0) return null;

    return {
      blueOcean: blueOceanHours.slice(0, 3).map(h => ({
        hour: h.hour,
        label: `${h.hour}:00`,
        avgPlay: h.avgPlay,
        count: h.count,
        efficiency: (h.avgPlay / avgPlayAll * 100).toFixed(0)
      })),
      redOcean: redOceanHours.slice(0, 3).map(h => ({
        hour: h.hour,
        label: `${h.hour}:00`,
        avgPlay: h.avgPlay,
        count: h.count,
        saturation: (h.count / totalCount * 100).toFixed(0)
      })),
      insight: blueOceanHours.length > 0
        ? `发现 ${blueOceanHours.length} 个潜在蓝海时段，竞争较少但效果不差`
        : '大部分时段竞争激烈，建议通过内容差异化突围'
    };
  }

  /**
   * 获取蓝海时长分析（冷门但高效的视频时长）
   */
  function getBlueOceanDuration(videoList) {
    if (videoList.length < 15) return null;

    const durationBins = [
      { min: 0, max: 3, label: '<3分钟' },
      { min: 3, max: 5, label: '3-5分钟' },
      { min: 5, max: 10, label: '5-10分钟' },
      { min: 10, max: 15, label: '10-15分钟' },
      { min: 15, max: 20, label: '15-20分钟' },
      { min: 20, max: 30, label: '20-30分钟' },
      { min: 30, max: 60, label: '30-60分钟' },
      { min: 60, max: Infinity, label: '>60分钟' }
    ];

    const stats = durationBins.map(bin => {
      const videos = videoList.filter(v => {
        const mins = parseDurationMinutes(v.duration);
        return mins >= bin.min && mins < bin.max;
      });
      const count = videos.length;
      const avgPlay = count > 0 ? videos.reduce((s, v) => s + v.play_count, 0) / count : 0;
      const avgEngRate = count > 0 ? videos.reduce((s, v) => s + getVideoEngagementRate(v), 0) / count : 0;
      return { ...bin, count, avgPlay, avgEngRate, videos };
    }).filter(b => b.count > 0);

    const totalCount = videoList.length;
    const avgPlayAll = videoList.reduce((s, v) => s + v.play_count, 0) / videoList.length;

    // 蓝海时长：占比少但效果好
    const blueOcean = stats
      .filter(s => s.count < totalCount * 0.15 && s.avgPlay > avgPlayAll * 0.7 && s.count >= 2)
      .sort((a, b) => b.avgPlay - a.avgPlay);

    // 主流时长
    const mainstream = stats
      .filter(s => s.count >= totalCount * 0.2)
      .sort((a, b) => b.count - a.count);

    // 深度内容偏好分析（长视频表现）
    const longFormVideos = videoList.filter(v => parseDurationMinutes(v.duration) >= 20);
    const shortFormVideos = videoList.filter(v => parseDurationMinutes(v.duration) < 5);

    let depthPreference = null;
    if (longFormVideos.length >= 3 && shortFormVideos.length >= 3) {
      const longAvgPlay = longFormVideos.reduce((s, v) => s + v.play_count, 0) / longFormVideos.length;
      const shortAvgPlay = shortFormVideos.reduce((s, v) => s + v.play_count, 0) / shortFormVideos.length;
      const longAvgEng = longFormVideos.reduce((s, v) => s + getVideoEngagementRate(v), 0) / longFormVideos.length;
      const shortAvgEng = shortFormVideos.reduce((s, v) => s + getVideoEngagementRate(v), 0) / shortFormVideos.length;

      if (longAvgPlay > shortAvgPlay * 1.2 || longAvgEng > shortAvgEng * 1.3) {
        depthPreference = {
          type: 'long',
          desc: '该账号粉丝更偏好深度长内容，长视频表现优于短视频',
          longAvgPlay,
          shortAvgPlay,
          longAvgEng: longAvgEng.toFixed(2),
          shortAvgEng: shortAvgEng.toFixed(2)
        };
      } else if (shortAvgPlay > longAvgPlay * 1.5) {
        depthPreference = {
          type: 'short',
          desc: '短视频更受欢迎，建议以短内容为主',
          longAvgPlay,
          shortAvgPlay
        };
      }
    }

    return {
      blueOcean: blueOcean.slice(0, 3).map(s => ({
        label: s.label,
        count: s.count,
        avgPlay: s.avgPlay,
        efficiency: (s.avgPlay / avgPlayAll * 100).toFixed(0)
      })),
      mainstream: mainstream.slice(0, 2).map(s => ({
        label: s.label,
        count: s.count,
        ratio: (s.count / totalCount * 100).toFixed(0),
        avgPlay: s.avgPlay
      })),
      depthPreference,
      stats
    };
  }

  /**
   * 获取四象限分析数据（用于散点图）
   * 以平均播放量和平均互动率为轴，划分四个象限
   */
  function getQuadrantAnalysis(videoList) {
    if (videoList.length < 10) return null;

    const avgPlay = videoList.reduce((s, v) => s + v.play_count, 0) / videoList.length;
    const videosWithEng = videoList.map(v => ({
      ...v,
      engagementRate: getVideoEngagementRate(v)
    }));
    const avgEngRate = videosWithEng.reduce((s, v) => s + v.engagementRate, 0) / videosWithEng.length;

    // 四象限分类
    const quadrants = {
      // 右上：高播放高互动 - 明星内容
      star: videosWithEng.filter(v => v.play_count >= avgPlay && v.engagementRate >= avgEngRate),
      // 左上：低播放高互动 - 利基宝藏
      niche: videosWithEng.filter(v => v.play_count < avgPlay && v.engagementRate >= avgEngRate),
      // 右下：高播放低互动 - 流量内容
      traffic: videosWithEng.filter(v => v.play_count >= avgPlay && v.engagementRate < avgEngRate),
      // 左下：低播放低互动 - 需优化内容
      weak: videosWithEng.filter(v => v.play_count < avgPlay && v.engagementRate < avgEngRate)
    };

    return {
      avgPlay,
      avgEngRate,
      quadrants: {
        star: {
          count: quadrants.star.length,
          ratio: (quadrants.star.length / videoList.length * 100).toFixed(1),
          label: '明星内容',
          desc: '高播放高互动，是账号的核心资产',
          videos: quadrants.star.sort((a, b) => b.play_count - a.play_count).slice(0, 3)
        },
        niche: {
          count: quadrants.niche.length,
          ratio: (quadrants.niche.length / videoList.length * 100).toFixed(1),
          label: '利基宝藏',
          desc: '播放不高但粉丝很喜欢，可能是未被发掘的蓝海选题',
          videos: quadrants.niche.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 3)
        },
        traffic: {
          count: quadrants.traffic.length,
          ratio: (quadrants.traffic.length / videoList.length * 100).toFixed(1),
          label: '流量内容',
          desc: '能获取流量但粉丝粘性一般，注意不要过度依赖',
          videos: quadrants.traffic.sort((a, b) => b.play_count - a.play_count).slice(0, 3)
        },
        weak: {
          count: quadrants.weak.length,
          ratio: (quadrants.weak.length / videoList.length * 100).toFixed(1),
          label: '待优化',
          desc: '表现不佳的内容，可分析原因或考虑调整方向',
          videos: quadrants.weak.slice(0, 3)
        }
      }
    };
  }

  function generateDataSummary(upName) {
    const videoList = analysisVideos;
    if (videoList.length === 0) return '';

    const topVideos = [...videoList].sort((a, b) => b.play_count - a.play_count).slice(0, 10);
    const bottomVideos = [...videoList].sort((a, b) => a.play_count - b.play_count).slice(0, 5);

    const durationBins = { '<5min': 0, '5-10min': 0, '10-20min': 0, '>20min': 0 };
    videoList.forEach(v => {
      const mins = parseDurationMinutes(v.duration);
      if (mins < 5) durationBins['<5min']++;
      else if (mins < 10) durationBins['5-10min']++;
      else if (mins < 20) durationBins['10-20min']++;
      else durationBins['>20min']++;
    });

    const hourBins = {};
    videoList.forEach(v => {
      const hour = new Date(v.publish_time).getHours();
      const slot = hour < 6 ? '0-6点' : hour < 12 ? '6-12点' : hour < 18 ? '12-18点' : '18-24点';
      hourBins[slot] = (hourBins[slot] || 0) + 1;
    });

    const formatVideoDetail = (v, i) => {
      const engRate = getVideoEngagementRate(v);
      const desc = v.description ? `\n   简介：${v.description.slice(0, 100)}${v.description.length > 100 ? '...' : ''}` : '';
      return `${i + 1}. 「${v.title}」
   播放：${formatNumber(v.play_count)} | 弹幕：${formatNumber(v.danmu_count)} | 互动率：${engRate.toFixed(2)}% | 时长：${v.duration}${desc}`;
    };

    const median = videoList.map(v => v.play_count).sort((a, b) => a - b)[Math.floor(videoList.length / 2)];

    // 长尾分析数据
    const longTailHealth = getLongTailHealth(videoList);
    const undervalued = getUndervaluedContent(videoList);
    const quadrant = getQuadrantAnalysis(videoList);

    let longTailSection = '';
    if (longTailHealth) {
      longTailSection = `
【内容分布结构（长尾分析）】
- 头部内容（2倍均值以上）：${longTailHealth.head.count} 个（${longTailHealth.head.ratio}%）
- 腰部内容（0.5-2倍均值）：${longTailHealth.waist.count} 个（${longTailHealth.waist.ratio}%）
- 长尾内容（0.5倍均值以下）：${longTailHealth.tail.count} 个（${longTailHealth.tail.ratio}%）
- 有效长尾占比（长尾中互动率达标）：${longTailHealth.effectiveTail.ratio}%
- 前20%视频贡献播放量：${longTailHealth.top20Contribution}%
- 健康度评估：${longTailHealth.healthDesc}`;
    }

    let undervaluedSection = '';
    if (undervalued && undervalued.videos.length > 0) {
      undervaluedSection = `

【被低估的潜力内容（低播放高互动）】
洞察：${undervalued.insight}
${undervalued.videos.map((v, i) => `${i + 1}. 「${v.title}」
   播放：${formatNumber(v.play_count)} | 互动率：${v.engagementRate.toFixed(2)}%（高于均值${((v.engagementRate / (undervalued.avgEngRateThreshold / 1.5) - 1) * 100).toFixed(0)}%）`).join('\n')}`;
    }

    let quadrantSection = '';
    if (quadrant) {
      quadrantSection = `

【四象限内容分类】
- 明星内容（高播高互动）：${quadrant.quadrants.star.count} 个（${quadrant.quadrants.star.ratio}%）
- 利基宝藏（低播高互动）：${quadrant.quadrants.niche.count} 个（${quadrant.quadrants.niche.ratio}%）← 潜在蓝海
- 流量内容（高播低互动）：${quadrant.quadrants.traffic.count} 个（${quadrant.quadrants.traffic.ratio}%）
- 待优化（低播低互动）：${quadrant.quadrants.weak.count} 个（${quadrant.quadrants.weak.ratio}%）`;
    }

    return `【账号数据概况】
- UP主：${upName || '未知'}
- 分析视频数：${videoList.length} 个
- 数据时间范围：${dataTimeRange}
- 总播放量：${formatNumber(totalPlays)}
- 场均播放：${formatNumber(avgPlays)}
- 播放量中位数：${formatNumber(median)}
- 爆款率（2倍均播放以上）：${hitRate}%
- 互动率（弹幕+评论+收藏/播放）：${avgEngagementRate}%
- 月均发布：${monthlyPublishRate} 条
- 平均视频时长：${avgDuration}
${longTailSection}${quadrantSection}

【时长分布】
${Object.entries(durationBins).map(([k, v]) => `- ${k}：${v} 个（${(v / videoList.length * 100).toFixed(1)}%）`).join('\n')}

【发布时间分布】
${Object.entries(hourBins).map(([k, v]) => `- ${k}：${v} 个`).join('\n')}

【TOP10 高播放视频详情】
${topVideos.map((v, i) => formatVideoDetail(v, i)).join('\n\n')}

【低播放视频样本（用于对比分析）】
${bottomVideos.map((v, i) => formatVideoDetail(v, i)).join('\n\n')}${undervaluedSection}`;
  }

  return {
    // 基础指标
    totalPlays,
    totalDanmu,
    totalComments,
    totalFavorites,
    avgPlays,
    allVideosAvgPlays,
    avgPlaysChange,
    avgEngagementRate,
    hitRate,
    monthlyPublishRate,
    avgDuration,
    dataTimeRange,
    // 分析函数
    getAccountLevel,
    getBestDuration,
    getBestPublishTime,
    getPublishFrequency,
    getTrendAnalysis,
    getHitVideoFeatures,
    generateDataSummary,
    // 长尾/利基分析函数
    getVideoEngagementRate,
    getUndervaluedContent,
    getLongTailHealth,
    getBlueOceanTiming,
    getBlueOceanDuration,
    getQuadrantAnalysis
  };
}
