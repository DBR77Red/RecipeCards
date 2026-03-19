import { RecipeData } from '../components/RecipeCard';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  Form: { recipe?: RecipeData };
  Preview: { recipe: RecipeData; celebrate?: boolean };
  CardView: { cardId: string };
  Receive: { cardId: string };
  Deck: { recipes: RecipeData[]; startCardId?: string };
};
