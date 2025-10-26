import { Router } from 'express';
import {
  createIngredient,
  getIngredients,
  getIngredient,
  updateIngredient,
  deleteIngredient,
  getTokenBalance,
  getTokenPrice,
  getTokenInfo,
  getTokenSupply,
  checkTokenExists,
  getUserBalance,
  getUserInventory,
  syncIngredientFromBlockchain,
  mintIngredient
} from '../controllers/ingredientController';

const router = Router();

/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     summary: Create a new ingredient with token type on blockchain
 *     tags: [Ingredients]
 *     description: Creates an ingredient in the database and its corresponding token type on the blockchain. Requires admin role on the smart contract.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Ingredient metadata (name, image, description, category, etc.)
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Ingredient name
 *                     example: "Wood"
 *                   image:
 *                     type: string
 *                     description: Image URL
 *                     example: "https://example.com/wood.png"
 *                   description:
 *                     type: string
 *                     description: Ingredient description
 *                     example: "Basic crafting material"
 *                   category:
 *                     type: string
 *                     description: Ingredient category
 *                     example: "material"
 *               price:
 *                 type: number
 *                 description: Minting price in ETH (e.g., 0.001 for 0.001 ETH). Use 0 or omit for free minting.
 *                 example: 0.001
 *                 default: 0
 *           examples:
 *             freeItem:
 *               summary: Free item (no price)
 *               value:
 *                 metadata:
 *                   name: "Wood"
 *                   image: "https://example.com/wood.png"
 *                   description: "Basic crafting material"
 *                   category: "material"
 *             paidItem:
 *               summary: Paid item (0.01 ETH)
 *               value:
 *                 metadata:
 *                   name: "Diamond"
 *                   image: "https://example.com/diamond.png"
 *                   description: "Rare precious gem"
 *                   category: "rare"
 *                 price: 0.01
 *     responses:
 *       201:
 *         description: Ingredient created successfully with blockchain token type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: string
 *                     ingredientDataId:
 *                       type: string
 *                     tokenId:
 *                       type: number
 *                     tokenContract:
 *                       type: string
 *                     createTransaction:
 *                       type: string
 *                     price:
 *                       type: object
 *                       properties:
 *                         wei:
 *                           type: string
 *                         eth:
 *                           type: string
 *                     metadata:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Invalid price format
 *       500:
 *         description: Blockchain service unavailable or token creation failed
 */
router.post('/', createIngredient);

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: Ingredients retrieved successfully
 */
router.get('/', getIngredients);

/**
 * @swagger
 * /api/ingredients/{tokenContract}/{tokenId}:
 *   get:
 *     summary: Get ingredient by tokenContract and tokenId
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: tokenContract
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Ingredient retrieved successfully
 *       404:
 *         description: Ingredient not found
 */
router.get('/:tokenContract/:tokenId', getIngredient);

/**
 * @swagger
 * /api/ingredients/{tokenContract}/{tokenId}:
 *   put:
 *     summary: Update ingredient metadata
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: tokenContract
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *       404:
 *         description: Ingredient not found
 */
router.put('/:tokenContract/:tokenId', updateIngredient);

/**
 * @swagger
 * /api/ingredients/{tokenContract}/{tokenId}:
 *   delete:
 *     summary: Delete ingredient
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: tokenContract
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Ingredient deleted successfully
 *       404:
 *         description: Ingredient not found
 */
router.delete('/:tokenContract/:tokenId', deleteIngredient);

// ============================================
// Blockchain Integration Routes
// ============================================

