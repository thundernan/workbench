// Recipe interfaces for blockchain-synced data
export interface IRecipeIngredient {
  tokenContract: string;  // Address of the ERC1155 contract
  tokenId: number;        // Token ID required
  position: number;       // Position in the crafting grid (0-8 for 3x3)
}

export interface IRecipe {
  blockchainRecipeId: string;     // Recipe ID from blockchain
  resultTokenContract: string;    // Address of the result ERC1155 contract (outputContract in blockchain)
  resultTokenId: number;          // Token ID of the result (outputTokenId in blockchain)
  resultAmount: number;           // Amount of result produced (outputAmount in blockchain)
  ingredients: IRecipeIngredient[]; // Required ingredients for crafting
  requiresExactPattern: boolean;  // Position-sensitive? (matches blockchain)
  active: boolean;                // Recipe active status (matches blockchain)
  name: string;                   // Recipe name
  description?: string;           // Recipe description
  category?: string;              // Recipe category
  difficulty?: number;            // Difficulty level 1-10
  craftingTime?: number;          // Time to craft in seconds
  metadata?: Record<string, any>; // Additional metadata as JSON
}

// MongoDB document interface
export interface IRecipeDocument extends IRecipe {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response interfaces
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Query interfaces
export interface IRecipeQuery {
  blockchainRecipeId?: string;
  resultTokenContract?: string;
  resultTokenId?: number;
  name?: string;
  category?: string;
  difficulty?: number;
  page?: number;
  limit?: number;
}

// Pagination interface
export interface IPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}