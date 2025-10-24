<template>
  <div class="home">
    <div class="hero">
      <h1>Добро пожаловать в Vue Client App</h1>
      <p class="subtitle">Современное Vue.js приложение с TypeScript и Vite</p>
      <div class="features">
        <div class="feature-card">
          <h3>⚡ Vite</h3>
          <p>Быстрая сборка и горячая перезагрузка</p>
        </div>
        <div class="feature-card">
          <h3>🔷 TypeScript</h3>
          <p>Типизированная разработка</p>
        </div>
        <div class="feature-card">
          <h3>🎯 Vue 3</h3>
          <p>Современный фреймворк</p>
        </div>
      </div>
    </div>
    
    <div class="counter-section">
      <h2>Счетчик</h2>
      <div class="counter">
        <button @click="decrement" class="btn btn-secondary">-</button>
        <span class="count">{{ count }}</span>
        <button @click="increment" class="btn btn-primary">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.counter-section {
  margin-top: 4rem;
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.count {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}
</style>
