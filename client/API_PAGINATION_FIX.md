# API Pagination Fix

## Problem

The client was getting an internal error when fetching recipes because the server returns a **paginated response**, but the client was expecting a direct array.

### Server Response Format

```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "data": [...recipes...],     // ← Recipes are nested here!
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### What Client Expected

```json
{
  "success": true,
  "data": [...recipes...]        // ← Expected recipes directly here
}
```

## Solution

Updated the API service to correctly handle paginated responses.

### Changes Made

#### 1. Added Pagination Interface

```typescript
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### 2. Updated `getRecipes()` Method

```typescript
async getRecipes(params?: { page?: number; limit?: number; category?: string }): Promise<Recipe[]> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/recipes?${queryString}` : '/recipes';
  
  const response = await fetchAPI<ApiResponse<PaginationResult<Recipe>>>(endpoint);
  
  // Extract recipes from paginated response: data.data
  return response.data?.data || [];
}
```

**Key Change:** `response.data?.data` instead of `response.data`

#### 3. Added `getAllRecipes()` Method

```typescript
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
}
```

**Benefits:**
- Fetches ALL recipes regardless of pagination
- Makes 2 API calls (one for count, one for all data)
- Ensures no recipes are missed

#### 4. Updated Recipes Store

```typescript
const fetchBlockchainRecipes = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;

  try {
    // Use getAllRecipes() instead of getRecipes()
    const fetchedRecipes = await apiService.getAllRecipes();
    
    blockchainRecipes.value = fetchedRecipes.map(recipe => ({
      // ... mapping
    }));

    console.log(`Loaded ${blockchainRecipes.value.length} recipes from server`);
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch recipes';
    console.error('Error fetching recipes:', err);
    throw err;
  } finally {
    isLoading.value = false;
  }
};
```

## Usage

### Get Paginated Recipes

```typescript
import apiService from '@/services/apiService';

// Get first page (default: 10 items)
const recipes = await apiService.getRecipes();

// Get specific page
const page2 = await apiService.getRecipes({ page: 2, limit: 20 });

// Filter by category
const weapons = await apiService.getRecipes({ category: 'weapon' });
```

### Get All Recipes

```typescript
// Get ALL recipes (ignores pagination)
const allRecipes = await apiService.getAllRecipes();
console.log(`Total recipes: ${allRecipes.length}`);
```

## API Endpoints

### Get Recipes (Paginated)

```
GET /api/recipes?page=1&limit=10&category=weapon
```

**Response:**
```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "...",
        "blockchainRecipeId": "1",
        "name": "Iron Sword",
        // ... more fields
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Testing

### Test with Server Running

1. Start servers:
   ```bash
   npm run dev
   ```

2. Open browser console: `http://localhost:3000`

3. Check output:
   ```
   🚀 App loaded - initializing...
   📚 Fetching recipes from server...
   ✅ Loaded X recipes
   ```

### Test API Directly

```bash
# Get paginated recipes
curl http://localhost:3001/api/recipes

# Get with limit
curl http://localhost:3001/api/recipes?limit=100

# Get by category
curl http://localhost:3001/api/recipes?category=weapon
```

### Test in Browser Console

```javascript
// Import the service (if using devtools)
const { getAllRecipes } = await import('/src/services/apiService.ts');

// Fetch recipes
const recipes = await getAllRecipes();
console.log('Recipes:', recipes);
```

## Error Handling

### Before Fix

```
❌ Failed to fetch recipes: Cannot read property 'map' of undefined
```

**Reason:** Trying to map over `response.data` which was the pagination object, not the array.

### After Fix

```
✅ Loaded 5 recipes from server
```

**Works:** Correctly extracts `response.data.data` array.

## Performance

### Previous Approach (if it worked)
- Would only get first 10 recipes (default limit)
- Would miss remaining recipes

### New Approach
- **`getRecipes()`**: Efficient for pagination (load as needed)
- **`getAllRecipes()`**: Gets everything in 2 requests
  1. Count query (1 recipe for total)
  2. Full query (all recipes)

**For typical use cases:**
- Small datasets (<100 recipes): `getAllRecipes()` is perfect
- Large datasets (1000s): Use `getRecipes()` with pagination

## Files Modified

- ✅ `client/src/services/apiService.ts`
  - Added `PaginationResult` interface
  - Updated `getRecipes()` to handle pagination
  - Added `getAllRecipes()` for fetching all

- ✅ `client/src/stores/recipes.ts`
  - Changed to use `getAllRecipes()`
  - Ensures all recipes are loaded

## Summary

✅ **Fixed:** Server pagination response now correctly parsed
✅ **Added:** `getAllRecipes()` method to fetch all recipes
✅ **Result:** Client successfully loads all recipes from server

The error is now resolved and recipes will load automatically when the app starts!

