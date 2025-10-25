# Inventory System Documentation

## Overview
The inventory system fetches user token balances from the blockchain for all tokens registered in the database. By default, it filters out tokens with zero balance.

## How It Works

### Backend Flow
1. **Get all ingredients** from database (`Ingredient.find()` with `IngredientData` populated)
2. **Extract token IDs** from database ingredients
3. **Batch query blockchain** using `balanceOfBatch()` for all token IDs at once (efficient!)
4. **Combine data**: Match blockchain balances with database metadata
5. **Filter**: Remove zero-balance tokens (unless `includeZero=true`)

### Frontend Flow
1. **User connects wallet** → `useInventory` composable auto-fetches
2. **Display inventory** with search, filter, and category features
3. **Refresh** manually with the refresh button

## API Endpoint

### `GET /api/ingredients/blockchain/user-inventory/:address`

**Query Parameters:**
- `includeZero` (optional): `true` to include zero-balance tokens, `false` (default) to exclude them

**Response:**
```json
{
  "success": true,
  "message": "User inventory retrieved successfully",
  "data": {
    "address": "0x...",
    "inventory": [
      {
        "tokenContract": "0x...",
        "tokenId": 1,
        "balance": "5",
        "metadata": {
          "name": "Wood",
          "image": "https://...",
          "category": "Basic",
          "description": "..."
        },
        "ingredientDataId": "..."
      }
    ],
    "totalItems": 1,
    "allTokensChecked": 10,
    "contractAddress": "0x..."
  }
}
```

## Client Usage

### Using the Composable

```typescript
import { useInventory } from '@/composables/useInventory';

const {
  inventory,           // Array of inventory items
  isLoading,          // Loading state
  error,              // Error message
  totalItems,         // Number of items in inventory
  isEmpty,            // Computed: is inventory empty
  hasItems,           // Computed: does user have items
  categories,         // Computed: unique categories
  
  fetchInventory,     // (address: string, includeZero?: boolean) => Promise<void>
  refreshInventory,   // (includeZero?: boolean) => Promise<void>
  clearInventory,     // () => void
  
  getItemByTokenId,   // (tokenId: number) => InventoryItem | undefined
  hasEnoughTokens,    // (tokenId: number, amount: number) => boolean
  getTokenBalance,    // (tokenId: number) => string
  filterByCategory,   // (category: string) => InventoryItem[]
  searchByName,       // (query: string) => InventoryItem[]
} = useInventory();
```

### Example: Fetch Inventory

```typescript
// Fetch with zero-balance tokens filtered out (default)
await fetchInventory(walletAddress);

// Fetch including zero-balance tokens
await fetchInventory(walletAddress, true);
```

### Example: Check Token Availability

```typescript
// Check if user has enough tokens for crafting
const canCraft = hasEnoughTokens(tokenId, 3);

// Get specific token balance
const balance = getTokenBalance(tokenId);
```

## Key Features

### ✅ Efficient Batch Querying
- Uses `balanceOfBatch()` to fetch all balances in a single blockchain call
- Much faster than individual `balanceOf()` calls

### ✅ Zero-Balance Filtering
- Default: Only show tokens with balance > 0
- Optional: Include all registered tokens with `includeZero=true`

### ✅ Metadata Integration
- Combines blockchain balance with database metadata
- Shows token name, image, category, description, etc.

### ✅ Real-time Updates
- Auto-fetches when wallet connects
- Manual refresh button for updates after transactions

### ✅ Search & Filter
- Search by token name
- Filter by category
- View all unique categories

## Database Dependency

**Important:** The inventory system only checks tokens that are registered in the database. If a token exists on the blockchain but not in the database, it will not appear in the inventory.

To add tokens to the database:
1. Use the `POST /api/ingredients` endpoint to create an ingredient
2. Use the `POST /api/ingredients/blockchain/sync` endpoint to sync from blockchain

## Performance

- **Fast**: Single batch RPC call for all balances
- **Scalable**: Handles hundreds of tokens efficiently
- **Cached**: Frontend caches inventory until refresh

## Error Handling

- **No wallet connected**: Shows message prompting connection
- **RPC error**: Displays error message with retry option
- **Database sync issues**: Gracefully handles missing metadata

## Future Enhancements

Potential improvements (not yet implemented):
- WebSocket for real-time balance updates
- Local storage caching
- Pagination for large inventories
- Filter by balance range
- Sort by name, balance, or category

