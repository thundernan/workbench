import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([]);
  let idCounter = 0;

  const showToast = (options: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }) => {
    const id = `toast-${Date.now()}-${idCounter++}`;
    const duration = options.duration || 5000;

    const toast: ToastMessage = {
      id,
      type: options.type,
      message: options.message,
      duration
    };

    toasts.value.push(toast);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value = [];
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  };
});
