import { ethers } from 'ethers';
import type { BlockchainRecipe } from '@/types';
import { IRecipe } from '@/stores/recipes';

export interface CraftTransactionResult {
  transaction: ethers.ContractTransactionResponse;
  receipt: ethers.TransactionReceipt;
  events: ethers.LogDescription[];
}
/**
 * ABI for the Workbench Crafting Contract
 * Update this with your actual contract ABI
 */
const CRAFTING_CONTRACT_ABI = [
  // craftWithGrid (exact pattern crafting)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[9]",
        "name": "tokenIds",
        "type": "uint256[9]"
      },
      {
        "internalType": "uint256[9]",
        "name": "amounts",
        "type": "uint256[9]"
      }
    ],
    "name": "craftWithGrid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "canCraft",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasIngredients",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[9]",
        "name": "tokenIds",
        "type": "uint256[9]"
      },
      {
        "internalType": "uint256[9]",
        "name": "amounts",
        "type": "uint256[9]"
      }
    ],
    "name": "validateGrid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // craftWithoutGrid (non-pattern crafting)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      }
    ],
    "name": "craftWithoutGrid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getRecipe view helper
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      }
    ],
    "name": "getRecipe",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "outputTokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "outputAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "requiresExactPattern",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "ingredientCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getRecipeIngredients helper
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      }
    ],
    "name": "getRecipeIngredients",
    "outputs": [
      {
        "components": [
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
    "stateMutability": "view",
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

const ERC1155_ABI = [
  'function isApprovedForAll(address account,address operator) view returns (bool)',
  'function setApprovalForAll(address operator,bool approved)'
];

/**
 * Crafting Contract Service
 */
export class CraftingContractService {
  private contractAddress: string;
  
  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
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

  private async ensureApproval(
    tokenContract: string,
    owner: string,
    operator: string,
    signer: ethers.Signer
  ): Promise<void> {
    if (!tokenContract || tokenContract === '0x0000000000000000000000000000000000000000') {
      throw new Error('Token contract address is not configured.');
    }

    const erc1155 = new ethers.Contract(tokenContract, ERC1155_ABI, signer);
    let approved: boolean;
    try {
      approved = await erc1155.isApprovedForAll(owner, operator);
    } catch (error) {
      console.error('Failed to check ERC1155 approval:', error);
      throw new Error('Failed to verify token approval. Ensure token contract address is correct and accessible.');
    }
    if (!approved) {
      try {
        const approvalTx = await erc1155.setApprovalForAll(operator, true);
        await approvalTx.wait();
      } catch (error) {
        console.error('Failed to set ERC1155 approval:', error);
        throw new Error('Approval transaction failed. Please approve the workbench contract for your ingredient tokens.');
      }
    }
  }

  /**
   * Execute crafting transaction
   */
  async craft(
    recipe: IRecipe,
    signer: ethers.Signer
  ): Promise<CraftTransactionResult> {
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        CRAFTING_CONTRACT_ABI,
        signer
      );

      const availableFunctions = contract.interface.fragments
        .filter(fragment => fragment.type === 'function')
        .map(fragment => fragment.format());

      if (recipe.outputTokenId === null || recipe.outputTokenId === undefined) {
        throw new Error('Recipe is missing outputTokenId');
      }

      if (recipe.blockchainRecipeId === null || recipe.blockchainRecipeId === undefined) {
        throw new Error('Recipe is missing blockchainRecipeId');
      }

      const recipeIdBigInt = BigInt(recipe.blockchainRecipeId);
      const signerAddress = await signer.getAddress();
      const tokenContractAddress = getTokenContractAddress();

      await this.ensureApproval(tokenContractAddress, signerAddress, this.contractAddress, signer);

      // Prepare ingredients for the contract call
      const tokenIds = Array<bigint>(9).fill(0n);
      const amounts = Array<bigint>(9).fill(0n);

      recipe.ingredients.forEach(ing => {
        const position = Number(ing.position ?? 0);
        if (!Number.isInteger(position) || position < 0 || position > 8) {
          throw new Error(`Invalid ingredient position: ${ing.position}`);
        }

        const tokenId = BigInt(ing.tokenId);
        const amount = BigInt(ing.amount);

        tokenIds[position] = tokenId;
        amounts[position] = amount;
      });

      // Get crafting fee (if applicable)
      let craftingFee = BigInt(0);
      try {
        craftingFee = await contract.getCraftingFee();
      } catch {
        // No crafting fee or function doesn't exist
      }

      const contractAny = contract as unknown as Record<string, any>;

      if (recipe.requiresExactPattern) {
        const isValidGrid = await contract.validateGrid(
          recipeIdBigInt,
          tokenIds,
          amounts
        );
        if (!isValidGrid) {
          throw new Error('Crafting grid does not match the recipe pattern.');
        }
      }

      const hasIngredients = await contract.canCraft(recipeIdBigInt, signerAddress);
      if (!hasIngredients) {
        throw new Error('Missing required ingredients or approvals for this recipe.');
      }

      let tx: ethers.ContractTransactionResponse;
      if (recipe.requiresExactPattern) {
        tx = await contractAny['craftWithGrid'](
          recipeIdBigInt,
          tokenIds,
          amounts
        );
      } else {
        tx = await contractAny['craftWithoutGrid'](
          recipeIdBigInt,
          {
            value: craftingFee,
          }
        );
      }

      let receipt: ethers.TransactionReceipt | null = null;
      const provider = signer.provider ?? (contract.runner && 'provider' in contract.runner ? (contract.runner as any).provider : null);

      try {
        receipt = await tx.wait();
      } catch (waitError: any) {
        const errorMessage =
          waitError?.info?.error?.message ||
          waitError?.error?.message ||
          waitError?.message ||
          '';

        if (errorMessage.includes('already known') || errorMessage.includes('replacement transaction underpriced')) {
          if (provider && typeof provider.waitForTransaction === 'function') {
            receipt = await provider.waitForTransaction(tx.hash, 1);
          } else if (provider && typeof provider.getTransactionReceipt === 'function') {
            receipt = await provider.getTransactionReceipt(tx.hash);
          }
        } else {
          throw waitError;
        }
      }

      if (!receipt) {
        throw new Error('Craft transaction confirmed but no receipt returned.');
      }

      const contractInterface = contract.interface;
      const craftedEvents: ethers.LogDescription[] = [];

      for (const log of receipt.logs) {
        try {
          const parsedLog = contractInterface.parseLog(log);
          if (parsedLog?.name === 'ItemCrafted') {
            craftedEvents.push(parsedLog);
          }
        } catch {
          // Ignore logs that do not belong to this contract/interface
        }
      }

      return {
        transaction: tx,
        receipt,
        events: craftedEvents
      };
    } catch (error: any) {
      console.error('Error executing craft:', error);
      
      // Parse error messages
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === -32002 || error.message.includes('already pending')) {
        throw new Error('Wallet already has a pending signature request. Please confirm or reject the previous transaction in your wallet, then try again.');
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
      const tokenContractAddress = getTokenContractAddress();
      const signerAddress = await signer.getAddress();
      await this.ensureApproval(tokenContractAddress, signerAddress, this.contractAddress, signer);

      const contract = new ethers.Contract(
        this.contractAddress,
        CRAFTING_CONTRACT_ABI,
        signer
      );

      if (recipe.blockchainRecipeId === null || recipe.blockchainRecipeId === undefined) {
        throw new Error('Recipe is missing blockchainRecipeId');
      }

      const tokenIds = Array<bigint>(9).fill(0n);
      const amounts = Array<bigint>(9).fill(0n);

      recipe.ingredients.forEach(ing => {
        const position = Number(ing.position ?? 0);
        if (!Number.isInteger(position) || position < 0 || position > 8) {
          throw new Error(`Invalid ingredient position: ${ing.position}`);
        }

        const tokenId = BigInt(ing.tokenId);
        const amount = BigInt(ing.amount);

        tokenIds[position] = tokenId;
        amounts[position] = amount;
      });

      let craftingFee = BigInt(0);
      try {
        craftingFee = await contract.getCraftingFee();
      } catch {
        // No crafting fee
      }

      const contractEstimateGas = contract.estimateGas as unknown as Record<string, any>;

      if (recipe.requiresExactPattern) {
        const isValidGrid = await contract.validateGrid(
          BigInt(recipe.blockchainRecipeId),
          tokenIds,
          amounts
        );
        if (!isValidGrid) {
          throw new Error('Crafting grid does not match the recipe pattern.');
        }
      }

      const hasIngredients = await contract.canCraft(
        BigInt(recipe.blockchainRecipeId),
        signerAddress
      );
      if (!hasIngredients) {
        throw new Error('Missing required ingredients or approvals for this recipe.');
      }

      let gasEstimate: bigint;
      if (recipe.requiresExactPattern) {
        gasEstimate = await contractEstimateGas['craftWithGrid'](
          BigInt(recipe.blockchainRecipeId),
          tokenIds,
          amounts,
          {
            value: craftingFee,
          }
        );
      } else {
        gasEstimate = await contractEstimateGas['craftWithoutGrid'](
          BigInt(recipe.blockchainRecipeId),
          {
            value: craftingFee,
          }
        );
      }

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
  return import.meta.env.VITE_WORKBENCH_INSTANCE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
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
  getContractAddress()
);

export default craftingService;

