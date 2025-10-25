<template>
  <div class="wallet-test">
    <Card class="max-w-md mx-auto">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-wallet"></i>
          Wallet Connection Test
        </div>
      </template>
      
      <template #content>
        <div class="space-y-4">
          <!-- Connection Status -->
          <div class="status-section">
            <h4 class="font-semibold mb-2">Connection Status</h4>
            <div class="flex items-center gap-2">
              <Chip 
                :label="walletStore.connected ? 'Connected' : 'Disconnected'"
                :class="walletStore.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
              />
              <span v-if="walletStore.connected" class="text-xs text-emerald-400 font-mono">
                {{ walletStore.shortAddress }}
              </span>
            </div>
          </div>

          <!-- Network Info -->
          <div v-if="walletStore.connected" class="network-section">
            <h4 class="font-semibold mb-2">Network</h4>
            <Chip 
              :label="networkName"
              :class="networkClass"
            />
          </div>

          <!-- Available Wallets -->
          <div class="wallets-section">
            <h4 class="font-semibold mb-2">Available Wallets</h4>
            <div class="space-y-2">
              <div 
                v-for="provider in walletStore.availableProviders"
                :key="provider.id"
                class="flex items-center justify-between p-2 border rounded"
              >
                <div class="flex items-center gap-2">
                  <img 
                    :src="provider.icon" 
                    :alt="provider.name"
                    class="w-6 h-6"
                    @error="handleImageError"
                  />
                  <span class="text-sm">{{ provider.name }}</span>
                </div>
                <Chip 
                  :label="provider.installed ? 'Installed' : 'Not Installed'"
                  :class="provider.installed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  size="small"
                />
              </div>
            </div>
          </div>

          <!-- Test Actions -->
          <div class="actions-section">
            <h4 class="font-semibold mb-2">Test Actions</h4>
            <div class="space-y-2">
              <Button 
                v-if="!walletStore.connected"
                @click="showWalletModal = true"
                label="Connect Wallet"
                icon="pi pi-wallet"
                class="w-full"
                severity="success"
              />
              
              <div v-else class="space-y-2">
                <Button 
                  @click="testTransaction"
                  label="Test Transaction"
                  icon="pi pi-send"
                  class="w-full"
                  :loading="walletStore.isLoading"
                />
                
                <Button 
                  @click="testNetworkSwitch"
                  label="Switch to Polygon"
                  icon="pi pi-refresh"
                  class="w-full"
                  severity="secondary"
                  :loading="walletStore.isLoading"
                />
                
                <Button 
                  @click="walletStore.disconnectWallet"
                  label="Disconnect"
                  icon="pi pi-sign-out"
                  class="w-full"
                  severity="danger"
                  text
                />
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="walletStore.error" class="error-section">
            <Message severity="error" :closable="false">
              {{ walletStore.error }}
            </Message>
          </div>
        </div>
      </template>
    </Card>

    <!-- Wallet Selection Modal -->
    <Dialog 
      v-model:visible="showWalletModal" 
      modal 
      header="Connect Wallet" 
      :style="{ width: '400px' }"
    >
      <div class="wallet-selection">
        <p class="text-gray-600 mb-4">Choose a wallet to connect:</p>
        
        <div class="space-y-2">
          <div
            v-for="provider in walletStore.availableProviders"
            :key="provider.id"
            @click="connectToWallet(provider.id)"
            class="wallet-option"
            :class="{ 'opacity-50': !provider.installed }"
          >
            <div class="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <img 
                :src="provider.icon" 
                :alt="provider.name"
                class="w-8 h-8"
                @error="handleImageError"
              />
              <div class="flex-1">
                <h3 class="font-semibold">{{ provider.name }}</h3>
                <p class="text-sm text-gray-500">
                  {{ provider.installed ? 'Available' : 'Not Installed' }}
                </p>
              </div>
              <i 
                v-if="provider.installed" 
                class="pi pi-arrow-right text-gray-400"
              ></i>
              <i 
                v-else 
                class="pi pi-exclamation-triangle text-orange-500"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';

const walletStore = useWalletStore();
const toastStore = useToastStore();

const showWalletModal = ref(false);

// Network information
const networkName = computed(() => {
  const networks: { [key: number]: string } = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism'
  };
  return networks[walletStore.chainId || 1] || `Chain ${walletStore.chainId}`;
});

const networkClass = computed(() => {
  const classes: { [key: number]: string } = {
    1: 'bg-blue-100 text-blue-800',
    137: 'bg-purple-100 text-purple-800',
    56: 'bg-yellow-100 text-yellow-800',
    42161: 'bg-blue-100 text-blue-800',
    10: 'bg-red-100 text-red-800'
  };
  return classes[walletStore.chainId || 1] || 'bg-gray-100 text-gray-800';
});

const connectToWallet = async (walletId: string) => {
  try {
    await walletStore.connectWallet(walletId);
    showWalletModal.value = false;
    
    toastStore.showToast({
      type: 'success',
      message: `Connected to ${walletStore.shortAddress}`
    });
  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Failed to connect wallet'
    });
  }
};

const testTransaction = async () => {
  try {
    const txHash = await walletStore.sendTransaction({
      to: '0x0000000000000000000000000000000000000000',
      value: '0.001',
      data: '0x'
    });
    
    toastStore.showToast({
      type: 'success',
      message: `Transaction sent: ${txHash.slice(0, 10)}...`
    });
  } catch (error: any) {
    console.error('Transaction failed:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Transaction failed'
    });
  }
};

const testNetworkSwitch = async () => {
  try {
    await walletStore.switchNetwork(137); // Switch to Polygon
    
    toastStore.showToast({
      type: 'success',
      message: 'Switched to Polygon network'
    });
  } catch (error: any) {
    console.error('Network switch failed:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Network switch failed'
    });
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
};

// Check for existing connection on mount
onMounted(async () => {
  await walletStore.checkConnection();
});
</script>

<style scoped>
.wallet-test {
  padding: 2rem;
}

.status-section,
.network-section,
.wallets-section,
.actions-section,
.error-section {
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.error-section {
  border-bottom: none;
}

.wallet-option {
  transition: opacity 0.2s ease;
}

.wallet-option.opacity-50 {
  cursor: not-allowed;
}
</style>
