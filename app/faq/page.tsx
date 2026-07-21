"use client";

import { useEffect, useState } from "react";
import { api, FAQ } from "@/services/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getFAQs();
        setFaqs(data);
      } catch (err) {
        console.error("Error loading FAQs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFAQs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Got Questions?</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">Help & FAQ Center</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Find information about base camps, climate conditions, safety procedures, gear, and booking payments.
        </p>
      </div>

      {/* FAQs List */}
      {faqs.length > 0 ? (
        <Accordion className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${index}`}
              className="border border-neutral-100 rounded-[2rem] bg-white px-6 py-1.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm"
            >
              <AccordionTrigger className="text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
          <HelpCircle className="size-12 text-neutral-300 mb-3" />
          <h3 className="text-lg font-bold text-neutral-800 dark:text-white">No FAQs Found</h3>
        </div>
      )}

    </div>
  );
}
