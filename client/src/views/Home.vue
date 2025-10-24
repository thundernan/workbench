<template>
  <div class="home bg-slate-900 min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-white">Workbench</h1>
          <div class="flex gap-2">
            <Button 
              label="Play" 
              icon="pi pi-play" 
              severity="success" 
              size="small"
              @click="$router.push('/workbench')"
            />
            <Button 
              label="Trade" 
              icon="pi pi-shopping-cart" 
              severity="info" 
              size="small" 
              outlined
              @click="$router.push('/trading')"
            />
            <Button 
              label="Profile" 
              icon="pi pi-user" 
              severity="secondary" 
              size="small" 
              outlined
            />
          </div>
        </div>
        <WalletConnectButton />
      </div>
    </header>

    <!-- Main Content - Desktop Layout -->
    <div class="flex-1 flex p-4 gap-4">
      <!-- Left Panel - Inventory -->
      <div class="w-80 flex flex-col gap-4">
        <Card class="flex-1">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-briefcase"></i>
              Inventory
            </div>
          </template>
          <template #content>
            <div class="space-y-2">
              <div 
                v-for="invItem in inventoryStore.items" 
                :key="invItem.item.id"
                class="flex items-center gap-3 p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <div class="text-3xl">{{ invItem.item.icon }}</div>
                <div class="flex-1">
                  <div class="text-white font-medium text-sm">{{ invItem.item.name }}</div>
                  <div class="text-slate-400 text-xs">{{ invItem.item.category }}</div>
                </div>
                <Tag :value="invItem.quantity" severity="info" />
              </div>
              
              <div v-if="inventoryStore.items.length === 0" class="text-center py-8 text-slate-400">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>No items</p>
              </div>
            </div>
            
            <Divider />
            
            <div class="flex gap-2">
              <Button 
                label="Quick Add" 
                icon="pi pi-plus" 
                size="small" 
                outlined 
                class="flex-1"
              />
              <Button 
                label="Favorite" 
                icon="pi pi-star" 
                size="small" 
                outlined 
                class="flex-1"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Center Panel - Crafting -->
      <div class="flex-1 flex flex-col gap-4">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-th-large"></i>
              Crafting
            </div>
          </template>
          <template #content>
            <!-- 3x3 Grid -->
            <div class="grid grid-cols-3 gap-3 mb-6 max-w-xs mx-auto">
              <div 
                v-for="n in 9" 
                :key="n"
                class="aspect-square rounded-lg border-2 border-slate-600 bg-slate-700 flex items-center justify-center text-4xl hover:border-emerald-400 transition-colors cursor-pointer"
              >
                <span class="text-slate-500">[ ]</span>
              </div>
            </div>

            <!-- Result -->
            <Card class="bg-slate-700 border-slate-600">
              <template #title>
                <div class="text-base">Result:</div>
              </template>
              <template #content>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center text-3xl">
                    <span class="text-slate-500">?</span>
                  </div>
                  <div class="flex-1 text-slate-400 text-sm">
                    [icon x qty]
                  </div>
                </div>
                
                <div class="flex gap-2 mt-4">
                  <Button 
                    label="Craft" 
                    icon="pi pi-hammer" 
                    severity="success" 
                    class="flex-1"
                  />
                  <Button 
                    label="Clear" 
                    icon="pi pi-times" 
                    severity="danger" 
                    outlined
                  />
                </div>
              </template>
            </Card>
          </template>
        </Card>
      </div>

      <!-- Right Panel - Recipe Book -->
      <div class="w-80 flex flex-col gap-4">
        <Card class="flex-1">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-book"></i>
              Recipe
            </div>
          </template>
          <template #content>
            <div class="space-y-2 mb-4">
              <div 
                v-for="recipe in recipesStore.allRecipes" 
                :key="recipe.id"
                class="p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <div class="text-2xl">{{ recipe.result.icon }}</div>
                  <div class="flex-1">
                    <div class="text-white font-medium text-sm">{{ recipe.name }}</div>
                    <div class="text-slate-400 text-xs">{{ recipe.ingredients.length }} ingredients</div>
                  </div>
                  <Button 
                    icon="pi pi-bolt" 
                    size="small" 
                    text 
                    rounded 
                    severity="success"
                    v-tooltip.left="'Autofill'"
                  />
                </div>

                <!-- Preview Grid -->
                <div class="grid grid-cols-3 gap-1 mt-2">
                  <div 
                    v-for="(cell, idx) in getRecipeGridFlat(recipe)" 
                    :key="idx"
                    class="aspect-square rounded border border-slate-600 bg-slate-800 flex items-center justify-center text-xs"
                  >
                    <span v-if="cell">{{ cell.icon }}</span>
                    <span v-else class="text-slate-600">-</span>
                  </div>
                </div>

                <!-- Learned Badge -->
                <div class="flex gap-2 mt-2">
                  <Tag value="preview" severity="info" class="text-xs" />
                  <Tag value="learned" severity="success" class="text-xs" />
                </div>
        </div>
        </div>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- Bottom - Notifications/Toasts -->
    <div class="px-6 py-3 bg-slate-800 border-t border-slate-700">
      <div class="flex items-center gap-3 text-sm">
        <Tag value="Crafted Pickaxe x1" severity="success" />
        <Tag value="Not enough Planks" severity="warn" />
        <Tag value="Listed 4 Sticks for 12 X" severity="info" />
      </div>
    </div>

    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import type { Recipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();

// Initialize data
inventoryStore.initializeSampleItems();
recipesStore.initializeRecipes();

const getRecipeGridFlat = (recipe: Recipe) => {
  const flat: any[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      flat.push(recipe.grid[i][j]);
    }
  }
  return flat;
};
</script>

<style scoped>
/* Custom scrollbar for better look */
:deep(.p-card-content) {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

:deep(.p-card-content)::-webkit-scrollbar {
  width: 6px;
}

:deep(.p-card-content)::-webkit-scrollbar-track {
  background: #1e293b;
}

:deep(.p-card-content)::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

:deep(.p-card-content)::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>