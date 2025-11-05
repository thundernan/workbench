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
              <div class="text-2xl select-none">{{ resource.icon }}</div>
              <div class="flex-1 text-xs">
                <div class="text-white">{{ resource.name }}</div>
                <div class="text-slate-400">{{ resource.category }}</div>
              </div>
              <div class="text-emerald-400 font-bold">{{ (resource as any).balance || '0' }}</div>
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
                 <span v-if="matchedRecipe" class="select-none">{{ matchedRecipe.result.icon }}</span>
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
import type { Item, Recipe, BlockchainRecipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();
const walletStore = useWalletStore();

// Initialize data
inventoryStore.initializeSampleItems();
recipesStore.initializeRecipes();

// Check wallet connection on mount and load balance if connected
onMounted(async () => {
  await walletStore.checkConnection();
  
  if (walletStore.connected && walletStore.address) {
    try {
      await inventoryStore.loadUserBalance(walletStore.address);
    } catch (error) {
      console.error('Failed to load balance on mount:', error);
    }
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
  const grid2D = [
    [craftingGrid.value[0], craftingGrid.value[1], craftingGrid.value[2]],
    [craftingGrid.value[3], craftingGrid.value[4], craftingGrid.value[5]],
    [craftingGrid.value[6], craftingGrid.value[7], craftingGrid.value[8]]
  ];
  return recipesStore.matchRecipe(grid2D);
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

  // If cell is occupied, return old item to inventory
  if (craftingGrid.value[index]) {
    const existingItem = craftingGrid.value[index];
    if (existingItem) {
      inventoryStore.addItem(existingItem, 1);
    }
  }

  // Place new item in cell (infinite from resources catalog)
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
  const emptyIndex = craftingGrid.value.findIndex(slot => slot === null);
  if (emptyIndex !== -1) {
    craftingGrid.value[emptyIndex] = item;
  }
};

const startPaintingResource = (event: MouseEvent, item: Item) => {
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
  // Dragging from resources catalog to crafting grid (infinite supply)
  else {
    // If cell is occupied, return old item to inventory
    if (craftingGrid.value[index]) {
      const existingItem = craftingGrid.value[index];
      if (existingItem) {
        inventoryStore.addItem(existingItem, 1);
      }
    }
    
    // Place new item in cell (from catalog, infinite supply)
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
