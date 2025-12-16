import { computed } from 'vue';
import { formatNumber, parseDuration, parseDurationMinutes } from '../utils';

/**
 * 视频数据分析指标计算 composable
 * 提供各种统计指标和分析函数
 */
export function useVideoMetrics(analysisVideos, allVideosArg = null) {
  // ============ 基础统计指标 ============

  const totalPlays = computed(() => analysisVideos.value.reduce((sum, v) => sum + v.play_count, 0));
  const totalDanmu = computed(() => analysisVideos.value.reduce((sum, v) => sum + v.danmu_count, 0));
  const totalComments = computed(() => analysisVideos.value.reduce((sum, v) => sum + (v.comment_count || 0), 0));
  const totalFavorites = computed(() => analysisVideos.value.reduce((sum, v) => sum + (v.favorite_count || 0), 0));

  const avgPlays = computed(() => {
    if (analysisVideos.value.length === 0) return 0;
    return Math.round(totalPlays.value / analysisVideos.value.length);
  });

  const allVideosAvgPlays = computed(() => {
    if (!allVideosArg || !allVideosArg.value || allVideosArg.value.length === 0) return 0;
    const total = allVideosArg.value.reduce((sum, v) => sum + v.play_count, 0);
    return Math.round(total / allVideosArg.value.length);
  });

  const avgPlaysChange = computed(() => {
    if (allVideosAvgPlays.value === 0) return 0;
    return ((avgPlays.value - allVideosAvgPlays.value) / allVideosAvgPlays.value) * 100;
  });

  const avgEngagementRate = computed(() => {
    if (totalPlays.value === 0) return '0.00';
    const totalEngagement = totalDanmu.value + totalComments.value + totalFavorites.value;
    return ((totalEngagement / totalPlays.value) * 100).toFixed(2);
  });

  const hitRate = computed(() => {
    if (analysisVideos.value.length === 0) return '0.0';
    const threshold = avgPlays.value * 2;
    const hitCount = analysisVideos.value.filter(v => v.play_count >= threshold).length;
    return ((hitCount / analysisVideos.value.length) * 100).toFixed(1);
  });

  const monthlyPublishRate = computed(() => {
    if (analysisVideos.value.length === 0) return '0';
    const dates = analysisVideos.value.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const monthSpan = Math.max(1,
      (latest.getFullYear() - earliest.getFullYear()) * 12 +
      (latest.getMonth() - earliest.getMonth()) + 1
    );
    const rate = analysisVideos.value.length / monthSpan;
    return rate >= 10 ? Math.round(rate).toString() : rate.toFixed(1);
  });

  const avgDuration = computed(() => {
    if (analysisVideos.value.length === 0) return '0:00';
    const totalSeconds = analysisVideos.value.reduce((sum, v) => sum + parseDuration(v.duration), 0);
    const avgSeconds = Math.round(totalSeconds / analysisVideos.value.length);
    const minutes = Math.floor(avgSeconds / 60);
    const seconds = avgSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  const dataTimeRange = computed(() => {
    if (analysisVideos.value.length === 0) return '';
    const dates = analysisVideos.value.map(v => new Date(v.publish_time)).sort((a, b) => a - b);
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const formatYM = (d) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${formatYM(earliest)} - ${formatYM(latest)}`;
  });

  // ============ 分析函数 ============

  function getAccountLevel(avgPlay) {
    if (avgPlay >= 500000) return { level: '头部', desc: '头部创作者' };
    if (avgPlay >= 100000) return { level: '腰部', desc: '优质创作者' };
    if (avgPlay >= 30000) return { level: '成长', desc: '成长型创作者' };
    if (avgPlay >= 10000) return { level: '潜力', desc: '潜力创作者' };
    return { level: '起步', desc: '新晋创作者' };
  }

  function getBestDuration(videoList) {
    const bins = [
      { min: 0, max: 5, label: '5分钟以内' },
      { min: 5, max: 10, label: '5-10分钟' },
      { min: 10, max: 15, label: '10-15分钟' },
      { min: 15, max: 20, label: '15-20分钟' },
      { min: 20, max: 30, label: '20-30分钟' },
      { min: 30, max: Infinity, label: '30分钟以上' }
    ];

    const stats = bins.map(bin => {
      const vids = videoList.filter(v => {
        const mins = parseDurationMinutes(v.duration);
        return mins >= bin.min && mins < bin.max;
      });
      const count = vids.length;
      const avgPlay = count > 0 ? vids.reduce((s, v) => s + v.play_count, 0) / count : 0;
      return { ...bin, count, avgPlay };
    }).filter(b => b.count >= 3);

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
      .filter(h => h.count >= 2);

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
    if (videoList.length < 10) return null;

    const sorted = [...videoList].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const firstAvg = firstHalf.reduce((s, v) => s + v.play_count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v.play_count, 0) / secondHalf.length;

    const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend, description;
    if (changeRate > 30) {
      trend = 'up';
      description = `近期表现明显上升，后半段视频均播放较前半段提升了 ${changeRate.toFixed(0)}%`;
    } else if (changeRate > 10) {
      trend = 'up';
      description = `整体呈上升趋势，后半段视频均播放提升了 ${changeRate.toFixed(0)}%`;
    } else if (changeRate < -30) {
      trend = 'down';
      description = `近期表现有所下滑，后半段视频均播放下降了 ${Math.abs(changeRate).toFixed(0)}%`;
    } else if (changeRate < -10) {
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

  function generateDataSummary(upName) {
    const videoList = analysisVideos.value;
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
      const desc = v.description ? `\n   简介：${v.description.slice(0, 100)}${v.description.length > 100 ? '...' : ''}` : '';
      return `${i + 1}. 「${v.title}」
   播放：${formatNumber(v.play_count)} | 弹幕：${formatNumber(v.danmu_count)} | 时长：${v.duration}${desc}`;
    };

    const median = videoList.map(v => v.play_count).sort((a, b) => a - b)[Math.floor(videoList.length / 2)];

    return `【账号数据概况】
- UP主：${upName || '未知'}
- 分析视频数：${videoList.length} 个
- 数据时间范围：${dataTimeRange.value}
- 总播放量：${formatNumber(totalPlays.value)}
- 场均播放：${formatNumber(avgPlays.value)}
- 播放量中位数：${formatNumber(median)}
- 爆款率（2倍均播放以上）：${hitRate.value}%
- 互动率（弹幕+评论+收藏/播放）：${avgEngagementRate.value}%
- 月均发布：${monthlyPublishRate.value} 条
- 平均视频时长：${avgDuration.value}

【时长分布】
${Object.entries(durationBins).map(([k, v]) => `- ${k}：${v} 个（${(v / videoList.length * 100).toFixed(1)}%）`).join('\n')}

【发布时间分布】
${Object.entries(hourBins).map(([k, v]) => `- ${k}：${v} 个`).join('\n')}

【TOP10 高播放视频详情】
${topVideos.map((v, i) => formatVideoDetail(v, i)).join('\n\n')}

【低播放视频样本（用于对比分析）】
${bottomVideos.map((v, i) => formatVideoDetail(v, i)).join('\n\n')}`;
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
    generateDataSummary
  };
}
