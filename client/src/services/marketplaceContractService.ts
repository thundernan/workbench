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
  ): Promise<void> {
    const erc1155 = new ethers.Contract(tokenContract, ERC1155_ABI, signer);
    const approved = await erc1155.isApprovedForAll(owner, operator);
    if (!approved) {
      const approvalTx = await erc1155.setApprovalForAll(operator, true);
      await approvalTx.wait();
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
      console.warn('Failed to attach timestamp for listing', listing.listingId, error);
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
  ): Promise<{ listingId: number | null; transaction: ethers.ContractTransactionResponse; receipt: ethers.TransactionReceipt }> {
    const ownerAddress = await signer.getAddress();
    const provider = signer.provider ?? this.getReadProvider();

    await this.ensureContractDeployed(provider);
    await this.ensureApproval(params.tokenContract, ownerAddress, this.contractAddress, signer);

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
      receipt
    };
  }

  async listItemForETH(
    params: ListEthParams,
    signer: ethers.Signer
  ): Promise<{ listingId: number | null; transaction: ethers.ContractTransactionResponse; receipt: ethers.TransactionReceipt }> {
    const ownerAddress = await signer.getAddress();
    const provider = signer.provider ?? this.getReadProvider();

    await this.ensureContractDeployed(provider);
    await this.ensureApproval(params.tokenContract, ownerAddress, this.contractAddress, signer);

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
      receipt
    };
  }

  async swapItem(
    listing: MarketplaceListing,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    const provider = signer.provider ?? this.getReadProvider();
    await this.ensureContractDeployed(provider);

    if (listing.listingType !== 'ITEM_SWAP') {
      throw new Error('Listing is not a swap listing');
    }

    if (!listing.swapTokenContract || listing.swapTokenId === null || listing.swapAmount === null) {
      throw new Error('Swap listing is missing required token information');
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
      throw new Error('Swap transaction confirmed but no receipt returned.');
    }

    return receipt;
  }

  async buyItemWithETH(
    listing: MarketplaceListing,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    const provider = signer.provider ?? this.getReadProvider();
    await this.ensureContractDeployed(provider);

    if (listing.listingType !== 'ETH_SALE') {
      throw new Error('Listing is not an ETH sale');
    }

    const contract = this.getContract(signer);
    const tx = await contract.buyItemWithETH(BigInt(listing.listingId), {
      value: listing.priceInWei
    });

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Purchase transaction confirmed but no receipt returned.');
    }

    return receipt;
  }

  async cancelListing(
    listingId: number,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt> {
    const provider = signer.provider ?? this.getReadProvider();
    await this.ensureContractDeployed(provider);

    const contract = this.getContract(signer);
    const tx = await contract.cancelListing(BigInt(listingId));
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Cancel listing transaction confirmed but no receipt returned.');
    }

    return receipt;
  }
}

export const marketplaceContractService = new MarketplaceContractService();

export default marketplaceContractService;

