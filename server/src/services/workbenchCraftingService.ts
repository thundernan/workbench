import { ethers } from 'ethers';
import { blockchainConnection } from '../config/blockchain';

/**
 * Workbench Crafting Service
 * Handles interactions with the Workbench smart contract for crafting operations
 * Uses singleton blockchain connection initialized on server start
 * Based on technical documentation specifications
 */
export class WorkbenchCraftingService {
  private contract: ethers.Contract;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized. Make sure server initialization completed successfully.');
    }
    if (!blockchainConnection.hasWorkbenchContract()) {
      throw new Error('Workbench contract not configured. Set WORKBENCH_CONTRACT_ADDRESS environment variable.');
    }
    this.contract = blockchainConnection.getWorkbenchContract();
  }

  /**
   * Check if a user can craft a specific recipe
   * @param recipeId - Recipe ID
   * @param crafterAddress - Crafter's wallet address
   * @returns True if the crafter has all required ingredients and approvals
   */
  async canCraft(recipeId: number, crafterAddress: string): Promise<boolean> {
    try {
      const canCraft = await this.contract['canCraft']?.(recipeId, crafterAddress);
      if (canCraft === undefined) {
        throw new Error('Failed to call canCraft');
      }
      return canCraft;
    } catch (error) {
      console.error(`Failed to check if can craft recipe ${recipeId}:`, error);
      throw new Error(`Failed to check crafting eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recipe details from blockchain
   * @param recipeId - Recipe ID
   * @returns Recipe details
   */
  async getRecipe(recipeId: number): Promise<{
    ingredients: Array<{
      tokenContract: string;
      tokenId: string;
      amount: string;
      position: number;
    }>;
    outputContract: string;
    outputTokenId: string;
    outputAmount: string;
    requiresExactPattern: boolean;
    active: boolean;
    name: string;
  }> {
    try {
      const recipe = await this.contract['getRecipe']?.(recipeId);
      if (!recipe) {
        throw new Error('Failed to call getRecipe');
      }

      return {
        ingredients: recipe.ingredients.map((ing: any) => ({
          tokenContract: ing.tokenContract,
          tokenId: ing.tokenId.toString(),
          amount: ing.amount.toString(),
          position: Number(ing.position)
        })),
        outputContract: recipe.outputContract,
        outputTokenId: recipe.outputTokenId.toString(),
        outputAmount: recipe.outputAmount.toString(),
        requiresExactPattern: recipe.requiresExactPattern,
        active: recipe.active,
        name: recipe.name
      };
    } catch (error) {
      console.error(`Failed to get recipe ${recipeId}:`, error);
      throw new Error(`Failed to fetch recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active recipe IDs
   * @returns Array of active recipe IDs
   */
  async getActiveRecipeIds(): Promise<string[]> {
    try {
      const recipeIds = await this.contract['getActiveRecipeIds']?.();
      if (!recipeIds) {
        throw new Error('Failed to call getActiveRecipeIds');
      }
      return recipeIds.map((id: bigint) => id.toString());
    } catch (error) {
      console.error('Failed to get active recipe IDs:', error);
      throw new Error(`Failed to fetch active recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active recipes with details
   * @returns Array of active recipes
   */
  async getActiveRecipes(): Promise<Array<{
    id: string;
    ingredients: Array<{
      tokenContract: string;
      tokenId: string;
      amount: string;
      position: number;
    }>;
    outputContract: string;
    outputTokenId: string;
    outputAmount: string;
    requiresExactPattern: boolean;
    active: boolean;
    name: string;
  }>> {
    try {
      const recipeIds = await this.getActiveRecipeIds();
      
      const recipes = await Promise.all(
        recipeIds.map(async (id) => {
          const recipe = await this.getRecipe(Number(id));
          return {
            id,
            ...recipe
          };
        })
      );

      return recipes;
    } catch (error) {
      console.error('Failed to get active recipes:', error);
      throw new Error(`Failed to fetch active recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listen for ItemCrafted events
   * @param callback - Callback function to handle events
   */
  onItemCrafted(callback: (
    recipeId: bigint,
    crafter: string,
    outputContract: string,
    outputTokenId: bigint,
    amount: bigint,
    event: any
  ) => void): void {
    this.contract.on('ItemCrafted', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return blockchainConnection.getWorkbenchAddress();
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return blockchainConnection.getProvider();
  }
}

export default WorkbenchCraftingService;

