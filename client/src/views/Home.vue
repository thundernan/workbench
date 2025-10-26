<template>
  <div class="workbench-layout bg-slate-900 min-h-screen flex flex-col text-sm font-mono">
    <!-- Header -->
    <AppHeader ref="appHeaderRef" />

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
          <!-- MOCKED: No loading or error states -->
          <!-- Item Cards -->
          <div class="space-y-3">
            <div 
              v-for="invItem in filteredInventoryItems" 
              :key="invItem.item.id"
              :draggable="!isPainting"
              @dragstart="onDragStart($event, invItem.item)"
              @dragend="onDragEnd"
              @mousedown="onInventoryItemMouseDown($event, invItem.item)"
              class="flex items-center gap-3 p-2 border border-slate-600 rounded bg-slate-700 hover:border-emerald-400 transition-colors"
              :class="{ 
                'opacity-50': isDragging && draggedItem?.id === invItem.item.id,
                'border-emerald-400 shadow-lg shadow-emerald-500/50': isPainting && paintingItem?.id === invItem.item.id,
                'cursor-move': !isPainting,
                'cursor-crosshair': isPainting
              }"
              @click="selectInventoryItem(invItem.item)"
            >
              <div class="text-2xl select-none">{{ invItem.item.icon }}</div>
              <div class="flex-1 text-xs">
                <div class="text-white">{{ invItem.item.name }}</div>
                <div class="text-slate-400">{{ invItem.item.category }}</div>
              </div>
              <div class="text-emerald-400 font-bold">{{ invItem.quantity }}</div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredInventoryItems.length === 0" class="text-center py-12 px-4">
            <div class="text-5xl mb-3">📦</div>
            <div class="text-white font-semibold mb-2">No Resources</div>
            <div class="text-slate-400 text-xs mb-4">Your inventory is empty</div>
            <button
              @click="$router.push('/shop')"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              🏪 Go to Shop
            </button>
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
            <span class="text-white">{{ paintingItem?.icon }}</span>
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
                     class="w-28 h-28 border-2 rounded-lg flex items-center justify-center text-5xl transition-all duration-200"
                     :class="getCellClass(cell, index)"
                     :style="{ cursor: isPainting ? 'crosshair' : (cell ? 'move' : 'pointer') }"
                 >
                   <span v-if="cell" class="select-none">{{ cell.icon }}</span>
                   <span v-else class="text-slate-600 text-sm">[ ]</span>
                 </div>
               </div>

            </div>
             <!-- Result Preview -->
             <div class="flex flex-col items-center justify-between border-2 border-slate-700 rounded-lg bg-slate-800 p-5" style="width: 260px; height: 357px;">
               <div class="text-slate-400 text-sm font-medium">→ Result</div>
               <div class="w-36 h-36 border-2 rounded-lg flex items-center justify-center text-6xl transition-all duration-200"
                    :class="matchedRecipe ? 'border-emerald-400 bg-slate-700 shadow-lg shadow-emerald-500/30' : 'border-slate-600 bg-slate-900'">
                 <!-- Image icon -->
                 <img 
                   v-if="matchedRecipe && matchedRecipe.result.icon && matchedRecipe.result.icon.startsWith('/')" 
                   :src="matchedRecipe.result.icon" 
                   :alt="matchedRecipe.result.name"
                   class="w-full h-full object-contain p-2"
                 />
                 <!-- Emoji icon -->
                 <span v-else-if="matchedRecipe" class="select-none">{{ matchedRecipe.result.icon }}</span>
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
            :disabled="!canCraft || isCrafting"
            class="px-8 py-3 rounded-lg text-sm transition-all duration-200 font-semibold relative"
            :class="canCraft && !isCrafting ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
          >
            <span v-if="isCrafting" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Crafting...
            </span>
            <span v-else>
              {{ canCraft ? '⚡ Craft Item' : '✗ No match' }}
            </span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import RecipeBook from '@/components/RecipeBook.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import { useWalletStore } from '@/stores/wallet';
