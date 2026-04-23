import * as Notifications from 'expo-notifications';

import type { Medication } from '@/types/health';

const REMINDER_KIND = 'medication-reminder';

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

  notificationsConfigured = true;
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

function subtractMinutes(hour: number, minute: number, offset: number) {
  const total = hour * 60 + minute - offset;
  const normalized = ((total % 1440) + 1440) % 1440;

  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
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

function buildReminderBody(medication: Medication) {
  const base = `${medication.name} ${medication.dosage}`.trim();
  const timeText = medication.scheduledTime ? `Dose prevista às ${medication.scheduledTime}.` : 'Dose prevista em 5 minutos.';
  return `${base}. ${timeText}`;
}

async function scheduleMedicationReminder(medication: Medication) {
  if (!medication.active || !medication.reminderEnabled || !medication.scheduledTime) {
    return;
  }

  const parsed = parseTime(medication.scheduledTime);

  if (!parsed) {
    return;
  }

  const triggerTime = subtractMinutes(parsed.hour, parsed.minute, medication.reminderMinutesBefore);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de medicamento',
      body: buildReminderBody(medication),
      data: {
        kind: REMINDER_KIND,
        medicationId: medication.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: triggerTime.hour,
      minute: triggerTime.minute,
    },
  });
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

  await Promise.all(medications.map((medication) => scheduleMedicationReminder(medication)));
}
