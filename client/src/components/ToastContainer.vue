<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['toast-message', `toast-${toast.type}`]"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <!-- Success Icon -->
            <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <!-- Error Icon -->
            <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>
            <!-- Info Icon -->
            <svg v-else-if="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
            <!-- Warning Icon -->
            <svg v-else-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="toast-text">
            <div class="toast-message-text">{{ toast.message }}</div>
          </div>
        </div>
        <button
          class="toast-close"
          @click="toastStore.removeToast(toast.id)"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  width: 25rem;
  max-width: calc(100vw - 2.5rem);
  pointer-events: none;
}

.toast-message {
  margin-bottom: 0.75rem;
  pointer-events: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  gap: 0.75rem;
}

.toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-text {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.toast-message-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
}

.toast-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0.7;
  color: white;
}

.toast-close svg {
  width: 1rem;
  height: 1rem;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

/* Toast type styles - Simple, modern, matching app theme */
.toast-success {
  background: rgba(16, 185, 129, 0.95);
  border-left: 3px solid #10b981;
  color: white;
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  border-left: 3px solid #ef4444;
  color: white;
}

.toast-info {
  background: rgba(59, 130, 246, 0.95);
  border-left: 3px solid #3b82f6;
  color: white;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.95);
  border-left: 3px solid #f59e0b;
  color: white;
}

/* Transition animations - Subtle and smooth */
.toast-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  transform: translateX(1.5rem);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(1.5rem);
  opacity: 0;
}

.toast-move {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .toast-container {
    width: calc(100% - 2rem);
    left: 1rem;
    right: 1rem;
  }
}
</style>

