<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="close">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>设置</h2>
            <button class="close-btn" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="dialog-body">
            <div class="setting-section">
              <div class="setting-header">
                <label class="setting-label">Cookie</label>
                <span class="setting-hint">可选 - 遇到 -403 错误时需要填写</span>
              </div>
              <textarea
                v-model="localCookie"
                class="input textarea"
                placeholder="从浏览器复制 Cookie..."
                rows="4"
              />
            </div>
          </div>
          
          <div class="dialog-footer">
            <button class="btn btn-ghost" @click="close">取消</button>
            <button class="btn btn-primary" @click="save">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  cookie: String
});

const emit = defineEmits(['update:modelValue', 'save']);

const localCookie = ref(props.cookie || '');

watch(() => props.cookie, (val) => {
  localCookie.value = val || '';
});

function close() {
  emit('update:modelValue', false);
}

function save() {
  emit('save', localCookie.value);
  close();
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
  flex: 1;
  overflow-y: auto;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
}

.setting-hint {
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

.textarea {
  resize: vertical;
  min-height: 100px;
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

.btn-primary:hover {
  background: #6d7cd0;
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
