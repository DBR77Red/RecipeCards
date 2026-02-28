import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeData } from './RecipeCard';

// ─── Tokens (mirrors the card palette) ───────────────────────────────────────

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
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipeFormProps {
  recipe: RecipeData;
  onChange: (recipe: RecipeData) => void;
  onPreview: () => void;
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

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
  value,
  onChange,
  onRemove,
  index,
  canRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  index: number;
  canRemove: boolean;
}) {
  return (
    <View style={styles.listRow}>
      <View style={styles.ingredientBullet} />
      <TextInput
        style={styles.listInput}
        value={value}
        onChangeText={onChange}
        placeholder={`Ingredient ${index + 1}`}
        placeholderTextColor={C.placeholder}
        returnKeyType="next"
      />
      {canRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.removeBtn}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StepRow({
  value,
  onChange,
  onRemove,
  index,
  canRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  index: number;
  canRemove: boolean;
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
        placeholder={`Step ${index + 1}`}
        placeholderTextColor={C.placeholder}
        multiline
        returnKeyType="next"
      />
      {canRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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

// ─── Main form component ──────────────────────────────────────────────────────

export function RecipeForm({ recipe, onChange, onPreview }: RecipeFormProps) {
  // Convenience updater — merges a partial update into the recipe
  const update = <K extends keyof RecipeData>(key: K, value: RecipeData[K]) =>
    onChange({ ...recipe, [key]: value });

  // Ingredients
  const updateIngredient = (i: number, v: string) => {
    const next = [...recipe.ingredients];
    next[i] = v;
    update('ingredients', next);
  };
  const addIngredient    = () => update('ingredients', [...recipe.ingredients, '']);
  const removeIngredient = (i: number) =>
    update('ingredients', recipe.ingredients.filter((_, idx) => idx !== i));

  // Steps
  const updateStep = (i: number, v: string) => {
    const next = [...recipe.steps];
    next[i] = v;
    update('steps', next);
  };
  const addStep    = () => update('steps', [...recipe.steps, '']);
  const removeStep = (i: number) =>
    update('steps', recipe.steps.filter((_, idx) => idx !== i));

  // Photo picker
  const pickPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      update('photo', result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Form label */}
        <Text style={styles.formLabel}>NEW RECIPE</Text>

        {/* ── Title & creator ─────────────────────────────────────────────── */}
        <View style={styles.heroGroup}>
          <TextInput
            style={styles.titleInput}
            value={recipe.title}
            onChangeText={v => update('title', v)}
            placeholder="Recipe title"
            placeholderTextColor={C.placeholder}
            multiline
            returnKeyType="next"
          />
          <TextInput
            style={styles.creatorInput}
            value={recipe.creator}
            onChangeText={v => update('creator', v)}
            placeholder="Your name"
            placeholderTextColor={C.placeholder}
            returnKeyType="next"
          />
        </View>

        {/* ── Photo picker ─────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.8}>
          {recipe.photo ? (
            <Image source={{ uri: recipe.photo }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>+</Text>
              <Text style={styles.photoLabel}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Meta: servings / prep / cook ─────────────────────────────────── */}
        <View style={styles.metaRow}>
          <MetaField
            label="SERVES"
            value={recipe.servings}
            placeholder="4"
            onChangeText={v => update('servings', v)}
          />
          <View style={styles.metaSep} />
          <MetaField
            label="PREP"
            value={recipe.prepTime}
            placeholder="15 min"
            onChangeText={v => update('prepTime', v)}
          />
          <View style={styles.metaSep} />
          <MetaField
            label="COOK"
            value={recipe.cookTime}
            placeholder="20 min"
            onChangeText={v => update('cookTime', v)}
          />
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Ingredients ──────────────────────────────────────────────────── */}
        <FormSectionHeader label="INGREDIENTS" accent={C.terracotta} />

        {recipe.ingredients.map((ing, i) => (
          <IngredientRow
            key={i}
            index={i}
            value={ing}
            onChange={v => updateIngredient(i, v)}
            onRemove={() => removeIngredient(i)}
            canRemove={recipe.ingredients.length > 1}
          />
        ))}

        <AddRowButton label="+ Add ingredient" onPress={addIngredient} />

        <View style={styles.sectionGap} />

        {/* ── Directions ───────────────────────────────────────────────────── */}
        <FormSectionHeader label="DIRECTIONS" accent={C.sage} />

        {recipe.steps.map((step, i) => (
          <StepRow
            key={i}
            index={i}
            value={step}
            onChange={v => updateStep(i, v)}
            onRemove={() => removeStep(i)}
            canRemove={recipe.steps.length > 1}
          />
        ))}

        <AddRowButton label="+ Add step" onPress={addStep} />

        {/* ── Preview button ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.previewBtn, !recipe.title.trim() && styles.previewBtnDisabled]}
          onPress={onPreview}
          disabled={!recipe.title.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.previewBtnText}>Preview Card</Text>
        </TouchableOpacity>

      </ScrollView>
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

  // ── Form label ──────────────────────────────────────────────────────────────

  formLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
    color: C.terracotta,
    marginBottom: 20,
  },

  // ── Hero group: title + creator ─────────────────────────────────────────────

  heroGroup: {
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    paddingBottom: 18,
  },

  titleInput: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: C.title,
    letterSpacing: -0.3,
    marginBottom: 10,
    // no border — parent group handles it
  },

  creatorInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.body,
    letterSpacing: 0.1,
    paddingVertical: 4,
  },

  // ── Photo picker ────────────────────────────────────────────────────────────

  photoPicker: {
    width: '100%',
    height: 190,
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

  photoIcon: {
    fontSize: 28,
    color: C.photoMark,
    lineHeight: 32,
    fontFamily: 'DMSans_400Regular',
  },

  photoLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.label,
    textTransform: 'uppercase',
  },

  // ── Meta row ────────────────────────────────────────────────────────────────

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 32,
  },

  metaField: {
    flex: 1,
  },

  metaFieldLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 8,
    letterSpacing: 2.5,
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

  // ── Section header ──────────────────────────────────────────────────────────

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

  sectionGap: {
    height: 28,
  },

  // ── List rows ────────────────────────────────────────────────────────────────

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

  listInputMultiline: {
    lineHeight: 22,
  },

  removeBtn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: C.removeColor,
    lineHeight: 36,
    paddingLeft: 4,
  },

  // ── Add row button ───────────────────────────────────────────────────────────

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

  // ── Preview button ───────────────────────────────────────────────────────────

  previewBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },

  previewBtnDisabled: {
    opacity: 0.35,
  },

  previewBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.8,
    color: C.btnText,
  },
});
