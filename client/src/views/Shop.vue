<template>
  <div class="shop-page min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <AppHeader />

    <!-- Mobile Navigation -->
    <div class="lg:hidden bg-slate-800 border-b border-slate-700">
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2">
          <img 
            src="/workbench_icon.png" 
            alt="Workbench" 
            class="w-8 h-8"
          />
          <h1 class="text-xl font-bold text-white">🛒 Shop</h1>
        </div>
        <WalletConnectButton />
      </div>
    </div>

    <!-- Desktop Header -->
    <div class="hidden lg:block bg-slate-800 border-b border-slate-700">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-emerald-400">🛒 Shop</h1>
            <p class="text-slate-400 mt-1">Claim free ingredients and purchase premium items</p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Wallet Connection Status -->
            <div v-if="walletStore.connected" class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span class="text-sm text-slate-300">{{ walletStore.shortAddress }}</span>
            </div>
            <div v-else class="text-slate-500 text-sm">
              Connect wallet to shop
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <p class="text-slate-400 mt-4">Loading ingredients...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-400 text-4xl mb-4">⚠️</div>
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button 
          @click="loadIngredients(true)" 
          class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="ingredients.length === 0" class="text-center py-12">
        <div class="text-slate-500 text-4xl mb-4">📦</div>
        <p class="text-slate-400">No items available</p>
      </div>

      <!-- Tabs -->
      <div v-else>
        <div class="flex gap-2 mb-6 border-b-2 border-slate-700">
          <button
            @click="activeTab = 0"
            class="px-6 py-3 font-semibold transition-all duration-200"
            :class="activeTab === 0 
              ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-0.5' 
              : 'text-slate-400 hover:text-slate-300'"
          >
            🎁 Free Items ({{ freeIngredients.length }})
          </button>
          <button
            @click="activeTab = 1"
            class="px-6 py-3 font-semibold transition-all duration-200"
            :class="activeTab === 1 
              ? 'text-blue-400 border-b-2 border-blue-400 -mb-0.5' 
              : 'text-slate-400 hover:text-slate-300'"
          >
            💎 Premium Items ({{ paidIngredients.length }})
          </button>
        </div>

        <!-- Free Items Tab -->
        <div v-if="activeTab === 0">
          <!-- Empty State for Free Items -->
          <div v-if="freeIngredients.length === 0" class="text-center py-12">
            <div class="text-slate-500 text-4xl mb-4">🎁</div>
            <p class="text-slate-400">No free items available</p>
          </div>

          <!-- Free Items Claim Banner Section -->
          <div v-else 
        class="rounded-2xl overflow-hidden shadow-2xl transition-all duration-500"
        :class="hasClaimed 
          ? 'bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-slate-800/60 border border-slate-600/50' 
          : 'bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-emerald-800/40 border border-emerald-600/50'"
      >
        <!-- Banner Header -->
        <div 
          class="border-b px-6 py-6 transition-all duration-500"
          :class="hasClaimed 
            ? 'bg-slate-800/40 border-slate-600/30' 
            : 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-emerald-600/30'"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-3xl font-bold flex items-center gap-3 transition-all duration-500"
                :class="hasClaimed ? 'text-slate-400' : 'text-emerald-400'"
              >
                <span v-if="hasClaimed">✅</span>
                <span v-else>🎁</span>
                {{ hasClaimed ? 'Ingredients Claimed!' : 'Free Ingredients Available' }}
              </h2>
              <p class="mt-2 text-lg transition-all duration-500"
                :class="hasClaimed ? 'text-slate-400' : 'text-slate-300'"
              >
                <span v-if="hasClaimed">
                  You've successfully claimed 5x of each ingredient ({{ freeIngredients.length }} types)!
                </span>
                <span v-else>
                  Claim 5x of each ingredient ({{ freeIngredients.length }} types) with one click!
                </span>
              </p>
              <p class="text-sm mt-2 transition-all duration-500"
                :class="hasClaimed ? 'text-slate-500' : 'text-slate-400'"
              >
                <span v-if="hasClaimed">
                  💚 {{ freeIngredients.length * 5 }} items have been minted to your wallet. You can claim again anytime!
                </span>
                <span v-else>
                  💡 You'll receive {{ freeIngredients.length * 5 }} total items. Save on gas fees by batch minting!
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Banner Content - Ingredients Grid -->
        <div class="p-5">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <div
              v-for="ingredient in freeIngredients"
              :key="ingredient._id"
              class="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-200 overflow-hidden flex flex-col shadow-lg hover:shadow-emerald-500/20"
            >
              <!-- Image -->
              <div class="aspect-square bg-slate-700/50 flex items-center justify-center flex-shrink-0 relative">
                <img
                  v-if="ingredient.metadata.image"
                  :src="ingredient.metadata.image"
                  :alt="ingredient.metadata.name || 'Ingredient'"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <div v-else class="text-4xl text-slate-500">
                  {{ getIngredientIcon(ingredient) }}
                </div>
                <!-- Free Badge -->
                <div class="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold shadow-lg">
                  FREE
                </div>
              </div>

              <!-- Content -->
              <div class="p-3 flex flex-col flex-grow">
                <!-- Name -->
                <h3 class="font-semibold text-sm text-white truncate">
                  {{ ingredient.metadata.name || `Token #${ingredient.tokenId}` }}
                </h3>

                <!-- Category -->
                <p v-if="ingredient.metadata.category" class="text-slate-400 text-xs mt-1">
                  {{ ingredient.metadata.category }}
                </p>

                <!-- Description - Hidden on small screens -->
                <div class="text-slate-500 text-xs mt-1 line-clamp-1 flex-grow hidden md:block">
                  <p v-if="ingredient.metadata.description">
                    {{ ingredient.metadata.description }}
                  </p>
                </div>

                <!-- Balance Info -->
                <div v-if="walletStore.connected" class="mt-2 pt-2 border-t border-slate-700/50">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400">Balance:</span>
                    <span class="text-emerald-400 font-bold">
                      {{ getUserBalance(ingredient) }}
                    </span>
                  </div>
                </div>
                <div v-else class="mt-2 pt-2 border-t border-slate-700/50">
                  <div class="text-xs text-center text-slate-500">
                    Connect wallet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Banner Footer - Claim Button -->
        <div 
          class="border-t px-6 py-5 transition-all duration-500"
          :class="hasClaimed 
            ? 'bg-slate-800/30 border-slate-600/30' 
            : 'bg-slate-900/50 border-emerald-600/30'"
        >
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-center sm:text-left">
              <p class="font-medium transition-all duration-500"
                :class="hasClaimed ? 'text-slate-400' : 'text-slate-300'"
              >
                <span v-if="hasClaimed">
                  Want more? <span class="text-emerald-400 font-bold">Claim again!</span>
                </span>
                <span v-else>
                  Ready to claim <span class="text-emerald-400 font-bold">{{ freeIngredients.length * 5 }}</span> free items?
                </span>
              </p>
              <p class="text-sm mt-1 transition-all duration-500"
                :class="hasClaimed ? 'text-slate-500' : 'text-slate-500'"
              >
                <span v-if="hasClaimed">
                  You can claim free ingredients as many times as you want
                </span>
                <span v-else>
                  5x of each type will be minted to your wallet in a single transaction
                </span>
              </p>
            </div>
            
            <!-- Primary Button (Not Claimed State) -->
            <button
              v-if="!hasClaimed"
              @click="batchClaimFreeIngredients"
              :disabled="!walletStore.connected || isBuying || freeIngredients.length === 0"
              class="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-8 rounded-xl transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center gap-3 whitespace-nowrap transform hover:scale-105 disabled:transform-none"
            >
              <span v-if="isBuying">⏳ Claiming All Items...</span>
              <span v-else-if="!walletStore.connected">🔌 Connect Wallet First</span>
              <span v-else>
                <span class="text-2xl">🎁</span>
                Claim All {{ freeIngredients.length * 5 }} Items Now
              </span>
            </button>
            
            <!-- Secondary Button (Claimed State) -->
            <button
              v-else
              @click="batchClaimFreeIngredients"
              :disabled="!walletStore.connected || isBuying || freeIngredients.length === 0"
              class="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-4 px-8 rounded-xl transition-all duration-200 font-bold text-lg border-2 border-slate-600 hover:border-emerald-500 flex items-center justify-center gap-3 whitespace-nowrap transform hover:scale-105 disabled:transform-none"
            >
              <span v-if="isBuying">⏳ Claiming Again...</span>
              <span v-else-if="!walletStore.connected">🔌 Connect Wallet First</span>
              <span v-else>
                <span class="text-xl">🔄</span>
                Claim Again
              </span>
            </button>
          </div>
        </div>
      </div>
      </div>

        <!-- Premium Items Tab -->
        <div v-if="activeTab === 1">
          <!-- Empty State for Paid Items -->
          <div v-if="paidIngredients.length === 0" class="text-center py-12">
            <div class="text-slate-500 text-4xl mb-4">💎</div>
            <p class="text-slate-400">No premium items available</p>
          </div>

          <!-- Paid Items Section -->
          <div v-else class="bg-slate-800 border-2 border-slate-700 rounded-2xl overflow-hidden">
            <!-- Section Header -->
            <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-slate-700 px-6 py-6">
              <h2 class="text-3xl font-bold text-blue-400 flex items-center gap-3">
                💎 Premium Items
              </h2>
              <p class="text-slate-300 mt-2 text-lg">
                Purchase special ingredients with ETH
              </p>
            </div>

            <!-- Items Grid -->
            <div class="p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div
                v-for="ingredient in paidIngredients"
                :key="ingredient._id"
                class="bg-slate-700/80 backdrop-blur-sm rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 overflow-hidden flex flex-col shadow-lg hover:shadow-blue-500/20"
              >
                <!-- Image -->
                <div class="aspect-square bg-slate-600/50 flex items-center justify-center flex-shrink-0 relative">
                  <img
                    v-if="ingredient.metadata.image"
                    :src="ingredient.metadata.image"
                    :alt="ingredient.metadata.name || 'Ingredient'"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                  <div v-else class="text-5xl text-slate-500">
                    {{ getIngredientIcon(ingredient) }}
                  </div>
                  <!-- Price Badge -->
                  <div class="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                    {{ getPriceInEth(ingredient) }} ETH
                  </div>
                </div>

                <!-- Content -->
                <div class="p-3 flex flex-col flex-grow">
                  <!-- Name -->
                  <h3 class="font-semibold text-base text-white truncate">
                    {{ ingredient.metadata.name || `Token #${ingredient.tokenId}` }}
                  </h3>

                  <!-- Category -->
                  <p v-if="ingredient.metadata.category" class="text-slate-400 text-xs mt-1">
                    {{ ingredient.metadata.category }}
                  </p>

                  <!-- Description -->
                  <div class="text-slate-500 text-xs mt-2 line-clamp-2 flex-grow">
                    <p v-if="ingredient.metadata.description">
                      {{ ingredient.metadata.description }}
                    </p>
                  </div>

                  <!-- Balance Info -->
                  <div v-if="walletStore.connected" class="mt-3 pt-3 border-t border-slate-600/50">
                    <div class="flex items-center justify-between text-xs mb-3">
                      <span class="text-slate-400">Your Balance:</span>
                      <span class="text-emerald-400 font-bold">
                        {{ getUserBalance(ingredient) }}
                      </span>
                    </div>
                    
                    <!-- Buy Button -->
                    <button
                      @click="buyIngredient(ingredient)"
                      :disabled="isBuying"
                      class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-blue-500/50 transform hover:scale-105 disabled:transform-none"
                    >
                      <span v-if="isBuying">⏳ Processing...</span>
                      <span v-else>Buy for {{ getPriceInEth(ingredient) }} ETH</span>
                    </button>
                  </div>
                  <div v-else class="mt-3 pt-3 border-t border-slate-600/50">
                    <button
                      disabled
                      class="w-full py-2 px-4 bg-slate-600 cursor-not-allowed text-slate-400 rounded-lg text-sm"
                    >
                      Connect Wallet to Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import apiService from '@/services/apiService';
