import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeData {
  id: string;
  status: 'draft' | 'published';
  title: string;
  creatorName: string;
  photo: string | null;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  directions: string[];
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
  deletedAt?: string;
  isReceived?: boolean;
  sourceCardId?: string;  // original Supabase card ID — set on received cards for deduplication
  isFavorite?: boolean;
  receiveCount?: number;
  cloudSyncStatus?: 'synced' | 'pending' | 'failed';
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         '#F5EDD9',   // parchment cream
  border:     '#E8D8B8',   // warm beige border
  amber:      '#D4780A',   // amber accent labels
  darkText:   '#1C0A00',   // deep warm black
  bodyText:   '#4A2D1A',   // warm brown body
  white:      '#FFFFFF',
  panel:      '#1C0F06',   // espresso dark — bottom zone
  panelAmber: '#D4780A',   // amber on dark
  panelText:  '#F5EDD9',   // parchment on dark
  panelMuted: '#C4A882',   // muted on dark
  panelDiv:   'rgba(255,255,255,0.15)', // divider on dark
};

const CARD_W  = 320;
const PHOTO_H = 244;
const RADIUS  = 28;

// ─── Stat column ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{label}</Text>
      <Text style={styles.statValue}>{value || '—'}</Text>
    </View>
  );
}

// ─── Recipe content ───────────────────────────────────────────────────────────

