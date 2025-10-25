"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainListener = void 0;
const ethers_1 = require("ethers");
const Recipe_1 = __importDefault(require("../models/Recipe"));
class BlockchainListener {
    constructor(rpcUrl, contractAddress, contractABI) {
        this.isListening = false;
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.contract = new ethers_1.ethers.Contract(contractAddress, contractABI, this.provider);
    }
    async startListening() {
        if (this.isListening) {
            console.log('⚠️  Blockchain listener is already running');
            return;
        }
        try {
            console.log('🔗 Starting blockchain event listener...');
            this.contract.on('RecipeCreated', async (recipeId, resultIngredientId, ingredients, positions, amounts, event) => {
                console.log('📝 RecipeCreated event detected:', {
                    recipeId: recipeId.toString(),
                    resultIngredientId: resultIngredientId.toString(),
                    ingredients: ingredients.map((id) => id.toString()),
                    positions: positions.map((pos) => pos.toString()),
                    amounts: amounts.map((amount) => amount.toString()),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                });
                await this.handleRecipeCreated(recipeId.toString(), resultIngredientId.toString(), ingredients.map((id) => id.toString()), positions.map((pos) => parseInt(pos.toString())), amounts.map((amount) => parseInt(amount.toString())));
            });
            this.isListening = true;
            console.log('✅ Blockchain event listener started successfully');
        }
        catch (error) {
            console.error('❌ Failed to start blockchain listener:', error);
            throw error;
        }
    }
    async stopListening() {
        if (!this.isListening) {
            console.log('⚠️  Blockchain listener is not running');
            return;
        }
        try {
            console.log('🛑 Stopping blockchain event listener...');
            this.contract.removeAllListeners('RecipeCreated');
            this.isListening = false;
            console.log('✅ Blockchain event listener stopped successfully');
        }
        catch (error) {
            console.error('❌ Failed to stop blockchain listener:', error);
            throw error;
        }
    }
    async handleRecipeCreated(recipeId, resultIngredientId, ingredientIds, positions, amounts) {
        try {
            console.log('🔄 Processing RecipeCreated event...');
            const contractAddress = this.contract.target;
            if (!contractAddress) {
                throw new Error('Contract address is undefined');
            }
            let recipe = await Recipe_1.default.findOne({
                blockchainRecipeId: recipeId
            });
            if (!recipe) {
                const recipeIngredients = [];
                for (let i = 0; i < ingredientIds.length; i++) {
                    const ingredientId = ingredientIds[i];
                    if (!ingredientId)
                        continue;
                    const position = positions[i] ?? 0;
                    const amount = amounts[i] ?? 1;
                    recipeIngredients.push({
                        tokenContract: contractAddress,
                        tokenId: parseInt(ingredientId),
                        amount: amount,
                        position: position
                    });
                }
                const newRecipe = {
                    blockchainRecipeId: recipeId,
                    resultTokenContract: contractAddress,
                    resultTokenId: parseInt(resultIngredientId),
                    resultAmount: 1,
                    ingredients: recipeIngredients,
                    name: `Recipe ${recipeId}`,
                    description: `Recipe created from blockchain event ${recipeId}`,
                    category: 'blockchain',
                    difficulty: 1,
                    craftingTime: 0
                };
                recipe = await Recipe_1.default.create(newRecipe);
                console.log('✅ Created recipe:', recipe.name);
            }
            else {
                console.log('📝 Recipe already exists:', recipe.name);
            }
            console.log('✅ RecipeCreated event processed successfully');
        }
        catch (error) {
            console.error('❌ Failed to process RecipeCreated event:', error);
        }
    }
    isActive() {
        return this.isListening;
    }
    getContractAddress() {
        return this.contract.target;
    }
}
exports.BlockchainListener = BlockchainListener;
//# sourceMappingURL=blockchainListener.js.map