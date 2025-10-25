import { Request, Response } from 'express';
import Ingredient from '../models/Ingredient';
import IngredientData from '../models/IngredientData';
import { asyncHandler } from '../middleware/errorHandler';
import { IngredientBlockchainService } from '../services/ingredientBlockchainService';
import { blockchainConnection } from '../config/blockchain';

/**
 * Get blockchain service instance (uses singleton connection)
 * Returns null if blockchain is not initialized
 */
const initBlockchainService = (): IngredientBlockchainService | null => {
  if (!blockchainConnection.isReady()) {
    return null;
  }
  
  try {
    return new IngredientBlockchainService();
  } catch (error) {
    console.error('Failed to create blockchain service instance:', error);
    return null;
  }
};

// Create a new ingredient with data
export const createIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, metadata } = req.body;

  // Check if ingredient already exists
  const existingIngredient = await Ingredient.findOne({ tokenContract, tokenId });
  
  if (existingIngredient) {
    res.status(409).json({
      success: false,
      message: 'Ingredient with this tokenContract and tokenId already exists',
      data: existingIngredient
    });
    return;
  }

  // 1. Create ingredient data first
  const ingredientData = await IngredientData.create({
    metadata: metadata || {}
  });

  // 2. Create ingredient with reference to ingredient data
  const ingredient = await Ingredient.create({
    tokenContract,
    tokenId,
    ingredientData: ingredientData._id
  });

  res.status(201).json({
    success: true,
    message: 'Ingredient created successfully',
    data: {
      _id: ingredient._id,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId,
      ingredientData: ingredientData._id,
      metadata: ingredientData.metadata,
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt
    }
  });
});

// Get all ingredients with their data
export const getIngredients = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [ingredients, total] = await Promise.all([
    Ingredient.find()
      .populate('ingredientData')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Ingredient.countDocuments()
  ]);

  // Transform to include metadata at top level
  const result = ingredients.map((ing: any) => ({
    _id: ing._id,
    tokenContract: ing.tokenContract,
    tokenId: ing.tokenId,
    ingredientData: ing.ingredientData?._id,
    metadata: ing.ingredientData?.metadata || {},
    createdAt: ing.createdAt,
    updatedAt: ing.updatedAt
  }));

  const totalPages = Math.ceil(total / Number(limit));

  res.status(200).json({
    success: true,
    message: 'Ingredients retrieved successfully',
    data: {
      data: result,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  });
});

// Get ingredient by tokenContract and tokenId with data
export const getIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  const ingredient: any = await Ingredient.findOne({
    tokenContract,
    tokenId: Number(tokenId)
  }).populate('ingredientData').lean();

  if (!ingredient) {
    res.status(404).json({
      success: false,
      message: 'Ingredient not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Ingredient retrieved successfully',
    data: {
      _id: ingredient._id,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId,
      ingredientData: ingredient.ingredientData?._id,
      metadata: ingredient.ingredientData?.metadata || {},
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt
    }
  });
});

// Update ingredient metadata
export const updateIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;
  const { metadata } = req.body;

  const ingredient: any = await Ingredient.findOne({
    tokenContract,
    tokenId: Number(tokenId)
  }).populate('ingredientData');

  if (!ingredient) {
    res.status(404).json({
      success: false,
      message: 'Ingredient not found'
    });
    return;
  }

  // Update ingredient data using the reference
  const ingredientData = await IngredientData.findByIdAndUpdate(
    ingredient.ingredientData._id,
    { metadata },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Ingredient updated successfully',
    data: {
      _id: ingredient._id,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId,
      ingredientData: ingredientData?._id,
      metadata: ingredientData?.metadata || {},
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt
    }
  });
});

