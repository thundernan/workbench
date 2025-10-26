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
      
      <!-- Wallet Connection -->
      <WalletConnectButton />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import WalletConnectButton from './WalletConnectButton.vue';

const route = useRoute();

const isActive = (path: string) => {
  return route.path === path;
};
</script>