import { ethers } from 'ethers';
import AppHeader from '@/components/AppHeader.vue';
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import { IIngredient } from '@/stores/recipes';

// Extend Window interface for ethereum (if not already defined)
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isTrust?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const walletStore = useWalletStore();
const toastStore = useToastStore();

// State
const ingredients = ref<IIngredient[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isBuying = ref(false);
const userBalances = ref<Map<string, string>>(new Map());
const hasClaimed = ref(false);
const activeTab = ref(0); // 0 = Free Items, 1 = Premium Items

// Computed free ingredients
const freeIngredients = computed(() => {
  return ingredients.value.filter(ingredient => getPriceInEth(ingredient) === '0');
});

// Computed paid ingredients
const paidIngredients = computed(() => {
  return ingredients.value.filter(ingredient => getPriceInEth(ingredient) !== '0');
});

// Track if we're currently loading to prevent duplicate requests
let isLoadingIngredients = false;
let lastLoadTime = 0;
const LOAD_DEBOUNCE_MS = 1000; // Debounce requests by 1 second

// Load ingredients from backend
const loadIngredients = async (force = false) => {
  // Prevent duplicate concurrent requests
  if (isLoadingIngredients && !force) {
    return;
  }

  // Debounce rapid requests
  const now = Date.now();
  if (!force && now - lastLoadTime < LOAD_DEBOUNCE_MS) {
    return;
  }
  isLoading.value = true;
  isLoadingIngredients = true;
  error.value = null;
  lastLoadTime = now;

  try {
    // Removed health check - it's unnecessary and adds extra API calls
    // The getIngredients call will fail if server is down anyway
    
    const fetchedIngredients = await apiService.getIngredients({ limit: 50 });
    
    if (Array.isArray(fetchedIngredients)) {
      ingredients.value = fetchedIngredients;
    } else {
      error.value = 'Invalid response format from server';
    }
  } catch (err: any) {
    console.error('❌ Shop: Failed to load ingredients:', err);
    
    // Check if it's a rate limit error
    if (err.message?.includes('Too many requests') || err.message?.includes('rate limit')) {
      error.value = 'Too many requests. Please wait a moment and try again.';
    } else {
      error.value = err.message || 'Failed to load ingredients';
    }
  } finally {
    isLoading.value = false;
    isLoadingIngredients = false;
  }
};

// Get price in ETH
const getPriceInEth = (ingredient: IIngredient): string => {
  const priceWei = ingredient.metadata.price;
  if (!priceWei || priceWei === '0') {
    return '0';
  }
  try {
    return ethers.formatEther(priceWei);
  } catch {
    return '0';
  }
};

// Get ingredient icon fallback
const getIngredientIcon = (ingredient: IIngredient): string => {
  const category = ingredient.metadata.category?.toLowerCase();
  
  switch (category) {
    case 'material': return '📦';
    case 'weapon': return '⚔️';
    case 'tool': return '⛏️';
    case 'armor': return '🛡️';
    case 'consumable': return '🧪';
    case 'rare': return '💎';
    case 'legendary': return '👑';
    default: return '🔹';
  }
};

// Handle image loading errors
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img) {
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = `<div class="text-6xl text-slate-500">${getIngredientIcon(ingredients.value.find(i => i.metadata.image === img.src) || ingredients.value[0])}</div>`;
    }
  }
};

