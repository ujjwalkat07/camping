"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldCheck, Mail, User as UserIcon, Lock } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/" : "/";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect them out
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

    if (isSignUp && !name.trim()) {
      setError("Full Name is required for registration");
      return;
    }

    setIsLoading(true);
    try {
      // Mock login / signup
      const user = await api.login(email.trim(), isSignUp ? name.trim() : undefined);
      
      // Dispatch storage event to notify Navbar of auth state update
      window.dispatchEvent(new Event("storage"));
      
      // Redirect back
      router.push(redirectUrl);
    } catch (err) {
      setError("Authentication failed. Please check details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 flex flex-col justify-center min-h-[70vh]">
      
      <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-2">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-xs text-neutral-400">
            {isSignUp ? "Sign up to start booking adventure camps" : "Log in to manage your bookings and payments"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              {error}
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="size-4 text-neutral-400 absolute left-3" />
                <Input
                  type="text"
                  placeholder="e.g. Priyanth Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="email"
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Password (Mock input) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password</label>
            <div className="relative flex items-center">
              <Lock className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="password"
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
              isSignUp ? "Register Account" : "Access Booking Portal"
            )}
          </Button>

        </form>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Toggle Mode */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {isSignUp ? "Already have an account? Sign In" : "New camper? Register an account"}
          </button>
        </div>

      </div>

    </div>
  );
}

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><LoadingSpinner size={36} /></div>}>
      <LoginContent />
    </Suspense>
  );
}
