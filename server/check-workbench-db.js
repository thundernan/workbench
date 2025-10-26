const mongoose = require('mongoose');
require('dotenv').config();

async function checkWorkbenchDatabase() {
  try {
    // Connect to database with the same URI as the server
    await mongoose.connect(process.env.MONGODB_URI + process.env.MONGODB_DB_NAME);
    console.log('✅ Connected to workbench database');

    const db = mongoose.connection.db;
    const ingredientDataCollection = db.collection('ingredientdatas');
    
    // Check indexes
    const indexes = await ingredientDataCollection.indexes();
    console.log('📊 Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Check if there are any documents
    const count = await ingredientDataCollection.countDocuments();
    console.log(`📊 Document count: ${count}`);
    
    if (count > 0) {
      const sample = await ingredientDataCollection.findOne();
      console.log('📋 Sample document:', JSON.stringify(sample, null, 2));
    }
    
    // Try to drop the problematic index
    try {
      await ingredientDataCollection.dropIndex('ingredient_1');
      console.log('✅ Dropped ingredient_1 index');
    } catch (error) {
      console.log('ℹ️ ingredient_1 index did not exist or could not be dropped:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkWorkbenchDatabase();
