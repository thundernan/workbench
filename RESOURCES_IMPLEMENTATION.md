# Resources Implementation - User Balance Integration

## Overview
The frontend **Resources** section now displays the user's actual blockchain balance from their connected wallet. It fetches the user's token balances from the backend API, which queries the blockchain for real-time data.

## Changes Made

### 1. Updated Inventory Store (`client/src/stores/inventory.ts`)
- **Added Wallet Integration**: Imported `useWalletStore` to watch wallet connection status
- **New State Variables**:
  - `userBalance`: Reactive ref containing user's blockchain token balances
  - `isLoadingBalance`: Tracks balance loading state
  - `balanceError`: Stores error messages if balance fetch fails
  
- **New Functions**:
  - `loadUserBalance(address)`: Fetches user's inventory from `/api/ingredients/blockchain/user-inventory/:address`
  - `convertInventoryItemToItem()`: Converts backend inventory item to frontend Item with balance
  - `convertIngredientToItem()`: Converts backend ingredient format to frontend Item format
  
- **Wallet Watcher**: Automatically loads balance when wallet connects, clears on disconnect
  
- **Smart Icon Mapping**: Automatically assigns emojis based on category:
  - Material: 🪵
  - Tool: ⛏️
  - Weapon: ⚔️
  - Armor: 🛡️
  - Consumable: 🧪
  - Rare: 💎
  - Default: 📦

### 2. Updated Home View (`client/src/views/Home.vue`)

#### UI Changes:
- **Wallet Not Connected State**: Shows message to connect wallet with wallet icon
- **Loading Balance**: Shows "Loading your balance..." animation while fetching
- **Error State**: Displays error message if balance fetch fails
- **Resources Display**: Shows user's actual token balances from blockchain
- **Empty Balance**: Shows "No resources yet" if user has no tokens

#### Functionality Changes:
- **New Computed Property**: `filteredResources` - filters user's balance based on search
- **Wallet Store Integration**: Imported `useWalletStore` to check connection status
- **onMounted Hook**: Checks wallet connection and loads balance if connected
- **New Handlers**: 
  - `onResourceDragStart()`: Handles dragging from user's balance
  - `onResourceMouseDown()`: Enables painting mode for user's tokens
  - `selectResource()`: Click to add token to crafting grid
  - `startPaintingResource()`: Painting mode for user's tokens
  
- **Real Balance Display**: Shows actual token quantities from blockchain (not ∞)
- **Auto-load**: Balance loads automatically when wallet connects or page loads with connected wallet

## Data Flow

```
User connects wallet
    ↓
Wallet store updates (address, connected)
    ↓
Inventory store watcher triggers
    ↓
Backend API: GET /api/ingredients/blockchain/user-inventory/:address
    ↓
apiService.getUserInventory(address)
    ↓
inventoryStore.loadUserBalance(address)
    ↓
convertInventoryItemToItem() [transforms data with balance]
    ↓
inventoryStore.userBalance (reactive)
    ↓
Home.vue filteredResources (computed)
    ↓
UI renders user's balance with quantities
```

## Backend API Endpoint Used

**GET /api/ingredients/blockchain/user-inventory/:address**
- Returns user's blockchain token balances with metadata
- Query params: `includeZero` (optional, default: false)
- Response includes:
  - `address`: User's wallet address
  - `inventory`: Array of inventory items with:
    - `tokenContract`: ERC1155 contract address
    - `tokenId`: Token ID
    - `balance`: User's balance (as string)
    - `metadata`: Name, description, category, icon, rarity
    - `ingredientDataId`: Reference to ingredient data
  - `totalItems`: Total number of different tokens
  - `allTokensChecked`: Number of token IDs checked
  - `contractAddress`: ERC1155 contract address

## Features

✅ **Wallet Integration**: Requires wallet connection to view resources
✅ **Real-time Balance**: Shows actual token balances from blockchain
✅ **Automatic Loading**: Balance loads when wallet connects
✅ **Reactive Updates**: Balance updates when wallet changes
✅ **Search**: Search bar filters user's tokens by name, category, or description
✅ **Drag & Drop**: Drag tokens from balance to crafting grid
✅ **Painting Mode**: Click and drag to paint multiple cells
✅ **Balance Display**: Shows actual quantity owned (not ∞)
✅ **Loading States**: Shows loading, error, empty, and not-connected states
✅ **Auto-reconnect**: Checks wallet connection on page load

## Testing

To test the implementation:

1. **Start Backend Server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend Dev Server**:
   ```bash
   cd client
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:5173`

4. **Open Browser & Connect Wallet**: 
   - Navigate to `http://localhost:5173`
   - Click "Connect Wallet" button
   - Connect with MetaMask or other wallet
   - Left panel should show "Loading your balance..." briefly
   - Then display your token balances from blockchain
   - If you have no tokens, it will show "No resources yet"
   - Search should filter your tokens
   - Drag & drop should work with your tokens

## Error Handling

- **Wallet Not Connected**: Shows "Connect your wallet to view your resources" message
- **Balance Loading Error**: Displays error message in the resources panel
- **Empty Balance**: Shows "No resources yet - Your balance is empty" with icon
- **Network Errors**: Shows error state with retry option on wallet reconnect
- **Wallet Disconnect**: Clears balance and shows connect wallet message

## Future Enhancements

- [ ] Add refresh button to manually reload balance
- [ ] Cache balance in localStorage with expiration
- [ ] Add token categories/filters
- [ ] Show token prices from metadata
- [ ] Add real-time balance updates via WebSocket or polling
- [ ] Show token transfer history
- [ ] Add multi-wallet support
- [ ] Display token images if available in metadata

## Notes

- The Resources section now shows the **user's actual blockchain balance**
- Balance is fetched in real-time from the blockchain via backend API
- Requires wallet connection to display any resources
- Balance automatically updates when wallet changes
- Token quantities reflect actual on-chain balances
- The painting mode works with user's owned tokens
- Backend caches blockchain queries for performance
- Only non-zero balances are shown by default (configurable via `includeZero` param)

