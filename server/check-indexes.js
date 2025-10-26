const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndexes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    const ingredientDataCollection = db.collection('ingredientdatas');
    
    // Check indexes
    const indexes = await ingredientDataCollection.indexes();
    console.log('📊 Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Try to drop the problematic index
    try {
      await ingredientDataCollection.dropIndex('ingredient_1');
      console.log('✅ Dropped ingredient_1 index');
    } catch (error) {
      console.log('ℹ️ ingredient_1 index did not exist or could not be dropped:', error.message);
    }
    
    // Check indexes again
    const indexesAfter = await ingredientDataCollection.indexes();
    console.log('📊 Indexes after cleanup:', JSON.stringify(indexesAfter, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkIndexes();
