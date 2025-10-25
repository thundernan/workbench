# Server Crash Fix - Invalid Contract Address

## Problem

Server crashed on startup with ENS error:

```
Error: network does not support ENS (operation="getEnsAddress", ...)
Unhandled Promise Rejection
```

## Root Cause

The `.env` file had an **incorrect contract address**:

```env
# ❌ WRONG - This is a literal string, not an address!
WORKBENCH_CONTRACT_ADDRESS=ERC1155_CONTRACT_ADDRESS
```

When the blockchain connection tried to initialize the Workbench contract with this invalid "address", ethers.js attempted to resolve it as an ENS name, which failed because zkxsolla doesn't support ENS.

## The Fix

Updated `.env` with the **correct contract address**:

```env
# ✅ CORRECT - Actual deployed contract address
WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

## Correct `.env` Configuration

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=workbench

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Blockchain Configuration - zkxsolla Network
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
```

## Result

✅ **Server now starts successfully!**

```
✅ Connected to MongoDB: workbench
🔗 Initializing blockchain connection...
   RPC URL: https://zkrpc-sepolia.xsollazk.com
   ERC1155 Contract: 0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   Workbench Contract: 0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
✅ Connected to network: zkxsolla (chainId: 555776)
✅ Workbench contract initialized
✅ Blockchain connection initialized successfully
🔗 Blockchain listener initialized successfully
🚀 Server running on port 3001
⛓️  Blockchain Connection: Ready
   ERC1155: 0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   Workbench: 0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
👂 Blockchain Listener: Active (listening for RecipeCreated events)
```

## Testing

Server is now working and processing requests:

```bash
# Test user balance endpoint
curl http://localhost:3001/api/ingredients/blockchain/user-balance/0xYourAddress

# Expected: 200 OK with balance data
```

## Lessons Learned

### ⚠️ Common `.env` Mistakes

1. **Using variable names as values**:
   ```env
   # ❌ Wrong
   WORKBENCH_CONTRACT_ADDRESS=ERC1155_CONTRACT_ADDRESS
   
   # ✅ Correct
   WORKBENCH_CONTRACT_ADDRESS=0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c
   ```

2. **Missing `0x` prefix**:
   ```env
   # ❌ Wrong
   ERC1155_CONTRACT_ADDRESS=1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   
   # ✅ Correct
   ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   ```

3. **Wrong network RPC**:
   ```env
   # ❌ Wrong network
   BLOCKCHAIN_RPC_URL=https://ethereum-sepolia.publicnode.com
   
   # ✅ Correct for zkxsolla
   BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
   ```

### ✅ Validation Checklist

Before starting the server, verify:

- [ ] All contract addresses start with `0x`
- [ ] All addresses are 42 characters long (including `0x`)
- [ ] RPC URL matches your deployed network
- [ ] No placeholder values remain (like `YOUR_ADDRESS_HERE`)
- [ ] MongoDB URI is valid and accessible

## Contract Addresses Reference

For zkxsolla network (chainId: 555776):

| Contract | Address | Purpose |
|----------|---------|---------|
| **GameItemsERC1155** | `0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a` | ERC1155 tokens |
| **Workbench (Legacy)** | `0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c` | Crafting system |
| WorkbenchFactory | `0xb4c27e256848cE6168339f44D2B5052EB32B6eF3` | Factory (not yet integrated) |
| Marketplace | `0x34EC6dA5045CcA928Cb59DAae5C60bE5b6F44E50` | Trading (not yet integrated) |

## Related Fixes

This crash fix builds on the previous ENS fix:

1. **ENS Network Configuration** (`blockchain.ts`):
   - Fixed by explicitly setting network config with chainId: 555776
   - Prevents ethers from trying ENS on unknown networks

2. **Invalid Address Fix** (`.env`):
   - Fixed by using actual contract address instead of variable name
   - Prevents ethers from attempting ENS resolution on invalid addresses

## Summary

The server crashed because `.env` contained `WORKBENCH_CONTRACT_ADDRESS=ERC1155_CONTRACT_ADDRESS` (a string) instead of the actual contract address. This caused ethers.js to attempt ENS resolution, which failed on zkxsolla network.

**Fixed by**: Replacing the placeholder string with the correct deployed contract address: `0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c`

**Status**: ✅ Server running successfully

