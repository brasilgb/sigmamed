import { MedicationRepository } from '@/features/medications/medication.repository';
import { syncMedicationReminderNotifications } from '@/features/medications/services/medication-reminder.service';
import type { NewMedication } from '@/types/health';

const medicationRepository = new MedicationRepository();

export class MedicationService {
  async createMedication(input: NewMedication) {
    const medication = await medicationRepository.createMedication(input);
    await this.syncReminders();
    return medication;
  }

  async updateMedication(id: number, input: NewMedication) {
    const medication = await medicationRepository.updateMedication(id, input);
    await this.syncReminders();
    return medication;
  }

  async deleteMedication(id: number) {
    await medicationRepository.deleteMedication(id);
    await this.syncReminders();
  }

  async syncReminders() {
    const medications = await medicationRepository.listAll();
    await syncMedicationReminderNotifications(medications);
  }
}
