"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Package } from "@/services/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Clock, Utensils, Home, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

export default function PackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPackageById(id);
        setPkg(data);
      } catch (err) {
        console.error("Error loading package details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Package Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          The requested camping package doesn't exist or has been discontinued.
        </p>
        <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/packages">
            Back to Packages Catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      
      {/* Back Button */}
      <Link href="/packages" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-emerald-600 transition-colors mb-6">
        <ArrowLeft className="size-4" /> Back to Packages Catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column (Images, description, itinerary, details) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Title Header */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1">
              <MapPin className="size-3.5 text-emerald-500" />
              <span>{pkg.location}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              {pkg.name}
            </h1>
          </div>

          {/* Image Display */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 aspect-video shadow-md border border-neutral-100 dark:border-neutral-800">
              <img
                src={pkg.images[activeImageIndex]}
                alt={pkg.name}
                className="h-full w-full object-cover transition-all duration-300"
              />
            </div>
            
            {/* Small image previews list */}
            {pkg.images.length > 1 && (
              <div className="flex gap-3">
                {pkg.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative overflow-hidden rounded-xl size-16 sm:size-20 border-2 transition-all ${
                      idx === activeImageIndex
                        ? "border-emerald-600 scale-[1.03]"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="preview" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Campsite Overview</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {pkg.description}
            </p>
          </div>

          {/* Key details icons grid */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 p-5 rounded-[2rem]">
            
            <div className="flex flex-col items-center text-center p-2">
              <Clock className="size-5 text-emerald-600 mb-1.5" />
              <span className="text-[10px] text-neutral-400 font-medium">Duration</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{pkg.duration}</span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <Home className="size-5 text-emerald-600 mb-1.5" />
              <span className="text-[10px] text-neutral-400 font-medium">Stay Option</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 max-w-[120px] line-clamp-1">{pkg.stay}</span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <Utensils className="size-5 text-emerald-600 mb-1.5" />
              <span className="text-[10px] text-neutral-400 font-medium">Meals Type</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Buffet / Local</span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <MapPin className="size-5 text-emerald-600 mb-1.5" />
              <span className="text-[10px] text-neutral-400 font-medium">Location</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Ghangaria</span>
            </div>

          </div>

          {/* Itinerary */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Day-by-Day Itinerary</h3>
            <Accordion className="w-full space-y-2">
              {pkg.itinerary.map((day) => (
                <AccordionItem
                  key={day.day}
                  value={`day-${day.day}`}
                  className="border border-neutral-100 rounded-2xl bg-white px-5 py-0.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm"
                >
                  <AccordionTrigger className="text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:no-underline">
                    Day {day.day}: {day.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      {day.activities.map((act, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Meals & Stay details */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Meals info */}
            <div className="space-y-3 p-5 rounded-[2rem] border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
              <h4 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2">
                <Utensils className="size-4 text-emerald-600" /> Meals Information
              </h4>
              <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                {pkg.meals.map((meal, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{meal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stay info */}
            <div className="space-y-3 p-5 rounded-[2rem] border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
              <h4 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2">
                <Home className="size-4 text-emerald-600" /> Stay Details
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {pkg.stay}
              </p>
            </div>
          </div>

          {/* Inclusions / Exclusions Column matrix */}
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Inclusions */}
            <div className="space-y-3 p-5 rounded-[2rem] border border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/20 dark:bg-emerald-950/5 shadow-sm">
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" /> Inclusions
              </h4>
              <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                {pkg.inclusions.map((inc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="space-y-3 p-5 rounded-[2rem] border border-rose-100 bg-rose-50/20 dark:border-rose-950/20 dark:bg-rose-950/5 shadow-sm">
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <XCircle className="size-4 text-rose-600" /> Exclusions
              </h4>
              <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                {pkg.exclusions.map((exc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Right Sidebar Booking Action Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/50 space-y-6">
            
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Pricing details</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-neutral-950 dark:text-white">
                  ₹{pkg.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-neutral-400">/ person</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                * Prices include standard swiss cottages, local guide permit, and 3 times hot meals daily.
              </p>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800" />

            {/* Inclusions summary list */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Package Highlights:</span>
              <ul className="space-y-1.5 text-neutral-500 dark:text-neutral-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Swiss Cottage Double bed</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Garhwali Local Naturalist guide</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Forest tickets included</span>
                </li>
              </ul>
            </div>

            {/* Booking Trigger CTA */}
            <Button
              asChild
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 h-12 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all active:scale-[0.98]"
            >
              <Link href={`/booking?packageId=${pkg.id}`}>
                Book Campsite Now <ArrowRight className="size-4" />
              </Link>
            </Button>
            
          </div>
        </div>

      </div>

    </div>
  );
}
