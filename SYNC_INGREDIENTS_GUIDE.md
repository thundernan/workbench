# Sync Ingredients to Blockchain - Complete Guide

## Overview

This script synchronizes all ingredients from your MongoDB database to the blockchain by creating them as ERC1155 token types.

---

## 🎯 What It Does

1. **Reads** all ingredients from MongoDB database
2. **Checks** if each ingredient already exists on blockchain
3. **Creates** missing ingredients on blockchain using `createTokenType()`
4. **Updates** database with blockchain transaction info
5. **Reports** detailed statistics

---

## 🚀 Quick Start

### Step 1: Ensure Environment Variables are Set

**server/.env** must have:
```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://your-rpc-url
ERC1155_CONTRACT_ADDRESS=0xYourContractAddress
MINTER_PRIVATE_KEY=0xYourPrivateKey

# Database
MONGODB_URI=mongodb://localhost:27017/workbench
```

### Step 2: Run the Script

```bash
cd server
node sync-ingredients-to-blockchain.js
```

---

## 📋 Expected Output

### Successful Run:

```
🚀 Ingredient Blockchain Sync Script

============================================================
📦 Connecting to MongoDB...
✅ Connected to MongoDB

⛓️  Connecting to blockchain...
   RPC: https://public.sepolia.rpc.status.network
   Contract: 0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
   Network: status-sepolia (chainId: 1660990954)
   Signer: 0x4E20D2f3a7B140405C81baC8B593b37221B6a847
✅ Connected to blockchain

📊 Loading ingredients from database...
   Found 5 ingredients in database

============================================================

[1/5] Processing Ingredient:
   Token ID: 1
   Name: Wood
   Category: material
   🔍 Checking blockchain...
   ℹ️  Already exists on blockchain

[2/5] Processing Ingredient:
   Token ID: 2
   Name: Iron Ore
   Category: material
   🔍 Checking blockchain...

🔨 Creating token ID 2: "Iron Ore"
   Price: 0.0 ETH
   📤 Transaction sent: 0x123abc...
   ✅ Confirmed in block 12345678
   📝 Updated database with blockchain info

[3/5] Processing Ingredient:
   Token ID: 3
   Name: Gold Ingot
   Category: material
   🔍 Checking blockchain...

🔨 Creating token ID 3: "Gold Ingot"
   Price: 0.001 ETH
   📤 Transaction sent: 0x456def...
   ✅ Confirmed in block 12345679
   📝 Updated database with blockchain info

============================================================
📊 SYNC SUMMARY
============================================================
Total ingredients:        5
Already on blockchain:    1
Successfully created:     2
Failed:                   0
Skipped (no data):        2
============================================================

✅ Successfully synced 2 ingredients to blockchain!

👋 Disconnected from MongoDB

✅ Sync complete!
```

---

## 📊 Understanding the Output

### Ingredient Status:

1. **Already exists on blockchain** ✅
   - Token already created on-chain
   - Database updated with flag
   - No transaction needed

2. **Successfully created** 🔨
   - Token created on blockchain
   - Transaction confirmed
   - Database updated with tx hash and block number

3. **Failed** ❌
   - Error during blockchain creation
   - Check error message for details
   - May need manual intervention

4. **Skipped** ⚠️
   - Missing ingredient data or name
   - Fix data and run again

---

## 🔍 What Gets Updated in Database

After successful sync, each ingredient document is updated with:

```javascript
{
  blockchainTx: "0x123abc...",           // Transaction hash
  blockchainBlock: 12345678,             // Block number
  blockchainCreated: true,               // Flag for tracking
  updatedAt: "2025-11-05T..."           // Update timestamp
}
```

---

## ⚙️ Configuration

### Smart Contract Requirements

Your ERC1155 contract must have:

```solidity
function createTokenType(uint256 id, string memory name, uint256 price) external;
```

### Signer Requirements

The address corresponding to `MINTER_PRIVATE_KEY` must:
- Have `MINTER_ROLE` or `DEFAULT_ADMIN_ROLE` on the contract
- Have enough ETH for gas fees
- Be authorized to call `createTokenType()`

### Price Handling

The script uses the price from `ingredient.metadata.price`:
- If present: Uses that value (in wei)
- If missing: Defaults to 0 (free)

---

## 🔧 Advanced Usage

### Dry Run Mode (Check Only)

To check what would be synced without creating:

**Create `sync-ingredients-check.js`**:
```javascript
// Same script but comment out the createIngredientOnBlockchain call
// Just report what WOULD be created
```

### Filter by Category

Modify the script to sync only specific categories:

```javascript
// Line ~150, change:
const ingredients = await Ingredient.find({}).populate('ingredientData');

// To:
const ingredients = await Ingredient.find({
  'metadata.category': 'material'  // Only materials
}).populate('ingredientData');
```

### Custom Price Override

Set all ingredients to a specific price:

```javascript
// Line ~220, change:
const price = ingredient.metadata?.price || '0';

// To:
const price = ethers.parseEther('0.001');  // All cost 0.001 ETH
```

---

## 🐛 Troubleshooting

### Error: "BLOCKCHAIN_RPC_URL not set"
**Solution**: Check `server/.env` has all required variables

