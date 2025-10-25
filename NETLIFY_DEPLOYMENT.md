# 🚀 Netlify Deployment Guide

This guide will help you deploy your Workbench full-stack application to Netlify with both the Vue.js frontend and Node.js backend running on a single Netlify project.

## 📋 Prerequisites

- GitHub/GitLab/Bitbucket account
- Netlify account (free tier works)
- MongoDB Atlas account (for production database)
- Git repository with your code

---

## 🎯 Step 1: Prepare Your Code

### 1.1 Install Dependencies
```bash
# Install Netlify CLI and serverless dependencies
npm install

# This will install:
# - serverless-http (for Express wrapper)
# - netlify-cli (for local testing and deployment)
# - concurrently (for running multiple processes)
```

### 1.2 Verify Configuration Files

Make sure these files exist:
- ✅ `netlify.toml` - Netlify configuration (already created)
- ✅ `netlify/functions/api.ts` - Serverless function wrapper (already created)
- ✅ `.env.example` files in both client and server folders

---

## 🌐 Step 2: Set Up MongoDB Atlas (Production Database)

### 2.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Click "Build a Database"
4. Choose "Free" (M0) tier
5. Select a cloud provider and region close to your users
6. Click "Create"

### 2.2 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ This is required for Netlify Functions
4. Click "Confirm"

### 2.3 Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and password (save these!)
5. Set "Database User Privileges" to "Read and write to any database"
6. Click "Add User"

### 2.4 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `workbench`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/workbench?retryWrites=true&w=majority
```

---

## 🚀 Step 3: Deploy to Netlify (UI Method)

### 3.1 Push Code to Git Repository
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 3.2 Create Netlify Site

1. **Go to Netlify:**
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Log in or sign up

2. **Import Project:**
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your `workbench` repository

3. **Configure Build Settings:**
   
   **Site settings:**
   - **Team**: Your team (default)
   - **Site name**: Choose a name (e.g., `workbench-game`)
   
   **Build settings:**
   - **Branch to deploy**: `main` (or your default branch)
   - **Base directory**: Leave empty
   - **Build command**: `npm run build:all`
   - **Publish directory**: `client/dist`
   - **Functions directory**: `netlify/functions`

4. **Click "Deploy site"**
   - ⚠️ The first deploy will FAIL because environment variables are not set yet
   - This is expected!

### 3.3 Configure Environment Variables

1. **Go to Site Settings:**
   - Click on "Site configuration" → "Environment variables"
   
2. **Add Environment Variables:**
   Click "Add a variable" for each of these:

   #### **Required Variables:**
   ```
   KEY: MONGODB_URI
   VALUE: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/workbench?retryWrites=true&w=majority
   SCOPES: All
   
   KEY: NODE_ENV
   VALUE: production
   SCOPES: All
   
   KEY: NODE_VERSION
   VALUE: 18
   SCOPES: All
   ```

   #### **Optional Variables (for blockchain features):**
   ```
   KEY: VITE_CRAFTING_CONTRACT_ADDRESS
   VALUE: 0x... (your contract address)
   SCOPES: All
   
   KEY: VITE_TOKEN_CONTRACT_ADDRESS
   VALUE: 0x... (your token contract address)
   SCOPES: All
   
   KEY: BLOCKCHAIN_RPC_URL
   VALUE: https://... (your RPC URL)
   SCOPES: All
   
   KEY: BLOCKCHAIN_NETWORK_ID
   VALUE: 1 (or your network ID)
   SCOPES: All
   ```

3. **Save all variables**

### 3.4 Trigger Redeploy

1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for deployment to complete (~3-5 minutes)
4. Check deployment logs for any errors

---

## 🧪 Step 4: Verify Deployment

### 4.1 Check Frontend
1. Visit your site URL (e.g., `https://workbench-game.netlify.app`)
2. Verify the UI loads correctly
3. Check browser console for errors

### 4.2 Check Backend API
1. Visit `https://your-site.netlify.app/api/health`
2. Should return:
   ```json
   {
     "success": true,
     "message": "API is running on Netlify Functions",
     "timestamp": "2024-01-15T...",
     "database": "connected"
   }
   ```

### 4.3 Check Recipes API
1. Visit `https://your-site.netlify.app/api/recipes`
2. Should return recipe data from MongoDB

### 4.4 Test Wallet Connection
1. Try connecting MetaMask
2. Verify wallet connects successfully
3. Check if address displays correctly

