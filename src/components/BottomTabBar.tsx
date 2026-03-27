import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
export type ActiveTab = 'Home' | 'Favorites' | 'Settings' | 'Profile';

interface Props {
  activeTab: ActiveTab;
  /** HomeScreen only: scroll list to top when Home tab is tapped while already on Home */
  onHomePress?: () => void;
  /** HomeScreen only: open QR scanner */
  onExchange?: () => void;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ACTIVE   = '#E8521A';  // terracotta orange
const INACTIVE = '#C4A882';  // muted parchment

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
        stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
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
      <Path d="M3 3h7v7H3z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M5 5h3v3H5z" fill={color} />
      <Path d="M14 3h7v7h-7z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M16 5h3v3h-3z" fill={color} />
      <Path d="M3 14h7v7H3z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M5 16h3v3H5z" fill={color} />
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
      <Path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomTabBar({ activeTab, onHomePress, onExchange }: Props) {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();

  const go = (screen: keyof RootStackParamList) => navigation.navigate(screen as any);

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => activeTab === 'Home' ? onHomePress?.() : go('Home')}
      >
        <View style={[styles.iconWrap, activeTab === 'Home' && styles.iconWrapActive]}>
          <HomeIcon color={activeTab === 'Home' ? ACTIVE : INACTIVE} />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>
          {t.tabHome}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => go('Favorites')}
      >
        <View style={[styles.iconWrap, activeTab === 'Favorites' && styles.iconWrapActive]}>
          <FavoritesIcon color={activeTab === 'Favorites' ? ACTIVE : INACTIVE} />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'Favorites' && styles.tabLabelActive]}>
          {t.tabFavorites}
        </Text>
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

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onExchange ? onExchange() : navigation.navigate('Home', { openExchange: true })}
      >
        <View style={styles.iconWrap}>
          <ExchangeIcon color={INACTIVE} />
        </View>
        <Text style={styles.tabLabel}>{t.tabExchange}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => go('Settings')}
      >
        <View style={[styles.iconWrap, (activeTab === 'Settings' || activeTab === 'Profile') && styles.iconWrapActive]}>
          <ProfileIcon color={(activeTab === 'Settings' || activeTab === 'Profile') ? ACTIVE : INACTIVE} />
        </View>
        <Text style={[styles.tabLabel, (activeTab === 'Settings' || activeTab === 'Profile') && styles.tabLabelActive]}>
          {t.tabSettings}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1C0F06',
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 6,
    paddingHorizontal: 4,
    shadowColor: '#1C0A00',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(232,82,26,0.15)',
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
    borderRadius: 18,
    backgroundColor: '#E8521A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  tabCenterPlus: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  tabLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: INACTIVE,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: ACTIVE,
    fontFamily: 'DMSans_500Medium',
  },
});
