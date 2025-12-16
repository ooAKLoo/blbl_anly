<template>
  <Transition name="drawer">
    <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-5" @click="$emit('update:visible', false)">
      <div class="w-full max-w-[900px] max-h-[85vh] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden" @click.stop>
        <div class="flex items-center gap-4 px-6 py-5 border-b border-black/[0.06] bg-neutral-50">
          <h3 class="text-lg font-semibold text-neutral-900 m-0">{{ title }}</h3>
          <div class="flex gap-4 text-sm text-neutral-600 mr-auto">
            <span>共 {{ videos.length }} 个视频</span>
            <span v-if="videos.length > 0">
              平均播放: {{ formatNumber(averagePlayCount) }}
            </span>
          </div>
          <button class="ml-auto inline-flex items-center justify-center gap-2 px-[18px] py-2.5 border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 bg-transparent text-neutral-600 border border-black/10 hover:bg-neutral-100 hover:text-neutral-900" @click="$emit('update:visible', false)">
            <X :size="20" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="videos.length === 0" class="text-center py-[60px] px-5 text-neutral-400">
            <span>暂无视频</span>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(video, index) in videos"
              :key="video.bvid"
              class="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg transition-all duration-150 border border-transparent hover:bg-neutral-100 hover:border-blue-500/20 hover:translate-x-1"
            >
              <span class="w-8 text-center font-semibold text-blue-500 text-sm flex-shrink-0">{{ index + 1 }}</span>
              <img :src="getImageUrl(video.cover)" class="w-[140px] h-[79px] object-cover rounded-md flex-shrink-0" referrerpolicy="no-referrer" />
              <div class="flex-1 min-w-0">
                <a :href="video.video_url" target="_blank" class="block text-neutral-900 no-underline font-medium text-[0.95rem] mb-2 leading-snug transition-colors duration-150 hover:text-blue-500">
                  {{ video.title }}
                </a>
                <div class="flex flex-wrap gap-3 text-xs text-neutral-400">
                  <span class="inline-flex items-center gap-1" title="发布时间">
                    <Calendar :size="14" class="opacity-70" />
                    {{ video.publish_time }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="视频时长">
                    <Clock :size="14" class="opacity-70" />
                    {{ video.duration }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="播放量">
                    <Play :size="14" class="opacity-70" />
                    {{ formatNumber(video.play_count) }}
                  </span>
                  <span class="inline-flex items-center gap-1" title="弹幕数">
                    <MessageSquare :size="14" class="opacity-70" />
                    {{ formatNumber(video.danmu_count) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { Calendar, Clock, Play, MessageSquare, X } from 'lucide-vue-next';
import { formatNumber, getImageUrl } from '../utils';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  videos: {
    type: Array,
    default: () => []
  }
});

defineEmits(['update:visible']);

const averagePlayCount = computed(() => {
  if (props.videos.length === 0) return 0;
  const total = props.videos.reduce((sum, v) => sum + v.play_count, 0);
  return Math.round(total / props.videos.length);
});
</script>

<style scoped>
/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-active > div,
.drawer-leave-active > div {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from > div {
  transform: scale(0.96) translateY(16px);
}

.drawer-leave-to > div {
  transform: scale(0.96) translateY(16px);
}
</style>
