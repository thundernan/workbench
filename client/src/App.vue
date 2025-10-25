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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useWalletStore } from '@/stores/wallet';

// Initialize stores
const recipesStore = useRecipesStore();
const walletStore = useWalletStore();

// Fetch recipes on app load
onMounted(async () => {
  console.log('🚀 App loaded - initializing...');
  
  // Check for existing wallet connection
  try {
    await walletStore.checkConnection();
    if (walletStore.connected) {
      console.log('✅ Wallet already connected:', walletStore.shortAddress);
    }
  } catch (error) {
    console.warn('⚠️ Wallet check failed:', error);
  }
  
  // Fetch blockchain recipes from server
  try {
    console.log('📚 Fetching recipes from server...');
    await recipesStore.fetchBlockchainRecipes();
    console.log(`✅ Loaded ${recipesStore.allBlockchainRecipes.length} recipes`);
  } catch (error: any) {
    console.error('❌ Failed to fetch recipes:', error.message);
    // Don't block app if recipes fail to load
    // User can retry via recipe book
  }
});
</script>
