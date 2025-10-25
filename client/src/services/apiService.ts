/**
 * API Service for communicating with the backend server
 */

// API Base URL
// Development: uses proxy (vite.config.ts redirects /api to localhost:3001)
// Production: set VITE_API_BASE_URL to your deployed server URL (should include /api)
// If VITE_API_BASE_URL is not set, defaults to '/api' which works with proxy or same-domain deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
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
   * Note: Health endpoint is at root level, not under /api
   */
  async healthCheck(): Promise<HealthCheck> {
    // Health is at /health (root), so we need to construct the URL differently
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    const healthUrl = baseUrl ? `${baseUrl}/health` : '/health';
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
};

export default apiService;

