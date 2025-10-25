import { Router } from 'express';
import { getRecipes } from '../controllers/recipeController';
import { validateQuery } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes (blockchain-synced data)
 *     tags: [Recipes]
 *     description: Retrieves all recipes that have been synced from blockchain RecipeCreated events
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: blockchainRecipeId
 *         schema:
 *           type: string
 *         description: Filter by blockchain recipe ID
 *       - in: query
 *         name: resultTokenContract
 *         schema:
 *           type: string
 *         description: Filter by result token contract address
 *       - in: query
 *         name: resultTokenId
 *         schema:
 *           type: number
 *         description: Filter by result token ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by recipe category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *         description: Filter by difficulty level
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by recipe name (partial match)
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginationResult'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery, getRecipes);

export default router;
