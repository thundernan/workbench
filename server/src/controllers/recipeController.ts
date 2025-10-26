import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import Ingredient from '../models/Ingredient';
import { asyncHandler } from '../middleware/errorHandler';
import { WorkbenchInstanceService } from '../services/workbenchInstanceService';
import { blockchainConnection } from '../config/blockchain';

/**
 * Get blockchain service instance (uses singleton connection)
 * Returns null if blockchain is not initialized
 */
const initWorkbenchService = (): WorkbenchInstanceService | null => {
  if (!blockchainConnection.isReady()) {
    return null;
  }
  
  try {
    return new WorkbenchInstanceService();
  } catch (error) {
    console.error('Failed to create workbench service instance:', error);
    return null;
  }
};

// Create a new recipe
export const createRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { 
    ingredients, 
    outputTokenId, 
    outputAmount, 
    requiresExactPattern, 
    name 
  } = req.body;

  // Validate required fields
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Ingredients array is required and must not be empty'
    });
    return;
  }

  if (!outputTokenId || outputTokenId < 0) {
    res.status(400).json({
      success: false,
      message: 'Valid outputTokenId is required'
    });
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Recipe name is required'
    });
    return;
  }

  // 1. Create recipe in database first (without blockchainRecipeId to avoid constraint issues)
  const recipe = await Recipe.create({
    outputTokenId: outputTokenId,
    outputAmount: outputAmount || 1,
    requiresExactPattern: requiresExactPattern !== undefined ? requiresExactPattern : true,
    active: true,
    name: name.trim(),
    ingredients: ingredients.map((ing: any) => ({
      tokenId: ing.tokenId,
      amount: ing.amount || 1,
      position: ing.position || 0
    }))
  });

  // 2. Create recipe on blockchain (required)
  const workbenchService = initWorkbenchService();
  if (!workbenchService) {
    // Clean up created data if workbench service unavailable
    await Recipe.findByIdAndDelete(recipe._id);
    
    res.status(503).json({
      success: false,
      message: 'WorkbenchInstance service unavailable. Recipe creation requires blockchain integration.',
      error: 'WORKBENCH_INSTANCE_ADDRESS environment variable not configured'
    });
    return;
  }

  try {
    // Create recipe on blockchain
    const createResult = await workbenchService.createRecipe(
      ingredients.map((ing: any) => ({
        tokenId: ing.tokenId,
        amount: ing.amount || 1,
        position: ing.position || 0
      })),
      outputTokenId,
      outputAmount || 1,
      requiresExactPattern !== undefined ? requiresExactPattern : true,
      name.trim()
    );

    // Update recipe with blockchain recipe ID
    if (createResult.recipeId) {
      await Recipe.findByIdAndUpdate(recipe._id, {
        blockchainRecipeId: createResult.recipeId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully with blockchain integration.',
      data: {
        recipeId: recipe._id,
        blockchainRecipeId: createResult.recipeId,
        outputTokenId: recipe.outputTokenId,
        outputAmount: recipe.outputAmount,
        requiresExactPattern: recipe.requiresExactPattern,
        active: recipe.active,
        name: recipe.name,
        ingredients: recipe.ingredients,
        createTransaction: createResult.hash,
        createdAt: recipe.createdAt
      }
    });

  } catch (createError) {
    // Clean up created data if blockchain operation fails
    await Recipe.findByIdAndDelete(recipe._id);
    
    console.error('Failed to create recipe on blockchain:', createError);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe on blockchain',
      error: createError instanceof Error ? createError.message : 'Unknown error'
    });
  }
});

// Get all recipes
export const getRecipes = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [recipes, total] = await Promise.all([
    Recipe.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Recipe.countDocuments()
  ]);

  // Populate ingredient metadata for each recipe
  const recipesWithMetadata = await Promise.all(
    recipes.map(async (recipe) => {
      // Populate input ingredients metadata
      const ingredientsWithMetadata = await Promise.all(
        recipe.ingredients.map(async (ingredient) => {
          // Find the ingredient by tokenId
          const ingredientDoc = await Ingredient.findOne({ tokenId: ingredient.tokenId })
            .populate('ingredientData')
            .lean();
          
          return {
            tokenId: ingredient.tokenId,
            amount: ingredient.amount,
            position: ingredient.position,
            metadata: (ingredientDoc?.ingredientData as any)?.metadata || null
          };
        })
      );

      // Find output ingredient metadata
      const outputIngredientDoc = await Ingredient.findOne({ tokenId: recipe.outputTokenId })
        .populate('ingredientData')
        .lean();
      
      const outputIngredient = outputIngredientDoc ? {
        tokenId: recipe.outputTokenId,
        amount: recipe.outputAmount,
        metadata: (outputIngredientDoc.ingredientData as any)?.metadata || null
      } : null;

      return {
        ...recipe,
        ingredients: ingredientsWithMetadata,
        outputIngredient: outputIngredient
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Recipes retrieved successfully',
    data: {
      data: recipesWithMetadata,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Get recipe by ID
export const getRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const recipe = await Recipe.findById(id).lean();
  
  if (!recipe) {
    res.status(404).json({
      success: false,
      message: 'Recipe not found'
    });
    return;
  }

  // Populate ingredient metadata
  const ingredientsWithMetadata = await Promise.all(
    recipe.ingredients.map(async (ingredient) => {
      // Find the ingredient by tokenId
      const ingredientDoc = await Ingredient.findOne({ tokenId: ingredient.tokenId })
        .populate('ingredientData')
        .lean();
      
      return {
        tokenId: ingredient.tokenId,
        amount: ingredient.amount,
        position: ingredient.position,
        metadata: (ingredientDoc?.ingredientData as any)?.metadata || null
      };
    })
  );

  // Find output ingredient metadata
  const outputIngredientDoc = await Ingredient.findOne({ tokenId: recipe.outputTokenId })
    .populate('ingredientData')
    .lean();
  
  const outputIngredient = outputIngredientDoc ? {
    tokenId: recipe.outputTokenId,
    amount: recipe.outputAmount,
    metadata: (outputIngredientDoc.ingredientData as any)?.metadata || null
  } : null;

  const recipeWithMetadata = {
    ...recipe,
    ingredients: ingredientsWithMetadata,
    outputIngredient: outputIngredient
  };

  res.status(200).json({
    success: true,
    message: 'Recipe retrieved successfully',
    data: recipeWithMetadata
  });
});

// Update recipe
export const updateRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const recipe = await Recipe.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!recipe) {
    res.status(404).json({
      success: false,
      message: 'Recipe not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Recipe updated successfully',
    data: recipe
  });
});

// Delete recipe
export const deleteRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const recipe = await Recipe.findByIdAndDelete(id);
  
  if (!recipe) {
    res.status(404).json({
      success: false,
      message: 'Recipe not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Recipe deleted successfully',
    data: recipe
  });
});