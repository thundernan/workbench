import { ethers } from 'ethers';
import { blockchainConnection } from '../config/blockchain';

/**
 * Ingredient Blockchain Service
 * Handles interactions with the ERC1155 GameItems smart contract
 * Uses singleton blockchain connection initialized on server start
 * Based on technical documentation specifications
 */
export class IngredientBlockchainService {
  private contract: ethers.Contract;

  constructor() {
    if (!blockchainConnection.isReady()) {
      throw new Error('Blockchain connection not initialized. Make sure server initialization completed successfully.');
    }
    this.contract = blockchainConnection.getERC1155Contract();
  }

  /**
   * Get token balance for a specific address
   * @param address - Wallet address
   * @param tokenId - Token ID
   * @returns Balance as string
   */
  async getTokenBalance(address: string, tokenId: number): Promise<string> {
    try {
      const balance = await this.contract['balanceOf']?.(address, tokenId);
      if (!balance) {
        throw new Error('Failed to call balanceOf');
      }
      return balance.toString();
    } catch (error) {
      console.error(`Failed to get balance for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get balances for multiple tokens in a single call (batch)
   * @param addresses - Array of wallet addresses
   * @param tokenIds - Array of token IDs
   * @returns Array of balances as strings
   */
  async getTokenBalanceBatch(addresses: string[], tokenIds: number[]): Promise<string[]> {
    try {
      if (addresses.length !== tokenIds.length) {
        throw new Error('Addresses and tokenIds arrays must have the same length');
      }

      console.log("Getting balance");
      const balances = await this.contract['balanceOfBatch']?.(addresses, tokenIds);
      console.log({balances});
      if (!balances) {
        throw new Error('Failed to call balanceOfBatch');
      }
      return balances.map((balance: bigint) => balance.toString());
    } catch (error) {
      console.error('Failed to get batch balances:', error);
      throw new Error(`Failed to fetch batch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token price in Wei
   * @param tokenId - Token ID
   * @returns Price in Wei as string
   */
  async getTokenPrice(tokenId: number): Promise<string> {
    try {
      const price = await this.contract['tokenPrices']?.(tokenId);
      if (!price) {
        throw new Error('Failed to call tokenPrices');
      }
      return price.toString();
    } catch (error) {
      console.error(`Failed to get price for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token price in ETH (formatted)
   * @param tokenId - Token ID
   * @returns Price in ETH as string
   */
  async getTokenPriceInEth(tokenId: number): Promise<string> {
    try {
      const priceWei = await this.getTokenPrice(tokenId);
      return ethers.formatEther(priceWei);
    } catch (error) {
      console.error(`Failed to get price in ETH for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token price in ETH: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token name
   * @param tokenId - Token ID
   * @returns Token name
   */
  async getTokenName(tokenId: number): Promise<string> {
    try {
      const name = await this.contract['tokenNames']?.(tokenId);
      if (!name) {
        throw new Error('Failed to call tokenNames');
      }
      return name;
    } catch (error) {
      console.error(`Failed to get name for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token URI (metadata)
   * @param tokenId - Token ID
   * @returns Token URI
   */
  async getTokenURI(tokenId: number): Promise<string> {
    try {
      const uri = await this.contract['uri']?.(tokenId);
      if (!uri) {
        throw new Error('Failed to call uri');
      }
      return uri;
    } catch (error) {
      console.error(`Failed to get URI for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total supply of a token
   * @param tokenId - Token ID
   * @returns Total supply as string
   */
  async getTotalSupply(tokenId: number): Promise<string> {
    try {
      const supply = await this.contract['totalSupply']?.(tokenId);
      if (!supply) {
        throw new Error('Failed to call totalSupply');
      }
      return supply.toString();
    } catch (error) {
      console.error(`Failed to get total supply for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch total supply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a token exists
   * @param tokenId - Token ID
   * @returns True if token exists
   */
  async tokenExists(tokenId: number): Promise<boolean> {
    try {
      const exists = await this.contract['exists']?.(tokenId);
      if (exists === undefined) {
        throw new Error('Failed to call exists');
      }
      return exists;
    } catch (error) {
      console.error(`Failed to check existence for token ${tokenId}:`, error);
      throw new Error(`Failed to check token existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive token information
   * @param tokenId - Token ID
   * @returns Token information object
   */
  async getTokenInfo(tokenId: number): Promise<{
    tokenId: number;
    contractAddress: string;
    name: string;
    uri: string;
    priceWei: string;
    priceEth: string;
    totalSupply: string;
    exists: boolean;
  }> {
    try {
      const [name, uri, priceWei, totalSupply, exists] = await Promise.all([
        this.getTokenName(tokenId).catch(() => ''),
        this.getTokenURI(tokenId).catch(() => ''),
        this.getTokenPrice(tokenId).catch(() => '0'),
        this.getTotalSupply(tokenId).catch(() => '0'),
        this.tokenExists(tokenId).catch(() => false)
      ]);

      return {
        tokenId,
        contractAddress: this.getContractAddress(),
        name,
        uri,
        priceWei,
        priceEth: ethers.formatEther(priceWei),
        totalSupply,
        exists
      };
    } catch (error) {
      console.error(`Failed to get token info for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new token type
   * @param id - Token ID
   * @param name - Token name
   * @param price - Token price in wei (0 for free minting)
   * @returns Transaction response
   */
  async createTokenType(id: number, name: string, price: bigint = BigInt(0)): Promise<any> {
    try {
      console.log(`🪙 Creating token type ID ${id} with name "${name}" and price ${ethers.formatEther(price)} ETH...`);
      
      // Get private key from environment
      const privateKey = process.env['MINTER_PRIVATE_KEY'];
      if (!privateKey) {
        throw new Error('MINTER_PRIVATE_KEY not found in environment variables');
      }

      // Create wallet with signer
      const provider = blockchainConnection.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Create contract instance with signer
      const contractAddress = blockchainConnection.getERC1155Address();
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function createTokenType(uint256 id, string memory name, uint256 price) external'
        ],
        wallet
      );
      
      // Create the token type with price
      const tx = await contract['createTokenType']?.(id, name, price);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Token type created! Block: ${receipt.blockNumber}`);
      
      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        priceWei: price.toString(),
        priceEth: ethers.formatEther(price),
        transaction: tx,
        receipt: receipt
      };
    } catch (error) {
      console.error(`Failed to create token type ${id}:`, error);
      throw new Error(`Token type creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mint a new token
   * @param to - Recipient address
   * @param id - Token ID
   * @param amount - Amount to mint
   * @param data - Additional data (can contain ingredientData._id)
   * @returns Transaction response
   */
  async mint(to: string, id: number, amount: number, data: Uint8Array): Promise<any> {
    try {
      console.log(`🪙 Minting token ID ${id} to ${to} with amount ${amount}...`);
      
      // Get private key from environment
      const privateKey = process.env['MINTER_PRIVATE_KEY'];
      console.log({privateKey});
      if (!privateKey) {
        throw new Error('MINTER_PRIVATE_KEY not found in environment variables');
      }

      // Create wallet with signer
      const provider = blockchainConnection.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Create contract instance with signer
      const contractAddress = blockchainConnection.getERC1155Address();
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function mint(address to, uint256 id, uint256 amount, bytes data) returns (bool)'
        ],
        wallet
      );
      
      // Mint the token
      const tx = await contract['mint']?.(to, id, amount, data);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Token minted! Block: ${receipt.blockNumber}`);
      
      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        transaction: tx,
        receipt: receipt
      };
    } catch (error) {
      console.error(`Failed to mint token ${id}:`, error);
      throw new Error(`Minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listen for TokenCreated events
   * @param callback - Callback function to handle events
   */
  onTokenCreated(callback: (id: bigint, name: string, event: any) => void): void {
    this.contract.on('TokenCreated', callback);
  }

  /**
   * Listen for TransferSingle events (mints, transfers, burns)
   * @param callback - Callback function to handle events
   */
  onTransferSingle(callback: (operator: string, from: string, to: string, id: bigint, value: bigint, event: any) => void): void {
    this.contract.on('TransferSingle', callback);
  }

  /**
   * Listen for TransferBatch events
   * @param callback - Callback function to handle events
   */
  onTransferBatch(callback: (operator: string, from: string, to: string, ids: bigint[], values: bigint[], event: any) => void): void {
    this.contract.on('TransferBatch', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return blockchainConnection.getERC1155Address();
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return blockchainConnection.getProvider();
  }
}

export default IngredientBlockchainService;

