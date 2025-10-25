"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const recipeIngredientSchema = new mongoose_1.Schema({
    tokenContract: {
        type: String,
        required: [true, 'Token contract address is required'],
        validate: {
            validator: function (v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    tokenId: {
        type: Number,
        required: [true, 'Token ID is required'],
        min: [0, 'Token ID must be non-negative']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be at least 1']
    },
    position: {
        type: Number,
        required: [true, 'Position is required'],
        min: [0, 'Position must be between 0-8'],
        max: [8, 'Position must be between 0-8']
    }
}, { _id: false });
const recipeSchema = new mongoose_1.Schema({
    blockchainRecipeId: {
        type: String,
        required: [true, 'Blockchain recipe ID is required'],
        unique: true
    },
    resultTokenContract: {
        type: String,
        required: [true, 'Result token contract address is required'],
        validate: {
            validator: function (v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    resultTokenId: {
        type: Number,
        required: [true, 'Result token ID is required'],
        min: [0, 'Token ID must be non-negative']
    },
    resultAmount: {
        type: Number,
        required: [true, 'Result amount is required'],
        min: [1, 'Amount must be at least 1'],
        default: 1
    },
    ingredients: {
        type: [recipeIngredientSchema],
        required: [true, 'Ingredients are required'],
        validate: {
            validator: function (ingredients) {
                return ingredients.length > 0;
            },
            message: 'At least one ingredient is required'
        }
    },
    name: {
        type: String,
        required: [true, 'Recipe name is required'],
        trim: true,
        minlength: [1, 'Recipe name must be at least 1 character'],
        maxlength: [100, 'Recipe name must be less than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description must be less than 500 characters']
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category must be less than 50 characters']
    },
    difficulty: {
        type: Number,
        min: [1, 'Difficulty must be at least 1'],
        max: [10, 'Difficulty must be at most 10'],
        default: 1
    },
    craftingTime: {
        type: Number,
        min: [0, 'Crafting time must be non-negative'],
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});
recipeSchema.index({ blockchainRecipeId: 1 });
recipeSchema.index({ resultTokenContract: 1, resultTokenId: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.methods['toJSON'] = function () {
    const obj = this['toObject']();
    obj.id = obj._id;
    delete obj._id;
    return obj;
};
const Recipe = mongoose_1.default.model('Recipe', recipeSchema);
exports.default = Recipe;
//# sourceMappingURL=Recipe.js.map