import { ethers, Contract } from 'ethers';
import { CONTRACTS } from '@/config/wallet';
import MARKETPLACE_ABI from '@/abis/Marketplace.json';

export interface Listing {
  id: number;
  seller: string;
  tokenContract: string;
  tokenId: string;
  amount: string;
  listingType: 'ETH_SALE' | 'ITEM_SWAP';
  priceWei: string;
  priceEth: string;
  swapTokenContract?: string;
  swapTokenId?: string;
  swapAmount?: string;
  active: boolean;
}

export class MarketplaceService {
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
      this.contract = new Contract(CONTRACTS.marketplace, MARKETPLACE_ABI, this.signer);
    } else if (this.provider) {
      this.contract = new Contract(CONTRACTS.marketplace, MARKETPLACE_ABI, this.provider);
    }
  }

  updateProvider(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
    this.initializeContract();
  }

  /**
   * List item for ETH sale
   */
  async listItemForETH(
    tokenContract: string,
    tokenId: number,
    amount: number,
    priceInEth: string
  ): Promise<{ tx: ethers.ContractTransactionResponse; listingId?: string }> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const priceInWei = ethers.parseEther(priceInEth);
    const tx = await this.contract.listItemForETH(tokenContract, tokenId, amount, priceInWei);
    
    // Wait for transaction to get listing ID from event
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log: any) => {
        try {
          return this.contract!.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'ItemListedForETH');
    
    return {
      tx,
      listingId: event?.args?.listingId?.toString()
    };
  }

  /**
   * List item for item swap
   */
  async listItemForSwap(
    tokenContract: string,
    tokenId: number,
    amount: number,
    swapTokenContract: string,
    swapTokenId: number,
    swapAmount: number
  ): Promise<{ tx: ethers.ContractTransactionResponse; listingId?: string }> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.listItemForSwap(
      tokenContract,
      tokenId,
      amount,
      swapTokenContract,
      swapTokenId,
      swapAmount
    );
    
    return { tx };
  }

  /**
   * Buy item with ETH
   */
  async buyItemWithETH(listingId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const listing = await this.contract.getListing(listingId);
    
    if (!listing.active) {
      throw new Error('Listing is not active');
    }
    
    const tx = await this.contract.buyItemWithETH(listingId, {
      value: listing.priceInWei
    });
    
    return tx;
  }

  /**
   * Execute item swap
   */
  async swapItem(listingId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.swapItem(listingId);
    return tx;
  }

  /**
   * Cancel listing
   */
  async cancelListing(listingId: number): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.cancelListing(listingId);
    return tx;
  }

  /**
   * Get listing details
   */
  async getListing(listingId: number): Promise<Listing> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const listing = await this.contract.getListing(listingId);
    
    return {
      id: listingId,
      seller: listing.seller,
      tokenContract: listing.tokenContract,
      tokenId: listing.tokenId.toString(),
      amount: listing.amount.toString(),
      listingType: listing.listingType === 0 ? 'ETH_SALE' : 'ITEM_SWAP',
      priceWei: listing.priceInWei.toString(),
      priceEth: ethers.formatEther(listing.priceInWei),
      swapTokenContract: listing.swapTokenContract,
      swapTokenId: listing.swapTokenId.toString(),
      swapAmount: listing.swapAmount.toString(),
      active: listing.active
    };
  }

  /**
   * Get all active listings
   */
  async getActiveListings(): Promise<Listing[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const listingCount = await this.contract.listingIdCounter();
    const listings: Listing[] = [];
    
    for (let i = 0; i < listingCount; i++) {
      try {
        const listing = await this.getListing(i);
        if (listing.active) {
          listings.push(listing);
        }
      } catch (error) {
        // Skip invalid listings
        console.warn(`Failed to fetch listing ${i}:`, error);
      }
    }
    
    return listings;
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(sellerAddress: string): Promise<Listing[]> {
    const allListings = await this.getActiveListings();
    return allListings.filter(listing => 
      listing.seller.toLowerCase() === sellerAddress.toLowerCase()
    );
  }

  /**
   * Get listings by token
   */
  async getListingsByToken(tokenContract: string, tokenId: number): Promise<Listing[]> {
    const allListings = await this.getActiveListings();
    return allListings.filter(listing => 
      listing.tokenContract.toLowerCase() === tokenContract.toLowerCase() &&
      listing.tokenId === tokenId.toString()
    );
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFee(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const feeBps = await this.contract.platformFeeBps();
    return Number(feeBps) / 100; // Convert from basis points to percentage
  }

  /**
   * Calculate platform fee for a price
   */
  async calculatePlatformFee(priceInWei: bigint): Promise<bigint> {
    const feeBps = await this.contract!.platformFeeBps();
    return (priceInWei * feeBps) / 10000n;
  }

  /**
   * Listen for ItemListedForETH events
   */
  onItemListedForETH(callback: (
    listingId: bigint,
    seller: string,
    tokenContract: string,
    tokenId: bigint,
    amount: bigint,
    price: bigint
  ) => void) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    this.contract.on('ItemListedForETH', callback);
  }

  /**
   * Listen for ItemPurchased events
   */
  onItemPurchased(callback: (
    listingId: bigint,
    buyer: string,
    seller: string,
    amount: bigint,
    price: bigint
  ) => void) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    this.contract.on('ItemPurchased', callback);
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

export default MarketplaceService;
