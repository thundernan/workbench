/**
 * Web3 Wallet Service - Status Network Only
 * 
 * This service handles wallet connections and only supports Status Network.
 * It automatically attempts to switch users to Status Network when they connect.
 */
import { ethers } from 'ethers';
import type { WalletProvider, TransactionRequest, CraftingTransaction } from '@/types';
import { getNetworkByChainId, networkToWalletConfig, isSupportedChain, DEFAULT_CHAIN_ID } from '@/config/wallet';

export class Web3WalletService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  // Known wallet providers with icons and metadata
  private readonly knownWalletProviders: WalletProvider[] = [
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

  // Dynamic list of detected wallets
  private detectedWallets: WalletProvider[] = [];

  constructor() {
    this.detectWallets();
  }

  /**
   * Detect all available wallets
   */
  private detectWallets(): void {
    this.detectedWallets = [];
    
    if (typeof window === 'undefined') {
      return;
    }

    // Check known wallets first
    this.knownWalletProviders.forEach(provider => {
      let installed = false;
      
      if (provider.id === 'metamask') {
        installed = !!window.ethereum && !window.ethereum.isTrust && !(window.ethereum as any).isCoinbaseWallet;
      } else if (provider.id === 'trust') {
        installed = !!window.ethereum?.isTrust;
      } else if (provider.id === 'coinbase') {
        installed = !!window.coinbaseWalletExtension || !!(window.ethereum as any)?.isCoinbaseWallet;
      }
      
      if (installed) {
        this.detectedWallets.push({ ...provider, installed: true });
      }
    });

    // Check for any other Ethereum provider (generic wallet)
    if (window.ethereum) {
      // Check if it's not already in our known wallets
      const ethereum = window.ethereum as any;
      const isKnownWallet = 
        ethereum.isMetaMask || 
        ethereum.isTrust || 
        ethereum.isCoinbaseWallet ||
        window.coinbaseWalletExtension;
      
      if (!isKnownWallet) {
        // Generic wallet detected - try to get wallet name
        let walletName = 'Ethereum Wallet';
        let walletId = 'generic';
        
        // Try to detect wallet name from provider
        if (ethereum.providerMap) {
          // Some wallets expose providerMap
          const providers = Object.keys(ethereum.providerMap);
          if (providers.length > 0) {
            walletName = providers[0].charAt(0).toUpperCase() + providers[0].slice(1);
            walletId = providers[0].toLowerCase();
          }
        }
        
        // Check if wallet has a name property
        if (ethereum.walletName) {
          walletName = ethereum.walletName;
          walletId = walletName.toLowerCase().replace(/\s+/g, '-');
        }
        
        this.detectedWallets.push({
          name: walletName,
          id: walletId,
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2Mjc0RUUiLz4KPHBhdGggZD0iTTE2IDhMMjAgMTJIMTZWOEgxNlYxMkgxNkwxNiA4WiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4K',
          installed: true
        });
      }
    }

    // Check for Coinbase Wallet as separate provider
    if (window.coinbaseWalletExtension && !this.detectedWallets.find(w => w.id === 'coinbase')) {
      const coinbaseProvider = this.knownWalletProviders.find(p => p.id === 'coinbase');
      if (coinbaseProvider) {
        this.detectedWallets.push({ ...coinbaseProvider, installed: true });
      }
    }
  }

  /**
   * Get all wallet providers (both installed and not installed)
   */
  getAvailableProviders(): WalletProvider[] {
    // Combine detected wallets with known wallets that aren't installed
    const allProviders: WalletProvider[] = [];
    const detectedIds = new Set(this.detectedWallets.map(w => w.id));
    
    // Add detected wallets first
    allProviders.push(...this.detectedWallets);
    
    // Add known wallets that aren't detected
    this.knownWalletProviders.forEach(provider => {
      if (!detectedIds.has(provider.id)) {
        allProviders.push({ ...provider, installed: false });
      }
    });
    
    return allProviders;
  }

  /**
   * Connect to MetaMask
   */
  async connectMetaMask(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }

    // Use the generic connect method
    return this.connectGeneric(window.ethereum);
  }

  /**
   * Connect to Trust Wallet
   */
  async connectTrust(): Promise<string> {
    if (!window.ethereum?.isTrust) {
      throw new Error('Trust Wallet is not installed. Please install Trust Wallet extension.');
    }

    try {
      // First, try to connect
      const address = await this.connectGeneric(window.ethereum);
      
      // After connection, try to ensure we're on Ethereum network (not Solana)
      // Trust Wallet might be on Solana by default
      try {
        // Try to switch to Status Network immediately after connection
        // This will work even if wallet is on Solana
        await this.switchNetwork(DEFAULT_CHAIN_ID);
      } catch (switchError: any) {
        // If switch fails, try to add the network
        if (switchError.message?.includes('4902') || switchError.code === 4902) {
          try {
            await this.addNetwork(DEFAULT_CHAIN_ID);
          } catch (addError) {
            // Don't throw - wallet is connected, just not on right network
          }
        } else {
          // Don't throw - wallet is connected, just not on right network
        }
      }
      
      return address;
    } catch (error: any) {
      // If connection fails due to Solana, try to switch network first
      if (error.message?.includes('Invalid RPC URL') || 
          error.message?.includes('solana') ||
          error.code === -32603) {
        // Try to switch network before retrying connection
        try {
          await this.switchNetwork(DEFAULT_CHAIN_ID);
          // Retry connection after switching
          return await this.connectGeneric(window.ethereum);
        } catch (switchError: any) {
          // If switch fails, try to add network
          if (switchError.message?.includes('4902') || switchError.code === 4902) {
            try {
              await this.addNetwork(DEFAULT_CHAIN_ID);
              // Retry connection after adding
              return await this.connectGeneric(window.ethereum);
            } catch (addError) {
              throw new Error(
                'Trust Wallet is configured for Solana network. ' +
                'Please manually switch to Ethereum network in Trust Wallet settings, then reconnect. ' +
                `Status Network Chain ID: ${DEFAULT_CHAIN_ID}`
              );
            }
          }
          throw switchError;
        }
      }
      throw error;
    }
  }

  /**
   * Connect to Coinbase Wallet
   */
  async connectCoinbase(): Promise<string> {
    // Prefer Coinbase Wallet extension, fallback to window.ethereum if it's Coinbase
    const ethereum = window.ethereum as any;
    const coinbaseProvider = window.coinbaseWalletExtension || 
                            (ethereum?.isCoinbaseWallet ? window.ethereum : null);
    
    if (!coinbaseProvider) {
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet extension.');
    }

    // Use the generic connect method
    return this.connectGeneric(coinbaseProvider);
  }

  /**
   * Connect to any generic Ethereum provider
   */
  async connectGeneric(provider: any): Promise<string> {
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Invalid wallet provider. The provider must support the Ethereum provider interface.');
    }

    try {
      // First, check if we can get chain ID to detect Solana
      try {
        const testChainId = await provider.request({ method: 'eth_chainId' });
        if (!testChainId || testChainId === 'null' || testChainId === 'undefined') {
          throw new Error('Provider does not support Ethereum JSON-RPC methods');
        }
      } catch (chainIdError: any) {
        // Check if it's a Solana RPC error
        if (chainIdError.message?.includes('Invalid RPC URL') || 
            chainIdError.message?.includes('solana') ||
            chainIdError.code === -32603) {
          // Continue with connection - we'll switch network after
        } else {
          throw new Error(`Provider validation failed: ${chainIdError.message}`);
        }
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create ethers provider and signer
      const browserProvider = new ethers.BrowserProvider(provider);
      this.provider = browserProvider;
      
      // Try to get signer - this might fail if on Solana
      try {
        this.signer = await browserProvider.getSigner();
      } catch (signerError: any) {
        // If signer fails due to Solana, we'll handle it in the wallet store
        throw signerError;
      }

      // Return checksummed address from signer
      return await this.signer.getAddress();
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error(`Failed to connect to wallet: ${error.message}`);
    }
  }

  /**
   * Generic connect method - supports any wallet
   */
  async connect(walletId: string): Promise<string> {
    // Handle known wallets
    switch (walletId) {
      case 'metamask':
        return this.connectMetaMask();
      case 'trust':
        return this.connectTrust();
      case 'coinbase':
        return this.connectCoinbase();
      case 'generic':
        // Generic wallet - use window.ethereum
        if (!window.ethereum) {
          throw new Error('No Ethereum wallet detected. Please install a Web3 wallet.');
        }
        return this.connectGeneric(window.ethereum);
      default:
        // Try to find the wallet provider
        if (window.ethereum) {
          const ethereum = window.ethereum as any;
          // Check if it's a known wallet we haven't explicitly handled
          if (walletId === 'metamask' || (ethereum.isMetaMask && !ethereum.isTrust && !ethereum.isCoinbaseWallet)) {
            return this.connectMetaMask();
          }
          if (walletId === 'trust' || ethereum.isTrust) {
            return this.connectTrust();
          }
          if (walletId === 'coinbase' || ethereum.isCoinbaseWallet) {
            return this.connectCoinbase();
          }
          
          // Generic provider - use window.ethereum
          return this.connectGeneric(window.ethereum);
        }
        
        // Check for Coinbase Wallet extension
        if (walletId === 'coinbase' && window.coinbaseWalletExtension) {
          return this.connectCoinbase();
        }
        
        // Last resort: try window.ethereum if it exists
        if (window.ethereum) {
          return this.connectGeneric(window.ethereum);
        }
        
        throw new Error(`Wallet "${walletId}" not found. Please make sure the wallet is installed and try again.`);
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
      // Silent fail
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
      // Try to switch network - this should work even if wallet is on Solana
      // It will prompt user to switch to Ethereum network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      // Error code 4902 means chain not added to wallet
      if (error.code === 4902 || error.message?.includes('not added')) {
        // Chain not added, try to add it
        await this.addNetwork(chainId);
        // After adding, try switching again
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        });
      } else if (error.code === 4001) {
        // User rejected the request
        throw new Error('User rejected the network switch request');
      } else {
        // Check if it's a Solana-related error
        if (error.message?.includes('Invalid RPC URL') || 
            error.message?.includes('solana') ||
            error.code === -32603) {
          // If wallet is on Solana, try to add network instead
          try {
            await this.addNetwork(chainId);
          } catch (addError: any) {
            throw new Error(
              `Failed to switch from Solana to Ethereum. ` +
              `Please manually switch to Ethereum network in your wallet settings, then add Status Network. ` +
              `Chain ID: ${chainId}`
            );
          }
        } else {
          throw new Error(`Failed to switch network: ${error.message || error.code}`);
        }
      }
    }
  }
  
  async switchNetworkSafe(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }
    return this.switchNetwork(chainId);
  }

  /**
   * Add a new network (public method for wallet store)
   */
  async addNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }
    
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
  async sendCraftingTransaction(_craftingTx: CraftingTransaction): Promise<string> {
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

  /**
   * Re-detect wallets (useful when wallets are installed after page load)
   */
  refreshWalletDetection(): void {
    this.detectWallets();
  }
}

// Window types are declared elsewhere, so we don't redeclare here
// Using 'any' type casting where needed for flexibility with different wallet providers

export default Web3WalletService;