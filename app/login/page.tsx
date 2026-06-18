"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { LoginSchema, LoginInput } from "@/lib/validators";
import { createSupabaseClient } from "@/lib/supabase";
import { isAdminCredentials } from "@/lib/session";
import { Mail, Lock, ChevronLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { userType: "tenant" },
  });

  const userType = watch("userType");

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      if (data.userType === "admin") {
        // Admin login with hardcoded credentials
        if (isAdminCredentials(data.email, data.password)) {
          // Store admin session in localStorage
          localStorage.setItem("adminSession", JSON.stringify({ email: data.email }));
          toast.success("Welcome Admin!");
          router.push("/admin/dashboard");
        } else {
          toast.error("Invalid admin credentials");
        }
      } else {
        // Tenant login with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (authError) {
          toast.error(authError.message || "Login failed");
          return;
        }

        // Check tenant registration status
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("registration_status, role")
          .eq("id", authData.user.id)
          .single();

        if (userError || !userData) {
          toast.error("User profile not found");
          return;
        }

        if (userData.registration_status === "pending") {
          toast.error("Your registration is pending admin approval");
          return;
        }

        if (userData.registration_status === "rejected") {
          toast.error("Your registration was rejected");
          return;
        }

        if (userData.role !== "tenant") {
          toast.error("Invalid user role");
          return;
        }

        toast.success("Welcome!");
        router.push("/tenant/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-nav">
          <Link href="/" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Sign In</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* User Type Toggle */}
          <div className="flex gap-3 bg-slate-100 p-1 rounded-lg">
            {[
              { value: "tenant", label: "Tenant" },
              { value: "admin", label: "Admin" },
            ].map((option) => (
              <label key={option.value} className="flex-1">
                <input
                  type="radio"
                  value={option.value}
                  {...register("userType")}
                  className="sr-only"
                />
                <div
                  className={`py-2 px-4 rounded-md font-medium text-center cursor-pointer transition-colors ${
                    userType === option.value
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 bg-transparent"
                  }`}
                >
                  {option.label}
                </div>
              </label>
            ))}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                {...register("email")}
                className="input pl-12"
              />
            </div>
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                {...register("password")}
                className="input pl-12"
              />
            </div>
            {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Help Text */}
          {userType === "admin" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Admin Login</p>
              <p className="text-xs text-blue-700">Contact your administrator for credentials</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg">
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          {/* Register Link */}
          {userType === "tenant" && (
            <div className="text-center pt-2">
              <p className="text-slate-600 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
