import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Item, InventoryItem } from '@/types';
import { apiService } from '@/services/apiService';

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isBlockchainLoaded = ref(false);

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

  // All available items in the game (catalog)
  const allItems: Item[] = [
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

  // Initialize with some sample items
  const initializeSampleItems = () => {
    // Add some sample quantities
    addItem(allItems[0], 10); // 10 wood
    addItem(allItems[1], 8);  // 8 stone
    addItem(allItems[2], 5);  // 5 iron
    addItem(allItems[3], 2);  // 2 diamond
  };

  // Load inventory from blockchain
  const loadBlockchainInventory = async (walletAddress: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('🔄 Loading blockchain inventory for:', walletAddress);
      
      // Fetch user inventory from blockchain
      const result = await apiService.getUserInventory(walletAddress, false);
      
      console.log('✅ Blockchain inventory loaded:', result);
      
      // Clear current items (we'll replace with blockchain data)
      items.value = [];
      
      // Convert blockchain inventory to our format
      result.inventory.forEach(blockchainItem => {
        // Create Item from metadata
        const item: Item = {
          id: `token_${blockchainItem.tokenId}`,
          name: blockchainItem.metadata.name || `Token #${blockchainItem.tokenId}`,
          description: blockchainItem.metadata.description || 'Blockchain ingredient',
          icon: blockchainItem.metadata.image || '📦',
          rarity: (blockchainItem.metadata.rarity as any) || 'common',
          category: (blockchainItem.metadata.category as any) || 'material',
          tokenId: blockchainItem.tokenId,
          tokenContract: blockchainItem.tokenContract
        };
        
        // Parse balance (it's a string from blockchain)
        const quantity = parseInt(blockchainItem.balance, 10);
        
        // Add to inventory
        if (quantity > 0) {
          items.value.push({ item, quantity });
        }
      });
      
      isBlockchainLoaded.value = true;
      console.log(`✅ Loaded ${items.value.length} items from blockchain`);
      
      return result;
    } catch (err: any) {
      console.error('❌ Failed to load blockchain inventory:', err);
      error.value = err.message || 'Failed to load inventory';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Clear blockchain inventory
  const clearBlockchainInventory = () => {
    items.value = [];
    isBlockchainLoaded.value = false;
    error.value = null;
  };

  return {
    items,
    allItems,
    isLoading,
    error,
    isBlockchainLoaded,
    addItem,
    removeItem,
    hasItem,
    getItemQuantity,
    getItem,
    totalItems,
    uniqueItems,
    initializeSampleItems,
    loadBlockchainInventory,
    clearBlockchainInventory
  };
});
