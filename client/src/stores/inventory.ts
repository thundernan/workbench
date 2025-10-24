import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Item, InventoryItem } from '@/types';

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([]);

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

  // Initialize with some sample items
  const initializeSampleItems = () => {
    const sampleItems: Item[] = [
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
      }
    ];

    // Add some sample quantities
    addItem(sampleItems[0], 10); // 10 wood
    addItem(sampleItems[1], 8);  // 8 stone
    addItem(sampleItems[2], 5);  // 5 iron
    addItem(sampleItems[3], 2);  // 2 diamond
  };

  return {
    items,
    addItem,
    removeItem,
    hasItem,
    getItemQuantity,
    getItem,
    totalItems,
    uniqueItems,
    initializeSampleItems
  };
});
