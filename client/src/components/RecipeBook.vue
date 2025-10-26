<template>
  <div class="recipe-book h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 flex-shrink-0">
      <span class="text-emerald-400 font-semibold text-sm">Recipe</span>
      <div class="flex items-center gap-2">
        <button
          v-if="recipesStore.error"
          @click="loadRecipes"
          class="text-yellow-400 hover:text-yellow-300 text-xs"
          title="Retry"
        >
          🔄
        </button>
        <span v-if="!recipesStore.isLoading" class="text-slate-400 text-xs">
          {{ recipesStore.allBlockchainRecipes.length }}
        </span>
        <span v-else class="text-slate-400 text-xs animate-pulse">
          ...
        </span>
    </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Loading Skeleton -->
      <div v-if="recipesStore.isLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="skeleton-card animate-pulse">
          <div class="flex items-center space-x-2 p-2">
            <div class="w-8 h-8 bg-slate-700 rounded"></div>
            <div class="flex-1 space-y-1">
              <div class="h-3 bg-slate-700 rounded w-3/4"></div>
              <div class="h-2 bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="recipesStore.error" class="text-center py-8">
        <div class="text-red-400 text-2xl mb-2">⚠️</div>
        <p class="text-red-400 text-xs mb-2">{{ recipesStore.error }}</p>
        <button @click="loadRecipes" class="text-emerald-400 hover:text-emerald-300 text-xs">
          [Retry]
        </button>
    </div>

      <!-- Empty State -->
      <div v-else-if="recipesStore.allBlockchainRecipes.length === 0" class="text-center py-8">
        <div class="text-slate-500 text-2xl mb-2">📋</div>
        <p class="text-slate-400 text-xs">No recipes yet</p>
        <p class="text-slate-500 text-xs mt-1">Syncing from blockchain...</p>
      </div>

      <!-- Recipe List (if loaded) -->
      <template v-else>
        <!-- Search hint -->
        <div class="text-slate-500 text-xs mb-3">[recipes]</div>

        <!-- Recipe Cards -->
        <div class="space-y-3">
          <div
            v-for="recipe in displayRecipes"
            :key="recipe.id || recipe._id || recipe.blockchainRecipeId"
            class="border border-slate-600 rounded bg-slate-700 hover:border-emerald-400 transition-all duration-200"
            :class="{ 'border-emerald-400': expandedRecipe && (expandedRecipe._id === recipe._id) }"
          >
              <!-- Recipe Header (Always Visible) -->
              <div
                class="flex items-center gap-3 p-3 cursor-pointer"
                @click="toggleRecipe(recipe)"
              >
                <!-- Output ingredient image or fallback icon -->
                <div class="w-8 h-8 flex-shrink-0 relative">
                  <img
                    v-if="getRecipeIcon(recipe).startsWith('http')"
                    :src="getRecipeIcon(recipe)"
                    :alt="recipe.outputIngredient?.metadata?.name || recipe.name || 'Recipe item'"
                    class="w-full h-full object-cover rounded"
                    @error="handleImageError"
                  />
                  <div v-else class="text-2xl">{{ getRecipeIcon(recipe) }}</div>
                  <!-- Craftability indicator -->
                  <div
                    v-if="props.userInventory && props.userInventory.length > 0"
                    class="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-700"
                    :class="isRecipeCraftable(recipe) ? 'bg-emerald-500' : 'bg-red-500'"
                    :title="isRecipeCraftable(recipe) ? 'Can craft' : 'Missing ingredients'"
                  ></div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white text-sm font-medium truncate">{{ recipe.name }}</div>
                  <div class="text-slate-400 text-xs">{{ recipe.ingredients.length }} ingredients</div>
                </div>
                <button
                  @click.stop="emit('autofill', recipe)"
                  class="text-emerald-400 hover:text-emerald-300 transition-colors text-lg flex-shrink-0"
                  title="Autofill"
                >
                  ⚡
                </button>
              <!-- Expand/Collapse Icon -->
              <svg 
                class="w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0"
                :class="{ 'rotate-180': expandedRecipe && expandedRecipe._id === recipe._id }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <!-- Recipe Details (Expandable) -->
            <div 
              v-if="expandedRecipe && expandedRecipe._id === recipe._id"
              class="border-t border-slate-600 p-3 animate-slideDown"
            >
              <div class="flex gap-3">
                <!-- Mini Grid Preview -->
                <div class="flex-shrink-0">
                  <div class="text-slate-400 text-[10px] mb-1 font-medium">Pattern:</div>
                  <div class="grid grid-cols-3 gap-0.5" style="width: 60px;">
                    <div 
                      v-for="(cell, idx) in getRecipeGrid(recipe)" 
                      :key="idx"
                      class="aspect-square rounded border flex items-center justify-center text-xs"
                      :class="cell ? 'border-emerald-500/50 bg-slate-700' : 'border-slate-700 bg-slate-900'"
                    >
                      <img 
                        v-if="cell && cell.metadata?.image" 
                        :src="cell.metadata.image"
                        :alt="cell.metadata.name || 'Ingredient'"
                        class="w-full h-full object-cover rounded"
                        @error="handleImageError"
                      />
                      <span v-else-if="cell">{{ getIngredientIcon(cell) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Ingredients List -->
                <div class="flex-1 min-w-0">
                  <div class="text-slate-400 text-[10px] mb-1 font-medium">Required:</div>
                  <div class="space-y-0.5">
                    <div 
                      v-for="ingredient in recipe.ingredients" 
                      :key="`${ingredient.tokenContract}-${ingredient.tokenId}`"
                      class="flex items-center gap-1 bg-slate-700 rounded px-1.5 py-0.5"
                    >
                      <!-- Ingredient image or fallback icon -->
                      <div class="w-4 h-4 flex-shrink-0">
                        <img 
                          v-if="ingredient.metadata?.image" 
                          :src="ingredient.metadata.image"
                          :alt="ingredient.metadata.name || 'Ingredient'"
                          class="w-full h-full object-cover rounded"
                          @error="handleImageError"
                        />
                        <span v-else class="text-xs">{{ getIngredientIcon(ingredient) }}</span>
                      </div>
                      <span class="text-white flex-1 text-[10px] truncate">
                        {{ getIngredientName(ingredient) }}
                      </span>
                      <span class="text-emerald-400 font-medium text-[10px] whitespace-nowrap">
                        × {{ ingredient.amount }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tags -->
              <div class="flex gap-2 text-xs flex-wrap mt-2">
                <span v-if="recipe.category" class="px-2 py-1 rounded bg-blue-900/50 text-blue-300 border border-blue-700">
                  [{{ recipe.category }}]
                </span>
                <span class="px-2 py-1 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                  [blockchain]
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No results -->
        <div v-if="displayRecipes.length === 0" class="text-center py-8">
          <div class="text-slate-500 text-2xl mb-2">🔍</div>
          <p class="text-slate-400 text-xs">No recipes found</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * RecipeBook Component
 * 
 * Displays blockchain-synced recipes with crafting possibility checking.
 * 
 * Usage Example:
 * ```vue
 * <RecipeBook :userInventory="inventory" @autofill="handleAutofill" />
 * ```
 * 
 * The component will:
 * 1. Display all recipes from the blockchain
 * 2. Show a green/red indicator for each recipe based on whether the user has enough ingredients
 * 3. Allow users to expand recipes to see required ingredients and their pattern
 * 
 * For checking crafting possibility in a crafting grid:
 * ```typescript
 * import { useRecipesStore } from '@/stores/recipes';
 * 
 * const recipesStore = useRecipesStore();
 * 
 * // Create a map of grid positions (0-8) to tokens
 * const gridPositions = new Map<number, { tokenContract: string; tokenId: number }>();
 * gridPositions.set(0, { tokenContract: '0x...', tokenId: 1 });
 * gridPositions.set(4, { tokenContract: '0x...', tokenId: 2 });
 * 
 * // Check if the grid matches any recipe and if user can craft it
 * const result = recipesStore.checkCraftingPossibility(gridPositions, userInventory);
 * 
 * if (result.recipe && result.canCraft) {
 *   console.log('Can craft:', result.recipe.name);
 * } else if (result.recipe && !result.canCraft) {
 *   console.log('Recipe matched but missing ingredients:', result.missingIngredients);
 * } else {
 *   console.log('No recipe matched');
 * }
 * ```
 */
import { ref, computed, onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import type { BlockchainRecipe, BlockchainRecipeIngredient } from '@/types';

// Props
const props = defineProps<{
  userInventory?: Array<{ tokenId: number; balance: string; tokenContract: string }>;
}>();

const recipesStore = useRecipesStore();
const toastStore = useToastStore();

const expandedRecipe = ref<BlockchainRecipe | null>(null);

/**
 * Check if a recipe can be crafted with user's inventory
 */
const isRecipeCraftable = (recipe: BlockchainRecipe): boolean => {
  if (!props.userInventory || props.userInventory.length === 0) {
    return false;
  }
  return recipesStore.canCraftRecipe(recipe, props.userInventory);
};

// Display blockchain recipes
const displayRecipes = computed(() => {
  return recipesStore.allBlockchainRecipes;
});

// Load recipes function
const loadRecipes = async () => {
  try {
    await recipesStore.fetchBlockchainRecipes();
    toastStore.showToast({
      type: 'success',
      message: `Loaded ${recipesStore.allBlockchainRecipes.length} recipes`
    });
  } catch (error: any) {
    toastStore.showToast({
      type: 'error',
      message: `Failed to load recipes: ${error.message}`
    });
  }
};

// Load on mount if not already loaded
onMounted(() => {
  if (recipesStore.allBlockchainRecipes.length === 0 && 
      !recipesStore.isLoading && 
      !recipesStore.error) {
    console.log('📚 RecipeBook: Loading recipes...');
    loadRecipes();
  }
});

// Toggle recipe expansion
const toggleRecipe = (recipe: BlockchainRecipe) => {
  if (expandedRecipe.value && expandedRecipe.value._id === recipe._id) {
    expandedRecipe.value = null;
  } else {
    expandedRecipe.value = recipe;
  }
};

// Get recipe grid with ingredients in their positions (0-8 for 3x3)
const getRecipeGrid = (recipe: BlockchainRecipe): (BlockchainRecipeIngredient | null)[] => {
  const grid: (BlockchainRecipeIngredient | null)[] = new Array(9).fill(null);
  recipe.ingredients.forEach(ingredient => {
    if (ingredient.position >= 0 && ingredient.position < 9) {
      grid[ingredient.position - 1] = ingredient;
    }
  });
  return grid;
};

// Get recipe icon - return outputIngredient.metadata.image if available, otherwise fallback to category-based icon
const getRecipeIcon = (recipe: BlockchainRecipe): string => {
  // First try to use outputIngredient.metadata.image
  if (recipe?.outputIngredient?.metadata?.image) {
    return recipe.outputIngredient.metadata.image;
  }
  
  // Fallback to category-based icons
  if (!recipe.category) return '📋';
  
  switch (recipe.category.toLowerCase()) {
    case 'weapon': return '⚔️';
    case 'tool': return '⛏️';
    case 'armor': return '🛡️';
    case 'material': return '📦';
    case 'consumable': return '🧪';
    default: return '📋';
  }
};

// Get ingredient name from metadata or fallback to tokenId
const getIngredientName = (ingredient: BlockchainRecipeIngredient): string => {
  // Check if ingredient has metadata with name
  if (ingredient.metadata && ingredient.metadata.name) {
    return ingredient.metadata.name;
  }
  
  // Fallback to tokenId if no metadata
  return `Token #${ingredient.tokenId}`;
};

// Get icon for ingredient (using metadata category or tokenId as fallback)
const getIngredientIcon = (ingredient: BlockchainRecipeIngredient): string => {
  // Use category-based icons if metadata is available
  if (ingredient.metadata && ingredient.metadata.category) {
    switch (ingredient.metadata.category.toLowerCase()) {
      case 'magic': return '✨';
      case 'material': return '📦';
      case 'tool': return '⛏️';
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '🧪';
      case 'company': return '🏢';
      case 'meme': return '😄';
      default: break;
    }
  }
  
  // Fallback to generic icons based on tokenId
  const icons = ['🔹', '🔸', '⬜', '⬛', '🟦', '🟧', '🟩', '🟥', '🟪', '🟨'];
  return icons[ingredient.tokenId % icons.length];
};

// Handle image loading errors by replacing with fallback icon
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img) {
    // Replace the image with a fallback icon
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<span class="text-xs">🔹</span>';
    }
  }
};

const emit = defineEmits<{
  autofill: [recipe: BlockchainRecipe];
}>();
</script>

<style scoped>
.skeleton-card {
  background: #334155;
  border-radius: 0.375rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
</style>
