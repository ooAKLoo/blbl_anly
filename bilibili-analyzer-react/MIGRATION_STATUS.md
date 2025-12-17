# 组件迁移状态跟踪

## 📊 总体进度

- **总计**: 17个组件
- **已完成**: 0个
- **进行中**: 0个
- **待迁移**: 17个
- **完成率**: 0%

## ✅ 已完成

### 基础设施
- [x] `src/utils/index.js` - 工具函数
- [x] `src/utils/constants.js` - 常量配置
- [x] `src/utils/theme.js` - 主题配置
- [x] `src/hooks/useVideoFilter.js` - 视频筛选 Hook
- [x] `src/hooks/useVideoMetrics.js` - 视频指标 Hook
- [x] `src/hooks/useGrowthMetrics.js` - 成长指标 Hook
- [x] `MIGRATION_GUIDE.md` - 迁移指南文档

## 🔄 第一批：基础组件 (优先级最高)

### 1. Sidebar.jsx
- [ ] 状态管理 (collapsed, contextMenu)
- [ ] 事件处理 (切换折叠、右键菜单)
- [ ] createPortal 实现上下文菜单
- [ ] 样式保持

**迁移要点**:
- `ref()` → `useState()`
- `onMounted/onUnmounted` → `useEffect` (事件监听器)
- `defineExpose` → 如需要可用 `useImperativeHandle`
- `<Teleport>` → `createPortal`

### 2. NewScrapeDialog.jsx
- [ ] 对话框显示/隐藏控制
- [ ] 表单状态管理
- [ ] 进度条计算
- [ ] createPortal 实现

**迁移要点**:
- `v-model` → `value + onChange`
- `computed()` → `useMemo()`
- `watch()` → `useEffect()`
- `:style` → `style={{}}`

### 3. SettingsDialog.jsx
- [ ] 对话框控制
- [ ] Cookie 表单管理
- [ ] createPortal 实现

**迁移要点**:
- 与 NewScrapeDialog 类似
- 注意 `v-model` 双向绑定转换

### 4. VideoFilterBar.jsx
- [ ] 筛选器按钮组
- [ ] Props 事件触发

**迁移要点**:
- 相对简单，主要是事件处理转换
- `@update:timeRange` → `onUpdateTimeRange`

### 5. VideoDetailDrawer.jsx
- [ ] 抽屉显示/隐藏
- [ ] 视频列表渲染
- [ ] 计算平均播放量
- [ ] createPortal 实现

**迁移要点**:
- `v-for` → `map()`
- `computed()` → `useMemo()`
- 图标库从 `lucide-vue-next` → `lucide-react`

## 🔄 第二批：主要页面

### 6. App.jsx (核心)
- [ ] 全局状态管理
- [ ] 侧边栏、对话框控制
- [ ] Tauri API 调用
- [ ] 事件监听 (scrape-progress)
- [ ] 路由/视图切换

**迁移要点**:
- 大量状态管理，建议使用 Context 或状态管理库
- `listen()` 在 useEffect 中处理
- `nextTick()` 可能需要改为 `setTimeout` 或 `flushSync`

### 7. HomePage.jsx
- [ ] UP主选择和对比
- [ ] 下拉菜单状态
- [ ] 时间范围筛选
- [ ] 多个图表渲染 (散点图、词云)
- [ ] 统计表格

**迁移要点**:
- 多个 ECharts 实例，使用 `useEChartsRef` hook
- 词云需要 `echarts-wordcloud`
- HoverCard 可能需要 `@radix-ui/react-hover-card`
- 复杂计算用 `useMemo`

### 8. UpDetailPage.jsx
- [ ] Tab 切换
- [ ] 子组件集成
- [ ] 筛选器状态
- [ ] GrowthJourney 全屏覆盖

**迁移要点**:
- 状态提升或使用 Context 管理筛选器
- 全屏覆盖层用固定定位 + Portal

## 🔄 第三批：复杂组件

### 9. VirtualGrid.jsx
- [ ] 虚拟滚动实现
- [ ] ResizeObserver 集成
- [ ] 动态列数计算
- [ ] Slot 渲染

**迁移要点**:
- `<slot>` → render props 或 children 函数
- 计算属性全部改为 `useMemo`
- ResizeObserver 在 useEffect 中管理

### 10. DataAnalysis.vue (最复杂)
- [ ] 筛选器集成
- [ ] 多个数据指标计算
- [ ] 11个 ECharts 图表
- [ ] 图表交互 (点击事件)
- [ ] useVideoMetrics hook 集成

**迁移要点**:
- 每个图表一个 ref + useEffect
- 图表渲染函数保持独立
- 使用 `useEChartsRef` hook
- Drawer 打开事件用回调传递

### 11. VideoList.jsx (up-detail)
- [ ] 虚拟滚动视频列表
- [ ] 排序功能
- [ ] 搜索功能

**迁移要点**:
- 整合 VirtualGrid 组件
- 搜索和排序用 `useMemo` 优化

### 12. InsightReport.jsx
- [ ] AI 分析报告生成
- [ ] Markdown 渲染
- [ ] 流式响应处理
- [ ] 复制功能

**迁移要点**:
- 流式 API 调用在 useEffect 中
- 使用 `react-markdown` 渲染
- 复制功能用 Clipboard API

## 🔄 第四批：GrowthJourney 系列

### 13. GrowthJourney.jsx
- [ ] 滚动动画控制
- [ ] 子组件集成
- [ ] IntersectionObserver

**迁移要点**:
- Scroll 监听在 useEffect 中
- 动画状态用 useState 管理

### 14. HeroSection.jsx
- [ ] 英雄区渲染
- [ ] 动画效果

### 15. StoryTimeline.jsx
- [ ] 时间线渲染
- [ ] 里程碑事件
- [ ] 滚动触发动画

### 16. EndingSection.jsx
- [ ] 结束语渲染
- [ ] 统计汇总

## 📝 迁移检查清单

每个组件迁移完成后请确认:

- [ ] 移除所有 Vue 特定语法
- [ ] 转换所有响应式API
- [ ] 更新所有导入语句
- [ ] 保持所有 Tailwind 类名
- [ ] 测试所有交互功能
- [ ] 检查性能 (必要时使用 memo, useMemo, useCallback)
- [ ] 验证样式一致性
- [ ] 清理 console 输出

## 🚀 快速开始

1. **阅读迁移指南**: `MIGRATION_GUIDE.md`
2. **从简单组件开始**: VideoFilterBar.jsx 或 SettingsDialog.jsx
3. **测试每个组件**: 迁移后立即测试
4. **提交版本控制**: 每个组件迁移完成后提交

## 📚 参考资源

- [Vue to React 官方指南](https://react.dev/learn/you-might-not-need-an-effect)
- [ECharts React 集成](https://echarts.apache.org/handbook/zh/how-to/cross-platform/react)
- [Radix UI](https://www.radix-ui.com/) - 无样式组件库 (HoverCard等)
- [lucide-react](https://lucide.dev/guide/packages/lucide-react) - 图标库

## ⚠️ 注意事项

1. **不要批量迁移**: 一次迁移一个组件，测试通过后再继续
2. **保持原有功能**: 迁移过程中不要添加新功能
3. **样式优先**: 确保 Tailwind 类名完全一致
4. **测试交互**: 每个按钮、表单、图表都要测试
5. **性能监控**: 注意大列表和图表的渲染性能

---

**最后更新**: 2025-12-17
**下一步**: 开始迁移 VideoFilterBar.jsx (最简单的组件)
