import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { RootStackParamList } from '../types/navigation';
import { setUserName } from '../utils/storage';

export const ONBOARDING_KEY = '@recipecards/onboardingDone';

const SCREEN_W = Dimensions.get('window').width;

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const LANG_OPTIONS: { code: Language; label: string; sub: string }[] = [
  { code: 'en', label: 'English',    sub: 'English'    },
  { code: 'pt', label: 'Português',  sub: 'Portuguese' },
  { code: 'de', label: 'Deutsch',    sub: 'German'     },
  { code: 'es', label: 'Español',    sub: 'Spanish'    },
];

export function OnboardingScreen({ navigation }: Props) {
  const { t, setLanguage, language } = useLanguage();

  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [name, setName] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToStep = (next: number) => {
    Animated.timing(slideAnim, {
      toValue: -next * SCREEN_W,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setStep(next));
  };

  const handleBack = () => {
    Keyboard.dismiss();
    goToStep(step - 1);
  };

  const handleGetStarted = () => {
    goToStep(1);
  };

  const handleLangNext = () => {
    setLanguage(selectedLang);
    goToStep(2);
  };

  const handleFinish = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    await setUserName(trimmed);
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    navigation.replace('Home');
  };

  const canFinish = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      {step > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7} hitSlop={12}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M15 18l-6-6 6-6" stroke="#C4A882" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </TouchableOpacity>
      )}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.track,
            { width: SCREEN_W * 3, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* ── Step 0: Welcome ── */}
          <View style={[styles.panel, { width: SCREEN_W }]}>
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

            <View style={styles.bodyArea}>
              <Text style={styles.bodyText}>{t.onboardingBody}</Text>
            </View>

            <View style={styles.ctaArea}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t.onboardingBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Step 1: Language picker ── */}
          <View style={[styles.panel, { width: SCREEN_W }]}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{t.onboardingStep1Title}</Text>
            </View>

            <View style={styles.langGrid}>
              {LANG_OPTIONS.map(opt => {
                const active = selectedLang === opt.code;
                return (
                  <Pressable
                    key={opt.code}
                    style={[styles.langPill, active && styles.langPillActive]}
                    onPress={() => setSelectedLang(opt.code)}
                  >
                    <Text style={[styles.langPillLabel, active && styles.langPillLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.langPillSub, active && styles.langPillSubActive]}>
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.ctaArea}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleLangNext} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t.onboardingNext}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Step 2: Name entry ── */}
          <View style={[styles.panel, { width: SCREEN_W }]}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{t.onboardingStep2Title}</Text>
              <Text style={styles.stepSub}>{t.onboardingStep2Sub}</Text>
            </View>

            <View style={styles.nameArea}>
              <TextInput
                style={styles.nameInput}
                placeholder={t.onboardingStep2Placeholder}
                placeholderTextColor="#8B6444"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleFinish}
                maxLength={40}
              />
            </View>

            <View style={styles.ctaArea}>
              <TouchableOpacity
                style={[styles.primaryBtn, !canFinish && styles.primaryBtnDisabled]}
                onPress={handleFinish}
                activeOpacity={canFinish ? 0.85 : 1}
                disabled={!canFinish}
              >
                <Text style={styles.primaryBtnText}>{t.onboardingFinish}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1C0F06',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 60,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D2010',
  },
  dotActive: {
    backgroundColor: '#E8521A',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },

  // ── Welcome ──────────────────────────────────────────────────────────────────
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

  // ── Step header ───────────────────────────────────────────────────────────────
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#F5EDD9',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#C4A882',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Language grid ────────────────────────────────────────────────────────────
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 48,
  },
  langPill: {
    width: (SCREEN_W - 64 - 12) / 2,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D2010',
    backgroundColor: '#261208',
    alignItems: 'center',
  },
  langPillActive: {
    borderColor: '#E8521A',
    backgroundColor: '#3D1A08',
  },
  langPillLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: '#C4A882',
    marginBottom: 2,
  },
  langPillLabelActive: {
    color: '#F5EDD9',
  },
  langPillSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#5C3A22',
  },
  langPillSubActive: {
    color: '#C4A882',
  },

  // ── Name input ───────────────────────────────────────────────────────────────
  nameArea: {
    marginBottom: 32,
  },
  nameInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: '#F5EDD9',
    backgroundColor: '#261208',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D2010',
    height: 60,
    paddingHorizontal: 20,
    textAlign: 'center',
  },

  // ── CTA ──────────────────────────────────────────────────────────────────────
  ctaArea: {
    alignItems: 'center',
  },
  primaryBtn: {
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
  primaryBtnDisabled: {
    backgroundColor: '#5C2E10',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
