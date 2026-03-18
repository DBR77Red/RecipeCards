import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';

export const ONBOARDING_KEY = '@recipecards/onboardingDone';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useLanguage();

  const handleStart = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <Svg width={48} height={48} viewBox="0 0 24 24" style={styles.logoIcon}>
          <Path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            stroke="#EA580C" strokeWidth={1.5} strokeLinecap="round" fill="none"
          />
          <Path
            d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
            stroke="#EA580C" strokeWidth={1.5} fill="none"
          />
          <Path d="M9 12h6M9 16h4" stroke="#EA580C" strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
        <Text style={styles.appName}>Recipe Cards</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyArea}>
        <Text style={styles.bodyText}>{t.onboardingBody}</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{t.onboardingBtn}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1C0F06',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    marginBottom: 16,
  },
  appName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#F5EDD9',
    letterSpacing: -0.5,
  },
  bodyArea: {
    marginBottom: 48,
  },
  bodyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#C4A882',
    lineHeight: 26,
    textAlign: 'center',
  },
  ctaArea: {
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#E8521A',
    borderRadius: 100,
    height: 54,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  startBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
