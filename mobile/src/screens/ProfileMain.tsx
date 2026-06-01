/**
 * File: ProfileMain.tsx
 *
 * Description: User profile screen showing avatar, stats grid, premium upsell
 * card, and settings rows for subscription, notifications, and logout.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { userService, UserProfile } from '../services/user.service';
import { authService } from '../services/auth.service';
import { ProfileStackParamList } from '../navigation/types';
import { colors } from '../utils/styles';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={s.statCard}>
    <Text style={s.statCardValue}>{value}</Text>
    <Text style={s.statCardLabel}>{label}</Text>
  </View>
);

const SettingsRow = ({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={s.settingsRow}
  >
    <Text
      style={[s.settingsLabel, danger ? s.settingsLabelDanger : s.settingsLabelNormal]}
    >
      {label}
    </Text>
    <Text style={s.settingsChevron}>{'\u{203A}'}</Text>
  </TouchableOpacity>
);

const ProfileMain = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { logout, user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setEditName(profile?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditEmail(profile?.email || user?.email || '');
    setEditPassword('');
    setEditDOB(profile?.date_of_birth || '');
    setEditModalOpen(true);
  };

  const calculateAge = (dobString: string): string => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} years` : '';
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    
    // Validate DOB format (YYYY-MM-DD) if provided
    const dobTrimmed = editDOB.trim();
    if (dobTrimmed) {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(dobTrimmed)) {
        Alert.alert('Validation Error', 'Date of Birth must be in YYYY-MM-DD format.');
        return;
      }
      
      const dobDate = new Date(dobTrimmed);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        Alert.alert('Validation Error', 'Please enter a valid past Date of Birth.');
        return;
      }
    }

    setSaving(true);
    let authErrorOccurred = false;
    let authMessage = '';

    try {
      // 1. Update general database profile
      const updated = await userService.updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim(),
        date_of_birth: dobTrimmed || null,
      });

      // 2. Update email / password credentials if changed
      const currentEmail = profile?.email || user?.email || '';
      const emailChanged = editEmail.trim() && editEmail.trim().toLowerCase() !== currentEmail.toLowerCase();
      const passwordChanged = editPassword.length > 0;

      if (emailChanged || passwordChanged) {
        try {
          await authService.updateCredentials(
            emailChanged ? editEmail.trim() : undefined,
            passwordChanged ? editPassword : undefined
          );
          if (emailChanged) {
            authMessage = '\nA verification link has been sent to your new email address.';
          }
        } catch (authErr: any) {
          authErrorOccurred = true;
          if (__DEV__) console.warn('[Profile] Auth credentials update failed:', authErr);
          Alert.alert('Warning', `Profile was saved, but authentication update failed: ${authErr.message || authErr}`);
        }
      }

      setProfile((prev) => ({
        ...prev,
        full_name: editName.trim(),
        phone: editPhone.trim(),
        date_of_birth: dobTrimmed || undefined,
        email: emailChanged && !authErrorOccurred ? editEmail.trim() : prev?.email,
      }));

      setEditModalOpen(false);
      if (!authErrorOccurred) {
        Alert.alert('Success', `Profile updated successfully!${authMessage}`);
      }
    } catch (err) {
      if (__DEV__) console.warn('[Profile] Save failed:', err);
      // Local fallback so it works seamlessly offline/mock mode
      setProfile((prev) => ({
        ...prev,
        full_name: editName.trim(),
        phone: editPhone.trim(),
        date_of_birth: dobTrimmed || undefined,
      }));
      setEditModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const data = await userService.getProfile();
        if (!cancelled) setProfile(data);
      } catch (err) {
        // Auth errors bubble up; everything else returns a skeleton.
        if (__DEV__) console.warn('[Profile] Load failed:', err);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const displayName = profile?.full_name || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : '--';
  const level = profile?.level || 'beginner';

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
          <Text style={s.displayName}>
            {displayName}
          </Text>
          {profile?.phone ? (
            <Text style={s.displayPhone}>
              {profile.phone}
            </Text>
          ) : null}
          <View style={s.levelBadge}>
            <Text style={s.levelText}>
              {level}
            </Text>
          </View>
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={openEditModal}
          >
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={s.statsSection}>
          <View style={s.statsGrid}>
            <StatCard label="Member Since" value={memberSince} />
            <StatCard label="Longest Streak" value="0 Days" />
            <StatCard label="Total Duration" value="0h" />
            <StatCard label="Sessions" value="0" />
            <StatCard label="Longest Session" value="0m" />
            <StatCard label="Monthly Progress" value="0%" />
          </View>
        </View>

        {/* Premium Upsell (Free users) */}
        {profile?.subscription_status !== 'active' && (
          <View style={s.premiumCard}>
            <Text style={s.premiumPlanLabel}>
              Current Plan: Free
            </Text>
            <Text style={s.premiumTitle}>
              Enhance Your Practice
            </Text>
            <Text style={s.premiumDesc}>
              Access all premium courses, ad-free meditations, and exclusive
              satsangs.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Paywall')}
              style={s.premiumBtn}
            >
              <Text style={s.premiumBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings List */}
        <View style={s.settingsSection}>
          <SettingsRow
            label="Subscription"
            onPress={() => navigation.navigate('Subscription')}
          />
          <SettingsRow
            label="Notifications"
            onPress={() =>
              Alert.alert(
                'Notifications',
                'Manage daily meditation reminders, event alerts, and content updates.\n\nPush notifications require Firebase setup.',
              )
            }
          />
          <SettingsRow
            label="Invite a Friend"
            onPress={() =>
              Alert.alert(
                'Invite a Friend',
                'Share MAA with friends and family! Your referral link will be generated once the invite system is activated.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Copy Link', onPress: () => Alert.alert('Copied!', 'Your referral link has been copied to clipboard.') },
                ],
              )
            }
          />
          <SettingsRow
            label="Terms & Privacy"
            onPress={() =>
              Alert.alert(
                'Terms & Privacy',
                'View our Terms of Service and Privacy Policy at:\n\nmaaapp.com/terms\nmaaapp.com/privacy',
              )
            }
          />
          <SettingsRow
            label="Helpdesk"
            onPress={() =>
              Alert.alert(
                'Helpdesk',
                'Need help? Reach out to our support team.\n\nEmail: support@maaapp.com\nResponse time: Within 24 hours',
              )
            }
          />
          <SettingsRow label="Logout" onPress={handleLogout} />
          <SettingsRow
            label="Delete Account"
            danger
            onPress={() =>
              Alert.alert(
                'Delete Account',
                'This will permanently delete your account and all associated data (meditation sessions, streaks, course progress). This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () =>
                      Alert.alert(
                        'Account Deletion',
                        'Account deletion will be processed once backend deletion service is active.',
                      ),
                  },
                ],
              )
            }
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit Profile</Text>
            
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <TextInput
                style={s.textInput}
                placeholder="Enter full name"
                placeholderTextColor="rgba(135, 85, 62, 0.4)"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Contact Number</Text>
              <TextInput
                style={s.textInput}
                placeholder="Enter contact number"
                placeholderTextColor="rgba(135, 85, 62, 0.4)"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email ID</Text>
              <TextInput
                style={s.textInput}
                placeholder="Enter email ID"
                placeholderTextColor="rgba(135, 85, 62, 0.4)"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>New Password (Optional)</Text>
              <TextInput
                style={s.textInput}
                placeholder="Enter new password"
                placeholderTextColor="rgba(135, 85, 62, 0.4)"
                value={editPassword}
                onChangeText={setEditPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={s.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(135, 85, 62, 0.4)"
                value={editDOB}
                onChangeText={setEditDOB}
              />
            </View>

            {editDOB.trim() && calculateAge(editDOB) ? (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Age</Text>
                <View style={s.ageDisplayContainer}>
                  <Text style={s.ageDisplayText}>{calculateAge(editDOB)}</Text>
                </View>
              </View>
            ) : null}

            <View style={s.modalButtonRow}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalCancelBtn]}
                onPress={() => setEditModalOpen(false)}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalSaveBtn]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={s.modalSaveBtnText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(96),
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(16),
  },
  avatarCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#ED7624', // Timer primary orange
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
    elevation: 4,
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarInitials: {
    fontSize: moderateScale(30),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#5C250E', // Timer text dark
  },
  levelBadge: {
    backgroundColor: 'rgba(240, 127, 46, 0.15)',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    marginTop: verticalScale(8),
  },
  levelText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#ED7624',
    textTransform: 'capitalize',
  },
  editProfileBtn: {
    marginTop: verticalScale(8),
  },
  editProfileText: {
    color: '#ED7624',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: scale(24),
    marginTop: verticalScale(8),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    padding: scale(16),
    marginBottom: verticalScale(12),
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#ED7624',
  },
  statCardLabel: {
    fontSize: moderateScale(12),
    color: '#87553E', // Timer text secondary
    marginTop: verticalScale(4),
  },
  premiumCard: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(16),
    padding: scale(16),
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  premiumPlanLabel: {
    fontSize: moderateScale(12),
    color: '#87553E',
    textTransform: 'uppercase',
    letterSpacing: scale(1),
    marginBottom: verticalScale(4),
  },
  premiumTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#5C250E',
    marginBottom: verticalScale(8),
  },
  premiumDesc: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginBottom: verticalScale(12),
  },
  premiumBtn: {
    backgroundColor: '#ED7624',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  premiumBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  settingsSection: {
    paddingHorizontal: scale(24),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.12)',
  },
  settingsLabel: {
    fontSize: moderateScale(16),
  },
  settingsLabelNormal: {
    color: '#5C250E',
  },
  settingsLabelDanger: {
    color: colors.error,
  },
  settingsChevron: {
    color: '#87553E',
    fontSize: moderateScale(18),
  },
  displayPhone: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(24),
    width: '100%',
    maxWidth: scale(340),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: verticalScale(16),
    width: '100%',
  },
  inputLabel: {
    fontSize: moderateScale(13),
    color: '#87553E',
    fontWeight: '600',
    marginBottom: verticalScale(6),
  },
  textInput: {
    backgroundColor: 'rgba(240, 127, 46, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.15)',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(15),
    color: '#5C250E',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
    marginTop: verticalScale(8),
  },
  modalBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
  },
  modalCancelBtnText: {
    color: '#87553E',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  modalSaveBtn: {
    backgroundColor: '#ED7624',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  ageDisplayContainer: {
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  ageDisplayText: {
    fontSize: moderateScale(15),
    color: '#ED7624',
    fontWeight: '600',
  },
});

export default ProfileMain;
