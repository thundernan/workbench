<template>
  <div class="crafting-grid bg-slate-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Crafting Grid</h3>
      <button
        @click="clearGrid"
        class="text-slate-400 hover:text-white text-sm transition-colors duration-200"
      >
        Clear All
      </button>
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

      <!-- Craft Button -->
      <button
        v-if="matchedRecipe && canCraft"
        @click="craftItem"
        :disabled="isCrafting"
        class="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        <svg
          v-if="isCrafting"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ isCrafting ? 'Crafting...' : 'Craft Item' }}
      </button>

      <div v-else-if="matchedRecipe && !canCraft" class="mt-4 text-center">
        <div class="text-slate-400 text-sm">
          Missing ingredients
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
  if (!matchedRecipe.value || !canCraft.value || !walletStore.connected) {
    return;
  }

  try {
    isCrafting.value = true;

    // Remove ingredients from inventory
    matchedRecipe.value.ingredients.forEach(ingredient => {
      inventoryStore.removeItem(ingredient.item.id, ingredient.quantity);
    });

    // Add result to inventory
    inventoryStore.addItem(matchedRecipe.value.result, 1);

    // Send mock transaction
    const txHash = await walletStore.sendCraftTx(matchedRecipe.value.id);

    toastStore.showToast({
      type: 'success',
      message: `Crafted ${matchedRecipe.value.result.name}! TX: ${txHash.slice(0, 10)}...`
    });

    // Clear grid after successful craft
    clearGrid();

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

// Expose method for parent components
defineExpose({
  addToGrid
});
</script>
