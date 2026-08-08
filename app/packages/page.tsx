"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, Package } from "@/services/api";
import { PackageCard } from "@/components/PackageCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Compass, Flame, ArrowRight } from "lucide-react";

function PackagesPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPackages();
        setPackages(data);
        setFilteredPackages(data);
      } catch (err) {
        //error("Error loading packages page:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPackages();
  }, []);

  // Filter packages whenever search or activeCategory changes
  useEffect(() => {
    let result = packages;

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    // Category filter (mocked category assignment)
    if (activeCategory === "luxury") {
      result = result.filter((p) => p.id.includes("luxury"));
    } else if (activeCategory === "explorer") {
      result = result.filter((p) => p.id.includes("explorer"));
    } else if (activeCategory === "eco") {
      result = result.filter((p) => p.id.includes("eco"));
    }

    setFilteredPackages(result);
  }, [searchQuery, activeCategory, packages]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">

      {/* Header Info */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Campsite Catalog</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">Available Camping Packages</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Book swiss cottage luxury, adventure tents, or zero-waste eco cabins. Secure your Ghangaria camp permit today.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 items-start">

        {/* Left Sidebar Filter (Inspired by "Choose your adventure" screenshot side-filter layout) */}
        <div className="space-y-6 rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1">
          <div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-white mb-1">Choose adventure</h3>
            <p className="text-[10px] text-neutral-400">Select standard filters</p>
          </div>

          <hr className="border-neutral-100 dark:border-neutral-800" />

          {/* Categories Buttons */}
          <div className="flex flex-col gap-2">

            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeCategory === "all"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="size-4 shrink-0 text-emerald-600" /> All Options
              </span>
              <ArrowRight className="size-3" />
            </button>

            <button
              onClick={() => setActiveCategory("luxury")}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeCategory === "luxury"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                }`}
            >
              <span className="flex items-center gap-2">
                <Flame className="size-4 shrink-0 text-amber-500" /> Swiss Luxury Swiss
              </span>
              <ArrowRight className="size-3" />
            </button>

            <button
              onClick={() => setActiveCategory("explorer")}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeCategory === "explorer"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-blue-500" /> Explorer Domes
              </span>
              <ArrowRight className="size-3" />
            </button>

            <button
              onClick={() => setActiveCategory("eco")}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeCategory === "eco"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="size-4 shrink-0 text-emerald-500" /> Wilderness Eco
              </span>
              <ArrowRight className="size-3" />
            </button>

          </div>

          <hr className="border-neutral-100 dark:border-neutral-800" />

          {/* Live Search Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Search keywords</label>
            <div className="relative flex items-center">
              <Search className="size-4 text-neutral-400 absolute left-3" />
              <Input
                type="text"
                placeholder="e.g. food, swiss, guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-9 border-neutral-200 focus-visible:ring-emerald-600/30 text-xs h-9 dark:border-neutral-800"
              />
            </div>
          </div>
        </div>

        {/* Right Packages Catalog Grid */}
        <div className="lg:col-span-3 space-y-6">
          {filteredPackages.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} item={pkg} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-neutral-100 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <Compass className="size-12 text-neutral-300 mb-3" />
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">No Campsites Found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1 leading-relaxed">
                We couldn't find any packages matching your search criteria. Try modifying your filters or keyword query.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

import { Suspense } from "react";

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950"><LoadingSpinner size={36} /></div>}>
      <PackagesPageContent />
    </Suspense>
  );
}
