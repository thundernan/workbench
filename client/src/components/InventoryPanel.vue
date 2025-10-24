<template>
  <div class="inventory-panel bg-slate-800 rounded-lg p-4 h-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <i class="pi pi-briefcase"></i>
        Inventory
      </h3>
      <Tag :value="`${inventoryStore.totalItems} items`" severity="info" />
    </div>

    <div class="inventory-grid grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
      <div
        v-for="inventoryItem in inventoryStore.items"
        :key="inventoryItem.item.id"
        class="relative"
      >
        <ItemIcon
          :item="inventoryItem.item"
          :quantity="inventoryItem.quantity"
          size="md"
          :class="{ 'ring-2 ring-emerald-400': selectedItem?.id === inventoryItem.item.id }"
          @click="selectItem(inventoryItem.item)"
        />
      </div>
      
      <!-- Empty slots -->
      <div
        v-for="n in Math.max(0, 16 - inventoryStore.items.length)"
        :key="`empty-${n}`"
        class="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
      >
        <span class="text-slate-500 text-xs">Empty</span>
      </div>
    </div>

    <!-- Selected item details -->
    <div v-if="selectedItem" class="mt-4 p-3 bg-slate-700 rounded-lg">
      <div class="flex items-center space-x-3">
        <ItemIcon :item="selectedItem" size="sm" />
        <div class="flex-1">
          <h4 class="text-white font-medium">{{ selectedItem.name }}</h4>
          <p class="text-slate-300 text-sm">{{ selectedItem.description }}</p>
          <div class="flex items-center space-x-2 mt-1">
            <span class="text-xs px-2 py-1 rounded-full" :class="rarityClasses">
              {{ selectedItem.rarity }}
            </span>
            <span class="text-xs text-slate-400">
              Qty: {{ inventoryStore.getItemQuantity(selectedItem.id) }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="mt-3 flex gap-2">
        <Button
          @click="useItem"
          label="Use Item"
          icon="pi pi-check"
          severity="success"
          class="flex-1"
          size="small"
          :disabled="!canUseItem"
        />
        <Button
          @click="clearSelection"
          label="Clear"
          icon="pi pi-times"
          severity="secondary"
          size="small"
          outlined
        />
      </div>
    </div>

    <!-- No items message -->
    <div v-if="inventoryStore.items.length === 0" class="text-center py-8">
      <div class="text-slate-400 text-sm">No items in inventory</div>
      <div class="text-slate-500 text-xs mt-1">Start crafting to get items!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useInventoryStore } from '@/stores/inventory';
import { useToastStore } from '@/stores/toast';
import ItemIcon from './ItemIcon.vue';
import type { Item } from '@/types';

const inventoryStore = useInventoryStore();
const toastStore = useToastStore();

const selectedItem = ref<Item | null>(null);

const selectItem = (item: Item) => {
  selectedItem.value = item;
};

const clearSelection = () => {
  selectedItem.value = null;
};

const canUseItem = computed(() => {
  if (!selectedItem.value) return false;
  return inventoryStore.hasItem(selectedItem.value.id, 1);
});

const useItem = () => {
  if (!selectedItem.value || !canUseItem.value) return;
  
  // For now, just remove one item when "used"
  inventoryStore.removeItem(selectedItem.value.id, 1);
  
  toastStore.showToast({
    type: 'info',
    message: `Used ${selectedItem.value.name}`
  });
  
  // Clear selection if no more items
  if (!inventoryStore.hasItem(selectedItem.value.id, 1)) {
    clearSelection();
  }
};

const rarityClasses = computed(() => {
  if (!selectedItem.value) return '';
  
  switch (selectedItem.value.rarity) {
    case 'common': return 'bg-slate-500 text-white';
    case 'uncommon': return 'bg-emerald-500 text-white';
    case 'rare': return 'bg-blue-500 text-white';
    case 'epic': return 'bg-purple-500 text-white';
    case 'legendary': return 'bg-yellow-500 text-black';
    default: return 'bg-slate-500 text-white';
  }
});

// Initialize sample items on mount
inventoryStore.initializeSampleItems();
</script>
