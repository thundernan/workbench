<template>
  <div class="recipe-book bg-slate-800 rounded-lg p-4 h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <i class="pi pi-book"></i>
        Recipe Book
      </h3>
      <div class="flex items-center gap-2">
        <Tag :value="`${recipesStore.allBlockchainRecipes.length} recipes`" severity="success" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="recipesStore.allBlockchainRecipes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-inbox text-4xl text-slate-500 mb-2"></i>
        <p class="text-slate-400">No recipes available</p>
      </div>
    </div>

    <!-- Recipe List -->
    <template v-else>
      <!-- Search and Filter -->
      <div class="mb-4 space-y-2">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search recipes..."
            class="w-full"
          />
        </IconField>
        <Select
          v-model="selectedCategory"
          :options="categoryOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All Categories"
          class="w-full"
        />
      </div>

      <!-- Recipe List -->
      <div class="recipe-list flex-1 overflow-y-auto space-y-2">
        <div
          v-for="recipe in filteredRecipes"
          :key="recipe._id"
          class="recipe-item bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 transition-colors duration-200"
          :class="{ 'ring-2 ring-emerald-400': selectedRecipe?._id === recipe._id }"
          @click="selectRecipe(recipe)"
        >
          <div class="flex items-center space-x-3">
            <!-- Recipe Icon/Preview -->
            <div class="w-12 h-12 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center">
              <span class="text-2xl">{{ getRecipeIcon(recipe) }}</span>
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="text-white font-medium truncate">{{ recipe.name }}</h4>
              <p class="text-slate-300 text-xs truncate">{{ recipe.description || 'No description' }}</p>
              <div class="flex items-center space-x-2 mt-1">
                <span v-if="recipe.category" class="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {{ recipe.category }}
                </span>
                <span class="text-xs text-slate-400">
                  {{ recipe.ingredients.length }} ingredients
                </span>
                <span v-if="recipe.difficulty" class="text-xs text-slate-400">
                  ⭐ {{ recipe.difficulty }}/10
                </span>
              </div>
            </div>
            
            <button
              @click.stop="emit('autofill', recipe)"
              class="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 flex-shrink-0"
              title="Autofill recipe"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- No results -->
        <div v-if="filteredRecipes.length === 0" class="text-center py-8">
          <i class="pi pi-search text-3xl text-slate-500 mb-2"></i>
          <p class="text-slate-400">No recipes found</p>
        </div>
      </div>

      <!-- Selected Recipe Details -->
      <div v-if="selectedRecipe" class="mt-4 p-3 bg-slate-700 rounded-lg border-t-2 border-emerald-500">
        <div class="flex items-start space-x-3 mb-3">
          <div class="w-12 h-12 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">{{ getRecipeIcon(selectedRecipe) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-white font-medium">{{ selectedRecipe.name }}</h4>
            <p class="text-slate-300 text-sm">{{ selectedRecipe.description || 'No description' }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="selectedRecipe.category" class="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {{ selectedRecipe.category }}
              </span>
              <span v-if="selectedRecipe.difficulty" class="text-xs text-slate-400">
                Difficulty: ⭐ {{ selectedRecipe.difficulty }}/10
              </span>
            </div>
          </div>
        </div>

        <!-- Recipe Grid Preview -->
        <div class="mb-3">
          <h5 class="text-slate-300 text-sm font-medium mb-2">Recipe Pattern:</h5>
          <div class="grid grid-cols-3 gap-1 w-fit">
            <div
              v-for="position in 9"
              :key="position"
              class="w-10 h-10 rounded border border-slate-600 bg-slate-800 flex items-center justify-center text-xs"
              :class="getPositionClass(position - 1)"
            >
              <span v-if="hasIngredientAt(position - 1)" class="text-xl">
                {{ getTokenIcon(getIngredientAtPosition(position - 1)?.tokenId ?? 0) }}
              </span>
              <span v-else class="text-slate-600">-</span>
            </div>
          </div>
        </div>

        <!-- Result Info -->
        <div class="mb-3 p-2 bg-slate-800 rounded border border-emerald-600">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">Crafts:</span>
            <span class="text-emerald-400 font-medium flex items-center gap-1">
              <span class="text-base">{{ getTokenIcon(selectedRecipe.resultTokenId) }}</span>
              {{ selectedRecipe.resultAmount }}x {{ getTokenName(selectedRecipe.resultTokenId) }}
            </span>
          </div>
        </div>

        <!-- Ingredients List -->
        <div class="mb-3">
          <h5 class="text-slate-300 text-sm font-medium mb-2">Required:</h5>
          <div class="space-y-1">
            <div
              v-for="(ingredient, idx) in selectedRecipe.ingredients"
              :key="idx"
              class="flex items-center justify-between text-xs p-2 bg-slate-800 rounded"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">{{ getTokenIcon(ingredient.tokenId) }}</span>
                <span class="text-white">{{ getTokenName(ingredient.tokenId) }}</span>
              </div>
              <span class="text-emerald-400">x{{ ingredient.amount }}</span>
            </div>
          </div>
        </div>

        <!-- Contract Info (collapsible) -->
        <details class="mb-3">
          <summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-300">Contract Details</summary>
          <div class="mt-2 space-y-1 text-xs font-mono">
            <div class="flex justify-between">
              <span class="text-slate-400">Recipe ID:</span>
              <span class="text-slate-300">{{ selectedRecipe.blockchainRecipeId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Result Contract:</span>
              <span class="text-slate-300 truncate ml-2">{{ shortAddress(selectedRecipe.resultTokenContract) }}</span>
            </div>
          </div>
        </details>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            @click="emit('autofill', selectedRecipe)"
            label="Autofill Recipe"
            icon="pi pi-bolt"
            severity="success"
            class="flex-1"
            size="small"
          />
          <Button
            @click="clearSelection"
            label="Close"
            icon="pi pi-times"
            severity="secondary"
            size="small"
            outlined
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import type { BlockchainRecipe } from '@/types';

const recipesStore = useRecipesStore();
const toastStore = useToastStore();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedRecipe = ref<BlockchainRecipe | null>(null);

// Mock token metadata for ingredient names
const tokenMetadata: Record<number, { name: string; icon: string }> = {
  1: { name: 'Wood', icon: '🪵' },
  2: { name: 'Stone', icon: '🪨' },
  3: { name: 'Iron', icon: '⬛' },
  4: { name: 'Diamond', icon: '💎' },
  5: { name: 'Gold', icon: '🪙' },
  10: { name: 'Magic Essence', icon: '✨' },
  15: { name: 'Herbs', icon: '🌿' },
  20: { name: 'Water', icon: '💧' },
  100: { name: 'Stone Pickaxe', icon: '⛏️' },
  101: { name: 'Wooden Sword', icon: '🗡️' }
};

const getTokenName = (tokenId: number): string => {
  return tokenMetadata[tokenId]?.name || `Token #${tokenId}`;
};

const getTokenIcon = (tokenId: number): string => {
  return tokenMetadata[tokenId]?.icon || '❓';
};

const categoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'Weapons', value: 'weapon' },
  { label: 'Tools', value: 'tool' },
  { label: 'Armor', value: 'armor' },
  { label: 'Materials', value: 'material' },
  { label: 'Consumables', value: 'consumable' }
];

const filteredRecipes = computed(() => {
  let recipes = recipesStore.allBlockchainRecipes;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    recipes = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      (recipe.description && recipe.description.toLowerCase().includes(query)) ||
      recipe.blockchainRecipeId.includes(query)
    );
  }

  // Filter by category
  if (selectedCategory.value) {
    recipes = recipes.filter(recipe =>
      recipe.category === selectedCategory.value
    );
  }

  return recipes;
});

const selectRecipe = (recipe: BlockchainRecipe) => {
  selectedRecipe.value = recipe;
};

const clearSelection = () => {
  selectedRecipe.value = null;
};

const getRecipeIcon = (recipe: BlockchainRecipe): string => {
  // Based on category
  switch (recipe.category) {
    case 'weapon': return '⚔️';
    case 'tool': return '⛏️';
    case 'armor': return '🛡️';
    case 'material': return '📦';
    case 'consumable': return '🧪';
    default: return '📋';
  }
};

const hasIngredientAt = (position: number): boolean => {
  return selectedRecipe.value?.ingredients.some(ing => ing.position === position) || false;
};

const getIngredientAtPosition = (position: number) => {
  return selectedRecipe.value?.ingredients.find(ing => ing.position === position);
};

const getPositionClass = (position: number): string => {
  return hasIngredientAt(position) ? 'border-emerald-400 bg-emerald-900/20' : '';
};

const shortAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const emit = defineEmits<{
  autofill: [recipe: BlockchainRecipe];
}>();

// MOCKED: Recipes are already loaded by App.vue on startup
// No need to fetch from server
onMounted(() => {
  console.log(`📚 BlockchainRecipeBook: Using ${recipesStore.allBlockchainRecipes.length} mock recipes`);
});
</script>

<style scoped>
.recipe-list {
  scrollbar-width: thin;
  scrollbar-color: #475569 #1e293b;
}

.recipe-list::-webkit-scrollbar {
  width: 6px;
}

.recipe-list::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.recipe-list::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.recipe-list::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

details summary {
  list-style: none;
}

details summary::-webkit-details-marker {
  display: none;
}
</style>

