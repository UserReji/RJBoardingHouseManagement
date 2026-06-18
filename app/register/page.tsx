"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { TenantRegistrationSchema, TenantRegistrationInput } from "@/lib/validators";
import { createSupabaseClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Contact" },
  { id: 4, label: "Emergency Contact" },
  { id: 5, label: "Valid ID & Rules" },
];

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createSupabaseClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading,   setIsLoading]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<TenantRegistrationInput>({
    resolver: zodResolver(TenantRegistrationSchema),
    mode: "onChange",
  });

  const stepFieldMap: Record<number, (keyof TenantRegistrationInput)[]> = {
    1: ["email", "password", "confirmPassword"],
    2: ["full_name", "birthday", "sex"],
    3: ["permanent_address", "contact_number"],
    4: ["emergency_contact_name", "emergency_contact_number"],
    5: ["valid_id_type", "valid_id_number", "agree_to_rules"],
  };

  const handleNext = async () => {
    const fields = stepFieldMap[currentStep];
    const valid  = await trigger(fields);
    if (valid) setCurrentStep((s) => s + 1);
  };

  const onSubmit = async (data: TenantRegistrationInput) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
      });
      if (authError) { toast.error(authError.message || "Registration failed"); return; }

      const { error: profileError } = await supabase.from("users").insert([{
        id:                       authData.user?.id,
        email:                    data.email,
        role:                     "tenant",
        registration_status:      "pending",
        full_name:                data.full_name,
        birthday:                 data.birthday,
        sex:                      data.sex,
        permanent_address:        data.permanent_address,
        contact_number:           data.contact_number,
        emergency_contact_name:   data.emergency_contact_name,
        emergency_contact_number: data.emergency_contact_number,
        valid_id_type:            data.valid_id_type,
        valid_id_number:          data.valid_id_number,
        created_at:               new Date().toISOString(),
      }]);

      if (profileError) { toast.error(profileError.message || "Failed to create profile"); return; }

      toast.success("Registration submitted! Awaiting admin approval.");
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const Field = ({
    id, label, error, children,
  }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-sm mx-auto px-5 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => currentStep > 1 ? setCurrentStep((s) => s - 1) : router.push("/")}
            className="btn btn-ghost btn-icon"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-900">Create Account</p>
            <p className="text-xs text-slate-400">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}</p>
          </div>
          <Link href="/" className="btn btn-ghost btn-icon">
            <Home className="w-4 h-4" />
          </Link>
        </div>
        {/* Progress bar */}
        <div className="flex gap-0.5 px-5 pb-3 max-w-sm mx-auto">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                step.id <= currentStep ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 py-6 px-5">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Step 1: Account */}
            {currentStep === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
                  <p className="text-sm text-slate-500 mt-1">You'll use these credentials to log in.</p>
                </div>
                <Field id="email" label="Email Address" error={errors.email?.message}>
                  <input type="email" id="email" placeholder="you@example.com"
                    {...register("email")} className={`input ${errors.email ? "error" : ""}`} />
                </Field>
                <Field id="password" label="Password" error={errors.password?.message}>
                  <input type="password" id="password" placeholder="At least 8 characters"
                    {...register("password")} className={`input ${errors.password ? "error" : ""}`} />
                </Field>
                <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword?.message}>
                  <input type="password" id="confirmPassword" placeholder="••••••••"
                    {...register("confirmPassword")} className={`input ${errors.confirmPassword ? "error" : ""}`} />
                </Field>
                <p className="text-center text-sm text-slate-500 pt-2">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
                </p>
              </>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Personal information</h2>
                  <p className="text-sm text-slate-500 mt-1">As it appears on your valid ID.</p>
                </div>
                <Field id="full_name" label="Full Name" error={errors.full_name?.message}>
                  <input type="text" id="full_name" placeholder="Your full name"
                    {...register("full_name")} className={`input ${errors.full_name ? "error" : ""}`} />
                </Field>
                <Field id="birthday" label="Birthday" error={errors.birthday?.message}>
                  <input type="date" id="birthday"
                    {...register("birthday")} className={`input ${errors.birthday ? "error" : ""}`} />
                </Field>
                <Field id="sex" label="Sex" error={errors.sex?.message}>
                  <select id="sex" {...register("sex")} className={`select ${errors.sex ? "error" : ""}`}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </>
            )}

            {/* Step 3: Contact */}
            {currentStep === 3 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contact details</h2>
                  <p className="text-sm text-slate-500 mt-1">How can we reach you?</p>
                </div>
                <Field id="permanent_address" label="Permanent Address" error={errors.permanent_address?.message}>
                  <textarea id="permanent_address" placeholder="Street, Barangay, City, Province"
                    rows={3} {...register("permanent_address")}
                    className={`input resize-none ${errors.permanent_address ? "error" : ""}`} />
                </Field>
                <Field id="contact_number" label="Contact Number" error={errors.contact_number?.message}>
                  <input type="tel" id="contact_number" placeholder="09xxxxxxxxx"
                    {...register("contact_number")} className={`input ${errors.contact_number ? "error" : ""}`} />
                </Field>
              </>
            )}

            {/* Step 4: Emergency Contact */}
            {currentStep === 4 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Emergency contact</h2>
                  <p className="text-sm text-slate-500 mt-1">Someone we can contact in case of emergency.</p>
                </div>
                <Field id="emergency_contact_name" label="Full Name" error={errors.emergency_contact_name?.message}>
                  <input type="text" id="emergency_contact_name" placeholder="Contact person's name"
                    {...register("emergency_contact_name")}
                    className={`input ${errors.emergency_contact_name ? "error" : ""}`} />
                </Field>
                <Field id="emergency_contact_number" label="Contact Number" error={errors.emergency_contact_number?.message}>
                  <input type="tel" id="emergency_contact_number" placeholder="09xxxxxxxxx"
                    {...register("emergency_contact_number")}
                    className={`input ${errors.emergency_contact_number ? "error" : ""}`} />
                </Field>
              </>
            )}

            {/* Step 5: Valid ID & Rules */}
            {currentStep === 5 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">ID & House Rules</h2>
                  <p className="text-sm text-slate-500 mt-1">Present a valid government-issued ID.</p>
                </div>
                <Field id="valid_id_type" label="ID Type" error={errors.valid_id_type?.message}>
                  <select id="valid_id_type" {...register("valid_id_type")}
                    className={`select ${errors.valid_id_type ? "error" : ""}`}>
                    <option value="">Select ID Type</option>
                    <option value="National ID">National ID (PhilSys)</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver's License</option>
                    <option value="UMID">UMID</option>
                    <option value="Voter's ID">Voter's ID</option>
                    <option value="Student ID">Student ID</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field id="valid_id_number" label="ID Number" error={errors.valid_id_number?.message}>
                  <input type="text" id="valid_id_number" placeholder="ID number"
                    {...register("valid_id_number")}
                    className={`input ${errors.valid_id_number ? "error" : ""}`} />
                </Field>

                {/* Rules */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Boarding House Rules</p>
                  <ul className="text-sm text-blue-700 space-y-1.5">
                    {[
                      "Quiet hours from 10 PM to 8 AM",
                      "Keep all common areas clean",
                      "No guests allowed after 10 PM",
                      "Rent is due at the start of each month",
                      "Report damages or concerns immediately",
                    ].map((rule) => (
                      <li key={rule} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input type="checkbox" {...register("agree_to_rules")} className="checkbox mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">
                    I have read and agree to the boarding house rules and policies
                  </span>
                </label>
                {errors.agree_to_rules && (
                  <p className="text-red-500 text-xs font-medium">{errors.agree_to_rules.message}</p>
                )}
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button type="button" onClick={() => setCurrentStep((s) => s - 1)}
                  className="btn btn-secondary btn-lg flex-1">
                  Back
                </button>
              )}
              {currentStep < STEPS.length ? (
                <button type="button" onClick={handleNext} className="btn btn-primary btn-lg flex-1">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg flex-1">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </span>
                  ) : "Submit Registration"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
