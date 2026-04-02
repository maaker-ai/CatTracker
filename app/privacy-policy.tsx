import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 18,
            color: Colors.textPrimary,
          }}
        >
          {t('settings.privacyPolicy')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 13,
            color: Colors.textSecondary,
            lineHeight: 20,
          }}
        >
          {t('privacy.lastUpdated')}
        </Text>

        <Section title={t('privacy.dataCollectionTitle')} body={t('privacy.dataCollectionBody')} />
        <Section title={t('privacy.dataStorageTitle')} body={t('privacy.dataStorageBody')} />
        <Section title={t('privacy.thirdPartyTitle')} body={t('privacy.thirdPartyBody')} />
        <Section title={t('privacy.childrenTitle')} body={t('privacy.childrenBody')} />
        <Section title={t('privacy.changesTitle')} body={t('privacy.changesBody')} />
        <Section title={t('privacy.contactTitle')} body={t('privacy.contactBody')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: 'Inter-SemiBold',
          fontSize: 15,
          color: Colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-Regular',
          fontSize: 14,
          color: Colors.textBody ?? Colors.textSecondary,
          lineHeight: 22,
        }}
      >
        {body}
      </Text>
    </View>
  );
}
