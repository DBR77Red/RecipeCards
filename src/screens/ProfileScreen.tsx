import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';
import { getUserName, setUserName } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const C = {
  bg:      '#FAF5EE',
  card:    '#FFFFFF',
  title:   '#1C0A00',
  muted:   '#8B6444',
  label:   '#C4A882',
  divider: '#E0D0B8',
  btnBg:   '#E8521A',
  btnText: '#FFFFFF',
};

export function ProfileScreen({ navigation }: Props) {
  const { t } = useLanguage();
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.profileTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
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
              autoFocus
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  flex:   { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 20,
    color: C.muted,
    minWidth: 32,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.title,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSpacer: { minWidth: 32 },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    marginTop: 36,
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
});
