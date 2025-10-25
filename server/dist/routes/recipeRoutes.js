"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recipeController_1 = require("../controllers/recipeController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.get('/', validation_1.validateQuery, recipeController_1.getRecipes);
exports.default = router;
//# sourceMappingURL=recipeRoutes.js.map