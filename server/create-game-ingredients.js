#!/usr/bin/env node

/**
 * Generate 30 Game Ingredients for Workbench
 * This script creates realistic ingredients for a blockchain crafting game
 */

const BASE_URL = 'http://localhost:3001';

// Game ingredient data - realistic blockchain game items
const gameIngredients = [
  // Basic Materials (Token Contract 1)
  { tokenContract: '0x1111111111111111111111111111111111111111', tokenId: 1, amount: 10, position: 0, name: 'Iron Ore' },
  { tokenContract: '0x1111111111111111111111111111111111111111', tokenId: 2, amount: 8, position: 1, name: 'Copper Ore' },
  { tokenContract: '0x1111111111111111111111111111111111111111', tokenId: 3, amount: 6, position: 2, name: 'Silver Ore' },
  { tokenContract: '0x1111111111111111111111111111111111111111', tokenId: 4, amount: 4, position: 3, name: 'Gold Ore' },
  { tokenContract: '0x1111111111111111111111111111111111111111', tokenId: 5, amount: 2, position: 4, name: 'Diamond Ore' },
  
  // Wood Materials (Token Contract 2)
  { tokenContract: '0x2222222222222222222222222222222222222222', tokenId: 1, amount: 15, position: 0, name: 'Oak Wood' },
  { tokenContract: '0x2222222222222222222222222222222222222222', tokenId: 2, amount: 12, position: 1, name: 'Pine Wood' },
  { tokenContract: '0x2222222222222222222222222222222222222222', tokenId: 3, amount: 10, position: 2, name: 'Cedar Wood' },
  { tokenContract: '0x2222222222222222222222222222222222222222', tokenId: 4, amount: 8, position: 3, name: 'Mahogany Wood' },
  { tokenContract: '0x2222222222222222222222222222222222222222', tokenId: 5, amount: 5, position: 4, name: 'Ebony Wood' },
  
  // Gem Materials (Token Contract 3)
  { tokenContract: '0x3333333333333333333333333333333333333333', tokenId: 1, amount: 3, position: 0, name: 'Ruby' },
  { tokenContract: '0x3333333333333333333333333333333333333333', tokenId: 2, amount: 3, position: 1, name: 'Sapphire' },
  { tokenContract: '0x3333333333333333333333333333333333333333', tokenId: 3, amount: 3, position: 2, name: 'Emerald' },
  { tokenContract: '0x3333333333333333333333333333333333333333', tokenId: 4, amount: 2, position: 3, name: 'Amethyst' },
  { tokenContract: '0x3333333333333333333333333333333333333333', tokenId: 5, amount: 1, position: 4, name: 'Diamond' },
  
  // Magic Materials (Token Contract 4)
  { tokenContract: '0x4444444444444444444444444444444444444444', tokenId: 1, amount: 5, position: 0, name: 'Magic Dust' },
  { tokenContract: '0x4444444444444444444444444444444444444444', tokenId: 2, amount: 4, position: 1, name: 'Crystal Shard' },
  { tokenContract: '0x4444444444444444444444444444444444444444', tokenId: 3, amount: 3, position: 2, name: 'Mana Essence' },
  { tokenContract: '0x4444444444444444444444444444444444444444', tokenId: 4, amount: 2, position: 3, name: 'Soul Fragment' },
  { tokenContract: '0x4444444444444444444444444444444444444444', tokenId: 5, amount: 1, position: 4, name: 'Divine Spark' },
  
  // Crafted Components (Token Contract 5)
  { tokenContract: '0x5555555555555555555555555555555555555555', tokenId: 1, amount: 6, position: 0, name: 'Iron Ingot' },
  { tokenContract: '0x5555555555555555555555555555555555555555', tokenId: 2, amount: 5, position: 1, name: 'Steel Ingot' },
  { tokenContract: '0x5555555555555555555555555555555555555555', tokenId: 3, amount: 4, position: 2, name: 'Mithril Ingot' },
  { tokenContract: '0x5555555555555555555555555555555555555555', tokenId: 4, amount: 3, position: 3, name: 'Adamantine Ingot' },
  { tokenContract: '0x5555555555555555555555555555555555555555', tokenId: 5, amount: 2, position: 4, name: 'Orichalcum Ingot' },
  
  // Special Items (Token Contract 6)
  { tokenContract: '0x6666666666666666666666666666666666666666', tokenId: 1, amount: 1, position: 0, name: 'Phoenix Feather' },
  { tokenContract: '0x6666666666666666666666666666666666666666', tokenId: 2, amount: 1, position: 1, name: 'Dragon Scale' },
  { tokenContract: '0x6666666666666666666666666666666666666666', tokenId: 3, amount: 1, position: 2, name: 'Unicorn Horn' },
  { tokenContract: '0x6666666666666666666666666666666666666666', tokenId: 4, amount: 1, position: 3, name: 'Griffin Claw' },
  { tokenContract: '0x6666666666666666666666666666666666666666', tokenId: 5, amount: 1, position: 4, name: 'Ancient Relic' }
];

