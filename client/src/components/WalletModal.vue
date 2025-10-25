<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Connect Wallet"
    :headerStyle="{ color: '#ffffff' }"
    :style="{ width: '400px' }"
    :draggable="false"
    class="wallet-modal"
  >
    <div class="wallet-providers">
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold text-white mb-2">Choose a wallet</h3>
        <p class="text-slate-400 text-sm">Connect your wallet to start playing</p>
      </div>

      <div class="space-y-3">
        <button
          v-for="provider in walletStore.availableProviders"
          :key="provider.name"
          @click="connectWithProvider(provider)"
          :disabled="isConnecting"
          class="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="isConnecting ? 'border-slate-600 bg-slate-800' : 'border-slate-600 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700'"
        >
          <div class="text-2xl">{{ provider.icon }}</div>
          <div class="flex-1 text-left">
            <div class="text-white font-medium">{{ provider.name }}</div>
            <div class="text-slate-400 text-sm">
              {{ provider.name === 'MetaMask' ? 'Browser extension' : 'Mobile & Desktop' }}
            </div>
          </div>
          <div v-if="isConnecting" class="text-emerald-400">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
        </button>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
        <div class="text-red-400 text-sm">{{ error }}</div>
      </div>

      <div class="mt-6 text-center">
        <p class="text-slate-500 text-xs">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import type { WalletProvider } from '@/types';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const walletStore = useWalletStore();
const toastStore = useToastStore();

const isConnecting = ref(false);
const error = ref<string | null>(null);

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const connectWithProvider = async (provider: WalletProvider) => {
  try {
    isConnecting.value = true;
    error.value = null;

    await provider.connector();

    toastStore.showToast({
      type: 'success',
      message: `Connected with ${provider.name}`
    });

    isVisible.value = false;
  } catch (err: any) {
    console.error('Connection failed:', err);
    error.value = err.message || 'Failed to connect wallet';
    
    toastStore.showToast({
      type: 'error',
      message: `Failed to connect with ${provider.name}`
    });
  } finally {
    isConnecting.value = false;
  }
};
</script>

<style scoped>
.wallet-modal :deep(.p-dialog-header) {
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.wallet-modal :deep(.p-dialog-content) {
  background: #0f172a;
  padding: 1.5rem;
}

.wallet-modal :deep(.p-dialog) {
  background: #0f172a;
  border: 1px solid #334155;
}
</style>
