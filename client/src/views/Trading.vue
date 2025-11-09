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
            :disabled="isRefreshing || isLoadingOffers"
            class="px-4 py-2 rounded-lg font-semibold transition-colors"
            :class="isRefreshing || isLoadingOffers
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'"
          >
            <span v-if="isRefreshing || isLoadingOffers">⏳ Refreshing...</span>
            <span v-else>🔄 Refresh</span>
          </button>
            </div>
          </div>

      <!-- Loading state -->
      <div v-if="isLoadingOffers" class="bg-slate-800 border-2 border-slate-700 rounded-lg p-12 text-center text-slate-400">
        Loading offers from marketplace...
      </div>

      <!-- Offers Grid -->
      <div v-else-if="filteredOffers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
          v-for="offer in filteredOffers"
          :key="offer.listing.listingId"
              class="bg-slate-800 border-2 border-slate-700 rounded-lg p-5 hover:border-emerald-400 transition-all duration-200"
            >
              <!-- Seller Info -->
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                <div class="text-slate-400 text-xs">
              Seller: <span class="text-emerald-400">{{ formatAddress(offer.listing.seller) }}</span>
                </div>
            <div class="text-slate-500 text-xs">{{ formatTime(offer.createdAt) }}</div>
              </div>

              <!-- Offer Details -->
              <div class="mb-4">
                <div class="text-slate-400 text-xs mb-2">Offering:</div>
                <div class="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
              <div class="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  v-if="offer.offering.image"
                  :src="offer.offering.image"
                  :alt="offer.offering.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-2xl text-white">{{ getIngredientInitial(offer.offering) }}</span>
              </div>
                  <div class="flex-1">
                <div class="text-white font-semibold">{{ offer.offering.name }}</div>
                <div class="text-slate-400 text-xs">Category: {{ getCategoryLabel(offer.offering) }}</div>
                <div class="text-slate-400 text-xs">Amount: {{ offer.listing.amount }}</div>
                  </div>
                </div>
              </div>

              <!-- Arrow -->
          <div class="text-center text-emerald-400 text-xl mb-4">
            <span v-if="offer.listing.listingType === 'ITEM_SWAP'">⇅</span>
            <span v-else>💰</span>
          </div>

              <!-- Requesting -->
          <div class="mb-4">
            <div class="text-slate-400 text-xs mb-2">
              {{ offer.listing.listingType === 'ITEM_SWAP' ? 'Requesting:' : 'Price (ETH):' }}
            </div>
            <div
              v-if="offer.listing.listingType === 'ITEM_SWAP' && offer.requesting"
              class="flex items-center gap-3 bg-slate-700 rounded-lg p-3"
            >
              <div class="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  v-if="offer.requesting.image"
                  :src="offer.requesting.image"
                  :alt="offer.requesting.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-2xl text-white">{{ getIngredientInitial(offer.requesting) }}</span>
              </div>
              <div class="flex-1">
                <div class="text-white font-semibold">{{ offer.requesting.name }}</div>
                <div class="text-slate-400 text-xs">Category: {{ getCategoryLabel(offer.requesting) }}</div>
                <div class="text-slate-400 text-xs">Amount: {{ offer.listing.swapAmount }}</div>
              </div>
            </div>
            <div
              v-else
              class="bg-slate-700 rounded-lg p-3 text-white font-semibold text-center"
            >
              {{ formatWei(offer.listing.priceInWei) }} ETH
            </div>
          </div>

              <!-- Trade Button -->
              <button
            @click="acceptTrade(offer)"
            :disabled="processingListingId === offer.listing.listingId || !canAcceptOffer(offer)"
                class="w-full py-2.5 rounded-lg font-semibold transition-all duration-200"
            :class="canAcceptOffer(offer)
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-500/30 disabled:opacity-70'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
            <span v-if="processingListingId === offer.listing.listingId">⏳ Processing...</span>
            <span v-else-if="offer.listing.listingType === 'ETH_SALE'">
              {{ canAcceptOffer(offer) ? `Buy for ${formatWei(offer.listing.priceInWei)} ETH` : 'Unavailable' }}
            </span>
            <span v-else>
              {{ canAcceptOffer(offer) ? '✓ Accept Trade' : '✗ Insufficient Items' }}
            </span>
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
                  v-model="offerForm.offeringRef"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  >
                    <option value="">Choose an item...</option>
                    <option
                    v-for="option in userInventoryOptions"
                    :key="option.value"
                    :value="option.value"
                    >
                    {{ option.label }} (Balance: {{ option.balance }})
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
                <div v-if="selectedOfferingIngredient" class="text-slate-400 text-xs mt-1">
                    Available: {{ maxOfferingQuantity }}
                  </div>
                </div>

                <!-- Preview -->
              <div v-if="selectedOfferingIngredient" class="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                  <div class="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      v-if="selectedOfferingIngredient.image"
                      :src="selectedOfferingIngredient.image"
                      :alt="selectedOfferingIngredient.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-3xl text-white">{{ getIngredientInitial(selectedOfferingIngredient) }}</span>
                  </div>
                    <div>
                    <div class="text-white font-semibold">{{ selectedOfferingIngredient.name }}</div>
                    <div class="text-slate-400 text-sm">Token ID: {{ selectedOfferingIngredient.tokenId }}</div>
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
                  v-model="offerForm.requestingRef"
                    class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                >
                    <option value="">Choose an item...</option>
                    <option
                    v-for="option in ingredientOptions"
                    :key="option.value"
                    :value="option.value"
                    >
                    {{ option.label }}
                    </option>
                  </select>
                </div>

              <div v-if="offerForm.listingType === 'ITEM_SWAP'">
                <label class="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                <input
                  v-model.number="offerForm.requestingQuantity"
                  type="number"
                  min="1"
                  class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div v-else>
                <label class="block text-sm font-medium text-slate-300 mb-2">Price (ETH)</label>
                <input
                  v-model="offerForm.priceInWei"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

                <!-- Preview -->
              <div v-if="selectedRequestingIngredient && offerForm.listingType === 'ITEM_SWAP'" class="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div class="text-slate-400 text-xs mb-2">Preview:</div>
                  <div class="flex items-center gap-3">
                  <div class="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      v-if="selectedRequestingIngredient.image"
                      :src="selectedRequestingIngredient.image"
                      :alt="selectedRequestingIngredient.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-3xl text-white">{{ getIngredientInitial(selectedRequestingIngredient) }}</span>
                  </div>
                    <div>
                    <div class="text-white font-semibold">{{ selectedRequestingIngredient.name }}</div>
                    <div class="text-slate-400 text-sm">Token ID: {{ selectedRequestingIngredient.tokenId }}</div>
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
                :disabled="!canCreateOffer || isCreatingOffer"
                class="flex-1 py-3 rounded-lg font-semibold transition-all duration-200"
                :class="canCreateOffer && !isCreatingOffer
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
                <span v-if="isCreatingOffer">⏳ Creating...</span>
                <span v-else>✓ Create Offer</span>
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
                :key="offer.listing.listingId"
                class="bg-slate-700 border border-slate-600 rounded-lg p-5"
              >
                <div class="flex items-start justify-between gap-6">
                  <!-- Offer Details -->
                  <div class="flex-1 grid grid-cols-3 gap-4 items-center">
                    <!-- Offering -->
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                        <img v-if="offer.offering.image" :src="offer.offering.image" :alt="offer.offering.name" class="w-full h-full object-cover" />
                        <span v-else class="text-2xl text-white">{{ getIngredientInitial(offer.offering) }}</span>
                      </div>
                      <div>
                        <div class="text-white font-medium">{{ offer.offering.name }}</div>
                        <div class="text-slate-400 text-xs">× {{ offer.listing.amount }}</div>
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="text-center text-emerald-400 text-2xl">
                      <span v-if="offer.listing.listingType === 'ITEM_SWAP'">→</span>
                      <span v-else>💰</span>
                    </div>

                    <!-- Requesting -->
                    <div class="flex items-center gap-3">
                      <template v-if="offer.listing.listingType === 'ITEM_SWAP' && offer.requesting">
                        <div class="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                          <img v-if="offer.requesting.image" :src="offer.requesting.image" :alt="offer.requesting.name" class="w-full h-full object-cover" />
                          <span v-else class="text-2xl text-white">{{ getIngredientInitial(offer.requesting) }}</span>
                        </div>
                        <div>
                          <div class="text-white font-medium">{{ offer.requesting.name }}</div>
                          <div class="text-slate-400 text-xs">× {{ offer.listing.swapAmount }}</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="text-white font-medium">{{ formatWei(offer.listing.priceInWei) }} ETH</div>
                      </template>
                    </div>
                  </div>

                  <!-- Cancel Button -->
                  <button
                    @click="cancelOffer(offer.listing.listingId)"
                    :disabled="processingListingId === offer.listing.listingId"
                    class="px-5 py-2 rounded-lg transition-colors font-semibold"
                    :class="processingListingId === offer.listing.listingId ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'"
                  >
                    <span v-if="processingListingId === offer.listing.listingId">⏳ Cancelling...</span>
                    <span v-else>✗ Cancel</span>
                  </button>
                </div>

                <!-- Timestamp -->
                <div class="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-600">
                  Created {{ formatTime(offer.createdAt) }}
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
import { ethers } from 'ethers';
import AppHeader from '@/components/AppHeader.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import marketplaceContractService, { getMarketplaceContractAddress } from '@/services/marketplaceContractService';
import type { MarketplaceListing, MarketplaceListingType } from '@/types';
import type { IIngredient } from '@/stores/recipes';

