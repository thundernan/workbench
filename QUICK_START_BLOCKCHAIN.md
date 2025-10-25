# Quick Start: Blockchain Integration

## Environment Setup

### Required Environment Variables

Create or update your `.env` files:

#### `server/.env`
```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=workbench

# Blockchain (all 3 required for blockchain features)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
ERC1155_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
WORKBENCH_CONTRACT_ADDRESS=0x0987654321098765432109876543210987654321

# Server
PORT=3001
NODE_ENV=development
```

#### `client/.env`
```env
# Server URL
VITE_SERVER_URL=http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001
```

## Running the Server

### Development Mode
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

### Using Concurrently (from root)
```bash
# Run both client and server together
npm run dev
```

## Expected Startup Logs

### ✅ With Blockchain (All env vars configured)
```
🔗 Initializing blockchain connection...
   RPC URL: https://sepolia.infura.io/v3/...
   ERC1155 Contract: 0x1234...
   Workbench Contract: 0x0987...
✅ Connected to network: sepolia (chainId: 11155111)
✅ Blockchain connection initialized successfully
🔗 Blockchain listener initialized successfully
🚀 Server running on port 3001
📊 Environment: development
🔗 API Base URL: http://localhost:3001
📋 Health Check: http://localhost:3001/health
🧪 Recipes API: http://localhost:3001/api/recipes
🍳 Ingredients API: http://localhost:3001/api/ingredients
⚒️  Crafting API: http://localhost:3001/api/crafting
📚 API Documentation: http://localhost:3001/api-docs
⛓️  Blockchain Connection: Ready
   ERC1155: 0x1234...
   Workbench: 0x0987...
👂 Blockchain Listener: Active (listening for RecipeCreated events)
```

### ⚠️ Without Blockchain (Missing env vars)
```
📝 Blockchain configuration not provided, running in database-only mode
   Required env vars: BLOCKCHAIN_RPC_URL, ERC1155_CONTRACT_ADDRESS, WORKBENCH_CONTRACT_ADDRESS
🚀 Server running on port 3001
⛓️  Blockchain Connection: Not initialized
```

## Testing Blockchain Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Get Token Balance
```bash
curl http://localhost:3001/api/ingredients/blockchain/balance/0xYourAddress/1
```

### Get User Inventory
```bash
# Without zero-balance tokens (default)
curl http://localhost:3001/api/ingredients/blockchain/user-inventory/0xYourAddress

# Including zero-balance tokens
curl http://localhost:3001/api/ingredients/blockchain/user-inventory/0xYourAddress?includeZero=true
```

### Check Crafting Eligibility
```bash
curl http://localhost:3001/api/crafting/can-craft/1/0xYourAddress
```

### Get Active Recipes
```bash
curl http://localhost:3001/api/crafting/active-recipes
```

### Get Recipe Details
```bash
curl http://localhost:3001/api/crafting/recipe/1
```

## Troubleshooting

### Issue: "Blockchain connection not initialized"
**Cause:** Missing or invalid environment variables

**Solution:**
1. Check `.env` file has all 3 blockchain variables
2. Verify RPC URL is accessible
3. Verify contract addresses are valid Ethereum addresses
4. Restart the server

### Issue: "Connection timeout" or "Network error"
**Cause:** RPC provider is down or rate limited

**Solution:**
1. Check if RPC URL is accessible: `curl https://sepolia.infura.io/v3/YOUR_KEY`
2. Try a different RPC provider
3. Check if you've hit rate limits on your RPC provider
4. Server will continue in database-only mode

### Issue: "Contract call failed"
**Cause:** Contract might not be deployed or ABI mismatch

**Solution:**
1. Verify contract addresses are correct on the blockchain
2. Check if contracts are deployed on the network you're using
3. Verify contract ABIs match deployed contracts

## Swagger API Documentation

Access interactive API docs at:
```
http://localhost:3001/api-docs
```

Test all endpoints directly from the browser!

## Client-Side Usage

### Connect Wallet
```vue
<script setup>
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

// Connect wallet
await walletStore.connectWallet('metamask');

// Get connected address
const address = walletStore.address;
</script>
```

### Fetch User Inventory
```vue
<script setup>
import { useInventory } from '@/composables/useInventory';

const {
  inventory,
  isLoading,
  error,
  fetchInventory,
  refreshInventory
} = useInventory();

// Inventory automatically fetches when wallet connects
// Manual refresh
await refreshInventory();
</script>
```

### Display Inventory
```vue
<template>
  <div v-if="isLoading">Loading inventory...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <div v-for="item in inventory" :key="item.tokenId">
      <h3>{{ item.metadata.name }}</h3>
      <p>Balance: {{ item.balance }}</p>
      <img :src="item.metadata.image" :alt="item.metadata.name" />
    </div>
  </div>
</template>
```

## Architecture Overview

```
Client (Vue 3)
    ↓
Server (Express)
    ↓
┌───────────────────────────────┐
│ BlockchainConnection (Singleton)
│ - JsonRpcProvider
│ - ERC1155 Contract
│ - Workbench Contract
└───────────────────────────────┘
    ↓
Blockchain (Ethereum/Sepolia)
```

### Key Points
- **One connection** per server process
- **Initialized once** on server startup
- **Shared across** all API requests
- **Graceful degradation** if blockchain unavailable

## Next Steps

1. ✅ Set up environment variables
2. ✅ Start the server
3. ✅ Verify blockchain connection in logs
4. ✅ Test API endpoints with Swagger or curl
5. ✅ Connect wallet from client
6. ✅ Fetch and display user inventory

## Additional Documentation

- `BLOCKCHAIN_CONNECTION.md` - Detailed architecture explanation
- `BLOCKCHAIN_INTEGRATION.md` - Ingredient blockchain features
- `CRAFTING_BLOCKCHAIN.md` - Crafting blockchain features
- `INVENTORY_SYSTEM.md` - Inventory system documentation
- `TECHNICAL-DOC.md` - Smart contract specifications

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables are correct
3. Test RPC connection separately
4. Check Swagger docs for API examples
5. Review the relevant documentation files above

