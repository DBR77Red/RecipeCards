import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { BottomTabBar } from '../components/BottomTabBar';
import { RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';
import { getDrafts, toggleFavorite } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg:         '#FAFAF9',
  title:      '#1C1917',
  body:       '#57534E',
  muted:      '#A8A29E',
  label:      '#D6D3D1',
  divider:    '#E7E5E4',
  terracotta: '#EA580C',
  sage:       '#059669',
  cardBg:     '#FFFFFF',
  photoBg:    '#F5F5F4',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Favorite list item ───────────────────────────────────────────────────────

function FavoriteListItem({ recipe, onPress, onToggleFavorite }: {
  recipe: RecipeData;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { t } = useLanguage();
  const displayTitle    = recipe.title.trim() || t.untitledRecipe;
  const isTitleEmpty    = !recipe.title.trim();
  const ingredientCount = recipe.ingredients.filter(i => i.trim()).length;
  const ingredientLabel = ingredientCount === 1
    ? `1 ${t.ingredient}`
    : `${ingredientCount} ${t.ingredients}`;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnail}>
        {recipe.photo ? (
          <Image source={{ uri: recipe.photo }} style={styles.thumbnailImg} resizeMode="cover" />
        ) : (
          <Image
            source={require('../../assets/placeholder.jpg')}
            style={styles.thumbnailImg}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.meta}>
        <Text style={[styles.rowTitle, isTitleEmpty && styles.rowTitleEmpty]} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text style={styles.rowSub}>
          {ingredientLabel} · {formatDate(recipe.updatedAt)}
        </Text>
        <View style={[styles.badge, recipe.isReceived ? styles.receivedBadge : styles.publishedBadge]}>
          <Text style={[styles.badgeText, recipe.isReceived ? styles.receivedBadgeText : styles.publishedBadgeText]}>
            {recipe.isReceived ? 'RECEIVED' : 'PUBLISHED'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
        activeOpacity={0.6}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path
            d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
            fill={C.terracotta}
            stroke={C.terracotta}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useLanguage();
  return (
    <View style={styles.emptyState}>
      <Svg width={48} height={48} viewBox="0 0 24 24" style={styles.emptyIcon}>
        <Path
          d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
          fill="none"
          stroke={C.label}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.emptyTitle}>{t.favoritesEmptyTitle}</Text>
      <Text style={styles.emptySub}>{t.favoritesEmptySub}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FavoritesScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<RecipeData[]>([]);

  const loadData = useCallback(async () => {
    const all = await getDrafts();
    setFavorites(all.filter(r => r.isFavorite && (r.status === 'published' || r.isReceived)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleFavorite = async (recipe: RecipeData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(recipe.id);
    loadData();
  };

  const handlePress = (recipe: RecipeData) => {
    recipe.isReceived
      ? navigation.navigate('CardView', { cardId: recipe.id })
      : navigation.navigate('Preview', { recipe });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.favoritesTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FavoriteListItem
            recipe={item}
            onPress={() => handlePress(item)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <BottomTabBar activeTab="Favorites" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 22,
    color: C.body,
    lineHeight: 28,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: C.title,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.photoBg,
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: C.title,
    lineHeight: 20,
  },
  rowTitleEmpty: {
    color: C.label,
  },
  rowSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
  },
  publishedBadge: {
    backgroundColor: 'rgba(5,150,105,0.10)',
  },
  publishedBadgeText: {
    color: C.sage,
  },
  receivedBadge: {
    backgroundColor: 'rgba(99,102,241,0.10)',
  },
  receivedBadgeText: {
    color: '#6366F1',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 18,
    color: C.title,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
