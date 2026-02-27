import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Calculator, Flame, Zap, CalendarDays, Target } from 'lucide-react';
import { formatNumber } from '../../utils';

/**
 * 时间线 DataZoom 范围统计浮窗
 * 监听 echarts datazoom 事件，从视口顶部滑入显示所选范围的汇总数据，
 * 停止拖动后自动收回。
 */
function ZoomRangePanel({ chartInstance, analysisVideos }) {
  const [zoomRange, setZoomRange] = useState(null);
  const [visible, setVisible] = useState(false);
  const throttleRef = useRef(null);
  const hideTimerRef = useRef(null);
  const hoveringRef = useRef(false);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!hoveringRef.current) setVisible(false);
    }, 2500);
  }, []);

  const onMouseEnter = useCallback(() => {
    hoveringRef.current = true;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const onMouseLeave = useCallback(() => {
    hoveringRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  // 绑定 / 解绑 datazoom 事件
  useEffect(() => {
    const chart = chartInstance;
    if (!chart) return;

    const handler = () => {
      if (throttleRef.current) return;
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        const option = chart.getOption();
        const zoom = option.dataZoom[0];
        if (zoom.start <= 0.1 && zoom.end >= 99.9) {
          setZoomRange(null);
          setVisible(false);
        } else {
          const seriesData = option.series[0]?.data;
          const total = seriesData?.length || 0;
          if (total === 0) return;
          const startIdx = Math.floor(zoom.start / 100 * total);
          const endIdx = Math.min(Math.ceil(zoom.end / 100 * total) - 1, total - 1);
          setZoomRange({ startIdx, endIdx });
          setVisible(true);
          scheduleHide();
        }
      }, 150);
    };

    chart.on('datazoom', handler);
    return () => {
      chart.off('datazoom', handler);
      if (throttleRef.current) clearTimeout(throttleRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [chartInstance, scheduleHide]);

  // 计算缩放范围统计
  const stats = useMemo(() => {
    if (!zoomRange || analysisVideos.length === 0) return null;
    const sorted = [...analysisVideos].sort(
      (a, b) => new Date(a.publish_time) - new Date(b.publish_time)
    );
    const rangeVideos = sorted.slice(zoomRange.startIdx, zoomRange.endIdx + 1);
    if (rangeVideos.length === 0) return null;

    const totalPlays = rangeVideos.reduce((s, v) => s + (v.play_count || 0), 0);
    const avgPlays = Math.round(totalPlays / rangeVideos.length);

    // 爆款率（2 倍均播，与 useVideoMetrics 一致）
    const hitThreshold = avgPlays * 2;
    const hitCount = rangeVideos.filter(v => v.play_count >= hitThreshold).length;
    const hitRate = (hitCount / rangeVideos.length * 100).toFixed(1);

    // 互动率
    const interactions = rangeVideos.reduce(
      (s, v) => s + (v.like_count || 0) + (v.coin_count || 0) + (v.share_count || 0), 0
    );
    const engRate = totalPlays > 0 ? (interactions / totalPlays * 100).toFixed(2) : '0.00';

    // 月均发布
    const dates = rangeVideos.map(v => new Date(v.publish_time)).filter(d => !isNaN(d));
    let monthlyRate = '—';
    if (dates.length >= 2) {
      const min = new Date(Math.min(...dates));
      const max = new Date(Math.max(...dates));
      const months = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
      if (months > 0) monthlyRate = (rangeVideos.length / months).toFixed(1);
    }

    // 日期范围
    const startDate = rangeVideos[0]?.publish_time?.slice(0, 7)?.replace('-', '.') || '';
    const endDate = rangeVideos.at(-1)?.publish_time?.slice(0, 7)?.replace('-', '.') || '';
    const dateRange = startDate === endDate ? startDate : `${startDate} – ${endDate}`;

    // 全量对比
    const gTotal = analysisVideos.reduce((s, v) => s + (v.play_count || 0), 0);
    const gAvg = gTotal / analysisVideos.length;
    const gHitThreshold = gAvg * 2;
    const gHitRate = analysisVideos.filter(v => v.play_count >= gHitThreshold).length / analysisVideos.length * 100;
    const gInteractions = analysisVideos.reduce(
      (s, v) => s + (v.like_count || 0) + (v.coin_count || 0) + (v.share_count || 0), 0
    );
    const gEngRate = gTotal > 0 ? (gInteractions / gTotal * 100) : 0;

    return {
      totalPlays,
      avgPlays,
      hitRate,
      engRate,
      monthlyRate,
      videoCount: rangeVideos.length,
      dateRange,
      avgPlaysChange: gAvg > 0 ? ((avgPlays - gAvg) / gAvg * 100) : 0,
      hitRateChange: parseFloat(hitRate) - gHitRate,
      engRateChange: parseFloat(engRate) - gEngRate,
    };
  }, [zoomRange, analysisVideos]);

  const show = visible && stats;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="fixed top-0 left-0 right-0 z-[999] pointer-events-none flex justify-center"
        >
          <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="pointer-events-auto w-full max-w-3xl mx-4 mt-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-black/8 border border-neutral-200/60 px-5 py-3.5"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Target size={10} />
                已选范围
              </span>
              <span className="text-xs text-neutral-400">
                {stats.dateRange}（共 {stats.videoCount} 条）
              </span>
            </div>
            <div className="grid grid-cols-5 gap-5">
              <Metric value={formatNumber(stats.totalPlays)} icon={Play} label="总播放量" />
              <Metric value={formatNumber(stats.avgPlays)} icon={Calculator} label="场均播放" change={stats.avgPlaysChange} unit="%" />
              <Metric value={stats.hitRate} suffix="%" icon={Flame} label="爆款率" change={stats.hitRateChange} unit="pp" />
              <Metric value={stats.engRate} suffix="%" icon={Zap} label="互动率" change={stats.engRateChange} unit="pp" precision={2} />
              <Metric value={stats.monthlyRate} icon={CalendarDays} label="月均发布" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Metric({ value, suffix, icon: Icon, label, change, unit, precision = 1 }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-neutral-900 tabular-nums">
          {value}{suffix && <span className="text-sm font-normal text-neutral-400">{suffix}</span>}
        </span>
        {change !== undefined && (
          <span className={`text-[11px] font-medium ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(precision)}{unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Icon size={11} className="text-neutral-400" />
        <span className="text-[11px] text-neutral-500">{label}</span>
      </div>
    </div>
  );
}

export default ZoomRangePanel;
