import { useMemo, useEffect, useRef, useState } from 'react';
import { formatNumber, getImageUrl, formatDateCN } from '../../../utils';
import {
  Play, CalendarDays, Flag, Trophy,
  PartyPopper, Crown, PenTool, Milestone, MessageSquare, Flame
} from 'lucide-react';

const PLAY_MILESTONES = [100000, 500000, 1000000, 5000000, 10000000];
const VIDEO_COUNT_MILESTONES = [10, 50, 100, 200, 500];
const NODE_PRIORITY = { start: 0, breakthrough: 1, current: 2, silence: 3, cumulative: 4, count: 5, year: 6 };
const MAX_NODES = 15;
const MIN_SILENCE_DAYS = 60;

const MARKER_COLORS = {
  'marker-blue': 'text-blue-500',
  'marker-amber': 'text-amber-500',
  'marker-rose': 'text-rose-500',
  'marker-emerald': 'text-emerald-500',
  'marker-purple': 'text-purple-500',
  'marker-cyan': 'text-cyan-500',
  'marker-slate': 'text-slate-500',
};

// ============ 节点构建辅助函数 ============

const createStartNode = (video, upName) => ({
  id: 'start',
  date: new Date(video.publish_time),
  dateDisplay: formatDateCN(video.publish_time),
  type: 'start',
  title: '第一个视频',
  description: `这是 ${upName} 的起点。${formatNumber(video.play_count)} 次播放，一切从这里开始。`,
  icon: Flag,
  markerColor: 'marker-blue',
  iconColor: 'text-blue-500',
  video,
  showCover: true
});

const createYearNode = (currYear, currDate, firstVideoDate, prevYearVideos) => {
  const prevYear = currYear - 1;
  const prevYearPlays = prevYearVideos.reduce((s, v) => s + v.play_count, 0);
  const yearsDiff = currYear - firstVideoDate.getFullYear() + 1;

  return {
    id: `year-${currYear}`,
    date: currDate,
    dateDisplay: `${currYear}年`,
    type: 'year',
    title: `${currYear}`,
    description: prevYearVideos.length > 0
      ? `${prevYear} 年发布了 ${prevYearVideos.length} 个视频，获得 ${formatNumber(prevYearPlays)} 次播放。新的一年继续。`
      : `创作进入第 ${yearsDiff} 年。`,
    icon: CalendarDays,
    markerColor: 'marker-slate',
    iconColor: 'text-slate-600',
    video: null,
    showCover: false
  };
};

const createBreakthroughNode = (video, currDate, maxPlay, videosBefore) => {
  const growthTimes = (video.play_count / maxPlay).toFixed(1);

  return {
    id: `breakthrough-${video.bvid}`,
    date: currDate,
    dateDisplay: formatDateCN(video.publish_time),
    type: 'breakthrough',
    title: '被看见的那天',
    description: `播放量达到 ${formatNumber(video.play_count)}，是之前最高记录的 ${growthTimes} 倍。在这之前，是 ${videosBefore} 个视频的积累。`,
    icon: PartyPopper,
    markerColor: 'marker-rose',
    iconColor: 'text-rose-500',
    video,
    showCover: true
  };
};

const createCumulativeNode = (video, currDate, milestone, index, cumulativePlays) => {
  const milestoneText = milestone >= 10000000 ? '千万' :
                       milestone >= 1000000 ? '百万' :
                       milestone >= 100000 ? '十万' : formatNumber(milestone);

  return {
    id: `cumulative-${milestone}`,
    date: currDate,
    dateDisplay: formatDateCN(video.publish_time),
    type: 'cumulative',
    title: `累计${milestoneText}播放`,
    description: `第 ${index + 1} 个视频发布时，总播放量突破 ${formatNumber(milestone)}。`,
    icon: Trophy,
    markerColor: 'marker-amber',
    iconColor: 'text-amber-500',
    video,
    showCover: milestone >= 500000,
    stats: [`累计 ${formatNumber(cumulativePlays)} 播放`]
  };
};

const createCountNode = (video, currDate, count, daysToReach, upName) => {
  const milestoneMessages = {
    10: `第 10 个作品。用了 ${daysToReach} 天，${upName} 完成了从 0 到 10 的积累。`,
    50: `第 50 个作品。创作已经成为习惯。`,
    100: `第 100 个作品。${daysToReach} 天，100 个视频，这份坚持本身就是答案。`,
    200: `第 200 个作品。持续创作 ${Math.floor(daysToReach / 365)} 年多，${upName} 依然在更新。`,
    500: `第 500 个作品。这是一个传奇数字。`
  };
  const isMajor = count >= 100;

  return {
    id: `count-${count}`,
    date: currDate,
    dateDisplay: formatDateCN(video.publish_time),
    type: 'count',
    title: `第 ${count} 个作品`,
    description: milestoneMessages[count],
    icon: isMajor ? Crown : Milestone,
    markerColor: isMajor ? 'marker-purple' : 'marker-cyan',
    iconColor: isMajor ? 'text-purple-500' : 'text-cyan-500',
    video,
    showCover: isMajor
  };
};

