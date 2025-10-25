# Environment Setup from Deployed Contracts

## Quick Setup

Copy the `env.example` file to `.env` in the `server` directory:

```bash
cd server
cp env.example .env
```

The `.env` file is already pre-configured with the correct contract addresses from the deployment!

## Configuration Summary

Based on the `DEPLOYED_CONTRACTS.md`, your server is now configured with:

### Network Configuration
- **Network**: zkxsolla (XSolla zkSync Sepolia Testnet)
- **Chain ID**: 555776
- **RPC URL**: `https://zkrpc-sepolia.xsollazk.com`
- **Explorer**: https://explorer-sepolia.xsollazk.com

### Contract Addresses

```env
# Required for inventory features (fetching user tokens)
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a

# Optional - for crafting features
WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

### What Each Contract Does

| Contract | Address | Purpose | Required? |
|----------|---------|---------|-----------|
| **GameItemsERC1155** | `0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a` | Game items (ERC1155 tokens) | ✅ **Yes** (for inventory) |
| **Workbench (Legacy)** | `0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c` | Crafting system | ⚠️ Optional (for crafting) |
| **WorkbenchFactory** | `0xb4c27e256848cE6168339f44D2B5052EB32B6eF3` | Create workbench instances | ℹ️ Not yet integrated |
| **Marketplace** | `0x34EC6dA5045CcA928Cb59DAae5C60bE5b6F44E50` | Trading platform | ℹ️ Not yet integrated |

## Server Capabilities by Configuration

### With Only ERC1155 (Minimum Setup)
```env
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
```

**Available Features:**
- ✅ Get user inventory (all tokens they own)
- ✅ Get token balance
- ✅ Get token info (name, price, supply)
- ✅ Check token existence
- ❌ Crafting disabled (no Workbench)
- ❌ Recipe events disabled

**Startup Log:**
```
✅ Blockchain connection initialized successfully
✅ Workbench contract not configured (crafting features disabled)
⛓️  Blockchain Connection: Ready
   ERC1155: 0x1a7C...871a
   Workbench: Not configured (crafting features disabled)
```

### With ERC1155 + Workbench (Full Setup)
```env
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

**Available Features:**
- ✅ Get user inventory
- ✅ Get token balance
- ✅ Get token info
- ✅ Check token existence
- ✅ Check if user can craft
- ✅ Get recipe details
- ✅ Get active recipes
- ✅ Listen for RecipeCreated events

**Startup Log:**
```
✅ Blockchain connection initialized successfully
✅ Workbench contract initialized
🔗 Blockchain listener initialized successfully
⛓️  Blockchain Connection: Ready
   ERC1155: 0x1a7C...871a
   Workbench: 0x3b5d...dD4c
👂 Blockchain Listener: Active (listening for RecipeCreated events)
```

## Testing Your Setup

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Check Health
```bash
curl http://localhost:3001/health
```

### 3. Test Blockchain Connection

#### Test Token Balance
```bash
curl http://localhost:3001/api/ingredients/blockchain/balance/0x4E20D2f3a7B140405C81baC8B593b37221B6a847/1
```

#### Test User Inventory (replace with your wallet address)
```bash
curl http://localhost:3001/api/ingredients/blockchain/user-inventory/0x4E20D2f3a7B140405C81baC8B593b37221B6a847
```

#### Test Crafting (if Workbench is configured)
```bash
curl http://localhost:3001/api/crafting/active-recipes
```

## Troubleshooting

### Issue: "Blockchain connection not initialized"

**Check your `.env` file has:**
```env
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
```

**Restart the server:**
```bash
npm run dev
```

### Issue: "Crafting service not available"

This is **normal** if you only have ERC1155 configured. Crafting features require the Workbench contract.

**To enable crafting, add:**
```env
WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

### Issue: RPC connection errors

**Check RPC endpoint:**
```bash
curl -X POST https://zkrpc-sepolia.xsollazk.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Expected response:
```json
{"jsonrpc":"2.0","id":1,"result":"0x87ba0"}
```
(0x87ba0 = 555776 in decimal)

## Client-Side Configuration

Don't forget to update your client `.env` as well:

### `client/.env`
```env
# Server URL
VITE_SERVER_URL=http://localhost:3001

# Blockchain (for direct client-side calls)
VITE_CHAIN_ID=555776
VITE_RPC_URL=https://zkrpc-sepolia.xsollazk.com
VITE_ERC1155_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
VITE_WORKBENCH_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

## Summary

✅ **Done**: Server `env.example` updated with correct addresses
✅ **Done**: Blockchain connection made optional (Workbench not required)
✅ **Ready**: Server can now connect to zkxsolla testnet

### Next Steps:
1. Copy `server/env.example` to `server/.env`
2. Update `MONGODB_URI` if using MongoDB Atlas
3. Start the server: `npm run dev`
4. Test inventory endpoint with your wallet address
5. If crafting is needed, Workbench address is already configured!

### API Endpoints Available

With ERC1155 only:
- ✅ `GET /api/ingredients/blockchain/balance/:address/:tokenId`
- ✅ `GET /api/ingredients/blockchain/user-inventory/:address`
- ✅ `GET /api/ingredients/blockchain/info/:tokenId`

With ERC1155 + Workbench:
- ✅ All above +
- ✅ `GET /api/crafting/can-craft/:recipeId/:address`
- ✅ `GET /api/crafting/recipe/:recipeId`
- ✅ `GET /api/crafting/active-recipes`

See full API docs at: `http://localhost:3001/api-docs`

