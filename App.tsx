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
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveTab, BottomTabBar } from './src/components/BottomTabBar';
import { LanguageProvider } from './src/context/LanguageContext';
import { TabBarProvider, useTabBar } from './src/context/TabBarContext';
import { CardViewScreen }     from './src/screens/CardViewScreen';
import { DeckScreen }        from './src/screens/DeckScreen';
import { FavoritesScreen }   from './src/screens/FavoritesScreen';
import { FormScreen }        from './src/screens/FormScreen';
import { HomeScreen }        from './src/screens/HomeScreen';
import { OnboardingScreen, ONBOARDING_KEY } from './src/screens/OnboardingScreen';
import { PreviewScreen }     from './src/screens/PreviewScreen';
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

const TAB_SCREENS = new Set(['Home', 'Favorites', 'Settings']);

// Rendered inside NavigationContainer so it can access TabBarContext
function InnerLayout({
  initialRoute,
  currentRoute,
  navigate,
}: {
  initialRoute: 'Onboarding' | 'Home';
  currentRoute: string | null;
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
}) {
  const { callbacksRef } = useTabBar();

  const showTabBar = !!currentRoute && TAB_SCREENS.has(currentRoute);
  const activeTab = (showTabBar ? currentRoute : 'Home') as ActiveTab;

  const handleHomePress = useCallback(() => {
    callbacksRef.current.onHomePress?.();
  }, [callbacksRef]);

  const handleExchange = useCallback(() => {
    callbacksRef.current.onExchange?.();
  }, [callbacksRef]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#FAF5EE' } }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false, contentStyle: { backgroundColor: '#1C0F06' } }} />
        <Stack.Screen name="Home"      component={HomeScreen}       options={{ animation: 'none', contentStyle: { backgroundColor: '#1C0F06' } }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen}  options={{ animation: 'none' }} />
        <Stack.Screen name="Settings"  component={SettingsScreen}   options={{ animation: 'none' }} />
        <Stack.Screen name="Form"      component={FormScreen}       />
        <Stack.Screen name="Preview"   component={PreviewScreen}    options={{ contentStyle: { backgroundColor: '#1C0F06' } }} />
        <Stack.Screen name="CardView"  component={CardViewScreen}   options={{ contentStyle: { backgroundColor: '#0f0d0b' } }} />
        <Stack.Screen name="Deck"      component={DeckScreen}       options={{ contentStyle: { backgroundColor: '#0f0d0b' } }} />
        <Stack.Screen name="Receive"   component={ReceiveScreen}    options={{ contentStyle: { backgroundColor: '#1C0F06' } }} />
      </Stack.Navigator>
      {showTabBar && (
        <BottomTabBar
          activeTab={activeTab}
          navigate={navigate}
          onHomePress={handleHomePress}
          onExchange={handleExchange}
        />
      )}
    </View>
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

  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Home' | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  const navigate = useCallback(
    (screen: keyof RootStackParamList, params?: any) => {
      navigationRef.navigate(screen as any, params);
    },
    [navigationRef],
  );

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
        <TabBarProvider>
          <SafeAreaProvider>
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name ?? null)}
              onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name ?? null)}
            >
              <InnerLayout
                initialRoute={initialRoute}
                currentRoute={currentRoute}
                navigate={navigate}
              />
            </NavigationContainer>
          </SafeAreaProvider>
        </TabBarProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
