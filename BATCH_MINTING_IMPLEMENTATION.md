# Batch Minting Implementation

## Overview
Implemented a batch minting feature that allows users to claim multiple free ingredients with a single blockchain transaction instead of minting them one by one.

## Features Implemented

### 1. **Free Starter Pack Section** 🎁
- Added 5 free starter resources (tokenIds 51-55):
  - Basic Wood (🪵)
  - Basic Stone (🪨)
  - Basic Fiber (🧵)
  - Basic Coal (⚫)
  - Basic Iron (⬛)
- Prominent section at the top of the Resources page
- Visual design with emerald gradient and clear "FREE" indicators
- Shows current balance for each free resource

### 2. **Batch Claim Functionality**
- Single button to claim all free resources at once
- Uses `publicMintBatch()` from ERC1155 contract
- Claims 10 units of each free resource
- Only requires ONE transaction signature
- Automatically reloads balances after claiming

### 3. **Enhanced UI/UX**
- Clear distinction between FREE and PAID resources
- "FREE" badge on resource cards with price 0
- Updated purchase button text:
  - Shows "🎁 Claim" for free resources
  - Shows "💰 Purchase" for paid resources
- Recent purchases section shows "FREE" for claimed items

## Technical Implementation

### Backend (Smart Contract)
The `GameItemsERC1155.sol` contract already has the `publicMintBatch()` function:

```solidity
function publicMintBatch(uint256[] memory ids, uint256[] memory amounts) external payable {
    require(ids.length == amounts.length, "Arrays length mismatch");
    
    uint256 totalPrice = 0;
    for (uint256 i = 0; i < ids.length; i++) {
        totalPrice += tokenPrices[ids[i]] * amounts[i];
    }
    
    require(msg.value == totalPrice, "Incorrect ETH amount sent");
    
    // Track spending if ETH was sent
    if (msg.value > 0) {
        totalSpentByAddress[msg.sender] += msg.value;
        _checkAndGiveReward(msg.sender);
    }
    
    _mintBatch(msg.sender, ids, amounts, "");
}
```

### Frontend Implementation

#### Service Layer (`erc1155Service.ts`)
Already has `publicMintBatch()` method:
```typescript
async publicMintBatch(tokenIds: number[], amounts: number[]): Promise<ethers.ContractTransactionResponse> {
  if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
  
  // Calculate total price
  let totalPrice = BigInt(0);
  for (let i = 0; i < tokenIds.length; i++) {
    const price = await this.contract.tokenPrices(tokenIds[i]);
    totalPrice += price * BigInt(amounts[i]);
  }
  
  const tx = await this.contract.publicMintBatch(tokenIds, amounts, { value: totalPrice });
  return tx;
}
```

#### Composable Layer (`useERC1155.ts`)
Already has `mintBatch()` wrapper:
```typescript
const mintBatch = async (tokenIds: number[], amounts: number[]): Promise<string> => {
  if (!service.value) throw new Error('Service not initialized');
  
  loading.value = true;
  error.value = null;
  
  try {
    const tx = await service.value.publicMintBatch(tokenIds, amounts);
    const receipt = await tx.wait();
    
    toast.add({
      severity: 'success',
      summary: 'Batch Mint Successful',
      detail: `Minted ${amounts.length} different tokens`,
      life: 5000
    });
    
    return receipt.hash;
  } catch (err: any) {
    // Error handling
  } finally {
    loading.value = false;
  }
};
```

#### Component Layer (`ResourceMinting.vue`)
New `handleBatchClaim()` function:
```typescript
const handleBatchClaim = async () => {
  if (freeResources.value.length === 0) return;
  
  loading.value = true;
  
  try {
    // Prepare arrays for batch minting
    const tokenIds = freeResources.value.map(r => r.tokenId);
    const amounts = freeResources.value.map(() => 10); // 10 of each
    
    erc1155.initializeService();
    const txHash = await erc1155.mintBatch(tokenIds, amounts);
    
    // Add to recent purchases
    recentPurchases.value.unshift({
      name: 'Free Starter Pack',
      icon: '🎁',
      amount: freeResources.value.length,
      cost: '0.00',
      txHash: txHash
    });
    
    // Reload balances
    await loadBalances();
    
    toastStore.showToast({
      type: 'success',
      message: `Claimed ${freeResources.value.length} free starter resources!`
    });
  } catch (error: any) {
    console.error('Batch claim failed:', error);
    toastStore.showToast({
      type: 'error',
      message: error.message || 'Failed to claim free resources'
    });
  } finally {
    loading.value = false;
  }
};
```

