export declare class BlockchainListener {
    private provider;
    private contract;
    private isListening;
    constructor(rpcUrl: string, contractAddress: string, contractABI: any[]);
    startListening(): Promise<void>;
    stopListening(): Promise<void>;
    private handleRecipeCreated;
    isActive(): boolean;
    getContractAddress(): string;
}
//# sourceMappingURL=blockchainListener.d.ts.map