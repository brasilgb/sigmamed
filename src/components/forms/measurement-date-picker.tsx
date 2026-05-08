import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BrandPalette, Colors, Radius } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/date';

type MeasurementDatePickerProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
};

type PickerMode = 'date' | 'time';

export function MeasurementDatePicker({
  label = 'Data e hora da medição',
  value,
  onChange,
}: MeasurementDatePickerProps) {
  const [openMode, setOpenMode] = useState<PickerMode | null>(null);

  function handleValueChange(mode: PickerMode, _event: DateTimePickerChangeEvent, selectedDate: Date) {
    if (Platform.OS === 'android') {
      setOpenMode(null);
    }

    const nextDate = new Date(value);

    if (mode === 'date') {
      nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      nextDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    onChange(nextDate);
  }

  function handleDismiss() {
    if (Platform.OS === 'android') {
      setOpenMode(null);
    }
  }

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {Platform.OS === 'ios' ? (
        <View style={styles.pickerRow}>
          <View style={styles.pickerShell}>
            <DateTimePicker
              value={value}
              mode="date"
              display="compact"
              maximumDate={new Date()}
              onValueChange={(event, selectedDate) => handleValueChange('date', event, selectedDate)}
              onDismiss={handleDismiss}
            />
          </View>
          <View style={styles.pickerShell}>
            <DateTimePicker
              value={value}
              mode="time"
              display="compact"
              onValueChange={(event, selectedDate) => handleValueChange('time', event, selectedDate)}
              onDismiss={handleDismiss}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.inputRow}>
            <Pressable style={[styles.inputShell, styles.dateInput]} onPress={() => setOpenMode('date')}>
              <ThemedText style={styles.inputText}>{formatDate(value.toISOString())}</ThemedText>
            </Pressable>
            <Pressable style={[styles.inputShell, styles.timeInput]} onPress={() => setOpenMode('time')}>
              <ThemedText style={styles.inputText}>{formatTime(value.toISOString())}</ThemedText>
            </Pressable>
          </View>
          {openMode ? (
            <DateTimePicker
              value={value}
              mode={openMode}
              display="default"
              maximumDate={openMode === 'date' ? new Date() : undefined}
              is24Hour
              onValueChange={(event, selectedDate) => handleValueChange(openMode, event, selectedDate)}
              onDismiss={handleDismiss}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputShell: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingVertical: 17,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    minWidth: 112,
  },
  inputText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerShell: {
    alignItems: 'flex-start',
  },
});