// Batch claim all free ingredients
const batchClaimFreeIngredients = async () => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (freeIngredients.value.length === 0) {
    toastStore.showToast({
      type: 'info',
      message: 'No free ingredients available to claim'
    });
    return;
  }

  isBuying.value = true;

  try {
    // Create fresh provider and signer from window.ethereum
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    // Validate that the provider is Ethereum-compatible
    let provider: ethers.BrowserProvider;
    try {
      const testChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!testChainId || testChainId === 'null' || testChainId === 'undefined') {
        throw new Error('Provider does not support Ethereum JSON-RPC methods');
      }
      
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
    } catch (providerError: any) {
      const errorMessage = providerError.message || '';
      
      if (errorMessage.includes('Invalid RPC URL') || 
          errorMessage.includes('solana') ||
          providerError.code === -32603) {
        throw new Error(
          'Trust Wallet is configured for Solana network. ' +
          'Please switch to Ethereum network in your Trust Wallet settings, or use a different wallet like MetaMask.'
        );
      }
      throw new Error(`Invalid wallet provider: ${errorMessage || 'Provider does not support Ethereum'}`);
    }
    
    // Get signer
    const signer = await provider.getSigner();

    // Get the contract address from the first ingredient (all should be the same)
    const contractAddress = freeIngredients.value[0].tokenContract;
    
    // Prepare arrays for batch minting
    const tokenIds: number[] = [];
    const amounts: number[] = [];
    
    freeIngredients.value.forEach(ingredient => {
      tokenIds.push(Number(ingredient.tokenId));
      amounts.push(5); // Claim 5 of each
    });

    // Create contract instance with batch mint ABI
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function publicMintBatch(uint256[] ids, uint256[] amounts) payable',
        'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
        'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
      ],
      signer
    );

    // Execute batch mint (all free items, so value is 0)
    const tx = await contract.publicMintBatch(tokenIds, amounts, {
      value: 0, // All items are free
      gasLimit: 300000 + (50000 * tokenIds.length) // Dynamic gas limit based on number of items
    });
    
    // Get short hash for display
    const shortHash = `${tx.hash.slice(0, 8)}...${tx.hash.slice(-4)}`;
    
    // Show pending toast
    toastStore.showToast({
      type: 'info',
      message: `Claiming ${tokenIds.length} free items... TX: ${shortHash}`
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    // Get new balances for all minted tokens
    if (!walletStore.address) {
      throw new Error('Wallet address not available');
    }
    const addresses = new Array(tokenIds.length).fill(walletStore.address);
    const newBalances = await contract.balanceOfBatch(addresses, tokenIds);

    // Show success toast with item names
    const itemNames = freeIngredients.value
      .map(ing => ing.metadata.name || `Token #${ing.tokenId}`)
      .join(', ');
    
    toastStore.showToast({
      type: 'success',
      message: `🎉 Successfully claimed ${tokenIds.length} free items: ${itemNames.length > 100 ? itemNames.substring(0, 97) + '...' : itemNames}`,
      duration: 6000
    });

    // Set claimed state
    hasClaimed.value = true;

    // Refresh inventory
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    }

    // Refresh user balances
    await loadUserBalances();

  } catch (err: any) {
    let errorMessage = 'Failed to claim free ingredients';
    
    if (err.message?.includes('Trust Wallet is configured for Solana') ||
        err.message?.includes('Invalid RPC URL') ||
        (err.message?.includes('solana') && err.code === -32603)) {
      errorMessage = err.message || 
        'Trust Wallet is configured for Solana network. Please switch to Ethereum network in Trust Wallet settings, or use MetaMask.';
    } else if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH balance for gas fees';
    } else if (err.message?.includes('user rejected') || err.message?.includes('User denied')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (err.message?.includes('gas')) {
      errorMessage = 'Transaction failed due to gas issues. Try again.';
    } else if (err.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Transaction failed. Items may not be available for minting.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    toastStore.showToast({
      type: 'error',
      message: errorMessage,
      duration: 5000
    });
  } finally {
    isBuying.value = false;
  }
};

