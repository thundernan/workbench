"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKBENCH_CONTRACT_ABI = void 0;
exports.WORKBENCH_CONTRACT_ABI = [
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
//# sourceMappingURL=contract.js.map