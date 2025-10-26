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
      <div class="flex space-x-1 px-4 pb-4">
        <button
          v-for="tab in mobileTabs"
          :key="tab.id"
          @click="activeMobileTab = tab.id"
          class="flex-1 px-3 py-2 rounded-lg font-medium transition-colors duration-200"
          :class="activeMobileTab === tab.id 
            ? 'bg-emerald-600 text-white' 
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Desktop Header -->
    <div class="hidden lg:block bg-slate-800 border-b border-slate-700">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-emerald-400">🛒 Shop</h1>
            <p class="text-slate-400 mt-1">Buy ingredients for your crafting adventures</p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Wallet Connection Status -->
            <div v-if="walletStore.connected" class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span class="text-sm text-slate-300">{{ walletStore.shortAddress }}</span>
            </div>
            <div v-else class="text-slate-500 text-sm">
              Connect wallet to buy items
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Debug Info (remove in production) -->
      <div class="mb-4 p-3 bg-slate-800 rounded text-xs">
        <div class="text-slate-400">Debug Info:</div>
        <div>isLoading: {{ isLoading }}</div>
        <div>error: {{ error }}</div>
        <div>ingredients.length: {{ ingredients.length }}</div>
        <div>filteredIngredients.length: {{ filteredIngredients.length }}</div>
        <div>activeMobileTab: {{ activeMobileTab }}</div>
        <div>walletStore.connected: {{ walletStore.connected }}</div>
        <div>walletStore.address: {{ walletStore.address }}</div>
        <div>isBuying: {{ isBuying }}</div>
        <button 
          @click="testMinting" 
          class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
          :disabled="!walletStore.connected"
        >
          Test Minting
        </button>
      </div>

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
          @click="loadIngredients" 
          class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredIngredients.length === 0" class="text-center py-12">
        <div class="text-slate-500 text-4xl mb-4">📦</div>
        <p class="text-slate-400">No ingredients available</p>
      </div>

      <!-- Ingredients Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-stretch">
        <div
          v-for="ingredient in filteredIngredients"
          :key="ingredient._id"
          class="bg-slate-800 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all duration-200 overflow-hidden flex flex-col h-full min-h-[400px]"
        >
          <!-- Image -->
          <div class="aspect-square bg-slate-700 flex items-center justify-center flex-shrink-0">
            <img
              v-if="ingredient.metadata.image"
              :src="ingredient.metadata.image"
              :alt="ingredient.metadata.name || 'Ingredient'"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div v-else class="text-6xl text-slate-500">
              {{ getIngredientIcon(ingredient) }}
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 flex flex-col flex-grow">
            <!-- Name -->
            <h3 class="font-semibold text-lg text-white truncate">
              {{ ingredient.metadata.name || `Token #${ingredient.tokenId}` }}
            </h3>

            <!-- Category -->
            <p v-if="ingredient.metadata.category" class="text-slate-400 text-sm mt-1">
              {{ ingredient.metadata.category }}
            </p>

            <!-- Description -->
            <div class="text-slate-500 text-xs mt-2 line-clamp-2 flex-grow min-h-[2.5rem]">
              <p v-if="ingredient.metadata.description">
                {{ ingredient.metadata.description }}
              </p>
            </div>

            <!-- Price and Balance -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span v-if="getPriceInEth(ingredient) === '0'" class="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Free
                  </span>
                  <span v-else class="text-emerald-400 font-semibold">
                    {{ getPriceInEth(ingredient) }} ETH
                  </span>
                </div>
                <span class="text-slate-500 text-xs">
                  ID: {{ ingredient.tokenId }}
                </span>
              </div>
              
              <!-- User Balance -->
              <div v-if="walletStore.connected" class="flex items-center justify-between">
                <span class="text-slate-400 text-xs">Your Balance:</span>
                <span class="text-blue-400 font-medium text-xs">
                  {{ getUserBalance(ingredient) }}
                </span>
              </div>
            </div>

            <!-- Buy/Mint Button -->
            <button
              @click="buyIngredient(ingredient)"
              :disabled="!walletStore.connected || isBuying"
              class="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium flex-shrink-0"
            >
              <span v-if="isBuying">
                {{ getPriceInEth(ingredient) === '0' ? 'Minting...' : 'Buying...' }}
              </span>
              <span v-else-if="!walletStore.connected">Connect Wallet</span>
              <span v-else-if="getPriceInEth(ingredient) === '0'">
                Mint Free ({{ getUserBalance(ingredient) }} owned)
              </span>
              <span v-else>
                Buy for {{ getPriceInEth(ingredient) }} ETH
              </span>
            </button>
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
import apiService, { type Ingredient } from '@/services/apiService';
import { ethers } from 'ethers';
import AppHeader from '@/components/AppHeader.vue';
import WalletConnectButton from '@/components/WalletConnectButton.vue';

const walletStore = useWalletStore();
const toastStore = useToastStore();

// Mobile tabs
const mobileTabs = [
  { id: 'all', name: 'All Items' },
  { id: 'free', name: 'Free' },
  { id: 'paid', name: 'Paid' }
];

