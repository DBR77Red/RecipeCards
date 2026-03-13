import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { RootStackParamList } from '../types/navigation';
import { BottomTabBar } from '../components/BottomTabBar';
import { getUserName, setUserName } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const C = {
  bg:      '#FAFAF9',
  card:    '#FFFFFF',
  title:   '#1C1917',
  body:    '#44403C',
  muted:   '#78716C',
  label:   '#A8A29E',
  divider: '#E7E5E4',
  btnBg:   '#1C1917',
  btnText: '#F7F5F2',
};

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English'    },
  { code: 'pt', label: 'PT', name: 'Português'  },
  { code: 'de', label: 'DE', name: 'Deutsch'    },
  { code: 'es', label: 'ES', name: 'Español'    },
];

export function ProfileScreen({ navigation }: Props) {
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState('');

  useEffect(() => {
    getUserName().then(setName);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    await setUserName(name.trim());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profileTitle}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name section */}
          <Text style={styles.sectionLabel}>{t.profileNameSub}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.profileNamePlaceholder}
              placeholderTextColor={C.label}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Language section */}
          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t.profileLanguageLabel}</Text>
          <View style={styles.card}>
            {LANGS.map(({ code, label, name: langName }, i) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.langRow,
                  i < LANGS.length - 1 && styles.langRowBorder,
                  language === code && styles.langRowActive,
                ]}
                onPress={() => setLanguage(code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langLabel, language === code && styles.langLabelActive]}>
                  {label}
                </Text>
                <Text style={[styles.langName, language === code && styles.langNameActive]}>
                  {langName}
                </Text>
                {language === code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{t.save}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomTabBar activeTab="Profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  flex:   { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: C.title,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  sectionLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  input: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: C.title,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  langRowActive: {
    backgroundColor: '#FAFAF9',
  },
  langLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.label,
    letterSpacing: 1,
    width: 28,
  },
  langLabelActive: {
    color: C.title,
  },
  langName: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: C.muted,
  },
  langNameActive: {
    color: C.title,
    fontFamily: 'DMSans_500Medium',
  },
  checkmark: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnBg,
  },

  saveBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
  },
});
