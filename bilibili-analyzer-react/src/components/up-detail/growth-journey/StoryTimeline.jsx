import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { formatNumber, getImageUrl } from '../../../utils';
import {
  Play, CalendarDays, Flag, Trophy,
  PartyPopper, Crown, PenTool, Milestone, MessageSquare, Flame
} from 'lucide-react';
import './StoryTimeline.css';

const StoryTimeline = forwardRef(({
  videos = [],
  upName = 'UP主',
  totalDays = 0,
  videoCount = 0,
  growthMultiple = 1
}, ref) => {
  const storyStreamRef = useRef(null);
  const timelineRef = useRef(null);
  const nodeRefs = useRef([]);

  const [visibleNodes, setVisibleNodes] = useState(new Set());
  const [timelineProgress, setTimelineProgress] = useState(0);

  const observersRef = useRef([]);

  // ============ 基础计算属性 ============
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
  }, [videos]);

  // ============ 故事节点构建 ============
  const formatDateCN = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const storyNodes = useMemo(() => {
    if (videos.length === 0) return [];

    const nodes = [];
    const vids = sortedVideos;
    const avgPlay = vids.reduce((s, v) => s + v.play_count, 0) / vids.length;
    const usedVideoBvids = new Set();

    // 1. 第一个视频 - 起点
    const firstVideo = vids[0];
    usedVideoBvids.add(firstVideo.bvid);
    nodes.push({
      id: 'start',
      date: new Date(firstVideo.publish_time),
      dateDisplay: formatDateCN(firstVideo.publish_time),
      type: 'start',
      title: '第一个视频',
      description: `这是 ${upName} 的起点。${formatNumber(firstVideo.play_count)} 次播放，一切从这里开始。`,
      icon: Flag,
      markerColor: 'marker-blue',
      iconColor: 'text-blue-500',
      cardClass: 'card-start',
      video: firstVideo,
      showCover: true
    });

    // 追踪变量
    let maxPlay = firstVideo.play_count;
    let cumulativePlays = firstVideo.play_count;
    const playMilestones = [100000, 500000, 1000000, 5000000, 10000000];
    const videoMilestones = [10, 50, 100, 200, 500];
    const achievedPlayMilestones = new Set();
    const yearsSeen = new Set([new Date(firstVideo.publish_time).getFullYear()]);

    vids.forEach((v, index) => {
      if (index === 0) return;

      const currDate = new Date(v.publish_time);
      const currYear = currDate.getFullYear();
      cumulativePlays += v.play_count;

      // 跨年节点
      if (!yearsSeen.has(currYear)) {
        yearsSeen.add(currYear);
        const prevYear = currYear - 1;
        const prevYearVideos = vids.filter(v => new Date(v.publish_time).getFullYear() === prevYear);
        const prevYearPlays = prevYearVideos.reduce((s, v) => s + v.play_count, 0);
        nodes.push({
          id: `year-${currYear}`,
          date: currDate,
          dateDisplay: `${currYear}年`,
          type: 'year',
          title: `${currYear}`,
          description: prevYearVideos.length > 0
            ? `${prevYear} 年发布了 ${prevYearVideos.length} 个视频，获得 ${formatNumber(prevYearPlays)} 次播放。新的一年继续。`
            : `创作进入第 ${currYear - new Date(firstVideo.publish_time).getFullYear() + 1} 年。`,
          icon: CalendarDays,
          markerColor: 'marker-slate',
          iconColor: 'text-slate-600',
          cardClass: 'card-year',
          video: null,
          showCover: false
        });
      }

      if (usedVideoBvids.has(v.bvid)) {
        playMilestones.forEach(milestone => {
          if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
            achievedPlayMilestones.add(milestone);
          }
        });
        maxPlay = Math.max(maxPlay, v.play_count);
        return;
      }

      const candidateEvents = [];

      // 播放量突破
      if (v.play_count > maxPlay * 2.5 && v.play_count > avgPlay * 1.5) {
        const growthTimes = (v.play_count / maxPlay).toFixed(1);
        const videosBefore = index;
        candidateEvents.push({
          priority: 1,
          node: {
            id: `breakthrough-${v.bvid}`,
            date: currDate,
            dateDisplay: formatDateCN(v.publish_time),
            type: 'breakthrough',
            title: '被看见的那天',
            description: `播放量达到 ${formatNumber(v.play_count)}，是之前最高记录的 ${growthTimes} 倍。在这之前，是 ${videosBefore} 个视频的积累。`,
            icon: PartyPopper,
            markerColor: 'marker-rose',
            iconColor: 'text-rose-500',
            cardClass: 'card-breakthrough',
            video: v,
            showCover: true
          }
        });
      }

      // 累计播放里程碑
      const newMilestones = [];
      playMilestones.forEach(milestone => {
        if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
          newMilestones.push(milestone);
        }
      });

      if (newMilestones.length > 0) {
        const biggestMilestone = Math.max(...newMilestones);
        const milestoneText = biggestMilestone >= 10000000 ? '千万' :
                             biggestMilestone >= 1000000 ? '百万' :
                             biggestMilestone >= 100000 ? '十万' : formatNumber(biggestMilestone);
        candidateEvents.push({
          priority: 2,
          milestone: biggestMilestone,
          allMilestones: newMilestones,
          node: {
            id: `cumulative-${biggestMilestone}`,
            date: currDate,
            dateDisplay: formatDateCN(v.publish_time),
            type: 'cumulative',
            title: `累计${milestoneText}播放`,
            description: `第 ${index + 1} 个视频发布时，总播放量突破 ${formatNumber(biggestMilestone)}。`,
            icon: Trophy,
            markerColor: 'marker-amber',
            iconColor: 'text-amber-500',
            cardClass: 'card-milestone',
            video: v,
            showCover: biggestMilestone >= 500000,
            stats: [`累计 ${formatNumber(cumulativePlays)} 播放`]
          }
        });
      }

      // 视频数量里程碑
      const videoCount = index + 1;
      if (videoMilestones.includes(videoCount)) {
        const daysToReach = Math.ceil((currDate - new Date(firstVideo.publish_time)) / (1000 * 60 * 60 * 24));
        const milestoneMessages = {
          10: `第 10 个作品。用了 ${daysToReach} 天，${upName} 完成了从 0 到 10 的积累。`,
          50: `第 50 个作品。创作已经成为习惯。`,
          100: `第 100 个作品。${daysToReach} 天，100 个视频，这份坚持本身就是答案。`,
          200: `第 200 个作品。持续创作 ${Math.floor(daysToReach / 365)} 年多，${upName} 依然在更新。`,
          500: `第 500 个作品。这是一个传奇数字。`
        };
        candidateEvents.push({
          priority: videoCount >= 100 ? 1.5 : 3,
          node: {
            id: `count-${videoCount}`,
            date: currDate,
            dateDisplay: formatDateCN(v.publish_time),
            type: 'count',
            title: `第 ${videoCount} 个作品`,
            description: milestoneMessages[videoCount],
            icon: videoCount >= 100 ? Crown : Milestone,
            markerColor: videoCount >= 100 ? 'marker-purple' : 'marker-cyan',
            iconColor: videoCount >= 100 ? 'text-purple-500' : 'text-cyan-500',
            cardClass: videoCount >= 100 ? 'card-major-count' : 'card-count',
            video: v,
            showCover: videoCount >= 100
          }
        });
      }

      if (candidateEvents.length > 0) {
        candidateEvents.sort((a, b) => a.priority - b.priority);
        const chosen = candidateEvents[0];
        nodes.push(chosen.node);
        usedVideoBvids.add(v.bvid);
        if (chosen.allMilestones) {
          chosen.allMilestones.forEach(m => achievedPlayMilestones.add(m));
        }
      }

      newMilestones.forEach(m => achievedPlayMilestones.add(m));
      maxPlay = Math.max(maxPlay, v.play_count);
    });

    // 检测最长断更期
    if (vids.length >= 5) {
      let maxGap = 0;
      let maxGapIndex = -1;
      for (let i = 1; i < vids.length; i++) {
        const gap = new Date(vids[i].publish_time) - new Date(vids[i-1].publish_time);
        const gapDays = gap / (1000 * 60 * 60 * 24);
        if (gapDays > maxGap && gapDays >= 60) {
          maxGap = gapDays;
          maxGapIndex = i;
        }
      }
      if (maxGapIndex > 0 && !usedVideoBvids.has(vids[maxGapIndex].bvid)) {
        const silentDays = Math.floor(maxGap);
        const returnVideo = vids[maxGapIndex];
        nodes.push({
          id: 'silence',
          date: new Date(returnVideo.publish_time),
          dateDisplay: formatDateCN(returnVideo.publish_time),
          type: 'silence',
          title: `沉默的 ${silentDays} 天`,
          description: `这段时间没有更新。我们不知道发生了什么，但 ${upName} 回来了。`,
          icon: Flame,
          markerColor: 'marker-slate',
          iconColor: 'text-slate-500',
          cardClass: 'card-silence',
          video: returnVideo,
          showCover: false
        });
        usedVideoBvids.add(returnVideo.bvid);
      }
    }

    // 最新作品
    const lastVideo = vids[vids.length - 1];
    if (vids.length > 1 && !usedVideoBvids.has(lastVideo.bvid)) {
      nodes.push({
        id: 'now',
        date: new Date(lastVideo.publish_time),
        dateDisplay: '最近',
        type: 'current',
        title: '最新作品',
        description: `第 ${vids.length} 个作品。故事还在继续。`,
        icon: PenTool,
        markerColor: 'marker-emerald',
        iconColor: 'text-emerald-500',
        cardClass: 'card-current',
        video: lastVideo,
        showCover: true
      });
    }

    // 排序并限制数量
    const sorted = nodes.sort((a, b) => a.date - b.date);
    if (sorted.length > 15) {
      const priorityOrder = { start: 0, breakthrough: 1, current: 2, silence: 3, cumulative: 4, count: 5, year: 6 };
      const scored = sorted.map(n => ({ ...n, score: priorityOrder[n.type] ?? 10 }));
      scored.sort((a, b) => a.score - b.score);
      const kept = scored.slice(0, 15);
      return kept.sort((a, b) => a.date - b.date);
    }
    return sorted;
  }, [videos, sortedVideos, upName]);

  // ============ Intersection Observer ============
  const setupObservers = () => {
    observersRef.current.forEach(obs => obs.disconnect());
    observersRef.current = [];

    // 节点观察器
    const nodeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = nodeRefs.current.indexOf(entry.target);
          if (index !== -1) {
            if (entry.isIntersecting) {
              setVisibleNodes(prev => new Set([...prev, index]));
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    nodeRefs.current.forEach(el => {
      if (el) nodeObserver.observe(el);
    });
    observersRef.current.push(nodeObserver);
  };

  // 滚动进度追踪
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setTimelineProgress(Math.min(scrollPercent * 1.2, 100));
  };

  // 更新时间线位置
  const updateTimelinePosition = () => {
    if (!timelineRef.current || nodeRefs.current.length === 0) return;

    const container = timelineRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const firstNode = nodeRefs.current[0];
    const lastNode = nodeRefs.current[nodeRefs.current.length - 1];

    if (!firstNode || !lastNode) return;

    const firstRect = firstNode.getBoundingClientRect();
    const lastRect = lastNode.getBoundingClientRect();

    const firstCenter = firstRect.top + firstRect.height / 2 - containerRect.top;
    const lastCenter = lastRect.top + lastRect.height / 2 - containerRect.top;

    container.style.setProperty('--timeline-top', `${firstCenter}px`);
    container.style.setProperty('--timeline-bottom', `${containerRect.height - lastCenter}px`);
  };

  const openVideo = (video) => {
    if (video?.video_url) {
      window.open(video.video_url, '_blank');
    }
  };

  // ============ 重置方法 ============
  const reset = () => {
    setVisibleNodes(new Set());
    nodeRefs.current = [];
  };

  const init = () => {
    setTimeout(() => {
      setupObservers();
      updateTimelinePosition();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', updateTimelinePosition);
      handleScroll();
    }, 0);
  };

  useEffect(() => {
    return () => {
      observersRef.current.forEach(obs => obs.disconnect());
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateTimelinePosition);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
    init,
    setupObservers,
    updateTimelinePosition
  }));

  return (
    <div className="story-stream" ref={storyStreamRef}>
      {/* 时间轴区域 */}
      <div className="story-nodes">
        {/* 时间轴中线 */}
        <div className="timeline-center-line" ref={timelineRef}>
          <div className="timeline-progress" style={{ height: `${timelineProgress}%` }}></div>
        </div>
        {/* 故事节点 */}
        {storyNodes.map((node, index) => {
          const IconComponent = node.icon;
          return (
            <div
              key={node.id}
              ref={el => nodeRefs.current[index] = el}
              className={`story-node ${index % 2 !== 0 ? 'is-right' : ''} ${visibleNodes.has(index) ? 'is-visible' : ''}`}
            >
              {/* 时间轴节点标记 - 统一圆点 */}
              <div className={`node-marker ${node.markerColor}`}>
                <div className="node-marker-dot"></div>
              </div>

              {/* 日期显示 */}
              <div className="node-date">{node.dateDisplay}</div>

              {/* 内容卡片 */}
              <div
                className={`node-card ${node.cardClass} ${node.video ? 'cursor-pointer' : ''}`}
                onClick={node.video ? () => openVideo(node.video) : null}
              >
                {/* 视频封面 */}
                {node.video && node.showCover && (
                  <div className="node-cover">
                    <img
                      src={getImageUrl(node.video.cover)}
                      alt={node.video.title}
                      className="node-cover-img"
                      referrerPolicy="no-referrer"
                    />
                    <div className="node-cover-overlay">
                      <Play size={32} className="text-white" fill="currentColor" />
                    </div>
                    <div className="node-cover-stats">
                      <span><Play size={12} /> {formatNumber(node.video.play_count)}</span>
                      <span><MessageSquare size={12} /> {formatNumber(node.video.danmu_count)}</span>
                    </div>
                  </div>
                )}

                {/* 装饰性背景图标 */}
                {!node.showCover && (
                  <IconComponent
                    className="node-card-bg-icon"
                    size={80}
                  />
                )}

                <div className="node-card-content">
                  <div className="node-card-header">
                    <IconComponent size={18} className={node.iconColor} />
                    <h3 className="node-card-title">{node.title}</h3>
                  </div>

                  <p className="node-card-desc">{node.description}</p>

                  {/* 关联视频（无封面时显示） */}
                  {node.video && !node.showCover && (
                    <div className="node-video-link">
                      <div className="node-video-play">
                        <Play size={12} fill="currentColor" />
                      </div>
                      <div className="node-video-info">
                        <div className="node-video-title">{node.video.title}</div>
                        <div className="node-video-meta">播放: {formatNumber(node.video.play_count)}</div>
                      </div>
                    </div>
                  )}

                  {/* 视频标题（有封面时显示） */}
                  {node.video && node.showCover && (
                    <div className="node-video-title-only">
                      {node.video.title}
                    </div>
                  )}

                  {/* 额外统计 */}
                  {node.stats && (
                    <div className="node-stats">
                      {node.stats.map((stat, i) => (
                        <span key={i} className="node-stat-item">
                          {stat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StoryTimeline.displayName = 'StoryTimeline';

export default StoryTimeline;
