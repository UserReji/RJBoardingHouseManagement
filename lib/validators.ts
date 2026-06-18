/**
 * Zod validation schemas for forms and API requests
 */

import { z } from "zod";

/* Auth & Registration */

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(["admin", "tenant"], {
    errorMap: () => ({ message: "Select Admin or Tenant" }),
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const TenantRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  full_name: z.string().min(2, "Full name is required"),
  birthday: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  sex: z.enum(["Male", "Female", "Other"]),
  permanent_address: z.string().min(5, "Address is required"),
  contact_number: z.string().regex(/^[0-9]{10,11}$/, "Invalid phone number"),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_number: z.string().regex(/^[0-9]{10,11}$/, "Invalid phone number"),
  valid_id_type: z.enum(["National ID", "Passport", "Driver License", "Student ID"]),
  valid_id_number: z.string().min(5, "ID number is required"),
  agree_to_rules: z.boolean().refine((v) => v === true, "You must agree to the rules"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type TenantRegistrationInput = z.infer<typeof TenantRegistrationSchema>;

/* Contract */

export const ContractFillSchema = z.object({
  room_id: z.string().min(1, "Select a room"),
  term_months: z.number().int().min(1, "Term must be at least 1 month"),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  monthly_rent: z.number().positive("Monthly rent must be positive"),
  security_deposit_months: z.number().min(0, "Security deposit cannot be negative"),
  advance_payment_months: z.number().min(0, "Advance payment cannot be negative"),
});

export type ContractFillInput = z.infer<typeof ContractFillSchema>;

export const ContractAgreeSchema = z.object({
  contract_id: z.string().min(1, "Contract ID is required"),
  agreed: z.boolean().refine((v) => v === true, "You must agree to the contract"),
});

export type ContractAgreeInput = z.infer<typeof ContractAgreeSchema>;

/* Rooms */

export const EditRoomSchema = z.object({
  room_number: z.number().int().min(1).max(8),
  price: z.number().positive("Price must be positive"),
  description: z.string().optional(),
});

export type EditRoomInput = z.infer<typeof EditRoomSchema>;

/* Meter Readings */

export const MeterReadingSchema = z.object({
  room_id: z.string().min(1, "Room is required"),
  reading_value: z.number().positive("Reading value must be positive"),
  reading_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  photo_url: z.string().optional(),
  is_initial: z.boolean().default(false),
});

export type MeterReadingInput = z.infer<typeof MeterReadingSchema>;

/* Bills */

export const CreateBillSchema = z.object({
  tenant_id: z.string().min(1, "Select a tenant"),
  room_id: z.string().min(1, "Select a room"),
  billing_period_start: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  billing_period_end: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  room_rent: z.number().positive("Room rent must be positive"),
  extra_occupant_days: z.number().min(0, "Days cannot be negative"),
  extra_occupant_rate: z.number().refine((v) => [20, 25, 30].includes(v), "Invalid rate"),
  curr_reading_id: z.string().min(1, "Current reading is required"),
  kwh_rate: z.number().positive("kWh rate must be positive"),
  notes: z.string().optional(),
});

export type CreateBillInput = z.infer<typeof CreateBillSchema>;

export const EditBillSchema = CreateBillSchema.omit({ tenant_id: true });

export type EditBillInput = z.infer<typeof EditBillSchema>;

/* Payments */

export const SubmitGCashPaymentSchema = z.object({
  bill_id: z.string().min(1, "Bill is required"),
  amount: z.number().positive("Amount must be positive"),
  gcash_screenshot_url: z.string().url("Invalid screenshot URL"),
  gcash_reference_note: z.string().optional(),
});

export type SubmitGCashPaymentInput = z.infer<typeof SubmitGCashPaymentSchema>;

export const VerifyPaymentSchema = z.object({
  payment_id: z.string().min(1, "Payment is required"),
  verified: z.boolean(),
  admin_note: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

/* Concerns */

export const CreateConcernSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  body: z.string().min(10, "Description must be at least 10 characters"),
});

export type CreateConcernInput = z.infer<typeof CreateConcernSchema>;

export const ReplyConcernSchema = z.object({
  concern_id: z.string().min(1, "Concern is required"),
  body: z.string().min(5, "Reply must be at least 5 characters"),
});

export type ReplyConcernInput = z.infer<typeof ReplyConcernSchema>;

export const UpdateConcernStatusSchema = z.object({
  concern_id: z.string().min(1, "Concern is required"),
  status: z.enum(["open", "in_progress", "resolved"]),
});

export type UpdateConcernStatusInput = z.infer<typeof UpdateConcernStatusSchema>;

/* Settings */

export const UpdateSettingsSchema = z.object({
  gcash_qr_url: z.string().url().optional(),
  kwh_default_rate: z.number().positive().optional(),
  extra_occupant_rate_default: z.number().refine((v) => [20, 25, 30].includes(v)).optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
