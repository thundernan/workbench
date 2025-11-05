import mongoose, { Document, Schema } from 'mongoose';

/**
 * TokenCounter Interface
 * Tracks the last known token ID to avoid checking blockchain from 0 every time
 */
export interface ITokenCounter {
  contractAddress: string;  // ERC1155 contract address
  lastTokenId: number;       // Last known token ID on blockchain
  updatedAt: Date;
}

export interface ITokenCounterDocument extends ITokenCounter, Document {
  id: string;
}

const TokenCounterSchema = new Schema<ITokenCounterDocument>(
  {
    contractAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    lastTokenId: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for faster lookups
TokenCounterSchema.index({ contractAddress: 1 });

const TokenCounter = mongoose.model<ITokenCounterDocument>('TokenCounter', TokenCounterSchema);

export default TokenCounter;

