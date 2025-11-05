// WalletConnect Configuration
// Get your project ID from https://cloud.walletconnect.com/
export const WALLETCONNECT_CONFIG = {
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your actual project ID
  chains: [1], // Ethereum mainnet
  metadata: {
    name: 'Workbench Game',
    description: 'A blockchain-based crafting game',
    url: 'https://workbench-game.com',
    icons: ['https://workbench-game.com/icon.png']
  }
};

// Network configurations
export const NETWORKS = {
  ethereum: {
    chainId: 1660990954,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://public.sepolia.rpc.status.network',
    blockExplorer: 'https://sepoliascan.status.network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  // Add more networks as needed
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

// Contract addresses (replace with your actual contract addresses)
export const CONTRACTS = {
  workbench: '0xBba2E288c8d0Ba3b36FC7e0e5B7C32B6b9A1dC74', // Replace with your contract address
  marketplace: '0x34EC6dA5045CcA928Cb59DAae5C60bE5b6F44E50' // Replace with your marketplace contract
};
