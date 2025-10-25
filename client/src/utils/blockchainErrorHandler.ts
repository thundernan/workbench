export interface BlockchainError {
  code: string;
  message: string;
  details?: any;
  userMessage: string;
  action?: string;
}

export class BlockchainErrorHandler {
  /**
   * Parse and categorize blockchain errors
   */
  static parseError(error: any): BlockchainError {
    // User rejected transaction
    if (error.code === 4001 || error.message?.includes('User rejected')) {
      return {
        code: 'USER_REJECTED',
        message: 'Transaction rejected by user',
        userMessage: 'Transaction was cancelled by user',
        action: 'Try again'
      };
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient ETH for transaction',
        userMessage: 'You don\'t have enough ETH for this transaction',
        action: 'Get testnet ETH from faucet'
      };
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error',
        userMessage: 'Network error. Please check your connection',
        action: 'Retry'
      };
    }

    // Gas estimation failed
    if (error.message?.includes('gas') || error.message?.includes('Gas')) {
      return {
        code: 'GAS_ERROR',
        message: 'Gas estimation failed',
        userMessage: 'Unable to estimate gas for this transaction',
        action: 'Try with higher gas limit'
      };
    }

    // Contract revert errors
    if (error.reason) {
      return this.parseContractRevert(error.reason);
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred',
      action: 'Contact support'
    };
  }

  /**
   * Parse contract revert messages
   */
  private static parseContractRevert(reason: string): BlockchainError {
    const reasonLower = reason.toLowerCase();

    // Common contract errors
    if (reasonLower.includes('incorrect eth amount')) {
      return {
        code: 'INCORRECT_PAYMENT',
        message: 'Incorrect ETH amount sent',
        userMessage: 'Please send the exact ETH amount required',
        action: 'Check the price and try again'
      };
    }

    if (reasonLower.includes('not approved') || reasonLower.includes('approval')) {
      return {
        code: 'NOT_APPROVED',
        message: 'Contract not approved',
        userMessage: 'Please approve the contract first',
        action: 'Approve contract'
      };
    }

    if (reasonLower.includes('insufficient') && reasonLower.includes('balance')) {
      return {
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient token balance',
        userMessage: 'You don\'t have enough tokens for this action',
        action: 'Get more tokens'
      };
    }

    if (reasonLower.includes('recipe') && reasonLower.includes('exist')) {
      return {
        code: 'INVALID_RECIPE',
        message: 'Recipe does not exist',
        userMessage: 'This recipe doesn\'t exist or is not active',
        action: 'Try a different recipe'
      };
    }

    if (reasonLower.includes('listing') && reasonLower.includes('active')) {
      return {
        code: 'LISTING_INACTIVE',
        message: 'Listing is not active',
        userMessage: 'This listing is no longer available',
        action: 'Find another listing'
      };
    }

    if (reasonLower.includes('paused')) {
      return {
        code: 'CONTRACT_PAUSED',
        message: 'Contract is paused',
        userMessage: 'This contract is temporarily paused',
        action: 'Try again later'
      };
    }

    if (reasonLower.includes('reentrancy')) {
      return {
        code: 'REENTRANCY_ERROR',
        message: 'Reentrancy protection triggered',
        userMessage: 'Transaction failed due to security protection',
        action: 'Try again'
      };
    }

    // Generic contract error
    return {
      code: 'CONTRACT_ERROR',
      message: reason,
      userMessage: reason,
      action: 'Check transaction details'
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    const parsed = this.parseError(error);
    return parsed.userMessage;
  }

  /**
   * Get suggested action for error
   */
  static getSuggestedAction(error: any): string | null {
    const parsed = this.parseError(error);
    return parsed.action || null;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    const parsed = this.parseError(error);
    const retryableCodes = [
      'NETWORK_ERROR',
      'GAS_ERROR',
      'UNKNOWN_ERROR'
    ];
    return retryableCodes.includes(parsed.code);
  }

  /**
   * Check if error requires user action
   */
  static requiresUserAction(error: any): boolean {
    const parsed = this.parseError(error);
    const userActionCodes = [
      'USER_REJECTED',
      'INSUFFICIENT_FUNDS',
      'NOT_APPROVED',
      'INSUFFICIENT_BALANCE'
    ];
    return userActionCodes.includes(parsed.code);
  }
}

/**
 * Safe contract call wrapper
 */
export async function safeContractCall<T>(
  fn: () => Promise<T>,
  onError?: (error: BlockchainError) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const blockchainError = BlockchainErrorHandler.parseError(error);
    console.error('Contract call failed:', blockchainError);
    onError?.(blockchainError);
    return null;
  }
}

/**
 * Retry mechanism for contract calls
 */
export async function retryContractCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!BlockchainErrorHandler.isRetryable(error)) {
        break;
      }
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  const blockchainError = BlockchainErrorHandler.parseError(lastError);
  console.error(`All ${maxRetries} attempts failed:`, blockchainError);
  return null;
}
