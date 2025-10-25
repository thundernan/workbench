import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { WorkbenchCraftingService } from '../services/workbenchCraftingService';
import { blockchainConnection } from '../config/blockchain';

/**
 * Get crafting service instance (uses singleton connection)
 * Returns null if blockchain is not initialized
 */
const initCraftingService = (): WorkbenchCraftingService | null => {
  if (!blockchainConnection.isReady()) {
    return null;
  }
  
  try {
    return new WorkbenchCraftingService();
  } catch (error) {
    console.error('Failed to create crafting service instance:', error);
    return null;
  }
};

/**
 * Check if user can craft a recipe
 * GET /api/crafting/can-craft/:recipeId/:address
 */
export const checkCanCraft = asyncHandler(async (req: Request, res: Response) => {
  const { recipeId, address } = req.params;
  
  if (!recipeId || !address) {
    res.status(400).json({
      success: false,
      message: 'Recipe ID and address are required'
    });
    return;
  }
  
  const service = initCraftingService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Crafting service not available. Configure BLOCKCHAIN_RPC_URL and WORKBENCH_CONTRACT_ADDRESS.'
    });
    return;
  }

  const canCraft = await service.canCraft(Number(recipeId), address);

  res.status(200).json({
    success: true,
    message: 'Crafting eligibility checked successfully',
    data: {
      recipeId: Number(recipeId),
      address,
      canCraft,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get recipe from blockchain
 * GET /api/crafting/recipe/:recipeId
 */
export const getBlockchainRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { recipeId } = req.params;
  
  if (!recipeId) {
    res.status(400).json({
      success: false,
      message: 'Recipe ID is required'
    });
    return;
  }
  
  const service = initCraftingService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Crafting service not available. Configure BLOCKCHAIN_RPC_URL and WORKBENCH_CONTRACT_ADDRESS.'
    });
    return;
  }

  const recipe = await service.getRecipe(Number(recipeId));

  res.status(200).json({
    success: true,
    message: 'Recipe retrieved successfully',
    data: {
      recipeId: Number(recipeId),
      ...recipe,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get all active recipe IDs
 * GET /api/crafting/active-recipes
 */
export const getActiveRecipeIds = asyncHandler(async (_req: Request, res: Response) => {
  const service = initCraftingService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Crafting service not available. Configure BLOCKCHAIN_RPC_URL and WORKBENCH_CONTRACT_ADDRESS.'
    });
    return;
  }

  const recipeIds = await service.getActiveRecipeIds();

  res.status(200).json({
    success: true,
    message: 'Active recipe IDs retrieved successfully',
    data: {
      recipeIds,
      count: recipeIds.length,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get all active recipes with details
 * GET /api/crafting/active-recipes/details
 */
export const getActiveRecipes = asyncHandler(async (_req: Request, res: Response) => {
  const service = initCraftingService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Crafting service not available. Configure BLOCKCHAIN_RPC_URL and WORKBENCH_CONTRACT_ADDRESS.'
    });
    return;
  }

  const recipes = await service.getActiveRecipes();

  res.status(200).json({
    success: true,
    message: 'Active recipes retrieved successfully',
    data: {
      recipes,
      count: recipes.length,
      contractAddress: service.getContractAddress()
    }
  });
});


