# Automatic Recipe Loading

## What Was Implemented

The client app now automatically fetches blockchain recipes from the server when it loads, ensuring recipes are always available immediately when users access the application.

## How It Works

### 1. App Initialization (`App.vue`)

When the app loads, it automatically:
1. ✅ Checks for existing wallet connection
2. ✅ Fetches blockchain recipes from server
3. ✅ Stores recipes in Pinia store
4. ✅ Makes recipes available throughout the app

### 2. Flow

```
User opens app
    │
    ├─> App.vue mounts
    │   │
    │   ├─> Check wallet connection (async)
    │   │   └─> If connected: Display address
    │   │
    │   └─> Fetch recipes from API (async)
    │       │
    │       ├─> Success: Store in recipesStore
    │       │   └─> Log: "✅ Loaded X recipes"
    │       │
    │       └─> Error: Log error, don't block app
    │           └─> User can retry via RecipeBook
    │
    └─> Recipes available in all components
```

### 3. Recipe Store State

After loading, recipes are available globally:
```typescript
import { useRecipesStore } from '@/stores/recipes';

const recipesStore = useRecipesStore();

// Access recipes anywhere
console.log(recipesStore.allBlockchainRecipes);
console.log(recipesStore.isLoading);
console.log(recipesStore.error);
```

## Implementation Details

### App.vue Changes

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useWalletStore } from '@/stores/wallet';

const recipesStore = useRecipesStore();
const walletStore = useWalletStore();

onMounted(async () => {
  console.log('🚀 App loaded - initializing...');
  
  // Check wallet
  try {
    await walletStore.checkConnection();
    if (walletStore.connected) {
      console.log('✅ Wallet already connected:', walletStore.shortAddress);
    }
  } catch (error) {
    console.warn('⚠️ Wallet check failed:', error);
  }
  
  // Fetch recipes
  try {
    console.log('📚 Fetching recipes from server...');
    await recipesStore.fetchBlockchainRecipes();
    console.log(`✅ Loaded ${recipesStore.allBlockchainRecipes.length} recipes`);
  } catch (error: any) {
    console.error('❌ Failed to fetch recipes:', error.message);
    // Don't block app if recipes fail
  }
});
</script>
```

### Smart Recipe Loading

The `BlockchainRecipeBook` component now:
- **Checks if recipes already loaded** (by App.vue)
- **Only fetches if needed** (not already loading/loaded)
- **Shows pre-loaded recipes** immediately
- **Provides retry** if initial load failed

```typescript
onMounted(() => {
  if (recipesStore.allBlockchainRecipes.length === 0 && 
      !recipesStore.isLoading && 
      !recipesStore.error) {
    // Not loaded yet, load now
    loadRecipes();
  } else if (recipesStore.allBlockchainRecipes.length > 0) {
    // Already loaded by App.vue
    console.log('Using pre-loaded recipes');
  }
});
```

## Console Output

When app loads successfully, you'll see:
```
🚀 App loaded - initializing...
✅ Wallet already connected: 0x1234...5678 (if wallet connected)
📚 Fetching recipes from server...
✅ Loaded 5 recipes
```

When RecipeBook component loads:
```
📚 BlockchainRecipeBook: Using 5 pre-loaded recipes
```

## Error Handling

### If Server is Down

```
🚀 App loaded - initializing...
📚 Fetching recipes from server...
❌ Failed to fetch recipes: Failed to fetch
```

**Result:**
- App continues to work
- RecipeBook shows error state
- User can click "Retry" button
- No app crash

### If Network is Slow

```
🚀 App loaded - initializing...
📚 Fetching recipes from server...
(loading spinner in RecipeBook)
✅ Loaded 5 recipes
```

**Result:**
- App shows loading state
- RecipeBook displays spinner
- Recipes appear when loaded

## Benefits

1. **Instant Availability**
   - Recipes loaded once on app start
   - Available in all components immediately
   - No per-component fetching

2. **Better UX**
   - Users see recipes immediately
   - No empty states after navigation
   - Faster perceived performance

3. **Efficient**
   - Single API call per session
   - Pinia store caches results
   - No duplicate fetches

4. **Resilient**
   - Doesn't block app if server is down
   - Provides retry mechanism
   - Graceful error handling

## Testing

### Test Successful Load

1. Start server and client:
   ```bash
   npm run dev
   ```

2. Open browser console

3. You should see:
   ```
   🚀 App loaded - initializing...
   📚 Fetching recipes from server...
   ✅ Loaded X recipes
   ```

4. Navigate to any page - recipes already available

### Test Server Down

1. Stop server:
   ```bash
   # Kill server process
   ```

2. Refresh client

3. Console shows:
   ```
   ❌ Failed to fetch recipes: Failed to fetch
   ```

4. App still works, RecipeBook shows error with retry button

### Test Already Loaded

1. Load app (recipes fetch)
2. Navigate to different pages
3. Check console - should see:
   ```
   📚 BlockchainRecipeBook: Using X pre-loaded recipes
   ```
4. No additional API calls

## Usage in Other Components

Any component can access pre-loaded recipes:

```vue
<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes';

const recipesStore = useRecipesStore();

// Recipes are already loaded
const recipes = recipesStore.allBlockchainRecipes;

// Check if loaded
if (recipesStore.isLoading) {
  console.log('Still loading...');
}

// Check for errors
if (recipesStore.error) {
  console.log('Error:', recipesStore.error);
}
</script>
```

## Configuration

No configuration needed! Works out of the box.

Optional: Adjust retry behavior in `BlockchainRecipeBook.vue`:

```typescript
// Current: Don't auto-retry on error
if (!recipesStore.error) {
  loadRecipes();
}

// Alternative: Auto-retry after delay
if (recipesStore.error) {
  setTimeout(() => loadRecipes(), 5000); // Retry after 5s
}
```

## Performance

**Initial Load:**
- 1 API call to `/api/recipes`
- Typically < 500ms
- Async, doesn't block rendering

**Subsequent Navigation:**
- 0 API calls
- Instant access from store
- No loading states

**Memory:**
- Recipes stored in Pinia
- Lightweight (JSON data)
- Cleared on page refresh

## Future Enhancements

Possible improvements:

1. **Periodic Refresh**
   ```typescript
   // Refresh every 5 minutes
   setInterval(() => {
     recipesStore.fetchBlockchainRecipes();
   }, 5 * 60 * 1000);
   ```

2. **Cache with Expiry**
   ```typescript
   // Use localStorage with timestamp
   const cached = localStorage.getItem('recipes');
   const cacheTime = localStorage.getItem('recipes_time');
   
   if (cached && Date.now() - cacheTime < 60000) {
     // Use cached recipes
   } else {
     // Fetch fresh
   }
   ```

3. **Background Sync**
   ```typescript
   // Silently update in background
   if (recipesStore.allBlockchainRecipes.length > 0) {
     recipesStore.fetchBlockchainRecipes(); // Update silently
   }
   ```

## Summary

✅ **Recipes automatically load** when app starts
✅ **Available immediately** in all components
✅ **Smart caching** prevents duplicate fetches
✅ **Graceful errors** don't break the app
✅ **Better UX** with instant recipe access

No additional setup required - just start the app!

