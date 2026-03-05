import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  bg:      '#F7F5F2',
  title:   '#1C1917',
  muted:   '#78716C',
  label:   '#A8A29E',
  btnBg:   '#1C1917',
  btnText: '#F7F5F2',
  border:  '#E7E5E4',
};

interface Props {
  visible: boolean;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onCancel: () => void;
}

export function PhotoPickerModal({ visible, onTakePhoto, onChooseLibrary, onCancel }: Props) {
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
          <Text style={styles.title}>Add Photo</Text>
          <Text style={styles.body}>How would you like to add a photo?</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onTakePhoto}>
              <Text style={styles.btnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onChooseLibrary}>
              <Text style={styles.btnSecondaryText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
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
  actions: {
    gap: 10,
  },
  btn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  btnSecondaryText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.title,
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
