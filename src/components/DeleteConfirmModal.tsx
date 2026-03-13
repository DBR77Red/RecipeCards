import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const C = {
  bg:      '#F7F5F2',
  title:   '#1C1917',
  muted:   '#78716C',
  label:   '#A8A29E',
  red:     '#DC2626',
  redText: '#FFFFFF',
};

interface Props {
  visible: boolean;
  variant: 'draft' | 'published' | 'batch';
  recipeTitle: string;
  batchCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ visible, variant, recipeTitle, batchCount = 0, onConfirm, onCancel }: Props) {
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

  const isDraft = variant === 'draft';
  const isBatch = variant === 'batch';
  const displayTitle = recipeTitle.trim() || t.untitledRecipe;
  const heading     = isBatch ? t.deleteBatchTitle(batchCount) : isDraft ? t.deleteDraftTitle : t.deleteCardTitle;
  const body        = isBatch ? t.deleteBatchBody : isDraft ? t.deleteDraftBody(displayTitle) : t.deleteCardBody;
  const confirmText = isBatch ? t.deleteBatchBtn(batchCount) : isDraft ? t.deleteDraftBtn : t.deleteCardBtn;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { opacity: anim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onConfirm(); }}>
            <Text style={styles.confirmBtnText}>{confirmText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t.cancel}</Text>
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
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: C.title,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: C.muted,
    lineHeight: 24,
    marginBottom: 4,
  },
  confirmBtn: {
    backgroundColor: C.red,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.redText,
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
