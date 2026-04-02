import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Home, List, User, Settings } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG = [
  { name: 'index', labelKey: 'tabs.home', Icon: Home },
  { name: 'timeline', labelKey: 'tabs.timeline', Icon: List },
  { name: 'profile', labelKey: 'tabs.profile', Icon: User },
  { name: 'settings', labelKey: 'tabs.settings', Icon: Settings },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: Colors.background,
        paddingTop: 12,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 28,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Colors.background,
          borderRadius: 36,
          padding: 4,
          borderWidth: 1,
          borderColor: Colors.border,
          height: 62,
        }}
      >
        {TAB_CONFIG.map((tab, index) => {
          const isActive = state.index === index;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                const route = state.routes[index];
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 26,
                gap: 4,
                backgroundColor: isActive ? Colors.accent : 'transparent',
              }}
            >
              <tab.Icon
                size={18}
                color={isActive ? '#FFFFFF' : Colors.textTertiary}
                strokeWidth={2}
              />
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 9,
                  color: isActive ? '#FFFFFF' : Colors.textTertiary,
                  letterSpacing: 0.5,
                }}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
