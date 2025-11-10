# Set Ingredient Price Endpoint

## Overview
New endpoint to set or update the price of existing ingredients in both the database and blockchain (if supported).

## Endpoint

```
PATCH /api/ingredients/:tokenContract/:tokenId/price
```

## Features

✅ **Dual Update**: Updates price in both database and blockchain  
✅ **Blockchain Optional**: Falls back to database-only if blockchain doesn't support price updates  
✅ **Validation**: Comprehensive price validation (format, range, non-negative)  
✅ **Error Handling**: Graceful handling of blockchain errors  
✅ **Detailed Response**: Returns both wei and ETH formatted prices  
✅ **Transaction Info**: Includes blockchain transaction hash when successful  

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenContract` | string | Yes | ERC1155 contract address |
| `tokenId` | number | Yes | Token ID of the ingredient |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `price` | string/number | Yes | Price in wei (e.g., "1000000000000000" for 0.001 ETH) |

### Request Examples

**Set to 0.001 ETH (1000000000000000 wei)**
```bash
curl -X PATCH http://localhost:3001/api/ingredients/0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a/1/price \
  -H "Content-Type: application/json" \
  -d '{"price": "1000000000000000"}'
```

**Set to free (0 ETH)**
```bash
curl -X PATCH http://localhost:3001/api/ingredients/0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a/1/price \
  -H "Content-Type: application/json" \
  -d '{"price": "0"}'
```

**Set to 1 ETH**
```bash
curl -X PATCH http://localhost:3001/api/ingredients/0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a/1/price \
  -H "Content-Type: application/json" \
  -d '{"price": "1000000000000000000"}'
```

## Response

### Success (Blockchain + Database)

When blockchain contract supports price updates:

```json
{
  "success": true,
  "message": "Ingredient price updated successfully on blockchain and database",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tokenContract": "0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a",
    "tokenId": 1,
    "ingredientData": "507f191e810c19729de860ea",
    "metadata": {
      "name": "Wood",
      "image": "https://example.com/wood.png",
      "price": "1000000000000000"
    },
    "price": {
      "wei": "1000000000000000",
      "eth": "0.001"
    },
    "updatedAt": "2025-01-15T12:30:00.000Z",
    "blockchainUpdate": {
      "transactionHash": "0xabc123...",
      "blockNumber": 12345
    }
  }
}
```

### Success (Database Only)

When blockchain contract doesn't support price updates:

```json
{
  "success": true,
  "message": "Ingredient price updated successfully in database",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tokenContract": "0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a",
    "tokenId": 1,
    "price": {
      "wei": "1000000000000000",
      "eth": "0.001"
    },
    "updatedAt": "2025-01-15T12:30:00.000Z"
  },
  "note": "Blockchain contract does not support price updates. Price is stored in database only."
}
```

### Error Responses

**400 - Missing Price**
```json
{
  "success": false,
  "message": "Price is required. Provide price in wei (e.g., \"1000000000000000\" for 0.001 ETH)."
}
```

**400 - Invalid Price Format**
```json
{
  "success": false,
  "message": "Invalid price format. Provide price in wei (e.g., \"1000000000000000\" for 0.001 ETH)."
}
```

**400 - Price Too High**
```json
{
  "success": false,
  "message": "Price too high. Maximum price is 100 ETH (100000000000000000000 wei)."
}
```

**400 - Negative Price**
```json
{
  "success": false,
  "message": "Price cannot be negative."
}
```

**404 - Ingredient Not Found**
```json
{
  "success": false,
  "message": "Ingredient not found"
}
```

## Implementation Details

### Flow Diagram

```
[Start] → [Validate Price] → [Find Ingredient]
                                    ↓
                          [Update Blockchain?]
                           ↙              ↘
                     [Yes]              [No/Failed]
                       ↓                      ↓
            [Call setTokenPrice]    [Skip Blockchain]
                       ↓                      ↓
                  [Success?]                  ↓
                   ↙      ↘                  ↓
             [Yes]      [No]                 ↓
                ↓         ↓                  ↓
                └─────────┴──────────────────┘
                            ↓
                  [Update Database]
                            ↓
                    [Return Success]
