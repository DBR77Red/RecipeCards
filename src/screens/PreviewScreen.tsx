import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { publishRecipe, saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const [recipe, setRecipe] = useState(route.params.recipe);
  const [publishing, setPublishing] = useState(false);

  const shareUrl = recipe.shareUrl ?? `recipecards://card/${recipe.id}`;

  const handleShare = async () => {
    await Share.share({
      message: `${recipe.creatorName} shared a recipe with you: ${shareUrl}`,
    });
  };

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const base = recipe.id ? recipe : await saveDraft(recipe);
      const published = await publishRecipe(base.id);
      setRecipe(published);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          recipe.status === 'published'
            ? navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
            : navigation.goBack()
        }
      >
        <Text style={styles.backBtnText}>
          {recipe.status === 'published' ? '← Back' : '← Edit Recipe'}
        </Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecipeCard recipe={recipe} />

        {recipe.status === 'published' ? (
          <>
            <View style={styles.qrSection}>
              <View style={styles.qrBox}>
                <QRCode value={shareUrl} size={148} />
              </View>
              <Text style={styles.scanLabel}>Scan to receive this recipe</Text>
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Recipe</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
          >
            <Text style={styles.publishBtnText}>
              {publishing ? 'Publishing…' : 'Publish to Share'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 104,
    paddingBottom: 52,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    zIndex: 10,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  // ── QR section ────────────────────────────────────────────────────────────
  qrSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  scanLabel: {
    marginTop: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.30)',
  },
  // ── Share button ──────────────────────────────────────────────────────────
  shareBtn: {
    marginTop: 18,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  shareBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  // ── Publish button (draft preview) ────────────────────────────────────────
  publishBtn: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
