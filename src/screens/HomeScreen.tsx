import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecipeData } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { deleteDraft, getDrafts, getUserName, setUserName } from '../utils/storage';

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

function AccountButton({ userName, onPress }: { userName: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.accountBtn} onPress={onPress} activeOpacity={0.7}>
      {userName ? (
        <Text style={styles.accountInitials}>
          {userName.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <>
          <View style={styles.accountHead} />
          <View style={styles.accountBody} />
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Name input modal ─────────────────────────────────────────────────────────

function NameModal({ visible, currentName, onSave, onClose }: {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Name</Text>
          <Text style={styles.modalSub}>This name will appear on your recipe cards.</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={C.label}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.modalBtn, !name.trim() && styles.modalBtnDisabled]}
            onPress={() => { onSave(name.trim()); onClose(); }}
            disabled={!name.trim()}
          >
            <Text style={styles.modalBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  const [published, setPublished] = useState<RecipeData[]>([]);
  const [userName, setUserNameState] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    getUserName().then(setUserNameState);
  }, []);

  // Reload list every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDrafts().then(all => {
        if (active) {
          setDrafts(all.filter(r => r.status === 'draft'));
          setPublished(all.filter(r => r.status === 'published'));
        }
      });
      return () => { active = false; };
    }, [])
  );

  const handleSaveName = async (name: string) => {
    await setUserName(name);
    setUserNameState(name);
  };

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
            const all = await getDrafts();
            setDrafts(all.filter(r => r.status === 'draft'));
            setPublished(all.filter(r => r.status === 'published'));
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RecipeData }) => (
    <DraftListItem
      recipe={item}
      onPress={() =>
        item.status === 'published'
          ? navigation.navigate('Preview', { recipe: item })
          : navigation.navigate('Form', { recipe: item })
      }
      onLongPress={item.status === 'draft' ? () => confirmDelete(item) : () => {}}
    />
  );

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

  const ListFooter = (
    <>
      {drafts.length > 0 && published.length > 0 && (
        <View style={styles.sectionSpacer} />
      )}
      {published.length > 0 && (
        <Text style={styles.sectionLabel}>PUBLISHED</Text>
      )}
    </>
  );

  const isEmpty = drafts.length === 0 && published.length === 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Recipe Cards</Text>
        <AccountButton userName={userName} onPress={() => setShowNameModal(true)} />
      </View>
      <View style={styles.headerDivider} />

      {/* Draft list */}
      <FlatList
        data={[...drafts, ...published]}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={isEmpty ? <EmptyState /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <NameModal
        visible={showNameModal}
        currentName={userName}
        onSave={handleSaveName}
        onClose={() => setShowNameModal(false)}
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
    backgroundColor: C.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitials: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.btnText,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: C.title,
  },
  modalSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.muted,
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: C.title,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.divider,
  },
  modalBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },
  modalBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.btnText,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
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
  sectionSpacer: {
    height: 32,
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
