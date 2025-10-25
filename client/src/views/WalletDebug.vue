<template>
  <div class="wallet-debug">
    <h1>Wallet Connection Debug</h1>
    
    <!-- Simple Test Component -->
    <WalletTestSimple />
    
    <!-- Debug Info -->
    <div class="debug-info">
      <h3>Debug Information:</h3>
      <p><strong>Window.ethereum:</strong> {{ hasEthereum ? 'Available' : 'Not Available' }}</p>
      <p><strong>Available Providers:</strong> {{ availableProviders.length }}</p>
      <p><strong>Connected:</strong> {{ walletStore.connected ? 'Yes' : 'No' }}</p>
      <p><strong>Address:</strong> {{ walletStore.address || 'None' }}</p>
      <p><strong>Error:</strong> {{ walletStore.error || 'None' }}</p>
    </div>

    <!-- Simple Connect Button -->
    <div class="simple-connect">
      <button 
        @click="testConnect"
        :disabled="!hasEthereum"
        class="connect-btn"
      >
        {{ hasEthereum ? 'Test Connect to MetaMask' : 'MetaMask Not Available' }}
      </button>
    </div>

    <!-- Available Providers List -->
    <div class="providers-list">
      <h3>Available Providers:</h3>
      <ul>
        <li v-for="provider in availableProviders" :key="provider.id">
          {{ provider.name }} - {{ provider.installed ? 'Installed' : 'Not Installed' }}
        </li>
      </ul>
    </div>

    <!-- Console Logs -->
    <div class="console-logs">
      <h3>Console Logs:</h3>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import WalletTestSimple from '@/components/WalletTestSimple.vue';

const walletStore = useWalletStore();
const logs = ref<string[]>([]);

const hasEthereum = computed(() => {
  return typeof window !== 'undefined' && !!window.ethereum;
});

const availableProviders = computed(() => {
  return walletStore.availableProviders;
});

const addLog = (message: string) => {
  logs.value.push(`${new Date().toLocaleTimeString()}: ${message}`);
  console.log(message);
};

const testConnect = async () => {
  try {
    addLog('Starting wallet connection test...');
    
    if (!window.ethereum) {
      addLog('ERROR: window.ethereum not available');
      return;
    }

    addLog('Requesting accounts...');
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    addLog(`Accounts received: ${accounts.length}`);
    
    if (accounts.length > 0) {
      addLog(`Connected to: ${accounts[0]}`);
      
      // Try to connect through the store
      await walletStore.connectWallet('metamask');
      addLog('Successfully connected through store');
    }
  } catch (error: any) {
    addLog(`ERROR: ${error.message}`);
    console.error('Connection error:', error);
  }
};

onMounted(() => {
  addLog('Component mounted');
  addLog(`window.ethereum available: ${hasEthereum.value}`);
  addLog(`Available providers: ${availableProviders.value.length}`);
  
  // Check for existing connection
  walletStore.checkConnection().then(() => {
    addLog('Checked existing connection');
  });
});
</script>

<style scoped>
.wallet-debug {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.debug-info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.simple-connect {
  margin-bottom: 2rem;
}

.connect-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.connect-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.providers-list {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.providers-list ul {
  list-style: none;
  padding: 0;
}

.providers-list li {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.console-logs {
  background: #1e1e1e;
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #333;
}
</style>
