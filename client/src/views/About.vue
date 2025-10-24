<template>
  <div class="about">
    <div class="container">
      <h1>О приложении</h1>
      <div class="content">
        <div class="info-section">
          <h2>Технологии</h2>
          <ul class="tech-list">
            <li><strong>Vue 3</strong> - Прогрессивный JavaScript фреймворк</li>
            <li><strong>TypeScript</strong> - Типизированный JavaScript</li>
            <li><strong>Vite</strong> - Быстрый инструмент сборки</li>
            <li><strong>Vue Router</strong> - Маршрутизация для SPA</li>
            <li><strong>Pinia</strong> - Управление состоянием</li>
          </ul>
        </div>
        
        <div class="info-section">
          <h2>Возможности</h2>
          <div class="features-grid">
            <div class="feature">
              <h3>🚀 Быстрая разработка</h3>
              <p>Горячая перезагрузка и быстрая сборка с Vite</p>
            </div>
            <div class="feature">
              <h3>📱 Адаптивный дизайн</h3>
              <p>Современный и отзывчивый интерфейс</p>
            </div>
            <div class="feature">
              <h3>🔧 TypeScript</h3>
              <p>Полная типизация для надежной разработки</p>
            </div>
            <div class="feature">
              <h3>🎨 Современный UI</h3>
              <p>Красивый и интуитивный пользовательский интерфейс</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Компонент страницы "О нас"
</script>

<style scoped>
.about {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.container h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content {
  display: grid;
  gap: 3rem;
}

.info-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-section h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.tech-list {
  list-style: none;
  padding: 0;
}

.tech-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  font-size: 1.1rem;
}

.tech-list li:last-child {
  border-bottom: none;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.feature {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.feature h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.feature p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}
</style>
