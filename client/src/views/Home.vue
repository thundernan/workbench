<template>
  <div class="workbench-layout bg-slate-900 min-h-screen flex flex-col text-sm font-mono">
    <!-- Header -->
    <header class="bg-slate-800 border-b-2 border-slate-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="text-emerald-400 font-bold">Workbench</div>
          <div class="flex gap-3 text-xs">
            <button class="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              [Play]
            </button>
            <button class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors">
              [Trade]
            </button>
            <button class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors">
              [Profile]
            </button>
          </div>
        </div>
        <button class="px-4 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs">
          [Connect Wallet]
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-4 p-4 overflow-hidden">
      <!-- Left Panel - Inventory -->
      <div class="w-80 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <div class="px-4 py-2 border-b-2 border-slate-700 text-emerald-400 font-semibold">
          Inventory
        </div>
        <div class="flex-1 p-4 overflow-y-auto">
          <!-- Item Cards -->
          <div class="space-y-2 mb-4">
            <div 
              v-for="invItem in inventoryStore.items" 
              :key="invItem.item.id"
              class="flex items-center gap-3 p-2 border border-slate-600 rounded bg-slate-700 hover:border-emerald-400 transition-colors cursor-pointer"
              @click="selectInventoryItem(invItem.item)"
            >
              <div class="text-2xl">{{ invItem.item.icon }}</div>
              <div class="flex-1 text-xs">
                <div class="text-white">{{ invItem.item.name }}</div>
                <div class="text-slate-400">{{ invItem.item.category }}</div>
              </div>
              <div class="text-emerald-400 font-bold">{{ invItem.quantity }}</div>
            </div>
          </div>

          <!-- Filter/Search Section -->
          <div class="text-slate-500 text-xs border-t border-slate-700 pt-3">
            [item cards with counts & filter/search]
          </div>
          <div class="text-slate-500 text-xs mt-2">
            [quick add / favorite / categories]
          </div>
        </div>
      </div>

      <!-- Center Panel - Crafting -->
      <div class="flex-1 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <div class="px-4 py-2 border-b-2 border-slate-700 text-emerald-400 font-semibold">
          Crafting
        </div>
        <div class="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center">
          <!-- 3x3 Grid -->
          <div class="text-slate-500 text-xs mb-3">→ 3× Grid</div>
          <div class="grid grid-cols-3 gap-2 mb-8">
            <div 
              v-for="(cell, index) in craftingGrid" 
              :key="index"
              class="w-20 h-20 border-2 rounded flex items-center justify-center text-3xl cursor-pointer transition-colors"
              :class="cell ? 'border-emerald-400 bg-slate-700' : 'border-slate-600 bg-slate-900 hover:border-slate-500'"
              @click="removeCraftingCell(index)"
            >
              <span v-if="cell" class="select-none">{{ cell.icon }}</span>
              <span v-else class="text-slate-600 text-sm">[ ]</span>
            </div>
          </div>

          <!-- Result Section -->
          <div class="w-full max-w-md border-2 border-slate-700 rounded-lg bg-slate-900 p-4">
            <div class="text-slate-400 text-xs mb-3">Result: <span class="text-emerald-400">[icon x qty]</span></div>
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 border-2 rounded flex items-center justify-center text-3xl"
                   :class="matchedRecipe ? 'border-emerald-400 bg-slate-700' : 'border-slate-600 bg-slate-800'">
                <span v-if="matchedRecipe" class="select-none">{{ matchedRecipe.result.icon }}</span>
                <span v-else class="text-slate-600">?</span>
              </div>
              <div class="flex-1">
                <div v-if="matchedRecipe" class="text-white text-sm">{{ matchedRecipe.result.name }}</div>
                <div v-else class="text-slate-500 text-xs">No recipe match</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button 
                @click="craftItem"
                :disabled="!canCraft"
                class="flex-1 px-4 py-2 rounded text-xs transition-colors"
                :class="canCraft ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
              >
                [Craft]
              </button>
              <button 
                @click="clearCraftingGrid"
                class="px-4 py-2 rounded border border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-400 transition-colors text-xs"
              >
                [Clear]
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Recipe Book -->
      <div class="w-80 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <div class="px-4 py-2 border-b-2 border-slate-700 text-emerald-400 font-semibold">
          Recipe
        </div>
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="text-slate-500 text-xs mb-3">[recipes]</div>
          
          <!-- Recipe Cards -->
          <div class="space-y-3">
            <div 
              v-for="recipe in recipesStore.allRecipes" 
              :key="recipe.id"
              class="border border-slate-600 rounded bg-slate-700 p-3 hover:border-emerald-400 transition-colors cursor-pointer"
              @click="selectRecipe(recipe)"
            >
              <div class="flex items-center gap-2 mb-2">
                <div class="text-xl">{{ recipe.result.icon }}</div>
                <div class="flex-1 text-xs">
                  <div class="text-white">{{ recipe.name }}</div>
                  <div class="text-slate-400">{{ recipe.ingredients.length }} ingredients</div>
                </div>
                <button 
                  @click.stop="autofillRecipe(recipe)"
                  class="text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Autofill"
                >
                  ⚡
                </button>
              </div>

              <!-- Mini Grid Preview -->
              <div class="grid grid-cols-3 gap-1 mb-2">
                <div 
                  v-for="(cell, idx) in getRecipeGridFlat(recipe)" 
                  :key="idx"
                  class="aspect-square rounded border flex items-center justify-center text-xs"
                  :class="cell ? 'border-slate-500 bg-slate-600' : 'border-slate-700 bg-slate-800'"
                >
                  <span v-if="cell" class="text-sm">{{ cell.icon }}</span>
                  <span v-else class="text-slate-700">-</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="flex gap-2 text-xs">
                <span class="px-2 py-0.5 rounded bg-blue-900 text-blue-300">[preview]</span>
                <span class="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300">[learned]</span>
              </div>
            </div>
          </div>

          <div class="text-slate-500 text-xs mt-4 border-t border-slate-700 pt-3">
            [autofill]
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Notification Bar -->
    <div class="bg-slate-800 border-t-2 border-slate-700 px-4 py-3">
      <div class="text-slate-400 text-xs">
        Notification/Toasts
      </div>
      <div class="flex gap-3 mt-2 text-xs flex-wrap">
        <div 
          v-for="(notification, idx) in notifications" 
          :key="idx"
          class="px-3 py-1 rounded"
          :class="getNotificationClass(notification.type)"
        >
          {{ notification.message }}
        </div>
      </div>
    </div>

    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import type { Item, Recipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();

// Initialize data
inventoryStore.initializeSampleItems();
recipesStore.initializeRecipes();

// Crafting grid state
const craftingGrid = ref<(Item | null)[]>(new Array(9).fill(null));
const selectedRecipe = ref<Recipe | null>(null);

// Notifications
const notifications = ref([
  { type: 'success', message: '"Crafted Pickaxe x1"' },
  { type: 'warning', message: '"Not enough Planks"' },
  { type: 'info', message: '"Listed 4 Sticks for 12 X"' }
]);

// Computed
const matchedRecipe = computed(() => {
  const grid2D = [
    [craftingGrid.value[0], craftingGrid.value[1], craftingGrid.value[2]],
    [craftingGrid.value[3], craftingGrid.value[4], craftingGrid.value[5]],
    [craftingGrid.value[6], craftingGrid.value[7], craftingGrid.value[8]]
  ];
  return recipesStore.matchRecipe(grid2D);
});

const canCraft = computed(() => {
  return matchedRecipe.value !== null;
});

// Methods
const selectInventoryItem = (item: Item) => {
  const emptyIndex = craftingGrid.value.findIndex(slot => slot === null);
  if (emptyIndex !== -1 && inventoryStore.hasItem(item.id, 1)) {
    craftingGrid.value[emptyIndex] = item;
    inventoryStore.removeItem(item.id, 1);
  }
};

const removeCraftingCell = (index: number) => {
  if (craftingGrid.value[index]) {
    inventoryStore.addItem(craftingGrid.value[index]!, 1);
    craftingGrid.value[index] = null;
  }
};

const clearCraftingGrid = () => {
  craftingGrid.value.forEach(item => {
    if (item) {
      inventoryStore.addItem(item, 1);
    }
  });
  craftingGrid.value = new Array(9).fill(null);
};

const craftItem = () => {
  if (!matchedRecipe.value) return;

  // Clear grid
  craftingGrid.value = new Array(9).fill(null);

  // Add result to inventory
  inventoryStore.addItem(matchedRecipe.value.result, 1);

  // Show notification
  toastStore.showToast({
    type: 'success',
    message: `Crafted ${matchedRecipe.value.result.name}!`
  });

  // Add to notification bar
  notifications.value.unshift({
    type: 'success',
    message: `"Crafted ${matchedRecipe.value.result.name} x1"`
  });
  if (notifications.value.length > 5) {
    notifications.value.pop();
  }
};

const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
};

const autofillRecipe = (recipe: Recipe) => {
  clearCraftingGrid();
  
  // Fill grid with recipe pattern
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const item = recipe.grid[i][j];
      if (item && inventoryStore.hasItem(item.id, 1)) {
        craftingGrid.value[i * 3 + j] = item;
        inventoryStore.removeItem(item.id, 1);
      }
    }
  }

  toastStore.showToast({
    type: 'info',
    message: `Autofilled ${recipe.name} recipe`
  });
};

const getRecipeGridFlat = (recipe: Recipe) => {
  const flat: (Item | null)[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      flat.push(recipe.grid[i][j]);
    }
  }
  return flat;
};

const getNotificationClass = (type: string) => {
  switch (type) {
    case 'success': return 'bg-emerald-900 text-emerald-300 border border-emerald-700';
    case 'warning': return 'bg-yellow-900 text-yellow-300 border border-yellow-700';
    case 'info': return 'bg-blue-900 text-blue-300 border border-blue-700';
    case 'error': return 'bg-red-900 text-red-300 border border-red-700';
    default: return 'bg-slate-700 text-slate-300 border border-slate-600';
  }
};
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1e293b;
}

::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>