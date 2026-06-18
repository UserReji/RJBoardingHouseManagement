/**
 * Shared domain types for RJ BoardHouse Management System
 */

export type UserRole = "admin" | "tenant";
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type ContractStatus = "active" | "ended";
export type BillStatus = "unpaid" | "partially_paid" | "paid";
export type PaymentMethod = "cash" | "gcash";
export type PaymentStatus = "pending_verification" | "verified" | "rejected";
export type ConcernStatus = "open" | "in_progress" | "resolved";
export type ConcernReplyRole = "admin" | "tenant";
export type ExtraOccupantRate = 20 | 25 | 30;

/* Database Models */

export interface Room {
  id: string;
  room_number: number;
  price: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomPhoto {
  id: string;
  room_id: string;
  photo_url: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  registration_status: RegistrationStatus;
  full_name: string;
  birthday?: string;
  sex?: string;
  permanent_address?: string;
  contact_number?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  valid_id_type?: string;
  valid_id_number?: string;
  created_at: string;
}

export interface TenantContract {
  id: string;
  tenant_id: string;
  room_id: string;
  term_months: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit_months: number;
  advance_payment_months: number;
  contract_status: ContractStatus;
  agreed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  room_id: string;
  tenant_id: string;
  reading_value: number;
  reading_date: string;
  photo_url?: string;
  is_initial: boolean;
  created_at: string;
}

export interface Bill {
  id: string;
  tenant_id: string;
  room_id: string;
  billing_period_start: string;
  billing_period_end: string;
  room_rent: number;
  extra_occupant_days: number;
  extra_occupant_rate: ExtraOccupantRate;
  extra_occupant_charge: number;
  prev_reading_id?: string;
  curr_reading_id: string;
  kwh_consumed: number;
  kwh_rate: number;
  electricity_charge: number;
  total_amount: number;
  status: BillStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillPhoto {
  id: string;
  bill_id: string;
  photo_url: string;
  caption?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  tenant_id: string;
  amount: number;
  payment_method: PaymentMethod;
  gcash_screenshot_url?: string;
  gcash_reference_note?: string;
  payment_status: PaymentStatus;
  admin_note?: string;
  paid_at?: string;
  verified_at?: string;
  created_at: string;
}

export interface Concern {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  status: ConcernStatus;
  created_at: string;
  updated_at: string;
}

export interface ConcernPhoto {
  id: string;
  concern_id: string;
  photo_url: string;
  created_at: string;
}

export interface ConcernReply {
  id: string;
  concern_id: string;
  sender_role: ConcernReplyRole;
  body: string;
  created_at: string;
}

/* View/DTO Types */

export interface RoomWithTenant extends Room {
  current_tenant?: User;
}

export interface TenantWithLatestContract extends User {
  latest_contract?: TenantContract;
}

export interface BillWithReadings extends Bill {
  prev_reading?: MeterReading;
  curr_reading?: MeterReading;
  room?: Room;
  tenant?: User;
  photos?: BillPhoto[];
}

export interface PaymentWithBill extends Payment {
  bill?: Bill;
  tenant?: User;
}

export interface ConcernWithReplies extends Concern {
  tenant?: User;
  photos?: ConcernPhoto[];
  replies?: ConcernReply[];
}