import type { Item, Recipe, BlockchainRecipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();
const walletStore = useWalletStore();

// Initialize data
// MOCKED: Initialize only with pickaxe and wooden sword recipes
recipesStore.initializeRecipes();

// Filter to keep only pickaxe and wooden sword
recipesStore.recipes = recipesStore.recipes.filter(recipe => 
  recipe.id === 'stone_pickaxe' || recipe.id === 'wooden_sword'
);

// Don't initialize sample items - start with empty inventory
console.log('🎮 Running in MOCK mode - 2 recipes (pickaxe, sword), empty inventory');

// Reference to AppHeader component
const appHeaderRef = ref<InstanceType<typeof AppHeader> | null>(null);

// COMMENTED OUT: Blockchain inventory loading
// const loadUserInventory = async () => {
//   if (!walletStore.address) {
//     console.warn('⚠️ No wallet address available');
//     return;
//   }
//   
//   try {
//     await inventoryStore.loadBlockchainInventory(walletStore.address);
//     toastStore.showToast({
//       type: 'success',
//       message: `Loaded ${inventoryStore.items.length} items from blockchain`
//     });
//   } catch (error: any) {
//     console.error('Failed to load blockchain inventory:', error);
//     toastStore.showToast({
//       type: 'error',
//       message: 'Failed to load inventory from blockchain'
//     });
//     // Fallback to sample items
//     inventoryStore.initializeSampleItems();
//   }
// };

// COMMENTED OUT: Watch for wallet connection changes
// watch(() => walletStore.connected, async (isConnected, wasConnected) => {
//   if (isConnected && !wasConnected && walletStore.address) {
//     // Wallet just connected, load inventory
//     console.log('✅ Wallet connected, loading inventory...');
//     await loadUserInventory();
//   } else if (!isConnected && wasConnected) {
//     // Wallet disconnected, clear inventory
//     console.log('❌ Wallet disconnected, clearing inventory...');
//     inventoryStore.clearBlockchainInventory();
//     inventoryStore.initializeSampleItems();
//   }
// });

// COMMENTED OUT: Watch for wallet address changes (account switching)
// watch(() => walletStore.address, async (newAddress, oldAddress) => {
//   if (newAddress && oldAddress && newAddress !== oldAddress && walletStore.connected) {
//     // Account switched, reload inventory
//     console.log('🔄 Account switched, reloading inventory...');
//     toastStore.showToast({
//       type: 'info',
//       message: `Switched to ${walletStore.shortAddress}`
//     });
//     await loadUserInventory();
//   }
// });

// MOCKED: Simplified mount - no blockchain loading
onMounted(async () => {
  // Check wallet connection
  await walletStore.checkConnection();
  
  // If wallet not connected, show wallet modal after a small delay
  setTimeout(() => {
    if (!walletStore.connected) {
      console.log('💰 Wallet not connected - showing wallet modal');
      appHeaderRef.value?.openWalletModal();
    }
  }, 500);
  
  // Start with empty inventory but with 2 recipes
  console.log('📦 Starting with empty inventory');
  console.log('📚 Mocked recipes loaded:', recipesStore.recipes.length, 'recipes');
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
  // First try regular recipes
  const grid2D = [
    [craftingGrid.value[0], craftingGrid.value[1], craftingGrid.value[2]],
    [craftingGrid.value[3], craftingGrid.value[4], craftingGrid.value[5]],
    [craftingGrid.value[6], craftingGrid.value[7], craftingGrid.value[8]]
  ];
  const regularMatch = recipesStore.matchRecipe(grid2D);
  if (regularMatch) return regularMatch;

  // Try blockchain recipes
  const gridPositions = new Map<number, { tokenContract: string; tokenId: number }>();
  craftingGrid.value.forEach((item, index) => {
    if (item && item.tokenId !== undefined && item.tokenContract) {
      gridPositions.set(index, {
        tokenContract: item.tokenContract,
        tokenId: item.tokenId
      });
    }
  });

  const blockchainMatch = recipesStore.matchBlockchainRecipe(gridPositions);
  if (blockchainMatch) {
    // Convert blockchain recipe to regular recipe format for UI
    return {
      id: blockchainMatch.id || blockchainMatch._id || '',
      name: blockchainMatch.name,
      description: blockchainMatch.description || '',
      result: {
        id: `token_${blockchainMatch.resultTokenId}`,
        name: blockchainMatch.result?.name || blockchainMatch.name,
        description: blockchainMatch.result?.description || blockchainMatch.description || '',
        icon: blockchainMatch.result?.icon || '📦',
        rarity: 'rare' as const,
        category: 'material' as const,
        tokenId: blockchainMatch.resultTokenId,
        tokenContract: blockchainMatch.resultTokenContract
      },
      ingredients: [],
      grid: grid2D
    };
  }

  return null;
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

const paintCell = (index: number) => {
  if (!isPainting.value || !paintingItem.value) return;
  if (paintedCells.value.has(index)) return; // Already painted this cell
  if (!inventoryStore.hasItem(paintingItem.value.id, 1)) {
    stopPainting();
    toastStore.showToast({
      type: 'warning',
      message: `No more ${paintingItem.value.name} in inventory`
    });
    return;
  }

  // If cell is occupied, return old item to inventory
  if (craftingGrid.value[index]) {
    const existingItem = craftingGrid.value[index];
    inventoryStore.addItem(existingItem!, 1);
  }

  // Place new item in cell
  craftingGrid.value[index] = paintingItem.value;
  inventoryStore.removeItem(paintingItem.value.id, 1);
  paintedCells.value.add(index);
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
  // Dragging from inventory to crafting grid
  else {
    // Check if item exists in inventory
    if (inventoryStore.hasItem(draggedItem.value.id, 1)) {
      // If cell is occupied, return old item to inventory
      if (craftingGrid.value[index]) {
        const existingItem = craftingGrid.value[index];
        inventoryStore.addItem(existingItem!, 1);
      }
      
      // Place new item in cell
      craftingGrid.value[index] = draggedItem.value;
      inventoryStore.removeItem(draggedItem.value.id, 1);
    }
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
      // Return item to inventory
      inventoryStore.addItem(item, 1);
      // Remove item from grid
      craftingGrid.value[fromIndex] = null;
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

const isCrafting = ref(false);

const craftItem = async () => {
  if (!matchedRecipe.value || isCrafting.value) return;

  // Check if wallet is connected
  if (!walletStore.connected) {
    toastStore.showToast({
      type: 'warning',
      message: 'Please connect your wallet to craft items'
    });
    return;
  }

  isCrafting.value = true;

  // Prepare crafting transaction
  const craftingTx = {
    recipeId: matchedRecipe.value.id || 'unknown',
    ingredients: craftingGrid.value
      .filter(item => item !== null)
      .map(item => ({
        tokenContract: item.tokenContract || '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        tokenId: item.tokenId || 0,
        amount: 1
      }))
  };

  // Send transaction to MetaMask
  const txHash = await walletStore.sendCraftTx(craftingTx);

  // Wait for confirmation (simulate for now)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Clear grid
  craftingGrid.value = new Array(9).fill(null);

  // Add result to inventory
  inventoryStore.addItem(matchedRecipe.value.result, 1);

  // Show success notification
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

  isCrafting.value = false;
};

// Handler for RecipeBook component autofill
const handleAutofillRecipe = (recipe: Recipe | BlockchainRecipe) => {
  // For now, just show a toast for blockchain recipes
  if ('blockchainRecipeId' in recipe) {
    toastStore.showToast({
      type: 'info',
      message: `Recipe: ${recipe.name} (blockchain recipe - grid autofill coming soon)`
    });
    return;
  }

  // Use existing autofill for legacy recipes
  autofillRecipe(recipe as Recipe);
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
