import { ethers } from 'ethers';
import type { MarketplaceListing, MarketplaceListingType } from '@/types';

const MARKETPLACE_ABI = [
  'event ItemListedForETH(uint256 indexed listingId,address indexed seller,address tokenContract,uint256 tokenId,uint256 amount,uint256 price)',
  'event ItemListedForSwap(uint256 indexed listingId,address indexed seller,address tokenContract,uint256 tokenId,uint256 amount,address swapTokenContract,uint256 swapTokenId,uint256 swapAmount)',
  'event ItemPurchased(uint256 indexed listingId,address indexed buyer,address indexed seller,uint256 amount,uint256 price)',
  'event ItemSwapped(uint256 indexed listingId,address indexed buyer,address indexed seller,uint256 amount)',
  'event ListingCancelled(uint256 indexed listingId,address indexed seller)',
  'function listingIdCounter() view returns (uint256)',
  'function listings(uint256 listingId) view returns (address seller,address tokenContract,uint256 tokenId,uint256 amount,uint8 listingType,uint256 priceInWei,address swapTokenContract,uint256 swapTokenId,uint256 swapAmount,bool active)',
  'function listItemForETH(address tokenContract,uint256 tokenId,uint256 amount,uint256 priceInWei) returns (uint256)',
  'function listItemForSwap(address tokenContract,uint256 tokenId,uint256 amount,address swapTokenContract,uint256 swapTokenId,uint256 swapAmount) returns (uint256)',
  'function buyItemWithETH(uint256 listingId)',
  'function swapItem(uint256 listingId)',
  'function cancelListing(uint256 listingId)',
  'function platformFeeBps() view returns (uint256)'
];

const ERC1155_ABI = [
  'function isApprovedForAll(address account,address operator) view returns (bool)',
  'function setApprovalForAll(address operator,bool approved)'
];

const DEFAULT_RPC_URL = import.meta.env.VITE_PUBLIC_RPC_URL || 'https://public.sepolia.rpc.status.network';

export const getMarketplaceContractAddress = (): string =>
  import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

const LISTING_TYPE_MAP: Record<number, MarketplaceListingType> = {
  0: 'ETH_SALE',
  1: 'ITEM_SWAP'
};

export interface ListSwapParams {
  tokenContract: string;
  tokenId: number;
  amount: number;
  swapTokenContract: string;
  swapTokenId: number;
  swapAmount: number;
}

export interface ListEthParams {
  tokenContract: string;
  tokenId: number;
  amount: number;
  priceInWei: bigint;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export class MarketplaceContractService {
  private contractAddress: string;
  private readProvider: ethers.JsonRpcProvider | null = null;

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress ?? getMarketplaceContractAddress();
  }

  private getReadProvider(): ethers.JsonRpcProvider {
    if (!this.readProvider) {
      this.readProvider = new ethers.JsonRpcProvider(DEFAULT_RPC_URL);
    }
    return this.readProvider;
  }

  private getContract(runner: ethers.ContractRunner): ethers.Contract {
    return new ethers.Contract(this.contractAddress, MARKETPLACE_ABI, runner);
  }

  private async ensureContractDeployed(provider: ethers.Provider): Promise<void> {
    if (!this.contractAddress || this.contractAddress.toLowerCase() === ZERO_ADDRESS) {
      throw new Error('Marketplace contract address is not configured. Set VITE_MARKETPLACE_CONTRACT_ADDRESS.');
    }

    const code = await provider.getCode(this.contractAddress);
    if (!code || code === '0x') {
      throw new Error(`Marketplace contract not found at ${this.contractAddress}. Verify deployment and configuration.`);
    }
  }

