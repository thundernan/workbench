/**
 * API Service for communicating with the backend server
 */

// API Base URL - in development, proxy will redirect to localhost:3001
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
  recipeId: string;
  newIngredientId: string;
  ingredients: Array<{
    ingredientId: string;
    position: number;
  }>;
  gridSize: number;
  blockNumber: number;
  transactionHash: string;
  createdAt: string;
  updatedAt: string;
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
   */
  async healthCheck(): Promise<HealthCheck> {
    return fetchAPI<HealthCheck>('/health');
  },

  /**
   * Get all recipes
   */
  async getRecipes(): Promise<Recipe[]> {
    const response = await fetchAPI<ApiResponse<Recipe[]>>('/recipes');
    return response.data || [];
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