### Error: "transaction failed"
**Possible causes**:
1. Signer doesn't have MINTER_ROLE
2. Insufficient gas
3. Token ID already exists
4. Contract paused

**Solution**: Check contract on block explorer

### Error: "network changed"
**Solution**: Use the updated blockchain config (auto-detects network)

### Error: "Token type already exists"
**Solution**: 
- This is normal if token exists
- Script will detect and skip it
- Database will be updated with flag

### No ingredients found
**Solution**: Create ingredients first using the API:
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "Test",
    "category": "material"
  }'
```

---

## 📈 Performance

### Transaction Timing

The script waits 2 seconds between transactions to:
- Avoid overwhelming the RPC
- Ensure transactions are mined in order
- Prevent nonce conflicts

For faster syncing (at your own risk):
```javascript
// Line ~250, reduce delay:
await new Promise(resolve => setTimeout(resolve, 500));  // 0.5s instead of 2s
```

### Batch Processing

For large datasets (100+ ingredients), consider:
1. Syncing in batches of 50
2. Using multiple signers (if contract allows)
3. Running during off-peak hours

---

## 🔐 Security Best Practices

### Before Running

1. **Test on testnet first**
   - Verify script works correctly
   - Check gas costs
   - Ensure proper permissions

2. **Backup database**
   ```bash
   mongodump --db workbench --out ./backup
   ```

3. **Verify contract address**
   - Double-check in .env
   - Confirm on block explorer

4. **Check signer balance**
   ```bash
   # Make sure signer has enough ETH for gas
   ```

### After Running

1. **Verify on block explorer**
   - Check transactions confirmed
   - Verify token creation events

2. **Test token functionality**
   - Try minting from frontend
   - Verify balances

3. **Update frontend if needed**
   - Clear cache
   - Refresh ingredient list

---

## 🎯 Use Cases

### Initial Setup
Sync all ingredients when first deploying to a new network:
```bash
node sync-ingredients-to-blockchain.js
```

### After Database Migration
Re-sync if you imported ingredients from another database:
```bash
node sync-ingredients-to-blockchain.js
```

### Disaster Recovery
If blockchain state is lost (e.g., test network reset):
```bash
node sync-ingredients-to-blockchain.js
```

### Multi-Network Deployment
Sync same ingredients to multiple networks:
```bash
# Network 1
BLOCKCHAIN_RPC_URL=https://network1-rpc.com node sync-ingredients-to-blockchain.js

# Network 2  
BLOCKCHAIN_RPC_URL=https://network2-rpc.com node sync-ingredients-to-blockchain.js
```

---

## 📝 Script Checklist

Before running, verify:

- [ ] MongoDB is running and accessible
- [ ] `server/.env` has all required variables
- [ ] RPC URL is correct and accessible
- [ ] ERC1155 contract address is correct
- [ ] Signer has MINTER_ROLE on contract
- [ ] Signer has sufficient ETH for gas
- [ ] Network matches where contract is deployed
- [ ] Database has ingredients to sync
- [ ] You've tested on testnet first (if production)

---

## 🔄 Re-running the Script

**Safe to run multiple times!**

The script:
- ✅ Checks if tokens exist before creating
- ✅ Skips already-created tokens
- ✅ Only creates missing tokens
- ✅ Updates database flags

Re-run anytime to:
- Sync newly added database ingredients
- Fix failed transactions from previous run
- Update database flags for existing blockchain tokens

---

## 📊 Database Query Examples

### Check sync status:
```javascript
// In MongoDB shell or Compass
db.ingredients.find({ blockchainCreated: true }).count()   // Synced
db.ingredients.find({ blockchainCreated: { $ne: true } }) // Not synced
```

### Find failed syncs:
```javascript
db.ingredients.find({ 
  blockchainTx: { $exists: false },
  // Add other criteria
})
```

### View blockchain info:
```javascript
db.ingredients.find({}, { 
  tokenId: 1, 
  blockchainTx: 1, 
  blockchainBlock: 1,
  blockchainCreated: 1
})
```

---

## 🚀 Next Steps After Sync

1. **Verify on Frontend**
   ```bash
   # Open Shop page
   open http://localhost:5173/shop
   
   # Should see all ingredients
   # Try minting
   ```

2. **Check Block Explorer**
   ```
   https://your-explorer.com/address/0xYourContract
   # Verify TokenCreated events
   ```

3. **Test Minting**
   - Connect wallet
   - Select ingredient
   - Mint token
   - Verify balance increases

---

## 💡 Tips

### Speed Up Testing
Create a few test ingredients first:
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test1","category":"material"}'

curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test2","category":"material"}'
```

### Monitor Gas Costs
Add gas logging to script to track costs:
```javascript
const receipt = await tx.wait();
console.log(`Gas used: ${receipt.gasUsed.toString()}`);
```

### Create Backup Script
Save synced state:
```bash
mongodump --db workbench --collection ingredients --out ./synced-backup
```

---

## ✅ Success Criteria

After running the script successfully:
- [ ] All database ingredients show `blockchainCreated: true`
- [ ] Block explorer shows TokenCreated events
- [ ] Frontend Shop page displays all ingredients
- [ ] Can mint tokens from frontend
- [ ] Token balances update correctly

---

**Ready to sync? Run the script and watch your database ingredients come to life on the blockchain!** 🚀

