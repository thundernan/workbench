<template>
  <div class="recipe-book bg-slate-800 rounded-lg p-4 h-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <i class="pi pi-book"></i>
        Recipe Book
      </h3>
      <Tag :value="`${recipesStore.allRecipes.length} recipes`" severity="success" />
    </div>

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
    <div class="recipe-list max-h-96 overflow-y-auto space-y-2">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-item bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 transition-colors duration-200"
        :class="{ 'ring-2 ring-emerald-400': selectedRecipe?.id === recipe.id }"
        @click="selectRecipe(recipe)"
      >
        <div class="flex items-center space-x-3">
          <ItemIcon :item="recipe.result" size="sm" />
          <div class="flex-1">
            <h4 class="text-white font-medium">{{ recipe.name }}</h4>
            <p class="text-slate-300 text-sm">{{ recipe.result.description }}</p>
            <div class="flex items-center space-x-2 mt-1">
              <span class="text-xs px-2 py-1 rounded-full" :class="getRarityClasses(recipe.result.rarity)">
                {{ recipe.result.rarity }}
              </span>
              <span class="text-xs text-slate-400">
                {{ recipe.ingredients.length }} ingredients
              </span>
            </div>
          </div>
          <button
            @click.stop="autofillRecipe(recipe)"
            class="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
            title="Autofill recipe"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Recipe Details -->
    <div v-if="selectedRecipe" class="mt-4 p-3 bg-slate-700 rounded-lg">
      <div class="flex items-center space-x-3 mb-3">
        <ItemIcon :item="selectedRecipe.result" size="md" />
        <div>
          <h4 class="text-white font-medium">{{ selectedRecipe.name }}</h4>
          <p class="text-slate-300 text-sm">{{ selectedRecipe.description }}</p>
        </div>
      </div>

      <!-- Recipe Grid Preview -->
      <div class="mb-3">
        <h5 class="text-slate-300 text-sm font-medium mb-2">Recipe Pattern:</h5>
        <div class="grid grid-cols-3 gap-1 w-fit">
          <div
            v-for="(item, index) in getRecipeGrid(selectedRecipe)"
            :key="index"
            class="w-8 h-8 rounded border border-slate-600 bg-slate-800 flex items-center justify-center"
          >
            <ItemIcon
              v-if="item"
              :item="item"
              size="sm"
              :show-quantity="false"
              :show-tooltip="false"
            />
            <span v-else class="text-slate-500 text-xs">-</span>
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      <div>
        <h5 class="text-slate-300 text-sm font-medium mb-2">Ingredients:</h5>
        <div class="space-y-1">
          <div
            v-for="ingredient in selectedRecipe.ingredients"
            :key="ingredient.item.id"
            class="flex items-center space-x-2"
          >
            <ItemIcon :item="ingredient.item" size="sm" />
            <span class="text-white text-sm">{{ ingredient.item.name }}</span>
            <span class="text-slate-400 text-sm">x{{ ingredient.quantity }}</span>
            <span
              v-if="!inventoryStore.hasItem(ingredient.item.id, ingredient.quantity)"
              class="text-red-400 text-xs"
            >
              (Missing)
            </span>
          </div>
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <Button
          @click="autofillRecipe(selectedRecipe)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useRecipesStore } from '@/stores/recipes';
import { useInventoryStore } from '@/stores/inventory';
import { useToastStore } from '@/stores/toast';
import ItemIcon from './ItemIcon.vue';
import type { Recipe } from '@/types';

const recipesStore = useRecipesStore();
const inventoryStore = useInventoryStore();
const toastStore = useToastStore();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedRecipe = ref<Recipe | null>(null);

const categoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'Weapons', value: 'weapon' },
  { label: 'Tools', value: 'tool' },
  { label: 'Armor', value: 'armor' },
  { label: 'Materials', value: 'material' },
  { label: 'Consumables', value: 'consumable' }
];

const filteredRecipes = computed(() => {
  let recipes = recipesStore.allRecipes;

  // Filter by search query
  if (searchQuery.value) {
    recipes = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      recipe.result.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Filter by category
  if (selectedCategory.value) {
    recipes = recipes.filter(recipe =>
      recipe.result.category === selectedCategory.value
    );
  }

  return recipes;
});

const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
};

const clearSelection = () => {
  selectedRecipe.value = null;
};

const getRecipeGrid = (recipe: Recipe) => {
  const flatGrid: (any | null)[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      flatGrid.push(recipe.grid[i][j]);
    }
  }
  return flatGrid;
};

const getRarityClasses = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-slate-500 text-white';
    case 'uncommon': return 'bg-emerald-500 text-white';
    case 'rare': return 'bg-blue-500 text-white';
    case 'epic': return 'bg-purple-500 text-white';
    case 'legendary': return 'bg-yellow-500 text-black';
    default: return 'bg-slate-500 text-white';
  }
};

const autofillRecipe = (recipe: Recipe) => {
  // This will be handled by the parent component
  emit('autofill', recipe);
  toastStore.showToast({
    type: 'info',
    message: `Autofilled ${recipe.name} recipe`
  });
};

const emit = defineEmits<{
  autofill: [recipe: Recipe];
}>();
</script>
