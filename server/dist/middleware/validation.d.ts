import { Request, Response, NextFunction } from 'express';
export declare const validateCreateIngredient: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUpdateIngredient: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreateRecipe: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUpdateRecipe: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateBulkCreateRecipes: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schemaName: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map