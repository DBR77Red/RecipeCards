import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  validating: boolean;
};

export function InviteCodeInput({ value, onChange, error, validating }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="Paste invite code"
        placeholderTextColor="#C4A882"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {validating && (
        <ActivityIndicator size="small" color="#E8521A" style={styles.spinner} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0D0B8',
    backgroundColor: '#F2E9D8',
    paddingHorizontal: 20,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#1C0A00',
  },
  inputError: { borderColor: '#C0392B' },
  spinner: { position: 'absolute', right: 16, top: 14 },
  error: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#C0392B',
    paddingHorizontal: 4,
  },
});
