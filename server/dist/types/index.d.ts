export interface IRecipeIngredient {
    tokenContract: string;
    tokenId: number;
    amount: number;
    position: number;
}
export interface IRecipe {
    blockchainRecipeId: string;
    resultTokenContract: string;
    resultTokenId: number;
    resultAmount: number;
    ingredients: IRecipeIngredient[];
    name: string;
    description?: string;
    category?: string;
    difficulty?: number;
    craftingTime?: number;
}
export interface IRecipeDocument extends IRecipe {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export interface IRecipeQuery {
    blockchainRecipeId?: string;
    resultTokenContract?: string;
    resultTokenId?: number;
    name?: string;
    category?: string;
    difficulty?: number;
    page?: number;
    limit?: number;
}
export interface IPaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=index.d.ts.map