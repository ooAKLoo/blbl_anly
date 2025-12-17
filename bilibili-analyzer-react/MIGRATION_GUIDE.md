# Vue 到 React 组件迁移指南

本文档提供了从 Vue 3 Composition API 到 React Hooks 的完整迁移方案和示例。

## 目录结构

```
bilibili-analyzer-react/src/
├── components/               # React 组件
│   ├── Sidebar.jsx
│   ├── NewScrapeDialog.jsx
│   ├── SettingsDialog.jsx
│   ├── HomePage.jsx
│   ├── UpDetailPage.jsx
│   ├── VideoFilterBar.jsx
│   ├── VideoDetailDrawer.jsx
│   ├── VirtualGrid.jsx
│   └── up-detail/
│       ├── DataAnalysis.jsx
│       ├── InsightReport.jsx
│       ├── GrowthJourney.jsx
│       ├── VideoList.jsx
│       └── growth-journey/
│           ├── HeroSection.jsx
│           ├── StoryTimeline.jsx
│           └── EndingSection.jsx
├── hooks/                    # React Hooks
│   ├── useECharts.js
│   ├── useVideoFilter.js
│   └── useVideoMetrics.js
├── utils/                    # 工具函数
│   ├── index.js
│   ├── constants.js
│   └── theme.js
├── App.jsx                   # 主应用组件
└── main.jsx                  # 入口文件
```

## 迁移对照表

### 1. 基础语法转换

| Vue 3 | React | 说明 |
|-------|-------|------|
| `<template>` | JSX return | 模板转JSX |
| `v-if` | `{condition && <Component />}` | 条件渲染 |
| `v-else-if` / `v-else` | 三元或多个条件 | 多条件渲染 |
| `v-for` | `{array.map(item => <Component key={item.id} />)}` | 列表渲染 |
| `v-model` | `value={state} onChange={setState}` | 双向绑定 |
| `@click` | `onClick` | 事件绑定 |
| `:prop` | `prop={value}` | Props传递 |
| `class` | `className` | 样式类名 |
| `:style` | `style={{}}` | 内联样式 |
| `ref` | `useRef()` | DOM引用 |

### 2. Composition API → React Hooks

| Vue Composition API | React Hooks | 说明 |
|---------------------|-------------|------|
| `ref(value)` | `useState(value)` | 响应式状态 |
| `reactive({})` | `useState({})` | 对象状态 |
| `computed(() => {})` | `useMemo(() => {}, [deps])` | 计算属性 |
| `watch(source, callback)` | `useEffect(() => {}, [deps])` | 侦听器 |
| `watchEffect(callback)` | `useEffect(callback, [deps])` | 立即执行侦听 |
| `onMounted(callback)` | `useEffect(() => {}, [])` | 挂载时执行 |
| `onUnmounted(callback)` | `useEffect(() => { return cleanup }, [])` | 卸载时执行 |
| `nextTick(callback)` | `setTimeout(callback, 0)` 或使用 flushSync | 下一帧执行 |
| `toRef(obj, 'key')` | 直接使用状态 | 转换为ref |
| `toRefs(obj)` | 解构useState对象 | 转换多个ref |
| `defineProps` | 函数参数 `function Component(props)` | Props定义 |
| `defineEmits` | Props回调 `props.onClick` | 事件发射 |
| `defineExpose` | `useImperativeHandle` | 暴露方法 |

### 3. 特殊指令转换

#### v-model 转换示例

Vue:
```vue
<input v-model="text" />
```

React:
```jsx
<input value={text} onChange={(e) => setText(e.target.value)} />
```

#### v-show 转换示例

Vue:
```vue
<div v-show="visible">Content</div>
```

React:
```jsx
<div style={{ display: visible ? 'block' : 'none' }}>Content</div>
```

#### v-for with v-if 转换示例

Vue:
```vue
<div v-for="item in items" :key="item.id" v-if="item.active">
  {{ item.name }}
</div>
```

React:
```jsx
{items
  .filter(item => item.active)
  .map(item => <div key={item.id}>{item.name}</div>)
}
```

### 4. 生命周期对照

