import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
}

export function ErrorModal({ visible, title, body, onDismiss }: Props) {
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.btnText}>{t.ok}</Text>
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
    backgroundColor: '#F7F5F2',
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#78716C',
    lineHeight: 24,
    marginBottom: 4,
  },
  btn: {
    backgroundColor: '#1C1917',
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#F7F5F2',
  },
});
