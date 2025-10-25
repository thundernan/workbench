# Workbench Game - Full Stack Application

A blockchain-based crafting game built with Vue.js, Node.js, TypeScript, and MongoDB.

## 🏗️ Project Structure

```
workbench/
├── client/          # Vue.js frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/          # Node.js backend API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── package.json     # Root package for concurrent dev
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- MetaMask or another Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   cd workbench
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   This will install dependencies for root, server, and client.

3. **Set up environment variables**

   **Server** (`server/.env`):
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your configuration
   ```

   **Client** (`client/.env`):
   ```bash
   cd client
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   mongod
   ```
   
   Or use MongoDB Atlas (update `MONGODB_URI` in `server/.env`)

### Running the Application

#### Development Mode (Recommended)

Run both server and client concurrently:

```bash
npm run dev
```

This will:
- Start the server on `http://localhost:3001`
- Start the client on `http://localhost:3000`
- Enable hot-reload for both
- Proxy API requests from client to server

#### Individual Services

Run server only:
```bash
npm run server:dev
```

Run client only:
```bash
npm run client:dev
```

## 📡 API Communication

### Development

In development, the Vite dev server proxies API requests:

- Client makes request to: `http://localhost:3000/api/recipes`
- Proxy forwards to: `http://localhost:3001/api/recipes`

This is configured in `client/vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

### Using the API Service

The client includes an API service for easy server communication:

```typescript
import apiService from '@/services/apiService';

// Health check
const health = await apiService.healthCheck();

// Get all recipes
const recipes = await apiService.getRecipes();

// Get recipe by ID
const recipe = await apiService.getRecipeById('123');
```

## 🔧 Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both server and client concurrently |
| `npm run server:dev` | Run server in development mode |
| `npm run client:dev` | Run client in development mode |
| `npm run build` | Build both server and client |
| `npm run install:all` | Install all dependencies |
| `npm run clean` | Remove all node_modules and dist folders |

### Server (`cd server && npm run ...`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Run server with nodemon (hot-reload) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled server |
| `npm run lint` | Lint TypeScript files |

### Client (`cd client && npm run ...`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Run Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run type-check` | Check TypeScript types |

## 🌐 Ports & Endpoints

### Client (Port 3000)
- **Dev Server**: `http://localhost:3000`
- **Main App**: `http://localhost:3000/`
- **Workbench**: `http://localhost:3000/workbench`
- **Trading**: `http://localhost:3000/trading`

### Server (Port 3001)
- **API Base**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Recipes API**: `http://localhost:3001/api/recipes`
- **API Docs**: `http://localhost:3001/api-docs`

## 🔐 CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000` (default client dev server)
- `http://localhost:5173` (alternative Vite port)
- Custom origins via `CORS_ORIGIN` env variable

## 🗄️ Database

### MongoDB Connection

Update `server/.env`:

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/workbench
```

**MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/workbench?retryWrites=true&w=majority
```

### Database Models

- **Recipe**: Stores recipes synced from blockchain events

## ⛓️ Blockchain Integration

The server listens to blockchain events and syncs recipe data to MongoDB.

**Configuration** (`server/.env`):
```env
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia.publicnode.com
WORKBENCH_CONTRACT_ADDRESS=0xYourContractAddress
```

**Supported Events:**
- `RecipeCreated`: Syncs new recipes from smart contract

## 🎮 Web3 Wallet Integration

The client supports multiple Web3 wallets:
- MetaMask
- Coinbase Wallet
- WalletConnect (requires project ID)

**Setup WalletConnect:**
1. Get project ID from https://cloud.walletconnect.com
2. Add to `client/.env`:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

## 🛠️ Development Tips

### Hot Reload

Both server and client support hot reload:
- **Server**: Uses `nodemon` to restart on file changes
- **Client**: Uses Vite HMR for instant updates

### Debugging

**Server logs:**
```bash
npm run server:dev
# Logs include: database, API requests, blockchain events
```

**Client logs:**
- Open browser DevTools console
- Check Network tab for API requests

### Testing API Endpoints

Use the built-in Swagger UI:
```
http://localhost:3001/api-docs
```

Or use curl:
```bash
# Health check
curl http://localhost:3001/health

# Get recipes
curl http://localhost:3001/api/recipes
```

## 📦 Building for Production

### Build both:
```bash
npm run build
```

### Build individually:
```bash
npm run server:build
npm run client:build
```

### Deploy:

**Server:**
```bash
cd server
npm start
```

**Client:**
```bash
cd client
npm run preview
# Or serve the dist/ folder with any static server
```

## 🐛 Troubleshooting

### Port already in use

Kill processes on ports 3000 or 3001:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### CORS errors

1. Check `server/.env` has correct `CORS_ORIGIN`
2. Verify client is running on the allowed origin
3. Check Vite proxy configuration in `client/vite.config.ts`

### MongoDB connection failed

1. Verify MongoDB is running: `mongod`
2. Check `MONGODB_URI` in `server/.env`
3. Test connection: `mongosh <your_uri>`

### API requests failing

1. Ensure server is running on port 3001
2. Check Vite proxy logs in terminal
3. Verify API service usage in client code
4. Check browser Network tab for error details

## 📚 Documentation

- [Server API Documentation](./server/API_DOCUMENTATION.md)
- [Server README](./server/README.md)
- [Client README](./client/README.md)
- [Wallet Setup](./client/WALLET_SETUP.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test both client and server
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

