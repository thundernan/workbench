// WalletConnect Configuration
// Get your project ID from https://cloud.walletconnect.com/
export const WALLETCONNECT_CONFIG = {
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your actual project ID
  chains: [324], // zkSync Era mainnet
  metadata: {
    name: 'Workbench Game',
    description: 'A blockchain-based crafting game on zkSync Era',
    url: 'https://workbench-game.com',
    icons: ['https://workbench-game.com/icon.png']
  }
};

// Network configurations for zkSync Era
export const NETWORKS = {
  zkSyncEra: {
    chainId: 324,
    name: 'zkSync Era Mainnet',
    rpcUrl: 'https://mainnet.era.zksync.io',
    blockExplorer: 'https://explorer.zksync.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  zkSyncEraTestnet: {
    chainId: 280,
    name: 'zkSync Era Testnet',
    rpcUrl: 'https://testnet.era.zksync.dev',
    blockExplorer: 'https://goerli.explorer.zksync.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  xsollaZK: {
    chainId: 555776,
    name: 'Xsolla ZK Sepolia Testnet',
    rpcUrl: 'https://zkrpc-sepolia.xsollazk.com',
    blockExplorer: 'https://explorer-sepolia.xsollazk.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

// Contract addresses from environment variables
export const CONTRACTS = {
  // GameItemsERC1155 contract
  erc1155: import.meta.env.VITE_ERC1155_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  // Workbench contract
  workbench: import.meta.env.VITE_WORKBENCH_CONTRACT_ADDRESS || '0x51E66B9bE9221B2eF0B30071fad1527A003F4449',
  // Marketplace contract  
  marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0xA58fc27804965c9b9b20Ec0fFD7d57eeD43E8a10'
};

// Default network to use
export const DEFAULT_NETWORK = NETWORKS.xsollaZK;
