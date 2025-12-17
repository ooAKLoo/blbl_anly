import { useMemo, useState, useCallback } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Flame,
  Copy,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Activity,
  Wand2,
  BookOpen,
  Crosshair,
  Repeat,
  Users,
  Calendar,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Timer,
  Gem,
  Compass,
  AlertTriangle,
  AlertCircle,
  MessageSquareOff,
  CalendarX,
  Info,
  Play
} from 'lucide-react';
import VideoFilterBar from '../VideoFilterBar';
import { formatNumber, copyToClipboard, parseDurationMinutes, getImageUrl } from '../../utils';
import { useVideoMetrics } from '../../hooks';

function InsightReport({
  videos,
  upName = '',
  timeRange = 'all',
  duration = 'all',
  onUpdateTimeRange,
  onUpdateDuration
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [promptCopySuccess, setPromptCopySuccess] = useState(false);

  // Use video metrics composable
  const {
    totalPlays,
    totalDanmu,
    totalComments,
    totalFavorites,
    avgPlays,
    avgEngagementRate,
    hitRate,
    monthlyPublishRate,
    avgDuration,
    dataTimeRange,
    getAccountLevel,
    getBestDuration,
    getBestPublishTime,
    getPublishFrequency,
    getTrendAnalysis,
    getHitVideoFeatures,
    generateDataSummary,
    getUndervaluedContent,
    getLongTailHealth,
    getBlueOceanTiming,
    getBlueOceanDuration,
    getQuadrantAnalysis
  } = useVideoMetrics(videos);

  // Report Summary
  const reportSummary = useMemo(() => {
    if (videos.length === 0) return { headline: '' };

    const level = getAccountLevel(avgPlays);
    const trend = getTrendAnalysis(videos);
    const freq = getPublishFrequency(videos);

    let headline = `该账号为${level.desc}`;

    if (freq) {
      headline += `，${freq.frequency}更新（月均 ${freq.monthlyRate} 条）`;
    }

    headline += `，场均播放 ${formatNumber(avgPlays)}`;

    if (trend) {
      if (trend.trend === 'up') {
        headline += '，近期数据呈上升趋势';
      } else if (trend.trend === 'down') {
        headline += '，近期数据有所回落';
      } else {
        headline += '，整体表现稳定';
      }
    }

    headline += '。';

    return { headline, level, trend, freq };
  }, [videos, avgPlays, getAccountLevel, getTrendAnalysis, getPublishFrequency]);

  // Key Findings
  const reportFindings = useMemo(() => {
    if (videos.length === 0) return [];

    const findings = [];

    const bestDur = getBestDuration(videos);
    if (bestDur) {
      findings.push({
        title: '最佳内容时长',
        description: `${bestDur.label}的视频表现最好，平均播放 ${formatNumber(Math.round(bestDur.avgPlay))}`,
        type: 'positive',
        icon: Clock,
        detailKey: 'duration'
      });
    }

    const bestTime = getBestPublishTime(videos);
    if (bestTime) {
      findings.push({
        title: '黄金发布时间',
        description: `推荐时段：${bestTime.topHours.join('、')}`,
        type: 'positive',
        icon: Calendar,
        detailKey: 'publishTime'
      });
    }

    const trend = getTrendAnalysis(videos);
    if (trend) {
      findings.push({
        title: trend.trend === 'up' ? '数据上升中' : trend.trend === 'down' ? '数据波动' : '表现稳定',
        description: trend.description,
        type: trend.trend === 'up' ? 'positive' : trend.trend === 'down' ? 'negative' : 'neutral',
        icon: trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Activity,
        detailKey: 'trend'
      });
    }

    const hitFeatures = getHitVideoFeatures(videos, avgPlays);
    if (hitFeatures && hitFeatures.count >= 2) {
      findings.push({
        title: `${hitFeatures.count} 个爆款`,
        description: `爆款率 ${hitFeatures.rate}%，平均时长 ${hitFeatures.avgDuration} 分钟`,
        type: 'positive',
        icon: Flame,
        detailKey: 'hitVideos'
      });
    }

    return findings.slice(0, 4);
  }, [videos, avgPlays, getBestDuration, getBestPublishTime, getTrendAnalysis, getHitVideoFeatures]);

  // Finding Details for HoverCard
  const findingDetails = useMemo(() => {
    if (videos.length === 0) return {};

    const details = {};

    // Publish time details
    const topVideos = [...videos].sort((a, b) => b.play_count - a.play_count).slice(0, Math.max(3, Math.ceil(videos.length * 0.3)));
    const slots = {};
    topVideos.forEach(v => {
      const date = new Date(v.publish_time);
      const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
      const hour = date.getHours();
      let timeSlot;
      if (hour >= 6 && hour < 12) timeSlot = '上午';
      else if (hour >= 12 && hour < 14) timeSlot = '中午';
      else if (hour >= 14 && hour < 18) timeSlot = '下午';
      else if (hour >= 18 && hour < 22) timeSlot = '晚间';
      else timeSlot = '深夜';
      const key = `${dayType}${timeSlot}`;
      slots[key] = (slots[key] || 0) + 1;
    });
    details.publishTime = { slots, topVideos };

    // Duration details
    const durationBins = [
      { min: 0, max: 5, label: '<5分钟' },
      { min: 5, max: 10, label: '5-10分钟' },
      { min: 10, max: 15, label: '10-15分钟' },
      { min: 15, max: 20, label: '15-20分钟' },
      { min: 20, max: 30, label: '20-30分钟' },
      { min: 30, max: Infinity, label: '>30分钟' }
    ];
    const binStats = durationBins.map(bin => {
      const vids = videos.filter(v => {
        const mins = parseDurationMinutes(v.duration);
        return mins >= bin.min && mins < bin.max;
      });
      const avgPlay = vids.length > 0 ? Math.round(vids.reduce((s, v) => s + v.play_count, 0) / vids.length) : 0;
      return { ...bin, count: vids.length, avgPlay, videos: vids };
    }).filter(b => b.count > 0);
    const maxAvgPlay = Math.max(...binStats.map(b => b.avgPlay));
    const bestBin = binStats.find(b => b.avgPlay === maxAvgPlay);
    details.duration = {
      bins: binStats.map(b => ({ ...b, isBest: b.avgPlay === maxAvgPlay })),
      maxAvgPlay,
      topVideos: bestBin ? bestBin.videos.sort((a, b) => b.play_count - a.play_count).slice(0, 3) : []
    };

    // Trend details
    const trend = getTrendAnalysis(videos);
    if (trend) {
      const sorted = [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
      const half = Math.floor(sorted.length / 2);
      details.trend = {
        firstAvg: trend.firstAvg,
        secondAvg: trend.secondAvg,
        changeRate: trend.changeRate,
        firstCount: half,
        secondCount: sorted.length - half
      };
    }

    // Hit videos details
    const hitThreshold = avgPlays * 2;
    const hitVideos = videos.filter(v => v.play_count >= hitThreshold).sort((a, b) => b.play_count - a.play_count);
    if (hitVideos.length > 0) {
      details.hitVideos = { videos: hitVideos };
    }

    return details;
  }, [videos, avgPlays, getTrendAnalysis]);

  // Format publish slot
  const formatPublishSlot = useCallback((publishTime) => {
    const date = new Date(publishTime);
    const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
    const hour = date.getHours();
    let timeSlot;
    if (hour >= 6 && hour < 12) timeSlot = '上午';
    else if (hour >= 12 && hour < 14) timeSlot = '中午';
    else if (hour >= 14 && hour < 18) timeSlot = '下午';
    else if (hour >= 18 && hour < 22) timeSlot = '晚间';
    else timeSlot = '深夜';
    return `${dayType}${timeSlot} ${hour}:00`;
  }, []);

  // Open video
  const openVideo = useCallback(async (video) => {
    if (video.video_url) {
      window.open(video.video_url, '_blank');
    } else if (video.bvid) {
      window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
    }
  }, []);

  // Report Insights
  const reportInsights = useMemo(() => {
    if (videos.length === 0) return [];

    const insights = [];

    const plays = videos.map(v => v.play_count).sort((a, b) => a - b);
    const median = plays[Math.floor(plays.length / 2)];
    const maxPlay = plays[plays.length - 1];
    const minPlay = plays[0];
    const playRange = maxPlay / Math.max(1, minPlay);

    insights.push({
      title: '播放量分布',
      description: playRange > 50 ? '数据波动较大' : playRange > 10 ? '分布较分散' : '相对稳定',
      metric: `中位数 ${formatNumber(median)}`,
      icon: BarChart3,
      details: [`最高 ${formatNumber(maxPlay)}`, `最低 ${formatNumber(minPlay)}`]
    });

    const engRate = parseFloat(avgEngagementRate);
    insights.push({
      title: '互动质量',
      description: engRate >= 5 ? '互动率优秀' : engRate >= 2 ? '互动率良好' : engRate >= 1 ? '互动率一般' : '互动率偏低',
      metric: `${engRate.toFixed(2)}%`,
      icon: MessageSquare,
      details: [`弹幕 ${formatNumber(totalDanmu)}`, `评论 ${formatNumber(totalComments)}`]
    });

    const freq = getPublishFrequency(videos);
    if (freq) {
      insights.push({
        title: '发布节奏',
        description: freq.suggestion,
        metric: `${freq.monthlyRate} 条/月`,
        icon: CalendarDays,
        details: [`${freq.frequency}更新`]
      });
    }

    const durations = videos.map(v => parseDurationMinutes(v.duration));
    const avgDur = durations.reduce((s, d) => s + d, 0) / durations.length;

    insights.push({
      title: '内容时长',
      description: `平均时长 ${avgDur.toFixed(1)} 分钟`,
      metric: `${avgDur.toFixed(1)} 分`,
      icon: Timer
    });

    return insights;
  }, [videos, avgEngagementRate, totalDanmu, totalComments, getPublishFrequency]);

  // Long tail analysis
  const undervaluedContent = useMemo(() => getUndervaluedContent(videos), [videos, getUndervaluedContent]);
  const longTailHealth = useMemo(() => getLongTailHealth(videos), [videos, getLongTailHealth]);
  const blueOceanTiming = useMemo(() => getBlueOceanTiming(videos), [videos, getBlueOceanTiming]);
  const blueOceanDuration = useMemo(() => getBlueOceanDuration(videos), [videos, getBlueOceanDuration]);
  const quadrantAnalysis = useMemo(() => getQuadrantAnalysis(videos), [videos, getQuadrantAnalysis]);

  // Problem data analysis
  const problemDataAnalysis = useMemo(() => {
    if (videos.length < 5) return null;

    const avg = avgPlays;
    const totalPlaysVal = totalPlays;
    const result = {};

    // 1. Below average analysis
    const threshold = avg;
    const belowAvgVideos = videos.filter(v => v.play_count < threshold);
    if (belowAvgVideos.length > 0) {
      const belowAvgPlays = belowAvgVideos.reduce((s, v) => s + v.play_count, 0);
      const belowAvgAvg = Math.round(belowAvgPlays / belowAvgVideos.length);

      const features = [];
      const shortVideos = belowAvgVideos.filter(v => parseDurationMinutes(v.duration) < 3);
      const longVideos = belowAvgVideos.filter(v => parseDurationMinutes(v.duration) > 30);
      const lateNightVideos = belowAvgVideos.filter(v => {
        const hour = new Date(v.publish_time).getHours();
        return hour >= 0 && hour < 6;
      });
      const weekendVideos = belowAvgVideos.filter(v => {
        const day = new Date(v.publish_time).getDay();
        return day === 0 || day === 6;
      });

      if (shortVideos.length > belowAvgVideos.length * 0.4) features.push('过短视频多（<3分钟）');
      if (longVideos.length > belowAvgVideos.length * 0.4) features.push('过长视频多（>30分钟）');
      if (lateNightVideos.length > belowAvgVideos.length * 0.3) features.push('凌晨发布较多');
      if (weekendVideos.length > belowAvgVideos.length * 0.6) features.push('多在周末发布');

      result.belowAvg = {
        count: belowAvgVideos.length,
        ratio: ((belowAvgVideos.length / videos.length) * 100).toFixed(1),
        threshold,
        playContribution: ((belowAvgPlays / totalPlaysVal) * 100).toFixed(1),
        avgPlay: belowAvgAvg,
        features,
        videos: belowAvgVideos.sort((a, b) => a.play_count - b.play_count)
      };
    }

    // 2. Volatility analysis
    const plays = videos.map(v => v.play_count);
    const variance = plays.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / plays.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / avg) * 100;
    const sortedPlays = [...plays].sort((a, b) => a - b);
    const median = sortedPlays[Math.floor(sortedPlays.length / 2)];
    const maxPlay = Math.max(...plays);
    const minPlay = Math.min(...plays);
    const range = minPlay > 0 ? Math.round(maxPlay / minPlay) : maxPlay;

    let level, interpretation;
    if (cv > 150) {
      level = 'high';
      interpretation = '数据波动很大，说明内容表现差异明显。建议分析高播放视频的成功要素，同时审视低播放内容的问题。';
    } else if (cv > 80) {
      level = 'medium';
      interpretation = '数据波动适中，内容表现相对稳定但仍有起伏。可以尝试复制成功经验，提升整体水平。';
    } else {
      level = 'low';
      interpretation = '数据波动较小，内容表现非常稳定。可以考虑尝试突破性选题来寻找新增长点。';
    }

    result.volatility = {
      cv: cv.toFixed(0),
      level,
      max: maxPlay,
      min: minPlay,
      range,
      median,
      interpretation
    };

    // 3. Outlier detection
    const q1 = sortedPlays[Math.floor(sortedPlays.length * 0.25)];
    const q3 = sortedPlays[Math.floor(sortedPlays.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;

    const lowOutliers = videos.filter(v => v.play_count < lowerBound);
    if (lowOutliers.length > 0) {
      const lowFeatures = [];
      const avgDurLow = lowOutliers.reduce((s, v) => s + parseDurationMinutes(v.duration), 0) / lowOutliers.length;
      const avgDurAll = videos.reduce((s, v) => s + parseDurationMinutes(v.duration), 0) / videos.length;

      if (avgDurLow < avgDurAll * 0.5) lowFeatures.push('时长偏短');
      if (avgDurLow > avgDurAll * 2) lowFeatures.push('时长过长');

      result.outliers = {
        low: lowOutliers.sort((a, b) => a.play_count - b.play_count),
        lowerBound,
        lowFeatures
      };
    }

    // 4. Low engagement (traffic trap)
    const avgEngRate = videos.reduce((s, v) => {
      const eng = v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0);
      return s + (v.play_count > 0 ? (eng / v.play_count) * 100 : 0);
    }, 0) / videos.length;

    const lowEngVideos = videos
      .map(v => {
        const eng = v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0);
        return {
          ...v,
          engagementRate: v.play_count > 0 ? (eng / v.play_count) * 100 : 0
        };
      })
      .filter(v => v.play_count >= avg && v.engagementRate < avgEngRate * 0.5);

    if (lowEngVideos.length > 0) {
      const lowEngAvgPlay = Math.round(lowEngVideos.reduce((s, v) => s + v.play_count, 0) / lowEngVideos.length);
      const lowEngAvgRate = (lowEngVideos.reduce((s, v) => s + v.engagementRate, 0) / lowEngVideos.length).toFixed(2);

      result.lowEngagement = {
        count: lowEngVideos.length,
        avgPlay: lowEngAvgPlay,
        avgEngRate: lowEngAvgRate,
        videos: lowEngVideos.sort((a, b) => b.play_count - a.play_count)
      };
    }

    // 5. Low period analysis
    const monthlyData = {};
    videos.forEach(v => {
      const month = v.publish_time.slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { count: 0, totalPlays: 0, videos: [] };
      monthlyData[month].count++;
      monthlyData[month].totalPlays += v.play_count;
      monthlyData[month].videos.push(v);
    });

    const monthStats = Object.entries(monthlyData)
      .filter(([_, d]) => d.count >= 2)
      .map(([month, d]) => ({
        month,
        count: d.count,
        avgPlay: Math.round(d.totalPlays / d.count),
        videos: d.videos
      }));

    if (monthStats.length >= 3) {
      const worstMonth = monthStats.reduce((worst, curr) => curr.avgPlay < worst.avgPlay ? curr : worst);
      const vsAvg = ((worstMonth.avgPlay / avg - 1) * 100).toFixed(0);

      if (worstMonth.avgPlay < avg * 0.5) {
        result.lowPeriod = {
          period: worstMonth.month,
          count: worstMonth.count,
          avgPlay: worstMonth.avgPlay,
          vsAvg,
          videos: worstMonth.videos.sort((a, b) => a.play_count - b.play_count)
        };
      }
    }

    const hasProblems = result.belowAvg || result.outliers || result.lowEngagement || result.lowPeriod;
    return hasProblems ? result : null;
  }, [videos, avgPlays, totalPlays]);

  // AI Prompt Templates
  const aiPromptTemplates = useMemo(() => {
    const dataSummary = generateDataSummary(upName);

    return [
      {
        title: '选题策略',
        description: '分析高播放视频特征，给出选题建议',
        icon: Crosshair,
        color: 'bg-blue-500',
        prompt: `你是B站内容运营专家。请基于以下数据进行内容选题分析：\n\n${dataSummary}\n\n请分析：1.高播放视频标题特征 2.低播放视频问题 3.选题方向建议 4.标题优化示例`
      },
      {
        title: '发布策略',
        description: '优化发布时间和更新频率',
        icon: Calendar,
        color: 'bg-emerald-500',
        prompt: `你是B站运营分析师。请基于以下数据给出发布策略建议：\n\n${dataSummary}\n\n请分析：1.最佳发布时间 2.更新频率建议 3.内容排期模板`
      },
      {
        title: '增长诊断',
        description: '找出增长瓶颈和突破策略',
        icon: TrendingUp,
        color: 'bg-amber-500',
        prompt: `你是内容创作增长顾问。请基于以下数据进行增长诊断：\n\n${dataSummary}\n\n请分析：1.健康度评估 2.增长瓶颈 3.突破策略建议`
      },
      {
        title: '遗珠挖掘',
        description: '发现被低估的利基内容',
        icon: Gem,
        color: 'bg-teal-500',
        prompt: `你是长尾理论专家。请基于以下数据挖掘被低估的内容：\n\n${dataSummary}\n\n请分析：1.低播放高互动内容特征 2.利基市场价值 3.内容升级策略`
      },
      {
        title: '竞品分析',
        description: '分析竞品长尾寻找机会',
        icon: Compass,
        color: 'bg-indigo-500',
        prompt: `你是竞争策略分析师。假设以下数据来自竞品账号：\n\n${dataSummary}\n\n请分析：1.竞品内容结构 2.长尾弱点 3.差异化机会`
      },
      {
        title: '爆款方法论',
        description: '总结可复制的爆款规律',
        icon: Repeat,
        color: 'bg-rose-500',
        prompt: `你是爆款内容研究专家。请基于以下数据总结爆款方法论：\n\n${dataSummary}\n\n请分析：1.爆款要素拆解 2.爆款检查清单 3.提升爆款率策略`
      },
      {
        title: '蓝海策略',
        description: '分析时段时长差异化机会',
        icon: Compass,
        color: 'bg-cyan-500',
        prompt: `你是蓝海战略专家。请基于以下数据分析差异化机会：\n\n${dataSummary}\n\n请分析：1.蓝海时段 2.蓝海时长 3.差异化发布计划`
      },
      {
        title: '竞品对标',
        description: '定位差距和学习方向',
        icon: Users,
        color: 'bg-violet-500',
        prompt: `你是行业研究分析师。请基于以下数据进行竞品对标分析：\n\n${dataSummary}\n\n请分析：1.账号定位 2.对标账号画像 3.差距分析 4.学习方向`
      },
      {
        title: '完整报告',
        description: '生成完整数据分析报告',
        icon: BookOpen,
        color: 'bg-slate-700',
        prompt: `你是专业数据分析师。请基于以下数据生成完整报告：\n\n${dataSummary}\n\n请按以下结构输出：一、执行摘要 二、数据概览 三、深度分析 四、问题诊断 五、优化建议 六、总结`
      },
      {
        title: '自定义',
        description: '复制数据用于自定义分析',
        icon: Wand2,
        color: 'bg-neutral-700',
        prompt: dataSummary
      }
    ];
  }, [upName, generateDataSummary]);

  // Copy analysis report
  const copyAnalysisReport = useCallback(async () => {
    const summary = reportSummary;
    const findings = reportFindings;

    let text = `【${upName || 'UP主'} 数据分析报告】\n`;
    text += `数据范围：${dataTimeRange}，共 ${videos.length} 个视频\n\n`;
    text += `${summary.headline}\n\n`;
    text += `核心指标：场均播放 ${formatNumber(avgPlays)} | 爆款率 ${hitRate}% | 互动率 ${avgEngagementRate}%\n\n`;

    if (findings.length > 0) {
      text += `关键发现：\n`;
      findings.forEach((f, i) => text += `${i + 1}. ${f.title}：${f.description}\n`);
    }

    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [reportSummary, reportFindings, upName, dataTimeRange, videos.length, avgPlays, hitRate, avgEngagementRate]);

  // Copy prompt
  const copyPrompt = useCallback(async (prompt) => {
    const success = await copyToClipboard(prompt.prompt);
    if (success) {
      setPromptCopySuccess(true);
      setTimeout(() => setPromptCopySuccess(false), 2000);
    }
  }, []);

  if (videos.length === 0) {
    return (
      <div className="space-y-8">
        <VideoFilterBar
          timeRange={timeRange}
          duration={duration}
          onUpdateTimeRange={onUpdateTimeRange}
          onUpdateDuration={onUpdateDuration}
        >
          <div slot="right">
            <button
              onClick={copyAnalysisReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Copy size={14} />
              {copySuccess ? '已复制' : '复制报告'}
            </button>
          </div>
        </VideoFilterBar>

        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
          <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
            <FileText size={24} className="text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">暂无数据</h3>
          <p className="text-sm text-neutral-500">请调整筛选条件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <VideoFilterBar
        timeRange={timeRange}
        duration={duration}
        onUpdateTimeRange={onUpdateTimeRange}
        onUpdateDuration={onUpdateDuration}
      >
        <div slot="right">
          <button
            onClick={copyAnalysisReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Copy size={14} />
            {copySuccess ? '已复制' : '复制报告'}
          </button>
        </div>
      </VideoFilterBar>

      <div className="space-y-8">
        {/* Core Conclusion */}
        <section className="report-card bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">账号诊断结论</h2>
              <p className="text-neutral-500 text-xs mt-1">{videos.length} 个视频 · {dataTimeRange}</p>
            </div>
          </div>
          <p className="text-base text-neutral-200 leading-relaxed">{reportSummary.headline}</p>
        </section>

        {/* Key Findings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="report-card">
            <h2 className="section-title">
              <Lightbulb size={16} className="text-amber-500" />
              关键发现
            </h2>
            <div className="space-y-4">
              {reportFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    finding.type === 'positive' ? 'bg-emerald-50 text-emerald-500' :
                    finding.type === 'negative' ? 'bg-rose-50 text-rose-500' :
                    'bg-blue-50 text-blue-500'
                  }`}>
                    <finding.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-neutral-900">{finding.title}</h3>
                    {finding.detailKey && findingDetails[finding.detailKey] ? (
                      <HoverCard.Root openDelay={200} closeDelay={100}>
                        <HoverCard.Trigger asChild>
                          <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 inline-flex items-center gap-1 transition-colors">
                            {finding.description}
                            <Info size={12} className="text-neutral-400" />
                          </p>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                          <HoverCard.Content
                            sideOffset={8}
                            side="bottom"
                            align="start"
                            className="z-50 w-80 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          >
                            {finding.detailKey === 'publishTime' && findingDetails.publishTime && (
                              <>
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <span className="text-sm font-medium text-neutral-700">黄金发布时间分析</span>
                                  <p className="text-xs text-neutral-500 mt-1">基于播放量 TOP 30% 的视频统计</p>
                                </div>
                                <div className="p-3">
                                  <div className="mb-3">
                                    <div className="text-xs text-neutral-500 mb-2">高播放时段分布</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(findingDetails.publishTime.slots).map(([slot, count]) => (
                                        <span
                                          key={slot}
                                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                                            count >= 3 ? 'bg-emerald-100 text-emerald-700' :
                                            count >= 2 ? 'bg-blue-100 text-blue-700' :
                                            'bg-neutral-100 text-neutral-600'
                                          }`}
                                        >
                                          {slot} ({count})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-neutral-500 mb-2">代表视频</div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {findingDetails.publishTime.topVideos.map((video) => (
                                        <div
                                          key={video.bvid}
                                          className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                          onClick={() => openVideo(video)}
                                        >
                                          <img
                                            src={getImageUrl(video.cover)}
                                            className="w-16 h-9 rounded object-cover flex-shrink-0"
                                            referrerPolicy="no-referrer"
                                            alt=""
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                              <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                              <span>{formatPublishSlot(video.publish_time)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Duration HoverCard */}
                            {finding.detailKey === 'duration' && findingDetails.duration && (
                              <>
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <span className="text-sm font-medium text-neutral-700">最佳时长分析</span>
                                  <p className="text-xs text-neutral-500 mt-1">各时长区间的视频表现对比</p>
                                </div>
                                <div className="p-3">
                                  <div className="mb-3">
                                    <div className="text-xs text-neutral-500 mb-2">时长区间对比</div>
                                    <div className="space-y-1.5">
                                      {findingDetails.duration.bins.map((bin) => (
                                        <div key={bin.label} className="flex items-center gap-2">
                                          <span className="text-xs text-neutral-600 w-20">{bin.label}</span>
                                          <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all ${
                                                bin.isBest ? 'bg-emerald-500' : 'bg-blue-300'
                                              }`}
                                              style={{ width: `${(bin.avgPlay / findingDetails.duration.maxAvgPlay * 100)}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-xs font-medium text-neutral-700 w-16 text-right">{formatNumber(bin.avgPlay)}</span>
                                          <span className="text-[10px] text-neutral-400 w-8">({bin.count}个)</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-neutral-500 mb-2">该时长代表视频</div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {findingDetails.duration.topVideos.map((video) => (
                                        <div
                                          key={video.bvid}
                                          className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                          onClick={() => openVideo(video)}
                                        >
                                          <img
                                            src={getImageUrl(video.cover)}
                                            className="w-16 h-9 rounded object-cover flex-shrink-0"
                                            referrerPolicy="no-referrer"
                                            alt=""
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                              <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                              <span>{video.duration}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Hit Videos HoverCard */}
                            {finding.detailKey === 'hitVideos' && findingDetails.hitVideos && (
                              <>
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <span className="text-sm font-medium text-neutral-700">爆款视频分析</span>
                                  <p className="text-xs text-neutral-500 mt-1">播放量超过均值 2 倍的视频</p>
                                </div>
                                <div className="p-3">
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {findingDetails.hitVideos.videos.map((video) => (
                                      <div
                                        key={video.bvid}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                        onClick={() => openVideo(video)}
                                      >
                                        <img
                                          src={getImageUrl(video.cover)}
                                          className="w-16 h-9 rounded object-cover flex-shrink-0"
                                          referrerPolicy="no-referrer"
                                          alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                            <span className="flex items-center gap-0.5 text-amber-600 font-medium"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                            <span>{video.duration}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Trend HoverCard */}
                            {finding.detailKey === 'trend' && findingDetails.trend && (
                              <>
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <span className="text-sm font-medium text-neutral-700">趋势分析</span>
                                  <p className="text-xs text-neutral-500 mt-1">前后期视频表现对比</p>
                                </div>
                                <div className="p-3">
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="p-2 bg-neutral-50 rounded-lg">
                                      <div className="text-xs text-neutral-500">前期均播放</div>
                                      <div className="text-lg font-semibold text-neutral-700">{formatNumber(findingDetails.trend.firstAvg)}</div>
                                      <div className="text-[10px] text-neutral-400">{findingDetails.trend.firstCount} 个视频</div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${
                                      findingDetails.trend.changeRate > 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                    }`}>
                                      <div className="text-xs text-neutral-500">后期均播放</div>
                                      <div className={`text-lg font-semibold ${
                                        findingDetails.trend.changeRate > 0 ? 'text-emerald-600' : 'text-rose-600'
                                      }`}>{formatNumber(findingDetails.trend.secondAvg)}</div>
                                      <div className={`text-[10px] ${
                                        findingDetails.trend.changeRate > 0 ? 'text-emerald-500' : 'text-rose-500'
                                      }`}>
                                        {findingDetails.trend.changeRate > 0 ? '+' : ''}{findingDetails.trend.changeRate.toFixed(0)}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    ) : (
                      <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{finding.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Data Insights */}
        <section className="report-card">
          <h2 className="section-title">
            <BarChart3 size={16} className="text-violet-500" />
            数据洞察
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <insight.icon size={18} className="text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-neutral-900">{insight.title}</h3>
                    <span className="text-sm font-semibold text-blue-600 tabular-nums">{insight.metric}</span>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{insight.description}</p>
                  {insight.details && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {insight.details.map((detail, i) => (
                        <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded">
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem Data Analysis */}
        {problemDataAnalysis && (
          <section className="report-card border border-amber-100">
            <h2 className="section-title">
              <AlertTriangle size={16} className="text-amber-500" />
              问题数据诊断
            </h2>
            <p className="text-xs text-neutral-500 -mt-2 mb-4">以下数据需要特别关注，可能是内容策略的改进方向</p>

            <div className="space-y-6">
              {/* Below Average Analysis */}
              {problemDataAnalysis.belowAvg && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon amber">
                      <TrendingDown size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">低于平均表现</h3>
                      <HoverCard.Root openDelay={200} closeDelay={100}>
                        <HoverCard.Trigger asChild>
                          <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-amber-500 inline-flex items-center gap-1 transition-colors">
                            <strong>{problemDataAnalysis.belowAvg.count}</strong> 个视频 ({problemDataAnalysis.belowAvg.ratio}%) 播放量低于均值
                            <Info size={12} className="text-neutral-400" />
                          </p>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                          <HoverCard.Content
                            sideOffset={8}
                            side="bottom"
                            align="start"
                            className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          >
                            <div className="p-3 border-b border-neutral-100 bg-amber-50">
                              <span className="text-sm font-medium text-amber-800">低于平均表现的视频</span>
                              <p className="text-xs text-amber-600 mt-1">共 {problemDataAnalysis.belowAvg.count} 个，播放量 &lt; {formatNumber(problemDataAnalysis.belowAvg.threshold)}</p>
                            </div>
                            <div className="p-3 max-h-64 overflow-y-auto">
                              <div className="space-y-2">
                                {problemDataAnalysis.belowAvg.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5 text-amber-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                        <span>{video.publish_time.slice(0, 10)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold text-amber-600 tabular-nums">{problemDataAnalysis.belowAvg.ratio}%</div>
                      <div className="text-xs text-neutral-400">占比</div>
                    </div>
                  </div>

                  <div className="problem-stats">
                    <div className="stat-item">
                      <span className="stat-label">阈值</span>
                      <span className="stat-value">&lt; {formatNumber(problemDataAnalysis.belowAvg.threshold)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">播放量贡献</span>
                      <span className="stat-value text-amber-600">仅 {problemDataAnalysis.belowAvg.playContribution}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">平均播放</span>
                      <span className="stat-value">{formatNumber(problemDataAnalysis.belowAvg.avgPlay)}</span>
                    </div>
                  </div>

                  {/* Common Features */}
                  {problemDataAnalysis.belowAvg.features.length > 0 && (
                    <div className="problem-features">
                      <p className="text-xs text-neutral-500 mb-2">可能的共性特征：</p>
                      <div className="flex flex-wrap gap-2">
                        {problemDataAnalysis.belowAvg.features.map((feature, i) => (
                          <span key={i} className="feature-tag amber">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Volatility Analysis */}
              {problemDataAnalysis.volatility && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon blue">
                      <Activity size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">数据波动分析</h3>
                      <p className="problem-subtitle">
                        波动{problemDataAnalysis.volatility.level === 'high' ? '较大' : problemDataAnalysis.volatility.level === 'medium' ? '适中' : '较小'}，
                        变异系数 {problemDataAnalysis.volatility.cv}%
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        problemDataAnalysis.volatility.level === 'high' ? 'bg-amber-100 text-amber-700' :
                        problemDataAnalysis.volatility.level === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {problemDataAnalysis.volatility.level === 'high' ? '高波动' : problemDataAnalysis.volatility.level === 'medium' ? '中等波动' : '低波动'}
                      </span>
                    </div>
                  </div>

                  <div className="problem-stats">
                    <div className="stat-item">
                      <span className="stat-label">最高播放</span>
                      <span className="stat-value text-emerald-600">{formatNumber(problemDataAnalysis.volatility.max)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">最低播放</span>
                      <span className="stat-value text-rose-600">{formatNumber(problemDataAnalysis.volatility.min)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">极差倍数</span>
                      <span className="stat-value">{problemDataAnalysis.volatility.range}x</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">中位数</span>
                      <span className="stat-value">{formatNumber(problemDataAnalysis.volatility.median)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                    {problemDataAnalysis.volatility.interpretation}
                  </p>
                </div>
              )}

              {/* Outliers - Low Values */}
              {problemDataAnalysis.outliers && problemDataAnalysis.outliers.low.length > 0 && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon rose">
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">极端低值视频</h3>
                      <HoverCard.Root openDelay={200} closeDelay={100}>
                        <HoverCard.Trigger asChild>
                          <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-rose-500 inline-flex items-center gap-1 transition-colors">
                            <strong>{problemDataAnalysis.outliers.low.length}</strong> 个视频播放量显著低于正常范围
                            <Info size={12} className="text-neutral-400" />
                          </p>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                          <HoverCard.Content
                            sideOffset={8}
                            side="bottom"
                            align="start"
                            className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          >
                            <div className="p-3 border-b border-neutral-100 bg-rose-50">
                              <span className="text-sm font-medium text-rose-800">极端低值视频</span>
                              <p className="text-xs text-rose-600 mt-1">低于 Q1 - 1.5×IQR 的异常数据点</p>
                            </div>
                            <div className="p-3 max-h-64 overflow-y-auto">
                              <div className="space-y-2">
                                {problemDataAnalysis.outliers.low.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5 text-rose-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                        <span>{video.publish_time.slice(0, 10)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold text-rose-600 tabular-nums">{problemDataAnalysis.outliers.low.length}</div>
                      <div className="text-xs text-neutral-400">个视频</div>
                    </div>
                  </div>

                  {problemDataAnalysis.outliers.lowFeatures.length > 0 && (
                    <p className="text-xs text-neutral-500 mt-3">
                      这些视频的共性：{problemDataAnalysis.outliers.lowFeatures.join('、')}
                    </p>
                  )}
                </div>
              )}

              {/* Low Engagement (Traffic Trap) */}
              {problemDataAnalysis.lowEngagement && problemDataAnalysis.lowEngagement.count > 0 && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon purple">
                      <MessageSquareOff size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">流量陷阱内容</h3>
                      <HoverCard.Root openDelay={200} closeDelay={100}>
                        <HoverCard.Trigger asChild>
                          <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-purple-500 inline-flex items-center gap-1 transition-colors">
                            <strong>{problemDataAnalysis.lowEngagement.count}</strong> 个视频高播放但低互动
                            <Info size={12} className="text-neutral-400" />
                          </p>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                          <HoverCard.Content
                            sideOffset={8}
                            side="bottom"
                            align="start"
                            className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          >
                            <div className="p-3 border-b border-neutral-100 bg-purple-50">
                              <span className="text-sm font-medium text-purple-800">流量陷阱内容</span>
                              <p className="text-xs text-purple-600 mt-1">播放量高于均值但互动率低于均值的 50%</p>
                            </div>
                            <div className="p-3 max-h-64 overflow-y-auto">
                              <div className="space-y-2">
                                {problemDataAnalysis.lowEngagement.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                        <span className="text-purple-600">互动率 {video.engagementRate.toFixed(2)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold text-purple-600 tabular-nums">{problemDataAnalysis.lowEngagement.count}</div>
                      <div className="text-xs text-neutral-400">个视频</div>
                    </div>
                  </div>

                  <div className="problem-stats">
                    <div className="stat-item">
                      <span className="stat-label">平均播放</span>
                      <span className="stat-value">{formatNumber(problemDataAnalysis.lowEngagement.avgPlay)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">平均互动率</span>
                      <span className="stat-value text-purple-600">{problemDataAnalysis.lowEngagement.avgEngRate}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Low Period */}
              {problemDataAnalysis.lowPeriod && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon slate">
                      <CalendarX size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">低迷时期</h3>
                      <HoverCard.Root openDelay={200} closeDelay={100}>
                        <HoverCard.Trigger asChild>
                          <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-slate-500 inline-flex items-center gap-1 transition-colors">
                            {problemDataAnalysis.lowPeriod.period} 期间 <strong>{problemDataAnalysis.lowPeriod.count}</strong> 个视频表现较差
                            <Info size={12} className="text-neutral-400" />
                          </p>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                          <HoverCard.Content
                            sideOffset={8}
                            side="bottom"
                            align="start"
                            className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          >
                            <div className="p-3 border-b border-neutral-100 bg-slate-50">
                              <span className="text-sm font-medium text-slate-800">{problemDataAnalysis.lowPeriod.period} 低迷期视频</span>
                              <p className="text-xs text-slate-600 mt-1">该时期均播放 {formatNumber(problemDataAnalysis.lowPeriod.avgPlay)}，对比整体 {problemDataAnalysis.lowPeriod.vsAvg}%</p>
                            </div>
                            <div className="p-3 max-h-64 overflow-y-auto">
                              <div className="space-y-2">
                                {problemDataAnalysis.lowPeriod.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5 text-slate-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                        <span>{video.publish_time.slice(0, 10)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    </div>
                  </div>

                  <div className="problem-stats">
                    <div className="stat-item">
                      <span className="stat-label">该时期视频数</span>
                      <span className="stat-value">{problemDataAnalysis.lowPeriod.count} 个</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">该时期均播放</span>
                      <span className="stat-value text-rose-600">{formatNumber(problemDataAnalysis.lowPeriod.avgPlay)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">对比整体均值</span>
                      <span className="stat-value text-rose-600">{problemDataAnalysis.lowPeriod.vsAvg}%</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* Long Tail Deep Analysis */}
        {(longTailHealth || quadrantAnalysis) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-neutral-800">深度分析</h2>
              <div className="h-px flex-1 bg-neutral-200"></div>
              <span className="text-xs text-neutral-400">长尾理论 · 利基识别</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Structure Analysis */}
              {longTailHealth && (
                <section className="report-card">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">内容结构</h3>

                  {/* Health Status */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
                    longTailHealth.healthLevel === 'excellent' ? 'bg-emerald-50' :
                    longTailHealth.healthLevel === 'good' ? 'bg-blue-50' :
                    longTailHealth.healthLevel === 'risky' ? 'bg-rose-50' : 'bg-neutral-50'
                  }`}>
                    {longTailHealth.healthLevel === 'excellent' ? (
                      <Sparkles size={18} className="text-emerald-500" />
                    ) : longTailHealth.healthLevel === 'risky' ? (
                      <TrendingDown size={18} className="text-rose-500" />
                    ) : (
                      <Activity size={18} className={
                        longTailHealth.healthLevel === 'good' ? 'text-blue-500' : 'text-neutral-500'
                      } />
                    )}
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{longTailHealth.healthDesc}</div>
                      <div className="text-xs text-neutral-500">前 20% 视频贡献 {longTailHealth.top20Contribution}% 播放量</div>
                    </div>
                  </div>

                  {/* Head-Waist-Tail Distribution */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">头部（2x均值以上）</span>
                      <span className="text-sm font-semibold text-amber-600 tabular-nums">{longTailHealth.head.count} 个 · {longTailHealth.head.ratio}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">腰部（稳定内容）</span>
                      <span className="text-sm font-semibold text-blue-600 tabular-nums">{longTailHealth.waist.count} 个 · {longTailHealth.waist.ratio}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">长尾（0.5x均值以下）</span>
                      <span className="text-sm font-semibold text-neutral-600 tabular-nums">{longTailHealth.tail.count} 个 · {longTailHealth.tail.ratio}%</span>
                    </div>
                  </div>

                  {/* Tail Effectiveness */}
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-500">长尾有效性</span>
                      <span className="text-sm font-semibold tabular-nums">{longTailHealth.effectiveTail.ratio}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${longTailHealth.effectiveTail.ratio}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">有效长尾 = 播放低但互动率达标的内容</p>
                  </div>
                </section>
              )}

              {/* Quadrant Analysis */}
              {quadrantAnalysis && (
                <section className="report-card">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">内容四象限</h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Star Content */}
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-amber-700">明星内容</span>
                            <span className="text-lg font-bold text-amber-600 tabular-nums flex items-center gap-1">
                              {quadrantAnalysis.quadrants.star.count}
                              <Info size={12} className="text-amber-400" />
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-600/70">高播放 · 高互动</p>
                        </div>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          sideOffset={8}
                          side="top"
                          align="start"
                          className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                        >
                          <div className="p-3 border-b border-neutral-100 bg-amber-50">
                            <span className="text-sm font-medium text-amber-800">明星内容</span>
                            <p className="text-xs text-amber-600 mt-1">高播放高互动，最优质的内容</p>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            {quadrantAnalysis.quadrants.star.videos.length > 0 ? (
                              <div className="space-y-2">
                                {quadrantAnalysis.quadrants.star.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5 text-amber-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400 text-center py-4">暂无明星内容</p>
                            )}
                          </div>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>

                    {/* Niche Content */}
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 relative cursor-pointer hover:border-emerald-300 transition-colors">
                          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded font-medium">
                            蓝海
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-emerald-700">利基宝藏</span>
                            <span className="text-lg font-bold text-emerald-600 tabular-nums flex items-center gap-1">
                              {quadrantAnalysis.quadrants.niche.count}
                              <Info size={12} className="text-emerald-400" />
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-600/70">低播放 · 高互动</p>
                        </div>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          sideOffset={8}
                          side="top"
                          align="end"
                          className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                        >
                          <div className="p-3 border-b border-neutral-100 bg-emerald-50">
                            <span className="text-sm font-medium text-emerald-800">利基宝藏</span>
                            <p className="text-xs text-emerald-600 mt-1">低播放高互动，值得深挖的蓝海选题</p>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            {quadrantAnalysis.quadrants.niche.videos.length > 0 ? (
                              <div className="space-y-2">
                                {quadrantAnalysis.quadrants.niche.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                        <span className="text-emerald-600">互动率 {video.engagementRate?.toFixed(2) || '-'}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400 text-center py-4">暂无利基宝藏内容</p>
                            )}
                          </div>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>

                    {/* Traffic Content */}
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-700">流量内容</span>
                            <span className="text-lg font-bold text-blue-600 tabular-nums flex items-center gap-1">
                              {quadrantAnalysis.quadrants.traffic.count}
                              <Info size={12} className="text-blue-400" />
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-600/70">高播放 · 低互动</p>
                        </div>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          sideOffset={8}
                          side="bottom"
                          align="start"
                          className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                        >
                          <div className="p-3 border-b border-neutral-100 bg-blue-50">
                            <span className="text-sm font-medium text-blue-800">流量内容</span>
                            <p className="text-xs text-blue-600 mt-1">高播放低互动，吸引眼球但粘性不足</p>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            {quadrantAnalysis.quadrants.traffic.videos.length > 0 ? (
                              <div className="space-y-2">
                                {quadrantAnalysis.quadrants.traffic.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5 text-blue-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400 text-center py-4">暂无流量内容</p>
                            )}
                          </div>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>

                    {/* Weak Content */}
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-neutral-600">待优化</span>
                            <span className="text-lg font-bold text-neutral-500 tabular-nums flex items-center gap-1">
                              {quadrantAnalysis.quadrants.weak.count}
                              <Info size={12} className="text-neutral-400" />
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">低播放 · 低互动</p>
                        </div>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          sideOffset={8}
                          side="bottom"
                          align="end"
                          className="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                        >
                          <div className="p-3 border-b border-neutral-100 bg-neutral-100">
                            <span className="text-sm font-medium text-neutral-800">待优化内容</span>
                            <p className="text-xs text-neutral-600 mt-1">低播放低互动，需要重新审视</p>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            {quadrantAnalysis.quadrants.weak.videos.length > 0 ? (
                              <div className="space-y-2">
                                {quadrantAnalysis.quadrants.weak.videos.map((video) => (
                                  <div
                                    key={video.bvid}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                    onClick={() => openVideo(video)}
                                  >
                                    <img
                                      src={getImageUrl(video.cover)}
                                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                        <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400 text-center py-4">暂无待优化内容</p>
                            )}
                          </div>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>
                  </div>
                </section>
              )}
            </div>

            {/* Undervalued Content */}
            {undervaluedContent && undervaluedContent.videos.length > 0 && (
              <section className="report-card">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">被低估的潜力内容</h3>
                <p className="text-xs text-neutral-500 mb-4">{undervaluedContent.insight}</p>

                <div className="space-y-2">
                  {undervaluedContent.videos.slice(0, 3).map((video, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0"
                    >
                      <span className="text-xs text-neutral-400 w-4">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate">{video.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-neutral-400">{formatNumber(video.play_count)} 播放</span>
                          <span className="text-xs text-neutral-400">·</span>
                          <span className="text-xs text-emerald-600">{video.engagementRate.toFixed(2)}% 互动率</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Blue Ocean Opportunities */}
            {(blueOceanTiming || blueOceanDuration) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blue Ocean Timing */}
                {blueOceanTiming && (
                  <section className="report-card">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                      <Clock size={14} className="inline mr-1.5 text-cyan-500" />
                      发布时段分析
                    </h3>

                    {blueOceanTiming.blueOcean.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-neutral-500 mb-2">蓝海时段（竞争少、效果好）</p>
                        <div className="flex flex-wrap gap-2">
                          {blueOceanTiming.blueOcean.map((h, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-lg"
                            >
                              {h.label}
                              <span className="text-cyan-500 text-xs ml-1">{h.efficiency}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {blueOceanTiming.redOcean.length > 0 && (
                      <div>
                        <p className="text-xs text-neutral-500 mb-2">红海时段（竞争激烈）</p>
                        <div className="flex flex-wrap gap-2">
                          {blueOceanTiming.redOcean.map((h, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg"
                            >
                              {h.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Blue Ocean Duration */}
                {blueOceanDuration && (
                  <section className="report-card">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                      <Timer size={14} className="inline mr-1.5 text-violet-500" />
                      内容时长分析
                    </h3>

                    {blueOceanDuration.mainstream.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-neutral-500 mb-2">主流时长</p>
                        <div className="flex flex-wrap gap-2">
                          {blueOceanDuration.mainstream.map((d, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg"
                            >
                              {d.label}
                              <span className="text-neutral-400 text-xs ml-1">{d.ratio}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {blueOceanDuration.blueOcean.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-neutral-500 mb-2">蓝海时长（占比少但效果好）</p>
                        <div className="flex flex-wrap gap-2">
                          {blueOceanDuration.blueOcean.map((d, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg"
                            >
                              {d.label}
                              <span className="text-violet-500 text-xs ml-1">{d.efficiency}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {blueOceanDuration.depthPreference && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs font-medium text-amber-700">
                          {blueOceanDuration.depthPreference.type === 'long' ? '粉丝偏好深度长内容' : '短视频更受欢迎'}
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Tools */}
        <section className="report-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">AI 深度分析</h2>
            <span className="text-xs text-neutral-400">点击复制提示词</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1">
            {aiPromptTemplates.map((prompt, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 py-2.5 cursor-pointer hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => copyPrompt(prompt)}
              >
                <prompt.icon size={14} className="text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors truncate">{prompt.title}</span>
              </div>
            ))}
          </div>

          {/* Copy success toast */}
          {promptCopySuccess && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm rounded-full shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
              <CheckCircle size={16} className="text-emerald-400" />
              已复制到剪贴板
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-neutral-400 py-2">
          以上分析基于 {videos.length} 个视频数据，由算法自动生成
        </div>
      </div>
    </div>
  );
}

export default InsightReport;
