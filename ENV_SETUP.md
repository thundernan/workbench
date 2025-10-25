# Environment Variables Setup Guide

This guide explains how to configure environment variables for both client and server.

---

## 📁 **File Structure**

```
workbench/
├── client/
│   ├── .env.example    ← Copy to .env and configure
│   └── .env            ← Your local config (gitignored)
│
└── server/
    ├── .env.example    ← Copy to .env and configure
    └── .env            ← Your local config (gitignored)
```

---

## 🔧 **Quick Setup**

### **1. Client Environment**

```bash
cd client
cp .env.example .env
# Edit .env with your values
```

**Development (.env):**
```env
# Use proxy for local development
VITE_SERVER_URL=http://127.0.0.1:3001
VITE_API_BASE_URL=/api
```

**Production (.env.production):**
```env
# Point to deployed server
VITE_API_BASE_URL=https://your-server.railway.app/api
```

---

### **2. Server Environment**

```bash
cd server
cp .env.example .env
# Edit .env with your values
```

**Required Configuration:**
```env
# MongoDB connection (get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workbench_db

# Server port
PORT=3001

# CORS - frontend URL
CORS_ORIGIN=http://localhost:3000

# Blockchain (get from Alchemy/Infura)
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x...
```

---

## 📋 **Environment Variables Reference**

### **Client (`client/.env`)**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_SERVER_URL` | Backend server URL (for proxy) | `http://127.0.0.1:3001` | `https://api.example.com` |
| `VITE_API_BASE_URL` | API base path | `/api` | `https://api.example.com/api` |
| `VITE_CRAFTING_CONTRACT_ADDRESS` | Smart contract address | - | `0x123...` |
| `VITE_TOKEN_CONTRACT_ADDRESS` | ERC1155 token contract | - | `0x456...` |
| `VITE_NETWORK_RPC_URL` | Blockchain RPC URL | - | `https://eth-mainnet.g.alchemy.com/v2/...` |
| `VITE_CHAIN_ID` | Network chain ID | - | `1` (mainnet) |

---

### **Server (`server/.env`)**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `3001` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CORS_ORIGIN` | **Yes** | Allowed frontend origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |
| `RPC_URL` | **Yes*** | Blockchain RPC endpoint | `https://eth-mainnet.g.alchemy.com/v2/KEY` |
| `CONTRACT_ADDRESS` | **Yes*** | Recipe contract address | `0x...` |
| `NETWORK_CHAIN_ID` | No | Network chain ID | `1` (mainnet) |
| `START_BLOCK` | No | Start block for events | `0` |

**\*Required only if using blockchain listener**

---

## 🚀 **Deployment Scenarios**

### **Scenario 1: Local Development**

**Client:**
```env
VITE_SERVER_URL=http://127.0.0.1:3001
VITE_API_BASE_URL=/api
```

**Server:**
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=http://localhost:3000
```

**Run:**
```bash
npm run dev  # Runs both client and server
```

---

### **Scenario 2: Separate Deployments**

#### **Frontend on Vercel/Netlify**
#### **Backend on Railway/Render**

**Client (.env.production):**
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

**Server (Railway/Render env vars):**
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://your-frontend.vercel.app
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
CONTRACT_ADDRESS=0x...
```

---

### **Scenario 3: All-in-One Deployment**

#### **Both on Railway/Render**

**Project Structure:**
```bash
# Build both
npm run build

# Server serves both API and frontend
server/dist/  # Backend
client/dist/  # Frontend (served as static)
```

