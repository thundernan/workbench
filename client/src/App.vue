<template>
  <div id="app" class="min-h-screen bg-slate-900">
    <!-- Navigation -->
    <nav class="bg-slate-800 border-b border-slate-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      </div>
    </nav>
    
    <!-- Main Content -->
    <main>
      <router-view />
    </main>
    
    <!-- Toast Notifications -->
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useWalletStore } from '@/stores/wallet';
import ToastNotification from '@/components/ToastNotification.vue';

// Initialize stores
const recipesStore = useRecipesStore();
const walletStore = useWalletStore();

// MOCKED: Simplified app load - no server fetching
onMounted(async () => {
  console.log('🚀 App loaded - MOCK MODE');
  
  // Check for existing wallet connection (for UI display)
  try {
    await walletStore.checkConnection();
    if (walletStore.connected) {
      console.log('✅ Wallet already connected:', walletStore.shortAddress);
    }
  } catch (error) {
    console.warn('⚠️ Wallet check failed:', error);
  }
  
  // MOCKED: Initialize mock blockchain recipes
  recipesStore.initializeMockBlockchainRecipes();
  console.log(`📚 Loaded ${recipesStore.allBlockchainRecipes.length} mock blockchain recipes`);
  
  // COMMENTED OUT: Real blockchain recipes fetching
  // try {
  //   console.log('📚 Fetching recipes from server...');
  //   await recipesStore.fetchBlockchainRecipes();
  //   console.log(`✅ Loaded ${recipesStore.allBlockchainRecipes.length} recipes`);
  // } catch (error: any) {
  //   console.error('❌ Failed to fetch recipes:', error.message);
  // }
  
  console.log('🎮 Using mock/sample data for recipes and inventory');
});
</script>
