<template>
  <header class="bg-slate-800 border-b-2 border-slate-700 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <!-- Logo -->
        <div class="flex items-center gap-2 text-emerald-400 font-bold">
          <img 
            src="/workbench_icon.png" 
            alt="Workbench" 
            class="w-8 h-8"
          />
          <span>Workbench</span>
        </div>
        
        <!-- Navigation -->
        <nav class="flex gap-3 text-xs">
          <button 
            @click="$router.push('/')"
            class="px-3 py-1 rounded transition-colors"
            :class="isActive('/') 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400'"
          >
            [Craft]
          </button>
          <button 
            @click="$router.push('/shop')"
            class="px-3 py-1 rounded transition-colors"
            :class="isActive('/shop') 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400'"
          >
            [Shop]
          </button>
          <button 
            @click="$router.push('/trading')"
            class="px-3 py-1 rounded transition-colors"
            :class="isActive('/trading') 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400'"
          >
            [Trade]
          </button>
          <button 
            @click="$router.push('/inventory')"
            class="px-3 py-1 rounded transition-colors"
            :class="isActive('/inventory') 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400'"
          >
            [Inventory]
          </button>
        </nav>
      </div>
      
      <!-- Right Side: Network Selector & Wallet -->
      <div class="flex items-center gap-4">
        <!-- Network Selector -->
        <div class="relative">
          <button
            @click="isNetworkDropdownOpen = !isNetworkDropdownOpen"
            class="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors text-xs"
          >
            <div class="w-2 h-2 rounded-full" :class="networkStore.selectedNetwork === 'xsolla' ? 'bg-blue-500' : 'bg-purple-500'"></div>
            <span>{{ networkStore.selectedNetwork === 'xsolla' ? 'Xsolla' : 'Status Network' }}</span>
            <svg class="w-4 h-4 transition-transform duration-200" :class="isNetworkDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <!-- Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="isNetworkDropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50"
              @click.stop
            >
            <button
              @click="selectNetwork('xsolla')"
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors border-b border-slate-600"
              :class="networkStore.selectedNetwork === 'xsolla' ? 'bg-slate-600' : ''"
            >
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-white">Xsolla</div>
                <div class="text-xs text-slate-400">Xsolla Network</div>
              </div>
              <div v-if="networkStore.selectedNetwork === 'xsolla'" class="text-emerald-400">✓</div>
            </button>
            <button
              @click="selectNetwork('status')"
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors"
              :class="networkStore.selectedNetwork === 'status' ? 'bg-slate-600' : ''"
            >
              <div class="w-3 h-3 rounded-full bg-purple-500"></div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-white">Status Network</div>
                <div class="text-xs text-slate-400">Status Testnet</div>
              </div>
              <div v-if="networkStore.selectedNetwork === 'status'" class="text-emerald-400">✓</div>
            </button>
            </div>
          </Transition>
        </div>
        
        <!-- Wallet Connection -->
        <WalletConnectButton ref="walletButtonRef" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import WalletConnectButton from './WalletConnectButton.vue';
import { useNetworkStore } from '@/stores/network';

const route = useRoute();
const walletButtonRef = ref<InstanceType<typeof WalletConnectButton> | null>(null);
const networkStore = useNetworkStore();
const isNetworkDropdownOpen = ref(false);

const isActive = (path: string) => {
  return route.path === path;
};

const selectNetwork = (network: 'xsolla' | 'status') => {
  networkStore.setNetwork(network);
  isNetworkDropdownOpen.value = false;
};

// Close dropdown when clicking outside
const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    isNetworkDropdownOpen.value = false;
  }
};

onMounted(() => {
  networkStore.initNetwork();
  document.addEventListener('click', closeDropdown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
});

// Expose method to open wallet modal
defineExpose({
  openWalletModal: () => {
    walletButtonRef.value?.openModal();
  }
});
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

