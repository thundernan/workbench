<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div class="bg-slate-800 border-2 border-slate-700 rounded-lg p-8 max-w-md w-full mx-4 relative animate-fadeIn">
      <!-- Close button -->
      <button 
        @click="closeModal"
        class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Content -->
      <div class="text-center">
        <h2 class="text-2xl font-bold text-emerald-400 mb-2">Welcome to Workbench!</h2>
        <p class="text-slate-300 text-sm mb-6">Click the chest to receive your starter resources</p>

        <!-- Chest -->
        <div class="mb-6">
          <button
            @click="openChest"
            :disabled="isOpened"
            class="text-9xl hover:scale-110 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            :class="{ 'animate-bounce': !isOpened }"
          >
            {{ isOpened ? '📭' : '🎁' }}
          </button>
        </div>

        <!-- Rewards (shown after opening) -->
        <div v-if="isOpened && rewards.length > 0" class="mb-6">
          <div class="text-emerald-400 text-sm font-medium mb-3">You received:</div>
          <div class="space-y-2">
            <div 
              v-for="(reward, index) in rewards" 
              :key="index"
              class="flex items-center justify-between bg-slate-700 rounded px-4 py-2 animate-slideIn"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ reward.item.icon }}</span>
                <span class="text-white text-sm">{{ reward.item.name }}</span>
              </div>
              <span class="text-emerald-400 font-bold">× {{ reward.quantity }}</span>
            </div>
          </div>
        </div>

        <!-- Close button -->
        <button
          v-if="isOpened"
          @click="closeModal"
          class="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
        >
          Start Crafting!
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useToastStore } from '@/stores/toast';
import type { Item } from '@/types';

const inventoryStore = useInventoryStore();
const toastStore = useToastStore();

const isOpen = ref(false);
const isOpened = ref(false);
const rewards = ref<{ item: Item; quantity: number }[]>([]);

// Check if modal should be shown (on page reload, but not on navigation)
onMounted(() => {
  const hasSeenChest = sessionStorage.getItem('hasSeenWelcomeChest');
  if (!hasSeenChest) {
    isOpen.value = true;
  }
});

// Available starter items
const starterItems: Item[] = [
  { id: 'wood', name: 'Wood', description: 'Basic crafting material', icon: '🪵', rarity: 'common', category: 'material' },
  { id: 'stone', name: 'Stone', description: 'Hard material for tools', icon: '🪨', rarity: 'common', category: 'material' },
  { id: 'iron', name: 'Iron', description: 'Metal for advanced crafting', icon: '⬛', rarity: 'uncommon', category: 'material' }
];

const openChest = () => {
  if (isOpened.value) return;

  // Generate random rewards
  const rewardsList: { item: Item; quantity: number }[] = [];
  
  // Always give some wood (5-10)
  rewardsList.push({
    item: starterItems[0],
    quantity: Math.floor(Math.random() * 6) + 5
  });

  // Always give some stone (3-7)
  rewardsList.push({
    item: starterItems[1],
    quantity: Math.floor(Math.random() * 5) + 3
  });

  // 70% chance to give iron (2-5)
  if (Math.random() > 0.3) {
    rewardsList.push({
      item: starterItems[2],
      quantity: Math.floor(Math.random() * 4) + 2
    });
  }

  rewards.value = rewardsList;
  isOpened.value = true;

  // Add items to inventory
  rewardsList.forEach(reward => {
    inventoryStore.addItem(reward.item, reward.quantity);
  });

  // Show toast
  toastStore.showToast({
    type: 'success',
    message: 'Starter resources received!'
  });
};

const closeModal = () => {
  if (!isOpened.value) {
    toastStore.showToast({
      type: 'warning',
      message: 'Open the chest first!'
    });
    return;
  }
  
  // Mark as seen in sessionStorage (persists until browser/tab is closed)
  sessionStorage.setItem('hasSeenWelcomeChest', 'true');
  isOpen.value = false;
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-slideIn {
  animation: slideIn 0.4s ease-out forwards;
  opacity: 0;
}
</style>

