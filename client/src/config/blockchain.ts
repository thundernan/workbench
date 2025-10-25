/**
 * Blockchain Configuration
 * Centralized configuration for blockchain integration
 */

// Import from wallet config for compatibility
import { CONTRACTS as WALLET_CONTRACTS, DEFAULT_NETWORK, NETWORKS } from './wallet';

// Contract addresses - use environment variables or defaults
export const CONTRACTS = {
  // ERC1155 Token Contract
  erc1155: import.meta.env.VITE_ERC1155_CONTRACT_ADDRESS || 
           WALLET_CONTRACTS.erc1155,
  
  // Workbench Crafting Contract
  workbench: import.meta.env.VITE_WORKBENCH_CONTRACT_ADDRESS || 
             WALLET_CONTRACTS.workbench || 
             '0x51E66B9bE9221B2eF0B30071fad1527A003F4449',
  
  // Marketplace Contract
  marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || 
               WALLET_CONTRACTS.marketplace || 
               '0xA58fc27804965c9b9b20Ec0fFD7d57eeD43E8a10'
};

// Network configuration
export const BLOCKCHAIN_CONFIG = {
  defaultNetwork: DEFAULT_NETWORK,
  networks: NETWORKS,
  
  // RPC URLs
  rpcUrl: import.meta.env.VITE_DEFAULT_NETWORK_RPC_URL || 
          DEFAULT_NETWORK.rpcUrl,
  
  // Block explorer
  blockExplorer: import.meta.env.VITE_DEFAULT_NETWORK_BLOCK_EXPLORER || 
                 DEFAULT_NETWORK.blockExplorer,
  
  // Chain ID
  chainId: import.meta.env.VITE_DEFAULT_NETWORK_CHAIN_ID ? 
           parseInt(import.meta.env.VITE_DEFAULT_NETWORK_CHAIN_ID) : 
           DEFAULT_NETWORK.chainId
};

// Helper functions
export function getContractAddress(contractName: keyof typeof CONTRACTS): string {
  return CONTRACTS[contractName];
}

export function getNetworkConfig() {
  return BLOCKCHAIN_CONFIG;
}

export function getExplorerUrl(txHash: string): string {
  return `${BLOCKCHAIN_CONFIG.blockExplorer}/tx/${txHash}`;
}

export function getAddressExplorerUrl(address: string): string {
  return `${BLOCKCHAIN_CONFIG.blockExplorer}/address/${address}`;
}

// Export for backward compatibility
export { DEFAULT_NETWORK, NETWORKS };

