import { Request, Response } from 'express';
import Ingredient from '../models/Ingredient';
import IngredientData from '../models/IngredientData';
import TokenCounter from '../models/TokenCounter';
import { asyncHandler } from '../middleware/errorHandler';
import { IngredientBlockchainService } from '../services/ingredientBlockchainService';
import { blockchainConnection } from '../config/blockchain';
import { ethers } from 'ethers';

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

/**
 * Get or create token counter for a contract
 */
const getTokenCounter = async (contractAddress: string) => {
  let counter = await TokenCounter.findOne({ contractAddress: contractAddress.toLowerCase() });
  
  if (!counter) {
    console.log(`📊 Creating new token counter for contract ${contractAddress}`);
    counter = await TokenCounter.create({
      contractAddress: contractAddress.toLowerCase(),
      lastTokenId: 0
    });
  }
  
  return counter;
};

/**
 * Find next available token ID on blockchain starting from a given ID
 * Updates the counter with the last checked ID
 */
const findNextAvailableTokenId = async (
  startFromId: number,
  contractAddress: string,
  blockchainService: IngredientBlockchainService
): Promise<number> => {
  console.log(`🔍 Searching for available token ID on blockchain (starting from ${startFromId})...`);
  
  let tokenId = startFromId;
  const maxAttempts = 1000;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const exists = await blockchainService.tokenExists(tokenId);
      console.log("exists", exists);
      
      if (!exists) {
        console.log(`✅ Found available token ID: ${tokenId} (verified on blockchain)`);
        
        // Update counter with the found token ID
        await TokenCounter.findOneAndUpdate(
          { contractAddress: contractAddress.toLowerCase() },
          { lastTokenId: tokenId },
          { upsert: true }
        );
        
        console.log("returning token id", tokenId);
        return tokenId;
      }
      
      console.log(`   Token ID ${tokenId}: EXISTS on blockchain, checking next...`);
      tokenId++;
      attempts++;
    } catch (error) {
      console.error(`⚠️  Error checking token ${tokenId} on blockchain:`, error);
      tokenId++;
      attempts++;
    }
  }
  
  throw new Error(`Could not find available token ID after ${maxAttempts} attempts. Last checked: ${tokenId - 1}`);
};

/**
 * Helper function to get next token ID from counter
 */
const getNextTokenIdFromCounter = async (): Promise<{ tokenId: number; contractAddress: string }> => {
  const contractAddress = blockchainConnection.getERC1155Address();
  const counter = await getTokenCounter(contractAddress);
  
  // Next token ID is last known + 1
  const nextTokenId = counter.lastTokenId + 1;
  
  console.log(`📊 Counter shows last token ID: ${counter.lastTokenId}, trying ID: ${nextTokenId}`);
  
  return { tokenId: nextTokenId, contractAddress };
};

// Create a new ingredient with data
export const createIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { metadata, price } = req.body;

  // Validate and convert price to wei
  // Default to 0 (free)
  let priceInWei = BigInt(0); // Free by default
  
  if (price !== undefined && price !== null) {
    try {
      // Price is provided in wei, just convert to BigInt
      if (typeof price === 'string') {
        priceInWei = BigInt(price);
      } else if (typeof price === 'number') {
        priceInWei = BigInt(price);
      } else {
        priceInWei = BigInt(price);
      }
      
      // Safety check: price should not exceed 100 ETH (100 * 10^18 wei)
      const maxPriceWei = BigInt('100000000000000000000'); // 100 ETH in wei
      if (priceInWei > maxPriceWei) {
        res.status(400).json({
          success: false,
          message: 'Price too high. Maximum price is 100 ETH (100000000000000000000 wei).'
        });
        return;
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid price format. Provide price in wei (e.g., "1000000000000000000" for 1 ETH).'
      });
      return;
    }
  }

  // Check blockchain service availability
  const blockchainService = initBlockchainService();
  if (!blockchainService) {
    res.status(500).json({
      success: false,
      message: 'Blockchain service unavailable'
    });
    return;
  }

  // Get next token ID from counter
  const { tokenId: initialTokenId, contractAddress } = await getNextTokenIdFromCounter();
  let tokenId = initialTokenId;
  let retryCount = 0;
  const maxRetries = 3;

  // 1. Create ingredient data first
  const ingredientData = await IngredientData.create({
    metadata: {
      ...(metadata || {}),
      price: priceInWei.toString() // Store price in metadata as string (wei)
    }
  });

  let ingredient = null;
  let createResult = null;

  // Retry loop for handling "token already exists" errors
  while (retryCount <= maxRetries) {
    try {
      console.log(`\n🔄 Attempt ${retryCount + 1}/${maxRetries + 1}: Creating ingredient with token ID ${tokenId}`);
      console.log({priceInWei});

      // 2. Create ingredient record in database
      ingredient = await Ingredient.create({
        tokenContract: contractAddress,
        tokenId: tokenId,
        ingredientData: ingredientData._id
      });

      // 3. Create token type on blockchain
      createResult = await blockchainService.createTokenType(
        tokenId,
        metadata?.name || 'Unnamed Ingredient',
        priceInWei
      );

      // Success! Update counter with the used token ID
      await TokenCounter.findOneAndUpdate(
        { contractAddress: contractAddress.toLowerCase() },
        { lastTokenId: tokenId },
        { upsert: true }
      );

      console.log(`✅ Ingredient created successfully with token ID ${tokenId}`);
      console.log(`📊 Counter updated to ${tokenId}`);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Ingredient created successfully with token type on blockchain.',
        data: {
          ingredientId: ingredient._id,
          ingredientDataId: ingredientData._id,
          tokenId: tokenId,
          tokenContract: ingredient.tokenContract,
          createTransaction: createResult.hash,
          price: {
            wei: createResult.priceWei,
            eth: createResult.priceEth
          },
          metadata: ingredientData.metadata,
          createdAt: ingredient.createdAt
        }
      });

      return; // Exit function on success

    } catch (createError) {
      // Clean up ingredient record if it was created
      if (ingredient) {
        await Ingredient.findByIdAndDelete(ingredient._id);
        ingredient = null;
      }

      const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
      console.error(`❌ Attempt ${retryCount + 1} failed:`, errorMessage);

      // Check if error is "token already exists"
      if (errorMessage.includes('Token type already exists') || errorMessage.includes('already exists')) {
        console.log(`⚠️  Token ID ${tokenId} already exists on blockchain`);
        
        if (retryCount < maxRetries) {
          // Find next available token ID from blockchain
          console.log(`🔍 Searching for next available token ID starting from ${tokenId}...`);
          tokenId = await findNextAvailableTokenId(tokenId, contractAddress, blockchainService);
          console.log(`📊 Found and updated counter to token ID ${tokenId}`);
          retryCount++;
          continue; // Retry with new token ID
        }
      }

      // If not "token already exists" error or max retries reached, fail
      console.error(`❌ Failed to create ingredient after ${retryCount + 1} attempts`);
      
      // Clean up ingredient data
      await IngredientData.findByIdAndDelete(ingredientData._id);
      
      res.status(500).json({
        success: false,
        message: 'Failed to create token type on blockchain',
        error: errorMessage,
        attempts: retryCount + 1
      });
      return;
    }
  }
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