interface TokenRef {
  tokenContract: string;
  tokenId: number;
}

interface DisplayIngredient {
  tokenContract: string;
  tokenId: number;
  name: string;
  description?: string;
  category?: string;
  image?: string;
}

interface DisplayOffer {
  listing: MarketplaceListing;
  offering: DisplayIngredient;
  requesting: DisplayIngredient | null;
  createdAt: number;
}

const tabs = ['Market', 'Create Offer', 'My Offers'];
const activeTab = ref(0);

const inventoryStore = useInventoryStore();
const walletStore = useWalletStore();
const toastStore = useToastStore();

const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref<'newest' | 'oldest' | 'price' | 'price-desc'>('newest');

const offers = ref<MarketplaceListing[]>([]);
const isLoadingOffers = ref(false);
const isRefreshing = ref(false);
const isCreatingOffer = ref(false);
const processingListingId = ref<number | null>(null);

const offerForm = ref({
  listingType: 'ITEM_SWAP' as MarketplaceListingType,
  offeringRef: '',
  offeringQuantity: 1,
  requestingRef: '',
  requestingQuantity: 1,
  priceInWei: ''
});

const marketplaceAddress = getMarketplaceContractAddress();

const encodeTokenRef = (tokenContract: string, tokenId: number): string =>
  `${tokenContract.toLowerCase()}::${tokenId}`;

