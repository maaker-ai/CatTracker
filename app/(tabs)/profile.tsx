import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pencil, Cat } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';
import { getCatById, updateCat, getWeightRecords, insertWeightRecord } from '@/utils/database';
import type { Cat as CatType, WeightRecord } from '@/types';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const activeCatId = useAppStore((s) => s.activeCatId);
  const [cat, setCat] = useState<CatType | null>(null);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [editVisible, setEditVisible] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Female');
  const [editNeutered, setEditNeutered] = useState(false);
  const [editWeight, setEditWeight] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeCatId) return;
    const c = await getCatById(activeCatId);
    setCat(c);
    const w = await getWeightRecords(activeCatId);
    setWeights(w);
  }, [activeCatId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openEdit = () => {
    if (!cat) return;
    setEditName(cat.name);
    setEditBreed(cat.breed);
    setEditBirthday(cat.birthday);
    setEditGender(cat.gender);
    setEditNeutered(cat.neutered);
    setEditWeight(weights.length > 0 ? weights[weights.length - 1].weight.toFixed(1) : '');
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!cat) return;
    await updateCat({
      ...cat,
      name: editName,
      breed: editBreed,
      birthday: editBirthday,
      gender: editGender,
      neutered: editNeutered,
    });
    if (editWeight && !isNaN(parseFloat(editWeight))) {
      await insertWeightRecord({
        catId: cat.id,
        weight: parseFloat(editWeight),
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setEditVisible(false);
    loadData();
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return '';
    const birth = new Date(birthday);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    return t('profile.yearsOld', { count: years });
  };

  const formatBirthday = (birthday: string) => {
    if (!birthday) return '';
    const d = new Date(birthday + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
  const prevWeight = weights.length > 1 ? weights[weights.length - 2].weight : currentWeight;
  const weightDiff = currentWeight - prevWeight;

  const maxWeight = Math.max(...weights.map((w) => w.weight), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 20,
            paddingHorizontal: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
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
            <Cat size={52} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 24,
              color: Colors.textPrimary,
            }}
          >
            {cat?.name ?? t('common.loading')}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 14,
              color: Colors.textSecondary,
            }}
          >
            {cat ? `${cat.breed} \u00B7 ${calculateAge(cat.birthday)}` : ''}
          </Text>
          <Pressable
            onPress={openEdit}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: Colors.accent,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 20,
            }}
          >
            <Pencil size={14} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 13,
                color: '#FFFFFF',
              }}
            >
              {t('profile.editProfile')}
            </Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={{ paddingHorizontal: 20 }}>
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
            <InfoRow label={t('profile.birthday')} value={cat ? formatBirthday(cat.birthday) : ''} border />
            <InfoRow label={t('profile.gender')} value={cat?.gender === 'Male' ? t('profile.male') : t('profile.female')} border />
            <InfoRow
              label={t('profile.neutered')}
              value={cat?.neutered ? t('profile.yes') : t('profile.no')}
              valueColor={cat?.neutered ? Colors.success : Colors.textPrimary}
              border
            />
            <InfoRow
              label={t('profile.currentWeight')}
              value={currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '--'}
            />
          </View>
        </View>

        {/* Weight History */}
        <View style={{ padding: 20, paddingTop: 16, gap: 12 }}>
          <Text
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 14,
              color: Colors.textPrimary,
            }}
          >
            {t('profile.weightHistory')}
          </Text>
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 18,
              padding: 16,
              gap: 8,
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
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                backgroundColor: Colors.background,
                borderRadius: 8,
                padding: 8,
                paddingHorizontal: 12,
                height: 80,
              }}
            >
              {weights.length > 0 ? (
                weights.slice(-6).map((w, i) => {
                  const height = (w.weight / maxWeight) * 60;
                  const isLatest = i === Math.min(weights.length, 6) - 1;
                  return (
                    <View
                      key={w.id}
                      style={{
                        width: 28,
                        height: Math.max(height, 4),
                        backgroundColor: isLatest ? Colors.warning : Colors.accent,
                        borderRadius: 4,
                        opacity: isLatest ? 1 : 0.7 + i * 0.05,
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
                  {t('profile.noWeightRecords')}
                </Text>
              )}
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 12,
                color: Colors.textSecondary,
              }}
            >
              {currentWeight > 0
                ? t('profile.currentWeightSummary', {
                    weight: currentWeight.toFixed(1),
                    diff: `${weightDiff >= 0 ? '+' : ''}${weightDiff.toFixed(1)}`,
                  })
                : t('profile.addWeightHint')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ maxHeight: '85%' }}
            >
              <View
                style={{
                  backgroundColor: Colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingTop: 20,
                  paddingHorizontal: 20,
                  paddingBottom: 40,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-Bold',
                    fontSize: 18,
                    color: Colors.textPrimary,
                    marginBottom: 16,
                  }}
                >
                  {t('profile.editProfile')}
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
                >
                  <EditField label={t('profile.name')} value={editName} onChangeText={setEditName} />
                  <EditField label={t('profile.breed')} value={editBreed} onChangeText={setEditBreed} />

                  {/* Birthday - Date Picker */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary }}>
                      {t('profile.birthday')}
                    </Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={{
                        backgroundColor: Colors.background,
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter-Regular',
                          fontSize: 14,
                          color: editBirthday ? Colors.textPrimary : Colors.textTertiary,
                        }}
                      >
                        {editBirthday ? formatBirthday(editBirthday) : t('profile.selectBirthday')}
                      </Text>
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={editBirthday ? new Date(editBirthday + 'T00:00:00') : new Date()}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={(_event, selectedDate) => {
                          if (Platform.OS === 'android') setShowDatePicker(false);
                          if (selectedDate) {
                            const y = selectedDate.getFullYear();
                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const d = String(selectedDate.getDate()).padStart(2, '0');
                            setEditBirthday(`${y}-${m}-${d}`);
                          }
                        }}
                      />
                    )}
                    {showDatePicker && Platform.OS === 'ios' && (
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
                      >
                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.accent }}>
                          {t('common.done')}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text
                      style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary }}
                    >
                      {t('profile.gender')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['Male', 'Female'] as const).map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => setEditGender(g)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: editGender === g ? Colors.accent : Colors.inputBg,
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Inter-SemiBold',
                              fontSize: 13,
                              color: editGender === g ? '#FFFFFF' : Colors.textSecondary,
                            }}
                          >
                            {g === 'Male' ? t('profile.male') : t('profile.female')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setEditNeutered(!editNeutered)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: editNeutered ? Colors.accent : Colors.toggleOff,
                        padding: 2,
                        justifyContent: 'center',
                        alignItems: editNeutered ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </View>
                    <Text
                      style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textPrimary }}
                    >
                      {t('profile.neutered')}
                    </Text>
                  </Pressable>

                  <EditField
                    label={t('profile.weightKg')}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Pressable
                    onPress={() => setEditVisible(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: Colors.inputBg,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-SemiBold',
                        fontSize: 14,
                        color: Colors.textSecondary,
                      }}
                    >
                      {t('common.cancel')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={saveEdit}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: Colors.accent,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-SemiBold',
                        fontSize: 14,
                        color: '#FFFFFF',
                      }}
                    >
                      {t('common.save')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
  border,
}: {
  label: string;
  value: string;
  valueColor?: string;
  border?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: border ? 1 : 0,
        borderBottomColor: Colors.divider,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter-Regular',
          fontSize: 14,
          color: Colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-SemiBold',
          fontSize: 14,
          color: valueColor ?? Colors.textPrimary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  keyboardType,
  selectTextOnFocus,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  selectTextOnFocus?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType="done"
        selectTextOnFocus={selectTextOnFocus}
        style={{
          backgroundColor: Colors.background,
          borderRadius: 12,
          padding: 12,
          fontFamily: 'Inter-Regular',
          fontSize: 14,
          color: Colors.textPrimary,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      />
    </View>
  );
}
