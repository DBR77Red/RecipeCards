import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
export type ActiveTab = 'Home' | 'Favorites' | 'Profile';

interface Props {
  activeTab: ActiveTab;
  /** HomeScreen only: scroll list to top when Home tab is tapped while already on Home */
  onHomePress?: () => void;
  /** HomeScreen only: open QR scanner */
  onExchange?: () => void;
}

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
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.6} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const TERRACOTTA = '#EA580C';
const MUTED      = '#A8A29E';

export function BottomTabBar({ activeTab, onHomePress, onExchange }: Props) {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();

  const go = (screen: ActiveTab) => navigation.navigate(screen);

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => activeTab === 'Home' ? onHomePress?.() : go('Home')}
      >
        <HomeIcon color={activeTab === 'Home' ? TERRACOTTA : MUTED} />
        <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>
          {t.tabHome}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => go('Favorites')}
      >
        <FavoritesIcon color={activeTab === 'Favorites' ? TERRACOTTA : MUTED} />
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
        onPress={() => onExchange ? onExchange() : go('Home')}
      >
        <ExchangeIcon color={MUTED} />
        <Text style={styles.tabLabel}>{t.tabExchange}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => go('Profile')}
      >
        <ProfileIcon color={activeTab === 'Profile' ? TERRACOTTA : MUTED} />
        <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
          {t.tabProfile}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
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
    backgroundColor: '#18181B',
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
    color: '#FAFAFA',
    lineHeight: 32,
  },
  tabLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: MUTED,
  },
  tabLabelActive: {
    color: TERRACOTTA,
    fontFamily: 'DMSans_500Medium',
  },
});
