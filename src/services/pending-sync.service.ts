import { GlicoseRepository } from '@/features/glicose/glicose.repository';
import { MedicationRepository } from '@/features/medications/medication.repository';
import { PressureRepository } from '@/features/pressure/pressure.repository';
import { WeightRepository } from '@/features/weight/weight.repository';

const pressureRepository = new PressureRepository();
const glicoseRepository = new GlicoseRepository();
const weightRepository = new WeightRepository();
const medicationRepository = new MedicationRepository();

let pendingSyncPromise: Promise<void> | null = null;

export function syncPendingRecords() {
  if (!pendingSyncPromise) {
    pendingSyncPromise = Promise.all([
      pressureRepository.syncPending(),
      glicoseRepository.syncPending(),
      weightRepository.syncPending(),
      medicationRepository.syncPending(),
    ])
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        pendingSyncPromise = null;
      });
  }

  return pendingSyncPromise;
}

