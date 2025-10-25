<template>
  <div class="wallet-connect">
    <!-- Connect Button -->
    <button
      v-if="!walletStore.connected"
      @click="handleConnectClick"
      :disabled="walletStore.isLoading"
      class="px-4 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs"
      :class="{ 'opacity-50 cursor-not-allowed': walletStore.isLoading }"
    >
      {{ walletStore.isLoading ? '[Connecting...]' : '[Connect Wallet]' }}
    </button>

    <!-- Connected State -->
    <div v-else class="flex items-center gap-2">
      <!-- Address with Network -->
      <button
        class="px-3 py-1 rounded border border-emerald-500 text-emerald-400 hover:bg-emerald-600/10 transition-colors text-xs flex items-center gap-2"
        @click="handleConnectClick"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{{ walletStore.shortAddress }}</span>
        <span class="text-slate-400">|</span>
        <span class="text-slate-400">{{ networkName }}</span>
      </button>
      
      <!-- Disconnect Button -->
      <button
        @click="disconnectWallet"
        class="px-3 py-1 rounded border border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400 transition-colors text-xs"
        title="Disconnect"
      >
        [Disconnect]
      </button>
    </div>

    <!-- Wallet Selection Modal -->
    <Dialog 
      v-model:visible="showWalletModal" 
      modal
      header="Choose a wallet provider to connect"
      :style="{
        width: '600px', 
        maxWidth: '90vw',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '2px solid #334155',
        padding: '20px 10px',
        color: '#ffffff'
      }"
      :closable="true"
      :draggable="false"
      :showHeader="false"
      class="wallet-modal"
    >
      <div class="wallet-selection">
        <div class="modal-header-info">
          <p class="modal-subtitle">Choose a wallet provider to connect</p>
          <p class="modal-description">Connect with one of available wallet providers or create a new wallet.</p>
        </div>
        
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
              <p class="wallet-status" :class="provider.installed ? 'text-emerald-400' : 'text-slate-400'">
                <i :class="provider.installed ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                {{ provider.installed ? 'Ready to connect' : 'Not installed' }}
              </p>
            </div>
            <div class="wallet-action">
              <i 
                v-if="provider.installed" 
                class="pi pi-arrow-right"
              ></i>
              <a 
                v-else
                :href="getInstallLink(provider.id)"
                target="_blank"
                class="install-badge"
                @click.stop
              >
                Install
              </a>
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

        <!-- Help Section -->
        <div class="help-section">
          <div class="help-card">
            <div class="help-icon">
              <i class="pi pi-question-circle"></i>
            </div>
            <div class="help-content">
              <h4 class="help-title">New to Ethereum wallets?</h4>
              <p class="help-description">
                A wallet lets you connect to Workbench and manage your digital assets.
              </p>
              <a 
                href="https://ethereum.org/en/wallets/" 
                target="_blank" 
                class="help-link"
              >
                Learn more about wallets
                <i class="pi pi-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

const getInstallLink = (walletId: string): string => {
  const links: { [key: string]: string } = {
    metamask: 'https://metamask.io/download/',
    coinbase: 'https://www.coinbase.com/wallet/downloads',
    trust: 'https://trustwallet.com/download',
    walletconnect: 'https://walletconnect.com/'
  };
  return links[walletId] || 'https://ethereum.org/en/wallets/find-wallet/';
};

// Check for existing connection on mount
onMounted(async () => {
  await walletStore.checkConnection();
});
</script>

<style scoped>
.wallet-selection {
  padding-right: 20px;
  padding-left: 20px;
}

.modal-header-info {
  margin-bottom: 2rem;
}

.modal-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.modal-description {
  font-size: 0.875rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
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
  color: #ffffff !important;
  border-radius: 12px 12px 0 0;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #334155;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-title) {
  color: #ffffff !important;
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-header-icon) {
  color: #94a3b8 !important;
  background: transparent !important;
  opacity: 1;
  transition: all 0.2s ease;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
}

.wallet-modal :deep(.p-dialog-header .p-dialog-header-icon:hover) {
  color: #ffffff !important;
  background: rgba(148, 163, 184, 0.1) !important;
  transform: scale(1.05);
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

.install-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.install-badge:hover {
  background: #10b981;
  color: #0f172a;
  transform: scale(1.05);
}

.help-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #334155;
}

.help-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid #334155;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.help-card:hover {
  border-color: #10b981;
  background: rgba(15, 23, 42, 0.8);
}

.help-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 10px;
  color: #10b981;
  font-size: 1.25rem;
}

.help-content {
  flex: 1;
}

.help-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.375rem 0;
  line-height: 1.3;
}

.help-description {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.help-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #10b981;
  text-decoration: none;
  transition: all 0.2s ease;
}

.help-link:hover {
  color: #34d399;
  transform: translateX(2px);
}

.help-link .ml-1 {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.mr-1 {
  margin-right: 0.25rem;
}
</style>