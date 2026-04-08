import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Footprints, Heart, Droplets, Zap, Sun, Cat as CatIcon, ClipboardPenLine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { getTodayLog, getCatById, getLogs, getQuickLogCount, getQuickLogAverage, insertQuickLog, deleteQuickLog } from '@/utils/database';
import type { Cat, DailyLog, ActivityLevel } from '@/types';

const ACTIVITY_I18N: Record<ActivityLevel, string> = {
  Calm: 'log.activityCalm',
  Normal: 'log.activityNormal',
  Active: 'log.activityActive',
  Hyper: 'log.activityHyper',
};

type StatusLabel = 'normal' | 'belowAvg' | 'aboveAvg';

function getStatusLabel(count: number, avg: number): StatusLabel {
  if (avg === 0) return 'normal';
  if (count < avg * 0.7) return 'belowAvg';
  if (count > avg * 1.3) return 'aboveAvg';
  return 'normal';
}

const STATUS_COLORS: Record<StatusLabel, string> = {
  normal: Colors.success,
  belowAvg: Colors.warning,
  aboveAvg: Colors.info,
};

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [cat, setCat] = useState<Cat | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [bathroomCount, setBathroomCount] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [bathroomAvg, setBathroomAvg] = useState(0);
  const [waterAvg, setWaterAvg] = useState(0);

  // Undo toast state
  const [toastInfo, setToastInfo] = useState<{ id: number; type: 'bathroom' | 'water' } | null>(null);
  const toastTranslateY = useSharedValue(80);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toastAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastTranslateY.value }],
    opacity: toastTranslateY.value < 40 ? 1 : 0,
  }));

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastTranslateY.value = withTiming(80, { duration: 200 }, () => {
      runOnJS(setToastInfo)(null);
    });
  }, [toastTranslateY]);

  const showToast = useCallback((id: number, type: 'bathroom' | 'water') => {
    // Clear previous timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    // Reset position instantly then animate in
    toastTranslateY.value = 80;
    setToastInfo({ id, type });
    toastTranslateY.value = withTiming(0, { duration: 250 });
    toastTimerRef.current = setTimeout(() => {
      dismissToast();
    }, 3000);
  }, [toastTranslateY, dismissToast]);

  const handleUndo = useCallback(async () => {
    if (!toastInfo || !activeCatId) return;
    const { id, type } = toastInfo;
    await deleteQuickLog(id);
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'bathroom') {
      const c = await getQuickLogCount(activeCatId, 'bathroom', today);
      setBathroomCount(c);
    } else {
      const c = await getQuickLogCount(activeCatId, 'water', today);
      setWaterCount(c);
    }
    dismissToast();
  }, [toastInfo, activeCatId, dismissToast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!activeCatId) return;
    const c = await getCatById(activeCatId);
    setCat(c);
    const log = await getTodayLog(activeCatId);
    setTodayLog(log);
    const logs = await getLogs(activeCatId, 5);
    setRecentLogs(logs);
    const today = new Date().toISOString().slice(0, 10);
    const bc = await getQuickLogCount(activeCatId, 'bathroom', today);
    const wc = await getQuickLogCount(activeCatId, 'water', today);
    const ba = await getQuickLogAverage(activeCatId, 'bathroom', 7);
    const wa = await getQuickLogAverage(activeCatId, 'water', 7);
    setBathroomCount(bc);
    setWaterCount(wc);
    setBathroomAvg(ba);
    setWaterAvg(wa);
  }, [activeCatId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const haptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleQuickLog = async (type: 'bathroom' | 'water') => {
    if (!activeCatId) return;
    haptic();
    const insertedId = await insertQuickLog(activeCatId, type);
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'bathroom') {
      const c = await getQuickLogCount(activeCatId, 'bathroom', today);
      setBathroomCount(c);
    } else {
      const c = await getQuickLogCount(activeCatId, 'water', today);
      setWaterCount(c);
    }
    showToast(insertedId, type);
  };

  const catName = cat?.name ?? t('common.loading');
  const bathroomStatus = getStatusLabel(bathroomCount, bathroomAvg);
  const waterStatus = getStatusLabel(waterCount, waterAvg);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
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
          {/* Row 1: Bathroom + Appetite */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: Colors.card,
                borderRadius: 18,
                padding: 16,
                gap: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Footprints size={24} color={Colors.accent} />
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 28,
                  color: Colors.textPrimary,
                }}
              >
                {bathroomCount}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 11,
                  color: Colors.textSecondary,
                }}
              >
                {t('dashboard.bathroomVisits')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COLORS[bathroomStatus] }} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: STATUS_COLORS[bathroomStatus] }}>
                  {t(`dashboard.${bathroomStatus}`)}
                </Text>
              </View>
            </View>
            <StatCard
              icon={<Heart size={24} color={Colors.accent} />}
              value={todayLog ? `${todayLog.appetite}/5` : '--'}
              label={t('dashboard.appetite')}
              bg={Colors.accentLight}
            />
          </View>
          {/* Row 2: Water + Activity */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: Colors.infoLight,
                borderRadius: 18,
                padding: 16,
                gap: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Droplets size={24} color={Colors.info} />
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 28,
                  color: Colors.textPrimary,
                }}
              >
                {waterCount}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 11,
                  color: Colors.textSecondary,
                }}
              >
                {t('dashboard.waterIntake')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COLORS[waterStatus] }} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: STATUS_COLORS[waterStatus] }}>
                  {t(`dashboard.${waterStatus}`)}
                </Text>
              </View>
            </View>
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

        {/* Log Daily Health button */}
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
            marginTop: 16,
            alignSelf: 'center',
            shadowColor: Colors.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <ClipboardPenLine size={20} color="#FFFFFF" />
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 15,
              color: '#FFFFFF',
            }}
          >
            {t('dashboard.logDailyHealth')}
          </Text>
        </Pressable>

        {/* Quick-tap buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Pressable
            onPress={() => handleQuickLog('bathroom')}
            style={{
              flex: 1,
              backgroundColor: Colors.card,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.07,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: Colors.accentLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Footprints size={22} color={Colors.accent} />
            </View>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
              {t('dashboard.bathroom')}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.textTertiary }}>
              {t('dashboard.tapToLog')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleQuickLog('water')}
            style={{
              flex: 1,
              backgroundColor: Colors.card,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.07,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: Colors.infoLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Droplets size={22} color={Colors.info} />
            </View>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
              {t('dashboard.water')}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.textTertiary }}>
              {t('dashboard.tapToLog')}
            </Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Undo Toast */}
      {toastInfo && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 58,
              left: 20,
              right: 20,
              backgroundColor: Colors.textPrimary,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            },
            toastAnimatedStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 14,
              color: '#FFFFFF',
            }}
          >
            {toastInfo.type === 'bathroom' ? t('dashboard.bathroomPlus1') : t('dashboard.waterPlus1')}
          </Text>
          <Pressable onPress={handleUndo} hitSlop={8}>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 14,
                color: Colors.accent,
              }}
            >
              {t('dashboard.undo')}
            </Text>
          </Pressable>
        </Animated.View>
      )}
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