---

## 🔧 Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. Go to "Domain management"
2. Click "Add domain"
3. Enter your domain (e.g., `workbench.game`)
4. Click "Verify"

### 5.2 Configure DNS
1. Go to your domain registrar
2. Add CNAME record:
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-site.netlify.app
   ```
3. Wait for DNS propagation (5-60 minutes)

### 5.3 Enable HTTPS
1. Netlify automatically provisions SSL certificate
2. Wait for "HTTPS" to show as "Secured"
3. Enable "Force HTTPS" redirect

---

## 🛠️ Local Development with Netlify

### Test Netlify Functions Locally
```bash
# Install Netlify CLI globally (if not done)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Run local dev server with Netlify functions
npm run netlify:dev
```

This starts:
- Frontend: `http://localhost:8888`
- Functions: `http://localhost:8888/.netlify/functions/api`

---

## 📊 Monitoring & Logs

### View Function Logs
1. Go to Netlify dashboard
2. Click "Functions" tab
3. Click on your function (`api`)
4. View logs and invocation count

### View Deploy Logs
1. Go to "Deploys" tab
2. Click on a specific deploy
3. View build logs and errors

### Real-time Function Logs
```bash
netlify functions:log api
```

---

## 🐛 Troubleshooting

### Build Fails

**Problem**: Build command fails

**Solution**:
1. Check build logs in Netlify
2. Verify `package.json` scripts
3. Ensure all dependencies are listed
4. Try building locally first

### Database Connection Error

**Problem**: `database: "disconnected"` in health check

**Solution**:
1. Check `MONGODB_URI` environment variable
2. Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
3. Confirm database user permissions
4. Test connection string locally

### API Routes Not Working

**Problem**: 404 errors on `/api/*` routes

**Solution**:
1. Check `netlify.toml` redirects
2. Verify functions directory: `netlify/functions`
3. Check function naming: `api.ts` → `/.netlify/functions/api`
4. Review function logs

### CORS Errors

**Problem**: CORS errors in browser console

**Solution**:
1. Check headers in `netlify.toml`
2. Verify `cors()` middleware in API function
3. Add specific origins if needed

### Large Bundle Size Warning

**Problem**: Chunks larger than 500 KB

**Solution**:
1. Use code splitting: `build.rollupOptions.output.manualChunks`
2. Lazy load components
3. Remove unused dependencies
4. Enable tree shaking

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Code pushed to Git repository
- [ ] MongoDB Atlas database created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Database user created
- [ ] Environment variables set in Netlify
- [ ] Build command: `npm run build:all`
- [ ] Publish directory: `client/dist`
- [ ] Functions directory: `netlify/functions`
- [ ] All dependencies listed in package.json

After deploying:
- [ ] Frontend loads correctly
- [ ] `/api/health` returns success
- [ ] `/api/recipes` returns data
- [ ] Wallet connection works
- [ ] No console errors
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

---

## 🔄 Continuous Deployment

Once set up, Netlify automatically:
- ✅ Deploys on every `git push` to main branch
- ✅ Runs build command
- ✅ Deploys preview for pull requests
- ✅ Invalidates CDN cache
- ✅ Updates functions

### Manual Deploy
```bash
# Deploy to production
npm run netlify:deploy
```

---

## 📈 Performance Tips

1. **Enable Caching**: Already configured in `netlify.toml`
2. **Use CDN**: Netlify's global CDN is automatic
3. **Optimize Images**: Use WebP format
4. **Code Splitting**: Lazy load routes
5. **Function Cold Starts**: Keep functions small
6. **Database Pooling**: Reuse MongoDB connections

---

## 🆘 Support Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Vue.js Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)

---

## 🎉 Success!

Your full-stack Workbench application is now deployed on Netlify!

**Live URLs:**
- Frontend: `https://your-site.netlify.app`
- API Health: `https://your-site.netlify.app/api/health`
- API Recipes: `https://your-site.netlify.app/api/recipes`

**Next Steps:**
1. Share your app URL
2. Monitor function usage
3. Set up custom domain
4. Configure analytics
5. Add more features!

---

## 📞 Need Help?

If you encounter issues:
1. Check Netlify deploy logs
2. Review function logs
3. Test API endpoints manually
4. Verify environment variables
5. Check MongoDB Atlas connection

Happy deploying! 🚀

