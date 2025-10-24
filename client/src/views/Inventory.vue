<template>
  <div class="inventory-page bg-slate-900 min-h-screen flex flex-col font-mono text-sm">
    <!-- Header -->
    <header class="bg-slate-800 border-b-2 border-slate-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="text-emerald-400 font-bold">Workbench / Inventory</div>
          <div class="flex gap-3 text-xs">
            <button 
              @click="$router.push('/')"
              class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
            >
              [Craft]
            </button>
            <button 
              @click="$router.push('/trading')"
              class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
            >
              [Trade]
            </button>
            <button class="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              [Inventory]
            </button>
          </div>
        </div>
        <WalletConnectButton />
      </div>
    </header>

    <div class="flex-1 p-6 overflow-auto">
      <div class="max-w-7xl mx-auto">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="text-slate-400 text-xs mb-1">Total Items</div>
            <div class="text-2xl font-bold text-white">{{ inventoryStore.totalItems }}</div>
          </div>
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="text-slate-400 text-xs mb-1">Unique Items</div>
            <div class="text-2xl font-bold text-emerald-400">{{ inventoryStore.uniqueItems }}</div>
          </div>
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="text-slate-400 text-xs mb-1">Recipes Learned</div>
            <div class="text-2xl font-bold text-blue-400">{{ recipesStore.allRecipes.length }}</div>
          </div>
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="text-slate-400 text-xs mb-1">Items Crafted</div>
            <div class="text-2xl font-bold text-purple-400">{{ craftedCount }}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-6 border-b-2 border-slate-700">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            @click="activeTab = index"
            class="px-6 py-3 font-semibold transition-all duration-200"
            :class="activeTab === index 
              ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-0.5' 
              : 'text-slate-400 hover:text-slate-300'"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Catalog Tab -->
        <div v-if="activeTab === 0" class="space-y-6">
          <!-- Search -->
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <input
              v-model="catalogSearch"
              type="text"
              placeholder="🔍 Search all items..."
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <!-- Catalog Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="item in filteredCatalog"
              :key="item.id"
              class="bg-slate-800 border-2 rounded-lg p-5 transition-all duration-200"
              :class="hasItemInInventory(item.id) ? 'border-emerald-400' : 'border-slate-700 opacity-60'"
            >
              <!-- Item Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="text-6xl">{{ item.icon }}</div>
                <div v-if="hasItemInInventory(item.id)" class="text-emerald-400 text-xl">✓</div>
                <div v-else class="text-slate-600 text-xl">○</div>
              </div>

              <!-- Item Info -->
              <div class="space-y-2">
                <div class="text-white font-semibold text-lg">{{ item.name }}</div>
                <div class="text-slate-400 text-xs leading-relaxed">{{ item.description }}</div>
                
                <!-- Owned Quantity -->
                <div v-if="hasItemInInventory(item.id)" class="pt-2">
                  <div class="text-emerald-400 font-bold text-lg">
                    Owned: {{ getItemQuantity(item.id) }}
                  </div>
                </div>
                <div v-else class="pt-2">
                  <div class="text-slate-500 text-sm">Not obtained yet</div>
                </div>

                <!-- Tags -->
                <div class="flex gap-2 flex-wrap pt-2">
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="getRarityClass(item.rarity)"
                  >
                    {{ item.rarity }}
                  </span>
                  <span class="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                    {{ item.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resources Tab -->
        <div v-if="activeTab === 1" class="space-y-6">
          <!-- Search and Filter -->
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                v-model="resourceSearch"
                type="text"
                placeholder="🔍 Search resources..."
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <select
                v-model="resourceCategory"
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="">All Categories</option>
                <option value="material">Materials</option>
                <option value="weapon">Weapons</option>
                <option value="tool">Tools</option>
                <option value="armor">Armor</option>
              </select>
              <select
                v-model="resourceSort"
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity-desc">Quantity: High to Low</option>
                <option value="quantity-asc">Quantity: Low to High</option>
                <option value="rarity">Sort by Rarity</option>
              </select>
            </div>
          </div>

          <!-- Resources Grid -->
          <div v-if="filteredResources.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="resource in filteredResources"
              :key="resource.item.id"
              class="bg-slate-800 border-2 rounded-lg p-5 hover:border-emerald-400 transition-all duration-200 hover:scale-105"
              :class="getRarityBorderClass(resource.item.rarity)"
            >
              <!-- Item Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="text-6xl">{{ resource.item.icon }}</div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-emerald-400">{{ resource.quantity }}</div>
                  <div class="text-xs text-slate-400">qty</div>
                </div>
              </div>

              <!-- Item Info -->
              <div class="space-y-2">
                <div class="text-white font-semibold text-lg">{{ resource.item.name }}</div>
                <div class="text-slate-400 text-xs leading-relaxed">{{ resource.item.description }}</div>
                
                <!-- Tags -->
                <div class="flex gap-2 flex-wrap pt-2">
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="getRarityClass(resource.item.rarity)"
                  >
                    {{ resource.item.rarity }}
                  </span>
                  <span class="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                    {{ resource.item.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-slate-800 border-2 border-slate-700 rounded-lg p-12 text-center">
            <div class="text-slate-400 text-lg mb-2">📦 No resources found</div>
            <div class="text-slate-500 text-sm">Try adjusting your search filters</div>
          </div>
        </div>

        <!-- Recipes Tab -->
        <div v-if="activeTab === 2" class="space-y-6">
          <!-- Search and Filter -->
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                v-model="recipeSearch"
                type="text"
                placeholder="🔍 Search recipes..."
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <select
                v-model="recipeCategory"
                class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="">All Categories</option>
                <option value="material">Materials</option>
                <option value="weapon">Weapons</option>
                <option value="tool">Tools</option>
                <option value="armor">Armor</option>
              </select>
            </div>
          </div>

          <!-- Recipes List -->
          <div v-if="filteredRecipes.length > 0" class="space-y-2">
            <div
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              class="bg-slate-800 border border-slate-700 rounded hover:border-emerald-400 transition-all duration-200 overflow-hidden"
            >
              <!-- Recipe Header (Always Visible) -->
              <div 
                class="flex items-center gap-3 p-3 cursor-pointer"
                @click="toggleRecipeExpanded(recipe)"
              >
                <div class="text-2xl">{{ recipe.result.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-semibold text-sm truncate">{{ recipe.name }}</div>
                  <div class="text-slate-400 text-xs">{{ recipe.ingredients.length }} ingredients</div>
                </div>
                <button
                  v-if="canCraftRecipe(recipe)"
                  @click.stop="$router.push('/')"
                  class="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  ⚡
                </button>
                <!-- Expand/Collapse Icon -->
                <svg 
                  class="w-5 h-5 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedRecipe?.id === recipe.id }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <!-- Recipe Details (Expandable) -->
              <div 
                v-if="expandedRecipe?.id === recipe.id"
                class="border-t border-slate-700 px-3 py-2 animate-slideDown"
              >
                <div class="flex gap-3">
                  <!-- Mini Grid Preview -->
                  <div class="flex-shrink-0">
                    <div class="text-slate-400 text-[10px] mb-1 font-medium">Pattern:</div>
                    <div class="grid grid-cols-3 gap-0.5" style="width: 60px;">
                      <div 
                        v-for="(cell, idx) in getRecipeGridFlat(recipe)" 
                        :key="idx"
                        class="aspect-square rounded border flex items-center justify-center text-xs"
                        :class="cell ? 'border-emerald-500/50 bg-slate-700' : 'border-slate-700 bg-slate-900'"
                      >
                        {{ cell ? cell.icon : '' }}
                      </div>
                    </div>
                  </div>

                  <!-- Ingredients List -->
                  <div class="flex-1 min-w-0">
                    <div class="text-slate-400 text-[10px] mb-1 font-medium">Required:</div>
                    <div class="space-y-0.5">
                      <div 
                        v-for="ingredient in recipe.ingredients" 
                        :key="ingredient.item.id"
                        class="flex items-center gap-1 bg-slate-700 rounded px-1.5 py-0.5"
                      >
                        <span class="text-xs">{{ ingredient.item.icon }}</span>
                        <span class="text-white flex-1 text-[10px] truncate">{{ ingredient.item.name }}</span>
                        <span 
                          class="font-medium text-[10px] whitespace-nowrap"
                          :class="hasEnoughItems(ingredient.item.id, ingredient.quantity) ? 'text-emerald-400' : 'text-red-400'"
                        >
                          {{ getItemQuantity(ingredient.item.id) }}/{{ ingredient.quantity }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-slate-800 border-2 border-slate-700 rounded-lg p-12 text-center">
            <div class="text-slate-400 text-lg mb-2">📜 No recipes found</div>
            <div class="text-slate-500 text-sm">Try adjusting your search filters</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import type { Item, Recipe } from '@/types';

const router = useRouter();
const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();

// Tab management
const tabs = ['Catalog', 'Resources', 'Recipes'];
const activeTab = ref(0);

// Stats
const craftedCount = ref(0); // TODO: Track this in a store

// Resources filters
const resourceSearch = ref('');
const resourceCategory = ref('');
const resourceSort = ref('name');

// Recipes filters
const recipeSearch = ref('');
const recipeCategory = ref('');
const expandedRecipe = ref<Recipe | null>(null);

// Catalog filter
const catalogSearch = ref('');

// Filtered resources
const filteredResources = computed(() => {
  let filtered = [...inventoryStore.items];

  // Search
  if (resourceSearch.value) {
    const query = resourceSearch.value.toLowerCase();
    filtered = filtered.filter(res =>
      res.item.name.toLowerCase().includes(query) ||
      res.item.description.toLowerCase().includes(query)
    );
  }

  // Category
  if (resourceCategory.value) {
    filtered = filtered.filter(res => res.item.category === resourceCategory.value);
  }

  // Sort
  switch (resourceSort.value) {
    case 'name':
      filtered.sort((a, b) => a.item.name.localeCompare(b.item.name));
      break;
    case 'quantity-desc':
      filtered.sort((a, b) => b.quantity - a.quantity);
      break;
    case 'quantity-asc':
      filtered.sort((a, b) => a.quantity - b.quantity);
      break;
    case 'rarity':
      const rarityOrder: { [key: string]: number } = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
      filtered.sort((a, b) => (rarityOrder[b.item.rarity] || 0) - (rarityOrder[a.item.rarity] || 0));
      break;
  }

  return filtered;
});

// Filtered recipes
const filteredRecipes = computed(() => {
  let filtered = [...recipesStore.allRecipes];

  // Search
  if (recipeSearch.value) {
    const query = recipeSearch.value.toLowerCase();
    filtered = filtered.filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query)
    );
  }

  // Category
  if (recipeCategory.value) {
    filtered = filtered.filter(recipe => recipe.result.category === recipeCategory.value);
  }

  return filtered;
});

// Filtered catalog
const filteredCatalog = computed(() => {
  let filtered = [...inventoryStore.allItems];

  if (catalogSearch.value) {
    const query = catalogSearch.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Helper methods
const getRarityBorderClass = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'border-slate-700';
    case 'uncommon': return 'border-green-700';
    case 'rare': return 'border-blue-700';
    case 'epic': return 'border-purple-700';
    case 'legendary': return 'border-yellow-700';
    default: return 'border-slate-700';
  }
};

const getRarityClass = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-slate-700 text-slate-300 border border-slate-600';
    case 'uncommon': return 'bg-green-900/50 text-green-300 border border-green-700';
    case 'rare': return 'bg-blue-900/50 text-blue-300 border border-blue-700';
    case 'epic': return 'bg-purple-900/50 text-purple-300 border border-purple-700';
    case 'legendary': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
    default: return 'bg-slate-700 text-slate-300 border border-slate-600';
  }
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

const canCraftRecipe = (recipe: Recipe) => {
  return recipe.ingredients.every(ingredient =>
    inventoryStore.hasItem(ingredient.item.id, ingredient.quantity)
  );
};

const hasEnoughItems = (itemId: string, quantity: number) => {
  return inventoryStore.hasItem(itemId, quantity);
};

const getItemQuantity = (itemId: string) => {
  return inventoryStore.getItemQuantity(itemId);
};

const hasItemInInventory = (itemId: string) => {
  return inventoryStore.hasItem(itemId, 1);
};

const toggleRecipeExpanded = (recipe: Recipe) => {
  if (expandedRecipe.value?.id === recipe.id) {
    expandedRecipe.value = null;
  } else {
    expandedRecipe.value = recipe;
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

/* Slide down animation for recipe details */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 120px;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
</style>

