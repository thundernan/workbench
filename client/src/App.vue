<template>
  <div id="app" class="min-h-screen bg-slate-900">
    <!-- Show Welcome page if wallet is not connected -->
    <Welcome v-if="!walletStore.connected" />
    
    <!-- Show main app if wallet is connected -->
    <template v-else>
      <!-- Navigation -->
      <nav class="bg-slate-800 border-b border-slate-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </nav>
      
      <!-- Main Content -->
      <main>
        <router-view />
      </main>
    </template>
    
    <!-- Custom Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useWalletStore } from '@/stores/wallet';
import ToastContainer from '@/components/ToastContainer.vue';
import Welcome from '@/views/Welcome.vue';

// Initialize stores
const recipesStore = useRecipesStore();
const walletStore = useWalletStore();

// Fetch recipes on app load
onMounted(async () => {
  // Check for existing wallet connection
  try {
    await walletStore.checkConnection();
  } catch (error) {
    // Silent fail
  }
  
  // Fetch blockchain recipes from server (with delay to avoid rate limiting)
  // Longer delay to ensure Shop.vue loads first and avoid rate limiting
  setTimeout(async () => {
    try {
      await recipesStore.fetchBlockchainRecipes();
    } catch (error: any) {
      // Don't block app if recipes fail to load
      // User can retry via recipe book
    }
  }, 3000); // Delay 3 seconds to let Shop.vue load first and avoid rate limiting
});
</script>
