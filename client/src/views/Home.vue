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
              :key="resource.tokenId"
              :draggable="true"
              :data-resource-id="resource.tokenId"
              @dragstart="onResourceDragStart($event, resource)"
              @dragend="onDragEnd"
              class="flex items-center gap-3 p-2 border border-slate-600 rounded bg-slate-700 hover:border-emerald-400 transition-colors cursor-move"
              :class="{ 
                'opacity-50': isDragging && draggedItem?.tokenId === resource.tokenId,
                'border-emerald-400 shadow-lg shadow-emerald-500/50': paintingItem?.tokenId === resource.tokenId
              }"
              @click="togglePaintingResource(resource)"
            >
              <!-- Display image if available, otherwise use icon -->
              <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center select-none">
                <img 
                  v-if="resource.metadata?.image" 
                  :src="resource.metadata.image" 
                  :alt="resource.metadata.name"
                  class="w-full h-full object-contain rounded"
                  @error="handleImageError($event)"
                />
                <span v-else class="text-2xl">{{ resource.metadata.image }}</span>
              </div>
              <div class="flex-1 text-xs min-w-0">
                <div class="text-white truncate">{{ resource.metadata.name }}</div>
                <div class="text-slate-400 truncate">{{ resource.metadata.category }}</div>
                <div v-if="resource.metadata.description" class="text-slate-500 text-xs truncate">{{ resource.metadata.description }}</div>
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
                :alt="paintingItem.metadata.name"
                class="w-full h-full object-contain"
                @error="handlePaintingImageError($event)"
              />
              <span v-else class="text-white text-base">{{ '📦' }}</span>
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
              <div class="grid grid-cols-3 gap-3" ref="craftingGridRef">
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
                     :style="{ cursor: paintingItem ? 'crosshair' : (cell ? 'move' : 'pointer') }"
                 >
                   <!-- Display image if available, otherwise use icon -->
                   <template v-if="cell">
                     <img
                       v-if="cell.metadata?.image"
                       :src="cell.metadata.image"
                       :alt="cell.metadata.name"
                       class="w-full h-full object-contain p-2 select-none"
                       @error="handleCellImageError($event)"
                     />
                     <span v-else class="select-none text-5xl">{{ cell.metadata.image }}</span>
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
                     v-if="matchedRecipe.outputIngredient?.metadata.image"
                     :src="matchedRecipe.outputIngredient?.metadata.image"
                     :alt="matchedRecipe.outputIngredient?.metadata.name"
                     class="w-full h-full object-contain p-3 select-none"
                     @error="handleResultImageError($event)"
                   />
                   <span v-else class="select-none text-6xl">{{ '📦' }}</span>
                 </template>
                 <span v-else class="text-slate-600 text-4xl">?</span>
               </div>
               <div class="text-center w-full px-2">
                 <div v-if="matchedRecipe" class="text-white text-sm font-semibold truncate">{{ matchedRecipe.outputIngredient?.metadata.name }}</div>
                 <div v-else class="text-slate-500 text-sm">No match</div>
                 <div v-if="matchedRecipe" class="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{{ matchedRecipe.outputIngredient?.metadata.description }}</div>
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
            {{ isCraftingTx ? '⏳ Crafting...' : canCraft ? '⚡ Craft Item' : '✗ No match' }}
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import WelcomeChestModal from '@/components/WelcomeChestModal.vue';
import RecipeBook from '@/components/RecipeBook.vue';
import { useInventoryStore } from '@/stores/inventory';
import { IIngredient, IRecipe, useRecipesStore } from '@/stores/recipes';
import { useToastStore } from '@/stores/toast';
import { useWalletStore } from '@/stores/wallet';
import type { Recipe } from '@/types';
import craftingService from '@/services/craftingContractService';
import { getTransactionUrl } from '@/config/wallet';

const inventoryStore = useInventoryStore();
const recipesStore = useRecipesStore();
const toastStore = useToastStore();
const walletStore = useWalletStore();

