import { ethers } from 'ethers';
import Recipe from '../models/Recipe';
import { IRecipe } from '../types';

export class BlockchainListener {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isListening: boolean = false;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    contractABI: any[]
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(contractAddress, contractABI, this.provider);
  }

  /**
   * Start listening to blockchain events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  Blockchain listener is already running');
      return;
    }

    try {
      console.log('🔗 Starting blockchain event listener...');
      
      // Listen for RecipeCreated events only
      this.contract.on('RecipeCreated', async (recipeId, resultIngredientId, ingredients, positions, amounts, event) => {
        console.log('📝 RecipeCreated event detected:', {
          recipeId: recipeId.toString(),
          resultIngredientId: resultIngredientId.toString(),
          ingredients: ingredients.map((id: any) => id.toString()),
          positions: positions.map((pos: any) => pos.toString()),
          amounts: amounts.map((amount: any) => amount.toString()),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });

        await this.handleRecipeCreated(
          recipeId.toString(),
          resultIngredientId.toString(),
          ingredients.map((id: any) => id.toString()),
          positions.map((pos: any) => parseInt(pos.toString())),
          amounts.map((amount: any) => parseInt(amount.toString()))
        );
      });

      this.isListening = true;
      console.log('✅ Blockchain event listener started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start blockchain listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to blockchain events
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.log('⚠️  Blockchain listener is not running');
      return;
    }

    try {
      console.log('🛑 Stopping blockchain event listener...');
      
      // Remove RecipeCreated listeners
      this.contract.removeAllListeners('RecipeCreated');
      
      this.isListening = false;
      console.log('✅ Blockchain event listener stopped successfully');
      
    } catch (error) {
      console.error('❌ Failed to stop blockchain listener:', error);
      throw error;
    }
  }

  /**
   * Handle RecipeCreated event
   */
  private async handleRecipeCreated(
    recipeId: string,
    resultIngredientId: string,
    ingredientIds: string[],
    positions: number[],
    amounts: number[]
  ): Promise<void> {
    try {
      console.log('🔄 Processing RecipeCreated event...');

      const contractAddress = this.contract.target as string;
      if (!contractAddress) {
        throw new Error('Contract address is undefined');
      }

      // Check if recipe already exists
      let recipe = await Recipe.findOne({ 
        blockchainRecipeId: recipeId
      });

      if (!recipe) {
        // Create recipe ingredients from blockchain data
        const recipeIngredients = [];
        for (let i = 0; i < ingredientIds.length; i++) {
          const ingredientId = ingredientIds[i];
          if (!ingredientId) continue; // Skip if ingredientId is undefined
          
          const position = positions[i] ?? 0;
          const amount = amounts[i] ?? 1;

          recipeIngredients.push({
            tokenContract: contractAddress,
            tokenId: parseInt(ingredientId),
            amount: amount,
            position: position
          });
        }

        // Create new recipe
        const newRecipe: Partial<IRecipe> = {
          blockchainRecipeId: recipeId,
          resultTokenContract: contractAddress,
          resultTokenId: parseInt(resultIngredientId),
          resultAmount: 1, // Result amount is always 1
          ingredients: recipeIngredients,
          name: `Recipe ${recipeId}`,
          description: `Recipe created from blockchain event ${recipeId}`,
          category: 'blockchain',
          difficulty: 1,
          craftingTime: 0
        };

        recipe = await Recipe.create(newRecipe);
        console.log('✅ Created recipe:', recipe.name);
      } else {
        console.log('📝 Recipe already exists:', recipe.name);
      }

      console.log('✅ RecipeCreated event processed successfully');
      
    } catch (error) {
      console.error('❌ Failed to process RecipeCreated event:', error);
    }
  }

  /**
   * Get current listening status
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contract.target as string;
  }
}
