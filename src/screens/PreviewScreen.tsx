import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { publishRecipe } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const [recipe, setRecipe] = useState(route.params.recipe);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current;
  const celebAnim   = useRef(new Animated.Value(0)).current;

  const openConfirm = () => {
    setShowConfirm(true);
    Animated.timing(confirmAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  };

  const closeConfirm = () => {
    Animated.timing(confirmAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
      () => setShowConfirm(false)
    );
  };

  const showCelebration = () => {
    celebAnim.setValue(0);
    Animated.sequence([
      Animated.timing(celebAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(celebAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handlePublish = async () => {
    const published = await publishRecipe(recipe.id);
    setRecipe(published);
    closeConfirm();
    showCelebration();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>
          {recipe.status === 'published' ? '← Back' : '← Edit Recipe'}
        </Text>
      </TouchableOpacity>

      <RecipeCard recipe={recipe} />

      {recipe.status === 'draft' ? (
        <TouchableOpacity style={styles.publishBtn} onPress={openConfirm}>
          <Text style={styles.publishBtnText}>Publish</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.publishedBadge}>
          <Text style={styles.publishedBadgeText}>✓  Published</Text>
        </View>
      )}

      {/* Celebration pill */}
      <Animated.View
        style={[styles.celebPill, {
          opacity: celebAnim,
          transform: [{ translateY: celebAnim.interpolate({
            inputRange:  [0, 1],
            outputRange: [-8, 0],
          }) }],
        }]}
        pointerEvents="none"
      >
        <Text style={styles.celebText}>✦  Your card is published</Text>
      </Animated.View>

      {/* Confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="none"
        onRequestClose={closeConfirm}
      >
        <Animated.View style={[styles.overlay, { opacity: confirmAnim }]}>
          <Animated.View style={[styles.confirmSheet, {
            transform: [{ translateY: confirmAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: [48, 0],
            }) }],
          }]}>
            <Text style={styles.confirmTitle}>
              {recipe.title.trim() || 'Untitled Recipe'}
            </Text>
            <Text style={styles.confirmHeadline}>Ready to publish?</Text>
            <Text style={styles.confirmBody}>
              Once published, this card is permanent. No edits, no take-backs. This is your recipe, exactly as it is right now.
            </Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={handlePublish}>
              <Text style={styles.confirmBtnText}>Publish forever</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeConfirm}>
              <Text style={styles.cancelBtnText}>Not yet</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },

  // Publish / Published below the card
  publishBtn: {
    marginTop: 28,
    borderRadius: 100,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  publishedBadge: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  publishedBadgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },

  // Celebration pill
  celebPill: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  celebText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#0F172A',
    letterSpacing: 0.3,
  },

  // Confirmation overlay + sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confirmSheet: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  confirmTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  confirmHeadline: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  confirmBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 24,
  },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#0F172A',
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.40)',
  },
});
