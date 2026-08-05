"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Flame, Eye, EyeOff, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const { login, user } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/" : "/";

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Forgot password OTP states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect out
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

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

        await login(email.trim(), password);
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
    <div className="min-h-screen bg-gradient-to-br from-[#042f2e] via-[#064e3b] to-[#020617] flex items-center justify-center p-4 sm:p-6 md:p-10">
      
      {/* Main Split Layout Card (Matching Reference Design) */}
      <div className="w-full max-w-5xl rounded-[2.5rem] bg-white shadow-2xl p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden">
        
        {/* Left Side: Visual Hero Card */}
        <div className="relative lg:col-span-5 hidden md:flex flex-col justify-between h-full min-h-[560px] rounded-[2rem] overflow-hidden p-8 text-white shadow-inner bg-neutral-900">
          
          {/* Background image overlay with warm glowing tone */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-emerald-950/40 to-black/85" />

          {/* Top Logo Badge */}
          <div className="relative z-10 flex justify-center">
            <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Flame className="size-7 text-emerald-400 fill-emerald-400" />
            </div>
          </div>

          {/* Bottom Hero Tagline */}
          <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 backdrop-blur-md px-3 py-1 rounded-full inline-block border border-emerald-500/20">
              Camplife Uttarakhand
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Adventure Starts Where the Road Ends
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Unlock exclusive trekking camps, live availability, and instant bookings near Valley of Flowers.
            </p>
          </div>

        </div>

        {/* Right Side: High Contrast Clean Auth Form */}
        <div className="lg:col-span-7 px-2 sm:px-6 md:px-8 py-4 flex flex-col justify-center text-neutral-900">
          
          {/* Top Back Navigation Button */}
          <div className="mb-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Header Title & Mode Link */}
          <div className="mb-6 space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              {mode === "forgot" ? "Reset password" : "Log in"}
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              {mode === "forgot" ? (
                "Remember your password?"
              ) : (
                <>Don't have an account?</>
              )}{" "}
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                  className="font-extrabold text-neutral-900 underline hover:text-red-700 transition-colors"
                >
                  Log in
                </button>
              ) : (
                <Link 
                  href={`/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                  className="font-extrabold text-neutral-900 underline hover:text-red-700 transition-colors"
                >
                  Create an Account
                </Link>
              )}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 animate-in fade-in">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Email Address</label>
              <Input
                type="email"
                required
                placeholder="e.g. john52martinez@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-neutral-300 px-5 py-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-black h-12 shadow-sm transition-all"
              />
            </div>

            {/* Password Field (Login Mode) */}
            {mode === "login" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-full border border-neutral-300 px-5 pr-12 py-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-black h-12 shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="text-right pt-0.5">
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                    className="text-[11px] font-extrabold text-neutral-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}

            {/* OTP and New Password (Forgot Password Mode) */}
            {mode === "forgot" && otpSent && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800">6-Digit OTP</label>
                  <Input
                    type="text"
                    required
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-full border border-neutral-300 text-center tracking-widest text-base font-mono h-12 focus-visible:ring-2 focus-visible:ring-black shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800">New Password (min 6 chars)</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-full border border-neutral-300 px-5 py-3.5 text-xs text-neutral-900 h-12 focus-visible:ring-2 focus-visible:ring-black shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Main Submit Button (Black Pill matching screenshot) */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-sm h-12 shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={18} className="text-white" />
                  <span>Logging in...</span>
                </>
              ) : mode === "forgot" ? (
                otpSent ? "Reset Password" : "Send Reset OTP"
              ) : (
                "Log in"
              )}
            </Button>

            {/* Terms & Condition Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded text-black focus:ring-black size-4 cursor-pointer"
                />
                <span>
                  I agree to the <span className="font-bold underline text-neutral-900">Terms & Condition</span>
                </span>
              </label>
            </div>

          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-neutral-200"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              or
            </span>
          </div>

          {/* Social / Guest Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/packages')}
              className="flex-1 rounded-full border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 h-11 transition-all"
            >
              <Flame className="size-4 text-red-600 mr-1.5" /> Continue as Guest
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/login')}
              className="flex-1 rounded-full border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 h-11 transition-all"
            >
              <ShieldCheck className="size-4 text-emerald-600 mr-1.5" /> Admin Portal
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#420d0d]"><LoadingSpinner size={36} className="text-white" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
