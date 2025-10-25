# Setup Guide - Workbench Full Stack Application

Complete step-by-step guide to set up and run the Workbench application.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- ✅ **npm** >= 9.0.0 (comes with Node.js)
- ✅ **MongoDB** (local or Atlas account)
- ✅ **MetaMask** or another Web3 wallet browser extension
- ✅ **Terminal** or command line access

Check versions:
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Project Directory

```bash
cd /Users/marlenkalandarov/Documents/own/eth\ hackaton/workbench
```

### Step 2: Install Dependencies

Install all dependencies for root, server, and client:

```bash
npm run install:all
```

This will:
1. Install `concurrently` in root (for running both servers)
2. Install server dependencies (`cd server && npm install`)
3. Install client dependencies (`cd client && npm install`)

**Expected output:**
```
✓ Root dependencies installed
✓ Server dependencies installed  
✓ Client dependencies installed
```

### Step 3: Configure Server Environment

1. **Copy the environment template:**
   ```bash
   cd server
   cp env.example .env
   ```

2. **Edit `server/.env`:**
   ```bash
   nano .env
   # or
   code .env
   # or use any text editor
   ```

3. **Required configuration:**
   ```env
   # Server port (default: 3001)
   PORT=3001
   
   # Node environment
   NODE_ENV=development
   
   # MongoDB connection
   # Option A: Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/workbench
   
   # Option B: MongoDB Atlas (recommended)
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workbench?retryWrites=true&w=majority
   
   # CORS (client URL)
   CORS_ORIGIN=http://localhost:3000
   
   # Blockchain (optional - can leave default for now)
   BLOCKCHAIN_RPC_URL=https://ethereum-sepolia.publicnode.com
   WORKBENCH_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   ```

### Step 4: Configure Client Environment

1. **Copy the environment template:**
   ```bash
   cd ../client
   cp env.example .env
   ```

2. **Edit `client/.env`:**
   ```env
   # API Base URL (uses proxy in development)
   VITE_API_BASE_URL=/api
   
   # Application environment
   VITE_APP_ENV=development
   
   # Server URL (for production)
   VITE_SERVER_URL=http://localhost:3001
   
   # WalletConnect (optional - leave empty for now)
   VITE_WALLETCONNECT_PROJECT_ID=
   ```

### Step 5: Start MongoDB

**Option A: Local MongoDB**

If you have MongoDB installed locally:
```bash
# Start MongoDB daemon
mongod

# Or if using Homebrew on macOS:
brew services start mongodb-community
```

**Option B: MongoDB Atlas**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `server/.env`

### Step 6: Start the Application

Go back to the root directory:
```bash
cd ..
```

**Run both server and client concurrently:**
```bash
npm run dev
```

This will:
- ✅ Start server on `http://localhost:3001`
- ✅ Start client on `http://localhost:3000`
- ✅ Open browser automatically
- ✅ Enable hot-reload for both

**Expected output:**
```
[server] 🚀 Server running on port 3001
[server] 🔗 Database connected
[server] 📚 API Documentation: http://localhost:3001/api-docs
[client] ➜ Local: http://localhost:3000/
[client] ➜ ready in 500ms
```

## ✅ Verify Setup

### 1. Check Server Health

Open: `http://localhost:3001/health`

**Expected response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "database": "connected",
  "uptime": 12.345
}
```

### 2. Check API Documentation

Open: `http://localhost:3001/api-docs`

You should see Swagger UI with API endpoints.

### 3. Check Client

Open: `http://localhost:3000`

You should see the Workbench game interface.

### 4. Test API Connection

Open: `http://localhost:3000/api-test`

Click buttons to test:
- Health check endpoint
- Recipes API endpoint

## 🔧 Troubleshooting

### Problem: Port 3000 or 3001 already in use

**Solution:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: MongoDB connection failed

**Solution:**
1. Check MongoDB is running:
   ```bash
   # Check status
   brew services list | grep mongodb
   
   # Or try to connect
   mongosh
   ```

2. Verify `MONGODB_URI` in `server/.env`

3. Check MongoDB logs for errors

### Problem: CORS errors in browser

**Solution:**
1. Ensure server is running on port 3001
2. Ensure client is running on port 3000
3. Check `CORS_ORIGIN` in `server/.env` is `http://localhost:3000`
4. Clear browser cache and restart

### Problem: API requests fail (404 or connection refused)

**Solution:**
1. Check server is running: `curl http://localhost:3001/health`
2. Check Vite proxy configuration in `client/vite.config.ts`
3. Check browser console for errors
4. Verify `apiService.ts` is using correct base URL

### Problem: Dependencies installation fails

**Solution:**
```bash
# Clean npm cache
npm cache clean --force

# Remove all node_modules
npm run clean

# Reinstall
npm run install:all
```

### Problem: TypeScript errors in client

**Solution:**
```bash
cd client
npm run type-check
```

Fix any type errors shown.

### Problem: Server crashes on start

**Solution:**
1. Check server logs for error details
2. Verify all environment variables are set
3. Ensure MongoDB is accessible
4. Check Node.js version: `node --version` (must be >= 18)

## 🎯 Next Steps

After successful setup:

1. **Connect Your Wallet**
   - Install MetaMask extension
   - Click "Connect Wallet" in the app
   - Approve the connection

2. **Test API Integration**
   - Visit `/api-test` page
   - Test health check
   - Test recipes endpoint

3. **Explore the App**
   - `/` - Home page with crafting grid
   - `/workbench` - Full workbench interface
   - `/trading` - Trading system
   - `/inventory` - Inventory management

4. **Configure Blockchain (Optional)**
   - Deploy your smart contract
   - Update `WORKBENCH_CONTRACT_ADDRESS` in `server/.env`
   - Update `BLOCKCHAIN_RPC_URL` if using different network
   - Restart server to start listening to events

## 📚 Additional Resources

- [Main README](./README.md)
- [Server API Documentation](./server/API_DOCUMENTATION.md)
- [Wallet Setup Guide](./client/WALLET_SETUP.md)
- [Server README](./server/README.md)

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the terminal logs for errors
2. Check browser console (F12) for client errors
3. Review [Troubleshooting](#-troubleshooting) section
4. Check API docs at `http://localhost:3001/api-docs`

## 🎉 Success!

If you see both servers running and can access:
- ✅ Client: `http://localhost:3000`
- ✅ Server: `http://localhost:3001`
- ✅ API Test: `http://localhost:3000/api-test`
- ✅ Health Check: Returns success
- ✅ No CORS errors

**You're ready to develop! 🚀**

