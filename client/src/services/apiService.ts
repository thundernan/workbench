/**
 * API Service for communicating with the backend server
 */

// Base server URL (without /api suffix)
// Development: proxy handles /api routing
// Production: set to your deployed server URL
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic fetch wrapper with error handling
 * Automatically adds /api prefix to all endpoints
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
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

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Server returned non-JSON response: ${response.statusText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
}

/**
 * Recipe Interface (from backend)
 */
export interface Recipe {
  _id: string;
  id?: string;
  blockchainRecipeId: string;
  resultTokenContract: string;
  resultTokenId: number;
  resultAmount: number;
  ingredients: Array<{
    tokenContract: string;
    tokenId: number;
    amount: number;
    position: number;
  }>;
  name: string;
  description?: string;
  category?: string;
  difficulty?: number;
  craftingTime?: number;
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
  async getRecipes(params?: { page?: number; limit?: number; category?: string }): Promise<Recipe[]> {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/recipes?${queryString}` : '/recipes';
    
    const response = await fetchAPI<ApiResponse<PaginationResult<Recipe>>>(endpoint);
    
    // Extract recipes from paginated response
    return response.data?.data || [];
  },

  /**
   * Get all recipes (all pages)
   */
  async getAllRecipes(): Promise<Recipe[]> {
    // First, get total count
    const firstPage = await fetchAPI<ApiResponse<PaginationResult<Recipe>>>('/recipes?limit=1');
    const total = firstPage.data?.total || 0;
    
    if (total === 0) {
      return [];
    }
    
    // Fetch all recipes in one request
    const response = await fetchAPI<ApiResponse<PaginationResult<Recipe>>>(`/recipes?limit=${total}`);
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
    inventory: InventoryItem[];
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
      inventory: InventoryItem[];
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

