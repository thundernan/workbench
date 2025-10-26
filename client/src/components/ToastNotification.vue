<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto bg-slate-800 border-2 rounded-lg shadow-lg overflow-hidden min-w-[320px] max-w-md"
        :class="getToastClass(toast.type)"
      >
        <div class="flex items-start gap-3 p-4">
          <!-- Icon -->
          <div class="text-2xl flex-shrink-0">{{ getIcon(toast.type) }}</div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm mb-1" :class="getTitleClass(toast.type)">
              {{ getTitle(toast.type) }}
            </div>
            <div class="text-sm text-slate-200">{{ toast.message }}</div>
          </div>
          
          <!-- Close Button -->
          <button
            @click="toastStore.removeToast(toast.id)"
            class="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();

const getToastClass = (type: string) => {
  const classes = {
    success: 'border-emerald-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500'
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getTitleClass = (type: string) => {
  const classes = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getIcon = (type: string) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type as keyof typeof icons] || icons.info;
};

const getTitle = (type: string) => {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  };
  return titles[type as keyof typeof titles] || titles.info;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