  private async ensureApproval(
    tokenContract: string,
    owner: string,
    operator: string,
    signer: ethers.Signer
  ): Promise<{ isNewApproval: boolean }> {
    try {
      const erc1155 = new ethers.Contract(tokenContract, ERC1155_ABI, signer);
      const approved = await erc1155.isApprovedForAll(owner, operator);
      
      if (!approved) {
        const approvalTx = await erc1155.setApprovalForAll(operator, true);
        await approvalTx.wait();
        return { isNewApproval: true };
      }
      
      return { isNewApproval: false };
    } catch (error: any) {
      console.error('Approval error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      throw new Error(`Failed to approve marketplace access to your tokens. Please try again.`);
    }
  }

  private mapListing(listingId: number, raw: any): MarketplaceListing {
    const listingTypeCode = Number(raw.listingType ?? 0);
    return {
      listingId,
      seller: raw.seller,
      tokenContract: raw.tokenContract,
      tokenId: Number(raw.tokenId),
      amount: Number(raw.amount),
      listingType: LISTING_TYPE_MAP[listingTypeCode] ?? 'ETH_SALE',
      priceInWei: BigInt(raw.priceInWei?.toString?.() ?? raw.priceInWei ?? 0n),
      swapTokenContract: raw.swapTokenContract && raw.swapTokenContract !== ethers.ZeroAddress ? raw.swapTokenContract : null,
      swapTokenId: raw.swapTokenId ? Number(raw.swapTokenId) : null,
      swapAmount: raw.swapAmount ? Number(raw.swapAmount) : null,
      active: Boolean(raw.active),
      createdAt: undefined
    };
  }

  private async attachListingTimestamp(
    provider: ethers.Provider,
    contract: ethers.Contract,
    listing: MarketplaceListing
  ): Promise<MarketplaceListing> {
    try {
      const listingIdBig = BigInt(listing.listingId);
      let eventLogs: ethers.Log[] = [];

      if (listing.listingType === 'ITEM_SWAP') {
        const filter = contract.filters.ItemListedForSwap(listingIdBig);
        eventLogs = await contract.queryFilter(filter);
      } else {
        const filter = contract.filters.ItemListedForETH(listingIdBig);
        eventLogs = await contract.queryFilter(filter);
      }

      if (eventLogs.length > 0) {
        const latestLog = eventLogs[eventLogs.length - 1];
        const block = await provider.getBlock(latestLog.blockNumber);
        return {
          ...listing,
          createdAt: block?.timestamp ? block.timestamp * 1000 : Date.now()
        };
      }
    } catch (error) {
      // Silent fail
    }

    return {
      ...listing,
      createdAt: Date.now()
    };
  }

  async getActiveListings(provider?: ethers.Provider): Promise<MarketplaceListing[]> {
    const readProvider = provider ?? this.getReadProvider();
    const contract = this.getContract(readProvider);

    await this.ensureContractDeployed(readProvider);

    const listingCountRaw = await contract.listingIdCounter();
    const totalListings = Number(listingCountRaw);

    const listings: MarketplaceListing[] = [];

    for (let listingId = 0; listingId < totalListings; listingId++) {
      const rawListing = await contract.listings(listingId);
      const parsed = this.mapListing(listingId, rawListing);
      if (parsed.active) {
        listings.push(parsed);
      }
    }

    return Promise.all(
      listings.map(listing => this.attachListingTimestamp(readProvider, contract, listing))
    );
  }

  async listItemForSwap(
    params: ListSwapParams,
    signer: ethers.Signer
  ): Promise<{ listingId: number | null; transaction: ethers.ContractTransactionResponse; receipt: ethers.TransactionReceipt; wasApprovalNeeded: boolean }> {
    try {
      const ownerAddress = await signer.getAddress();
      const provider = signer.provider ?? this.getReadProvider();

      await this.ensureContractDeployed(provider);
      const approvalResult = await this.ensureApproval(params.tokenContract, ownerAddress, this.contractAddress, signer);

      const contract = this.getContract(signer);
      const tx = await contract.listItemForSwap(
        params.tokenContract,
        BigInt(params.tokenId),
        BigInt(params.amount),
        params.swapTokenContract,
        BigInt(params.swapTokenId),
        BigInt(params.swapAmount)
      );

      const receipt = await tx.wait();
      let listingId: number | null = null;

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'ItemListedForSwap') {
            listingId = Number(parsed.args?.listingId);
            break;
          }
        } catch {
          // Ignore logs from other contracts
        }
      }

