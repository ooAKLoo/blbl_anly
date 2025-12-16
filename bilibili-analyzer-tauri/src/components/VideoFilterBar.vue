<template>
  <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
    <!-- 时间筛选 -->
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">时间范围</span>
      <div class="flex items-center gap-1">
        <button
          v-for="option in TIME_RANGE_OPTIONS"
          :key="option.value"
          @click="$emit('update:timeRange', option.value)"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
            timeRange === option.value
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="w-px h-4 bg-neutral-200"></div>

    <!-- 时长筛选 -->
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wide">视频时长</span>
      <div class="flex items-center gap-1">
        <button
          v-for="option in DURATION_OPTIONS"
          :key="option.value"
          @click="$emit('update:duration', option.value)"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150',
            duration === option.value
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 右侧插槽 -->
    <div class="flex items-center gap-2 ml-auto">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { TIME_RANGE_OPTIONS, DURATION_OPTIONS } from '../constants';

defineProps({
  timeRange: {
    type: String,
    default: 'all'
  },
  duration: {
    type: String,
    default: 'all'
  }
});

defineEmits(['update:timeRange', 'update:duration']);
</script>
