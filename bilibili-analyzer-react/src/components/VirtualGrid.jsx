import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';

/**
 * VirtualGrid 虚拟滚动网格组件
 *
 * 用于优化大量列表的渲染性能，只渲染可见区域内的项目
 *
 * @param {Array} items - 要渲染的数据数组
 * @param {string} keyField - 用作 key 的字段名，默认 'id'
 * @param {number} minColumnWidth - 每列最小宽度（px），默认 280
 * @param {number} gap - 项目间距（px），默认 16
 * @param {number} itemHeight - 每个项目的高度（px），默认 220
 * @param {number} buffer - 缓冲区倍数，默认 3（渲染视口外的额外行数）
 * @param {Function} children - 渲染函数，接收 { item, index } 作为参数
 * @param {string} className - 额外的 CSS 类名
 */
const VirtualGrid = forwardRef(({
  items = [],
  keyField = 'id',
  minColumnWidth = 280,
  gap = 16,
  itemHeight = 220,
  buffer = 3,
  children,
  className = ''
}, ref) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 计算列数
  const columns = useMemo(() => {
    if (!containerWidth) return 1;
    const cols = Math.floor((containerWidth + gap) / (minColumnWidth + gap));
    return Math.max(1, cols);
  }, [containerWidth, gap, minColumnWidth]);

  // 计算实际列宽
  const columnWidth = useMemo(() => {
    const totalGap = (columns - 1) * gap;
    return (containerWidth - totalGap) / columns;
  }, [containerWidth, columns, gap]);

  // 计算每个 item 的位置（标准网格布局）
  const itemPositions = useMemo(() => {
    const positions = [];

    items.forEach((item, index) => {
      const rowIndex = Math.floor(index / columns);
      const columnIndex = index % columns;

      const left = columnIndex * (columnWidth + gap);
      const top = rowIndex * (itemHeight + gap);

      positions.push({
        data: item,
        index,
        left,
        top,
        width: columnWidth,
        height: itemHeight
      });
    });

    return positions;
  }, [items, columns, columnWidth, gap, itemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0;
    const totalRows = Math.ceil(items.length / columns);
    return totalRows * itemHeight + (totalRows - 1) * gap;
  }, [items.length, columns, itemHeight, gap]);

  // 计算可见区域的 items
  const visibleItems = useMemo(() => {
    const start = scrollTop - buffer * itemHeight;
    const end = scrollTop + containerHeight + buffer * itemHeight;

    return itemPositions.filter(item => {
      const itemBottom = item.top + item.height;
      return itemBottom >= start && item.top <= end;
    });
  }, [scrollTop, containerHeight, buffer, itemHeight, itemPositions]);

  // 滚动事件处理
  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 更新容器尺寸
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  // 监听容器尺寸变化
  useEffect(() => {
    updateContainerSize();

    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateContainerSize]);

  // 监听 items 变化
  useEffect(() => {
    updateContainerSize();
  }, [items, updateContainerSize]);

  // 暴露 scrollToTop 方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: () => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className={`virtual-grid-container overflow-y-auto overflow-x-hidden h-full relative ${className}`}
      onScroll={onScroll}
    >
      <div
        className="virtual-grid-spacer relative w-full"
        style={{ height: `${totalHeight}px` }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.data[keyField]}
            className="virtual-grid-item absolute box-border overflow-hidden"
            style={{
              left: `${item.left}px`,
              top: `${item.top}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
              willChange: 'transform'
            }}
          >
            {children({ item: item.data, index: item.index })}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualGrid.displayName = 'VirtualGrid';

export default VirtualGrid;
