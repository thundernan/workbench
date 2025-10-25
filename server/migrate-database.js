#!/usr/bin/env node

/**
 * Database Migration Script for Workbench Server
 * Adds name and image fields to existing ingredients
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import the updated model
const Ingredient = require('./dist/models/Ingredient.js').default;

// Game ingredient names mapping
const ingredientNames = {
  // Basic Materials (Contract 1)
  '0x1111111111111111111111111111111111111111': {
    1: 'Iron Ore',
    2: 'Copper Ore', 
    3: 'Silver Ore',
    4: 'Gold Ore',
    5: 'Diamond Ore'
  },
  // Wood Materials (Contract 2)
  '0x2222222222222222222222222222222222222222': {
    1: 'Oak Wood',
    2: 'Pine Wood',
    3: 'Cedar Wood', 
    4: 'Mahogany Wood',
    5: 'Ebony Wood'
  },
  // Gem Materials (Contract 3)
  '0x3333333333333333333333333333333333333333': {
    1: 'Ruby',
    2: 'Sapphire',
    3: 'Emerald',
    4: 'Amethyst', 
    5: 'Diamond'
  },
  // Magic Materials (Contract 4)
  '0x4444444444444444444444444444444444444444': {
    1: 'Magic Dust',
    2: 'Crystal Shard',
    3: 'Mana Essence',
    4: 'Soul Fragment',
    5: 'Divine Spark'
  },
  // Crafted Components (Contract 5)
  '0x5555555555555555555555555555555555555555': {
    1: 'Iron Ingot',
    2: 'Steel Ingot',
    3: 'Mithril Ingot',
    4: 'Adamantine Ingot',
    5: 'Orichalcum Ingot'
  },
  // Special Items (Contract 6)
  '0x6666666666666666666666666666666666666666': {
    1: 'Phoenix Feather',
    2: 'Dragon Scale',
    3: 'Unicorn Horn',
    4: 'Griffin Claw',
    5: 'Ancient Relic'
  }
};

async function migrateDatabase() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/workbench';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all existing ingredients
    console.log('\n📊 Fetching existing ingredients...');
    const existingIngredients = await Ingredient.find({});
    console.log(`Found ${existingIngredients.length} ingredients to migrate`);

    if (existingIngredients.length === 0) {
      console.log('⚠️  No ingredients found. Run create-game-ingredients.js first.');
      return;
    }

    // Update each ingredient with name and image fields
    console.log('\n🔧 Updating ingredients...');
    let updatedCount = 0;
    let skippedCount = 0;

    for (const ingredient of existingIngredients) {
      const contractNames = ingredientNames[ingredient.tokenContract];
      
      if (contractNames && contractNames[ingredient.tokenId]) {
        const name = contractNames[ingredient.tokenId];
        
        // Check if ingredient already has name field
        if (ingredient.name) {
          console.log(`⏭️  Skipping ${name} (already has name)`);
          skippedCount++;
          continue;
        }

        // Update ingredient with name and null image
        await Ingredient.findByIdAndUpdate(ingredient._id, {
          name: name,
          image: null
        });

        console.log(`✅ Updated: ${name} (Contract: ${ingredient.tokenContract.slice(0, 10)}..., TokenID: ${ingredient.tokenId})`);
        updatedCount++;
      } else {
        console.log(`⚠️  Unknown ingredient: Contract ${ingredient.tokenContract}, TokenID ${ingredient.tokenId}`);
        skippedCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} ingredients`);
    console.log(`   ⏭️  Skipped: ${skippedCount} ingredients`);
    console.log(`   📊 Total: ${existingIngredients.length} ingredients`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedIngredients = await Ingredient.find({});
    const withNames = migratedIngredients.filter(ing => ing.name);
    const withImages = migratedIngredients.filter(ing => ing.image !== undefined);
    
    console.log(`   📝 Ingredients with names: ${withNames.length}/${migratedIngredients.length}`);
    console.log(`   🖼️  Ingredients with image field: ${withImages.length}/${migratedIngredients.length}`);

    // Show sample of migrated data
    console.log('\n📋 Sample migrated ingredients:');
    const sampleIngredients = migratedIngredients.slice(0, 5);
    sampleIngredients.forEach((ingredient, index) => {
      console.log(`   ${index + 1}. ${ingredient.name} - Contract: ${ingredient.tokenContract.slice(0, 10)}..., TokenID: ${ingredient.tokenId}, Image: ${ingredient.image}`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateDatabase().catch(console.error);
