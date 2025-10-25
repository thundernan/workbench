# Blockchain Crafting System - Implementation Guide

## Overview

This guide explains the blockchain-integrated crafting system that fetches recipes from the server and enables smart contract interactions.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Crafting System Flow                    │
└─────────────────────────────────────────────────────────┘

1. Server listens to blockchain RecipeCreated events
2. Server syncs recipes to MongoDB
3. Client fetches recipes from server API
4. User places ingredients in crafting grid
5. Client checks if pattern matches recipe
6. Client verifies user has required tokens (via smart contract)
7. User clicks "Craft" → Smart contract transaction
8. Smart contract validates & executes crafting
9. User receives result tokens
```

## Components Created/Updated

### 1. Types (`client/src/types/index.ts`)

**New Types:**
- `BlockchainRecipeIngredient` - Recipe ingredient with token contract, ID, amount, position
- `BlockchainRecipe` - Complete recipe from blockchain
- `BlockchainToken` - ERC1155 token reference
- `CraftingCheck` - Result of checking if crafting is possible

### 2. Services

#### `apiService.ts`
Updated Recipe interface to match server schema.

#### `craftingContractService.ts` (NEW)
Smart contract interaction service:

```typescript
import craftingService from '@/services/craftingContractService';

// Check if user has ingredients
const check = await craftingService.checkIngredients(
  userAddress,
  recipe,
  provider
);

// Execute craft
const tx = await craftingService.craft(recipe, signer);
await tx.wait();

// Get token balance
const balance = await craftingService.getTokenBalance(
  userAddress,
  tokenContract,
  tokenId,
  provider
);
```

**Key Methods:**
- `checkIngredients()` - Verify user has required tokens
- `craft()` - Execute crafting transaction
- `getTokenBalance()` - Check user's token balance
- `estimateCraftGas()` - Estimate gas for transaction
- `getCraftingFee()` - Get crafting fee if applicable

### 3. Stores

#### `recipes.ts` (UPDATED)
Added blockchain recipe support:

```typescript
import { useRecipesStore } from '@/stores/recipes';

const recipesStore = useRecipesStore();

// Fetch recipes from server
await recipesStore.fetchBlockchainRecipes();

// Get all recipes
const recipes = recipesStore.allBlockchainRecipes;

// Find recipe by blockchain ID
const recipe = recipesStore.getBlockchainRecipe('recipe_id');

// Match grid to recipe
const gridMap = new Map();
gridMap.set(0, { tokenContract: '0x...', tokenId: 1 });
const matchedRecipe = recipesStore.matchBlockchainRecipe(gridMap);
```

### 4. Components

#### `BlockchainRecipeBook.vue` (NEW)
Displays recipes fetched from server:
- Loads recipes on mount
- Search and filter functionality
- Recipe grid preview
- Shows token IDs and positions
- Autofill button

**Usage:**
```vue
<BlockchainRecipeBook @autofill="handleAutofill" />
```

## Integration Steps

### Step 1: Environment Variables

Add to `client/.env`:
```env
# Crafting Contract
VITE_CRAFTING_CONTRACT_ADDRESS=0xYourCraftingContract
VITE_TOKEN_CONTRACT_ADDRESS=0xYourERC1155Contract
```

### Step 2: Update Workbench View

Replace `RecipeBook` with `BlockchainRecipeBook`:

```vue
<script setup>
import BlockchainRecipeBook from '@/components/BlockchainRecipeBook.vue';
// ... other imports
</script>

<template>
  <!-- ... -->
  <BlockchainRecipeBook @autofill="handleAutofill" />
  <!-- ... -->
</template>
```

### Step 3: Update CraftingGrid

The CraftingGrid needs to:
1. Track tokens (not just items)
2. Check blockchain inventory
3. Call smart contract for crafting

**Example Pattern:**
```typescript
// In CraftingGrid.vue
import craftingService from '@/services/craftingContractService';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

// Check if can craft
const checkCrafting = async (recipe: BlockchainRecipe) => {
  if (!walletStore.connected || !walletStore.provider) {
    throw new Error('Wallet not connected');
  }

  const check = await craftingService.checkIngredients(
    walletStore.address!,
    recipe,
    walletStore.provider
  );

  return check.canCraft;
};