```

### Blockchain Integration

The endpoint attempts to update price on blockchain using:

```typescript
await blockchainService.setTokenPrice(tokenId, priceInWei)
```

**Contract Function Expected:**
```solidity
function setTokenPrice(uint256 id, uint256 price) external onlyRole(OPERATOR_ROLE)
```

**Fallback Behavior:**
- If function doesn't exist: Updates database only, returns note
- If function exists but fails: Logs warning, updates database only
- If signer not available: Updates database only

### Database Update

Price is stored in `IngredientData.metadata.price` as a string (wei):

```typescript
metadata: {
  name: "Wood",
  image: "...",
  price: "1000000000000000"  // Stored as string in wei
}
```

### Validation Rules

| Check | Limit | Error |
|-------|-------|-------|
| Required | Must be provided | "Price is required" |
| Format | Must be valid number/string | "Invalid price format" |
| Maximum | ≤ 100 ETH | "Price too high" |
| Minimum | ≥ 0 | "Price cannot be negative" |

## Price Format Reference

| ETH | Wei (String) | Use Case |
|-----|--------------|----------|
| 0 ETH | "0" | Free items |
| 0.0001 ETH | "100000000000000" | Very cheap items |
| 0.001 ETH | "1000000000000000" | Default price |
| 0.01 ETH | "10000000000000000" | Common items |
| 0.1 ETH | "100000000000000000" | Rare items |
| 1 ETH | "1000000000000000000" | Very rare items |
| 10 ETH | "10000000000000000000" | Ultra rare items |

**Conversion Helper:**
```javascript
// ETH to Wei
const weiPrice = ethers.parseEther("0.001").toString();
// "1000000000000000"

// Wei to ETH
const ethPrice = ethers.formatEther("1000000000000000");
// "0.001"
```

## Use Cases

### Use Case 1: Update Price After Market Analysis
```javascript
// Ingredient was too expensive, reduce price
PATCH /api/ingredients/0x.../5/price
{
  "price": "500000000000000"  // Reduce from 0.001 to 0.0005 ETH
}
```

### Use Case 2: Make Item Free for Event
```javascript
// Make ingredient free during special event
PATCH /api/ingredients/0x.../10/price
{
  "price": "0"
}
```

### Use Case 3: Increase Rare Item Price
```javascript
// Increase price for rare item
PATCH /api/ingredients/0x.../25/price
{
  "price": "10000000000000000"  // Increase to 0.01 ETH
}
```

### Use Case 4: Bulk Price Update Script
```javascript
// Update prices for multiple ingredients
const ingredients = [1, 2, 3, 4, 5];
const newPrice = "2000000000000000"; // 0.002 ETH

for (const tokenId of ingredients) {
  await fetch(`/api/ingredients/0x.../${tokenId}/price`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: newPrice })
  });
}
```

## Console Output

The endpoint provides detailed logging:

```
💰 Updating price for ingredient 507f1f77bcf86cd799439011 (Token ID: 1)
   New price: 0.001 ETH (1000000000000000 wei)
📡 Attempting to update price on blockchain...
⏳ Transaction sent: 0xabc123...
✅ Token price updated on blockchain! Block: 12345
✅ Price updated on blockchain: 0xabc123...
✅ Price updated in database for ingredient 507f1f77bcf86cd799439011
```

Or when blockchain doesn't support it:
```
💰 Updating price for ingredient 507f1f77bcf86cd799439011 (Token ID: 1)
   New price: 0.001 ETH (1000000000000000 wei)
