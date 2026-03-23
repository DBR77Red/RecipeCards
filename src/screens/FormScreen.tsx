import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ErrorModal } from '../components/ErrorModal';
import { RecipeData } from '../components/RecipeCard';
import { RecipeForm } from '../components/RecipeForm';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { getUserName, markPublishedLocally, saveDraft, syncToCloud } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const incoming = route.params?.recipe;
  const [recipe, setRecipe] = useState<RecipeData>(emptyRecipe());
  const [initialized, setInitialized] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  // Ref holding the last recipe object returned by saveDraft — used to skip
  // the re-save triggered by setRecipe(saved) after each successful auto-save.
  const savedRecipeRef = useRef<RecipeData | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared helper — saves the given recipe snapshot and updates refs/status.
  const doSave = async (snapshot: RecipeData) => {
    setSaveStatus('saving');
    try {
      const saved = await saveDraft(snapshot);
      savedRecipeRef.current = saved;
      setRecipe(saved);
      setSaveStatus('saved');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(
        () => setSaveStatus(s => s === 'saved' ? 'idle' : s),
        2000,
      );
    } catch {
      setSaveStatus('idle');
    }
  };

  // Photo change → save immediately (no debounce, no title guard).
  // A photo pick is a discrete action — the user expects it persisted at once.
  const prevPhotoRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!initialized) return;
    if (prevPhotoRef.current === undefined) {
      prevPhotoRef.current = recipe.photo; // initialise on first run, don't save
      return;
    }
    if (recipe.photo === prevPhotoRef.current) return;
    prevPhotoRef.current = recipe.photo;
    if (!recipe.photo) return; // photo cleared — debounce handles it

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); // cancel pending debounce
    doSave(recipe);
  }, [recipe.photo, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Text/field changes → 1.5s debounce.
  useEffect(() => {
    if (!initialized) return;
    if (!recipe.title.trim()) return;           // never save a blank recipe
    if (savedRecipeRef.current === recipe) return; // triggered by our own setRecipe(saved)

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => doSave(recipe), 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [recipe, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up status timer on unmount
  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (incoming?.status === 'published') {
      navigation.replace('Preview', { recipe: incoming });
      return;
    }

    async function init() {
      const userName = await getUserName();
      const initial = { ...(incoming ?? emptyRecipe()) };
      if (!initial.creatorName && userName) {
        initial.creatorName = userName;
      }
      // Treat the incoming recipe as already-saved so we don't re-save on mount
      savedRecipeRef.current = initial as RecipeData;
      setRecipe(initial);
      setInitialized(true);
    }
    init();
  }, []);

  if (incoming?.status === 'published' || !initialized) return null;

  // ── Publish ────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    try {
      const saved = await saveDraft(recipe);
      const local = await markPublishedLocally(saved.id);
      navigation.replace('Preview', { recipe: local, celebrate: true });
      try {
        await syncToCloud(local);
      } catch {
        // Card stays with cloudSyncStatus: 'pending' — App.tsx will retry on next foreground
      }
    } catch (err: any) {
      setErrorModal({ title: t.publishFailedTitle, body: err?.message ?? t.somethingWentWrong });
    }
  };

  return (
    <>
      <RecipeForm
        recipe={recipe}
        onChange={setRecipe}
        onPublish={handlePublish}
        onPreview={() => navigation.navigate('Preview', { recipe })}
        onBack={() => navigation.goBack()}
        saveStatus={saveStatus}
      />
      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title ?? ''}
        body={errorModal?.body ?? ''}
        onDismiss={() => setErrorModal(null)}
      />
    </>
  );
}
