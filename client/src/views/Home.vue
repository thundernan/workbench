<template>
  <div class="workbench-layout bg-slate-900 min-h-screen flex flex-col text-sm font-mono">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-4 p-4 overflow-hidden">
      <!-- Left Panel - Inventory -->
      <div class="w-80 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <!-- Header with Search -->
        <div class="px-4 py-2 border-b-2 border-slate-700">
          <div class="text-emerald-400 font-semibold mb-2">Resources</div>
          <input
            v-model="inventorySearch"
            type="text"
            placeholder="🔍 Search..."
            class="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <!-- Resources List -->
        <div class="flex-1 p-4 overflow-y-auto">
          <!-- Wallet Not Connected -->
          <div v-if="!walletStore.connected" class="text-center py-8">
            <div class="text-slate-400 text-lg mb-3">👛</div>
            <div class="text-slate-400 text-sm mb-2">Connect your wallet</div>
            <div class="text-slate-500 text-xs">to view your resources</div>
          </div>

          <!-- Loading Balance -->
          <div v-else-if="inventoryStore.isLoadingBalance" class="text-center py-8">
            <div class="text-emerald-400 text-sm animate-pulse">Loading your balance...</div>
          </div>

          <!-- Error State -->
          <div v-else-if="inventoryStore.balanceError" class="text-center py-8">
            <div class="text-red-400 text-sm mb-2">⚠️ Failed to load balance</div>
            <div class="text-slate-400 text-xs">{{ inventoryStore.balanceError }}</div>
          </div>

          <!-- User Balance from Blockchain -->
          <div v-else-if="filteredResources.length > 0" class="space-y-3">
            <div 
              v-for="resource in filteredResources" 
              :key="resource.id"
              :draggable="true"
              :data-resource-id="resource.id"
              @dragstart="onResourceDragStart($event, resource)"
              @dragend="onDragEnd"
              @mousedown="onResourceMouseDown($event, resource)"
              class="flex items-center gap-3 p-2 border border-slate-600 rounded bg-slate-700 hover:border-emerald-400 transition-colors cursor-move"
              :class="{ 
                'opacity-50': isDragging && draggedItem?.id === resource.id,
                'border-emerald-400 shadow-lg shadow-emerald-500/50': isPainting && paintingItem?.id === resource.id
              }"
              @click="selectResource(resource)"
            >
              <!-- Display image if available, otherwise use icon -->
              <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center select-none">
                <img 
                  v-if="resource.metadata?.image" 
                  :src="resource.metadata.image" 
                  :alt="resource.name"
                  class="w-full h-full object-contain rounded"
                  @error="handleImageError($event)"
                />
                <span v-else class="text-2xl">{{ resource.icon }}</span>
              </div>
              <div class="flex-1 text-xs min-w-0">
                <div class="text-white truncate">{{ resource.name }}</div>
                <div class="text-slate-400 truncate">{{ resource.category }}</div>
                <div v-if="resource.description" class="text-slate-500 text-xs truncate">{{ resource.description }}</div>
              </div>
              <div class="text-right">
                <div class="text-emerald-400 font-bold whitespace-nowrap">
                  {{ getAvailableQuantity(resource) }}
                </div>
                <div class="text-slate-500 text-[10px] whitespace-nowrap">
                  / {{ (resource as any).balance || '0' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Balance -->
          <div v-else class="text-center py-8">
            <div class="text-slate-400 text-lg mb-3">📦</div>
            <div class="text-slate-400 text-sm mb-2">No resources yet</div>
            <div class="text-slate-500 text-xs">Your balance is empty</div>
          </div>
        </div>
      </div>

      <!-- Center Panel - Crafting -->
      <div class="flex-1 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <div class="px-4 py-2 border-b-2 border-slate-700 flex items-center justify-between">
          <span class="text-emerald-400 font-semibold">Crafting</span>
          <div v-if="isPainting" class="flex items-center gap-2 text-xs text-emerald-400 animate-pulse">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Painting Mode</span>
            <!-- Display image if available, otherwise use icon -->
            <div class="w-5 h-5 flex items-center justify-center">
              <img
                v-if="paintingItem?.metadata?.image"
                :src="paintingItem.metadata.image"
                :alt="paintingItem.name"
                class="w-full h-full object-contain"
                @error="handlePaintingImageError($event)"
              />
              <span v-else class="text-white text-base">{{ paintingItem?.icon }}</span>
            </div>
          </div>
        </div>
         <div class="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-start">
           <!-- Grid and Result Section -->
           <div class="flex items-end gap-6 mb-10">
             <!-- 3x3 Grid -->
            <div>
               <div class="flex items-center justify-between w-full mb-4 mt-8">
                 <div class="text-slate-400 text-sm font-medium">
                   → 3× Grid
                   <span v-if="!isPainting" class="ml-2 text-slate-500 text-xs">(hold & drag to paint)</span>
                 </div>
                 <!-- Trash Zone -->
                 <div
                     @dragover.prevent="onTrashDragOver"
                     @dragleave="onTrashDragLeave"
                     @drop="onTrashDrop"
                     @click="clearCraftingGrid"
                     class="px-5 py-2.5 rounded-lg border-2 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105"
                     :class="isOverTrash ? 'border-red-400 bg-red-900/70 scale-110 shadow-red-500/50' : 'border-red-600/50 bg-red-950/30 hover:border-red-500 hover:bg-red-950/50'"
                 >
                   <div class="flex items-center gap-2.5 text-base font-semibold">
                     <svg class="w-6 h-6" :class="isOverTrash ? 'text-red-400' : 'text-red-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                     <span :class="isOverTrash ? 'text-red-400' : 'text-red-400'">Trash</span>
                   </div>
                 </div>
               </div>
               <div class="grid grid-cols-3 gap-3">
                 <div
                     v-for="(cell, index) in craftingGrid"
                     :key="index"
                     :draggable="!!cell"
                     @dragstart="onCellDragStart($event, index)"
                     @dragend="onDragEnd"
                     @dragover.prevent="onDragOver($event, index)"
                     @dragleave="onDragLeave(index)"
                     @drop="onDrop($event, index)"
                     @mousedown="onCellMouseDown($event, index)"
                     @mouseenter="onCellMouseEnter(index)"
                     class="w-28 h-28 border-2 rounded-lg flex items-center justify-center transition-all duration-200 relative overflow-hidden"
                     :class="getCellClass(cell, index)"
                     :style="{ cursor: isPainting ? 'crosshair' : (cell ? 'move' : 'pointer') }"
                 >
                   <!-- Display image if available, otherwise use icon -->
                   <template v-if="cell">
                     <img
                       v-if="cell.metadata?.image"
                       :src="cell.metadata.image"
                       :alt="cell.name"
                       class="w-full h-full object-contain p-2 select-none"
                       @error="handleCellImageError($event)"
                     />
                     <span v-else class="select-none text-5xl">{{ cell.icon }}</span>
                   </template>
                   <span v-else class="text-slate-600 text-sm">[ ]</span>
                 </div>
               </div>

            </div>
             <!-- Result Preview -->
             <div class="flex flex-col items-center justify-between border-2 border-slate-700 rounded-lg bg-slate-800 p-5" style="width: 260px; height: 357px;">
               <div class="text-slate-400 text-sm font-medium">→ Result</div>
               <div class="w-36 h-36 border-2 rounded-lg flex items-center justify-center transition-all duration-200 relative overflow-hidden"
                    :class="matchedRecipe ? 'border-emerald-400 bg-slate-700 shadow-lg shadow-emerald-500/30' : 'border-slate-600 bg-slate-900'">
                 <!-- Display image if available, otherwise use icon -->
                 <template v-if="matchedRecipe">
                   <img
                     v-if="matchedRecipe.result.metadata?.image"
                     :src="matchedRecipe.result.metadata.image"
                     :alt="matchedRecipe.result.name"
                     class="w-full h-full object-contain p-3 select-none"
                     @error="handleResultImageError($event)"
                   />
                   <span v-else class="select-none text-6xl">{{ matchedRecipe.result.icon }}</span>
                 </template>
                 <span v-else class="text-slate-600 text-4xl">?</span>
               </div>
               <div class="text-center w-full px-2">
                 <div v-if="matchedRecipe" class="text-white text-sm font-semibold truncate">{{ matchedRecipe.result.name }}</div>
                 <div v-else class="text-slate-500 text-sm">No match</div>
                 <div v-if="matchedRecipe" class="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{{ matchedRecipe.result.description }}</div>
               </div>
             </div>
           </div>
 
           <!-- Craft Button -->
           <button 
             @click="craftItem"
             :disabled="!canCraft"
             class="px-8 py-3 rounded-lg text-sm transition-all duration-200 font-semibold"
             :class="canCraft ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
           >
             {{ canCraft ? '⚡ Craft Item' : '✗ No match' }}
           </button>
         </div>
      </div>

      <!-- Right Panel - Recipe Book -->
      <div class="w-80 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <RecipeBook @autofill="handleAutofillRecipe" />
      </div>
    </div>
    
    <!-- Bottom Notification Bar -->
    <div class="bg-slate-800 border-t-2 border-slate-700 px-6 py-4">

    </div>

    <ToastNotification />
    <WelcomeChestModal />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import WelcomeChestModal from '@/components/WelcomeChestModal.vue';
import RecipeBook from '@/components/RecipeBook.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import { useWalletStore } from '@/stores/wallet';
import { CONTRACTS } from '@/config/wallet';
import type { Item, Recipe, BlockchainRecipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();
const walletStore = useWalletStore();

// Initialize data
recipesStore.initializeRecipes();

// Check wallet connection on mount and load balance if connected (with delay)
onMounted(async () => {
  await walletStore.checkConnection();
  
  if (walletStore.connected && walletStore.address) {
    // Delay to avoid competing with other API calls on app mount
    const address = walletStore.address; // Store in const to satisfy TypeScript
    setTimeout(async () => {
      try {
        if (address) {
          await inventoryStore.loadUserBalance(address);
        }
      } catch (error) {
        console.error('Failed to load balance on mount:', error);
      }
    }, 4000); // Delay 4 seconds to let other components load first
  }
});

// Inventory search
const inventorySearch = ref('');

// Crafting grid state
const craftingGrid = ref<(Item | null)[]>(new Array(9).fill(null));
// Drag and drop state
const isDragging = ref(false);
const draggedItem = ref<Item | null>(null);
const draggedFromCellIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const isOverTrash = ref(false);

// Painting mode state
const isPainting = ref(false);
const paintingItem = ref<Item | null>(null);
const paintedCells = ref<Set<number>>(new Set());

// Notifications
const notifications = ref([
  { type: 'success', message: '"Crafted Pickaxe x1"' },
  { type: 'warning', message: '"Not enough Planks"' },
  { type: 'info', message: '"Listed 4 Sticks for 12 X"' }
]);

// Computed
const filteredResources = computed(() => {
  // Use user's blockchain balance instead of all items
  const resources = inventoryStore.userBalance;
  
  if (!inventorySearch.value) {
    return resources;
  }
  
  const query = inventorySearch.value.toLowerCase();
  return resources.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  );
});

const filteredInventoryItems = computed(() => {
  if (!inventorySearch.value) {
    return inventoryStore.items;
  }
  
  const query = inventorySearch.value.toLowerCase();
  return inventoryStore.items.filter(invItem =>
    invItem.item.name.toLowerCase().includes(query) ||
    invItem.item.category.toLowerCase().includes(query) ||
    invItem.item.description.toLowerCase().includes(query)
  );
});

const matchedRecipe = computed(() => {
  try {
    // First try to match legacy recipes
    console.log('🔍 matchedRecipe computed - craftingGrid:', craftingGrid.value);
    const grid2D = [
      [craftingGrid.value[0], craftingGrid.value[1], craftingGrid.value[2]],
      [craftingGrid.value[3], craftingGrid.value[4], craftingGrid.value[5]],
      [craftingGrid.value[6], craftingGrid.value[7], craftingGrid.value[8]]
    ];
    console.log('🔍 matchedRecipe computed - grid2D:', grid2D);
    console.log('🔍 matchedRecipe computed - recipesStore:', recipesStore);
    console.log('🔍 matchedRecipe computed - matchRecipe function:', recipesStore.matchRecipe);
    console.log('🔍 matchedRecipe computed - recipes.value:', recipesStore.allRecipes);
    console.log({recipes: recipesStore.recipes})
    
    if (typeof recipesStore.matchRecipe !== 'function') {
      console.error('❌ matchRecipe is not a function!', recipesStore.matchRecipe);
      return null;
    }
    
    const legacyMatch = recipesStore.matchRecipe(grid2D);
    console.log(recipesStore)
    console.log('🔍 matchedRecipe computed - legacyMatch result:', legacyMatch);
    if (legacyMatch) {
      return legacyMatch;
    }

    // Try to match blockchain recipes
    // Convert grid to positions map for blockchain recipe matching
    const positions = new Map<number, { tokenContract: string; tokenId: number }>();
    
    // Use CONTRACTS from imported config
    const defaultContract = CONTRACTS.workbench;
    
    // Build positions map from crafting grid
    for (let i = 0; i < craftingGrid.value.length; i++) {
      const item = craftingGrid.value[i];
      if (!item) continue;
      
      let tokenContract: string | undefined;
      let tokenId: number | undefined;
      
      // Check if item has tokenContract and tokenId (from userBalance)
      const itemTokenContract = (item as any).tokenContract;
      const itemTokenId = (item as any).tokenId;
      
      if (itemTokenContract && itemTokenId !== undefined && itemTokenId !== null) {
        // Ensure tokenContract is a string
        tokenContract = typeof itemTokenContract === 'string' ? itemTokenContract : String(itemTokenContract);
        // Ensure tokenId is a number
        tokenId = typeof itemTokenId === 'number' ? itemTokenId : Number(itemTokenId);
        
        // Validate the values
        if (!tokenContract || isNaN(tokenId as number)) {
          continue;
        }
      } else if (item.id && item.id.startsWith('token_')) {
        // Fallback: parse from id and use default contract
        const tokenIdStr = item.id.replace('token_', '');
        const parsedTokenId = parseInt(tokenIdStr, 10);
        if (!isNaN(parsedTokenId)) {
          tokenId = parsedTokenId;
          // Try to find the item in userBalance to get the actual tokenContract
          const balanceItem = inventoryStore.userBalance.find(r => r.id === item.id);
          const balanceTokenContract = balanceItem && (balanceItem as any).tokenContract;
          tokenContract = balanceTokenContract && typeof balanceTokenContract === 'string'
            ? balanceTokenContract
            : defaultContract;
        }
      }
      
      // Only add to positions if we have valid tokenContract and tokenId
      if (tokenContract && typeof tokenContract === 'string' && tokenContract.length > 0 &&
          tokenId !== undefined && !isNaN(tokenId as number)) {
        positions.set(i, {
          tokenContract: tokenContract,
          tokenId: tokenId as number
        });
      }
    }
    
    // Only try to match if we have positions and recipes are loaded
    if (positions.size > 0 && recipesStore.allBlockchainRecipes.length > 0) {
      try {
        const blockchainMatch = recipesStore.matchBlockchainRecipe(positions);
        if (blockchainMatch) {
      // Convert blockchain recipe to a format compatible with the UI
      // Create a result Item from outputIngredient
      let resultItem: Item | null = null;
      if (blockchainMatch.outputIngredient?.metadata) {
        const metadata = blockchainMatch.outputIngredient.metadata;
        resultItem = {
          id: `token_${blockchainMatch.outputIngredient.tokenId}`,
          name: metadata.name || `Token ${blockchainMatch.outputIngredient.tokenId}`,
          description: metadata.description || blockchainMatch.description || '',
          icon: metadata.category === 'weapon' ? '⚔️' : metadata.category === 'tool' ? '⛏️' : metadata.category === 'armor' ? '🛡️' : '📦',
          metadata: {
            name: metadata.name || `Token ${blockchainMatch.outputIngredient.tokenId}`,
            image: metadata.image || '',
            price: 0
          },
          rarity: 'common' as any,
          category: (metadata.category as any) || 'material'
        };
      } else {
        // Fallback if no outputIngredient metadata
        resultItem = {
          id: `token_${blockchainMatch.resultTokenId}`,
          name: blockchainMatch.name,
          description: blockchainMatch.description || '',
          icon: blockchainMatch.category === 'weapon' ? '⚔️' : blockchainMatch.category === 'tool' ? '⛏️' : blockchainMatch.category === 'armor' ? '🛡️' : '📦',
          metadata: {
            name: blockchainMatch.name,
            image: '',
            price: 0
          },
          rarity: 'common' as any,
          category: (blockchainMatch.category as any) || 'material'
        };
      }
      
      // Return a Recipe-like object for compatibility
      return {
        id: blockchainMatch.blockchainRecipeId,
        name: blockchainMatch.name,
        description: blockchainMatch.description || '',
        result: resultItem!,
        ingredients: blockchainMatch.ingredients.map(ing => ({
          item: {
            id: `token_${ing.tokenId}`,
            name: ing.metadata?.name || `Token ${ing.tokenId}`,
            description: ing.metadata?.description || '',
            icon: ing.metadata?.category === 'weapon' ? '⚔️' : ing.metadata?.category === 'tool' ? '⛏️' : '📦',
            metadata: {
              name: ing.metadata?.name || `Token ${ing.tokenId}`,
              image: ing.metadata?.image || '',
              price: 0
            },
            rarity: 'common' as any,
            category: (ing.metadata?.category as any) || 'material'
          },
          quantity: ing.amount
        })),
        // Build grid from recipe pattern for display - align with recipe positions
        grid: (() => {
          const recipeGrid2D: (Item | null)[][] = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
          ];
          
          // Map recipe ingredients to their positions in the 2D grid
          blockchainMatch.ingredients.forEach(ingredient => {
            if (ingredient.position >= 0 && ingredient.position < 9) {
              const row = Math.floor(ingredient.position / 3);
              const col = ingredient.position % 3;
              
              // Find the item from userBalance that matches this ingredient
              const matchingItem = inventoryStore.userBalance.find(item => {
                const itemTokenId = (item as any).tokenId || parseInt(item.id.replace('token_', ''), 10);
                const itemContract = (item as any).tokenContract || CONTRACTS.workbench;
                return itemTokenId === ingredient.tokenId && 
                       itemContract.toLowerCase() === ingredient.tokenContract.toLowerCase();
              });
              
              // Use matching item from balance, or create a placeholder item
              if (matchingItem) {
                recipeGrid2D[row][col] = matchingItem;
              } else {
                // Create a placeholder item from ingredient metadata
                recipeGrid2D[row][col] = {
                  id: `token_${ingredient.tokenId}`,
                  name: ingredient.metadata?.name || `Token ${ingredient.tokenId}`,
                  description: ingredient.metadata?.description || '',
                  icon: ingredient.metadata?.category === 'weapon' ? '⚔️' : ingredient.metadata?.category === 'tool' ? '⛏️' : '📦',
                  metadata: {
                    name: ingredient.metadata?.name || `Token ${ingredient.tokenId}`,
                    image: ingredient.metadata?.image || '',
                    price: 0
                  },
                  rarity: 'common' as any,
                  category: (ingredient.metadata?.category as any) || 'material'
                };
              }
            }
          });
          
          return recipeGrid2D;
        })()
      } as any;
        }
      } catch (matchError) {
        // Silently fail if matching fails - might be due to invalid data
        console.warn('Error matching blockchain recipe:', matchError);
      }
    }
    
    return null;
  } catch (error) {
    // Catch any errors in computed property to prevent breaking the UI
    console.warn('Error in matchedRecipe computed property:', error);
    return null;
  }
});

const canCraft = computed(() => {
  return matchedRecipe.value !== null;
});

// Painting Mode Methods
const startPainting = (event: MouseEvent, item: Item) => {
  if (!inventoryStore.hasItem(item.id, 1)) return;
  
  isPainting.value = true;
  paintingItem.value = item;
  paintedCells.value.clear();
};

const stopPainting = () => {
  isPainting.value = false;
  paintingItem.value = null;
  paintedCells.value.clear();
};

// Helper to check if user has resource available
const hasResourceAvailable = (item: Item, quantity: number = 1): boolean => {
  // Check if item exists in user's balance
  const resource = inventoryStore.userBalance.find(r => r.id === item.id);
  if (!resource) return false;
  
  // Get current balance
  const balance = parseInt((resource as any).balance || '0', 10);
  
  // Count how many of this item are already in the grid
  const usedInGrid = craftingGrid.value.filter(cell => cell?.id === item.id).length;
  
  // Check if we have enough available (balance - already used in grid >= quantity needed)
  return balance - usedInGrid >= quantity;
};

// Helper to get available quantity of a resource
const getAvailableQuantity = (item: Item): number => {
  const resource = inventoryStore.userBalance.find(r => r.id === item.id);
  if (!resource) return 0;
  
  const balance = parseInt((resource as any).balance || '0', 10);
  const usedInGrid = craftingGrid.value.filter(cell => cell?.id === item.id).length;
  
  return Math.max(0, balance - usedInGrid);
};

const paintCell = (index: number) => {
  if (!isPainting.value || !paintingItem.value) return;
  if (paintedCells.value.has(index)) return; // Already painted this cell

  // Check if user has the resource available
  if (!hasResourceAvailable(paintingItem.value, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${paintingItem.value.name} available`
    });
    return;
  }

  // If cell is occupied, the old item will be freed (it's already counted in balance)
  // No need to do anything - the item is just replaced

  // Place new item in cell (only if user has it available)
  craftingGrid.value[index] = paintingItem.value;
  paintedCells.value.add(index);
};

// Resource drag handlers (from catalog)
const onResourceDragStart = (event: DragEvent, item: Item) => {
  isDragging.value = true;
  draggedItem.value = item;
  draggedFromCellIndex.value = null; // From resources catalog
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'; // Copy from resources
    event.dataTransfer.setData('text/plain', item.id);
  }
};

const onResourceMouseDown = (event: MouseEvent, item: Item) => {
  // Only start painting on left click AND if not dragging
  if (event.button === 0 && !isDragging.value) {
    // Don't prevent default here - let drag start first
    // We'll start painting after a small delay if user is still holding
    setTimeout(() => {
      // Check if user is still holding mouse down and not dragging
      if (!isDragging.value && event.buttons === 1) {
        startPaintingResource(event, item);
      }
    }, 150); // Small delay to allow drag to start
  }
};

const selectResource = (item: Item) => {
  // Check if user has the resource available
  if (!hasResourceAvailable(item, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${item.name} available. You have ${getAvailableQuantity(item)} available.`
    });
    return;
  }

  const emptyIndex = craftingGrid.value.findIndex(slot => slot === null);
  if (emptyIndex !== -1) {
    craftingGrid.value[emptyIndex] = item;
  } else {
    toastStore.showToast({
      type: 'info',
      message: 'Crafting grid is full'
    });
  }
};

