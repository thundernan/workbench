# 🚀 Workbench - Available Scripts

This document describes all available npm scripts for the Workbench project.

## 📦 Installation Scripts

### Install All Dependencies
```bash
npm run install:all
```
Installs dependencies for root, server, and client **sequentially**.

### Install Dependencies Concurrently (Faster)
```bash
npm run install:concurrent
```
Installs server and client dependencies **at the same time** (faster).

---

## 🛠️ Development Scripts

### Run Full Stack Development
```bash
npm run dev
```
Runs both server and client in development mode **concurrently**.
- Server: http://localhost:3001
- Client: http://localhost:3000

### Run Server Only
```bash
npm run server:dev
```
Runs only the backend server in development mode.

### Run Client Only
```bash
npm run client:dev
```
Runs only the frontend client in development mode.

---

## 🏗️ Build Scripts

### Build Everything (Sequential)
```bash
npm run build
```
Builds server first, then client. **Recommended for production**.

### Build Everything (Concurrent - Faster)
```bash
npm run build:concurrent
```
Builds server and client **at the same time**. Faster but uses more CPU.

### Build Server Only
```bash
npm run server:build
```
Builds only the backend server.

### Build Client Only
```bash
npm run client:build
```
Builds only the frontend client.

---

## ▶️ Production Start Scripts

### Run Full Stack Production
```bash
npm start
```
Runs both built server and client preview **concurrently**.
- Server: http://localhost:3001
- Client: http://localhost:4173 (Vite preview)

### Run Server Production
```bash
npm run server:start
```
Runs only the built backend server.

### Run Client Preview
```bash
npm run client:preview
```
Previews the built frontend client.

---

## 🧹 Maintenance Scripts

### Clean All Dependencies and Builds
```bash
npm run clean
```
Removes all `node_modules` and `dist` folders from root, server, and client.

### Lint All Code
```bash
npm run lint
```
Runs linters for both server and client **concurrently**.

### Lint Server Only
```bash
npm run server:lint
```
Runs linter for backend code only.

### Lint Client Only
```bash
npm run client:lint
```
Runs linter for frontend code only.

---

## 📋 Quick Reference

| Command | Description | Time |
|---------|-------------|------|
| `npm run install:all` | Install all deps (sequential) | ~2-3 min |
| `npm run install:concurrent` | Install all deps (parallel) | ~1-2 min |
| `npm run dev` | Run dev servers | Continuous |
| `npm run build` | Build production (sequential) | ~1-2 min |
| `npm run build:concurrent` | Build production (parallel) | ~30-60s |
| `npm start` | Run production | Continuous |
| `npm run clean` | Clean all | ~5-10s |
| `npm run lint` | Lint all code | ~10-20s |

---

## 🎯 Common Workflows

### First Time Setup
```bash
# Clone repo
git clone <repo-url>
cd workbench

# Install dependencies (fast)
npm run install:concurrent

# Start development
npm run dev
```

### Daily Development
```bash
# Start dev servers
npm run dev

# In another terminal, run linter
npm run lint
```

### Production Deployment
```bash
# Clean previous builds
npm run clean

# Reinstall dependencies
npm run install:all

# Build for production
npm run build

# Test production build locally
npm start
```

### Quick Testing
```bash
# Build fast
npm run build:concurrent

# Start and test
npm start
```

---

## ⚙️ Environment Setup

### Required Files

**Server (.env):**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/workbench
NODE_ENV=development
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:3001
VITE_CRAFTING_CONTRACT_ADDRESS=0x...
VITE_TOKEN_CONTRACT_ADDRESS=0x...
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001 (server)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (client)
lsof -ti:3000 | xargs kill -9
```

### Build Fails
```bash
# Clean everything
npm run clean

# Reinstall
npm run install:all

# Try build again
npm run build
```

### Dependencies Out of Sync
```bash
# Clean
npm run clean

# Install fresh
npm run install:concurrent
```

---

## 💡 Tips

1. **Use `build:concurrent` for faster builds** during development
2. **Use `build` (sequential)** for production deployments (more stable)
3. **Always run `npm run clean`** before reinstalling if you have issues
4. **Use `npm run dev`** for hot-reload during development
5. **Check linter** with `npm run lint` before committing

---

## 📊 Performance Comparison

| Task | Sequential | Concurrent | Savings |
|------|-----------|-----------|---------|
| Install | 2-3 min | 1-2 min | ~50% |
| Build | 1-2 min | 30-60s | ~50% |
| Lint | 20-30s | 10-15s | ~50% |

**Recommendation:** Use concurrent scripts for development, sequential for production.

