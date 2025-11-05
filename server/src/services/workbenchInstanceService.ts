import { ethers } from 'ethers';
import { blockchainConnection } from '../config/blockchain';

export class WorkbenchInstanceService {
  private contract: ethers.Contract;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized');
    }
    
    if (!blockchainConnection.hasWorkbenchInstanceContract()) {
      throw new Error('WorkbenchInstance contract not configured');
    }
    
    this.contract = blockchainConnection.getWorkbenchInstanceContract();
  }

  /**
   * Create a new recipe on the blockchain
   * @param ingredients - Array of ingredients
   * @param outputTokenId - Output token ID
   * @param outputAmount - Output amount
   * @param requiresExactPattern - Whether exact pattern matching is required
   * @param name - Recipe name
   * @returns Transaction response
   */
  async createRecipe(
    ingredients: Array<{ tokenId: number; amount: number; position: number }>,
    outputTokenId: number,
    outputAmount: number,
    requiresExactPattern: boolean,
    name: string
  ): Promise<any> {
    try {
      console.log(`🍳 Creating recipe "${name}" with ${ingredients.length} ingredients...`);
      
      // Sort ingredients by position for better visualization
      const sortedIngredients = [...ingredients].sort((a, b) => a.position - b.position);
      
      console.log(`📋 Recipe ingredients:`);
      sortedIngredients.forEach(ing => {
        const row = Math.floor(ing.position / 3);
        const col = ing.position % 3;
        console.log(`  Position [${row},${col}] (${ing.position}): Token ${ing.tokenId} × ${ing.amount}`);
      });
      
      // Check if signer is available
      if (!blockchainConnection.hasSigner()) {
        throw new Error('Signer not initialized. MINTER_PRIVATE_KEY required for write operations.');
      }
      
      // Get contract instance with signer (reuses existing signer from connection)
      const contractAddress = blockchainConnection.getWorkbenchInstanceAddress();
      const contract = blockchainConnection.createContractWithSigner(
        contractAddress,
        [
          'function createRecipe(tuple(uint256 tokenId, uint256 amount, uint8 position)[] ingredients, uint256 outputTokenId, uint256 outputAmount, bool requiresExactPattern, string memory name) external returns (uint256 recipeId)'
        ]
      );
      
      // Create the recipe (send only actual ingredients, not empty positions)
      const tx = await contract['createRecipe']?.(
        ingredients,
        outputTokenId,
        outputAmount,
        requiresExactPattern,
        name
      );
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Recipe created! Block: ${receipt.blockNumber}`);
      
      // Extract recipe ID from transaction receipt
      const recipeCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RecipeCreated';
        } catch {
          return false;
        }
      });
      
      let recipeId: number | null = null;
      if (recipeCreatedEvent) {
        const parsed = contract.interface.parseLog(recipeCreatedEvent);
        recipeId = Number(parsed?.args['recipeId']);
      }
      
      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        recipeId: recipeId,
        transaction: tx,
        receipt: receipt
      };
    } catch (error) {
      console.error(`Failed to create recipe "${name}":`, error);
      throw new Error(`Recipe creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listen for RecipeCreated events
   * @param callback - Callback function to handle events
   */
  onRecipeCreated(callback: (recipeId: bigint, name: string, outputTokenId: bigint, outputAmount: bigint, event: any) => void): void {
    this.contract.on('RecipeCreated', callback);
  }

  /**
   * Listen for ItemCrafted events
   * @param callback - Callback function to handle events
   */
  onItemCrafted(callback: (recipeId: bigint, crafter: string, outputTokenId: bigint, amount: bigint, event: any) => void): void {
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
    return blockchainConnection.getWorkbenchInstanceAddress();
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return blockchainConnection.getProvider();
  }
}

export default WorkbenchInstanceService;
