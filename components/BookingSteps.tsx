"use client";

import { Check, ClipboardList, CreditCard, ShieldCheck } from "lucide-react";

interface BookingStepsProps {
  currentStep: 1 | 2 | 3;
}

export function BookingSteps({ currentStep }: BookingStepsProps) {
  const steps = [
    {
      id: 1,
      name: "Guest Registry",
      description: "Fill traveler details",
      icon: ClipboardList,
    },
    {
      id: 2,
      name: "Checkout & Pay",
      description: "Submit UTR verification",
      icon: CreditCard,
    },
    {
      id: 3,
      name: "Owner Approval",
      description: "Await permit check",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-2">
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-neutral-100 dark:bg-neutral-800" />
        
        {/* Active Connecting Line Progress */}
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-600 transition-all duration-500" 
          style={{ 
            width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%" 
          }}
        />

        {/* Steps Loop */}
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Step Circle Badge */}
              <div 
                className={`flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" 
                    : isActive 
                      ? "border-emerald-600 bg-white text-emerald-600 dark:bg-neutral-950 shadow-lg shadow-emerald-600/5" 
                      : "border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-5 stroke-[3]" />
                ) : (
                  <StepIcon className="size-4.5" />
                )}
              </div>

              {/* Step Labels */}
              <div className="mt-2 text-center">
                <span 
                  className={`block text-[11px] font-extrabold tracking-tight transition-colors ${
                    isActive 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : isCompleted 
                        ? "text-neutral-800 dark:text-neutral-200" 
                        : "text-neutral-400"
                  }`}
                >
                  {step.name}
                </span>
                <span className="hidden sm:block text-[9px] text-neutral-400 mt-0.5">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
