import { useMemo, useState, useCallback } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Flame,
  Copy,
  Lightbulb,
  CheckCircle,
  Activity,
  BookOpen,
  Crosshair,
  Calendar,
  BarChart3,
  AlertTriangle,
  MessageSquareOff,
  CalendarX,
  Info,
  Play,
  Type,
  CalendarDays
} from 'lucide-react';
import VideoFilterBar from '../VideoFilterBar';
import { VideoListHoverCard } from '../common';
import { formatNumber, copyToClipboard, parseDurationMinutes, getImageUrl } from '../../utils';
import { getTitleKeywordInsights, getTitlePatternInsights } from '../../utils/titleInsights';
import { useVideoMetrics } from '../../hooks';

function InsightReport({
  videos,
  upName = '',
  timeRange = 'all',
  duration = 'all',
  onUpdateTimeRange,
  onUpdateDuration,
  onOpenDrawer
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [promptCopySuccess, setPromptCopySuccess] = useState(false);

  // Use video metrics composable
  const {
    totalPlays,
    totalDanmu,
    totalComments,
    avgPlays,
    avgEngagementRate,
    hitRate,
    dataTimeRange,
    getAccountLevel,
    getBestDuration,
    getBestPublishTime,
    getPublishFrequency,
    getTrendAnalysis,
    getHitVideoFeatures,
    generateDataSummary,
    getQuadrantAnalysis,
    getPublishingRhythmInsight
  } = useVideoMetrics(videos);

  // Title insights
  const titleKeywordInsights = useMemo(() => getTitleKeywordInsights(videos), [videos]);
  const titlePatternInsights = useMemo(() => getTitlePatternInsights(videos), [videos]);
  const publishingRhythm = useMemo(() => getPublishingRhythmInsight(videos), [videos, getPublishingRhythmInsight]);

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
    if (hitFeatures && hitFeatures.count >= 1) {
      // 合并显示，description 分段可 hover
      findings.push({
        title: `${hitFeatures.count} 个爆款`,
        description: null, // 使用自定义渲染
        type: 'positive',
        icon: Flame,
        detailKey: 'hitVideos',
        // 传递爆款数据用于分段 hover
        hitData: {
          globalCount: hitFeatures.globalCount,
          localCount: hitFeatures.localCount
        }
      });
    }

    // 发布节奏故事
    if (publishingRhythm && publishingRhythm.longestBreakDays >= 30) {
      const title = publishingRhythm.isComeback
        ? `消失 ${publishingRhythm.longestBreakDays} 天后回归爆款`
        : `最长断更 ${publishingRhythm.longestBreakDays} 天`;
      findings.push({
        title,
        description: publishingRhythm.isComeback
          ? `回归首条视频达到均播的 ${publishingRhythm.comebackMultiple}x`
          : '断更后逐步恢复更新节奏',
        type: publishingRhythm.isComeback ? 'positive' : 'neutral',
        icon: CalendarDays,
        detailKey: 'rhythm',
      });
    }

    // 星期效应
    if (publishingRhythm && publishingRhythm.weekdayLift > 50 && publishingRhythm.bestWeekday && publishingRhythm.worstWeekday) {
      findings.push({
        title: `${publishingRhythm.bestWeekday.name}发视频效果最好`,
        description: `${publishingRhythm.bestWeekday.name}发视频比${publishingRhythm.worstWeekday.name}高 ${publishingRhythm.weekdayLift}%`,
        type: 'positive',
        icon: Calendar,
        detailKey: null,
      });
    }

    return findings.slice(0, 5);
  }, [videos, avgPlays, getBestDuration, getBestPublishTime, getTrendAnalysis, getHitVideoFeatures, publishingRhythm]);

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

    // Hit videos details - 使用统一的爆款检测算法
    const hitFeatures = getHitVideoFeatures(videos, avgPlays);
    if (hitFeatures) {
      details.globalVirals = { videos: hitFeatures.globalVirals || [] };
      details.localBreakouts = { videos: hitFeatures.localBreakouts || [] };
    }

    // Rhythm details
    if (publishingRhythm && publishingRhythm.longestBreakDays >= 30) {
      details.rhythm = {
        videoBeforeBreak: publishingRhythm.videoBeforeBreak,
        videoAfterBreak: publishingRhythm.videoAfterBreak,
        longestBreakDays: publishingRhythm.longestBreakDays,
        isComeback: publishingRhythm.isComeback,
        comebackMultiple: publishingRhythm.comebackMultiple,
      };
    }

    return details;
  }, [videos, avgPlays, getTrendAnalysis, getHitVideoFeatures, publishingRhythm]);

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

  // Open video in drawer
  const openVideo = useCallback((video) => {
    if (onOpenDrawer) {
      onOpenDrawer({ title: video.title, videos: [video] });
    } else if (video.video_url) {
      window.open(video.video_url, '_blank');
    } else if (video.bvid) {
      window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
    }
  }, [onOpenDrawer]);

  // Content quadrant analysis
  const quadrantAnalysis = useMemo(() => getQuadrantAnalysis(videos), [videos, getQuadrantAnalysis]);

  // Problem data analysis (simplified: only traffic trap + low period)
  const problemDataAnalysis = useMemo(() => {
    if (videos.length < 5) return null;

    const avg = avgPlays;
    const result = {};

    // 1. Low engagement (traffic trap) - 高播放低互动
    const avgEngRate = videos.reduce((s, v) => {
      const eng = v.danmu_count + (v.comment_count || 0);
      return s + (v.play_count > 0 ? (eng / v.play_count) * 100 : 0);
    }, 0) / videos.length;

    const lowEngVideos = videos
      .map(v => {
        const eng = v.danmu_count + (v.comment_count || 0);
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

    // 2. Low period analysis - 低迷期
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

    const hasProblems = result.lowEngagement || result.lowPeriod;
    return hasProblems ? result : null;
  }, [videos, avgPlays]);

  // AI Prompt Templates (simplified to 4 core templates)
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
        title: '完整报告',
        description: '生成完整数据分析报告',
        icon: BookOpen,
        color: 'bg-slate-700',
        prompt: `你是专业数据分析师。请基于以下数据生成完整报告：\n\n${dataSummary}\n\n请按以下结构输出：一、执行摘要 二、数据概览 三、深度分析 四、问题诊断 五、优化建议 六、总结`
      },
      {
        title: '复制数据',
        description: '复制原始数据用于自定义分析',
        icon: Copy,
        color: 'bg-neutral-500',
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
                    {/* 爆款特殊处理：分段 hover */}
                    {finding.detailKey === 'hitVideos' && finding.hitData ? (
                      <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed inline-flex items-center gap-1 flex-wrap">
                        {finding.hitData.globalCount > 0 && (
                          <VideoListHoverCard
                            title="全局爆款"
                            subtitle="在所有视频中播放量显著高"
                            videos={findingDetails.globalVirals?.videos || []}
                            onVideoClick={openVideo}
                          >
                            <span className="cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 transition-colors">
                              {finding.hitData.globalCount} 个全局爆款
                            </span>
                          </VideoListHoverCard>
                        )}
                        {finding.hitData.globalCount > 0 && finding.hitData.localCount > 0 && (
                          <span className="text-neutral-400 mx-1">+</span>
                        )}
                        {finding.hitData.localCount > 0 && (
                          <VideoListHoverCard
                            title="阶段突破"
                            subtitle="在当时阶段相对周围视频显著高"
                            videos={findingDetails.localBreakouts?.videos || []}
                            onVideoClick={openVideo}
                          >
                            <span className="cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 transition-colors">
                              {finding.hitData.localCount} 个阶段突破
                            </span>
                          </VideoListHoverCard>
                        )}
                      </p>
                    ) : finding.detailKey && findingDetails[finding.detailKey] ? (
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

                            {/* Rhythm HoverCard */}
                            {finding.detailKey === 'rhythm' && findingDetails.rhythm && (
                              <>
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <span className="text-sm font-medium text-neutral-700">发布节奏故事</span>
                                  <p className="text-xs text-neutral-500 mt-1">断更 {findingDetails.rhythm.longestBreakDays} 天前后对比</p>
                                </div>
                                <div className="p-3 space-y-2">
                                  {findingDetails.rhythm.videoBeforeBreak && (
                                    <div
                                      className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                      onClick={() => openVideo(findingDetails.rhythm.videoBeforeBreak)}
                                    >
                                      <img
                                        src={getImageUrl(findingDetails.rhythm.videoBeforeBreak.cover)}
                                        className="w-16 h-9 rounded object-cover flex-shrink-0"
                                        referrerPolicy="no-referrer"
                                        alt=""
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-neutral-400 mb-0.5">断更前最后一条</div>
                                        <div className="text-xs font-medium text-neutral-800 line-clamp-1">{findingDetails.rhythm.videoBeforeBreak.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                                          <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(findingDetails.rhythm.videoBeforeBreak.play_count)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {findingDetails.rhythm.videoAfterBreak && (
                                    <div
                                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                        findingDetails.rhythm.isComeback ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-neutral-50 hover:bg-neutral-100'
                                      }`}
                                      onClick={() => openVideo(findingDetails.rhythm.videoAfterBreak)}
                                    >
                                      <img
                                        src={getImageUrl(findingDetails.rhythm.videoAfterBreak.cover)}
                                        className="w-16 h-9 rounded object-cover flex-shrink-0"
                                        referrerPolicy="no-referrer"
                                        alt=""
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-[10px] mb-0.5 ${findingDetails.rhythm.isComeback ? 'text-emerald-600 font-medium' : 'text-neutral-400'}`}>
                                          回归首条 {findingDetails.rhythm.isComeback ? `(${findingDetails.rhythm.comebackMultiple}x 均播)` : ''}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-800 line-clamp-1">{findingDetails.rhythm.videoAfterBreak.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                                          <span className={`flex items-center gap-0.5 ${findingDetails.rhythm.isComeback ? 'text-emerald-600' : ''}`}>
                                            <Play size={8} /> {formatNumber(findingDetails.rhythm.videoAfterBreak.play_count)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
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

          {/* Title & Rhythm Insights - right column */}
          {(titleKeywordInsights.length > 0 || titlePatternInsights.length > 0) && (
            <section className="report-card">
              <h2 className="section-title">
                <Type size={16} className="text-blue-500" />
                标题与节奏洞察
              </h2>

              {/* A. 标题关键词效果 */}
              {titleKeywordInsights.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs text-neutral-500 mb-2.5">标题关键词效果</div>
                  <div className="flex gap-2 flex-wrap">
                    {titleKeywordInsights.map((kw) => (
                      <VideoListHoverCard
                        key={kw.keyword}
                        title={`含"${kw.keyword}"的视频`}
                        subtitle={`${kw.count} 条视频，均播 ${formatNumber(kw.avgPlay)}，是其余视频的 ${kw.lift}x`}
                        videos={kw.topVideos}
                        onVideoClick={openVideo}
                        colorScheme={kw.lift > 1.5 ? 'emerald' : kw.lift > 1.2 ? 'blue' : 'neutral'}
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            kw.lift > 1.5
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : kw.lift > 1.2
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : kw.lift < 1
                              ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {kw.keyword}
                          <span className="tabular-nums">{kw.lift}x</span>
                        </span>
                      </VideoListHoverCard>
                    ))}
                  </div>
                </div>
              )}

              {/* B. 标题句式规律 */}
              {titlePatternInsights.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs text-neutral-500 mb-1.5">标题句式规律</div>
                  {titlePatternInsights.slice(0, 2).map((p) => (
                    <p key={p.pattern} className="text-sm text-neutral-600 leading-relaxed">
                      标题含<span className="font-medium text-neutral-900">{p.label}</span>的视频，均播高出{' '}
                      <span className="font-semibold text-emerald-600">{p.lift}x</span>
                      <span className="text-neutral-400 ml-1">（{p.count}条 vs {p.unmatchedCount}条）</span>
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Problem Data Analysis */}
        {problemDataAnalysis && (
          <section className="report-card border border-amber-100">
            <h2 className="section-title">
              <AlertTriangle size={16} className="text-amber-500" />
              问题数据诊断
            </h2>
            <p className="text-xs text-neutral-500 -mt-2 mb-4">以下数据需要特别关注，可能是内容策略的改进方向</p>

            <div className="space-y-6">
              {/* Low Engagement (Traffic Trap) */}
              {problemDataAnalysis.lowEngagement && problemDataAnalysis.lowEngagement.count > 0 && (
                <div className="problem-block">
                  <div className="problem-header">
                    <div className="problem-icon purple">
                      <MessageSquareOff size={16} />
                    </div>
                    <div>
                      <h3 className="problem-title">流量陷阱内容</h3>
                      <VideoListHoverCard
                        title="流量陷阱内容"
                        subtitle="播放量高于均值但互动率低于均值的 50%"
                        videos={problemDataAnalysis.lowEngagement.videos}
                        onVideoClick={openVideo}
                        colorScheme="purple"
                        width="w-96"
                        renderVideoMeta={(video) => (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                            <span className="flex items-center gap-0.5"><Play size={8} /> {formatNumber(video.play_count)}</span>
                            <span className="text-purple-600">互动率 {video.engagementRate.toFixed(2)}%</span>
                          </div>
                        )}
                      >
                        <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-purple-500 inline-flex items-center gap-1 transition-colors">
                          <strong>{problemDataAnalysis.lowEngagement.count}</strong> 个视频高播放但低互动
                          <Info size={12} className="text-neutral-400" />
                        </p>
                      </VideoListHoverCard>
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
                      <VideoListHoverCard
                        title={`${problemDataAnalysis.lowPeriod.period} 低迷期视频`}
                        subtitle={`该时期均播放 ${formatNumber(problemDataAnalysis.lowPeriod.avgPlay)}，对比整体 ${problemDataAnalysis.lowPeriod.vsAvg}%`}
                        videos={problemDataAnalysis.lowPeriod.videos}
                        onVideoClick={openVideo}
                        colorScheme="slate"
                        width="w-96"
                        renderVideoMeta={(video) => (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                            <span className="flex items-center gap-0.5 text-slate-600"><Play size={8} /> {formatNumber(video.play_count)}</span>
                            <span>{video.publish_time.slice(0, 10)}</span>
                          </div>
                        )}
                      >
                        <p className="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-slate-500 inline-flex items-center gap-1 transition-colors">
                          {problemDataAnalysis.lowPeriod.period} 期间 <strong>{problemDataAnalysis.lowPeriod.count}</strong> 个视频表现较差
                          <Info size={12} className="text-neutral-400" />
                        </p>
                      </VideoListHoverCard>
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

        {/* Content Quadrant Analysis */}
        {quadrantAnalysis && (
          <section className="report-card">
            <h2 className="section-title">
              <BarChart3 size={16} className="text-violet-500" />
              内容四象限
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Star Content */}
              <div
                className="p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors"
                onClick={() => onOpenDrawer?.({ title: '明星内容', videos: quadrantAnalysis.quadrants.star.videos })}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-700">明星内容</span>
                  <span className="text-lg font-bold text-amber-600 tabular-nums">
                    {quadrantAnalysis.quadrants.star.count}
                  </span>
                </div>
                <p className="text-[11px] text-amber-600/70">高播放 · 高互动</p>
              </div>

              {/* Niche Content */}
              <div
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 relative cursor-pointer hover:border-emerald-300 transition-colors"
                onClick={() => onOpenDrawer?.({ title: '利基宝藏', videos: quadrantAnalysis.quadrants.niche.videos })}
              >
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded font-medium">
                  蓝海
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-700">利基宝藏</span>
                  <span className="text-lg font-bold text-emerald-600 tabular-nums">
                    {quadrantAnalysis.quadrants.niche.count}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600/70">低播放 · 高互动</p>
              </div>

              {/* Traffic Content */}
              <div
                className="p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => onOpenDrawer?.({ title: '流量内容', videos: quadrantAnalysis.quadrants.traffic.videos })}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700">流量内容</span>
                  <span className="text-lg font-bold text-blue-600 tabular-nums">
                    {quadrantAnalysis.quadrants.traffic.count}
                  </span>
                </div>
                <p className="text-[11px] text-blue-600/70">高播放 · 低互动</p>
              </div>

              {/* Weak Content */}
              <div
                className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors"
                onClick={() => onOpenDrawer?.({ title: '待优化内容', videos: quadrantAnalysis.quadrants.weak.videos })}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-600">待优化</span>
                  <span className="text-lg font-bold text-neutral-500 tabular-nums">
                    {quadrantAnalysis.quadrants.weak.count}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">低播放 · 低互动</p>
              </div>
            </div>
          </section>
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