// Buy individual paid ingredient
const buyIngredient = async (ingredient: IIngredient) => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  const priceInEth = getPriceInEth(ingredient);
  if (priceInEth === '0') {
    toastStore.showToast({
      type: 'info',
      message: 'This item is free. Use the batch claim feature instead.'
    });
    return;
  }

  isBuying.value = true;

  try {
    // Create fresh provider and signer from window.ethereum
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    // Validate that the provider is Ethereum-compatible
    let provider: ethers.BrowserProvider;
    try {
      const testChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!testChainId || testChainId === 'null' || testChainId === 'undefined') {
        throw new Error('Provider does not support Ethereum JSON-RPC methods');
      }
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
    } catch (providerError: any) {
      throw new Error('Please switch to Status Network in your wallet settings.');
    }
    
    // Get signer
    const signer = await provider.getSigner();

    // Get the contract address
    const contractAddress = ingredient.tokenContract;
    
    // Calculate price in wei
    const priceInWei = ethers.parseEther(priceInEth);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function publicMint(uint256 id, uint256 amount) payable',
        'function balanceOf(address account, uint256 id) view returns (uint256)'
      ],
      signer
    );

    // Execute mint with payment
    const tx = await contract.publicMint(ingredient.tokenId, 1, {
      value: priceInWei,
      gasLimit: 150000
    });
    
    // Get short hash for display
    const shortHash = `${tx.hash.slice(0, 8)}...${tx.hash.slice(-4)}`;
    
    // Show pending toast
    toastStore.showToast({
      type: 'info',
      message: `Purchasing ${ingredient.metadata.name}... TX: ${shortHash}`
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    // Get new balance
    if (!walletStore.address) {
      throw new Error('Wallet address not available');
    }
    const newBalance = await contract.balanceOf(walletStore.address, ingredient.tokenId);

    // Show success toast
    toastStore.showToast({
      type: 'success',
      message: `🎉 Successfully purchased ${ingredient.metadata.name} for ${priceInEth} ETH!`,
      duration: 6000
    });

    // Refresh inventory
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    }

    // Refresh user balances
    await loadUserBalances();

  } catch (err: any) {
    let errorMessage = 'Failed to purchase item';
    
    if (err.message?.includes('user rejected') || err.message?.includes('User denied')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH balance for purchase and gas fees';
    } else if (err.message?.includes('gas')) {
      errorMessage = 'Transaction failed due to gas issues. Try again.';
    } else if (err.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Transaction failed. Item may not be available for purchase.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    toastStore.showToast({
      type: 'error',
      message: errorMessage,
      duration: 5000
    });
  } finally {
    isBuying.value = false;
  }
};

