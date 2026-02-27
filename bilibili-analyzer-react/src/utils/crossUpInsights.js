/**
 * 跨 UP 主趣味洞见生成
 */
import { getTitlePatternInsights } from './titleInsights';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 生成跨 UP 主趣味 fun facts
 * @param {Array} selectedUps - [{mid, name, color}]
 * @param {Function} getFilteredVideos - (mid) => video[]
 * @returns {Array<{type, icon, upName, upColor, headline, detail, impactScore}>}
 */
export function generateCrossUpFunFacts(selectedUps, getFilteredVideos) {
  if (selectedUps.length < 2) return [];

  const facts = [];

  // 预计算每个 UP 的基础数据
  const upData = selectedUps.map(up => {
    const videos = getFilteredVideos(up.mid);
    const totalPlay = videos.reduce((s, v) => s + v.play_count, 0);
    const avgPlay = videos.length > 0 ? totalPlay / videos.length : 0;

    // 互动率
    const totalEng = videos.reduce((s, v) => s + v.danmu_count + (v.comment_count || 0), 0);
    const avgEngRate = totalPlay > 0 ? (totalEng / totalPlay) * 100 : 0;

    // 超百万视频比例
    const overMillionCount = videos.filter(v => v.play_count >= 1000000).length;
    const overMillionRate = videos.length > 0 ? overMillionCount / videos.length : 0;

    // 首个爆款位置（2倍均播）
    const sorted = [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
    let firstHitIndex = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].play_count >= avgPlay * 2) {
        firstHitIndex = i;
        break;
      }
    }

    // 星期统计
    const weekdayStats = {};
    for (let i = 0; i < 7; i++) weekdayStats[i] = { count: 0, totalPlay: 0 };
    videos.forEach(v => {
      const day = new Date(v.publish_time).getDay();
      weekdayStats[day].count++;
      weekdayStats[day].totalPlay += v.play_count;
    });
    const weekdayData = Object.entries(weekdayStats)
      .map(([day, data]) => ({
        day: parseInt(day),
        name: WEEKDAY_NAMES[parseInt(day)],
        count: data.count,
        avgPlay: data.count >= 3 ? data.totalPlay / data.count : 0,
      }))
      .filter(d => d.avgPlay > 0);

    let bestWeekday = null, worstWeekday = null, weekdayLift = 0;
    if (weekdayData.length >= 2) {
      bestWeekday = weekdayData.reduce((b, c) => c.avgPlay > b.avgPlay ? c : b);
      worstWeekday = weekdayData.reduce((w, c) => c.avgPlay < w.avgPlay ? c : w);
      weekdayLift = worstWeekday.avgPlay > 0 ? bestWeekday.avgPlay / worstWeekday.avgPlay : 1;
    }

    // 活跃年数
    const dates = videos.map(v => new Date(v.publish_time));
    const earliest = dates.length > 0 ? Math.min(...dates) : Date.now();
    const latest = dates.length > 0 ? Math.max(...dates) : Date.now();
    const activeYears = Math.max(1, (latest - earliest) / (365.25 * 24 * 60 * 60 * 1000));

    return {
      ...up,
      videos,
      videoCount: videos.length,
      totalPlay,
      avgPlay,
      avgEngRate,
      overMillionCount,
      overMillionRate,
      firstHitIndex,
      bestWeekday,
      worstWeekday,
      weekdayLift,
      activeYears,
      yearlyPublishRate: videos.length / activeYears,
      perVideoEfficiency: avgPlay / Math.max(1, videos.length / activeYears),
    };
  });

  // ===== 类型 1: 稳定性 =====
  for (const up of upData) {
    if (up.overMillionRate >= 0.7 && up.videoCount >= 10) {
      const pct = (up.overMillionRate * 100).toFixed(1);
      facts.push({
        type: 'stability',
        icon: 'Trophy',
        upName: up.name,
        upColor: up.color,
        headline: `${pct}% 视频超百万`,
        detail: `${up.videoCount} 条视频中有 ${up.overMillionCount} 条播放超百万`,
        impactScore: up.overMillionRate * 10,
      });
    }
  }

  // ===== 类型 2: 大器晚成 =====
  for (const up of upData) {
    if (up.firstHitIndex > 0 && up.firstHitIndex > up.videoCount * 0.2 && up.videoCount >= 20) {
      facts.push({
        type: 'late_bloomer',
        icon: 'Sprout',
        upName: up.name,
        upColor: up.color,
        headline: `第 ${up.firstHitIndex + 1} 条才爆`,
        detail: `坚持发了 ${up.firstHitIndex} 条才迎来首个爆款，大器晚成`,
        impactScore: up.firstHitIndex / up.videoCount * 8,
      });
    }
  }

  // ===== 类型 3: 效率碾压 =====
  if (upData.length >= 2) {
    const sorted = [...upData].sort((a, b) => b.avgPlay - a.avgPlay);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const high = sorted[i], low = sorted[j];
        if (high.videoCount * 3 < low.videoCount && high.avgPlay > low.avgPlay * 2) {
          facts.push({
            type: 'efficiency',
            icon: 'Zap',
            upName: high.name,
            upColor: high.color,
            headline: `${high.videoCount} 条干翻 ${low.videoCount} 条`,
            detail: `${high.name}用 ${high.videoCount} 条视频达到 ${low.name} ${low.videoCount} 条的 ${(high.avgPlay / low.avgPlay).toFixed(1)}x 均播`,
            impactScore: (low.videoCount / high.videoCount) * (high.avgPlay / low.avgPlay),
          });
        }
      }
    }
  }

  // ===== 类型 4: 星期效应 =====
  for (const up of upData) {
    if (up.weekdayLift > 1.5 && up.bestWeekday && up.worstWeekday) {
      const pct = Math.round((up.weekdayLift - 1) * 100);
      facts.push({
        type: 'weekday',
        icon: 'Calendar',
        upName: up.name,
        upColor: up.color,
        headline: `${up.bestWeekday.name}比${up.worstWeekday.name}高 ${pct}%`,
        detail: `${up.bestWeekday.name}均播 ${Math.round(up.bestWeekday.avgPlay).toLocaleString()}，${up.worstWeekday.name}仅 ${Math.round(up.worstWeekday.avgPlay).toLocaleString()}`,
        impactScore: up.weekdayLift * 2,
      });
    }
  }

  // ===== 类型 5: 省略号效应 =====
  for (const up of upData) {
    if (up.videoCount < 10) continue;
    const patterns = getTitlePatternInsights(up.videos);
    const ellipsis = patterns.find(p => p.pattern === 'ellipsis');
    if (ellipsis && ellipsis.lift > 2) {
      facts.push({
        type: 'ellipsis',
        icon: 'Type',
        upName: up.name,
        upColor: up.color,
        headline: `标题加…均播翻 ${ellipsis.lift}x`,
        detail: `含省略号的 ${ellipsis.count} 条视频，均播是其余视频的 ${ellipsis.lift} 倍`,
        impactScore: ellipsis.lift * 3,
      });
    }
  }

  // ===== 类型 6: 互动反差 =====
  if (upData.length >= 3) {
    const playRank = [...upData].sort((a, b) => b.avgPlay - a.avgPlay);
    const engRank = [...upData].sort((a, b) => b.avgEngRate - a.avgEngRate);

    const topPlay = playRank[0];
    const topPlayEngRank = engRank.findIndex(u => u.mid === topPlay.mid);
    if (topPlayEngRank === engRank.length - 1) {
      facts.push({
        type: 'engagement_gap',
        icon: 'AlertTriangle',
        upName: topPlay.name,
        upColor: topPlay.color,
        headline: '播放最高但互动最低',
        detail: `${topPlay.name}均播排第1但互动率排最后（${topPlay.avgEngRate.toFixed(2)}%）`,
        impactScore: 5,
      });
    }
  }

  // 按 impactScore 排序取 top 4
  return facts
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 4);
}
