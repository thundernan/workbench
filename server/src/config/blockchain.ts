import { ethers } from 'ethers';

/**
 * Singleton Blockchain Connection Manager
 * Initializes once on server start and provides connections to services
 */
class BlockchainConnection {
  private static instance: BlockchainConnection;
  private provider: ethers.Provider | null = null;
  private erc1155Contract: ethers.Contract | null = null;
  private workbenchContract: ethers.Contract | null = null;
  private isInitialized: boolean = false;

  // Configuration
  private rpcUrl: string = '';
  private erc1155Address: string = '';
  private workbenchAddress: string = '';

  // ABIs
  private static readonly ERC1155_ABI = [
    // View functions
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
    'function uri(uint256 id) view returns (string)',
    'function tokenPrices(uint256 id) view returns (uint256)',
    'function tokenNames(uint256 id) view returns (string)',
    'function totalSupply(uint256 id) view returns (uint256)',
    'function exists(uint256 id) view returns (bool)',
    
    // Events
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event URI(string value, uint256 indexed id)',
    
    // Minting functions
    'function publicMint(uint256 id, uint256 amount) payable',
    'function publicMintBatch(uint256[] ids, uint256[] amounts) payable'
  ];

  private static readonly WORKBENCH_ABI = [
    // View functions
    'function canCraft(uint256 recipeId, address crafter) view returns (bool)',
    'function getRecipe(uint256 recipeId) view returns (tuple(tuple(address tokenContract, uint256 tokenId, uint8 position)[] ingredients, address outputContract, uint256 outputTokenId, uint256 outputAmount, bool requiresExactPattern, bool active, string name))',
    'function getActiveRecipeIds() view returns (uint256[])',
    'function craftingFee() view returns (uint256)',
    
    // State-changing functions
    'function craftWithoutGrid(uint256 recipeId) payable',
    'function craftWithGrid(uint256 recipeId, uint8[] positions) payable',
    
    // Events
    'event RecipeCreated(uint256 indexed recipeId, address indexed creator, uint256 outputTokenId, string name)',
    'event ItemCrafted(uint256 indexed recipeId, address indexed crafter, uint256 outputTokenId, uint256 outputAmount)'
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
   * Initialize blockchain connections
   * Should be called once on server start
   * @param rpcUrl - RPC provider URL (required)
   * @param erc1155Address - ERC1155 contract address (required)
   * @param workbenchAddress - Workbench contract address (optional)
   */
  public async initialize(
    rpcUrl: string,
    erc1155Address: string,
    workbenchAddress?: string
  ): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  Blockchain connection already initialized');
      return;
    }

    try {
      console.log('🔗 Initializing blockchain connection...');
      console.log(`   RPC URL: ${rpcUrl}`);
      console.log(`   ERC1155 Contract: ${erc1155Address}`);
      if (workbenchAddress) {
        console.log(`   Workbench Contract: ${workbenchAddress}`);
      }

      // Store configuration
      this.rpcUrl = rpcUrl;
      this.erc1155Address = erc1155Address;
      this.workbenchAddress = workbenchAddress || '';

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

      // Initialize ERC1155 contract (required)
      this.erc1155Contract = new ethers.Contract(
        erc1155Address,
        BlockchainConnection.ERC1155_ABI,
        this.provider
      );

      // Initialize Workbench contract (optional)
      if (workbenchAddress && workbenchAddress !== '0x0000000000000000000000000000000000000000') {
        this.workbenchContract = new ethers.Contract(
          workbenchAddress,
          BlockchainConnection.WORKBENCH_ABI,
          this.provider
        );
        console.log('✅ Workbench contract initialized');
      } else {
        console.log('⚠️  Workbench contract not configured (crafting features disabled)');
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
   * Get the Workbench contract instance
   */
  public getWorkbenchContract(): ethers.Contract {
    if (!this.workbenchContract) {
      throw new Error('Workbench contract not initialized. Make sure WORKBENCH_CONTRACT_ADDRESS is configured.');
    }
    return this.workbenchContract;
  }

  /**
   * Check if Workbench contract is available
   */
  public hasWorkbenchContract(): boolean {
    return this.workbenchContract !== null;
  }

  /**
   * Get ERC1155 contract address
   */
  public getERC1155Address(): string {
    return this.erc1155Address;
  }

  /**
   * Get Workbench contract address
   */
  public getWorkbenchAddress(): string {
    return this.workbenchAddress;
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
    this.workbenchContract = null;
    this.isInitialized = false;
    console.log('🔌 Blockchain connection closed');
  }
}

// Export singleton instance
export const blockchainConnection = BlockchainConnection.getInstance();

// Export type for services
export type { BlockchainConnection };