/**
 * @swagger
 * /api/ingredients/blockchain/balance/{address}/{tokenId}:
 *   get:
 *     summary: Get token balance from blockchain
 *     tags: [Ingredients - Blockchain]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token balance retrieved successfully
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/balance/:address/:tokenId', getTokenBalance);

/**
 * @swagger
 * /api/ingredients/blockchain/price/{tokenId}:
 *   get:
 *     summary: Get token price from blockchain
 *     tags: [Ingredients - Blockchain]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Token price retrieved successfully
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/price/:tokenId', getTokenPrice);

/**
 * @swagger
 * /api/ingredients/blockchain/info/{tokenId}:
 *   get:
 *     summary: Get comprehensive token info from blockchain
 *     tags: [Ingredients - Blockchain]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Token info retrieved successfully
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/info/:tokenId', getTokenInfo);

/**
 * @swagger
 * /api/ingredients/blockchain/supply/{tokenId}:
 *   get:
 *     summary: Get token total supply from blockchain
 *     tags: [Ingredients - Blockchain]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Token supply retrieved successfully
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/supply/:tokenId', getTokenSupply);

/**
 * @swagger
 * /api/ingredients/blockchain/exists/{tokenId}:
 *   get:
 *     summary: Check if token exists on blockchain
 *     tags: [Ingredients - Blockchain]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Token existence checked successfully
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/exists/:tokenId', checkTokenExists);

/**
 * @swagger
 * /api/ingredients/blockchain/user-balance/{address}:
 *   get:
 *     summary: Get user's complete token balance for all ingredients
 *     tags: [Ingredients - Blockchain]
 *     description: Retrieves balances for all ingredients registered in the database for a specific wallet address. Only returns non-zero balances.
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *         example: "0x1234567890123456789012345678901234567890"
 *     responses:
 *       200:
 *         description: User balances retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     balances:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tokenContract:
 *                             type: string
 *                           tokenId:
 *                             type: number
 *                           balance:
 *                             type: string
 *                           ingredientDataId:
 *                             type: string
 *                     totalTokens:
 *                       type: number
 *                     allTokensChecked:
 *                       type: number
 *                     contractAddress:
 *                       type: string
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/user-balance/:address', getUserBalance);

/**
 * @swagger
 * /api/ingredients/blockchain/user-inventory/{address}:
 *   get:
 *     summary: Get user's inventory with ingredient metadata
 *     tags: [Ingredients - Blockchain]
 *     description: Retrieves user's token balances combined with ingredient metadata (name, image, etc.). By default, only returns items with non-zero balance.
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *         example: "0x1234567890123456789012345678901234567890"
 *       - in: query
 *         name: includeZero
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Include tokens with zero balance
 *         example: "false"
 *     responses:
 *       200:
 *         description: User inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     inventory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tokenContract:
 *                             type: string
 *                           tokenId:
 *                             type: number
 *                           balance:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                           ingredientDataId:
 *                             type: string
 *                     totalItems:
 *                       type: number
 *                     allTokensChecked:
 *                       type: number
 *                     contractAddress:
 *                       type: string
 *       503:
 *         description: Blockchain service not available
 */
router.get('/blockchain/user-inventory/:address', getUserInventory);

/**
 * @swagger
 * /api/ingredients/blockchain/sync:
 *   post:
 *     summary: Sync ingredient from blockchain and create in database
 *     tags: [Ingredients - Blockchain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenId
 *             properties:
 *               tokenId:
 *                 type: number
 *                 description: Token ID to sync from blockchain
 *                 example: 1
 *               metadata:
 *                 type: object
 *                 description: Additional metadata to merge with blockchain data
 *                 example: { "name": "Custom Wood", "image": "custom-wood.png" }
 *     responses:
 *       201:
 *         description: Ingredient synced from blockchain successfully
 *       404:
 *         description: Token does not exist on blockchain
 *       409:
 *         description: Ingredient already synced
 *       503:
 *         description: Blockchain service not available
 */
router.post('/blockchain/sync', syncIngredientFromBlockchain);

/**
 * @swagger
 * /api/ingredients/blockchain/mint:
 *   post:
 *     summary: Mint new ingredient on blockchain
 *     tags: [Ingredients - Blockchain]
 *     description: Creates a new ERC1155 token on the blockchain and stores metadata in database. Requires MINTER_PRIVATE_KEY to be configured on server.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Ingredient name
 *                 example: "Diamond"
 *               image:
 *                 type: string
 *                 description: Image URL
 *                 example: "https://example.com/diamond.png"
 *               amount:
 *                 type: number
 *                 description: Amount to mint
 *                 example: 1
 *                 default: 1
 *               category:
 *                 type: string
 *                 description: Ingredient category
 *                 example: "Rare"
 *               description:
 *                 type: string
 *                 description: Ingredient description
 *                 example: "A precious gem used in advanced crafting"
 *     responses:
 *       201:
 *         description: Ingredient minted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ingredient:
 *                       type: object
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                         blockNumber:
 *                           type: number
 *                         from:
 *                           type: string
 *                         to:
 *                           type: string
 *       400:
 *         description: Name and image are required
 *       500:
 *         description: Server not configured for minting or minting failed
 *       503:
 *         description: Blockchain connection not available
 */
router.post('/blockchain/mint', mintIngredient);

export default router;

