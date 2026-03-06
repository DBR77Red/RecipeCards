import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { RootStackParamList } from '../types/navigation';
import { deleteDraft, getDrafts, getUserName, setUserName, softDeletePublished } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

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
  btnBg:      '#18181B',
  btnText:    '#FAFAFA',
  photoBg:    '#F5F5F4',
  photoMark:  'rgba(0,0,0,0.06)',
  cardBg:     '#FFFFFF',
  shadow:     'rgba(0,0,0,0.08)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

// ─── Tab bar icons ────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
        stroke={color} strokeWidth={1.6} strokeLinejoin="round"
      />
      <Path d="M9 21v-7h6v7" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function FavoritesIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
        stroke={color} strokeWidth={1.6} strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExchangeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* top-left cell */}
      <Path d="M3 3h7v7H3z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M5 5h3v3H5z" fill={color} />
      {/* top-right cell */}
      <Path d="M14 3h7v7h-7z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M16 5h3v3h-3z" fill={color} />
      {/* bottom-left cell */}
      <Path d="M3 14h7v7H3z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M5 16h3v3H5z" fill={color} />
      {/* bottom-right dots */}
      <Path d="M14 14h3v3h-3z" fill={color} />
      <Path d="M18 14h3v3h-3z" fill={color} />
      <Path d="M14 18h3v3h-3z" fill={color} />
      <Path d="M18 18h3v3h-3z" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.6} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color} strokeWidth={1.6} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Profile modal (name + language) ─────────────────────────────────────────

