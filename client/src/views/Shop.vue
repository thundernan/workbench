<template>
  <div class="shop-page bg-slate-900 min-h-screen flex flex-col font-mono text-sm">
    <!-- Header -->
    <AppHeader />

    <div class="flex-1 p-6 overflow-auto">
      <div class="max-w-7xl mx-auto">
        <!-- Page Title -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-emerald-400 mb-2">🏪 Resource Shop</h1>
          <p class="text-slate-400">Claim free starter resources to begin crafting</p>
        </div>

        <!-- Wallet Connection Required -->
        <div v-if="!walletStore.connected" class="bg-slate-800 border-2 border-slate-700 rounded-lg p-12 text-center">
          <div class="text-6xl mb-4">🔒</div>
          <h2 class="text-2xl font-bold text-white mb-2">Wallet Connection Required</h2>
          <p class="text-slate-400 mb-6">Connect your wallet to access the shop</p>
          <button
            @click="openWalletModal"
            class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        </div>

        <!-- Shop Content (when wallet connected) -->
        <div v-else class="space-y-8">
          <!-- Free Resources Section -->
          <div class="bg-slate-800 border-2 border-emerald-500 rounded-lg overflow-hidden">
            <!-- Section Header -->
            <div class="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-bold text-white mb-1">🎁 Free Starter Resources</h2>
                    <p class="text-emerald-100 text-xs">Claim anytime to get resources</p>
                  </div>
                <div v-if="!hasClaimed" class="text-white text-sm">
                  <span class="animate-pulse">✨ Available!</span>
                </div>
              </div>
            </div>

            <div class="p-6">
              <!-- Already Claimed Message -->
              <div v-if="hasClaimed" class="text-center py-8">
                <div class="text-5xl mb-3">✅</div>
                <h3 class="text-xl font-semibold text-white mb-2">Already Claimed!</h3>
                <p class="text-slate-400">You have already claimed your free starter resources</p>
                <p class="text-slate-500 text-xs mt-2">Reload the page to claim again</p>
              </div>

              <!-- Claim Section -->
              <div v-else>
                <div class="text-center mb-6">
                  <p class="text-slate-300 mb-4">You'll receive the following resources:</p>
                </div>

                <!-- Free Items Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div
                    v-for="item in freeItems"
                    :key="item.item.id"
                    class="bg-slate-700 border-2 border-slate-600 rounded-lg p-4 text-center hover:border-emerald-400 transition-all"
                  >
                    <div class="text-5xl mb-2">{{ item.item.icon }}</div>
                    <div class="text-white font-semibold mb-1">{{ item.item.name }}</div>
                    <div class="text-emerald-400 font-bold text-lg">× {{ item.quantity }}</div>
                    <div class="text-slate-400 text-xs mt-2">{{ item.item.description }}</div>
                  </div>
                </div>

                <!-- Claim Button -->
                <div class="text-center">
                  <button
                    @click="claimFreeResources"
                    :disabled="isClaiming"
                    class="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span v-if="isClaiming">
                      <i class="pi pi-spin pi-spinner"></i> Claiming...
                    </span>
                    <span v-else>
                      🎁 Claim Free Resources
                    </span>
                  </button>
                  <p class="text-slate-500 text-xs mt-2">Claim as many times as you need</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Premium Resources Section (Subtle) -->
          <div class="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
            <!-- Section Header -->
            <div class="px-6 py-3 border-b border-slate-600">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-semibold text-slate-300 mb-1">💎 Premium Resources</h2>
                  <p class="text-slate-500 text-xs">Purchase rare resources with ETH</p>
                </div>
                <div class="text-slate-400 text-xs">
                  Balance: {{ walletBalance }} ETH
                </div>
              </div>
            </div>

            <div class="p-6">
              <!-- Premium Items Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="item in premiumItems"
                  :key="item.item.id"
                  class="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden hover:border-slate-500 transition-all"
                >
                  <!-- Item Header -->
                  <div class="p-3 text-center border-b border-slate-600">
                    <div class="text-4xl mb-2">{{ item.item.icon }}</div>
                    <h3 class="text-white font-semibold text-sm mb-1">{{ item.item.name }}</h3>
                    <div 
                      class="inline-block px-2 py-0.5 rounded text-xs"
                      :class="getRarityClass(item.item.rarity)"
                    >
                      {{ item.item.rarity }}
                    </div>
                  </div>

                  <!-- Item Details -->
                  <div class="p-3">
                    <p class="text-slate-400 text-xs mb-3">{{ item.item.description }}</p>
                    
                    <div class="space-y-2">
                      <!-- Quantity & Price -->
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-slate-400">Qty: {{ item.quantity }}</span>
                        <span class="text-slate-300 font-semibold">Ξ {{ item.priceETH }}</span>
                      </div>

                      <!-- Buy Button -->
                      <button
                        @click="purchaseItem(item)"
                        :disabled="isPurchasing || !canAfford(item.priceETH)"
                        class="w-full py-2 rounded text-xs font-semibold transition-colors"
                        :class="canAfford(item.priceETH)
                          ? 'bg-slate-600 hover:bg-slate-500 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'"
                      >
                        <span v-if="isPurchasing">
                          <i class="pi pi-spin pi-spinner"></i> Processing...
                        </span>
                        <span v-else-if="!canAfford(item.priceETH)">
                          Insufficient Balance
                        </span>
                        <span v-else>
                          Purchase
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transaction History -->
          <div v-if="transactions.length > 0" class="bg-slate-800 border border-slate-600 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-slate-300 mb-3">Recent Purchases</h3>
            <div class="space-y-2">
              <div
                v-for="tx in transactions"
                :key="tx.id"
                class="flex items-center justify-between p-2 bg-slate-700 rounded text-xs"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ tx.itemIcon }}</span>
                  <div>
                    <div class="text-white font-medium">{{ tx.itemName }}</div>
                    <div class="text-slate-400">{{ tx.quantity }}× for Ξ{{ tx.price }}</div>
                  </div>
                </div>
                <span class="text-slate-500">{{ formatTime(tx.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { useInventoryStore } from '@/stores/inventory';
import { useToastStore } from '@/stores/toast';
import AppHeader from '@/components/AppHeader.vue';
import type { Item } from '@/types';
// MOCKED: ethers import removed - no real blockchain transactions

const walletStore = useWalletStore();
const inventoryStore = useInventoryStore();
const toastStore = useToastStore();

// State
const hasClaimed = ref(false);
const isClaiming = ref(false);
const isPurchasing = ref(false);
const walletBalance = ref('0.0000');

interface ShopItem {
  item: Item;
  quantity: number;
  priceETH?: string;
}

interface Transaction {
  id: string;
  itemName: string;
  itemIcon: string;
  quantity: number;
  price: string;
  timestamp: number;
}

const transactions = ref<Transaction[]>([]);

// Free starter resources
const freeItems: ShopItem[] = [
  {
    item: {
      id: 'wood',
      name: 'Wood',
      description: 'Basic crafting material',
      icon: '🪵',
      rarity: 'common',
      category: 'material'
    },
    quantity: 20
  },
  {
    item: {
      id: 'stone',
      name: 'Stone',
      description: 'Hard material for tools',
      icon: '🪨',
      rarity: 'common',
      category: 'material'
    },
    quantity: 15
  },
  {
    item: {
      id: 'iron',
      name: 'Iron',
      description: 'Metal for advanced crafting',
      icon: '⬛',
      rarity: 'uncommon',
      category: 'material'
    },
    quantity: 5
  },
  {
    item: {
      id: 'diamond',
      name: 'Diamond',
      description: 'Rare precious gem',
      icon: '💎',
      rarity: 'rare',
      category: 'material',
      tokenId: 3,
      tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
    },
    quantity: 8
  }
];

// Premium items for purchase
const premiumItems: ShopItem[] = [
  {
    item: {
      id: 'diamond',
      name: 'Diamond',
      description: 'Rare precious gem',
      icon: '💎',
      rarity: 'rare',
      category: 'material'
    },
    quantity: 5,
    priceETH: '0.001'
  },
  {
    item: {
      id: 'gold',
      name: 'Gold',
      description: 'Valuable metal',
      icon: '🪙',
      rarity: 'epic',
      category: 'material'
    },
    quantity: 10,
    priceETH: '0.002'
  },
  {
    item: {
      id: 'emerald',
      name: 'Emerald',
      description: 'Mystical gem',
      icon: '💚',
      rarity: 'epic',
      category: 'material'
    },
    quantity: 3,
    priceETH: '0.0015'
  },
  {
    item: {
      id: 'ruby',
      name: 'Ruby',
      description: 'Fiery gem',
      icon: '💔',
      rarity: 'legendary',
      category: 'material'
    },
    quantity: 1,
    priceETH: '0.005'
  },
  {
    item: {
      id: 'platinum',
      name: 'Platinum',
      description: 'Ultra-rare metal',
      icon: '⚪',
      rarity: 'legendary',
      category: 'material'
    },
    quantity: 5,
    priceETH: '0.003'
  },
  {
    item: {
      id: 'mythril',
      name: 'Mythril',
      description: 'Legendary metal',
      icon: '✨',
      rarity: 'legendary',
      category: 'material'
    },
    quantity: 3,
    priceETH: '0.01'
  },
  {
    item: {
      id: 'crystal',
      name: 'Crystal',
      description: 'Pure energy crystal',
      icon: '🔮',
      rarity: 'rare',
      category: 'material'
    },
    quantity: 7,
    priceETH: '0.0015'
  },
  {
    item: {
      id: 'silver',
      name: 'Silver',
      description: 'Shiny refined metal',
      icon: '🪙',
      rarity: 'uncommon',
      category: 'material'
    },
    quantity: 15,
    priceETH: '0.0005'
  },
  {
    item: {
      id: 'obsidian',
      name: 'Obsidian',
      description: 'Dark volcanic glass',
      icon: '⬛',
      rarity: 'rare',
      category: 'material'
    },
    quantity: 8,
    priceETH: '0.0012'
  },
  {
    item: {
      id: 'sapphire',
      name: 'Sapphire',
      description: 'Deep blue gemstone',
      icon: '💙',
      rarity: 'epic',
      category: 'material'
    },
    quantity: 4,
    priceETH: '0.0025'
  },
  {
    item: {
      id: 'opal',
      name: 'Opal',
      description: 'Iridescent gem',
      icon: '🌈',
      rarity: 'epic',
      category: 'material'
    },
    quantity: 6,
    priceETH: '0.0018'
  },
  {
    item: {
      id: 'meteorite',
      name: 'Meteorite',
      description: 'Cosmic metal from space',
      icon: '☄️',
      rarity: 'legendary',
      category: 'material'
    },
    quantity: 2,
    priceETH: '0.008'
  },
  {
    item: {
      id: 'stardust',
      name: 'Stardust',
      description: 'Magical stellar powder',
      icon: '✨',
      rarity: 'legendary',
      category: 'material'
    },
    quantity: 10,
    priceETH: '0.015'
  }
];

// Computed
const canAfford = (priceETH: string) => {
  return parseFloat(walletBalance.value) >= parseFloat(priceETH);
};

// MOCKED: Reset claim status on page load (no localStorage persistence)
const checkClaimStatus = () => {
  // Reset claim status - available again after page reload
  hasClaimed.value = false;
  console.log('🎁 Claim available (resets on page reload)');
};

// MOCKED: Use fake balance instead of real blockchain balance
const updateBalance = async () => {
  if (!walletStore.address) return;
  
  // Mock balance: 1.5 ETH
  walletBalance.value = '1.5000';
  console.log('💰 Mock balance:', walletBalance.value, 'ETH');
};

const claimFreeResources = async () => {
  if (!walletStore.connected || !walletStore.address) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (hasClaimed.value) {
    toastStore.showToast({
      type: 'warning',
      message: 'You have already claimed your free resources this session'
    });
    return;
  }

  try {
    isClaiming.value = true;

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add free items to inventory
    freeItems.forEach(shopItem => {
      inventoryStore.addItem(shopItem.item, shopItem.quantity);
    });

    // Mark as claimed for this session (resets on page reload)
    hasClaimed.value = true;
  } catch (error: any) {
    console.error('Claim failed:', error);
    toastStore.showToast({
      type: 'error',
      message: 'Failed to claim resources'
    });
  } finally {
    isClaiming.value = false;
  }
};

// MOCKED: Purchase without real blockchain transaction
const purchaseItem = async (shopItem: ShopItem) => {
  if (!walletStore.connected || !walletStore.address) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (!shopItem.priceETH || !canAfford(shopItem.priceETH)) {
    toastStore.showToast({
      type: 'error',
      message: 'Insufficient balance'
    });
    return;
  }

  try {
    isPurchasing.value = true;

    // Simulate transaction delay
    toastStore.showToast({
      type: 'info',
      message: '⏳ Processing purchase...'
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add item to inventory
    inventoryStore.addItem(shopItem.item, shopItem.quantity);

    // Create mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Add to transactions history
    transactions.value.unshift({
      id: mockTxHash,
      itemName: shopItem.item.name,
      itemIcon: shopItem.item.icon,
      quantity: shopItem.quantity,
      price: shopItem.priceETH,
      timestamp: Date.now()
    });

    // Deduct from mock balance
    const newBalance = parseFloat(walletBalance.value) - parseFloat(shopItem.priceETH);
    walletBalance.value = newBalance.toFixed(4);

    toastStore.showToast({
      type: 'success',
      message: `✅ Purchased ${shopItem.quantity}× ${shopItem.item.name}!`
    });
    
    console.log('💳 Mock purchase completed:', {
      item: shopItem.item.name,
      price: shopItem.priceETH,
      newBalance: walletBalance.value
    });
  } catch (error: any) {
    console.error('Purchase failed:', error);
    toastStore.showToast({
      type: 'error',
      message: 'Purchase failed'
    });
  } finally {
    isPurchasing.value = false;
  }
};

const openWalletModal = () => {
  toastStore.showToast({
    type: 'info',
    message: 'Please use the Connect Wallet button in the header'
  });
};

const getRarityClass = (rarity: string) => {
  const classes: { [key: string]: string } = {
    common: 'bg-slate-600 text-slate-200',
    uncommon: 'bg-slate-600 text-green-300',
    rare: 'bg-slate-600 text-blue-300',
    epic: 'bg-slate-600 text-purple-300',
    legendary: 'bg-slate-600 text-yellow-300'
  };
  return classes[rarity] || classes.common;
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Watch for wallet connection changes
watch(() => walletStore.connected, async (isConnected) => {
  if (isConnected) {
    checkClaimStatus();
    await updateBalance();
    console.log('💰 Wallet connected - balance updated');
  } else {
    walletBalance.value = '0.0000';
    hasClaimed.value = false;
    console.log('💰 Wallet disconnected - balance and claim status reset');
  }
});

// Watch for wallet address changes (account switching)
watch(() => walletStore.address, async (newAddress, oldAddress) => {
  if (newAddress && newAddress !== oldAddress) {
    checkClaimStatus();
    await updateBalance();
    console.log('💰 Wallet address changed - claim status updated for:', newAddress);
  }
});

// Lifecycle
onMounted(async () => {
  console.log('🏪 Shop page loaded in MOCK mode');
  console.log('🎁 Claim resets on each page reload - no localStorage persistence');
  checkClaimStatus();
  if (walletStore.connected) {
    await updateBalance();
  }
});
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1e293b;
}

::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>

