const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('./dist/models/Ingredient').default;
const IngredientData = require('./dist/models/IngredientData').default;

async function cleanupDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find orphaned IngredientData records (those not referenced by any Ingredient)
    const allIngredientData = await IngredientData.find({});
    console.log(`📊 Found ${allIngredientData.length} IngredientData records`);

    const orphanedData = [];
    for (const data of allIngredientData) {
      const ingredient = await Ingredient.findOne({ ingredientData: data._id });
      if (!ingredient) {
        orphanedData.push(data);
      }
    }

    console.log(`🗑️ Found ${orphanedData.length} orphaned IngredientData records`);

    if (orphanedData.length > 0) {
      // Delete orphaned records
      const idsToDelete = orphanedData.map(data => data._id);
      await IngredientData.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✅ Deleted ${orphanedData.length} orphaned IngredientData records`);
    }

    // Also clean up any IngredientData with null ingredient references
    const nullRefData = await IngredientData.find({ ingredient: null });
    if (nullRefData.length > 0) {
      await IngredientData.deleteMany({ ingredient: null });
      console.log(`✅ Deleted ${nullRefData.length} IngredientData records with null ingredient references`);
    }

    console.log('🎉 Database cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

cleanupDatabase();
