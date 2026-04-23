import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { GlicoseRepository } from '@/features/glicose/glicose.repository';
import { MedicationRepository } from '@/features/medications/medication.repository';
import { MedicationService } from '@/features/medications/services/medication.service';
import { PressureRepository } from '@/features/pressure/pressure.repository';
import { WeightRepository } from '@/features/weight/weight.repository';
import type { BloodPressureReading, GlicoseReading, Medication, WeightReading } from '@/types/health';

const pressureRepository = new PressureRepository();
const glicoseRepository = new GlicoseRepository();
const weightRepository = new WeightRepository();
const medicationRepository = new MedicationRepository();
const medicationService = new MedicationService();

export function useRecordManagement() {
  const [pressureReadings, setPressureReadings] = useState<BloodPressureReading[]>([]);
  const [glicoseReadings, setGlicoseReadings] = useState<GlicoseReading[]>([]);
  const [weightReadings, setWeightReadings] = useState<WeightReading[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pressure, glicose, weight, meds] = await Promise.all([
        pressureRepository.listRecent(5),
        glicoseRepository.listRecent(5),
        weightRepository.listRecent(5),
        medicationRepository.listAll(),
      ]);

      setPressureReadings(pressure);
      setGlicoseReadings(glicose);
      setWeightReadings(weight);
      setMedications(meds);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    pressureReadings,
    glicoseReadings,
    weightReadings,
    medications,
    isLoading,
    refresh,
    deletePressure: (id: number) => pressureRepository.delete(id),
    deleteGlicose: (id: number) => glicoseRepository.delete(id),
    deleteWeight: (id: number) => weightRepository.delete(id),
    deleteMedication: (id: number) => medicationService.deleteMedication(id),
  };
}
