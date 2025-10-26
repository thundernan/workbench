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
          <!-- Wallet Connection Warning -->
          <div v-if="!walletStore.connected" class="bg-yellow-900/30 border-2 border-yellow-600 rounded-lg p-6 text-center">
            <div class="text-5xl mb-3">⚠️</div>
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Wallet Not Connected</h3>
            <p class="text-yellow-200 mb-4">You need to connect your wallet to create trade offers</p>
            <button
              @click="toastStore.showToast({ type: 'info', message: 'Please use the Connect Wallet button in the header' })"
              class="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
            >
              How to Connect
            </button>
          </div>

          <!-- No Inventory Warning -->
          <div v-else-if="inventoryStore.items.length === 0" class="bg-blue-900/30 border-2 border-blue-600 rounded-lg p-6 text-center">
            <div class="text-5xl mb-3">📦</div>
            <h3 class="text-xl font-bold text-blue-400 mb-2">Empty Inventory</h3>
            <p class="text-blue-200 mb-4">You don't have any items to trade. Visit the Shop to get some resources!</p>
            <button
              @click="$router.push('/shop')"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Shop
            </button>
          </div>

          <!-- Create Offer Form -->
          <div v-else class="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-emerald-400 mb-2">Create Trade Offer</h2>
            <p class="text-slate-400 text-sm mb-6">List items from your inventory for trade with other players</p>
            
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
                    class="w-full px-4 py-2.5 bg-slate-700 border rounded-lg text-white focus:outline-none transition-colors"
                    :class="formErrors.offeringItem ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'"
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
                  <div v-if="formErrors.offeringItem" class="text-red-400 text-xs mt-1">
                    {{ formErrors.offeringItem }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                  <input
                    v-model.number="offerForm.offeringQuantity"
                    type="number"
                    min="1"
                    :max="maxOfferingQuantity"
                    class="w-full px-4 py-2.5 bg-slate-700 border rounded-lg text-white focus:outline-none transition-colors"
                    :class="formErrors.offeringQuantity ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'"
                  />
                  <div v-if="formErrors.offeringQuantity" class="text-red-400 text-xs mt-1">
                    {{ formErrors.offeringQuantity }}
                  </div>
                </div>

                <!-- Preview -->
                <div v-if="selectedOfferingItem" class="bg-slate-700 rounded-lg p-4 border-2 border-emerald-500/50 animate-pulse-slow">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl">{{ selectedOfferingItem.icon }}</div>
                    <div>
                      <div class="text-white font-semibold">{{ selectedOfferingItem.name }}</div>
                      <div class="text-emerald-400 text-sm font-bold">× {{ offerForm.offeringQuantity }}</div>
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
                    class="w-full px-4 py-2.5 bg-slate-700 border rounded-lg text-white focus:outline-none transition-colors"
                    :class="formErrors.requestingItem ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'"
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
                  <div v-if="formErrors.requestingItem" class="text-red-400 text-xs mt-1">
                    {{ formErrors.requestingItem }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                  <input
                    v-model.number="offerForm.requestingQuantity"
                    type="number"
                    min="1"
                    class="w-full px-4 py-2.5 bg-slate-700 border rounded-lg text-white focus:outline-none transition-colors"
                    :class="formErrors.requestingQuantity ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'"
                  />
                  <div v-if="formErrors.requestingQuantity" class="text-red-400 text-xs mt-1">
                    {{ formErrors.requestingQuantity }}
                  </div>
                </div>

                <!-- Preview -->
                <div v-if="selectedRequestingItem" class="bg-slate-700 rounded-lg p-4 border-2 border-blue-500/50 animate-pulse-slow">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl">{{ selectedRequestingItem.icon }}</div>
                    <div>
                      <div class="text-white font-semibold">{{ selectedRequestingItem.name }}</div>
                      <div class="text-blue-400 text-sm font-bold">× {{ offerForm.requestingQuantity }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Summary -->
            <div v-if="!canCreateOffer && hasFormInput" class="mt-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-yellow-500 text-xl">⚠️</div>
                <div class="flex-1">
                  <div class="text-yellow-400 font-semibold text-sm mb-1">Cannot Create Offer</div>
                  <ul class="text-yellow-200 text-xs space-y-1">
                    <li v-if="!offerForm.offeringItemId">• Select an item to offer</li>
                    <li v-if="!offerForm.requestingItemId">• Select an item to request</li>
                    <li v-if="offerForm.offeringQuantity <= 0">• Offering quantity must be greater than 0</li>
                    <li v-if="offerForm.offeringQuantity > maxOfferingQuantity">• Not enough items in inventory</li>
                    <li v-if="offerForm.requestingQuantity <= 0">• Requesting quantity must be greater than 0</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Success Message -->
            <div v-if="canCreateOffer" class="mt-6 bg-emerald-900/30 border border-emerald-600 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <div class="text-emerald-500 text-xl">✓</div>
                <div class="text-emerald-400 font-semibold text-sm">Ready to create offer!</div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-6 flex gap-4">
              <button
                @click="createOffer"
                :disabled="!canCreateOffer || isCreatingOffer"
                class="flex-1 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                :class="canCreateOffer && !isCreatingOffer
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
                <span v-if="isCreatingOffer" class="inline-block animate-spin">⚙️</span>
                <span>{{ isCreatingOffer ? 'Creating Offer...' : '✓ Create Offer' }}</span>
              </button>
              <button
                @click="resetForm"
                :disabled="isCreatingOffer"
                class="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                class="bg-slate-700 border rounded-lg p-5 transition-all duration-300"
                :class="offer.id === lastCreatedOfferId 
                  ? 'border-emerald-500 border-2 shadow-lg shadow-emerald-500/50 animate-pulse-slow' 
                  : 'border-slate-600'"
              >
                <!-- New Badge -->
                <div v-if="offer.id === lastCreatedOfferId" class="mb-3 flex items-center gap-2">
                  <div class="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full animate-bounce">
                    ✨ NEW!
                  </div>
                </div>
                
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

// Form state
const isCreatingOffer = ref(false);
const formErrors = ref({
  offeringItem: '',
  offeringQuantity: '',
  requestingItem: '',
  requestingQuantity: ''
});
const lastCreatedOfferId = ref<string | null>(null);

// All available items (for requesting)
const allAvailableItems = computed(() => {
  return inventoryStore.allItems;
});

// Check if user has started filling the form
const hasFormInput = computed(() => {
  return offerForm.value.offeringItemId !== '' || 
         offerForm.value.requestingItemId !== '' ||
         offerForm.value.offeringQuantity !== 1 ||
         offerForm.value.requestingQuantity !== 1;
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

const createOffer = async () => {
  // Clear previous errors
  formErrors.value = {
    offeringItem: '',
    offeringQuantity: '',
    requestingItem: '',
    requestingQuantity: ''
  };

  // Validate wallet connection
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  // Validate form
  if (!canCreateOffer.value) {
    toastStore.showToast({
      type: 'error',
      message: 'Please fill in all fields correctly'
    });
    return;
  }

  const offeringItem = selectedOfferingItem.value;
  const requestingItem = selectedRequestingItem.value;
  
  if (!offeringItem || !requestingItem) {
    return;
  }

  try {
    isCreatingOffer.value = true;

    // Show processing toast
    toastStore.showToast({
      type: 'info',
      message: '⏳ Creating your trade offer...'
    });

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const offerId = Math.random().toString(36).substr(2, 9);
    
    const newOffer: TradeOffer = {
      id: offerId,
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

    // Mark as last created for highlighting
    lastCreatedOfferId.value = offerId;
    
    // Clear the highlight after 3 seconds
    setTimeout(() => {
      lastCreatedOfferId.value = null;
    }, 3000);

    // Switch to "My Offers" tab immediately
    activeTab.value = 2;

    toastStore.showToast({
      type: 'success',
      message: `✅ Trade offer created successfully!`
    });

    resetForm();
    
    console.log('✅ Trade offer created:', {
      offering: `${offerForm.value.offeringQuantity}× ${offeringItem.name}`,
      requesting: `${offerForm.value.requestingQuantity}× ${requestingItem.name}`
    });
  } catch (error: any) {
    console.error('❌ Failed to create offer:', error);
    toastStore.showToast({
      type: 'error',
      message: 'Failed to create trade offer. Please try again.'
    });
  } finally {
    isCreatingOffer.value = false;
  }
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
  
  // Clear form errors
  formErrors.value = {
    offeringItem: '',
    offeringQuantity: '',
    requestingItem: '',
    requestingQuantity: ''
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

/* Custom animations */
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>

