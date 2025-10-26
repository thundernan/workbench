import { Router } from 'express';
import { createRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe } from '../controllers/recipeController';
import { validateQuery } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredients
 *               - outputTokenId
 *               - name
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: number
 *                     amount:
 *                       type: number
 *                       default: 1
 *                     position:
 *                       type: number
 *                       default: 0
 *               outputTokenId:
 *                 type: number
 *               outputAmount:
 *                 type: number
 *                 default: 1
 *               requiresExactPattern:
 *                 type: boolean
 *                 default: true
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', createRecipe);

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
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
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 */
router.get('/', validateQuery, getRecipes);

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe retrieved successfully
 *       404:
 *         description: Recipe not found
 */
router.get('/:id', getRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       404:
 *         description: Recipe not found
 */
router.put('/:id', updateRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       404:
 *         description: Recipe not found
 */
router.delete('/:id', deleteRecipe);

export default router;
