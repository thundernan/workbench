<template>
  <div class="api-test-page bg-slate-900 min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">API Connection Test</h1>

      <!-- Health Check Section -->
      <div class="mb-8">
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-emerald-400 mb-4">Health Check</h2>
          <button
            @click="testHealthCheck"
            :disabled="loading.health"
            class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading.health ? 'Testing...' : 'Test Health Endpoint' }}
          </button>
          
          <div v-if="healthData" class="mt-4 bg-slate-900 rounded p-4 font-mono text-xs">
            <div class="text-emerald-400 mb-2">✓ Connection successful</div>
            <pre class="text-slate-300">{{ JSON.stringify(healthData, null, 2) }}</pre>
          </div>
          
          <div v-if="errors.health" class="mt-4 bg-red-900/20 border border-red-500 rounded p-4">
            <div class="text-red-400">✗ Connection failed</div>
            <p class="text-red-300 text-sm mt-2">{{ errors.health }}</p>
          </div>
        </div>
      </div>

      <!-- Recipes Section -->
      <div class="mb-8">
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-emerald-400 mb-4">Recipes API</h2>
          <button
            @click="testRecipes"
            :disabled="loading.recipes"
            class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading.recipes ? 'Fetching...' : 'Fetch Recipes' }}
          </button>
          
          <div v-if="recipes" class="mt-4 bg-slate-900 rounded p-4">
            <div class="text-emerald-400 mb-2 font-mono text-xs">
              ✓ Found {{ recipes.length }} recipe(s)
            </div>
            <div v-if="recipes.length > 0" class="space-y-2 mt-4">
              <div
                v-for="recipe in recipes"
                :key="recipe._id"
                class="bg-slate-800 border border-slate-700 rounded p-3"
              >
                <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div class="text-slate-400">Recipe ID:</div>
                  <div class="text-white">{{ recipe.recipeId }}</div>
                  
                  <div class="text-slate-400">New Ingredient:</div>
                  <div class="text-white">{{ recipe.newIngredientId }}</div>
                  
                  <div class="text-slate-400">Grid Size:</div>
                  <div class="text-white">{{ recipe.gridSize }}x{{ recipe.gridSize }}</div>
                  
                  <div class="text-slate-400">Ingredients:</div>
                  <div class="text-white">{{ recipe.ingredients.length }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-slate-400 text-sm mt-2">
              No recipes found. They will be synced from blockchain events.
            </div>
          </div>
          
          <div v-if="errors.recipes" class="mt-4 bg-red-900/20 border border-red-500 rounded p-4">
            <div class="text-red-400">✗ Failed to fetch recipes</div>
            <p class="text-red-300 text-sm mt-2">{{ errors.recipes }}</p>
          </div>
        </div>
      </div>

      <!-- Configuration Info -->
      <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-emerald-400 mb-4">Configuration</h2>
        <div class="space-y-2 text-sm font-mono">
          <div class="flex justify-between">
            <span class="text-slate-400">Client URL:</span>
            <span class="text-white">{{ window.location.origin }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">API Base URL:</span>
            <span class="text-white">/api (proxied to localhost:3001)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Server URL:</span>
            <span class="text-white">http://localhost:3001</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import apiService, { type HealthCheck, type Recipe } from '@/services/apiService';

const loading = ref({
  health: false,
  recipes: false,
});

const errors = ref({
  health: null as string | null,
  recipes: null as string | null,
});

const healthData = ref<HealthCheck | null>(null);
const recipes = ref<Recipe[] | null>(null);

const testHealthCheck = async () => {
  loading.value.health = true;
  errors.value.health = null;
  healthData.value = null;

  try {
    healthData.value = await apiService.healthCheck();
  } catch (error: any) {
    errors.value.health = error.message;
  } finally {
    loading.value.health = false;
  }
};

const testRecipes = async () => {
  loading.value.recipes = true;
  errors.value.recipes = null;
  recipes.value = null;

  try {
    recipes.value = await apiService.getRecipes();
  } catch (error: any) {
    errors.value.recipes = error.message;
  } finally {
    loading.value.recipes = false;
  }
};

// Access window object
const window = globalThis.window;
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

