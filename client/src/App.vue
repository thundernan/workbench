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
import WalletConnectButton from '@/components/WalletConnectButton.vue';
</script>
