/**
 * File: SubscriptionScreen.tsx
 *
 * Description: Subscription management screen displaying current plan status,
 * upgrade CTA, billing history, and cancel subscription controls.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSubscription } from '../hooks/useSubscription';
import { subscriptionService } from '../services/subscription.service';
import {
  paymentService,
  PaymentRecord,
} from '../services/payment.service';
import { ProfileStackParamList } from '../navigation/types';

type SubscriptionNavProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Subscription'
>;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (amountInPaise: number, currency: string): string => {
  const amount = amountInPaise / 100;
  if (currency === 'INR') {
    return `\u20B9${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const isSuccess = status === 'captured' || status === 'active';
  const isPending = status === 'pending';

  return (
    <View
      style={[
        s.statusBadge,
        isSuccess
          ? s.statusBadgeSuccess
          : isPending
            ? s.statusBadgePending
            : s.statusBadgeError,
      ]}
    >
      <Text
        style={[
          s.statusBadgeText,
          isSuccess
            ? s.statusBadgeTextSuccess
            : isPending
              ? s.statusBadgeTextPending
              : s.statusBadgeTextError,
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const PlanBadge = ({ planType }: { planType: string }) => (
  <View
    style={[
      s.planBadge,
      planType === 'free' ? s.planBadgeFree : s.planBadgePremium,
    ]}
  >
    <Text
      style={[
        s.planBadgeText,
        planType === 'free' ? s.planBadgeTextFree : s.planBadgeTextPremium,
      ]}
    >
      {planType === 'free' ? 'Free Plan' : `${planType} Premium`}
    </Text>
  </View>
);

const SubscriptionScreen = () => {
  const navigation = useNavigation<SubscriptionNavProp>();
  const { isPremium, planType, expiresAt, isLoading, refresh } =
    useSubscription();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const history = await paymentService.getPaymentHistory();
      setPayments(history);
    } catch {
      // Silently fail
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await subscriptionService.cancelSubscription();
              await refresh();
            } catch (err: unknown) {
              const message =
                err instanceof Error
                  ? err.message
                  : 'Failed to cancel subscription.';
              Alert.alert('Error', message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const renderPaymentItem = ({ item }: { item: PaymentRecord }) => (
    <View style={s.paymentRow}>
      <View style={s.paymentRowLeft}>
        <Text style={s.paymentPlanLabel}>
          {item.plan_type} Plan
        </Text>
        <Text style={s.paymentDate}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <View style={s.paymentRowRight}>
        <Text style={s.paymentAmount}>
          {formatAmount(item.amount, item.currency)}
        </Text>
        <View style={s.paymentStatusWrap}>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#ED7624" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView style={s.flex1} showsVerticalScrollIndicator={false}>
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
          <Text style={s.headerTitle}>
            Subscription
          </Text>
          <View style={s.flex1} />
        </View>

        {/* Current Plan */}
        <View style={s.planCard}>
          <Text style={s.planCardLabel}>
            Current Plan
          </Text>
          <View style={s.planCardBadgeRow}>
            <PlanBadge planType={planType} />
          </View>

          {isPremium && expiresAt && (
            <View style={s.expirySection}>
              <View style={s.expiryRow}>
                <Text style={s.expiryLabel}>Expires</Text>
                <Text style={s.expiryValue}>
                  {formatDate(expiresAt)}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={s.planActionsWrap}>
            {isPremium ? (
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelling}
                style={s.cancelButton}
              >
                {cancelling ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <Text style={s.cancelButtonText}>
                    Cancel Subscription
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('Paywall')}
                style={s.upgradeButton}
              >
                <Text style={s.upgradeButtonText}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Billing History */}
        <View style={s.billingSection}>
          <Text style={s.billingSectionTitle}>
            Billing History
          </Text>
          <View style={s.billingCard}>
            {paymentsLoading ? (
              <View style={s.billingEmpty}>
                <ActivityIndicator color="#ED7624" />
              </View>
            ) : payments.length === 0 ? (
              <View style={s.billingEmpty}>
                <Text style={s.billingEmptyText}>
                  No billing history yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={payments}
                keyExtractor={(item) => item.id}
                renderItem={renderPaymentItem}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  flex1: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#5C250E',
    marginLeft: scale(12),
  },
  planCard: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(24),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    padding: scale(20),
  },
  planCardLabel: {
    fontSize: moderateScale(12),
    color: '#87553E',
    textTransform: 'uppercase',
    letterSpacing: scale(1),
    marginBottom: verticalScale(12),
  },
  planCardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBadge: {
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  planBadgeFree: {
    backgroundColor: 'rgba(240, 127, 46, 0.08)',
  },
  planBadgePremium: {
    backgroundColor: 'rgba(240, 127, 46, 0.15)',
  },
  planBadgeText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  planBadgeTextFree: {
    color: '#87553E',
  },
  planBadgeTextPremium: {
    color: '#ED7624',
  },
  expirySection: {
    marginTop: verticalScale(16),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 127, 46, 0.12)',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiryLabel: {
    fontSize: moderateScale(14),
    color: '#87553E',
  },
  expiryValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#5C250E',
  },
  planActionsWrap: {
    marginTop: verticalScale(16),
  },
  cancelButton: {
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  upgradeButton: {
    backgroundColor: '#ED7624',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  billingSection: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  billingSectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(12),
  },
  billingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    paddingHorizontal: scale(16),
  },
  billingEmpty: {
    paddingVertical: verticalScale(32),
    alignItems: 'center',
  },
  billingEmptyText: {
    fontSize: moderateScale(14),
    color: '#87553E',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.12)',
  },
  paymentRowLeft: {
    flex: 1,
    marginRight: scale(12),
  },
  paymentPlanLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#5C250E',
    textTransform: 'capitalize',
  },
  paymentDate: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  paymentRowRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#5C250E',
  },
  paymentStatusWrap: {
    marginTop: verticalScale(4),
  },
  statusBadge: {
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(240, 127, 46, 0.12)',
  },
  statusBadgePending: {
    backgroundColor: '#FEF9C3',
  },
  statusBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadgeTextSuccess: {
    color: '#ED7624',
  },
  statusBadgeTextPending: {
    color: '#A16207',
  },
  statusBadgeTextError: {
    color: '#DC2626',
  },
});
