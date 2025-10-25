# Client-Server Setup - Complete ✅

## 🎉 What Has Been Set Up

Your Workbench application is now fully configured to run client and server concurrently with seamless communication between them.

## 📦 What Was Created/Modified

### 1. Root Package.json
**File:** `package.json`
- Added `concurrently` dependency
- Created scripts to run both servers simultaneously
- Scripts: `dev`, `server:dev`, `client:dev`, `install:all`, etc.

### 2. Vite Proxy Configuration
**File:** `client/vite.config.ts`
- Added proxy for `/api` → `http://localhost:3001`
- Added proxy for `/health` → `http://localhost:3001`
- Enables seamless API calls without CORS issues in development

### 3. API Service
**File:** `client/src/services/apiService.ts`
- Centralized API communication
- Type-safe interfaces for Recipe and HealthCheck
- Error handling wrapper
- Methods: `healthCheck()`, `getRecipes()`, `getRecipeById()`, `getRecipeByRecipeId()`

### 4. API Test Page
**File:** `client/src/views/ApiTest.vue`
- Interactive testing interface
- Health check testing
- Recipes API testing
- Configuration display
- Route: `http://localhost:3000/api-test`

### 5. Environment Templates
**Files:** 
- `server/env.example` - Server environment template
- `client/env.example` - Client environment template

### 6. Documentation
**Files:**
- `README.md` - Complete project documentation
- `SETUP_GUIDE.md` - Step-by-step setup instructions
- `QUICK_START.md` - Quick reference guide
- `CLIENT_SERVER_SETUP_COMPLETE.md` - This file

## 🚀 How to Run

### Quick Start
```bash
cd /Users/marlenkalandarov/Documents/own/eth\ hackaton/workbench
npm run dev
```

This single command:
1. Starts the server on port 3001
2. Starts the client on port 3000
3. Enables hot-reload for both
4. Opens browser automatically

### Individual Services
```bash
# Server only
npm run server:dev

# Client only
npm run client:dev
```

## 🔄 How Communication Works

### Development Mode

```
┌─────────────────────────────────────────────────────────┐
│                    Development Flow                      │
└─────────────────────────────────────────────────────────┘

Client (localhost:3000)
    │
    │ Request: /api/recipes
    ├────────────────────────────────────────┐
    │                                        │
    │         Vite Dev Server Proxy          │
    │                                        │
    │ Proxies to: http://localhost:3001     │
    ├────────────────────────────────────────┘
    │
    ▼
Server (localhost:3001)
    │
    │ CORS Check: Allow localhost:3000 ✓
    │ Route: /api/recipes
    │ Database Query
    │
    ▼
Response with Data
    │
    ├──► Client receives JSON
    │
    └──► Displays in UI
```

### Key Points

1. **Client makes requests to `/api/...`** (relative URLs)
2. **Vite proxy intercepts** these requests
3. **Proxy forwards** to `http://localhost:3001/api/...`
4. **Server processes** and returns response
5. **Client receives** data as if from same origin
6. **No CORS issues** in development!

## 🛠️ Configuration Details

### Server CORS Setup
**File:** `server/src/index.ts`

```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Client dev server
    'http://localhost:5173',  // Alternative Vite port
    // ... more origins
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};
```

### Client Proxy Setup
**File:** `client/vite.config.ts`

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
    '/health': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## 📡 API Service Usage

### Import the Service
```typescript
import apiService from '@/services/apiService';
```

### Make API Calls
```typescript
// Health check
const health = await apiService.healthCheck();
console.log(health.database); // "connected"

// Get all recipes
const recipes = await apiService.getRecipes();
console.log(`Found ${recipes.length} recipes`);

// Get specific recipe
const recipe = await apiService.getRecipeById('64abc123...');
console.log(recipe.recipeId);
```

### Error Handling
```typescript
try {
  const recipes = await apiService.getRecipes();
  // Use recipes
} catch (error) {
  console.error('Failed to fetch recipes:', error.message);
  // Show error to user
}
```

## ✅ Verification Checklist

Use this checklist to verify everything is working:

