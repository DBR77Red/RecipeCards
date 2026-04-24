import { RecipeData } from '../components/RecipeCard';

export type TabStackParamList = {
  Home: { openExchange?: boolean } | undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  _tabs: undefined;
  Form: { recipe?: RecipeData };
  Preview: { recipe: RecipeData; celebrate?: boolean };
  CardView: { cardId: string; recipes?: RecipeData[] };
  Receive: { cardId: string };
  Deck: { recipes: RecipeData[]; startCardId?: string };
};
