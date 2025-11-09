<template>
  <div class="inventory-page bg-slate-900 min-h-screen flex flex-col font-mono text-sm">
    <!-- Header -->
    <AppHeader />

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
              v-for="catalogItem in filteredCatalog"
              :key="catalogItem.key"
              class="bg-slate-800 border-2 rounded-lg p-5 transition-all duration-200"
              :class="hasOwnedItemByKey(catalogItem.key) ? 'border-emerald-400' : 'border-slate-700 opacity-60'"
            >
              <!-- Item Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="w-20 h-20 flex items-center justify-center">
                  <!-- Display image if available, otherwise use icon -->
                  <img
                    v-if="catalogItem.displayImage"
                    :src="catalogItem.displayImage"
                    :alt="catalogItem.displayName"
                    class="w-full h-full object-contain"
                    @error="handleImageError($event, catalogItem.displayIcon)"
                  />
                  <span v-else class="text-6xl">{{ catalogItem.displayIcon }}</span>
                </div>
                <div v-if="hasOwnedItemByKey(catalogItem.key)" class="text-emerald-400 text-xl">✓</div>
                <div v-else class="text-slate-600 text-xl">○</div>
              </div>

              <!-- Item Info -->
              <div class="space-y-2">
                <div class="text-white font-semibold text-lg">{{ catalogItem.displayName }}</div>
                <div class="text-slate-400 text-xs leading-relaxed">{{ catalogItem.displayDescription }}</div>
                
                <!-- Owned Quantity -->
                <div v-if="hasOwnedItemByKey(catalogItem.key)" class="pt-2">
                  <div class="text-emerald-400 font-bold text-lg">
                    Owned: {{ getOwnedQuantityByKey(catalogItem.key) }}
                  </div>
                </div>
                <div v-else class="pt-2">
                  <div class="text-slate-500 text-sm">Not obtained yet</div>
                </div>

                <!-- Tags -->
                <div class="flex gap-2 flex-wrap pt-2">
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="getRarityClass(catalogItem.displayRarity)"
                  >
                    {{ catalogItem.displayRarity }}
                  </span>
                  <span class="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                    {{ catalogItem.displayCategory }}
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
              :key="resource.key"
              class="bg-slate-800 border-2 rounded-lg p-5 hover:border-emerald-400 transition-all duration-200 hover:scale-105"
              :class="getRarityBorderClass(resource.displayRarity)"
            >
              <!-- Item Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="w-20 h-20 flex items-center justify-center">
                  <!-- Display image if available, otherwise use icon -->
                  <img
                    v-if="resource.displayImage"
                    :src="resource.displayImage"
                    :alt="resource.displayName"
                    class="w-full h-full object-contain"
                    @error="handleImageError($event, resource.displayIcon)"
                  />
                  <span v-else class="text-6xl">{{ resource.displayIcon }}</span>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-emerald-400">{{ resource.quantity }}</div>
                  <div class="text-xs text-slate-400">qty</div>
                </div>
              </div>

              <!-- Item Info -->
              <div class="space-y-2">
                <div class="text-white font-semibold text-lg">{{ resource.displayName }}</div>
                <div class="text-slate-400 text-xs leading-relaxed">{{ resource.displayDescription }}</div>
                
                <!-- Tags -->
                <div class="flex gap-2 flex-wrap pt-2">
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="getRarityClass(resource.displayRarity)"
                  >
                    {{ resource.displayRarity }}
                  </span>
                  <span class="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                    {{ resource.displayCategory }}
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
          <!-- RecipeBook Component -->
          <div class="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden" style="min-height: 600px;">
            <RecipeBook @autofill="handleAutofillFromInventory" />
          </div>

          <!-- Old Recipe List (Hidden, keeping for reference) -->
          <div v-if="false && filteredRecipes.length > 0" class="space-y-2">
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
                <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <!-- Display image if available, otherwise use icon -->
                  <img
                    v-if="recipe.result.metadata?.image"
                    :src="recipe.result.metadata.image"
                    :alt="recipe.result.name"
                    class="w-full h-full object-contain"
                    @error="handleImageError($event, getItemIconValue(recipe.result))"
                  />
                  <span v-else class="text-2xl">{{ recipe.result.icon }}</span>
                </div>
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
                        class="aspect-square rounded border flex items-center justify-center text-xs overflow-hidden relative"
                        :class="cell ? 'border-emerald-500/50 bg-slate-700' : 'border-slate-700 bg-slate-900'"
                      >
                        <template v-if="cell">
                          <img
                            v-if="getCellImage(cell)"
                            :src="getCellImage(cell)!"
                            :alt="getCellName(cell)"
                            class="w-full h-full object-contain p-0.5"
                            @error="(e) => cell && handleImageError(e, getCellIcon(cell))"
                          />
                          <span v-else class="text-xs">{{ getCellIcon(cell) }}</span>
                        </template>
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
                        <div class="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          <img
                            v-if="ingredient.item.metadata?.image"
                            :src="ingredient.item.metadata.image"
                            :alt="ingredient.item.name"
                            class="w-full h-full object-contain"
                            @error="handleImageError($event, getItemIconValue(ingredient.item))"
                          />
                          <span v-else class="text-xs">{{ ingredient.item.icon }}</span>
                        </div>
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
import AppHeader from '@/components/AppHeader.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import RecipeBook from '@/components/RecipeBook.vue';
import type { Item, Recipe, BlockchainRecipe } from '@/types';
const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();

