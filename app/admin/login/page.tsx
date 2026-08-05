"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldAlert, Eye, EyeOff, ArrowLeft, ShieldCheck, Flame } from "lucide-react";
import Link from "next/link";

function AdminLoginContent() {
  const router = useRouter();
  const { adminLogin, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/admin" : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#042f2e] via-[#064e3b] to-[#020617] flex items-center justify-center p-4 sm:p-6 md:p-10">
      
      {/* Main Split Layout Card (Matching Reference Design) */}
      <div className="w-full max-w-5xl rounded-[2.5rem] bg-white shadow-2xl p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden">
        
        {/* Left Side: Visual Hero Card */}
        <div className="relative lg:col-span-5 hidden md:flex flex-col justify-between h-full min-h-[540px] rounded-[2rem] overflow-hidden p-8 text-white shadow-inner bg-slate-900">
          
          {/* Background image overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-slate-950/50 to-black/90" />

          {/* Top Logo Badge */}
          <div className="relative z-10 flex justify-center">
            <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <ShieldAlert className="size-7 text-amber-400" />
            </div>
          </div>

          {/* Bottom Hero Tagline */}
          <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-950/60 backdrop-blur-md px-3 py-1 rounded-full inline-block border border-amber-500/20">
              Restricted Operations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Camplife Admin Console
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage booking updates, payment verifications, campsite inventory, and traveler communications.
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

          {/* Header Title */}
          <div className="mb-6 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block">Authorized Access Only</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              Admin Log in
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Enter your administrator credentials to access the management portal.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Admin Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Admin Email</label>
              <Input
                type="email"
                required
                placeholder="admin@camplife.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-neutral-300 px-5 py-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-black h-12 shadow-sm transition-all"
              />
            </div>

            {/* Password Field */}
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
                  <span>Authenticating...</span>
                </>
              ) : (
                "Log in to Admin Console"
              )}
            </Button>

          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-neutral-200"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              or
            </span>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/login')}
              className="flex-1 rounded-full border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 h-11 transition-all"
            >
              <Flame className="size-4 text-red-600 mr-1.5" /> Traveler Sign In
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/signup')}
              className="flex-1 rounded-full border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 h-11 transition-all"
            >
              <ShieldCheck className="size-4 text-emerald-600 mr-1.5" /> Create Account
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0f172a]"><LoadingSpinner size={36} className="text-white" /></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