const parseTokenRef = (value: string): TokenRef | null => {
  if (!value) return null;
  const [contract, tokenIdString] = value.split('::');
  if (!contract || !tokenIdString) return null;
  const tokenId = Number(tokenIdString);
  if (Number.isNaN(tokenId)) return null;
  return {
    tokenContract: contract,
    tokenId
  };
};

const normalizeTokenId = (tokenId: string | number | bigint | undefined): number => {
  if (tokenId === undefined || tokenId === null) {
    return 0;
  }

  if (typeof tokenId === 'string') {
    const asNumber = Number(tokenId);
    return Number.isNaN(asNumber) ? 0 : asNumber;
  }

  if (typeof tokenId === 'bigint') {
    return Number(tokenId);
  }

  return tokenId;
};

const findIngredientMetadata = (tokenContract: string, tokenId: number): IIngredient | null => {
  const matchFromCatalog = inventoryStore.allItems.find((ingredient: IIngredient) => {
    return (
      ingredient.tokenContract?.toLowerCase() === tokenContract.toLowerCase() &&
      normalizeTokenId(ingredient.tokenId) === tokenId
    );
  });

  if (matchFromCatalog) {
    return matchFromCatalog;
  }

  const matchFromInventory = inventoryStore.userBalance.find((ingredient: any) => {
    return (
      ingredient.tokenContract?.toLowerCase() === tokenContract.toLowerCase() &&
      normalizeTokenId(ingredient.tokenId) === tokenId
    );
  });

  return matchFromInventory || null;
};

