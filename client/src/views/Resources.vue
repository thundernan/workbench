<template>
  <div class="resources-page bg-slate-900 min-h-screen flex flex-col font-mono text-sm">
    <!-- Header -->
    <AppHeader />

    <div class="flex-1 p-6 overflow-auto">
      <div class="max-w-7xl mx-auto">
        <!-- Page Title -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">🏪 Resource Shop</h1>
          <p class="text-slate-400">Buy resources with ETH and earn rewards</p>
        </div>

        <!-- Main Content -->
        <ResourceMinting />
      </div>
    </div>

    <!-- Toast Container -->
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import ResourceMinting from '@/components/ResourceMinting.vue';
import ToastNotification from '@/components/ToastNotification.vue';
</script>


