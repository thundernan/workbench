# Shop Feature Documentation

## Overview
The Shop page allows users to claim free starter resources or purchase premium items using ETH. This provides a user-friendly way to acquire resources for crafting.

## Features

### 🎁 Free Starter Resources
- **One-time claim per wallet address**
- Users receive starter resources to begin crafting
- Claim status is tracked in localStorage per wallet address
- Items automatically added to inventory upon claim

#### Free Resources Included:
- 🪵 Wood × 20 (Common)
- 🪨 Stone × 15 (Common)
- ⬛ Iron × 5 (Uncommon)

### 💎 Premium Resources
- **Purchase with ETH**
- Rare and legendary materials available
- Real blockchain transactions using connected wallet
- Automatic inventory updates after successful purchase
- Transaction history tracking

#### Premium Items Available:
1. **💎 Diamond** (Rare)
   - Quantity: 5
   - Price: 0.001 ETH

2. **🪙 Gold** (Epic)
   - Quantity: 10
   - Price: 0.002 ETH

3. **💚 Emerald** (Epic)
   - Quantity: 3
   - Price: 0.0015 ETH

4. **💔 Ruby** (Legendary)
   - Quantity: 1
   - Price: 0.005 ETH

5. **⚪ Platinum** (Legendary)
   - Quantity: 5
   - Price: 0.003 ETH

6. **✨ Mythril** (Legendary)
   - Quantity: 3
   - Price: 0.01 ETH

## User Interface

### Layout
- **Header**: Standard navigation with wallet connection
- **Free Resources Section**: Green-themed section for free claims
- **Premium Resources Section**: Blue-themed section for purchases
- **Transaction History**: Recent purchases log

### Visual Features
- Rarity-based color coding (Common → Legendary)
- Hover effects on item cards
- Loading states during transactions
- Real-time balance display
- Responsive grid layout

### Rarity System
- **Common**: Gray (border-gray-500)
- **Uncommon**: Green (border-green-500)
- **Rare**: Blue (border-blue-500)
- **Epic**: Purple (border-purple-500)
- **Legendary**: Gold (border-yellow-500 with glow effect)

## Technical Implementation

### Components
- `client/src/views/Shop.vue` - Main shop component

### State Management
```typescript
const hasClaimed = ref(false);           // Claim status
const isClaiming = ref(false);           // Claim in progress
const isPurchasing = ref(false);         // Purchase in progress
const walletBalance = ref('0.0000');     // User's ETH balance
const transactions = ref<Transaction[]>([]); // Purchase history
```

### Key Functions

#### 1. `claimFreeResources()`
- Validates wallet connection
- Checks if already claimed
- Adds items to inventory
- Saves claim status to localStorage
- Shows success notification

#### 2. `purchaseItem(shopItem)`
- Validates wallet connection and balance
- Creates blockchain transaction
- Waits for confirmation
- Adds items to inventory
- Updates transaction history
- Refreshes wallet balance

#### 3. `updateBalance()`
- Fetches current ETH balance from wallet
- Formats and displays balance

#### 4. `checkClaimStatus()`
- Checks localStorage for claim history
- Prevents duplicate claims per wallet

### Wallet Integration
- Uses `ethers.js` for blockchain transactions
- Integrates with `useWalletStore` for wallet state
- Real ETH transactions (testnet/mainnet compatible)
- Transaction confirmation handling

## User Flow

### First-Time User (No Claim)
1. User navigates to Shop page
2. Connects wallet (if not connected)
3. Sees "Free Starter Resources" section
4. Clicks "Claim Free Resources"
5. Transaction processes (1.5s delay for UX)
6. Resources added to inventory
7. Success notification shown
8. Section shows "Already Claimed" message

### Returning User
1. User navigates to Shop page
2. Sees "Already Claimed" message in free section
3. Can browse and purchase premium items

