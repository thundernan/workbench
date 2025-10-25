"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipes = void 0;
const Recipe_1 = __importDefault(require("../models/Recipe"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.getRecipes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const { page = 1, limit = 10, ...filters } = query;
    const filter = {};
    if (filters.blockchainRecipeId)
        filter.blockchainRecipeId = filters.blockchainRecipeId;
    if (filters.resultTokenContract)
        filter.resultTokenContract = filters.resultTokenContract;
    if (filters.resultTokenId !== undefined)
        filter.resultTokenId = filters.resultTokenId;
    if (filters.category)
        filter.category = filters.category;
    if (filters.difficulty !== undefined)
        filter.difficulty = filters.difficulty;
    if (filters.name) {
        filter.name = { $regex: filters.name, $options: 'i' };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [recipes, total] = await Promise.all([
        Recipe_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Recipe_1.default.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / Number(limit));
    const paginationResult = {
        data: recipes,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
    };
    const response = {
        success: true,
        message: 'Recipes retrieved successfully',
        data: paginationResult
    };
    res.status(200).json(response);
});
//# sourceMappingURL=recipeController.js.map