<template>
  <div class="wallet-connect">
    <button
      v-if="!walletStore.connected"
      @click="connectWallet"
      :disabled="isConnecting"
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <svg
        v-if="isConnecting"
        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <svg
        v-else
        class="w-5 h-5 mr-2"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05c-3.124-3.124-8.19-3.124-11.314 0a1 1 0 01-1.414-1.414c4.01-4.01 10.518-4.01 14.528 0a1 1 0 01-1.414 1.414zM12.12 13.88c-1.171-1.171-3.073-1.171-4.244 0a1 1 0 01-1.415-1.415c2.006-2.005 5.259-2.005 7.264 0a1 1 0 01-1.415 1.415zM9 16a1 1 0 112 0 1 1 0 01-2 0z"
          clip-rule="evenodd"
        />
      </svg>
      {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
    </button>

    <div
      v-else
      class="flex items-center space-x-3 bg-slate-700 rounded-lg px-4 py-2"
    >
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
        <span class="text-sm font-medium text-white">
          {{ walletStore.shortAddress }}
        </span>
      </div>
      
      <button
        @click="disconnectWallet"
        class="text-slate-400 hover:text-white transition-colors duration-200"
        title="Disconnect"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';

const walletStore = useWalletStore();
const toastStore = useToastStore();

const isConnecting = ref(false);

const connectWallet = async () => {
  try {
    isConnecting.value = true;
    const address = await walletStore.connectWallet();
    
    toastStore.showToast({
      type: 'success',
      message: `Wallet connected: ${walletStore.shortAddress}`
    });
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    toastStore.showToast({
      type: 'error',
      message: 'Failed to connect wallet'
    });
  } finally {
    isConnecting.value = false;
  }
};

const disconnectWallet = () => {
  walletStore.disconnectWallet();
  toastStore.showToast({
    type: 'info',
    message: 'Wallet disconnected'
  });
};
</script>
