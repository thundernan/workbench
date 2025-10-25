import { ethers, Contract } from 'ethers';
import { CONTRACTS } from '@/config/wallet';
import WORKBENCH_ABI from '@/abis/Workbench.json';

export interface Recipe {
  id: string;
  name: string;
  outputContract: string;
  outputTokenId: string;
  outputAmount: string;
  requiresExactPattern: boolean;
  active: boolean;
  ingredients: Ingredient[];
}

export interface Ingredient {
  tokenContract: string;
  tokenId: string;
  amount: string;
  position: number;
}

export class WorkbenchService {
  private contract: Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider || null;
    this.signer = signer || null;
    this.initializeContract();
  }

  private initializeContract() {
    if (this.signer) {
      this.contract = new Contract(CONTRACTS.workbench, WORKBENCH_ABI, this.signer);
    } else if (this.provider) {
      this.contract = new Contract(CONTRACTS.workbench, WORKBENCH_ABI, this.provider);
    }
  }

  updateProvider(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
    this.initializeContract();
  }

  /**
   * Get all active recipe IDs
   */
  async getActiveRecipeIds(): Promise<number[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const recipeIds = await this.contract.getActiveRecipeIds();
    return recipeIds.map((id: bigint) => Number(id));
  }

  /**
   * Get recipe details by ID
   */
  async getRecipe(recipeId: number): Promise<Recipe> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const recipe = await this.contract.getRecipe(recipeId);
    const ingredients = await this.contract.getRecipeIngredients(recipeId);
    
    return {
      id: recipeId.toString(),
      name: recipe.name,
      outputContract: recipe.outputContract,
      outputTokenId: recipe.outputTokenId.toString(),
      outputAmount: recipe.outputAmount.toString(),
      requiresExactPattern: recipe.requiresExactPattern,
      active: recipe.active,
      ingredients: ingredients.map((ing: any) => ({
        tokenContract: ing.tokenContract,
        tokenId: ing.tokenId.toString(),
        amount: ing.amount.toString(),
        position: ing.position
      }))
    };
  }

  /**
   * Get all active recipes
   */
  async getActiveRecipes(): Promise<Recipe[]> {
    const recipeIds = await this.getActiveRecipeIds();
    const recipes = await Promise.all(
      recipeIds.map(id => this.getRecipe(id))
    );
    return recipes;
  }

  /**
   * Check if user can craft a recipe
   */
  async canCraft(recipeId: number, userAddress: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.canCraft(recipeId, userAddress);
  }

  /**
   * Craft item without grid (flexible pattern)
   */
  async craftWithoutGrid(recipeId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    // Estimate gas with 20% buffer
    const gasEstimate = await this.contract.craftWithoutGrid.estimateGas(recipeId);
    const gasLimit = gasEstimate * 120n / 100n;
    
    const tx = await this.contract.craftWithoutGrid(recipeId, { gasLimit });
    return tx;
  }

  /**
   * Craft item with exact grid pattern
   */
  async craftWithGrid(recipeId: number, grid: number[]): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    if (grid.length !== 9) {
      throw new Error('Grid must have exactly 9 positions');
    }
    
    // Convert to uint8[9] array
    const gridArray = grid.map(pos => Number(pos)) as [number, number, number, number, number, number, number, number, number];
    
    const tx = await this.contract.craftWithGrid(recipeId, gridArray);
    return tx;
  }

  /**
   * Get workbench's token balance
   */
  async getOutputTokenBalance(tokenContract: string, tokenId: number): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const balance = await this.contract.getOutputTokenBalance(tokenContract, tokenId);
    return Number(balance);
  }

  /**
   * Estimate gas for crafting
   */
  async estimateCraftGas(recipeId: number, useGrid: boolean = false, grid?: number[]): Promise<bigint> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      if (useGrid && grid) {
        if (grid.length !== 9) {
          throw new Error('Grid must have exactly 9 positions');
        }
        const gridArray = grid.map(pos => Number(pos)) as [number, number, number, number, number, number, number, number, number];
        return await this.contract.craftWithGrid.estimateGas(recipeId, gridArray);
      } else {
        return await this.contract.craftWithoutGrid.estimateGas(recipeId);
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return a default gas limit
      return BigInt(300000);
    }
  }

  /**
   * Listen for ItemCrafted events
   */
  onItemCrafted(callback: (
    recipeId: bigint,
    crafter: string,
    outputContract: string,
    outputTokenId: bigint,
    amount: bigint
  ) => void) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    this.contract.on('ItemCrafted', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
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

export default WorkbenchService;
