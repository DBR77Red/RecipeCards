import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NestedReorderableList,
  ScrollViewContainer,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { BottomTabBar } from '../components/BottomTabBar';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ErrorModal } from '../components/ErrorModal';
import { RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';
import { onSyncComplete } from '../utils/notifications';
import { applyOrder, deleteDraft, getDrafts, loadOrder, saveOrder, softDeletePublished, toggleFavorite } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg:         '#FAF5EE',
  title:      '#1C0A00',
  body:       '#4A2D1A',
  muted:      '#8B6444',
  label:      '#C4A882',
  divider:    '#E0D0B8',
  terracotta: '#E8521A',
  sage:       '#2D7A4F',
  btnBg:      '#E8521A',
  btnText:    '#FFFFFF',
  photoBg:    '#F2E9D8',
  photoMark:  'rgba(28,10,0,0.08)',
  cardBg:     '#FAF5EE',
  shadow:     'rgba(28,10,0,0.08)',
  panel:      '#1C0F06',
  panelText:  '#F5EDD9',
  panelMuted: '#C4A882',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

// ─── QR scanner modal ─────────────────────────────────────────────────────────

function QRScannerModal({ visible, onScanned, onClose, onEnterManually }: {
  visible: boolean;
  onScanned: (data: string) => void;
  onClose: () => void;
  onEnterManually: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={qrStyles.permScreen}>
          <Text style={qrStyles.permTitle}>{t.qrCameraTitle}</Text>
          <Text style={qrStyles.permSub}>{t.qrCameraSub}</Text>
          {permission && !permission.canAskAgain ? (
            <Text style={qrStyles.permSub}>{t.qrCameraSettings}</Text>
          ) : (
            <TouchableOpacity style={qrStyles.permBtn} onPress={requestPermission}>
              <Text style={qrStyles.permBtnText}>{t.qrAllowCamera}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={qrStyles.permCancel} onPress={onClose}>
            <Text style={qrStyles.permCancelText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={qrStyles.screen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : ({ data }) => {
            setScanned(true);
            onScanned(data);
          }}
        />
        <TouchableOpacity style={qrStyles.cancelBtn} onPress={onClose}>
          <Text style={qrStyles.cancelText}>← {t.cancel}</Text>
        </TouchableOpacity>
        <View style={qrStyles.overlay} pointerEvents="none">
          <Text style={qrStyles.overlayTitle}>{t.qrScanTitle}</Text>
          <View style={qrStyles.viewfinder} />
          <Text style={qrStyles.overlayHint}>{t.qrAlignHint}</Text>
        </View>
        <TouchableOpacity
          style={qrStyles.manualBtn}
          onPress={() => { onClose(); onEnterManually(); }}
        >
          <Text style={qrStyles.manualText}>{t.qrEnterManually}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Recipe list item ─────────────────────────────────────────────────────────

interface DraftListItemProps {
  recipe: RecipeData;
  onPress: () => void;
  onLongPress: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleFavorite?: () => void;
  drag?: () => void;
}

function DraftListItem({ recipe, onPress, onLongPress, selectionMode, isSelected, onToggleFavorite, drag }: DraftListItemProps) {
  const canFavorite = (recipe.status === 'published' || recipe.isReceived) && !!onToggleFavorite;
  const { t } = useLanguage();
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = () => {
    if (!onToggleFavorite) return;
    const becomingFavorite = !recipe.isFavorite;
    Haptics.impactAsync(
      becomingFavorite ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: becomingFavorite ? 1.35 : 1.2,
        duration: becomingFavorite ? 100 : 80,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: becomingFavorite ? 6 : 12,
        stiffness: 220,
        mass: 0.8,
      }),
    ]).start();
    onToggleFavorite();
  };
  const displayTitle    = recipe.title.trim() || t.untitledRecipe;
  const isTitleEmpty    = !recipe.title.trim();
  const ingredientCount = recipe.ingredients.filter(i => i.trim()).length;
  const ingredientLabel = ingredientCount === 1
    ? `1 ${t.ingredient}`
    : `${ingredientCount} ${t.ingredients}`;

  return (
    <View collapsable={false}>
    <TouchableOpacity
      style={styles.draftRow}
      onPress={drag ? undefined : onPress}
      onLongPress={drag ? undefined : onLongPress}
      activeOpacity={drag ? 1 : 0.7}
      delayLongPress={400}
    >
      {/* Thumbnail */}
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
        {selectionMode && (
          <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
            {isSelected && <Text style={styles.checkMark}>✓</Text>}
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
        {recipe.isReceived ? (
          <View style={[styles.draftBadge, styles.receivedBadgeHome]}>
            <Text style={[styles.draftBadgeText, styles.receivedBadgeHomeText]}>RECEIVED</Text>
          </View>
        ) : recipe.status === 'published' ? (
          <View style={styles.publishedRow}>
            <View style={[styles.draftBadge, styles.publishedBadgeHome]}>
              <Text style={[styles.draftBadgeText, styles.publishedBadgeHomeText]}>PUBLISHED</Text>
            </View>
            {recipe.cloudSyncStatus === 'pending' && (
              <Text style={styles.syncingLabel}>↑ syncing…</Text>
            )}
          </View>
        ) : (
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>DRAFT</Text>
          </View>
        )}
      </View>

      {/* Right actions */}
      {!selectionMode && (
        <View style={styles.rowRight}>
          {drag ? (
            <TouchableOpacity
              onPressIn={drag}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
              activeOpacity={0.5}
              style={styles.dragHandle}
            >
              <Svg width={18} height={14} viewBox="0 0 18 14">
                <Rect x="0" y="0"  width="18" height="2" rx="1" fill={C.label} />
                <Rect x="0" y="6"  width="18" height="2" rx="1" fill={C.label} />
                <Rect x="0" y="12" width="18" height="2" rx="1" fill={C.label} />
              </Svg>
            </TouchableOpacity>
          ) : (
            <>
              {canFavorite && (
                <Animated.View
                  collapsable={false}
                  style={{ transform: [{ scale: heartScale }] }}
                >
                  <TouchableOpacity
                    onPress={handleHeartPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                    activeOpacity={0.6}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path
                        d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
                        fill={recipe.isFavorite ? C.terracotta : 'none'}
                        stroke={recipe.isFavorite ? C.terracotta : C.label}
                        strokeWidth={1.6}
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </Animated.View>
              )}
              <Text style={styles.chevron}>›</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
    </View>
  );
}

// ─── Drag handle wrapper ───────────────────────────────────────────────────────

function ReorderableItemWrapper({
  isReorderMode,
  ...props
}: DraftListItemProps & { isReorderMode: boolean }) {
  const drag = useReorderableDrag();
  return <DraftListItem {...props} drag={isReorderMode ? drag : undefined} />;
}

// ─── Selection bar ────────────────────────────────────────────────────────────

function SelectionBar({ count, anim, onDelete, onCancel }: {
  count: number;
  anim: Animated.Value;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  return (
    <Animated.View style={[selBarStyles.bar, { paddingBottom: insets.bottom + 14, transform: [{ translateY }] }]} pointerEvents={count >= 0 ? 'box-none' : 'none'}>
      <TouchableOpacity onPress={onCancel} style={selBarStyles.cancelBtn} activeOpacity={0.7}>
        <Text style={selBarStyles.cancelText}>{t.cancel}</Text>
      </TouchableOpacity>
      <Text style={selBarStyles.countText}>{t.selectionCount(count)}</Text>
      <TouchableOpacity
        onPress={onDelete}
        style={[selBarStyles.deleteBtn, count === 0 && selBarStyles.deleteBtnDisabled]}
        activeOpacity={0.8}
        disabled={count === 0}
      >
        <Text style={selBarStyles.deleteBtnText}>{t.selectionDelete}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const selBarStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C0F06',
    borderTopWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: '#1C0A00',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingRight: 8,
    minWidth: 64,
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: '#C4A882',
  },
  countText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#F5EDD9',
  },
  deleteBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useLanguage();
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>
      <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
      <Text style={styles.emptySub}>{t.emptySub}</Text>
    </View>
  );
}

// ─── Filter empty state ───────────────────────────────────────────────────────

function FilterEmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

// ─── Sync toast ───────────────────────────────────────────────────────────────

function SyncToast({ message }: { message: string | null }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Slide in
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0,   duration: 220, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1,   duration: 220, useNativeDriver: true }),
    ]).start();

    // Slide out after 3s
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 280, useNativeDriver: true }),
      ]).start();
    }, 3000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.syncToast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.syncToastText}>✓ {message} is now live</Text>
    </Animated.View>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<RecipeData[]>([]);
  const [published, setPublished] = useState<RecipeData[]>([]);
  const [received, setReceived] = useState<RecipeData[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cardCode, setCardCode] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RecipeData | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncToastCount, setSyncToastCount] = useState(0);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'received'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReorderMode, setIsReorderMode] = useState(false);
  const selectionBarAnim = useRef(new Animated.Value(0)).current;
  const listScrollRef = useRef<ScrollView>(null);

  // Listen for successful background syncs and refresh the list
  useEffect(() => {
    const unsub = onSyncComplete(title => {
      setSyncToastMessage(title);
      setSyncToastCount(c => c + 1);
      loadData(); // refresh badges
    });
    return unsub;
  }, []);

  const [key, setKey] = useState(0);

  const loadData = useCallback(async (isActive?: () => boolean) => {
    const [all, order] = await Promise.all([getDrafts(), loadOrder()]);
    if (isActive && !isActive()) return;
    const draftsList    = applyOrder(all.filter(r => r.status === 'draft'), order.drafts);
    const publishedList = applyOrder(all.filter(r => r.status === 'published' && !r.isReceived), order.published);
    const receivedList  = applyOrder(all.filter(r => r.isReceived), order.received);
    setDrafts(draftsList);
    setPublished(publishedList);
    setReceived(receivedList);
    setKey(k => k + 1);
  }, []);

  // Reload list every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadData(() => active);
      return () => { active = false; };
    }, [loadData])
  );

  const enterSelectionMode = (firstId: string) => {
    setIsReorderMode(false);
    setSelectionMode(true);
    setSelectedIds(new Set([firstId]));
    Animated.spring(selectionBarAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    Animated.timing(selectionBarAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  };

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleBatchDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    const all = await getDrafts();
    setShowBatchConfirm(false);
    exitSelectionMode();
    for (const id of ids) {
      const recipe = all.find(r => r.id === id);
      if (!recipe) continue;
      if (recipe.status === 'draft') {
        await deleteDraft(id);
      } else {
        await softDeletePublished(id);
      }
    }
    loadData();
  };

  const handleQRScanned = (data: string) => {
    const match = data.match(/^recipecards:\/\/card\/([\w-]{1,64})$/);
    if (match) {
      navigation.navigate('Receive', { cardId: match[1] });
    } else {
      setErrorModal({ title: t.qrInvalidTitle, body: t.qrInvalidBody });
    }
  };

  const handleLongPress = (recipe: RecipeData) => {
    if (selectionMode) {
      toggleSelect(recipe.id);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 0);
    enterSelectionMode(recipe.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    if (target.status === 'draft') {
      await deleteDraft(target.id);
    } else {
      await softDeletePublished(target.id);
    }
    const all = await getDrafts();
    setDrafts(all.filter(r => r.status === 'draft'));
    setPublished(all.filter(r => r.status === 'published' && !r.isReceived));
    setReceived(all.filter(r => r.isReceived));
  };

  const handleDeleteCancel = () => setDeleteTarget(null);

  const handleToggleFavorite = async (item: RecipeData) => {
    await toggleFavorite(item.id);
    loadData();
  };

  const makeItemProps = (item: RecipeData, sectionData: RecipeData[]) => ({
    recipe: item,
    selectionMode,
    isSelected: selectedIds.has(item.id),
    onPress: () => {
      if (selectionMode) { toggleSelect(item.id); return; }
      if (item.status === 'draft') {
        navigation.navigate('Form', { recipe: item });
      } else {
        const nonDraft = sectionData.filter(r => r.status !== 'draft');
        navigation.navigate('CardView', { cardId: item.id, recipes: nonDraft });
      }
    },
    onLongPress: () => handleLongPress(item),
    onToggleFavorite: () => handleToggleFavorite(item),
    isReorderMode,
  });

  const showDrafts    = filter === 'all' || filter === 'draft';
  const showPublished = filter === 'all' || filter === 'published';
  const showReceived  = filter === 'all' || filter === 'received';

  const allNonDraft = [...published, ...received];
  const isEmpty = drafts.length === 0 && published.length === 0 && received.length === 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Dark espresso header */}
      <View style={styles.darkHeader}>
        <View style={styles.darkHeaderTop}>
          <Text style={styles.darkHeaderTitle}>{t.homeTitle} <Text style={styles.darkHeaderAccent}>{t.homeTitleAccent}</Text></Text>
          <View style={styles.darkHeaderActions}>
            {!selectionMode && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsReorderMode(v => !v);
                }}
                activeOpacity={0.7}
                style={styles.reorderBtn}
              >
                <Text style={[styles.reorderBtnText, isReorderMode && styles.reorderBtnTextActive]}>
                  {isReorderMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
            {!isReorderMode && (
              <TouchableOpacity
                style={styles.darkHeaderAvatar}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.7}
              >
                <Text style={styles.darkHeaderAvatarText}>👤</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {([
            { key: 'all',       label: t.filterAll       },
            { key: 'draft',     label: t.filterDrafts    },
            { key: 'published', label: t.filterPublished },
            { key: 'received',  label: t.filterReceived  },
          ] as const).map(({ key: k, label }) => (
            <TouchableOpacity
              key={k}
              style={[styles.filterPill, filter === k && styles.filterPillActive]}
              onPress={() => setFilter(k)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, filter === k && styles.filterPillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recipe list */}
      <ScrollViewContainer
        ref={listScrollRef}
        contentContainerStyle={[styles.listContent, selectionMode && styles.listContentSelection]}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Drafts section */}
            {showDrafts && drafts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t.sectionDrafts}</Text>
                <NestedReorderableList
                  data={drafts}
                  keyExtractor={item => item.id}
                  dragEnabled={isReorderMode}
                  onReorder={({ from, to }) => {
                    const next = reorderItems(drafts, from, to);
                    setDrafts(next);
                    saveOrder('drafts', next.map(r => r.id));
                  }}
                  renderItem={({ item }) => (
                    <ReorderableItemWrapper {...makeItemProps(item, drafts)} />
                  )}
                  scrollEnabled={false}
                  style={styles.nestedList}
                  extraData={[key, selectionMode, selectedIds, isReorderMode]}
                />
              </>
            )}

            {/* Published section */}
            {showPublished && published.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t.sectionPublished}</Text>
                <NestedReorderableList
                  data={published}
                  keyExtractor={item => item.id}
                  dragEnabled={isReorderMode}
                  onReorder={({ from, to }) => {
                    const next = reorderItems(published, from, to);
                    setPublished(next);
                    saveOrder('published', next.map(r => r.id));
                  }}
                  renderItem={({ item }) => (
                    <ReorderableItemWrapper {...makeItemProps(item, allNonDraft)} />
                  )}
                  scrollEnabled={false}
                  style={styles.nestedList}
                  extraData={[key, selectionMode, selectedIds, isReorderMode]}
                />
              </>
            )}

            {/* Received section */}
            {showReceived && received.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t.sectionReceived}</Text>
                <NestedReorderableList
                  data={received}
                  keyExtractor={item => item.id}
                  dragEnabled={isReorderMode}
                  onReorder={({ from, to }) => {
                    const next = reorderItems(received, from, to);
                    setReceived(next);
                    saveOrder('received', next.map(r => r.id));
                  }}
                  renderItem={({ item }) => (
                    <ReorderableItemWrapper {...makeItemProps(item, allNonDraft)} />
                  )}
                  style={styles.nestedList}
                  scrollEnabled={false}
                  extraData={[key, selectionMode, selectedIds, isReorderMode]}
                />
              </>
            )}

            {/* Filter-specific empty states */}
            {!isEmpty && filter === 'draft'     && drafts.length === 0    && <FilterEmptyState title={t.filterEmptyDraftsTitle}    sub={t.filterEmptyDraftsSub} />}
            {!isEmpty && filter === 'published' && published.length === 0 && <FilterEmptyState title={t.filterEmptyPublishedTitle} sub={t.filterEmptyPublishedSub} />}
            {!isEmpty && filter === 'received'  && received.length === 0  && <FilterEmptyState title={t.filterEmptyReceivedTitle}  sub={t.filterEmptyReceivedSub} />}
          </>
        )}
      </ScrollViewContainer>

      <BottomTabBar
        activeTab="Home"
        onHomePress={() => {
          listScrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
        onExchange={() => setShowQRScanner(true)}
      />

      <QRScannerModal
        visible={showQRScanner}
        onScanned={(data) => { setShowQRScanner(false); handleQRScanned(data); }}
        onClose={() => setShowQRScanner(false)}
        onEnterManually={() => setShowCodeModal(true)}
      />

      {/* Enter card code modal (manual fallback) */}
      <Modal
        visible={showCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.viewCardTitle}</Text>
            <Text style={styles.modalSub}>{t.viewCardSub}</Text>
            <TextInput
              style={styles.modalInput}
              value={cardCode}
              onChangeText={setCardCode}
              placeholder={t.viewCardPlaceholder}
              placeholderTextColor={C.label}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.modalBtn, !cardCode.trim() && styles.modalBtnDisabled]}
              onPress={() => {
                const id = cardCode.trim();
                setShowCodeModal(false);
                setCardCode('');
                navigation.navigate('Receive', { cardId: id });
              }}
              disabled={!cardCode.trim()}
            >
              <Text style={styles.modalBtnText}>{t.viewCardBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => { setShowCodeModal(false); setCardCode(''); }}
            >
              <Text style={styles.modalCancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        variant={deleteTarget?.status ?? 'draft'}
        recipeTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <DeleteConfirmModal
        visible={showBatchConfirm}
        variant="batch"
        recipeTitle=""
        batchCount={selectedIds.size}
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setShowBatchConfirm(false)}
      />

      <SelectionBar
        count={selectedIds.size}
        anim={selectionBarAnim}
        onDelete={() => { if (selectedIds.size > 0) setShowBatchConfirm(true); }}
        onCancel={exitSelectionMode}
      />

      <SyncToast key={syncToastCount} message={syncToastMessage} />

      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title ?? ''}
        body={errorModal?.body ?? ''}
        onDismiss={() => setErrorModal(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.panel,
  },

  // ── Dark header ────────────────────────────────────────────────────────────
  darkHeader: {
    backgroundColor: C.panel,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 0,
  },
  darkHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  darkHeaderAppName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    fontWeight: '800',
    color: C.panelText,
    letterSpacing: 1.5,
  },
  darkHeaderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(232,82,26,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkHeaderAvatarText: {
    fontSize: 16,
  },
  darkHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: C.panelText,
    lineHeight: 42,
    letterSpacing: -1,
  },
  darkHeaderAccent: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: '#E8521A',
    fontStyle: 'italic',
  },
  darkHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  reorderBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.panelMuted,
  },
  reorderBtnTextActive: {
    color: C.terracotta,
  },
  flex: {
    flex: 1,
  },
  dragHandle: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nestedList: {
    flexGrow: 0,
  },

  // Modal — matches app-wide design standard
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FAF5EE',
    borderRadius: 28,
    padding: 32,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: C.title,
    letterSpacing: -0.5,
  },
  modalSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: C.muted,
    lineHeight: 24,
    marginBottom: 4,
  },
  modalInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: C.title,
    backgroundColor: '#F2E9D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.divider,
  },
  modalBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
    backgroundColor: C.bg,
    minHeight: '100%',
  },
  listContentSelection: {
    paddingBottom: 160,
  },

  filterScroll: {
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
    paddingBottom: 8,
  },
  filterPill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterPillActive: {
    backgroundColor: '#E8521A',
    borderColor: '#E8521A',
  },
  filterPillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(245,237,217,0.5)',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: C.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },

  // Recipe row
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#1C0A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.divider,
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
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    gap: 3,
  },
  draftTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: C.title,
    lineHeight: 20,
  },
  draftTitleEmpty: {
    color: C.label,
  },
  draftSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.muted,
  },
  draftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(234,88,12,0.10)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  draftBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: C.terracotta,
  },
  publishedBadgeHome: {
    backgroundColor: 'rgba(5,150,105,0.10)',
  },
  publishedBadgeHomeText: {
    color: C.sage,
  },
  receivedBadgeHome: {
    backgroundColor: 'rgba(99,102,241,0.10)',
  },
  receivedBadgeHomeText: {
    color: '#6366F1',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: C.label,
    lineHeight: 20,
  },
  checkCircle: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: C.btnBg,
    borderColor: C.btnBg,
  },
  checkMark: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  publishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncingLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: C.muted,
    letterSpacing: 0.2,
  },

  // Sync toast
  syncToast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    backgroundColor: '#1C0F06',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 100,
    shadowColor: '#1C0A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  syncToastText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#F5EDD9',
    letterSpacing: 0.2,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: C.divider,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.photoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 32,
    color: C.label,
    lineHeight: 36,
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
  },
});

// ─── QR scanner styles ────────────────────────────────────────────────────────

const qrStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  cancelBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    zIndex: 10,
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 32,
  },
  viewfinder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  overlayHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 20,
  },
  manualBtn: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manualText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },

  // Permission screen
  permScreen: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  permSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#0F172A',
  },
  permCancel: {
    paddingVertical: 14,
  },
  permCancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});
