import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { Translations } from '../i18n/translations';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useSound } from '../utils/useSound';
import { voiceToRecipe } from '../utils/voiceToRecipe';
import { ErrorModal } from './ErrorModal';
import { PhotoPickerModal } from './PhotoPickerModal';
import { RecipeData } from './RecipeCard';
import { VoiceFailedModal } from './VoiceFailedModal';

const VOICE_LOTTIE_SRC = require('../../assets/audio-wave.json');
const SAVED_LOTTIE = require('../../assets/saved.json');

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg:          '#F7F5F2',
  title:       '#1C1917',
  body:        '#44403C',
  muted:       '#78716C',
  placeholder: '#C4B0A8',
  label:       '#A8A29E',
  divider:     '#E7E5E4',
  terracotta:  '#B45A3C',
  sage:        '#4F7A64',
  btnBg:       '#1C1917',
  btnText:     '#F7F5F2',
  removeColor: '#C4B0A8',
  addColor:    '#78716C',
  photoBg:     '#E8E4DE',
  photoMark:   'rgba(0,0,0,0.12)',
  micActive:   '#B45A3C',
  micIdle:     '#E8E4DE',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipeFormProps {
  recipe: RecipeData;
  onChange: (recipe: RecipeData) => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onPreview: () => void;
  onBack: () => void;
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function FormSectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: accent }]}>
      <Text style={[styles.sectionLabel, { color: accent }]}>{label}</Text>
    </View>
  );
}

function MetaField({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.metaField}>
      <Text style={styles.metaFieldLabel}>{label}</Text>
      <TextInput
        style={styles.metaFieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        returnKeyType="next"
      />
    </View>
  );
}

