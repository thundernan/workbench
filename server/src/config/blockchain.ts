import { ethers } from 'ethers';

/**
 * Singleton Blockchain Connection Manager
 * Initializes once on server start and provides ERC1155 contract connection
 * For inventory and token balance features only
 */
class BlockchainConnection {
  private static instance: BlockchainConnection;
  private provider: ethers.Provider | null = null;
  private erc1155Contract: ethers.Contract | null = null;
  private workbenchInstanceContract: ethers.Contract | null = null;
  private isInitialized: boolean = false;

  // Configuration
  private rpcUrl: string = '';
  private erc1155Address: string = '';
  private workbenchInstanceAddress: string = '';

  // ERC1155 ABI
  private static readonly ERC1155_ABI = [
    // View functions
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
    'function uri(uint256 id) view returns (string)',
    'function tokenPrices(uint256 id) view returns (uint256)',
    'function tokenNames(uint256 id) view returns (string)',
    'function totalSupply(uint256 id) view returns (uint256)',
    'function exists(uint256 id) view returns (bool)',
    
    // Admin functions
    'function createTokenType(uint256 id, string memory name) external',
    
    // Minting functions
    'function publicMint(uint256 id, uint256 amount) payable returns (bool)',
    'function publicMintBatch(uint256[] ids, uint256[] amounts) payable returns (bool)',
    'function mint(address to, uint256 id, uint256 amount, bytes data) returns (bool)',
    
    // Events
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event URI(string value, uint256 indexed id)',
    'event TokenCreated(uint256 indexed id, string name)'
  ];

  // WorkbenchInstance ABI
  private static readonly WORKBENCH_INSTANCE_ABI = [
    // View functions
    'function getRecipe(uint256 recipeId) view returns (uint256 outputTokenId, uint256 outputAmount, bool requiresExactPattern, bool active, string memory name, uint256 ingredientCount)',
    'function getRecipeIngredient(uint256 recipeId, uint256 ingredientIndex) view returns (uint256 tokenId, uint256 amount, uint8 position)',
    'function getRecipeIngredients(uint256 recipeId) view returns (tuple(uint256 tokenId, uint256 amount, uint8 position)[] ingredients)',
    'function canCraft(uint256 recipeId, address user) view returns (bool hasIngredients)',
    'function validateGrid(uint256 recipeId, uint256[9] tokenIds, uint256[9] amounts) view returns (bool isValid)',
    'function getRecipeCount() view returns (uint256 count)',
    'function getActiveRecipeIds() view returns (uint256[] activeRecipeIds)',
    
    // Write functions
    'function createRecipe(tuple(uint256 tokenId, uint256 amount, uint8 position)[] ingredients, uint256 outputTokenId, uint256 outputAmount, bool requiresExactPattern, string memory name) external returns (uint256 recipeId)',
    'function craftWithGrid(uint256 recipeId, uint256[9] tokenIds, uint256[9] amounts) external',
    'function craftWithoutGrid(uint256 recipeId) external',
    'function toggleRecipe(uint256 recipeId) external',
    
    // Events
    'event RecipeCreated(uint256 indexed recipeId, string name, uint256 outputTokenId, uint256 outputAmount)',
    'event ItemCrafted(uint256 indexed recipeId, address indexed crafter, uint256 outputTokenId, uint256 amount)',
    'event RecipeToggled(uint256 indexed recipeId, bool active)'
  ];

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BlockchainConnection {
    if (!BlockchainConnection.instance) {
      BlockchainConnection.instance = new BlockchainConnection();
    }
    return BlockchainConnection.instance;
  }

  /**
   * Initialize blockchain connection
   * Should be called once on server start
   * @param rpcUrl - RPC provider URL (required)
   * @param erc1155Address - ERC1155 contract address (required)
   * @param workbenchInstanceAddress - WorkbenchInstance contract address (optional)
   */
  public async initialize(
    rpcUrl: string,
    erc1155Address: string,
    workbenchInstanceAddress?: string
  ): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  Blockchain connection already initialized');
      return;
    }

    try {
      console.log('🔗 Initializing blockchain connection...');
      console.log(`   RPC URL: ${rpcUrl}`);
      console.log(`   ERC1155 Contract: ${erc1155Address}`);
      if (workbenchInstanceAddress) {
        console.log(`   WorkbenchInstance Contract: ${workbenchInstanceAddress}`);
      }

      // Store configuration
      this.rpcUrl = rpcUrl;
      this.erc1155Address = erc1155Address;
      this.workbenchInstanceAddress = workbenchInstanceAddress || '';

      // Initialize provider with network configuration (disables ENS)
      // zkxsolla network (chainId: 555776) doesn't support ENS
      const networkConfig = {
        chainId: 555776,
        name: 'zkxsolla'
        // Don't set ensAddress - leave it unset to disable ENS
      };
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig);

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize ERC1155 contract
      this.erc1155Contract = new ethers.Contract(
        erc1155Address,
        BlockchainConnection.ERC1155_ABI,
        this.provider
      );

      // Initialize WorkbenchInstance contract if address provided
      if (workbenchInstanceAddress) {
        this.workbenchInstanceContract = new ethers.Contract(
          workbenchInstanceAddress,
          BlockchainConnection.WORKBENCH_INSTANCE_ABI,
          this.provider
        );
      }

      this.isInitialized = true;
      console.log('✅ Blockchain connection initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain connection:', error);
      throw new Error(`Blockchain initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if connection is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.provider !== null;
  }

  /**
   * Get the provider instance
   */
  public getProvider(): ethers.Provider {
    if (!this.provider) {
      throw new Error('Blockchain provider not initialized. Call initialize() first.');
    }
    return this.provider;
  }

  /**
   * Get the ERC1155 contract instance
   */
  public getERC1155Contract(): ethers.Contract {
    if (!this.erc1155Contract) {
      throw new Error('ERC1155 contract not initialized. Call initialize() first.');
    }
    return this.erc1155Contract;
  }

  /**
   * Get the WorkbenchInstance contract instance
   */
  public getWorkbenchInstanceContract(): ethers.Contract {
    if (!this.workbenchInstanceContract) {
      throw new Error('WorkbenchInstance contract not initialized. Call initialize() with workbenchInstanceAddress first.');
    }
    return this.workbenchInstanceContract;
  }

  /**
   * Get WorkbenchInstance contract address
   */
  public getWorkbenchInstanceAddress(): string {
    return this.workbenchInstanceAddress;
  }

  /**
   * Check if WorkbenchInstance contract is available
   */
  public hasWorkbenchInstanceContract(): boolean {
    return this.workbenchInstanceContract !== null;
  }

  /**
   * Get ERC1155 contract address
   */
  public getERC1155Address(): string {
    return this.erc1155Address;
  }

  /**
   * Get RPC URL
   */
  public getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Close connections (for graceful shutdown)
   */
  public async close(): Promise<void> {
    if (this.provider && 'destroy' in this.provider) {
      (this.provider as any).destroy();
    }
    this.provider = null;
    this.erc1155Contract = null;
    this.isInitialized = false;
    console.log('🔌 Blockchain connection closed');
  }
}

// Export singleton instance
export const blockchainConnection = BlockchainConnection.getInstance();

// Export type for services
export type { BlockchainConnection };

