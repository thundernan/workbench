const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('./dist/models/Ingredient').default;
const IngredientData = require('./dist/models/IngredientData').default;

async function manuallyCreateIngredient() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI + process.env.MONGODB_DB_NAME);
    console.log('✅ Connected to workbench database');

    // Find the IngredientData that was created
    const ingredientData = await IngredientData.findOne({ 
      'metadata.name': 'Ballerina Capuchina' 
    });
    
    if (!ingredientData) {
      console.log('❌ No IngredientData found');
      return;
    }
    
    console.log('📋 Found IngredientData:', ingredientData._id);

    // Check if ingredient already exists
    const existingIngredient = await Ingredient.findOne({ tokenId: 5 });
    if (existingIngredient) {
      console.log('⚠️ Ingredient already exists:', existingIngredient._id);
      return;
    }

    // Create the ingredient manually
    const ingredient = await Ingredient.create({
      tokenContract: '0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a',
      tokenId: 5,
      ingredientData: ingredientData._id
    });

    console.log('✅ Ingredient created successfully:', {
      ingredientId: ingredient._id,
      tokenId: ingredient.tokenId,
      tokenContract: ingredient.tokenContract,
      ingredientDataId: ingredientData._id
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

manuallyCreateIngredient();
