# Workbench Server API Documentation

## Overview
The Workbench Server is a blockchain-synced Node.js TypeScript REST API designed for Web3 applications. The server automatically listens to blockchain `RecipeCreated` events and syncs recipe data to MongoDB. The client fetches recipes from the database - all recipe creation happens on-chain.

## Architecture
- **Blockchain-Driven**: All recipes are created on-chain
- **Event-Driven Sync**: Server listens to `RecipeCreated` events only
- **Read-Only API**: Client only fetches synced data from MongoDB
- **Real-Time Updates**: Recipes are automatically updated when recipe events occur

## Base Information
- **Base URL**: `http://localhost:3001`
- **API Version**: `1.0.0`
- **Protocol**: HTTP/HTTPS
- **Authentication**: None (Web3 wallet-based authentication handled on client side)
- **Content Type**: `application/json`

## Server Endpoints

### Root Endpoint
- **URL**: `/`
- **Method**: `GET`
- **Description**: Returns basic API information and available endpoints
- **Response**:
```json
{
  "success": true,
  "message": "Workbench Server API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "recipes": "/api/recipes",
    "documentation": "/api-docs"
  }
}
```

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Checks server and database connectivity status
- **Response**:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```
- **Status Codes**:
  - `200`: Server is healthy
  - `503`: Server is unhealthy (database disconnected)

## Recipe Endpoints

### Get All Recipes
- **URL**: `/api/recipes`
- **Method**: `GET`
- **Description**: Retrieves all recipes that have been synced from blockchain recipe events
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `blockchainRecipeId` (optional): Filter by blockchain recipe ID
  - `resultTokenContract` (optional): Filter by result token contract address
  - `resultTokenId` (optional): Filter by result token ID
  - `category` (optional): Filter by recipe category
  - `difficulty` (optional): Filter by difficulty level (1-10)
  - `name` (optional): Filter by recipe name (partial match)
- **Response** (200):
```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "blockchainRecipeId": "12345",
        "resultTokenContract": "0x1234567890123456789012345678901234567890",
        "resultTokenId": 1,
        "resultAmount": 1,
        "ingredients": [
          {
            "tokenContract": "0x1234567890123456789012345678901234567890",
            "tokenId": 2,
            "amount": 5,
            "position": 0
          }
        ],
        "name": "Iron Sword Recipe",
        "description": "A basic iron sword crafted from iron ingots",
        "category": "weapons",
        "difficulty": 2,
        "craftingTime": 30,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

## Blockchain Integration

### Event Listening
The server automatically listens to the following blockchain event:

#### RecipeCreated Event
```solidity
event RecipeCreated(
    uint256 indexed recipeId,
    uint256 indexed resultIngredientId,
    uint256[] ingredients,
    uint8[] positions,
    uint256[] amounts
);
```

**Server Behavior**:
1. Creates recipe with blockchain recipe ID
2. Stores result token contract and token ID
3. Creates ingredient components from the recipe data
4. Uses positions and amounts from the blockchain event
5. Sets default metadata (name, category, difficulty)

### Configuration
Set the following environment variables to enable blockchain integration:

```env
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
WORKBENCH_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**Note**: If blockchain configuration is not provided, the server runs in database-only mode.

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable (database disconnected)

### Validation Errors
- **Invalid Ethereum Address**: `Token contract must be a valid Ethereum address`
- **Invalid Token ID**: `Token ID must be non-negative`
- **Invalid Amount**: `Amount must be at least 1`
- **Invalid Position**: `Position must be between 0-8`
- **Invalid ObjectId**: `Invalid MongoDB ObjectId format`

## Rate Limiting
- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per IP per window
- **Headers**: Rate limit information included in response headers

## CORS Configuration
- **Allowed Origins**: 
  - `http://localhost:3000` (main client)
  - `http://localhost:3001` (server itself)
  - `http://localhost:3007` (additional client port)
  - `http://localhost:5173` (Vite default port)
  - `http://127.0.0.1:*` (localhost variants)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Headers**: Content-Type, Authorization, X-Requested-With, Accept, Origin
- **Credentials**: Supported

## Data Models

### Recipe Model
```typescript
interface IRecipe {
  blockchainRecipeId: string;     // Recipe ID from blockchain
  resultTokenContract: string;    // Address of the result ERC1155 contract
  resultTokenId: number;          // Token ID of the result
  resultAmount: number;           // Amount of result produced
  ingredients: IRecipeIngredient[]; // Required ingredients for crafting
  name: string;                   // Recipe name
  description?: string;           // Recipe description
  category?: string;              // Recipe category
  difficulty?: number;            // Difficulty level 1-10
  craftingTime?: number;          // Time to craft in seconds
  _id?: string;                   // MongoDB ObjectId
  createdAt?: Date;               // Creation timestamp
  updatedAt?: Date;               // Last update timestamp
}

interface IRecipeIngredient {
  tokenContract: string;  // Address of the ERC1155 contract
  tokenId: number;        // Token ID required
  amount: number;         // Amount required
  position: number;       // Position in the crafting grid (0-8)
}
```

### API Response Models
```typescript
interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface IPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Database Configuration
- **Database**: MongoDB
- **Connection**: MongoDB Atlas or local MongoDB
- **Indexes**: 
  - **Recipes**:
    - `blockchainRecipeId` (unique)
    - `resultTokenContract + resultTokenId` (compound)
    - `name` (single)
    - `category` (single)
    - `difficulty` (single)
    - `createdAt` (descending)

## Development Setup
1. **Install Dependencies**: `npm install`
2. **Configure Environment**: Copy `env-config.txt` to `.env` and update MongoDB credentials
3. **Configure Blockchain**: Set `BLOCKCHAIN_RPC_URL` and `WORKBENCH_CONTRACT_ADDRESS`
4. **Start Development Server**: `npm run dev`
5. **Access Swagger UI**: `http://localhost:3001/api-docs`
6. **Test Health**: `http://localhost:3001/health`

## Production Considerations
- Set `NODE_ENV=production`
- Configure production MongoDB Atlas URI
- Set appropriate CORS origins
- Configure rate limiting for production load
- Enable proper logging and monitoring
- Ensure reliable blockchain RPC endpoint

## Web3 Integration Notes
- **No Authentication Required**: All endpoints are publicly accessible
- **Blockchain-Driven**: Recipes are created on-chain
- **Event Synchronization**: Server automatically syncs blockchain events
- **Client Simplicity**: Client only needs to fetch recipes from API
- **Real-Time Updates**: Recipes are updated automatically when blockchain events occur
- **Rate Limiting**: Provides basic protection against abuse

## Usage Flow
1. **Smart Contract**: User creates recipe on blockchain
2. **Event Emission**: Contract emits `RecipeCreated` event
3. **Server Sync**: Server detects event and syncs recipe data to MongoDB
4. **Client Fetch**: Client requests recipes via `GET /api/recipes`
5. **Real-Time**: Client receives updated recipe data automatically