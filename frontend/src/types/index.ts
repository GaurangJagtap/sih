export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'INSTITUTION' | 'REGIONAL_OFFICER' | 'BUREAU_OFFICER' | 'EVC_COMMITTEE' | 'SENIOR_AUTHORITY' | 'ADMIN';
  region?: string;
  institution_id?: string;
}

export interface ApplicationItem {
  id: string;
  application_number: string;
  institution_id: string;
  institution_name: string;
  permanent_id: string;
  region: string;
  application_type: string;
  academic_year: string;
  current_stage: string;
  status: string;
  route_code: string;
  submitted_at: string | null;
  stage_deadline: string | null;
  is_overdue: boolean;
  created_at: string;
  form_data?: {
    course_name?: string;
    intake_capacity?: number;
    faculty_count?: number;
    campus_area_acres?: number;
  };
}

export interface UndertakingItem {
  id: string;
  undertaking_code: string;
  application_id: string;
  application_number: string;
  institution_name: string;
  condition_title: string;
  condition_description: string;
  required_evidence_type: string;
  due_date: string;
  status: string;
  evidence_filename?: string;
  submission_timestamp?: string;
  verification_remarks?: string;
  extension_requested?: boolean;
}

export interface DocumentItem {
  id: string;
  document_type: string;
  display_name: string;
  institution_name: string;
  issue_date?: string;
  expiry_date?: string;
  validity_status: string;
  verification_status: string;
  verification_remarks?: string;
  previous_document_id?: string;
}

export interface CallLogItem {
  id: string;
  institution_id: string;
  institution_name: string;
  application_number: string;
  contact_phone: string;
  contact_person: string;
  provider_mode: string;
  call_status: string;
  language: string;
  recognized_intent: string;
  transcript_text: string;
  ai_summary: string;
  promised_date?: string;
  follow_up_task_created: boolean;
  follow_up_task_details?: string;
  human_escalation_required: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  event_type: string;
  channel: string;
  title: string;
  message: string;
  is_read: boolean;
  delivery_status: string;
  created_at: string;
}

export interface EscalationItem {
  id: string;
  trigger_type: string;
  escalation_level: number;
  assigned_role: string;
  summary: string;
  status: string;
  created_at: string;
}
