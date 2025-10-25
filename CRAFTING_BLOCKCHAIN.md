# Blockchain Crafting Integration Guide

## Overview

This document describes the blockchain crafting implementation for the Workbench smart contract. The server provides read-only methods to check crafting eligibility and fetch recipe data. **Crafting transactions should be executed directly from the frontend** where users sign with their own wallets.

---

## Architecture

### Components

1. **WorkbenchCraftingService** (`server/src/services/workbenchCraftingService.ts`)
   - Handles all interactions with the Workbench smart contract
   - Provides methods for crafting operations and recipe queries
   - Based on the technical documentation specifications

2. **Crafting Controller** (`server/src/controllers/craftingController.ts`)
   - Exposes REST API endpoints for crafting operations
   - Manages authentication and validation
   - Handles private key operations securely

3. **Crafting Routes** (`server/src/routes/craftingRoutes.ts`)
   - Defines API endpoints for crafting
   - Complete Swagger documentation

---

## Configuration

The same environment variables from blockchain integration apply:

```bash
# Required
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
WORKBENCH_CONTRACT_ADDRESS=0x51E66B9bE9221B2eF0B30071fad1527A003F4449
```

---

## API Endpoints

### 🔍 Read-Only Endpoints (No Gas, No Private Keys)

#### 1. Check if User Can Craft
```http
GET /api/crafting/can-craft/:recipeId/:address
```

**Description:** Check if a user has all required ingredients and approvals to craft a recipe.

**Example:**
```bash
curl http://localhost:3001/api/crafting/can-craft/1/0x1234...
```

**Response:**
```json
{
  "success": true,
  "message": "Crafting eligibility checked successfully",
  "data": {
    "recipeId": 1,
    "address": "0x1234...",
    "canCraft": true,
    "contractAddress": "0x51E66B9bE9221B2eF0B30071fad1527A003F4449"
  }
}
```

---

#### 2. Get Recipe from Blockchain
```http
GET /api/crafting/recipe/:recipeId
```

**Description:** Get recipe details from the blockchain.

**Example:**
```bash
curl http://localhost:3001/api/crafting/recipe/1
```

**Response:**
```json
{
  "success": true,
  "message": "Recipe retrieved successfully",
  "data": {
    "recipeId": 1,
    "ingredients": [
      {
        "tokenContract": "0x...",
        "tokenId": "1",
        "amount": "10",
        "position": 0
      },
      {
        "tokenContract": "0x...",
        "tokenId": "2",
        "amount": "5",
        "position": 1
      }
    ],
    "outputContract": "0x...",
    "outputTokenId": "3",
    "outputAmount": "1",
    "requiresExactPattern": false,
    "active": true,
    "name": "Wooden Plank Recipe",
    "contractAddress": "0x51E66B9bE9221B2eF0B30071fad1527A003F4449"
  }
}
```

---

#### 3. Get Active Recipe IDs
```http
GET /api/crafting/active-recipes
```

**Description:** Get all active recipe IDs from the blockchain.

**Example:**
```bash
curl http://localhost:3001/api/crafting/active-recipes
```

**Response:**
```json
{
  "success": true,
  "message": "Active recipe IDs retrieved successfully",
  "data": {
    "recipeIds": ["0", "1", "2", "5"],
    "count": 4,
    "contractAddress": "0x51E66B9bE9221B2eF0B30071fad1527A003F4449"
  }
}
```

---

#### 4. Get Active Recipes with Details
```http
GET /api/crafting/active-recipes/details
```

**Description:** Get all active recipes with full details (combines getActiveRecipeIds + getRecipe).

**Example:**
```bash
curl http://localhost:3001/api/crafting/active-recipes/details
```

**Response:**
```json
{
  "success": true,
  "message": "Active recipes retrieved successfully",
  "data": {
    "recipes": [
      {
        "id": "0",
        "ingredients": [...],
        "outputContract": "0x...",
        "outputTokenId": "3",
        "outputAmount": "1",
        "requiresExactPattern": false,
        "active": true,
        "name": "Wooden Plank Recipe"
      },
      ...
    ],
    "count": 4,
    "contractAddress": "0x51E66B9bE9221B2eF0B30071fad1527A003F4449"
  }
}
```

