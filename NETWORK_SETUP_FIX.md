# Network Mismatch Fix - Complete Guide

## ✅ Problem Solved!

The blockchain config has been updated to **auto-detect any network** instead of being hardcoded to zkxsolla.

---

## 🔍 What Was Wrong

**Error**:
```
network changed: 555776 => 1660990954
```

**Cause**: Code was hardcoded to expect chain ID `555776` (zkxsolla), but your RPC URL returned chain ID `1660990954` (Status Sepolia testnet).

**Original Code** (lines 122-126):
```typescript
// ❌ Hardcoded to zkxsolla only
const networkConfig = {
  chainId: 555776,
  name: 'zkxsolla'
};
this.provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig);
```

**Fixed Code**:
```typescript
// ✅ Auto-detects any network
console.log('   Detecting network...');
this.provider = new ethers.JsonRpcProvider(rpcUrl);

const network = await this.provider.getNetwork();
console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
```

---

## 🚀 Now You Can Use ANY Network

### Supported Networks

Your server now works with:

1. **zkxsolla Sepolia** (Chain ID: 555776)
   ```bash
   BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
   ```

2. **Status Sepolia Testnet** (Chain ID: 1660990954)
   ```bash
   BLOCKCHAIN_RPC_URL=https://public.sepolia.rpc.status.network
   ```

3. **Any other EVM-compatible network**
   - Ethereum Mainnet/Sepolia
   - Polygon
   - Arbitrum
   - Optimism
   - Base
   - Custom networks
   - etc.

---

## 📝 Your Current Setup

Based on your terminal output, you're trying to use:

```bash
# server/.env
BLOCKCHAIN_RPC_URL=https://public.sepolia.rpc.status.network
ERC1155_CONTRACT_ADDRESS=0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
WORKBENCH_INSTANCE_ADDRESS=0xa64390F04c18194Be5BeB0bd362e6642EB05Ab62
```

---

## ⚠️ Important: Contract Deployment

### You MUST Ensure:

**Your contracts are deployed on the same network as your RPC URL!**

#### Option A: Contracts on zkxsolla ✅
If your contracts `0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4` are on zkxsolla:

```bash
# Use zkxsolla RPC
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
```

#### Option B: Contracts on Status Sepolia ✅
If your contracts are on Status Sepolia testnet:

```bash
# Use Status Sepolia RPC
BLOCKCHAIN_RPC_URL=https://public.sepolia.rpc.status.network
```

#### Option C: Different Contracts ❌
If you want to use Status Sepolia but your contracts are on zkxsolla:

**You need to redeploy your contracts to Status Sepolia!**

---

## 🔍 How to Verify Contract Network

### Check Contract on Block Explorer:

1. **zkxsolla Explorer**:
   ```
   https://explorer.zkxsolla.com/address/0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
   ```

2. **Status Sepolia Explorer**:
   ```
   https://sepolia.explorer.status.network/address/0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
   ```

3. **If contract exists**: Use that network's RPC
4. **If contract doesn't exist**: Deploy contracts to that network

---

## 🧪 Test Your Setup

### Step 1: Restart Server
```bash
cd server
npm run dev
```

### Expected Output:
```
🔗 Initializing blockchain connection...
   RPC URL: https://public.sepolia.rpc.status.network
   ERC1155 Contract: 0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
   WorkbenchInstance Contract: 0xa64390F04c18194Be5BeB0bd362e6642EB05Ab62
   Detecting network...
✅ Connected to network: status-sepolia (chainId: 1660990954)  ✅
   Signer Address: 0x...
✅ Blockchain connection initialized successfully
```

### Step 2: Verify Network Match
The chain ID should now match your RPC URL!

---

## 📋 Complete Setup Checklist

### 1. Verify Contract Deployment
- [ ] Check if your contracts exist on the network
- [ ] Visit block explorer for your contract address
- [ ] Confirm network matches your RPC URL

### 2. Update .env Files