      return {
        listingId,
        transaction: tx,
        receipt,
        wasApprovalNeeded: approvalResult.isNewApproval
      };
    } catch (error: any) {
      console.error('listItemForSwap error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      throw new Error(error.message || 'Failed to create swap offer. Please ensure you own the items and try again.');
    }
  }

  async listItemForETH(
    params: ListEthParams,
    signer: ethers.Signer
  ): Promise<{ listingId: number | null; transaction: ethers.ContractTransactionResponse; receipt: ethers.TransactionReceipt; wasApprovalNeeded: boolean }> {
    try {
      const ownerAddress = await signer.getAddress();
      const provider = signer.provider ?? this.getReadProvider();

      await this.ensureContractDeployed(provider);
      const approvalResult = await this.ensureApproval(params.tokenContract, ownerAddress, this.contractAddress, signer);

      const contract = this.getContract(signer);
      const tx = await contract.listItemForETH(
        params.tokenContract,
        BigInt(params.tokenId),
        BigInt(params.amount),
        params.priceInWei
      );

      const receipt = await tx.wait();
      let listingId: number | null = null;

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'ItemListedForETH') {
            listingId = Number(parsed.args?.listingId);
            break;
          }
        } catch {
          // ignore
        }
      }

      return {
        listingId,
        transaction: tx,
        receipt,
        wasApprovalNeeded: approvalResult.isNewApproval
      };
    } catch (error: any) {
      console.error('listItemForETH error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      throw new Error(error.message || 'Failed to create ETH listing. Please ensure you own the items and try again.');
    }
  }

  async swapItem(
    listing: MarketplaceListing,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    try {
      const provider = signer.provider ?? this.getReadProvider();
      await this.ensureContractDeployed(provider);

      if (listing.listingType !== 'ITEM_SWAP') {
        throw new Error('This listing is not available for swapping');
      }

      if (!listing.swapTokenContract || listing.swapTokenId === null || listing.swapAmount === null) {
        throw new Error('Swap listing is missing required information');
      }

      const buyerAddress = await signer.getAddress();
      await this.ensureApproval(
        listing.swapTokenContract,
        buyerAddress,
        this.contractAddress,
        signer
      );

      const contract = this.getContract(signer);
      const tx = await contract.swapItem(BigInt(listing.listingId));
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Swap completed but receipt not received');
      }

      return receipt;
    } catch (error: any) {
      console.error('swapItem error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      if (error.message?.includes('Listing is not active')) {
        throw new Error('This offer is no longer available');
      }
      throw new Error(error.message || 'Failed to complete swap. Please ensure you have the required items and try again.');
    }
  }

  async buyItemWithETH(
    listing: MarketplaceListing,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    try {
      const provider = signer.provider ?? this.getReadProvider();
      await this.ensureContractDeployed(provider);

      if (listing.listingType !== 'ETH_SALE') {
        throw new Error('This listing is not available for ETH purchase');
      }

      const contract = this.getContract(signer);
      const tx = await contract.buyItemWithETH(BigInt(listing.listingId), {
        value: listing.priceInWei
      });

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Purchase completed but receipt not received');
      }

      return receipt;
    } catch (error: any) {
      console.error('buyItemWithETH error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient ETH to complete purchase (including gas fees)');
      }
      if (error.message?.includes('Listing is not active')) {
        throw new Error('This listing is no longer available');
      }
      throw new Error(error.message || 'Failed to complete purchase. Please check your ETH balance and try again.');
    }
  }

  async cancelListing(
    listingId: number,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    try {
      const provider = signer.provider ?? this.getReadProvider();
      await this.ensureContractDeployed(provider);

      const contract = this.getContract(signer);
      const tx = await contract.cancelListing(BigInt(listingId));
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Cancellation completed but receipt not received');
      }

      return receipt;
    } catch (error: any) {
      console.error('cancelListing error:', error);
      if (error.message?.includes('user rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      if (error.message?.includes('Not the seller')) {
        throw new Error('You are not the owner of this listing');
      }
      throw new Error(error.message || 'Failed to cancel listing. Please try again.');
    }
  }
}

export const marketplaceContractService = new MarketplaceContractService();

export default marketplaceContractService;