// Delete ingredient and its data
export const deleteIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  const ingredient: any = await Ingredient.findOne({
    tokenContract,
    tokenId: Number(tokenId)
  });

  if (!ingredient) {
    res.status(404).json({
      success: false,
      message: 'Ingredient not found'
    });
    return;
  }

  // Delete ingredient data first
  await IngredientData.findByIdAndDelete(ingredient.ingredientData);

  // Delete ingredient
  await Ingredient.findByIdAndDelete(ingredient._id);

  res.status(200).json({
    success: true,
    message: 'Ingredient deleted successfully',
    data: {
      _id: ingredient._id,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId
    }
  });
});

// ============================================
// Blockchain Integration Endpoints
// ============================================

/**
 * Get token balance from blockchain
 * GET /api/ingredients/blockchain/balance/:address/:tokenId
 */
export const getTokenBalance = asyncHandler(async (req: Request, res: Response) => {
  const { address, tokenId } = req.params;
  
  if (!address || !tokenId) {
    res.status(400).json({
      success: false,
      message: 'Address and tokenId are required'
    });
    return;
  }
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  const balance = await service.getTokenBalance(address, Number(tokenId));

  res.status(200).json({
    success: true,
    message: 'Token balance retrieved successfully',
    data: {
      address,
      tokenId: Number(tokenId),
      balance,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get token price from blockchain
 * GET /api/ingredients/blockchain/price/:tokenId
 */
export const getTokenPrice = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId } = req.params;
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  const [priceWei, priceEth] = await Promise.all([
    service.getTokenPrice(Number(tokenId)),
    service.getTokenPriceInEth(Number(tokenId))
  ]);

  res.status(200).json({
    success: true,
    message: 'Token price retrieved successfully',
    data: {
      tokenId: Number(tokenId),
      priceWei,
      priceEth,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get comprehensive token info from blockchain
 * GET /api/ingredients/blockchain/info/:tokenId
 */
export const getTokenInfo = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId } = req.params;
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  const tokenInfo = await service.getTokenInfo(Number(tokenId));

  res.status(200).json({
    success: true,
    message: 'Token info retrieved successfully',
    data: tokenInfo
  });
});

/**
 * Get token total supply from blockchain
 * GET /api/ingredients/blockchain/supply/:tokenId
 */
export const getTokenSupply = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId } = req.params;
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  const totalSupply = await service.getTotalSupply(Number(tokenId));

  res.status(200).json({
    success: true,
    message: 'Token supply retrieved successfully',
    data: {
      tokenId: Number(tokenId),
      totalSupply,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Check if token exists on blockchain
 * GET /api/ingredients/blockchain/exists/:tokenId
 */
export const checkTokenExists = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId } = req.params;
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  const exists = await service.tokenExists(Number(tokenId));

  res.status(200).json({
    success: true,
    message: 'Token existence checked successfully',
    data: {
      tokenId: Number(tokenId),
      exists,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get user's complete token balance for all ingredients
 * GET /api/ingredients/blockchain/user-balance/:address
 */
export const getUserBalance = asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  
  if (!address) {
    res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
    return;
  }
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  // Get all ingredients from database
  const ingredients = await Ingredient.find().lean();
  
  if (ingredients.length === 0) {
    res.status(200).json({
      success: true,
      message: 'No ingredients found in database',
      data: {
        address,
        balances: [],
        totalTokens: 0,
        contractAddress: service.getContractAddress()
      }
    });
    return;
  }

  // Get balances for all tokens
  const tokenIds = ingredients.map((ing: any) => ing.tokenId);
  const addresses = new Array(tokenIds.length).fill(address);
  
  const balances = await service.getTokenBalanceBatch(addresses, tokenIds);
  
  // Combine with ingredient data
  const balanceData = ingredients.map((ing: any, index: number) => ({
    tokenContract: ing.tokenContract,
    tokenId: ing.tokenId,
    balance: balances[index],
    ingredientDataId: ing.ingredientData
  }));

  // Filter out zero balances (optional - comment out if you want to see all)
  const nonZeroBalances = balanceData.filter(item => item.balance !== '0');

  res.status(200).json({
    success: true,
    message: 'User balances retrieved successfully',
    data: {
      address,
      balances: nonZeroBalances,
      totalTokens: nonZeroBalances.length,
      allTokensChecked: balances.length,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Get user's balance with ingredient metadata
 * GET /api/ingredients/blockchain/user-inventory/:address
 */
export const getUserInventory = asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { includeZero } = req.query; // Optional: include zero balances
  
  if (!address) {
    res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
    return;
  }
  
  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  // Get all ingredients with metadata
  const ingredients: any[] = await Ingredient.find()
    .populate('ingredientData')
    .lean();
  
  if (ingredients.length === 0) {
    res.status(200).json({
      success: true,
      message: 'No ingredients found in database',
      data: {
        address,
        inventory: [],
        totalItems: 0,
        contractAddress: service.getContractAddress()
      }
    });
    return;
  }

  // Get balances for all tokens
  const tokenIds = ingredients.map(ing => ing.tokenId);
  const addresses = new Array(tokenIds.length).fill(address);
  
  const balances = await service.getTokenBalanceBatch(addresses, tokenIds);
  
  // Combine balance with ingredient metadata
  const inventory = ingredients.map((ing, index) => ({
    tokenContract: ing.tokenContract,
    tokenId: ing.tokenId,
    balance: balances[index],
    metadata: ing.ingredientData?.metadata || {},
    ingredientDataId: ing.ingredientData?._id
  }));

  // Filter by balance
  const filteredInventory = includeZero === 'true' 
    ? inventory 
    : inventory.filter(item => item.balance !== '0');

  res.status(200).json({
    success: true,
    message: 'User inventory retrieved successfully',
    data: {
      address,
      inventory: filteredInventory,
      totalItems: filteredInventory.length,
      allTokensChecked: balances.length,
      contractAddress: service.getContractAddress()
    }
  });
});

/**
 * Sync ingredient from blockchain and create in database
 * POST /api/ingredients/blockchain/sync
 * Body: { tokenId: number, metadata?: any }
 */
export const syncIngredientFromBlockchain = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId, metadata } = req.body;
  
  if (!tokenId && tokenId !== 0) {
    res.status(400).json({
      success: false,
      message: 'Token ID is required'
    });
    return;
  }

  const service = initBlockchainService();
  if (!service) {
    res.status(503).json({
      success: false,
      message: 'Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS.'
    });
    return;
  }

  // Get token info from blockchain
  const tokenInfo = await service.getTokenInfo(Number(tokenId));

  if (!tokenInfo.exists) {
    res.status(404).json({
      success: false,
      message: `Token ${tokenId} does not exist on blockchain`
    });
    return;
  }

  const tokenContract = service.getContractAddress();

  // Check if ingredient already exists
  let ingredient = await Ingredient.findOne({ tokenContract, tokenId: Number(tokenId) });
  
  if (ingredient) {
    res.status(409).json({
      success: false,
      message: 'Ingredient already synced from blockchain',
      data: ingredient
    });
    return;
  }

  // Merge blockchain data with provided metadata
  const ingredientMetadata = {
    name: tokenInfo.name || metadata?.name || `Token ${tokenId}`,
    image: metadata?.image || null,
    uri: tokenInfo.uri,
    priceWei: tokenInfo.priceWei,
    priceEth: tokenInfo.priceEth,
    totalSupply: tokenInfo.totalSupply,
    ...metadata
  };

  // Create ingredient data
  const ingredientData = await IngredientData.create({
    metadata: ingredientMetadata
  });

  // Create ingredient
  ingredient = await Ingredient.create({
    tokenContract,
    tokenId: Number(tokenId),
    ingredientData: ingredientData._id
  });

  res.status(201).json({
    success: true,
    message: 'Ingredient synced from blockchain successfully',
    data: {
      _id: ingredient._id,
      tokenContract: ingredient.tokenContract,
      tokenId: ingredient.tokenId,
      ingredientData: ingredientData._id,
      metadata: ingredientData.metadata,
      blockchainInfo: tokenInfo,
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt
    }
  });
});

