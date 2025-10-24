<template>
  <div class="workbench-page bg-slate-900 min-h-screen">
    <!-- Mobile Navigation -->
    <div class="lg:hidden bg-slate-800 border-b border-slate-700">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-xl font-bold text-white">Workbench</h1>
        <WalletConnectButton />
      </div>
      <div class="flex space-x-1 px-4 pb-4">
        <button
          v-for="tab in mobileTabs"
          :key="tab.id"
          @click="activeMobileTab = tab.id"
          class="flex-1 px-3 py-2 rounded-lg font-medium transition-colors duration-200"
          :class="activeMobileTab === tab.id 
            ? 'bg-emerald-600 text-white' 
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div class="hidden lg:block">
      <div class="flex h-screen">
        <!-- Left Sidebar - Inventory -->
        <div class="w-80 bg-slate-800 border-r border-slate-700 p-4">
          <InventoryPanel />
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <div class="bg-slate-800 border-b border-slate-700 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-white">Workbench</h1>
                <p class="text-slate-400">Craft items and manage your inventory</p>
              </div>
              <WalletConnectButton />
            </div>
          </div>

          <!-- Main Grid -->
          <div class="flex-1 grid grid-cols-2 gap-4 p-4">
            <!-- Crafting Grid -->
            <div class="bg-slate-800 rounded-lg">
              <CraftingGrid ref="craftingGridRef" />
            </div>

            <!-- Recipe Book -->
            <div class="bg-slate-800 rounded-lg">
              <RecipeBook @autofill="handleAutofill" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden">
      <!-- Inventory Tab -->
      <div v-if="activeMobileTab === 'inventory'" class="p-4">
        <InventoryPanel />
      </div>

      <!-- Crafting Tab -->
      <div v-if="activeMobileTab === 'crafting'" class="p-4">
        <CraftingGrid ref="craftingGridRef" />
      </div>

      <!-- Recipes Tab -->
      <div v-if="activeMobileTab === 'recipes'" class="p-4">
        <RecipeBook @autofill="handleAutofill" />
      </div>
    </div>

    <!-- Toast Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <Toast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :toast="toast"
        @close="toastStore.removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '@/stores/toast';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import InventoryPanel from '@/components/InventoryPanel.vue';
import CraftingGrid from '@/components/CraftingGrid.vue';
import RecipeBook from '@/components/RecipeBook.vue';
import Toast from '@/components/Toast.vue';
import type { Recipe } from '@/types';

const toastStore = useToastStore();
const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();

// Mobile navigation
const mobileTabs = [
  { id: 'inventory', name: 'Inventory' },
  { id: 'crafting', name: 'Crafting' },
  { id: 'recipes', name: 'Recipes' }
];
const activeMobileTab = ref('inventory');

// Refs
const craftingGridRef = ref<InstanceType<typeof CraftingGrid> | null>(null);

// Handle recipe autofill
const handleAutofill = (recipe: Recipe) => {
  if (craftingGridRef.value) {
    // Clear current grid first
    craftingGridRef.value.clearGrid();
    
    // Add ingredients to grid
    recipe.ingredients.forEach(ingredient => {
      for (let i = 0; i < ingredient.quantity; i++) {
        craftingGridRef.value?.addToGrid(ingredient.item);
      }
    });
  }
};
</script>
