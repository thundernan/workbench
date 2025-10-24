<template>
  <div class="trading-page bg-slate-900 min-h-screen p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Trading Market</h1>
          <p class="text-slate-400">Buy and sell items with other players</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-slate-300">
            Balance: <span class="text-emerald-400 font-semibold">1,000 ETH</span>
          </div>
          <WalletConnectButton />
        </div>
      </div>

      <!-- Tabs -->
      <TabView v-model:activeIndex="activeTabIndex" class="mb-6">
        <TabPanel header="Market">
          <template #header>
            <i class="pi pi-shopping-cart mr-2"></i>
            <span>Market</span>
          </template>
        </TabPanel>
        <TabPanel header="Create Offer">
          <template #header>
            <i class="pi pi-plus-circle mr-2"></i>
            <span>Create Offer</span>
          </template>
        </TabPanel>
        <TabPanel header="My Offers">
          <template #header>
            <i class="pi pi-list mr-2"></i>
            <span>My Offers</span>
          </template>
        </TabPanel>
      </TabView>

      <!-- Market Tab -->
      <div v-if="activeTabIndex === 0" class="space-y-6">
        <!-- Search and Filters -->
        <Card>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <IconField iconPosition="left">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  placeholder="Search items..."
                  class="w-full"
                />
              </IconField>
              <Select
                v-model="selectedCategory"
                :options="categories"
                optionLabel="label"
                optionValue="value"
                placeholder="All Categories"
                class="w-full"
              />
              <Select
                v-model="sortBy"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sort by"
                class="w-full"
              />
              <Button
                @click="refreshOffers"
                label="Refresh"
                icon="pi pi-refresh"
                severity="success"
              />
            </div>
          </template>
        </Card>

        <!-- Offers Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="offer in filteredOffers"
            :key="offer.id"
            class="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3 mb-3">
              <ItemIcon :item="offer.item" size="md" />
              <div class="flex-1">
                <h3 class="text-white font-medium">{{ offer.item.name }}</h3>
                <p class="text-slate-400 text-sm">Qty: {{ offer.quantity }}</p>
              </div>
            </div>
            
            <div class="flex items-center justify-between mb-3">
              <div class="text-emerald-400 font-semibold">
                {{ offer.price }} {{ offer.currency }}
              </div>
              <div class="text-slate-400 text-sm">
                {{ formatTime(offer.timestamp) }}
              </div>
            </div>

            <div class="flex items-center justify-between text-sm text-slate-300 mb-3">
              <span>Seller: {{ offer.seller.slice(0, 6) }}...{{ offer.seller.slice(-4) }}</span>
              <span class="capitalize">{{ offer.item.rarity }}</span>
            </div>

            <button
              @click="buyItem(offer)"
              :disabled="!walletStore.connected"
              class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Buy Now
            </button>
          </div>
        </div>

        <!-- No offers message -->
        <div v-if="filteredOffers.length === 0" class="text-center py-12">
          <div class="text-slate-400 text-lg">No offers found</div>
          <div class="text-slate-500 text-sm mt-2">Try adjusting your search filters</div>
        </div>
      </div>

      <!-- Create Offer Tab -->
      <div v-if="activeTabIndex === 1" class="space-y-6">
        <div class="bg-slate-800 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Create New Offer</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Item Selection -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Select Item</label>
              <select
                v-model="selectedItemId"
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Choose an item...</option>
                <option
                  v-for="inventoryItem in inventoryStore.items"
                  :key="inventoryItem.item.id"
                  :value="inventoryItem.item.id"
                >
                  {{ inventoryItem.item.name }} ({{ inventoryItem.quantity }})
                </option>
              </select>
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                v-model.number="offerQuantity"
                type="number"
                min="1"
                :max="maxQuantity"
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Price (ETH)</label>
              <input
                v-model.number="offerPrice"
                type="number"
                step="0.001"
                min="0"
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <!-- Currency -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Currency</label>
              <select
                v-model="offerCurrency"
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="DAI">DAI</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex space-x-4">
            <button
              @click="createOffer"
              :disabled="!canCreateOffer || !walletStore.connected"
              class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Create Offer
            </button>
            <button
              @click="resetForm"
              class="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- My Offers Tab -->
      <div v-if="activeTabIndex === 2" class="space-y-6">
        <div class="bg-slate-800 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">My Offers</h2>
          
          <div v-if="myOffers.length === 0" class="text-center py-8">
            <div class="text-slate-400">No offers created yet</div>
            <div class="text-slate-500 text-sm mt-2">Create your first offer in the "Create Offer" tab</div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="offer in myOffers"
              :key="offer.id"
              class="bg-slate-700 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <ItemIcon :item="offer.item" size="md" />
                  <div>
                    <h3 class="text-white font-medium">{{ offer.item.name }}</h3>
                    <p class="text-slate-400 text-sm">Qty: {{ offer.quantity }} • {{ offer.price }} {{ offer.currency }}</p>
                  </div>
                </div>
                <button
                  @click="cancelOffer(offer.id)"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
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
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import type { TradeOffer } from '@/types';

