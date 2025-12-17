import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * ECharts Hook - 处理图表初始化、更新和销毁
 * @param {Object} option - ECharts 配置选项
 * @param {Array} deps - 依赖数组，当依赖变化时重新渲染图表
 * @returns {Object} { chartRef, chartInstance }
 */
export function useECharts(option, deps = []) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 设置配置
    if (option) {
      chartInstance.current.setOption(option, { notMerge: true });
    }

    // 窗口大小变化时自动resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option, ...deps]);

  // 组件卸载时销毁图表
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return { chartRef, chartInstance: chartInstance.current };
}

/**
 * 更灵活的 ECharts Hook - 手动控制初始化和更新
 * @returns {Object} { chartRef, initChart, chartInstance }
 */
export function useEChartsRef() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  /**
   * 初始化或重新初始化图表
   * @returns {Object} ECharts 实例
   */
  const initChart = () => {
    if (!chartRef.current) return null;

    // 如果已存在实例，先销毁
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // 创建新实例
    chartInstance.current = echarts.init(chartRef.current);
    return chartInstance.current;
  };

  /**
   * 设置图表配置
   * @param {Object} option - ECharts 配置
   * @param {Object} opts - setOption 选项
   */
  const setOption = (option, opts = {}) => {
    if (!chartInstance.current) {
      initChart();
    }
    chartInstance.current?.setOption(option, opts);
  };

  /**
   * 获取当前图表实例
   * @returns {Object} ECharts 实例
   */
  const getInstance = () => chartInstance.current;

  /**
   * 销毁图表实例
   */
  const dispose = () => {
    chartInstance.current?.dispose();
    chartInstance.current = null;
  };

  /**
   * 调整图表大小
   */
  const resize = () => {
    chartInstance.current?.resize();
  };

  // 窗口 resize 监听
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  return {
    chartRef,
    initChart,
    setOption,
    getInstance,
    dispose,
    resize,
    chartInstance: chartInstance.current
  };
}

/**
 * 简化的 ECharts Hook - 适用于大多数场景
 * 自动处理初始化、更新和清理
 *
 * 使用示例:
 * ```jsx
 * function MyChart({ data }) {
 *   const chartRef = useSimpleECharts({
 *     xAxis: { type: 'category', data: ['A', 'B', 'C'] },
 *     yAxis: { type: 'value' },
 *     series: [{ type: 'bar', data: [10, 20, 30] }]
 *   }, [data]); // 当 data 变化时重新渲染
 *
 *   return <div ref={chartRef} style={{ height: '400px' }} />;
 * }
 * ```
 *
 * @param {Object} option - ECharts 配置选项
 * @param {Array} deps - 依赖数组
 * @returns {Object} chartRef
 */
export function useSimpleECharts(option, deps = []) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 更新配置
    if (option) {
      chartInstance.current.setOption(option, { notMerge: true });
    }

    // Resize 监听
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, ...deps]);

  // 清理
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return chartRef;
}

/**
 * 多图表管理 Hook
 * 适用于需要管理多个图表实例的场景
 *
 * 使用示例:
 * ```jsx
 * function Dashboard() {
 *   const { chartRefs, initChart, disposeChart, resizeAll } = useMultiCharts();
 *
 *   useEffect(() => {
 *     const chart1 = initChart('chart1');
 *     chart1?.setOption({ ... });
 *
 *     const chart2 = initChart('chart2');
 *     chart2?.setOption({ ... });
 *   }, []);
 *
 *   return (
 *     <>
 *       <div ref={ref => chartRefs.current['chart1'] = ref} />
 *       <div ref={ref => chartRefs.current['chart2'] = ref} />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns {Object} 图表管理方法
 */
export function useMultiCharts() {
  const chartRefs = useRef({});
  const chartInstances = useRef({});

  /**
   * 初始化指定 ID 的图表
   * @param {string} id - 图表唯一标识
   * @returns {Object} ECharts 实例
   */
  const initChart = (id) => {
    const el = chartRefs.current[id];
    if (!el) return null;

    // 如果已存在，先销毁
    if (chartInstances.current[id]) {
      chartInstances.current[id].dispose();
    }

    // 创建新实例
    chartInstances.current[id] = echarts.init(el);
    return chartInstances.current[id];
  };

  /**
   * 销毁指定图表
   * @param {string} id - 图表唯一标识
   */
  const disposeChart = (id) => {
    chartInstances.current[id]?.dispose();
    delete chartInstances.current[id];
  };

  /**
   * 销毁所有图表
   */
  const disposeAll = () => {
    Object.values(chartInstances.current).forEach(chart => chart?.dispose());
    chartInstances.current = {};
  };

  /**
   * 调整所有图表大小
   */
  const resizeAll = () => {
    Object.values(chartInstances.current).forEach(chart => chart?.resize());
  };

  /**
   * 获取指定图表实例
   * @param {string} id - 图表唯一标识
   * @returns {Object} ECharts 实例
   */
  const getChart = (id) => chartInstances.current[id];

  // 窗口 resize 和清理
  useEffect(() => {
    const handleResize = () => resizeAll();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      disposeAll();
    };
  }, []);

  return {
    chartRefs,
    initChart,
    disposeChart,
    disposeAll,
    resizeAll,
    getChart
  };
}

export default useECharts;
