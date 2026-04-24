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
import { RootStackParamList, TabStackParamList } from './src/types/navigation';
import { purgeDeletedRecipes } from './src/utils/storage';
import { retryPendingSyncs } from './src/utils/syncQueue';

enableScreens();

const TabStack = createNativeStackNavigator<TabStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['recipecards://'],
  config: {
    screens: {
      CardView: 'card/:cardId',
    },
  },
};

function TabNavigator() {
  return (
    <TabStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <TabStack.Screen name="Home"      component={HomeScreen} />
      <TabStack.Screen name="Favorites" component={FavoritesScreen} />
      <TabStack.Screen name="Profile"   component={ProfileScreen} />
      <TabStack.Screen name="Settings"  component={SettingsScreen} />
    </TabStack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [initialRoute, setInitialRoute] = useState<'Onboarding' | '_tabs' | null>(null);

  useEffect(() => {
    async function init() {
      purgeDeletedRecipes();
      retryPendingSyncs();
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      setInitialRoute(done ? '_tabs' : 'Onboarding');
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
<RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#FAF5EE' } }}>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false, contentStyle: { backgroundColor: '#1C0F06' } }} />
          <RootStack.Screen name="_tabs" component={TabNavigator} />
          <RootStack.Screen name="Form"      component={FormScreen}       />
          <RootStack.Screen name="Preview"   component={PreviewScreen}    options={{ contentStyle: { backgroundColor: '#1C0F06' } }} />
          <RootStack.Screen name="CardView"  component={CardViewScreen}   options={{ contentStyle: { backgroundColor: '#0f0d0b' } }} />
          <RootStack.Screen name="Deck"      component={DeckScreen}       options={{ contentStyle: { backgroundColor: '#0f0d0b' } }} />
          <RootStack.Screen name="Receive"   component={ReceiveScreen}    options={{ contentStyle: { backgroundColor: '#1C0F06' } }} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </LanguageProvider>
    </GestureHandlerRootView>
  );
}
