"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Flame, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/" : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const [error, setError] = useState("");
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

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9");
      return;
    }

    setIsLoading(true);
    try {
      await api.register(email.trim(), password, cleanPhone);
      await refreshAuth();
      router.push(redirectUrl);
    } catch (err: any) {
      let message = err.message || "Registration failed. Please try again.";
      if (message.includes("Invalid email") || message.includes("password")) {
        message = "Account exists but the password you entered is incorrect. Please sign in with the correct password.";
      }
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
        <div className="relative lg:col-span-5 hidden md:flex flex-col justify-between h-full min-h-[580px] rounded-[2rem] overflow-hidden p-8 text-white shadow-inner bg-neutral-900">
          
          {/* Background image overlay with warm glowing tone */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=80')"
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
              Join Camplife Community
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Create an Account & Start Camping
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Register now for priority booking, trek guide updates, and easy booking status tracking.
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
              Create an Account
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Already have an account?{" "}
              <Link 
                href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-extrabold text-neutral-900 underline hover:text-red-700 transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-600 space-y-2 animate-in fade-in">
              <div>{error}</div>
              {(error.includes("already exists") || error.includes("conflicts")) && (
                <Button
                  asChild
                  size="sm"
                  className="w-full rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-xs h-9 mt-1"
                >
                  <Link href={`/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}`}>
                    Sign In with existing account
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Registration Form */}
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

            {/* Mobile Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">10-Digit Mobile Number</label>
              <Input
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full rounded-full border border-neutral-300 px-5 py-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-black h-12 shadow-sm transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Password (min 6 characters)</label>
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
            </div>

            {/* Main Submit Button (Black Pill) */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-sm h-12 shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={18} className="text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Create Account"
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

          {/* Social / Quick Action Pills */}
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#420d0d]"><LoadingSpinner size={36} className="text-white" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
