<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="toast"
      class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
      :class="toastClasses"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="iconComponent" class="h-6 w-6" :class="iconClasses" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ toast.message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="closeToast"
            >
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import type { Toast } from '@/types';

interface Props {
  toast: Toast | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const toastClasses = computed(() => {
  if (!props.toast) return '';
  
  switch (props.toast.type) {
    case 'success': return 'bg-emerald-50 border-emerald-200';
    case 'error': return 'bg-red-50 border-red-200';
    case 'warning': return 'bg-yellow-50 border-yellow-200';
    case 'info': return 'bg-blue-50 border-blue-200';
    default: return 'bg-gray-50 border-gray-200';
  }
});

const iconComponent = computed(() => {
  if (!props.toast) return InformationCircleIcon;
  
  switch (props.toast.type) {
    case 'success': return CheckCircleIcon;
    case 'error': return XCircleIcon;
    case 'warning': return ExclamationTriangleIcon;
    case 'info': return InformationCircleIcon;
    default: return InformationCircleIcon;
  }
});

const iconClasses = computed(() => {
  if (!props.toast) return 'text-gray-400';
  
  switch (props.toast.type) {
    case 'success': return 'text-emerald-400';
    case 'error': return 'text-red-400';
    case 'warning': return 'text-yellow-400';
    case 'info': return 'text-blue-400';
    default: return 'text-gray-400';
  }
});

const closeToast = () => {
  emit('close');
};
</script>