const activeMobileTab = ref('all');

// State
const ingredients = ref<Ingredient[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isBuying = ref(false);
const userBalances = ref<Map<number, string>>(new Map());

// Computed filtered ingredients based on active tab
const filteredIngredients = computed(() => {
  if (activeMobileTab.value === 'free') {
    return ingredients.value.filter(ingredient => getPriceInEth(ingredient) === '0');
  } else if (activeMobileTab.value === 'paid') {
    return ingredients.value.filter(ingredient => getPriceInEth(ingredient) !== '0');
  }
  return ingredients.value;
});

// Load ingredients from backend
const loadIngredients = async () => {
  console.log('🛒 Shop: Starting to load ingredients...');
  isLoading.value = true;
  error.value = null;

  try {
    // First test server connectivity
    console.log('🛒 Shop: Testing server connectivity...');
    try {
      const healthCheck = await apiService.healthCheck();
      console.log('🛒 Shop: Server health check:', healthCheck);
    } catch (healthErr) {
      console.warn('🛒 Shop: Health check failed:', healthErr);
    }

    console.log('🛒 Shop: Calling API service...');
    const fetchedIngredients = await apiService.getIngredients({ limit: 100 });
    console.log('🛒 Shop: API response received:', fetchedIngredients);
    console.log('🛒 Shop: Response type:', typeof fetchedIngredients);
    console.log('🛒 Shop: Response length:', Array.isArray(fetchedIngredients) ? fetchedIngredients.length : 'Not an array');
    
    if (Array.isArray(fetchedIngredients)) {
      ingredients.value = fetchedIngredients;
      console.log(`✅ Shop: Loaded ${fetchedIngredients.length} ingredients`);
      console.log('🛒 Shop: First ingredient sample:', fetchedIngredients[0]);
    } else {
      console.error('❌ Shop: API response is not an array:', fetchedIngredients);
      error.value = 'Invalid response format from server';
    }
  } catch (err: any) {
    console.error('❌ Shop: Failed to load ingredients:', err);
    error.value = err.message || 'Failed to load ingredients';
  } finally {
    console.log('🛒 Shop: Setting isLoading to false');
    isLoading.value = false;
  }
};

// Get price in ETH
const getPriceInEth = (ingredient: Ingredient): string => {
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
const getIngredientIcon = (ingredient: Ingredient): string => {
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

// Buy/Mint ingredient
const buyIngredient = async (ingredient: Ingredient) => {
  console.log('🚀 buyIngredient function called with:', ingredient);
  
  if (!walletStore.connected) {
    console.log('❌ Wallet not connected');
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  console.log('✅ Wallet is connected, proceeding with minting...');
  console.log('🔍 Wallet store state:', {
    connected: walletStore.connected,
    address: walletStore.address,
    provider: !!walletStore.provider,
    signer: !!walletStore.signer
  });
  isBuying.value = true;

  // Define variables outside try block so they're available in catch
  const priceWei = ingredient.metadata.price || '0';
  const priceEth = ethers.formatEther(priceWei);
  const isFree = priceWei === '0' || priceWei === '0x0';

  try {

    console.log('🔍 Ingredient data:', {
      name: ingredient.metadata.name,
      priceWei: priceWei,
      priceEth: priceEth,
      isFree: isFree,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId,
      metadata: ingredient.metadata
    });

    console.log(`🛒 ${isFree ? 'Minting' : 'Buying'} ingredient: ${ingredient.metadata.name}`);
    console.log(`💰 Price: ${priceEth} ETH`);
    console.log(`📍 Contract: ${ingredient.tokenContract}`);
    console.log(`🆔 Token ID: ${ingredient.tokenId}`);

    // Get provider and signer
    const provider = walletStore.provider;
    const signer = walletStore.signer;

    if (!provider || !signer) {
      throw new Error('Wallet not properly connected');
    }

    // Create contract instance with comprehensive ABI
    const contract = new ethers.Contract(
      ingredient.tokenContract,
      [
        'function publicMint(uint256 id, uint256 amount) payable',
        'function tokenPrices(uint256 id) view returns (uint256)',
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function totalSupply(uint256 id) view returns (uint256)',
        'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
      ],
      signer
    );

    console.log('📋 Contract instance created:', {
      address: ingredient.tokenContract,
      signer: signer.address
    });

    // Get current balance before minting
    const currentBalance = await contract['balanceOf'](walletStore.address, ingredient.tokenId);
    console.log(`📊 Current balance: ${currentBalance.toString()}`);

    // Get the actual price from contract
    let contractPrice: bigint;
    try {
      contractPrice = await contract['tokenPrices'](ingredient.tokenId);
      console.log(`💰 Contract price: ${ethers.formatEther(contractPrice)} ETH`);
    } catch (priceError) {
      console.warn('Could not fetch contract price, using metadata price:', priceError);
      contractPrice = BigInt(priceWei);
    }

    // Validate price consistency
    if (!isFree && contractPrice.toString() !== priceWei) {
      console.warn(`⚠️ Price mismatch: metadata=${priceWei}, contract=${contractPrice.toString()}`);
    }

    // Check if user has sufficient funds (for paid items)
    if (!isFree && contractPrice > 0) {
      const userBalance = await provider.getBalance(walletStore.address);
      if (userBalance < contractPrice) {
        throw new Error(`Insufficient ETH balance. Required: ${ethers.formatEther(contractPrice)} ETH, Available: ${ethers.formatEther(userBalance)} ETH`);
      }
    }

    // Mint the token
    console.log(`🚀 ${isFree ? 'Minting' : 'Buying'} token...`);
    console.log('🔧 Transaction parameters:', {
      tokenId: ingredient.tokenId,
      amount: 1,
      value: contractPrice.toString(),
      gasLimit: 200000
    });
    
    const tx = await contract['publicMint'](ingredient.tokenId, 1, {
      value: contractPrice,
      gasLimit: 200000 // Set gas limit to prevent estimation issues
    });

    console.log(`⏳ Transaction sent: ${tx.hash}`);
    console.log(`🔗 View on explorer: https://explorer.zkxsolla.com/tx/${tx.hash}`);

    // Show pending toast
    toastStore.showToast({
      type: 'info',
      message: `${isFree ? 'Minting' : 'Buying'} ${ingredient.metadata.name}... TX: ${tx.hash.slice(0, 10)}...`
    });

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    // Check new balance
    const newBalance = await contract['balanceOf'](walletStore.address, ingredient.tokenId);
    console.log(`📊 New balance: ${newBalance.toString()}`);

    // Show success toast
    toastStore.showToast({
      type: 'success',
      message: `Successfully ${isFree ? 'minted' : 'bought'} ${ingredient.metadata.name}! Balance: ${newBalance.toString()}`
    });

    // Refresh inventory if available
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    }

    // Refresh user balances
    await loadUserBalances();

  } catch (err: any) {
    console.error(`Failed to ${priceWei === '0' ? 'mint' : 'buy'} ingredient:`, err);
    
    let errorMessage = `Failed to ${priceWei === '0' ? 'mint' : 'buy'} ingredient`;
    
    if (err.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH balance for this transaction';
    } else if (err.message.includes('user rejected') || err.message.includes('User denied')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (err.message.includes('gas')) {
      errorMessage = 'Transaction failed due to gas issues. Try again.';
    } else if (err.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (err.message.includes('does not exist')) {
      errorMessage = 'This token is not available for minting';
    } else if (err.message.includes('execution reverted')) {
      errorMessage = 'Transaction failed. Token may not be available for minting.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    toastStore.showToast({
      type: 'error',
      message: errorMessage
    });
  } finally {
    isBuying.value = false;
  }
};

// Load user balances for all ingredients
const loadUserBalances = async () => {
  if (!walletStore.connected || ingredients.value.length === 0) {
    return;
  }

  try {
    console.log('🛒 Shop: Loading user balances...');
    
    const provider = walletStore.provider;
    if (!provider) return;

    // Create contract instance
    const contract = new ethers.Contract(
      ingredients.value[0]?.tokenContract || '',
      [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
      ],
      provider
    );

    // Get balances for all tokens
    const tokenIds = ingredients.value.map(ing => ing.tokenId);
    const addresses = new Array(tokenIds.length).fill(walletStore.address);
    
    const balances = await contract['balanceOfBatch'](addresses, tokenIds);
    
    // Update balances map
    const newBalances = new Map<number, string>();
    ingredients.value.forEach((ingredient, index) => {
      newBalances.set(ingredient.tokenId, balances[index].toString());
    });
    
    userBalances.value = newBalances;
    console.log('✅ Shop: User balances loaded:', Object.fromEntries(newBalances));
    
  } catch (err) {
    console.error('❌ Shop: Failed to load user balances:', err);
  }
};

// Get user balance for a specific ingredient
const getUserBalance = (ingredient: Ingredient): string => {
  return userBalances.value.get(ingredient.tokenId) || '0';
};

// Test minting function for debugging
const testMinting = async () => {
  console.log('🧪 Test minting function called');
  
  if (!walletStore.connected) {
    console.log('❌ Wallet not connected for test');
    return;
  }

  // Find a free ingredient to test with
  const freeIngredient = ingredients.value.find(ing => getPriceInEth(ing) === '0');
  
  if (!freeIngredient) {
    console.log('❌ No free ingredients found for testing');
    toastStore.showToast({
      type: 'error',
      message: 'No free ingredients available for testing'
    });
    return;
  }

  console.log('🧪 Testing with ingredient:', freeIngredient);
  await buyIngredient(freeIngredient);
};

// Load ingredients on mount
onMounted(async () => {
  await loadIngredients();
  // Load balances after ingredients are loaded
  if (walletStore.connected) {
    await loadUserBalances();
  }
});

// Watch for wallet connection changes
watch(() => walletStore.connected, async (connected) => {
  if (connected && ingredients.value.length > 0) {
    await loadUserBalances();
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
