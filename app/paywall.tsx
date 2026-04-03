import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  X,
  Cat,
  FileText,
  TrendingUp,
  Bell,
  PawPrint,
  CircleCheck,
  CircleHelp,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '@/utils/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

type PlanType = 'yearly' | 'monthly';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const purchasingRef = useRef(false);

  const FEATURES = [
    {
      Icon: Cat,
      iconBg: Colors.accentLight,
      iconColor: Colors.accent,
      title: t('paywall.multiCatSupport'),
      desc: t('paywall.multiCatDesc'),
      check: true,
    },
    {
      Icon: FileText,
      iconBg: Colors.successLight,
      iconColor: Colors.success,
      title: t('paywall.pdfVetReports'),
      desc: t('paywall.pdfVetDesc'),
      check: true,
    },
    {
      Icon: TrendingUp,
      iconBg: Colors.infoLight,
      iconColor: Colors.info,
      title: t('paywall.advancedCharts'),
      desc: t('paywall.advancedChartsDesc'),
      check: true,
    },
    {
      Icon: Bell,
      iconBg: Colors.warningLight,
      iconColor: Colors.warning,
      title: t('paywall.customReminders'),
      desc: t('paywall.customRemindersDesc'),
      check: true,
    },
  ];

  useEffect(() => {
    getOfferings().then((pkgs) => {
      setPackages(pkgs);
      // TEMP: diagnostic - remove after debugging
      if (__DEV__ || pkgs.length === 0) {
        const info = pkgs.map(p => `${p.identifier}: ${p.product?.priceString ?? 'no price'}`).join('\n') || 'No packages returned';
        Alert.alert('Offerings Debug', info);
      }
    });
  }, []);

  const handlePurchase = async () => {
    if (purchasingRef.current) return;
    purchasingRef.current = true;

    const targetId = selectedPlan === 'yearly' ? '$rc_annual' : '$rc_monthly';
    const pkg = packages.find((p) => p.identifier === targetId);

    if (!pkg) {
      Alert.alert(t('common.error'), t('paywall.packageNotAvailable'));
      purchasingRef.current = false;
      return;
    }

    const result = await purchasePackage(pkg);
    purchasingRef.current = false;

    if (result.status === 'success') {
      router.back();
    } else if (result.status === 'error') {
      Alert.alert(t('paywall.purchaseFailed'), result.message);
    }
    // cancelled: do nothing
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert(t('paywall.restored'), t('paywall.restoredMessage'));
      router.back();
    } else {
      Alert.alert(t('paywall.noPurchasesFound'), t('paywall.noPurchasesMessage'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: Colors.inputBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={{ alignItems: 'center', paddingVertical: 16, gap: 12 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: Colors.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <PawPrint size={36} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 26,
              color: Colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {t('paywall.title')}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 14,
              color: Colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 20,
            }}
          >
            {t('paywall.subtitle')}
          </Text>
        </View>

        {/* Features Card */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {FEATURES.map((feat, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.divider,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: feat.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <feat.Icon size={18} color={feat.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter-SemiBold',
                      fontSize: 14,
                      color: Colors.textPrimary,
                    }}
                  >
                    {feat.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Regular',
                      fontSize: 12,
                      color: Colors.textSecondary,
                    }}
                  >
                    {feat.desc}
                  </Text>
                </View>
                {feat.check ? (
                  <CircleCheck size={20} color={Colors.success} />
                ) : (
                  <CircleHelp size={20} color={Colors.accent} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
          {/* Yearly */}
          <Pressable
            onPress={() => setSelectedPlan('yearly')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: selectedPlan === 'yearly' ? Colors.accent : Colors.card,
              borderRadius: 18,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderWidth: selectedPlan === 'yearly' ? 0 : 2,
              borderColor: Colors.border,
              shadowColor: selectedPlan === 'yearly' ? Colors.accent : 'transparent',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: selectedPlan === 'yearly' ? 0.25 : 0,
              shadowRadius: 20,
              elevation: selectedPlan === 'yearly' ? 6 : 0,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 16,
                  color: selectedPlan === 'yearly' ? '#FFFFFF' : Colors.textPrimary,
                }}
              >
                {t('paywall.yearly')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 13,
                  color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : Colors.textSecondary,
                }}
              >
                {t('paywall.yearlyPrice')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View
                style={{
                  backgroundColor: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.25)' : Colors.accentLight,
                  borderRadius: 8,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-Bold',
                    fontSize: 10,
                    color: selectedPlan === 'yearly' ? '#FFFFFF' : Colors.accent,
                  }}
                >
                  {t('paywall.bestValue')}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : Colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {t('paywall.savePercent')}
              </Text>
            </View>
          </Pressable>

          {/* Monthly */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: selectedPlan === 'monthly' ? Colors.accent : Colors.card,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderWidth: selectedPlan === 'monthly' ? 0 : 2,
              borderColor: Colors.border,
              shadowColor: selectedPlan === 'monthly' ? Colors.accent : 'transparent',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: selectedPlan === 'monthly' ? 0.25 : 0,
              shadowRadius: 20,
              elevation: selectedPlan === 'monthly' ? 6 : 0,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 16,
                  color: selectedPlan === 'monthly' ? '#FFFFFF' : Colors.textPrimary,
                }}
              >
                {t('paywall.monthly')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 13,
                  color: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.8)' : Colors.textSecondary,
                }}
              >
                {t('paywall.monthlyPrice')}
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedPlan === 'monthly' ? '#FFFFFF' : Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedPlan === 'monthly' && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10, alignItems: 'center' }}>
          <Pressable
            onPress={handlePurchase}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 20,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              shadowColor: Colors.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              {t('paywall.upgradeToPro')}
            </Text>
          </Pressable>
          <Pressable onPress={handleRestore}>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 13,
                color: Colors.textTertiary,
                textAlign: 'center',
              }}
            >
              {t('paywall.restorePurchase')}
            </Text>
          </Pressable>
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 11,
              color: Colors.subtle,
              textAlign: 'center',
            }}
          >
            {t('paywall.cancelAnytime')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
