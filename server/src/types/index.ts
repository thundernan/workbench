// Recipe interfaces for blockchain-synced data
export interface IRecipeIngredient {
  tokenContract?: string | null;
  tokenId: number;
  amount: number;
  position: number;       // Position in the crafting grid (0-8 for 3x3)
  metadata?: Record<string, any> | null;
}

export interface IRecipe {
  blockchainRecipeId?: number | null; // Recipe ID from blockchain
  outputTokenId: number;
  outputAmount: number;
  requiresExactPattern: boolean;  // Position-sensitive? (matches blockchain)
  active: boolean;                // Recipe active status (matches blockchain)
  name: string;                   // Recipe name
  ingredients: IRecipeIngredient[]; // Required ingredients for crafting
  outputIngredient?: {
    tokenContract?: string | null;
    tokenId: number;
    amount: number;
    metadata?: Record<string, any> | null;
  } | null;
  description?: string;
  category?: string;
  difficulty?: number;
  craftingTime?: number;
  metadata?: Record<string, any>;
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
  outputTokenId?: number;
  active?: boolean;
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