📡 Attempting to update price on blockchain...
⚠️  setTokenPrice function not available on contract
ℹ️  Blockchain contract does not support price updates. Price updated in database only.
✅ Price updated in database for ingredient 507f1f77bcf86cd799439011
```

## Integration with Existing Features

### Works With

✅ **createIngredient**: Can update prices set during creation  
✅ **getIngredient**: Returns updated price in metadata  
✅ **getIngredients**: Lists ingredients with updated prices  
✅ **Shop System**: Shop can use updated prices from database  
✅ **Blockchain Queries**: If blockchain updated, `getTokenPrice` returns new value  

### Related Endpoints

- `POST /api/ingredients` - Create ingredient with initial price
- `GET /api/ingredients/:tokenContract/:tokenId` - Get ingredient with price
- `GET /api/ingredients/blockchain/price/:tokenId` - Get price from blockchain
- `PATCH /api/ingredients/:tokenContract/:tokenId/price` - **This endpoint** 

## Security Considerations

### Access Control

**Current Implementation**: No authentication required  
**Recommendation**: Add admin/operator authentication

```typescript
// Example with authentication middleware
router.patch(
  '/:tokenContract/:tokenId/price',
  authenticateUser,
  requireRole('ADMIN'),
  setIngredientPrice
);
```

### Blockchain Requirements

- Requires `MINTER_PRIVATE_KEY` in environment
- Wallet must have OPERATOR or ADMIN role on contract (if blockchain update enabled)
- Sufficient gas for transaction

### Validation

- ✅ Price format validation
- ✅ Price range validation (0 to 100 ETH)
- ✅ Non-negative check
- ✅ Ingredient existence check

## Testing

### Manual Testing

```bash
# 1. Create an ingredient
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "name": "Test Item"
    },
    "price": "1000000000000000"
  }'

# 2. Update the price
curl -X PATCH http://localhost:3001/api/ingredients/0x.../1/price \
  -H "Content-Type: application/json" \
  -d '{"price": "2000000000000000"}'

# 3. Verify the update
curl http://localhost:3001/api/ingredients/0x.../1
```

### Test Cases

| Test | Input | Expected Result |
|------|-------|-----------------|
| Valid price | "1000000000000000" | Success, price updated |
| Free price | "0" | Success, price set to 0 |
| Max price | "100000000000000000000" | Success, 100 ETH |
| Too high | "200000000000000000000" | Error 400, exceeds max |
| Negative | "-100" | Error 400, cannot be negative |
| Invalid format | "abc" | Error 400, invalid format |
| Missing price | {} | Error 400, price required |
| Non-existent ingredient | N/A | Error 404, not found |

## Troubleshooting

### Price Not Updating on Blockchain

**Symptom**: Database updated but blockchain shows old price  
**Causes**:
1. Contract doesn't have `setTokenPrice` function
2. Wallet lacks OPERATOR role
3. Transaction failed

**Solution**: Check console logs for specific error

### Database Updated But Response Shows Error

**Symptom**: Database has new price but API returned error  
**Cause**: This shouldn't happen - database updates after all checks pass  
**Solution**: Check for race conditions or concurrent requests

### Price Shows Differently on Frontend

**Symptom**: API shows correct price but frontend displays old price  
**Cause**: Frontend caching  
**Solution**: Refresh ingredient data after price update

## Files Modified

1. `/server/src/services/ingredientBlockchainService.ts`
   - Added `setTokenPrice()` method

2. `/server/src/controllers/ingredientController.ts`
   - Added `setIngredientPrice()` function

3. `/server/src/routes/ingredientRoutes.ts`
   - Added route: `PATCH /:tokenContract/:tokenId/price`
   - Added Swagger documentation

## Future Enhancements

1. **Batch Price Updates**: Update multiple ingredients at once
2. **Price History**: Track price changes over time
3. **Price Validation**: Min/max price per category
4. **Role-Based Pricing**: Different prices for different user roles
5. **Dynamic Pricing**: Automatic price adjustments based on supply/demand
6. **Price Notifications**: Notify users of price changes

## Summary

The Set Ingredient Price endpoint provides a flexible way to update ingredient prices with:
- ✅ Database persistence
- ✅ Optional blockchain synchronization
- ✅ Comprehensive validation
- ✅ Graceful error handling
- ✅ Detailed logging
- ✅ Clear API responses

It seamlessly integrates with existing features while providing a foundation for future pricing enhancements.

