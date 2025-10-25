import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
const createIngredientSchema = Joi.object({
  tokenContract: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Token contract must be a valid Ethereum address',
      'any.required': 'Token contract address is required'
    }),
  tokenId: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Token ID must be a number',
      'number.integer': 'Token ID must be an integer',
      'number.min': 'Token ID must be non-negative',
      'any.required': 'Token ID is required'
    }),
  amount: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.integer': 'Amount must be an integer',
      'number.min': 'Amount must be at least 1',
      'any.required': 'Amount is required'
    }),
  position: Joi.number()
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
  name: Joi.string()
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
  image: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Image must be a valid URL'
    }),
  recipeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Recipe ID must be a valid MongoDB ObjectId or null'
    })
});

const updateIngredientSchema = Joi.object({
  tokenContract: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Token contract must be a valid Ethereum address'
    }),
  tokenId: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Token ID must be a number',
      'number.integer': 'Token ID must be an integer',
      'number.min': 'Token ID must be non-negative'
    }),
  amount: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Amount must be a number',
      'number.integer': 'Amount must be an integer',
      'number.min': 'Amount must be at least 1'
    }),
  position: Joi.number()
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
  name: Joi.string()
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
  image: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Image must be a valid URL'
    }),
  recipeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Recipe ID must be a valid MongoDB ObjectId or null'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const querySchema = Joi.object({
  tokenContract: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  tokenId: Joi.number()
    .integer()
    .min(0)
    .optional(),
  position: Joi.number()
    .integer()
    .min(0)
    .max(8)
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
});

const paramsSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid MongoDB ObjectId format',
      'any.required': 'Ingredient ID is required'
    })
});

// Validation middleware functions
export const validateCreateIngredient = (req: Request, res: Response, next: NextFunction): void => {
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

export const validateUpdateIngredient = (req: Request, res: Response, next: NextFunction): void => {
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

export const validateQuery = (req: Request, res: Response, next: NextFunction): void => {
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

export const validateParams = (req: Request, res: Response, next: NextFunction): void => {
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

// Recipe validation schemas
const recipeIngredientSchema = Joi.object({
  ingredientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Ingredient ID must be a valid MongoDB ObjectId',
      'any.required': 'Ingredient ID is required'
    }),
  amount: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.integer': 'Amount must be an integer',
      'number.min': 'Amount must be at least 1',
      'any.required': 'Amount is required'
    }),
  position: Joi.number()
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

const createRecipeSchema = Joi.object({
  name: Joi.string()
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
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must be less than 500 characters'
    }),
  ingredients: Joi.array()
    .items(recipeIngredientSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one ingredient is required',
      'any.required': 'Ingredients are required'
    }),
  resultIngredientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Result ingredient ID must be a valid MongoDB ObjectId',
      'any.required': 'Result ingredient ID is required'
    }),
  craftingTime: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Crafting time must be a number',
      'number.min': 'Crafting time must be non-negative'
    }),
  difficulty: Joi.number()
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
  category: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.base': 'Category must be a string',
      'string.max': 'Category must be less than 50 characters'
    })
});

const updateRecipeSchema = Joi.object({
  name: Joi.string()
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
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must be less than 500 characters'
    }),
  ingredients: Joi.array()
    .items(recipeIngredientSchema)
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one ingredient is required'
    }),
  resultIngredientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Result ingredient ID must be a valid MongoDB ObjectId'
    }),
  craftingTime: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Crafting time must be a number',
      'number.min': 'Crafting time must be non-negative'
    }),
  difficulty: Joi.number()
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
  category: Joi.string()
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

const bulkCreateRecipesSchema = Joi.object({
  recipes: Joi.array()
    .items(createRecipeSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one recipe is required',
      'any.required': 'Recipes array is required'
    })
});

// Recipe validation middleware functions
export const validateCreateRecipe = (req: Request, res: Response, next: NextFunction): void => {
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

export const validateUpdateRecipe = (req: Request, res: Response, next: NextFunction): void => {
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

export const validateBulkCreateRecipes = (req: Request, res: Response, next: NextFunction): void => {
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

// Generic validation middleware factory
export const validateRequest = (schemaName: string) => {
  const schemas: { [key: string]: Joi.ObjectSchema } = {
    createIngredient: createIngredientSchema,
    updateIngredient: updateIngredientSchema,
    createRecipe: createRecipeSchema,
    updateRecipe: updateRecipeSchema,
    bulkCreateRecipes: bulkCreateRecipesSchema
  };

  return (req: Request, res: Response, next: NextFunction): void => {
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
