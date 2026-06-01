/**
 * File: OTPScreen.tsx
 *
 * Description: OTP verification screen with 6-digit input fields, auto-verify
 * on completion, countdown-based resend functionality, and session establishment.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors } from '../utils/styles';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

const OTPScreen = ({ route }: Props) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [error, setError] = useState('');

  const { verifyOTP, requestOTP, isLoading } = useAuthStore();
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');

    try {
      await verifyOTP(phone, code);
      // Navigation is handled by App navigator based on authStore session state.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please check your OTP.';
      setError(message);
    }
  };

  // Auto verify when all digits are entered
  useEffect(() => {
    if (otp.every((digit) => digit !== '')) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleVerify is stable (only depends on phone which never changes on this screen)
  }, [otp]);

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await requestOTP(phone);
      setTimer(RESEND_TIMER);
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP.';
      setError(message);
    }
  };

  const isResendDisabled = timer > 0 || isLoading;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.header}>
        <Text style={s.title}>Verification</Text>
        <Text style={s.subtitle}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={s.phone}>{phone || 'your phone'}</Text>
      </View>

      <View style={s.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => {
              inputRefs.current[idx] = ref;
            }}
            style={[s.otpInput, digit ? s.otpInputFilled : s.otpInputEmpty]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, idx)}
            onKeyPress={(e) => handleKeyPress(e, idx)}
            testID={'otp-input-' + idx}
          />
        ))}
      </View>

      {error ? (
        <Text style={s.errorText}>{error}</Text>
      ) : (
        <View style={s.errorSpacer} />
      )}

      <TouchableOpacity
        style={[s.verifyBtn, isLoading ? s.verifyBtnLoading : s.verifyBtnActive]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={s.verifyBtnText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <View style={s.resendRow}>
        <Text style={s.resendLabel}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={isResendDisabled}>
          <Text style={[s.resendAction, isResendDisabled ? s.resendDisabled : s.resendEnabled]}>
            {timer > 0 ? 'Resend in ' + timer + 's' : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(30),
    fontFamily: 'PlayfairDisplay',
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: colors.gray500,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  phone: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: verticalScale(4),
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
    marginTop: verticalScale(8),
    paddingHorizontal: scale(8),
  },
  otpInput: {
    width: scale(48),
    height: verticalScale(56),
    borderWidth: 1,
    borderRadius: moderateScale(12),
    textAlign: 'center',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    color: colors.primary,
  },
  otpInputEmpty: {
    borderColor: colors.gray300,
    color: colors.gray800,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: verticalScale(16),
    fontSize: moderateScale(14),
  },
  errorSpacer: {
    height: verticalScale(16),
    marginBottom: verticalScale(16),
  },
  verifyBtn: {
    width: '100%',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  verifyBtnActive: {
    backgroundColor: colors.primary,
  },
  verifyBtnLoading: {
    backgroundColor: colors.primaryLight,
  },
  verifyBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: moderateScale(18),
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(24),
  },
  resendLabel: {
    color: colors.gray500,
    fontFamily: 'Inter',
  },
  resendAction: {
    fontWeight: 'bold',
  },
  resendDisabled: {
    color: colors.gray400,
  },
  resendEnabled: {
    color: colors.primary,
  },
});

export default OTPScreen;