const isPaintingDrag = ref(false);
const isCraftingTx = ref(false);

const parseTokenId = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    if (trimmed.startsWith('token_')) {
      const legacy = Number(trimmed.slice(6));
      if (!Number.isNaN(legacy)) {
        return legacy;
      }
    }
  }

  return undefined;
};

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
const craftingGrid = ref<(IIngredient | null)[]>(new Array(9).fill(null));
// Drag and drop state
const isDragging = ref(false);
const draggedItem = ref<IIngredient | null>(null);
const draggedFromCellIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const isOverTrash = ref(false);

// Painting mode state
const isPainting = ref(false);
const paintingItem = ref<IIngredient | null>(null);
const paintedCells = ref<Set<number>>(new Set());
const craftingGridRef = ref<HTMLElement | null>(null);
const ignoreNextOutsideClick = ref(false);

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
    item.metadata.name.toLowerCase().includes(query) ||
    item.metadata.category.toLowerCase().includes(query) ||
    item.metadata.description.toLowerCase().includes(query)
  );
});

const matchedRecipe = computed(() => {
  try {
    const grid2D = [
      [craftingGrid.value[0], craftingGrid.value[1], craftingGrid.value[2]],
      [craftingGrid.value[3], craftingGrid.value[4], craftingGrid.value[5]],
      [craftingGrid.value[6], craftingGrid.value[7], craftingGrid.value[8]]
    ];

    const legacyMatch = recipesStore.matchRecipe(grid2D);
    if (legacyMatch) {
      return legacyMatch;
    }

    return null;
  } catch (error) {
    console.warn('Error in matchedRecipe computed property:', error);
    return null;
  }
});

const canCraft = computed(() => {
  if (isCraftingTx.value) {
    return false;
  }

  if (!matchedRecipe.value) {
    return false;
  }

  const blockchainRecipe = recipesStore.getBlockchainRecipe(String(matchedRecipe.value.id)) ||
    recipesStore.getBlockchainRecipeById(String(matchedRecipe.value.id));

  if (blockchainRecipe) {
    const userInventory = inventoryStore.userBalance
      .map(item => {
        const tokenId = parseTokenId((item as any).tokenId ?? item.tokenId);
        const tokenContract = (item as any).tokenContract;
        const balance = (item as any).balance ?? '0';

        if (tokenId === undefined || typeof tokenContract !== 'string') {
          return null;
        }

        return {
          tokenId,
          balance: String(balance),
          tokenContract
        };
      })
      .filter((entry): entry is { tokenId: number; balance: string; tokenContract: string } => entry !== null);

    return recipesStore.canCraftRecipe(matchedRecipe.value, userInventory.map(item => ({...item, tokenId: String(item.tokenId)})));
  }

  return true;
});

// Painting Mode Methods
const stopPainting = () => {
  if (isPaintingDrag.value) {
    isPaintingDrag.value = false;
    paintedCells.value.clear();
  }
  isPainting.value = false;
};

// Helper to check if user has resource available
const hasResourceAvailable = (item: IIngredient, quantity: number = 1): boolean => {
  const resource = inventoryStore.userBalance.find(r => r.tokenId === item.tokenId);
  if (!resource) return false;

  const balance = parseInt((resource as any).balance || '0', 10);
  const usedInGrid = craftingGrid.value.filter(cell => cell?.tokenId === item.tokenId).length;

  return balance - usedInGrid >= quantity;
};

// Helper to get available quantity of a resource
const getAvailableQuantity = (item: IIngredient): number => {
  const resource = inventoryStore.userBalance.find(r => r.tokenId === item.tokenId);
  if (!resource) return 0;

  const balance = parseInt((resource as any).balance || '0', 10);
  const usedInGrid = craftingGrid.value.filter(cell => cell?.tokenId === item.tokenId).length;

  return Math.max(0, balance - usedInGrid);
};

