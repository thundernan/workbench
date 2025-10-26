# Shop Page Implementation

## Overview
Implemented a complete shop page that allows users to browse and purchase ingredients from the blockchain. The shop fetches all available ingredients from the backend API and provides a seamless buying experience with blockchain integration.

## Features Implemented

### 1. Shop Page Component (`client/src/views/Shop.vue`)

**Key Features:**
- Responsive grid layout for ingredient cards
- Real-time wallet connection status
- Loading, error, and empty states
- Price display with "Free" label for zero-cost items
- One-click buying with blockchain integration
- Toast notifications for success/error feedback

**UI Components:**
- Header with wallet connection status
- Ingredient cards with images, names, categories, and prices
- Buy buttons with different states (Buy, Mint Free, Connect Wallet)
- Loading spinner and error handling

### 2. API Service Extension (`client/src/services/apiService.ts`)

**New Interface:**
```typescript
export interface Ingredient {
  _id: string;
  tokenContract: string;
  tokenId: number;
  ingredientData: {
    _id: string;
    metadata: {
      name?: string;
      image?: string;
      description?: string;
      category?: string;
      price?: string; // Price in wei as string
      [key: string]: any;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}
```

**New Method:**
```typescript
async getIngredients(params?: { page?: number; limit?: number }): Promise<Ingredient[]>
```

### 3. Navigation Integration

**Updated Files:**
- `client/src/router/index.ts` - Added Shop route
- `client/src/components/AppHeader.vue` - Added Shop navigation button

## User Experience Flow

### 1. Page Load
```
User visits /shop
↓
Page shows loading spinner
↓
Fetches ingredients from /api/ingredients
↓
Displays ingredient grid
```

### 2. Buying Process
```
User clicks "Buy" button
↓
Check wallet connection
↓
If not connected: Show "Connect Wallet" message
↓
If connected: Show "Buying..." state
↓
Call blockchain publicMint() function
↓
Wait for transaction confirmation
↓
Show success/error toast
```

## Price Display Logic

### Free Items (Price = 0)
- Shows green "Free" badge
- Button text: "Mint Free"
- No ETH payment required

### Paid Items (Price > 0)
- Shows price in ETH format (e.g., "0.001 ETH")
- Button text: "Buy"
- Requires exact ETH payment

### Price Conversion
```typescript
const getPriceInEth = (ingredient: Ingredient): string => {
  const priceWei = ingredient.ingredientData.metadata.price;
  if (!priceWei || priceWei === '0') {
    return '0';
  }
  try {
    return ethers.formatEther(priceWei);
  } catch {
    return '0';
  }
};
```

## Blockchain Integration

### Smart Contract Interaction
```typescript
// Create contract instance
const contract = new ethers.Contract(
  ingredient.tokenContract,
  [
    'function publicMint(uint256 id, uint256 amount) payable',
    'function tokenPrices(uint256 id) view returns (uint256)'
  ],
  signer
);

// Get current price from contract
const contractPrice = await contract.tokenPrices(ingredient.tokenId);

// Mint the token
const tx = await contract.publicMint(ingredient.tokenId, 1, {
  value: contractPrice
});
```

### Error Handling
- **Insufficient funds**: "Insufficient funds for this purchase"
- **User rejection**: "Transaction was cancelled"
- **Network errors**: Generic error message
- **Contract errors**: Specific contract error messages

## Visual Design

### Ingredient Cards
- **Image**: Full ingredient image or fallback icon
- **Name**: Ingredient name or "Token #ID"
- **Category**: Displayed as subtitle
- **Description**: Truncated to 2 lines
- **Price**: ETH amount or "Free" badge
- **Token ID**: Small identifier
- **Buy Button**: Context-aware text and state

### Responsive Layout
- **Mobile**: 1 column
- **Small**: 2 columns
- **Medium**: 3 columns
- **Large**: 4 columns
- **Extra Large**: 5 columns

### Color Scheme
- **Background**: Dark slate (slate-900)
- **Cards**: Dark slate (slate-800)
- **Borders**: Slate-700 (hover: emerald-500)
- **Text**: White primary, slate-400 secondary
- **Accents**: Emerald-400/600 for actions
- **Free badge**: Emerald-600 background

## API Endpoints Used

### GET /api/ingredients
**Purpose**: Fetch all available ingredients
**Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page (default: 50)

