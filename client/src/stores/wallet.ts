import { defineStore } from 'pinia';
import { ref, computed, markRaw } from 'vue';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import Web3WalletService from '@/services/walletService';
import { DEFAULT_CHAIN_ID } from '@/config/wallet';

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

  // Ensure wallet is on the correct network (Status Network)
  const ensureCorrectNetwork = async (): Promise<void> => {
    try {
      // First check if we can get chain ID - this will fail if Trust Wallet is on Solana
      let currentChainId: number;
      try {
        currentChainId = await walletService.getChainId();
      } catch (chainError: any) {
        // If getting chain ID fails, it might be Solana
        console.warn('Failed to get chain ID, might be Solana network:', chainError);
        
        // Try to check if it's Solana RPC error
        if (chainError.message?.includes('Invalid RPC URL') || 
            chainError.message?.includes('solana') ||
            chainError.code === -32603) {
          console.log('⚠️ Detected Solana network, attempting to switch to Status Network...');
          
          // Try to switch network directly
          try {
            await walletService.switchNetwork(DEFAULT_CHAIN_ID);
            chainId.value = DEFAULT_CHAIN_ID;
            return;
          } catch (switchError: any) {
            // If switch fails, try to add the network
            if (switchError.message?.includes('4902') || switchError.message?.includes('not added')) {
              try {
                await walletService.addNetwork(DEFAULT_CHAIN_ID);
                chainId.value = DEFAULT_CHAIN_ID;
                console.log(`✅ Successfully added and switched to Status Network`);
                return;
              } catch (addError: any) {
                throw new Error(
                  'Trust Wallet is configured for Solana network. ' +
                  'Please manually switch to Ethereum/Status Network in your Trust Wallet settings. ' +
                  `Chain ID: ${DEFAULT_CHAIN_ID}`
                );
              }
            }
            throw switchError;
          }
        }
        throw chainError;
      }
      
      // Check if we're on the correct network
      if (currentChainId !== DEFAULT_CHAIN_ID) {
        console.log(`⚠️ Wallet is on chain ${currentChainId}, switching to Status Network (${DEFAULT_CHAIN_ID})...`);
        
        try {
          await walletService.switchNetwork(DEFAULT_CHAIN_ID);
          chainId.value = DEFAULT_CHAIN_ID;
        } catch (switchError: any) {
          console.error('Failed to switch network:', switchError);
          // If switch fails, try to add the network
          if (switchError.message?.includes('4902') || switchError.message?.includes('not added')) {
            try {
              await walletService.addNetwork(DEFAULT_CHAIN_ID);
              chainId.value = DEFAULT_CHAIN_ID;
            } catch (addError: any) {
              console.error('Failed to add network:', addError);
              throw new Error(`Please manually switch to Status Network in your wallet. Chain ID: ${DEFAULT_CHAIN_ID}`);
            }
          } else {
            throw switchError;
          }
        }
      } else {
        chainId.value = currentChainId;
      }
    } catch (err: any) {
      console.error('Failed to ensure correct network:', err);
      throw err;
    }
  };

  // Connect to a specific wallet
  const connectWallet = async (walletId: string): Promise<string> => {
    try {
      isLoading.value = true;
      error.value = null;

      const connectedAddress = await walletService.connect(walletId);
      
      // Update store state
      address.value = connectedAddress;
      connected.value = true;
      provider.value = markRaw(walletService.getProvider());
      signer.value = markRaw(walletService.getSigner());
      
      // Get chain ID and ensure we're on the correct network
      try {
        await ensureCorrectNetwork();
      } catch (networkError: any) {
        console.warn('Failed to ensure correct network:', networkError);
        // Don't throw - wallet is connected, just not on right network
        // The error will be shown to user
        error.value = networkError.message || 'Failed to switch to Status Network';
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
        
        address.value = connectedAddress;
        connected.value = true;
        provider.value = markRaw(walletService.getProvider());
        signer.value = markRaw(walletService.getSigner());
        
        // Ensure we're on the correct network
        try {
          await ensureCorrectNetwork();
        } catch (networkError: any) {
          console.warn('Failed to ensure correct network on check:', networkError);
          // Try to get chain ID anyway
          try {
            chainId.value = await walletService.getChainId();
          } catch (chainError) {
            console.warn('Failed to get chain ID:', chainError);
          }
        }
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
