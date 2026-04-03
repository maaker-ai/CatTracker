import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';
import i18next from 'i18next';

/**
 * Request notification permission.
 * Returns true if granted, false otherwise.
 * Shows alert with Settings link if denied.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();

  if (status === 'granted') return true;

  // Permission denied — show alert with option to open Settings
  const t = i18next.t.bind(i18next);
  Alert.alert(
    t('notifications.permissionDeniedTitle'),
    t('notifications.permissionDeniedMessage'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('notifications.openSettings'), onPress: () => Linking.openSettings() },
    ]
  );

  return false;
}

/**
 * Schedule a local notification for a reminder.
 * Uses the reminder id as the notification identifier so we can cancel it later.
 * Schedules for 9:00 AM on the given date.
 * If the date is in the past, does not schedule.
 */
export async function scheduleReminder(
  id: string,
  title: string,
  body: string,
  date: Date
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel any existing notification for this reminder first
  await cancelReminder(id);

  // Set trigger to 9:00 AM on the given date
  const triggerDate = new Date(date);
  triggerDate.setHours(9, 0, 0, 0);

  // Don't schedule if the date is in the past
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Cancel a previously scheduled notification by identifier.
 */
export async function cancelReminder(id: string): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Set the notification handler so notifications show when the app is in the foreground.
 */
export function setupNotificationHandler(): void {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
