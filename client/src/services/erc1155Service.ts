import { ethers, Contract } from 'ethers';
import { CONTRACTS } from '@/config/wallet';
import ERC1155_ABI from '@/abis/GameItemsERC1155.json';

export class ERC1155Service {
  private contract: Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider || null;
    this.signer = signer || null;
    this.initializeContract();
  }

  private initializeContract() {
    if (this.signer) {
      this.contract = new Contract(CONTRACTS.erc1155, ERC1155_ABI, this.signer);
    } else if (this.provider) {
      this.contract = new Contract(CONTRACTS.erc1155, ERC1155_ABI, this.provider);
    }
  }

  updateProvider(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
    this.initializeContract();
  }

  /**
   * Get token price in ETH
   */
  async getTokenPrice(tokenId: number): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const price = await this.contract.tokenPrices(tokenId);
    return ethers.formatEther(price);
  }

  /**
   * Get user's token balance
   */
  async getBalance(address: string, tokenId: number): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const balance = await this.contract.balanceOf(address, tokenId);
    return Number(balance);
  }

  /**
   * Get multiple token balances
   */
  async getBatchBalance(address: string, tokenIds: number[]): Promise<number[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const balances = await this.contract.balanceOfBatch(
      new Array(tokenIds.length).fill(address),
      tokenIds
    );
    return balances.map(b => Number(b));
  }

  /**
   * Mint tokens with ETH payment
   */
  async publicMint(tokenId: number, amount: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const price = await this.contract.tokenPrices(tokenId);
    const totalPrice = price * BigInt(amount);
    
    const tx = await this.contract.publicMint(tokenId, amount, { value: totalPrice });
    return tx;
  }

  /**
   * Mint multiple tokens at once
   */
  async publicMintBatch(tokenIds: number[], amounts: number[]): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    // Calculate total price
    let totalPrice = BigInt(0);
    for (let i = 0; i < tokenIds.length; i++) {
      const price = await this.contract.tokenPrices(tokenIds[i]);
      totalPrice += price * BigInt(amounts[i]);
    }
    
    const tx = await this.contract.publicMintBatch(tokenIds, amounts, { value: totalPrice });
    return tx;
  }

  /**
   * Get user's total spent amount
   */
  async getTotalSpent(address: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const totalSpent = await this.contract.totalSpentByAddress(address);
    return ethers.formatEther(totalSpent);
  }

  /**
   * Check if user has received reward
   */
  async hasReceivedReward(address: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.hasReceivedReward(address);
  }

  /**
   * Check if user is eligible for reward
   */
  async isEligibleForReward(address: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.isEligibleForReward(address);
  }

  /**
   * Get reward threshold
   */
  async getRewardThreshold(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const threshold = await this.contract.rewardThreshold();
    return ethers.formatEther(threshold);
  }

  /**
   * Get reward token ID
   */
  async getRewardTokenId(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tokenId = await this.contract.rewardTokenId();
    return Number(tokenId);
  }

  /**
   * Get complete reward status for user
   */
  async getRewardStatus(address: string): Promise<{
    totalSpent: string;
    threshold: string;
    received: boolean;
    eligible: boolean;
    rewardTokenId: number;
    progress: number;
  }> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const [totalSpent, threshold, received, eligible, rewardTokenId] = await Promise.all([
      this.getTotalSpent(address),
      this.getRewardThreshold(),
      this.hasReceivedReward(address),
      this.isEligibleForReward(address),
      this.getRewardTokenId()
    ]);
    
    const progress = parseFloat(threshold) > 0 
      ? (parseFloat(totalSpent) / parseFloat(threshold)) * 100 
      : 0;
    
    return {
      totalSpent,
      threshold,
      received,
      eligible,
      rewardTokenId,
      progress
    };
  }

  /**
   * Check if user has approved contract for all tokens
   */
  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.isApprovedForAll(owner, operator);
  }

  /**
   * Approve contract for all tokens
   */
  async setApprovalForAll(operator: string, approved: boolean): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.setApprovalForAll(operator, approved);
    return tx;
  }

  /**
   * Listen for TransferSingle events (mints)
   */
  onTransferSingle(callback: (operator: string, from: string, to: string, id: bigint, value: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    this.contract.on('TransferSingle', callback);
  }

  /**
   * Listen for RewardGiven events
   */
  onRewardGiven(callback: (recipient: string, tokenId: bigint, totalSpent: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    this.contract.on('RewardGiven', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

export default ERC1155Service;
