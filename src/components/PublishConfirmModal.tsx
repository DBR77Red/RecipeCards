import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  bg:     '#F7F5F2',
  title:  '#1C1917',
  muted:  '#78716C',
  label:  '#A8A29E',
  btnBg:  '#1C1917',
  btnText:'#F7F5F2',
};

interface Props {
  visible: boolean;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({ visible, recipeTitle, onConfirm, onCancel }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

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
            {recipeTitle.trim() || 'Untitled Recipe'}
          </Text>
          <Text style={styles.headline}>Ready to publish?</Text>
          <Text style={styles.body}>
            Once published, this card is permanent. No edits, no take-backs.
            This is your recipe, exactly as it is right now.
          </Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>Publish forever</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Not yet</Text>
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
  recipeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: C.title,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headline: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 20,
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
