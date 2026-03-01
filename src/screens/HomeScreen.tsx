import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

// ─── Camera icon ──────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <Svg width={20} height={18} viewBox="0 0 20 18" fill="none">
      <Path
        d="M19 16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.5L6 3h8l1.5 2H18a1 1 0 0 1 1 1z"
        stroke={C.muted}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx="10" cy="10.5" r="3" stroke={C.muted} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Account button ───────────────────────────────────────────────────────────

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

// ─── QR scanner modal ─────────────────────────────────────────────────────────

function QRScannerModal({ visible, onScanned, onClose, onEnterManually }: {
  visible: boolean;
  onScanned: (data: string) => void;
  onClose: () => void;
  onEnterManually: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={qrStyles.permScreen}>
          <Text style={qrStyles.permTitle}>Camera Access Needed</Text>
          <Text style={qrStyles.permSub}>
            Grant camera access to scan recipe QR codes.
          </Text>
          {permission && !permission.canAskAgain ? (
            <Text style={qrStyles.permSub}>Please enable camera in your device Settings.</Text>
          ) : (
            <TouchableOpacity style={qrStyles.permBtn} onPress={requestPermission}>
              <Text style={qrStyles.permBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={qrStyles.permCancel} onPress={onClose}>
            <Text style={qrStyles.permCancelText}>Cancel</Text>
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
          <Text style={qrStyles.cancelText}>← Cancel</Text>
        </TouchableOpacity>
        <View style={qrStyles.overlay} pointerEvents="none">
          <Text style={qrStyles.overlayTitle}>Scan Recipe Card</Text>
          <View style={qrStyles.viewfinder} />
          <Text style={qrStyles.overlayHint}>Align the QR code within the frame</Text>
        </View>
        <TouchableOpacity
          style={qrStyles.manualBtn}
          onPress={() => { onClose(); onEnterManually(); }}
        >
          <Text style={qrStyles.manualText}>Enter code manually</Text>
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cardCode, setCardCode] = useState('');

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
      Alert.alert('Invalid QR Code', "This doesn't look like a RecipeCards QR code.");
    }
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

  type ListSection = { title: string; data: RecipeData[] };

  const sections: ListSection[] = [
    ...(drafts.length > 0 ? [{ title: 'YOUR DRAFTS', data: drafts }] : []),
    ...(published.length > 0 ? [{ title: 'PUBLISHED', data: published }] : []),
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
          <Text style={[styles.sectionLabel, title === 'PUBLISHED' && drafts.length > 0 && styles.sectionLabelSpaced]}>
            {title}
          </Text>
        )}
        ListEmptyComponent={isEmpty ? <EmptyState /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={key}
        stickySectionHeadersEnabled={false}
      />

      {/* Fixed footer bar */}
      <View style={styles.footer}>
        <View style={[styles.footerSide, styles.footerLeft]}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setShowQRScanner(true)}
            activeOpacity={0.7}
          >
            <CameraIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('Form', {})}
          activeOpacity={0.85}
        >
          <Text style={styles.newBtnPlus}>+</Text>
        </TouchableOpacity>
        <View style={styles.footerSide}>
          <AccountButton userName={userName} onPress={() => setShowNameModal(true)} />
        </View>
      </View>

      <NameModal
        visible={showNameModal}
        currentName={userName}
        onSave={handleSaveName}
        onClose={() => setShowNameModal(false)}
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
            <Text style={styles.modalTitle}>View Shared Card</Text>
            <Text style={styles.modalSub}>
              Paste the card ID from a shared recipe link.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={cardCode}
              onChangeText={setCardCode}
              placeholder="Paste card ID here"
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
              <Text style={styles.modalBtnText}>View Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => { setShowCodeModal(false); setCardCode(''); }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Account button
  accountBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitials: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: C.btnText,
  },
  accountHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  accountBody: {
    width: 14,
    height: 7,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
    paddingTop: 28,
    paddingBottom: 16,
  },

  // Footer bar
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  footerSide: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerLeft: {
    alignItems: 'flex-start',
  },

  // Camera scan button
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.photoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // New Recipe button (circle FAB)
  newBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.btnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtnPlus: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 28,
    color: C.btnText,
    lineHeight: 32,
    marginTop: -2,
  },

  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
    color: C.label,
    marginBottom: 4,
  },
  sectionLabelSpaced: {
    marginTop: 32,
  },

  // Recipe row
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
    paddingTop: 80,
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
