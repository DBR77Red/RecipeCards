import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  visible: boolean;
  recipeTitle: string;
  /** Deep link used to generate the QR code — guaranteed valid for published cards */
  qrUrl: string;
  /** Web URL used in the native share sheet — may fall back to qrUrl if server not configured */
  shareUrl: string;
  creatorName: string;
  onClose: () => void;
}

export function ShareQRModal({ visible, recipeTitle, qrUrl, shareUrl, creatorName, onClose }: Props) {
  const { t } = useLanguage();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 80, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleShareLink = async () => {
    await Share.share({
      message: `${creatorName} shared a recipe with you: ${shareUrl}`,
      url: shareUrl,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable onPress={() => {}}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>{recipeTitle}</Text>
            <Text style={styles.subtitle}>{t.shareModalSubtitle}</Text>

            {/* QR Code */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrBox}>
                <QRCode value={qrUrl} size={160} />
              </View>
              <Text style={styles.qrHint}>{t.shareModalScanHint}</Text>
            </View>

            {/* Share link button */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink} activeOpacity={0.85}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
                  stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                  d="M16 6l-4-4-4 4"
                  stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                  d="M12 2v13"
                  stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.shareBtnText}>{t.shareModalShareBtn}</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F7F5F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D0B8',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#1C0A00',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: '#8B6444',
    textAlign: 'center',
    marginBottom: 28,
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#1C0A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  qrHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#8B6444',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8521A',
    borderRadius: 100,
    height: 54,
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  shareBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#C4A882',
  },
});
