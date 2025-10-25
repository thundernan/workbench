// Workbench Contract ABI - Recipe Events and Crafting Methods
export const WORKBENCH_CONTRACT_ABI = [
  // RecipeCreated event
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "resultIngredientId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "ingredients",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint8[]",
        "name": "positions",
        "type": "uint8[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "RecipeCreated",
    "type": "event"
  },
  // ItemCrafted event
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "crafter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "outputContract",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "outputTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ItemCrafted",
    "type": "event"
  },
  // Crafting functions
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      }
    ],
    "name": "craftWithoutGrid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "grid",
        "type": "uint256[]"
      }
    ],
    "name": "craftWithGrid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "crafter",
        "type": "address"
      }
    ],
    "name": "canCraft",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      }
    ],
    "name": "getRecipe",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "tokenContract",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              },
              {
                "internalType": "uint8",
                "name": "position",
                "type": "uint8"
              }
            ],
            "internalType": "struct Workbench.Ingredient[]",
            "name": "ingredients",
            "type": "tuple[]"
          },
          {
            "internalType": "address",
            "name": "outputContract",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "outputTokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "outputAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "requiresExactPattern",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          }
        ],
        "internalType": "struct Workbench.Recipe",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveRecipeIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract interface for TypeScript
export interface WorkbenchContract {
  on(event: 'RecipeCreated', listener: (
    recipeId: bigint,
    resultIngredientId: bigint,
    ingredients: bigint[],
    positions: number[],
    amounts: bigint[],
    event: any
  ) => void): this;
  
  removeAllListeners(event?: string): this;
  target: string;
}