**Response**:
```json
{
  "success": true,
  "message": "Ingredients retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "tokenContract": "0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a",
        "tokenId": 1,
        "ingredientData": {
          "_id": "507f191e810c19729de860ea",
          "metadata": {
            "name": "Wood",
            "image": "https://example.com/wood.png",
            "description": "Basic crafting material",
            "category": "material",
            "price": "0"
          }
        },
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

## State Management

### Component State
```typescript
const ingredients = ref<Ingredient[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isBuying = ref(false);
```

### Store Integration
- **Wallet Store**: For connection status and blockchain interaction
- **Toast Store**: For success/error notifications

## Error States

### Loading State
- Spinning loader with "Loading ingredients..." message

### Error State
- Warning icon with error message
- "Try Again" button to retry loading

### Empty State
- Package icon with "No ingredients available" message

### Wallet Not Connected
- Button shows "Connect Wallet" text
- Clicking shows warning toast

## Testing Examples

### Test 1: Load Shop Page
```bash
# Navigate to shop
curl http://localhost:3000/shop
```

### Test 2: Buy Free Item
```javascript
// In browser console
// 1. Connect wallet
// 2. Click "Mint Free" on a free item
// 3. Confirm transaction
// 4. Check for success toast
```

### Test 3: Buy Paid Item
```javascript
// In browser console
// 1. Ensure wallet has sufficient ETH
// 2. Click "Buy" on a paid item
// 3. Confirm transaction with exact ETH amount
// 4. Check for success toast
```

### Test 4: Insufficient Funds
```javascript
// In browser console
// 1. Use wallet with insufficient ETH
// 2. Try to buy paid item
// 3. Check for "Insufficient funds" error toast
```

## Integration Points

### With Existing Systems
- **Wallet Connection**: Uses existing wallet store
- **Toast Notifications**: Uses existing toast store
- **Navigation**: Integrated with existing router and header
- **Styling**: Consistent with existing dark theme

### With Backend
- **Ingredient API**: Fetches from existing `/api/ingredients` endpoint
- **Price Data**: Uses price stored in ingredient metadata
- **Token Contract**: Uses tokenContract from ingredient data

### With Blockchain
- **ERC1155 Contract**: Direct interaction with token contract
- **Public Minting**: Uses `publicMint` function
- **Price Verification**: Fetches current price from contract
- **Transaction Handling**: Full transaction lifecycle management

## Future Enhancements

### Potential Improvements
1. **Search/Filter**: Add search and category filtering
2. **Pagination**: Implement pagination for large ingredient lists
3. **Bulk Purchase**: Allow buying multiple items at once
4. **Price History**: Show price trends over time
5. **Favorites**: Allow users to favorite ingredients
6. **Reviews**: Add ingredient reviews and ratings
7. **Discounts**: Implement discount codes or bulk pricing
8. **Inventory Integration**: Show user's current balance for each ingredient

### Performance Optimizations
1. **Image Lazy Loading**: Load images as they come into view
2. **Caching**: Cache ingredient data to reduce API calls
3. **Virtual Scrolling**: For very large ingredient lists
4. **Preloading**: Preload next page of ingredients

## Files Modified/Created

### New Files
- `client/src/views/Shop.vue` - Main shop page component

### Modified Files
- `client/src/services/apiService.ts` - Added getIngredients method and Ingredient interface
- `client/src/router/index.ts` - Added Shop route
- `client/src/components/AppHeader.vue` - Added Shop navigation button

## Dependencies

### Required Packages
- `ethers` - For blockchain interaction
- `vue` - For component framework
- `vue-router` - For navigation
- `pinia` - For state management

### External Services
- Backend API server
- Ethereum-compatible blockchain (zkxsolla)
- ERC1155 token contract

## Security Considerations

### User Safety
- **Price Verification**: Always fetch current price from contract
- **Transaction Confirmation**: Require user confirmation for all transactions
- **Error Handling**: Clear error messages for failed transactions
- **Wallet Validation**: Verify wallet connection before transactions

### Smart Contract Safety
- **Price Checks**: Verify contract price matches expected price
- **Amount Validation**: Ensure correct token amount is minted
- **Gas Estimation**: Provide gas estimates for transactions
- **Transaction Monitoring**: Track transaction status and confirmations

This implementation provides a complete, production-ready shop experience that integrates seamlessly with the existing application architecture and blockchain infrastructure.
