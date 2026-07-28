"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldAlert, Mail, Phone, Lock, LogIn, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function AdminSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/admin" : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as Admin, redirect to /admin
  useEffect(() => {
    const adminUser = api.getAdminUser();
    if (adminUser) {
      router.push(redirectUrl);
    }
  }, [redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Admin email address is required");
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
      // 1. Register admin user
      await api.adminRegister(email.trim(), password, cleanPhone);

      // 2. Log in as admin
      await api.adminLogin(email.trim(), password);
      window.dispatchEvent(new Event("storage"));
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Admin registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 flex flex-col justify-center min-h-[75vh]">
      
      <div className="rounded-[2.5rem] border border-amber-200/60 bg-white p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900/80 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 mb-2 border border-amber-200/50">
            <ShieldAlert className="size-7" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Restricted Registration</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Register Administrator
          </h1>
          <p className="text-xs text-neutral-400">
            Create an administrator account to control system campsites and bookings
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
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 mt-1"
              >
                <Link href={`/admin/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}`}>
                  Admin Sign In with {email || "this email"} →
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Admin Email *</label>
            <div className="relative flex items-center">
              <Mail className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="email"
                required
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-amber-500/30"
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
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-amber-500/30"
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
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 h-11 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-600/10 active:scale-[0.99]"
          >
            {isLoading ? (
              <LoadingSpinner size={20} className="text-white" />
            ) : (
              <>
                <CheckCircle2 className="size-4" /> Register Admin Account
              </>
            )}
          </Button>

        </form>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Links */}
        <div className="flex justify-between items-center text-xs">
          <Link href="/" className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Main Site
          </Link>

          <Link href="/admin/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
            <LogIn className="size-3.5" /> Admin Sign In
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[75vh] items-center justify-center"><LoadingSpinner size={36} /></div>}>
      <AdminSignupContent />
    </Suspense>
  );
}
