import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '../components/BottomTabBar';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { TabStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<TabStackParamList, 'Settings'>;

const C = {
  bg:      '#FAF5EE',
  card:    '#FFFFFF',
  title:   '#1C0A00',
  muted:   '#8B6444',
  label:   '#C4A882',
  divider: '#E0D0B8',
  btnBg:   '#E8521A',
  panel:   '#1C0F06',
  panelText: '#F5EDD9',
};

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English'   },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'de', label: 'DE', name: 'Deutsch'   },
  { code: 'es', label: 'ES', name: 'Español'   },
];

export function SettingsScreen({ navigation }: Props) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settingsTitle}</Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.content}>
        <Text style={styles.sectionLabel}>{t.profileLanguageLabel}</Text>
        <View style={styles.card}>
          {LANGS.map(({ code, label, name }, i) => (
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
                {name}
              </Text>
              {language === code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </View>

      <BottomTabBar activeTab="Settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.panel },
  contentWrapper: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.panel,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: C.panelText,
    letterSpacing: -1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  sectionLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
    lineHeight: 20,
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
});
