"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCraftingPreview = exports.getRecipesForGridSize = exports.craftIngredient = void 0;
const Recipe_1 = __importDefault(require("../models/Recipe"));
const craftIngredient = async (req, res) => {
    try {
        const { grid } = req.body;
        if (!grid || !grid.slots || !Array.isArray(grid.slots)) {
            const response = {
                success: false,
                message: 'Invalid crafting grid structure'
            };
            res.status(400).json(response);
            return;
        }
        const expectedSlots = grid.gridSize * grid.gridSize;
        if (grid.slots.length !== expectedSlots) {
            const response = {
                success: false,
                message: `Grid size mismatch. Expected ${expectedSlots} slots for ${grid.gridSize}x${grid.gridSize} grid, got ${grid.slots.length}`
            };
            res.status(400).json(response);
            return;
        }
        if (grid.gridSize < 1 || grid.gridSize > 5) {
            const response = {
                success: false,
                message: 'Grid size must be between 1x1 and 5x5'
            };
            res.status(400).json(response);
            return;
        }
        const recipes = await Recipe_1.default.find({})
            .populate('resultIngredient', 'name image tokenContract tokenId')
            .populate('ingredients.ingredientId', 'name image tokenContract tokenId');
        const matchedRecipe = await findMatchingRecipe(grid, recipes);
        if (!matchedRecipe) {
            const response = {
                success: false,
                message: 'No recipe matches the provided crafting pattern',
                data: {
                    success: false,
                    message: 'No recipe matches the provided crafting pattern'
                }
            };
            res.status(404).json(response);
            return;
        }
        const validationResult = await validateIngredientAvailability(grid, matchedRecipe);
        if (!validationResult.valid) {
            const response = {
                success: false,
                message: validationResult.message,
                data: {
                    success: false,
                    message: validationResult.message
                }
            };
            res.status(400).json(response);
            return;
        }
        const craftingResult = {
            success: true,
            resultIngredient: matchedRecipe.resultIngredient,
            recipe: {
                _id: matchedRecipe._id,
                name: matchedRecipe.name,
                description: matchedRecipe.description,
                category: matchedRecipe.category,
                difficulty: matchedRecipe.difficulty,
                craftingTime: matchedRecipe.craftingTime
            },
            message: `Successfully crafted ${matchedRecipe.resultIngredient.name}!`,
            consumedIngredients: validationResult.consumedIngredients || []
        };
        const response = {
            success: true,
            message: 'Crafting successful',
            data: craftingResult
        };
        res.json(response);
        return;
    }
    catch (error) {
        console.error('Error crafting ingredient:', error);
        const response = {
            success: false,
            message: 'Failed to craft ingredient',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(response);
        return;
    }
};
exports.craftIngredient = craftIngredient;
async function findMatchingRecipe(grid, recipes) {
    for (const recipe of recipes) {
        if (await doesRecipeMatchGrid(grid, recipe)) {
            return recipe;
        }
    }
    return null;
}
async function doesRecipeMatchGrid(grid, recipe) {
    const recipeGrid = createRecipeGrid(grid.gridSize, recipe.ingredients);
    return compareGrids(grid.slots, recipeGrid);
}
function createRecipeGrid(gridSize, ingredients) {
    const grid = new Array(gridSize * gridSize).fill(null).map(() => ({
        ingredientId: null,
        amount: 0
    }));
    for (const ingredient of ingredients) {
        if (ingredient.position >= 0 && ingredient.position < gridSize * gridSize) {
            grid[ingredient.position] = {
                ingredientId: ingredient.ingredientId._id.toString(),
                amount: ingredient.amount
            };
        }
    }
    return grid;
}
function compareGrids(craftingSlots, recipeSlots) {
    if (craftingSlots.length !== recipeSlots.length) {
        return false;
    }
    for (let i = 0; i < craftingSlots.length; i++) {
        const craftingSlot = craftingSlots[i];
        const recipeSlot = recipeSlots[i];
        if (!craftingSlot || !recipeSlot) {
            return false;
        }
        if (recipeSlot.ingredientId === null) {
            if (craftingSlot.ingredientId !== null) {
                return false;
            }
            continue;
        }
        if (craftingSlot.ingredientId !== recipeSlot.ingredientId) {
            return false;
        }
        if (craftingSlot.amount < recipeSlot.amount) {
            return false;
        }
    }
    return true;
}
async function validateIngredientAvailability(grid, recipe) {
    const consumedIngredients = [];
    for (const recipeIngredient of recipe.ingredients) {
        const position = recipeIngredient.position;
        const requiredAmount = recipeIngredient.amount;
        if (position >= grid.slots.length) {
            return {
                valid: false,
                message: `Invalid ingredient position ${position} in recipe`
            };
        }
        const craftingSlot = grid.slots[position];
        if (!craftingSlot.ingredientId) {
            return {
                valid: false,
                message: `Missing ingredient at position ${position}`
            };
        }
        if (craftingSlot.ingredientId !== recipeIngredient.ingredientId._id.toString()) {
            return {
                valid: false,
                message: `Wrong ingredient at position ${position}. Expected ${recipeIngredient.ingredientId.name}, got different ingredient`
            };
        }
        if (craftingSlot.amount < requiredAmount) {
            return {
                valid: false,
                message: `Insufficient amount of ${recipeIngredient.ingredientId.name} at position ${position}. Required: ${requiredAmount}, Available: ${craftingSlot.amount}`
            };
        }
        consumedIngredients.push({
            ingredientId: recipeIngredient.ingredientId._id,
            name: recipeIngredient.ingredientId.name,
            amount: requiredAmount,
            position: position
        });
    }
    return {
        valid: true,
        message: 'All ingredients are available',
        consumedIngredients
    };
}
const getRecipesForGridSize = async (req, res) => {
    try {
        const { gridSize } = req.params;
        const size = parseInt(gridSize || '0');
        if (isNaN(size) || size < 1 || size > 5) {
            const response = {
                success: false,
                message: 'Grid size must be a number between 1 and 5'
            };
            res.status(400).json(response);
            return;
        }
        const recipes = await Recipe_1.default.find({})
            .populate('resultIngredient', 'name image tokenContract tokenId')
            .populate('ingredients.ingredientId', 'name image tokenContract tokenId');
        const validRecipes = recipes.filter(recipe => {
            const maxPosition = Math.max(...recipe.ingredients.map((ing) => ing.position));
            return maxPosition < size * size;
        });
        const response = {
            success: true,
            message: `Recipes available for ${size}x${size} grid`,
            data: validRecipes
        };
        res.json(response);
        return;
    }
    catch (error) {
        console.error('Error getting recipes for grid size:', error);
        const response = {
            success: false,
            message: 'Failed to get recipes for grid size',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(response);
        return;
    }
};
exports.getRecipesForGridSize = getRecipesForGridSize;
const getCraftingPreview = async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients)) {
            const response = {
                success: false,
                message: 'Ingredients array is required'
            };
            res.status(400).json(response);
            return;
        }
        const recipes = await Recipe_1.default.find({})
            .populate('resultIngredient', 'name image tokenContract tokenId')
            .populate('ingredients.ingredientId', 'name image tokenContract tokenId');
        const craftableRecipes = [];
        for (const recipe of recipes) {
            const canCraft = await canCraftRecipe(ingredients, recipe);
            if (canCraft.canCraft) {
                craftableRecipes.push({
                    recipe: {
                        _id: recipe._id,
                        name: recipe.name,
                        description: recipe.description,
                        category: recipe.category,
                        difficulty: recipe.difficulty,
                        craftingTime: recipe.craftingTime
                    },
                    resultIngredient: recipe.resultIngredient,
                    requiredIngredients: recipe.ingredients,
                    missingIngredients: canCraft.missingIngredients
                });
            }
        }
        const response = {
            success: true,
            message: `Found ${craftableRecipes.length} craftable recipes`,
            data: craftableRecipes
        };
        res.json(response);
        return;
    }
    catch (error) {
        console.error('Error getting crafting preview:', error);
        const response = {
            success: false,
            message: 'Failed to get crafting preview',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(response);
        return;
    }
};
exports.getCraftingPreview = getCraftingPreview;
async function canCraftRecipe(availableIngredients, recipe) {
    const missingIngredients = [];
    for (const recipeIngredient of recipe.ingredients) {
        const available = availableIngredients.find(ing => ing.ingredientId === recipeIngredient.ingredientId._id.toString());
        if (!available) {
            missingIngredients.push({
                ingredientId: recipeIngredient.ingredientId._id,
                name: recipeIngredient.ingredientId.name,
                required: recipeIngredient.amount,
                available: 0
            });
        }
        else if (available.amount < recipeIngredient.amount) {
            missingIngredients.push({
                ingredientId: recipeIngredient.ingredientId._id,
                name: recipeIngredient.ingredientId.name,
                required: recipeIngredient.amount,
                available: available.amount
            });
        }
    }
    return {
        canCraft: missingIngredients.length === 0,
        ...(missingIngredients.length > 0 && { missingIngredients })
    };
}
//# sourceMappingURL=craftingController.js.map