import { defineStore } from 'pinia';
import { useToast as usePrimeToast } from 'primevue/usetoast';

export const useToastStore = defineStore('toast', () => {
  let toast: ReturnType<typeof usePrimeToast> | null = null;

  const initToast = () => {
    if (!toast) {
      toast = usePrimeToast();
    }
  };

  const showToast = (options: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }) => {
    initToast();
    
    const severityMap = {
      success: 'success',
      error: 'error',
      info: 'info',
      warning: 'warn'
    };

    toast?.add({
      severity: severityMap[options.type] as any,
      summary: options.type.charAt(0).toUpperCase() + options.type.slice(1),
      detail: options.message,
      life: options.duration || 5000
    });
  };

  const clearAllToasts = () => {
    toast?.removeAllGroups();
  };

  return {
    showToast,
    clearAllToasts
  };
});
