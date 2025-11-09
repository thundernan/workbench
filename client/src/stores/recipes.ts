import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { BlockchainRecipe } from '@/types';
import apiService from '@/services/apiService';

export type IIngredient = {
  _id: string;
  tokenContract: string;
  tokenId: string;
  metadata: {
    name: string;
    image: string;
    description: string;
    category: string;
    price: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type IRecipeIngredient = IIngredient & {
  position: number;
  amount: number;
}

 export type IRecipe = {
  _id: string;
  id: string;
  blockchainRecipeId: number;
  outputTokenId: number;
  outputAmount: number;
  requiresExactPattern: boolean;
  active: boolean;
  name: string;
  ingredients: IRecipeIngredient[];
  outputIngredient: IIngredient;
  grid: (IRecipeIngredient | null)[][];
}



export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<IRecipe[]>([]);
  const blockchainRecipes = ref<BlockchainRecipe[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Sample recipes data
  const initializeRecipes = async () => {
    if (recipes.value.length > 0 || isLoadingRecipes) {
      return;
    }

    try {
      await fetchBlockchainRecipes();
    } catch (error) {
      console.error('Failed to initialize recipes:', error);
    }
  };

  // Find recipe by ID
  const getRecipe = (id: string): IRecipe | undefined => {
    return recipes.value.find(recipe => recipe.id === id);
  };
  

  // Match a 3x3 grid to a recipe
  const matchRecipe = (grid: (IIngredient | null)[][]): IRecipe | null => {
    if (!recipes.value || recipes.value.length === 0) {
      return null;
    }
    for (const recipe of recipes.value) {
      if (gridMatchesRecipe(grid, recipe.grid)) {
        return recipe;
      }
    }
    return null;
  };

  // Helper function to check if grid matches recipe
  const gridMatchesRecipe = (grid: (IIngredient | null)[][], recipeGrid: (IIngredient | null)[][]): boolean => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const gridItem = grid[i][j];
        const recipeItem = recipeGrid[i][j];
        if (gridItem === null && recipeItem === null) continue;
        if (gridItem === null || recipeItem === null) return false;
        if (gridItem.tokenId !== recipeItem.tokenId) return false;
      }
    }
    return true;
  };

  // Track loading state to prevent duplicate requests
  let isLoadingRecipes = false;
  let lastRecipeLoadTime = 0;
  const RECIPE_LOAD_DEBOUNCE_MS = 2000; // 2 second debounce

  // Fetch blockchain recipes from server
  const fetchBlockchainRecipes = async (force = false): Promise<void> => {
    // Prevent duplicate concurrent requests
    if (isLoadingRecipes && !force) {
      return;
    }

    // Debounce rapid requests
    const now = Date.now();
    if (!force && now - lastRecipeLoadTime < RECIPE_LOAD_DEBOUNCE_MS) {
      return;
    }

    isLoading.value = true;
    isLoadingRecipes = true;
    error.value = null;
    lastRecipeLoadTime = now;

    try {
      // Fetch all recipes (handles pagination automatically)
      const fetchedRecipes: IRecipe[] = await apiService.getAllRecipes();
      recipes.value = fetchedRecipes.map((recipe) => {
        const gridArray: (IRecipeIngredient | null)[] = [null, null, null, null, null, null, null, null, null];
        recipe.ingredients.forEach((recipeIngredient) => {
          gridArray[recipeIngredient.position] = recipeIngredient;
        });
        const grid: (IRecipeIngredient | null)[][] = [
          [gridArray[0], gridArray[1], gridArray[2]],
          [gridArray[3], gridArray[4], gridArray[5]],
          [gridArray[6], gridArray[7], gridArray[8]]
        ];
        return ({ ...recipe, grid});
      }).filter((recipe) => recipe.active);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch recipes';
      console.error('Error fetching recipes:', err);
      
      // Don't throw if it's a rate limit error - just log it
      if (err.message?.includes('Too many requests') || err.message?.includes('rate limit')) {
        console.warn('Rate limit reached for recipes, will retry later');
        // Set error but don't throw so app can continue
        error.value = 'Rate limit reached. Please wait a moment.';
      } else {
      throw err;
      }
    } finally {
      isLoading.value = false;
      isLoadingRecipes = false;
    }
  };

  // Get recipe by ID
  const getBlockchainRecipe = (recipeId: string): IRecipe | undefined => {
    return recipes.value.find(r => {
      if (r.blockchainRecipeId !== null && r.blockchainRecipeId !== undefined) {
        return String(r.blockchainRecipeId) === recipeId;
      }
      return false;
    });
  };

  // Get recipe by MongoDB ID
  const getBlockchainRecipeById = (id: string): BlockchainRecipe | undefined => {
    return blockchainRecipes.value.find(r => r._id === id || r.id === id);
  };

  // Check if a grid matches any blockchain recipe
  const matchBlockchainRecipe = (gridPositions: Map<number, {
    tokenContract: string;
    tokenId: number;
  }>): BlockchainRecipe | null => {
    for (const recipe of blockchainRecipes.value) {
      if (gridMatchesBlockchainRecipe(gridPositions, recipe)) {
        return recipe;
      }
    }
    return null;
  };

  // Helper to check if grid matches blockchain recipe
  const gridMatchesBlockchainRecipe = (
    gridPositions: Map<number, { tokenContract: string; tokenId: number }>,
    recipe: BlockchainRecipe
  ): boolean => {
    // Validate recipe has ingredients
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return false;
    }
    
    // Count how many ingredients we successfully match
    let matchedCount = 0;
    
    // Check if all ingredients match their positions
    for (const ingredient of recipe.ingredients) {
      // Validate ingredient structure
      if (!ingredient || typeof ingredient.position !== 'number' || ingredient.position < 0 || ingredient.position >= 9) {
        continue; // Skip invalid ingredient
      }
      
      const gridItem = gridPositions.get(ingredient.position);
      
      // Position must have an item
      if (!gridItem) {
        return false;
      }
      
      // Validate tokenContract exists and is a string before calling toLowerCase
      if (!gridItem.tokenContract || typeof gridItem.tokenContract !== 'string') {
        return false;
      }

      // Validate tokenId exists and is a number
      if (typeof gridItem.tokenId !== 'number' || typeof ingredient.tokenId !== 'number') {
        return false;
      }
      
      // Ingredient must include a tokenContract to compare
      if (!ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
        return false;
      }

      // Check if tokenContract and tokenId match (case-insensitive for contract)
      const contractsMatch = gridItem.tokenContract.toLowerCase() === ingredient.tokenContract.toLowerCase();
      const tokenIdsMatch = gridItem.tokenId === ingredient.tokenId;
      
      if (!contractsMatch || !tokenIdsMatch) {
        return false;
      }
      
      matchedCount++;
    }

    // All recipe ingredients must be matched, and no extra items in grid
    // (grid should only contain items at positions specified in recipe)
    if (matchedCount !== recipe.ingredients.length || gridPositions.size !== recipe.ingredients.length) {
      return false;
    }

    return true;
  };

  // Get all recipes
  const allRecipes = computed(() => recipes.value);

  /**
   * Check if user can craft a specific recipe based on their inventory
   * @param recipe - The recipe to check
   * @param userInventory - User's blockchain inventory with tokenId and balance
   * @returns Boolean indicating if all ingredients are available
   */
  const canCraftRecipe = (
    recipe: IRecipe,
    userInventory: Array<{ tokenId: string; balance: string; tokenContract: string }>
  ): boolean => {
    // Validate recipe has ingredients
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return false;
    }

    // Check each ingredient required by the recipe
    for (const ingredient of recipe.ingredients) {
      // Validate ingredient structure
      if (!ingredient || typeof ingredient.tokenId !== 'number') {
        console.warn('Invalid ingredient in recipe:', ingredient);
        return false;
      }

      // Find matching token in user inventory
      const inventoryItem = userInventory.find(item => {
        if (!item || !item.tokenContract || typeof item.tokenContract !== 'string') {
          return false;
        }
        if (!ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
          return false;
        }
        return item.tokenId === ingredient.tokenId && 
               item.tokenContract.toLowerCase() === ingredient.tokenContract.toLowerCase();
      });

      // If not found or insufficient balance, can't craft
      if (!inventoryItem) return false;
      
      const userBalance = parseInt(inventoryItem.balance);
      if (isNaN(userBalance) || userBalance < ingredient.amount) return false;
    }

    return true;
  };

  /**
   * Check if a crafting grid matches any recipe and if user can craft it
   * @param gridPositions - Map of position to token info
   * @param userInventory - User's blockchain inventory
   * @returns Object with matched recipe and craftability info
   */
  const checkCraftingPossibility = (
    gridPositions: Map<number, { tokenContract: string; tokenId: number }>,
    userInventory: Array<{ tokenId: number; balance: string; tokenContract: string }>
  ): { recipe: BlockchainRecipe | null; canCraft: boolean; missingIngredients: Array<{ tokenId: number; required: number; available: number }> } => {
    // Find matching recipe
    const matchedRecipe = matchBlockchainRecipe(gridPositions);
    
    if (!matchedRecipe) {
      return { recipe: null, canCraft: false, missingIngredients: [] };
    }

    // Check if user can craft
    const missingIngredients: Array<{ tokenId: number; required: number; available: number }> = [];
    
    for (const ingredient of matchedRecipe.ingredients) {
      // Validate ingredient structure
      if (!ingredient || typeof ingredient.tokenId !== 'number') {
        console.warn('Invalid ingredient in recipe:', ingredient);
        continue;
      }

      const inventoryItem = userInventory.find(item => {
        if (!item || !item.tokenContract || typeof item.tokenContract !== 'string') {
          return false;
        }
        if (!ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
          return false;
        }
        return item.tokenId === ingredient.tokenId && 
               item.tokenContract.toLowerCase() === ingredient.tokenContract.toLowerCase();
      });
      
      const available = inventoryItem ? parseInt(inventoryItem.balance) : 0;
      const required = ingredient.amount;
      
      if (available < required) {
        missingIngredients.push({
          tokenId: ingredient.tokenId,
          required,
          available
        });
      }
    }

    return {
      recipe: matchedRecipe,
      canCraft: missingIngredients.length === 0,
      missingIngredients
    };
  };

  return {
    // Legacy
    recipes,
    initializeRecipes,
    getRecipe,
    matchRecipe,
    allRecipes,
    
    // Blockchain
    blockchainRecipes,
    isLoading,
    error,
    fetchBlockchainRecipes,
    getBlockchainRecipe,
    getBlockchainRecipeById,
    matchBlockchainRecipe,
    canCraftRecipe,
    checkCraftingPossibility,
  };
});
