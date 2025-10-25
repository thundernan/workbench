import mongoose, { Schema, Document } from 'mongoose';

// IngredientData interface
export interface IIngredientData {
  metadata: Record<string, any>; // JSON metadata (name, image, description, etc.)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IIngredientDataDocument extends IIngredientData, Document {
  id: string;
}

// IngredientData Schema
const ingredientDataSchema = new Schema<IIngredientDataDocument>({
  metadata: {
    type: Schema.Types.Mixed,
    required: [true, 'Metadata is required'],
    default: {}
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
ingredientDataSchema.index({ 'metadata.name': 1 });
ingredientDataSchema.index({ 'metadata.category': 1 });
ingredientDataSchema.index({ createdAt: -1 });

// Instance methods
ingredientDataSchema.methods['toJSON'] = function() {
  const obj = this['toObject']();
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

// Create and export the model
const IngredientData = mongoose.model<IIngredientDataDocument>('IngredientData', ingredientDataSchema);

export default IngredientData;

