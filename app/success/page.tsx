import Link from "next/link";
import { CheckCircle2, Calendar, Mail, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      
      {/* Visual confirmation badge */}
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6 dark:bg-emerald-950/50 dark:text-emerald-400 animate-bounce">
        <CheckCircle2 className="size-12" />
      </div>

      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider block mb-1">Receipt Confirmed</span>
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
        Booking Submitted Successfully!
      </h1>
      
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed max-w-md mx-auto">
        Your payment proof has been received. Our team will verify your transaction reference number shortly.
      </p>

      {/* Info Card blocks */}
      <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900 text-left my-8 space-y-4">
        <h4 className="font-bold text-sm text-neutral-800 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Next Steps</h4>
        
        <ul className="space-y-3.5 text-xs text-neutral-500 dark:text-neutral-400">
          <li className="flex items-start gap-3">
            <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              <FileText className="size-3.5" />
            </div>
            <div>
              <strong className="text-neutral-800 dark:text-neutral-200 block mb-0.5">Verification (1-2 Hours)</strong>
              <span>Our accounts team matches the UTR reference with our bank logs.</span>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              <Mail className="size-3.5" />
            </div>
            <div>
              <strong className="text-neutral-800 dark:text-neutral-200 block mb-0.5">Receipt & Permit (Email)</strong>
              <span>Once approved, a booking voucher and instructions will be sent to your registered email.</span>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              <Calendar className="size-3.5" />
            </div>
            <div>
              <strong className="text-neutral-800 dark:text-neutral-200 block mb-0.5">Forest Permits</strong>
              <span>Trek coordinators will meet you at Govindghat to process official park entries.</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button asChild size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Link href="/" className="flex items-center gap-1">
            Back to Home <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800">
          <Link href="/faq">
            Read Trek FAQs
          </Link>
        </Button>
      </div>

    </div>
  );
}
