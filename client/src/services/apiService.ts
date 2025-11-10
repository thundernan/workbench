/**
 * API Service for communicating with the backend server
 */

import { IIngredient, IRecipe } from "@/stores/recipes";

// Base server URL (without /api suffix)
// Development: proxy handles /api routing
// Production: set to your deployed server URL
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Global request queue and rate limiting
const requestQueue = new Map<string, Promise<any>>();
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 3000; // Minimum 3 seconds between requests to same endpoint

// Global rate limiter - tracks ALL API requests across all endpoints
let lastGlobalRequestTime = 0;
const MIN_GLOBAL_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between ANY API requests (prevents burst requests)

/**
 * Generic fetch wrapper with error handling and rate limiting
 * Automatically adds /api prefix to all endpoints
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  // Build full URL with /api prefix
  let url: string;
  if (endpoint.startsWith('http')) {
    // Absolute URL provided
    url = endpoint;
  } else {
    // Relative endpoint - add /api prefix
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = SERVER_BASE_URL ? `${SERVER_BASE_URL}/api${cleanEndpoint}` : `/api${cleanEndpoint}`;
  }
  
  // Create a cache key for this request (endpoint + method)
  const cacheKey = `${options.method || 'GET'}:${url}`;
  
  // Check if there's already a pending request for this endpoint
  const pendingRequest = requestQueue.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }
  
  // Global rate limiting - ensure minimum interval between ANY API requests
  const now = Date.now();
  const timeSinceLastGlobalRequest = now - lastGlobalRequestTime;
  if (timeSinceLastGlobalRequest < MIN_GLOBAL_REQUEST_INTERVAL) {
    const waitTime = MIN_GLOBAL_REQUEST_INTERVAL - timeSinceLastGlobalRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Check endpoint-specific rate limiting - wait if request was made too recently
  const lastTime = lastRequestTime.get(cacheKey);
  if (lastTime) {
    const timeSinceLastRequest = Date.now() - lastTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Update global request time
  lastGlobalRequestTime = Date.now();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Create the request promise and add it to queue
  const requestPromise = (async () => {
    try {
      lastRequestTime.set(cacheKey, Date.now());
      
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle rate limiting with retry
      if (response.status === 429 && retries > 0) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, 4 - retries) * 1000; // Exponential backoff
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Remove from queue and retry
        requestQueue.delete(cacheKey);
        return fetchAPI<T>(endpoint, options, retries - 1);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Handle rate limit errors with retry
      if (error instanceof Error) {
        if ((error.message.includes('Too many requests') || error.message.includes('429')) && retries > 0) {
          const waitTime = Math.pow(2, 4 - retries) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Remove from queue and retry
          requestQueue.delete(cacheKey);
          return fetchAPI<T>(endpoint, options, retries - 1);
        }
        
        console.error('API Error:', error.message);
        throw error;
      }
      throw new Error('An unknown error occurred');
    } finally {
      // Remove from queue after request completes
      requestQueue.delete(cacheKey);
    }
  })();
  
  // Add to queue
  requestQueue.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Recipe Interface (from backend)
 */
