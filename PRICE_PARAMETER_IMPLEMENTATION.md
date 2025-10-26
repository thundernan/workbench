# Price Parameter Implementation

## Overview
Added support for setting token mint prices when creating ingredients. The price is passed to the blockchain smart contract's `createTokenType` function and stored in the ingredient metadata.

## Changes Made

### 1. Backend Service (`server/src/services/ingredientBlockchainService.ts`)

Updated the `createTokenType` method to accept a `price` parameter:

```typescript
async createTokenType(id: number, name: string, price: bigint = BigInt(0)): Promise<any>
```

**Parameters:**
- `id`: Token ID
- `name`: Token name
- `price`: Token price in wei (default: 0 for free minting)

**Returns:**
```typescript
{
  hash: string;           // Transaction hash
  blockNumber: number;    // Block number
  priceWei: string;       // Price in wei
  priceEth: string;       // Price in ETH (formatted)
  transaction: any;       // Full transaction object
  receipt: any;          // Transaction receipt
}
```

### 2. Controller (`server/src/controllers/ingredientController.ts`)

Updated the `createIngredient` endpoint to:
- Accept `price` parameter from request body
- Convert price from ETH to wei (supports number or string input)
- Store price in ingredient metadata
- Pass price to blockchain service

**Price Conversion:**
- If price is a number: treated as ETH and converted to wei (e.g., `0.001` → `1000000000000000` wei)
- If price is a string: parsed as ETH and converted to wei
- If price is omitted: defaults to `0` (free minting)

### 3. API Documentation (`server/src/routes/ingredientRoutes.ts`)

Updated Swagger documentation for `POST /api/ingredients`:
- Added `price` parameter description
- Added examples for both free and paid items
- Updated response schema to include price information

## API Usage

### Create Free Ingredient (No Price)

```bash
POST /api/ingredients
Content-Type: application/json

{
  "metadata": {
    "name": "Wood",
    "image": "https://example.com/wood.png",
    "description": "Basic crafting material",
    "category": "material"
  }
}
```

### Create Paid Ingredient (With Price)

```bash
POST /api/ingredients
Content-Type: application/json

{
  "metadata": {
    "name": "Diamond",
    "image": "https://example.com/diamond.png",
    "description": "Rare precious gem",
    "category": "rare"
  },
  "price": 0.01
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ingredient created successfully with token type on blockchain.",
  "data": {
    "ingredientId": "507f1f77bcf86cd799439011",
    "ingredientDataId": "507f191e810c19729de860ea",
    "tokenId": 15,
    "tokenContract": "0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a",
    "createTransaction": "0xabc123...",
    "price": {
      "wei": "10000000000000000",
      "eth": "0.01"
    },
    "metadata": {
      "name": "Diamond",
      "image": "https://example.com/diamond.png",
      "description": "Rare precious gem",
      "category": "rare",
      "price": "10000000000000000"
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

## Price Formats

The API accepts price in multiple formats:

1. **Number (ETH)**: `0.001` = 0.001 ETH
2. **String (ETH)**: `"0.001"` = 0.001 ETH
3. **String (Wei)**: Not recommended, but supported if parsing as ETH fails
4. **Omitted/null/0**: Free minting

## Smart Contract Integration

The price is sent to the blockchain using the `createTokenType` function:

```solidity
function createTokenType(
    uint256 id, 
    string memory name, 
    uint256 price
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

**Contract Behavior:**
- Price is stored in the `tokenPrices` mapping on the contract
- Users must pay this exact price (in ETH) when calling `publicMint` or `publicMintBatch`
- Price of `0` means free minting (no ETH required)
- Price can be updated later using `setTokenPrice` by operators

## Testing Examples

### Test 1: Create Free Item
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "name": "Stone",
      "image": "https://example.com/stone.png",
      "category": "material"
    }
  }'
```

### Test 2: Create Item with 0.001 ETH Price
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "name": "Gold Ingot",
      "image": "https://example.com/gold.png",
      "category": "rare"
    },
    "price": 0.001
  }'
```

### Test 3: Create Item with 1 ETH Price
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "name": "Legendary Sword",
      "image": "https://example.com/sword.png",
      "category": "legendary"
    },
    "price": 1
  }'
```

## Error Handling

### Invalid Price Format
```json
{
  "success": false,
  "message": "Invalid price format. Provide price in ETH (e.g., 0.001) or wei as string."
}
```

### Blockchain Service Unavailable
```json
{
  "success": false,
  "message": "Blockchain service unavailable"
}
```

### Token Creation Failed
```json
{
  "success": false,
  "message": "Failed to create token type on blockchain",
  "error": "..."
}
```

## Metadata Storage

The price is stored in two places:

1. **Blockchain**: In the `tokenPrices` mapping of the smart contract
2. **Database**: In the `metadata.price` field (as string in wei)

This dual storage ensures:
- Blockchain is the source of truth for pricing
- Database has a cached copy for faster queries
- Price can be retrieved without blockchain calls when displaying items

## Notes

- Price is always stored in **wei** (1 ETH = 10^18 wei)
- API accepts price in **ETH** for convenience
- The server requires `MINTER_PRIVATE_KEY` with `DEFAULT_ADMIN_ROLE` on the contract
- Price can be `0` for free items
- Negative prices are not allowed (conversion will fail)

## Related Files

- `server/src/services/ingredientBlockchainService.ts` - Blockchain service with createTokenType
- `server/src/controllers/ingredientController.ts` - API controller with price handling
- `server/src/routes/ingredientRoutes.ts` - Swagger documentation
- Contract: `GameItemsERC1155.sol` - Smart contract with createTokenType function

