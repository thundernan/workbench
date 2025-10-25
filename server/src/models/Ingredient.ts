import mongoose, { Schema, Document } from 'mongoose';

// Ingredient interface
export interface IIngredient {
  tokenContract: string;
  tokenId: number;
  ingredientData: mongoose.Types.ObjectId; // Reference to IngredientData
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IIngredientDocument extends IIngredient, Document {
  id: string;
}

// Ingredient Schema
const ingredientSchema = new Schema<IIngredientDocument>({
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
    min: [0, 'Token ID must be non-negative'],
    unique: false
  },
  ingredientData: {
    type: Schema.Types.ObjectId,
    ref: 'IngredientData',
    required: [true, 'Ingredient data reference is required'],
    unique: true // One-to-one relationship
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound unique index for tokenContract + tokenId
ingredientSchema.index({ tokenContract: 1, tokenId: 1 }, { unique: true });

// Additional indexes
ingredientSchema.index({ createdAt: -1 });

// Instance methods
ingredientSchema.methods['toJSON'] = function() {
  const obj = this['toObject']();
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

// Create and export the model
const Ingredient = mongoose.model<IIngredientDocument>('Ingredient', ingredientSchema);

export default Ingredient;

