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
const ingredientSchema = new mongoose_1.Schema({
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
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [1, 'Name must be at least 1 character'],
        maxlength: [100, 'Name must be less than 100 characters']
    },
    image: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                if (v === null || v === '')
                    return true;
                try {
                    new URL(v);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'Image must be a valid URL or null'
        }
    },
    recipeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Recipe',
        default: null,
        validate: {
            validator: function (v) {
                return v === null || mongoose_1.default.Types.ObjectId.isValid(v);
            },
            message: 'Recipe ID must be a valid ObjectId or null'
        }
    }
}, {
    timestamps: true,
    versionKey: false
});
ingredientSchema.index({ tokenContract: 1, tokenId: 1 });
ingredientSchema.index({ position: 1 });
ingredientSchema.index({ createdAt: -1 });
ingredientSchema.index({ name: 1 });
ingredientSchema.index({ recipeId: 1 });
ingredientSchema.virtual('recipe', {
    ref: 'Recipe',
    localField: 'recipeId',
    foreignField: '_id',
    justOne: true
});
ingredientSchema.set('toJSON', { virtuals: true });
ingredientSchema.set('toObject', { virtuals: true });
ingredientSchema.statics['findBaseIngredients'] = function () {
    return this.find({ recipeId: null });
};
ingredientSchema.statics['findCraftableIngredients'] = function () {
    return this.find({ recipeId: { $ne: null } }).populate('recipe');
};
ingredientSchema.methods['toJSON'] = function () {
    const obj = this['toObject']();
    obj.id = obj._id;
    delete obj._id;
    return obj;
};
const Ingredient = mongoose_1.default.model('Ingredient', ingredientSchema);
exports.default = Ingredient;
//# sourceMappingURL=Ingredient.js.map