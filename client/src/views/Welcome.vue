<template>
  <div class="welcome-page min-h-screen bg-slate-900 flex items-center justify-center p-6 font-mono">
    <div class="max-w-3xl w-full">
      <!-- Main Card -->
      <div class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-12 text-center space-y-8 shadow-2xl">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <img 
              src="/workbench_icon.png" 
              alt="Workbench" 
              class="w-32 h-32 rounded-2xl shadow-lg shadow-emerald-500/20"
            />
            <div class="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <!-- Title -->
        <div class="space-y-4">
          <h1 class="text-5xl font-bold text-emerald-400">
            Welcome to Workbench
          </h1>
          <p class="text-xl text-slate-300">
            Craft, Trade & Collect Digital Items
          </p>
        </div>

        <!-- Description -->
        <div class="max-w-2xl mx-auto space-y-4 text-slate-400">
          <p class="text-lg leading-relaxed">
            A decentralized crafting game where you can create unique items by combining ingredients, 
            trade with other players, and build your collection on the blockchain.
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="bg-slate-700/50 border border-slate-600 rounded-xl p-6 space-y-3">
            <div class="text-4xl">⚒️</div>
            <h3 class="text-emerald-400 font-semibold text-lg">Craft Items</h3>
            <p class="text-slate-400 text-sm">
              Combine ingredients to craft powerful items using our interactive workbench
            </p>
          </div>

          <div class="bg-slate-700/50 border border-slate-600 rounded-xl p-6 space-y-3">
            <div class="text-4xl">🛒</div>
            <h3 class="text-emerald-400 font-semibold text-lg">Shop & Trade</h3>
            <p class="text-slate-400 text-sm">
              Claim free ingredients or trade items with other players in the marketplace
            </p>
          </div>

          <div class="bg-slate-700/50 border border-slate-600 rounded-xl p-6 space-y-3">
            <div class="text-4xl">💎</div>
            <h3 class="text-emerald-400 font-semibold text-lg">Own Your Items</h3>
            <p class="text-slate-400 text-sm">
              All items are NFTs on the blockchain - truly owned by you forever
            </p>
          </div>
        </div>

        <!-- Connect Wallet Button -->
        <div class="mt-12 space-y-4">
          <button
            @click="openWalletModal"
            class="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:scale-105"
          >
            Connect Wallet to Start
          </button>
          
          <p class="text-slate-500 text-sm">
            You'll need a Web3 wallet like MetaMask or Trust Wallet to play
          </p>
        </div>

        <!-- Additional Info -->
        <div class="pt-8 border-t border-slate-700 mt-8">
          <div class="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-500">
            <a 
              href="#" 
              class="hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              How it works
            </a>
            <span class="hidden md:block">•</span>
            <a 
              href="#" 
              class="hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Documentation
            </a>
            <span class="hidden md:block">•</span>
            <a 
              href="#" 
              class="hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
              </svg>
              Community
            </a>
          </div>
        </div>
      </div>

      <!-- Network Info -->
      <div class="mt-6 text-center">
        <p class="text-slate-500 text-sm">
          Running on <span class="text-emerald-400 font-semibold">Status Network Testnet</span>
        </p>
      </div>
    </div>

    <!-- Wallet Selection Modal -->
    <Dialog 
      v-model:visible="showWalletModal" 
      modal
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
          <div class="flex items-center justify-between mb-4">
            <p class="modal-subtitle mb-0">
              Choose a wallet provider to connect
            </p>
            <button 
              @click="showWalletModal = false" 
              class="close-button"
              aria-label="Close"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
          <p class="modal-description">
            Connect with one of available wallet providers or create a new wallet.
          </p>
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
        <div v-if="walletStore.availableProviders.length === 0 || !hasInstalledWallets" class="no-wallets-message">
          <div class="no-wallets-card">
            <div class="warning-icon">⚠️</div>
            <h3 class="text-white font-semibold text-lg mb-2">No Wallets Detected</h3>
            <p class="text-slate-400 text-sm mb-4">
              You need a Web3 wallet to play Workbench. Install one of these popular options:
            </p>
            <div class="install-options">
              <a 
                href="https://metamask.io/download/" 
                target="_blank"
                class="install-link"
              >
                <span class="install-link-icon">🦊</span>
                <span class="install-link-text">
                  <span class="font-semibold">MetaMask</span>
                  <span class="text-xs text-slate-400">Most popular wallet</span>
                </span>
                <i class="pi pi-external-link text-sm"></i>
              </a>
              <a 
                href="https://trustwallet.com/download" 
                target="_blank"
                class="install-link"
              >
                <span class="install-link-icon">🛡️</span>
                <span class="install-link-text">
                  <span class="font-semibold">Trust Wallet</span>
                  <span class="text-xs text-slate-400">Mobile & Desktop</span>
                </span>
                <i class="pi pi-external-link text-sm"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="error-message">
          <div class="p-3 bg-red-900/50 border border-red-500 rounded-lg">
            <div class="text-red-400 text-sm">{{ error }}</div>
          </div>
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
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';

const walletStore = useWalletStore();
const toastStore = useToastStore();
const showWalletModal = ref(false);
const error = ref('');

// Check if any wallets are installed
const hasInstalledWallets = computed(() => {
  return walletStore.availableProviders.some(p => p.installed);
});

// Open wallet selection modal
const openWalletModal = () => {
  error.value = '';
  showWalletModal.value = true;
};

// Connect to selected wallet
const connectToWallet = async (walletId: string) => {
  error.value = '';
  try {
    await walletStore.connectWallet(walletId);
    showWalletModal.value = false;
    
    toastStore.showToast({
      type: 'success',
      message: 'Wallet connected successfully! Welcome to Workbench.'
    });
  } catch (err: any) {
    console.error('Failed to connect wallet:', err);
    error.value = err.message || 'Failed to connect wallet. Please try again.';
  }
};

// Get install link for wallet
const getInstallLink = (walletId: string): string => {
  const links: { [key: string]: string } = {
    metamask: 'https://metamask.io/download/',
    coinbase: 'https://www.coinbase.com/wallet/downloads',
    trust: 'https://trustwallet.com/download',
    walletconnect: 'https://walletconnect.com/'
  };
  return links[walletId] || 'https://ethereum.org/en/wallets/find-wallet/';
};

// Handle image load errors
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
};
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-page img {
  animation: float 3s ease-in-out infinite;
}

/* Wallet Modal Styles */
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

.close-button {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.close-button:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #ffffff;
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

.no-wallets-message {
  margin-bottom: 2rem;
}

.no-wallets-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.install-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.install-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  transition: all 0.2s ease;
}

.install-link:hover {
  border-color: #10b981;
  background: #1e293b;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.install-link-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.install-link-text {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-message {
  margin-bottom: 1.5rem;
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

.mb-0 {
  margin-bottom: 0;
}
</style>

