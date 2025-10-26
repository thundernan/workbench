const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const IngredientData = require('./dist/models/IngredientData').default;

async function testIngredientDataCreation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);

    // Try to create IngredientData
    console.log('🔄 Creating IngredientData...');
    const ingredientData = await IngredientData.create({
      metadata: {
        name: 'Test Ingredient',
        image: 'https://example.com/image.png',
        description: 'Test description',
        category: 'test'
      }
    });
    
    console.log('✅ IngredientData created successfully:', ingredientData._id);

  } catch (error) {
    console.error('❌ Error creating IngredientData:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testIngredientDataCreation();