function RecipeContent({ recipe }: { recipe: RecipeData }) {
  const { t } = useLanguage();
  const ingredients = recipe.ingredients.filter(i => i.trim());
  const directions  = recipe.directions.filter(s => s.trim());
  if (ingredients.length === 0 && directions.length === 0) return null;
  return (
    <View style={styles.recipeContent}>
      {ingredients.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>{t.cardIngredients}</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{ing}</Text>
            </View>
          ))}
        </>
      )}
      {directions.length > 0 && (
        <>
          <Text style={[styles.sectionHeading, ingredients.length > 0 && { marginTop: 14 }]}>
            {t.cardInstructions}
          </Text>
          {directions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────

function CardFront({
  recipe, onShare, onPublish, publishing,
}: {
  recipe: RecipeData;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
}) {
  const { t } = useLanguage();
  const published = recipe.status === 'published';
  const photoSource = useMemo(
    () => recipe.photo ? { uri: recipe.photo } : null,
    [recipe.photo]
  );

  return (
    <View>
      <View style={styles.accentBar} />

      {/* Photo zone */}
      <View style={styles.photoZone}>
        {photoSource ? (
          <Image source={photoSource} style={styles.photo} resizeMode="cover" />
        ) : (
          <Image
            source={require('../../assets/placeholder.jpg')}
            style={[styles.photo, styles.photoPlaceholder]}
            resizeMode="cover"
          />
        )}

        {/* Gradient scrim */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="scrimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="black" stopOpacity={0} />
              <Stop offset="55%" stopColor="black" stopOpacity={0} />
              <Stop offset="72%" stopColor="black" stopOpacity={0.25} />
              <Stop offset="88%" stopColor="black" stopOpacity={0.5} />
              <Stop offset="100%" stopColor="black" stopOpacity={0.72} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrimGradient)" />
        </Svg>

        <View style={[styles.statusBadge, published ? styles.statusBadgePub : styles.statusBadgeDraft]}>
          <View style={[styles.statusDot, published ? styles.statusDotPub : styles.statusDotDraft]} />
          <Text style={[styles.statusText, published ? styles.statusTextPub : styles.statusTextDraft]}>
            {published ? t.filterPublished : t.filterDrafts}
          </Text>
        </View>
      </View>

      {/* Bottom zone */}
      <View style={styles.bottomZone}>
        <View style={styles.panelHairline} />
        <Text style={styles.recipeLabel} numberOfLines={1}>
          {published ? t.filterPublished : t.filterDrafts}
        </Text>
        <Text style={styles.panelTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.panelMetaRow}>
          <Text style={styles.panelMeta} numberOfLines={1}>{t.cardBy} {recipe.creatorName}</Text>
          {recipe.receiveCount !== undefined && (
            <View style={styles.panelMetaCount}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                <Circle cx="9" cy="7" r="3" stroke={C.panelMuted} strokeWidth="2" />
                <Path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" stroke={C.panelMuted} strokeWidth="2" strokeLinecap="round" />
                <Circle cx="18" cy="8" r="2.2" stroke={C.panelMuted} strokeWidth="2" />
                <Path d="M21 21v-.5a4.5 4.5 0 0 0-3-4.24" stroke={C.panelMuted} strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.panelMetaCountText}>{recipe.receiveCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Stat label={t.cardServes} value={recipe.servings} />
          <View style={styles.statDivider} />
          <Stat label={t.cardPrep}   value={recipe.prepTime ? recipe.prepTime.replace(/\D/g, '') + ' ' + t.cardMinSuffix : ''} />
          <View style={styles.statDivider} />
          <Stat label={t.cardCook}   value={recipe.cookTime ? recipe.cookTime.replace(/\D/g, '') + ' ' + t.cardMinSuffix : ''} />
        </View>

        <View style={styles.ctaDivider} />

        {published ? (
          <TouchableOpacity style={styles.ctaBtnOutline} onPress={onShare} activeOpacity={0.8}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
              <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M16 6l-4-4-4 4" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 2v13" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.ctaBtnOutlineText}>{t.cardShareBtn}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, publishing && styles.ctaBtnDisabled]}
            onPress={onPublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>
              {publishing ? t.cardPublishing : t.cardPublishBtn}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <RecipeContent recipe={recipe} />
    </View>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

export function RecipeCard({ recipe, onShare, onPublish, publishing }: {
  recipe: RecipeData;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
}) {
  return (
    <View style={styles.wrapper}>
      <CardFront recipe={recipe} onShare={onShare} onPublish={onPublish} publishing={publishing} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shell ──
  wrapper: {
    width: CARD_W,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 32px 64px rgba(28,10,0,0.35)' },
      default: {
        shadowColor: '#1C0A00',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.30,
        shadowRadius: 48,
        elevation: 24,
      },
    }),
  },
  accentBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#E8521A',
  },

  // ── Front: photo zone ──
  photoZone: {
    width: '100%',
    height: PHOTO_H,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 100,
    zIndex: 1,
  },
  statusBadgePub: {
    backgroundColor: 'rgba(45,122,79,0.14)',
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(232,82,26,0.14)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotPub: {
    backgroundColor: '#2D7A4F',
  },
  statusDotDraft: {
    backgroundColor: '#E8521A',
  },
  statusText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  statusTextPub: {
    color: '#2D7A4F',
  },
  statusTextDraft: {
    color: '#E8521A',
  },

  // ── Front: bottom zone (dark espresso panel) ──
  bottomZone: {
    backgroundColor: C.panel,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    position: 'relative',
  },
  panelHairline: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(232,82,26,0.5)',
  },
  recipeLabel: {
    alignSelf: 'stretch',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: C.panelAmber,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  panelTitle: {
    alignSelf: 'stretch',
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 26,
    color: C.panelText,
    marginBottom: 8,
  },
  panelMetaRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  panelMeta: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: C.panelMuted,
  },
  panelMetaCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelMetaCountText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: C.panelMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: C.panelAmber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.panelText,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: C.panelDiv,
  },
  ctaDivider: {
    width: '100%',
    height: 1,
    backgroundColor: C.panelDiv,
    marginTop: 14,
    marginBottom: 14,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8521A',
    borderRadius: 100,
    height: 54,
    width: '100%',
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.3,
  },
  ctaBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    height: 54,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(212,120,10,0.5)',
    backgroundColor: 'rgba(212,120,10,0.08)',
  },
  ctaBtnOutlineText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.panelAmber,
    letterSpacing: 0.3,
  },

  // ── Recipe content section ──
  recipeContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: C.amber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.amber,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: C.bodyText,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  stepNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.amber,
    width: 22,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: C.bodyText,
  },
});
