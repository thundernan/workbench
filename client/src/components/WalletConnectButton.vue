<template>
  <div class="wallet-connect">
    <Button
      v-if="!walletStore.connected"
      @click="connectWallet"
      :loading="isConnecting"
      icon="pi pi-wallet"
      :label="isConnecting ? 'Connecting...' : 'Connect Wallet'"
      severity="success"
      class="p-button-sm"
    />

    <div
      v-else
      class="flex items-center gap-2"
    >
      <Chip :label="walletStore.shortAddress" icon="pi pi-check-circle" class="bg-emerald-600" />
      <Button
        @click="disconnectWallet"
        icon="pi pi-sign-out"
        severity="danger"
        size="small"
        text
        rounded
        v-tooltip.bottom="'Disconnect'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
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
