"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldAlert, Mail, Lock, KeyRound, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

function AdminLoginContent() {
  const router = useRouter();
  const { adminLogin, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/admin" : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in as Admin, redirect straight to /admin
  useEffect(() => {
    if (isAdmin) {
      router.push(redirectUrl);
      return;
    }

    const paramEmail = searchParams ? searchParams.get("email") || "" : "";
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [isAdmin, redirectUrl, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Admin email is required");
      return;
    }
    if (!password) {
      setError("Admin password is required");
      return;
    }

    setIsLoading(true);
    try {
      await adminLogin(email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Invalid admin credentials. Please verify your credentials.");
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
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Restricted Access</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Admin Portal Authentication
          </h1>
          <p className="text-xs text-neutral-400">
            Sign in with administrator credentials to manage campsites and customer bookings
          </p>
        </div>



        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Admin Email</label>
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

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password</label>
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
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 h-11 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/10 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={18} className="text-white" />
                <span>Signing In to Admin Control...</span>
              </>
            ) : (
              "Sign In to Admin Control"
            )}
          </Button>

        </form>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Links */}
        <div className="flex justify-between items-center text-xs">
          <Link href="/" className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Main Site
          </Link>

          <Link href="/admin/signup" className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
            <UserPlus className="size-3.5" /> Register Admin
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[75vh] items-center justify-center"><LoadingSpinner size={36} /></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
