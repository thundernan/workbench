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
            @click="connectWallet"
            :disabled="isConnecting"
            class="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span v-if="isConnecting" class="flex items-center justify-center gap-3">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
            <span v-else>Connect Wallet to Start</span>
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
  isConnecting.value = true;
  try {
    // Get available providers
    const providers = walletStore.availableProviders;
    
    if (providers.length === 0) {
      throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
    }
    
    // Find first installed provider
    const installedProvider = providers.find(p => p.installed);
    
    if (!installedProvider) {
      throw new Error('Please install a Web3 wallet like MetaMask to continue.');
    }
    
    // Connect to the first available wallet
    await walletStore.connectWallet(installedProvider.id);
    
    toastStore.showToast({
      type: 'success',
      message: 'Wallet connected successfully! Welcome to Workbench.'
    });
  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Failed to connect wallet. Please try again.'
    });
  } finally {
    isConnecting.value = false;
  }
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
</style>

