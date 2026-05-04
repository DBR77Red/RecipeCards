import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LEAKAGE_WARNING =
  "This code is single-use and tied to your account. Sharing it with someone who should not have access is a violation of this app's terms and can be traced back to you.";

type Props = {
  code: string;
  expiresAt: string;
  onDismiss: () => void;
};

export function InviteShareCard({ code, expiresAt, onDismiss }: Props) {
  const expiry = new Date(expiresAt).toLocaleDateString();

  const handleShare = () => {
    Share.share({
      title: 'RecipeCards Invite',
      message:
        `You're invited to RecipeCards!\n\nInvite code: ${code}\n\nValid until ${expiry}. One-time use only.\n\n⚠️ ${LEAKAGE_WARNING}`,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your Invite Code</Text>
      <Text style={styles.code} selectable>{code}</Text>
      <Text style={styles.expiry}>Expires {expiry} · Single use · Traceable to you</Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Important</Text>
        <Text style={styles.warningBody}>{LEAKAGE_WARNING}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
        <Text style={styles.shareBtnText}>Share Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F5F2',
    borderRadius: 24,
    padding: 32,
    gap: 12,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#8B6444',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1C0A00',
    letterSpacing: 1,
  },
  expiry: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#C4A882',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0C040',
  },
  warningTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#856404',
  },
  warningBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  shareBtn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: '#E8521A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  shareBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  dismissBtn: { alignItems: 'center', paddingVertical: 16 },
  dismissText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#C4A882' },
});
