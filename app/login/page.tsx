"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldCheck, Mail, Lock, KeyRound, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/" : "/";

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password OTP states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect out
  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      router.push(redirectUrl);
    }
  }, [redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        if (!password) {
          setError("Password is required");
          setIsLoading(false);
          return;
        }

        await api.login(email.trim(), password);

        // Small delay to ensure cookies are fully written before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push(redirectUrl);
      } else if (mode === "forgot") {
        if (!otpSent) {
          await api.requestPasswordResetOtp(email.trim());
          setOtpSent(true);
          setSuccessMsg("OTP sent to your email! Please enter the 6-digit OTP and your new password.");
        } else {
          if (!otp || otp.length !== 6) {
            setError("Please enter valid 6-digit OTP");
            setIsLoading(false);
            return;
          }
          if (!newPassword || newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            setIsLoading(false);
            return;
          }
          await api.confirmPasswordReset(email.trim(), otp.trim(), newPassword);
          setSuccessMsg("Password reset successfully! Please sign in with your new password.");
          setMode("login");
          setOtpSent(false);
        }
      }
    } catch (err: any) {
      const message = err.message || "Authentication failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 flex flex-col justify-center min-h-[70vh]">

      <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-2">
            {mode === "forgot" ? <KeyRound className="size-6" /> : <ShieldCheck className="size-6" />}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {mode === "forgot" ? "Reset Password" : "Welcome back"}
          </h1>
          <p className="text-xs text-neutral-400">
            {mode === "forgot"
              ? "Enter your registered email to receive a password reset OTP"
              : "Log in to manage your campsite bookings and payments"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="email"
                required
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Password (Login mode) */}
          {mode === "login" && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="size-4 text-neutral-400 absolute left-3" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30"
                />
              </div>
            </div>
          )}

          {/* OTP and New Password fields for Forgot Password */}
          {mode === "forgot" && otpSent && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">6-Digit OTP</label>
                <Input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="rounded-xl border-neutral-200 text-center tracking-widest text-lg font-mono focus-visible:ring-emerald-600/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">New Password (min 6 chars)</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-neutral-200 focus-visible:ring-emerald-600/30"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-11 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99]"
          >
            {isLoading ? (
              <LoadingSpinner size={20} className="text-white" />
            ) : mode === "forgot" ? (
              otpSent ? "Reset Password" : "Send Reset OTP"
            ) : (
              "Access Booking Portal"
            )}
          </Button>

        </form>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Links to Signup */}
        <div className="text-center">
          {mode === "forgot" ? (
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
                setOtpSent(false);
              }}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="size-3" /> Back to Sign In
            </button>
          ) : (
            <p className="text-xs text-neutral-500">
              New camper?{" "}
              <Link
                href={`/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="size-3.5 inline" /> Register an account
              </Link>
            </p>
          )}
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><LoadingSpinner size={36} /></div>}>
      <LoginContent />
    </Suspense>
  );
}
