// Item types
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'material' | 'tool' | 'weapon' | 'armor' | 'consumable';
  // Blockchain fields (optional for legacy items)
  tokenId?: number;
  tokenContract?: string;
}

export interface InventoryItem {
  item: Item;
  quantity: number;
}

// Recipe types (Client UI - legacy for local testing)
export interface Recipe {
  id: string;
  name: string;
  description: string;
  result: Item;
  ingredients: Array<{
    item: Item;
    quantity: number;
  }>;
  grid: (Item | null)[][]; // 3x3 grid representation
}

// Blockchain Recipe types (from server)
export interface BlockchainRecipeIngredient {
  tokenContract: string;  // ERC1155 contract address
  tokenId: number;        // Token ID required
  amount: number;         // Amount required
  position: number;       // Position in crafting grid (0-8 for 3x3)
}

export interface BlockchainRecipe {
  _id?: string;
  id?: string;
  blockchainRecipeId: string;     // Recipe ID from blockchain
  resultTokenContract: string;    // Address of the result ERC1155
  resultTokenId: number;          // Token ID of the result
  resultAmount: number;           // Amount produced
  ingredients: BlockchainRecipeIngredient[]; // Required ingredients
  name: string;                   // Recipe name
  description?: string;           // Recipe description
  category?: string;              // Recipe category (weapon, tool, etc)
  difficulty?: number;            // Difficulty level 1-10
  craftingTime?: number;          // Time to craft in seconds
  createdAt?: string;
  updatedAt?: string;
}

// Blockchain Token (ERC1155)
export interface BlockchainToken {
  tokenContract: string;
  tokenId: number;
  amount: number;
}

// Crafting check result
export interface CraftingCheck {
  canCraft: boolean;
  missingIngredients: Array<{
    tokenContract: string;
    tokenId: number;
    required: number;
    available: number;
  }>;
  recipe: BlockchainRecipe | null;
}

// Web3 Wallet types
export interface WalletState {
  address: string | null;
  connected: boolean;
  chainId: number | null;
  provider: any | null;
  signer: any | null;
}

export interface WalletProvider {
  name: string;
  id: string;
  icon: string;
  installed: boolean;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface CraftingTransaction {
  recipeId: string;
  ingredients: Array<{
    tokenContract: string;
    tokenId: number;
    amount: number;
  }>;
}

// Trading types
export interface TradeOffer {
  id: string;
  seller: string;
  item: Item;
  quantity: number;
  price: number;
  currency: string;
  timestamp: number;
}

// UI types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface ConfirmModal {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}
