import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Item, InventoryItem } from '@/types';
import { apiService, type InventoryItem as ApiInventoryItem } from '@/services/apiService';
import { useWalletStore } from './wallet';
import { IIngredient } from './recipes';

export const useInventoryStore = defineStore('inventory', () => {
  const walletStore = useWalletStore();
  
  const items = ref<InventoryItem[]>([]);
  const userBalance = ref<IIngredient[]>([]); // User's blockchain balance
  const isLoadingBalance = ref(false);
  const balanceError = ref<string | null>(null);

  // Add items to inventory
  const addItem = (item: IIngredient, quantity: number = 1) => {
    const existingItem = items.value.find(invItem => invItem.item.tokenId === item.tokenId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.value.push({ item, quantity });
    }
  };

  // Remove items from inventory
  const removeItem = (itemId: string, quantity: number = 1) => {
    const existingItem = items.value.find(invItem => invItem.item.tokenId === itemId);
    if (existingItem) {
      existingItem.quantity -= quantity;
      if (existingItem.quantity <= 0) {
        const index = items.value.findIndex(invItem => invItem.item.tokenId === itemId);
        items.value.splice(index, 1);
      }
    }
  };

  // Check if we have enough of an item
  const hasItem = (itemId: string, quantity: number = 1): boolean => {
    const item = items.value.find(invItem => invItem.item.tokenId === itemId);
    return item ? item.quantity >= quantity : false;
  };

  // Get item quantity
  const getItemQuantity = (itemId: string): number => {
    const item = items.value.find(invItem => invItem.item.tokenId === itemId);
    return item ? item.quantity : 0;
  };

  // Get item by ID
  const getItem = (itemId: string): InventoryItem | undefined => {
    return items.value.find(invItem => invItem.item.tokenId === itemId);
  };

  // Computed properties
  const totalItems = computed(() => 
    items.value.reduce((total, invItem) => total + invItem.quantity, 0)
  );

  const uniqueItems = computed(() => items.value.length);

  // All available items in the game (catalog) - loaded from backend
  const allItems = ref<IIngredient[]>([]);
  const isLoading = ref(false);
  const loadError = ref<string | null>(null);

  // Track loading state to prevent duplicate requests
  let isLoadingBalanceInternal = false;
  let lastBalanceLoadTime = 0;
  const BALANCE_LOAD_DEBOUNCE_MS = 3000; // 3 second debounce

  // Load user's blockchain balance
  const loadUserBalance = async (address: string, force = false) => {
    // Prevent duplicate concurrent requests
    if (isLoadingBalanceInternal && !force) {
      return userBalance.value;
    }

    // Debounce rapid requests
    const now = Date.now();
    if (!force && now - lastBalanceLoadTime < BALANCE_LOAD_DEBOUNCE_MS) {
      return userBalance.value;
    }

    isLoadingBalance.value = true;
    isLoadingBalanceInternal = true;
    balanceError.value = null;
    lastBalanceLoadTime = now;
    
    try {
      const inventoryData = await apiService.getUserInventory(address, false);
      
      // Convert backend inventory items to frontend Items with balance
      userBalance.value = inventoryData.inventory;
      
      return userBalance.value;
    } catch (error) {
      console.error('❌ Failed to load user balance:', error);
      balanceError.value = error instanceof Error ? error.message : 'Failed to load balance';
      userBalance.value = [];
      
      // Don't throw if it's a rate limit error
      if (error instanceof Error && 
          (error.message.includes('Too many requests') || error.message.includes('rate limit'))) {
        return userBalance.value;
      }
      
      throw error;
    } finally {
      isLoadingBalance.value = false;
      isLoadingBalanceInternal = false;
    }
  };

  // Load ingredients from backend API (all ingredients catalog)
  const loadIngredientsFromAPI = async () => {
    isLoading.value = true;
    loadError.value = null;
    
    try {
      const ingredients = await apiService.getIngredients({ limit: 10 });
      
      // Convert backend ingredients to frontend Items
      allItems.value = ingredients;
      
      return allItems.value;
    } catch (error) {
      console.error('❌ Failed to load ingredients from API:', error);
      loadError.value = error instanceof Error ? error.message : 'Failed to load ingredients';
      
      // No fallback - return empty array if API fails
      allItems.value = [];
      return allItems.value;
    } finally {
      isLoading.value = false;
    }
  };

  // Watch for wallet connection changes (with debouncing)
  let walletWatchTimeout: ReturnType<typeof setTimeout> | null = null;
  watch(() => walletStore.address, async (newAddress, oldAddress) => {
    // Clear any pending timeout
    if (walletWatchTimeout) {
      clearTimeout(walletWatchTimeout);
      walletWatchTimeout = null;
    }

    if (newAddress && newAddress !== oldAddress) {
      // Debounce the balance load when wallet connects
      walletWatchTimeout = setTimeout(async () => {
        try {
          await loadUserBalance(newAddress);
        } catch (error) {
          console.error('Failed to load balance on wallet connect:', error);
        }
        walletWatchTimeout = null;
      }, 2000); // Wait 2 seconds after wallet connection
    } else if (!newAddress) {
      userBalance.value = [];
      balanceError.value = null;
    }
  });

  return {
    items,
    allItems,
    userBalance,
    isLoading,
    loadError,
    isLoadingBalance,
    balanceError,
    addItem,
    removeItem,
    hasItem,
    getItemQuantity,
    getItem,
    totalItems,
    uniqueItems,
    loadIngredientsFromAPI,
    loadUserBalance
  };
});
