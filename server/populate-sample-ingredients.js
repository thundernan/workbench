#!/usr/bin/env node

/**
 * Populate Sample Ingredients
 * 
 * Creates sample ingredients in the database (without blockchain creation)
 * These can then be synced to blockchain using sync-ingredients-to-blockchain.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Models
const IngredientSchema = new mongoose.Schema({
  tokenContract: { type: String, required: true },
  tokenId: { type: Number, required: true },
  ingredientData: { type: mongoose.Schema.Types.ObjectId, ref: 'IngredientData' },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  blockchainCreated: { type: Boolean, default: false }
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
const ERC1155_CONTRACT_ADDRESS = process.env.ERC1155_CONTRACT_ADDRESS;

// Sample ingredients data
const sampleIngredients = [
  {
    tokenId: 1,
    name: 'Wood',
    description: 'Basic building material from trees',
    category: 'material',
    icon: '🪵',
    rarity: 'common',
    price: '0' // Free
  },
  {
    tokenId: 2,
    name: 'Stone',
    description: 'Hard mineral material',
    category: 'material',
    icon: '🪨',
    rarity: 'common',
    price: '0'
  },
  {
    tokenId: 3,
    name: 'Iron Ore',
    description: 'Raw iron extracted from mines',
    category: 'material',
    icon: '⛏️',
    rarity: 'uncommon',
    price: '100000000000000' // 0.0001 ETH
  },
  {
    tokenId: 4,
    name: 'Gold Ingot',
    description: 'Refined gold bar, valuable and rare',
    category: 'material',
    icon: '💰',
    rarity: 'rare',
    price: '1000000000000000' // 0.001 ETH
  },
  {
    tokenId: 5,
    name: 'Diamond',
    description: 'Precious gemstone, extremely rare',
    category: 'material',
    icon: '💎',
    rarity: 'legendary',
    price: '10000000000000000' // 0.01 ETH
  },
  {
    tokenId: 6,
    name: 'Iron Sword',
    description: 'A sturdy blade for combat',
    category: 'weapon',
    icon: '⚔️',
    rarity: 'uncommon',
    price: '500000000000000' // 0.0005 ETH
  },
  {
    tokenId: 7,
    name: 'Wooden Shield',
    description: 'Basic protection from attacks',
    category: 'armor',
    icon: '🛡️',
    rarity: 'common',
    price: '200000000000000' // 0.0002 ETH
  },
  {
    tokenId: 8,
    name: 'Health Potion',
    description: 'Restores health when consumed',
    category: 'consumable',
    icon: '🧪',
    rarity: 'common',
    price: '100000000000000' // 0.0001 ETH
  }
];

// Main populate function
async function populateSampleIngredients() {
  console.log('🌱 Populating Sample Ingredients\n');
  console.log('=' .repeat(60));
  
  if (!ERC1155_CONTRACT_ADDRESS) {
    console.error('❌ ERC1155_CONTRACT_ADDRESS not set in .env');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const sample of sampleIngredients) {
      console.log(`\n📝 Processing: ${sample.name}`);
      
      // Check if ingredient already exists
      const existing = await Ingredient.findOne({
        tokenContract: ERC1155_CONTRACT_ADDRESS,
        tokenId: sample.tokenId
      });
      
      if (existing) {
        console.log('   ⏭️  Already exists, skipping...');
        skipped++;
        continue;
      }
      
      // Create ingredient data
      const ingredientData = await IngredientData.create({
        name: sample.name,
        description: sample.description,
        category: sample.category,
        metadata: {
          icon: sample.icon,
          rarity: sample.rarity
        }
      });
      
      // Create ingredient
      await Ingredient.create({
        tokenContract: ERC1155_CONTRACT_ADDRESS,
        tokenId: sample.tokenId,
        ingredientData: ingredientData._id,
        metadata: {
          name: sample.name,
          description: sample.description,
          category: sample.category,
          icon: sample.icon,
          rarity: sample.rarity,
          price: sample.price
        },
        blockchainCreated: false // Not on blockchain yet
      });
      
      console.log('   ✅ Created in database');
      created++;
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Created:  ${created}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Total:    ${sampleIngredients.length}`);
    console.log('='.repeat(60));
    
    if (created > 0) {
      console.log(`\n✅ Successfully created ${created} ingredients in database!`);
      console.log('\n📋 Next step:');
      console.log('   Run: node sync-ingredients-to-blockchain.js');
      console.log('   This will create the ingredients on the blockchain.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
populateSampleIngredients()
  .then(() => {
    console.log('\n✅ Population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Population failed:', error);
    process.exit(1);
  });

