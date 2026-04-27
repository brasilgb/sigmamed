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

function buildTodayAtTime(value: string) {
  const parsed = parseTime(value);

  if (!parsed) {
    return null;
  }

  const current = new Date();
  current.setHours(parsed.hour, parsed.minute, 0, 0);
  return current;
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
  const reminderTime = new Date(doseTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - medication.reminderMinutesBefore);

  if (reminderTime > now) {
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
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
  }

  if (!medication.repeatReminderEveryFiveMinutes) {
    return;
  }

  const repeatStart = doseTime > now ? doseTime : roundUpToNextFiveMinutes(now);
  const repeatTimes = buildRepeatTimes(repeatStart).filter((date) => date > now);

  await Promise.all(
    repeatTimes.map((date) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete recorrente de medicamento',
          body: `${medication.name} ${medication.dosage}`.trim(),
          data: {
            kind: REMINDER_KIND,
            medicationId: medication.id,
            repeating: true,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
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

  await Promise.all(medications.map((medication) => scheduleMedicationReminder(medication)));
}
