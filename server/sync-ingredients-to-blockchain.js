#!/usr/bin/env node

/**
 * Sync Database Ingredients to Blockchain
 * 
 * This script:
 * 1. Reads all ingredients from MongoDB
 * 2. Checks if each exists on blockchain
 * 3. Creates missing ingredients on blockchain
 * 4. Updates database with blockchain transaction info
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { ethers } = require('ethers');

// MongoDB Models
const IngredientSchema = new mongoose.Schema({
  tokenContract: { type: String, required: true },
  tokenId: { type: Number, required: true },
  ingredientData: { type: mongoose.Schema.Types.ObjectId, ref: 'IngredientData' },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  blockchainTx: String,
  blockchainBlock: Number,
  blockchainCreated: Boolean
});

const IngredientDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const Ingredient = mongoose.model('Ingredient', IngredientSchema);
const IngredientData = mongoose.model('IngredientData', IngredientDataSchema);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workbench';
const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const ERC1155_CONTRACT_ADDRESS = process.env.ERC1155_CONTRACT_ADDRESS;
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY;

// Contract ABI (only what we need)
// Note: Using 2-parameter createTokenType as deployed contract doesn't support price parameter
const ERC1155_ABI = [
  'function createTokenType(uint256 id, string memory name) external',
  'function tokenNames(uint256 id) view returns (string)',
  'function tokenPrices(uint256 id) view returns (uint256)',
  'function exists(uint256 id) view returns (bool)',
  'event TokenCreated(uint256 indexed id, string name, uint256 price)'
];

// Statistics
const stats = {
  total: 0,
  alreadyExists: 0,
  created: 0,
  failed: 0,
  skipped: 0
};

// Check if ingredient exists on blockchain
async function checkIngredientExists(contract, tokenId) {
  try {
    // Try to get token name - if it exists, name will be set
    const name = await contract.tokenNames(tokenId);
    const exists = name && name.length > 0;
    console.log(`   🔍 Blockchain check: Token ${tokenId} ${exists ? `exists ("${name}")` : 'does not exist'}`);
    return exists;
  } catch (error) {
    // Token doesn't exist or error reading
    console.log(`   🔍 Blockchain check: Token ${tokenId} does not exist (error: ${error.message})`);
    return false;
  }
}

// Create ingredient on blockchain
async function createIngredientOnBlockchain(contract, tokenId, name, price = 0) {
  try {
    console.log(`\n🔨 Creating token ID ${tokenId}: "${name}"`);
    console.log(`   Price: ${ethers.formatEther(price)} ETH (stored in metadata only)`);
    
    // Create token type (2-parameter version - contract doesn't support price parameter)
    // Price is stored in database metadata only
    const tx = await contract.createTokenType(tokenId, name);
    console.log(`   📤 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
    
    return {
      success: true,
      hash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error(`   ❌ Failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main sync function
async function syncIngredientsToBlockchain() {
  console.log('🚀 Ingredient Blockchain Sync Script\n');
  console.log('=' .repeat(60));
  
  // Validate configuration
  if (!BLOCKCHAIN_RPC_URL) {
    console.error('❌ BLOCKCHAIN_RPC_URL not set in .env');
    process.exit(1);
  }
  
  if (!ERC1155_CONTRACT_ADDRESS) {
    console.error('❌ ERC1155_CONTRACT_ADDRESS not set in .env');
    process.exit(1);
  }
  
  if (!MINTER_PRIVATE_KEY) {
    console.error('❌ MINTER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Connect to blockchain
    console.log('⛓️  Connecting to blockchain...');
    console.log(`   RPC: ${BLOCKCHAIN_RPC_URL}`);
    console.log(`   Contract: ${ERC1155_CONTRACT_ADDRESS}`);
    
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`   Network: ${network.name} (chainId: ${network.chainId})`);
    
    const signer = new ethers.Wallet(MINTER_PRIVATE_KEY, provider);
    console.log(`   Signer: ${signer.address}`);
    
    const contract = new ethers.Contract(
      ERC1155_CONTRACT_ADDRESS,
      ERC1155_ABI,
      signer
    );
    console.log('✅ Connected to blockchain\n');
    
    // Get all ingredients from database
    console.log('📊 Loading ingredients from database...');
    const ingredients = await Ingredient.find({}).populate('ingredientData');
    stats.total = ingredients.length;
    
    console.log(`   Found ${stats.total} ingredients in database\n`);
    console.log('=' .repeat(60));
    
    if (stats.total === 0) {
      console.log('\n⚠️  No ingredients found in database');
      console.log('   Run this script after creating some ingredients');
      return;
    }
    
    // Process each ingredient
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      const ingredientData = ingredient.ingredientData;
      
      console.log(`\n[${i + 1}/${stats.total}] Processing Ingredient:`);
      console.log(`   Token ID: ${ingredient.tokenId}`);
      console.log(`   Name: ${ingredientData?.name || 'N/A'}`);
      console.log(`   Category: ${ingredientData?.category || 'N/A'}`);
      
      // Skip if no ingredient data
      if (!ingredientData || !ingredientData.name) {
        console.log('   ⚠️  Skipping: No ingredient data or name');
        stats.skipped++;
        continue;
      }
      
      // Check if already exists on blockchain
      const exists = await checkIngredientExists(contract, ingredient.tokenId);
      
      if (exists) {
        console.log('   ✅ Already exists on blockchain');
        stats.alreadyExists++;
        
        // Update database to mark as blockchain-created
        if (!ingredient.blockchainCreated) {
          await Ingredient.updateOne(
            { _id: ingredient._id },
            { blockchainCreated: true }
          );
          console.log('   📝 Updated database flag');
        }
        continue;
      }
      
      console.log('   ⚠️  Does not exist on blockchain, will create...');
      
      // Create on blockchain
      const price = ingredient.metadata?.price || '0';
      const result = await createIngredientOnBlockchain(
        contract,
        ingredient.tokenId,
        ingredientData.name,
        BigInt(price)
      );
      
      if (result.success) {
        stats.created++;
        
        // Update database with blockchain info
        await Ingredient.updateOne(
          { _id: ingredient._id },
          {
            blockchainTx: result.hash,
            blockchainBlock: result.blockNumber,
            blockchainCreated: true,
            updatedAt: new Date()
          }
        );
        console.log('   📝 Updated database with blockchain info');
      } else {
        stats.failed++;
      }
      
      // Wait a bit between transactions to avoid overwhelming the RPC
      if (i < ingredients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total ingredients:        ${stats.total}`);
    console.log(`Already on blockchain:    ${stats.alreadyExists}`);
    console.log(`Successfully created:     ${stats.created}`);
    console.log(`Failed:                   ${stats.failed}`);
    console.log(`Skipped (no data):        ${stats.skipped}`);
    console.log('='.repeat(60));
    
    if (stats.created > 0) {
      console.log(`\n✅ Successfully synced ${stats.created} ingredients to blockchain!`);
    }
    
    if (stats.failed > 0) {
      console.log(`\n⚠️  ${stats.failed} ingredients failed to sync`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
syncIngredientsToBlockchain()
  .then(() => {
    console.log('\n✅ Sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });

