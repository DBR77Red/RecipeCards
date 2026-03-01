import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CardViewScreen } from './src/screens/CardViewScreen';
import { FormScreen }     from './src/screens/FormScreen';
import { HomeScreen }     from './src/screens/HomeScreen';
import { PreviewScreen }  from './src/screens/PreviewScreen';
import { RootStackParamList } from './src/types/navigation';

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
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home"    component={HomeScreen}    />
          <Stack.Screen name="Form"    component={FormScreen}    />
          <Stack.Screen name="Preview"  component={PreviewScreen}  />
          <Stack.Screen name="CardView" component={CardViewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
