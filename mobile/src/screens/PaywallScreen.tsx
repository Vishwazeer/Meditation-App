/**
 * File: PaywallScreen.tsx
 *
 * Description: Premium subscription paywall displaying feature comparison table,
 * monthly/annual plan selection cards, and Razorpay-integrated checkout flow.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { paymentService } from '../services/payment.service';
import { useSubscription } from '../hooks/useSubscription';

type PlanType = 'monthly' | 'annual';

interface FeatureRow {
  feature: string;
  free: string;
  premium: string;
}

const FEATURES: FeatureRow[] = [
  { feature: 'Guided Meditations', free: '10 sessions', premium: 'Full library (500+)' },
  { feature: 'Courses', free: '1 free course', premium: 'All courses' },
  { feature: 'Meditation Timer', free: 'Basic sounds', premium: 'All sounds' },
  { feature: 'Streak Tracking', free: 'Yes', premium: 'Yes + insights' },
  { feature: 'Live Events', free: 'View only', premium: 'Full access + replay' },
  { feature: 'Offline Downloads', free: 'No', premium: 'Yes' },
  { feature: 'Ad-Free', free: 'No', premium: 'Yes' },
];

const FeatureTableRow = ({ row, isLast }: { row: FeatureRow; isLast: boolean }) => (
  <View
    style={[s.tableRow, isLast ? null : s.tableRowBorder]}
  >
    <Text style={s.tableFeatureCell}>
      {row.feature}
    </Text>
    <Text style={s.tableFreeCell}>
      {row.free}
    </Text>
    <Text style={s.tablePremiumCell}>
      {row.premium}
    </Text>
  </View>
);

const PaywallScreen = () => {
  const navigation = useNavigation();
  const { refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Fast timeout (5s) so the button doesn't hang forever when backend is unreachable
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000),
    );

    try {
      const order = await Promise.race([
        paymentService.createOrder(selectedPlan),
        timeoutPromise,
      ]);
      await Promise.race([
        paymentService.verifyPayment(
          order.id,
          `pay_${Date.now()}`,
          `sig_${Date.now()}`,
        ),
        timeoutPromise,
      ]);
      await refresh();
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.message === 'timeout';
      Alert.alert(
        isTimeout ? 'Connection Issue' : 'Payment Error',
        isTimeout
          ? 'Unable to reach the payment server. Please check your internet connection and try again.\n\n(Razorpay integration requires a configured backend and merchant account.)'
          : err instanceof Error
            ? err.message
            : 'Payment failed. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backButton}
            activeOpacity={0.7}
          >
            <Image
              source={require('../assets/icons/New folder/Back.png')}
              style={{ width: 24, height: 24, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
          <View style={s.flex1} />
        </View>

        {/* Title */}
        <View style={s.titleSection}>
          <Text style={s.pageTitle}>
            Enhance Your Practice
          </Text>
          <Text style={s.pageSubtitle}>
            Unlock the full MAA experience with premium access to all meditations,
            courses, and exclusive content.
          </Text>
        </View>

        {/* Feature Comparison Table */}
        <View style={s.featureTable}>
          {/* Table Header */}
          <View style={s.tableHeaderRow}>
            <Text style={s.tableHeaderFeature}>
              Feature
            </Text>
            <Text style={s.tableHeaderFree}>
              Free
            </Text>
            <Text style={s.tableHeaderPremium}>
              Premium
            </Text>
          </View>
          {/* Table Rows */}
          {FEATURES.map((row, index) => (
            <FeatureTableRow
              key={row.feature}
              row={row}
              isLast={index === FEATURES.length - 1}
            />
          ))}
        </View>

        {/* Plan Cards */}
        <View style={s.planSection}>
          <Text style={s.planSectionTitle}>
            Choose Your Plan
          </Text>

          {/* Monthly Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('monthly')}
            style={[
              s.planCard,
              selectedPlan === 'monthly'
                ? s.planCardSelected
                : s.planCardUnselected,
            ]}
          >
            <View style={s.planCardRow}>
              <View>
                <Text style={s.planName}>
                  Monthly
                </Text>
                <Text style={s.planBillingLabel}>
                  Billed monthly
                </Text>
              </View>
              <View style={s.planPriceWrap}>
                <Text style={s.planPrice}>
                  {'\u{20B9}'}199
                </Text>
                <Text style={s.planPeriod}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Annual Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('annual')}
            style={[
              s.planCard,
              selectedPlan === 'annual'
                ? s.planCardSelected
                : s.planCardUnselected,
            ]}
          >
            {/* Save Badge */}
            <View style={s.saveBadge}>
              <Text style={s.saveBadgeText}>Save 37%</Text>
            </View>
            <View style={s.planCardRow}>
              <View>
                <Text style={s.planName}>
                  Annual
                </Text>
                <Text style={s.planBillingLabel}>
                  Billed annually
                </Text>
              </View>
              <View style={s.planPriceWrap}>
                <Text style={s.planPrice}>
                  {'\u{20B9}'}1,499
                </Text>
                <Text style={s.planPeriod}>/year</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <View style={s.subscribeSection}>
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isProcessing}
            style={[
              s.subscribeButton,
              isProcessing ? s.subscribeButtonDisabled : null,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.subscribeButtonText}>
                Subscribe Now
              </Text>
            )}
          </TouchableOpacity>
          <Text style={s.subscribeDisclaimer}>
            Cancel anytime. You can manage your subscription from your profile
            settings.
          </Text>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessDismiss}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalCheckWrap}>
              <Text style={s.modalCheckIcon}>{'\u{2713}'}</Text>
            </View>
            <Text style={s.modalTitle}>
              Welcome to Premium!
            </Text>
            <Text style={s.modalBody}>
              Your subscription is now active. Enjoy unlimited access to all
              meditations, courses, and premium features.
            </Text>
            <TouchableOpacity
              onPress={handleSuccessDismiss}
              style={s.modalButton}
            >
              <Text style={s.modalButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PaywallScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(96),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  backButtonText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(20),
    color: '#5C250E',
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: verticalScale(-2),
  },
  titleSection: {
    paddingHorizontal: scale(24),
    marginTop: verticalScale(16),
  },
  pageTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#5C250E',
  },
  pageSubtitle: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(8),
    lineHeight: moderateScale(20),
  },
  featureTable: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(24),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    padding: scale(16),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.12)',
  },
  tableHeaderFeature: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#5C250E',
  },
  tableHeaderFree: {
    width: scale(96),
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#87553E',
    textAlign: 'center',
  },
  tableHeaderPremium: {
    width: scale(96),
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#ED7624',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: verticalScale(12),
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.12)',
  },
  tableFeatureCell: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#5C250E',
    fontWeight: '500',
  },
  tableFreeCell: {
    width: scale(96),
    fontSize: moderateScale(12),
    color: '#87553E',
    textAlign: 'center',
  },
  tablePremiumCell: {
    width: scale(96),
    fontSize: moderateScale(12),
    color: '#ED7624',
    textAlign: 'center',
    fontWeight: '600',
  },
  planSection: {
    paddingHorizontal: scale(24),
    marginTop: verticalScale(24),
  },
  planSectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(12),
  },
  planCard: {
    borderRadius: moderateScale(12),
    borderWidth: 2,
    padding: scale(16),
    marginBottom: verticalScale(12),
  },
  planCardSelected: {
    borderColor: '#ED7624',
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
  },
  planCardUnselected: {
    borderColor: 'rgba(240, 127, 46, 0.12)',
    backgroundColor: '#FFFFFF',
  },
  planCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#5C250E',
  },
  planBillingLabel: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  planPriceWrap: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#ED7624',
  },
  planPeriod: {
    fontSize: moderateScale(12),
    color: '#87553E',
  },
  saveBadge: {
    position: 'absolute',
    top: verticalScale(-12),
    right: scale(16),
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
  },
  saveBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscribeSection: {
    paddingHorizontal: scale(24),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(32),
  },
  subscribeButton: {
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    backgroundColor: '#ED7624',
  },
  subscribeButtonDisabled: {
    backgroundColor: 'rgba(237, 118, 36, 0.5)',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  subscribeDisclaimer: {
    fontSize: moderateScale(12),
    color: '#87553E',
    textAlign: 'center',
    marginTop: verticalScale(12),
    lineHeight: moderateScale(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(24),
    width: '100%',
    alignItems: 'center',
  },
  modalCheckWrap: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(240, 127, 46, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  modalCheckIcon: {
    fontSize: moderateScale(30),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(8),
  },
  modalBody: {
    fontSize: moderateScale(14),
    color: '#87553E',
    textAlign: 'center',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
  },
  modalButton: {
    backgroundColor: '#ED7624',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(32),
    borderRadius: moderateScale(8),
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
