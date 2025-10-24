<template>
  <div class="home bg-slate-900 min-h-screen">
    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-slate-800 to-slate-900 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
            Workbench MVP
          </h1>
          <p class="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            A blockchain-powered crafting and trading platform. Craft items, manage inventory, and trade with other players in a decentralized ecosystem.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/workbench"
              class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Start Crafting
            </router-link>
            <router-link
              to="/trading"
              class="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              View Market
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-20 bg-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            Key Features
          </h2>
          <p class="text-slate-300 text-lg">
            Everything you need for blockchain-based crafting and trading
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Crafting Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">⚒️</div>
            <h3 class="text-xl font-semibold text-white mb-3">3×3 Crafting Grid</h3>
            <p class="text-slate-300">
              Craft items using a traditional 3×3 grid system with live result computation and recipe matching.
            </p>
          </div>

          <!-- Inventory Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">🎒</div>
            <h3 class="text-xl font-semibold text-white mb-3">Smart Inventory</h3>
            <p class="text-slate-300">
              Manage your items with quantity tracking, rarity indicators, and easy item selection for crafting.
            </p>
          </div>

          <!-- Recipe Book Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">📖</div>
            <h3 class="text-xl font-semibold text-white mb-3">Recipe Book</h3>
            <p class="text-slate-300">
              Browse recipes, preview patterns, and autofill crafting grids with a single click.
            </p>
          </div>

          <!-- Trading Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">💱</div>
            <h3 class="text-xl font-semibold text-white mb-3">Decentralized Trading</h3>
            <p class="text-slate-300">
              Buy and sell items with other players using blockchain transactions and smart contracts.
            </p>
          </div>

          <!-- Wallet Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">🔗</div>
            <h3 class="text-xl font-semibold text-white mb-3">WalletConnect Integration</h3>
            <p class="text-slate-300">
              Connect your wallet seamlessly with WalletConnect for secure blockchain interactions.
            </p>
          </div>

          <!-- Responsive Feature -->
          <div class="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors duration-200">
            <div class="text-4xl mb-4">📱</div>
            <h3 class="text-xl font-semibold text-white mb-3">Mobile-First Design</h3>
            <p class="text-slate-300">
              Fully responsive interface that works perfectly on desktop, tablet, and mobile devices.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tech Stack Section -->
    <div class="py-20 bg-slate-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            Built with Modern Tech
          </h2>
          <p class="text-slate-300 text-lg">
            Powered by the latest web technologies for optimal performance
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="bg-slate-800 rounded-lg p-6">
              <div class="text-3xl mb-2">⚡</div>
              <h3 class="text-white font-semibold">Vue 3</h3>
              <p class="text-slate-400 text-sm">Composition API</p>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-slate-800 rounded-lg p-6">
              <div class="text-3xl mb-2">🔷</div>
              <h3 class="text-white font-semibold">TypeScript</h3>
              <p class="text-slate-400 text-sm">Type Safety</p>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-slate-800 rounded-lg p-6">
              <div class="text-3xl mb-2">🎨</div>
              <h3 class="text-white font-semibold">Tailwind CSS</h3>
              <p class="text-slate-400 text-sm">Utility First</p>
            </div>
          </div>
          <div class="text-center">
            <div class="bg-slate-800 rounded-lg p-6">
              <div class="text-3xl mb-2">🏪</div>
              <h3 class="text-white font-semibold">Pinia</h3>
              <p class="text-slate-400 text-sm">State Management</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-20 bg-emerald-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Start Crafting?
        </h2>
        <p class="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
          Join the decentralized crafting revolution. Connect your wallet and start creating amazing items today.
        </p>
        <router-link
          to="/workbench"
          class="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-block"
        >
          Launch Workbench
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Home page component
</script>