| Vue 生命周期 | React 等价 |
|-------------|-----------|
| `onBeforeMount` | `useEffect(() => {}, [])` (组件即将渲染) |
| `onMounted` | `useEffect(() => {}, [])` |
| `onBeforeUpdate` | `useEffect(() => {})` (无依赖数组) |
| `onUpdated` | `useEffect(() => {})` (无依赖数组) |
| `onBeforeUnmount` | `useEffect(() => { return () => {} }, [])` |
| `onUnmounted` | `useEffect(() => { return cleanup }, [])` |

### 5. 组件通信

#### Props 传递

Vue:
```vue
<script setup>
const props = defineProps({
  title: String,
  count: Number
});
</script>
```

React:
```jsx
function Component({ title, count }) {
  // 使用 title 和 count
}

// 或使用 PropTypes
Component.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number
};
```

#### Events 触发

Vue:
```vue
<script setup>
const emit = defineEmits(['update', 'delete']);

function handleClick() {
  emit('update', data);
}
</script>
```

React:
```jsx
function Component({ onUpdate, onDelete }) {
  function handleClick() {
    onUpdate(data);
  }

  return <button onClick={handleClick}>Click</button>;
}
```

#### Provide / Inject → Context

Vue:
```vue
// 提供
<script setup>
import { provide } from 'vue';
provide('key', value);
</script>

// 注入
<script setup>
import { inject } from 'vue';
const value = inject('key');
</script>
```

React:
```jsx
// 创建 Context
const MyContext = React.createContext(defaultValue);

// 提供
function ParentComponent() {
  return (
    <MyContext.Provider value={value}>
      <ChildComponent />
    </MyContext.Provider>
  );
}

// 使用
function ChildComponent() {
  const value = useContext(MyContext);
  return <div>{value}</div>;
}
```

## 迁移示例

### 示例 1: 简单组件 - NewScrapeDialog

**Vue 版本** (`NewScrapeDialog.vue`):
```vue
<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>添加 UP主</h2>
            <button class="close-btn" @click="close">×</button>
          </div>

          <div class="dialog-body">
            <div class="input-group">
              <label class="input-label">UP主 MID</label>
              <input
                v-model="localMid"
                type="text"
                class="input"
                placeholder="输入 UP主的 MID"
                :disabled="isLoading"
              />
            </div>

            <div v-if="isLoading" class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <span class="progress-text">{{ progressText }}</span>
            </div>
          </div>

          <div class="dialog-footer">
            <button v-if="!isLoading" class="btn btn-ghost" @click="close">取消</button>
            <button
              v-if="isLoading"
              class="btn btn-danger"
              @click="$emit('stop')"
            >
              停止
            </button>
            <button
              class="btn btn-primary"
              @click="startScrape"
              :disabled="!localMid || isLoading"
            >
              {{ isLoading ? '爬取中...' : '开始爬取' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  mid: [String, Number],
  isLoading: Boolean,
  progress: Object
});

const emit = defineEmits(['update:modelValue', 'start', 'stop']);

const localMid = ref(props.mid || '');

watch(() => props.mid, (val) => {
  localMid.value = val || '';
});

const progressPercent = computed(() => {
  if (!props.progress || props.progress.total === 0) return 0;
  return Math.round((props.progress.current / props.progress.total) * 100);
});

const progressText = computed(() => {
  if (!props.progress) return '';
  return `${props.progress.message} (${props.progress.current}/${props.progress.total})`;
});

function close() {
  if (!props.isLoading) {
    emit('update:modelValue', false);
  }
}

function startScrape() {
  if (!localMid.value) return;
  emit('start', { mid: localMid.value });
}
</script>
```