const startPaintingResource = (event: MouseEvent, item: Item) => {
  // Check if user has the resource available before starting painting
  if (!hasResourceAvailable(item, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${item.name} available. You have ${getAvailableQuantity(item)} available.`
    });
    return;
  }
  
  isPainting.value = true;
  paintingItem.value = item;
  paintedCells.value.clear();
};

const onInventoryItemMouseDown = (event: MouseEvent, item: Item) => {
  // Only start painting on left click AND if not dragging
  if (event.button === 0 && !isDragging.value) {
    // Don't prevent default here - let drag start first
    // We'll start painting after a small delay if user is still holding
    setTimeout(() => {
      // Check if user is still holding mouse down and not dragging
      if (!isDragging.value && event.buttons === 1) {
        startPainting(event, item);
      }
    }, 150); // Small delay to allow drag to start
  }
};

const onCellMouseEnter = (index: number) => {
  if (isPainting.value) {
    paintCell(index);
  }
};

const onCellMouseDown = (event: MouseEvent, index: number) => {
  if (isPainting.value) {
    event.preventDefault();
    paintCell(index);
  }
};

// Drag and Drop Methods
const onDragStart = (event: DragEvent, item: Item) => {
  isDragging.value = true;
  draggedItem.value = item;
  draggedFromCellIndex.value = null; // From inventory
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
  }
};

const onCellDragStart = (event: DragEvent, index: number) => {
  isDragging.value = true;
  draggedItem.value = craftingGrid.value[index];
  draggedFromCellIndex.value = index; // From cell
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', craftingGrid.value[index]?.id || '');
  }
};

const onDragEnd = () => {
  isDragging.value = false;
  draggedItem.value = null;
  draggedFromCellIndex.value = null;
  dragOverIndex.value = null;
  isOverTrash.value = false;
};

const onDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
};

const onDragLeave = (index: number) => {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
};

const onDrop = (event: DragEvent, index: number) => {
  event.preventDefault();
  dragOverIndex.value = null;

  if (!draggedItem.value) return;

  // Dragging from a crafting cell to another cell
  if (draggedFromCellIndex.value !== null) {
    const fromIndex = draggedFromCellIndex.value;
    
    // Don't do anything if dropping on the same cell
    if (fromIndex === index) {
      isDragging.value = false;
      draggedItem.value = null;
      draggedFromCellIndex.value = null;
      return;
    }

    // Swap items between cells
    const temp = craftingGrid.value[index];
    craftingGrid.value[index] = craftingGrid.value[fromIndex];
    craftingGrid.value[fromIndex] = temp;
  } 
  // Dragging from resources catalog to crafting grid (check availability)
  else {
    // Check if user has the resource available
    if (!hasResourceAvailable(draggedItem.value, 1)) {
      toastStore.showToast({
        type: 'warning',
        message: `Not enough ${draggedItem.value.name} available. You have ${getAvailableQuantity(draggedItem.value)} available.`
      });
      isDragging.value = false;
      draggedItem.value = null;
      draggedFromCellIndex.value = null;
      return;
    }

    // If cell is occupied, the old item will be freed (it's already counted in balance)
    // No need to do anything - the item is just replaced
    
    // Place new item in cell (only if user has it available)
    craftingGrid.value[index] = draggedItem.value;
  }

  isDragging.value = false;
  draggedItem.value = null;
  draggedFromCellIndex.value = null;
};

const getCellClass = (cell: Item | null, index: number) => {
  const classes = [];
  
  // Base classes
  if (cell) {
    classes.push('border-emerald-400 bg-slate-700');
    
    // Add opacity if this cell is being dragged
    if (isDragging.value && draggedFromCellIndex.value === index) {
      classes.push('opacity-50');
    }
  } else {
    classes.push('border-slate-600 bg-slate-900');
    
    if (!isDragging.value) {
      classes.push('hover:border-slate-500');
    }
  }
  
  // Highlight drop target
  if (dragOverIndex.value === index && isDragging.value) {
    classes.push('border-emerald-400 bg-slate-800 scale-105 shadow-lg shadow-emerald-500/50');
  }
  
  return classes.join(' ');
};

// Trash zone methods
const onTrashDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  isOverTrash.value = true;
};

const onTrashDragLeave = () => {
  isOverTrash.value = false;
};

const onTrashDrop = (event: DragEvent) => {
  event.preventDefault();
  isOverTrash.value = false;

  // Only handle drops from crafting grid cells
  if (draggedFromCellIndex.value !== null) {
    const fromIndex = draggedFromCellIndex.value;
    const item = craftingGrid.value[fromIndex];
    
    if (item) {
      // Remove item from grid (it's deleted, not returned to inventory)
      craftingGrid.value[fromIndex] = null;
      
      toastStore.showToast({
        type: 'info',
        message: `Deleted ${item.name}`
      });
    }
  }

  isDragging.value = false;
  draggedItem.value = null;
  draggedFromCellIndex.value = null;
};

// Methods
const selectInventoryItem = (item: Item) => {
  const emptyIndex = craftingGrid.value.findIndex(slot => slot === null);
  if (emptyIndex !== -1 && inventoryStore.hasItem(item.id, 1)) {
    craftingGrid.value[emptyIndex] = item;
    inventoryStore.removeItem(item.id, 1);
  }
};

const clearCraftingGrid = () => {
  craftingGrid.value.forEach(item => {
    if (item) {
      inventoryStore.addItem(item, 1);
    }
  });
  craftingGrid.value = new Array(9).fill(null);
};

const craftItem = () => {
  if (!matchedRecipe.value) return;

  // Clear grid
  craftingGrid.value = new Array(9).fill(null);

  // Add result to inventory
  inventoryStore.addItem(matchedRecipe.value.result, 1);

  // Show notification
  toastStore.showToast({
    type: 'success',
    message: `Crafted ${matchedRecipe.value.result.name}!`
  });

  // Add to notification bar
  notifications.value.unshift({
    type: 'success',
    message: `"Crafted ${matchedRecipe.value.result.name} x1"`
  });
  if (notifications.value.length > 5) {
    notifications.value.pop();
  }
};

// Handle image loading errors - fallback to icon
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // Hide the image and show fallback icon
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    // Check if fallback already exists
    if (!parent.querySelector('.fallback-icon')) {
      const fallback = document.createElement('span');
      fallback.className = 'text-2xl fallback-icon';
      // Get icon from resource data attribute or use default
      const resourceId = (img.closest('[draggable="true"]') as HTMLElement)?.dataset?.resourceId;
      if (resourceId) {
        const resource = filteredResources.value.find(r => r.id === resourceId);
        if (resource) {
          fallback.textContent = resource.icon;
        }
      }
      if (!fallback.textContent) {
        fallback.textContent = '📦';
      }
      parent.appendChild(fallback);
    }
  }
};

// Handle image errors in crafting grid cells
const handleCellImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    if (!parent.querySelector('.fallback-icon')) {
      const fallback = document.createElement('span');
      fallback.className = 'text-5xl fallback-icon select-none';
      // Try to find the cell item to get icon
      const cellIndex = Array.from(parent.parentElement?.children || []).indexOf(parent);
      if (cellIndex !== -1 && craftingGrid.value[cellIndex]) {
        fallback.textContent = craftingGrid.value[cellIndex]?.icon || '📦';
      } else {
        fallback.textContent = '📦';
      }
      parent.appendChild(fallback);
    }
  }
};

// Handle image errors in result preview
const handleResultImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && matchedRecipe.value) {
    if (!parent.querySelector('.fallback-icon')) {
      const fallback = document.createElement('span');
      fallback.className = 'text-6xl fallback-icon select-none';
      fallback.textContent = matchedRecipe.value.result.icon || '📦';
      parent.appendChild(fallback);
    }
  }
};

// Handle image errors in painting mode indicator
const handlePaintingImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && paintingItem.value) {
    if (!parent.querySelector('.fallback-icon')) {
      const fallback = document.createElement('span');
      fallback.className = 'text-white text-base fallback-icon';
      fallback.textContent = paintingItem.value.icon || '📦';
      parent.appendChild(fallback);
    }
  }
};

const handleAutofillRecipe = async (recipe: Recipe | BlockchainRecipe) => {
  // Handle blockchain recipes
  if ('blockchainRecipeId' in recipe) {
    await autofillBlockchainRecipe(recipe);
    return;
  }

  // Use existing autofill for legacy recipes
  autofillRecipe(recipe as Recipe);
};

const autofillBlockchainRecipe = async (recipe: BlockchainRecipe) => {
  clearCraftingGrid();
  
  // Get user's balance to find matching items
  const userBalance = inventoryStore.userBalance;
  const { CONTRACTS } = await import('@/config/wallet');
  
  // Fill grid according to recipe pattern positions (0-8)
  for (const ingredient of recipe.ingredients) {
    // Find matching item in user's balance
    const balanceItem = userBalance.find(item => {
      const itemTokenId = (item as any).tokenId || parseInt(item.id.replace('token_', ''), 10);
      const itemContract = (item as any).tokenContract || CONTRACTS.workbench;
      
      return itemTokenId === ingredient.tokenId && 
             itemContract.toLowerCase() === ingredient.tokenContract.toLowerCase() &&
             parseInt((item as any).balance || '0', 10) >= ingredient.amount;
    });
    
    if (balanceItem && ingredient.position >= 0 && ingredient.position < 9) {
      // Place item at the recipe's specified position
      craftingGrid.value[ingredient.position] = balanceItem;
    }
  }

  toastStore.showToast({
    type: 'info',
    message: `Autofilled ${recipe.name} recipe`
  });
};

const autofillRecipe = (recipe: Recipe) => {
  clearCraftingGrid();
  
  // Fill grid with recipe pattern
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const item = recipe.grid[i][j];
      if (item && inventoryStore.hasItem(item.id, 1)) {
        craftingGrid.value[i * 3 + j] = item;
        inventoryStore.removeItem(item.id, 1);
      }
    }
  }

  toastStore.showToast({
    type: 'info',
    message: `Autofilled ${recipe.name} recipe`
  });
};

// Global mouse up handler to stop painting
if (typeof window !== 'undefined') {
  window.addEventListener('mouseup', stopPainting);
}

</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1e293b;
}

::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Drag and drop animations */
[draggable="true"] {
  user-select: none;
  -webkit-user-drag: element;
}

[draggable="true"]:active {
  cursor: grabbing !important;
}

/* Smooth transitions for grid cells */
.grid > div {
  transform-origin: center;
}

/* Pulse animation for drop zone */
@keyframes pulse-border {
  0%, 100% {
    border-color: rgb(16, 185, 129);
  }
  50% {
    border-color: rgb(52, 211, 153);
  }
}

/* Slide down animation for recipe details */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
</style>
