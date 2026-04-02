import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Footprints, Heart, Droplets, Zap, Plus, Sun, Cat as CatIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { getTodayLog, getCatById, getLogs } from '@/utils/database';
import type { Cat, DailyLog, HydrationLevel, ActivityLevel } from '@/types';

const HYDRATION_I18N: Record<HydrationLevel, string> = {
  Low: 'log.hydrationLow',
  Normal: 'log.hydrationNormal',
  High: 'log.hydrationHigh',
};

const ACTIVITY_I18N: Record<ActivityLevel, string> = {
  Calm: 'log.activityCalm',
  Normal: 'log.activityNormal',
  Active: 'log.activityActive',
  Hyper: 'log.activityHyper',
};

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [cat, setCat] = useState<Cat | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  const loadData = useCallback(async () => {
    if (!activeCatId) return;
    const c = await getCatById(activeCatId);
    setCat(c);
    const log = await getTodayLog(activeCatId);
    setTodayLog(log);
    const logs = await getLogs(activeCatId, 5);
    setRecentLogs(logs);
  }, [activeCatId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const catName = cat?.name ?? t('common.loading');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CatIcon size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 13,
                  color: Colors.textSecondary,
                }}
              >
                {t('dashboard.goodMorning')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 18,
                  color: Colors.textPrimary,
                }}
              >
                {catName}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: Colors.accent,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Sun size={14} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 12,
                color: '#FFFFFF',
              }}
            >
              {t('common.today')}
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <Text
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 16,
            color: Colors.textPrimary,
            marginBottom: 16,
          }}
        >
          {t('dashboard.todaysHealthLog')}
        </Text>

        {/* Stats Cards Grid */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {/* Row 1 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard
              icon={<Footprints size={24} color={Colors.accent} />}
              value={todayLog ? String(todayLog.litterVisits) : '--'}
              label={t('dashboard.litterVisits')}
              bg={Colors.card}
            />
            <StatCard
              icon={<Heart size={24} color={Colors.accent} />}
              value={todayLog ? `${todayLog.appetite}/5` : '--'}
              label={t('dashboard.appetite')}
              bg={Colors.accentLight}
            />
          </View>
          {/* Row 2 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard
              icon={<Droplets size={24} color={Colors.info} />}
              value={todayLog ? t(HYDRATION_I18N[todayLog.hydration]) : '--'}
              label={t('dashboard.hydration')}
              bg={Colors.infoLight}
              smallValue
            />
            <StatCard
              icon={<Zap size={24} color={Colors.success} />}
              value={todayLog ? t(ACTIVITY_I18N[todayLog.activity]) : '--'}
              label={t('dashboard.activity')}
              bg={Colors.successLight}
              smallValue
            />
          </View>
        </View>

        {/* Recent Notes */}
        <Text
          style={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 14,
            color: Colors.textPrimary,
            marginBottom: 10,
          }}
        >
          {t('dashboard.recentNotes')}
        </Text>

        {recentLogs.filter((l) => l.notes).length > 0 ? (
          recentLogs
            .filter((l) => l.notes)
            .slice(0, 3)
            .map((log) => (
              <View
                key={log.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.card,
                  borderRadius: 16,
                  padding: 14,
                  gap: 12,
                  marginBottom: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.accent,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    color: Colors.textPrimary,
                  }}
                >
                  {log.notes}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 11,
                    color: Colors.textTertiary,
                  }}
                >
                  {log.time}
                </Text>
              </View>
            ))
        ) : (
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 16,
              padding: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 13,
                color: Colors.textTertiary,
                textAlign: 'center',
              }}
            >
              {t('dashboard.noNotesYet')}
            </Text>
          </View>
        )}

        {/* FAB */}
        <Pressable
          onPress={() => router.push('/log')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors.accent,
            borderRadius: 32,
            paddingVertical: 14,
            paddingHorizontal: 24,
            gap: 8,
            marginTop: 20,
            alignSelf: 'flex-start',
            shadowColor: Colors.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 15,
              color: '#FFFFFF',
            }}
          >
            {t('dashboard.logToday')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  bg,
  smallValue,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  bg: string;
  smallValue?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 18,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: smallValue ? 22 : 28,
          color: Colors.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-Regular',
          fontSize: 11,
          color: Colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
