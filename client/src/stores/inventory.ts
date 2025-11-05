import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Item, InventoryItem } from '@/types';
import { apiService, type InventoryItem as ApiInventoryItem } from '@/services/apiService';
import { useWalletStore } from './wallet';

export const useInventoryStore = defineStore('inventory', () => {
  const walletStore = useWalletStore();
  
  const items = ref<InventoryItem[]>([]);
  const userBalance = ref<Item[]>([]); // User's blockchain balance
  const isLoadingBalance = ref(false);
  const balanceError = ref<string | null>(null);

  // Add items to inventory
  const addItem = (item: Item, quantity: number = 1) => {
    const existingItem = items.value.find(invItem => invItem.item.id === item.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.value.push({ item, quantity });
    }
  };

  // Remove items from inventory
  const removeItem = (itemId: string, quantity: number = 1) => {
    const existingItem = items.value.find(invItem => invItem.item.id === itemId);
    if (existingItem) {
      existingItem.quantity -= quantity;
      if (existingItem.quantity <= 0) {
        const index = items.value.findIndex(invItem => invItem.item.id === itemId);
        items.value.splice(index, 1);
      }
    }
  };

  // Check if we have enough of an item
  const hasItem = (itemId: string, quantity: number = 1): boolean => {
    const item = items.value.find(invItem => invItem.item.id === itemId);
    return item ? item.quantity >= quantity : false;
  };

  // Get item quantity
  const getItemQuantity = (itemId: string): number => {
    const item = items.value.find(invItem => invItem.item.id === itemId);
    return item ? item.quantity : 0;
  };

  // Get item by ID
  const getItem = (itemId: string): InventoryItem | undefined => {
    return items.value.find(invItem => invItem.item.id === itemId);
  };

  // Computed properties
  const totalItems = computed(() => 
    items.value.reduce((total, invItem) => total + invItem.quantity, 0)
  );

  const uniqueItems = computed(() => items.value.length);

  // All available items in the game (catalog) - loaded from backend
  const allItems = ref<Item[]>([]);
  const isLoading = ref(false);
  const loadError = ref<string | null>(null);

  // Convert backend inventory item to frontend Item with balance
  const convertInventoryItemToItem = (inventoryItem: ApiInventoryItem): Item & { balance: string } => {
    const metadata = inventoryItem.metadata || {};
    
    // Get icon from metadata - prefer image URL if available, otherwise use emoji icon
    let icon = metadata.icon || '📦';
    if (!metadata.icon) {
      // Default icons based on category
      const categoryIcons: Record<string, string> = {
        material: '🪵',
        tool: '⛏️',
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        rare: '💎',
        common: '📦'
      };
      icon = categoryIcons[metadata.category as string] || '📦';
    }

    // Preserve full metadata including image
    // Spread metadata first, then override with defaults if needed
    const fullMetadata = {
      ...metadata, // Include all metadata fields from backend first
      name: metadata.name || `Token ${inventoryItem.tokenId}`,
      image: metadata.image || '', // Image URL from backend (preserve if exists)
      price: metadata.price || 0
    };

    return {
      id: `token_${inventoryItem.tokenId}`,
      name: metadata.name || `Token ${inventoryItem.tokenId}`,
      description: metadata.description || 'An ingredient from the blockchain',
      icon: icon, // Keep icon for backward compatibility (can be emoji or fallback)
      metadata: fullMetadata, // Full metadata including image
      rarity: (metadata.rarity || 'common') as any,
      category: (metadata.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable',
      balance: inventoryItem.balance,
      // Store tokenContract and tokenId for blockchain recipe matching
      tokenContract: inventoryItem.tokenContract,
      tokenId: inventoryItem.tokenId
    } as Item & { balance: string; tokenContract: string; tokenId: number };
  };

  // Convert backend ingredient to frontend Item
  const convertIngredientToItem = (ingredient: any): Item => {
    const metadata = ingredient.metadata || {};
    
    // Get icon from metadata or use default based on category
    let icon = metadata.icon || '📦';
    if (!metadata.icon) {
      // Default icons based on category
      const categoryIcons: Record<string, string> = {
        material: '🪵',
        tool: '⛏️',
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        rare: '💎',
        common: '📦'
      };
      icon = categoryIcons[metadata.category as string] || '📦';
    }

    // Preserve full metadata including image
    const fullMetadata = {
      ...metadata, // Include all metadata fields from backend first
      name: metadata.name || `Token ${ingredient.tokenId}`,
      image: metadata.image || '', // Image URL from backend (preserve if exists)
      price: metadata.price || 0
    };

    return {
      id: `token_${ingredient.tokenId}`,
      name: metadata.name || `Token ${ingredient.tokenId}`,
      description: metadata.description || 'An ingredient from the blockchain',
      icon: icon,
      metadata: fullMetadata, // Full metadata including image
      rarity: metadata.rarity || 'common',
      category: (metadata.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable'
    };
  };

  // Track loading state to prevent duplicate requests
  let isLoadingBalanceInternal = false;
  let lastBalanceLoadTime = 0;
  const BALANCE_LOAD_DEBOUNCE_MS = 3000; // 3 second debounce

  // Load user's blockchain balance
  const loadUserBalance = async (address: string, force = false) => {
    // Prevent duplicate concurrent requests
    if (isLoadingBalanceInternal && !force) {
      console.log('📡 Balance: Already loading, skipping duplicate request');
      return userBalance.value;
    }

    // Debounce rapid requests
    const now = Date.now();
    if (!force && now - lastBalanceLoadTime < BALANCE_LOAD_DEBOUNCE_MS) {
      console.log('📡 Balance: Request debounced, too soon after last request');
      return userBalance.value;
    }

    isLoadingBalance.value = true;
    isLoadingBalanceInternal = true;
    balanceError.value = null;
    lastBalanceLoadTime = now;
    
    try {
      console.log(`📡 Loading balance for address: ${address}...`);
      const inventoryData = await apiService.getUserInventory(address, false);
      
      console.log(`✅ Loaded ${inventoryData.inventory.length} items from blockchain`);
      
      // Convert backend inventory items to frontend Items with balance
      userBalance.value = inventoryData.inventory.map(convertInventoryItemToItem);
      
      return userBalance.value;
    } catch (error) {
      console.error('❌ Failed to load user balance:', error);
      balanceError.value = error instanceof Error ? error.message : 'Failed to load balance';
      userBalance.value = [];
      
      // Don't throw if it's a rate limit error
      if (error instanceof Error && 
          (error.message.includes('Too many requests') || error.message.includes('rate limit'))) {
        console.warn('Rate limit reached for balance, will retry later');
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
      console.log('📡 Loading ingredients from API...');
      const ingredients = await apiService.getIngredients({ limit: 10 });
      
      console.log(`✅ Loaded ${ingredients.length} ingredients from backend`);
      
      // Convert backend ingredients to frontend Items
      allItems.value = ingredients.map(convertIngredientToItem);
      
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
      console.log('👛 Wallet connected, will load user balance...');
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
      console.log('👛 Wallet disconnected, clearing balance...');
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
    loadUserBalance,
    convertIngredientToItem,
    convertInventoryItemToItem
  };
});
