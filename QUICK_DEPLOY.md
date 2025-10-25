# ⚡ Quick Netlify Deployment Guide

## 🎯 5-Minute Setup

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Netlify"
git push origin main
```

### Step 2: Create Netlify Site

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Select your repository
4. Configure:
   - **Build command**: `npm run build:all`
   - **Publish directory**: `client/dist`
   - **Functions directory**: `netlify/functions`
5. Click **"Deploy site"** (will fail - this is expected)

### Step 3: Set Environment Variables

1. Go to **Site configuration** → **Environment variables**
2. Add these variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/workbench
NODE_ENV = production
NODE_VERSION = 18
```

3. Click **"Save"**

### Step 4: Redeploy

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait 3-5 minutes

### Step 5: Verify

Visit: `https://your-site.netlify.app/api/health`

Should see:
```json
{
  "success": true,
  "message": "API is running on Netlify Functions",
  "database": "connected"
}
```

## ✅ Done!

Your app is live at: `https://your-site.netlify.app`

---

## 🔧 MongoDB Atlas Quick Setup

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create cluster (M0 Free)
3. **Network Access**: Allow `0.0.0.0/0`
4. **Database Access**: Create user with read/write access
5. **Connect**: Get connection string
6. Copy to Netlify as `MONGODB_URI`

---

## 📱 Netlify UI Configuration

### Build & Deploy Settings

```
Base directory: (leave empty)
Build command: npm run build:all
Publish directory: client/dist
Functions directory: netlify/functions
```

### Environment Variables

| Key | Value | Example |
|-----|-------|---------|
| `MONGODB_URI` | Your MongoDB connection string | `mongodb+srv://...` |
| `NODE_ENV` | `production` | `production` |
| `NODE_VERSION` | `18` | `18` |

### Optional Variables (Blockchain)

| Key | Value |
|-----|-------|
| `VITE_CRAFTING_CONTRACT_ADDRESS` | Your contract address |
| `VITE_TOKEN_CONTRACT_ADDRESS` | Your token contract |
| `BLOCKCHAIN_RPC_URL` | Your RPC URL |

---

## 🐛 Quick Troubleshooting

### Build Fails?
- Check build logs in Netlify
- Verify `npm run build:all` works locally

### API Not Working?
- Check environment variables are set
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Check function logs in Netlify

### Database Won't Connect?
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access
- Confirm user has correct permissions

---

## 🚀 Local Testing

```bash
# Install dependencies
npm install

# Test locally with Netlify functions
npm run netlify:dev

# Access at: http://localhost:8888
```

---

## 📝 Files Created

- ✅ `netlify.toml` - Netlify configuration
- ✅ `netlify/functions/api.ts` - Serverless function
- ✅ Updated `package.json` with build scripts

---

## 🎉 That's It!

Your full-stack app is now deployed on Netlify!

For detailed instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