---

## Technical Implementation

### Recommended Crafting Flow (Frontend)

```
1. Backend: Check if user can craft
   GET /api/crafting/can-craft/:recipeId/:address
   ↓
2. Frontend: User connects wallet (MetaMask, WalletConnect, etc.)
   ↓
3. Frontend: User approves Workbench contract (if not already approved)
   contract.setApprovalForAll(workbenchAddress, true)
   ↓
4. Frontend: Execute crafting (user signs with wallet)
   contract.craftWithoutGrid(recipeId) or
   contract.craftWithGrid(recipeId, grid)
   ↓
5. Frontend: Wait for transaction confirmation
   await tx.wait()
   ↓
6. Frontend: Display success/receipt to user
```

### Smart Contract Methods

**Backend (Read-Only):**
| Method | Purpose | Gas Cost |
|--------|---------|----------|
| `canCraft(recipeId, address)` | Check eligibility | 0 (view) |
| `getRecipe(recipeId)` | Get recipe details | 0 (view) |
| `getActiveRecipeIds()` | Get all active recipes | 0 (view) |

**Frontend (Write - User Signs):**
| Method | Purpose | Gas Cost |
|--------|---------|----------|
| `setApprovalForAll(operator, approved)` | Approve Workbench | ~45k |
| `craftWithoutGrid(recipeId)` | Craft (flexible) | ~200k-350k |
| `craftWithGrid(recipeId, grid)` | Craft (exact) | ~180k-300k |

---

## Crafting Types

