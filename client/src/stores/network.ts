import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NetworkType = 'xsolla' | 'status';

export const useNetworkStore = defineStore('network', () => {
  const selectedNetwork = ref<NetworkType>('xsolla');

  const setNetwork = (network: NetworkType) => {
    selectedNetwork.value = network;
    localStorage.setItem('selectedNetwork', network);
    console.log('🌐 Network changed to:', network);
  };

  // Load from localStorage on init
  const initNetwork = () => {
    const saved = localStorage.getItem('selectedNetwork') as NetworkType;
    if (saved === 'xsolla' || saved === 'status') {
      selectedNetwork.value = saved;
      console.log('🌐 Loaded network from storage:', saved);
    }
  };

  return {
    selectedNetwork,
    setNetwork,
    initNetwork
  };
});

