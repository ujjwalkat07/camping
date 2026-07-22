"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api, Booking, User } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Copy, Check, Upload, ShieldCheck, ArrowLeft, Users, Calendar, Mail, Phone, Eye } from "lucide-react";
import Link from "next/link";
import { BookingSteps } from "@/components/BookingSteps";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams?.get("bookingId") || "";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const upiId = "camplife@ybl";

  // Check login and fetch booking details
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/payment?bookingId=${bookingId}`);
      return;
    }
    setCurrentUser(user);

    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        setIsLoading(true);
        const data = await api.getBookingById(bookingId);
        if (data) {
          setBooking(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooking();
  }, [bookingId, router]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    if (!utrNumber.trim()) {
      setError("Please enter the UTR/Transaction Reference Number");
      return;
    }

    if (utrNumber.trim().length < 8) {
      setError("Please enter a valid UTR number (minimum 8 digits)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await api.submitPaymentProof(bookingId, utrNumber, screenshotName || "payment_proof.png");
      if (success) {
        // Redirect to Dashboard as requested (showing status: pending)
        router.push("/dashboard");
      } else {
        setError("Failed to register payment proof. Please verify the Booking ID.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Booking Session Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          Please initiate a campsite booking request first to access the checkout gateway.
        </p>
        <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/booking">
            Go to Booking Page
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8">
      
      {/* Step Indicator */}
      <BookingSteps currentStep={2} />

      {/* Back to Booking */}
      <Link href="/booking" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="size-4" /> Edit Booking Details
      </Link>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Step 2: Checkout</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Verify details & Submit Payment</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Please double-check the travelers list details below. Pay via the UPI QR code and submit details to complete the request.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Traveler Details Verification & Price Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Booking Summary Box */}
          <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-800 dark:text-white border-b pb-2 border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Eye className="size-4 text-emerald-600" /> Verify Booking & Guest Info
            </h3>

            {/* General package details row */}
            <div className="grid gap-4 sm:grid-cols-3 text-xs bg-slate-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-0.5">Selected Campsite</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{booking.packageName}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-0.5">Travel Date</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                  <Calendar className="size-3.5 text-neutral-400" /> {booking.travelDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-0.5">Contact Email</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                  <Mail className="size-3.5 text-neutral-400" /> {booking.email}
                </span>
              </div>
            </div>

            {/* Traveler list detail cards */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">Travellers Registration details:</span>
              
              <div className="grid gap-3">
                {booking.travelers.map((t, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl p-3 border border-neutral-100 bg-slate-50/30 dark:border-neutral-800/80 dark:bg-neutral-900/50 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          #{idx + 1} {t.fullName}
                        </span>
                        <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-400">
                          {t.gender}, {t.age} yrs
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        ID: {t.idProofType} - <span className="font-mono text-neutral-600 dark:text-neutral-300">{t.idProofNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Request */}
            {booking.specialRequests && (
              <div className="pt-2 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Special Requests:</span>
                <p className="text-neutral-500 dark:text-neutral-400 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 dark:bg-neutral-950 dark:border-neutral-800">
                  {booking.specialRequests}
                </p>
              </div>
            )}

          </div>

          {/* Pricing detail box */}
          <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex justify-between items-center">
            <div>
              <span className="text-xs text-neutral-400 block">Total Est. Checkout Cost</span>
              <span className="text-[10px] text-neutral-400">• Adults: {booking.adults}, Children: {booking.children}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: QR Code & Payment proof submit (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/50 flex flex-col items-center text-center space-y-5">
            
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block">Booking ID Session</span>
              <span className="text-sm font-extrabold text-neutral-800 dark:text-emerald-500 font-mono">{booking.bookingId}</span>
            </div>

            {/* SVG QR Code */}
            <div className="relative rounded-2xl bg-neutral-50 p-4 border border-neutral-100 dark:bg-neutral-950 dark:border-neutral-800 flex items-center justify-center size-44 shadow-inner">
              <svg viewBox="0 0 100 100" className="size-36 text-neutral-800 dark:text-white" fill="currentColor">
                <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" />
                <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" />
                <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" />
                <path d="M45,10 h10 v10 h-10 z M45,25 h10 v10 h-10 z M50,45 h10 v10 h-10 z M65,45 h10 v10 h-10 z M75,45 h20 v10 h-20 z" />
                <path d="M45,65 h10 v20 h-10 z M55,75 h10 v10 h-10 z M65,65 h20 v10 h-20 z M80,80 h10 v10 h-10 z M65,85 h10 v10 h-10 z" />
                <rect x="42" y="42" width="16" height="16" rx="4" fill="#0f9d58" />
                <circle cx="50" cy="50" r="4" fill="white" />
              </svg>
            </div>

            {/* UPI Copy */}
            <div className="w-full">
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">UPI Address Details</span>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-neutral-100 p-2 text-xs font-semibold text-neutral-800 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200">
                <span className="pl-1.5">{upiId}</span>
                <button
                  onClick={handleCopyUpi}
                  className="flex size-7 items-center justify-center rounded-lg bg-white shadow-sm border border-neutral-100 hover:bg-neutral-50 active:scale-95 text-neutral-500 hover:text-neutral-800 dark:bg-neutral-900 dark:border-neutral-800"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800 w-full" />

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
              
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              {/* UTR */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">UTR / Reference ID *</label>
                <Input
                  type="text"
                  placeholder="12-digit transaction ID"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="rounded-xl h-9 text-xs border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30"
                />
              </div>

              {/* Screen Upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Payment Receipt File</label>
                
                <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-slate-50/50 p-4 text-center hover:bg-slate-50 transition-colors dark:border-neutral-800 dark:bg-neutral-950/20 dark:hover:bg-neutral-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <Upload className="size-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 block">
                    {screenshotName ? "File selected" : "Click to select a file"}
                  </span>
                  <span className="text-[8px] text-neutral-400">
                    {screenshotName ? screenshotName : "PNG, JPG up to 5MB"}
                  </span>
                </div>
              </div>

              {/* Submit Payment Proof */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-10 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size={16} className="text-white mr-1.5" />
                    Submitting Payment Details...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" /> Submit Final Booking
                  </>
                )}
              </Button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}

import { Suspense } from "react";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950"><LoadingSpinner size={36} /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