const togglePaintingResource = (item: IIngredient) => {
  if (isDragging.value) {
    return;
  }

  ignoreNextOutsideClick.value = true;
  setTimeout(() => {
    ignoreNextOutsideClick.value = false;
  }, 0);

  if (paintingItem.value?.tokenId === item.tokenId) {
    if (isPainting.value) {
      isPainting.value = false;
    }
    isPaintingDrag.value = false;
    paintedCells.value.clear();
    paintingItem.value = null;
    return;
  }

  if (!hasResourceAvailable(item, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${item.metadata.name} available. You have ${getAvailableQuantity(item)} available.`
    });
    return;
  }

  paintingItem.value = item;
  isPainting.value = false;
  isPaintingDrag.value = false;
  paintedCells.value.clear();
};

const paintCell = (index: number, force = false) => {
  if (!paintingItem.value) return;
  if (!isPainting.value && !force) return;
  if (!force && !isPaintingDrag.value) return;
  if (paintedCells.value.has(index)) return;

  if (!hasResourceAvailable(paintingItem.value, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${paintingItem.value.metadata.name} available`
    });
    return;
  }

  craftingGrid.value[index] = paintingItem.value;
  paintedCells.value.add(index);
};


// Resource drag handlers (from catalog)
const onResourceDragStart = (event: DragEvent, item: IIngredient) => {
  isDragging.value = true;
  draggedItem.value = item;
  draggedFromCellIndex.value = null; // From resources catalog
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'; // Copy from resources
    event.dataTransfer.setData('text/plain', item.tokenId);
  }
};

const onCellMouseEnter = (index: number) => {
  paintCell(index);
};

const onCellMouseDown = (event: MouseEvent, index: number) => {
  if (event.button !== 0) return;
  if (!paintingItem.value) return;

  if (!hasResourceAvailable(paintingItem.value, 1)) {
    toastStore.showToast({
      type: 'warning',
      message: `Not enough ${paintingItem.value.metadata.name} available. You have ${getAvailableQuantity(paintingItem.value)} available.`
    });
    return;
  }

  event.preventDefault();
  isPainting.value = true;
  isPaintingDrag.value = true;
  paintedCells.value.clear();
  paintCell(index, true);
};

const onCellDragStart = (event: DragEvent, index: number) => {
  isDragging.value = true;
  draggedItem.value = craftingGrid.value[index];
  draggedFromCellIndex.value = index; // From cell
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', craftingGrid.value[index]?.tokenId || '');
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
        message: `Not enough ${draggedItem.value.metadata.name} available. You have ${getAvailableQuantity(draggedItem.value)} available.`
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

const exitCraftMode = () => {
  stopPainting();
  isPaintingDrag.value = false;
  paintedCells.value.clear();
  paintingItem.value = null;
};

const handleDocumentClick = (event: MouseEvent) => {
  if (ignoreNextOutsideClick.value) {
    return;
  }

  if (!paintingItem.value) {
    return;
  }

  const target = event.target as Node | null;
  if (!target) {
    return;
  }

  if (craftingGridRef.value && craftingGridRef.value.contains(target)) {
    return;
  }

  exitCraftMode();
};

const getCellClass = (cell: IIngredient | null, index: number) => {
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
        message: `Deleted ${item.metadata.name}`
      });
    }
  }

  isDragging.value = false;
  draggedItem.value = null;
  draggedFromCellIndex.value = null;
};

const clearCraftingGrid = () => {
  craftingGrid.value.forEach(item => {
    if (item) {
      inventoryStore.addItem(item as any, 1);
    }
  });
  craftingGrid.value = new Array(9).fill(null);
};

