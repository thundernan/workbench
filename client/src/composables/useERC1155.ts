import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import ERC1155Service from '@/services/erc1155Service';
import { useToast } from 'primevue/usetoast';
import { BlockchainErrorHandler, type BlockchainError } from '@/utils/blockchainErrorHandler';

export function useERC1155() {
  const walletStore = useWalletStore();
  const toast = useToast();
  
  const service = ref<ERC1155Service | null>(null);
  const loading = ref(false);
  const error = ref<BlockchainError | null>(null);

  // Initialize service when wallet connects
  const initializeService = () => {
    if (walletStore.provider && walletStore.signer) {
      service.value = new ERC1155Service(walletStore.provider, walletStore.signer);
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
      service.value = new ERC1155Service(walletStore.provider);
    }
  };

  // Get token price
  const getTokenPrice = async (tokenId: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getTokenPrice(tokenId);
    } catch (err: any) {
      error.value = BlockchainErrorHandler.parseError(err);
      throw err;
    }
  };

  // Get user balance
  const getBalance = async (tokenId: number): Promise<number> => {
    if (!service.value || !walletStore.address) throw new Error('Service or address not available');
    
    try {
      return await service.value.getBalance(walletStore.address, tokenId);
    } catch (err: any) {
      error.value = BlockchainErrorHandler.parseError(err);
      throw err;
    }
  };

  // Get multiple balances
  const getBatchBalance = async (tokenIds: number[]): Promise<number[]> => {
    if (!service.value || !walletStore.address) throw new Error('Service or address not available');
    
    try {
      return await service.value.getBatchBalance(walletStore.address, tokenIds);
    } catch (err: any) {
      error.value = BlockchainErrorHandler.parseError(err);
      throw err;
    }
  };

  // Mint tokens
  const mint = async (tokenId: number, amount: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.publicMint(tokenId, amount);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Mint Successful',
        detail: `Minted ${amount} tokens of ID ${tokenId}`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Mint Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Mint multiple tokens
  const mintBatch = async (tokenIds: number[], amounts: number[]): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.publicMintBatch(tokenIds, amounts);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Batch Mint Successful',
        detail: `Minted ${amounts.length} different tokens`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Batch Mint Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get reward status
  const getRewardStatus = async () => {
    if (!service.value || !walletStore.address) throw new Error('Service or address not available');
    
    try {
      return await service.value.getRewardStatus(walletStore.address);
    } catch (err: any) {
      error.value = BlockchainErrorHandler.parseError(err);
      throw err;
    }
  };

  // Check approval
  const isApproved = async (operator: string): Promise<boolean> => {
    if (!service.value || !walletStore.address) throw new Error('Service or address not available');
    
    try {
      return await service.value.isApprovedForAll(walletStore.address, operator);
    } catch (err: any) {
      error.value = BlockchainErrorHandler.parseError(err);
      throw err;
    }
  };

  // Approve contract
  const approve = async (operator: string, approved: boolean = true): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.setApprovalForAll(operator, approved);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Approval Successful',
        detail: `${approved ? 'Approved' : 'Revoked'} contract access`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Approval Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Event listeners
  const onTransfer = (callback: (operator: string, from: string, to: string, id: bigint, value: bigint) => void) => {
    if (!service.value) throw new Error('Service not initialized');
    service.value.onTransferSingle(callback);
  };

  const onReward = (callback: (recipient: string, tokenId: bigint, totalSpent: bigint) => void) => {
    if (!service.value) throw new Error('Service not initialized');
    service.value.onRewardGiven(callback);
  };

  // Cleanup
  onUnmounted(() => {
    if (service.value) {
      service.value.removeAllListeners();
    }
  });

  return {
    // State
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    service: computed(() => service.value),
    
    // Methods
    initializeService,
    updateService,
    getTokenPrice,
    getBalance,
    getBatchBalance,
    mint,
    mintBatch,
    getRewardStatus,
    isApproved,
    approve,
    onTransfer,
    onReward,
    
    // Clear error
    clearError: () => { error.value = null; }
  };
}
