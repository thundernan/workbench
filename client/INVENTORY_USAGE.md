# User Inventory - Client Integration Guide

## Overview

The client now has full integration to fetch user inventory (token balances) from the blockchain via the backend API.

---

## 🎯 Features Implemented

### 1. **API Service Methods**
- ✅ `getUserBalance(address)` - Get token balances (simple)
- ✅ `getUserInventory(address, includeZero)` - Get inventory with metadata
- ✅ `getTokenBalance(address, tokenId)` - Get single token balance

### 2. **Composable Hook**
- ✅ `useInventory()` - Vue composable for inventory management
- ✅ Reactive state management
- ✅ Loading and error states
- ✅ Search and filter helpers
- ✅ Balance checking utilities

### 3. **UI Component**
- ✅ `UserInventory.vue` - Complete inventory display component
- ✅ Grid layout with item cards
- ✅ Search and category filters
- ✅ Auto-load on wallet connect
- ✅ Loading/error/empty states

---

## 📦 Quick Start

### Option 1: Use the Component

```vue
<template>
  <div>
    <UserInventory @connect-wallet="handleConnect" />
  </div>
</template>

<script setup lang="ts">
import UserInventory from '@/components/UserInventory.vue';

const handleConnect = () => {
  // Your wallet connection logic
  console.log('Connect wallet');
};
</script>
```

---

### Option 2: Use the Composable

```vue
<template>
  <div>
    <button @click="loadUserInventory" :disabled="isLoading">
      Load Inventory
    </button>

    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    
    <div v-else>
      <h3>Total Items: {{ totalItems }}</h3>
      
      <div v-for="item in inventory" :key="item.tokenId">
        <h4>{{ item.metadata.name }}</h4>
        <p>Balance: {{ item.balance }}</p>
        <img :src="item.metadata.image" :alt="item.metadata.name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInventory } from '@/composables/useInventory';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();
const {
  inventory,
  isLoading,
  error,
  totalItems,
  fetchInventory,
} = useInventory();

const loadUserInventory = async () => {
  if (walletStore.address) {
    await fetchInventory(walletStore.address);
  }
};
</script>
```

---

### Option 3: Direct API Call

```typescript
import { apiService } from '@/services/apiService';

// Get inventory with metadata
const inventory = await apiService.getUserInventory(walletAddress);
console.log('Inventory:', inventory.inventory);
console.log('Total items:', inventory.totalItems);

// Get simple balances
const balances = await apiService.getUserBalance(walletAddress);
console.log('Balances:', balances.balances);

// Get single token balance
const balance = await apiService.getTokenBalance(walletAddress, 1);
console.log('Token #1 balance:', balance.balance);
```

---

## 🔧 API Reference

### `apiService.getUserInventory(address, includeZero?)`

**Description:** Get user's inventory with full metadata (name, image, description, etc.)

**Parameters:**
- `address` (string) - Wallet address
- `includeZero` (boolean, optional) - Include tokens with zero balance (default: false)

**Returns:**
```typescript
{
  address: string;
  inventory: InventoryItem[];
  totalItems: number;
  allTokensChecked: number;
  contractAddress: string;
}
```

**Example:**
```typescript
const inventory = await apiService.getUserInventory('0x1234...', false);

inventory.inventory.forEach(item => {
  console.log(`${item.metadata.name}: ${item.balance}`);
});
```

---

### `apiService.getUserBalance(address)`

**Description:** Get user's token balances (simple, without metadata)

**Parameters:**
- `address` (string) - Wallet address

**Returns:**
```typescript
{
  address: string;
  balances: UserBalance[];
  totalTokens: number;
  allTokensChecked: number;
  contractAddress: string;
}
```

**Example:**
```typescript
const data = await apiService.getUserBalance('0x1234...');
console.log(`User has ${data.totalTokens} different tokens`);
```

---

### `apiService.getTokenBalance(address, tokenId)`

**Description:** Get balance for a specific token

**Parameters:**
- `address` (string) - Wallet address
- `tokenId` (number) - Token ID

**Returns:**
```typescript
{
  address: string;
  tokenId: number;
  balance: string;
  contractAddress: string;
}
```

