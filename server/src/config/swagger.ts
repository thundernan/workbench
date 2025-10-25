import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workbench Server API',
      version: '1.0.0',
      description: 'A blockchain-synced Node.js TypeScript server with MongoDB integration for the Workbench Web3 game. Recipes are automatically synced from blockchain RecipeCreated events.',
      contact: {
        name: 'Workbench Team',
        email: 'team@workbench.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Recipe: {
          type: 'object',
          required: ['blockchainRecipeId', 'resultTokenContract', 'resultTokenId', 'resultAmount', 'ingredients', 'name'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '64f8a1b2c3d4e5f6a7b8c9d0'
            },
            blockchainRecipeId: {
              type: 'string',
              description: 'Recipe ID from blockchain',
              example: '12345'
            },
            resultTokenContract: {
              type: 'string',
              description: 'Address of the result ERC1155 contract',
              example: '0x1234567890123456789012345678901234567890',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            resultTokenId: {
              type: 'number',
              description: 'Token ID of the result',
              example: 1,
              minimum: 0
            },
            resultAmount: {
              type: 'number',
              description: 'Amount of result produced',
              example: 1,
              minimum: 1
            },
            ingredients: {
              type: 'array',
              description: 'Required ingredients for crafting',
              items: {
                type: 'object',
                properties: {
                  tokenContract: {
                    type: 'string',
                    description: 'Address of the ERC1155 contract',
                    example: '0x1234567890123456789012345678901234567890'
                  },
                  tokenId: {
                    type: 'number',
                    description: 'Token ID required',
                    example: 1
                  },
                  amount: {
                    type: 'number',
                    description: 'Amount required',
                    example: 5
                  },
                  position: {
                    type: 'number',
                    description: 'Position in crafting grid (0-8)',
                    example: 0
                  }
                }
              }
            },
            name: {
              type: 'string',
              description: 'Recipe name',
              example: 'Iron Sword Recipe',
              minLength: 1,
              maxLength: 100
            },
            description: {
              type: 'string',
              description: 'Recipe description',
              example: 'A basic iron sword crafted from iron ingots',
              maxLength: 500
            },
            category: {
              type: 'string',
              description: 'Recipe category',
              example: 'weapons',
              maxLength: 50
            },
            difficulty: {
              type: 'number',
              description: 'Difficulty level (1-10)',
              example: 2,
              minimum: 1,
              maximum: 10
            },
            craftingTime: {
              type: 'number',
              description: 'Time to craft in seconds',
              example: 30,
              minimum: 0
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            },
            error: {
              type: 'string',
              description: 'Error message (only present when success is false)',
              example: 'Validation failed'
            }
          }
        },
        PaginationResult: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Recipe'
              },
              description: 'Array of recipes'
            },
            total: {
              type: 'number',
              description: 'Total number of recipes',
              example: 25
            },
            page: {
              type: 'number',
              description: 'Current page number',
              example: 1
            },
            limit: {
              type: 'number',
              description: 'Items per page',
              example: 10
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages',
              example: 3
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
              example: 'Token contract must be a valid Ethereum address'
            }
          }
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Recipes', description: 'Recipe management endpoints (blockchain-synced)' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'] // files containing annotations as above
};

export const specs = swaggerJsdoc(options);