const craftItem = async () => {
  if (!matchedRecipe.value || isCraftingTx.value) {
    return;
  }

  const canCraftOnChain = !!matchedRecipe && walletStore.connected && walletStore.signer;

  if (canCraftOnChain) {
    try {
      isCraftingTx.value = true;
      toastStore.showToast({
        type: 'info',
        message: 'Submitting craft transaction...'
      });

      const result = await craftingService.craft(matchedRecipe.value, walletStore.signer!);
      console.log('Craft result:', result);
      const txHash = result.transaction.hash;
      const explorerUrl = getTransactionUrl(walletStore.chainId, txHash);
      const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-4)}`;

      toastStore.showToast({
        type: 'info',
        message: explorerUrl ? `Transaction sent: ${shortHash} (${explorerUrl})` : `Transaction sent: ${shortHash}`
      });

      if (result.events.length > 0) {
        const craftedEvent = result.events[0];
        console.log('Craft result event:', craftedEvent);
        toastStore.showToast({
          type: 'success',
          message: `Crafted ${matchedRecipe.value.name} × ${craftedEvent?.args?.amount ? craftedEvent.args.amount.toString() : matchedRecipe.value.outputAmount}`
        });
      } else {
        toastStore.showToast({
          type: 'success',
          message: `Crafted ${matchedRecipe.value.name}!`
        });
      }

      notifications.value.unshift({
        type: 'success',
        message: `"Crafted ${matchedRecipe.value.name} x1"`
      });
      if (notifications.value.length > 5) {
        notifications.value.pop();
      }

      craftingGrid.value = new Array(9).fill(null);

      if (walletStore.address) {
        try {
          await inventoryStore.loadUserBalance(walletStore.address, true);
        } catch (loadError) {
          console.warn('Failed to refresh balance after crafting:', loadError);
        }
      }
    } catch (error: any) {
      toastStore.showToast({
        type: 'error',
        message: error?.message || 'Crafting failed.'
      });
    } finally {
      isCraftingTx.value = false;
    }

    return;
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
        const resource = filteredResources.value.find(r => r.tokenId === resourceId);
        if (resource) {
          fallback.textContent = resource.metadata.image;
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
        fallback.textContent = craftingGrid.value[cellIndex]?.metadata.image || '📦';
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
      fallback.textContent = matchedRecipe.value?.outputIngredient?.metadata.image || '📦';
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
      fallback.textContent = paintingItem.value?.metadata.image || '📦';
      parent.appendChild(fallback);
    }
  }
};

const handleAutofillRecipe = async (recipe: IRecipe) => {
  // Handle blockchain recipes
  if ('blockchainRecipeId' in recipe) {
    await autofillBlockchainRecipe(recipe);
    return;
  }

  // Use existing autofill for legacy recipes
  autofillRecipe(recipe as Recipe);
};

const autofillBlockchainRecipe = async (recipe: IRecipe) => {
  clearCraftingGrid();
  
  // Get user's balance to find matching items
  const userBalance = inventoryStore.userBalance;
  // Fill grid according to recipe pattern positions (0-8)
  for (const ingredient of recipe.ingredients) {
    // Find matching item in user's balance
    const balanceItem = userBalance.find(item => {
      const itemContract = (item as any).tokenContract;
      if (!itemContract || typeof itemContract !== 'string') {
        return false;
      }
      if (!ingredient.tokenContract || typeof ingredient.tokenContract !== 'string') {
        return false;
      }
      
      return item.tokenId === ingredient.tokenId && 
             itemContract.toLowerCase() === ingredient.tokenContract.toLowerCase() &&
             parseInt((item as any).balance || '0', 10) >= ingredient.amount;
    });
    
    if (balanceItem && ingredient.position >= 0 && ingredient.position < 9) {
      // Place item at the recipe's specified position
      craftingGrid.value[ingredient.position] = balanceItem as any;
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
        craftingGrid.value[i * 3 + j] = item as any;
        inventoryStore.removeItem(item.id, 1);
      }
    }
  }

  toastStore.showToast({
    type: 'info',
    message: `Autofilled ${recipe.name} recipe`
  });
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('mouseup', stopPainting);
    window.addEventListener('click', handleDocumentClick);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mouseup', stopPainting);
    window.removeEventListener('click', handleDocumentClick);
  }
});

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
