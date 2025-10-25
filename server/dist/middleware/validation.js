"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.validateBulkCreateRecipes = exports.validateUpdateRecipe = exports.validateCreateRecipe = exports.validateParams = exports.validateQuery = exports.validateUpdateIngredient = exports.validateCreateIngredient = void 0;
const joi_1 = __importDefault(require("joi"));
const createIngredientSchema = joi_1.default.object({
    tokenContract: joi_1.default.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .required()
        .messages({
        'string.pattern.base': 'Token contract must be a valid Ethereum address',
        'any.required': 'Token contract address is required'
    }),
    tokenId: joi_1.default.number()
        .integer()
        .min(0)
        .required()
        .messages({
        'number.base': 'Token ID must be a number',
        'number.integer': 'Token ID must be an integer',
        'number.min': 'Token ID must be non-negative',
        'any.required': 'Token ID is required'
    }),
    amount: joi_1.default.number()
        .integer()
        .min(1)
        .required()
        .messages({
        'number.base': 'Amount must be a number',
        'number.integer': 'Amount must be an integer',
        'number.min': 'Amount must be at least 1',
        'any.required': 'Amount is required'
    }),
    position: joi_1.default.number()
        .integer()
        .min(0)
        .max(8)
        .required()
        .messages({
        'number.base': 'Position must be a number',
        'number.integer': 'Position must be an integer',
        'number.min': 'Position must be between 0-8',
        'number.max': 'Position must be between 0-8',
        'any.required': 'Position is required'
    }),
    name: joi_1.default.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 100 characters',
        'any.required': 'Name is required'
    }),
    image: joi_1.default.string()
        .uri()
        .allow(null, '')
        .optional()
        .messages({
        'string.uri': 'Image must be a valid URL'
    }),
    recipeId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional()
        .messages({
        'string.pattern.base': 'Recipe ID must be a valid MongoDB ObjectId or null'
    })
});
const updateIngredientSchema = joi_1.default.object({
    tokenContract: joi_1.default.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Token contract must be a valid Ethereum address'
    }),
    tokenId: joi_1.default.number()
        .integer()
        .min(0)
        .optional()
        .messages({
        'number.base': 'Token ID must be a number',
        'number.integer': 'Token ID must be an integer',
        'number.min': 'Token ID must be non-negative'
    }),
    amount: joi_1.default.number()
        .integer()
        .min(1)
        .optional()
        .messages({
        'number.base': 'Amount must be a number',
        'number.integer': 'Amount must be an integer',
        'number.min': 'Amount must be at least 1'
    }),
    position: joi_1.default.number()
        .integer()
        .min(0)
        .max(8)
        .optional()
        .messages({
        'number.base': 'Position must be a number',
        'number.integer': 'Position must be an integer',
        'number.min': 'Position must be between 0-8',
        'number.max': 'Position must be between 0-8'
    }),
    name: joi_1.default.string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 100 characters'
    }),
    image: joi_1.default.string()
        .uri()
        .allow(null, '')
        .optional()
        .messages({
        'string.uri': 'Image must be a valid URL'
    }),
    recipeId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional()
        .messages({
        'string.pattern.base': 'Recipe ID must be a valid MongoDB ObjectId or null'
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});
const querySchema = joi_1.default.object({
    tokenContract: joi_1.default.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
    tokenId: joi_1.default.number()
        .integer()
        .min(0)
        .optional(),
    position: joi_1.default.number()
        .integer()
        .min(0)
        .max(8)
        .optional(),
    page: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .optional(),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .optional()
});
const paramsSchema = joi_1.default.object({
    id: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
        'string.pattern.base': 'Invalid MongoDB ObjectId format',
        'any.required': 'Ingredient ID is required'
    })
});
const validateCreateIngredient = (req, res, next) => {
    const { error, value } = createIngredientSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.details[0]?.message || 'Invalid input'
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateCreateIngredient = validateCreateIngredient;
const validateUpdateIngredient = (req, res, next) => {
    const { error, value } = updateIngredientSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.details[0]?.message || 'Invalid input'
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateUpdateIngredient = validateUpdateIngredient;
const validateQuery = (req, res, next) => {
    const { error, value } = querySchema.validate(req.query);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Query validation error',
            error: error.details[0]?.message || 'Invalid query'
        });
        return;
    }
    req.query = value;
    next();
};
exports.validateQuery = validateQuery;
const validateParams = (req, res, next) => {
    const { error, value } = paramsSchema.validate(req.params);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Parameter validation error',
            error: error.details[0]?.message || 'Invalid parameter'
        });
        return;
    }
    req.params = value;
    next();
};
exports.validateParams = validateParams;
const recipeIngredientSchema = joi_1.default.object({
    ingredientId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
        'string.pattern.base': 'Ingredient ID must be a valid MongoDB ObjectId',
        'any.required': 'Ingredient ID is required'
    }),
    amount: joi_1.default.number()
        .integer()
        .min(1)
        .required()
        .messages({
        'number.base': 'Amount must be a number',
        'number.integer': 'Amount must be an integer',
        'number.min': 'Amount must be at least 1',
        'any.required': 'Amount is required'
    }),
    position: joi_1.default.number()
        .integer()
        .min(0)
        .max(8)
        .required()
        .messages({
        'number.base': 'Position must be a number',
        'number.integer': 'Position must be an integer',
        'number.min': 'Position must be between 0-8',
        'number.max': 'Position must be between 0-8',
        'any.required': 'Position is required'
    })
});
const createRecipeSchema = joi_1.default.object({
    name: joi_1.default.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 100 characters',
        'any.required': 'Name is required'
    }),
    description: joi_1.default.string()
        .trim()
        .max(500)
        .optional()
        .messages({
        'string.base': 'Description must be a string',
        'string.max': 'Description must be less than 500 characters'
    }),
    ingredients: joi_1.default.array()
        .items(recipeIngredientSchema)
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one ingredient is required',
        'any.required': 'Ingredients are required'
    }),
    resultIngredientId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
        'string.pattern.base': 'Result ingredient ID must be a valid MongoDB ObjectId',
        'any.required': 'Result ingredient ID is required'
    }),
    craftingTime: joi_1.default.number()
        .min(0)
        .optional()
        .messages({
        'number.base': 'Crafting time must be a number',
        'number.min': 'Crafting time must be non-negative'
    }),
    difficulty: joi_1.default.number()
        .integer()
        .min(1)
        .max(10)
        .optional()
        .messages({
        'number.base': 'Difficulty must be a number',
        'number.integer': 'Difficulty must be an integer',
        'number.min': 'Difficulty must be at least 1',
        'number.max': 'Difficulty must be at most 10'
    }),
    category: joi_1.default.string()
        .trim()
        .max(50)
        .optional()
        .messages({
        'string.base': 'Category must be a string',
        'string.max': 'Category must be less than 50 characters'
    })
});
const updateRecipeSchema = joi_1.default.object({
    name: joi_1.default.string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 100 characters'
    }),
    description: joi_1.default.string()
        .trim()
        .max(500)
        .optional()
        .messages({
        'string.base': 'Description must be a string',
        'string.max': 'Description must be less than 500 characters'
    }),
    ingredients: joi_1.default.array()
        .items(recipeIngredientSchema)
        .min(1)
        .optional()
        .messages({
        'array.min': 'At least one ingredient is required'
    }),
    resultIngredientId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Result ingredient ID must be a valid MongoDB ObjectId'
    }),
    craftingTime: joi_1.default.number()
        .min(0)
        .optional()
        .messages({
        'number.base': 'Crafting time must be a number',
        'number.min': 'Crafting time must be non-negative'
    }),
    difficulty: joi_1.default.number()
        .integer()
        .min(1)
        .max(10)
        .optional()
        .messages({
        'number.base': 'Difficulty must be a number',
        'number.integer': 'Difficulty must be an integer',
        'number.min': 'Difficulty must be at least 1',
        'number.max': 'Difficulty must be at most 10'
    }),
    category: joi_1.default.string()
        .trim()
        .max(50)
        .optional()
        .messages({
        'string.base': 'Category must be a string',
        'string.max': 'Category must be less than 50 characters'
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});
const bulkCreateRecipesSchema = joi_1.default.object({
    recipes: joi_1.default.array()
        .items(createRecipeSchema)
        .min(1)
        .required()
        .messages({
        'array.min': 'At least one recipe is required',
        'any.required': 'Recipes array is required'
    })
});
const validateCreateRecipe = (req, res, next) => {
    const { error, value } = createRecipeSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.details[0]?.message || 'Invalid input'
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateCreateRecipe = validateCreateRecipe;
const validateUpdateRecipe = (req, res, next) => {
    const { error, value } = updateRecipeSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.details[0]?.message || 'Invalid input'
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateUpdateRecipe = validateUpdateRecipe;
const validateBulkCreateRecipes = (req, res, next) => {
    const { error, value } = bulkCreateRecipesSchema.validate(req.body);
    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.details[0]?.message || 'Invalid input'
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateBulkCreateRecipes = validateBulkCreateRecipes;
const validateRequest = (schemaName) => {
    const schemas = {
        createIngredient: createIngredientSchema,
        updateIngredient: updateIngredientSchema,
        createRecipe: createRecipeSchema,
        updateRecipe: updateRecipeSchema,
        bulkCreateRecipes: bulkCreateRecipesSchema
    };
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            res.status(500).json({
                success: false,
                message: 'Invalid validation schema'
            });
            return;
        }
        const { error, value } = schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0]?.message || 'Invalid input'
            });
            return;
        }
        req.body = value;
        next();
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map