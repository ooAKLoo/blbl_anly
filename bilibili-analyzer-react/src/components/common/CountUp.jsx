import { useState, useEffect, useRef } from 'react';

/**
 * CountUp - 数字递增动画组件
 * 从 0 递增到目标值，带有缓动效果
 * 
 * @param {number} end - 目标数值
 * @param {number} duration - 动画持续时间（毫秒），默认 2000
 * @param {boolean} startOnVisible - 是否在可见时开始动画
 * @param {number} decimals - 小数位数，默认 0
 * @param {function} formatFn - 自定义格式化函数
 */
const CountUp = ({ 
  end, 
  duration = 2000, 
  startOnVisible = false, 
  decimals = 0, 
  formatFn = null 
}) => {
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
      // easeOutExpo 缓动函数
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

  // 当目标值变化时重置
  useEffect(() => {
    if (end !== lastEndValue.current) {
      lastEndValue.current = end;
      setHasStarted(false);
      setCurrent(0);
    }
  }, [end]);

  // 当 startOnVisible 变为 true 时开始动画
  useEffect(() => {
    if (startOnVisible && !hasStarted) {
      startAnimation();
    }
  }, [startOnVisible, hasStarted]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 格式化显示值
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

export default CountUp;
