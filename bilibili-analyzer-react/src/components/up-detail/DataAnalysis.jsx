import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import * as echarts from 'echarts';
import {
  Zap,
  Play,
  Calculator,
  Flame,
  CalendarDays,
  MessageSquare,
  MessageCircle,
  Star,
  Clock,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import VideoFilterBar from '../VideoFilterBar';
import { useVideoMetrics } from '../../hooks';
import { formatNumber, formatAxisNumber, parseDurationMinutes, getImageUrl, detectAllVirals } from '../../utils';
import { ANALYSIS_THRESHOLDS } from '../../utils/constants';
import {
  chartTheme,
  distributionColors,
  heatmapColors,
  colors,
  gradients,
  highlightColor,
  secondaryAxis
} from '../../utils/theme';

function DataAnalysis({
  analysisVideos,
  allVideos,
  timeRange,
  duration,
  onUpdateTimeRange,
  onUpdateDuration,
  onOpenDrawer
}) {
  // Chart refs - 8 charts (merged monthly/yearly trend, removed hourly chart)
  const playDistChartRef = useRef(null);
  const durationChartRef = useRef(null);
  const publishTrendChartRef = useRef(null);
  const scatterChartRef = useRef(null);
  const heatmapChartRef = useRef(null);
  const topVideosChartRef = useRef(null);
  const topEngagementChartRef = useRef(null);
  const timelineChartRef = useRef(null);

  // Chart instances
  const chartsRef = useRef({});

  // 累计播放量曲线显示状态
  const [showCumulativeLine, setShowCumulativeLine] = useState(false);
  // 爆款标注显示状态（分别控制）
  const [showGlobalViral, setShowGlobalViral] = useState(false);
  const [showLocalBreakout, setShowLocalBreakout] = useState(false);
  // 发布趋势图表粒度：'month' | 'year'
  const [trendGranularity, setTrendGranularity] = useState('month');

  // Use video metrics hook
  const {
    totalPlays,
    avgPlays,
    avgPlaysChange,
    hitRate,
    avgEngagementRate,
    monthlyPublishRate,
    totalDanmu,
    totalComments,
    totalFavorites,
    avgDuration,
    dataTimeRange
  } = useVideoMetrics(analysisVideos, allVideos);

  const hasActiveFilter = useMemo(() => {
    return timeRange !== 'all' || duration !== 'all';
  }, [timeRange, duration]);

  // Initialize or get existing chart instance
  const getChart = (ref, name) => {
    if (!ref.current) return null;
    if (!chartsRef.current[name]) {
      chartsRef.current[name] = echarts.init(ref.current);
    }
    return chartsRef.current[name];
  };

  // Tooltip with cover image helper
  const tooltipWithCover = (video, extraInfo = '') => {
    const coverUrl = video.cover ? getImageUrl(video.cover) : '';
    const coverImg = coverUrl
      ? `<img src="${coverUrl}" style="width: 160px; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" referrerPolicy="no-referrer" />`
      : '';
    return `<div style="width: 160px;">${coverImg}<div style="font-weight: 600; margin-bottom: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px;">${video.title}</div><div style="color: #6B7280; font-size: 12px;">${extraInfo}</div></div>`;
  };

  // Open video drawer callback
  const openVideoDrawer = useCallback((title, videos) => {
    onOpenDrawer?.({ title, videos });
  }, [onOpenDrawer]);

  // Open video URL (for scatter chart)
  const openVideo = useCallback(async (video) => {
    if (video.video_url) {
      window.open(video.video_url, '_blank');
    }
  }, []);

  // ============ Chart Rendering Functions ============

  const renderPlayDistChart = () => {
    const chart = getChart(playDistChartRef, 'playDist');
    if (!chart || analysisVideos.length === 0) return;

    const plays = analysisVideos.map(v => v.play_count).sort((a, b) => a - b);
    const maxPlay = plays[plays.length - 1] || 0;

    let bins, labels;
    if (maxPlay <= 10000) {
      bins = [0, 1000, 3000, 5000, 10000, Infinity];
      labels = ['<1千', '1-3千', '3-5千', '5千-1万', '>1万'];
    } else if (maxPlay <= 100000) {
      bins = [0, 5000, 10000, 30000, 50000, 100000, Infinity];
      labels = ['<5千', '5千-1万', '1-3万', '3-5万', '5-10万', '>10万'];
    } else if (maxPlay <= 1000000) {
      bins = [0, 10000, 50000, 100000, 300000, 500000, 1000000, Infinity];
      labels = ['<1万', '1-5万', '5-10万', '10-30万', '30-50万', '50-100万', '>100万'];
    } else {
      bins = [0, 100000, 500000, 1000000, 2000000, 5000000, 10000000, Infinity];
      labels = ['<10万', '10-50万', '50-100万', '100-200万', '200-500万', '500-1000万', '>1000万'];
    }

    const videosByBin = labels.map(() => []);
    analysisVideos.forEach(v => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (v.play_count >= bins[i] && v.play_count < bins[i + 1]) {
          videosByBin[i].push(v);
          break;
        }
      }
    });

    const counts = videosByBin.map(arr => arr.length);

    chart.setOption({
      ...chartTheme,
      grid: { ...chartTheme.grid, bottom: 50 },
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        confine: true,
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const count = counts[idx];
          return `<div style="font-size: 13px;"><strong>${labels[idx]}</strong><br/>共 ${count} 个视频<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
        }
      },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'category',
        data: labels,
        axisLabel: { ...chartTheme.xAxis.axisLabel, rotate: 0, interval: 0 }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'value',
        axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
      },
      series: [{
        type: 'bar',
        data: counts,
        barMaxWidth: 32,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: { itemStyle: { color: colors.blue600 } }
      }]
    });

    chart.off('click');
    chart.on('click', (params) => {
      const idx = params.dataIndex;
      openVideoDrawer(`播放量区间: ${labels[idx]}`, videosByBin[idx]);
    });
  };

  const renderDurationChart = () => {
    const chart = getChart(durationChartRef, 'duration');
    if (!chart || analysisVideos.length === 0) return;

    const bins = [0, 5, 10, 15, 20, 30, 60, Infinity];
    const labels = ['<5分', '5-10分', '10-15分', '15-20分', '20-30分', '30-60分', '>60分'];

    const videosByBin = labels.map(() => []);
    const durationData = labels.map(() => ({ count: 0, totalPlays: 0 }));

    analysisVideos.forEach(v => {
      const minutes = parseDurationMinutes(v.duration);
      for (let i = 0; i < bins.length - 1; i++) {
        if (minutes >= bins[i] && minutes < bins[i + 1]) {
          videosByBin[i].push(v);
          durationData[i].count++;
          durationData[i].totalPlays += v.play_count;
          break;
        }
      }
    });

    const counts = videosByBin.map(arr => arr.length);
    const avgPlaysData = durationData.map(d => d.count > 0 ? Math.round(d.totalPlays / d.count) : 0);
    const bestIndex = avgPlaysData.indexOf(Math.max(...avgPlaysData.filter(v => v > 0)));

    chart.setOption({
      ...chartTheme,
      grid: { top: 30, right: 60, bottom: 30, left: 20, containLabel: true },
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        confine: true,
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const avgPlay = avgPlaysData[idx];
          return `<div style="font-size: 13px;"><strong>${labels[idx]}</strong><br/>共 ${counts[idx]} 个视频<br/>均播放: ${formatNumber(avgPlay)}<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
        }
      },
      legend: { ...chartTheme.legend, data: ['视频数量', '平均播放量'], top: 0 },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'category',
        data: labels,
        axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 0, rotate: 0 }
      },
      yAxis: [
        { ...chartTheme.yAxis, type: 'value', position: 'left', name: '数量' },
        {
          ...chartTheme.yAxis,
          type: 'value',
          position: 'right',
          name: '播放量',
          axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
        }
      ],
      series: [
        {
          name: '视频数量',
          type: 'bar',
          data: counts.map((value, i) => ({
            value,
            itemStyle: { color: distributionColors[i], borderRadius: [4, 4, 0, 0] }
          })),
          barMaxWidth: 32
        },
        {
          name: '平均播放量',
          type: 'line',
          yAxisIndex: 1,
          data: avgPlaysData.map((v, i) => ({
            value: v,
            itemStyle: { color: i === bestIndex ? highlightColor.solid : secondaryAxis.line }
          })),
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: (value, params) => params.dataIndex === bestIndex ? 10 : 6,
          itemStyle: { color: secondaryAxis.line },
          lineStyle: { width: 2.5, color: secondaryAxis.line }
        }
      ]
    });

    chart.off('click');
    chart.on('click', (params) => {
      if (params.seriesType === 'bar') {
        const idx = params.dataIndex;
        openVideoDrawer(`时长区间: ${labels[idx]}`, videosByBin[idx]);
      }
    });
  };

  const renderPublishTrendChart = () => {
    const chart = getChart(publishTrendChartRef, 'publishTrend');
    if (!chart || analysisVideos.length === 0) return;

    const isMonthly = trendGranularity === 'month';
    const trendData = {};
    const trendVideos = {};

    analysisVideos.forEach(v => {
      const key = isMonthly ? v.publish_time.slice(0, 7) : v.publish_time.slice(0, 4);
      if (!trendData[key]) {
        trendData[key] = { count: 0, totalPlays: 0 };
        trendVideos[key] = [];
      }
      trendData[key].count++;
      trendData[key].totalPlays += v.play_count;
      trendVideos[key].push(v);
    });

    const periods = Object.keys(trendData).sort();
    const counts = periods.map(p => trendData[p].count);
    const avgPlaysData = periods.map(p => Math.round(trendData[p].totalPlays / trendData[p].count));

    chart.setOption({
      ...chartTheme,
      grid: { ...chartTheme.grid, bottom: 60 },
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        confine: true,
        formatter: params => {
          const period = params[0].axisValue;
          const label = isMonthly ? period : `${period}年`;
          return `<div><strong>${label}</strong><br/>发布: ${params[0].value} 个<br/>均播放: ${formatNumber(params[1]?.value || 0)}<br/><span style="color: #3B82F6;">点击查看详情</span></div>`;
        }
      },
      legend: { ...chartTheme.legend, data: ['发布数量', '平均播放量'] },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'category',
        data: periods,
        axisLabel: {
          ...chartTheme.xAxis.axisLabel,
          rotate: isMonthly ? 45 : 0,
          interval: isMonthly ? Math.floor(periods.length / 12) : 0
        }
      },
      yAxis: [
        {
          ...chartTheme.yAxis,
          type: 'value',
          position: 'left',
          axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
        },
        {
          ...chartTheme.yAxis,
          type: 'value',
          position: 'right',
          axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
        }
      ],
      series: [
        {
          name: '发布数量',
          type: 'bar',
          data: counts,
          barMaxWidth: isMonthly ? 32 : 48,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradients.bar),
            borderRadius: [6, 6, 0, 0]
          },
          label: isMonthly ? { show: false } : {
            show: true,
            position: 'top',
            color: '#6B7280',
            fontSize: 11,
            fontWeight: 600
          }
        },
        {
          name: '平均播放量',
          type: 'line',
          yAxisIndex: 1,
          data: avgPlaysData,
          smooth: 0.4,
          showSymbol: !isMonthly,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: secondaryAxis.line, borderColor: '#fff', borderWidth: 2 },
          lineStyle: { width: 2.5 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, secondaryAxis.area) }
        }
      ]
    });

    chart.off('click');
    chart.on('click', (params) => {
      if (params.seriesType === 'bar') {
        const period = params.name;
        const label = isMonthly ? `发布月份: ${period}` : `${period}年发布的视频`;
        openVideoDrawer(label, trendVideos[period]);
      }
    });
  };

  const renderScatterChart = () => {
    const chart = getChart(scatterChartRef, 'scatter');
    if (!chart || analysisVideos.length === 0) return;

    const scatterData = analysisVideos.map(v => ({
      value: [v.play_count, v.danmu_count],
      video: v
    }));

    chart.setOption({
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'item',
        formatter: (params) => {
          const video = params.data.video;
          if (!video) return '';
          return tooltipWithCover(video, `播放: ${formatNumber(params.value[0])}<br/>弹幕: ${formatNumber(params.value[1])}<br/>弹幕率: ${((params.value[1] / params.value[0]) * 100).toFixed(2)}%<br/><span style="color:#3B82F6">点击打开视频</span>`);
        }
      },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'value',
        name: '播放量',
        axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'value',
        name: '弹幕数',
        axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber }
      },
      series: [{
        type: 'scatter',
        symbolSize: 10,
        data: scatterData,
        itemStyle: { color: colors.blue500, opacity: 0.7 },
        emphasis: {
          itemStyle: {
            color: colors.blue600,
            opacity: 1,
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)'
          },
          scale: 1.8
        },
        cursor: 'pointer'
      }]
    });

    chart.off('click');
    chart.on('click', (params) => {
      const video = params.data?.video;
      if (video) {
        openVideo(video);
      }
    });
  };

  const renderHeatmapChart = () => {
    const chart = getChart(heatmapChartRef, 'heatmap');
    if (!chart || analysisVideos.length === 0) return;

    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}时`);

    const statsMap = {};

    analysisVideos.forEach(v => {
      const date = new Date(v.publish_time);
      const weekday = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      const key = `${weekday}-${hour}`;
      if (!statsMap[key]) {
        statsMap[key] = { count: 0, totalPlays: 0, videos: [] };
      }
      statsMap[key].count++;
      statsMap[key].totalPlays += v.play_count;
      statsMap[key].videos.push(v);
    });

    const data = [];
    let maxAvgPlay = 0;

    for (let w = 0; w < 7; w++) {
      for (let h = 0; h < 24; h++) {
        const key = `${w}-${h}`;
        const stats = statsMap[key];
        const avgPlay = stats ? Math.round(stats.totalPlays / stats.count) : 0;
        data.push([h, w, avgPlay, stats?.count || 0]);
        if (avgPlay > maxAvgPlay) maxAvgPlay = avgPlay;
      }
    }

    const bestSlot = data.reduce((best, curr) => curr[2] > best[2] ? curr : best, data[0]);

    chart.setOption({
      ...chartTheme,
      grid: { top: 10, right: 80, bottom: 60, left: 60 },
      tooltip: {
        ...chartTheme.tooltip,
        confine: true,
        formatter: (params) => {
          const [hour, weekday, avgPlay, count] = params.value;
          if (count === 0) return `${weekdays[weekday]} ${hour}时<br/>暂无数据`;
          const isBest = hour === bestSlot[0] && weekday === bestSlot[1];
          return `<div>
            <strong>${weekdays[weekday]} ${hour}时</strong>${isBest ? ' <span style="color:#EF4444">★ 最佳</span>' : ''}<br/>
            平均播放: <strong>${formatNumber(avgPlay)}</strong><br/>
            视频数: ${count} 个<br/>
            <span style="color:#3B82F6">点击查看详情</span>
          </div>`;
        }
      },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'category',
        data: hours,
        splitArea: { show: true },
        axisLabel: { ...chartTheme.xAxis.axisLabel, interval: 1 }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'category',
        data: weekdays,
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: maxAvgPlay || 1,
        calculable: true,
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemHeight: 120,
        inRange: { color: heatmapColors },
        formatter: (value) => formatNumber(Math.round(value))
      },
      series: [{
        type: 'heatmap',
        data: data.map(d => [d[0], d[1], d[2]]),
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.3)' } },
        itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#ffffff' }
      }]
    });

    chart.off('click');
    chart.on('click', (params) => {
      const [hour, weekday] = params.value;
      const key = `${weekday}-${hour}`;
      const stats = statsMap[key];
      if (stats && stats.videos.length > 0) {
        openVideoDrawer(`${weekdays[weekday]} ${hour}时发布`, stats.videos);
      }
    });
  };

  const renderTopVideosChart = () => {
    const chart = getChart(topVideosChartRef, 'topVideos');
    if (!chart || analysisVideos.length === 0) return;

    const topVideosData = [...analysisVideos].sort((a, b) => b.play_count - a.play_count).slice(0, 15);
    const titles = topVideosData.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
    const plays = topVideosData.map(v => v.play_count);

    chart.setOption({
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        confine: true,
        formatter: (params) => {
          const idx = 14 - params[0].dataIndex;
          const video = topVideosData[idx];
          return tooltipWithCover(video, `播放: ${formatNumber(video.play_count)}<br/><span style="color: #3B82F6;">点击打开视频</span>`);
        }
      },
      grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'value',
        axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: formatAxisNumber }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'category',
        data: titles.reverse(),
        axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' }
      },
      series: [{
        type: 'bar',
        data: plays.reverse(),
        barMaxWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.barHorizontal),
          borderRadius: [0, 6, 6, 0]
        }
      }]
    });

    chart.off('click');
    chart.on('click', (params) => {
      const video = topVideosData[14 - params.dataIndex];
      openVideo(video);
    });
  };

  const renderTopEngagementChart = () => {
    const chart = getChart(topEngagementChartRef, 'topEngagement');
    if (!chart || analysisVideos.length === 0) return;

    const videosWithEngagement = analysisVideos
      .filter(v => v.play_count >= ANALYSIS_THRESHOLDS.minPlayForEngagement)
      .map(v => ({
        ...v,
        engagementRate: ((v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0)) / v.play_count) * 100
      }))
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 15);

    const titles = videosWithEngagement.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '...' : v.title);
    const rates = videosWithEngagement.map(v => v.engagementRate.toFixed(2));
    const maxIdx = videosWithEngagement.length - 1;

    chart.setOption({
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        confine: true,
        formatter: (params) => {
          const idx = maxIdx - params[0].dataIndex;
          const video = videosWithEngagement[idx];
          return tooltipWithCover(video, `互动率: ${video.engagementRate.toFixed(2)}%<br/>播放: ${formatNumber(video.play_count)}<br/><span style="color: #3B82F6;">点击打开视频</span>`);
        }
      },
      grid: { left: '22%', right: '10%', top: 30, bottom: 30 },
      xAxis: {
        ...chartTheme.xAxis,
        type: 'value',
        axisLabel: { ...chartTheme.xAxis.axisLabel, formatter: v => v + '%' }
      },
      yAxis: {
        ...chartTheme.yAxis,
        type: 'category',
        data: titles.reverse(),
        axisLabel: { ...chartTheme.yAxis.axisLabel, width: 150, overflow: 'truncate' }
      },
      series: [{
        type: 'bar',
        data: rates.reverse(),
        barMaxWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradients.barHorizontal),
          borderRadius: [0, 6, 6, 0]
        }
      }]
    });

    chart.off('click');
    chart.on('click', (params) => {
      const video = videosWithEngagement[maxIdx - params.dataIndex];
      openVideo(video);
    });
  };

  const renderTimelineChart = () => {
    const chart = getChart(timelineChartRef, 'timeline');
    if (!chart || analysisVideos.length === 0) return;

    const sortedVideos = [...analysisVideos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));

    // 检测爆款视频
    const { globalVirals, localBreakouts } = detectAllVirals(sortedVideos, {
      globalMaxCount: 10,
      localMaxCount: 10
    });

    // 创建爆款索引映射
    const viralMap = new Map();
    globalVirals.forEach(v => viralMap.set(v.index, 'global'));
    localBreakouts.forEach(v => {
      if (!viralMap.has(v.index)) {
        viralMap.set(v.index, 'local');
      }
    });

    let currentThreshold = null;
    const sourceData = sortedVideos.map((v, i) => [i, v.play_count, i]);

    // 计算累计播放量数据
    let cumulative = 0;
    const cumulativeData = sortedVideos.map((v, i) => {
      cumulative += v.play_count;
      return [i, cumulative];
    });

    const renderChart = (threshold) => {
      const filteredData = threshold === null
        ? sourceData
        : sourceData.filter(d => d[1] >= threshold);

      // 根据阈值和爆款类型确定颜色
      const getBarColor = (dataIndex) => {
        const viralType = viralMap.get(dataIndex);
        // 全局爆款 - 红色（需开启）
        if (showGlobalViral && viralType === 'global') {
          return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#EF4444' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.4)' }
          ]);
        }
        // 局部突破 - 橙色（需开启）
        if (showLocalBreakout && viralType === 'local') {
          return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#F59E0B' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.4)' }
          ]);
        }
        if (threshold !== null) {
          // 阈值筛选模式 - 黄色
          return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#F59E0B' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.4)' }
          ]);
        }
        // 普通视频 - 蓝色
        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors.primary },
          { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }
        ]);
      };

      const filteredCount = filteredData.length;
      const totalCount = sourceData.length;

      // 构建柱状图数据，为每个柱子单独设置颜色
      const barData = filteredData.map(d => ({
        value: d,
        itemStyle: { color: getBarColor(d[2]), borderRadius: [3, 3, 0, 0] }
      }));

      // 构建 series 数组
      const series = [{
        name: '单视频播放量',
        type: 'bar',
        data: barData,
        encode: { x: 0, y: 1 },
        barMaxWidth: 16,
        markLine: threshold !== null ? {
          silent: true,
          symbol: 'none',
          animation: false,
          lineStyle: { color: '#F59E0B', width: 1.5, type: 'dashed' },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: `阈值: ${formatNumber(threshold)}`,
            color: '#F59E0B',
            fontSize: 11,
            fontWeight: 500
          },
          data: [{ yAxis: threshold }]
        } : { data: [] }
      }];

      // 如果开启累计曲线，添加折线图
      if (showCumulativeLine) {
        series.push({
          name: '累计播放量',
          type: 'line',
          yAxisIndex: 1,
          data: cumulativeData,
          encode: { x: 0, y: 1 },
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { width: 2, color: '#10B981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
            ])
          }
        });
      }

      chart.setOption({
        ...chartTheme,
        tooltip: {
          ...chartTheme.tooltip,
          trigger: 'axis',
          formatter: p => {
            if (!p || !p[0]) return '';
            const barData = p.find(item => item.seriesName === '单视频播放量');
            if (!barData) return '';
            const videoIdx = barData.data.value[2];
            const video = sortedVideos[videoIdx];
            const thresholdInfo = threshold !== null
              ? `<br/><span style="color: #F59E0B">阈值: ${formatNumber(threshold)}</span>`
              : '';
            const cumulativeInfo = showCumulativeLine
              ? `<br/><span style="color: #10B981">累计: ${formatNumber(cumulativeData[videoIdx][1])}</span>`
              : '';
            // 爆款标签（只有开启对应开关时才显示）
            const viralType = viralMap.get(videoIdx);
            let viralTag = '';
            if (showGlobalViral && viralType === 'global') {
              viralTag = '<span style="display: inline-block; background: #EF4444; color: white; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-bottom: 6px;">全局爆款</span><br/>';
            } else if (showLocalBreakout && viralType === 'local') {
              viralTag = '<span style="display: inline-block; background: #F59E0B; color: white; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-bottom: 6px;">局部突破</span><br/>';
            }
            const coverUrl = video.cover ? getImageUrl(video.cover) : '';
            const coverImg = coverUrl
              ? `<img src="${coverUrl}" style="width: 160px; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" referrerPolicy="no-referrer" />`
              : '';
            return `<div style="width: 160px;">${coverImg}${viralTag}<div style="font-weight: 600; margin-bottom: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px;">${video.title}</div><div style="color: #6B7280; font-size: 12px;">发布: ${video.publish_time}<br/>播放: ${formatNumber(video.play_count)}${cumulativeInfo}${thresholdInfo}</div></div>`;
          }
        },
        legend: showCumulativeLine ? {
          show: true,
          top: 0,
          right: 0,
          textStyle: { fontSize: 11, color: '#6B7280' },
          itemWidth: 16,
          itemHeight: 8
        } : { show: false },
        grid: { left: '8%', right: showCumulativeLine ? '10%' : '4%', bottom: '22%', top: showCumulativeLine ? '10%' : '8%' },
        dataZoom: [
          {
            type: 'slider',
            show: true,
            start: 0,
            end: 100,
            bottom: 8,
            height: 18,
            borderColor: 'transparent',
            backgroundColor: '#F3F4F6',
            fillerColor: 'rgba(59, 130, 246, 0.2)',
            handleStyle: { color: colors.primary }
          }
        ],
        xAxis: {
          ...chartTheme.xAxis,
          type: 'category',
          axisLabel: { show: false },
          axisTick: { show: false },
          name: threshold !== null ? `筛选: ${filteredCount}/${totalCount} 个视频` : `共 ${totalCount} 个视频`,
          nameLocation: 'middle',
          nameGap: 25,
          nameTextStyle: { color: threshold !== null ? '#F59E0B' : '#9CA3AF', fontSize: 11 }
        },
        yAxis: [
          {
            ...chartTheme.yAxis,
            type: 'value',
            axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber },
            axisLine: { lineStyle: { color: threshold !== null ? '#F59E0B' : '#E5E7EB' } },
            triggerEvent: true
          },
          ...(showCumulativeLine ? [{
            ...chartTheme.yAxis,
            type: 'value',
            position: 'right',
            axisLabel: { ...chartTheme.yAxis.axisLabel, formatter: formatAxisNumber, color: '#10B981' },
            axisLine: { show: true, lineStyle: { color: '#10B981' } },
            splitLine: { show: false }
          }] : [])
        ],
        series
      }, { notMerge: true });
    };

    renderChart(null);

    chart.getZr().off('click');
    chart.getZr().on('click', (params) => {
      const pointInPixel = [params.offsetX, params.offsetY];
      const pointInGrid = chart.convertFromPixel('grid', pointInPixel);

      const gridInfo = chart.getModel().getComponent('grid').coordinateSystem.getRect();
      if (params.offsetX < gridInfo.x && params.offsetX > 0) {
        const yValue = pointInGrid[1];
        if (yValue !== null && yValue >= 0) {
          if (currentThreshold !== null && currentThreshold > 0 && Math.abs(yValue - currentThreshold) / currentThreshold < 0.1) {
            currentThreshold = null;
          } else {
            currentThreshold = Math.round(yValue);
          }
          renderChart(currentThreshold);
        }
      }
    });
  };

  // Render all charts when data changes
  useEffect(() => {
    if (analysisVideos.length === 0) return;

    const timer = setTimeout(() => {
      renderPlayDistChart();
      renderDurationChart();
      renderPublishTrendChart();
      renderScatterChart();
      renderHeatmapChart();
      renderTopVideosChart();
      renderTopEngagementChart();
      renderTimelineChart();
    }, 100);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisVideos]);

  // Re-render timeline chart when options change
  useEffect(() => {
    if (analysisVideos.length === 0) return;
    renderTimelineChart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCumulativeLine, showGlobalViral, showLocalBreakout]);

  // Re-render publish trend chart when granularity changes
  useEffect(() => {
    if (analysisVideos.length === 0) return;
    renderPublishTrendChart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendGranularity]);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(chartsRef.current).forEach(chart => chart?.dispose());
      chartsRef.current = {};
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <VideoFilterBar
        timeRange={timeRange}
        duration={duration}
        onUpdateTimeRange={onUpdateTimeRange}
        onUpdateDuration={onUpdateDuration}
      >
        <div slot="right" className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            已筛选 <strong className="text-neutral-600">{analysisVideos.length}</strong> / {allVideos.length} 个视频
          </span>
          {hasActiveFilter && <span className="text-xs text-neutral-400">·</span>}
          {hasActiveFilter && <span className="text-xs text-neutral-400">{dataTimeRange}</span>}
        </div>
      </VideoFilterBar>

      {/* Data Overview Cards */}
      <section>
        <h2 className="section-title">
          <Zap size={16} />
          数据概览
        </h2>
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Core Metrics */}
          <div className="px-5 py-5">
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-1">
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">{formatNumber(totalPlays)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Play size={12} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">总播放量</span>
                </div>
              </div>

              <div className="col-span-1">
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">{formatNumber(avgPlays)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calculator size={12} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">场均播放</span>
                  {hasActiveFilter && (
                    <span className={`text-xs font-medium ${avgPlaysChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {avgPlaysChange >= 0 ? '+' : ''}{avgPlaysChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">
                  {hitRate}<span className="text-base font-normal text-neutral-400">%</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame size={12} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">爆款率</span>
                </div>
              </div>

              <div className="col-span-1">
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">
                  {avgEngagementRate}<span className="text-base font-normal text-neutral-400">%</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap size={12} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">互动率</span>
                </div>
              </div>

              <div className="col-span-1">
                <div className="text-2xl font-semibold text-neutral-900 tabular-nums">{monthlyPublishRate}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <CalendarDays size={12} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">月均发布</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="px-2 pb-2">
            <div className="bg-neutral-100/70 rounded-2xl px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      <strong className="font-semibold">{formatNumber(totalDanmu)}</strong> 弹幕
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      <strong className="font-semibold">{formatNumber(totalComments)}</strong> 评论
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      <strong className="font-semibold">{formatNumber(totalFavorites)}</strong> 收藏
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      均时长 <strong className="font-semibold">{avgDuration}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  数据范围：{dataTimeRange}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      {analysisVideos.length > 0 && (
        <div className="space-y-6">
          {/* Core Data Analysis */}
          <section>
            <h2 className="section-title">
              <BarChart3 size={16} />
              核心数据分析
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="chart-card">
                <h3 className="chart-title">播放量分布</h3>
                <div ref={playDistChartRef} className="h-[260px]"></div>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">视频时长分布与平均播放量</h3>
                <div ref={durationChartRef} className="h-[260px]"></div>
              </div>
            </div>
          </section>

          {/* Time Trend */}
          <section>
            <h2 className="section-title">
              <TrendingUp size={16} />
              时间趋势
            </h2>
            <div className="chart-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="chart-title !mb-0">发布趋势与播放量</h3>
                <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
                  {[
                    { value: 'month', label: '按月' },
                    { value: 'year', label: '按年' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTrendGranularity(option.value)}
                      className="relative px-3 py-1 text-xs font-medium rounded-md z-[1]"
                    >
                      {trendGranularity === option.value && (
                        <motion.div
                          layoutId="trend-granularity-indicator"
                          className="absolute inset-0 bg-white rounded-md shadow-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-[1] transition-colors duration-200 ${
                        trendGranularity === option.value ? 'text-neutral-900' : 'text-neutral-500'
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div ref={publishTrendChartRef} className="h-[280px]"></div>
            </div>
            <div className="chart-card mt-4">
              <h3 className="chart-title">最佳发布时间（按平均播放量）</h3>
              <p className="text-xs text-neutral-400 -mt-2 mb-2">颜色越红表示该时段发布的视频平均播放量越高，点击查看详情</p>
              <div ref={heatmapChartRef} className="h-[280px]"></div>
            </div>
          </section>

          {/* Content Performance */}
          <section>
            <h2 className="section-title">
              <Target size={16} />
              内容表现
            </h2>
            <div className="chart-card">
              <h3 className="chart-title">播放量 vs 弹幕数</h3>
              <p className="text-xs text-neutral-400 -mt-2 mb-3">点击散点查看视频详情</p>
              <div ref={scatterChartRef} className="h-[280px]"></div>
            </div>
          </section>

          {/* TOP Rankings */}
          <section>
            <h2 className="section-title">
              <Award size={16} />
              TOP 榜单
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="chart-card">
                <h3 className="chart-title">TOP15 播放量视频</h3>
                <div ref={topVideosChartRef} className="h-[360px]"></div>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">TOP15 高互动视频</h3>
                <div ref={topEngagementChartRef} className="h-[360px]"></div>
              </div>
            </div>
          </section>

          {/* Video Timeline */}
          <section>
            <h2 className="section-title">
              <Calendar size={16} />
              视频时间线
            </h2>
            <div className="chart-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="chart-title !mb-0">全部视频播放量时间线</h3>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-neutral-500">显示累计曲线</span>
                  <button
                    onClick={() => setShowCumulativeLine(!showCumulativeLine)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                      showCumulativeLine ? 'bg-emerald-500' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        showCumulativeLine ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                <button
                  onClick={() => setShowGlobalViral(!showGlobalViral)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                    showGlobalViral ? 'bg-red-50 text-red-600' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-sm ${showGlobalViral ? 'bg-red-500' : 'bg-neutral-300'}`}></span>
                  全局爆款
                </button>
                <button
                  onClick={() => setShowLocalBreakout(!showLocalBreakout)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                    showLocalBreakout ? 'bg-amber-50 text-amber-600' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-sm ${showLocalBreakout ? 'bg-amber-500' : 'bg-neutral-300'}`}></span>
                  局部突破
                </button>
                <span className="text-neutral-300 mx-1">|</span>
                <span>点击纵坐标可筛选高于该播放量的视频</span>
              </div>
              <div ref={timelineChartRef} className="h-[320px]"></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DataAnalysis;
