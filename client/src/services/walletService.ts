import { ethers } from 'ethers';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import { NETWORKS, getNetworkByChainId, networkToWalletConfig, isSupportedChain } from '@/config/wallet';

export class Web3WalletService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  // Supported wallet providers
  private readonly walletProviders: WalletProvider[] = [
    {
      name: 'MetaMask',
      id: 'metamask',
      icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
      installed: false
    },
    {
      name: 'Trust Wallet',
      id: 'trust',
      icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
      installed: false
    },
    {
      name: 'Coinbase Wallet',
      id: 'coinbase',
      icon: 'https://images.ctfassets.net/9sy2a0egs6zh/4zJfzJbG3kTDSk5Wo4RJI1/3a7d1b5e5b5e5b5e5b5e5b5e5b5e5b5e/coinbase-wallet-logo.svg',
      installed: false
    }
  ];

  constructor() {
    this.checkWalletAvailability();
  }

  /**
   * Check which wallets are available
   */
  private checkWalletAvailability(): void {
    this.walletProviders.forEach(provider => {
      if (provider.id === 'metamask') {
        provider.installed = typeof window !== 'undefined' && !!window.ethereum && !window.ethereum.isTrust;
      } else if (provider.id === 'trust') {
        provider.installed = typeof window !== 'undefined' && !!window.ethereum?.isTrust;
      } else if (provider.id === 'coinbase') {
        provider.installed = typeof window !== 'undefined' && !!window.coinbaseWalletExtension;
      }
    });
  }

  /**
   * Get all wallet providers (both installed and not installed)
   */
  getAvailableProviders(): WalletProvider[] {
    // Return all providers, UI will show install status
    return this.walletProviders;
  }

  /**
   * Connect to MetaMask
   */
  async connectMetaMask(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create ethers provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Return checksummed address from signer
      return await this.signer.getAddress();
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error(`Failed to connect to MetaMask: ${error.message}`);
    }
  }

  /**
   * Connect to Trust Wallet
   */
  async connectTrust(): Promise<string> {
    if (!window.ethereum?.isTrust) {
      throw new Error('Trust Wallet is not installed. Please install Trust Wallet extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create ethers provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Return checksummed address from signer
      return await this.signer.getAddress();
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error(`Failed to connect to Trust Wallet: ${error.message}`);
    }
  }

  /**
   * Connect to Coinbase Wallet
   */
  async connectCoinbase(): Promise<string> {
    if (!window.coinbaseWalletExtension) {
      throw new Error('Coinbase Wallet is not installed');
    }

    try {
      const accounts = await window.coinbaseWalletExtension.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.provider = new ethers.BrowserProvider(window.coinbaseWalletExtension);
      this.signer = await this.provider.getSigner();

      // Return checksummed address from signer
      return await this.signer.getAddress();
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error(`Failed to connect to Coinbase Wallet: ${error.message}`);
    }
  }

  /**
   * Generic connect method
   */
  async connect(walletId: string): Promise<string> {
    switch (walletId) {
      case 'metamask':
        return this.connectMetaMask();
      case 'trust':
        return this.connectTrust();
      case 'coinbase':
        return this.connectCoinbase();
      default:
        throw new Error(`Unsupported wallet: ${walletId}`);
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      // Clear providers
      this.provider = null;
      this.signer = null;
    } catch (error) {
      console.warn('Error during disconnect:', error);
    }
  }

  /**
   * Get current account address
   */
  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get current chain ID
   */
  async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, try to add it
        await this.addNetwork(chainId);
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  }

  /**
   * Add a new network
   */
  private async addNetwork(chainId: number): Promise<void> {
    // Check if network is supported
    if (!isSupportedChain(chainId)) {
      throw new Error(`Unsupported network: ${chainId}. Please add it to the network configuration.`);
    }

    // Get network configuration
    const network = getNetworkByChainId(chainId);
    if (!network) {
      throw new Error(`Network configuration not found for chain ID: ${chainId}`);
    }

    // Convert to wallet format
    const walletConfig = networkToWalletConfig(network);

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [walletConfig]
    });
  }

  /**
   * Send a transaction
   */
  async sendTransaction(request: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: request.to,
        value: request.value ? ethers.parseEther(request.value) : undefined,
        data: request.data,
        gasLimit: request.gasLimit,
        gasPrice: request.gasPrice ? ethers.parseUnits(request.gasPrice, 'gwei') : undefined
      });

      return tx.hash;
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Send a crafting transaction
   */
  async sendCraftingTransaction(craftingTx: CraftingTransaction): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // This would interact with your smart contract
    // For now, we'll simulate the transaction
    try {
      // Simulate contract interaction
      const tx = await this.signer.sendTransaction({
        to: '0x0000000000000000000000000000000000000000', // Your contract address
        data: '0x', // Contract method call data
        value: 0
      });

      return tx.hash;
    } catch (error: any) {
      throw new Error(`Crafting transaction failed: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.Provider | null {
    return this.provider;
  }

  /**
   * Get signer instance
   */
  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.signer !== null;
  }
}

// Global window type extensions
declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
  }
}

export default Web3WalletService;