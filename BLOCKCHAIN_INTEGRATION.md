# Blockchain Integration Guide

## Overview

This document describes the blockchain integration implemented in the Workbench backend server. The server can interact with ERC1155 smart contracts to fetch ingredient/token data and sync recipes from blockchain events.

---

## Architecture

### Components

1. **IngredientBlockchainService** (`server/src/services/ingredientBlockchainService.ts`)
   - Handles all interactions with the ERC1155 GameItems smart contract
   - Provides methods to query token data (balance, price, supply, metadata)
   - Based on the technical documentation specifications

2. **BlockchainListener** (`server/src/services/blockchainListener.ts`)
   - Listens to `RecipeCreated` events from the Workbench smart contract
   - Automatically syncs new recipes to the MongoDB database

3. **Ingredient Controller** (`server/src/controllers/ingredientController.ts`)
   - Exposes REST API endpoints for blockchain operations
   - Manages the relationship between blockchain data and database records

---

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
WORKBENCH_CONTRACT_ADDRESS=0x51E66B9bE9221B2eF0B30071fad1527A003F4449
ERC1155_CONTRACT_ADDRESS=0x... # Your ERC1155 GameItems contract address
```

**Notes:**
- `BLOCKCHAIN_RPC_URL`: RPC URL for your blockchain network (zkSync Era, Ethereum, etc.)
- `WORKBENCH_CONTRACT_ADDRESS`: Address of the Workbench contract (for recipe events)
- `ERC1155_CONTRACT_ADDRESS`: Address of the ERC1155 GameItems contract (for ingredients/tokens)
- If these are not configured, blockchain features will be disabled gracefully

---

## API Endpoints

### Blockchain Integration Endpoints

All blockchain endpoints are under `/api/ingredients/blockchain/`

#### 1. Get Token Balance
```http
GET /api/ingredients/blockchain/balance/:address/:tokenId
```

**Description:** Get token balance for a specific wallet address.

**Example Request:**
```bash
curl http://localhost:3001/api/ingredients/blockchain/balance/0x1234.../1
```

**Example Response:**
```json
{
  "success": true,
  "message": "Token balance retrieved successfully",
  "data": {
    "address": "0x1234...",
    "tokenId": 1,
    "balance": "100",
    "contractAddress": "0x..."
  }
}
```

---

#### 2. Get Token Price
```http
GET /api/ingredients/blockchain/price/:tokenId
```

**Description:** Get token price from blockchain (in Wei and ETH).

**Example Request:**
```bash
curl http://localhost:3001/api/ingredients/blockchain/price/1
```

**Example Response:**
```json
{
  "success": true,
  "message": "Token price retrieved successfully",
  "data": {
    "tokenId": 1,
    "priceWei": "50000000000000000",
    "priceEth": "0.05",
    "contractAddress": "0x..."
  }
}
```

---

#### 3. Get Token Info
```http
GET /api/ingredients/blockchain/info/:tokenId
```

**Description:** Get comprehensive token information from blockchain.

**Example Request:**
```bash
curl http://localhost:3001/api/ingredients/blockchain/info/1
```

**Example Response:**
```json
{
  "success": true,
  "message": "Token info retrieved successfully",
  "data": {
    "tokenId": 1,
    "contractAddress": "0x...",
    "name": "Wood",
    "uri": "https://...",
    "priceWei": "50000000000000000",
    "priceEth": "0.05",
    "totalSupply": "1000",
    "exists": true
  }
}
```

---

#### 4. Get Token Supply
```http
GET /api/ingredients/blockchain/supply/:tokenId
```

**Description:** Get total supply of a token from blockchain.

**Example Request:**
```bash
curl http://localhost:3001/api/ingredients/blockchain/supply/1
```

**Example Response:**
```json
{
  "success": true,
  "message": "Token supply retrieved successfully",
  "data": {
    "tokenId": 1,
    "totalSupply": "1000",
    "contractAddress": "0x..."
  }
}
```

---

#### 5. Check Token Existence
```http
GET /api/ingredients/blockchain/exists/:tokenId
```

**Description:** Check if a token exists on blockchain.

**Example Request:**
```bash
curl http://localhost:3001/api/ingredients/blockchain/exists/1
```

**Example Response:**
```json
{
  "success": true,
  "message": "Token existence checked successfully",
  "data": {
    "tokenId": 1,
    "exists": true,
    "contractAddress": "0x..."
  }
}
```

---

#### 6. Sync Ingredient from Blockchain
```http
POST /api/ingredients/blockchain/sync
Content-Type: application/json
```

**Description:** Sync an ingredient from blockchain and create it in the database.

**Request Body:**
```json
{
  "tokenId": 1,
  "metadata": {
    "name": "Custom Wood",
    "image": "custom-wood.png",
    "description": "A custom wood ingredient",
    "category": "material"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/ingredients/blockchain/sync \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1,
    "metadata": {
      "name": "Wood",
      "image": "wood.png"
    }
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Ingredient synced from blockchain successfully",
  "data": {
    "_id": "65abc123...",
    "tokenContract": "0x...",
    "tokenId": 1,
    "ingredientData": "65def456...",
    "metadata": {
      "name": "Wood",
      "image": "wood.png",
      "uri": "https://...",
      "priceWei": "50000000000000000",
      "priceEth": "0.05",
      "totalSupply": "1000"
    },
    "blockchainInfo": {
      "tokenId": 1,
      "contractAddress": "0x...",
      "name": "Wood",
      "uri": "https://...",
      "priceWei": "50000000000000000",
      "priceEth": "0.05",
      "totalSupply": "1000",
      "exists": true
    },
    "createdAt": "2025-10-25T...",
    "updatedAt": "2025-10-25T..."
  }
}
```

---

## Error Handling

### Service Not Available (503)
```json
{
  "success": false,
  "message": "Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS."
}
```

**Solution:** Configure the required environment variables in `.env`.

---

### Token Not Found (404)
```json
{
  "success": false,
  "message": "Token 999 does not exist on blockchain"
}
```

**Solution:** Ensure the token ID exists on the blockchain.

---

### Already Synced (409)
```json
{
  "success": false,
  "message": "Ingredient already synced from blockchain",
  "data": { ... }
}
```

**Solution:** The ingredient already exists in the database. Use the update endpoint instead.

---

## Technical Implementation

### IngredientBlockchainService

The service uses ethers.js v6 to interact with the ERC1155 contract:

```typescript
// Initialize the service
const service = new IngredientBlockchainService(
  'https://zkrpc-sepolia.xsollazk.com',
  '0x...' // ERC1155 contract address
);

// Get token balance
const balance = await service.getTokenBalance('0x...', 1);

// Get token info
const info = await service.getTokenInfo(1);
```

### Supported ERC1155 Methods

The service implements the following contract methods:

- `balanceOf(address, tokenId)`: Get token balance
- `balanceOfBatch(addresses[], tokenIds[])`: Get multiple balances
- `tokenPrices(tokenId)`: Get token price in Wei
- `tokenNames(tokenId)`: Get token name
- `uri(tokenId)`: Get token metadata URI
- `totalSupply(tokenId)`: Get token total supply
- `exists(tokenId)`: Check if token exists

---

## Data Flow

### Syncing Ingredients from Blockchain

```
1. Client calls POST /api/ingredients/blockchain/sync
   ↓
2. Backend fetches token info from blockchain (ERC1155)
   ↓
3. Check if token exists on blockchain
   ↓
4. Check if ingredient already exists in database
   ↓
5. Create IngredientData with merged metadata
   ↓
6. Create Ingredient with reference to IngredientData
   ↓
7. Return created ingredient with blockchain info
```

### Recipe Event Listening

```
1. BlockchainListener starts on server startup
   ↓
2. Listens for RecipeCreated events (Workbench contract)
   ↓
3. When event detected:
   - Parse recipe data
   - Create Recipe in MongoDB
   ↓
4. Recipe becomes available via /api/recipes
```

---

## Database Schema

### Ingredient Model
```typescript
{
  tokenContract: string;      // ERC1155 contract address
  tokenId: number;             // Token ID
  ingredientData: ObjectId;    // Reference to IngredientData
  createdAt: Date;
  updatedAt: Date;
}
```

### IngredientData Model
```typescript
{
  metadata: {
    name: string;
    image: string;
    uri: string;
    priceWei: string;
    priceEth: string;
    totalSupply: string;
    // ... custom fields
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationship:** One-to-one relationship where `Ingredient` references `IngredientData`.

---

## Testing with Swagger

1. Start the server:
   ```bash
   cd server && npm run dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3001/api-docs
   ```

3. Navigate to **"Ingredients - Blockchain"** section

4. Test endpoints with your contract address and token IDs

---

## Security Considerations

1. **RPC URL:** Use a reliable RPC provider (Infura, Alchemy, or dedicated node)
2. **Rate Limiting:** The API has rate limiting enabled (100 requests per 15 minutes)
3. **Read-Only:** The blockchain service only performs read operations
4. **Private Keys:** Never expose private keys in `.env` files committed to git

---

## Troubleshooting

### "Blockchain service not available"
- ✅ Check `BLOCKCHAIN_RPC_URL` is set in `.env`
- ✅ Check `ERC1155_CONTRACT_ADDRESS` is set and valid
- ✅ Restart the server after changing `.env`

### "Failed to fetch token balance"
- ✅ Check the RPC URL is accessible
- ✅ Verify the contract address is correct
- ✅ Ensure the token ID exists on the blockchain
- ✅ Check network connectivity

### "Failed to call balanceOf"
- ✅ Verify the contract implements ERC1155 standard
- ✅ Check the contract ABI matches the interface
- ✅ Ensure the RPC endpoint is synced

---

## References

- [Technical Documentation](./TECHNICAL-DOC.md) - Full smart contract specifications
- [ERC1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [zkSync Era](https://era.zksync.io/docs/)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0

