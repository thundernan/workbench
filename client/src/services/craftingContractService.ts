import { ethers } from 'ethers';
import type { BlockchainRecipe, BlockchainToken } from '@/types';

/**
 * ABI for the Workbench Crafting Contract
 * Update this with your actual contract ABI
 */
const CRAFTING_CONTRACT_ABI = [
  // craft function
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "tokenContract",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "position",
            "type": "uint8"
          }
        ],
        "internalType": "struct Ingredient[]",
        "name": "ingredients",
        "type": "tuple[]"
      }
    ],
    "name": "craft",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getCraftingFee function (if exists)
  {
    "inputs": [],
    "name": "getCraftingFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // balanceOf for ERC1155 (checking user's token balance)
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Crafting Contract Service
 */
export class CraftingContractService {
  private contractAddress: string;
  private tokenContract: string;
  
  constructor(contractAddress: string, tokenContract: string) {
    this.contractAddress = contractAddress;
    this.tokenContract = tokenContract;
  }

  /**
   * Check if user has enough tokens to craft a recipe
   */
  async checkIngredients(
    userAddress: string,
    recipe: BlockchainRecipe,
    provider: ethers.Provider
  ): Promise<{
    canCraft: boolean;
    missingIngredients: Array<{
      tokenContract: string;
      tokenId: number;
      required: number;
      available: number;
    }>;
  }> {
    const missingIngredients: Array<{
      tokenContract: string;
      tokenId: number;
      required: number;
      available: number;
    }> = [];

    try {
      // Check each ingredient
      for (const ingredient of recipe.ingredients) {
        const tokenContractInstance = new ethers.Contract(
          ingredient.tokenContract,
          CRAFTING_CONTRACT_ABI,
          provider
        );

        // Get user's balance
        const balance = await tokenContractInstance.balanceOf(
          userAddress,
          ingredient.tokenId
        );

        const available = Number(balance);
        const required = ingredient.amount;

        if (available < required) {
          missingIngredients.push({
            tokenContract: ingredient.tokenContract,
            tokenId: ingredient.tokenId,
            required,
            available,
          });
        }
      }

      return {
        canCraft: missingIngredients.length === 0,
        missingIngredients,
      };
    } catch (error: any) {
      console.error('Error checking ingredients:', error);
      throw new Error(`Failed to check ingredients: ${error.message}`);
    }
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(
    userAddress: string,
    tokenContract: string,
    tokenId: number,
    provider: ethers.Provider
  ): Promise<number> {
    try {
      const contract = new ethers.Contract(
        tokenContract,
        CRAFTING_CONTRACT_ABI,
        provider
      );

      const balance = await contract.balanceOf(userAddress, tokenId);
      return Number(balance);
    } catch (error: any) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Execute crafting transaction
   */
  async craft(
    recipe: BlockchainRecipe,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        CRAFTING_CONTRACT_ABI,
        signer
      );

      // Prepare ingredients for the contract call
      const ingredients = recipe.ingredients.map(ing => ({
        tokenContract: ing.tokenContract,
        tokenId: ing.tokenId,
        amount: ing.amount,
        position: ing.position,
      }));

      // Get crafting fee (if applicable)
      let craftingFee = BigInt(0);
      try {
        craftingFee = await contract.getCraftingFee();
      } catch {
        // No crafting fee or function doesn't exist
      }

      // Execute craft transaction
      const tx = await contract.craft(
        recipe.blockchainRecipeId,
        ingredients,
        {
          value: craftingFee,
        }
      );

      return tx;
    } catch (error: any) {
      console.error('Error executing craft:', error);
      
      // Parse error messages
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message.includes('Invalid recipe')) {
        throw new Error('Invalid recipe');
      } else if (error.message.includes('Insufficient ingredients')) {
        throw new Error('You don\'t have enough ingredients');
      }
      
      throw new Error(`Crafting failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for crafting
   */
  async estimateCraftGas(
    recipe: BlockchainRecipe,
    signer: ethers.Signer
  ): Promise<bigint> {
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        CRAFTING_CONTRACT_ABI,
        signer
      );

      const ingredients = recipe.ingredients.map(ing => ({
        tokenContract: ing.tokenContract,
        tokenId: ing.tokenId,
        amount: ing.amount,
        position: ing.position,
      }));

      let craftingFee = BigInt(0);
      try {
        craftingFee = await contract.getCraftingFee();
      } catch {
        // No crafting fee
      }

      const gasEstimate = await contract.craft.estimateGas(
        recipe.blockchainRecipeId,
        ingredients,
        {
          value: craftingFee,
        }
      );

      return gasEstimate;
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      // Return a default gas limit
      return BigInt(300000);
    }
  }

  /**
   * Get crafting fee
   */
  async getCraftingFee(provider: ethers.Provider): Promise<bigint> {
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        CRAFTING_CONTRACT_ABI,
        provider
      );

      const fee = await contract.getCraftingFee();
      return fee;
    } catch (error) {
      // No crafting fee or function doesn't exist
      return BigInt(0);
    }
  }

  /**
   * Convert grid position to 0-8 index
   */
  static gridToPosition(row: number, col: number): number {
    return row * 3 + col;
  }

  /**
   * Convert position (0-8) to grid coordinates
   */
  static positionToGrid(position: number): { row: number; col: number } {
    return {
      row: Math.floor(position / 3),
      col: position % 3,
    };
  }
}

/**
 * Get contract address from environment or default
 */
export function getContractAddress(): string {
  return import.meta.env.VITE_CRAFTING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
}

/**
 * Get token contract address from environment or default
 */
export function getTokenContractAddress(): string {
  return import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
}

/**
 * Default crafting contract service instance
 */
export const craftingService = new CraftingContractService(
  getContractAddress(),
  getTokenContractAddress()
);

export default craftingService;

