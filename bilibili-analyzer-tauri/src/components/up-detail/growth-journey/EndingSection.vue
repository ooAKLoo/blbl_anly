<template>
  <div
    class="story-ending"
    ref="endingRef"
    :class="{ 'is-visible': isVisible }"
  >
    <div class="ending-divider"></div>
    <h2 class="ending-title">{{ totalDays }} 天</h2>
    <p class="ending-text">
      从第一个视频的 {{ formatNumber(firstVideoPlays) }} 播放，<br/>
      到现在累计 {{ formatNumber(totalPlays) }} 播放。<br/>
      {{ upName }} 的故事，还在继续。
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { formatNumber } from '../../../utils';

const props = defineProps({
  upName: { type: String, default: 'UP主' },
  totalDays: { type: Number, default: 0 },
  firstVideoPlays: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 }
});

const emit = defineEmits(['visible']);

const endingRef = ref(null);
const isVisible = ref(false);
let observer = null;

function setupObserver() {
  if (!endingRef.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          emit('visible');
        }
      });
    },
    { threshold: 0.5 }
  );
  observer.observe(endingRef.value);
}

function reset() {
  isVisible.value = false;
}

onMounted(() => {
  setupObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

defineExpose({ reset, setupObserver });
</script>

<style scoped>
.story-ending {
  @apply text-center space-y-5 pt-20 pb-16;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.story-ending.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.ending-divider {
  @apply w-24 h-px mx-auto;
  background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
}

.ending-title {
  @apply text-4xl font-bold text-blue-600 tabular-nums;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}

.ending-text {
  @apply text-slate-500 max-w-lg mx-auto leading-relaxed text-base;
}
</style>
