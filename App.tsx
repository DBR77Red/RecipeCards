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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { CardViewScreen } from './src/screens/CardViewScreen';
import { FormScreen }     from './src/screens/FormScreen';
import { HomeScreen }     from './src/screens/HomeScreen';
import { PreviewScreen }  from './src/screens/PreviewScreen';
import { ReceiveScreen }  from './src/screens/ReceiveScreen';
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

  useEffect(() => {
    purgeDeletedRecipes();
    retryPendingSyncs();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') retryPendingSyncs();
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <LanguageProvider>
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home"    component={HomeScreen}    />
          <Stack.Screen name="Form"    component={FormScreen}    />
          <Stack.Screen name="Preview"  component={PreviewScreen}  />
          <Stack.Screen name="CardView" component={CardViewScreen} />
          <Stack.Screen name="Receive"  component={ReceiveScreen}  />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </LanguageProvider>
  );
}
