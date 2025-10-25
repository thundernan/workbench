import mongoose from 'mongoose';
import { IIngredientDocument } from '../types';
declare const Ingredient: mongoose.Model<IIngredientDocument, {}, {}, {}, mongoose.Document<unknown, {}, IIngredientDocument, {}, {}> & IIngredientDocument & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Ingredient;
//# sourceMappingURL=Ingredient.d.ts.map