const inventoryStore = useInventoryStore();
const walletStore = useWalletStore();
const toastStore = useToastStore();

// Tab management
const activeTabIndex = ref(0);

// Filter options
const categories = [
  { label: 'All Categories', value: '' },
  { label: 'Weapons', value: 'weapon' },
  { label: 'Tools', value: 'tool' },
  { label: 'Armor', value: 'armor' },
  { label: 'Materials', value: 'material' }
];

const sortOptions = [
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' }
];

// Market filters
const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref('price');

// Mock offers data
const offers = ref<TradeOffer[]>([]);
const myOffers = ref<TradeOffer[]>([]);

// Create offer form
const selectedItemId = ref('');
const offerQuantity = ref(1);
const offerPrice = ref(0);
const offerCurrency = ref('ETH');

const filteredOffers = computed(() => {
  let filtered = offers.value;

  // Search filter
  if (searchQuery.value) {
    filtered = filtered.filter(offer =>
      offer.item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(offer =>
      offer.item.category === selectedCategory.value
    );
  }

  // Sort
  switch (sortBy.value) {
    case 'price':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      filtered.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case 'oldest':
      filtered.sort((a, b) => a.timestamp - b.timestamp);
      break;
  }

  return filtered;
});

const maxQuantity = computed(() => {
  if (!selectedItemId.value) return 0;
  const item = inventoryStore.getItem(selectedItemId.value);
  return item ? item.quantity : 0;
});

const canCreateOffer = computed(() => {
  return selectedItemId.value && 
         offerQuantity.value > 0 && 
         offerQuantity.value <= maxQuantity.value &&
         offerPrice.value > 0;
});

const initializeSampleOffers = () => {
  const sampleOffers: TradeOffer[] = [
    {
      id: '1',
      seller: '0x1234...5678',
      item: {
        id: 'wooden_sword',
        name: 'Wooden Sword',
        description: 'A basic wooden sword',
        icon: '🗡️',
        rarity: 'common',
        category: 'weapon'
      },
      quantity: 1,
      price: 0.1,
      currency: 'ETH',
      timestamp: Date.now() - 3600000
    },
    {
      id: '2',
      seller: '0x9876...5432',
      item: {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sharp iron sword',
        icon: '⚔️',
        rarity: 'rare',
        category: 'weapon'
      },
      quantity: 1,
      price: 0.5,
      currency: 'ETH',
      timestamp: Date.now() - 7200000
    },
    {
      id: '3',
      seller: '0xabcd...efgh',
      item: {
        id: 'diamond',
        name: 'Diamond',
        description: 'Rare precious gem',
        icon: '💎',
        rarity: 'rare',
        category: 'material'
      },
      quantity: 3,
      price: 0.3,
      currency: 'ETH',
      timestamp: Date.now() - 1800000
    }
  ];

  offers.value = sampleOffers;
};

const refreshOffers = () => {
  // In a real app, this would fetch from an API
  toastStore.showToast({
    type: 'info',
    message: 'Offers refreshed'
  });
};

const buyItem = async (offer: TradeOffer) => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'error',
      message: 'Please connect your wallet first'
    });
    return;
  }

  try {
    // Mock transaction
    const txHash = await walletStore.sendTransaction('0x...', '0x...');
    
    // Add item to inventory
    inventoryStore.addItem(offer.item, offer.quantity);
    
    // Remove offer from market
    const index = offers.value.findIndex(o => o.id === offer.id);
    if (index > -1) {
      offers.value.splice(index, 1);
    }

    toastStore.showToast({
      type: 'success',
      message: `Bought ${offer.item.name}! TX: ${txHash.slice(0, 10)}...`
    });
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      message: 'Failed to buy item'
    });
  }
};

const createOffer = async () => {
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'error',
      message: 'Please connect your wallet first'
    });
    return;
  }

  const item = inventoryStore.getItem(selectedItemId.value);
  if (!item) return;

  const newOffer: TradeOffer = {
    id: Math.random().toString(36).substr(2, 9),
    seller: walletStore.address!,
    item: item.item,
    quantity: offerQuantity.value,
    price: offerPrice.value,
    currency: offerCurrency.value,
    timestamp: Date.now()
  };

  // Remove items from inventory
  inventoryStore.removeItem(selectedItemId.value, offerQuantity.value);

  // Add to my offers
  myOffers.value.push(newOffer);

  // Add to market
  offers.value.push(newOffer);

  toastStore.showToast({
    type: 'success',
    message: 'Offer created successfully!'
  });

  resetForm();
};

const cancelOffer = (offerId: string) => {
  const offer = myOffers.value.find(o => o.id === offerId);
  if (!offer) return;

  // Return items to inventory
  inventoryStore.addItem(offer.item, offer.quantity);

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
    message: 'Offer cancelled'
  });
};

const resetForm = () => {
  selectedItemId.value = '';
  offerQuantity.value = 1;
  offerPrice.value = 0;
  offerCurrency.value = 'ETH';
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ago`;
  } else {
    return `${minutes}m ago`;
  }
};

onMounted(() => {
  initializeSampleOffers();
});
</script>
