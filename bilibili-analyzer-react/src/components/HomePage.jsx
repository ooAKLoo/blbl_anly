import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { Plus, X, Users, Trophy, Play, Calendar, Info } from 'lucide-react';
import { formatNumber, getImageUrl, parseDuration, detectAllVirals, getEngagementRate } from '../utils';
import { open } from '@tauri-apps/plugin-shell';
import * as HoverCard from '@radix-ui/react-hover-card';

// 颜色配置
const upColors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
];

// 时间范围选项
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'thisYear', label: '今年' }
];

// 停用词列表
const stopWords = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '他', '她', '它',
  '什么', '怎么', '为什么', '如何', '哪个', '哪些', '这个', '那个', '这些', '那些',
  '可以', '能', '会', '应该', '必须', '需要', '想', '要', '让', '把', '被', '给', '从', '向', '对', '与', '和', '或', '但', '而', '所以', '因为', '如果', '虽然',
  '吗', '呢', '吧', '啊', '哦', '嗯', '呀', '啦', '嘛', '哈', '哎',
  '第一', '第二', '第三', '一下', '一点', '一些', '一样', '一直', '一起',
  '还是', '已经', '正在', '开始', '结束', '之后', '之前', '以后', '以前', '然后', '最后', '终于',
  '真的', '其实', '可能', '应该', '大概', '肯定', '确实', '当然', '居然', '竟然', '简直',
  '非常', '特别', '十分', '更', '最', '太', '越', '比较', '相当', '极', '挺',
  '视频', '合集', '完整', '全集', '实录', '记录', '分享', '推荐', '必看', '建议', '注意',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'and', 'or', 'but', 'if', 'because', 'as', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in', 'on', 'up', 'down', 'out', 'off', 'over', 'under',
  'vol', 'ep', 'part', 'no'
]);

