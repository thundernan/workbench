import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Workbench from '@/views/Workbench.vue'
import Trading from '@/views/Trading.vue'
import Inventory from '@/views/Inventory.vue'
import Shop from '@/views/Shop.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: Workbench
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
  },
  {
    path: '/shop',
    name: 'Shop',
    component: Shop
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
