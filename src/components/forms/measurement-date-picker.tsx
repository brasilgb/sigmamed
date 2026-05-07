import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BrandPalette, Colors, Radius } from '@/constants/theme';
import { formatDate } from '@/utils/date';

type MeasurementDatePickerProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
};

export function MeasurementDatePicker({
  label = 'Data da medição',
  value,
  onChange,
}: MeasurementDatePickerProps) {
  const [isOpen, setIsOpen] = useState(Platform.OS === 'ios');

  function handleValueChange(_event: DateTimePickerChangeEvent, selectedDate: Date) {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }

    const nextDate = new Date(value);
    nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    onChange(nextDate);
  }

  function handleDismiss() {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {Platform.OS === 'ios' ? (
        <View style={styles.pickerShell}>
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            maximumDate={new Date()}
            onValueChange={handleValueChange}
            onDismiss={handleDismiss}
          />
        </View>
      ) : (
        <>
          <Pressable style={styles.inputShell} onPress={() => setIsOpen(true)}>
            <ThemedText style={styles.inputText}>{formatDate(value.toISOString())}</ThemedText>
          </Pressable>
          {isOpen ? (
            <DateTimePicker
              value={value}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onValueChange={handleValueChange}
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
  inputText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
  },
  pickerShell: {
    alignItems: 'flex-start',
  },
});
