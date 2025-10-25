"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const craftingController_1 = require("../controllers/craftingController");
const router = (0, express_1.Router)();
router.post('/craft', craftingController_1.craftIngredient);
router.get('/recipes/:gridSize', craftingController_1.getRecipesForGridSize);
router.post('/preview', craftingController_1.getCraftingPreview);
exports.default = router;
//# sourceMappingURL=craftingRoutes.js.map