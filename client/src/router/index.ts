import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Trading from '@/views/Trading.vue'
import Inventory from '@/views/Inventory.vue'
import Resources from '@/views/Resources.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/resources',
    name: 'Resources',
    component: Resources
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
