<template>
  <div class="crafting-grid bg-slate-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <i class="pi pi-th-large"></i>
        Crafting Grid
      </h3>
      <Button
        @click="clearGrid"
        label="Clear All"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        text
      />
    </div>

    <!-- 3x3 Crafting Grid -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div
        v-for="(item, index) in grid"
        :key="index"
        class="w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-700 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors duration-200"
        :class="{ 'border-emerald-400': item }"
        @click="removeFromGrid(index)"
      >
        <ItemIcon
          v-if="item"
          :item="item"
          size="lg"
          :show-quantity="false"
          :show-tooltip="true"
        />
        <span v-else class="text-slate-500 text-xs">Empty</span>
      </div>
    </div>

    <!-- Result Panel -->
    <div class="result-panel bg-slate-700 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-white font-medium">Result</h4>
        <div v-if="matchedRecipe" class="text-emerald-400 text-sm">
          ✓ Recipe Match
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center">
          <ItemIcon
            v-if="matchedRecipe"
            :item="matchedRecipe.result"
            size="lg"
            :show-quantity="false"
            :show-tooltip="true"
          />
          <span v-else class="text-slate-500 text-sm">?</span>
        </div>

        <div class="flex-1">
          <div v-if="matchedRecipe" class="text-white font-medium">
            {{ matchedRecipe.result.name }}
          </div>
          <div v-else class="text-slate-400 text-sm">
            No recipe match
          </div>
          <div v-if="matchedRecipe" class="text-slate-300 text-sm mt-1">
            {{ matchedRecipe.result.description }}
          </div>
        </div>
      </div>

      <!-- Wallet Connection Status -->
      <div v-if="matchedRecipe" class="wallet-status mb-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Wallet Status:</span>
          <div class="flex items-center gap-2">
            <i :class="walletStore.connected ? 'pi pi-check-circle text-emerald-500' : 'pi pi-times-circle text-red-500'"></i>
            <span :class="walletStore.connected ? 'text-emerald-400' : 'text-red-500'">
              {{ walletStore.connected ? 'Connected' : 'Not Connected' }}
            </span>
          </div>
        </div>
        <div v-if="walletStore.connected" class="text-xs text-emerald-400 mt-1 font-mono">
          {{ walletStore.shortAddress }}
        </div>
      </div>

      <!-- Craft Button -->
      <Button
        v-if="matchedRecipe && canCraft"
        @click="craftItem"
        :loading="isCrafting"
        :label="isCrafting ? 'Crafting...' : walletStore.connected ? 'Craft & Send TX' : 'Craft Item'"
        :icon="walletStore.connected ? 'pi pi-send' : 'pi pi-hammer'"
        :severity="walletStore.connected ? 'info' : 'success'"
        class="w-full mt-4"
      />

      <Message v-else-if="matchedRecipe && !canCraft" severity="warn" class="mt-4">
        Missing ingredients
      </Message>

      <Message v-else-if="matchedRecipe && !walletStore.connected" severity="info" class="mt-4">
        <div class="flex items-center justify-between">
          <span>Connect wallet to send blockchain transaction</span>
          <Button 
            @click="$emit('connect-wallet')" 
            label="Connect" 
            size="small" 
            severity="secondary"
            text
          />
        </div>
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import ItemIcon from './ItemIcon.vue';
import type { Item } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const walletStore = useWalletStore();
const toastStore = useToastStore();

const grid = ref<(Item | null)[]>(new Array(9).fill(null));
const isCrafting = ref(false);

// Initialize recipes
recipesStore.initializeRecipes();

const matchedRecipe = computed(() => {
  const grid2D = [
    [grid.value[0], grid.value[1], grid.value[2]],
    [grid.value[3], grid.value[4], grid.value[5]],
    [grid.value[6], grid.value[7], grid.value[8]]
  ];
  return recipesStore.matchRecipe(grid2D);
});

const canCraft = computed(() => {
  if (!matchedRecipe.value) return false;
  
  // Check if we have all required ingredients
  return matchedRecipe.value.ingredients.every(ingredient => 
    inventoryStore.hasItem(ingredient.item.id, ingredient.quantity)
  );
});

const removeFromGrid = (index: number) => {
  if (grid.value[index]) {
    // Return item to inventory
    inventoryStore.addItem(grid.value[index]!, 1);
    grid.value[index] = null;
  }
};

const clearGrid = () => {
  // Return all items to inventory
  grid.value.forEach(item => {
    if (item) {
      inventoryStore.addItem(item, 1);
    }
  });
  grid.value = new Array(9).fill(null);
};

const craftItem = async () => {
  if (!matchedRecipe.value || !canCraft.value) {
    toastStore.showToast({
      type: 'warning',
      message: 'Cannot craft: missing ingredients or no recipe match'
    });
    return;
  }

  try {
    isCrafting.value = true;

    // Clear grid first (items already consumed when placed)
    grid.value = new Array(9).fill(null);

    // Add result to inventory
    inventoryStore.addItem(matchedRecipe.value.result, 1);

    // Send mock transaction if wallet connected
    if (walletStore.connected) {
      const txHash = await walletStore.sendCraftTx(matchedRecipe.value.id);
      toastStore.showToast({
        type: 'success',
        message: `Crafted ${matchedRecipe.value.result.name}! TX: ${txHash.slice(0, 10)}...`
      });
    } else {
      toastStore.showToast({
        type: 'success',
        message: `Crafted ${matchedRecipe.value.result.name}!`
      });
    }

  } catch (error) {
    console.error('Crafting failed:', error);
    toastStore.showToast({
      type: 'error',
      message: 'Crafting failed. Please try again.'
    });
  } finally {
    isCrafting.value = false;
  }
};

// Method to add item to grid (called from parent)
const addToGrid = (item: Item) => {
  const emptyIndex = grid.value.findIndex(slot => slot === null);
  if (emptyIndex !== -1 && inventoryStore.hasItem(item.id, 1)) {
    grid.value[emptyIndex] = item;
    inventoryStore.removeItem(item.id, 1);
  }
};

// Define emits
defineEmits(['connect-wallet']);

// Expose method for parent components
defineExpose({
  addToGrid,
  clearGrid
});
</script>
