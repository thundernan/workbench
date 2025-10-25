import { Router } from 'express';
import {
  checkCanCraft,
  getBlockchainRecipe,
  getActiveRecipeIds,
  getActiveRecipes
} from '../controllers/craftingController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Crafting - Blockchain
 *   description: Blockchain crafting operations (Workbench contract)
 */

/**
 * @swagger
 * /api/crafting/can-craft/{recipeId}/{address}:
 *   get:
 *     summary: Check if user can craft a recipe
 *     tags: [Crafting - Blockchain]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: number
 *         description: Recipe ID
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Crafter's wallet address
 *     responses:
 *       200:
 *         description: Crafting eligibility checked successfully
 *       503:
 *         description: Crafting service not available
 */
router.get('/can-craft/:recipeId/:address', checkCanCraft);

/**
 * @swagger
 * /api/crafting/recipe/{recipeId}:
 *   get:
 *     summary: Get recipe details from blockchain
 *     tags: [Crafting - Blockchain]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: number
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe retrieved successfully
 *       503:
 *         description: Crafting service not available
 */
router.get('/recipe/:recipeId', getBlockchainRecipe);

/**
 * @swagger
 * /api/crafting/active-recipes:
 *   get:
 *     summary: Get all active recipe IDs
 *     tags: [Crafting - Blockchain]
 *     responses:
 *       200:
 *         description: Active recipe IDs retrieved successfully
 *       503:
 *         description: Crafting service not available
 */
router.get('/active-recipes', getActiveRecipeIds);

/**
 * @swagger
 * /api/crafting/active-recipes/details:
 *   get:
 *     summary: Get all active recipes with details
 *     tags: [Crafting - Blockchain]
 *     responses:
 *       200:
 *         description: Active recipes retrieved successfully
 *       503:
 *         description: Crafting service not available
 */
router.get('/active-recipes/details', getActiveRecipes);

export default router;