### Before Starting
- [ ] Node.js >= 18.0.0 installed
- [ ] MongoDB running (local or Atlas)
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Environment files configured (`server/.env` and `client/.env`)

### After Starting (`npm run dev`)
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Server shows: "🚀 Server running on port 3001"
- [ ] Client shows: "➜ Local: http://localhost:3000/"
- [ ] Browser opens automatically
- [ ] No red errors in terminal

### Testing
- [ ] Visit `http://localhost:3001/health`
  - Should return JSON with `"success": true`
- [ ] Visit `http://localhost:3000`
  - Should load the Workbench app
- [ ] Visit `http://localhost:3000/api-test`
  - Should show API test page
  - Click "Test Health Endpoint" → Shows success
  - Click "Fetch Recipes" → Shows recipes or empty array
- [ ] Open browser console (F12)
  - No CORS errors
  - No 404 errors for `/api/*` endpoints

## 🐛 Common Issues & Solutions

### Issue: Ports Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Then restart
npm run dev
```

### Issue: CORS Errors

**Error:** `Access-Control-Allow-Origin` in browser console

**Solutions:**
1. Ensure client is on port 3000
2. Ensure server is on port 3001
3. Check `CORS_ORIGIN` in `server/.env` = `http://localhost:3000`
4. Verify proxy in `client/vite.config.ts`
5. Clear browser cache

### Issue: API 404 Errors

**Error:** `GET http://localhost:3000/api/recipes 404`

**Solutions:**
1. Check server is running: `curl http://localhost:3001/health`
2. Verify proxy configuration in `client/vite.config.ts`
3. Check API routes in `server/src/index.ts`
4. Restart both services

### Issue: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
1. Start MongoDB: `brew services start mongodb-community` or `mongod`
2. Check `MONGODB_URI` in `server/.env`
3. Test connection: `mongosh "mongodb://localhost:27017/workbench"`

## 📚 Available Routes

### Server (http://localhost:3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/api/recipes` | Get all recipes |
| GET | `/api/recipes/:id` | Get recipe by MongoDB ID |
| GET | `/api/recipes/blockchain/:recipeId` | Get recipe by blockchain ID |
| GET | `/api-docs` | Swagger UI |

### Client (http://localhost:3000)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Main game interface |
| `/workbench` | Workbench | Crafting interface |
| `/trading` | Trading | Trade items |
| `/inventory` | Inventory | Item management |
| `/api-test` | API Test | Test server connection |
| `/wallet-debug` | Wallet Debug | Debug wallet issues |

## 🎯 Next Steps

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   - Visit http://localhost:3000/api-test
   - Click test buttons

3. **Connect your wallet:**
   - Install MetaMask
   - Click "Connect Wallet"
   - Approve connection

4. **Start developing:**
   - Both servers have hot-reload
   - Edit files and see changes instantly
   - Check terminal for errors

## 💡 Development Tips

### Hot Reload
- **Client:** Changes reflect instantly (Vite HMR)
- **Server:** Restarts automatically (nodemon)

### Debugging
- **Server logs:** Check terminal where `npm run dev` is running
- **Client logs:** Open browser DevTools (F12) → Console
- **Network requests:** DevTools → Network tab

### Adding New API Endpoints

1. **Create route** in `server/src/routes/`
2. **Create controller** in `server/src/controllers/`
3. **Add to** `server/src/index.ts`
4. **Update** `client/src/services/apiService.ts`
5. **Test** in `http://localhost:3000/api-test`

### API Service Pattern

All API calls should go through `apiService.ts`:
```typescript
// ✅ Good
import apiService from '@/services/apiService';
const data = await apiService.getRecipes();

// ❌ Avoid
const response = await fetch('/api/recipes');
```

## 🎊 Success!

Your full-stack setup is complete! You can now:
- ✅ Run both client and server with one command
- ✅ Make API calls without CORS issues
- ✅ Hot-reload on code changes
- ✅ Test APIs easily
- ✅ Debug efficiently

**Happy coding! 🚀**

---

## 📖 Documentation Index

- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[README.md](./README.md)** - Full project documentation
- **[server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md)** - API reference
- **[client/WALLET_SETUP.md](./client/WALLET_SETUP.md)** - Wallet integration guide

