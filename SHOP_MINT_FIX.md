# Shop Mint Error Fix

## Issue
When trying to mint ingredients from the shop, users encountered the following error:
```
Failed to mint ingredient: TypeError: Cannot access private method
```

## Root Cause
The error was caused by attempting to access `signer.address` directly on line 376 of `client/src/views/Shop.vue`:

```typescript
console.log('📋 Contract instance created:', {
  address: ingredient.tokenContract,
  signer: signer.address  // ❌ This caused the error
});
```

In **ethers.js v6**, the signer's address is not a direct property but must be accessed asynchronously using the `getAddress()` method. Attempting to access it as a property tries to access a private member, resulting in the error.

## Solution
Changed the code to properly await the `getAddress()` method:

```typescript
// Get signer address properly (ethers v6)
const signerAddress = await signer.getAddress();

console.log('📋 Contract instance created:', {
  address: ingredient.tokenContract,
  signerAddress: signerAddress  // ✅ Correct way
});
```

## Changes Made

**File**: `client/src/views/Shop.vue`

**Before** (lines 374-377):
```typescript
console.log('📋 Contract instance created:', {
  address: ingredient.tokenContract,
  signer: signer.address
});
```

**After** (lines 374-380):
```typescript
// Get signer address properly (ethers v6)
const signerAddress = await signer.getAddress();

console.log('📋 Contract instance created:', {
  address: ingredient.tokenContract,
  signerAddress: signerAddress
});
```

## Ethers.js v6 Migration Note

This is a common issue when migrating from ethers.js v5 to v6. Key differences:

### ethers.js v5:
```typescript
const address = signer.address;  // Direct property access
```

### ethers.js v6:
```typescript
const address = await signer.getAddress();  // Async method call
```

## Testing

To verify the fix:
1. Connect your wallet
2. Navigate to the Shop page
3. Click "Mint Free" or "Buy" on any ingredient
4. The minting transaction should proceed without the "Cannot access private method" error

## Additional Notes

- The issue only affected the debug logging, not the actual minting functionality
- However, it prevented the transaction from being sent because the error occurred before the transaction call
- All other wallet-related operations should be checked for similar patterns
- The fix maintains backward compatibility with the existing codebase

## Related Files

- `client/src/views/Shop.vue` - Shop component with mint functionality
- `client/src/stores/wallet.ts` - Wallet store (uses ethers.js v6)
- `client/src/services/walletService.ts` - Wallet service wrapper

## Prevention

When working with ethers.js v6 Signer objects:
- ✅ Use `await signer.getAddress()` to get the address
- ❌ Don't use `signer.address` directly
- ✅ Use `await provider.getSigner()` to get the signer
- ✅ Check the [ethers.js v6 migration guide](https://docs.ethers.org/v6/migrating/) for other breaking changes

