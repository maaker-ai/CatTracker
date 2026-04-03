import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Footprints, Heart, Droplets, AlertTriangle, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { getLogs, getQuickLogHistory, getQuickLogCount, getQuickLogAverage } from '@/utils/database';
import type { DailyLog } from '@/types';

type StatusLabel = 'normal' | 'belowAvg' | 'aboveAvg';

function getStatusLabel(count: number, avg: number): StatusLabel {
  if (avg === 0) return 'normal';
  if (count < avg * 0.7) return 'belowAvg';
  if (count > avg * 1.3) return 'aboveAvg';
  return 'normal';
}

const STATUS_I18N: Record<StatusLabel, string> = {
  normal: 'dashboard.normal',
  belowAvg: 'dashboard.belowAvg',
  aboveAvg: 'dashboard.aboveAvg',
};

export default function TimelineScreen() {
  const { t } = useTranslation();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [visitHistory, setVisitHistory] = useState<{ date: string; count: number }[]>([]);
  const [avgVisits, setAvgVisits] = useState(0);
  // Per-date quick log counts
  const [dateQuickLogs, setDateQuickLogs] = useState<Record<string, { bathroom: number; water: number; bathroomAvg: number; waterAvg: number }>>({});

  useFocusEffect(
    useCallback(() => {
      if (!activeCatId) return;
      getLogs(activeCatId, 30).then(setLogs);
      getQuickLogHistory(activeCatId, 'bathroom', 7).then(setVisitHistory);
      getQuickLogAverage(activeCatId, 'bathroom', 7).then(setAvgVisits);
    }, [activeCatId])
  );

  // Load quick log counts for each unique date in logs
  useFocusEffect(
    useCallback(() => {
      if (!activeCatId || logs.length === 0) return;
      const dates = [...new Set(logs.map((l) => l.date))];
      Promise.all(
        dates.map(async (date) => {
          const bc = await getQuickLogCount(activeCatId, 'bathroom', date);
          const wc = await getQuickLogCount(activeCatId, 'water', date);
          const ba = await getQuickLogAverage(activeCatId, 'bathroom', 7);
          const wa = await getQuickLogAverage(activeCatId, 'water', 7);
          return { date, bathroom: bc, water: wc, bathroomAvg: ba, waterAvg: wa };
        })
      ).then((results) => {
        const map: typeof dateQuickLogs = {};
        for (const r of results) {
          map[r.date] = { bathroom: r.bathroom, water: r.water, bathroomAvg: r.bathroomAvg, waterAvg: r.waterAvg };
        }
        setDateQuickLogs(map);
      });
    }, [activeCatId, logs])
  );

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, DailyLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  const maxVisits = visitHistory.length > 0 ? Math.max(...visitHistory.map((h) => h.count), 1) : 1;

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const formatted = `${month} ${day}`;
    if (dateStr === today) return t('timeline.todayDate', { date: formatted });
    if (dateStr === yesterday) return t('timeline.yesterdayDate', { date: formatted });
    return formatted;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 22,
              color: Colors.textPrimary,
            }}
          >
            {t('timeline.title')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: Colors.inputBg,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          >
            <Clock size={14} color={Colors.textSecondary} />
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 12,
                color: Colors.textSecondary,
              }}
            >
              {t('timeline.days', { count: 7 })}
            </Text>
          </View>
        </View>

        {/* Daily Visits Chart */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 18,
            padding: 16,
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 13,
                color: Colors.textPrimary,
              }}
            >
              {t('timeline.dailyVisits')}
            </Text>
            <View
              style={{
                backgroundColor: Colors.infoLight,
                borderRadius: 10,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: Colors.info,
                }}
              >
                {t('timeline.avgVisitsDay', { value: avgVisits.toFixed(1) })}
              </Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              backgroundColor: Colors.background,
              borderRadius: 8,
              padding: 8,
              paddingHorizontal: 12,
              height: 60,
            }}
          >
            {visitHistory.length > 0 ? (
              visitHistory.map((item, i) => {
                const height = (item.count / maxVisits) * 40;
                return (
                  <View
                    key={i}
                    style={{
                      width: 28,
                      height: Math.max(height, 4),
                      backgroundColor: Colors.info,
                      borderRadius: 4,
                      opacity: item.count === 0 ? 0.3 : 1,
                    }}
                  />
                );
              })
            ) : (
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 11,
                  color: Colors.textTertiary,
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                {t('common.noData')}
              </Text>
            )}
          </View>
        </View>

        {/* Log Entries by Date */}
        {sortedDates.length === 0 && (
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 13,
                color: Colors.textTertiary,
              }}
            >
              {t('timeline.noLogsYet')}
            </Text>
          </View>
        )}

        {sortedDates.map((date) => (
          <View key={date} style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 12,
                color: Colors.textTertiary,
              }}
            >
              {formatDateLabel(date)}
            </Text>
            {groupedLogs[date].map((log) => (
              <LogEntry
                key={log.id}
                log={log}
                quickLogs={dateQuickLogs[log.date]}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function LogEntry({ log, quickLogs }: { log: DailyLog; quickLogs?: { bathroom: number; water: number; bathroomAvg: number; waterAvg: number } }) {
  const { t } = useTranslation();
  const hasWarning = log.tags.includes('Hiding') || log.appetite <= 2;
  const badgeLabel = hasWarning
    ? log.tags || t('timeline.lowAppetite')
    : t('timeline.allGood');
  const badgeColor = hasWarning ? Colors.warning : Colors.success;
  const badgeBg = hasWarning ? Colors.warningLight : Colors.successLight;

  const bathroomCount = quickLogs?.bathroom ?? 0;
  const waterCount = quickLogs?.water ?? 0;
  const bathroomStatus = getStatusLabel(bathroomCount, quickLogs?.bathroomAvg ?? 0);
  const waterStatus = getStatusLabel(waterCount, quickLogs?.waterAvg ?? 0);

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 13,
            color: Colors.textPrimary,
          }}
        >
          {log.time}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: badgeBg,
            borderRadius: 10,
            paddingVertical: 4,
            paddingHorizontal: 10,
          }}
        >
          {hasWarning && <AlertTriangle size={12} color={badgeColor} />}
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 11,
              color: badgeColor,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Footprints size={14} color={Colors.textTertiary} />
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 12,
              color: Colors.textBody,
            }}
          >
            {t('timeline.xVisits', { count: bathroomCount })} · {t(STATUS_I18N[bathroomStatus])}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Heart size={14} color={Colors.textTertiary} />
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 12,
              color: Colors.textBody,
            }}
          >
            {t('timeline.appetiteScore', { score: log.appetite })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Droplets size={14} color={Colors.textTertiary} />
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 12,
              color: Colors.textBody,
            }}
          >
            {t('timeline.xDrinks', { count: waterCount })} · {t(STATUS_I18N[waterStatus])}
          </Text>
        </View>
      </View>
    </View>
  );
}
