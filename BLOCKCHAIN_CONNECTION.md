# Blockchain Connection Architecture

## Overview
The server uses a **singleton blockchain connection** that initializes once on startup and is shared across all services. This approach is more efficient than creating new connections for each request.

## Architecture

### Singleton Pattern
```
┌─────────────────────────────────────┐
│   Server Startup (index.ts)        │
│   - Initialize Database             │
│   - Initialize Blockchain           │  ← One-time initialization
│   - Start HTTP Server               │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  BlockchainConnection (Singleton)   │
│  - JsonRpcProvider (shared)         │
│  - ERC1155 Contract (shared)        │
│  - Workbench Contract (shared)      │
└─────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│ Ingredient      │  │ Workbench       │
│ Service         │  │ Crafting Service│
└─────────────────┘  └─────────────────┘
```

## Implementation

### 1. Singleton Connection Manager
File: `server/src/config/blockchain.ts`

```typescript
import { blockchainConnection } from './config/blockchain';

// Initialize on server start
await blockchainConnection.initialize(
  rpcUrl,
  erc1155Address,
  workbenchAddress
);

// Check if ready
if (blockchainConnection.isReady()) {
  console.log('✅ Blockchain connection ready');
}

// Get instances
const provider = blockchainConnection.getProvider();
const erc1155 = blockchainConnection.getERC1155Contract();
const workbench = blockchainConnection.getWorkbenchContract();
```

### 2. Server Initialization
File: `server/src/index.ts`

The blockchain connection is initialized once during server startup:

```typescript
const startServer = async () => {
  // 1. Connect to database
  await database.connect();
  
  // 2. Initialize blockchain connection (singleton)
  if (rpcUrl && erc1155Address && workbenchAddress) {
    await blockchainConnection.initialize(rpcUrl, erc1155Address, workbenchAddress);
  }
  
  // 3. Start HTTP server
  app.listen(PORT, () => {
    if (blockchainConnection.isReady()) {
      console.log('⛓️  Blockchain Connection: Ready');
    }
  });
};
```

### 3. Service Usage
Services no longer need RPC URL or contract addresses - they use the singleton connection:

**Before (Old Way):**
```typescript
// ❌ Creates new connection for each instance
const service = new IngredientBlockchainService(rpcUrl, contractAddress);
```

**After (New Way):**
```typescript
// ✅ Uses shared singleton connection
const service = new IngredientBlockchainService();
```

## Services

### IngredientBlockchainService
```typescript
import { blockchainConnection } from '../config/blockchain';

class IngredientBlockchainService {
  private contract: ethers.Contract;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized');
    }
    this.contract = blockchainConnection.getERC1155Contract();
  }

  getContractAddress(): string {
    return blockchainConnection.getERC1155Address();
  }

  getProvider(): ethers.Provider {
    return blockchainConnection.getProvider();
  }
}
```

### WorkbenchCraftingService
```typescript
import { blockchainConnection } from '../config/blockchain';

class WorkbenchCraftingService {
  private contract: ethers.Contract;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized');
    }
    this.contract = blockchainConnection.getWorkbenchContract();
  }

  getContractAddress(): string {
    return blockchainConnection.getWorkbenchAddress();
  }

  getProvider(): ethers.Provider {
    return blockchainConnection.getProvider();
  }
}
```

## Controllers

Controllers create service instances without parameters:

```typescript
import { blockchainConnection } from '../config/blockchain';
import { IngredientBlockchainService } from '../services/ingredientBlockchainService';

const initBlockchainService = (): IngredientBlockchainService | null => {
  if (!blockchainConnection.isReady()) {
    return null;
  }
  
  try {
    return new IngredientBlockchainService();
  } catch (error) {
    console.error('Failed to create service:', error);
    return null;
  }
};
```

## Environment Variables

Required environment variables for blockchain initialization:

```env
BLOCKCHAIN_RPC_URL=https://your-rpc-url
ERC1155_CONTRACT_ADDRESS=0x...
WORKBENCH_CONTRACT_ADDRESS=0x...
```

If any of these are missing or invalid, the server will start in **database-only mode** without blockchain integration.

## Benefits

### ✅ Performance
- **One connection** instead of multiple connections per request
- **Reuses WebSocket/HTTP connections** to RPC provider
- **Lower memory usage** - shared provider and contract instances

### ✅ Reliability
- **Connection pooling** handled by single provider instance
- **Centralized error handling** for connection issues
- **Graceful degradation** - server continues without blockchain if initialization fails

### ✅ Maintainability
- **Single source of truth** for blockchain configuration
- **Easier testing** - mock the singleton for tests
- **Cleaner service constructors** - no need to pass URLs/addresses

### ✅ Resource Management
- **Proper cleanup** on server shutdown
- **No leaked connections** from multiple service instances
- **Better connection monitoring** - single point to check status

## Graceful Shutdown

The blockchain connection is properly closed during server shutdown:

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  await blockchainConnection.close();  // ← Close blockchain connection
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await database.disconnect();
  await blockchainConnection.close();  // ← Close blockchain connection
  process.exit(0);
});
```

## Error Handling

### Server Startup Failure
If blockchain initialization fails, the server **continues** in database-only mode:

```
⚠️  Failed to initialize blockchain: Connection timeout
📝 Server will continue without blockchain integration
🚀 Server running on port 3001
⛓️  Blockchain Connection: Not initialized
```

### Service Creation Failure
If a service can't be created (e.g., blockchain not ready), controllers return graceful errors:

```json
{
  "success": false,
  "message": "Blockchain service not available. Configure BLOCKCHAIN_RPC_URL and ERC1155_CONTRACT_ADDRESS."
}
```

## Testing

For testing, you can mock the blockchain connection:

```typescript
import { blockchainConnection } from '../config/blockchain';

// Mock for tests
jest.mock('../config/blockchain', () => ({
  blockchainConnection: {
    isReady: () => true,
    getProvider: () => mockProvider,
    getERC1155Contract: () => mockContract,
    getWorkbenchContract: () => mockContract,
    getERC1155Address: () => '0x123...',
    getWorkbenchAddress: () => '0x456...',
  }
}));
```

## Monitoring

Check blockchain connection status:

```bash
# Health check includes blockchain status
curl http://localhost:3001/health

# Server logs show connection status
⛓️  Blockchain Connection: Ready
   ERC1155: 0x1234...
   Workbench: 0x5678...
```

## Migration from Old Architecture

### Old Controller Code
```typescript
// ❌ Old way - creates new connection each time
const service = initBlockchainService(); // passed rpcUrl, address
if (!service) {
  return res.status(503).json({ error: 'Service not available' });
}
```

### New Controller Code
```typescript
// ✅ New way - uses singleton connection
const service = initBlockchainService(); // no params
if (!service) {
  return res.status(503).json({ error: 'Service not available' });
}
```

The API remains the same, but the underlying implementation is more efficient!

## Summary

- **One connection** per server process (singleton pattern)
- **Initialized once** on server startup
- **Shared across** all services and requests
- **Graceful shutdown** with proper cleanup
- **Better performance** and resource management
- **No breaking changes** to API or service interfaces

