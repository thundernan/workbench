import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Trading from '@/views/Trading.vue'
import Inventory from '@/views/Inventory.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/trading',
    name: 'Trading',
    component: Trading
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
