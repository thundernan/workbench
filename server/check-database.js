const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check IngredientData collection structure
    const db = mongoose.connection.db;
    const ingredientDataCollection = db.collection('ingredientdatas');
    
    // Get all documents to see the structure
    const allDocs = await ingredientDataCollection.find({}).toArray();
    console.log(`📊 Found ${allDocs.length} IngredientData documents`);
    
    if (allDocs.length > 0) {
      console.log('📋 Sample document structure:', JSON.stringify(allDocs[0], null, 2));
    }

    // Check if there are any documents with 'ingredient' field
    const docsWithIngredient = await ingredientDataCollection.find({ ingredient: { $exists: true } }).toArray();
    console.log(`🔍 Found ${docsWithIngredient.length} documents with 'ingredient' field`);
    
    if (docsWithIngredient.length > 0) {
      console.log('📋 Documents with ingredient field:', JSON.stringify(docsWithIngredient, null, 2));
    }

    // Check indexes
    const indexes = await ingredientDataCollection.indexes();
    console.log('📊 Indexes:', JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkDatabase();