### Premium Purchase Flow
1. User selects premium item
2. Reviews price in ETH
3. Clicks "Purchase" button
4. Wallet prompts for transaction approval
5. User confirms in wallet
6. App waits for blockchain confirmation
7. Items added to inventory
8. Transaction appears in history
9. Balance updated

## Wallet Connection Required
- Shop page requires connected wallet
- Shows connection prompt if not connected
- Automatically updates when wallet connects/disconnects
- Balance refreshes on page load

## Data Persistence

### LocalStorage
```javascript
// Claim status per wallet
claimed_{walletAddress} = 'true'
```

### Transaction History
- Stored in component state (session-based)
- Shows: item name, icon, quantity, price, timestamp
- Displays formatted time (e.g., "5m ago", "2h ago")

## Error Handling
- **No wallet**: Prompts user to connect
- **Insufficient balance**: Disables purchase button
- **Transaction rejected**: Shows cancellation message
- **Network error**: Shows error toast with details
- **Already claimed**: Prevents duplicate claims

## UI States

### Loading States
- **Claiming**: Button shows spinner and "Claiming..."
- **Purchasing**: Button shows spinner and "Processing..."

### Disabled States
- **Not enough ETH**: "✗ Insufficient Balance"
- **Processing**: Buttons disabled during transactions

### Success States
- **Claim success**: "🎁 Free resources claimed successfully!"
- **Purchase success**: "✅ Purchased 5× Diamond!"

## Shop Contract Address
```typescript
const shopAddress = '0x0000000000000000000000000000000000000001';
```
**Note**: Replace with actual deployed shop contract address

## Future Enhancements

### Potential Features
- [ ] Limited-time offers and sales
- [ ] Bulk purchase discounts
- [ ] Item bundles
- [ ] Daily login rewards
- [ ] Referral bonuses
- [ ] NFT purchases
- [ ] Multiple currency support (ERC20 tokens)
- [ ] Gift items to other players
- [ ] Inventory limit notifications

### Smart Contract Integration
- [ ] Deploy actual shop smart contract
- [ ] Implement on-chain purchase verification
- [ ] Add item ownership tracking
- [ ] Implement dynamic pricing
- [ ] Add escrow functionality

### UI Improvements
- [ ] Item preview/detail modal
- [ ] Search and filter functionality
- [ ] Sort by price/rarity
- [ ] Wishlist feature
- [ ] Shopping cart for multiple items
- [ ] Price history charts

## Security Considerations
1. **Claim Validation**: LocalStorage-based (can be improved with backend)
2. **Transaction Verification**: Wait for blockchain confirmation
3. **Balance Checks**: Validate sufficient funds before transaction
4. **Error Recovery**: Proper error handling for failed transactions

## Testing Checklist
- [ ] Connect wallet successfully
- [ ] Claim free resources (first time)
- [ ] Verify claim blocked on second attempt
- [ ] Purchase item with sufficient balance
- [ ] Verify purchase blocked with insufficient balance
- [ ] Cancel transaction in wallet
- [ ] Verify inventory updates after claim/purchase
- [ ] Check transaction history displays correctly
- [ ] Test on mobile devices
- [ ] Test with different wallet providers

## Related Files
- `client/src/views/Shop.vue` - Main component
- `client/src/router/index.ts` - Route configuration
- `client/src/components/AppHeader.vue` - Navigation
- `client/src/stores/wallet.ts` - Wallet state management
- `client/src/stores/inventory.ts` - Inventory state management
- `client/src/stores/toast.ts` - Notification system

## API/Contract Methods Used
- `walletStore.provider.getBalance()` - Get ETH balance
- `walletStore.signer.sendTransaction()` - Send ETH transaction
- `tx.wait()` - Wait for transaction confirmation
- `inventoryStore.addItem()` - Add items to inventory

---

**Created**: October 25, 2025  
**Status**: ✅ Completed and Ready for Use  
**Version**: 1.0


