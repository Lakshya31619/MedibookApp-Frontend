export interface CreateRecordRequest {
  appointmentId: number;
  patientId: number;
  providerId: number;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  followUpDate?: string;
}

export interface UpdateRecordRequest {
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  followUpDate?: string; 
  attachmentUrl?: string;
}

export interface RecordResponse {
  recordId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  followUpDate: string | null;   
  followUpReminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  editable: boolean;          
}

export interface RecordSummary {
  recordId: number;
  appointmentId: number;
  providerId: number;
  diagnosis: string;
  followUpDate: string | null;
  createdAt: string;
}