import { RecipeData } from '../components/RecipeCard';

export type RootStackParamList = {
  Home: undefined;
  Form: { recipe?: RecipeData };
  Preview: { recipe: RecipeData };
  CardView: { cardId: string };
};
