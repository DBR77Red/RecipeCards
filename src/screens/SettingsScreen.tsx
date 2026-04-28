import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
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
import { getUserName, setUserName } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const C = {
  bg:       '#FAF5EE',
  card:     '#FFFFFF',
  title:    '#1C0A00',
  muted:    '#8B6444',
  label:    '#C4A882',
  divider:  '#E0D0B8',
  btnBg:    '#E8521A',
  btnText:  '#FFFFFF',
  panel:    '#1C0F06',
  panelText:'#F5EDD9',
};

const LANGS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English'   },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'de', label: 'DE', name: 'Deutsch'   },
  { code: 'es', label: 'ES', name: 'Español'   },
];

export function SettingsScreen({}: Props) {
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getUserName().then(setName);
  }, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: confirmVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [confirmVisible]);

  const handleSave = () => {
    if (!name.trim()) return;
    setConfirmVisible(true);
  };

  const confirmSave = async () => {
    setConfirmVisible(false);
    await setUserName(name.trim());
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settingsTitle}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.contentWrapper} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>{t.profileLanguageLabel}</Text>
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

          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t.profileNameSub}</Text>
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

      <Modal visible={confirmVisible} transparent animationType="none" onRequestClose={() => setConfirmVisible(false)}>
        <Animated.View style={[modalStyles.overlay, { opacity: anim }]}>
          <Animated.View style={[modalStyles.sheet, { transform: [{ translateY }] }]}>
            <Text style={modalStyles.title}>{name.trim()}</Text>
            <Text style={modalStyles.headline}>{t.saveNameConfirmHeadline}</Text>
            <Text style={modalStyles.body}>{t.saveNameConfirmBody}</Text>
            <TouchableOpacity style={modalStyles.confirmBtn} onPress={confirmSave}>
              <Text style={modalStyles.confirmBtnText}>{t.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setConfirmVisible(false)}>
              <Text style={modalStyles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.panel },
  flex:   { flex: 1 },

  header: {
    backgroundColor: C.panel,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 54,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    lineHeight: 42,
    color: C.panelText,
    letterSpacing: -1,
  },

  contentWrapper: { flex: 1, backgroundColor: C.bg },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
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

  saveBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: C.bg,
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: C.title,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 17,
    color: C.title,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: C.muted,
    lineHeight: 24,
  },
  confirmBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  confirmBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
  },
});
