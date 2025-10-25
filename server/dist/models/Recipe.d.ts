import mongoose from 'mongoose';
import { IRecipeDocument } from '../types';
declare const Recipe: mongoose.Model<IRecipeDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRecipeDocument, {}, {}> & IRecipeDocument & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default Recipe;
//# sourceMappingURL=Recipe.d.ts.map