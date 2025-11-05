# Environment Variables Setup Guide

## Overview
This guide shows you how to properly set up environment variables for both the server and client after changing addresses or credentials.

---

## Server Environment Variables (.env in /server)

### Required Variables

#### 1. **Blockchain Configuration**
```bash
# RPC endpoint for your blockchain network
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com

# ERC1155 GameItems contract address (IMPORTANT: Update this with your new address)
ERC1155_CONTRACT_ADDRESS=0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a

# WorkbenchInstance contract address (optional)
WORKBENCH_INSTANCE_ADDRESS=0x92aF4ba1B82A5F4F1d28060c73D26F9662DdDb5f

# Private key for minting operations (IMPORTANT: Update with your minter account)
MINTER_PRIVATE_KEY=your_private_key_here
```

#### 2. **Database Configuration**
```bash
# MongoDB connection (choose one method)

# Option A: Full MongoDB URI (e.g., for MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/workbench

# Option B: Individual components (for local MongoDB)
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB_NAME=workbench
MONGODB_USERNAME=your_username  # optional
MONGODB_PASSWORD=your_password  # optional
```

### Optional Variables
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Client Environment Variables (.env in /client)

### Required Variables
```bash
# API Base URL (backend server URL)
VITE_API_BASE_URL=http://localhost:3001

# Note: In production, this should point to your deployed backend
# Example: VITE_API_BASE_URL=https://your-backend-api.com
```

---

## Setup Instructions

### Step 1: Create Server .env File
```bash
cd server
touch .env
```

**Edit `server/.env`** with your values:
```bash
# Blockchain
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0xYourNewContractAddress
WORKBENCH_INSTANCE_ADDRESS=0xYourWorkbenchAddress
MINTER_PRIVATE_KEY=0xyourprivatekeyhere

# Database
MONGODB_URI=mongodb://localhost:27017/workbench

# Server
PORT=3001
NODE_ENV=development
```

### Step 2: Create Client .env File
```bash
cd ../client
touch .env
```

**Edit `client/.env`** with your values:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

---

## Verification Checklist

### ✅ Server Configuration

1. **Check server starts successfully:**
```bash
cd server
npm run dev
```

**Expected Output:**
```
✅ Connected to MongoDB: workbench
🔗 Initializing blockchain connection...
   RPC URL: https://zkrpc-sepolia.xsollazk.com
   ERC1155 Contract: 0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a
   WorkbenchInstance Contract: 0x92aF4ba1B82A5F4F1d28060c73D26F9662DdDb5f
✅ Connected to network: zkxsolla (chainId: 555776)
   Signer Address: 0x4E20D2f3a7B140405C81baC8B593b37221B6a847
✅ Blockchain connection initialized successfully
🚀 Server running on port 3001
```

2. **Verify environment variables are loaded:**
```bash
# Check if addresses are correct in console output
# Check if signer address matches your MINTER_PRIVATE_KEY account
```

### ✅ Client Configuration

1. **Check client builds/runs:**
```bash
cd client
npm run dev
```

2. **Test API connection:**
- Open browser console
- Navigate to Shop or any page that fetches data
- Should see successful API calls to `http://localhost:3001/api/...`

---

## Common Issues & Solutions

### Issue 1: "Blockchain configuration not provided"
**Cause**: Missing or incorrect environment variables

**Solution**:
```bash
# Check your server/.env file has:
BLOCKCHAIN_RPC_URL=https://...
ERC1155_CONTRACT_ADDRESS=0x...
```

### Issue 2: "Failed to initialize blockchain"
**Cause**: Invalid RPC URL or network issues

**Solution**:
- Verify RPC URL is accessible: `curl https://zkrpc-sepolia.xsollazk.com`
- Check network connection
- Verify RPC endpoint is working

### Issue 3: "Signer not initialized"
**Cause**: Missing or invalid MINTER_PRIVATE_KEY

**Solution**:
```bash
# Make sure MINTER_PRIVATE_KEY is in server/.env
MINTER_PRIVATE_KEY=0xyour64characterprivatekey

# Private key should:
# - Start with 0x
# - Be 66 characters long (0x + 64 hex chars)
# - Belong to an account with MINTER_ROLE on the contract
```