const normalizeTokenId = (tokenId: string | number | bigint | undefined): number => {
  if (tokenId === undefined || tokenId === null) return 0;
  if (typeof tokenId === 'number') return tokenId;
  if (typeof tokenId === 'bigint') return Number(tokenId);
  const parsed = Number(tokenId);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createTokenKey = (tokenContract?: string, tokenId?: string | number | bigint): string => {
  const contract = tokenContract ? tokenContract.toLowerCase() : '';
  const id = normalizeTokenId(tokenId);
  return `${contract}::${id}`;
};

interface CatalogDisplayItem {
  key: string;
  displayName: string;
  displayDescription: string;
  displayCategory: string;
  displayRarity: string;
  displayIcon: string;
  displayImage: string | null;
  raw: IIngredient;
}

interface ResourceDisplayItem {
  key: string;
  displayName: string;
  displayDescription: string;
  displayCategory: string;
  displayRarity: string;
  displayIcon: string;
  displayImage: string | null;
  quantity: number;
}

// Tab management
const tabs = ['Catalog', 'Resources', 'Recipes'];
const activeTab = ref(0);

// Stats
const craftedCount = ref(0); // TODO: Track this in a store

// Handle autofill from Recipe Book
const handleAutofillFromInventory = (recipe: Recipe | BlockchainRecipe) => {
  if ('blockchainRecipeId' in recipe) {
    toastStore.showToast({
      type: 'info',
      message: `${recipe.name}: Navigate to Craft page to use this recipe`
    });
  } else {
    toastStore.showToast({
      type: 'info',
      message: `Navigate to Craft page to use recipe: ${recipe.name}`
    });
  }
  // Optionally navigate to craft page
  // router.push('/');
};

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

const inventoryBalanceMap = computed(() => {
  const map = new Map<string, number>();

  inventoryStore.userBalance.forEach((entry: any) => {
    const key = createTokenKey(entry?.tokenContract, entry?.tokenId);
    if (!key) return;
    const balance = Number(entry?.balance ?? 0);
    map.set(key, Number.isFinite(balance) ? balance : 0);
  });

  inventoryStore.items.forEach((entry) => {
    const key = createTokenKey(entry.item.tokenContract, entry.item.tokenId);
    const current = map.get(key) ?? 0;
    map.set(key, current + entry.quantity);
  });

  return map;
});

const getOwnedQuantityByKey = (key: string): number => {
  return inventoryBalanceMap.value.get(key) ?? 0;
};

const hasOwnedItemByKey = (key: string): boolean => {
  return getOwnedQuantityByKey(key) > 0;
};

const catalogItems = computed<CatalogDisplayItem[]>(() => {
  return inventoryStore.allItems.map((item: any) => {
    const metadata = item?.metadata || {};
    const key = createTokenKey(item?.tokenContract, item?.tokenId);
    return {
      key,
      raw: item,
      displayName: item?.name || metadata?.name || `Token #${normalizeTokenId(item?.tokenId)}`,
      displayDescription: item?.description || metadata?.description || 'No description available.',
      displayCategory: item?.category || metadata?.category || 'resource',
      displayRarity: (item?.rarity || metadata?.rarity || 'common') as string,
      displayIcon: item?.icon || metadata?.icon || '📦',
      displayImage: metadata?.image || null
    };
  });
});

const userResources = computed<ResourceDisplayItem[]>(() => {
  return inventoryStore.userBalance
    .filter((entry: any) => Number(entry?.balance ?? 0) > 0)
    .map((entry: any) => {
      const key = createTokenKey(entry?.tokenContract, entry?.tokenId);
      const metadata = entry?.metadata || {};
      const matchingCatalog = catalogItems.value.find((catalogItem) => catalogItem.key === key);
      return {
        key,
        displayName: matchingCatalog?.displayName || metadata?.name || `Token #${normalizeTokenId(entry?.tokenId)}`,
        displayDescription: matchingCatalog?.displayDescription || metadata?.description || 'No description available.',
        displayCategory: matchingCatalog?.displayCategory || metadata?.category || 'resource',
        displayRarity: matchingCatalog?.displayRarity || metadata?.rarity || 'common',
        displayIcon: matchingCatalog?.displayIcon || metadata?.icon || '📦',
        displayImage: matchingCatalog?.displayImage || metadata?.image || null,
        quantity: Number(entry?.balance ?? 0)
      };
    });
});

// Filtered resources
const filteredResources = computed(() => {
  let filtered = [...userResources.value];

  // Search
  if (resourceSearch.value) {
    const query = resourceSearch.value.toLowerCase();
    filtered = filtered.filter(res =>
      res.displayName.toLowerCase().includes(query) ||
      res.displayDescription.toLowerCase().includes(query)
    );
  }

  // Category
  if (resourceCategory.value) {
    filtered = filtered.filter(res => res.displayCategory === resourceCategory.value);
  }

  // Sort
  switch (resourceSort.value) {
    case 'name':
      filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
    case 'quantity-desc':
      filtered.sort((a, b) => b.quantity - a.quantity);
      break;
    case 'quantity-asc':
      filtered.sort((a, b) => a.quantity - b.quantity);
      break;
    case 'rarity':
      const rarityOrder: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
      filtered.sort((a, b) => (rarityOrder[b.displayRarity.toLowerCase?.() || ''] || 0) - (rarityOrder[a.displayRarity.toLowerCase?.() || ''] || 0));
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
  let filtered = [...catalogItems.value];

  if (catalogSearch.value) {
    const query = catalogSearch.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.displayName.toLowerCase().includes(query) ||
      item.displayDescription.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Helper methods
const getRarityBorderClass = (rarity: string) => {
  const value = rarity?.toLowerCase?.() || 'common';
  switch (value) {
    case 'common': return 'border-slate-700';
    case 'uncommon': return 'border-green-700';
    case 'rare': return 'border-blue-700';
    case 'epic': return 'border-purple-700';
    case 'legendary': return 'border-yellow-700';
    default: return 'border-slate-700';
  }
};

const getRarityClass = (rarity: string) => {
  const value = rarity?.toLowerCase?.() || 'common';
  switch (value) {
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

// Helper to safely get cell image
const getCellImage = (cell: Item | null) => {
  return cell?.metadata?.image || null;
};

// Helper to safely get cell name
const getCellName = (cell: Item | null) => {
  return cell?.name || '';
};

// Helper to safely get cell icon
const getCellIcon = (cell: Item | null) => {
  return getItemIconValue(cell);
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

// Handle image loading errors - fallback to icon
const getItemIconValue = (item: Item | IIngredient | null | undefined): string => {
  if (!item) return '📦';
  if ((item as any).icon) return (item as any).icon;
  const metadata = (item as any)?.metadata || {};
  if (metadata?.icon) return metadata.icon;
  return '📦';
};

const handleImageError = (event: Event, fallbackIcon: string) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (!parent) return;
  if (parent.querySelector('.fallback-icon')) return;
  const fallback = document.createElement('span');
  fallback.classList.add('fallback-icon');
  if (parent.classList.contains('w-20')) {
    fallback.classList.add('text-6xl');
  } else if (parent.classList.contains('w-8')) {
    fallback.classList.add('text-2xl');
  } else if (parent.classList.contains('w-4')) {
    fallback.classList.add('text-xs');
  } else {
    fallback.classList.add('text-base');
  }
  fallback.textContent = fallbackIcon || '📦';
  parent.appendChild(fallback);
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

