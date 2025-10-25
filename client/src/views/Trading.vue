<template>
  <div class="trading-page bg-slate-900 min-h-screen flex flex-col font-mono text-sm">
    <!-- Header -->
    <AppHeader />

    <div class="flex-1 p-6 overflow-auto">
      <div class="max-w-7xl mx-auto">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6 border-b-2 border-slate-700">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            @click="activeTab = index"
            class="px-6 py-3 font-semibold transition-all duration-200"
            :class="activeTab === index 
              ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-0.5' 
              : 'text-slate-400 hover:text-slate-300'"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Market Tab -->
        <div v-if="activeTab === 0" class="space-y-6">
          <!-- Search and Filters -->
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="🔍 Search items..."
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <select
                v-model="selectedCategory"
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="">All Categories</option>
                <option value="weapon">Weapons</option>
                <option value="tool">Tools</option>
                <option value="armor">Armor</option>
                <option value="material">Materials</option>
              </select>
              <select
                v-model="sortBy"
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <button
                @click="refreshOffers"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <!-- Offers Grid -->
          <div v-if="filteredOffers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="offer in filteredOffers"
              :key="offer.id"
              class="bg-slate-800 border-2 border-slate-700 rounded-lg p-5 hover:border-emerald-400 transition-all duration-200"
            >
              <!-- Seller Info -->
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                <div class="text-slate-400 text-xs">
                  Seller: <span class="text-emerald-400">{{ formatAddress(offer.seller) }}</span>
                </div>
                <div class="text-slate-500 text-xs">{{ formatTime(offer.timestamp) }}</div>
              </div>

              <!-- Offer Details -->
              <div class="mb-4">
                <div class="text-slate-400 text-xs mb-2">Offering:</div>
                <div class="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
                  <div class="text-4xl">{{ offer.offeringItem.icon }}</div>
                  <div class="flex-1">
                    <div class="text-white font-semibold">{{ offer.offeringItem.name }}</div>
                    <div class="text-slate-400 text-xs">Quantity: {{ offer.offeringQuantity }}</div>
                  </div>
                </div>
              </div>

              <!-- Arrow -->
              <div class="text-center text-emerald-400 text-xl mb-4">⇅</div>

              <!-- Requesting -->
              <div class="mb-4">
                <div class="text-slate-400 text-xs mb-2">Requesting:</div>
                <div class="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
                  <div class="text-4xl">{{ offer.requestingItem.icon }}</div>
                  <div class="flex-1">
                    <div class="text-white font-semibold">{{ offer.requestingItem.name }}</div>
                    <div class="text-slate-400 text-xs">Quantity: {{ offer.requestingQuantity }}</div>
                  </div>
                </div>
              </div>

              <!-- Trade Button -->
              <button
                @click="acceptTrade(offer)"
                :disabled="!canAcceptTrade(offer)"
                class="w-full py-2.5 rounded-lg font-semibold transition-all duration-200"
                :class="canAcceptTrade(offer)
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
                {{ canAcceptTrade(offer) ? '✓ Accept Trade' : '✗ Insufficient Items' }}
              </button>
            </div>
          </div>

          <!-- No offers message -->
          <div v-else class="bg-slate-800 border-2 border-slate-700 rounded-lg p-12 text-center">
            <div class="text-slate-400 text-lg mb-2">📭 No offers found</div>
            <div class="text-slate-500 text-sm">Try adjusting your search filters or create your own offer</div>
          </div>
        </div>

        <!-- Create Offer Tab -->
        <div v-if="activeTab === 1" class="space-y-6">
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-emerald-400 mb-6">Create Trade Offer</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Left Side - What You Offer -->
              <div class="space-y-4">
                <div class="text-white font-semibold mb-4 pb-2 border-b border-slate-700">
                  📤 You Offer:
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Select Item</label>
                  <select
                    v-model="offerForm.offeringItemId"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  >
                    <option value="">Choose an item...</option>
                    <option
                      v-for="inventoryItem in inventoryStore.items"
                      :key="inventoryItem.item.id"
                      :value="inventoryItem.item.id"
                    >
                      {{ inventoryItem.item.icon }} {{ inventoryItem.item.name }} ({{ inventoryItem.quantity }})
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                  <input
                    v-model.number="offerForm.offeringQuantity"
                    type="number"
                    min="1"
                    :max="maxOfferingQuantity"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                  <div v-if="offerForm.offeringItemId" class="text-slate-400 text-xs mt-1">
                    Available: {{ maxOfferingQuantity }}
                  </div>
                </div>

                <!-- Preview -->
                <div v-if="selectedOfferingItem" class="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl">{{ selectedOfferingItem.icon }}</div>
                    <div>
                      <div class="text-white font-semibold">{{ selectedOfferingItem.name }}</div>
                      <div class="text-slate-400 text-sm">× {{ offerForm.offeringQuantity }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Side - What You Want -->
              <div class="space-y-4">
                <div class="text-white font-semibold mb-4 pb-2 border-b border-slate-700">
                  📥 You Request:
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Select Item</label>
                  <select
                    v-model="offerForm.requestingItemId"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  >
                    <option value="">Choose an item...</option>
                    <option
                      v-for="item in allAvailableItems"
                      :key="item.id"
                      :value="item.id"
                    >
                      {{ item.icon }} {{ item.name }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                  <input
                    v-model.number="offerForm.requestingQuantity"
                    type="number"
                    min="1"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <!-- Preview -->
                <div v-if="selectedRequestingItem" class="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl">{{ selectedRequestingItem.icon }}</div>
                    <div>
                      <div class="text-white font-semibold">{{ selectedRequestingItem.name }}</div>
                      <div class="text-slate-400 text-sm">× {{ offerForm.requestingQuantity }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-8 flex gap-4">
              <button
                @click="createOffer"
                :disabled="!canCreateOffer"
                class="flex-1 py-3 rounded-lg font-semibold transition-all duration-200"
                :class="canCreateOffer
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
                ✓ Create Offer
              </button>
              <button
                @click="resetForm"
                class="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-semibold"
              >
                ✗ Reset
              </button>
            </div>
          </div>
        </div>

        <!-- My Offers Tab -->
        <div v-if="activeTab === 2" class="space-y-6">
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-emerald-400 mb-6">My Active Offers</h2>
            
            <div v-if="myOffers.length === 0" class="text-center py-12">
              <div class="text-slate-400 text-lg mb-2">📋 No active offers</div>
              <div class="text-slate-500 text-sm">Create your first offer in the "Create Offer" tab</div>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="offer in myOffers"
                :key="offer.id"
                class="bg-slate-700 border border-slate-600 rounded-lg p-5"
              >
                <div class="flex items-start justify-between gap-6">
                  <!-- Offer Details -->
                  <div class="flex-1 grid grid-cols-3 gap-4 items-center">
                    <!-- Offering -->
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">{{ offer.offeringItem.icon }}</div>
                      <div>
                        <div class="text-white font-medium">{{ offer.offeringItem.name }}</div>
                        <div class="text-slate-400 text-xs">× {{ offer.offeringQuantity }}</div>
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="text-center text-emerald-400 text-2xl">→</div>

                    <!-- Requesting -->
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">{{ offer.requestingItem.icon }}</div>
                      <div>
                        <div class="text-white font-medium">{{ offer.requestingItem.name }}</div>
                        <div class="text-slate-400 text-xs">× {{ offer.requestingQuantity }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Cancel Button -->
                  <button
                    @click="cancelOffer(offer.id)"
                    class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    ✗ Cancel
                  </button>
                </div>

                <!-- Timestamp -->
                <div class="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-600">
                  Created {{ formatTime(offer.timestamp) }}
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
import { ref, computed, onMounted } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import AppHeader from '@/components/AppHeader.vue';
import type { Item } from '@/types';

const inventoryStore = useInventoryStore();
const walletStore = useWalletStore();
const toastStore = useToastStore();

// Trade Offer Interface
interface TradeOffer {
  id: string;
  seller: string;
  offeringItem: Item;
  offeringQuantity: number;
  requestingItem: Item;
  requestingQuantity: number;
  timestamp: number;
}

// Tab management
const tabs = ['Market', 'Create Offer', 'My Offers'];
const activeTab = ref(0);

// Market filters
const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref('newest');

// Offers data
const offers = ref<TradeOffer[]>([]);
const myOffers = ref<TradeOffer[]>([]);

// Create offer form
const offerForm = ref({
  offeringItemId: '',
  offeringQuantity: 1,
  requestingItemId: '',
  requestingQuantity: 1
});

// All available items (for requesting)
const allAvailableItems = computed(() => {
  return inventoryStore.allItems;
});

// Computed properties for form
const selectedOfferingItem = computed(() => {
  if (!offerForm.value.offeringItemId) return null;
  const invItem = inventoryStore.getItem(offerForm.value.offeringItemId);
  return invItem ? invItem.item : null;
});

const selectedRequestingItem = computed(() => {
  if (!offerForm.value.requestingItemId) return null;
  return allAvailableItems.value.find(item => item.id === offerForm.value.requestingItemId) || null;
});

const maxOfferingQuantity = computed(() => {
  if (!offerForm.value.offeringItemId) return 0;
  const item = inventoryStore.getItem(offerForm.value.offeringItemId);
  return item ? item.quantity : 0;
});

const canCreateOffer = computed(() => {
  return offerForm.value.offeringItemId && 
         offerForm.value.requestingItemId &&
         offerForm.value.offeringQuantity > 0 && 
         offerForm.value.offeringQuantity <= maxOfferingQuantity.value &&
         offerForm.value.requestingQuantity > 0;
});

// Filtered offers
const filteredOffers = computed(() => {
  let filtered = offers.value.filter(offer => offer.seller !== walletStore.address);

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(offer =>
      offer.offeringItem.name.toLowerCase().includes(query) ||
      offer.requestingItem.name.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(offer =>
      offer.offeringItem.category === selectedCategory.value ||
      offer.requestingItem.category === selectedCategory.value
    );
  }

  // Sort
  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case 'oldest':
      filtered.sort((a, b) => a.timestamp - b.timestamp);
      break;
    case 'price':
      filtered.sort((a, b) => a.requestingQuantity - b.requestingQuantity);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.requestingQuantity - a.requestingQuantity);
      break;
  }

  return filtered;
});

// Methods
const initializeSampleOffers = () => {
  const sampleOffers: TradeOffer[] = [
    {
      id: '1',
      seller: '0x1234567890abcdef',
      offeringItem: {
        id: 'wooden_pickaxe',
        name: 'Wooden Pickaxe',
        description: 'Basic mining tool',
        icon: '⛏️',
        rarity: 'common',
        category: 'tool'
      },
      offeringQuantity: 1,
      requestingItem: {
        id: 'stone',
        name: 'Stone',
        description: 'Hard material for tools',
        icon: '🪨',
        rarity: 'common',
        category: 'material'
      },
      requestingQuantity: 5,
      timestamp: Date.now() - 3600000
    },
    {
      id: '2',
      seller: '0xabcdef1234567890',
      offeringItem: {
        id: 'iron',
        name: 'Iron',
        description: 'Metal for advanced crafting',
        icon: '⬛',
        rarity: 'uncommon',
        category: 'material'
      },
      offeringQuantity: 3,
      requestingItem: {
        id: 'wood',
        name: 'Wood',
        description: 'Basic crafting material',
        icon: '🪵',
        rarity: 'common',
        category: 'material'
      },
      requestingQuantity: 10,
      timestamp: Date.now() - 7200000
    },
    {
      id: '3',
      seller: '0x9876543210fedcba',
      offeringItem: {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sharp iron sword',
        icon: '⚔️',
        rarity: 'rare',
        category: 'weapon'
      },
      offeringQuantity: 1,
      requestingItem: {
        id: 'iron',
        name: 'Iron',
        description: 'Metal for advanced crafting',
        icon: '⬛',
        rarity: 'uncommon',
        category: 'material'
      },
      requestingQuantity: 5,
      timestamp: Date.now() - 1800000
    }
  ];

  offers.value = sampleOffers;
};

const refreshOffers = () => {
  toastStore.showToast({
    type: 'info',
    message: 'Market refreshed!'
  });
};

const canAcceptTrade = (offer: TradeOffer) => {
  return inventoryStore.hasItem(offer.requestingItem.id, offer.requestingQuantity);
};

const acceptTrade = (offer: TradeOffer) => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (!canAcceptTrade(offer)) {
    toastStore.showToast({
      type: 'error',
      message: `You don't have enough ${offer.requestingItem.name}`
    });
    return;
  }

  // Remove requested items from inventory
  inventoryStore.removeItem(offer.requestingItem.id, offer.requestingQuantity);
  
  // Add offered items to inventory
  inventoryStore.addItem(offer.offeringItem, offer.offeringQuantity);
  
  // Remove offer from market
  const index = offers.value.findIndex(o => o.id === offer.id);
  if (index > -1) {
    offers.value.splice(index, 1);
  }

  toastStore.showToast({
    type: 'success',
    message: `Trade completed! Received ${offer.offeringQuantity}× ${offer.offeringItem.name}`
  });
};

const createOffer = () => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (!canCreateOffer.value) return;

  const offeringItem = selectedOfferingItem.value;
  const requestingItem = selectedRequestingItem.value;
  
  if (!offeringItem || !requestingItem) return;

  const newOffer: TradeOffer = {
    id: Math.random().toString(36).substr(2, 9),
    seller: walletStore.address!,
    offeringItem,
    offeringQuantity: offerForm.value.offeringQuantity,
    requestingItem,
    requestingQuantity: offerForm.value.requestingQuantity,
    timestamp: Date.now()
  };

  // Remove items from inventory
  inventoryStore.removeItem(offerForm.value.offeringItemId, offerForm.value.offeringQuantity);

  // Add to my offers
  myOffers.value.push(newOffer);

  // Add to market
  offers.value.push(newOffer);

  toastStore.showToast({
    type: 'success',
    message: 'Trade offer created successfully!'
  });

  resetForm();
  activeTab.value = 2; // Switch to "My Offers" tab
};

const cancelOffer = (offerId: string) => {
  const offer = myOffers.value.find(o => o.id === offerId);
  if (!offer) return;

  // Return items to inventory
  inventoryStore.addItem(offer.offeringItem, offer.offeringQuantity);

  // Remove from my offers
  const myIndex = myOffers.value.findIndex(o => o.id === offerId);
  if (myIndex > -1) {
    myOffers.value.splice(myIndex, 1);
  }

  // Remove from market
  const marketIndex = offers.value.findIndex(o => o.id === offerId);
  if (marketIndex > -1) {
    offers.value.splice(marketIndex, 1);
  }

  toastStore.showToast({
    type: 'info',
    message: 'Offer cancelled and items returned'
  });
};

const resetForm = () => {
  offerForm.value = {
    offeringItemId: '',
    offeringQuantity: 1,
    requestingItemId: '',
    requestingQuantity: 1
  };
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
};

onMounted(() => {
  initializeSampleOffers();
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