### Issue 4: "Cannot connect to MongoDB"
**Cause**: MongoDB not running or wrong connection string

**Solution**:
```bash
# Start MongoDB locally
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo

# Verify connection string in server/.env
MONGODB_URI=mongodb://localhost:27017/workbench
```

### Issue 5: "API calls failing from client"
**Cause**: Wrong VITE_API_BASE_URL or CORS issues

**Solution**:
```bash
# Check client/.env
VITE_API_BASE_URL=http://localhost:3001  # No trailing slash!

# Restart client dev server after changing .env
npm run dev
```

---

## Environment Variable Reference

### Server Variables Explained

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLOCKCHAIN_RPC_URL` | Yes | - | RPC endpoint for blockchain |
| `ERC1155_CONTRACT_ADDRESS` | Yes | - | Your deployed GameItems contract |
| `WORKBENCH_INSTANCE_ADDRESS` | No | - | WorkbenchInstance contract |
| `MINTER_PRIVATE_KEY` | Yes* | - | Private key for minting (write ops) |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment mode |

*Required for write operations (creating ingredients, minting)

### Client Variables Explained

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | '' | Backend API URL |

---

## Security Best Practices

### ⚠️ IMPORTANT Security Notes

1. **Never commit .env files to git**
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
```

2. **Private Key Security**
```bash
# NEVER share your MINTER_PRIVATE_KEY
# NEVER commit it to git
# Keep it secure and backed up safely
```

3. **Production Setup**
```bash
# In production, use:
# - Secure key management (AWS Secrets Manager, etc.)
# - Environment variables from hosting platform
# - Never hardcode keys in code
```

4. **Access Control**
```bash
# Restrict .env file permissions
chmod 600 server/.env
chmod 600 client/.env
```

---

## Quick Setup Script

Create this script to quickly set up your environment:

**`setup-env.sh`**:
```bash
#!/bin/bash

echo "🔧 Setting up environment variables..."

# Server .env
cat > server/.env << EOF
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://zkrpc-sepolia.xsollazk.com
ERC1155_CONTRACT_ADDRESS=0xYourContractAddress
WORKBENCH_INSTANCE_ADDRESS=0xYourWorkbenchAddress
MINTER_PRIVATE_KEY=0xyourprivatekey

# Database
MONGODB_URI=mongodb://localhost:27017/workbench

# Server
PORT=3001
NODE_ENV=development
EOF

# Client .env
cat > client/.env << EOF
VITE_API_BASE_URL=http://localhost:3001
EOF

echo "✅ Environment files created!"
echo "⚠️  Remember to update the addresses and private key!"
```

---

## Testing Your Setup

### 1. Test Server Connection
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-11-05T...",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Test Blockchain Connection
```bash
curl http://localhost:3001/api/ingredients
```

Should return list of ingredients.

### 3. Test Client to Server
Open browser console on `http://localhost:5173`:
```javascript
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Summary

### ✅ Your Setup Checklist

- [ ] Created `server/.env` with all required variables
- [ ] Updated `ERC1155_CONTRACT_ADDRESS` with your new contract
- [ ] Updated `MINTER_PRIVATE_KEY` with your minter account
- [ ] Updated `BLOCKCHAIN_RPC_URL` if changed
- [ ] Updated `WORKBENCH_INSTANCE_ADDRESS` if you have one
- [ ] Verified MongoDB connection string
- [ ] Created `client/.env` with backend URL
- [ ] Tested server starts without errors
- [ ] Verified blockchain connection initializes
- [ ] Verified signer address is correct
- [ ] Tested client can reach backend API
- [ ] Confirmed .env files are in .gitignore

---

## Next Steps

Once your environment is properly configured:

1. **Restart both servers:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2  
cd client && npm run dev
```

2. **Test functionality:**
- Visit Shop page
- Connect wallet
- Try minting a free ingredient
- Verify transaction succeeds

3. **Check console output:**
- Server should show blockchain connection
- Client should show no API errors
- Transactions should complete successfully

---

**Need help?** Check the console output for specific error messages and refer to the "Common Issues & Solutions" section above.

