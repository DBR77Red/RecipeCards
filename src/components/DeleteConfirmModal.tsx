import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  cardBg: '#FFFFFF',
  title:  '#1C1917',
  muted:  '#A8A29E',
  label:  '#D6D3D1',
  red:    '#DC2626',
};

interface Props {
  visible: boolean;
  variant: 'draft' | 'published';
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ visible, variant, recipeTitle, onConfirm, onCancel }: Props) {
  const isDraft = variant === 'draft';
  const displayTitle = recipeTitle.trim() || 'Untitled Recipe';

  const heading     = isDraft ? 'Delete Draft' : 'Remove Card';
  const body        = isDraft
    ? `Delete "${displayTitle}"? This cannot be undone.`
    : "Everyone you shared it with will keep their copy, but they will not be able to re-share the card.";
  const confirmText = isDraft ? 'Delete' : 'Remove';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>{confirmText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: C.title,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.muted,
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: C.red,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: C.label,
  },
});
