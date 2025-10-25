// Workbench Contract ABI - Recipe Events Only
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
