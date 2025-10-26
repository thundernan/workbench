const mongoose = require('mongoose');
require('dotenv').config();

async function recreateCollections() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    
    // Drop collections to start fresh
    try {
      await db.collection('ingredients').drop();
      console.log('🗑️ Dropped ingredients collection');
    } catch (error) {
      console.log('ℹ️ Ingredients collection did not exist');
    }
    
    try {
      await db.collection('ingredientdatas').drop();
      console.log('🗑️ Dropped ingredientdatas collection');
    } catch (error) {
      console.log('ℹ️ Ingredientdatas collection did not exist');
    }

    console.log('🎉 Collections recreated successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

recreateCollections();
