# Deployment Guide

Your Workbench project deployment setup for production.

---

## 🌐 **Current Production Setup**

- **Frontend:** [https://craft-hack.netlify.app/](https://craft-hack.netlify.app/)
- **Backend:** Deploy to Railway/Render (instructions below)

---

## ✅ **CORS Configuration - FIXED**

Your production frontend domain `https://craft-hack.netlify.app` has been **whitelisted** in the server CORS configuration.

**File:** `server/src/index.ts` (line 43)
```typescript
const allowedOrigins = [
  // ... local development origins
  'https://craft-hack.netlify.app', // ✅ Production frontend
  process.env['CORS_ORIGIN'] || ''
];
```

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Backend to Railway** (Recommended)

#### **1.1 Setup Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your GitHub repository

#### **1.2 Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `workbench` repository
4. Railway will detect it's a Node.js project

#### **1.3 Configure Build**
Railway should auto-detect, but verify:
- **Root Directory:** Leave empty (monorepo root)
- **Build Command:** `cd server && npm install && npm run build`
- **Start Command:** `cd server && npm start`

Or create `railway.json` in project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### **1.4 Add Environment Variables**
In Railway Dashboard → Your Project → Variables:

```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-connection-string
CORS_ORIGIN=https://craft-hack.netlify.app
BLOCKCHAIN_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
WORKBENCH_CONTRACT_ADDRESS=0x...
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **1.5 Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Copy your Railway URL (e.g., `https://workbench-production.up.railway.app`)

---

### **Step 2: Update Netlify Frontend Configuration**

#### **2.1 Add Environment Variable in Netlify**
1. Go to Netlify Dashboard
2. Select your site (`craft-hack`)
3. Site settings → Environment variables
4. Add new variable:
   ```
   Key: VITE_API_BASE_URL
   Value: https://your-railway-url.railway.app/api
   ```
   Replace `your-railway-url` with your actual Railway URL

#### **2.2 Trigger Rebuild**
1. Deploys → Trigger deploy
2. Click "Clear cache and deploy site"
3. Wait for deployment to complete

---

### **Step 3: Verify Deployment**

#### **3.1 Test Backend Health**
```bash
curl https://your-railway-url.railway.app/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "database": "connected"
}
```

#### **3.2 Test CORS**
```bash
curl -H "Origin: https://craft-hack.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://your-railway-url.railway.app/api/recipes
```

**Expected:** No CORS errors in response

#### **3.3 Test Frontend**
1. Open https://craft-hack.netlify.app/
2. Open browser console (F12)
3. Check Network tab for API calls
4. Should see successful requests to your Railway backend
5. No CORS errors

---

## 🔧 **Troubleshooting**

### **Issue: CORS errors still appearing**

**Check:**
1. Server has been rebuilt with updated CORS config
2. Server is deployed to Railway/Render
3. Netlify environment variable is set correctly
4. Netlify site has been rebuilt after adding env var

**Solution:**
```bash
# 1. Rebuild server locally to verify
cd server
npm run build

# 2. Commit and push changes
git add .
git commit -m "Fix: Add production domain to CORS whitelist"
git push origin main

# 3. Redeploy on Railway (automatic on git push)
# 4. Clear cache and rebuild on Netlify
```

---

### **Issue: Server not connecting to MongoDB**

**Check:**
1. MongoDB Atlas Network Access has `0.0.0.0/0` whitelisted
2. `MONGODB_URI` environment variable is set in Railway
3. Connection string format is correct

**Solution:**
1. MongoDB Atlas → Network Access → Add IP Address → Allow from Anywhere
2. Verify `MONGODB_URI` in Railway dashboard
3. Check Railway logs for connection errors

---

### **Issue: Frontend can't reach backend**

**Check:**
1. `VITE_API_BASE_URL` is set in Netlify
2. Value includes `/api` at the end
3. Railway server is running (check Railway logs)
4. Network tab shows correct URL being called

**Solution:**
1. Netlify Dashboard → Environment variables
2. Verify `VITE_API_BASE_URL=https://your-server.railway.app/api`
3. Trigger new Netlify deploy
4. Hard refresh frontend (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📊 **Architecture Diagram**

```
┌──────────────────────────────────┐
│  craft-hack.netlify.app          │
│  (Vue.js Frontend)               │
│                                  │
│  Uses: VITE_API_BASE_URL         │
└──────────────┬───────────────────┘
               │
               │ HTTPS Requests
               │ (CORS: ✅ Allowed)
               ▼
┌──────────────────────────────────┐
│  your-server.railway.app         │
│  (Node.js/Express Backend)       │
│                                  │
│  CORS Whitelist:                 │
│  - https://craft-hack.netlify.app│
│  - localhost origins (dev)       │
└──────────────┬───────────────────┘
               │
               │ Mongoose
               ▼
┌──────────────────────────────────┐
│  MongoDB Atlas                   │
│  (Database)                      │
│                                  │
│  Network Access: 0.0.0.0/0       │
└──────────────────────────────────┘
```

---

## 🎯 **Quick Checklist**

Before going live:

- [x] Server CORS updated with `https://craft-hack.netlify.app`
- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] Server deployed to Railway/Render
- [ ] Railway environment variables configured
- [ ] Railway URL copied
- [ ] Netlify environment variable `VITE_API_BASE_URL` set
- [ ] Netlify site rebuilt with new env var
- [ ] Health endpoint tested: `/health`
- [ ] API endpoint tested: `/api/recipes`
- [ ] Frontend tested in production
- [ ] No CORS errors in browser console
- [ ] Blockchain listener configured (if using)

---

## 📝 **Deployment Commands**

### **Local Testing Before Deploy:**
```bash
# Build both client and server
npm run build

# Test production build locally
npm run start
```

### **Deploy to Railway:**
```bash
# Push changes
git add .
git commit -m "Update production configuration"
git push origin main

# Railway auto-deploys on push
```

### **Deploy to Netlify:**
```bash
# Frontend auto-deploys on push to main
# Or trigger manual deploy in Netlify dashboard
```

---

## 🔗 **Useful Links**

- **Frontend (Production):** https://craft-hack.netlify.app/
- **Backend (Railway):** https://your-server.railway.app (after deployment)
- **API Health:** https://your-server.railway.app/health
- **API Recipes:** https://your-server.railway.app/api/recipes
- **API Docs:** https://your-server.railway.app/api-docs
- **Railway Dashboard:** https://railway.app/dashboard
- **Netlify Dashboard:** https://app.netlify.com
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## 🎉 **You're All Set!**

Your CORS configuration is fixed. Now:
1. Deploy your backend to Railway
2. Add `VITE_API_BASE_URL` to Netlify
3. Rebuild both
4. Test at https://craft-hack.netlify.app/

No more CORS errors! 🚀