// Set/Update ingredient price
export const setIngredientPrice = asyncHandler(async (req: Request, res: Response) => {
  const { tokenId } = req.params;
  const { price } = req.body;

  // Get contract address from blockchain connection
  const tokenContract = blockchainConnection.getERC1155Address();

  // Validate price parameter, default to 0 (free) if not provided
  let priceInWei = BigInt(0); // Default to free

  if (price !== undefined && price !== null) {
    // Convert price to BigInt
    try {
      if (typeof price === 'string') {
        priceInWei = BigInt(price);
      } else if (typeof price === 'number') {
        priceInWei = BigInt(price);
      } else {
        priceInWei = BigInt(price);
      }

      // Safety check: price should not exceed 100 ETH
      const maxPriceWei = BigInt('100000000000000000000'); // 100 ETH in wei
      if (priceInWei > maxPriceWei) {
        res.status(400).json({
          success: false,
          message: 'Price too high. Maximum price is 100 ETH (100000000000000000000 wei).'
        });
        return;
      }

      // Price should not be negative
      if (priceInWei < BigInt(0)) {
        res.status(400).json({
          success: false,
          message: 'Price cannot be negative.'
        });
        return;
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid price format. Provide price in wei (e.g., "1000000000000000" for 0.001 ETH).'
      });
      return;
    }
  }

  // Find ingredient
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

  console.log(`💰 Updating price for ingredient ${ingredient._id} (Token ID: ${tokenId})`);
  console.log(`   New price: ${ethers.formatEther(priceInWei)} ETH (${priceInWei.toString()} wei)`);

  // Try to update price on blockchain (if supported)
  let blockchainUpdate = null;
  const blockchainService = initBlockchainService();
  
  if (blockchainService && blockchainConnection.hasSigner()) {
    try {
      console.log('📡 Attempting to update price on blockchain...');
      blockchainUpdate = await blockchainService.setTokenPrice(Number(tokenId), priceInWei);
      
      if (blockchainUpdate) {
        console.log(`✅ Price updated on blockchain: ${blockchainUpdate.hash}`);
      } else {
        console.log('ℹ️  Blockchain contract does not support price updates. Price updated in database only.');
      }
    } catch (error) {
      console.warn('⚠️  Failed to update price on blockchain:', error);
      console.log('ℹ️  Continuing with database update only.');
    }
  } else {
    console.log('ℹ️  Blockchain service or signer not available. Price updated in database only.');
  }

  // Update price in database metadata
  const updatedMetadata = {
    ...ingredient.ingredientData.metadata,
    price: priceInWei.toString() // Store price in wei as string
  };

  const ingredientData = await IngredientData.findByIdAndUpdate(
    ingredient.ingredientData._id,
    { metadata: updatedMetadata },
    { new: true, runValidators: true }
  );

  console.log(`✅ Price updated in database for ingredient ${ingredient._id}`);

  // Prepare response
  const responseData: any = {
    _id: ingredient._id,
    tokenContract: ingredient.tokenContract,
    tokenId: ingredient.tokenId,
    ingredientData: ingredientData?._id,
    metadata: ingredientData?.metadata || {},
    price: {
      wei: priceInWei.toString(),
      eth: ethers.formatEther(priceInWei)
    },
    updatedAt: new Date()
  };

  if (blockchainUpdate) {
    responseData.blockchainUpdate = {
      transactionHash: blockchainUpdate.hash,
      blockNumber: blockchainUpdate.blockNumber
    };
  }

  res.status(200).json({
    success: true,
    message: blockchainUpdate 
      ? 'Ingredient price updated successfully on blockchain and database'
      : 'Ingredient price updated successfully in database',
    data: responseData,
    note: !blockchainUpdate && blockchainService 
      ? 'Blockchain contract does not support price updates. Price is stored in database only.'
      : undefined
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

/**
 * Mint new ingredient on blockchain
 * POST /api/ingredients/blockchain/mint
 * Body: { name: string, image: string, amount?: number, category?: string, description?: string }
 */
export const mintIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { name, image, amount = 1, category, description } = req.body;
  
  // Validate required fields
  if (!name || !image) {
    res.status(400).json({
      success: false,
      message: 'Name and image are required'
    });
    return;
  }
  
  // Check if signer is available
  if (!blockchainConnection.hasSigner()) {
    res.status(500).json({
      success: false,
      message: 'Server not configured for minting. MINTER_PRIVATE_KEY is required.'
    });
    return;
  }
  
  // Initialize blockchain connection
  if (!blockchainConnection.isReady()) {
    res.status(503).json({
      success: false,
      message: 'Blockchain connection not available'
    });
    return;
  }
  
  try {
    const contractAddress = blockchainConnection.getERC1155Address();
    
    // Get contract with signer (reuses existing signer from connection)
    const contract = blockchainConnection.createContractWithSigner(
      contractAddress,
      [
        'function publicMint(uint256 id, uint256 amount) payable returns (bool)',
        'function tokenPrices(uint256 id) view returns (uint256)',
        'function totalSupply(uint256 id) view returns (uint256)',
        'function exists(uint256 id) view returns (bool)'
      ]
    );
    
    // Get next token ID from counter
    const counter = await getTokenCounter(contractAddress);
    let tokenId = counter.lastTokenId + 1;
    
    console.log(`📊 Counter shows last token ID: ${counter.lastTokenId}, trying ID: ${tokenId}`);
    console.log(`🔍 Verifying token ID ${tokenId} on blockchain...`);
    
    // Verify token doesn't exist on blockchain and find next available if needed
    const maxAttempts = 1000;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const exists = await contract['exists']?.(tokenId);
        if (!exists) {
          console.log(`✅ Token ID ${tokenId} is available (verified on blockchain)`);
          break;
        }
        console.log(`   Token ID ${tokenId}: EXISTS on blockchain, checking next...`);
        tokenId++;
        attempts++;
      } catch (error) {
        console.error(`⚠️  Error checking token ${tokenId}:`, error);
        // If check fails, use current ID and break
        break;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error(`Could not find available token ID after ${maxAttempts} attempts`);
    }
    
    // Update counter with the token ID we're about to use
    await TokenCounter.findOneAndUpdate(
      { contractAddress: contractAddress.toLowerCase() },
      { lastTokenId: tokenId },
      { upsert: true }
    );
    console.log(`📊 Counter updated to ${tokenId}`);
    
    console.log(`🪙 Minting token ID ${tokenId} with amount ${amount}...`);
    
    // Get token price (if any)
    let price = ethers.parseEther('0');
    try {
      const tokenPrice = await contract['tokenPrices']?.(tokenId);
      if (tokenPrice) {
        price = tokenPrice * BigInt(amount);
      }
    } catch (error) {
      console.log('No price set for token, minting for free');
    }
    
    // Mint the token
    const tx = await contract['publicMint']?.(tokenId, amount, { value: price });
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Token minted! Block: ${receipt.blockNumber}`);
    
    // Prepare metadata
    const metadata = {
      name,
      image,
      category: category || 'Uncategorized',
      description: description || `${name} ingredient`,
      tokenId,
      contractAddress
    };
    
    // Store in database
    const ingredientData = await IngredientData.create({ metadata });
    
    const ingredient = await Ingredient.create({
      tokenContract: contractAddress,
      tokenId,
      ingredientData: ingredientData._id
    });
    
    // Populate the ingredient data
    await ingredient.populate('ingredientData');
    
    res.status(201).json({
      success: true,
      message: 'Ingredient minted successfully',
      data: {
        ingredient: {
          _id: ingredient._id,
          tokenContract: ingredient.tokenContract,
          tokenId: ingredient.tokenId,
          metadata: ingredientData.metadata
        },
        transaction: {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
          from: blockchainConnection.getSignerAddress(),
          to: contractAddress
        }
      }
    });
  } catch (error) {
    console.error('Failed to mint ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mint ingredient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

