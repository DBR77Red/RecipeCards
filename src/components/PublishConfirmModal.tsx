import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const C = {
  bg:     '#FAF5EE',
  title:  '#1C0A00',
  muted:  '#8B6444',
  label:  '#C4A882',
  btnBg:  '#E8521A',
  btnText:'#FFFFFF',
};

interface Props {
  visible: boolean;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({ visible, recipeTitle, onConfirm, onCancel }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const { t } = useLanguage();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [48, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { opacity: anim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipeTitle.trim() || t.untitledRecipe}
          </Text>
          <Text style={styles.headline}>{t.publishConfirmHeadline}</Text>
          <Text style={styles.body}>{t.publishConfirmBody}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>{t.publishConfirmBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t.publishConfirmCancel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 28,
    padding: 32,
    gap: 16,
  },
  recipeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: C.title,
    letterSpacing: -0.5,
    marginBottom: 4,
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
