"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIngredients = void 0;
const Ingredient_1 = __importDefault(require("../models/Ingredient"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.getIngredients = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const { page = 1, limit = 10, ...filters } = query;
    const filter = {};
    if (filters.tokenContract)
        filter.tokenContract = filters.tokenContract;
    if (filters.tokenId !== undefined)
        filter.tokenId = filters.tokenId;
    if (filters.position !== undefined)
        filter.position = filters.position;
    if (filters.name) {
        filter.name = { $regex: filters.name, $options: 'i' };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [ingredients, total] = await Promise.all([
        Ingredient_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Ingredient_1.default.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / Number(limit));
    const paginationResult = {
        data: ingredients,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
    };
    const response = {
        success: true,
        message: 'Ingredients retrieved successfully',
        data: paginationResult
    };
    res.status(200).json(response);
});
//# sourceMappingURL=ingredientController.js.map