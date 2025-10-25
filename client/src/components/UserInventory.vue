<template>
  <div class="user-inventory">
    <!-- Header -->
    <div class="inventory-header">
      <h2>Your Inventory</h2>
      <div v-if="walletStore.isConnected" class="inventory-stats">
        <span class="stat">{{ totalItems }} items</span>
        <span class="stat-secondary">({{ allTokensChecked }} tokens checked)</span>
      </div>
    </div>

    <!-- Wallet Connection Prompt -->
    <div v-if="!walletStore.isConnected" class="connect-prompt">
      <p>Connect your wallet to view your inventory</p>
      <button @click="$emit('connect-wallet')" class="btn-primary">
        Connect Wallet
      </button>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your inventory from blockchain...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadInventory" class="btn-secondary">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <p>Your inventory is empty</p>
      <p class="hint">Mint some tokens or craft items to get started!</p>
    </div>

    <!-- Inventory Grid -->
    <div v-else class="inventory-grid">
      <!-- Search and Filters -->
      <div class="inventory-controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search items..."
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-filter">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
        <button @click="loadInventory" class="btn-refresh" :disabled="isLoading">
          🔄 Refresh
        </button>
      </div>

      <!-- Items Grid -->
      <div class="items-grid">
        <div
          v-for="item in filteredInventory"
          :key="item.tokenId"
          class="inventory-item"
          :title="`Token ID: ${item.tokenId}`"
        >
          <!-- Item Image -->
          <div class="item-image">
            <img
              v-if="item.metadata.image"
              :src="item.metadata.image"
              :alt="item.metadata.name || `Token ${item.tokenId}`"
              @error="handleImageError"
            />
            <div v-else class="item-placeholder">
              {{ item.metadata.name?.charAt(0) || '?' }}
            </div>
          </div>

          <!-- Item Info -->
          <div class="item-info">
            <h3 class="item-name">
              {{ item.metadata.name || `Token #${item.tokenId}` }}
            </h3>
            <p v-if="item.metadata.description" class="item-description">
              {{ item.metadata.description }}
            </p>
            <div class="item-meta">
              <span v-if="item.metadata.category" class="item-category">
                {{ item.metadata.category }}
              </span>
              <span class="item-balance">× {{ item.balance }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Filtered State -->
      <div v-if="filteredInventory.length === 0" class="empty-filtered">
        <p>No items match your search</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useInventory } from '../composables/useInventory';
import { useWalletStore } from '../stores/wallet';

const walletStore = useWalletStore();
const {
  inventory,
  isLoading,
  error,
  totalItems,
  allTokensChecked,
  isEmpty,
  categories,
  fetchInventory,
  searchByName,
  filterByCategory,
} = useInventory();

// Emits
defineEmits(['connect-wallet']);

// Local state
const searchQuery = ref('');
const selectedCategory = ref('');

// Filtered inventory
const filteredInventory = computed(() => {
  let items = inventory.value;

  // Filter by search
  if (searchQuery.value) {
    items = searchByName(searchQuery.value);
  }

  // Filter by category
  if (selectedCategory.value) {
    items = filterByCategory(selectedCategory.value);
  }

  return items;
});

// Load inventory when wallet connects
const loadInventory = async () => {
  if (walletStore.address) {
    await fetchInventory(walletStore.address);
  }
};

// Watch for wallet connection
watch(() => walletStore.address, (newAddress) => {
  if (newAddress) {
    loadInventory();
  }
}, { immediate: true });

// Load on mount if already connected
onMounted(() => {
  if (walletStore.isConnected && walletStore.address) {
    loadInventory();
  }
});

// Handle image load errors
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>

<style scoped>
.user-inventory {
  width: 100%;
  padding: 1.5rem;
  background: #1a1a2e;
  border-radius: 12px;
  color: #e0e0e0;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2d2d44;
}

.inventory-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: #fff;
}

.inventory-stats {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.stat {
  font-size: 1.1rem;
  font-weight: 600;
  color: #4caf50;
}

.stat-secondary {
  font-size: 0.9rem;
  color: #888;
}

/* States */
.connect-prompt,
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-state {
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #2d2d44;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #f44336;
  margin-bottom: 1rem;
}

.hint {
  color: #888;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Controls */
.inventory-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-input,
.category-filter {
  padding: 0.75rem;
  background: #2d2d44;
  border: 1px solid #3d3d54;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.category-filter {
  min-width: 150px;
}

.search-input:focus,
.category-filter:focus {
  outline: none;
  border-color: #4caf50;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-refresh {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #2d2d44;
  color: #e0e0e0;
}

.btn-secondary:hover {
  background: #3d3d54;
}

.btn-refresh {
  background: #2196f3;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #1976d2;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.inventory-item {
  background: #2d2d44;
  border: 2px solid #3d3d54;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.inventory-item:hover {
  border-color: #4caf50;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.item-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-placeholder {
  font-size: 3rem;
  font-weight: bold;
  color: #4caf50;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  margin: 0;
  font-size: 0.85rem;
  color: #aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.item-category {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #3d3d54;
  border-radius: 4px;
  color: #4caf50;
  text-transform: uppercase;
}

.item-balance {
  font-size: 1rem;
  font-weight: 600;
  color: #4caf50;
}

.empty-filtered {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: #888;
}

/* Responsive */
@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .inventory-controls {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>

