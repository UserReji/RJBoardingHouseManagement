"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { TenantRegistrationSchema, TenantRegistrationInput } from "@/lib/validators";
import { createSupabaseClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Emergency Contact" },
  { id: 4, label: "Valid ID" },
  { id: 5, label: "Agree to Rules" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<TenantRegistrationInput>({
    resolver: zodResolver(TenantRegistrationSchema),
    mode: "onChange",
  });

  const password = watch("password");

  const handleNext = async () => {
    const values = getValues();
    // Validate current step fields before moving to next
    const stepFields: Record<number, (keyof TenantRegistrationInput)[]> = {
      1: ["email", "password", "confirmPassword"],
      2: ["full_name", "birthday", "sex"],
      3: ["permanent_address", "contact_number"],
      4: ["emergency_contact_name", "emergency_contact_number"],
      5: ["valid_id_type", "valid_id_number", "agree_to_rules"],
    };

    // Simple validation - just check if we can move forward
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (data: TenantRegistrationInput) => {
    setIsLoading(true);
    try {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error(authError.message || "Registration failed");
        return;
      }

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user?.id,
          email: data.email,
          role: "tenant",
          registration_status: "pending",
          full_name: data.full_name,
          birthday: data.birthday,
          sex: data.sex,
          permanent_address: data.permanent_address,
          contact_number: data.contact_number,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_number: data.emergency_contact_number,
          valid_id_type: data.valid_id_type,
          valid_id_number: data.valid_id_number,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        toast.error(profileError.message || "Failed to create profile");
        return;
      }

      toast.success("Registration successful! Awaiting admin approval.");
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-nav">
          <Link
            href={currentStep === 1 ? "/" : "#"}
            onClick={(e) => {
              if (currentStep > 1) {
                e.preventDefault();
                setCurrentStep(currentStep - 1);
              }
            }}
            className="btn btn-ghost btn-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Register</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2 mb-3">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step.id <= currentStep ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-600">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Step 1: Account */}
          {currentStep === 1 && (
            <>
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="input"
                />
                {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="input"
                />
                {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="input"
                />
                {errors.confirmPassword && (
                  <p className="text-danger text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </>
          )}

          {/* Step 2: Personal Info */}
          {currentStep === 2 && (
            <>
              <div>
                <label htmlFor="full_name" className="label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  placeholder="John Doe"
                  {...register("full_name")}
                  className="input"
                />
                {errors.full_name && <p className="text-danger text-sm mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label htmlFor="birthday" className="label">
                  Birthday
                </label>
                <input
                  type="date"
                  id="birthday"
                  {...register("birthday")}
                  className="input"
                />
                {errors.birthday && <p className="text-danger text-sm mt-1">{errors.birthday.message}</p>}
              </div>

              <div>
                <label htmlFor="sex" className="label">
                  Sex
                </label>
                <select id="sex" {...register("sex")} className="select">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.sex && <p className="text-danger text-sm mt-1">{errors.sex.message}</p>}
              </div>
            </>
          )}

          {/* Step 3: Emergency Contact & Permanent Address */}
          {currentStep === 3 && (
            <>
              <div>
                <label htmlFor="permanent_address" className="label">
                  Permanent Address
                </label>
                <textarea
                  id="permanent_address"
                  placeholder="Enter your permanent address"
                  rows={3}
                  {...register("permanent_address")}
                  className="input"
                />
                {errors.permanent_address && (
                  <p className="text-danger text-sm mt-1">{errors.permanent_address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact_number" className="label">
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="contact_number"
                  placeholder="09xxxxxxxxx"
                  {...register("contact_number")}
                  className="input"
                />
                {errors.contact_number && (
                  <p className="text-danger text-sm mt-1">{errors.contact_number.message}</p>
                )}
              </div>
            </>
          )}

          {/* Step 4: Emergency Contact */}
          {currentStep === 4 && (
            <>
              <div>
                <label htmlFor="emergency_contact_name" className="label">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  placeholder="Emergency contact full name"
                  {...register("emergency_contact_name")}
                  className="input"
                />
                {errors.emergency_contact_name && (
                  <p className="text-danger text-sm mt-1">{errors.emergency_contact_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergency_contact_number" className="label">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  id="emergency_contact_number"
                  placeholder="09xxxxxxxxx"
                  {...register("emergency_contact_number")}
                  className="input"
                />
                {errors.emergency_contact_number && (
                  <p className="text-danger text-sm mt-1">{errors.emergency_contact_number.message}</p>
                )}
              </div>
            </>
          )}

          {/* Step 5: Valid ID & Rules Agreement */}
          {currentStep === 5 && (
            <>
              <div>
                <label htmlFor="valid_id_type" className="label">
                  Valid ID Type
                </label>
                <select id="valid_id_type" {...register("valid_id_type")} className="select">
                  <option value="">Select ID Type</option>
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Student ID">Student ID</option>
                </select>
                {errors.valid_id_type && (
                  <p className="text-danger text-sm mt-1">{errors.valid_id_type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="valid_id_number" className="label">
                  Valid ID Number
                </label>
                <input
                  type="text"
                  id="valid_id_number"
                  placeholder="ID number"
                  {...register("valid_id_number")}
                  className="input"
                />
                {errors.valid_id_number && (
                  <p className="text-danger text-sm mt-1">{errors.valid_id_number.message}</p>
                )}
              </div>

              <div className="card p-4 bg-blue-50 border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-3">Boarding House Rules</p>
                <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                  <li>Quiet hours from 10 PM to 8 AM</li>
                  <li>Keep common areas clean and organized</li>
                  <li>No guests allowed after 10 PM</li>
                  <li>Pay rent on time every month</li>
                  <li>Report damages or concerns immediately</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("agree_to_rules")}
                  className="checkbox mt-1"
                />
                <span className="text-sm text-slate-700">
                  I agree to the boarding house rules and policies
                </span>
              </label>
              {errors.agree_to_rules && (
                <p className="text-danger text-sm">{errors.agree_to_rules.message}</p>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn btn-secondary btn-lg flex-1"
              >
                Back
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary btn-lg flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg flex-1"
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </button>
            )}
          </div>

          {/* Login Link */}
          {currentStep === 1 && (
            <div className="text-center py-2">
              <p className="text-slate-600 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
