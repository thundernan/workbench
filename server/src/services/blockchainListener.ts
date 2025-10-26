import { ethers } from 'ethers';
import { IngredientBlockchainService } from './ingredientBlockchainService';
import { blockchainConnection } from '../config/blockchain';
import Ingredient from '../models/Ingredient';
import IngredientData from '../models/IngredientData';

export class BlockchainListener {
  private blockchainService: IngredientBlockchainService;
  private isListening: boolean = false;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized');
    }
    this.blockchainService = new IngredientBlockchainService();
  }

  /**
   * Start listening for blockchain events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Blockchain listener is already running');
      return;
    }

    console.log('🎧 Starting blockchain event listener...');

    // Listen for TokenCreated events
    this.blockchainService.onTokenCreated(async (id, name, event) => {
      try {
        console.log(`📡 TokenCreated event detected:`, {
          tokenId: id.toString(),
          name: name,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });

        await this.handleTokenCreatedEvent(Number(id), name, event);
      } catch (error) {
        console.error('❌ Error handling TokenCreated event:', error);
      }
    });

    // Listen for TransferBatch events
    this.blockchainService.onTransferBatch(async (operator, from, to, ids, values, event) => {
      try {
        console.log(`📡 TransferBatch event detected:`, {
          operator,
          from,
          to,
          tokenIds: ids.map(id => id.toString()),
          amounts: values.map(val => val.toString()),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });

        // Check if this is a batch mint event (from = 0x0)
        if (from === '0x0000000000000000000000000000000000000000') {
          for (let i = 0; i < ids.length; i++) {
            await this.handleTokenCreatedEvent(Number(ids[i]), `Token ${ids[i]}`, event);
          }
        }
      } catch (error) {
        console.error('❌ Error handling TransferBatch event:', error);
      }
    });

    this.isListening = true;
    console.log('✅ Blockchain event listener started successfully');
  }

  /**
   * Handle TokenCreated events by creating ingredients in database
   */
  private async handleTokenCreatedEvent(tokenId: number, name: string, event: any): Promise<void> {
    try {
      console.log(`🪙 Processing TokenCreated event for token ${tokenId} with name "${name}"...`);

      // Validate event has transaction hash
      if (!event.transactionHash) {
        console.error(`❌ No transaction hash in event for token ${tokenId}`);
        return;
      }

      // Get transaction details to extract data
      const provider = blockchainConnection.getProvider();
      const tx = await provider.getTransaction(event.transactionHash);
      
      if (!tx) {
        console.error(`❌ Could not fetch transaction ${event.transactionHash}`);
        return;
      }

      // Decode transaction data to get ingredientData._id
      let ingredientDataId: string | null = null;
      
      try {
        // The data parameter from the createTokenType function contains the ingredientData._id
        // We need to decode it from the transaction input data
        const contractAddress = blockchainConnection.getERC1155Address();
        const contract = new ethers.Contract(contractAddress, [
          'function createTokenType(uint256 id, string memory name) external'
        ], provider);
        
        // Decode the transaction data
        const decodedData = contract.interface.parseTransaction({ data: tx.data });
        
        if (decodedData && decodedData.args && decodedData.args.length >= 2) {
          // For createTokenType, we need to find the ingredientData._id from the transaction data
          // Since createTokenType doesn't have a data parameter, we'll need to find it differently
          // Let's check if there's additional data in the transaction
          if (tx.data && tx.data.length > 0) {
            // Try to extract ingredientData._id from transaction data
            // This might be stored in a different way
            console.log('📋 Transaction data length:', tx.data.length);
          }
        }
      } catch (decodeError) {
        console.error('❌ Failed to decode transaction data:', decodeError);
        return;
      }

      // For now, let's try to find the ingredientData by matching the token name
      // This is a temporary solution until we figure out how to pass ingredientData._id
      const ingredientData = await IngredientData.findOne({ 
        'metadata.name': name 
      });
      
      if (!ingredientData) {
        console.error(`❌ IngredientData with name "${name}" not found`);
        return;
      }

      ingredientDataId = (ingredientData._id as any).toString();
      console.log(`📋 Found IngredientData ID: ${ingredientDataId}`);

      // Check if ingredient already exists
      const existingIngredient = await Ingredient.findOne({ tokenId });
      if (existingIngredient) {
        console.log(`⚠️ Ingredient with tokenId ${tokenId} already exists, skipping creation`);
        return;
      }

      // Create the ingredient
      const ingredient = await Ingredient.create({
        tokenContract: blockchainConnection.getERC1155Address(),
        tokenId: tokenId,
        ingredientData: (ingredientData._id as any)
      });

      console.log(`✅ Ingredient created successfully:`, {
        ingredientId: ingredient._id,
        tokenId: tokenId,
        tokenContract: ingredient.tokenContract,
        ingredientDataId: ingredientDataId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });

    } catch (error) {
      console.error(`❌ Failed to handle TokenCreated event for token ${tokenId}:`, error);
    }
  }

  /**
   * Stop listening for events
   */
  stopListening(): void {
    if (!this.isListening) {
      console.log('⚠️ Blockchain listener is not running');
      return;
    }

    this.blockchainService.removeAllListeners();
    this.isListening = false;
    console.log('🛑 Blockchain event listener stopped');
  }

  /**
   * Check if listener is active
   */
  isActive(): boolean {
    return this.isListening;
  }
}

export default BlockchainListener;
