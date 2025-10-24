<template>
  <div class="workbench-layout bg-slate-900 min-h-screen flex flex-col text-sm font-mono">
    <!-- Header -->
    <header class="bg-slate-800 border-b-2 border-slate-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="text-emerald-400 font-bold">Workbench</div>
          <div class="flex gap-3 text-xs">
            <button class="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              [Craft]
            </button>
            <button class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors">
              [Trade]
            </button>
            <button class="px-3 py-1 rounded border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors">
              [Profile]
            </button>
          </div>
        </div>
        <button class="px-4 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs">
          [Connect Wallet]
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-4 p-4 overflow-hidden">
      <!-- Left Panel - Inventory -->
      <div class="w-80 flex flex-col border-2 border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
        <div class="px-4 py-2 border-b-2 border-slate-700 text-emerald-400 font-semibold">
          Inventory
        </div>
        <div class="flex-1 p-4 overflow-y-auto">
          <!-- Item Cards -->
          <div class="space-y-3 mb-6">
            <div 
              v-for="invItem in inventoryStore.items" 
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

          <!-- Filter/Search Section -->
          <div class="text-slate-500 text-xs border-t border-slate-700 pt-4 mt-2">
            [item cards with counts & filter/search]
          </div>
          <div class="text-slate-500 text-xs mt-3">
            [quick add / favorite / categories]
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
        <div class="px-4 py-2 border-b-2 border-slate-700 text-emerald-400 font-semibold">
          Recipe
        </div>
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="text-slate-500 text-xs mb-4">[recipes]</div>
          
          <!-- Recipe Cards -->
          <div class="space-y-4">
            <div 
              v-for="recipe in recipesStore.allRecipes" 
              :key="recipe.id"
              class="border border-slate-600 rounded bg-slate-700 p-3 hover:border-emerald-400 transition-colors cursor-pointer"
              @click="selectRecipe(recipe)"
            >
              <div class="flex items-center gap-2 mb-2">
                <div class="text-xl">{{ recipe.result.icon }}</div>
                <div class="flex-1 text-xs">
                  <div class="text-white">{{ recipe.name }}</div>
                  <div class="text-slate-400">{{ recipe.ingredients.length }} ingredients</div>
                </div>
                <button 
                  @click.stop="autofillRecipe(recipe)"
                  class="text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Autofill"
                >
                  ⚡
                </button>
              </div>

              <!-- Mini Grid Preview -->
              <div class="grid grid-cols-3 gap-1 mb-3 mt-1">
                <div 
                  v-for="(cell, idx) in getRecipeGridFlat(recipe)" 
                  :key="idx"
                  class="aspect-square rounded border flex items-center justify-center text-xs"
                  :class="cell ? 'border-slate-500 bg-slate-600' : 'border-slate-700 bg-slate-800'"
                >
                  <span v-if="cell" class="text-sm">{{ cell.icon }}</span>
                  <span v-else class="text-slate-700">-</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="flex gap-2 text-xs">
                <span class="px-2 py-0.5 rounded bg-blue-900 text-blue-300">[preview]</span>
                <span class="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300">[learned]</span>
              </div>
            </div>
        </div>

          <div class="text-slate-500 text-xs mt-6 border-t border-slate-700 pt-4">
            [autofill]
        </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Notification Bar -->
    <div class="bg-slate-800 border-t-2 border-slate-700 px-6 py-4">
      <div class="text-slate-400 text-xs mb-1">
        Notification/Toasts
      </div>
      <div class="flex gap-3 mt-3 text-xs flex-wrap">
        <div 
          v-for="(notification, idx) in notifications" 
          :key="idx"
          class="px-3 py-1 rounded"
          :class="getNotificationClass(notification.type)"
        >
          {{ notification.message }}
      </div>
    </div>
    </div>

    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import type { Item, Recipe } from '@/types';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();

// Initialize data
inventoryStore.initializeSampleItems();
recipesStore.initializeRecipes();

// Crafting grid state
const craftingGrid = ref<(Item | null)[]>(new Array(9).fill(null));
const selectedRecipe = ref<Recipe | null>(null);

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
  
  // Prevent drag when starting painting
  event.preventDefault();
  
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
  if (craftingGrid.value[index]) return; // Cell is occupied
  if (!inventoryStore.hasItem(paintingItem.value.id, 1)) {
    stopPainting();
    toastStore.showToast({
      type: 'warning',
      message: `No more ${paintingItem.value.name} in inventory`
    });
    return;
  }

  // Place item in cell
  craftingGrid.value[index] = paintingItem.value;
  inventoryStore.removeItem(paintingItem.value.id, 1);
  paintedCells.value.add(index);
};

const onInventoryItemMouseDown = (event: MouseEvent, item: Item) => {
  // Only start painting on left click
  if (event.button === 0) {
    startPainting(event, item);
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
      // If cell is empty, place item
      if (!craftingGrid.value[index]) {
        craftingGrid.value[index] = draggedItem.value;
        inventoryStore.removeItem(draggedItem.value.id, 1);
      } 
      // If cell is occupied, swap items
      else {
        const existingItem = craftingGrid.value[index];
        craftingGrid.value[index] = draggedItem.value;
        inventoryStore.removeItem(draggedItem.value.id, 1);
        inventoryStore.addItem(existingItem!, 1);
      }
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

const removeCraftingCell = (index: number) => {
  if (craftingGrid.value[index]) {
    inventoryStore.addItem(craftingGrid.value[index]!, 1);
    craftingGrid.value[index] = null;
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

const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
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

const getRecipeGridFlat = (recipe: Recipe) => {
  const flat: (Item | null)[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      flat.push(recipe.grid[i][j]);
    }
  }
  return flat;
};

const getNotificationClass = (type: string) => {
  switch (type) {
    case 'success': return 'bg-emerald-900 text-emerald-300 border border-emerald-700';
    case 'warning': return 'bg-yellow-900 text-yellow-300 border border-yellow-700';
    case 'info': return 'bg-blue-900 text-blue-300 border border-blue-700';
    case 'error': return 'bg-red-900 text-red-300 border border-red-700';
    default: return 'bg-slate-700 text-slate-300 border border-slate-600';
  }
};
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
</style>