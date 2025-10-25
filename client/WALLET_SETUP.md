# Web3 Wallet Connection Setup Guide

## Overview
The Workbench client now includes comprehensive Web3 wallet connection functionality supporting multiple wallet providers.

## Supported Wallets
- **MetaMask** - Browser extension wallet
- **WalletConnect** - Mobile wallet connection via QR code
- **Coinbase Wallet** - Coinbase's browser extension
- **Trust Wallet** - Mobile wallet with browser extension

## Configuration Required

### 1. WalletConnect Project ID
To enable WalletConnect functionality, you need to:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Get your Project ID
4. Update the `walletService.ts` file with your Project ID:

```typescript
// In src/services/walletService.ts
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your actual Project ID
```

### 2. Environment Variables (Optional)
Create a `.env` file in the client directory:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_DEFAULT_CHAIN_ID=1
VITE_DEFAULT_NETWORK_NAME=Ethereum Mainnet
VITE_WORKBENCH_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

## Features Implemented

### 1. Multi-Wallet Support
- Automatic detection of installed wallets
- Wallet selection modal with provider icons
- Support for both browser extensions and mobile wallets

### 2. Network Management
- Automatic network detection
- Network switching functionality
- Support for multiple networks (Ethereum, Polygon, BSC, etc.)
- Visual network indicators

### 3. Transaction Handling
- Send transactions with proper gas estimation
- Crafting transaction support
- Transaction confirmation waiting
- Transaction receipt retrieval

### 4. Error Handling
- Comprehensive error messages
- User-friendly error display
- Graceful fallbacks for connection issues

### 5. State Management
- Persistent connection state
- Automatic reconnection on page load
- Loading states and error states
- Toast notifications for user feedback

## Usage

### Basic Connection
```typescript
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

// Connect to MetaMask
await walletStore.connectWallet('metamask');

// Connect to WalletConnect
await walletStore.connectWallet('walletconnect');

// Check available providers
const providers = walletStore.availableProviders;
```

### Sending Transactions
```typescript
// Send a regular transaction
const txHash = await walletStore.sendTransaction({
  to: '0x...',
  value: '0.1',
  data: '0x...'
});

// Send a crafting transaction
const craftTxHash = await walletStore.sendCraftTx({
  recipeId: '123',
  ingredients: [
    {
      tokenContract: '0x...',
      tokenId: 1,
      amount: 5
    }
  ]
});
```

### Network Switching
```typescript
// Switch to Polygon
await walletStore.switchNetwork(137);

// Switch to BSC
await walletStore.switchNetwork(56);
```

## Component Usage

The enhanced `WalletConnectButton` component provides:

- **Wallet Selection Modal**: Choose from available wallets
- **Network Indicator**: Shows current network with color coding
- **Connection Status**: Displays connected address and disconnect option
- **Error Handling**: Shows connection errors with retry options
- **Install Instructions**: Guides users to install missing wallets

## Security Considerations

1. **Project ID Security**: Keep your WalletConnect Project ID secure
2. **RPC Endpoints**: Use reliable RPC providers
3. **Contract Verification**: Verify smart contract addresses
4. **User Education**: Guide users on transaction confirmation

## Troubleshooting

### Common Issues

1. **Wallet Not Detected**
   - Ensure wallet extension is installed
   - Refresh the page after installing
   - Check browser permissions

2. **Connection Failed**
   - Check network connectivity
   - Verify WalletConnect Project ID
   - Ensure wallet is unlocked

3. **Transaction Failed**
   - Check sufficient gas/ETH balance
   - Verify contract address
   - Check network compatibility

### Debug Mode
Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'walletconnect*');
```

## Next Steps

1. **Deploy Smart Contracts**: Update contract addresses in configuration
2. **Test Integration**: Test with different wallet providers
3. **User Testing**: Gather feedback on wallet connection UX
4. **Mobile Optimization**: Ensure mobile wallet compatibility
5. **Analytics**: Add wallet usage analytics

## Support

For issues or questions:
- Check browser console for error messages
- Verify wallet extension functionality
- Test with different networks
- Review WalletConnect documentation
