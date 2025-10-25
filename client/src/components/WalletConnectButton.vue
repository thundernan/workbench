<template>
  <div class="wallet-connect">
    <!-- Connect Button -->
    <Button
      v-if="!walletStore.connected"
      @click="handleConnectClick"
      :loading="walletStore.isLoading"
      icon="pi pi-wallet"
      :label="walletStore.isLoading ? 'Connecting...' : 'Connect Wallet'"
      severity="success"
      class="p-button-sm"
    />

    <!-- Connected State -->
    <div v-else class="flex items-center gap-2">
      <!-- Network Indicator -->
      <Chip 
        :label="networkName" 
        :icon="networkIcon" 
        :class="networkClass"
        size="small"
      />
      
      <!-- Address -->
      <Chip 
        :label="walletStore.shortAddress" 
        icon="pi pi-check-circle" 
        class="bg-emerald-600" 
        size="small"
      />
      
      <!-- Disconnect Button -->
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

    <!-- Wallet Selection Modal -->
    <Dialog 
      v-model:visible="showWalletModal" 
      modal 
      header="Connect Wallet" 
      :style="{ 
        width: '600px', 
        maxWidth: '90vw',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '2px solid #334155',
        padding: '20px'
      }"
      :closable="true"
      class="wallet-modal"
    >
      <div class="wallet-selection">
        <p class="modal-subtitle">Choose a wallet to connect to your account:</p>
        
        <div class="wallet-grid">
          <div
            v-for="provider in walletStore.availableProviders"
            :key="provider.id"
            @click="provider.installed ? connectToWallet(provider.id) : null"
            class="wallet-option"
            :class="{ 
              'opacity-50 cursor-not-allowed': !provider.installed,
              'cursor-pointer': provider.installed
            }"
          >
            <div class="wallet-icon">
              <img 
                :src="provider.icon" 
                :alt="provider.name"
                class="w-10 h-10 rounded-lg"
                @error="handleImageError"
              />
            </div>
            <div class="wallet-info">
              <h3 class="wallet-name">{{ provider.name }}</h3>
              <p class="wallet-status" :class="provider.installed ? 'text-emerald-400' : 'text-red-400'">
                {{ provider.installed ? 'Available' : 'Not Installed' }}
              </p>
            </div>
            <div class="wallet-action">
              <i 
                v-if="provider.installed" 
                class="pi pi-arrow-right"
              ></i>
              <i 
                v-else 
                class="pi pi-exclamation-triangle text-orange-400"
              ></i>
            </div>
          </div>
        </div>

        <!-- Fallback if no wallets are available -->
        <div v-if="walletStore.availableProviders.length === 0" class="no-wallets">
          <Message severity="warn" :closable="false">
            No Web3 wallets detected. Please install MetaMask or Coinbase Wallet.
          </Message>
        </div>

        <!-- Error Display -->
        <div v-if="walletStore.error" class="error-message">
          <Message severity="error" :closable="false">
            {{ walletStore.error }}
          </Message>
        </div>

        <!-- Install Instructions -->
        <div class="install-instructions">
          <h4 class="install-title">Don't have a wallet?</h4>
          <p class="install-description">
            Install a Web3 wallet to interact with the blockchain
          </p>
          <div class="install-links">
            <a 
              href="https://metamask.io/" 
              target="_blank" 
              class="install-link"
            >
              <i class="pi pi-external-link"></i>
              Install MetaMask
            </a>
            <a 
              href="https://wallet.coinbase.com/" 
              target="_blank" 
              class="install-link"
            >
              <i class="pi pi-external-link"></i>
              Install Coinbase Wallet
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';

const walletStore = useWalletStore();
const toastStore = useToastStore();

const showWalletModal = ref(false);

// Handle connect button click
const handleConnectClick = () => {
  showWalletModal.value = true;
};

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

const networkIcon = computed(() => {
  const icons: { [key: number]: string } = {
    1: 'pi pi-circle-fill',
    137: 'pi pi-circle-fill',
    56: 'pi pi-circle-fill',
    42161: 'pi pi-circle-fill',
    10: 'pi pi-circle-fill'
  };
  return icons[walletStore.chainId || 1] || 'pi pi-circle-fill';
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

const disconnectWallet = async () => {
  try {
    await walletStore.disconnectWallet();
    toastStore.showToast({
      type: 'info',
      message: 'Wallet disconnected'
    });
  } catch (error: any) {
    console.error('Failed to disconnect wallet:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Failed to disconnect wallet'
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
.wallet-selection {
  padding: 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  text-align: center;
}

.wallet-modal :deep(.p-dialog) {
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  background-color: #1e293b !important;
  background: #1e293b !important;
  overflow: hidden;
  border: 2px solid #334155;
  max-width: 90vw;
}

.wallet-modal :deep(.p-dialog .p-dialog-content) {
  background-color: #1e293b !important;
  background: #1e293b !important;
}

.wallet-modal :deep(.p-dialog-mask) {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.75) !important;
}

.wallet-modal :deep(.p-dialog-header) {
  background-color: #1e293b !important;
  background: #1e293b !important;
  color: white !important;
  border-radius: 12px 12px 0 0;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #334155;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-title) {
  color: white !important;
  font-weight: 700;
  font-size: 1.375rem;
  letter-spacing: -0.025em;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-header-icon) {
  color: #94a3b8 !important;
  opacity: 0.8;
  transition: all 0.2s ease;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-header-icon:hover) {
  color: #10b981 !important;
  opacity: 1;
  background: rgba(16, 185, 129, 0.1);
}

.wallet-modal :deep(.p-dialog-content) {
  padding: 2rem 2.5rem 2.5rem 2.5rem;
  background: #1e293b !important;
}

.wallet-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.wallet-option {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border: 2px solid #334155;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #0f172a;
  position: relative;
  overflow: hidden;
}

.wallet-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wallet-option:hover:not(.opacity-50)::before {
  opacity: 1;
}

.wallet-option:hover:not(.opacity-50) {
  border-color: #10b981;
  background-color: #1e293b;
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
}

.wallet-option.opacity-50 {
  cursor: not-allowed;
  background-color: #0f172a;
  opacity: 0.4;
  border-color: #1e293b;
}

.wallet-icon {
  margin-right: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #1e293b;
  border-radius: 10px;
  padding: 8px;
  border: 2px solid #334155;
  position: relative;
  z-index: 1;
}

.wallet-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wallet-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.wallet-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: white;
  letter-spacing: -0.01em;
}

.wallet-status {
  font-size: 0.75rem;
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wallet-action {
  margin-left: 1.25rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.wallet-action .pi {
  font-size: 1.25rem;
  color: #64748b;
  transition: all 0.3s ease;
}

.wallet-option:hover:not(.opacity-50) .wallet-action .pi {
  color: #10b981;
  transform: translateX(4px);
}

.error-message {
  margin-bottom: 1.5rem;
}

.install-instructions {
  padding-top: 1.5rem;
  border-top: 2px solid #334155;
  margin-top: 0.5rem;
}

.install-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
  letter-spacing: -0.01em;
}

.install-description {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.install-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.install-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #10b981;
  text-decoration: none;
  padding: 0.625rem 1rem;
  border: 2px solid #10b981;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
}

.install-link:hover {
  background: #10b981;
  color: #0f172a;
  border-color: #10b981;
  transform: translateX(2px);
}

.install-link .pi {
  font-size: 0.75rem;
}
</style>