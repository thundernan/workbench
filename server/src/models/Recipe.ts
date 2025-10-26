import mongoose, { Schema, Document } from 'mongoose';

// Recipe ingredient sub-schema (matches blockchain struct)
const recipeIngredientSchema = new Schema({
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

// Recipe interface
export interface IRecipe {
  blockchainRecipeId?: number; // Recipe ID from blockchain
  outputTokenId: number;
  outputAmount: number;
  requiresExactPattern: boolean;
  active: boolean;
  name: string;
  ingredients: Array<{
    tokenId: number;
    amount: number;
    position: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecipeDocument extends IRecipe, Document {
  id: string;
}

// Recipe Schema
const recipeSchema = new Schema<IRecipeDocument>({
  blockchainRecipeId: {
    type: Number,
    unique: true,
    sparse: true // Allows multiple null values
  },
  outputTokenId: {
    type: Number,
    required: [true, 'Output token ID is required'],
    min: [0, 'Token ID must be non-negative']
  },
  outputAmount: {
    type: Number,
    required: [true, 'Output amount is required'],
    min: [1, 'Amount must be at least 1'],
    default: 1
  },
  requiresExactPattern: {
    type: Boolean,
    default: true,
    required: [true, 'requiresExactPattern is required']
  },
  active: {
    type: Boolean,
    default: true,
    required: [true, 'active status is required']
  },
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    minlength: [1, 'Recipe name must be at least 1 character'],
    maxlength: [100, 'Recipe name must be less than 100 characters']
  },
  ingredients: {
    type: [recipeIngredientSchema],
    required: [true, 'Ingredients are required'],
    validate: {
      validator: function(ingredients: any[]) {
        return ingredients.length > 0 && ingredients.length <= 9;
      },
      message: 'Recipe must have 1-9 ingredients'
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
recipeSchema.index({ blockchainRecipeId: 1 });
recipeSchema.index({ outputTokenId: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ active: 1 });
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
