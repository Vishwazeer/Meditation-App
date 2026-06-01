/**
 * File: LoginScreen.tsx
 *
 * Description: Handles user authentication via phone OTP, email/password,
 * and Google OAuth. Provides toggle between phone and email login modes.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { colors } from '../utils/styles';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

type AuthMode = 'phone' | 'email';
type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { requestOTP, emailLogin, isLoading } = useAuthStore();

  const handleSendOTP = async () => {
    if (!phoneNumber) { setError('Please enter your phone number'); return; }
    if (phoneNumber.length !== 10) { setError('Please enter a valid 10-digit phone number'); return; }
    setError('');
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      await requestOTP(fullPhone);
      navigation.navigate('OTP', { phone: fullPhone });
    } catch (err: unknown) {
      if (__DEV__) console.warn('[Auth] OTP Request Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    }
  };

  const handleEmailLogin = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    if (!EMAIL_REGEX.test(email)) { setError('Please enter a valid email address (e.g., name@domain.com)'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setError('');
    try {
      await emailLogin(email, password);
    } catch (err: unknown) {
      if (__DEV__) console.warn('[Auth] Email Login Error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await authService.googleLogin();
    } catch (err: unknown) {
      if (__DEV__) console.warn('[Auth] Google Login Error:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  return (
    <KeyboardAvoidingView style={[s.flex1, s.bgBg]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={[s.center, s.headerSection]}>
          <View style={s.logo}><Text style={s.logoEmoji}>{'\u{1F33A}'}</Text></View>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>
            {authMode === 'phone'
              ? 'Enter your phone number to receive a secure one-time password.'
              : 'Sign in with your email and password.'}
          </Text>
        </View>

        {authMode === 'phone' ? (
          <View style={s.fieldGroup}>
            <Text style={s.label}>Phone Number</Text>
            <View style={s.phoneRow}>
              <View style={s.codeBox}><Text style={s.codeText}>{countryCode}</Text></View>
              <TextInput
                style={s.phoneInput}
                placeholder="9876543210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phoneNumber}
                maxLength={10}
                accessibilityLabel="Phone number"
                onChangeText={t => {
                  const cleaned = t.replace(/[^0-9]/g, '').slice(0, 10);
                  setPhoneNumber(cleaned);
                  setError('');
                }}
              />
            </View>
          </View>
        ) : (
          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              accessibilityLabel="Email address"
              onChangeText={t => { setEmail(t.trim()); setError(''); }}
            />
            <Text style={[s.label, s.labelSpaced]}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              accessibilityLabel="Password"
              onChangeText={t => { setPassword(t); setError(''); }}
            />
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.btn, isLoading ? s.btnLoading : s.btnPrimary]}
          onPress={authMode === 'phone' ? handleSendOTP : handleEmailLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={authMode === 'phone' ? 'Send OTP' : 'Login'}
        >
          {isLoading ? <ActivityIndicator color="white" /> :
            <Text style={s.btnText}>{authMode === 'phone' ? 'Send OTP' : 'Login'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setError(''); setAuthMode(authMode === 'phone' ? 'email' : 'phone'); }}
          style={[s.center, s.toggleRow]}
          accessibilityRole="button"
        >
          <Text style={s.toggle}>{authMode === 'phone' ? 'Or use your email instead' : 'Or use phone number instead'}</Text>
        </TouchableOpacity>

        <View style={s.divRow}>
          <View style={s.divLine} /><Text style={s.divText}>OR</Text><View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogleLogin} disabled={isLoading}>
          <Text style={s.googleText}>Sign in with Google</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  bgBg: { backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: scale(24) },
  center: { alignItems: 'center' },
  headerSection: { marginBottom: verticalScale(40) },
  fieldGroup: { marginBottom: verticalScale(24) },
  labelSpaced: { marginTop: verticalScale(16) },
  toggleRow: { marginTop: verticalScale(16) },
  btnPrimary: { backgroundColor: colors.primary },
  btnLoading: { backgroundColor: colors.primaryLight },
  logoEmoji: { fontSize: moderateScale(36) },
  logo: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(20) },
  title: { fontSize: moderateScale(30), fontWeight: 'bold', color: colors.primaryDark, marginBottom: verticalScale(8) },
  subtitle: { fontSize: moderateScale(16), color: colors.gray500, textAlign: 'center', paddingHorizontal: scale(16) },
  label: { fontSize: moderateScale(14), fontWeight: '600', color: colors.gray700, marginBottom: verticalScale(8) },
  phoneRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: moderateScale(12), backgroundColor: colors.white, overflow: 'hidden' },
  codeBox: { paddingHorizontal: scale(16), paddingVertical: verticalScale(16), borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.gray50 },
  codeText: { fontSize: moderateScale(16), fontWeight: '600', color: colors.gray800 },
  phoneInput: { flex: 1, paddingHorizontal: scale(16), paddingVertical: verticalScale(16), fontSize: moderateScale(16), color: colors.gray800 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: moderateScale(12), backgroundColor: colors.white, paddingHorizontal: scale(16), paddingVertical: verticalScale(16), fontSize: moderateScale(16), color: colors.gray800 },
  error: { color: colors.error, fontSize: moderateScale(14), marginBottom: verticalScale(16) },
  btn: { width: '100%', paddingVertical: verticalScale(16), borderRadius: moderateScale(12), alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: moderateScale(18) },
  toggle: { color: colors.primary, fontWeight: '600', fontSize: moderateScale(14) },
  divRow: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(24), marginBottom: verticalScale(16) },
  divLine: { flex: 1, height: 1, backgroundColor: colors.gray300 },
  divText: { marginHorizontal: scale(12), color: colors.gray400, fontSize: moderateScale(14) },
  googleBtn: { width: '100%', paddingVertical: verticalScale(16), borderRadius: moderateScale(12), alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  googleText: { color: colors.gray800, fontWeight: 'bold', fontSize: moderateScale(16) },
});

export default LoginScreen;
