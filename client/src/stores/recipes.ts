import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Recipe, Item } from '@/types';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);

  // Sample recipes data
  const initializeRecipes = () => {
    const sampleRecipes: Recipe[] = [
      {
        id: 'wooden_sword',
        name: 'Wooden Sword',
        description: 'A basic wooden sword',
        result: {
          id: 'wooden_sword',
          name: 'Wooden Sword',
          description: 'A basic wooden sword',
          icon: '🗡️',
          rarity: 'common',
          category: 'weapon'
        },
        ingredients: [
          { item: { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, quantity: 3 }
        ],
        grid: [
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null],
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null],
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null]
        ]
      },
      {
        id: 'stone_pickaxe',
        name: 'Stone Pickaxe',
        description: 'A sturdy stone pickaxe',
        result: {
          id: 'stone_pickaxe',
          name: 'Stone Pickaxe',
          description: 'A sturdy stone pickaxe',
          icon: '⛏️',
          rarity: 'uncommon',
          category: 'tool'
        },
        ingredients: [
          { item: { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, quantity: 2 },
          { item: { id: 'stone', name: 'Stone', description: 'Hard material for tools', icon: '🪨', rarity: 'common', category: 'material' }, quantity: 3 }
        ],
        grid: [
          [{ id: 'stone', name: 'Stone', description: 'Hard material for tools', icon: '🪨', rarity: 'common', category: 'material' }, { id: 'stone', name: 'Stone', description: 'Hard material for tools', icon: '🪨', rarity: 'common', category: 'material' }, { id: 'stone', name: 'Stone', description: 'Hard material for tools', icon: '🪨', rarity: 'common', category: 'material' }],
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null],
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null]
        ]
      },
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sharp iron sword',
        result: {
          id: 'iron_sword',
          name: 'Iron Sword',
          description: 'A sharp iron sword',
          icon: '⚔️',
          rarity: 'rare',
          category: 'weapon'
        },
        ingredients: [
          { item: { id: 'iron', name: 'Iron', description: 'Metal for advanced crafting', icon: '⬛', rarity: 'uncommon', category: 'material' }, quantity: 2 },
          { item: { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, quantity: 1 }
        ],
        grid: [
          [null, { id: 'iron', name: 'Iron', description: 'Metal for advanced crafting', icon: '⬛', rarity: 'uncommon', category: 'material' }, null],
          [null, { id: 'iron', name: 'Iron', description: 'Metal for advanced crafting', icon: '⬛', rarity: 'uncommon', category: 'material' }, null],
          [null, { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' }, null]
        ]
      }
    ];

    recipes.value = sampleRecipes;
  };

  // Find recipe by ID
  const getRecipe = (id: string): Recipe | undefined => {
    return recipes.value.find(recipe => recipe.id === id);
  };

  // Match a 3x3 grid to a recipe
  const matchRecipe = (grid: (Item | null)[][]): Recipe | null => {
    for (const recipe of recipes.value) {
      if (gridMatchesRecipe(grid, recipe.grid)) {
        return recipe;
      }
    }
    return null;
  };

  // Helper function to check if grid matches recipe
  const gridMatchesRecipe = (grid: (Item | null)[][], recipeGrid: (Item | null)[][]): boolean => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const gridItem = grid[i][j];
        const recipeItem = recipeGrid[i][j];
        
        if (gridItem === null && recipeItem === null) continue;
        if (gridItem === null || recipeItem === null) return false;
        if (gridItem.id !== recipeItem.id) return false;
      }
    }
    return true;
  };

  // Get all recipes
  const allRecipes = computed(() => recipes.value);

  return {
    recipes,
    initializeRecipes,
    getRecipe,
    matchRecipe,
    allRecipes
  };
});
