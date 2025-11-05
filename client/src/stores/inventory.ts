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

    return {
      id: `token_${inventoryItem.tokenId}`,
      name: metadata.name || `Token ${inventoryItem.tokenId}`,
      description: metadata.description || 'An ingredient from the blockchain',
      icon: icon,
      rarity: (metadata.rarity || 'common') as any,
      category: (metadata.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable',
      balance: inventoryItem.balance
    };
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

    return {
      id: `token_${ingredient.tokenId}`,
      name: metadata.name || `Token ${ingredient.tokenId}`,
      description: metadata.description || 'An ingredient from the blockchain',
      icon: icon,
      rarity: metadata.rarity || 'common',
      category: (metadata.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable'
    };
  };

  // Load user's blockchain balance
  const loadUserBalance = async (address: string) => {
    isLoadingBalance.value = true;
    balanceError.value = null;
    
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
      throw error;
    } finally {
      isLoadingBalance.value = false;
    }
  };

  // Load ingredients from backend API (all ingredients catalog)
  const loadIngredientsFromAPI = async () => {
    isLoading.value = true;
    loadError.value = null;
    
    try {
      console.log('📡 Loading ingredients from API...');
      const ingredients = await apiService.getIngredients({ limit: 1000 });
      
      console.log(`✅ Loaded ${ingredients.length} ingredients from backend`);
      
      // Convert backend ingredients to frontend Items
      allItems.value = ingredients.map(convertIngredientToItem);
      
      return allItems.value;
    } catch (error) {
      console.error('❌ Failed to load ingredients from API:', error);
      loadError.value = error instanceof Error ? error.message : 'Failed to load ingredients';
      
      // Fallback to sample items if API fails
      allItems.value = getSampleItems();
      return allItems.value;
    } finally {
      isLoading.value = false;
    }
  };

  // Watch for wallet connection changes
  watch(() => walletStore.address, async (newAddress, oldAddress) => {
    if (newAddress && newAddress !== oldAddress) {
      console.log('👛 Wallet connected, loading user balance...');
      try {
        await loadUserBalance(newAddress);
      } catch (error) {
        console.error('Failed to load balance on wallet connect:', error);
      }
    } else if (!newAddress) {
      console.log('👛 Wallet disconnected, clearing balance...');
      userBalance.value = [];
      balanceError.value = null;
    }
  });

  // Sample items as fallback
  const getSampleItems = (): Item[] => [
    {
      id: 'wood',
      name: 'Wood',
      description: 'Basic crafting material',
      icon: '🪵',
      rarity: 'common',
      category: 'material'
    },
    {
      id: 'stone',
      name: 'Stone',
      description: 'Hard material for tools',
      icon: '🪨',
      rarity: 'common',
      category: 'material'
    },
    {
      id: 'iron',
      name: 'Iron',
      description: 'Metal for advanced crafting',
      icon: '⬛',
      rarity: 'uncommon',
      category: 'material'
    },
    {
      id: 'diamond',
      name: 'Diamond',
      description: 'Rare precious gem',
      icon: '💎',
      rarity: 'rare',
      category: 'material'
    },
    {
      id: 'wooden_pickaxe',
      name: 'Wooden Pickaxe',
      description: 'Basic mining tool',
      icon: '⛏️',
      rarity: 'common',
      category: 'tool'
    },
    {
      id: 'wooden_sword',
      name: 'Wooden Sword',
      description: 'A basic wooden sword',
      icon: '🗡️',
      rarity: 'common',
      category: 'weapon'
    },
    {
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A sharp iron sword',
      icon: '⚔️',
      rarity: 'rare',
      category: 'weapon'
    }
  ];

  // Initialize with some sample items for testing
  const initializeSampleItems = () => {
    const sampleItems = getSampleItems();
    // Add some sample quantities
    addItem(sampleItems[0], 10); // 10 wood
    addItem(sampleItems[1], 8);  // 8 stone
    addItem(sampleItems[2], 5);  // 5 iron
    addItem(sampleItems[3], 2);  // 2 diamond
  };

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
    initializeSampleItems,
    loadIngredientsFromAPI,
    loadUserBalance,
    convertIngredientToItem,
    convertInventoryItemToItem
  };
});
