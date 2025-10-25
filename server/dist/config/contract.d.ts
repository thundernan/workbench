export declare const WORKBENCH_CONTRACT_ABI: {
    anonymous: boolean;
    inputs: {
        indexed: boolean;
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    type: string;
}[];
export interface WorkbenchContract {
    on(event: 'RecipeCreated', listener: (recipeId: bigint, resultIngredientId: bigint, ingredients: bigint[], positions: number[], amounts: bigint[], event: any) => void): this;
    removeAllListeners(event?: string): this;
    target: string;
}
//# sourceMappingURL=contract.d.ts.map