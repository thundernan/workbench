/**
 * Wallet Store - Status Network Only
 * 
 * This store manages wallet connections and only supports Status Network.
 * Network switching has been removed - the app automatically ensures users
 * are on Status Network when they connect their wallet.
 * 
 * Session persistence: Wallet sessions are stored for 10 minutes after connection.
 */
import { defineStore } from 'pinia';
import { ref, computed, markRaw } from 'vue';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import Web3WalletService from '@/services/walletService';
import { DEFAULT_CHAIN_ID } from '@/config/wallet';

// Session storage constants
const SESSION_STORAGE_KEY = 'wallet_session';
const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface WalletSession {
  walletId: string;
  address: string;
  chainId: number;
  expiresAt: number;
}

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

  // Session management functions
  const saveSession = (walletId: string): void => {
    try {
      const session: WalletSession = {
        walletId,
        address: address.value || '',
        chainId: chainId.value || DEFAULT_CHAIN_ID,
        expiresAt: Date.now() + SESSION_DURATION_MS
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      // Silent fail if localStorage is not available
    }
  };

  const loadSession = (): WalletSession | null => {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionData) return null;

      const session: WalletSession = JSON.parse(sessionData);
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        clearSession();
        return null;
      }

      return session;
    } catch (err) {
      // Clear invalid session data
      clearSession();
      return null;
    }
  };

  const clearSession = (): void => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      // Silent fail
    }
  };

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
        // Try to check if it's Solana RPC error
        if (chainError.message?.includes('Invalid RPC URL') || 
            chainError.message?.includes('solana') ||
            chainError.code === -32603) {
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
      const providerInstance = walletService.getProvider();
      const signerInstance = walletService.getSigner();
      provider.value = providerInstance ? markRaw(providerInstance) : null;
      signer.value = signerInstance ? markRaw(signerInstance) : null;
      
      // Get chain ID and ensure we're on the correct network
      try {
        await ensureCorrectNetwork();
      } catch (networkError: any) {
        // Don't throw - wallet is connected, just not on right network
        // The error will be shown to user
        error.value = networkError.message || 'Failed to switch to Status Network';
      }

      // Save session for auto-reconnect on page reload
      saveSession(walletId);

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

      // Clear saved session
      clearSession();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Note: Network switching has been removed. 
  // The app only supports Status Network and automatically switches to it on connection.

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

  // Check if wallet is connected on app start or restore from session
  const checkConnection = async (): Promise<void> => {
    try {
      // First, try to restore from saved session
      const session = loadSession();
      if (session) {
        try {
          // Attempt to reconnect using saved wallet ID
          await connectWallet(session.walletId);
          return;
        } catch (err) {
          // Session reconnection failed, clear it and continue
          clearSession();
        }
      }

      // If no session or reconnection failed, check if wallet is already connected
      if (walletService.isConnected()) {
        const connectedAddress = await walletService.getAddress();
        
        address.value = connectedAddress;
        connected.value = true;
        const providerInstance = walletService.getProvider();
        const signerInstance = walletService.getSigner();
        provider.value = providerInstance ? markRaw(providerInstance) : null;
        signer.value = signerInstance ? markRaw(signerInstance) : null;
        
        // Ensure we're on the correct network
        try {
          await ensureCorrectNetwork();
        } catch (networkError: any) {
          // Try to get chain ID anyway
          try {
            chainId.value = await walletService.getChainId();
          } catch (chainError) {
            // Silent fail
          }
        }
      }
    } catch (err) {
      // Silent fail
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
    sendTransaction,
    sendCraftTx,
    waitForTransaction,
    getTransactionReceipt,
    clearError,
    checkConnection
  };
});