function HomePage({ savedUpList = [], upDataMap = {}, onLoadUpData, onViewUpDetail }) {
  // 状态
  const [selectedUps, setSelectedUps] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [topN, setTopN] = useState(20);
  const [chartMetric, setChartMetric] = useState('play'); // 'play' | 'engagement'
  const [showAllPoints, setShowAllPoints] = useState(false); // 是否显示全部散点
  const [showGlobalVirals, setShowGlobalVirals] = useState(true); // 是否显示全局爆款
  const [showLocalBreakouts, setShowLocalBreakouts] = useState(true); // 是否显示局部突破

  // 自定义日期范围
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [customStartDate, setCustomStartDate] = useState(formatDate(oneYearAgo));
  const [customEndDate, setCustomEndDate] = useState(formatDate(today));

  // Refs
  const dropdownRef = useRef(null);
  const scatterChartRef = useRef(null);
  const scatterChartInstance = useRef(null);
  const wordCloudRefs = useRef({});
  const wordCloudCharts = useRef({});

  // 获取UP主颜色
  const getUpColor = (mid) => {
    const index = selectedUps.findIndex(u => u.mid === mid);
    return upColors[index % upColors.length];
  };

  // 检查UP主是否已选中
  const isUpSelected = (mid) => {
    return selectedUps.some(u => u.mid === mid);
  };

  // 切换UP主选中状态
  const toggleUp = async (up) => {
    if (isUpSelected(up.mid)) {
      setSelectedUps(selectedUps.filter(u => u.mid !== up.mid));
    } else {
      if (selectedUps.length >= 5) {
        alert('最多选择5个UP主进行对比');
        return;
      }
      setSelectedUps([...selectedUps, up]);
      if (!upDataMap[up.mid]) {
        onLoadUpData?.(up.mid);
      }
    }
  };

  // 移除UP主
  const removeUp = (mid) => {
    setSelectedUps(selectedUps.filter(u => u.mid !== mid));
  };

  // 统一的时间筛选函数
  const filterVideosByTimeRange = (videos) => {
    if (selectedTimeRange === 'all') {
      return videos;
    }

    const now = new Date();
    let startDate;
    let endDate;

    switch (selectedTimeRange) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return videos.filter(v => {
      const publishDate = new Date(v.publish_time);
      if (startDate && publishDate < startDate) return false;
      if (endDate && publishDate > endDate) return false;
      return true;
    });
  };

  // 获取筛选后的视频
  const getFilteredVideos = (mid) => {
    const videos = upDataMap[mid]?.videos || [];
    return filterVideosByTimeRange(videos);
  };

  // TOP N 输入处理
  const onTopNInput = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const num = parseInt(value) || 1;
    setTopN(Math.min(Math.max(num, 1), 100));
  };

  // 日期输入处理
  const onDateInput = (e, type) => {
    let value = e.target.value;
    value = value.replace(/[^\d-]/g, '');
    const digits = value.replace(/-/g, '');

    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 4 || i === 6) {
        formatted += '-';
      }
      formatted += digits[i];
    }

    if (type === 'start') {
      setCustomStartDate(formatted);
    } else {
      setCustomEndDate(formatted);
    }
  };

  // 打开视频
  const openVideo = async (video) => {
    if (video.video_url) {
      await open(video.video_url);
    }
  };

  // 全局排名映射
  const globalRankMap = (() => {
    let allVideos = [];
    for (const up of selectedUps) {
      const upData = upDataMap[up.mid];
      if (upData && upData.videos) {
        allVideos = allVideos.concat(upData.videos);
      }
    }
    allVideos = filterVideosByTimeRange(allVideos);
    const sorted = allVideos.sort((a, b) => b.play_count - a.play_count);
    const rankMap = {};
    sorted.forEach((video, index) => {
      rankMap[video.bvid] = index + 1;
    });
    return rankMap;
  })();

  // 获取视频的全局排名
  const getGlobalRank = (bvid) => {
    return globalRankMap[bvid] || 999;
  };

  // 分列模式下已选UP主的TOP N视频
  const selectedUpTopVideosMap = selectedUps.map(up => {
    const upData = upDataMap[up.mid];
    if (upData && upData.videos) {
      let videos = filterVideosByTimeRange([...upData.videos]);
      videos = videos
        .sort((a, b) => b.play_count - a.play_count)
        .slice(0, topN);

      return {
        mid: up.mid,
        name: upData.up_info?.name || up.name,
        face: upData.up_info?.face || up.face,
        videos
      };
    }
    return null;
  }).filter(Boolean);

  // 格式化秒数为时长字符串
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}分钟`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hours}小时${remainMins}分` : `${hours}小时`;
  };

  // 获取UP主统计数据
  const getUpStats = (mid) => {
    const videos = getFilteredVideos(mid);

    if (videos.length === 0) {
      return {
        videoCount: 0,
        avgPlay: 0,
        maxPlay: 0,
        medianPlay: 0,
        totalPlay: 0,
        avgDuration: '-',
        avgTitleLength: 0,
        publishFrequency: '-',
        bestPublishTime: '-',
        hitRate: 0,
        relativeFlow: 0
      };
    }

    const plays = videos.map(v => v.play_count).sort((a, b) => a - b);
    const totalPlay = plays.reduce((sum, p) => sum + p, 0);
    const avgPlay = Math.round(totalPlay / plays.length);
    const maxPlay = plays[plays.length - 1];
    const medianPlay = plays[Math.floor(plays.length / 2)];

    // 平均时长
    const durations = videos.map(v => parseDuration(v.duration)).filter(d => d > 0);
    const avgDurationSec = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const avgDuration = avgDurationSec > 0 ? formatDuration(avgDurationSec) : '-';

    // 标题平均长度
    const titleLengths = videos.map(v => v.title?.length || 0);
    const avgTitleLength = Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length);

    // 发布频率
    let publishFrequency = '-';
    if (videos.length >= 2) {
      const dates = videos.map(v => new Date(v.publish_time).getTime()).sort((a, b) => a - b);
      const spanDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
      if (spanDays > 0) {
        const videosPerWeek = (videos.length / spanDays) * 7;
        if (videosPerWeek >= 1) {
          publishFrequency = `周更${videosPerWeek.toFixed(1)}条`;
        } else {
          const videosPerMonth = (videos.length / spanDays) * 30;
          publishFrequency = `月更${videosPerMonth.toFixed(1)}条`;
        }
      }
    }

    // 黄金发布时间
    const topVideos = [...videos].sort((a, b) => b.play_count - a.play_count).slice(0, Math.max(3, Math.ceil(videos.length * 0.3)));
    const timeSlots = {};
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
      timeSlots[key] = (timeSlots[key] || 0) + 1;
    });
    const bestPublishTime = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // 爆款率
    const hitThreshold = avgPlay * 2;
    const hitCount = videos.filter(v => v.play_count >= hitThreshold).length;
    const hitRate = Math.round((hitCount / videos.length) * 100);

    // 相对流量
    const allAvgPlays = selectedUps
      .map(up => {
        const v = getFilteredVideos(up.mid);
        if (v.length === 0) return 0;
        const p = v.map(vid => vid.play_count);
        return p.reduce((sum, p) => sum + p, 0) / p.length;
      })
      .filter(v => v > 0);

    const minAvg = allAvgPlays.length > 0 ? Math.min(...allAvgPlays) : 1;
    const relativeFlow = avgPlay > 0 ? (avgPlay / minAvg).toFixed(1) : 0;

    return {
      videoCount: videos.length,
      avgPlay,
      maxPlay,
      medianPlay,
      totalPlay,
      avgDuration,
      avgTitleLength,
      publishFrequency,
      bestPublishTime,
      hitRate,
      relativeFlow
    };
  };

  // 获取黄金发布时间详情（用于 HoverCard）
  const getPublishTimeDetail = (mid) => {
    const videos = getFilteredVideos(mid);
    if (videos.length === 0) {
      return { slots: {}, topVideos: [] };
    }

    // 取播放量前30%的视频
    const topVideos = [...videos]
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, Math.max(3, Math.ceil(videos.length * 0.3)));

    // 统计时段分布
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

    // 按数量排序
    const sortedSlots = Object.fromEntries(
      Object.entries(slots).sort((a, b) => b[1] - a[1])
    );

    return {
      slots: sortedSlots,
      topVideos
    };
  };

  // 格式化发布时间（用于 HoverCard 显示）
  const formatPublishTime = (publishTime) => {
    const date = new Date(publishTime);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    const hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${weekday} ${hour}:${minute}`;
  };

  // 简单中文分词
  const segmentText = (text) => {
    if (!text) return [];

    const cleaned = text.toLowerCase()
      .replace(/[【】\[\]()（）《》<>「」『』""''！!？?。，,、；;：:～~·…—\-_|\/\\@#$%^&*+=]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = [];

    // 提取英文单词
    const englishWords = cleaned.match(/[a-zA-Z]{2,}/g) || [];
    words.push(...englishWords.filter(w => !stopWords.has(w.toLowerCase())));

    // 提取中文
    const chineseText = cleaned.replace(/[a-zA-Z0-9\s]/g, '');

    for (let len = 4; len >= 2; len--) {
      for (let i = 0; i <= chineseText.length - len; i++) {
        const word = chineseText.slice(i, i + len);
        if (!stopWords.has(word) && !/^\d+$/.test(word)) {
          words.push(word);
        }
      }
    }

    return words;
  };

  // 获取UP主爆款标题词频
  const getHitTitleWords = (mid) => {
    const videos = getFilteredVideos(mid);
    if (videos.length === 0) return [];

    const avgPlay = videos.reduce((sum, v) => sum + v.play_count, 0) / videos.length;
    const hitThreshold = avgPlay * 1.5;
    let hitVideos = videos
      .filter(v => v.play_count >= hitThreshold)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, Math.max(10, Math.ceil(videos.length * 0.3)));

    if (hitVideos.length === 0) {
      hitVideos = videos.sort((a, b) => b.play_count - a.play_count).slice(0, 10);
    }

    const wordCount = {};
    hitVideos.forEach(v => {
      const words = segmentText(v.title);
      const seen = new Set();
      words.forEach(word => {
        if (!seen.has(word)) {
          seen.add(word);
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCount)
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, value]) => ({ name, value }));
  };

  // 渲染词云
  const renderWordCloud = (mid) => {
    const el = wordCloudRefs.current[mid];
    if (!el) return;

    if (wordCloudCharts.current[mid]) {
      wordCloudCharts.current[mid].dispose();
    }

    const chart = echarts.init(el);
    wordCloudCharts.current[mid] = chart;

    const words = getHitTitleWords(mid);
    const color = getUpColor(mid);

    const option = {
      tooltip: {
        show: true,
        formatter: (params) => {
          return `<div class="text-sm"><span class="font-medium">${params.name}</span><br/>出现 ${params.value} 次</div>`;
        }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [12, 32],
        rotationRange: [-45, 45],
        rotationStep: 45,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 'bold',
          color: function() {
            const opacity = 0.6 + Math.random() * 0.4;
            return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
          }
        },
        emphasis: {
          textStyle: {
            color: color
          }
        },
        data: words
      }]
    };

    chart.setOption(option);
  };

  // 计算移动平均
  const calculateMovingAverage = (videos, windowSize = 5) => {
    if (videos.length < windowSize) return [];

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const result = [];
    for (let i = windowSize - 1; i < sorted.length; i++) {
      const window = sorted.slice(i - windowSize + 1, i + 1);
      const getValue = (v) => chartMetric === 'engagement'
        ? getEngagementRate(v) * 100
        : v.play_count;
      const avg = window.reduce((sum, v) => sum + getValue(v), 0) / windowSize;
      result.push({
        time: new Date(sorted[i].publish_time).getTime(),
        value: avg
      });
    }
    return result;
  };

  // 获取UP主的爆款视频 bvid 集合
  const getViralBvids = (mid) => {
    const videos = getFilteredVideos(mid);
    if (videos.length < 5) return { globalSet: new Set(), localSet: new Set() };

    const { globalVirals, localBreakouts } = detectAllVirals(videos, {
      globalThreshold: 1.5,
      minPlay: 5000,
      globalMaxCount: 10,
      localThreshold: 2,
      minRatio: 2,
      localMaxCount: 5
    });

    return {
      globalSet: new Set(globalVirals.map(v => v.bvid)),
      localSet: new Set(localBreakouts.map(v => v.bvid))
    };
  };

  // 渲染散点图
  const renderScatterChart = () => {
    if (!scatterChartRef.current) return;

    if (scatterChartInstance.current) {
      scatterChartInstance.current.dispose();
    }
    scatterChartInstance.current = echarts.init(scatterChartRef.current);

    const series = [];
    const markLines = [];

    selectedUps.forEach(up => {
      const videos = getFilteredVideos(up.mid);
      const color = getUpColor(up.mid);
      const { globalSet, localSet } = getViralBvids(up.mid);

      // 获取指标值的函数
      const getValue = (v) => chartMetric === 'engagement'
        ? getEngagementRate(v) * 100
        : v.play_count;

      // 计算平均值
      const avgValue = videos.length > 0
        ? videos.reduce((sum, v) => sum + getValue(v), 0) / videos.length
        : 0;

      // 普通视频散点（仅在显示全部时渲染）
      if (showAllPoints) {
        const normalVideos = videos.filter(v => !globalSet.has(v.bvid) && !localSet.has(v.bvid));
        series.push({
          name: up.name,
          type: 'scatter',
          symbolSize: (data) => {
            const val = data[1];
            if (chartMetric === 'engagement') {
              return Math.max(4, Math.min(10, val * 1.2));
            }
            return Math.max(4, Math.min(10, Math.log10(val + 1) * 2));
          },
          data: normalVideos.map(v => ({
            value: [new Date(v.publish_time).getTime(), getValue(v)],
            video: v,
            upName: up.name,
            isViral: false
          })),
          itemStyle: {
            color: color,
            opacity: 0.3
          },
          emphasis: {
            itemStyle: {
              opacity: 0.8,
              shadowBlur: 6,
              shadowColor: color
            },
            scale: 1.2
          },
          z: 1
        });
      }

      // 全局爆款视频 - 大圆点 + 菱形
      if (showGlobalVirals) {
        const globalViralVideos = videos.filter(v => globalSet.has(v.bvid));
        if (globalViralVideos.length > 0) {
          series.push({
            name: `${up.name} 爆款`,
            type: 'scatter',
            symbol: 'diamond',
            symbolSize: 18,
            data: globalViralVideos.map(v => ({
              value: [new Date(v.publish_time).getTime(), getValue(v)],
              video: v,
              upName: up.name,
              isViral: true,
              viralType: 'global'
            })),
            itemStyle: {
              color: color,
              opacity: 1,
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: color
            },
            emphasis: {
              scale: 1.3
            },
            z: 10
          });
        }
      }

      // 局部突破视频 - 三角形
      if (showLocalBreakouts) {
        const localViralVideos = videos.filter(v => localSet.has(v.bvid));
        if (localViralVideos.length > 0) {
          series.push({
            name: `${up.name} 突破`,
            type: 'scatter',
            symbol: 'triangle',
            symbolSize: 14,
            data: localViralVideos.map(v => ({
              value: [new Date(v.publish_time).getTime(), getValue(v)],
              video: v,
              upName: up.name,
              isViral: true,
              viralType: 'local'
            })),
            itemStyle: {
              color: color,
              opacity: 0.9,
              borderColor: '#fff',
              borderWidth: 1.5
            },
            emphasis: {
              scale: 1.3
            },
            z: 9
          });
        }
      }

      // 移动平均趋势线
      const maData = calculateMovingAverage(videos);
      if (maData.length > 1) {
        series.push({
          name: `${up.name} 趋势`,
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: maData.map(d => [d.time, d.value]),
          lineStyle: {
            color: color,
            width: 2,
            opacity: 0.6
          },
          z: 1
        });
      }

      // 平均线数据
      markLines.push({
        yAxis: avgValue,
        name: `${up.name} 平均`,
        lineStyle: {
          color: color,
          type: 'dashed',
          width: 1,
          opacity: 0.5
        },
        label: {
          show: true,
          position: 'end',
          formatter: () => chartMetric === 'engagement'
            ? `${avgValue.toFixed(1)}%`
            : formatNumber(avgValue),
          fontSize: 10,
          color: color
        }
      });
    });

    // 添加平均线到第一个散点系列
    if (series.length > 0 && markLines.length > 0) {
      series[0].markLine = {
        silent: true,
        symbol: 'none',
        data: markLines
      };
    }

    const yAxisName = chartMetric === 'engagement' ? '互动率 (%)' : '播放量';

    // 构建每个 UP 主的视频时间索引，用于快速查找最近视频
    const upVideoIndex = {};
    selectedUps.forEach(up => {
      const videos = getFilteredVideos(up.mid);
      upVideoIndex[up.mid] = videos
        .map(v => ({
          ...v,
          timestamp: new Date(v.publish_time).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    });

    // 查找某时间点附近的视频
    const findNearestVideo = (mid, timestamp, maxDays = 30) => {
      const videos = upVideoIndex[mid] || [];
      if (videos.length === 0) return null;

      const maxDiff = maxDays * 24 * 60 * 60 * 1000;
      let nearest = null;
      let minDiff = Infinity;

      for (const v of videos) {
        const diff = Math.abs(v.timestamp - timestamp);
        if (diff < minDiff && diff <= maxDiff) {
          minDiff = diff;
          nearest = v;
        }
      }
      return nearest;
    };

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#9CA3AF',
            width: 1,
            type: 'dashed'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#374151',
          fontSize: 12
        },
        formatter: (params) => {
          if (!params || params.length === 0) return '';

          // 获取鼠标所在的时间点
          const timestamp = params[0]?.axisValue;
          if (!timestamp) return '';

          const date = new Date(timestamp);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

          let html = `<div style="margin-bottom: 8px; font-weight: 600; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">${dateStr}</div>`;

          // 为每个 UP 主查找最近的视频
          selectedUps.forEach(up => {
            const color = getUpColor(up.mid);
            const nearestVideo = findNearestVideo(up.mid, timestamp);

            html += `<div style="margin-bottom: 8px;">`;
            html += `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">`;
            html += `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>`;
            html += `<span style="font-weight: 600; color: ${color};">${up.name}</span>`;
            html += `</div>`;

            if (nearestVideo) {
              const videoDate = nearestVideo.publish_time.slice(0, 10);
              const title = nearestVideo.title.length > 22 ? nearestVideo.title.slice(0, 22) + '...' : nearestVideo.title;
              const engRate = getEngagementRate(nearestVideo) * 100;
              const { globalSet, localSet } = getViralBvids(up.mid);
              const coverUrl = getImageUrl(nearestVideo.cover);

              let tag = '';
              if (globalSet.has(nearestVideo.bvid)) {
                tag = '<span style="background: #FEF3C7; color: #D97706; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">爆款</span>';
              } else if (localSet.has(nearestVideo.bvid)) {
                tag = '<span style="background: #DBEAFE; color: #2563EB; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">突破</span>';
              }

              html += `<div style="display: flex; gap: 8px; padding-left: 14px;">`;
              html += `<img src="${coverUrl}" style="width: 64px; height: 40px; border-radius: 4px; object-fit: cover; flex-shrink: 0;" />`;
              html += `<div style="flex: 1; min-width: 0; font-size: 11px;">`;
              html += `<div style="margin-bottom: 2px; color: #374151; line-height: 1.3;">${title}${tag}</div>`;
              html += `<div style="color: #6B7280;">${videoDate} · ${formatNumber(nearestVideo.play_count)}播放</div>`;
              html += `<div style="color: #9CA3AF;">互动率 ${engRate.toFixed(1)}%</div>`;
              html += `</div>`;
              html += `</div>`;
            } else {
              html += `<div style="font-size: 11px; color: #9CA3AF; padding-left: 14px;">该时段无视频</div>`;
            }

            html += `</div>`;
          });

          return html;
        }
      },
      legend: {
        show: false
      },
      grid: {
        top: 20,
        right: 80,
        bottom: 70,
        left: 60
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          height: 24,
          bottom: 10,
          borderColor: '#E5E7EB',
          fillerColor: 'rgba(59, 130, 246, 0.1)',
          handleStyle: {
            color: '#3B82F6',
            borderColor: '#3B82F6'
          },
          moveHandleStyle: {
            color: '#3B82F6'
          },
          selectedDataBackground: {
            lineStyle: { color: '#3B82F6', opacity: 0.3 },
            areaStyle: { color: '#3B82F6', opacity: 0.1 }
          },
          dataBackground: {
            lineStyle: { color: '#E5E7EB' },
            areaStyle: { color: '#F3F4F6' }
          },
          textStyle: {
            color: '#9CA3AF',
            fontSize: 10
          },
          brushSelect: false
        }
      ],
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 11
        },
        splitLine: {
          show: true,
          lineStyle: { color: '#F3F4F6', type: 'dashed' }
        }
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
        nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 11,
          formatter: (value) => {
            if (chartMetric === 'engagement') {
              return value.toFixed(1) + '%';
            }
            if (value >= 10000000) return (value / 10000000).toFixed(1) + '千万';
            if (value >= 10000) return (value / 10000).toFixed(0) + '万';
            return value;
          }
        },
        splitLine: {
          lineStyle: { color: '#F3F4F6', type: 'dashed' }
        }
      },
      series
    };

    scatterChartInstance.current.setOption(option);

    // 点击事件
    scatterChartInstance.current.off('click');
    scatterChartInstance.current.on('click', async (params) => {
      const video = params.data?.video;
      if (video && video.video_url) {
        await open(video.video_url);
      }
    });
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 监听变化重新渲染
  useEffect(() => {
    if (selectedUps.length > 0) {
      setTimeout(() => {
        renderScatterChart();
        selectedUps.forEach(up => renderWordCloud(up.mid));
      }, 100);
    }

    return () => {
      if (scatterChartInstance.current) {
        scatterChartInstance.current.dispose();
        scatterChartInstance.current = null;
      }
      Object.values(wordCloudCharts.current).forEach(chart => {
        if (chart) chart.dispose();
      });
      wordCloudCharts.current = {};
    };
  }, [selectedUps, selectedTimeRange, customStartDate, customEndDate, upDataMap, chartMetric, showAllPoints, showGlobalVirals, showLocalBreakouts]);

  // 窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (scatterChartInstance.current) {
        scatterChartInstance.current.resize();
      }
      Object.values(wordCloudCharts.current).forEach(chart => {
        if (chart) chart.resize();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">UP主对比分析</h1>
          <p className="text-sm text-neutral-500">选择多个UP主进行数据对比，分析视频表现差异</p>
        </header>

        {/* UP主选择区域 */}
        <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 mb-6">
          <div className="flex items-center gap-3">
            {/* 添加UP主下拉 */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              {savedUpList.length > 0 ? (
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-600 transition-colors"
                >
                  <Plus size={14} />
                  添加对比
                </button>
              ) : (
                <div className="text-sm text-neutral-400">
                  暂无已保存的UP主，请先在侧边栏添加
                </div>
              )}

              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
                  <div className="p-2 max-h-[300px] overflow-y-auto">
                    {savedUpList.map(up => (
                      <label
                        key={up.mid}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isUpSelected(up.mid)}
                          onChange={() => toggleUp(up)}
                          className="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <img src={getImageUrl(up.face)} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">{up.name}</div>
                          <div className="text-xs text-neutral-400">{up.video_count} 个视频</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 已选UP主标签 */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {selectedUps.map(up => (
                <div
                  key={up.mid}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: getUpColor(up.mid) + '15', color: getUpColor(up.mid) }}
                >
                  <img src={getImageUrl(up.face)} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  <span className="font-medium">{up.name}</span>
                  <button
                    onClick={() => removeUp(up.mid)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* 时间筛选 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-neutral-500">时间范围：</span>
              <div className="flex items-center p-1 bg-neutral-100 rounded-lg">
                {timeRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className="relative px-3 py-1.5 text-sm font-medium rounded-md z-[1]"
                  >
                    {selectedTimeRange === option.value && (
                      <motion.div
                        layoutId="home-time-range-indicator"
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-[1] transition-colors duration-200 ${
                      selectedTimeRange === option.value ? 'text-neutral-900' : 'text-neutral-500'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTimeRange('custom')}
                  className="relative px-3 py-1.5 text-sm font-medium rounded-md z-[1]"
                >
                  {selectedTimeRange === 'custom' && (
                    <motion.div
                      layoutId="home-time-range-indicator"
                      className="absolute inset-0 bg-white rounded-md shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className={`relative z-[1] transition-colors duration-200 ${
                    selectedTimeRange === 'custom' ? 'text-neutral-900' : 'text-neutral-500'
                  }`}>
                    自定义
                  </span>
                </button>
              </div>
              {selectedTimeRange === 'custom' && (
                <div className="flex items-center">
                  <div className="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm hover:border-neutral-300 transition-colors">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-r border-neutral-100">
                      <Calendar size={14} className="text-neutral-400" />
                      <input
                        type="text"
                        value={customStartDate}
                        onChange={(e) => onDateInput(e, 'start')}
                        placeholder="开始日期"
                        maxLength="10"
                        className="w-20 text-sm text-neutral-700 bg-transparent outline-none placeholder:text-neutral-300"
                      />
                    </div>
                    <span className="px-2 text-neutral-300 text-sm">→</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                      <input
                        type="text"
                        value={customEndDate}
                        onChange={(e) => onDateInput(e, 'end')}
                        placeholder="结束日期"
                        maxLength="10"
                        className="w-20 text-sm text-neutral-700 bg-transparent outline-none placeholder:text-neutral-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 空状态 */}
        {selectedUps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <Users size={28} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">选择UP主开始对比</h3>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              从上方添加 2-5 个UP主，即可对比他们的热门视频和播放量表现
            </p>
          </div>
        )}

        {/* 对比内容区域 */}
        {selectedUps.length > 0 && (
          <div className="space-y-6">
            {/* 热门视频榜 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-amber-500" />
                  <h2 className="text-lg font-semibold text-neutral-900">热门视频榜</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-lg">
                    <span className="text-xs font-medium text-neutral-500">TOP</span>
                    <input
                      type="text"
                      value={topN}
                      onChange={onTopNInput}
                      className="w-8 px-1 py-0.5 text-xs font-medium text-center bg-white rounded border-0 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 分列榜单 */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(selectedUpTopVideosMap.length, 4)}, 1fr)` }}>
                {selectedUpTopVideosMap.map(upData => (
                  <div
                    key={upData.mid}
                    className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
                  >
                    {/* UP主头部 */}
                    <div
                      className="flex items-center gap-3 p-4 border-b"
                      style={{ borderColor: getUpColor(upData.mid) + '30', backgroundColor: getUpColor(upData.mid) + '08' }}
                    >
                      <img src={getImageUrl(upData.face)} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-semibold truncate"
                          style={{ color: getUpColor(upData.mid) }}
                        >
                          {upData.name}
                        </h3>
                        <p className="text-xs text-neutral-400">{upData.videos.length} 个视频</p>
                      </div>
                    </div>

                    {/* 视频列表 */}
                    <div className="divide-y divide-neutral-50 max-h-[500px] overflow-y-auto">
                      {upData.videos.map((video, index) => (
                        <div
                          key={video.bvid}
                          className="flex items-start gap-2 p-3 hover:bg-neutral-50 transition-colors cursor-pointer group"
                          onClick={() => openVideo(video)}
                        >
                          {/* 排名区域 */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                                index === 0 ? 'bg-amber-400 text-white' :
                                index === 1 ? 'bg-neutral-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {index + 1}
                            </span>
                            {getGlobalRank(video.bvid) <= topN && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium"
                                title={`所有已选UP主总榜第 ${getGlobalRank(video.bvid)} 名`}
                              >
                                #{getGlobalRank(video.bvid)}
                              </span>
                            )}
                          </div>

                          {/* 封面 */}
                          <div className="relative w-[72px] h-[40px] rounded overflow-hidden flex-shrink-0">
                            <img
                              src={getImageUrl(video.cover)}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          </div>

                          {/* 信息 */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-neutral-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                              {video.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                              <span className="flex items-center gap-0.5">
                                <Play size={8} />
                                {formatNumber(video.play_count)}
                              </span>
                              <span>{video.publish_time.slice(5, 10)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 分隔线 */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-neutral-200"></div>
              <span className="text-sm text-neutral-400">数据对比分析</span>
              <div className="flex-1 h-px bg-neutral-200"></div>
            </div>

            {/* 时间轴散点图 */}
            <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">
                    {chartMetric === 'play' ? '播放量' : '互动率'}时间轴对比
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    曲线为5期移动平均趋势，虚线为平均值参考线
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* 指标切换 */}
                  <div className="flex items-center p-1 bg-neutral-100 rounded-lg">
                    {[
                      { value: 'play', label: '播放量' },
                      { value: 'engagement', label: '互动率' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setChartMetric(option.value)}
                        className="relative px-3 py-1 text-xs font-medium rounded-md z-[1]"
                      >
                        {chartMetric === option.value && (
                          <motion.div
                            layoutId="home-chart-metric-indicator"
                            className="absolute inset-0 bg-white rounded-md shadow-sm"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className={`relative z-[1] transition-colors duration-200 ${
                          chartMetric === option.value ? 'text-neutral-900' : 'text-neutral-500'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* UP主图例 */}
                  {selectedUps.map(up => (
                    <div key={up.mid} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getUpColor(up.mid) }}
                      ></span>
                      <span className="text-neutral-600">{up.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div ref={scatterChartRef} className="h-[440px]"></div>
              {/* 图例说明 - 可点击切换 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => setShowGlobalVirals(!showGlobalVirals)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                      showGlobalVirals
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">◆</span>
                    <span>全局爆款</span>
                  </button>
                  <button
                    onClick={() => setShowLocalBreakouts(!showLocalBreakouts)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                      showLocalBreakouts
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">▲</span>
                    <span>局部突破</span>
                  </button>
                  <button
                    onClick={() => setShowAllPoints(!showAllPoints)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                      showAllPoints
                        ? 'bg-neutral-200 text-neutral-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">●</span>
                    <span>全部视频</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-400">
                    <span className="w-5 h-0.5 bg-neutral-300 rounded"></span>
                    <span>趋势</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-400">
                    <span className="w-5 h-0 border-t border-dashed border-neutral-300"></span>
                    <span>均值</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400">点击标记可查看视频详情并跳转</p>
              </div>
            </div>

            {/* 同期统计表格 */}
            <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">同期数据对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left py-3 px-4 font-medium text-neutral-500">指标</th>
                      {selectedUps.map(up => (
                        <th
                          key={up.mid}
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: getUpColor(up.mid) }}
                        >
                          {up.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">视频数量</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {getUpStats(up.mid).videoCount}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">总播放量</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {formatNumber(getUpStats(up.mid).totalPlay)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">平均播放</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {formatNumber(getUpStats(up.mid).avgPlay)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">中位数播放</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {formatNumber(getUpStats(up.mid).medianPlay)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">最高播放</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {formatNumber(getUpStats(up.mid).maxPlay)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">平均时长</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {getUpStats(up.mid).avgDuration}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">标题平均长度</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {getUpStats(up.mid).avgTitleLength}字
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">发布频率</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {getUpStats(up.mid).publishFrequency}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">黄金发布时间</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          <HoverCard.Root openDelay={200} closeDelay={100}>
                            <HoverCard.Trigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 transition-colors">
                                {getUpStats(up.mid).bestPublishTime}
                                <Info size={12} className="text-neutral-400" />
                              </span>
                            </HoverCard.Trigger>
                            <HoverCard.Portal>
                              <HoverCard.Content
                                sideOffset={8}
                                side="top"
                                align="end"
                                className="z-50 w-80 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                              >
                                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: getUpColor(up.mid) }}
                                    ></div>
                                    <span className="text-sm font-medium text-neutral-700">{up.name} 黄金发布时间分析</span>
                                  </div>
                                  <p className="text-xs text-neutral-500 mt-1">基于播放量 TOP 30% 的视频统计</p>
                                </div>
                                <div className="p-3">
                                  {/* 时段分布 */}
                                  <div className="mb-3">
                                    <div className="text-xs text-neutral-500 mb-2">高播放时段分布</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(getPublishTimeDetail(up.mid).slots).map(([slot, count]) => (
                                        <span
                                          key={slot}
                                          className={`px-2 py-0.5 text-xs rounded-full ${
                                            slot === getUpStats(up.mid).bestPublishTime
                                              ? 'bg-blue-100 text-blue-700 font-medium'
                                              : 'bg-neutral-100 text-neutral-600'
                                          }`}
                                        >
                                          {slot} {count}条
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  {/* 代表视频 */}
                                  <div>
                                    <div className="text-xs text-neutral-500 mb-2">代表视频</div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {getPublishTimeDetail(up.mid).topVideos.slice(0, 3).map(video => (
                                        <div
                                          key={video.bvid}
                                          className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                          onClick={() => openVideo(video)}
                                        >
                                          <img
                                            src={getImageUrl(video.cover)}
                                            className="w-16 h-9 rounded object-cover flex-shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{video.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                              <span>{formatPublishTime(video.publish_time)}</span>
                                              <span>{formatNumber(video.play_count)}播放</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </HoverCard.Content>
                            </HoverCard.Portal>
                          </HoverCard.Root>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">爆款率</td>
                      {selectedUps.map(up => (
                        <td key={up.mid} className="text-right py-3 px-4 font-medium text-neutral-900">
                          {getUpStats(up.mid).hitRate}%
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-600">相对流量</td>
                      {selectedUps.map(up => (
                        <td
                          key={up.mid}
                          className="text-right py-3 px-4 font-semibold"
                          style={{ color: getUpColor(up.mid) }}
                        >
                          {getUpStats(up.mid).relativeFlow}x
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 爆款标题词云对比 */}
            <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">爆款标题词云对比</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">基于播放量 TOP 30% 的视频标题分词统计</p>
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(selectedUps.length, 3)}, 1fr)` }}>
                {selectedUps.map(up => (
                  <div key={up.mid} className="border border-neutral-100 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center gap-2 px-3 py-2 border-b"
                      style={{ borderColor: getUpColor(up.mid) + '30', backgroundColor: getUpColor(up.mid) + '08' }}
                    >
                      <img src={getImageUrl(up.face)} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      <span className="text-sm font-medium" style={{ color: getUpColor(up.mid) }}>{up.name}</span>
                    </div>
                    <div ref={el => wordCloudRefs.current[up.mid] = el} className="h-[200px]"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
