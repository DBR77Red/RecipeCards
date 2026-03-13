import { RecipeData } from '../components/RecipeCard';

export type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  Form: { recipe?: RecipeData };
  Preview: { recipe: RecipeData; celebrate?: boolean };
  CardView: { cardId: string };
  Receive: { cardId: string };
};
