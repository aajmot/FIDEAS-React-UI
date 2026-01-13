export interface PatientAnalytics {
  total_patients: number;
  new_patients_month: number;
  active_patients: number;
  gender_distribution: Array<{
    gender: string;
    count: number;
  }>;
  age_groups: Array<{
    group: string;
    count: number;
  }>;
}

export interface AppointmentAnalytics {
  total_appointments: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  no_show: number;
  completion_rate: number;
  no_show_rate: number;
  avg_daily_appointments?: number;
}

export interface ClinicalOperations {
  medical_records: number;
  prescriptions: number;
  test_orders: number;
  sample_collections: number;
}

export interface DoctorPerformance {
  id: number;
  doctor_name: string;
  specialization: string;
  total_appointments: number;
  completion_rate: number;
  consultation_fee: number;
}