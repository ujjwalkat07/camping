import { BookingForm } from "@/components/BookingForm";
import { ShieldAlert } from "lucide-react";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BookingSteps } from "@/components/BookingSteps";

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 space-y-8">
      
      {/* Step Indicator */}
      <BookingSteps currentStep={1} />

      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Campsite Booking</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">Secure Your Campsite</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Please fill out traveler details accurately. A Booking ID will be generated to submit the UPI payment verification.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Booking alert badge */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-950/20 dark:bg-amber-950/10 flex items-start gap-2.5">
          <ShieldAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
            <strong>Important:</strong> Entry permits for Valley of Flowers National Park must be purchased separately at the forest checkpoint in Ghangaria. Our guides will coordinate this process for you on Day 2.
          </p>
        </div>

        {/* Booking Form component inside Suspense boundary */}
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>}>
          <BookingForm />
        </Suspense>

      </div>

    </div>
  );
}
