import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatNumber, getImageUrl } from '../../../utils';
import './HeroSection.css';

// CountUp component for animated number display
const CountUp = ({ end, duration = 2000, startOnVisible = false, decimals = 0, formatFn = null }) => {
  const [current, setCurrent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const animationRef = useRef(null);
  const lastEndValue = useRef(end);

  const startAnimation = () => {
    setHasStarted(true);
    const startTime = performance.now();
    const startValue = 0;
    const endValue = end;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(startValue + (endValue - startValue) * easeProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(endValue);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (end !== lastEndValue.current) {
      lastEndValue.current = end;
      setHasStarted(false);
      setCurrent(0);
    }
  }, [end]);

  useEffect(() => {
    if (startOnVisible && !hasStarted) {
      startAnimation();
    }
  }, [startOnVisible, hasStarted]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  let displayValue;
  if (formatFn) {
    displayValue = formatFn(Math.round(current));
  } else if (decimals > 0) {
    displayValue = current.toFixed(decimals);
  } else {
    displayValue = Math.round(current).toLocaleString();
  }

  return <span className="count-up">{displayValue}</span>;
};

const HeroSection = forwardRef(({
  upName = 'UP主',
  upFace = '',
  totalDays = 0,
  journeyStart = '',
  videoCount = 0,
  firstVideoPlays = 0,
  totalPlays = 0,
  growthMultiple = 1,
  creatorTags = [],
  onVisible
}, ref) => {
  const heroRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  // 环绕标签样式生成：支持3-5个标签的动态布局
  const getOrbitTagStyle = (index, total) => {
    let positions;

    if (total <= 3) {
      // 3个标签：倒三角布局
      positions = [
        { angle: -90, radius: 115 },   // 顶部
        { angle: 150, radius: 125 },   // 左下
        { angle: 30, radius: 125 },    // 右下
      ];
    } else if (total === 4) {
      // 4个标签：菱形布局
      positions = [
        { angle: -90, radius: 115 },   // 顶部
        { angle: 0, radius: 130 },     // 右侧
        { angle: 180, radius: 130 },   // 左侧
        { angle: 90, radius: 120 },    // 底部
      ];
    } else {
      // 5个标签：五边形布局
      positions = [
        { angle: -90, radius: 115 },   // 顶部（最重要的标签）
        { angle: -18, radius: 130 },   // 右上
        { angle: 54, radius: 130 },    // 右下
        { angle: 126, radius: 130 },   // 左下
        { angle: 198, radius: 130 },   // 左上
      ];
    }

    const pos = positions[index] || { angle: -90 + index * (360 / total), radius: 125 };
    const angleRad = (pos.angle * Math.PI) / 180;

    const x = Math.cos(angleRad) * pos.radius;
    const y = Math.sin(angleRad) * pos.radius;

    // 入场延迟：头像先显示，标签依次快速出现
    const baseDelay = 0.4;
    const staggerDelay = 0.08;
    const delay = baseDelay + index * staggerDelay;

    return {
      '--orbit-x': `${x}px`,
      '--orbit-y': `${y}px`,
      '--enter-delay': `${delay}s`
    };
  };

  const setupObserver = () => {
    if (!heroRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (onVisible) onVisible();
          }
        });
      },
      { threshold: 0.3 }
    );
    observerRef.current.observe(heroRef.current);
  };

  const reset = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    setupObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset,
    setupObserver
  }));

  return (
    <header className="hero-header" ref={heroRef}>
      {/* 梦幻背景装饰 */}
      <div className="bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="sparkle sparkle-1"></div>
        <div className="sparkle sparkle-2"></div>
        <div className="sparkle sparkle-3"></div>
      </div>

      {/* 主内容区：左右分栏 */}
      <div className={`hero-container ${isVisible ? 'is-visible' : ''}`}>
        {/* 左侧：核心信息 */}
        <div className="hero-left">
          {/* UP主名称 + 标签 */}
          <div className={`hero-intro animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0s' }}>
            <span className="intro-label">成长历程</span>
            <h1 className="hero-title">
              <span className="title-name">{upName}</span>
              <span className="title-suffix">的创作故事</span>
            </h1>
          </div>

          {/* 核心数字：天数 */}
          <div className={`hero-days animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0.15s' }}>
            <div className="days-number">
              <CountUp end={totalDays} duration={2500} startOnVisible={isVisible} />
            </div>
            <div className="days-label">
              <span className="label-text">天的坚持</span>
              <span className="label-date">始于 {journeyStart}</span>
            </div>
          </div>

          {/* 情感叙事 */}
          <div className={`hero-narrative animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0.3s' }}>
            {firstVideoPlays < 10000 ? (
              <p className="narrative-text">
                从 <span className="highlight">{formatNumber(firstVideoPlays)}</span> 次播放开始，一步步走到今天
              </p>
            ) : (
              <p className="narrative-text">
                出道即巅峰，首个视频就收获 <span className="highlight">{formatNumber(firstVideoPlays)}</span> 次播放
              </p>
            )}
          </div>

          {/* 成长数据卡片 */}
          <div className="hero-stats">
            <div className={`stat-card stat-primary animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0.45s' }}>
              <div className="stat-value">
                <CountUp end={totalPlays} duration={3000} startOnVisible={isVisible} formatFn={formatNumber} />
              </div>
              <div className="stat-label">累计播放</div>
            </div>
            <div className={`stat-card animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0.55s' }}>
              <div className="stat-value">
                <CountUp end={videoCount} duration={2000} startOnVisible={isVisible} />
              </div>
              <div className="stat-label">个作品</div>
            </div>
            <div className={`stat-card animate-item ${isVisible ? 'is-visible' : ''}`} style={{ '--item-delay': '0.65s' }}>
              <div className="stat-value">
                <CountUp end={growthMultiple} duration={2000} decimals={0} startOnVisible={isVisible} />
                <span className="stat-suffix">x</span>
              </div>
              <div className="stat-label">播放增长</div>
            </div>
          </div>
        </div>

        {/* 右侧：头像 + 环绕标签 */}
        <div className="hero-right">
          <div className={`avatar-orbit ${isVisible ? 'is-visible' : ''}`}>
            {/* 中心头像 */}
            <div className="avatar-center">
              {upFace ? (
                <img
                  src={getImageUrl(upFace)}
                  className="avatar-img"
                  referrerPolicy="no-referrer"
                  alt=""
                />
              ) : (
                <div className="avatar-placeholder">
                  {upName.charAt(0)}
                </div>
              )}
            </div>

            {/* 环绕标签 */}
            <div className="orbit-tags">
              {creatorTags.map((tag, index) => (
                <span
                  key={tag.text}
                  className={`orbit-tag tag-type-${tag.type} ${isVisible ? 'is-visible' : ''}`}
                  style={getOrbitTagStyle(index, creatorTags.length)}
                >
                  {tag.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className={`hero-scroll-hint ${isVisible ? 'is-visible' : ''}`}>
        <span>向下探索 TA 的故事</span>
        <div className="scroll-arrow">
          <ChevronDown size={20} />
        </div>
      </div>
    </header>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