**React 版本** (`NewScrapeDialog.jsx`):
```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

function NewScrapeDialog({ visible, mid, isLoading, progress, onClose, onStart, onStop }) {
  const [localMid, setLocalMid] = useState(mid || '');

  useEffect(() => {
    setLocalMid(mid || '');
  }, [mid]);

  const progressPercent = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress]);

  const progressText = useMemo(() => {
    if (!progress) return '';
    return `${progress.message} (${progress.current}/${progress.total})`;
  }, [progress]);

  const close = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const startScrape = () => {
    if (!localMid) return;
    onStart({ mid: localMid });
  };

  if (!visible) return null;

  return createPortal(
    <div
      className={`dialog-overlay ${visible ? 'dialog-enter-active' : 'dialog-leave-active'}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>添加 UP主</h2>
          <button className="close-btn" onClick={close}>
            <X size={16} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="input-group">
            <label className="input-label">UP主 MID</label>
            <input
              value={localMid}
              onChange={(e) => setLocalMid(e.target.value)}
              type="text"
              className="input"
              placeholder="输入 UP主的 MID"
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span className="progress-text">{progressText}</span>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {!isLoading && (
            <button className="btn btn-ghost" onClick={close}>取消</button>
          )}
          {isLoading && (
            <button className="btn btn-danger" onClick={onStop}>
              停止
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={startScrape}
            disabled={!localMid || isLoading}
          >
            {isLoading ? '爬取中...' : '开始爬取'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NewScrapeDialog;
```

### 示例 2: useECharts Hook

**创建文件**: `src/hooks/useECharts.js`

```javascript
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
 * 更简单的 ECharts Hook - 只返回 ref
 * @returns {Object} { chartRef, initChart }
 */
export function useEChartsRef() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const initChart = () => {
    if (!chartRef.current) return null;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    return chartInstance.current;
  };

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

  return { chartRef, initChart, chartInstance: chartInstance.current };
}
```

### 示例 3: useVideoFilter Hook (已由 Vue 转换)

**创建文件**: `src/hooks/useVideoFilter.js`

```javascript
import { useState, useMemo } from 'react';
import { parseDurationMinutes } from '../utils';

/**
 * 视频筛选 Hook
 * 提供时间范围和时长筛选功能
 */
export function useVideoFilter(videos) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  /**
   * 根据时间范围获取起始日期
   */
  const getStartDate = (timeRange) => {
    if (timeRange === 'all') return null;

    const now = new Date();
    switch (timeRange) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'thisYear':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null;
    }
  };

  /**
   * 检查视频时长是否符合筛选条件
   */
  const matchesDuration = (video, durationFilter) => {
    if (durationFilter === 'all') return true;

    const minutes = parseDurationMinutes(video.duration);
    switch (durationFilter) {
      case 'short':
        return minutes < 5;
      case 'medium':
        return minutes >= 5 && minutes <= 20;
      case 'long':
        return minutes > 20;
      default:
        return true;
    }
  };

  /**
   * 筛选后的视频列表
   */
  const filteredVideos = useMemo(() => {
    let result = videos;

    // 时间范围筛选
    const startDate = getStartDate(selectedTimeRange);
    if (startDate) {
      result = result.filter(v => new Date(v.publish_time) >= startDate);
    }

    // 时长筛选
    if (selectedDuration !== 'all') {
      result = result.filter(v => matchesDuration(v, selectedDuration));
    }

    return result;
  }, [videos, selectedTimeRange, selectedDuration]);

  return {
    selectedTimeRange,
    setSelectedTimeRange,
    selectedDuration,
    setSelectedDuration,
    filteredVideos
  };
}
```

## 迁移检查清单

### 组件迁移检查项

- [ ] 移除所有 Vue 特定语法 (`v-if`, `v-for`, `v-model` 等)
- [ ] 将 `ref()` 转换为 `useState()`
- [ ] 将 `computed()` 转换为 `useMemo()`
- [ ] 将 `watch()` 转换为 `useEffect()`
- [ ] 移除所有 `.value` 访问
- [ ] 将 `@event` 转换为 `onEvent`
- [ ] 将 `:prop` 转换为 `prop={}`
- [ ] 将 `class` 转换为 `className`
- [ ] 转换内联样式为对象格式
- [ ] 使用 `createPortal` 替代 `<Teleport>`
- [ ] 处理 `<Transition>` 动画（使用 CSS 或第三方库）
- [ ] 将 `lucide-vue-next` 改为 `lucide-react`
- [ ] 检查并更新所有导入路径

### Hooks 迁移检查项

- [ ] 创建 `useECharts` hook
- [ ] 创建/迁移 `useVideoFilter` hook
- [ ] 创建/迁移 `useVideoMetrics` hook
- [ ] 创建其他必要的自定义 hooks

### 样式迁移检查项

- [ ] 保留所有 Tailwind CSS 类名
- [ ] 转换 scoped 样式为 CSS Modules 或 styled-components
- [ ] 检查动画和过渡效果

## 常见问题和解决方案

### 1. Teleport → createPortal

Vue 的 `<Teleport>` 对应 React 的 `createPortal`:

```jsx
import { createPortal } from 'react-dom';