function ProfileModal({ visible, currentName, onSave, onClose }: {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    setName(currentName);
  }, [currentName, visible]);

  const LANGS: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'pt', label: 'PT' },
    { code: 'de', label: 'DE' },
    { code: 'es', label: 'ES' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.profileTitle}</Text>
          <Text style={styles.modalSub}>{t.profileNameSub}</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder={t.profileNamePlaceholder}
            placeholderTextColor={C.label}
            autoFocus
          />

          {/* Language picker */}
          <Text style={styles.modalLanguageLabel}>{t.profileLanguageLabel}</Text>
          <View style={styles.languagePicker}>
            {LANGS.map(({ code, label }) => (
              <TouchableOpacity
                key={code}
                style={[styles.langPill, language === code && styles.langPillActive]}
                onPress={() => setLanguage(code)}
                activeOpacity={0.75}
              >
                <Text style={[styles.langPillText, language === code && styles.langPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.modalBtn, !name.trim() && styles.modalBtnDisabled]}
            onPress={() => { onSave(name.trim()); onClose(); }}
            disabled={!name.trim()}
          >
            <Text style={styles.modalBtnText}>{t.save}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
}

function DraftListItem({ recipe, onPress, onLongPress }: DraftListItemProps) {
  const { t } = useLanguage();
  const displayTitle    = recipe.title.trim() || t.untitledRecipe;
  const isTitleEmpty    = !recipe.title.trim();
  const ingredientCount = recipe.ingredients.filter(i => i.trim()).length;
  const ingredientLabel = ingredientCount === 1
    ? `1 ${t.ingredient}`
    : `${ingredientCount} ${t.ingredients}`;

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
          <Image
            source={require('../../assets/placeholder.jpg')}
            style={styles.thumbnailImg}
            resizeMode="cover"
          />
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

// ─── Home screen ──────────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<RecipeData[]>([]);
  const [published, setPublished] = useState<RecipeData[]>([]);
  const [userName, setUserNameState] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cardCode, setCardCode] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RecipeData | null>(null);

  useEffect(() => {
    getUserName().then(setUserNameState);
  }, []);

  const [key, setKey] = useState(0);

  const loadData = useCallback(async () => {
    const all = await getDrafts();
    const draftsList = all.filter(r => r.status === 'draft');
    const publishedList = all.filter(r => r.status === 'published');
    setDrafts(draftsList);
    setPublished(publishedList);
    setKey(k => k + 1);
  }, []);

  // Reload list every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (active) {
        loadData();
      }
      return () => { active = false; };
    }, [])
  );

  const handleSaveName = async (name: string) => {
    await setUserName(name);
    setUserNameState(name);
  };

  const handleQRScanned = (data: string) => {
    const match = data.match(/recipecards:\/\/card\/(.+)/);
    if (match) {
      navigation.navigate('Receive', { cardId: match[1] });
    } else {
      Alert.alert(t.qrInvalidTitle, t.qrInvalidBody);
    }
  };

  const handleLongPress = (recipe: RecipeData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteTarget(recipe);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 0);
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
    setPublished(all.filter(r => r.status === 'published'));
  };

  const handleDeleteCancel = () => setDeleteTarget(null);

  const renderItem = ({ item }: { item: RecipeData }) => (
    <DraftListItem
      recipe={item}
      onPress={() =>
        item.isReceived
          ? navigation.navigate('CardView', { cardId: item.id })
          : item.status === 'published'
          ? navigation.navigate('Preview', { recipe: item })
          : navigation.navigate('Form', { recipe: item })
      }
      onLongPress={() => handleLongPress(item)}
    />
  );

  type ListSection = { title: string; data: RecipeData[] };

  const sections: ListSection[] = [
    ...(drafts.length > 0 ? [{ title: t.sectionDrafts, data: drafts }] : []),
    ...(published.length > 0 ? [{ title: t.sectionPublished, data: published }] : []),
  ];

  const isEmpty = drafts.length === 0 && published.length === 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Recipe list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionLabel, title === t.sectionPublished && drafts.length > 0 && styles.sectionLabelSpaced]}>
            {title}
          </Text>
        )}
        ListEmptyComponent={isEmpty ? <EmptyState /> : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={key}
        stickySectionHeadersEnabled={false}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => {}}>
          <HomeIcon color={C.terracotta} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>{t.tabHome}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => Alert.alert(t.comingSoonTitle, t.comingSoonBody)}>
          <FavoritesIcon color={C.muted} />
          <Text style={styles.tabLabel}>{t.tabFavorites}</Text>
        </TouchableOpacity>

        <View style={styles.tabItemCenter}>
          <TouchableOpacity
            style={styles.tabCenterBtn}
            onPress={() => navigation.navigate('Form', {})}
            activeOpacity={0.85}
          >
            <Text style={styles.tabCenterPlus}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => setShowQRScanner(true)}>
          <ExchangeIcon color={C.muted} />
          <Text style={styles.tabLabel}>{t.tabExchange}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => setShowProfileModal(true)}>
          <ProfileIcon color={C.muted} />
          <Text style={styles.tabLabel}>{t.tabProfile}</Text>
        </TouchableOpacity>
      </View>

      <ProfileModal
        visible={showProfileModal}
        currentName={userName}
        onSave={handleSaveName}
        onClose={() => setShowProfileModal(false)}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
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
    backgroundColor: '#F7F5F2',
    borderRadius: 24,
    padding: 32,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: C.title,
    letterSpacing: -0.3,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.divider,
  },
  modalBtn: {
    backgroundColor: C.btnBg,
    borderRadius: 100,
    height: 54,
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
    paddingTop: 24,
    paddingBottom: 100,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingBottom: 8,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    gap: 3,
  },
  tabItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  tabCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.btnBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  tabCenterPlus: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 28,
    color: C.btnText,
    lineHeight: 32,
  },
  tabLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: C.muted,
  },
  tabLabelActive: {
    color: C.terracotta,
    fontFamily: 'DMSans_500Medium',
  },

  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.muted,
    marginBottom: 8,
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
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
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
  chevron: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: C.label,
    lineHeight: 20,
  },

  // Language picker
  modalLanguageLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.muted,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  languagePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    flex: 1,
    height: 42,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillActive: {
    backgroundColor: C.btnBg,
    borderColor: C.btnBg,
  },
  langPillText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: C.muted,
    letterSpacing: 1,
  },
  langPillTextActive: {
    color: C.btnText,
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
    fontFamily: 'DMSans_300Light',
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#fff',
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
    fontFamily: 'PlayfairDisplay_700Bold',
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
