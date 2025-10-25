import { Request, Response } from 'express';
import Recipe from '../models/Recipe';
import { asyncHandler } from '../middleware/errorHandler';
import { IApiResponse, IPaginationResult, IRecipeQuery } from '../types';

// Create a new recipe
export const createRecipe = asyncHandler(async (req: Request, res: Response) => {
  const {
    blockchainRecipeId,
    resultTokenContract,
    resultTokenId,
    resultAmount,
    ingredients,
    requiresExactPattern,
    active,
    name,
    description,
    category,
    difficulty,
    craftingTime,
    metadata
  } = req.body;

  // Check if recipe already exists
  const existingRecipe = await Recipe.findOne({ blockchainRecipeId });
  
  if (existingRecipe) {
    res.status(409).json({
      success: false,
      message: 'Recipe with this blockchainRecipeId already exists',
      data: existingRecipe
    });
    return;
  }

  // Create new recipe
  const recipe = await Recipe.create({
    blockchainRecipeId,
    resultTokenContract,
    resultTokenId,
    resultAmount,
    ingredients,
    requiresExactPattern: requiresExactPattern !== undefined ? requiresExactPattern : true,
    active: active !== undefined ? active : true,
    name,
    description,
    category,
    difficulty,
    craftingTime,
    metadata
  });

  res.status(201).json({
    success: true,
    message: 'Recipe created successfully',
    data: recipe
  });
});

// Get all recipes with pagination and filtering (blockchain-synced data)
export const getRecipes = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as IRecipeQuery;
  const { page = 1, limit = 10, ...filters } = query;

  // Build filter object
  const filter: any = {};
  if (filters.blockchainRecipeId) filter.blockchainRecipeId = filters.blockchainRecipeId;
  if (filters.resultTokenContract) filter.resultTokenContract = filters.resultTokenContract;
  if (filters.resultTokenId !== undefined) filter.resultTokenId = filters.resultTokenId;
  if (filters.category) filter.category = filters.category;
  if (filters.difficulty !== undefined) filter.difficulty = filters.difficulty;
  if (filters.name) {
    filter.name = { $regex: filters.name, $options: 'i' }; // Case-insensitive partial match
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query with pagination
  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Recipe.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  const paginationResult: IPaginationResult<any> = {
    data: recipes,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages
  };

  const response: IApiResponse<IPaginationResult<any>> = {
    success: true,
    message: 'Recipes retrieved successfully',
    data: paginationResult
  };

  res.status(200).json(response);
});
