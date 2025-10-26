import { defineStore } from 'pinia';
import { useToast as usePrimeToast } from 'primevue/usetoast';

export const useToastStore = defineStore('toast', () => {
  let toast: ReturnType<typeof usePrimeToast> | null = null;

  const initToast = () => {
    if (!toast) {
      try {
        toast = usePrimeToast();
      } catch (error) {
        console.warn('PrimeVue Toast not available, using fallback:', error);
        toast = null;
      }
    }
  };

  const showToast = (options: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }) => {
    initToast();
    
    // Fallback to console if PrimeVue Toast is not available
    if (!toast) {
      console.log(`[${options.type.toUpperCase()}] ${options.message}`);
      return;
    }
    
    const severityMap = {
      success: 'success',
      error: 'error',
      info: 'info',
      warning: 'warn'
    };

    try {
      toast.add({
        severity: severityMap[options.type] as any,
        summary: options.type.charAt(0).toUpperCase() + options.type.slice(1),
        detail: options.message,
        life: options.duration || 5000
      });
    } catch (error) {
      console.warn('Toast display failed, using console fallback:', error);
      console.log(`[${options.type.toUpperCase()}] ${options.message}`);
    }
  };

  const clearAllToasts = () => {
    if (toast) {
      try {
        toast.removeAllGroups();
      } catch (error) {
        console.warn('Clear toasts failed:', error);
      }
    }
  };

  return {
    showToast,
    clearAllToasts
  };
});
