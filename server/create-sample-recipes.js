const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Ingredient = require('./dist/models/Ingredient.js').default;
const Recipe = require('./dist/models/Recipe.js').default;

async function createSampleRecipes() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workbench';
    const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'workbench';
    
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ Connected to MongoDB');

    // Get all ingredients to use in recipes
    const ingredients = await Ingredient.find({});
    console.log(`📦 Found ${ingredients.length} ingredients`);

    if (ingredients.length < 5) {
      console.log('❌ Not enough ingredients found. Please run create-game-ingredients.js first.');
      process.exit(1);
    }

    // Clear existing recipes
    await Recipe.deleteMany({});
    console.log('🧹 Cleared existing recipes');

    // Sample recipes for crafting
    const sampleRecipes = [
      {
        name: 'Iron Sword Recipe',
        description: 'A basic iron sword crafted from iron ingots',
        ingredients: [
          { ingredientId: ingredients[0]._id, amount: 2, position: 0 }, // Iron Ingot
          { ingredientId: ingredients[1]._id, amount: 1, position: 4 }  // Wood Plank
        ],
        resultIngredientId: ingredients[5]._id, // Iron Sword (we'll create this)
        craftingTime: 30,
        difficulty: 2,
        category: 'weapons'
      },
      {
        name: 'Magic Potion Recipe',
        description: 'A healing potion made from magical ingredients',
        ingredients: [
          { ingredientId: ingredients[2]._id, amount: 1, position: 1 }, // Magic Dust
          { ingredientId: ingredients[3]._id, amount: 2, position: 3 }, // Crystal Shard
          { ingredientId: ingredients[4]._id, amount: 1, position: 7 }  // Mana Essence
        ],
        resultIngredientId: ingredients[6]._id, // Magic Potion (we'll create this)
        craftingTime: 60,
        difficulty: 3,
        category: 'potions'
      },
      {
        name: 'Steel Armor Recipe',
        description: 'Heavy armor made from steel ingots',
        ingredients: [
          { ingredientId: ingredients[0]._id, amount: 4, position: 0 }, // Iron Ingot
          { ingredientId: ingredients[1]._id, amount: 2, position: 1 }, // Wood Plank
          { ingredientId: ingredients[2]._id, amount: 1, position: 4 }  // Magic Dust
        ],
        resultIngredientId: ingredients[7]._id, // Steel Armor (we'll create this)
        craftingTime: 120,
        difficulty: 4,
        category: 'armor'
      },
      {
        name: 'Enchanted Bow Recipe',
        description: 'A magical bow with enhanced power',
        ingredients: [
          { ingredientId: ingredients[1]._id, amount: 3, position: 0 }, // Wood Plank
          { ingredientId: ingredients[3]._id, amount: 2, position: 2 }, // Crystal Shard
          { ingredientId: ingredients[4]._id, amount: 1, position: 6 }  // Mana Essence
        ],
        resultIngredientId: ingredients[8]._id, // Enchanted Bow (we'll create this)
        craftingTime: 90,
        difficulty: 5,
        category: 'weapons'
      },
      {
        name: 'Diamond Ring Recipe',
        description: 'A precious ring crafted from rare materials',
        ingredients: [
          { ingredientId: ingredients[9]._id, amount: 1, position: 4 }, // Diamond
          { ingredientId: ingredients[10]._id, amount: 1, position: 1 } // Gold Ingot
        ],
        resultIngredientId: ingredients[11]._id, // Diamond Ring (we'll create this)
        craftingTime: 45,
        difficulty: 6,
        category: 'jewelry'
      }
    ];

    // First, create the result ingredients that don't exist yet
    const resultIngredients = [
      {
        tokenContract: '0x6666666666666666666666666666666666666666',
        tokenId: 1,
        amount: 1,
        position: 0,
        name: 'Iron Sword',
        image: null,
        recipeId: null // Will be updated after recipe creation
      },
      {
        tokenContract: '0x6666666666666666666666666666666666666666',
        tokenId: 2,
        amount: 1,
        position: 1,
        name: 'Magic Potion',
        image: null,
        recipeId: null
      },
      {
        tokenContract: '0x6666666666666666666666666666666666666666',
        tokenId: 3,
        amount: 1,
        position: 2,
        name: 'Steel Armor',
        image: null,
        recipeId: null
      },
      {
        tokenContract: '0x6666666666666666666666666666666666666666',
        tokenId: 4,
        amount: 1,
        position: 3,
        name: 'Enchanted Bow',
        image: null,
        recipeId: null
      },
      {
        tokenContract: '0x6666666666666666666666666666666666666666',
        tokenId: 5,
        amount: 1,
        position: 4,
        name: 'Diamond Ring',
        image: null,
        recipeId: null
      }
    ];

    console.log('🔨 Creating result ingredients...');
    const createdIngredients = await Ingredient.insertMany(resultIngredients);
    console.log(`✅ Created ${createdIngredients.length} result ingredients`);

    // Update recipe data with actual ingredient IDs
    const recipesWithIds = sampleRecipes.map((recipe, index) => ({
      ...recipe,
      resultIngredientId: createdIngredients[index]._id
    }));

    console.log('📝 Creating recipes...');
    const createdRecipes = await Recipe.insertMany(recipesWithIds);
    console.log(`✅ Created ${createdRecipes.length} recipes`);

    // Update ingredients with recipe references
    for (let i = 0; i < createdIngredients.length; i++) {
      await Ingredient.findByIdAndUpdate(
        createdIngredients[i]._id,
        { recipeId: createdRecipes[i]._id }
      );
    }
    console.log('🔗 Updated ingredients with recipe references');

    console.log('\n🎉 Sample recipes created successfully!');
    console.log('\n📋 Created Recipes:');
    createdRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.name} (${recipe.category}) - Difficulty: ${recipe.difficulty}`);
    });

    console.log('\n🔗 API Endpoints:');
    console.log('GET    /api/recipes - Get all recipes');
    console.log('GET    /api/recipes/:id - Get recipe by ID');
    console.log('POST   /api/recipes - Create new recipe');
    console.log('PUT    /api/recipes/:id - Update recipe');
    console.log('DELETE /api/recipes/:id - Delete recipe');
    console.log('GET    /api/recipes/category/:category - Get recipes by category');
    console.log('GET    /api/recipes/difficulty - Get recipes by difficulty range');
    console.log('POST   /api/recipes/bulk - Create multiple recipes');

  } catch (error) {
    console.error('❌ Error creating sample recipes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

createSampleRecipes();
