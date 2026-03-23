import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const C = {
  bg:    '#F7F5F2',
  title: '#1C1917',
  muted: '#78716C',
  label: '#A8A29E',
  btn:   '#1C1917',
  btnText: '#F7F5F2',
};

interface Props {
  visible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function VoiceFailedModal({ visible, onRetry, onDismiss }: Props) {
  const { t } = useLanguage();
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: anim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Text style={styles.title}>{t.voiceFailedModalTitle}</Text>
          <Text style={styles.body}>{t.voiceFailedModalBody}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>{t.voiceFailedModalRetry}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>{t.cancel}</Text>
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
    fontFamily: 'Poppins_700Bold',
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
  retryBtn: {
    backgroundColor: C.btn,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  retryBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
  },
  dismissBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
  },
});
