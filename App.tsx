import 'react-native-reanimated';
import { patchAudioModule } from './src/utils/patchAudio';
patchAudioModule();

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { CardViewScreen }     from './src/screens/CardViewScreen';
import { DeckScreen }        from './src/screens/DeckScreen';
import { FavoritesScreen }   from './src/screens/FavoritesScreen';
import { FormScreen }        from './src/screens/FormScreen';
import { HomeScreen }        from './src/screens/HomeScreen';
import { OnboardingScreen, ONBOARDING_KEY } from './src/screens/OnboardingScreen';
import { PreviewScreen }     from './src/screens/PreviewScreen';
import { ProfileScreen }     from './src/screens/ProfileScreen';
import { SettingsScreen }    from './src/screens/SettingsScreen';
import { ReceiveScreen }     from './src/screens/ReceiveScreen';
import { RootStackParamList } from './src/types/navigation';
import { purgeDeletedRecipes } from './src/utils/storage';
import { retryPendingSyncs } from './src/utils/syncQueue';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['recipecards://'],
  config: {
    screens: {
      CardView: 'card/:cardId',
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Home' | null>(null);

  useEffect(() => {
    async function init() {
      purgeDeletedRecipes();
      retryPendingSyncs();
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      setInitialRoute(done ? 'Home' : 'Onboarding');
    }
    init();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') retryPendingSyncs();
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || !initialRoute) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <LanguageProvider>
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Home"      component={HomeScreen}      />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="Profile"   component={ProfileScreen}   />
          <Stack.Screen name="Settings"  component={SettingsScreen}  />
          <Stack.Screen name="Form"      component={FormScreen}      />
          <Stack.Screen name="Preview"   component={PreviewScreen}   />
          <Stack.Screen name="CardView"  component={CardViewScreen}  />
          <Stack.Screen name="Deck"      component={DeckScreen}      />
          <Stack.Screen name="Receive"   component={ReceiveScreen}   />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </LanguageProvider>
    </GestureHandlerRootView>
  );
}