// Track balance loading to prevent duplicate requests
let isLoadingBalances = false;
let lastBalanceLoadTime = 0;
const BALANCE_DEBOUNCE_MS = 2000; // Debounce balance requests by 2 seconds

// Load user balances for all ingredients
const loadUserBalances = async (force = false) => {
  if (!walletStore.connected || ingredients.value.length === 0) {
    return;
  }

  // Prevent duplicate concurrent requests
  if (isLoadingBalances && !force) {
    return;
  }

  // Debounce rapid requests
  const now = Date.now();
  if (!force && now - lastBalanceLoadTime < BALANCE_DEBOUNCE_MS) {
    return;
  }

  isLoadingBalances = true;
  lastBalanceLoadTime = now;

  try {
    // Check for window.ethereum
    if (!window.ethereum) {
      return;
    }

    // Validate that the provider is Ethereum-compatible
    try {
      const testChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!testChainId || testChainId === 'null' || testChainId === 'undefined') {
        return;
      }
    } catch (providerError: any) {
      return;
    }

    // Create fresh provider (read-only operations)
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get contract address
    const contractAddress = ingredients.value[0]?.tokenContract;
    if (!contractAddress) {
      return;
    }
    
    // Create contract instance with provider (read-only)
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
      ],
      provider
    );

    // Get balances for all tokens
    if (!walletStore.address) {
      return;
    }
    const tokenIds = ingredients.value.map(ing => ing.tokenId);
    const addresses = new Array(tokenIds.length).fill(walletStore.address);
    
    const balances = await contract.balanceOfBatch(addresses, tokenIds);
    
    // Update balances map
    const newBalances = new Map<string, string>();
    ingredients.value.forEach((ingredient, index) => {
      newBalances.set(ingredient.tokenId, balances[index].toString());
    });
    
    userBalances.value = newBalances;
    
  } catch (err: any) {
    // Don't show error for rate limiting on blockchain calls
  } finally {
    isLoadingBalances = false;
  }
};

