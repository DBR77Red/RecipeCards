import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InviteCodeInput } from '../components/InviteCodeInput';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const C = {
  panel:      '#1C0F06',
  panelText:  '#F5EDD9',
  panelMuted: '#C4A882',
  bg:         '#FAF5EE',
  surface:    '#F2E9D8',
  title:      '#1C0A00',
  muted:      '#8B6444',
  label:      '#C4A882',
  terracotta: '#E8521A',
  divider:    '#E0D0B8',
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code:   'This invite code is not valid or has already been used.',
  invalid_format: 'Invalid code format — paste the full code you received.',
  race_condition: 'This code was just used by someone else.',
};

export function LoginScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Expo Go doesn't register the app's custom scheme, so let expo-auth-session
  // auto-detect the correct exp:// URI. Standalone builds use recipecards://.
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const redirectUri = AuthSession.makeRedirectUri(
    isExpoGo ? {} : { scheme: 'recipecards' }
  );

  const handleSignIn = async () => {
    setInviteError(null);
    const trimmedCode = inviteCode.trim();

    // Pre-validate invite code only when one is provided.
    // Returning users (already invite_validated) skip this and go straight to OAuth.
    if (trimmedCode) {
      setValidating(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
          body: JSON.stringify({ code: trimmedCode }),
        });
        const json = await res.json();
        if (!json.valid) {
          setInviteError(ERROR_MESSAGES[json.error] ?? 'Invalid invite code.');
          return;
        }
      } catch {
        setInviteError('Could not validate invite code. Check your connection and try again.');
        return;
      } finally {
        setValidating(false);
      }
    }

    // Open Google OAuth
    setSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });

      if (error || !data.url) {
        Alert.alert('Sign-in error', error?.message ?? 'Could not start sign-in.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (result.type !== 'success') return;

      // Extract tokens from the callback URL fragment
      const fragment = result.url.split('#')[1] ?? result.url.split('?')[1] ?? '';
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        Alert.alert('Sign-in error', 'Could not retrieve session. Please try again.');
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        Alert.alert('Sign-in error', sessionError.message);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Sign-in error', 'Session not found after authentication.');
        await supabase.auth.signOut();
        return;
      }

      // Returning user: already validated — just refresh the session and we're done.
      if (session.user.app_metadata?.invite_validated === true) {
        await supabase.auth.refreshSession();
        return;
      }

      // New user: must have provided an invite code to proceed.
      if (!trimmedCode) {
        await supabase.auth.signOut();
        setInviteError('You need an invite code to join. Ask a current member.');
        return;
      }

      // Consume the invite server-side.
      // Sets invite_validated = true in app_metadata via service role.
      // On failure, sign out immediately so the user gets a clean retry state.
      const consumeRes = await fetch(`${SUPABASE_URL}/functions/v1/consume-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: trimmedCode }),
      });
      const consumeJson = await consumeRes.json();

      if (!consumeJson.success && !consumeJson.alreadyValidated) {
        await supabase.auth.signOut();
        setInviteError(
          ERROR_MESSAGES[consumeJson.error] ??
          'Invite validation failed. Contact the person who invited you.',
        );
        return;
      }

      // Force session refresh so app_metadata.invite_validated is visible immediately.
      // AuthContext picks up the updated session via onAuthStateChange — no navigation needed.
      await supabase.auth.refreshSession();
    } catch {
      Alert.alert('Sign-in error', 'Something went wrong. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const busy = signingIn || validating;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Dark espresso header — matches HomeScreen pattern */}
      <View style={styles.header}>
        <Text style={styles.appName}>RECIPECARDS</Text>
        <Text style={styles.headline}>
          Share recipes,{'\n'}
          <Text style={styles.headlineAccent}>beautifully.</Text>
        </Text>
        <Text style={styles.headerSub}>Invite-only · Join with a code from a member</Text>
      </View>

      {/* Cream body */}
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Invite code · new members only</Text>

        <InviteCodeInput
          value={inviteCode}
          onChange={(v) => { setInviteCode(v); setInviteError(null); }}
          error={inviteError}
          validating={validating}
        />

        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Already a member? Just tap Continue — no code needed.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.panel,
  },

  // ── Dark header ────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.panel,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 6,
  },
  appName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: C.panelMuted,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  headline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: C.panelText,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    color: C.terracotta,
    fontStyle: 'italic',
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: C.panelMuted,
    marginTop: 4,
  },

  // ── Cream body ─────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 16,
  },
  sectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  btn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: C.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: C.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  disclaimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: C.label,
    textAlign: 'center',
    marginTop: 4,
  },
});
