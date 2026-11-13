"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { LoginSchema, LoginInput } from "@/lib/validators";
import { createSupabaseClient } from "@/lib/supabase";
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
        // Set the adminSession cookie via the API so server actions can read it.
        const res = await fetch("/api/admin/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: data.email, password: data.password }),
        });
        if (!res.ok) { toast.error("Invalid admin credentials"); return; }
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
          .select("registration_status, role, account_status")
          .eq("id", authData.user.id)
          .single();

        if (userError || !userData) { toast.error("User profile not found"); return; }
        if (userData.account_status === "archived") {
          await supabase.auth.signOut();
          toast.error("This tenant account is archived. Contact the admin if you need access.");
          return;
        }
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
    <div className="auth-page">
      {/* Top bar */}
      <div className="auth-topbar">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
          <Home className="w-4 h-4" />
          RJ BoardHouse
        </Link>
      </div>

      {/* Card */}
      <main className="auth-layout">
        <aside className="auth-intro">
          <span className="auth-kicker">RJ BoardHouse · Davao City</span>
          <h1>Your home, with the details in good order.</h1>
          <p>Check your account, follow bills and payments, and reach management from one calm, private space.</p>
          <div className="auth-points">
            <span><Home size={16} /> A clear view of your stay</span>
            <span><Mail size={16} /> Updates tied to your account</span>
            <span><Lock size={16} /> Private, secure access</span>
          </div>
          <span className="auth-orbit" aria-hidden="true" />
        </aside>
        <div className="auth-form-column">
          {/* Header */}
          <div className="auth-heading">
            <div className="auth-mark">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h2>Sign in</h2>
            <p>Access your boarding house portal</p>
          </div>

          <div className="auth-card">
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
      </main>

      <footer className="auth-footer">
        © 2025 RJ BoardHouse
      </footer>
    </div>
  );
}