async function createIngredients() {
  console.log('🎮 Creating 30 Game Ingredients for Workbench...\n');

  try {
    // First, clean up any existing ingredients
    console.log('🧹 Cleaning up existing ingredients...');
    const cleanupResponse = await fetch(`${BASE_URL}/api/ingredients/cleanup`, {
      method: 'DELETE'
    });
    
    if (cleanupResponse.ok) {
      const cleanupData = await cleanupResponse.json();
      console.log(`✅ ${cleanupData.message}`);
    }

  // Prepare ingredients data (remove name field as it's not in the schema)
  const ingredientsToCreate = gameIngredients.map(({ name, ...ingredient }) => ({
    ...ingredient,
    name: name,
    image: null
  }));

    // Create all ingredients
    console.log('\n🔨 Creating ingredients...');
    const response = await fetch(`${BASE_URL}/api/ingredients/bulk-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ingredients: ingredientsToCreate
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`📊 Created ${result.data.length} ingredients\n`);
      
      // Display created ingredients grouped by token contract
      const groupedIngredients = {};
      gameIngredients.forEach((ingredient, index) => {
        const createdIngredient = result.data[index];
        if (!groupedIngredients[ingredient.tokenContract]) {
          groupedIngredients[ingredient.tokenContract] = [];
        }
        groupedIngredients[ingredient.tokenContract].push({
          ...createdIngredient,
          name: ingredient.name
        });
      });

      // Display ingredients by category
      Object.keys(groupedIngredients).forEach((contract, index) => {
        const categoryNames = [
          'Basic Materials (Ores)',
          'Wood Materials',
          'Gem Materials', 
          'Magic Materials',
          'Crafted Components',
          'Special Items'
        ];
        
        console.log(`📦 ${categoryNames[index] || `Category ${index + 1}`}:`);
        groupedIngredients[contract].forEach(ingredient => {
          console.log(`   • ${ingredient.name} (ID: ${ingredient.tokenId}, Amount: ${ingredient.amount}, Position: ${ingredient.position})`);
        });
        console.log('');
      });

      // Verify creation by getting all ingredients
      console.log('🔍 Verifying creation...');
      const verifyResponse = await fetch(`${BASE_URL}/api/ingredients`);
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        console.log(`✅ Verification successful: ${verifyData.data.total} ingredients in database`);
        console.log(`📄 Showing first page (${verifyData.data.data.length} items):`);
        
        verifyData.data.data.forEach((ingredient, index) => {
          const originalIngredient = gameIngredients[index];
          console.log(`   ${index + 1}. ${originalIngredient?.name || 'Unknown'} - Contract: ${ingredient.tokenContract.slice(0, 10)}..., TokenID: ${ingredient.tokenId}, Amount: ${ingredient.amount}, Position: ${ingredient.position}`);
        });
      }

    } else {
      console.error('❌ Failed to create ingredients:', result.message);
    }

  } catch (error) {
    console.error('❌ Error creating ingredients:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run the script
createIngredients();
