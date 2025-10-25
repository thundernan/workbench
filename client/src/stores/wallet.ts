import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import Web3WalletService from '@/services/walletService';

// LocalStorage keys
const STORAGE_KEY_WALLET_ID = 'workbench_connected_wallet';
const STORAGE_KEY_WALLET_ADDRESS = 'workbench_wallet_address';

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string | null>(null);
  const connected = ref<boolean>(false);
  const chainId = ref<number | null>(null);
  const provider = ref<any | null>(null);
  const signer = ref<any | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastConnectedWallet = ref<string | null>(null);

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
      lastConnectedWallet.value = walletId;
      
      // Get chain ID
      try {
        chainId.value = await walletService.getChainId();
      } catch (chainError) {
        console.warn('Failed to get chain ID:', chainError);
      }

      // Save to localStorage for auto-reconnect
      localStorage.setItem(STORAGE_KEY_WALLET_ID, walletId);
      localStorage.setItem(STORAGE_KEY_WALLET_ADDRESS, connectedAddress);

      // Setup event listeners for account/chain changes
      setupWalletListeners();

      return connectedAddress;
    } catch (err: any) {
      error.value = err.message;
      // Clear localStorage on error
      localStorage.removeItem(STORAGE_KEY_WALLET_ID);
      localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);
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
      lastConnectedWallet.value = null;

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY_WALLET_ID);
      localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);

      // Remove event listeners
      removeWalletListeners();
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

  // Setup wallet event listeners
  const setupWalletListeners = () => {
    if (!window.ethereum) return;

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    // Listen for chain changes
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Listen for disconnect
    window.ethereum.on('disconnect', handleDisconnect);
  };

  // Remove wallet event listeners
  const removeWalletListeners = () => {
    if (!window.ethereum) return;

    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    window.ethereum.removeListener('disconnect', handleDisconnect);
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    console.log('👛 Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected their wallet
      await disconnectWallet();
    } else if (accounts[0] !== address.value) {
      // User switched to a different account
      address.value = accounts[0];
      localStorage.setItem(STORAGE_KEY_WALLET_ADDRESS, accounts[0]);
      
      // Update signer
      try {
        if (provider.value) {
          signer.value = await provider.value.getSigner();
        }
      } catch (err) {
        console.error('Failed to update signer:', err);
      }
    }
  };

  // Handle chain changes
  const handleChainChanged = (newChainId: string) => {
    console.log('🔗 Chain changed:', newChainId);
    // Reload page on chain change (recommended by MetaMask)
    window.location.reload();
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    console.log('🔌 Wallet disconnected');
    await disconnectWallet();
  };

  // Check if wallet is connected on app start
  const checkConnection = async (): Promise<void> => {
    try {
      // Check localStorage for previously connected wallet
      const savedWalletId = localStorage.getItem(STORAGE_KEY_WALLET_ID);
      const savedAddress = localStorage.getItem(STORAGE_KEY_WALLET_ADDRESS);

      if (!savedWalletId || !savedAddress) {
        console.log('ℹ️ No saved wallet connection found');
        return;
      }

      console.log('🔄 Attempting to reconnect to:', savedWalletId);

      // Try to reconnect silently
      try {
        // Check if wallet is still available
        if (!window.ethereum) {
          console.warn('⚠️ No wallet provider found');
          localStorage.removeItem(STORAGE_KEY_WALLET_ID);
          localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);
          return;
        }

        // For MetaMask/Trust, check if accounts are accessible
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });

        if (accounts.length === 0) {
          console.log('ℹ️ No accounts accessible, user needs to reconnect');
          localStorage.removeItem(STORAGE_KEY_WALLET_ID);
          localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);
          return;
        }

        // Reconnect silently
        await connectWallet(savedWalletId);
        console.log('✅ Successfully reconnected to wallet');

      } catch (reconnectError) {
        console.warn('⚠️ Failed to reconnect:', reconnectError);
        // Clear saved data if reconnection fails
        localStorage.removeItem(STORAGE_KEY_WALLET_ID);
        localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);
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
    lastConnectedWallet,
    
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
    checkConnection,
    setupWalletListeners,
    removeWalletListeners
  };
});