const createSilenceNode = (video, silentDays, upName) => ({
  id: 'silence',
  date: new Date(video.publish_time),
  dateDisplay: formatDateCN(video.publish_time),
  type: 'silence',
  title: `沉默的 ${silentDays} 天`,
  description: `这段时间没有更新。我们不知道发生了什么，但 ${upName} 回来了。`,
  icon: Flame,
  markerColor: 'marker-slate',
  iconColor: 'text-slate-500',
  video,
  showCover: false
});

const createCurrentNode = (video, totalCount) => ({
  id: 'now',
  date: new Date(video.publish_time),
  dateDisplay: '最近',
  type: 'current',
  title: '最新作品',
  description: `第 ${totalCount} 个作品。故事还在继续。`,
  icon: PenTool,
  markerColor: 'marker-emerald',
  iconColor: 'text-emerald-500',
  video,
  showCover: true
});

// ============ 主组件 ============

const StoryTimeline = ({ videos = [], upName = 'UP主' }) => {
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const [visibleNodes, setVisibleNodes] = useState(new Set());

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
  }, [videos]);

  // ============ 故事节点构建 ============

  const storyNodes = useMemo(() => {
    if (videos.length === 0) return [];

    const nodes = [];
    const vids = sortedVideos;
    const avgPlay = vids.reduce((s, v) => s + v.play_count, 0) / vids.length;
    const usedVideoBvids = new Set();
    const firstVideo = vids[0];
    const firstVideoDate = new Date(firstVideo.publish_time);

    usedVideoBvids.add(firstVideo.bvid);
    nodes.push(createStartNode(firstVideo, upName));

    let maxPlay = firstVideo.play_count;
    let cumulativePlays = firstVideo.play_count;
    const achievedPlayMilestones = new Set();
    const yearsSeen = new Set([firstVideoDate.getFullYear()]);

    vids.forEach((v, index) => {
      if (index === 0) return;

      const currDate = new Date(v.publish_time);
      const currYear = currDate.getFullYear();
      cumulativePlays += v.play_count;

      if (!yearsSeen.has(currYear)) {
        yearsSeen.add(currYear);
        const prevYear = currYear - 1;
        const prevYearVideos = vids.filter(vid =>
          new Date(vid.publish_time).getFullYear() === prevYear
        );
        nodes.push(createYearNode(currYear, currDate, firstVideoDate, prevYearVideos));
      }

      if (usedVideoBvids.has(v.bvid)) {
        PLAY_MILESTONES.forEach(milestone => {
          if (cumulativePlays >= milestone && !achievedPlayMilestones.has(milestone)) {
            achievedPlayMilestones.add(milestone);
          }
        });
        maxPlay = Math.max(maxPlay, v.play_count);
        return;
      }

      const candidateEvents = [];

      if (v.play_count > maxPlay * 2.5 && v.play_count > avgPlay * 1.5) {
        candidateEvents.push({
          priority: 1,
          node: createBreakthroughNode(v, currDate, maxPlay, index)
        });
      }

      const newMilestones = PLAY_MILESTONES.filter(
        m => cumulativePlays >= m && !achievedPlayMilestones.has(m)
      );

      if (newMilestones.length > 0) {
        const biggestMilestone = Math.max(...newMilestones);
        candidateEvents.push({
          priority: 2,
          milestone: biggestMilestone,
          allMilestones: newMilestones,
          node: createCumulativeNode(v, currDate, biggestMilestone, index, cumulativePlays)
        });
      }

      const videoCount = index + 1;
      if (VIDEO_COUNT_MILESTONES.includes(videoCount)) {
        const daysToReach = Math.ceil((currDate - firstVideoDate) / (1000 * 60 * 60 * 24));
        candidateEvents.push({
          priority: videoCount >= 100 ? 1.5 : 3,
          node: createCountNode(v, currDate, videoCount, daysToReach, upName)
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

    if (vids.length >= 5) {
      let maxGap = 0;
      let maxGapIndex = -1;

      for (let i = 1; i < vids.length; i++) {
        const gapDays = (new Date(vids[i].publish_time) - new Date(vids[i-1].publish_time)) / (1000 * 60 * 60 * 24);
        if (gapDays > maxGap && gapDays >= MIN_SILENCE_DAYS) {
          maxGap = gapDays;
          maxGapIndex = i;
        }
      }

      if (maxGapIndex > 0 && !usedVideoBvids.has(vids[maxGapIndex].bvid)) {
        nodes.push(createSilenceNode(vids[maxGapIndex], Math.floor(maxGap), upName));
        usedVideoBvids.add(vids[maxGapIndex].bvid);
      }
    }

    const lastVideo = vids[vids.length - 1];
    if (vids.length > 1 && !usedVideoBvids.has(lastVideo.bvid)) {
      nodes.push(createCurrentNode(lastVideo, vids.length));
    }

    const sorted = nodes.sort((a, b) => a.date - b.date);

    if (sorted.length > MAX_NODES) {
      const scored = sorted.map(n => ({ ...n, score: NODE_PRIORITY[n.type] ?? 10 }));
      scored.sort((a, b) => a.score - b.score);
      return scored.slice(0, MAX_NODES).sort((a, b) => a.date - b.date);
    }

    return sorted;
  }, [videos, sortedVideos, upName]);

  // 设置 IntersectionObserver
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest('.growth-journey-overlay');
    if (!scrollContainer || storyNodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = nodeRefs.current.indexOf(entry.target);
            if (index !== -1) {
              setVisibleNodes(prev => new Set([...prev, index]));
            }
          }
        });
      },
      { root: scrollContainer, threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    nodeRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [storyNodes.length]);

  const openVideo = (video) => {
    if (video?.video_url) window.open(video.video_url, '_blank');
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 relative">
      <div className="relative flex flex-col gap-16 py-16">
        {/* 时间轴中线 */}
        <div className="absolute left-6 sm:left-1/2 w-px bg-slate-200/80 -translate-x-1/2 top-20 bottom-20" />

        {/* 故事节点 */}
        {storyNodes.map((node, index) => {
          const IconComponent = node.icon;
          const isRight = index % 2 !== 0;
          const isVisible = visibleNodes.has(index);

          return (
            <div
              key={node.id}
              ref={el => nodeRefs.current[index] = el}
              className={`relative pl-16 sm:pl-0 sm:flex sm:items-center transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${isRight ? 'translate-x-10' : '-translate-x-10'}`
              }`}
            >
              {/* 时间轴节点标记 */}
              <div
                className={`absolute w-4 h-4 rounded-full flex items-center justify-center z-10 left-0 sm:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ${
                  isVisible ? 'scale-100' : 'scale-0'
                } ${MARKER_COLORS[node.markerColor]}`}
              >
                <div className="w-3 h-3 rounded-full bg-current" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.9), 0 0 0 5px currentColor' }} />
              </div>

              {/* 日期显示 */}
              <div className={`text-sm text-slate-400 mb-3 font-serif italic sm:absolute sm:w-[45%] sm:mb-0 sm:top-1/2 sm:-translate-y-1/2 ${isRight ? 'sm:text-left sm:pl-10 sm:right-0' : 'sm:text-right sm:pr-10 sm:left-0'}`}>
                {node.dateDisplay}
              </div>

              {/* 内容卡片 */}
              <div
                className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 relative overflow-hidden transition-all duration-300 hover:bg-white hover:-translate-y-0.5 sm:w-[45%] ${isRight ? 'sm:mr-[55%]' : 'sm:ml-[55%]'} ${node.video ? 'cursor-pointer' : ''}`}
                onClick={node.video ? () => openVideo(node.video) : undefined}
              >
                {/* 视频封面 */}
                {node.video && node.showCover && (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img src={getImageUrl(node.video.cover)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play size={32} className="text-white" fill="currentColor" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3 text-white text-xs">
                      <span className="flex items-center gap-1"><Play size={12} /> {formatNumber(node.video.play_count)}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {formatNumber(node.video.danmu_count)}</span>
                    </div>
                  </div>
                )}

                {!node.showCover && <IconComponent className="absolute -right-4 -bottom-4 text-slate-100 rotate-12 opacity-50" size={80} />}

                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent size={18} className={node.iconColor} />
                    <h3 className="font-bold text-slate-800">{node.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{node.description}</p>

                  {node.video && !node.showCover && (
                    <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-100/80 hover:bg-blue-100/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-600">
                        <Play size={12} fill="currentColor" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{node.video.title}</div>
                        <div className="text-[10px] text-slate-400">播放: {formatNumber(node.video.play_count)}</div>
                      </div>
                    </div>
                  )}

                  {node.video && node.showCover && (
                    <div className="mt-3 text-sm font-medium text-slate-800 line-clamp-2">{node.video.title}</div>
                  )}

                  {node.stats && (
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      {node.stats.map((stat, i) => <span key={i} className="px-2 py-1 bg-slate-50 rounded">{stat}</span>)}
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
};

export default StoryTimeline;