### 1. Flexible Pattern (craftWithoutGrid)
- **Gas Cost:** ~200k-350k
- **Use Case:** Recipe doesn't care about ingredient positions
- **Example:** 10 Wood → 5 Planks (position doesn't matter)

### 2. Exact Pattern (craftWithGrid)
- **Gas Cost:** ~180k-300k
- **Use Case:** Recipe requires specific ingredient placement
- **Example:** Minecraft-style crafting (sword pattern)

---

## Security Considerations

### ✅ Secure Architecture

**Backend Responsibilities:**
- ✅ Provide read-only data (recipes, eligibility checks)
- ✅ No private keys stored or handled
- ✅ No transaction signing

**Frontend Responsibilities:**
- ✅ User connects their own wallet (MetaMask, WalletConnect, etc.)
- ✅ User signs transactions with their private key (never leaves their wallet)
- ✅ User pays gas fees from their wallet
- ✅ Complete control and security for the user

### Recommended Implementation

**Backend API (Read-Only):**
```typescript
// Check if user can craft
const canCraft = await fetch(
  `${API_URL}/api/crafting/can-craft/${recipeId}/${userAddress}`
).then(r => r.json());
```

**Frontend Crafting (User Signs):**
```typescript
// User connects wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(workbenchAddress, abi, signer);

// Check approval
const erc1155 = new ethers.Contract(tokenAddress, erc1155Abi, signer);
const isApproved = await erc1155.isApprovedForAll(
  await signer.getAddress(),
  workbenchAddress
);

if (!isApproved) {
  // User approves (one-time)
  const approveTx = await erc1155.setApprovalForAll(workbenchAddress, true);
  await approveTx.wait();
}

// User crafts (signs with their wallet)
const tx = await contract.craftWithoutGrid(recipeId);
console.log(`Transaction sent: ${tx.hash}`);

const receipt = await tx.wait();
console.log(`Crafted successfully! Block: ${receipt.blockNumber}`);
```

---

## Error Handling

### Common Errors

#### "Crafting service not available" (503)
```json
{
  "success": false,
  "message": "Crafting service not available. Configure BLOCKCHAIN_RPC_URL and WORKBENCH_CONTRACT_ADDRESS."
}
```
**Solution:** Configure environment variables.

---

#### "Insufficient ingredient balance" (Blockchain Error)
```json
{
  "success": false,
  "message": "Failed to execute craft: execution reverted: Insufficient ingredient balance"
}
```
**Solution:** Ensure user has all required ingredients.

---

#### "Workbench not approved" (Blockchain Error)
```json
{
  "success": false,
  "message": "Failed to execute craft: execution reverted: Workbench not approved"
}
```
**Solution:** User must approve Workbench contract to spend their tokens:
```typescript
// Frontend
const tokenContract = new ethers.Contract(tokenAddress, erc1155Abi, signer);
await tokenContract.setApprovalForAll(workbenchAddress, true);
```

---

#### "Recipe does not exist" (Blockchain Error)
```json
{
  "success": false,
  "message": "Failed to execute craft: execution reverted: Recipe does not exist"
}
```
**Solution:** Verify recipe ID exists and is active.

---

## Gas Optimization

The service automatically adds a 20% buffer to gas estimates:

```typescript
const gasEstimate = await contract.estimateGas.craftWithoutGrid(recipeId);
const gasLimit = (gasEstimate * 120n) / 100n; // +20% buffer
```

**Why?**
- Gas costs can vary between estimation and execution
- Network congestion
- State changes between calls

---

## Testing with Swagger

1. Start server: `cd server && npm run dev`
2. Open Swagger: `http://localhost:3001/api-docs`
3. Navigate to **"Crafting - Blockchain"** section
4. Test read-only endpoints first (no gas required)
5. For transaction endpoints, use a test wallet with test ETH

---

## Complete Crafting Example

### Backend: Check Eligibility
```bash
# 1. Check if user can craft
curl http://localhost:3001/api/crafting/can-craft/1/0x1234...
# Response: { "canCraft": true }

# 2. Get recipe details
curl http://localhost:3001/api/crafting/recipe/1
# Response: { "ingredients": [...], "outputTokenId": "3", ... }

# 3. Get all active recipes
curl http://localhost:3001/api/crafting/active-recipes/details
# Response: { "recipes": [...], "count": 10 }
```

### Frontend: Execute Crafting

```typescript
// Complete crafting flow with user's wallet
async function craftItem(recipeId: number) {
  try {
    // 1. Check eligibility via backend
    const checkResponse = await fetch(
      `${API_URL}/api/crafting/can-craft/${recipeId}/${userAddress}`
    );
    const { data } = await checkResponse.json();
    
    if (!data.canCraft) {
      alert("You don't have the required ingredients!");
      return;
    }

    // 2. Connect wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // 3. Get contracts
    const workbench = new ethers.Contract(
      WORKBENCH_ADDRESS,
      WORKBENCH_ABI,
      signer
    );
    const erc1155 = new ethers.Contract(
      ERC1155_ADDRESS,
      ERC1155_ABI,
      signer
    );

    // 4. Check approval
    const isApproved = await erc1155.isApprovedForAll(
      userAddress,
      WORKBENCH_ADDRESS
    );

    if (!isApproved) {
      console.log('Requesting approval...');
      const approveTx = await erc1155.setApprovalForAll(
        WORKBENCH_ADDRESS,
        true
      );
      await approveTx.wait();
      console.log('Approved!');
    }

    // 5. Craft (user signs)
    console.log('Crafting...');
    const tx = await workbench.craftWithoutGrid(recipeId);
    console.log(`Transaction sent: ${tx.hash}`);

    // 6. Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Crafted successfully! Block: ${receipt.blockNumber}`);
    
    alert('Item crafted successfully!');
    
    return receipt;
  } catch (error) {
    console.error('Crafting failed:', error);
    alert(`Crafting failed: ${error.message}`);
  }
}
```

---

## References

- [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) - Ingredient blockchain integration
- [TECHNICAL-DOC.md](./TECHNICAL-DOC.md) - Full smart contract specifications
- [Workbench Contract Methods](./TECHNICAL-DOC.md#workbench-contract)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0  
**Security Level:** ⚠️ HIGH (Private Key Operations)