const buildDisplayIngredient = (meta: IIngredient | null, tokenContract: string, tokenId: number): DisplayIngredient => {
  const metadata = meta?.metadata || {};
  return {
    tokenContract,
    tokenId,
    name: metadata.name || `Token #${tokenId}`,
    description: metadata.description,
    category: metadata.category,
    image: metadata.image
  };
};

const getUserBalanceForToken = (tokenContract: string, tokenId: number): number => {
  const balanceEntry = inventoryStore.userBalance.find((ingredient: any) => {
    return (
      ingredient.tokenContract?.toLowerCase() === tokenContract.toLowerCase() &&
      normalizeTokenId(ingredient.tokenId) === tokenId
    );
  });

  if (!balanceEntry) return 0;

  const balanceValue = (balanceEntry as any).balance ?? 0;
  if (typeof balanceValue === 'string') {
    return Number(balanceValue);
  }
  if (typeof balanceValue === 'bigint') {
    return Number(balanceValue);
  }
  return Number(balanceValue);
};

const displayOffers = computed<DisplayOffer[]>(() => {
  return offers.value.map((listing) => {
    const offeringMeta = findIngredientMetadata(listing.tokenContract, listing.tokenId);
    const offering = buildDisplayIngredient(offeringMeta, listing.tokenContract, listing.tokenId);

    let requesting: DisplayIngredient | null = null;
    if (
      listing.listingType === 'ITEM_SWAP' &&
      listing.swapTokenContract &&
      listing.swapTokenId !== null
    ) {
      const requestingMeta = findIngredientMetadata(listing.swapTokenContract, listing.swapTokenId);
      requesting = buildDisplayIngredient(
        requestingMeta,
        listing.swapTokenContract,
        listing.swapTokenId ?? 0
      );
    }

    return {
      listing,
      offering,
      requesting,
      createdAt: listing.createdAt ?? Date.now()
    };
  });
});

const filteredOffers = computed<DisplayOffer[]>(() => {
  let filtered = displayOffers.value.filter((offer) => {
    if (!offer.listing.active) return false;
    return offer.listing.seller.toLowerCase() !== walletStore.address?.toLowerCase();
  });

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((offer) => {
      return (
        offer.offering.name.toLowerCase().includes(query) ||
        (offer.requesting?.name?.toLowerCase().includes(query) ?? false)
      );
    });
  }

  if (selectedCategory.value) {
    filtered = filtered.filter((offer) => {
      return (
        offer.offering.category === selectedCategory.value ||
        offer.requesting?.category === selectedCategory.value
      );
    });
  }

  switch (sortBy.value) {
    case 'newest':
      filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      filtered = [...filtered].sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'price':
      filtered = [...filtered].sort((a, b) => {
        const aValue = Number(a.listing.priceInWei ?? 0n);
        const bValue = Number(b.listing.priceInWei ?? 0n);
        return aValue - bValue;
      });
      break;
    case 'price-desc':
      filtered = [...filtered].sort((a, b) => {
        const aValue = Number(a.listing.priceInWei ?? 0n);
        const bValue = Number(b.listing.priceInWei ?? 0n);
        return bValue - aValue;
      });
      break;
  }

  return filtered;
});

const myOffers = computed<DisplayOffer[]>(() => {
  if (!walletStore.address) return [];
  return displayOffers.value.filter((offer) => {
    return offer.listing.seller.toLowerCase() === walletStore.address!.toLowerCase();
  });
});

const userInventoryOptions = computed(() => {
  return inventoryStore.userBalance
    .map((item: any) => ({
      value: encodeTokenRef(item.tokenContract, normalizeTokenId(item.tokenId)),
      label: item.metadata?.name || `Token #${normalizeTokenId(item.tokenId)}`,
      balance: getUserBalanceForToken(item.tokenContract, normalizeTokenId(item.tokenId)),
      metadata: item.metadata || {}
    }))
    .filter((option) => option.balance > 0);
});

const ingredientOptions = computed(() => {
  return inventoryStore.allItems.map((item: IIngredient) => ({
    value: encodeTokenRef(item.tokenContract, normalizeTokenId(item.tokenId)),
    label: item.metadata?.name || `Token #${normalizeTokenId(item.tokenId)}`,
    metadata: item.metadata || {}
  }));
});

