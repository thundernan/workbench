import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Recipe, Item, BlockchainRecipe } from '@/types';
import apiService from '@/services/apiService';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);
  const blockchainRecipes = ref<BlockchainRecipe[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Initialize mock blockchain recipes (simple: pickaxe and wooden sword)
  const initializeMockBlockchainRecipes = () => {
    const mockRecipes: BlockchainRecipe[] = [
      {
        _id: 'mock_stone_pickaxe',
        id: 'mock_stone_pickaxe',
        blockchainRecipeId: '1',
        resultTokenContract: '0x0000000000000000000000000000000000000001',
        resultTokenId: 100,
        resultAmount: 1,
        ingredients: [
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 2, // Stone
            amount: 1,
            position: 0
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 2, // Stone
            amount: 1,
            position: 1
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 2, // Stone
            amount: 1,
            position: 2
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 1, // Wood
            amount: 1,
            position: 4
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 1, // Wood
            amount: 1,
            position: 7
          }
        ],
        name: 'Stone Pickaxe',
        description: 'A sturdy stone pickaxe for mining',
        category: 'tool',
        difficulty: 2,
        craftingTime: 30
      },
      {
        _id: 'mock_wooden_sword',
        id: 'mock_wooden_sword',
        blockchainRecipeId: '2',
        resultTokenContract: '0x0000000000000000000000000000000000000001',
        resultTokenId: 101,
        resultAmount: 1,
        ingredients: [
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 1, // Wood
            amount: 1,
            position: 1
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 1, // Wood
            amount: 1,
            position: 4
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 1, // Wood
            amount: 1,
            position: 7
          }
        ],
        name: 'Wooden Sword',
        description: 'A basic wooden sword for combat',
        category: 'weapon',
        difficulty: 1,
        craftingTime: 20
      },
      {
        _id: 'mock_xsolla_diamond',
        id: 'mock_xsolla_diamond',
        blockchainRecipeId: '3',
        resultTokenContract: '0x0000000000000000000000000000000000000001',
        resultTokenId: 102,
        resultAmount: 1,
        ingredients: [
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 1  // Top center
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 5  // Middle left
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 7  // Middle right
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 3  // Bottom center
          }
        ],
        name: 'Xsolla Diamond',
        description: 'Legendary Xsolla powered gem',
        category: 'special',
        difficulty: 5,
        craftingTime: 60,
        result: {
          icon: '/xsolla.png',
          name: 'Xsolla Diamond',
          description: 'Legendary Xsolla powered gem'
        } as { icon: string; name: string; description: string }
      } as BlockchainRecipe,
      {
        _id: 'mock_status_crystal',
        id: 'mock_status_crystal',
        blockchainRecipeId: '4',
        resultTokenContract: '0x0000000000000000000000000000000000000001',
        resultTokenId: 103,
        resultAmount: 1,
        ingredients: [
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 1  // Top left (верх слева)
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 4  // Top right (верх справа)
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 7  // Bottom left (низ слева)
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 6  // Bottom right (низ справа)
          },
          {
            tokenContract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            tokenId: 3, // Diamond
            amount: 1,
            position: 5  // Bottom right (низ справа)
          }
        ],
        name: 'Status Crystal',
        description: 'Legendary Status Network crystal',
        category: 'special',
        difficulty: 5,
        craftingTime: 60,
        result: {
          icon: '/status.png',
          name: 'Status Crystal',
          description: 'Legendary Status Network crystal'
        } as { icon: string; name: string; description: string }
      } as BlockchainRecipe
    ];
    
    blockchainRecipes.value = mockRecipes;
  };

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

  // Fetch blockchain recipes from server
  const fetchBlockchainRecipes = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      // Fetch all recipes (handles pagination automatically)
      const fetchedRecipes = await apiService.getAllRecipes();
      
      // Transform API recipes to BlockchainRecipe format
      blockchainRecipes.value = fetchedRecipes.map(recipe => ({
        _id: recipe._id,
        id: recipe._id,
        blockchainRecipeId: recipe.blockchainRecipeId,
        resultTokenContract: recipe.resultTokenContract,
        resultTokenId: recipe.resultTokenId,
        resultAmount: recipe.resultAmount,
        ingredients: recipe.ingredients,
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        difficulty: recipe.difficulty,
        craftingTime: recipe.craftingTime,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      }));

      console.log(`Loaded ${blockchainRecipes.value.length} recipes from server`);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch recipes';
      console.error('Error fetching recipes:', err);
      throw err;
    } finally {
      isLoading.value = false;
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
    // Check if all ingredients match their positions
    for (const ingredient of recipe.ingredients) {
      const gridItem = gridPositions.get(ingredient.position);
      
      if (!gridItem) return false;
      if (gridItem.tokenContract.toLowerCase() !== ingredient.tokenContract.toLowerCase()) return false;
      if (gridItem.tokenId !== ingredient.tokenId) return false;
    }

    // Check if there are extra items in the grid
    if (gridPositions.size !== recipe.ingredients.length) return false;

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
    initializeMockBlockchainRecipes,
    getBlockchainRecipe,
    getBlockchainRecipeById,
    matchBlockchainRecipe,
    allBlockchainRecipes,
    recipesByCategory,
  };
});