function Dialog({ children }) {
  return createPortal(
    <div className="dialog">{children}</div>,
    document.body
  );
}
```

### 2. Transition → CSS 或动画库

Vue 的 `<Transition>` 可以用 CSS 类或第三方库实现:

```jsx
// 使用 CSS 类
<div className={`fade ${visible ? 'fade-enter' : 'fade-leave'}`}>
  {children}
</div>

// 或使用 react-transition-group
import { CSSTransition } from 'react-transition-group';

<CSSTransition in={visible} timeout={300} classNames="fade">
  <div>{children}</div>
</CSSTransition>
```

### 3. nextTick → setTimeout/flushSync

Vue 的 `nextTick()` 可以用以下方式替代:

```jsx
// 方式 1: setTimeout
setTimeout(() => {
  // 在下一帧执行
}, 0);

// 方式 2: flushSync (React 18+)
import { flushSync } from 'react-dom';

flushSync(() => {
  setState(newValue);
});
// 此时 DOM 已经更新
```

### 4. ECharts 集成

使用自定义 hook 管理 ECharts 实例:

```jsx
import { useEChartsRef } from '../hooks/useECharts';

function Chart() {
  const { chartRef, initChart } = useEChartsRef();

  useEffect(() => {
    const chart = initChart();
    if (!chart) return;

    chart.setOption({
      // ECharts 配置
    });
  }, [data]);

  return <div ref={chartRef} style={{ height: '400px' }} />;
}
```

### 5. 事件修饰符

Vue 的事件修饰符需要手动实现:

```jsx
// @click.stop → onClick with stopPropagation
<button onClick={(e) => {
  e.stopPropagation();
  handleClick();
}}>

// @click.prevent → onClick with preventDefault
<button onClick={(e) => {
  e.preventDefault();
  handleClick();
}}>

// @click.self → 检查 event.target
<div onClick={(e) => {
  if (e.target === e.currentTarget) {
    handleClick();
  }
}}>
```

## 迁移优先级建议

1. **第一批** (基础组件):
   - Sidebar.jsx
   - NewScrapeDialog.jsx
   - SettingsDialog.jsx
   - VideoFilterBar.jsx
   - VideoDetailDrawer.jsx

2. **第二批** (主要页面):
   - App.jsx
   - HomePage.jsx
   - UpDetailPage.jsx

3. **第三批** (复杂组件):
   - DataAnalysis.jsx
   - InsightReport.jsx
   - VirtualGrid.jsx
   - VideoList.jsx (up-detail)

4. **第四批** (特殊组件):
   - GrowthJourney.jsx
   - HeroSection.jsx
   - StoryTimeline.jsx
   - EndingSection.jsx

## 注意事项

1. **状态管理**: React 不会自动追踪依赖，确保 `useEffect` 的依赖数组正确
2. **性能优化**: 合理使用 `useMemo`, `useCallback`, `React.memo`
3. **ref 使用**: 不要在渲染中读取 ref.current，应在 useEffect 中使用
4. **异步更新**: setState 是异步的，连续调用时使用函数式更新
5. **清理副作用**: useEffect 返回清理函数，避免内存泄漏

## 相关资源

- [React 官方文档](https://react.dev/)
- [React Hooks 详解](https://react.dev/reference/react)
- [从 Vue 迁移到 React](https://react.dev/learn/you-might-not-need-an-effect)
- [ECharts React 集成](https://echarts.apache.org/handbook/zh/how-to/cross-platform/react)
- [lucide-react 图标库](https://lucide.dev/guide/packages/lucide-react)

---

**迁移状态**:

- ✅ 工具函数 (utils) 已完成
- ✅ 常量配置 (constants) 已完成
- ✅ 主题配置 (theme) 已完成
- ⏳ Hooks 待创建
- ⏳ 组件待迁移

**下一步**: 根据本指南和示例，按优先级逐个迁移组件。
