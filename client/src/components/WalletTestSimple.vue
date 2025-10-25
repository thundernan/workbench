<template>
  <div class="wallet-test-simple">
    <h2>Simple Wallet Test</h2>
    
    <!-- Test Button -->
    <button @click="testClick" class="test-btn">
      Test Button Click
    </button>
    
    <!-- Test Modal -->
    <div v-if="showTestModal" class="test-modal-overlay" @click="showTestModal = false">
      <div class="test-modal" @click.stop>
        <h3>Test Modal</h3>
        <p>Button click worked!</p>
        <button @click="showTestModal = false">Close</button>
      </div>
    </div>
    
    <!-- Wallet Store Info -->
    <div class="store-info">
      <h3>Wallet Store Info:</h3>
      <p>Connected: {{ walletStore.connected }}</p>
      <p class="font-mono text-xs">Short Address: {{ walletStore.shortAddress || 'None' }}</p>
      <p class="font-mono text-xs">Full Address: {{ walletStore.address || 'None' }}</p>
      <p>Available Providers: {{ walletStore.availableProviders.length }}</p>
      <p>Error: {{ walletStore.error || 'None' }}</p>
    </div>
    
    <!-- Actual Wallet Button -->
    <div class="actual-wallet-button">
      <h3>Actual Wallet Button:</h3>
      <WalletConnectButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WalletConnectButton from './WalletConnectButton.vue';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();
const showTestModal = ref(false);

const testClick = () => {
  console.log('Test button clicked!');
  showTestModal.value = true;
};
</script>

<style scoped>
.wallet-test-simple {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 2rem;
}

.test-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.test-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.store-info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.actual-wallet-button {
  border: 2px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
}
</style>