**Example:**
```typescript
const balance = await apiService.getTokenBalance('0x1234...', 5);
console.log(`Token #5 balance: ${balance.balance}`);
```

---

## 🎨 Composable API Reference

### `useInventory()`

**State:**
```typescript
{
  inventory: Ref<InventoryItem[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  totalItems: Ref<number>;
  allTokensChecked: Ref<number>;
  contractAddress: Ref<string>;
  lastFetchedAddress: Ref<string | null>;
}
```

**Computed:**
```typescript
{
  isEmpty: ComputedRef<boolean>;
  hasItems: ComputedRef<boolean>;
  categories: ComputedRef<string[]>;
}
```

**Methods:**
```typescript
{
  // Fetch inventory from API
  fetchInventory(address: string, includeZero?: boolean): Promise<void>;
  
  // Refresh last fetched inventory
  refreshInventory(includeZero?: boolean): Promise<void>;
  
  // Clear all inventory data
  clearInventory(): void;
  
  // Get item by token ID
  getItemByTokenId(tokenId: number): InventoryItem | undefined;
  
  // Check if user has enough tokens
  hasEnoughTokens(tokenId: number, requiredAmount: number): boolean;
  
  // Get token balance
  getTokenBalance(tokenId: number): string;
  
  // Filter by category
  filterByCategory(category: string): InventoryItem[];
  
  // Search by name
  searchByName(query: string): InventoryItem[];
}
```

---

## 💡 Usage Examples

### Example 1: Load Inventory on Wallet Connect

```vue
<script setup lang="ts">
import { watch } from 'vue';
import { useInventory } from '@/composables/useInventory';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();
const { fetchInventory } = useInventory();

// Auto-load when wallet connects
watch(() => walletStore.address, async (address) => {
  if (address) {
    await fetchInventory(address);
  }
}, { immediate: true });
</script>
```

---

### Example 2: Check Crafting Requirements

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useInventory } from '@/composables/useInventory';

const { hasEnoughTokens } = useInventory();

// Recipe requires: 10x Wood (token #1), 5x Stone (token #5)
const canCraft = computed(() => {
  return hasEnoughTokens(1, 10) && hasEnoughTokens(5, 5);
});
</script>

<template>
  <button :disabled="!canCraft">
    {{ canCraft ? 'Craft Item' : 'Not Enough Materials' }}
  </button>
</template>
```

---

### Example 3: Display Inventory with Search

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInventory } from '@/composables/useInventory';

const { inventory, searchByName } = useInventory();
const searchQuery = ref('');

const filteredItems = computed(() => {
  return searchQuery.value
    ? searchByName(searchQuery.value)
    : inventory.value;
});
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="Search items..." />
    
    <div v-for="item in filteredItems" :key="item.tokenId">
      {{ item.metadata.name }} - {{ item.balance }}
    </div>
  </div>
</template>
```

---

### Example 4: Category Filter

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useInventory } from '@/composables/useInventory';

const { categories, filterByCategory } = useInventory();
const selectedCategory = ref('');

const categoryItems = computed(() => {
  return selectedCategory.value
    ? filterByCategory(selectedCategory.value)
    : inventory.value;
});
</script>

<template>
  <div>
    <select v-model="selectedCategory">
      <option value="">All Categories</option>
      <option v-for="cat in categories" :key="cat" :value="cat">
        {{ cat }}
      </option>
    </select>
    
    <div v-for="item in categoryItems" :key="item.tokenId">
      {{ item.metadata.name }}
    </div>
  </div>
</template>
```

---

## 🎯 Integration Checklist

- ✅ API service methods added to `apiService.ts`
- ✅ TypeScript interfaces defined (`InventoryItem`, `UserBalance`)
- ✅ Composable created (`useInventory.ts`)
- ✅ UI component created (`UserInventory.vue`)
- ✅ Auto-load on wallet connect
- ✅ Search and filter functionality
- ✅ Loading/error states
- ✅ Refresh capability

---

## 🔄 Workflow

```
1. User connects wallet (MetaMask/WalletConnect)
   ↓
2. Component watches wallet address
   ↓
3. Calls apiService.getUserInventory(address)
   ↓
4. Backend queries blockchain (ERC1155.balanceOfBatch)
   ↓
5. Backend combines with ingredient metadata
   ↓
6. Frontend receives inventory with full data
   ↓
7. Display in UI with images, names, balances
```

---

## 📊 Data Flow

```
Blockchain (ERC1155)
       ↓
Backend API (/api/ingredients/blockchain/user-inventory/:address)
       ↓
API Service (apiService.getUserInventory)
       ↓
Composable (useInventory)
       ↓
Vue Component (UserInventory.vue)
       ↓
User Interface
```

---

## 🚀 Next Steps

1. **Import the component** in your view:
   ```vue
   import UserInventory from '@/components/UserInventory.vue';
   ```

2. **Use it in your template**:
   ```vue
   <UserInventory @connect-wallet="openWalletModal" />
   ```

3. **Or use the composable** for custom UI:
   ```typescript
   const { inventory, fetchInventory } = useInventory();
   ```

---

## 📝 Notes

- Inventory automatically filters out zero balances (configurable)
- Uses efficient `balanceOfBatch()` for single blockchain call
- Fully typed with TypeScript
- Reactive with Vue 3 composition API
- Works with any wallet (MetaMask, WalletConnect, etc.)

---

**Last Updated:** October 25, 2025  
**Status:** ✅ Complete and Ready to Use

