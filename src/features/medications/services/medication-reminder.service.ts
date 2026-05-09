import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Medication } from '@/types/health';

const REMINDER_KIND = 'medication-reminder';
const REMINDER_CHANNEL_ID = 'medication-reminders';
const REMINDER_VIBRATION_PATTERN = [0, 500, 250, 500];
const DEFAULT_DOSE_INTERVAL_MINUTES = 24 * 60;

let notificationsConfigured = false;

export function configureMedicationNotifications() {
  if (notificationsConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  void ensureMedicationReminderChannel();
  notificationsConfigured = true;
}

async function ensureMedicationReminderChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Lembretes de medicação',
      description: 'Alertas sonoros e vibração para horários de medicação.',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: REMINDER_VIBRATION_PATTERN,
      showBadge: false,
    });
  } catch {
    // If channels are unavailable, keep scheduling with per-notification defaults.
  }
}

function parseTime(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function parseIntervalMinutes(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_DOSE_INTERVAL_MINUTES;
  }

  const match = value.match(/^(\d{2}):([0-5]\d)$/);

  if (!match) {
    return DEFAULT_DOSE_INTERVAL_MINUTES;
  }

  const totalMinutes = Number(match[1]) * 60 + Number(match[2]);
  return totalMinutes > 0 && totalMinutes <= DEFAULT_DOSE_INTERVAL_MINUTES
    ? totalMinutes
    : DEFAULT_DOSE_INTERVAL_MINUTES;
}

async function cancelMedicationReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.kind === REMINDER_KIND)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

async function ensureNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function buildReminderBody(medication: Medication, doseTime?: Date) {
  const base = `${medication.name} ${medication.dosage}`.trim();
  const scheduledTime = doseTime ? formatTime(doseTime) : medication.scheduledTime;
  const timeText = scheduledTime ? `Dose prevista às ${scheduledTime}.` : 'Dose prevista em 5 minutos.';
  return `${base}. ${timeText}`;
}

function buildReminderContent(medication: Medication, repeating = false, doseTime?: Date): Notifications.NotificationContentInput {
  return {
    title: repeating ? 'Lembrete recorrente de medicamento' : 'Lembrete de medicamento',
    body: repeating ? `${medication.name} ${medication.dosage}`.trim() : buildReminderBody(medication, doseTime),
    sound: true,
    vibrate: REMINDER_VIBRATION_PATTERN,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    data: {
      kind: REMINDER_KIND,
      medicationId: medication.id,
      scheduledAt: doseTime?.toISOString() ?? null,
      repeating,
    },
  };
}

function buildTodayAtTime(value: string) {
  const parsed = parseTime(value);

  if (!parsed) {
    return null;
  }

  const current = new Date();
  current.setHours(parsed.hour, parsed.minute, 0, 0);
  return current;
}

function buildDoseTimes(firstDoseTime: Date, intervalMinutes: number | null) {
  const dates = [new Date(firstDoseTime)];

  if (!intervalMinutes) {
    return dates;
  }

  const cursor = new Date(firstDoseTime);
  const endOfDay = new Date(firstDoseTime);
  endOfDay.setHours(23, 59, 59, 999);

  while (dates.length < 12) {
    cursor.setMinutes(cursor.getMinutes() + intervalMinutes);

    if (cursor > endOfDay) {
      break;
    }

    dates.push(new Date(cursor));
  }

  return dates;
}

function roundUpToNextFiveMinutes(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);

  const minutes = next.getMinutes();
  const remainder = minutes % 5;

  if (remainder !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    next.setMinutes(minutes + (remainder === 0 ? 5 : 5 - remainder));
  }

  return next;
}

function buildRepeatTimes(start: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  const endOfDay = new Date(start);
  endOfDay.setHours(23, 55, 0, 0);

  while (cursor <= endOfDay && dates.length < 36) {
    dates.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 5);
  }

  return dates;
}

async function scheduleMedicationReminder(medication: Medication) {
  if (!medication.active || !medication.reminderEnabled || !medication.scheduledTime || medication.todayStatus === 'taken') {
    return;
  }

  const doseTime = buildTodayAtTime(medication.scheduledTime);

  if (!doseTime) {
    return;
  }

  const now = new Date();
  const doseTimes = buildDoseTimes(doseTime, parseIntervalMinutes(medication.doseInterval));

  await Promise.all(
    doseTimes.map(async (doseDate) => {
      const reminderTime = new Date(doseDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - medication.reminderMinutesBefore);

      if (reminderTime <= now) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: buildReminderContent(medication, false, doseDate),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    })
  );

  if (!medication.repeatReminderEveryFiveMinutes) {
    return;
  }

  const repeatStart = doseTime > now ? doseTime : roundUpToNextFiveMinutes(now);
  const repeatTimes = buildRepeatTimes(repeatStart).filter((date) => date > now);

  await Promise.all(
    repeatTimes.map((date) =>
      Notifications.scheduleNotificationAsync({
        content: buildReminderContent(medication, true),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: REMINDER_CHANNEL_ID,
        },
      })
    )
  );
}

export async function syncMedicationReminderNotifications(medications: Medication[]) {
  configureMedicationNotifications();
  const hasEnabledReminders = medications.some(
    (item) => item.active && item.reminderEnabled && item.scheduledTime
  );

  await cancelMedicationReminderNotifications();

  if (!hasEnabledReminders) {
    return;
  }

  const granted = await ensureNotificationPermissions();

  if (!granted) {
    return;
  }

  await ensureMedicationReminderChannel();
  await Promise.all(medications.map((medication) => scheduleMedicationReminder(medication)));
}
