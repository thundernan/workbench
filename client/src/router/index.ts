import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import Workbench from '@/views/Workbench.vue'
import Trading from '@/views/Trading.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
