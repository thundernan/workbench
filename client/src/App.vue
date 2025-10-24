<template>
  <div id="app" class="min-h-screen bg-slate-900">
    <!-- Navigation -->
    <nav class="bg-slate-800 border-b border-slate-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-white">Workbench MVP</h1>
            </div>
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <router-link
                to="/"
                class="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="{ 'text-white bg-slate-700': $route.name === 'Home' }"
              >
                Home
              </router-link>
              <router-link
                to="/workbench"
                class="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="{ 'text-white bg-slate-700': $route.name === 'Workbench' }"
              >
                Workbench
              </router-link>
              <router-link
                to="/trading"
                class="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="{ 'text-white bg-slate-700': $route.name === 'Trading' }"
              >
                Trading
              </router-link>
              <router-link
                to="/about"
                class="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="{ 'text-white bg-slate-700': $route.name === 'About' }"
              >
                About
              </router-link>
            </div>
          </div>
          <div class="flex items-center">
            <WalletConnectButton />
          </div>
        </div>
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
