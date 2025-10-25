import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import Web3WalletService from '@/services/walletService';

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string | null>(null);
  const connected = ref<boolean>(false);
  const chainId = ref<number | null>(null);
  const provider = ref<any | null>(null);
  const signer = ref<any | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Initialize wallet service
  const walletService = new Web3WalletService();

  // Get available wallet providers
  const availableProviders = computed<WalletProvider[]>(() => {
    return walletService.getAvailableProviders();
  });

  // Get shortened address for display
  const shortAddress = computed(() => {
    if (!address.value) return '';
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`;
  });

  // Connect to a specific wallet
  const connectWallet = async (walletId: string): Promise<string> => {
    try {
      isLoading.value = true;
      error.value = null;

      const connectedAddress = await walletService.connect(walletId);
      
      // Update store state
      address.value = connectedAddress;
      connected.value = true;
      provider.value = walletService.getProvider();
      signer.value = walletService.getSigner();
      
      // Get chain ID
      try {
        chainId.value = await walletService.getChainId();
      } catch (chainError) {
        console.warn('Failed to get chain ID:', chainError);
      }

      return connectedAddress;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Disconnect wallet
  const disconnectWallet = async (): Promise<void> => {
    try {
      await walletService.disconnect();
      
      // Clear store state
      address.value = null;
      connected.value = false;
      chainId.value = null;
      provider.value = null;
      signer.value = null;
      error.value = null;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Switch network
  const switchNetwork = async (newChainId: number): Promise<void> => {
    try {
      await walletService.switchNetwork(newChainId);
      chainId.value = newChainId;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Send transaction
  const sendTransaction = async (request: TransactionRequest): Promise<string> => {
    if (!connected.value) {
      throw new Error('Wallet not connected');
    }

    try {
      isLoading.value = true;
      error.value = null;

      const txHash = await walletService.sendTransaction(request);
      return txHash;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Send crafting transaction
  const sendCraftTx = async (craftingTx: CraftingTransaction): Promise<string> => {
    if (!connected.value) {
      throw new Error('Wallet not connected');
    }

    try {
      isLoading.value = true;
      error.value = null;

      const txHash = await walletService.sendCraftingTransaction(craftingTx);
      return txHash;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Wait for transaction confirmation
  const waitForTransaction = async (txHash: string, confirmations: number = 1): Promise<any> => {
    try {
      return await walletService.waitForTransaction(txHash, confirmations);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Get transaction receipt
  const getTransactionReceipt = async (txHash: string): Promise<any> => {
    try {
      return await walletService.getTransactionReceipt(txHash);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Clear error
  const clearError = (): void => {
    error.value = null;
  };

  // Check if wallet is connected on app start
  const checkConnection = async (): Promise<void> => {
    try {
      if (walletService.isConnected()) {
        const connectedAddress = await walletService.getAddress();
        const connectedChainId = await walletService.getChainId();
        
        address.value = connectedAddress;
        connected.value = true;
        chainId.value = connectedChainId;
        provider.value = walletService.getProvider();
        signer.value = walletService.getSigner();
      }
    } catch (err) {
      console.warn('Failed to check wallet connection:', err);
    }
  };

  return {
    // State
    address,
    connected,
    chainId,
    provider,
    signer,
    isLoading,
    error,
    
    // Computed
    availableProviders,
    shortAddress,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    sendCraftTx,
    waitForTransaction,
    getTransactionReceipt,
    clearError,
    checkConnection
  };
});
