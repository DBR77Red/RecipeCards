import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '../components/BottomTabBar';
import { useLanguage } from '../context/LanguageContext';
import { TabStackParamList } from '../types/navigation';
import { getUserName, setUserName } from '../utils/storage';

type Props = NativeStackScreenProps<TabStackParamList, 'Profile'>;

const C = {
  bg:      '#FAF5EE',
  card:    '#FFFFFF',
  title:   '#1C0A00',
  muted:   '#8B6444',
  label:   '#C4A882',
  divider: '#E0D0B8',
  btnBg:   '#E8521A',
  btnText: '#FFFFFF',
  panel:   '#1C0F06',
  panelText: '#F5EDD9',
};

export function ProfileScreen({ navigation }: Props) {
  const { t } = useLanguage();
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
    navigation.goBack();
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profileTitle}</Text>
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
      <BottomTabBar activeTab="Profile" />
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
    paddingBottom: 35,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: C.panelText,
    letterSpacing: -1,
  },

  content: {
    flex: 1,
    backgroundColor: C.bg,
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
