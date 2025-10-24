// Item types
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'material' | 'tool' | 'weapon' | 'armor' | 'consumable';
}

export interface InventoryItem {
  item: Item;
  quantity: number;
}

// Recipe types
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

// Wallet types
export interface WalletState {
  address: string | null;
  connected: boolean;
  chainId: number | null;
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
