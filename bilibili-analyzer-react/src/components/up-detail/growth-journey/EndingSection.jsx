import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { formatNumber } from '../../../utils';
import './EndingSection.css';

const EndingSection = forwardRef(({
  upName = 'UP主',
  totalDays = 0,
  firstVideoPlays = 0,
  totalPlays = 0,
  videos = [],
  growthMultiple = 1
}, ref) => {
  const endingRef = useRef(null);
  const vizContainer = useRef(null);
  const chartSvg = useRef(null);
  const mainPath = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [pathLength, setPathLength] = useState(1000);
  const [displayDays, setDisplayDays] = useState('0');
  const [displayPlays, setDisplayPlays] = useState('0');
  const [displayGrowth, setDisplayGrowth] = useState('1.0');

  const observerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startAnimationRef = useRef(null);

  // ============ 数据计算 ============

  // 计算累积播放量数据点（按真实时间轴）
  const growthData = useMemo(() => {
    if (!videos || videos.length === 0) {
      return [{ timeProgress: 0, cumulative: 0, date: new Date() }];
    }

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const firstDate = new Date(sorted[0].publish_time).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].publish_time).getTime();
    const totalTimeSpan = lastDate - firstDate || 1;

    let cumulative = 0;
    return sorted.map((v, i) => {
      cumulative += v.play_count;
      const currentDate = new Date(v.publish_time).getTime();
      return {
        index: i,
        cumulative,
        playCount: v.play_count,
        date: new Date(v.publish_time),
        timeProgress: (currentDate - firstDate) / totalTimeSpan,
        title: v.title
      };
    });
  }, [videos]);

  // 时间到数据映射
  const timeToDataMap = useMemo(() => {
    const data = growthData;
    if (data.length < 2) return [];

    const maxCumulative = data[data.length - 1].cumulative;

    return data.map(d => ({
      timeProgress: d.timeProgress,
      playProgress: d.cumulative / maxCumulative,
      cumulative: d.cumulative,
      videoCount: d.index + 1,
      date: d.date
    }));
  }, [growthData]);

  // 根据时间进度获取数据
  const getPlayProgressAtTime = useCallback((timeProgress) => {
    const map = timeToDataMap;
    if (map.length < 2) return { playProgress: 0, cumulative: 0, videoCount: 0, date: new Date() };

    for (let i = 1; i < map.length; i++) {
      if (timeProgress <= map[i].timeProgress) {
        const prev = map[i - 1];
        const curr = map[i];
        const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

        return {
          playProgress: prev.playProgress + (curr.playProgress - prev.playProgress) * segmentProgress,
          cumulative: Math.floor(prev.cumulative + (curr.cumulative - prev.cumulative) * segmentProgress),
          videoCount: prev.videoCount + Math.floor((curr.videoCount - prev.videoCount) * segmentProgress),
          date: new Date(prev.date.getTime() + (curr.date.getTime() - prev.date.getTime()) * segmentProgress)
        };
      }
    }

    const last = map[map.length - 1];
    return { playProgress: last.playProgress, cumulative: last.cumulative, videoCount: last.videoCount, date: last.date };
  }, [timeToDataMap]);

  const currentAnimationData = useMemo(() => {
    return getPlayProgressAtTime(animationProgress);
  }, [animationProgress, getPlayProgressAtTime]);

  // 当前日期标签
  const currentDateLabel = useMemo(() => {
    const date = currentAnimationData.date;
    return `${date.getFullYear()}.${date.getMonth() + 1}`;
  }, [currentAnimationData]);

  // ============ 里程碑系统 ============

  // 计算关键里程碑
  const milestones = useMemo(() => {
    const data = growthData;
    if (data.length < 2) return [];

    const result = [];
    const maxCumulative = data[data.length - 1].cumulative;

    // 1. 首个视频
    result.push({
      id: 'first',
      index: 0,
      type: 'first',
      label: '起点',
      color: '#6366f1',
      timeProgress: data[0].timeProgress,
      cumulative: data[0].cumulative
    });

    // 2. 播放量里程碑（1万、10万、100万、1000万、1亿）
    const playMilestones = [10000, 100000, 1000000, 10000000, 100000000];
    playMilestones.forEach(threshold => {
      const idx = data.findIndex(d => d.cumulative >= threshold);
      if (idx > 0 && threshold <= maxCumulative) {
        const labels = {
          10000: '1万',
          100000: '10万',
          1000000: '100万',
          10000000: '1000万',
          100000000: '1亿'
        };
        result.push({
          id: `play-${threshold}`,
          index: idx,
          type: 'play-milestone',
          label: labels[threshold],
          color: '#10b981',
          timeProgress: data[idx].timeProgress,
          cumulative: data[idx].cumulative
        });
      }
    });

    // 3. 最高播放视频
    let maxPlayIdx = 0;
    let maxPlay = 0;
    data.forEach((d, i) => {
      if (d.playCount > maxPlay) {
        maxPlay = d.playCount;
        maxPlayIdx = i;
      }
    });
    if (maxPlayIdx > 0 && maxPlay > 10000) {
      result.push({
        id: 'peak',
        index: maxPlayIdx,
        type: 'peak',
        label: '爆款',
        color: '#f59e0b',
        timeProgress: data[maxPlayIdx].timeProgress,
        cumulative: data[maxPlayIdx].cumulative
      });
    }

    return result;
  }, [growthData]);

  // SVG 路径计算
  const chartDimensions = { width: 1000, height: 400, padding: 60 };

  const scaledPoints = useMemo(() => {
    const data = growthData;
    if (data.length < 2) return [];

    const { width, height, padding } = chartDimensions;
    const maxY = Math.max(...data.map(d => d.cumulative));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    return data.map((d) => ({
      x: padding + d.timeProgress * chartWidth,
      y: height - padding - (d.cumulative / maxY) * chartHeight,
      cumulative: d.cumulative,
      timeProgress: d.timeProgress
    }));
  }, [growthData]);

  // 里程碑点位置
  const visibleMilestones = useMemo(() => {
    const points = scaledPoints;
    if (points.length === 0) return [];

    const { width, height, padding } = chartDimensions;
    const maxY = Math.max(...growthData.map(d => d.cumulative));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    return milestones.map(m => {
      const x = padding + m.timeProgress * chartWidth;
      const y = height - padding - (m.cumulative / maxY) * chartHeight;
      const isPassed = animationProgress >= m.timeProgress;
      const isActive = isPassed && animationProgress < m.timeProgress + 0.05;

      return {
        ...m,
        x,
        y,
        opacity: isPassed ? 1 : 0,
        isActive,
        showLabel: isPassed && animationProgress > m.timeProgress + 0.02
      };
    });
  }, [scaledPoints, milestones, animationProgress, growthData]);

  // 生成平滑曲线路径
  const linePath = useMemo(() => {
    const points = scaledPoints;
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
    }

    return path;
  }, [scaledPoints]);

  const areaPath = useMemo(() => {
    const points = scaledPoints;
    if (points.length < 2) return '';

    const { height, padding } = chartDimensions;
    const baseline = height - padding;

    let path = `M ${points[0].x} ${baseline}`;
    path += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${curr.x - (curr.x - prev.x) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
    }

    path += ` L ${points[points.length - 1].x} ${baseline} Z`;
    return path;
  }, [scaledPoints]);

  const currentPoint = useMemo(() => {
    const points = scaledPoints;
    if (points.length === 0) return { x: 0, y: 0 };

    const timeProgress = animationProgress;

    for (let i = 1; i < points.length; i++) {
      if (timeProgress <= points[i].timeProgress) {
        const prev = points[i - 1];
        const curr = points[i];
        const segmentProgress = (timeProgress - prev.timeProgress) / (curr.timeProgress - prev.timeProgress || 1);

        return {
          x: prev.x + (curr.x - prev.x) * segmentProgress,
          y: prev.y + (curr.y - prev.y) * segmentProgress
        };
      }
    }

    return points[points.length - 1];
  }, [scaledPoints, animationProgress]);

  const pathDrawProgress = useMemo(() => {
    const { width, padding } = chartDimensions;
    const chartWidth = width - padding * 2;
    const currentX = currentPoint.x - padding;
    return Math.max(0, Math.min(1, currentX / chartWidth));
  }, [currentPoint]);

  // 时间轴标签
  const journeyStartLabel = useMemo(() => {
    if (!videos || videos.length === 0) return '';
    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );
    const date = new Date(sorted[0].publish_time);
    return `${date.getFullYear()}.${date.getMonth() + 1}`;
  }, [videos]);

  const journeyEndLabel = useMemo(() => {
    if (!videos || videos.length === 0) return '现在';
    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );
    const date = new Date(sorted[sorted.length - 1].publish_time);
    const now = new Date();
    if (now - date < 30 * 24 * 60 * 60 * 1000) {
      return '现在';
    }
    return `${date.getFullYear()}.${date.getMonth() + 1}`;
  }, [videos]);

  // 更新频率计算
  const avgPublishDays = useMemo(() => {
    if (!videos || videos.length < 2) return 0;
    return Math.round(totalDays / videos.length);
  }, [videos, totalDays]);

  const totalYears = useMemo(() => Math.floor(totalDays / 365), [totalDays]);
  const totalDaysRemainder = useMemo(() => totalDays % 365, [totalDays]);

  // 迷你折线图路径
  const miniChartPath = useMemo(() => {
    if (!videos || videos.length < 2) return '';

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const width = 120;
    const height = 40;
    const padding = 4;

    const maxY = Math.max(...sorted.map(v => v.play_count));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = sorted.map((v, i) => ({
      x: padding + (i / (sorted.length - 1)) * chartWidth,
      y: height - padding - (v.play_count / maxY) * chartHeight
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }

    return path;
  }, [videos]);

  const miniChartAreaPath = useMemo(() => {
    if (!videos || videos.length < 2) return '';

    const sorted = [...videos].sort((a, b) =>
      new Date(a.publish_time) - new Date(b.publish_time)
    );

    const width = 120;
    const height = 40;
    const padding = 4;

    const maxY = Math.max(...sorted.map(v => v.play_count));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = sorted.map((v, i) => ({
      x: padding + (i / (sorted.length - 1)) * chartWidth,
      y: height - padding - (v.play_count / maxY) * chartHeight
    }));

    let path = `M ${points[0].x} ${height - padding}`;
    path += ` L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    path += ` L ${points[points.length - 1].x} ${height - padding} Z`;

    return path;
  }, [videos]);

  // ============ 动画 ============

  const animateNumbers = useCallback((timeProgress) => {
    const animData = getPlayProgressAtTime(timeProgress);
    setDisplayDays(Math.floor(totalDays * timeProgress).toLocaleString());
    setDisplayPlays(formatNumber(animData.cumulative));
    setDisplayGrowth((growthMultiple * animData.playProgress).toFixed(1));
  }, [getPlayProgressAtTime, totalDays, growthMultiple]);

  const startAnimation = useCallback(() => {
    if (!isVisible) return;

    const duration = 8000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const timeProgress = Math.min(elapsed / duration, 1);

      setAnimationProgress(timeProgress);
      animateNumbers(timeProgress);

      if (timeProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    setTimeout(() => {
      if (mainPath.current) {
        setPathLength(mainPath.current.getTotalLength() || 1000);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 0);
  }, [isVisible, animateNumbers]);

  // Keep ref updated
  useEffect(() => {
    startAnimationRef.current = startAnimation;
  }, [startAnimation]);

  const replay = useCallback(() => {
    setAnimationProgress(0);
    setDisplayDays('0');
    setDisplayPlays('0');
    setDisplayGrowth('1.0');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setTimeout(() => {
      if (startAnimationRef.current) {
        startAnimationRef.current();
      }
    }, 300);
  }, []);

  const setupObserver = useCallback(() => {
    if (!endingRef.current) return;

    // Disconnect existing observer if any
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => {
              if (!prev) {
                setTimeout(() => {
                  if (startAnimationRef.current) {
                    startAnimationRef.current();
                  }
                }, 500);
                return true;
              }
              return prev;
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    observerRef.current.observe(endingRef.current);
  }, []);

  const reset = useCallback(() => {
    setIsVisible(false);
    setAnimationProgress(0);
    setDisplayDays('0');
    setDisplayPlays('0');
    setDisplayGrowth('1.0');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    setupObserver();
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
    setupObserver
  }));

  return (
    <div
      className={`story-ending ${isVisible ? 'is-visible' : ''}`}
      ref={endingRef}
    >
      {/* 分割线 */}
      <div className={`ending-divider animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--delay': '0s' }}></div>

      {/* 标题：成长轨迹 */}
      <h2 className={`section-title animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--delay': '0.1s' }}>成长轨迹</h2>

      {/* 核心可视化区域 */}
      <div className={`visualization-container animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--delay': '0.2s' }} ref={vizContainer}>
        {/* 累积播放量折线图 */}
        <div className="chart-area">
          {/* 当前时间/播放量实时显示（跟随光标） */}
          {animationProgress > 0 && animationProgress < 1 && (
            <div
              className="live-indicator"
              style={{ left: `calc(${pathDrawProgress * 100}% + 20px)` }}
            >
              <div className="live-date">{currentDateLabel}</div>
              <div className="live-plays">{formatNumber(currentAnimationData.cumulative)}</div>
            </div>
          )}

          <svg ref={chartSvg} className="growth-chart" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="milestoneGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 裁剪区域 */}
            <clipPath id="areaClip">
              <rect x={0} y={0} width={50 + pathDrawProgress * 900} height={280} />
            </clipPath>

            {/* 里程碑垂直标记线 */}
            <g className="milestone-lines">
              {visibleMilestones.map(milestone => (
                <line
                  key={milestone.id}
                  x1={milestone.x}
                  y1={60}
                  x2={milestone.x}
                  y2={340}
                  stroke={milestone.color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={milestone.opacity * 0.3}
                />
              ))}
            </g>

            {/* 区域填充 */}
            <path
              d={areaPath}
              fill="url(#areaGradient)"
              clipPath="url(#areaClip)"
            />

            {/* 主线条 */}
            <path
              ref={mainPath}
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength * (1 - pathDrawProgress)
              }}
              filter="url(#glow)"
            />

            {/* 里程碑点 */}
            <g className="milestones">
              {visibleMilestones.map(milestone => (
                <g key={milestone.id}>
                  <circle
                    cx={milestone.x}
                    cy={milestone.y}
                    r={milestone.isActive ? 10 : 6}
                    fill={milestone.color}
                    opacity={milestone.opacity}
                    filter={milestone.isActive ? 'url(#milestoneGlow)' : ''}
                    className="milestone-dot"
                  />
                  {milestone.showLabel && (
                    <g
                      transform={`translate(${milestone.x}, ${milestone.y - 20})`}
                      className="milestone-label"
                      style={{ opacity: milestone.opacity }}
                    >
                      <text
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {milestone.label}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </g>

            {/* 当前追踪点 */}
            {animationProgress > 0 && (
              <g>
                <circle
                  cx={currentPoint.x}
                  cy={currentPoint.y}
                  r="8"
                  fill="#3b82f6"
                  filter="url(#glow)"
                  className="current-dot"
                />
                <circle
                  cx={currentPoint.x}
                  cy={currentPoint.y}
                  r="8"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="pulse-ring"
                />
                <circle
                  cx={currentPoint.x}
                  cy={currentPoint.y}
                  r="8"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  className="pulse-ring-2"
                />
              </g>
            )}
          </svg>

          {/* 时间轴 */}
          <div className="time-axis">
            <span className="time-label">{journeyStartLabel}</span>
            <span className="time-label">{journeyEndLabel}</span>
          </div>
        </div>
      </div>

      {/* 核心数据展示 */}
      <div className={`hero-stats animate-item ${isVisible ? 'is-visible' : ''} ${animationProgress >= 1 ? 'animate-in' : ''}`} style={{ '--delay': '0.3s' }}>
        <div className="stat-item primary">
          <span className="stat-value">{displayPlays}</span>
          <span className="stat-label">累积播放</span>
        </div>
      </div>

      {/* 次要数据 */}
      <div className={`secondary-stats animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--delay': '0.4s' }}>
        <div className="stat-pill">
          <span className="pill-value">{displayDays}</span>
          <span className="pill-label">天</span>
        </div>
        <div className="stat-pill">
          <span className="pill-value">{videos?.length || 0}</span>
          <span className="pill-label">个作品</span>
        </div>
        {growthMultiple > 1 && (
          <div className="stat-pill highlight">
            <span className="pill-value">{displayGrowth}×</span>
            <span className="pill-label">成长</span>
          </div>
        )}
      </div>

      {/* 结语区域 */}
      <div className={`ending-footer animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--delay': '0.5s' }}>
        {/* 左侧：结语文字 */}
        <div className="ending-narrative">
          <p className="narrative-text">
            从 <strong>{journeyStartLabel}</strong> 的第一个视频开始，<br/>
            <span className="highlight">{upName}</span> 用 <strong>{displayDays}</strong> 天，<br/>
            将 <strong>{formatNumber(firstVideoPlays)}</strong> 播放变成了 <strong>{formatNumber(totalPlays)}</strong>。
          </p>
          {animationProgress >= 1 && (
            <p className="narrative-ending">
              故事还在继续。
            </p>
          )}
        </div>

        {/* 右侧：印戳 */}
        <div className={`rhythm-stamp ${animationProgress >= 1 ? 'is-visible' : ''}`}>
          <div className="stamp-header">
            <span className="stamp-number">{avgPublishDays}</span>
            <span className="stamp-unit">天/更</span>
          </div>
          <div className="stamp-chart">
            <svg viewBox="0 0 120 40" className="mini-line-chart">
              <path
                d={miniChartPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={miniChartAreaPath}
                fill="url(#miniGradient)"
              />
              <defs>
                <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="stamp-detail">
            {totalYears}年{totalDaysRemainder}天 · {videos?.length || 0}个作品
          </div>
        </div>
      </div>

      {/* 重播按钮 */}
      {animationProgress >= 1 && (
        <button
          className="replay-button"
          onClick={replay}
        >
          <svg className="replay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          再看一次
        </button>
      )}
    </div>
  );
});

EndingSection.displayName = 'EndingSection';

export default EndingSection;
