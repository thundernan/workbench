import { ref, computed } from 'vue';
import { apiService, type InventoryItem } from '../services/apiService';

/**
 * Composable for managing user inventory from blockchain
 */
export function useInventory() {
  const inventory = ref<InventoryItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAddress = ref<string | null>(null);
  const totalItems = ref(0);
  const allTokensChecked = ref(0);
  const contractAddress = ref<string>('');

  /**
   * Fetch user inventory from blockchain
   * @param address - Wallet address
   * @param includeZero - Include tokens with zero balance
   */
  const fetchInventory = async (address: string, includeZero: boolean = false) => {
    if (!address) {
      error.value = 'Wallet address is required';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.getUserInventory(address, includeZero);
      
      inventory.value = response.inventory;
      totalItems.value = response.totalItems;
      allTokensChecked.value = response.allTokensChecked;
      contractAddress.value = response.contractAddress;
      lastFetchedAddress.value = address;
      
      console.log(`✅ Inventory loaded: ${response.totalItems} items`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch inventory';
      error.value = message;
      console.error('Failed to fetch inventory:', err);
      
      // Reset on error
      inventory.value = [];
      totalItems.value = 0;
      allTokensChecked.value = 0;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh inventory for the last fetched address
   */
  const refreshInventory = async (includeZero: boolean = false) => {
    if (!lastFetchedAddress.value) {
      error.value = 'No address to refresh';
      return;
    }
    await fetchInventory(lastFetchedAddress.value, includeZero);
  };

  /**
   * Get inventory item by token ID
   */
  const getItemByTokenId = (tokenId: number): InventoryItem | undefined => {
    return inventory.value.find(item => item.tokenId === tokenId);
  };

  /**
   * Check if user has enough of a specific token
   */
  const hasEnoughTokens = (tokenId: number, requiredAmount: number): boolean => {
    const item = getItemByTokenId(tokenId);
    if (!item) return false;
    return parseInt(item.balance) >= requiredAmount;
  };

  /**
   * Get balance for a specific token
   */
  const getTokenBalance = (tokenId: number): string => {
    const item = getItemByTokenId(tokenId);
    return item?.balance || '0';
  };

  /**
   * Filter inventory by category
   */
  const filterByCategory = (category: string): InventoryItem[] => {
    return inventory.value.filter(item => item.metadata.category === category);
  };

  /**
   * Search inventory by name
   */
  const searchByName = (query: string): InventoryItem[] => {
    const lowerQuery = query.toLowerCase();
    return inventory.value.filter(item => 
      item.metadata.name?.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Get all unique categories
   */
  const categories = computed(() => {
    const cats = new Set(
      inventory.value
        .map(item => item.metadata.category)
        .filter(Boolean)
    );
    return Array.from(cats);
  });

  /**
   * Check if inventory is empty
   */
  const isEmpty = computed(() => inventory.value.length === 0);

  /**
   * Check if user has any items
   */
  const hasItems = computed(() => inventory.value.length > 0);

  /**
   * Clear inventory
   */
  const clearInventory = () => {
    inventory.value = [];
    totalItems.value = 0;
    allTokensChecked.value = 0;
    lastFetchedAddress.value = null;
    error.value = null;
  };

  return {
    // State
    inventory,
    isLoading,
    error,
    totalItems,
    allTokensChecked,
    contractAddress,
    lastFetchedAddress,

    // Computed
    isEmpty,
    hasItems,
    categories,

    // Actions
    fetchInventory,
    refreshInventory,
    clearInventory,

    // Helpers
    getItemByTokenId,
    hasEnoughTokens,
    getTokenBalance,
    filterByCategory,
    searchByName,
  };
}

export default useInventory;

