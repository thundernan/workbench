import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import MarketplaceService, { type Listing } from '@/services/marketplaceService';
import { useToast } from 'primevue/usetoast';

export function useMarketplace() {
  const walletStore = useWalletStore();
  const toast = useToast();
  
  const service = ref<MarketplaceService | null>(null);
  const listings = ref<Listing[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Initialize service when wallet connects
  const initializeService = () => {
    if (walletStore.provider && walletStore.signer) {
      service.value = new MarketplaceService(walletStore.provider, walletStore.signer);
    }
  };

  // Watch for wallet connection changes
  onMounted(() => {
    if (walletStore.connected) {
      initializeService();
    }
  });

  // Update service when wallet changes
  const updateService = () => {
    if (walletStore.provider && walletStore.signer && service.value) {
      service.value.updateProvider(walletStore.provider, walletStore.signer);
    } else if (walletStore.provider && !service.value) {
      service.value = new MarketplaceService(walletStore.provider);
    }
  };

  // Load all active listings
  const loadListings = async () => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const activeListings = await service.value.getActiveListings();
      listings.value = activeListings;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Failed to Load Listings',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get listing by ID
  const getListing = async (listingId: number): Promise<Listing> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getListing(listingId);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // List item for ETH sale
  const listForETH = async (
    tokenContract: string,
    tokenId: number,
    amount: number,
    priceInEth: string
  ): Promise<{ txHash: string; listingId?: string }> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const result = await service.value.listItemForETH(tokenContract, tokenId, amount, priceInEth);
      const receipt = await result.tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Item Listed',
        detail: `Successfully listed ${amount} tokens for ${priceInEth} ETH`,
        life: 5000
      });
      
      return {
        txHash: receipt.hash,
        listingId: result.listingId
      };
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Listing Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // List item for swap
  const listForSwap = async (
    tokenContract: string,
    tokenId: number,
    amount: number,
    swapTokenContract: string,
    swapTokenId: number,
    swapAmount: number
  ): Promise<{ txHash: string; listingId?: string }> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const result = await service.value.listItemForSwap(
        tokenContract,
        tokenId,
        amount,
        swapTokenContract,
        swapTokenId,
        swapAmount
      );
      const receipt = await result.tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Item Listed for Swap',
        detail: `Successfully listed ${amount} tokens for swap`,
        life: 5000
      });
      
      return {
        txHash: receipt.hash,
        listingId: result.listingId
      };
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Listing Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Buy item with ETH
  const buyWithETH = async (listingId: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.buyItemWithETH(listingId);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Purchase Successful',
        detail: `Successfully purchased item from listing ${listingId}`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Purchase Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Execute item swap
  const swapItem = async (listingId: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.swapItem(listingId);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Swap Successful',
        detail: `Successfully swapped items for listing ${listingId}`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Swap Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Cancel listing
  const cancelListing = async (listingId: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.cancelListing(listingId);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Listing Cancelled',
        detail: `Successfully cancelled listing ${listingId}`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Cancellation Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get listings by seller
  const getListingsBySeller = async (sellerAddress: string): Promise<Listing[]> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getListingsBySeller(sellerAddress);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Get listings by token
  const getListingsByToken = async (tokenContract: string, tokenId: number): Promise<Listing[]> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getListingsByToken(tokenContract, tokenId);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Get platform fee
  const getPlatformFee = async (): Promise<number> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getPlatformFee();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Calculate platform fee for price
  const calculatePlatformFee = async (priceInWei: bigint): Promise<bigint> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.calculatePlatformFee(priceInWei);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Event listeners
  const onItemListed = (callback: (
    listingId: bigint,
    seller: string,
    tokenContract: string,
    tokenId: bigint,
    amount: bigint,
    price: bigint
  ) => void) => {
    if (!service.value) throw new Error('Service not initialized');
    service.value.onItemListedForETH(callback);
  };

  const onItemPurchased = (callback: (
    listingId: bigint,
    buyer: string,
    seller: string,
    amount: bigint,
    price: bigint
  ) => void) => {
    if (!service.value) throw new Error('Service not initialized');
    service.value.onItemPurchased(callback);
  };

  // Cleanup
  onUnmounted(() => {
    if (service.value) {
      service.value.removeAllListeners();
    }
  });

  return {
    // State
    listings: computed(() => listings.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    service: computed(() => service.value),
    
    // Methods
    initializeService,
    updateService,
    loadListings,
    getListing,
    listForETH,
    listForSwap,
    buyWithETH,
    swapItem,
    cancelListing,
    getListingsBySeller,
    getListingsByToken,
    getPlatformFee,
    calculatePlatformFee,
    onItemListed,
    onItemPurchased,
    
    // Clear error
    clearError: () => { error.value = null; }
  };
}
