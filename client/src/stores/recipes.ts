import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Recipe, Item, BlockchainRecipe, BlockchainRecipeIngredient } from '@/types';
import apiService from '@/services/apiService';
import { CONTRACTS } from '@/config/wallet';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);
  const blockchainRecipes = ref<BlockchainRecipe[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Helper to create Item with metadata
  const createItem = (id: string, name: string, description: string, icon: string, rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', category: 'material' | 'tool' | 'weapon' | 'armor' | 'consumable', metadata?: { name?: string; image?: string; description?: string; price?: number }): Item => {
    return {
      id,
      name,
      description,
      icon,
      metadata: {
        name: metadata?.name || name,
        image: metadata?.image || '',
        price: metadata?.price || 0
      },
      rarity,
      category
    };
  };

  // Convert BlockchainRecipeIngredient to Item
  const convertBlockchainIngredientToItem = (ingredient: BlockchainRecipeIngredient): Item => {
    const metadata = ingredient.metadata || {};
    const tokenId = ingredient.tokenId;
    const tokenContract = ingredient.tokenContract;
    
    // Validate tokenContract
    if (!tokenContract || typeof tokenContract !== 'string') {
      console.error('Invalid tokenContract in ingredient:', ingredient);
      throw new Error(`Invalid tokenContract for tokenId ${tokenId}`);
    }
    
    // Get icon from metadata or use default based on category
    // Note: metadata.icon might not exist in the type, but could be in the actual data
    const metadataAny = metadata as any;
    let icon = metadataAny?.icon || '📦';
    if (!metadataAny?.icon) {
      const categoryIcons: Record<string, string> = {
        material: '🪵',
        tool: '⛏️',
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        rare: '💎',
        common: '📦'
      };
      icon = categoryIcons[metadata.category as string] || '📦';
    }

    const fullMetadata = {
      name: metadata.name || `Token ${tokenId}`,
      image: metadata.image || '',
      description: metadata.description || 'An ingredient from the blockchain',
      price: metadataAny?.price || 0
    };

    return {
      id: `token_${tokenId}_${tokenContract.toLowerCase().slice(0, 8)}`,
      name: metadata.name || `Token ${tokenId}`,
      description: metadata.description || 'An ingredient from the blockchain',
      icon: icon,
      metadata: fullMetadata,
      rarity: (metadataAny?.rarity || 'common') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
      category: (metadata.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable',
      // Store tokenContract and tokenId for blockchain recipe matching
      tokenContract: tokenContract,
      tokenId: tokenId
    } as Item & { tokenContract: string; tokenId: number };
  };

  // Convert BlockchainRecipe to Recipe format
  const convertBlockchainRecipeToRecipe = (blockchainRecipe: BlockchainRecipe): Recipe => {
    // Validate required fields
    if (!blockchainRecipe.resultTokenContract || typeof blockchainRecipe.resultTokenContract !== 'string') {
      console.error('Invalid resultTokenContract in recipe:', blockchainRecipe);
      throw new Error(`Invalid resultTokenContract for recipe ${blockchainRecipe.blockchainRecipeId || blockchainRecipe._id}`);
    }
    
    if (typeof blockchainRecipe.resultTokenId !== 'number') {
      console.error('Invalid resultTokenId in recipe:', blockchainRecipe);
      throw new Error(`Invalid resultTokenId for recipe ${blockchainRecipe.blockchainRecipeId || blockchainRecipe._id}`);
    }
    
    // Convert result to Item
    const resultMetadata = blockchainRecipe.outputIngredient?.metadata || {};
    const resultMetadataAny = resultMetadata as any;
    const resultItem = createItem(
      `token_${blockchainRecipe.resultTokenId}_${blockchainRecipe.resultTokenContract.toLowerCase().slice(0, 8)}`,
      blockchainRecipe.name || resultMetadata.name || `Token ${blockchainRecipe.resultTokenId}`,
      blockchainRecipe.description || resultMetadata.description || 'Crafted item',
      resultMetadataAny?.icon || '📦',
      (resultMetadataAny?.rarity || 'common') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
      (resultMetadata.category || blockchainRecipe.category || 'material') as 'material' | 'tool' | 'weapon' | 'armor' | 'consumable',
      {
        name: blockchainRecipe.name || resultMetadata.name || `Token ${blockchainRecipe.resultTokenId}`,
        image: resultMetadata.image || '',
        description: blockchainRecipe.description || resultMetadata.description || 'Crafted item',
        price: resultMetadataAny?.price || 0
      }
    );

    // Convert ingredients to Item format
    const ingredients = blockchainRecipe.ingredients.map(ing => ({
      item: convertBlockchainIngredientToItem(ing),
      quantity: ing.amount
    }));

    // Build 3x3 grid from ingredient positions (0-8 for 3x3 grid)
    const grid: (Item | null)[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];

    // Fill grid based on ingredient positions
    for (const ingredient of blockchainRecipe.ingredients) {
      const position = ingredient.position;
      if (position >= 0 && position < 9) {
        const row = Math.floor(position / 3);
        const col = position % 3;
        const item = convertBlockchainIngredientToItem(ingredient);
        // Place the item at the position (may have multiple of the same item at different positions)
        grid[row][col] = item;
      }
    }

    return {
      id: blockchainRecipe.blockchainRecipeId || blockchainRecipe._id || blockchainRecipe.id || `recipe_${blockchainRecipe.resultTokenId}`,
      name: blockchainRecipe.name || `Recipe ${blockchainRecipe.resultTokenId}`,
      description: blockchainRecipe.description || 'A crafting recipe',
      result: resultItem,
      ingredients: ingredients,
      grid: grid
    };
  };

  // Sample recipes data
  const initializeRecipes = () => {
    recipes.value = [];
  };

  // Find recipe by ID
  const getRecipe = (id: string): Recipe | undefined => {
    return recipes.value.find(recipe => recipe.id === id);
  };
  

  // Match a 3x3 grid to a recipe
  const matchRecipe = (grid: (Item | null)[][]): Recipe | null => {
    console.log('🔍 matchRecipe called with grid:', grid);
    console.log('🔍 matchRecipe - recipes.value:', recipes.value);
    console.log('🔍 matchRecipe - recipes.value.length:', recipes.value.length);
    
    if (!recipes.value || recipes.value.length === 0) {
      console.log('⚠️ matchRecipe - No recipes available');
      return null;
    }
    
    for (const recipe of recipes.value) {
      console.log('🔍 matchRecipe - Checking recipe:', recipe.id, recipe.name);
      if (gridMatchesRecipe(grid, recipe.grid)) {
        console.log('✅ matchRecipe - Found match:', recipe.name);
        return recipe;
      }
    }
    
    console.log('❌ matchRecipe - No match found');
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

  // Track loading state to prevent duplicate requests
  let isLoadingRecipes = false;
  let lastRecipeLoadTime = 0;
  const RECIPE_LOAD_DEBOUNCE_MS = 2000; // 2 second debounce

  // Fetch blockchain recipes from server
  const fetchBlockchainRecipes = async (force = false): Promise<void> => {
    // Prevent duplicate concurrent requests
    if (isLoadingRecipes && !force) {
      console.log('📚 Recipes: Already loading, skipping duplicate request');
      return;
    }

    // Debounce rapid requests
    const now = Date.now();
    if (!force && now - lastRecipeLoadTime < RECIPE_LOAD_DEBOUNCE_MS) {
      console.log('📚 Recipes: Request debounced, too soon after last request');
      return;
    }

    isLoading.value = true;
    isLoadingRecipes = true;
    error.value = null;
    lastRecipeLoadTime = now;

    try {
      // Fetch all recipes (handles pagination automatically)
      const fetchedRecipes = await apiService.getAllRecipes();
      
      // Transform API recipes to BlockchainRecipe format
      // Note: API may not include tokenContract in ingredients, so we add it if missing
      blockchainRecipes.value = fetchedRecipes.map(recipe => ({
        _id: recipe._id,
        id: recipe._id,
        blockchainRecipeId: recipe.blockchainRecipeId,
        resultTokenContract: recipe.resultTokenContract,
        resultTokenId: recipe.resultTokenId,
        resultAmount: recipe.resultAmount,
        // Add tokenContract to ingredients if missing (use workbench contract as default)
        ingredients: recipe.ingredients.map((ing: any) => ({
          ...ing,
          tokenContract: ing.tokenContract || recipe.resultTokenContract || CONTRACTS.workbench
        })),
        outputIngredient: recipe.outputIngredient, // Include the outputIngredient field
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        difficulty: recipe.difficulty,
        craftingTime: recipe.craftingTime,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      }));

      console.log('📦 Fetched recipes from API:', fetchedRecipes);
      console.log('📦 Blockchain recipes after mapping:', blockchainRecipes.value);

      // Convert blockchain recipes to legacy Recipe format and populate recipes array
      // Filter out invalid recipes and log errors
      recipes.value = blockchainRecipes.value
        .map(blockchainRecipe => {
          try {
            return convertBlockchainRecipeToRecipe(blockchainRecipe);
          } catch (error: any) {
            console.error(`Failed to convert recipe ${blockchainRecipe.blockchainRecipeId || blockchainRecipe._id}:`, error);
            return null;
          }
        })
        .filter((recipe): recipe is Recipe => recipe !== null);
      
      console.log('📦 Converted legacy recipes:', recipes.value);

      console.log(`Loaded ${blockchainRecipes.value.length} recipes from server`);
      console.log(`Converted ${recipes.value.length} recipes to legacy format`);
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

  // Get recipe by blockchain ID
  const getBlockchainRecipe = (blockchainRecipeId: string): BlockchainRecipe | undefined => {
    return blockchainRecipes.value.find(r => r.blockchainRecipeId === blockchainRecipeId);
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
      
      if (!ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
        return false;
      }
      
      // Validate tokenId exists and is a number
      if (typeof gridItem.tokenId !== 'number' || typeof ingredient.tokenId !== 'number') {
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

  // Get all blockchain recipes
  const allBlockchainRecipes = computed(() => blockchainRecipes.value);

  // Get recipes by category
  const recipesByCategory = (category: string) => {
    return blockchainRecipes.value.filter(r => r.category === category);
  };

  /**
   * Check if user can craft a specific recipe based on their inventory
   * @param recipe - The recipe to check
   * @param userInventory - User's blockchain inventory with tokenId and balance
   * @returns Boolean indicating if all ingredients are available
   */
  const canCraftRecipe = (
    recipe: BlockchainRecipe,
    userInventory: Array<{ tokenId: number; balance: string; tokenContract: string }>
  ): boolean => {
    // Validate recipe has ingredients
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return false;
    }

    // Check each ingredient required by the recipe
    for (const ingredient of recipe.ingredients) {
      // Validate ingredient structure
      if (!ingredient || typeof ingredient.tokenId !== 'number' || !ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
        console.warn('Invalid ingredient in recipe:', ingredient);
        return false;
      }

      // Find matching token in user inventory
      const inventoryItem = userInventory.find(item => {
        if (!item || !item.tokenContract || typeof item.tokenContract !== 'string') {
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
      if (!ingredient || typeof ingredient.tokenId !== 'number' || !ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
        console.warn('Invalid ingredient in recipe:', ingredient);
        continue;
      }

      const inventoryItem = userInventory.find(item => {
        if (!item || !item.tokenContract || typeof item.tokenContract !== 'string') {
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
    allBlockchainRecipes,
    recipesByCategory,
    canCraftRecipe,
    checkCraftingPossibility,
  };
});
