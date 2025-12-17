<template>
  <div class="space-y-8">
    <!-- 筛选器 -->
    <VideoFilterBar
      :time-range="timeRange"
      :duration="duration"
      @update:time-range="$emit('update:timeRange', $event)"
      @update:duration="$emit('update:duration', $event)"
    >
      <template #right>
        <button
          @click="copyAnalysisReport"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Copy :size="14" />
          {{ copySuccess ? '已复制' : '复制报告' }}
        </button>
      </template>
    </VideoFilterBar>

    <!-- 分析报告内容 -->
    <div v-if="videos.length > 0" class="space-y-8">

      <!-- ==================== 第一层：核心结论 ==================== -->
      <section class="report-card bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">账号诊断结论</h2>
            <p class="text-neutral-500 text-xs mt-1">{{ videos.length }} 个视频 · {{ dataTimeRange }}</p>
          </div>
        </div>
        <p class="text-base text-neutral-200 leading-relaxed">{{ reportSummary.headline }}</p>
      </section>

      <!-- ==================== 第二层：关键发现 + 行动建议 ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 关键发现 -->
        <section class="report-card">
          <h2 class="section-title">
            <Lightbulb :size="16" class="text-amber-500" />
            关键发现
          </h2>
          <div class="space-y-4">
            <div v-for="(finding, index) in reportFindings" :key="index" class="flex items-start gap-3">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                finding.type === 'positive' ? 'bg-emerald-50 text-emerald-500' :
                finding.type === 'negative' ? 'bg-rose-50 text-rose-500' :
                'bg-blue-50 text-blue-500'
              ]">
                <component :is="finding.icon" :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-neutral-900">{{ finding.title }}</h3>
                <!-- 带 HoverCard 的描述 -->
                <template v-if="finding.detailKey && findingDetails[finding.detailKey]">
                  <HoverCardRoot :open-delay="200" :close-delay="100">
                    <HoverCardTrigger as-child>
                      <p class="text-sm text-neutral-500 mt-0.5 leading-relaxed cursor-pointer border-b border-dashed border-neutral-300 hover:border-neutral-500 inline-flex items-center gap-1 transition-colors">
                        {{ finding.description }}
                        <Info :size="12" class="text-neutral-400" />
                      </p>
                    </HoverCardTrigger>
                    <HoverCardPortal>
                      <HoverCardContent
                        :side-offset="8"
                        side="bottom"
                        align="start"
                        class="z-50 w-80 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                      >
                        <!-- 黄金发布时间详情 -->
                        <template v-if="finding.detailKey === 'publishTime'">
                          <div class="p-3 border-b border-neutral-100 bg-neutral-50">
                            <span class="text-sm font-medium text-neutral-700">黄金发布时间分析</span>
                            <p class="text-xs text-neutral-500 mt-1">基于播放量 TOP 30% 的视频统计</p>
                          </div>
                          <div class="p-3">
                            <div class="mb-3">
                              <div class="text-xs text-neutral-500 mb-2">高播放时段分布</div>
                              <div class="flex flex-wrap gap-1.5">
                                <span
                                  v-for="(count, slot) in findingDetails.publishTime.slots"
                                  :key="slot"
                                  class="px-2 py-1 rounded-md text-xs font-medium"
                                  :class="count >= 3 ? 'bg-emerald-100 text-emerald-700' : count >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'"
                                >
                                  {{ slot }} ({{ count }})
                                </span>
                              </div>
                            </div>
                            <div>
                              <div class="text-xs text-neutral-500 mb-2">代表视频</div>
                              <div class="space-y-2 max-h-40 overflow-y-auto">
                                <div
                                  v-for="video in findingDetails.publishTime.topVideos"
                                  :key="video.bvid"
                                  class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                  @click="openVideo(video)"
                                >
                                  <img
                                    :src="getImageUrl(video.cover)"
                                    class="w-16 h-9 rounded object-cover flex-shrink-0"
                                    referrerpolicy="no-referrer"
                                  />
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                                    <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                      <span class="flex items-center gap-0.5"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                      <span>{{ formatPublishSlot(video.publish_time) }}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>

                        <!-- 最佳内容时长详情 -->
                        <template v-else-if="finding.detailKey === 'duration'">
                          <div class="p-3 border-b border-neutral-100 bg-neutral-50">
                            <span class="text-sm font-medium text-neutral-700">最佳时长分析</span>
                            <p class="text-xs text-neutral-500 mt-1">各时长区间的视频表现对比</p>
                          </div>
                          <div class="p-3">
                            <div class="mb-3">
                              <div class="text-xs text-neutral-500 mb-2">时长区间对比</div>
                              <div class="space-y-1.5">
                                <div
                                  v-for="bin in findingDetails.duration.bins"
                                  :key="bin.label"
                                  class="flex items-center gap-2"
                                >
                                  <span class="text-xs text-neutral-600 w-20">{{ bin.label }}</span>
                                  <div class="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                      class="h-full rounded-full transition-all"
                                      :class="bin.isBest ? 'bg-emerald-500' : 'bg-blue-300'"
                                      :style="{ width: (bin.avgPlay / findingDetails.duration.maxAvgPlay * 100) + '%' }"
                                    ></div>
                                  </div>
                                  <span class="text-xs font-medium text-neutral-700 w-16 text-right">{{ formatNumber(bin.avgPlay) }}</span>
                                  <span class="text-[10px] text-neutral-400 w-8">({{ bin.count }}个)</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div class="text-xs text-neutral-500 mb-2">该时长代表视频</div>
                              <div class="space-y-2 max-h-32 overflow-y-auto">
                                <div
                                  v-for="video in findingDetails.duration.topVideos"
                                  :key="video.bvid"
                                  class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                  @click="openVideo(video)"
                                >
                                  <img
                                    :src="getImageUrl(video.cover)"
                                    class="w-16 h-9 rounded object-cover flex-shrink-0"
                                    referrerpolicy="no-referrer"
                                  />
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                                    <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                      <span class="flex items-center gap-0.5"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                      <span>{{ video.duration }}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>

                        <!-- 爆款视频详情 -->
                        <template v-else-if="finding.detailKey === 'hitVideos'">
                          <div class="p-3 border-b border-neutral-100 bg-neutral-50">
                            <span class="text-sm font-medium text-neutral-700">爆款视频分析</span>
                            <p class="text-xs text-neutral-500 mt-1">播放量超过均值 2 倍的视频</p>
                          </div>
                          <div class="p-3">
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                              <div
                                v-for="video in findingDetails.hitVideos.videos"
                                :key="video.bvid"
                                class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                                @click="openVideo(video)"
                              >
                                <img
                                  :src="getImageUrl(video.cover)"
                                  class="w-16 h-9 rounded object-cover flex-shrink-0"
                                  referrerpolicy="no-referrer"
                                />
                                <div class="flex-1 min-w-0">
                                  <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                                  <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                    <span class="flex items-center gap-0.5 text-amber-600 font-medium"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                    <span>{{ video.duration }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>

                        <!-- 趋势详情 -->
                        <template v-else-if="finding.detailKey === 'trend'">
                          <div class="p-3 border-b border-neutral-100 bg-neutral-50">
                            <span class="text-sm font-medium text-neutral-700">趋势分析</span>
                            <p class="text-xs text-neutral-500 mt-1">前后期视频表现对比</p>
                          </div>
                          <div class="p-3">
                            <div class="grid grid-cols-2 gap-3 mb-3">
                              <div class="p-2 bg-neutral-50 rounded-lg">
                                <div class="text-xs text-neutral-500">前期均播放</div>
                                <div class="text-lg font-semibold text-neutral-700">{{ formatNumber(findingDetails.trend.firstAvg) }}</div>
                                <div class="text-[10px] text-neutral-400">{{ findingDetails.trend.firstCount }} 个视频</div>
                              </div>
                              <div class="p-2 rounded-lg" :class="findingDetails.trend.changeRate > 0 ? 'bg-emerald-50' : 'bg-rose-50'">
                                <div class="text-xs text-neutral-500">后期均播放</div>
                                <div class="text-lg font-semibold" :class="findingDetails.trend.changeRate > 0 ? 'text-emerald-600' : 'text-rose-600'">{{ formatNumber(findingDetails.trend.secondAvg) }}</div>
                                <div class="text-[10px]" :class="findingDetails.trend.changeRate > 0 ? 'text-emerald-500' : 'text-rose-500'">
                                  {{ findingDetails.trend.changeRate > 0 ? '+' : '' }}{{ findingDetails.trend.changeRate.toFixed(0) }}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>
                      </HoverCardContent>
                    </HoverCardPortal>
                  </HoverCardRoot>
                </template>
                <!-- 普通描述 -->
                <p v-else class="text-sm text-neutral-500 mt-0.5 leading-relaxed">{{ finding.description }}</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- ==================== 第三层：数据洞察详情 ==================== -->
      <section class="report-card">
        <h2 class="section-title">
          <BarChart3 :size="16" class="text-violet-500" />
          数据洞察
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(insight, index) in reportInsights" :key="index" class="flex items-start gap-4">
            <div class="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <component :is="insight.icon" :size="18" class="text-neutral-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-sm font-medium text-neutral-900">{{ insight.title }}</h3>
                <span class="text-sm font-semibold text-blue-600 tabular-nums">{{ insight.metric }}</span>
              </div>
              <p class="text-sm text-neutral-500 leading-relaxed">{{ insight.description }}</p>
              <div v-if="insight.details" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="(detail, i) in insight.details"
                  :key="i"
                  class="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded"
                >
                  {{ detail }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 问题数据诊断 ==================== -->
      <section v-if="problemDataAnalysis" class="report-card border border-amber-100">
        <h2 class="section-title">
          <AlertTriangle :size="16" class="text-amber-500" />
          问题数据诊断
        </h2>
        <p class="text-xs text-neutral-500 -mt-2 mb-4">以下数据需要特别关注，可能是内容策略的改进方向</p>

        <div class="space-y-6">
          <!-- 低于平均表现分析 -->
          <div v-if="problemDataAnalysis.belowAvg" class="problem-block">
            <div class="problem-header">
              <div class="problem-icon amber">
                <TrendingDown :size="16" />
              </div>
              <div>
                <h3 class="problem-title">低于平均表现</h3>
                <HoverCardRoot :open-delay="200" :close-delay="100">
                  <HoverCardTrigger as-child>
                    <p class="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-amber-500 inline-flex items-center gap-1 transition-colors">
                      <strong>{{ problemDataAnalysis.belowAvg.count }}</strong> 个视频 ({{ problemDataAnalysis.belowAvg.ratio }}%) 播放量低于均值
                      <Info :size="12" class="text-neutral-400" />
                    </p>
                  </HoverCardTrigger>
                  <HoverCardPortal>
                    <HoverCardContent
                      :side-offset="8"
                      side="bottom"
                      align="start"
                      class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                    >
                      <div class="p-3 border-b border-neutral-100 bg-amber-50">
                        <span class="text-sm font-medium text-amber-800">低于平均表现的视频</span>
                        <p class="text-xs text-amber-600 mt-1">共 {{ problemDataAnalysis.belowAvg.count }} 个，播放量 &lt; {{ formatNumber(problemDataAnalysis.belowAvg.threshold) }}</p>
                      </div>
                      <div class="p-3 max-h-64 overflow-y-auto">
                        <div class="space-y-2">
                          <div
                            v-for="video in problemDataAnalysis.belowAvg.videos"
                            :key="video.bvid"
                            class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                            @click="openVideo(video)"
                          >
                            <img
                              :src="getImageUrl(video.cover)"
                              class="w-16 h-9 rounded object-cover flex-shrink-0"
                              referrerpolicy="no-referrer"
                            />
                            <div class="flex-1 min-w-0">
                              <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                              <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                <span class="flex items-center gap-0.5 text-amber-600"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                <span>{{ video.publish_time.slice(0, 10) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCardPortal>
                </HoverCardRoot>
              </div>
              <div class="ml-auto text-right">
                <div class="text-lg font-bold text-amber-600 tabular-nums">{{ problemDataAnalysis.belowAvg.ratio }}%</div>
                <div class="text-xs text-neutral-400">占比</div>
              </div>
            </div>

            <div class="problem-stats">
              <div class="stat-item">
                <span class="stat-label">阈值</span>
                <span class="stat-value">&lt; {{ formatNumber(problemDataAnalysis.belowAvg.threshold) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">播放量贡献</span>
                <span class="stat-value text-amber-600">仅 {{ problemDataAnalysis.belowAvg.playContribution }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均播放</span>
                <span class="stat-value">{{ formatNumber(problemDataAnalysis.belowAvg.avgPlay) }}</span>
              </div>
            </div>

            <!-- 共性特征 -->
            <div v-if="problemDataAnalysis.belowAvg.features.length > 0" class="problem-features">
              <p class="text-xs text-neutral-500 mb-2">可能的共性特征：</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(feature, i) in problemDataAnalysis.belowAvg.features" :key="i" class="feature-tag amber">
                  {{ feature }}
                </span>
              </div>
            </div>
          </div>

          <!-- 数据波动分析 -->
          <div v-if="problemDataAnalysis.volatility" class="problem-block">
            <div class="problem-header">
              <div class="problem-icon blue">
                <Activity :size="16" />
              </div>
              <div>
                <h3 class="problem-title">数据波动分析</h3>
                <p class="problem-subtitle">
                  波动{{ problemDataAnalysis.volatility.level === 'high' ? '较大' : problemDataAnalysis.volatility.level === 'medium' ? '适中' : '较小' }}，
                  变异系数 {{ problemDataAnalysis.volatility.cv }}%
                </p>
              </div>
              <div class="ml-auto">
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  problemDataAnalysis.volatility.level === 'high' ? 'bg-amber-100 text-amber-700' :
                  problemDataAnalysis.volatility.level === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                ]">
                  {{ problemDataAnalysis.volatility.level === 'high' ? '高波动' : problemDataAnalysis.volatility.level === 'medium' ? '中等波动' : '低波动' }}
                </span>
              </div>
            </div>

            <div class="problem-stats">
              <div class="stat-item">
                <span class="stat-label">最高播放</span>
                <span class="stat-value text-emerald-600">{{ formatNumber(problemDataAnalysis.volatility.max) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最低播放</span>
                <span class="stat-value text-rose-600">{{ formatNumber(problemDataAnalysis.volatility.min) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">极差倍数</span>
                <span class="stat-value">{{ problemDataAnalysis.volatility.range }}x</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">中位数</span>
                <span class="stat-value">{{ formatNumber(problemDataAnalysis.volatility.median) }}</span>
              </div>
            </div>

            <p class="text-xs text-neutral-500 mt-3 leading-relaxed">
              {{ problemDataAnalysis.volatility.interpretation }}
            </p>
          </div>

          <!-- 极端异常数据点 -->
          <div v-if="problemDataAnalysis.outliers && problemDataAnalysis.outliers.low.length > 0" class="problem-block">
            <div class="problem-header">
              <div class="problem-icon rose">
                <AlertCircle :size="16" />
              </div>
              <div>
                <h3 class="problem-title">极端低值视频</h3>
                <HoverCardRoot :open-delay="200" :close-delay="100">
                  <HoverCardTrigger as-child>
                    <p class="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-rose-500 inline-flex items-center gap-1 transition-colors">
                      <strong>{{ problemDataAnalysis.outliers.low.length }}</strong> 个视频播放量显著低于正常范围
                      <Info :size="12" class="text-neutral-400" />
                    </p>
                  </HoverCardTrigger>
                  <HoverCardPortal>
                    <HoverCardContent
                      :side-offset="8"
                      side="bottom"
                      align="start"
                      class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                    >
                      <div class="p-3 border-b border-neutral-100 bg-rose-50">
                        <span class="text-sm font-medium text-rose-800">极端低值视频</span>
                        <p class="text-xs text-rose-600 mt-1">低于 Q1 - 1.5×IQR 的异常数据点</p>
                      </div>
                      <div class="p-3 max-h-64 overflow-y-auto">
                        <div class="space-y-2">
                          <div
                            v-for="video in problemDataAnalysis.outliers.low"
                            :key="video.bvid"
                            class="flex items-start gap-2 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 cursor-pointer transition-colors"
                            @click="openVideo(video)"
                          >
                            <img
                              :src="getImageUrl(video.cover)"
                              class="w-16 h-9 rounded object-cover flex-shrink-0"
                              referrerpolicy="no-referrer"
                            />
                            <div class="flex-1 min-w-0">
                              <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                              <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                <span class="flex items-center gap-0.5 text-rose-600"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                <span>{{ video.publish_time.slice(0, 10) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCardPortal>
                </HoverCardRoot>
              </div>
              <div class="ml-auto text-right">
                <div class="text-lg font-bold text-rose-600 tabular-nums">{{ problemDataAnalysis.outliers.low.length }}</div>
                <div class="text-xs text-neutral-400">个视频</div>
              </div>
            </div>

            <p v-if="problemDataAnalysis.outliers.lowFeatures.length > 0" class="text-xs text-neutral-500 mt-3">
              这些视频的共性：{{ problemDataAnalysis.outliers.lowFeatures.join('、') }}
            </p>
          </div>

          <!-- 低互动高播放（流量陷阱） -->
          <div v-if="problemDataAnalysis.lowEngagement && problemDataAnalysis.lowEngagement.count > 0" class="problem-block">
            <div class="problem-header">
              <div class="problem-icon purple">
                <MessageSquareOff :size="16" />
              </div>
              <div>
                <h3 class="problem-title">流量陷阱内容</h3>
                <HoverCardRoot :open-delay="200" :close-delay="100">
                  <HoverCardTrigger as-child>
                    <p class="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-purple-500 inline-flex items-center gap-1 transition-colors">
                      <strong>{{ problemDataAnalysis.lowEngagement.count }}</strong> 个视频高播放但低互动
                      <Info :size="12" class="text-neutral-400" />
                    </p>
                  </HoverCardTrigger>
                  <HoverCardPortal>
                    <HoverCardContent
                      :side-offset="8"
                      side="bottom"
                      align="start"
                      class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                    >
                      <div class="p-3 border-b border-neutral-100 bg-purple-50">
                        <span class="text-sm font-medium text-purple-800">流量陷阱内容</span>
                        <p class="text-xs text-purple-600 mt-1">播放量高于均值但互动率低于均值的 50%</p>
                      </div>
                      <div class="p-3 max-h-64 overflow-y-auto">
                        <div class="space-y-2">
                          <div
                            v-for="video in problemDataAnalysis.lowEngagement.videos"
                            :key="video.bvid"
                            class="flex items-start gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                            @click="openVideo(video)"
                          >
                            <img
                              :src="getImageUrl(video.cover)"
                              class="w-16 h-9 rounded object-cover flex-shrink-0"
                              referrerpolicy="no-referrer"
                            />
                            <div class="flex-1 min-w-0">
                              <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                              <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                <span class="flex items-center gap-0.5"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                <span class="text-purple-600">互动率 {{ video.engagementRate.toFixed(2) }}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCardPortal>
                </HoverCardRoot>
              </div>
              <div class="ml-auto text-right">
                <div class="text-lg font-bold text-purple-600 tabular-nums">{{ problemDataAnalysis.lowEngagement.count }}</div>
                <div class="text-xs text-neutral-400">个视频</div>
              </div>
            </div>

            <div class="problem-stats">
              <div class="stat-item">
                <span class="stat-label">平均播放</span>
                <span class="stat-value">{{ formatNumber(problemDataAnalysis.lowEngagement.avgPlay) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均互动率</span>
                <span class="stat-value text-purple-600">{{ problemDataAnalysis.lowEngagement.avgEngRate }}%</span>
              </div>
            </div>
          </div>

          <!-- 连续低迷期 -->
          <div v-if="problemDataAnalysis.lowPeriod" class="problem-block">
            <div class="problem-header">
              <div class="problem-icon slate">
                <CalendarX :size="16" />
              </div>
              <div>
                <h3 class="problem-title">低迷时期</h3>
                <HoverCardRoot :open-delay="200" :close-delay="100">
                  <HoverCardTrigger as-child>
                    <p class="problem-subtitle cursor-pointer border-b border-dashed border-neutral-300 hover:border-slate-500 inline-flex items-center gap-1 transition-colors">
                      {{ problemDataAnalysis.lowPeriod.period }} 期间 <strong>{{ problemDataAnalysis.lowPeriod.count }}</strong> 个视频表现较差
                      <Info :size="12" class="text-neutral-400" />
                    </p>
                  </HoverCardTrigger>
                  <HoverCardPortal>
                    <HoverCardContent
                      :side-offset="8"
                      side="bottom"
                      align="start"
                      class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                    >
                      <div class="p-3 border-b border-neutral-100 bg-slate-50">
                        <span class="text-sm font-medium text-slate-800">{{ problemDataAnalysis.lowPeriod.period }} 低迷期视频</span>
                        <p class="text-xs text-slate-600 mt-1">该时期均播放 {{ formatNumber(problemDataAnalysis.lowPeriod.avgPlay) }}，对比整体 {{ problemDataAnalysis.lowPeriod.vsAvg }}%</p>
                      </div>
                      <div class="p-3 max-h-64 overflow-y-auto">
                        <div class="space-y-2">
                          <div
                            v-for="video in problemDataAnalysis.lowPeriod.videos"
                            :key="video.bvid"
                            class="flex items-start gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                            @click="openVideo(video)"
                          >
                            <img
                              :src="getImageUrl(video.cover)"
                              class="w-16 h-9 rounded object-cover flex-shrink-0"
                              referrerpolicy="no-referrer"
                            />
                            <div class="flex-1 min-w-0">
                              <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                              <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                                <span class="flex items-center gap-0.5 text-slate-600"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                                <span>{{ video.publish_time.slice(0, 10) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCardPortal>
                </HoverCardRoot>
              </div>
            </div>

            <div class="problem-stats">
              <div class="stat-item">
                <span class="stat-label">该时期视频数</span>
                <span class="stat-value">{{ problemDataAnalysis.lowPeriod.count }} 个</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">该时期均播放</span>
                <span class="stat-value text-rose-600">{{ formatNumber(problemDataAnalysis.lowPeriod.avgPlay) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">对比整体均值</span>
                <span class="stat-value text-rose-600">{{ problemDataAnalysis.lowPeriod.vsAvg }}%</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ==================== 第四层：长尾深度分析 ==================== -->
      <div v-if="longTailHealth || quadrantAnalysis" class="space-y-6">
        <div class="flex items-center gap-3">
          <h2 class="text-base font-semibold text-neutral-800">深度分析</h2>
          <div class="h-px flex-1 bg-neutral-200"></div>
          <span class="text-xs text-neutral-400">长尾理论 · 利基识别</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 内容结构分析 -->
          <section v-if="longTailHealth" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">内容结构</h3>

            <!-- 健康度状态 -->
            <div class="flex items-center gap-3 p-3 rounded-xl mb-4" :class="[
              longTailHealth.healthLevel === 'excellent' ? 'bg-emerald-50' :
              longTailHealth.healthLevel === 'good' ? 'bg-blue-50' :
              longTailHealth.healthLevel === 'risky' ? 'bg-rose-50' : 'bg-neutral-50'
            ]">
              <component
                :is="longTailHealth.healthLevel === 'excellent' ? Sparkles :
                     longTailHealth.healthLevel === 'risky' ? TrendingDown : Activity"
                :size="18"
                :class="[
                  longTailHealth.healthLevel === 'excellent' ? 'text-emerald-500' :
                  longTailHealth.healthLevel === 'good' ? 'text-blue-500' :
                  longTailHealth.healthLevel === 'risky' ? 'text-rose-500' : 'text-neutral-500'
                ]"
              />
              <div>
                <div class="text-sm font-medium text-neutral-900">{{ longTailHealth.healthDesc }}</div>
                <div class="text-xs text-neutral-500">前 20% 视频贡献 {{ longTailHealth.top20Contribution }}% 播放量</div>
              </div>
            </div>

            <!-- 头腰尾分布 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">头部（2x均值以上）</span>
                <span class="text-sm font-semibold text-amber-600 tabular-nums">{{ longTailHealth.head.count }} 个 · {{ longTailHealth.head.ratio }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">腰部（稳定内容）</span>
                <span class="text-sm font-semibold text-blue-600 tabular-nums">{{ longTailHealth.waist.count }} 个 · {{ longTailHealth.waist.ratio }}%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-500">长尾（0.5x均值以下）</span>
                <span class="text-sm font-semibold text-neutral-600 tabular-nums">{{ longTailHealth.tail.count }} 个 · {{ longTailHealth.tail.ratio }}%</span>
              </div>
            </div>

            <!-- 长尾有效性 -->
            <div class="mt-4 pt-4 border-t border-neutral-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-neutral-500">长尾有效性</span>
                <span class="text-sm font-semibold tabular-nums">{{ longTailHealth.effectiveTail.ratio }}%</span>
              </div>
              <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all"
                  :style="{ width: longTailHealth.effectiveTail.ratio + '%' }"
                ></div>
              </div>
              <p class="text-xs text-neutral-400 mt-2">有效长尾 = 播放低但互动率达标的内容</p>
            </div>
          </section>

          <!-- 四象限分析 -->
          <section v-if="quadrantAnalysis" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">内容四象限</h3>

            <div class="grid grid-cols-2 gap-3">
              <!-- 明星内容 -->
              <HoverCardRoot :open-delay="200" :close-delay="100">
                <HoverCardTrigger as-child>
                  <div class="p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-amber-700">明星内容</span>
                      <span class="text-lg font-bold text-amber-600 tabular-nums flex items-center gap-1">
                        {{ quadrantAnalysis.quadrants.star.count }}
                        <Info :size="12" class="text-amber-400" />
                      </span>
                    </div>
                    <p class="text-[11px] text-amber-600/70">高播放 · 高互动</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardPortal>
                  <HoverCardContent
                    :side-offset="8"
                    side="top"
                    align="start"
                    class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                  >
                    <div class="p-3 border-b border-neutral-100 bg-amber-50">
                      <span class="text-sm font-medium text-amber-800">明星内容</span>
                      <p class="text-xs text-amber-600 mt-1">高播放高互动，最优质的内容</p>
                    </div>
                    <div class="p-3 max-h-64 overflow-y-auto">
                      <div v-if="quadrantAnalysis.quadrants.star.videos.length > 0" class="space-y-2">
                        <div
                          v-for="video in quadrantAnalysis.quadrants.star.videos"
                          :key="video.bvid"
                          class="flex items-start gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                          @click="openVideo(video)"
                        >
                          <img
                            :src="getImageUrl(video.cover)"
                            class="w-16 h-9 rounded object-cover flex-shrink-0"
                            referrerpolicy="no-referrer"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                            <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                              <span class="flex items-center gap-0.5 text-amber-600"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else class="text-xs text-neutral-400 text-center py-4">暂无明星内容</p>
                    </div>
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCardRoot>

              <!-- 利基宝藏 -->
              <HoverCardRoot :open-delay="200" :close-delay="100">
                <HoverCardTrigger as-child>
                  <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100 relative cursor-pointer hover:border-emerald-300 transition-colors">
                    <div class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded font-medium">
                      蓝海
                    </div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-emerald-700">利基宝藏</span>
                      <span class="text-lg font-bold text-emerald-600 tabular-nums flex items-center gap-1">
                        {{ quadrantAnalysis.quadrants.niche.count }}
                        <Info :size="12" class="text-emerald-400" />
                      </span>
                    </div>
                    <p class="text-[11px] text-emerald-600/70">低播放 · 高互动</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardPortal>
                  <HoverCardContent
                    :side-offset="8"
                    side="top"
                    align="end"
                    class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                  >
                    <div class="p-3 border-b border-neutral-100 bg-emerald-50">
                      <span class="text-sm font-medium text-emerald-800">利基宝藏</span>
                      <p class="text-xs text-emerald-600 mt-1">低播放高互动，值得深挖的蓝海选题</p>
                    </div>
                    <div class="p-3 max-h-64 overflow-y-auto">
                      <div v-if="quadrantAnalysis.quadrants.niche.videos.length > 0" class="space-y-2">
                        <div
                          v-for="video in quadrantAnalysis.quadrants.niche.videos"
                          :key="video.bvid"
                          class="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors"
                          @click="openVideo(video)"
                        >
                          <img
                            :src="getImageUrl(video.cover)"
                            class="w-16 h-9 rounded object-cover flex-shrink-0"
                            referrerpolicy="no-referrer"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                            <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                              <span class="flex items-center gap-0.5"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                              <span class="text-emerald-600">互动率 {{ video.engagementRate?.toFixed(2) || '-' }}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else class="text-xs text-neutral-400 text-center py-4">暂无利基宝藏内容</p>
                    </div>
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCardRoot>

              <!-- 流量内容 -->
              <HoverCardRoot :open-delay="200" :close-delay="100">
                <HoverCardTrigger as-child>
                  <div class="p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-blue-700">流量内容</span>
                      <span class="text-lg font-bold text-blue-600 tabular-nums flex items-center gap-1">
                        {{ quadrantAnalysis.quadrants.traffic.count }}
                        <Info :size="12" class="text-blue-400" />
                      </span>
                    </div>
                    <p class="text-[11px] text-blue-600/70">高播放 · 低互动</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardPortal>
                  <HoverCardContent
                    :side-offset="8"
                    side="bottom"
                    align="start"
                    class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                  >
                    <div class="p-3 border-b border-neutral-100 bg-blue-50">
                      <span class="text-sm font-medium text-blue-800">流量内容</span>
                      <p class="text-xs text-blue-600 mt-1">高播放低互动，吸引眼球但粘性不足</p>
                    </div>
                    <div class="p-3 max-h-64 overflow-y-auto">
                      <div v-if="quadrantAnalysis.quadrants.traffic.videos.length > 0" class="space-y-2">
                        <div
                          v-for="video in quadrantAnalysis.quadrants.traffic.videos"
                          :key="video.bvid"
                          class="flex items-start gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                          @click="openVideo(video)"
                        >
                          <img
                            :src="getImageUrl(video.cover)"
                            class="w-16 h-9 rounded object-cover flex-shrink-0"
                            referrerpolicy="no-referrer"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                            <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                              <span class="flex items-center gap-0.5 text-blue-600"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else class="text-xs text-neutral-400 text-center py-4">暂无流量内容</p>
                    </div>
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCardRoot>

              <!-- 待优化 -->
              <HoverCardRoot :open-delay="200" :close-delay="100">
                <HoverCardTrigger as-child>
                  <div class="p-3 rounded-xl bg-neutral-100 border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-neutral-600">待优化</span>
                      <span class="text-lg font-bold text-neutral-500 tabular-nums flex items-center gap-1">
                        {{ quadrantAnalysis.quadrants.weak.count }}
                        <Info :size="12" class="text-neutral-400" />
                      </span>
                    </div>
                    <p class="text-[11px] text-neutral-500">低播放 · 低互动</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardPortal>
                  <HoverCardContent
                    :side-offset="8"
                    side="bottom"
                    align="end"
                    class="z-50 w-96 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden animate-in fade-in-0 zoom-in-95"
                  >
                    <div class="p-3 border-b border-neutral-100 bg-neutral-100">
                      <span class="text-sm font-medium text-neutral-800">待优化内容</span>
                      <p class="text-xs text-neutral-600 mt-1">低播放低互动，需要重新审视</p>
                    </div>
                    <div class="p-3 max-h-64 overflow-y-auto">
                      <div v-if="quadrantAnalysis.quadrants.weak.videos.length > 0" class="space-y-2">
                        <div
                          v-for="video in quadrantAnalysis.quadrants.weak.videos"
                          :key="video.bvid"
                          class="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                          @click="openVideo(video)"
                        >
                          <img
                            :src="getImageUrl(video.cover)"
                            class="w-16 h-9 rounded object-cover flex-shrink-0"
                            referrerpolicy="no-referrer"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">{{ video.title }}</div>
                            <div class="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                              <span class="flex items-center gap-0.5"><Play :size="8" /> {{ formatNumber(video.play_count) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else class="text-xs text-neutral-400 text-center py-4">暂无待优化内容</p>
                    </div>
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCardRoot>
            </div>
          </section>
        </div>

        <!-- 被低估的内容 -->
        <section v-if="undervaluedContent && undervaluedContent.videos.length > 0" class="report-card">
          <h3 class="text-sm font-semibold text-neutral-900 mb-1">被低估的潜力内容</h3>
          <p class="text-xs text-neutral-500 mb-4">{{ undervaluedContent.insight }}</p>

          <div class="space-y-2">
            <div
              v-for="(video, index) in undervaluedContent.videos.slice(0, 3)"
              :key="index"
              class="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0"
            >
              <span class="text-xs text-neutral-400 w-4">{{ index + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-neutral-900 truncate">{{ video.title }}</p>
                <div class="flex items-center gap-3 mt-0.5">
                  <span class="text-xs text-neutral-400">{{ formatNumber(video.play_count) }} 播放</span>
                  <span class="text-xs text-neutral-400">·</span>
                  <span class="text-xs text-emerald-600">{{ video.engagementRate.toFixed(2) }}% 互动率</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 蓝海机会 -->
        <div v-if="blueOceanTiming || blueOceanDuration" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 蓝海时段 -->
          <section v-if="blueOceanTiming" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">
              <Clock :size="14" class="inline mr-1.5 text-cyan-500" />
              发布时段分析
            </h3>

            <div v-if="blueOceanTiming.blueOcean.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">蓝海时段（竞争少、效果好）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(h, i) in blueOceanTiming.blueOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-lg"
                >
                  {{ h.label }}
                  <span class="text-cyan-500 text-xs ml-1">{{ h.efficiency }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanTiming.redOcean.length > 0">
              <p class="text-xs text-neutral-500 mb-2">红海时段（竞争激烈）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(h, i) in blueOceanTiming.redOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg"
                >
                  {{ h.label }}
                </span>
              </div>
            </div>
          </section>

          <!-- 蓝海时长 -->
          <section v-if="blueOceanDuration" class="report-card">
            <h3 class="text-sm font-semibold text-neutral-900 mb-4">
              <Timer :size="14" class="inline mr-1.5 text-violet-500" />
              内容时长分析
            </h3>

            <div v-if="blueOceanDuration.mainstream.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">主流时长</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(d, i) in blueOceanDuration.mainstream"
                  :key="i"
                  class="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg"
                >
                  {{ d.label }}
                  <span class="text-neutral-400 text-xs ml-1">{{ d.ratio }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanDuration.blueOcean.length > 0" class="mb-4">
              <p class="text-xs text-neutral-500 mb-2">蓝海时长（占比少但效果好）</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(d, i) in blueOceanDuration.blueOcean"
                  :key="i"
                  class="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg"
                >
                  {{ d.label }}
                  <span class="text-violet-500 text-xs ml-1">{{ d.efficiency }}%</span>
                </span>
              </div>
            </div>

            <div v-if="blueOceanDuration.depthPreference" class="p-3 bg-amber-50 rounded-lg">
              <p class="text-xs font-medium text-amber-700">
                {{ blueOceanDuration.depthPreference.type === 'long' ? '粉丝偏好深度长内容' : '短视频更受欢迎' }}
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="text-center text-xs text-neutral-400 py-2">
        以上分析基于 {{ videos.length }} 个视频数据，由算法自动生成
      </div>

      <!-- ==================== 第五层：AI 工具 ==================== -->
      <section class="report-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-neutral-900">AI 深度分析</h2>
          <span class="text-xs text-neutral-400">点击复制提示词</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1">
          <div
            v-for="(prompt, index) in aiPromptTemplates"
            :key="index"
            class="group flex items-center gap-2 py-2.5 cursor-pointer hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors"
            @click="copyPrompt(prompt)"
          >
            <component :is="prompt.icon" :size="14" class="text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
            <span class="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors truncate">{{ prompt.title }}</span>
          </div>
        </div>

        <!-- 复制成功提示 -->
        <Transition name="toast">
          <div
            v-if="promptCopySuccess"
            class="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm rounded-full shadow-lg z-50"
          >
            <CheckCircle :size="16" class="text-emerald-400" />
            已复制到剪贴板
          </div>
        </Transition>
      </section>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
      <div class="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
        <FileText :size="24" class="text-neutral-400" />
      </div>
      <h3 class="text-base font-semibold text-neutral-900 mb-1">暂无数据</h3>
      <p class="text-sm text-neutral-500">请调整筛选条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import VideoFilterBar from '../VideoFilterBar.vue';
import { formatNumber, copyToClipboard, parseDurationMinutes, getImageUrl } from '../../utils';
import { useVideoMetrics } from '../../composables/useVideoMetrics';
import { HoverCardRoot, HoverCardTrigger, HoverCardPortal, HoverCardContent } from 'radix-vue';
import { open } from '@tauri-apps/plugin-shell';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Flame,
  Copy,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Activity,
  Wand2,
  BookOpen,
  Crosshair,
  Repeat,
  Users,
  Calendar,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Timer,
  Gem,
  Layers,
  Compass,
  Sailboat,
  Radar,
  Search,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  MessageSquareOff,
  CalendarX,
  Info,
  Play
} from 'lucide-vue-next';

const props = defineProps({
  videos: { type: Array, required: true },
  upName: { type: String, default: '' },
  timeRange: { type: String, default: 'all' },
  duration: { type: String, default: 'all' }
});

defineEmits(['update:timeRange', 'update:duration']);

const copySuccess = ref(false);
const promptCopySuccess = ref(false);

// 使用 composable
const videosRef = computed(() => props.videos);
const {
  totalPlays,
  totalDanmu,
  totalComments,
  totalFavorites,
  avgPlays,
  avgEngagementRate,
  hitRate,
  monthlyPublishRate,
  avgDuration,
  dataTimeRange,
  getAccountLevel,
  getBestDuration,
  getBestPublishTime,
  getPublishFrequency,
  getTrendAnalysis,
  getHitVideoFeatures,
  generateDataSummary,
  getUndervaluedContent,
  getLongTailHealth,
  getBlueOceanTiming,
  getBlueOceanDuration,
  getQuadrantAnalysis
} = useVideoMetrics(videosRef);

// 报告摘要
const reportSummary = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return { headline: '' };

  const level = getAccountLevel(avgPlays.value);
  const trend = getTrendAnalysis(videoList);
  const freq = getPublishFrequency(videoList);

  let headline = `该账号为${level.desc}`;

  if (freq) {
    headline += `，${freq.frequency}更新（月均 ${freq.monthlyRate} 条）`;
  }

  headline += `，场均播放 ${formatNumber(avgPlays.value)}`;

  if (trend) {
    if (trend.trend === 'up') {
      headline += '，近期数据呈上升趋势';
    } else if (trend.trend === 'down') {
      headline += '，近期数据有所回落';
    } else {
      headline += '，整体表现稳定';
    }
  }

  headline += '。';

  return { headline, level, trend, freq };
});

// 关键发现
const reportFindings = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return [];

  const findings = [];

  const bestDur = getBestDuration(videoList);
  if (bestDur) {
    findings.push({
      title: '最佳内容时长',
      description: `${bestDur.label}的视频表现最好，平均播放 ${formatNumber(Math.round(bestDur.avgPlay))}`,
      type: 'positive',
      icon: Clock,
      detailKey: 'duration'
    });
  }

  const bestTime = getBestPublishTime(videoList);
  if (bestTime) {
    findings.push({
      title: '黄金发布时间',
      description: `推荐时段：${bestTime.topHours.join('、')}`,
      type: 'positive',
      icon: Calendar,
      detailKey: 'publishTime'
    });
  }

  const trend = getTrendAnalysis(videoList);
  if (trend) {
    findings.push({
      title: trend.trend === 'up' ? '数据上升中' : trend.trend === 'down' ? '数据波动' : '表现稳定',
      description: trend.description,
      type: trend.trend === 'up' ? 'positive' : trend.trend === 'down' ? 'negative' : 'neutral',
      icon: trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Activity,
      detailKey: 'trend'
    });
  }

  const hitFeatures = getHitVideoFeatures(videoList, avgPlays.value);
  if (hitFeatures && hitFeatures.count >= 2) {
    findings.push({
      title: `${hitFeatures.count} 个爆款`,
      description: `爆款率 ${hitFeatures.rate}%，平均时长 ${hitFeatures.avgDuration} 分钟`,
      type: 'positive',
      icon: Flame,
      detailKey: 'hitVideos'
    });
  }

  return findings.slice(0, 4);
});

// 关键发现详情数据（用于 HoverCard）
const findingDetails = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return {};

  const details = {};

  // 黄金发布时间详情
  const topVideos = [...videoList].sort((a, b) => b.play_count - a.play_count).slice(0, Math.max(3, Math.ceil(videoList.length * 0.3)));
  const slots = {};
  topVideos.forEach(v => {
    const date = new Date(v.publish_time);
    const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
    const hour = date.getHours();
    let timeSlot;
    if (hour >= 6 && hour < 12) timeSlot = '上午';
    else if (hour >= 12 && hour < 14) timeSlot = '中午';
    else if (hour >= 14 && hour < 18) timeSlot = '下午';
    else if (hour >= 18 && hour < 22) timeSlot = '晚间';
    else timeSlot = '深夜';
    const key = `${dayType}${timeSlot}`;
    slots[key] = (slots[key] || 0) + 1;
  });
  details.publishTime = { slots, topVideos };

  // 最佳时长详情
  const durationBins = [
    { min: 0, max: 5, label: '<5分钟' },
    { min: 5, max: 10, label: '5-10分钟' },
    { min: 10, max: 15, label: '10-15分钟' },
    { min: 15, max: 20, label: '15-20分钟' },
    { min: 20, max: 30, label: '20-30分钟' },
    { min: 30, max: Infinity, label: '>30分钟' }
  ];
  const binStats = durationBins.map(bin => {
    const vids = videoList.filter(v => {
      const mins = parseDurationMinutes(v.duration);
      return mins >= bin.min && mins < bin.max;
    });
    const avgPlay = vids.length > 0 ? Math.round(vids.reduce((s, v) => s + v.play_count, 0) / vids.length) : 0;
    return { ...bin, count: vids.length, avgPlay, videos: vids };
  }).filter(b => b.count > 0);
  const maxAvgPlay = Math.max(...binStats.map(b => b.avgPlay));
  const bestBin = binStats.find(b => b.avgPlay === maxAvgPlay);
  details.duration = {
    bins: binStats.map(b => ({ ...b, isBest: b.avgPlay === maxAvgPlay })),
    maxAvgPlay,
    topVideos: bestBin ? bestBin.videos.sort((a, b) => b.play_count - a.play_count).slice(0, 3) : []
  };

  // 趋势详情
  const trend = getTrendAnalysis(videoList);
  if (trend) {
    const sorted = [...videoList].sort((a, b) => new Date(a.publish_time) - new Date(b.publish_time));
    const half = Math.floor(sorted.length / 2);
    details.trend = {
      firstAvg: trend.firstAvg,
      secondAvg: trend.secondAvg,
      changeRate: trend.changeRate,
      firstCount: half,
      secondCount: sorted.length - half
    };
  }

  // 爆款视频详情
  const hitThreshold = avgPlays.value * 2;
  const hitVideos = videoList.filter(v => v.play_count >= hitThreshold).sort((a, b) => b.play_count - a.play_count);
  if (hitVideos.length > 0) {
    details.hitVideos = { videos: hitVideos };
  }

  return details;
});

// 格式化发布时段
function formatPublishSlot(publishTime) {
  const date = new Date(publishTime);
  const dayType = (date.getDay() === 0 || date.getDay() === 6) ? '周末' : '工作日';
  const hour = date.getHours();
  let timeSlot;
  if (hour >= 6 && hour < 12) timeSlot = '上午';
  else if (hour >= 12 && hour < 14) timeSlot = '中午';
  else if (hour >= 14 && hour < 18) timeSlot = '下午';
  else if (hour >= 18 && hour < 22) timeSlot = '晚间';
  else timeSlot = '深夜';
  return `${dayType}${timeSlot} ${hour}:00`;
}

// 打开视频
async function openVideo(video) {
  if (video.video_url) {
    await open(video.video_url);
  } else if (video.bvid) {
    await open(`https://www.bilibili.com/video/${video.bvid}`);
  }
}

// 数据洞察
const reportInsights = computed(() => {
  const videoList = props.videos;
  if (videoList.length === 0) return [];

  const insights = [];

  const plays = videoList.map(v => v.play_count).sort((a, b) => a - b);
  const median = plays[Math.floor(plays.length / 2)];
  const maxPlay = plays[plays.length - 1];
  const minPlay = plays[0];
  const playRange = maxPlay / Math.max(1, minPlay);

  insights.push({
    title: '播放量分布',
    description: playRange > 50 ? '数据波动较大' : playRange > 10 ? '分布较分散' : '相对稳定',
    metric: `中位数 ${formatNumber(median)}`,
    icon: BarChart3,
    details: [`最高 ${formatNumber(maxPlay)}`, `最低 ${formatNumber(minPlay)}`]
  });

  const engRate = parseFloat(avgEngagementRate.value);
  insights.push({
    title: '互动质量',
    description: engRate >= 5 ? '互动率优秀' : engRate >= 2 ? '互动率良好' : engRate >= 1 ? '互动率一般' : '互动率偏低',
    metric: `${engRate.toFixed(2)}%`,
    icon: MessageSquare,
    details: [`弹幕 ${formatNumber(totalDanmu.value)}`, `评论 ${formatNumber(totalComments.value)}`]
  });

  const freq = getPublishFrequency(videoList);
  if (freq) {
    insights.push({
      title: '发布节奏',
      description: freq.suggestion,
      metric: `${freq.monthlyRate} 条/月`,
      icon: CalendarDays,
      details: [`${freq.frequency}更新`]
    });
  }

  const durations = videoList.map(v => parseDurationMinutes(v.duration));
  const avgDur = durations.reduce((s, d) => s + d, 0) / durations.length;

  insights.push({
    title: '内容时长',
    description: `平均时长 ${avgDur.toFixed(1)} 分钟`,
    metric: `${avgDur.toFixed(1)} 分`,
    icon: Timer
  });

  return insights;
});

// 长尾分析
const undervaluedContent = computed(() => getUndervaluedContent(props.videos));
const longTailHealth = computed(() => getLongTailHealth(props.videos));
const blueOceanTiming = computed(() => getBlueOceanTiming(props.videos));
const blueOceanDuration = computed(() => getBlueOceanDuration(props.videos));
const quadrantAnalysis = computed(() => getQuadrantAnalysis(props.videos));

// 问题数据分析
const problemDataAnalysis = computed(() => {
  const videoList = props.videos;
  if (videoList.length < 5) return null;

  const avg = avgPlays.value;
  const totalPlaysVal = totalPlays.value;
  const result = {};

  // 1. 低于平均表现分析
  const threshold = avg;
  const belowAvgVideos = videoList.filter(v => v.play_count < threshold);
  if (belowAvgVideos.length > 0) {
    const belowAvgPlays = belowAvgVideos.reduce((s, v) => s + v.play_count, 0);
    const belowAvgAvg = Math.round(belowAvgPlays / belowAvgVideos.length);

    // 分析共性特征
    const features = [];
    const shortVideos = belowAvgVideos.filter(v => parseDurationMinutes(v.duration) < 3);
    const longVideos = belowAvgVideos.filter(v => parseDurationMinutes(v.duration) > 30);
    const lateNightVideos = belowAvgVideos.filter(v => {
      const hour = new Date(v.publish_time).getHours();
      return hour >= 0 && hour < 6;
    });
    const weekendVideos = belowAvgVideos.filter(v => {
      const day = new Date(v.publish_time).getDay();
      return day === 0 || day === 6;
    });

    if (shortVideos.length > belowAvgVideos.length * 0.4) features.push('过短视频多（<3分钟）');
    if (longVideos.length > belowAvgVideos.length * 0.4) features.push('过长视频多（>30分钟）');
    if (lateNightVideos.length > belowAvgVideos.length * 0.3) features.push('凌晨发布较多');
    if (weekendVideos.length > belowAvgVideos.length * 0.6) features.push('多在周末发布');

    result.belowAvg = {
      count: belowAvgVideos.length,
      ratio: ((belowAvgVideos.length / videoList.length) * 100).toFixed(1),
      threshold,
      playContribution: ((belowAvgPlays / totalPlaysVal) * 100).toFixed(1),
      avgPlay: belowAvgAvg,
      features,
      videos: belowAvgVideos.sort((a, b) => a.play_count - b.play_count),
      samples: belowAvgVideos.sort((a, b) => a.play_count - b.play_count).slice(0, 3)
    };
  }

  // 2. 数据波动分析
  const plays = videoList.map(v => v.play_count);
  const variance = plays.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / plays.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;
  const sortedPlays = [...plays].sort((a, b) => a - b);
  const median = sortedPlays[Math.floor(sortedPlays.length / 2)];
  const maxPlay = Math.max(...plays);
  const minPlay = Math.min(...plays);
  const range = minPlay > 0 ? Math.round(maxPlay / minPlay) : maxPlay;

  let level, interpretation;
  if (cv > 150) {
    level = 'high';
    interpretation = '数据波动很大，说明内容表现差异明显。建议分析高播放视频的成功要素，同时审视低播放内容的问题。';
  } else if (cv > 80) {
    level = 'medium';
    interpretation = '数据波动适中，内容表现相对稳定但仍有起伏。可以尝试复制成功经验，提升整体水平。';
  } else {
    level = 'low';
    interpretation = '数据波动较小，内容表现非常稳定。可以考虑尝试突破性选题来寻找新增长点。';
  }

  result.volatility = {
    cv: cv.toFixed(0),
    level,
    max: maxPlay,
    min: minPlay,
    range,
    median,
    interpretation
  };

  // 3. 异常值检测（IQR方法）
  const q1 = sortedPlays[Math.floor(sortedPlays.length * 0.25)];
  const q3 = sortedPlays[Math.floor(sortedPlays.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;

  const lowOutliers = videoList.filter(v => v.play_count < lowerBound);
  if (lowOutliers.length > 0) {
    // 分析异常低值视频的共性
    const lowFeatures = [];
    const avgDurLow = lowOutliers.reduce((s, v) => s + parseDurationMinutes(v.duration), 0) / lowOutliers.length;
    const avgDurAll = videoList.reduce((s, v) => s + parseDurationMinutes(v.duration), 0) / videoList.length;

    if (avgDurLow < avgDurAll * 0.5) lowFeatures.push('时长偏短');
    if (avgDurLow > avgDurAll * 2) lowFeatures.push('时长过长');

    result.outliers = {
      low: lowOutliers.sort((a, b) => a.play_count - b.play_count),
      lowerBound,
      lowFeatures
    };
  }

  // 4. 流量陷阱（高播放低互动）
  const avgEngRate = videoList.reduce((s, v) => {
    const eng = v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0);
    return s + (v.play_count > 0 ? (eng / v.play_count) * 100 : 0);
  }, 0) / videoList.length;

  const lowEngVideos = videoList
    .map(v => {
      const eng = v.danmu_count + (v.comment_count || 0) + (v.favorite_count || 0);
      return {
        ...v,
        engagementRate: v.play_count > 0 ? (eng / v.play_count) * 100 : 0
      };
    })
    .filter(v => v.play_count >= avg && v.engagementRate < avgEngRate * 0.5);

  if (lowEngVideos.length > 0) {
    const lowEngAvgPlay = Math.round(lowEngVideos.reduce((s, v) => s + v.play_count, 0) / lowEngVideos.length);
    const lowEngAvgRate = (lowEngVideos.reduce((s, v) => s + v.engagementRate, 0) / lowEngVideos.length).toFixed(2);

    result.lowEngagement = {
      count: lowEngVideos.length,
      avgPlay: lowEngAvgPlay,
      avgEngRate: lowEngAvgRate,
      videos: lowEngVideos.sort((a, b) => b.play_count - a.play_count),
      samples: lowEngVideos.sort((a, b) => b.play_count - a.play_count).slice(0, 3)
    };
  }

  // 5. 低迷时期分析
  const monthlyData = {};
  videoList.forEach(v => {
    const month = v.publish_time.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { count: 0, totalPlays: 0, videos: [] };
    monthlyData[month].count++;
    monthlyData[month].totalPlays += v.play_count;
    monthlyData[month].videos.push(v);
  });

  const monthStats = Object.entries(monthlyData)
    .filter(([_, d]) => d.count >= 2)
    .map(([month, d]) => ({
      month,
      count: d.count,
      avgPlay: Math.round(d.totalPlays / d.count),
      videos: d.videos
    }));

  if (monthStats.length >= 3) {
    const worstMonth = monthStats.reduce((worst, curr) => curr.avgPlay < worst.avgPlay ? curr : worst);
    const vsAvg = ((worstMonth.avgPlay / avg - 1) * 100).toFixed(0);

    if (worstMonth.avgPlay < avg * 0.5) {
      result.lowPeriod = {
        period: worstMonth.month,
        count: worstMonth.count,
        avgPlay: worstMonth.avgPlay,
        vsAvg,
        videos: worstMonth.videos.sort((a, b) => a.play_count - b.play_count)
      };
    }
  }

  // 检查是否有任何问题数据
  const hasProblems = result.belowAvg || result.outliers || result.lowEngagement || result.lowPeriod;
  return hasProblems ? result : null;
});

// AI Prompt 模板
const aiPromptTemplates = computed(() => {
  const dataSummary = generateDataSummary(props.upName);

  return [
    {
      title: '选题策略',
      description: '分析高播放视频特征，给出选题建议',
      icon: Crosshair,
      color: 'bg-blue-500',
      prompt: `你是B站内容运营专家。请基于以下数据进行内容选题分析：\n\n${dataSummary}\n\n请分析：1.高播放视频标题特征 2.低播放视频问题 3.选题方向建议 4.标题优化示例`
    },
    {
      title: '发布策略',
      description: '优化发布时间和更新频率',
      icon: Calendar,
      color: 'bg-emerald-500',
      prompt: `你是B站运营分析师。请基于以下数据给出发布策略建议：\n\n${dataSummary}\n\n请分析：1.最佳发布时间 2.更新频率建议 3.内容排期模板`
    },
    {
      title: '增长诊断',
      description: '找出增长瓶颈和突破策略',
      icon: TrendingUp,
      color: 'bg-amber-500',
      prompt: `你是内容创作增长顾问。请基于以下数据进行增长诊断：\n\n${dataSummary}\n\n请分析：1.健康度评估 2.增长瓶颈 3.突破策略建议`
    },
    {
      title: '遗珠挖掘',
      description: '发现被低估的利基内容',
      icon: Gem,
      color: 'bg-teal-500',
      prompt: `你是长尾理论专家。请基于以下数据挖掘被低估的内容：\n\n${dataSummary}\n\n请分析：1.低播放高互动内容特征 2.利基市场价值 3.内容升级策略`
    },
    {
      title: '竞品分析',
      description: '分析竞品长尾寻找机会',
      icon: Search,
      color: 'bg-indigo-500',
      prompt: `你是竞争策略分析师。假设以下数据来自竞品账号：\n\n${dataSummary}\n\n请分析：1.竞品内容结构 2.长尾弱点 3.差异化机会`
    },
    {
      title: '爆款方法论',
      description: '总结可复制的爆款规律',
      icon: Repeat,
      color: 'bg-rose-500',
      prompt: `你是爆款内容研究专家。请基于以下数据总结爆款方法论：\n\n${dataSummary}\n\n请分析：1.爆款要素拆解 2.爆款检查清单 3.提升爆款率策略`
    },
    {
      title: '蓝海策略',
      description: '分析时段时长差异化机会',
      icon: Compass,
      color: 'bg-cyan-500',
      prompt: `你是蓝海战略专家。请基于以下数据分析差异化机会：\n\n${dataSummary}\n\n请分析：1.蓝海时段 2.蓝海时长 3.差异化发布计划`
    },
    {
      title: '竞品对标',
      description: '定位差距和学习方向',
      icon: Users,
      color: 'bg-violet-500',
      prompt: `你是行业研究分析师。请基于以下数据进行竞品对标分析：\n\n${dataSummary}\n\n请分析：1.账号定位 2.对标账号画像 3.差距分析 4.学习方向`
    },
    {
      title: '完整报告',
      description: '生成完整数据分析报告',
      icon: BookOpen,
      color: 'bg-slate-700',
      prompt: `你是专业数据分析师。请基于以下数据生成完整报告：\n\n${dataSummary}\n\n请按以下结构输出：一、执行摘要 二、数据概览 三、深度分析 四、问题诊断 五、优化建议 六、总结`
    },
    {
      title: '自定义',
      description: '复制数据用于自定义分析',
      icon: Wand2,
      color: 'bg-neutral-700',
      prompt: dataSummary
    }
  ];
});

// 复制报告
async function copyAnalysisReport() {
  const summary = reportSummary.value;
  const findings = reportFindings.value;

  let text = `【${props.upName || 'UP主'} 数据分析报告】\n`;
  text += `数据范围：${dataTimeRange.value}，共 ${props.videos.length} 个视频\n\n`;
  text += `${summary.headline}\n\n`;
  text += `核心指标：场均播放 ${formatNumber(avgPlays.value)} | 爆款率 ${hitRate.value}% | 互动率 ${avgEngagementRate.value}%\n\n`;

  if (findings.length > 0) {
    text += `关键发现：\n`;
    findings.forEach((f, i) => text += `${i + 1}. ${f.title}：${f.description}\n`);
  }

  const success = await copyToClipboard(text);
  if (success) {
    copySuccess.value = true;
    setTimeout(() => copySuccess.value = false, 2000);
  }
}

// 复制 Prompt
async function copyPrompt(prompt) {
  const success = await copyToClipboard(prompt.prompt);
  if (success) {
    promptCopySuccess.value = true;
    setTimeout(() => promptCopySuccess.value = false, 2000);
  }
}
</script>

<style scoped>
.report-card {
  @apply bg-white rounded-2xl p-6;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-4;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.25s ease-in forwards;
}

@keyframes toast-in {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes toast-out {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -10px); }
}

/* 问题数据诊断样式 */
.problem-block {
  @apply p-4 bg-neutral-50 rounded-xl;
}

.problem-header {
  @apply flex items-start gap-3;
}

.problem-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0;
}

.problem-icon.amber {
  @apply bg-amber-100 text-amber-600;
}

.problem-icon.blue {
  @apply bg-blue-100 text-blue-600;
}

.problem-icon.rose {
  @apply bg-rose-100 text-rose-600;
}

.problem-icon.purple {
  @apply bg-purple-100 text-purple-600;
}

.problem-icon.slate {
  @apply bg-slate-100 text-slate-600;
}

.problem-title {
  @apply text-sm font-semibold text-neutral-900;
}

.problem-subtitle {
  @apply text-xs text-neutral-500 mt-0.5;
}

.problem-stats {
  @apply flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-neutral-200/60;
}

.stat-item {
  @apply flex items-center gap-2;
}

.stat-label {
  @apply text-xs text-neutral-400;
}

.stat-value {
  @apply text-sm font-semibold text-neutral-700 tabular-nums;
}

.problem-features {
  @apply mt-4;
}

.feature-tag {
  @apply px-2.5 py-1 rounded-full text-xs font-medium;
}

.feature-tag.amber {
  @apply bg-amber-100 text-amber-700;
}

.problem-samples {
  @apply mt-4;
}

.sample-item {
  @apply flex items-center justify-between gap-3 px-3 py-2 bg-white rounded-lg;
}

.sample-item.rose {
  @apply bg-rose-50;
}

.sample-title {
  @apply text-xs text-neutral-700 truncate flex-1;
}

.sample-stat {
  @apply text-xs text-neutral-500 whitespace-nowrap tabular-nums;
}
</style>