const selectedOfferingRef = computed(() => parseTokenRef(offerForm.value.offeringRef));
const selectedRequestingRef = computed(() => parseTokenRef(offerForm.value.requestingRef));

const selectedOfferingIngredient = computed<DisplayIngredient | null>(() => {
  const ref = selectedOfferingRef.value;
  if (!ref) return null;
  const meta = findIngredientMetadata(ref.tokenContract, ref.tokenId);
  return buildDisplayIngredient(meta, ref.tokenContract, ref.tokenId);
});

const selectedRequestingIngredient = computed<DisplayIngredient | null>(() => {
    const ref = selectedRequestingRef.value;
    if (!ref) return null;
    const meta = findIngredientMetadata(ref.tokenContract, ref.tokenId);
    return buildDisplayIngredient(meta, ref.tokenContract, ref.tokenId);
});

const maxOfferingQuantity = computed(() => {
  const ref = selectedOfferingRef.value;
  if (!ref) return 0;
  return getUserBalanceForToken(ref.tokenContract, ref.tokenId);
});

const canCreateOffer = computed(() => {
  if (offerForm.value.listingType === 'ITEM_SWAP') {
    return (
      !!selectedOfferingRef.value &&
      !!selectedRequestingRef.value &&
      offerForm.value.offeringQuantity > 0 &&
      offerForm.value.offeringQuantity <= maxOfferingQuantity.value &&
      offerForm.value.requestingQuantity > 0
    );
  }

  if (offerForm.value.listingType === 'ETH_SALE') {
    return (
      !!selectedOfferingRef.value &&
      offerForm.value.offeringQuantity > 0 &&
      offerForm.value.offeringQuantity <= maxOfferingQuantity.value &&
      !!offerForm.value.priceInWei &&
      Number(offerForm.value.priceInWei) > 0
    );
  }

  return false;
});

const canAcceptOffer = (offer: DisplayOffer): boolean => {
  if (!walletStore.connected) return false;
  if (offer.listing.seller.toLowerCase() === walletStore.address?.toLowerCase()) return false;

  if (offer.listing.listingType === 'ETH_SALE') {
    return true;
  }

  if (!offer.requesting || offer.listing.swapAmount === null) {
    return false;
  }

  const balance = getUserBalanceForToken(
    offer.requesting.tokenContract,
    offer.requesting.tokenId
  );

  return balance >= (offer.listing.swapAmount ?? 0);
};

const ensureDataLoaded = async () => {
  if (inventoryStore.allItems.length === 0) {
    try {
      await inventoryStore.loadIngredientsFromAPI();
    } catch (error: any) {
      console.error('Failed to load ingredient catalog:', error);
    }
  }

  if (walletStore.address) {
    try {
      await inventoryStore.loadUserBalance(walletStore.address, true);
    } catch (error) {
      console.error('Failed to load user balance:', error);
    }
  }
};

const loadOffers = async () => {
  try {
    isLoadingOffers.value = true;
    const provider: ethers.Provider | undefined = walletStore.provider ?? undefined;
    const listings = await marketplaceContractService.getActiveListings(provider);
    offers.value = listings;
  } catch (error: any) {
    console.error('Failed to load marketplace listings:', error);
    toastStore.showToast({
      type: 'error',
      message: error?.message || 'Failed to load marketplace listings'
    });
  } finally {
    isLoadingOffers.value = false;
  }
};

const refreshOffers = async () => {
  try {
    isRefreshing.value = true;
    await ensureDataLoaded();
    await loadOffers();
    toastStore.showToast({
      type: 'info',
      message: 'Marketplace offers refreshed'
    });
  } finally {
    isRefreshing.value = false;
  }
};

const acceptTrade = async (offer: DisplayOffer) => {
  if (!walletStore.connected || !walletStore.signer) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  try {
    processingListingId.value = offer.listing.listingId;

    if (offer.listing.listingType === 'ITEM_SWAP') {
      await marketplaceContractService.swapItem(offer.listing, walletStore.signer);
      toastStore.showToast({
        type: 'success',
        message: `Swap completed successfully!`
      });
    } else {
      await marketplaceContractService.buyItemWithETH(offer.listing, walletStore.signer);
      toastStore.showToast({
        type: 'success',
        message: `Purchase completed successfully!`
      });
    }

    await loadOffers();

    if (walletStore.address) {
      await inventoryStore.loadUserBalance(walletStore.address, true);
    }
  } catch (error: any) {
    console.error('Error accepting trade:', error);
    toastStore.showToast({
      type: 'error',
      message: error?.message || 'Failed to complete trade'
    });
  } finally {
    processingListingId.value = null;
  }
};

