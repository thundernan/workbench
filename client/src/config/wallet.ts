// Network configuration type
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Network configurations - Only Status Network
export const NETWORKS: Record<string, NetworkConfig> = {
  // Primary network - Status Network Sepolia
  status: {
    chainId: 1660990954,
    name: 'Status Sepolia',
    rpcUrl: 'https://public.sepolia.rpc.status.network',
    blockExplorer: 'https://sepolia.explorer.status.network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

// Primary network - Status Network (default)
export const PRIMARY_NETWORK = NETWORKS.status;
export const DEFAULT_CHAIN_ID = PRIMARY_NETWORK.chainId;

// Contract addresses
export const CONTRACTS = {
  workbench: '0xBba2E288c8d0Ba3b36FC7e0e5B7C32B6b9A1dC74',
  marketplace: '0x34EC6dA5045CcA928Cb59DAae5C60bE5b6F44E50'
};

// WalletConnect Configuration
// Get your project ID from https://cloud.walletconnect.com/
export const WALLETCONNECT_CONFIG = {
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your actual project ID
  chains: [DEFAULT_CHAIN_ID], // Use primary network
  metadata: {
    name: 'Workbench Game',
    description: 'A blockchain-based crafting game',
    url: 'https://workbench-game.com',
    icons: ['https://workbench-game.com/icon.png']
  }
};

// Helper functions

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

/**
 * Get network name by chain ID
 */
export function getNetworkName(chainId: number | null): string {
  if (!chainId) return 'Unknown Network';
  const network = getNetworkByChainId(chainId);
  return network?.name || `Chain ${chainId}`;
}

/**
 * Get block explorer URL by chain ID
 */
export function getBlockExplorerUrl(chainId: number | null): string | null {
  if (!chainId) return null;
  const network = getNetworkByChainId(chainId);
  return network?.blockExplorer || null;
}

/**
 * Get transaction URL for a given chain ID and transaction hash
 */
export function getTransactionUrl(chainId: number | null, txHash: string): string | null {
  const explorer = getBlockExplorerUrl(chainId);
  if (!explorer) return null;
  return `${explorer}/tx/${txHash}`;
}

/**
 * Get address URL for a given chain ID and address
 */
export function getAddressUrl(chainId: number | null, address: string): string | null {
  const explorer = getBlockExplorerUrl(chainId);
  if (!explorer) return null;
  return `${explorer}/address/${address}`;
}

/**
 * Convert network config to wallet_addEthereumChain format
 */
export function networkToWalletConfig(network: NetworkConfig): any {
  return {
    chainId: `0x${network.chainId.toString(16)}`,
    chainName: network.name,
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [network.blockExplorer],
    nativeCurrency: network.nativeCurrency
  };
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(NETWORKS).map(network => network.chainId);
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}
