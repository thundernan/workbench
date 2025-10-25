<template>
  <div class="resource-minting bg-slate-800 rounded-lg p-6">
    <h2 class="text-2xl font-bold text-white mb-4">🛒 Buy Resources</h2>
    
    <!-- Wallet Connection Required -->
    <div v-if="!walletStore.connected" class="text-center py-8">
      <div class="text-6xl mb-4">🔗</div>
      <p class="text-slate-400 mb-4">Connect your wallet to buy resources</p>
      <WalletConnectButton />
    </div>

    <!-- Resource Selection -->
    <div v-else>
      <!-- Reward Progress -->
      <div v-if="rewardStatus" class="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border-2 border-purple-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-white font-semibold">🎁 Reward Progress</span>
          <span class="text-purple-400 font-mono">{{ rewardStatus.progress.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-3 mb-2">
          <div 
            class="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(rewardStatus.progress, 100)}%` }"
          ></div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-400">Spent: {{ formatEth(rewardStatus.totalSpent) }} ETH</span>
          <span class="text-slate-400">Goal: {{ formatEth(rewardStatus.threshold) }} ETH</span>
        </div>
        <div v-if="rewardStatus.eligible && !rewardStatus.received" class="mt-3 text-center">
          <span class="text-green-400 font-bold">✨ Reward Available! Next purchase will trigger it!</span>
        </div>
        <div v-if="rewardStatus.received" class="mt-3 text-center">
          <span class="text-yellow-400 font-bold">🏆 Reward Already Claimed!</span>
        </div>
      </div>

      <!-- Resource Categories -->
      <div class="mb-6">
        <div class="flex gap-2 mb-4 overflow-x-auto">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectedCategory = category.id"
            :class="selectedCategory === category.id ? 'bg-emerald-600' : 'bg-slate-700'"
            class="px-4 py-2 rounded-lg text-white hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {{ category.icon }} {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Resource Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div
          v-for="resource in filteredResources"
          :key="resource.tokenId"
          class="resource-card bg-slate-700 rounded-lg p-4 border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
          :class="{ 'ring-2 ring-emerald-500': selectedResource?.tokenId === resource.tokenId }"
          @click="selectResource(resource)"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="text-3xl mb-2">{{ resource.icon }}</div>
              <h3 class="text-white font-semibold">{{ resource.name }}</h3>
              <p class="text-slate-400 text-xs">{{ resource.description }}</p>
            </div>
            <div class="text-right">
              <div class="text-emerald-400 font-bold">{{ resource.price }} ETH</div>
              <div class="text-slate-500 text-xs">per unit</div>
            </div>
          </div>
          
          <!-- Balance -->
          <div class="flex items-center justify-between text-sm pt-3 border-t border-slate-600">
            <span class="text-slate-400">Your Balance:</span>
            <span class="text-white font-mono">{{ getBalance(resource.tokenId) }}</span>
          </div>
        </div>
      </div>

      <!-- Purchase Section -->
      <div v-if="selectedResource" class="bg-slate-700 rounded-lg p-6 border-2 border-emerald-500">
        <h3 class="text-xl font-bold text-white mb-4">Purchase {{ selectedResource.name }}</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Amount Input -->
          <div>
            <label class="block text-slate-400 text-sm mb-2">Amount</label>
            <input
              v-model.number="purchaseAmount"
              type="number"
              min="1"
              max="100"
              class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Enter amount"
            />
          </div>

          <!-- Quick Amount Buttons -->
          <div>
            <label class="block text-slate-400 text-sm mb-2">Quick Select</label>
            <div class="flex gap-2">
              <button
                v-for="quick in [1, 5, 10, 25]"
                :key="quick"
                @click="purchaseAmount = quick"
                class="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {{ quick }}
              </button>
            </div>
          </div>
        </div>

        <!-- Total Cost -->
        <div class="bg-slate-800 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">Unit Price:</span>
            <span class="text-white font-mono">{{ selectedResource.price }} ETH</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">Quantity:</span>
            <span class="text-white font-mono">× {{ purchaseAmount }}</span>
          </div>
          <div class="border-t border-slate-600 pt-2 mt-2">
            <div class="flex items-center justify-between">
              <span class="text-white font-bold">Total Cost:</span>
              <span class="text-emerald-400 font-bold text-xl">{{ totalCost }} ETH</span>
            </div>
          </div>
        </div>

        <!-- Purchase Button -->
        <button
          @click="handlePurchase"
          :disabled="loading || purchaseAmount < 1"
          class="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          <span v-if="loading">⏳ Processing...</span>
          <span v-else>💰 Purchase {{ purchaseAmount }} {{ selectedResource.name }}</span>
        </button>
      </div>

      <!-- Recent Purchases -->
      <div v-if="recentPurchases.length > 0" class="mt-6">
        <h3 class="text-lg font-bold text-white mb-3">📜 Recent Purchases</h3>
        <div class="space-y-2">
          <div
            v-for="(purchase, index) in recentPurchases"
            :key="index"
            class="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ purchase.icon }}</span>
              <div>
                <div class="text-white font-semibold">{{ purchase.name }}</div>
                <div class="text-slate-400 text-xs">{{ purchase.amount }} units</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-emerald-400 font-mono">{{ purchase.cost }} ETH</div>
              <a
                :href="`https://explorer-sepolia.xsollazk.com/tx/${purchase.txHash}`"
                target="_blank"
                class="text-blue-400 text-xs hover:underline"
              >
                View TX ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { useToastStore } from '@/stores/toast';
import { useERC1155 } from '@/composables/useERC1155';
import WalletConnectButton from '@/components/WalletConnectButton.vue';
import { ethers } from 'ethers';

const walletStore = useWalletStore();
const toastStore = useToastStore();
const erc1155 = useERC1155();

// State
const selectedCategory = ref('ores');
const selectedResource = ref<any>(null);
const purchaseAmount = ref(1);
const loading = ref(false);
const balances = ref<Record<number, number>>({});
const rewardStatus = ref<any>(null);
const recentPurchases = ref<any[]>([]);

// Categories
const categories = [
  { id: 'ores', name: 'Ores', icon: '⛏️' },
  { id: 'wood', name: 'Wood', icon: '🪵' },
  { id: 'gems', name: 'Gems', icon: '💎' },
  { id: 'magic', name: 'Magic', icon: '✨' },
  { id: 'special', name: 'Special', icon: '🌟' }
];

// Resources (based on TECHNICAL-DOC.md)
const resources = [
  // Ores
  { tokenId: 1, category: 'ores', name: 'Iron Ore', icon: '⛏️', price: '0.01', description: 'Common metal ore' },
  { tokenId: 2, category: 'ores', name: 'Copper Ore', icon: '🔶', price: '0.015', description: 'Conductive metal' },
  { tokenId: 3, category: 'ores', name: 'Silver Ore', icon: '⚪', price: '0.02', description: 'Precious metal' },
  { tokenId: 4, category: 'ores', name: 'Gold Ore', icon: '🟡', price: '0.03', description: 'Rare metal' },
  { tokenId: 5, category: 'ores', name: 'Diamond Ore', icon: '💠', price: '0.05', description: 'Extremely rare' },
  
  // Wood
  { tokenId: 11, category: 'wood', name: 'Oak Wood', icon: '🪵', price: '0.008', description: 'Sturdy wood' },
  { tokenId: 12, category: 'wood', name: 'Pine Wood', icon: '🌲', price: '0.01', description: 'Light wood' },
  { tokenId: 13, category: 'wood', name: 'Cedar Wood', icon: '🌳', price: '0.012', description: 'Aromatic wood' },
  { tokenId: 14, category: 'wood', name: 'Mahogany', icon: '🪵', price: '0.02', description: 'Premium wood' },
  { tokenId: 15, category: 'wood', name: 'Ebony Wood', icon: '⬛', price: '0.03', description: 'Dark wood' },
  
  // Gems
  { tokenId: 21, category: 'gems', name: 'Ruby', icon: '🔴', price: '0.025', description: 'Fire gemstone' },
  { tokenId: 22, category: 'gems', name: 'Sapphire', icon: '🔵', price: '0.025', description: 'Water gemstone' },
  { tokenId: 23, category: 'gems', name: 'Emerald', icon: '🟢', price: '0.025', description: 'Nature gemstone' },
  { tokenId: 24, category: 'gems', name: 'Amethyst', icon: '🟣', price: '0.035', description: 'Mystical gem' },
  { tokenId: 25, category: 'gems', name: 'Diamond', icon: '💎', price: '0.05', description: 'Pure energy' },
  
  // Magic
  { tokenId: 31, category: 'magic', name: 'Magic Dust', icon: '✨', price: '0.015', description: 'Basic magic' },
  { tokenId: 32, category: 'magic', name: 'Crystal Shard', icon: '🔮', price: '0.02', description: 'Magic energy' },
  { tokenId: 33, category: 'magic', name: 'Mana Essence', icon: '💧', price: '0.03', description: 'Pure mana' },
  { tokenId: 34, category: 'magic', name: 'Soul Fragment', icon: '👻', price: '0.04', description: 'Spiritual energy' },
  { tokenId: 35, category: 'magic', name: 'Divine Spark', icon: '⚡', price: '0.06', description: 'Celestial energy' },
  
  // Special
  { tokenId: 41, category: 'special', name: 'Phoenix Feather', icon: '🪶', price: '0.08', description: 'Resurrection' },
  { tokenId: 42, category: 'special', name: 'Dragon Scale', icon: '🐉', price: '0.1', description: 'Indestructible' },
  { tokenId: 43, category: 'special', name: 'Unicorn Horn', icon: '🦄', price: '0.09', description: 'Healing' },
  { tokenId: 44, category: 'special', name: 'Griffin Claw', icon: '🦅', price: '0.085', description: 'Sharp claw' },
  { tokenId: 45, category: 'special', name: 'Ancient Relic', icon: '🏺', price: '0.12', description: 'Mysterious artifact' }
];

// Computed
const filteredResources = computed(() => {
  return resources.filter(r => r.category === selectedCategory.value);
});

const totalCost = computed(() => {
  if (!selectedResource.value) return '0';
  const cost = parseFloat(selectedResource.value.price) * purchaseAmount.value;
  return cost.toFixed(4);
});

// Methods
const selectResource = (resource: any) => {
  selectedResource.value = resource;
  purchaseAmount.value = 1;
};

const getBalance = (tokenId: number): number => {
  return balances.value[tokenId] || 0;
};

const formatEth = (wei: string): string => {
  return ethers.formatEther(wei);
};

const loadBalances = async () => {
  if (!walletStore.connected) return;
  
  try {
    erc1155.initializeService();
    const tokenIds = resources.map(r => r.tokenId);
    const batchBalances = await erc1155.getBatchBalance(tokenIds);
    
    tokenIds.forEach((id, index) => {
      balances.value[id] = batchBalances[index];
    });
  } catch (error) {
    console.error('Failed to load balances:', error);
  }
};

const loadRewardStatus = async () => {
  if (!walletStore.connected || !walletStore.address) return;
  
  try {
    erc1155.initializeService();
    rewardStatus.value = await erc1155.getRewardStatus(walletStore.address);
  } catch (error) {
    console.error('Failed to load reward status:', error);
  }
};

const handlePurchase = async () => {
  if (!selectedResource.value || purchaseAmount.value < 1) return;
  
  loading.value = true;
  
  try {
    const txHash = await erc1155.mint(selectedResource.value.tokenId, purchaseAmount.value);
    
    // Add to recent purchases
    recentPurchases.value.unshift({
      name: selectedResource.value.name,
      icon: selectedResource.value.icon,
      amount: purchaseAmount.value,
      cost: totalCost.value,
      txHash: txHash
    });
    
    // Keep only last 5
    if (recentPurchases.value.length > 5) {
      recentPurchases.value = recentPurchases.value.slice(0, 5);
    }
    
    // Reload balances and reward status
    await Promise.all([loadBalances(), loadRewardStatus()]);
    
    // Reset selection
    purchaseAmount.value = 1;
    
  } catch (error: any) {
    console.error('Purchase failed:', error);
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => walletStore.connected, (connected) => {
  if (connected) {
    loadBalances();
    loadRewardStatus();
  }
});

// Lifecycle
onMounted(() => {
  if (walletStore.connected) {
    loadBalances();
    loadRewardStatus();
  }
});
</script>

<style scoped>
.resource-card {
  transition: all 0.2s ease;
}

.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
</style>


