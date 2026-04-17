import { useRef } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed,
  Droplets,
  FileText,
  ChevronRight,
  Star,
  MessageCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { exportPdfReport } from '@/utils/exportPdf';
import {
  requestNotificationPermission,
  cancelReminder,
} from '@/utils/notifications';

const REMINDER_ICONS: Record<string, { Icon: typeof UtensilsCrossed; bg: string; color: string }> = {
  feeding: { Icon: UtensilsCrossed, bg: Colors.accentLight, color: Colors.accent },
  waterChange: { Icon: Droplets, bg: Colors.successLight, color: Colors.success },
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reminders, toggleReminder, activeCatId } = useAppStore();
  const exportingRef = useRef(false);

  const handleToggleReminder = async (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    if (!reminder.enabled) {
      // Turning ON — request permission first
      const granted = await requestNotificationPermission();
      if (!granted) return; // permission denied, don't toggle
      toggleReminder(reminderId);
    } else {
      // Turning OFF — cancel notification
      toggleReminder(reminderId);
      await cancelReminder(reminderId);
    }
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

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/id6761513507?action=write-review');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@maaker.ai');
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
              const config = REMINDER_ICONS[reminder.id] ?? REMINDER_ICONS.feeding;
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
                    <Text
                      style={{
                        fontFamily: 'Inter-Medium',
                        fontSize: 14,
                        color: Colors.textPrimary,
                      }}
                    >
                      {t(`reminders.${reminder.id}`, { defaultValue: reminder.title })}
                    </Text>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => handleToggleReminder(reminder.id)}
                    trackColor={{ false: Colors.toggleOff, true: Colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Tools Section */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 11,
              color: Colors.textTertiary,
              letterSpacing: 0.8,
            }}
          >
            {t('settings.tools')}
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
              onPress={handleExportPdf}
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
              <ChevronRight size={16} color={Colors.textTertiary} />
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
              onPress={handleRateApp}
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
                  <Star size={18} color={Colors.accent} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: Colors.textPrimary,
                  }}
                >
                  {t('settings.rateApp')}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              onPress={handleContactSupport}
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
                    backgroundColor: Colors.infoLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageCircle size={18} color={Colors.info} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: Colors.textPrimary,
                  }}
                >
                  {t('settings.contactSupport')}
                </Text>
              </View>
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