// Execute craft
const executeCraft = async (recipe: BlockchainRecipe) => {
  if (!walletStore.connected || !walletStore.signer) {
    throw new Error('Wallet not connected');
  }

  try {
    // Execute transaction
    const tx = await craftingService.craft(recipe, walletStore.signer);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('Crafted successfully!', receipt.hash);
  } catch (error) {
    console.error('Crafting failed:', error);
    throw error;
  }
};
```

### Step 4: Token Inventory System

You'll need to track user's ERC1155 tokens. This can be done by:

**Option A: On-chain queries**
```typescript
// Query user's token balances
const balance = await craftingService.getTokenBalance(
  userAddress,
  tokenContract,
  tokenId,
  provider
);
```

**Option B: Indexed via events**
- Listen to Transfer events
- Cache balances locally
- Refresh periodically

## Recipe Data Structure

### Server Schema
```typescript
{
  blockchainRecipeId: "1",              // From smart contract
  resultTokenContract: "0x...",         // ERC1155 contract
  resultTokenId: 5,                     // Token ID produced
  resultAmount: 1,                      // Quantity produced
  ingredients: [
    {
      tokenContract: "0x...",           // Required token contract
      tokenId: 1,                       // Required token ID
      amount: 3,                        // Quantity needed
      position: 4                       // Grid position (0-8)
    }
  ],
  name: "Iron Sword",
  description: "A sharp blade",
  category: "weapon",
  difficulty: 3
}
```

### Grid Positions
```
┌───┬───┬───┐
│ 0 │ 1 │ 2 │
├───┼───┼───┤
│ 3 │ 4 │ 5 │
├───┼───┼───┤
│ 6 │ 7 │ 8 │
└───┴───┴───┘
```

## Smart Contract Interface

Expected contract methods:

```solidity
// Craft function
function craft(
    uint256 recipeId,
    Ingredient[] calldata ingredients
) external payable;

// Ingredient struct
struct Ingredient {
    address tokenContract;
    uint256 tokenId;
    uint256 amount;
    uint8 position;
}

// Check balance (ERC1155)
function balanceOf(address account, uint256 id) external view returns (uint256);

// Optional: Get crafting fee
function getCraftingFee() external view returns (uint256);
```

## Error Handling

Common errors and solutions:

### "Wallet not connected"
**Solution:** Ensure user connects wallet before crafting
```typescript
if (!walletStore.connected) {
  toastStore.showToast({
    type: 'error',
    message: 'Please connect your wallet first'
  });
  return;
}
```

### "Insufficient ingredients"
**Solution:** Check inventory before allowing craft
```typescript
const check = await craftingService.checkIngredients(...);
if (!check.canCraft) {
  // Show missing ingredients
  console.log('Missing:', check.missingIngredients);
}
```

### "Transaction rejected"
**Solution:** User cancelled in MetaMask - handle gracefully
```typescript
try {
  await executeCraft(recipe);
} catch (error) {
  if (error.message.includes('rejected')) {
    toastStore.showToast({
      type: 'info',
      message: 'Transaction cancelled'
    });
  }
}
```

## Testing

### 1. Test Recipe Loading
```bash
# Start server and client
npm run dev

# Visit http://localhost:3000/api-test
# Click "Fetch Recipes" - should show recipes
```

### 2. Test Recipe Display
```
# Visit http://localhost:3000/workbench
# Recipe book should show loaded recipes
# Click on recipe to see details
```

### 3. Test Crafting (Mock)
```typescript
// In browser console
const recipe = recipesStore.allBlockchainRecipes[0];
const check = await craftingService.checkIngredients(
  walletStore.address,
  recipe,
  walletStore.provider
);
console.log('Can craft:', check.canCraft);
```

## Next Steps

1. **Deploy Smart Contract** with craft function
2. **Update Contract Addresses** in `.env`
3. **Implement Token Inventory** tracking
4. **Update CraftingGrid** to use blockchain recipes
5. **Test** full flow end-to-end

## Files Reference

Created/Updated files:
- ✅ `client/src/types/index.ts` - Added blockchain types
- ✅ `client/src/services/apiService.ts` - Updated Recipe interface
- ✅ `client/src/services/craftingContractService.ts` - NEW smart contract service
- ✅ `client/src/stores/recipes.ts` - Added blockchain recipe methods
- ✅ `client/src/components/BlockchainRecipeBook.vue` - NEW recipe display
- ⏳ `client/src/components/CraftingGrid.vue` - Needs update for blockchain
- ⏳ `client/src/stores/inventory.ts` - Needs update for ERC1155 tokens

## Support

For questions or issues:
1. Check server logs: `npm run server:dev`
2. Check browser console for errors
3. Verify wallet is connected
4. Ensure contracts are deployed
5. Check API endpoint: `http://localhost:3001/api/recipes`

---

**Status:** Core blockchain integration complete. Crafting grid update in progress.