## Testing Instructions

### Prerequisites
1. Wallet connected to the application
2. Free token types (51-55) configured on the ERC1155 contract with price = 0
3. Gas in wallet for transaction fees

### Test Scenarios

#### 1. **Basic Batch Claim**
- Navigate to Resources page (`/resources`)
- Connect wallet
- Verify Free Starter Pack section is visible
- Click "✨ Claim All Free (5 items)" button
- Confirm transaction in MetaMask
- Verify success toast appears
- Check balances updated (+10 for each resource)

#### 2. **Multiple Claims**
- Perform batch claim
- Wait for transaction to complete
- Click batch claim button again
- Verify balances increase correctly
- Check Recent Purchases shows both claims

#### 3. **Individual Free Resource Claim**
- Click on a free resource card (e.g., Basic Wood)
- Verify "FREE" is displayed instead of price
- Verify button says "🎁 Claim" not "💰 Purchase"
- Adjust quantity
- Click claim button
- Verify transaction completes

#### 4. **UI Verification**
- Verify FREE badge on all free resources
- Verify paid resources still show ETH price
- Check Recent Purchases section displays "FREE" for free items
- Verify balance updates in real-time

#### 5. **Error Handling**
- Disconnect wallet during claim
- Reject transaction in MetaMask
- Verify appropriate error messages

## Benefits

### For Users
✅ **Single Transaction** - Claim all free resources with one signature
✅ **Lower Gas Costs** - One transaction instead of 5 separate ones
✅ **Better UX** - Faster and more convenient
✅ **Clear Distinction** - Easy to see which resources are free

### For Development
✅ **Reusable Pattern** - Can be extended for other batch operations
✅ **Clean Code** - Well-structured with separation of concerns
✅ **Type Safe** - Full TypeScript support
✅ **Error Handling** - Comprehensive error catching and user feedback

## Future Enhancements

### Possible Improvements
1. **Custom Batch Selection** - Allow users to select specific free items
2. **Quantity Control** - Let users choose how many of each to claim
3. **Daily Limits** - Implement cooldown or daily claim limits
4. **Batch Purchase** - Extend to paid resources with shopping cart
5. **Animation** - Add visual effects when claiming
6. **Analytics** - Track batch claim usage

### Additional Features
- Batch transfer functionality
- Batch approval for crafting
- Batch listing for marketplace
- Gift packs with predefined resource bundles

## Configuration

### Adding New Free Resources
To add more free resources, update the resources array in `ResourceMinting.vue`:

```typescript
const resources = [
  // Add new free resource
  { 
    tokenId: 56, 
    category: 'starter', 
    name: 'Your Resource', 
    icon: '🎯', 
    price: '0', 
    description: 'Free resource' 
  },
  // ... existing resources
];
```

### Changing Claim Amount
To change the default claim amount from 10, modify line 360 in `handleBatchClaim()`:

```typescript
const amounts = freeResources.value.map(() => 10); // Change 10 to desired amount
```

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         ResourceMinting.vue             │
│  (UI Component)                         │
│  - Free Starter Pack Section            │
│  - Batch Claim Button                   │
│  - handleBatchClaim()                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         useERC1155.ts                   │
│  (Composable)                           │
│  - mintBatch()                          │
│  - Error handling                       │
│  - Toast notifications                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       erc1155Service.ts                 │
│  (Service Layer)                        │
│  - publicMintBatch()                    │
│  - Price calculation                    │
│  - Transaction creation                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     GameItemsERC1155.sol                │
│  (Smart Contract)                       │
│  - publicMintBatch()                    │
│  - Price validation                     │
│  - _mintBatch()                         │
└─────────────────────────────────────────┘
```

## File Changes Summary

### Modified Files
1. **`client/src/components/ResourceMinting.vue`**
   - Added 5 free starter resources
   - Added Free Starter Pack section (UI)
   - Added `handleBatchClaim()` function
   - Added computed properties: `freeResources`, `paidResources`, `isFreeResource`
   - Updated UI to show "FREE" labels
   - Updated button text based on resource type
   - Updated Recent Purchases display

### Existing Files (No Changes Needed)
1. **`client/src/services/erc1155Service.ts`** ✓
2. **`client/src/composables/useERC1155.ts`** ✓
3. **Smart Contract: `GameItemsERC1155.sol`** ✓

## Conclusion

The batch minting feature is now fully implemented and ready for use! Users can claim all free starter resources with a single click, significantly improving the user experience and reducing gas costs.

**Key Achievement:** Reduced from 5 separate transactions to 1 batch transaction! 🎉

