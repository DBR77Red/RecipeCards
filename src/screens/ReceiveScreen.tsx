import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeCard, RecipeData } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { fetchSharedRecipe } from '../utils/api';
import { saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Receive'>;


export function ReceiveScreen({ route, navigation }: Props) {
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSharedRecipe(route.params.cardId)
      .then(setRecipe)
      .catch(() => setError('This recipe could not be found or is no longer available.'))
      .finally(() => setLoading(false));
  }, [route.params.cardId]);

  const handleAdd = async () => {
    if (!recipe || saving) return;
    setSaving(true);
    try {
      await saveDraft({ ...recipe, id: '', status: 'published' });
      setSaved(true);
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="rgba(255,255,255,0.5)" size="large" />
          <Text style={styles.loadingText}>Loading recipe…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>✕</Text>
          <Text style={styles.errorTitle}>Recipe not found</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && recipe && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sharedLabel}>
            Shared by {recipe.creatorName || 'Unknown'}
          </Text>

          <RecipeCard recipe={recipe} />

          <TouchableOpacity
            style={[styles.addBtn, (saving || saved) && styles.addBtnDone]}
            onPress={handleAdd}
            disabled={saving || saved}
          >
            <Text style={styles.addBtnText}>
              {saved ? 'Added to collection!' : saving ? 'Saving…' : 'Add to My Collection'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.2)',
  },
  errorTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#fff',
    marginTop: 4,
  },
  errorSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  backHomeBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backHomeBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 104,
    paddingBottom: 52,
  },
  sharedLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.30)',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  addBtn: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  addBtnDone: {
    backgroundColor: 'rgba(79,122,100,0.5)',
  },
  addBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 0.2,
  },
});