export interface Recipe {
  _id: string;
  id?: string;
  blockchainRecipeId?: number | null;
  outputTokenId: number;
  outputAmount: number;
  requiresExactPattern: boolean;
  active: boolean;
  ingredients: Array<{
    tokenContract?: string | null;
    tokenId: number;
    amount: number;
    position: number;
    metadata?: {
      name?: string;
      image?: string;
      description?: string;
      category?: string;
    } | null;
  }>;
  outputIngredient?: {
    tokenContract?: string | null;
    tokenId: number;
    amount: number;
    metadata?: {
      name?: string;
      image?: string;
      description?: string;
      category?: string;
    } | null;
  } | null;
  name: string;
  description?: string;
  category?: string;
  difficulty?: number;
  craftingTime?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Ingredient Interface (from backend)
 */
export interface Ingredient {
  _id: string;
  tokenContract: string;
  tokenId: number;
  ingredientData: string; // Just the ID reference
  metadata: {
    name?: string;
    image?: string;
    description?: string;
    category?: string;
    price?: string; // Price in wei as string
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User Balance Interface
 */
export interface UserBalance {
  tokenContract: string;
  tokenId: number;
  balance: string;
  ingredientDataId: string;
}

/**
 * Inventory Item Interface (with metadata)
 */
export interface InventoryItem {
  tokenContract: string;
  tokenId: number;
  balance: string;
  metadata: {
    name?: string;
    image?: string;
    description?: string;
    category?: string;
    [key: string]: any;
  };
  ingredientDataId: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Pagination Result
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Health check response
 */
export interface HealthCheck {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: number;
  database: string;
}

/**
 * API Service
 */
export const apiService = {
  /**
   * Health check
   * Note: Health endpoint is at root level /health, not under /api
   */
  async healthCheck(): Promise<HealthCheck> {
    // Health is at /health (root level), construct full URL
    const serverUrl = import.meta.env.VITE_API_BASE_URL || '';
    const healthUrl = serverUrl ? `${serverUrl}/health` : '/health';
    return fetchAPI<HealthCheck>(healthUrl);
  },

  /**
   * Get all recipes
   */
  async getRecipes(params?: { page?: number; limit?: number; category?: string }): Promise<IRecipe[]> {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/recipes?${queryString}` : '/recipes';
    
    const response = await fetchAPI<ApiResponse<PaginationResult<IRecipe>>>(endpoint);
    
    // Extract recipes from paginated response
    return response.data?.data || [];
  },

  /**
   * Get all ingredients
   */
  async getIngredients(params?: { page?: number; limit?: number }): Promise<IIngredient[]> {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/ingredients?${queryString}` : '/ingredients';
    
    const response = await fetchAPI<ApiResponse<PaginationResult<IIngredient>>>(endpoint);
    
    // Extract ingredients from paginated response
    return response.data?.data || [];
  },

  /**
   * Get all recipes (all pages)
   * Uses a single request with a high limit instead of two requests
   */
  async getAllRecipes(): Promise<IRecipe[]> {
    // API limit is 100, so we'll fetch with the maximum allowed limit
    // If there are more recipes, we'll need to implement pagination
    const response = await fetchAPI<ApiResponse<PaginationResult<IRecipe>>>(`/recipes?limit=100`);
    return response.data?.data || [];
  },

  /**
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe> {
    const response = await fetchAPI<ApiResponse<Recipe>>(`/recipes/${id}`);
    if (!response.data) {
      throw new Error('Recipe not found');
    }
    return response.data;
  },

  /**
   * Get recipe by recipeId (blockchain ID)
   */
  async getRecipeByRecipeId(recipeId: string): Promise<Recipe> {
    const response = await fetchAPI<ApiResponse<Recipe>>(`/recipes/blockchain/${recipeId}`);
    if (!response.data) {
      throw new Error('Recipe not found');
    }
    return response.data;
  },

  /**
   * Get user's token balances from blockchain
   * @param address - Wallet address
   * @returns User balances (non-zero only)
   */
  async getUserBalance(address: string): Promise<{
    address: string;
    balances: UserBalance[];
    totalTokens: number;
    allTokensChecked: number;
    contractAddress: string;
  }> {
    const response = await fetchAPI<ApiResponse<{
      address: string;
      balances: UserBalance[];
      totalTokens: number;
      allTokensChecked: number;
      contractAddress: string;
    }>>(`/ingredients/blockchain/user-balance/${address}`);
    
    if (!response.data) {
      throw new Error('Failed to fetch user balance');
    }
    
    return response.data;
  },

  /**
   * Get user's inventory with metadata from blockchain
   * @param address - Wallet address
   * @param includeZero - Include tokens with zero balance (default: false)
   * @returns User inventory with ingredient metadata
   */
  async getUserInventory(address: string, includeZero: boolean = false): Promise<{
    address: string;
    inventory: IIngredient[];
    totalItems: number;
    allTokensChecked: number;
    contractAddress: string;
  }> {
    const queryParams = new URLSearchParams();
    if (includeZero) {
      queryParams.append('includeZero', 'true');
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/ingredients/blockchain/user-inventory/${address}?${queryString}`
      : `/ingredients/blockchain/user-inventory/${address}`;
    
    const response = await fetchAPI<ApiResponse<{
      address: string;
      inventory: IIngredient[];
      totalItems: number;
      allTokensChecked: number;
      contractAddress: string;
    }>>(endpoint);
    
    if (!response.data) {
      throw new Error('Failed to fetch user inventory');
    }
    
    return response.data;
  },

  /**
   * Get single token balance for a user
   * @param address - Wallet address
   * @param tokenId - Token ID
   * @returns Token balance
   */
  async getTokenBalance(address: string, tokenId: number): Promise<{
    address: string;
    tokenId: number;
    balance: string;
    contractAddress: string;
  }> {
    const response = await fetchAPI<ApiResponse<{
      address: string;
      tokenId: number;
      balance: string;
      contractAddress: string;
    }>>(`/ingredients/blockchain/balance/${address}/${tokenId}`);
    
    if (!response.data) {
      throw new Error('Failed to fetch token balance');
    }
    
    return response.data;
  },
};

export default apiService;

