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

  const normalizedIngredients = ingredients.map((ing: any) => ({
    tokenId: ing.tokenId,
    amount: ing.amount || 1,
    position: ing.position || 0
  }));

  const workbenchService = initWorkbenchService();
  if (!workbenchService) {
    res.status(503).json({
      success: false,
      message: 'WorkbenchInstance service unavailable. Recipe creation requires blockchain integration.',
      error: 'WORKBENCH_INSTANCE_ADDRESS environment variable not configured'
    });
    return;
  }

  try {
    const createResult = await workbenchService.createRecipe(
      normalizedIngredients,
      outputTokenId,
      outputAmount || 1,
      requiresExactPattern !== undefined ? requiresExactPattern : true,
      name.trim()
    );

    const blockchainRecipeId = (() => {
      if (typeof createResult === 'number') {
        return createResult;
      }
      if (typeof createResult === 'bigint') {
        return Number(createResult);
      }
      if (createResult && typeof createResult === 'object') {
        const rawId = (createResult as any)?.recipeId;
        if (typeof rawId === 'number') {
          return rawId;
        }
        if (typeof rawId === 'bigint') {
          return Number(rawId);
        }
        if (rawId && typeof rawId.toString === 'function') {
          const parsed = Number(rawId.toString());
          return Number.isFinite(parsed) ? parsed : null;
        }
      }
      return null;
    })();

    const createTransactionHash =
      createResult && typeof createResult === 'object' && 'hash' in createResult
        ? String((createResult as any).hash)
        : null;

    let blockchainRecipe = null;
    if (blockchainRecipeId !== null) {
      try {
        blockchainRecipe = await workbenchService.getRecipeById(blockchainRecipeId);
      } catch (fetchError) {
        console.warn(`⚠️ Failed to fetch recipe ${blockchainRecipeId} immediately after creation:`, fetchError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Recipe creation transaction submitted to blockchain. Listener will synchronize data shortly.',
      data: {
        blockchainRecipeId,
        transactionHash: createTransactionHash,
        submittedAt: new Date().toISOString(),
        recipe: blockchainRecipe || {
          outputTokenId,
          outputAmount: outputAmount || 1,
          requiresExactPattern: requiresExactPattern !== undefined ? requiresExactPattern : true,
          active: true,
          name: name.trim(),
          ingredients: normalizedIngredients
        }
      }
    });
  } catch (createError) {
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
            tokenContract: ingredientDoc?.tokenContract || null,
            metadata: (ingredientDoc?.ingredientData as any)?.metadata || null
          };
        })
      );

      // Find output ingredient metadata
      const outputIngredientDoc = await Ingredient.findOne({ tokenId: recipe.outputTokenId })
        .populate('ingredientData')
        .lean();
      
      const outputIngredient = outputIngredientDoc ? {
        tokenContract: outputIngredientDoc.tokenContract,
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

// Get recipe directly from blockchain by recipe ID
export const getBlockchainRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { recipeId } = req.params;

  if (recipeId === undefined) {
    res.status(400).json({
      success: false,
      message: 'Recipe ID is required'
    });
    return;
  }

  const parsedRecipeId = Number(recipeId);
  if (!Number.isInteger(parsedRecipeId) || parsedRecipeId < 0) {
    res.status(400).json({
      success: false,
      message: 'Recipe ID must be a non-negative integer'
    });
    return;
  }

  const workbenchService = initWorkbenchService();
  if (!workbenchService) {
    res.status(503).json({
      success: false,
      message: 'WorkbenchInstance service unavailable. Blockchain connection not initialized.'
    });
    return;
  }

  try {
    const blockchainRecipe = await workbenchService.getRecipeById(parsedRecipeId);

    if (!blockchainRecipe) {
      res.status(404).json({
        success: false,
        message: 'Recipe not found on blockchain'
      });
      return;
    }

    const ingredientsWithMetadata = await Promise.all(
      blockchainRecipe.ingredients.map(async (ingredient) => {
        const ingredientDoc = await Ingredient.findOne({ tokenId: ingredient.tokenId })
          .populate('ingredientData')
          .lean();

        return {
          tokenId: ingredient.tokenId,
          amount: ingredient.amount,
          position: ingredient.position,
          tokenContract: ingredientDoc?.tokenContract || null,
          metadata: (ingredientDoc?.ingredientData as any)?.metadata || null
        };
      })
    );

    const outputIngredientDoc = await Ingredient.findOne({ tokenId: blockchainRecipe.outputTokenId })
      .populate('ingredientData')
      .lean();

    const outputIngredient = outputIngredientDoc
      ? {
          tokenContract: outputIngredientDoc.tokenContract,
          tokenId: blockchainRecipe.outputTokenId,
          amount: blockchainRecipe.outputAmount,
          metadata: (outputIngredientDoc.ingredientData as any)?.metadata || null
        }
      : null;

    res.status(200).json({
      success: true,
      message: 'Blockchain recipe retrieved successfully',
      data: {
        ...blockchainRecipe,
        ingredients: ingredientsWithMetadata,
        outputIngredient
      }
    });
  } catch (error) {
    console.error(`Failed to fetch blockchain recipe ${parsedRecipeId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recipe from blockchain',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
        tokenContract: ingredientDoc?.tokenContract || null,
        metadata: (ingredientDoc?.ingredientData as any)?.metadata || null
      };
    })
  );

  // Find output ingredient metadata
  const outputIngredientDoc = await Ingredient.findOne({ tokenId: recipe.outputTokenId })
    .populate('ingredientData')
    .lean();
  
  const outputIngredient = outputIngredientDoc ? {
    tokenContract: outputIngredientDoc.tokenContract,
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