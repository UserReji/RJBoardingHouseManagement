"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { LoginSchema, LoginInput } from "@/lib/validators";
import { createSupabaseClient, isValidAdminCredentials } from "@/lib/supabase";
import { Mail, Lock, Home, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { userType: "tenant" },
    shouldFocusError: false,
  });

  const userType = watch("userType");

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      if (data.userType === "admin") {
        if (!isValidAdminCredentials(data.email, data.password)) {
          toast.error("Invalid admin credentials");
          return;
        }
        // Set the adminSession cookie via the API so server actions can read it.
        const res = await fetch("/api/admin/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: data.email, password: data.password }),
        });
        if (!res.ok) { toast.error("Could not start admin session"); return; }
        localStorage.setItem("adminSession", JSON.stringify({ email: data.email }));
        toast.success("Welcome back, Admin!");
        router.push("/admin/dashboard");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (authError) { toast.error(authError.message || "Login failed"); return; }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("registration_status, role")
          .eq("id", authData.user.id)
          .single();

        if (userError || !userData) { toast.error("User profile not found"); return; }
        if (userData.registration_status === "pending") {
          toast.error("Your registration is pending admin approval");
          return;
        }
        if (userData.registration_status === "rejected") {
          toast.error("Your registration was rejected. Contact the admin.");
          return;
        }
        if (userData.role !== "tenant") { toast.error("Invalid user role"); return; }

        toast.success("Welcome back!");
        router.push("/tenant/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Top bar */}
      <div className="px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
          <Home className="w-4 h-4" />
          RJ BoardHouse
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1.5">Access your boarding house portal</p>
          </div>

          <div className="card-elevated p-6">
            {/* User type toggle */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
              {[
                { value: "tenant", label: "Tenant" },
                { value: "admin", label: "Admin" },
              ].map((opt) => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    {...register("userType")}
                    className="sr-only"
                  />
                  <div
                    className={`py-2 text-center text-sm font-semibold rounded-lg transition-all ${
                      userType === opt.value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`input pl-10 ${errors.email ? "error" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`input pl-10 pr-10 ${errors.password ? "error" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Admin hint */}
              {userType === "admin" && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                  <p className="font-semibold text-blue-800 text-xs">Admin access</p>
                  <p className="text-blue-600 text-xs mt-0.5">Use your administrator credentials</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {userType === "tenant" && (
              <p className="text-center text-sm text-slate-500 mt-5">
                No account yet?{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                  Register here
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-5">
        © 2025 RJ BoardHouse
      </footer>
    </div>
  );
}
