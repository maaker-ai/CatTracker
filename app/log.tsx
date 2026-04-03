import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, KeyboardAvoidingView, Keyboard, PanResponder } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X, PawPrint, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { insertLog, getCatById, getTodayLog, getLatestWeight } from '@/utils/database';
import type { ActivityLevel } from '@/types';

function AppetiteSlider({ value, onChange, haptic }: { value: number; onChange: (v: number) => void; haptic: () => void }) {
  const startValue = useRef(value);
  const currentValue = useRef(value);

  useEffect(() => {
    currentValue.current = value;
  }, [value]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderGrant: () => {
        startValue.current = currentValue.current;
      },
      onPanResponderMove: (_, g) => {
        const delta = Math.round(g.dx / 50);
        const newVal = Math.min(5, Math.max(1, startValue.current + delta));
        if (newVal !== currentValue.current) {
          haptic();
          onChange(newVal);
        }
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
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
  );
}

export default function LogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [catName, setCatName] = useState('Mochi');
  const [appetite, setAppetite] = useState(4);
  const [activity, setActivity] = useState<ActivityLevel>('Active');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [weightPlaceholder, setWeightPlaceholder] = useState('0.0');
  const savingRef = useRef(false);

  const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
    { value: 'Calm', label: t('log.activityCalm') },
    { value: 'Normal', label: t('log.activityNormal') },
    { value: 'Active', label: t('log.activityActive') },
    { value: 'Hyper', label: t('log.activityHyper') },
  ];

  useFocusEffect(
    useCallback(() => {
      if (!activeCatId) return;
      getCatById(activeCatId).then((c) => {
        if (c) setCatName(c.name);
      });
      getTodayLog(activeCatId).then((log) => {
        if (log) {
          setAppetite(log.appetite);
          setActivity(log.activity as ActivityLevel);
          setNotes(log.notes || '');
        }
      });
      getLatestWeight(activeCatId).then((w) => {
        if (w !== null) setWeightPlaceholder(w.toFixed(1));
      });
    }, [activeCatId])
  );

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
      litterVisits: 0,
      appetite,
      hydration: 'Normal',
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
      <View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' }}>
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick-tap hint banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#EDF7ED',
            borderRadius: 12,
            padding: 14,
            gap: 10,
          }}
        >
          <Info size={18} color={Colors.success} />
          <Text
            style={{
              flex: 1,
              fontFamily: 'Inter-Regular',
              fontSize: 13,
              color: Colors.success,
            }}
          >
            {t('log.quickTapHint')}
          </Text>
        </View>

        {/* Appetite */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.appetite')}
          </Text>
          <AppetiteSlider value={appetite} onChange={setAppetite} haptic={haptic} />
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

        {/* Weight (optional) */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary }}>
            {t('log.weightOptional')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.background,
              borderRadius: 14,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder={weightPlaceholder}
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: Colors.textPrimary,
                paddingVertical: 14,
              }}
            />
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textSecondary }}>
              kg
            </Text>
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
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
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
      </KeyboardAvoidingView>
      </View>
    </View>
  );
}