const createOffer = async () => {
  if (!walletStore.connected || !walletStore.signer) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  if (!canCreateOffer.value) return;

  const offeringRef = selectedOfferingRef.value;
  if (!offeringRef) return;

  try {
    isCreatingOffer.value = true;

    if (offerForm.value.listingType === 'ITEM_SWAP') {
      const requestingRef = selectedRequestingRef.value;
      if (!requestingRef) return;

      const result = await marketplaceContractService.listItemForSwap(
        {
          tokenContract: offeringRef.tokenContract,
          tokenId: offeringRef.tokenId,
          amount: offerForm.value.offeringQuantity,
          swapTokenContract: requestingRef.tokenContract,
          swapTokenId: requestingRef.tokenId,
          swapAmount: offerForm.value.requestingQuantity
        },
        walletStore.signer
      );

      toastStore.showToast({
        type: 'success',
        message: result.listingId !== null
          ? `Offer created! Listing ID: ${result.listingId}`
          : 'Offer created on marketplace'
      });
    } else {
      const priceInWei = BigInt(offerForm.value.priceInWei);
      const result = await marketplaceContractService.listItemForETH(
        {
          tokenContract: offeringRef.tokenContract,
          tokenId: offeringRef.tokenId,
          amount: offerForm.value.offeringQuantity,
          priceInWei
        },
        walletStore.signer
      );

      toastStore.showToast({
        type: 'success',
        message: result.listingId !== null
          ? `Listing created! ID: ${result.listingId}`
          : 'Listing created on marketplace'
      });
    }

    resetForm();
    await loadOffers();

    if (walletStore.address) {
      await inventoryStore.loadUserBalance(walletStore.address, true);
    }

    activeTab.value = 2;
  } catch (error: any) {
    console.error('Error creating offer:', error);
    toastStore.showToast({
      type: 'error',
      message: error?.message || 'Failed to create offer'
    });
  } finally {
    isCreatingOffer.value = false;
  }
};

const cancelOffer = async (listingId: number) => {
  if (!walletStore.connected || !walletStore.signer) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet first'
    });
    return;
  }

  try {
    processingListingId.value = listingId;
    await marketplaceContractService.cancelListing(listingId, walletStore.signer);

    toastStore.showToast({
      type: 'info',
      message: 'Offer cancelled successfully'
    });

    await loadOffers();

    if (walletStore.address) {
      await inventoryStore.loadUserBalance(walletStore.address, true);
    }
  } catch (error: any) {
    console.error('Error cancelling offer:', error);
    toastStore.showToast({
      type: 'error',
      message: error?.message || 'Failed to cancel offer'
    });
  } finally {
    processingListingId.value = null;
  }
};

const resetForm = () => {
  offerForm.value = {
    listingType: 'ITEM_SWAP',
    offeringRef: '',
    offeringQuantity: 1,
    requestingRef: '',
    requestingQuantity: 1,
    priceInWei: ''
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

const formatWei = (value: bigint) => {
  try {
    return Number(ethers.formatEther(value)).toFixed(4);
  } catch {
    return '0';
  }
};

const getIngredientInitial = (ingredient: DisplayIngredient | null) => {
  return ingredient?.name?.charAt(0)?.toUpperCase() ?? '#';
};

const getCategoryLabel = (ingredient: DisplayIngredient | null) => {
  return ingredient?.category || 'Unknown';
};

onMounted(async () => {
  await ensureDataLoaded();
  await loadOffers();
});

watch(
  () => walletStore.address,
  async (newAddress, previousAddress) => {
    if (newAddress && newAddress !== previousAddress) {
      await inventoryStore.loadUserBalance(newAddress, true);
      await loadOffers();
    } else if (!newAddress && previousAddress) {
      await loadOffers();
    }
  }
);
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