**Server .env:**
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://your-app.railway.app
```

---

## 🔐 **Getting External Services**

### **1. MongoDB Atlas (Database)**

1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Database Access → Add user
4. Network Access → Add IP (0.0.0.0/0 for production)
5. Connect → Get connection string
6. Set as `MONGODB_URI`

---

### **2. Alchemy/Infura (Blockchain RPC)**

**Alchemy (Recommended):**
1. Go to https://www.alchemy.com
2. Create free account
3. Create new app
4. Copy HTTPS URL
5. Set as `RPC_URL`

**Infura:**
1. Go to https://infura.io
2. Create free account
3. Create new project
4. Copy endpoint URL
5. Set as `RPC_URL`

---

### **3. Smart Contract Addresses**

Get these from your deployed contracts:
- `CONTRACT_ADDRESS` - Your recipe crafting contract
- `VITE_CRAFTING_CONTRACT_ADDRESS` - Same as above (for client)
- `VITE_TOKEN_CONTRACT_ADDRESS` - Your ERC1155 token contract

---

## ⚙️ **How It Works**

### **Development Mode**

```
┌─────────────────┐
│  Client (3000)  │
│  Vite Dev       │
└────────┬────────┘
         │ /api/* requests
         │ (proxied by vite.config.ts)
         ▼
┌─────────────────┐
│  Server (3001)  │
│  Express API    │
└─────────────────┘
```

**Client uses proxy:**
- Requests to `/api/*` are proxied to `http://127.0.0.1:3001`
- No CORS issues
- Configured via `VITE_SERVER_URL` in vite.config.ts

---

### **Production Mode**

```
┌─────────────────┐
│  Client (Vercel)│
│  Static Files   │
└────────┬────────┘
         │ HTTPS requests
         │ (direct to API URL)
         ▼
┌─────────────────┐
│ Server (Railway)│
│  Express API    │
└─────────────────┘
```

**Client makes direct requests:**
- Requests to `VITE_API_BASE_URL`
- CORS configured via `CORS_ORIGIN` on server
- No proxy needed

---

## 🧪 **Testing Your Configuration**

### **1. Test Server Connection**

```bash
# Start server
cd server
npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Expected:
# {"success": true, "database": "connected"}
```

---

### **2. Test Client Connection**

```bash
# Start client
cd client
npm run dev

# Visit: http://localhost:3000
# Open browser console
# Check for API calls in Network tab
```

---

### **3. Test API Service**

Open browser console on client:
```javascript
// Test health check
const response = await fetch('/api/health');
const data = await response.json();
console.log(data);

// Expected:
// {success: true, database: "connected"}
```

---

## 🐛 **Troubleshooting**

### **"Failed to fetch" error in client**

**Cause:** Client can't reach server

**Fix:**
1. Check server is running (`npm run server:dev`)
2. Verify `VITE_SERVER_URL` matches server port
3. Check server logs for errors

---

### **CORS Error**

**Cause:** Server blocking client origin

**Fix:**
1. Update server `CORS_ORIGIN` to match client URL
2. Development: `http://localhost:3000`
3. Production: `https://your-frontend-domain.com`

---

### **"MONGODB_URI is not defined"**

**Cause:** Missing server environment variable

**Fix:**
1. Create `server/.env` from `server/.env.example`
2. Add `MONGODB_URI=mongodb+srv://...`
3. Restart server

---

### **"API Base URL not configured"**

**Cause:** Client env var missing

**Fix:**
1. Create `client/.env` from `client/.env.example`
2. Set `VITE_API_BASE_URL=/api` (development)
3. Or `VITE_API_BASE_URL=https://...` (production)

---

## 📚 **Additional Resources**

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Alchemy API](https://docs.alchemy.com/)
- [Railway Deployment](https://docs.railway.app/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ **Checklist**

Before deploying, ensure:

- [ ] Created `client/.env` from example
- [ ] Created `server/.env` from example
- [ ] Set `MONGODB_URI` in server
- [ ] Set `CORS_ORIGIN` in server
- [ ] Set `RPC_URL` if using blockchain
- [ ] Tested locally with `npm run dev`
- [ ] Updated `VITE_API_BASE_URL` for production
- [ ] Whitelisted IPs in MongoDB Atlas (0.0.0.0/0)
- [ ] Verified health endpoint works
- [ ] Tested API calls from client

---

## 🎯 **Quick Reference**

**Local Development:**
```bash
# 1. Setup env files
cp client/.env.example client/.env
cp server/.env.example server/.env

# 2. Edit server/.env with MongoDB URI
# 3. Run everything
npm run dev
```

**Production Deployment:**
```bash
# Set environment variables in hosting platform:
# - Railway/Render: Project settings → Environment
# - Vercel/Netlify: Project settings → Environment variables
```

---

Need help? Check the troubleshooting section or open an issue! 🚀

