<template>
  <div 
    class="item-icon relative group cursor-pointer transition-all duration-200 hover:scale-105"
    :class="[
      sizeClasses,
      rarityClasses,
      { 'opacity-50': disabled }
    ]"
    @click="handleClick"
  >
    <div class="w-full h-full rounded-lg border-2 flex items-center justify-center text-2xl bg-slate-800 border-slate-600">
      {{ item?.icon || '❓' }}
    </div>
    
    <!-- Quantity badge -->
    <div 
      v-if="showQuantity && quantity && quantity > 1" 
      class="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
    >
      {{ quantity }}
    </div>
    
    <!-- Rarity glow effect -->
    <div 
      v-if="item?.rarity !== 'common'"
      class="absolute inset-0 rounded-lg opacity-20"
      :class="rarityGlowClasses"
    ></div>
    
    <!-- Tooltip -->
    <div 
      v-if="item && showTooltip"
      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
    >
      <div class="font-semibold">{{ item.name }}</div>
      <div class="text-xs text-slate-300">{{ item.description }}</div>
      <div class="text-xs capitalize" :class="rarityTextClasses">{{ item.rarity }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Item } from '@/types';

interface Props {
  item?: Item | null;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  showTooltip?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showQuantity: true,
  showTooltip: true,
  disabled: false
});

const emit = defineEmits<{
  click: [item: Item | null];
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-8 h-8';
    case 'md': return 'w-12 h-12';
    case 'lg': return 'w-16 h-16';
    default: return 'w-12 h-12';
  }
});

const rarityClasses = computed(() => {
  if (!props.item) return '';
  
  switch (props.item.rarity) {
    case 'common': return 'border-slate-500';
    case 'uncommon': return 'border-emerald-400';
    case 'rare': return 'border-blue-400';
    case 'epic': return 'border-purple-400';
    case 'legendary': return 'border-yellow-400';
    default: return 'border-slate-500';
  }
});

const rarityGlowClasses = computed(() => {
  if (!props.item) return '';
  
  switch (props.item.rarity) {
    case 'uncommon': return 'bg-emerald-400';
    case 'rare': return 'bg-blue-400';
    case 'epic': return 'bg-purple-400';
    case 'legendary': return 'bg-yellow-400';
    default: return '';
  }
});

const rarityTextClasses = computed(() => {
  if (!props.item) return '';
  
  switch (props.item.rarity) {
    case 'common': return 'text-slate-400';
    case 'uncommon': return 'text-emerald-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-slate-400';
  }
});

const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.item || null);
  }
};
</script>
