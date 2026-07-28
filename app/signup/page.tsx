"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserPlus, Mail, Phone, Lock, LogIn, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/" : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [error, setError] = useState("");
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
      // The /api/auth/signup route handles both registration and login,
      // and sets httpOnly cookies for tokens server-side.
      await api.register(email.trim(), password, cleanPhone);

      // Small delay to ensure cookies are fully written before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
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
    <div className="mx-auto max-w-md px-4 py-16 flex flex-col justify-center min-h-[70vh]">
      
      <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-2">
            <UserPlus className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-xs text-neutral-400">
            Sign up to start booking high-altitude campsite packages
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive space-y-2">
            <div>{error}</div>
            {(error.includes("already exists") || error.includes("conflicts")) && (
              <Button
                asChild
                size="sm"
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 mt-1"
              >
                <Link href={`/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}`}>
                  Sign In with {email || "this email"} →
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address *</label>
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

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Mobile Number (10 digits) *</label>
            <div className="relative flex items-center">
              <Phone className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30"
              />
            </div>
            <p className="text-[10px] text-neutral-400 pl-1">Must start with 6, 7, 8, or 9</p>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password (min 6 chars) *</label>
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-11 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99]"
          >
            {isLoading ? (
              <LoadingSpinner size={20} className="text-white" />
            ) : (
              <>
                <CheckCircle2 className="size-4" /> Register Account
              </>
            )}
          </Button>

        </form>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Link to Login */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <LogIn className="size-3.5 inline" /> Sign In
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><LoadingSpinner size={36} /></div>}>
      <SignupContent />
    </Suspense>
  );
}
