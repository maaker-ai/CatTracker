import { useRef } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Syringe,
  Bug,
  Stethoscope,
  FileText,
  Cat,
  ChevronRight,
  CircleCheck,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { restorePurchases } from '@/utils/purchases';
import { exportPdfReport } from '@/utils/exportPdf';

const REMINDER_ICONS: Record<string, { Icon: typeof Syringe; bg: string; color: string }> = {
  vaccine: { Icon: Syringe, bg: Colors.accentLight, color: Colors.accent },
  deworming: { Icon: Bug, bg: Colors.successLight, color: Colors.success },
  checkup: { Icon: Stethoscope, bg: Colors.infoLight, color: Colors.info },
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reminders, toggleReminder, isPro, activeCatId } = useAppStore();
  const exportingRef = useRef(false);

  const handleRestore = async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? t('settings.restored') : t('settings.noPurchasesFound'),
      restored
        ? t('settings.restoredMessage')
        : t('settings.noPurchasesMessage')
    );
  };

  const handleExportPdf = async () => {
    if (exportingRef.current) return;
    exportingRef.current = true;
    try {
      if (!activeCatId) return;
      await exportPdfReport(activeCatId, t);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), msg);
    } finally {
      exportingRef.current = false;
    }
  };

  const handleProFeaturePress = (action?: () => void) => {
    if (isPro) {
      action?.();
    } else {
      router.push('/paywall');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 22,
            color: Colors.textPrimary,
          }}
        >
          {t('settings.title')}
        </Text>

        {/* Reminders Section */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 11,
              color: Colors.textTertiary,
              letterSpacing: 0.8,
            }}
          >
            {t('settings.reminders')}
          </Text>
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 18,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {reminders.map((reminder, index) => {
              const config = REMINDER_ICONS[reminder.id] ?? REMINDER_ICONS.vaccine;
              return (
                <View
                  key={reminder.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: index < reminders.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.divider,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: config.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <config.Icon size={18} color={config.color} />
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: 'Inter-Medium',
                          fontSize: 14,
                          color: Colors.textPrimary,
                        }}
                      >
                        {t(`reminders.${reminder.id}`, { defaultValue: reminder.title })}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inter-Regular',
                          fontSize: 12,
                          color: Colors.textTertiary,
                        }}
                      >
                        {reminder.date}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleReminder(reminder.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Switch
                      value={reminder.enabled}
                      onValueChange={() => toggleReminder(reminder.id)}
                      trackColor={{ false: Colors.toggleOff, true: Colors.accent }}
                      thumbColor="#FFFFFF"
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pro Features Section */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 11,
              color: Colors.textTertiary,
              letterSpacing: 0.8,
            }}
          >
            {t('settings.proFeatures')}
          </Text>
          {!isPro && (
            <Pressable
              onPress={() => router.push('/paywall')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.accent,
                borderRadius: 18,
                paddingVertical: 16,
                paddingHorizontal: 20,
                shadowColor: Colors.accent,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text
                  style={{
                    fontFamily: 'Inter-Bold',
                    fontSize: 16,
                    color: '#FFFFFF',
                  }}
                >
                  {t('settings.upgradeToPro')}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {t('settings.unlockAllFeatures')}
                </Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          )}
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 18,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Pressable
              onPress={() => handleProFeaturePress(handleExportPdf)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.accentLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color={Colors.accent} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: Colors.textPrimary,
                  }}
                >
                  {t('settings.exportPdfReport')}
                </Text>
              </View>
              {isPro ? (
                <View
                  style={{
                    backgroundColor: Colors.successLight,
                    borderRadius: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CircleCheck size={12} color={Colors.success} />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 10,
                      color: Colors.success,
                    }}
                  >
                    {t('settings.proActive')}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: Colors.accent,
                    borderRadius: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 10,
                      color: '#FFFFFF',
                    }}
                  >
                    {t('settings.pro')}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => handleProFeaturePress()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.infoLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cat size={18} color={Colors.info} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: Colors.textPrimary,
                  }}
                >
                  {t('settings.addMoreCats')}
                </Text>
              </View>
              {isPro ? (
                <View
                  style={{
                    backgroundColor: Colors.successLight,
                    borderRadius: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CircleCheck size={12} color={Colors.success} />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 10,
                      color: Colors.success,
                    }}
                  >
                    {t('settings.proActive')}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: Colors.accent,
                    borderRadius: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 10,
                      color: '#FFFFFF',
                    }}
                  >
                    {t('settings.pro')}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* More Section */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 11,
              color: Colors.textTertiary,
              letterSpacing: 0.8,
            }}
          >
            {t('settings.more')}
          </Text>
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 18,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Pressable
              onPress={handleRestore}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textPrimary,
                }}
              >
                {t('settings.restorePurchase')}
              </Text>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/privacy-policy')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textPrimary,
                }}
              >
                {t('settings.privacyPolicy')}
              </Text>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </Pressable>
            <View
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textTertiary,
                }}
              >
                {t('common.version', { version: '1.0.0' })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
