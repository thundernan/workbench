import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WalletState } from '@/types';

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string | null>(null);
  const connected = ref<boolean>(false);
  const chainId = ref<number | null>(null);

  // Mock wallet connection
  const connectWallet = async (): Promise<string> => {
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock address generation
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    address.value = mockAddress;
    connected.value = true;
    chainId.value = 1; // Ethereum mainnet
    
    return mockAddress;
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    address.value = null;
    connected.value = false;
    chainId.value = null;
  };

  // Get shortened address for display
  const shortAddress = computed(() => {
    if (!address.value) return '';
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`;
  });

  // Mock transaction sending
  const sendTransaction = async (to: string, data: string): Promise<string> => {
    if (!connected.value) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    return txHash;
  };

  // Mock craft transaction
  const sendCraftTx = async (recipeId: string): Promise<string> => {
    if (!connected.value) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate craft transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    return txHash;
  };

  return {
    address,
    connected,
    chainId,
    connectWallet,
    disconnectWallet,
    shortAddress,
    sendTransaction,
    sendCraftTx
  };
});
