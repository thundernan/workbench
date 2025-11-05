# Verify Your Setup - Current Configuration

Based on your terminal output, here's your current configuration:

## ✅ Current Server Configuration (from logs)

From your server terminal output:
```
✅ Connected to MongoDB: workbench
🔗 Initializing blockchain connection...
   RPC URL: https://zkrpc-sepolia.xsollazk.com
   ERC1155 Contract: 0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   WorkbenchInstance Contract: 0x92aF4ba1B82A5F4F1d28060c73D26F9662DdDb5f
✅ Connected to network: zkxsolla (chainId: 555776)
   Signer Address: 0x4E20D2f3a7B140405C81baC8B593b37221B6a847
✅ Blockchain connection initialized successfully
```

### Your Current Environment Variables:

**server/.env** should have:
```bash
# Blockchain
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
WORKBENCH_INSTANCE_ADDRESS=0x92aF4ba1B82A5F4F1d28060c73D26F9662DdDb5f
MINTER_PRIVATE_KEY=<your_private_key>  # Corresponds to 0x4E20D2f3a7B140405C81baC8B593b37221B6a847

# Database
MONGODB_URI=mongodb://localhost:27017/workbench

# Server
PORT=3001
```

---

## ✅ What's Working

1. **MongoDB Connection**: ✅ Connected successfully
2. **Blockchain RPC**: ✅ Connected to zkxsolla network
3. **Contract Addresses**: ✅ Loaded correctly
4. **Signer**: ✅ Initialized with private key
5. **Event Listener**: ✅ Started successfully

---

## ⚠️ Known Issue

Your server shows:
```
Uncaught Exception: Error: listen EADDRINUSE: address already in use :::3001
```

**Cause**: Another process is already using port 3001

### Fix Options:

#### Option 1: Kill the existing process
```bash
# Find process using port 3001
lsof -ti:3001 | xargs kill -9

# Or on macOS:
sudo lsof -t -i:3001 | xargs kill -9

# Then restart server
cd server && npm run dev
```

#### Option 2: Change the port
**Edit server/.env**:
```bash
PORT=3002  # Use different port
```

**Then update client/.env**:
```bash
VITE_API_BASE_URL=http://localhost:3002
```

---

## ✅ Client Setup

Your **client/.env** should have:
```bash
VITE_API_BASE_URL=http://localhost:3001

# Or if you changed server port:
# VITE_API_BASE_URL=http://localhost:3002
```

---

## 📋 Verification Steps

### 1. Verify Server is Running
After fixing the port issue:
```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### 2. Verify Contract Addresses
Test ingredients endpoint:
```bash
curl http://localhost:3001/api/ingredients
```

Should return ingredients from your contract.

### 3. Verify Client Can Connect
In browser console (http://localhost:5173):
```javascript
fetch('http://localhost:3001/health').then(r => r.json()).then(console.log)
```

Should show health check response.

---

## 🔐 Security Check

### Important: Verify Your Private Key

The signer address shows: `0x4E20D2f3a7B140405C81baC8B593b37221B6a847`

**Make sure**:
1. This address has `MINTER_ROLE` on your ERC1155 contract
2. This address has some ETH for gas fees
3. Your `MINTER_PRIVATE_KEY` in .env corresponds to this address
4. Your .env file is **NOT** committed to git

### Test Minter Role:
```bash
# On your blockchain, verify this address has MINTER_ROLE:
# 0x4E20D2f3a7B140405C81baC8B593b37221B6a847
```

---

## 🧪 Test Your Setup

### Test 1: Create an Ingredient
```bash
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "Testing setup",
    "category": "material",
    "metadata": {
      "icon": "🧪"
    }
  }'
```

Should create a new ingredient on the blockchain.

### Test 2: Frontend Minting
1. Open Shop page: http://localhost:5173/shop
2. Connect wallet
3. Try minting a free ingredient
4. Should succeed without errors ✅

---

## 📝 If You Changed Addresses

If you updated contract addresses, make sure to:

### 1. Update Server .env
```bash
cd server
nano .env  # or use any editor

# Update these lines:
ERC1155_CONTRACT_ADDRESS=0xYourNewAddress
WORKBENCH_INSTANCE_ADDRESS=0xYourNewWorkbenchAddress
MINTER_PRIVATE_KEY=0xYourNewPrivateKey
```

### 2. Restart Server
```bash
# Kill old process
lsof -ti:3001 | xargs kill -9

# Start fresh
npm run dev
```

### 3. Verify New Addresses Loaded
Check console output shows your new addresses:
```
   ERC1155 Contract: 0xYourNewAddress
   WorkbenchInstance Contract: 0xYourNewWorkbenchAddress
   Signer Address: 0xAddressFromYourNewPrivateKey
```

### 4. Update Database (if needed)
If you changed contracts, you may need to clean the database:
```bash
cd server
node cleanup-database.js

# Or recreate collections
node recreate-collections.js
```

---

## ✅ Final Checklist

- [ ] Server starts without "EADDRINUSE" error
- [ ] Console shows correct contract addresses
- [ ] Signer address matches your private key account
- [ ] MongoDB connected successfully
- [ ] Blockchain event listener started
- [ ] Health check endpoint responds
- [ ] Client can reach server API
- [ ] Shop page loads without errors
- [ ] Can mint free ingredients successfully
- [ ] .env files NOT in git

---

## 🚀 Ready to Go!

Once all checks pass:
1. Your environment is properly configured ✅
2. All addresses are loaded from .env ✅
3. Server and client can communicate ✅
4. Ready to mint and craft! 🎉

---

## 📞 Need Help?

If something isn't working:
1. Check server console for errors
2. Check browser console for API errors
3. Verify .env files exist in both server/ and client/
4. Make sure addresses start with 0x
5. Confirm private key is 66 characters (0x + 64 hex)
6. Restart both servers after .env changes

---

**Your configuration looks good based on the logs!** Just need to fix the port conflict and you're ready to go! 🚀

