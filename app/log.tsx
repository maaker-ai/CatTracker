import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X, PawPrint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { insertLog, getCatById, getTodayLog } from '@/utils/database';
import type { HydrationLevel, ActivityLevel } from '@/types';

function AppetiteSlider({ value, onChange, haptic }: { value: number; onChange: (v: number) => void; haptic: () => void }) {
  const lastValue = useRef(value);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Each ~50px of horizontal drag = 1 step
      const delta = Math.round(e.translationX / 50);
      const newVal = Math.min(5, Math.max(1, lastValue.current + delta));
      if (newVal !== value) {
        haptic();
        onChange(newVal);
      }
    })
    .onEnd(() => {
      lastValue.current = value;
    });

  // Keep lastValue in sync when value changes from tap
  useEffect(() => {
    lastValue.current = value;
  }, [value]);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Colors.background,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          gap: 8,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => {
              haptic();
              onChange(i);
            }}
          >
            <PawPrint
              size={28}
              color={Colors.accent}
              fill={i <= value ? Colors.accent : 'transparent'}
              style={{ opacity: i <= value ? 1 : 0.3 }}
            />
          </Pressable>
        ))}
      </View>
    </GestureDetector>
  );
}

export default function LogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [catName, setCatName] = useState('Mochi');
  const [litterVisits, setLitterVisits] = useState(3);
  const [appetite, setAppetite] = useState(4);
  const [hydration, setHydration] = useState<HydrationLevel>('Normal');
  const [activity, setActivity] = useState<ActivityLevel>('Active');
  const [notes, setNotes] = useState('');
  const savingRef = useRef(false);

  const HYDRATION_OPTIONS: { value: HydrationLevel; label: string }[] = [
    { value: 'Low', label: t('log.hydrationLow') },
    { value: 'Normal', label: t('log.hydrationNormal') },
    { value: 'High', label: t('log.hydrationHigh') },
  ];

  const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
    { value: 'Calm', label: t('log.activityCalm') },
    { value: 'Normal', label: t('log.activityNormal') },
    { value: 'Active', label: t('log.activityActive') },
    { value: 'Hyper', label: t('log.activityHyper') },
  ];

  useEffect(() => {
    if (!activeCatId) return;
    getCatById(activeCatId).then((c) => {
      if (c) setCatName(c.name);
    });
    getTodayLog(activeCatId).then((log) => {
      if (log) {
        setLitterVisits(log.litterVisits);
        setAppetite(log.appetite);
        setHydration(log.hydration as HydrationLevel);
        setActivity(log.activity as ActivityLevel);
        setNotes(log.notes || '');
      }
    });
  }, [activeCatId]);

  const haptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (savingRef.current || !activeCatId) return;
    savingRef.current = true;
    haptic();

    const now = new Date();
    await insertLog({
      catId: activeCatId,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      litterVisits,
      appetite,
      hydration,
      activity,
      notes,
      tags: '',
      createdAt: now.toISOString(),
    });

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => router.back()}
      />
      <View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
      {/* Handle bar */}
      <View
        style={{
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.handleBar,
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 20,
            color: Colors.textPrimary,
          }}
        >
          {t('log.logFor', { name: catName })}
        </Text>
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Litter Visits */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.litterVisits')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: Colors.background,
              borderRadius: 16,
              padding: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Pressable
              onPress={() => {
                haptic();
                setLitterVisits(Math.max(0, litterVisits - 1));
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Minus size={18} color="#FFFFFF" />
            </Pressable>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 28,
                color: Colors.textPrimary,
              }}
            >
              {litterVisits}
            </Text>
            <Pressable
              onPress={() => {
                haptic();
                setLitterVisits(litterVisits + 1);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Appetite — swipe left/right to adjust, tap still works */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.appetite')}
          </Text>
          <AppetiteSlider value={appetite} onChange={setAppetite} haptic={haptic} />
        </View>

        {/* Hydration */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.hydration')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {HYDRATION_OPTIONS.map((opt) => {
              const isActive = hydration === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    haptic();
                    setHydration(opt.value);
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isActive ? Colors.accent : Colors.inputBg,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: Colors.handleBar,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-SemiBold',
                      fontSize: 13,
                      color: isActive ? '#FFFFFF' : Colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Activity Level */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.activityLevel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {ACTIVITY_OPTIONS.map((opt) => {
              const isActive = activity === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    haptic();
                    setActivity(opt.value);
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isActive ? Colors.accent : Colors.inputBg,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: Colors.handleBar,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? 'Inter-SemiBold' : 'Inter-Medium',
                      fontSize: 12,
                      color: isActive ? '#FFFFFF' : Colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.notesOptional')}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('log.notesPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            returnKeyType="done"
            style={{
              backgroundColor: Colors.background,
              borderRadius: 14,
              padding: 14,
              height: 80,
              fontFamily: 'Inter-Regular',
              fontSize: 13,
              color: Colors.textPrimary,
              borderWidth: 1,
              borderColor: Colors.border,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 20,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Colors.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
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
            {t('log.saveLog')}
          </Text>
        </Pressable>
      </ScrollView>
      </View>
    </View>
  );
}