// Get user balance for a specific ingredient
const getUserBalance = (ingredient: IIngredient): string => {
  return userBalances.value.get(ingredient.tokenId) || '0';
};

// Load ingredients on mount (only once, with delay)
onMounted(async () => {
  // Only load if we don't have ingredients already
  if (ingredients.value.length === 0) {
    // Add initial delay to avoid competing with App.vue's recipe fetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadIngredients();
  }
  
  // Load balances after ingredients are loaded (with longer delay to avoid rate limiting)
  if (walletStore.connected && ingredients.value.length > 0) {
    // Longer delay to avoid immediate request after page load
    setTimeout(() => {
      loadUserBalances();
    }, 2500);
  }
});

// Watch for wallet connection changes (with debouncing)
let walletWatchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(() => walletStore.connected, async (connected) => {
  // Clear any pending timeout
  if (walletWatchTimeout) {
    clearTimeout(walletWatchTimeout);
    walletWatchTimeout = null;
  }

  if (connected && ingredients.value.length > 0) {
    // Debounce the balance load when wallet connects
    walletWatchTimeout = setTimeout(() => {
      loadUserBalances();
      walletWatchTimeout = null;
    }, 1000); // Wait 1 second after wallet connection
  } else {
    userBalances.value.clear();
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure consistent card heights */
.grid {
  align-items: stretch;
}

/* Improve button alignment */
.flex-grow {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

/* Ensure description area always takes space */
.min-h-\[2\.5rem\] {
  min-height: 2.5rem;
}
</style>
