"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ingredientController_1 = require("../controllers/ingredientController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.get('/', validation_1.validateQuery, ingredientController_1.getIngredients);
exports.default = router;
//# sourceMappingURL=ingredientRoutes.js.map