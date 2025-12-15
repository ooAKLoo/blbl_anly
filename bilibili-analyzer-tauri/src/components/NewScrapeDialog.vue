<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>添加 UP主</h2>
            <button class="close-btn" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="dialog-body">
            <div class="input-group">
              <label class="input-label">UP主 MID</label>
              <input
                v-model="localMid"
                type="text"
                class="input"
                placeholder="输入 UP主的 MID，例如 517327498"
                :disabled="isLoading"
              />
              <span class="input-hint">可在 UP主空间页面 URL 中找到 MID</span>
            </div>
            
            <div class="input-group">
              <label class="input-label">最大页数</label>
              <input
                v-model.number="localMaxPages"
                type="text"
                class="input"
                placeholder="100"
                :disabled="isLoading"
              />
              <span class="input-hint">每页约 30 个视频，100 页 ≈ 3000 个视频</span>
            </div>
            
            <!-- Progress -->
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
  maxPages: Number,
  isLoading: Boolean,
  progress: Object
});

const emit = defineEmits(['update:modelValue', 'start', 'stop']);

const localMid = ref(props.mid || '');
const localMaxPages = ref(props.maxPages || 100);

watch(() => props.mid, (val) => {
  localMid.value = val || '';
});

watch(() => props.maxPages, (val) => {
  localMaxPages.value = val || 100;
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
  emit('start', {
    mid: localMid.value,
    maxPages: localMaxPages.value
  });
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

.dialog-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #999);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.close-btn:hover {
  color: var(--text-primary, #1a1a1a);
  background: var(--bg-hover, #f0f0f0);
}

.dialog-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--text-muted, #999);
}

.input {
  background: var(--bg-tertiary, #fafafa);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
  border-radius: 8px;
  color: var(--text-primary, #1a1a1a);
  padding: 12px 16px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.input::placeholder {
  color: var(--text-muted, #999);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary, #5c6bc0);
  box-shadow: 0 0 0 3px rgba(92, 107, 192, 0.2);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-section {
  background: var(--bg-tertiary, #fafafa);
  border-radius: 8px;
  padding: 16px;
}

.progress-bar {
  height: 6px;
  background: var(--bg-hover, #e8e8e8);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary, #5c6bc0), var(--accent-secondary, #7c4dff));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary, #666);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  border: none;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary, #666);
}

.btn-ghost:hover {
  background: var(--bg-hover, #f0f0f0);
  color: var(--text-primary, #1a1a1a);
}

.btn-primary {
  background: var(--accent-primary, #5c6bc0);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d7cd0;
}

.btn-danger {
  background: var(--accent-danger, #ff5252);
  color: white;
}

.btn-danger:hover {
  background: #ff6b6b;
}

/* Transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.95);
  opacity: 0;
}
</style>
