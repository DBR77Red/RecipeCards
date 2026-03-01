import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecipeData } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { deleteDraft, getDrafts } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg:         '#F7F5F2',
  title:      '#1C1917',
  body:       '#44403C',
  muted:      '#78716C',
  label:      '#A8A29E',
  divider:    '#E7E5E4',
  terracotta: '#B45A3C',
  btnBg:      '#1C1917',
  btnText:    '#F7F5F2',
  photoBg:    '#E8E4DE',
  photoMark:  'rgba(0,0,0,0.10)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

// ─── Account placeholder ──────────────────────────────────────────────────────

function AccountButton() {
  return (
    <View style={styles.accountBtn}>
      <View style={styles.accountHead} />
      <View style={styles.accountBody} />
    </View>
  );
}

// ─── Draft list item ──────────────────────────────────────────────────────────

interface DraftListItemProps {
  recipe: RecipeData;
  onPress: () => void;
  onLongPress: () => void;
}

function DraftListItem({ recipe, onPress, onLongPress }: DraftListItemProps) {
  const displayTitle    = recipe.title.trim() || 'Untitled Recipe';
  const isTitleEmpty    = !recipe.title.trim();
  const ingredientCount = recipe.ingredients.filter(i => i.trim()).length;
  const ingredientLabel = ingredientCount === 1 ? '1 ingredient' : `${ingredientCount} ingredients`;

  return (
    <TouchableOpacity
      style={styles.draftRow}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={400}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {recipe.photo ? (
          <Image source={{ uri: recipe.photo }} style={styles.thumbnailImg} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <View style={styles.guideRing}>
              <View style={styles.guideDot} />
            </View>
          </View>
        )}
      </View>

      {/* Text */}
      <View style={styles.draftMeta}>
        <Text
          style={[styles.draftTitle, isTitleEmpty && styles.draftTitleEmpty]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>
        <Text style={styles.draftSub}>
          {ingredientLabel} · {formatDate(recipe.updatedAt)}
        </Text>
        {recipe.status === 'published' ? (
          <View style={[styles.draftBadge, styles.publishedBadgeHome]}>
            <Text style={[styles.draftBadgeText, styles.publishedBadgeHomeText]}>PUBLISHED</Text>
          </View>
        ) : (
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>DRAFT</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>
      <Text style={styles.emptyTitle}>No recipes yet</Text>
      <Text style={styles.emptySub}>Tap New Recipe to get started.</Text>
    </View>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: Props) {
  const [drafts, setDrafts] = useState<RecipeData[]>([]);

  // Reload list every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDrafts().then(d => { if (active) setDrafts(d); });
      return () => { active = false; };
    }, [])
  );

  const confirmDelete = (recipe: RecipeData) => {
    const label = recipe.title.trim() || 'Untitled Recipe';
    Alert.alert(
      'Delete Draft',
      `Delete "${label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDraft(recipe.id);
            const updated = await getDrafts();
            setDrafts(updated);
          },
        },
      ]
    );
  };

  const ListHeader = (
    <>
      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => navigation.navigate('Form', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.newBtnText}>New Recipe</Text>
      </TouchableOpacity>
      {drafts.length > 0 && (
        <Text style={styles.sectionLabel}>YOUR DRAFTS</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Recipe Cards</Text>
        <AccountButton />
      </View>
      <View style={styles.headerDivider} />

      {/* Draft list */}
      <FlatList
        data={drafts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DraftListItem
            recipe={item}
            onPress={() =>
              item.status === 'published'
                ? navigation.navigate('Preview', { recipe: item })
                : navigation.navigate('Form', { recipe: item })
            }
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
  },
  appTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: C.title,
    letterSpacing: -0.3,
  },
  headerDivider: {
    height: 1,
    backgroundColor: C.divider,
  },

  // Account button placeholder
  accountBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  accountHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.label,
  },
  accountBody: {
    width: 14,
    height: 7,
    borderRadius: 7,
    backgroundColor: C.label,
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // New Recipe button
  newBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  newBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.8,
    color: C.btnText,
  },
  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
    color: C.label,
    marginBottom: 4,
  },

  // Draft row
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.photoBg,
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.photoMark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.photoMark,
  },
  draftMeta: {
    flex: 1,
    gap: 4,
  },
  draftTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: C.title,
    lineHeight: 21,
  },
  draftTitleEmpty: {
    color: C.label,
  },
  draftSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: C.muted,
  },
  draftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(180,90,60,0.10)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  draftBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 8,
    letterSpacing: 2.5,
    color: C.terracotta,
  },
  publishedBadgeHome: {
    backgroundColor: 'rgba(79,122,100,0.12)',
  },
  publishedBadgeHomeText: {
    color: '#4F7A64',
  },
  chevron: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 20,
    color: C.label,
    lineHeight: 24,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: C.divider,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.photoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 28,
    color: C.label,
    lineHeight: 32,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: C.title,
    marginTop: 16,
  },
  emptySub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.muted,
    marginTop: 6,
  },
});
