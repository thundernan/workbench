import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import WorkbenchService, { type Recipe } from '@/services/workbenchService';
import { useToast } from 'primevue/usetoast';

export function useWorkbench() {
  const walletStore = useWalletStore();
  const toast = useToast();
  
  const service = ref<WorkbenchService | null>(null);
  const recipes = ref<Recipe[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Initialize service when wallet connects
  const initializeService = () => {
    if (walletStore.provider && walletStore.signer) {
      service.value = new WorkbenchService(walletStore.provider, walletStore.signer);
    }
  };

  // Watch for wallet connection changes
  onMounted(() => {
    if (walletStore.connected) {
      initializeService();
    }
  });

  // Update service when wallet changes
  const updateService = () => {
    if (walletStore.provider && walletStore.signer && service.value) {
      service.value.updateProvider(walletStore.provider, walletStore.signer);
    } else if (walletStore.provider && !service.value) {
      service.value = new WorkbenchService(walletStore.provider);
    }
  };

  // Load all active recipes
  const loadRecipes = async () => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const activeRecipes = await service.value.getActiveRecipes();
      recipes.value = activeRecipes;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Failed to Load Recipes',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get recipe by ID
  const getRecipe = async (recipeId: number): Promise<Recipe> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getRecipe(recipeId);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Check if user can craft
  const canCraft = async (recipeId: number): Promise<boolean> => {
    if (!service.value || !walletStore.address) throw new Error('Service or address not available');
    
    try {
      return await service.value.canCraft(recipeId, walletStore.address);
    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  };

  // Craft item without grid
  const craft = async (recipeId: number): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.craftWithoutGrid(recipeId);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Crafting Successful',
        detail: `Successfully crafted recipe ${recipeId}`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Crafting Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Craft item with grid
  const craftWithGrid = async (recipeId: number, grid: number[]): Promise<string> => {
    if (!service.value) throw new Error('Service not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const tx = await service.value.craftWithGrid(recipeId, grid);
      const receipt = await tx.wait();
      
      toast.add({
        severity: 'success',
        summary: 'Crafting Successful',
        detail: `Successfully crafted recipe ${recipeId} with grid pattern`,
        life: 5000
      });
      
      return receipt.hash;
    } catch (err: any) {
      error.value = err.message;
      toast.add({
        severity: 'error',
        summary: 'Crafting Failed',
        detail: err.message,
        life: 5000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get workbench token balance
  const getWorkbenchBalance = async (tokenContract: string, tokenId: number): Promise<number> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.getOutputTokenBalance(tokenContract, tokenId);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  // Estimate gas for crafting
  const estimateGas = async (recipeId: number, useGrid: boolean = false, grid?: number[]): Promise<bigint> => {
    if (!service.value) throw new Error('Service not initialized');
    
    try {
      return await service.value.estimateCraftGas(recipeId, useGrid, grid);
    } catch (err: any) {
      error.value = err.message;
      return BigInt(300000); // Default gas limit
    }
  };

  // Event listeners
  const onItemCrafted = (callback: (
    recipeId: bigint,
    crafter: string,
    outputContract: string,
    outputTokenId: bigint,
    amount: bigint
  ) => void) => {
    if (!service.value) throw new Error('Service not initialized');
    service.value.onItemCrafted(callback);
  };

  // Utility functions
  const gridToPosition = (row: number, col: number): number => {
    return WorkbenchService.gridToPosition(row, col);
  };

  const positionToGrid = (position: number): { row: number; col: number } => {
    return WorkbenchService.positionToGrid(position);
  };

  // Cleanup
  onUnmounted(() => {
    if (service.value) {
      service.value.removeAllListeners();
    }
  });

  return {
    // State
    recipes: computed(() => recipes.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    service: computed(() => service.value),
    
    // Methods
    initializeService,
    updateService,
    loadRecipes,
    getRecipe,
    canCraft,
    craft,
    craftWithGrid,
    getWorkbenchBalance,
    estimateGas,
    onItemCrafted,
    gridToPosition,
    positionToGrid,
    
    // Clear error
    clearError: () => { error.value = null; }
  };
}