**server/.env**:
```bash
# Choose RPC that matches where your contracts are deployed
BLOCKCHAIN_RPC_URL=https://your-network-rpc-url

# Your contract addresses
ERC1155_CONTRACT_ADDRESS=0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
WORKBENCH_INSTANCE_ADDRESS=0xa64390F04c18194Be5BeB0bd362e6642EB05Ab62

# Private key for minting (must have MINTER_ROLE on your contract)
MINTER_PRIVATE_KEY=your_private_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/workbench

# Server
PORT=3001
```

### 3. Restart Services
```bash
# Kill any existing processes
lsof -ti:3001 | xargs kill -9

# Start server
cd server && npm run dev

# In another terminal, start client
cd client && npm run dev
```

### 4. Test Connection
```bash
# Health check
curl http://localhost:3001/health

# Check ingredients (should work if contracts are on the network)
curl http://localhost:3001/api/ingredients
```

---

## 🎯 Common Scenarios

### Scenario 1: Using zkxsolla Network
```bash
# server/.env
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
```

**Expected Output:**
```
✅ Connected to network: zkxsolla (chainId: 555776)
```

### Scenario 2: Using Status Sepolia
```bash
# server/.env
BLOCKCHAIN_RPC_URL=https://public.sepolia.rpc.status.network
ERC1155_CONTRACT_ADDRESS=0x931224dB3Be4592Bf985Aaa4B9B20a99e3aC2CC4
```

**Expected Output:**
```
✅ Connected to network: status-sepolia (chainId: 1660990954)
```

### Scenario 3: Using Custom Network
```bash
# server/.env
BLOCKCHAIN_RPC_URL=https://your-custom-rpc.com
ERC1155_CONTRACT_ADDRESS=0xYourContractAddress
```

**Expected Output:**
```
✅ Connected to network: <detected-name> (chainId: <detected-id>)
```

---

## ⚠️ Troubleshooting

### Error: "Failed to detect network chain ID"
**Solution**: Check if your RPC URL is accessible
```bash
curl https://public.sepolia.rpc.status.network \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Error: "Contract call reverted"
**Cause**: Contract doesn't exist on this network

**Solution**: 
1. Verify contract address on block explorer
2. Either change RPC to match contract's network
3. Or deploy contracts to current network

### Error: "Signer not initialized"
**Cause**: Missing or invalid MINTER_PRIVATE_KEY

**Solution**: Check your .env has valid private key:
```bash
MINTER_PRIVATE_KEY=0x<64-hex-characters>
```

---

## 🔐 Wallet Configuration

### Frontend Wallet Setup

Your users' wallets (MetaMask, etc.) must also be on the correct network!

**Add Network to MetaMask**:

For Status Sepolia:
- Network Name: `Status Sepolia`
- RPC URL: `https://public.sepolia.rpc.status.network`
- Chain ID: `1660990954`
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.explorer.status.network`

For zkxsolla:
- Network Name: `zkxsolla Sepolia`
- RPC URL: `https://zkrpc-sepolia.xsollazk.com`
- Chain ID: `555776`
- Currency Symbol: `ETH`
- Block Explorer: `https://explorer.zkxsolla.com`

---

## 📊 Summary

### What Changed:
- ❌ Before: Hardcoded to chain ID 555776 (zkxsolla only)
- ✅ After: Auto-detects any network from RPC

### What You Need to Do:
1. ✅ Code is already fixed (auto-detection enabled)
2. ✅ Server rebuilt successfully
3. ⏳ Verify your contracts are on the network you're connecting to
4. ⏳ Restart server and test

### Benefits:
- ✅ Works with any EVM network
- ✅ No more network mismatch errors
- ✅ Flexible for multi-chain deployment
- ✅ Auto-detects chain ID

---

## 🚀 Next Steps

1. **Verify your contract deployment**:
   - Check block explorer
   - Confirm network

2. **Update .env if needed**:
   - Match RPC to contract network

3. **Restart server**:
   ```bash
   npm run dev
   ```

4. **Test minting**:
   - Open Shop page
   - Connect wallet (on same network!)
   - Try minting

---

**Status**: ✅ Fix applied and built successfully!

Now restart your server and it should connect to ANY network! 🎉