function IngredientRow({
  value, onChange, onRemove, index, canRemove, labelPrefix,
}: {
  value: string; onChange: (v: string) => void; onRemove: () => void;
  index: number; canRemove: boolean; labelPrefix: string;
}) {
  return (
    <View style={styles.listRow}>
      <View style={styles.ingredientBullet} />
      <TextInput
        style={styles.listInput}
        value={value}
        onChangeText={onChange}
        placeholder={`${labelPrefix} ${index + 1}`}
        placeholderTextColor={C.placeholder}
        returnKeyType="next"
      />
      {canRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.removeBtn}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function DirectionRow({
  value, onChange, onRemove, index, canRemove, labelPrefix,
}: {
  value: string; onChange: (v: string) => void; onRemove: () => void;
  index: number; canRemove: boolean; labelPrefix: string;
}) {
  return (
    <View style={styles.listRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepCircleNum}>{index + 1}</Text>
      </View>
      <TextInput
        style={[styles.listInput, styles.listInputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={`${labelPrefix} ${index + 1}`}
        placeholderTextColor={C.placeholder}
        multiline
        returnKeyType="next"
      />
      {canRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.removeBtn}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AddRowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addRowBtn} onPress={onPress}>
      <Text style={styles.addRowBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Voice bar ────────────────────────────────────────────────────────────────

function VoiceBar({
  state,
  elapsed,
  hasPermission,
  processing,
  onStart,
  onStop,
  onReset,
  onMicError,
  t,
}: {
  state: 'idle' | 'recording' | 'stopped';
  elapsed: number;
  hasPermission: boolean;
  processing: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onMicError: () => void;
  t: Translations;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (processing) {
    return (
      <View style={styles.voiceBar}>
        <LottieView
          source={VOICE_LOTTIE_SRC}
          autoPlay
          loop
          style={{ width: 40, height: 40 }}
        />
        <Text style={styles.voiceProcessingText}>{t.voiceTranscribing}</Text>
      </View>
    );
  }

  if (state === 'idle') {
    return (
      <View style={styles.voiceBar}>
        <TouchableOpacity
          style={styles.micBtn}
          onPress={hasPermission
            ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStart(); }
            : onMicError
          }
          activeOpacity={0.75}
        >
          <Text style={styles.micIcon}>🎙</Text>
        </TouchableOpacity>
        <Text style={styles.voiceHint}>
          {hasPermission ? t.voiceTapToRecord : t.voiceMicNeeded}
        </Text>
      </View>
    );
  }

  if (state === 'recording') {
    return (
      <View style={styles.voiceBar}>
        <Animated.View style={[styles.micBtnActive, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.micIcon}>🎙</Text>
        </Animated.View>
        <Text style={styles.voiceElapsed}>{formatTime(elapsed)} / 1:00</Text>
        <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.75}>
          <Text style={styles.stopBtnText}>{t.voiceStop}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.voiceBar}>
      <Text style={styles.voiceDoneText}>{t.voiceRecordingDonePrefix} ({formatTime(elapsed)})</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onReset} activeOpacity={0.75}>
        <Text style={styles.retryBtnText}>{t.voiceReRecord}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function RecipeForm({ recipe, onChange, onSaveDraft, onPublish, onPreview, onBack }: RecipeFormProps) {
  const { t } = useLanguage();
  const update = <K extends keyof RecipeData>(key: K, value: RecipeData[K]) =>
    onChange({ ...recipe, [key]: value });

  const updateIngredient = (i: number, v: string) => {
    const next = [...recipe.ingredients]; next[i] = v; update('ingredients', next);
  };
  const addIngredient    = () => update('ingredients', [...recipe.ingredients, '']);
  const removeIngredient = (i: number) =>
    update('ingredients', recipe.ingredients.filter((_, idx) => idx !== i));

  const updateDirection = (i: number, v: string) => {
    const next = [...recipe.directions]; next[i] = v; update('directions', next);
  };
  const addDirection    = () => update('directions', [...recipe.directions, '']);
  const removeDirection = (i: number) =>
    update('directions', recipe.directions.filter((_, idx) => idx !== i));

  const pickPhoto = () => setShowPhotoPicker(true);

  const handleTakePhoto = async () => {
    setShowPhotoPicker(false);
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [320, 445],
      quality: 0.85,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!result.canceled) update('photo', result.assets[0].uri);
  };

  const handleChooseLibrary = async () => {
    setShowPhotoPicker(false);
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [320, 445],
      quality: 0.85,
    });
    if (!result.canceled) update('photo', result.assets[0].uri);
  };

  // ── Voice recorder ─────────────────────────────────────────────────────────

  const { state: recState, elapsed, audioUri, hasPermission, startRecording, stopRecording, reset: resetRecorder } = useVoiceRecorder();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (recState !== 'stopped') return;
    if (audioUri) {
      handleVoiceComplete(audioUri);
    } else {
      // Recording stopped but no audio was captured (null URI) — show error instead of silently doing nothing
      setShowVoiceFailed(true);
      resetRecorder();
    }
  }, [recState, audioUri]);

  const handleVoiceComplete = async (uri: string) => {
    setProcessing(true);
    try {
      // Pass the current recipe so the server can do an intelligent merge.
      // The server returns the fully merged result — we apply it directly.
      const parsed = await voiceToRecipe(uri, recipe);

      onChange({
        ...recipe,
        title:       parsed.title       || recipe.title,
        servings:    parsed.servings    ?? recipe.servings,
        prepTime:    parsed.prepTime    ?? recipe.prepTime,
        cookTime:    parsed.cookTime    ?? recipe.cookTime,
        ingredients: parsed.ingredients?.length ? parsed.ingredients : recipe.ingredients,
        directions:  parsed.directions?.length  ? parsed.directions  : recipe.directions,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetRecorder();
    } catch (err) {
      console.warn('[voice] handleVoiceComplete failed:', err);
      setShowVoiceFailed(true);
      resetRecorder();
    } finally {
      setProcessing(false);
    }
  };

  // ── Toast ──────────────────────────────────────────────────────────────────

  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playsaved = useSound(require('../../assets/saved_sound.mp3'));

  useEffect(() => () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
  }, []);

  const showToast = () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    setShowSaved(true);
    playsaved();
  };

  const handleSaveDraft = async () => {
    try {
      await onSaveDraft();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast();
    } catch {
      setErrorModal({ title: t.saveDraftFailedTitle, body: t.somethingWentWrong });
    }
  };

  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  // ── Publish confirmation modal ─────────────────────────────────────────────

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showVoiceFailed, setShowVoiceFailed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  const openConfirm = () => {
    setShowConfirm(true);
    Animated.timing(confirmAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  };

  const closeConfirm = () => {
    Animated.timing(confirmAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
      () => setShowConfirm(false)
    );
  };

  const handlePublish = async () => {
    if (publishing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPublishing(true);
    closeConfirm();
    await onPublish();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backLink}>{t.formBack}</Text>
          </TouchableOpacity>
          <Text style={styles.formLabel}>{t.formNewRecipe}</Text>
        </View>

        {/* Voice bar */}
        {Platform.OS !== 'web' && (
          <VoiceBar
            state={recState}
            elapsed={elapsed}
            hasPermission={hasPermission}
            processing={processing}
            onStart={startRecording}
            onStop={stopRecording}
            onReset={resetRecorder}
            onMicError={() => setErrorModal({ title: t.voiceMicPermTitle, body: t.voiceMicPermBody })}
            t={t}
          />
        )}

        {/* Title */}
        <View style={styles.heroGroup}>
          <TextInput
            style={styles.titleInput}
            value={recipe.title}
            onChangeText={v => update('title', v)}
            placeholder={t.formTitlePlaceholder}
            placeholderTextColor={C.placeholder}
            multiline
          />
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.8}>
          {recipe.photo ? (
            <Image source={{ uri: recipe.photo }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="rgba(0,0,0,0.18)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="13" r="4" stroke="rgba(0,0,0,0.18)" strokeWidth={1.5} />
              </Svg>
              <Text style={styles.photoLabel}>{t.formAddPhoto}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Meta */}
        <View style={styles.metaRow}>
          <MetaField label={t.formServes} value={recipe.servings} placeholder="4"
            onChangeText={v => update('servings', v)} />
          <View style={styles.metaSep} />
          <MetaField label={t.formPrep} value={recipe.prepTime} placeholder="15 min"
            onChangeText={v => update('prepTime', v)} />
          <View style={styles.metaSep} />
          <MetaField label={t.formCook} value={recipe.cookTime} placeholder="20 min"
            onChangeText={v => update('cookTime', v)} />
        </View>

        <View style={styles.sectionDivider} />

        {/* Ingredients */}
        <FormSectionHeader label={t.formIngredients} accent={C.terracotta} />
        {recipe.ingredients.map((ing, i) => (
          <IngredientRow key={i} index={i} value={ing}
            onChange={v => updateIngredient(i, v)}
            onRemove={() => removeIngredient(i)}
            canRemove={recipe.ingredients.length > 1}
            labelPrefix={t.formIngredientPrefix} />
        ))}
        <AddRowButton label={t.formAddIngredient} onPress={addIngredient} />

        <View style={styles.sectionGap} />

        {/* Directions */}
        <FormSectionHeader label={t.formDirections} accent={C.sage} />
        {recipe.directions.map((step, i) => (
          <DirectionRow key={i} index={i} value={step}
            onChange={v => updateDirection(i, v)}
            onRemove={() => removeDirection(i)}
            canRemove={recipe.directions.length > 1}
            labelPrefix={t.formStepPrefix} />
        ))}
        <AddRowButton label={t.formAddStep} onPress={addDirection} />

        {/* Actions */}
        <TouchableOpacity
          style={[styles.publishBtn, !recipe.title.trim() && styles.publishBtnDisabled]}
          onPress={openConfirm}
          disabled={!recipe.title.trim()}
          accessibilityState={{ disabled: !recipe.title.trim() }}
          activeOpacity={0.85}
        >
          <Text style={styles.publishBtnText}>{t.formPublish}</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.previewBtn, !recipe.title.trim() && styles.previewBtnDisabled]}
            onPress={onPreview}
            disabled={!recipe.title.trim()}
            accessibilityState={{ disabled: !recipe.title.trim() }}
          >
            <Text style={styles.previewBtnText}>{t.formPreviewCard}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft}>
            <Text style={styles.saveDraftBtnText}>{t.formSaveDraft}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          { opacity: toastAnim, transform: [{ translateY: toastTranslateY }], pointerEvents: 'none' },
        ]}
      >
        <Text style={styles.toastText}>{t.formDraftSaved}</Text>
      </Animated.View>

      <PhotoPickerModal
        visible={showPhotoPicker}
        onTakePhoto={handleTakePhoto}
        onChooseLibrary={handleChooseLibrary}
        onCancel={() => setShowPhotoPicker(false)}
      />

      <VoiceFailedModal
        visible={showVoiceFailed}
        onRetry={() => { setShowVoiceFailed(false); startRecording(); }}
        onDismiss={() => setShowVoiceFailed(false)}
      />

      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title ?? ''}
        body={errorModal?.body ?? ''}
        onDismiss={() => setErrorModal(null)}
      />

      {/* Publish confirmation modal */}
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
              {recipe.title.trim() || t.untitledRecipe}
            </Text>
            <Text style={styles.confirmHeadline}>{t.publishConfirmHeadline}</Text>
            <Text style={styles.confirmBody}>{t.publishConfirmBody}</Text>
            <TouchableOpacity
              style={[styles.confirmBtn, publishing && { opacity: 0.5 }]}
              onPress={handlePublish}
              disabled={publishing}
              accessibilityState={{ disabled: publishing }}
            >
              <Text style={styles.confirmBtnText}>{t.publishConfirmBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeConfirm} disabled={publishing}>
              <Text style={styles.cancelBtnText}>{t.publishConfirmCancel}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {showSaved && (
        <View pointerEvents="none" style={styles.savedOverlay}>
          <LottieView
            source={SAVED_LOTTIE}
            autoPlay
            loop={false}
            style={styles.savedLottie}
            onAnimationFinish={() => setShowSaved(false)}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 26,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backLink: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.muted,
    letterSpacing: 0.2,
  },
  formLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
    color: C.terracotta,
  },

  // Voice bar
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: C.divider,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.micIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.micActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 18,
  },
  voiceHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
    flex: 1,
  },
  voiceElapsed: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.terracotta,
    flex: 1,
  },
  stopBtn: {
    backgroundColor: C.title,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  stopBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: C.btnText,
  },
  voiceProcessingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
    flex: 1,
  },
  voiceDoneText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.sage,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.divider,
  },
  retryBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: C.muted,
  },

  heroGroup: {
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    paddingBottom: 18,
  },
  titleInput: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: C.title,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  creatorInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.body,
    letterSpacing: 0.1,
    paddingVertical: 4,
  },

  photoPicker: {
    width: '100%',
    aspectRatio: 320 / 445,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.photoBg,
    marginBottom: 24,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.label,
    textTransform: 'uppercase',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  metaField: { flex: 1 },
  metaFieldLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 8,
    letterSpacing: 1,
    color: C.label,
    marginBottom: 8,
  },
  metaFieldInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.title,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  metaSep: {
    width: 1,
    height: 28,
    backgroundColor: C.divider,
    marginBottom: 7,
    marginHorizontal: 14,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginBottom: 28,
  },
  sectionHeader: {
    borderLeftWidth: 2.5,
    paddingLeft: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
  },
  sectionGap: { height: 28 },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  ingredientBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.label,
    marginTop: 14,
    flexShrink: 0,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.title,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    flexShrink: 0,
  },
  stepCircleNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9.5,
    color: C.bg,
    lineHeight: 12,
  },
  listInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.body,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    lineHeight: 20,
  },
  listInputMultiline: { lineHeight: 22 },
  removeBtn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: C.removeColor,
    lineHeight: 36,
    paddingLeft: 4,
  },
  addRowBtn: {
    paddingVertical: 10,
    paddingLeft: 4,
  },
  addRowBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.addColor,
    letterSpacing: 0.2,
  },

  publishBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  publishBtnDisabled: { opacity: 0.35 },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.8,
    color: C.btnText,
  },

  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  previewBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  previewBtnDisabled: { opacity: 0.35 },
  previewBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.muted,
    letterSpacing: 0.3,
  },
  saveDraftBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDraftBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.muted,
    letterSpacing: 0.3,
  },

  toast: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    backgroundColor: '#1C1917',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
  },
  toastText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#F7F5F2',
    letterSpacing: 0.2,
  },

  savedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLottie: {
    width: 300,
    height: 300,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confirmSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: C.bg,
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  confirmTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: C.title,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  confirmHeadline: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 20,
    color: C.title,
  },
  confirmBody: {
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
  cancelBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
  },
});
