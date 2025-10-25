# Workbench Server

A Node.js TypeScript server with MongoDB integration for the Workbench Web3 game, providing CRUD operations for Ingredient management. This server is designed for Web3 applications and uses wallet-based authentication on the client side.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB** integration with Mongoose and authentication support
- **TypeScript** for type safety
- **Input validation** with Joi
- **Error handling** middleware
- **Rate limiting** for security
- **CORS** configuration
- **Health checks** and monitoring
- **Pagination** support
- **Bulk operations**
- **Web3 Ready** - No JWT authentication, designed for wallet-based auth
- **Swagger UI** - Interactive API documentation and testing interface

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 4.4
- npm or yarn

## 🛠️ Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup MongoDB user (recommended):**
   ```bash
   node setup-mongodb.js
   ```

4. **Setup environment variables:**
   ```bash
   cp env-config.txt .env
   ```
   
   Edit `.env` file with your MongoDB credentials:
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://your-username:your-password@localhost:27017/workbench
   MONGODB_DB_NAME=workbench
   MONGODB_USERNAME=your-username
   MONGODB_PASSWORD=your-password
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start MongoDB:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or using local installation
   mongod
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

### API Documentation (Swagger UI)
```
http://localhost:3001/api-docs
```

### Health Check
```http
GET /health
```

### Ingredient Model
```typescript
interface Ingredient {
  tokenContract: string;  // ERC1155 contract address
  tokenId: number;        // Token ID required
  amount: number;         // Amount required
  position: number;      // Position in crafting grid (0-8)
}
```

### Endpoints

#### Create Ingredient
```http
POST /api/ingredients
Content-Type: application/json

{
  "tokenContract": "0x1234567890123456789012345678901234567890",
  "tokenId": 1,
  "amount": 5,
  "position": 0
}
```

#### Get All Ingredients
```http
GET /api/ingredients?page=1&limit=10&tokenContract=0x123...
```

#### Get Ingredient by ID
```http
GET /api/ingredients/:id
```

#### Update Ingredient
```http
PUT /api/ingredients/:id
Content-Type: application/json

{
  "amount": 10
}
```

#### Delete Ingredient
```http
DELETE /api/ingredients/:id
```

#### Get Ingredients by Token Contract
```http
GET /api/ingredients/token-contract/:tokenContract
```

#### Get Ingredients by Position
```http
GET /api/ingredients/position/:position
```

#### Bulk Create Ingredients
```http
POST /api/ingredients/bulk-create
Content-Type: application/json

{
  "ingredients": [
    {
      "tokenContract": "0x123...",
      "tokenId": 1,
      "amount": 5,
      "position": 0
    },
    {
      "tokenContract": "0x123...",
      "tokenId": 2,
      "amount": 3,
      "position": 1
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/workbench` |
| `MONGODB_DB_NAME` | Database name | `workbench` |
| `MONGODB_USERNAME` | MongoDB username | - |
| `MONGODB_PASSWORD` | MongoDB password | - |
| `MONGODB_HOST` | MongoDB host | `localhost` |
| `MONGODB_PORT` | MongoDB port | `27017` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🧪 Testing

### Using Swagger UI (Recommended)
1. Start the server: `npm run dev`
2. Open your browser and go to: `http://localhost:3001/api-docs`
3. Use the interactive interface to test all endpoints
4. Click "Try it out" on any endpoint to test it directly

### Using curl

```bash
# Create ingredient
curl -X POST http://localhost:3001/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "tokenContract": "0x1234567890123456789012345678901234567890",
    "tokenId": 1,
    "amount": 5,
    "position": 0
  }'

# Get all ingredients
curl http://localhost:3001/api/ingredients

# Get ingredient by ID
curl http://localhost:3001/api/ingredients/64f8a1b2c3d4e5f6a7b8c9d0
```

### Using Postman

Import the following collection:
```json
{
  "info": {
    "name": "Workbench API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Ingredient",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"tokenContract\": \"0x1234567890123456789012345678901234567890\",\n  \"tokenId\": 1,\n  \"amount\": 5,\n  \"position\": 0\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/ingredients",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "ingredients"]
        }
      }
    }
  ]
}
```

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # Database configuration
│   ├── controllers/
│   │   └── ingredientController.ts  # CRUD operations
│   ├── middleware/
│   │   ├── errorHandler.ts      # Error handling
│   │   └── validation.ts        # Input validation
│   ├── models/
│   │   └── Ingredient.ts        # MongoDB schema
│   ├── routes/
│   │   └── ingredientRoutes.ts  # API routes
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   └── index.ts                 # Main application
├── package.json
├── tsconfig.json
├── nodemon.json
└── env.example
```

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **Input validation** with Joi
- **CORS** configuration
- **Error handling** without sensitive data exposure

## 📊 Monitoring

- Health check endpoint at `/health`
- Request logging with Morgan
- Database connection monitoring
- Graceful shutdown handling

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper CORS origins
4. Configure rate limiting
5. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
