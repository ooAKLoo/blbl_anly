<template>
  <div ref="containerRef" class="virtual-grid-container" @scroll="onScroll">
    <div class="virtual-grid-spacer" :style="{ height: totalHeight + 'px' }">
      <div
        v-for="item in visibleItems"
        :key="item.data[keyField]"
        class="virtual-grid-item"
        :style="{
          position: 'absolute',
          left: item.left + 'px',
          top: item.top + 'px',
          width: item.width + 'px',
          height: item.height + 'px'
        }"
      >
        <slot :item="item.data" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  keyField: { type: String, default: 'id' },
  minColumnWidth: { type: Number, default: 280 },
  gap: { type: Number, default: 16 },
  itemHeight: { type: Number, default: 220 },
  buffer: { type: Number, default: 3 }
});

const containerRef = ref(null);
const scrollTop = ref(0);
const containerWidth = ref(0);
const containerHeight = ref(0);

// 计算列数和实际列宽
const columns = computed(() => {
  if (!containerWidth.value) return 1;
  const cols = Math.floor((containerWidth.value + props.gap) / (props.minColumnWidth + props.gap));
  return Math.max(1, cols);
});

const columnWidth = computed(() => {
  const totalGap = (columns.value - 1) * props.gap;
  return (containerWidth.value - totalGap) / columns.value;
});

// 计算每个 item 的位置（标准网格布局）
const itemPositions = computed(() => {
  const positions = [];
  const cols = columns.value;

  props.items.forEach((item, index) => {
    const rowIndex = Math.floor(index / cols);
    const columnIndex = index % cols;

    const left = columnIndex * (columnWidth.value + props.gap);
    const top = rowIndex * (props.itemHeight + props.gap);

    positions.push({
      data: item,
      index,
      left,
      top,
      width: columnWidth.value,
      height: props.itemHeight
    });
  });

  return positions;
});

// 总高度
const totalHeight = computed(() => {
  if (props.items.length === 0) return 0;
  const totalRows = Math.ceil(props.items.length / columns.value);
  return totalRows * props.itemHeight + (totalRows - 1) * props.gap;
});

// 可见区域的 items
const visibleItems = computed(() => {
  const start = scrollTop.value - props.buffer * props.itemHeight;
  const end = scrollTop.value + containerHeight.value + props.buffer * props.itemHeight;

  return itemPositions.value.filter(item => {
    const itemBottom = item.top + item.height;
    return itemBottom >= start && item.top <= end;
  });
});

function onScroll() {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
}

function updateContainerSize() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    containerHeight.value = containerRef.value.clientHeight;
  }
}

let resizeObserver = null;

onMounted(() => {
  updateContainerSize();
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize();
  });
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

watch(() => props.items, () => {
  nextTick(updateContainerSize);
}, { deep: true });

// 暴露方法供外部调用
defineExpose({
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0;
    }
  }
});
</script>

<style scoped>
.virtual-grid-container {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  position: relative;
}

.virtual-grid-spacer {
  position: relative;
  width: 100%;
}

.virtual-grid-item {
  will-change: transform;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
