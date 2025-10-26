/**
 * Deployed Contract Addresses
 * 
 * This file contains all deployed contract addresses for easy import in TypeScript/JavaScript
 * Supports multiple networks: zkxsolla, statusnetwork
 */

// Contract addresses per network
export const CONTRACTS_BY_NETWORK = {
  zkxsolla: {
    // New Factory Pattern (Recommended)
    WorkbenchFactory: '0xb4c27e256848cE6168339f44D2B5052EB32B6eF3',
    
    // Legacy Contracts (Still functional)
    Workbench: '0x3b5d7653dAf63b5Da3c1159D5e18b4B11443dD4c',
    
    // Core Contracts
    Marketplace: '0x34EC6dA5045CcA928Cb59DAae5C60bE5b6F44E50',
    GameItemsERC1155: '0x1a7CC24cE809d7Ebc1DC53ef50b1406B12a4871a',
  },
  statusnetwork: {
    // New Factory Pattern (Recommended)
    WorkbenchFactory: '',
    
    // Legacy Contracts (Still functional)
    Workbench: '',
    
    // Core Contracts
    Marketplace: '',
    GameItemsERC1155: '',
  },
} as const;

export const NETWORKS = {
  zkxsolla: {
    name: 'zkxsolla',
    chainId: 555776,
    rpcUrl: 'https://zkrpc-sepolia.xsollazk.com',
    explorer: 'https://explorer-sepolia.xsollazk.com',
    ethNetwork: 'sepolia',
    currency: 'ETH',
    type: 'zkSync Era L2',
  },
  statusnetwork: {
    name: 'statusnetwork',
    chainId: 1660990954,
    rpcUrl: 'https://public.sepolia.rpc.status.network',
    explorer: 'https://sepoliascan.status.network',
    ethNetwork: 'sepolia',
    currency: 'ETH',
    type: 'zkSync Era L2',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;

// Default network (can be changed based on environment)
export const DEFAULT_NETWORK: NetworkName = 'zkxsolla';

// Backwards compatibility - export default network contracts and info
export const CONTRACTS = CONTRACTS_BY_NETWORK[DEFAULT_NETWORK];
export const NETWORK = NETWORKS[DEFAULT_NETWORK];

export const DEPLOYER = '0x4E20D2f3a7B140405C81baC8B593b37221B6a847';

export const METADATA = {
  baseURI: 'https://workbench-1-rmt3.onrender.com/',
} as const;

// Helper to get explorer URL for an address
export function getExplorerUrl(address: string, network: NetworkName = DEFAULT_NETWORK): string {
  return `${NETWORKS[network].explorer}/address/${address}`;
}

// Helper to get explorer URL for a transaction
export function getTxExplorerUrl(txHash: string, network: NetworkName = DEFAULT_NETWORK): string {
  return `${NETWORKS[network].explorer}/tx/${txHash}`;
}

// Export all addresses as an array (useful for batch operations)
export function getAllContractAddresses(network: NetworkName = DEFAULT_NETWORK): string[] {
  return Object.values(CONTRACTS_BY_NETWORK[network]);
}

// Export contract names (useful for logging)
export const CONTRACT_NAMES = Object.keys(CONTRACTS) as Array<keyof typeof CONTRACTS>;

// Type-safe contract name type
export type ContractName = keyof typeof CONTRACTS;

// Get address by contract name (type-safe)
export function getContractAddress(name: ContractName, network: NetworkName = DEFAULT_NETWORK): string {
  return CONTRACTS_BY_NETWORK[network][name];
}

// Get contracts for a specific network
export function getNetworkContracts(network: NetworkName) {
  return CONTRACTS_BY_NETWORK[network];
}

// Get network info
export function getNetworkInfo(network: NetworkName) {
  return NETWORKS[network];
}

export default {
  CONTRACTS,
  CONTRACTS_BY_NETWORK,
  NETWORK,
  NETWORKS,
  DEPLOYER,
  METADATA,
  DEFAULT_NETWORK,
  getExplorerUrl,
  getTxExplorerUrl,
  getContractAddress,
  getAllContractAddresses,
  getNetworkContracts,
  getNetworkInfo,
};


