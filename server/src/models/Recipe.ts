import mongoose, { Schema } from 'mongoose';
import { IRecipeDocument } from '../types';

// Recipe ingredient sub-schema
const recipeIngredientSchema = new Schema({
  tokenContract: {
    type: String,
    required: [true, 'Token contract address is required'],
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address format'
    }
  },
  tokenId: {
    type: Number,
    required: [true, 'Token ID is required'],
    min: [0, 'Token ID must be non-negative']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1']
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position must be between 0-8'],
    max: [8, 'Position must be between 0-8']
  }
}, { _id: false });

// Recipe Schema
const recipeSchema = new Schema<IRecipeDocument>({
  blockchainRecipeId: {
    type: String,
    required: [true, 'Blockchain recipe ID is required'],
    unique: true
  },
  resultTokenContract: {
    type: String,
    required: [true, 'Result token contract address is required'],
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address format'
    }
  },
  resultTokenId: {
    type: Number,
    required: [true, 'Result token ID is required'],
    min: [0, 'Token ID must be non-negative']
  },
  resultAmount: {
    type: Number,
    required: [true, 'Result amount is required'],
    min: [1, 'Amount must be at least 1'],
    default: 1
  },
  ingredients: {
    type: [recipeIngredientSchema],
    required: [true, 'Ingredients are required'],
    validate: {
      validator: function(ingredients: any[]) {
        return ingredients.length > 0;
      },
      message: 'At least one ingredient is required'
    }
  },
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    minlength: [1, 'Recipe name must be at least 1 character'],
    maxlength: [100, 'Recipe name must be less than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be less than 500 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category must be less than 50 characters']
  },
  difficulty: {
    type: Number,
    min: [1, 'Difficulty must be at least 1'],
    max: [10, 'Difficulty must be at most 10'],
    default: 1
  },
  craftingTime: {
    type: Number,
    min: [0, 'Crafting time must be non-negative'],
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
recipeSchema.index({ blockchainRecipeId: 1 });
recipeSchema.index({ resultTokenContract: 1, resultTokenId: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ createdAt: -1 });

// Instance methods
recipeSchema.methods['toJSON'] = function() {
  const obj = this['toObject']();
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

// Create and export the model
const Recipe = mongoose.model<IRecipeDocument>('Recipe', recipeSchema);

export default Recipe;
