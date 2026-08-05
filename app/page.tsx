"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Package, Review, FAQ, GalleryItem } from "@/services/api";
import { PackageCard } from "@/components/PackageCard";
import { ReviewCard } from "@/components/ReviewCard";
import { GalleryCard } from "@/components/GalleryCard";
import { ContactForm } from "@/components/ContactForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ImageModal } from "@/components/ImageModal";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MapPin, Compass, Shield, Users, Heart, ArrowRight } from "lucide-react";

export default function Home() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [selectedCity, setSelectedCity] = useState("Ghangaria");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const [pkgs, revs, fqList, galList] = await Promise.all([
          api.getPackages(),
          api.getReviews(),
          api.getFAQs(),
          api.getGallery()
        ]);
        setPackages(pkgs);
        setReviews(revs);
        setFaqs(fqList.slice(0, 4)); // Show first 4 on home
        setGallery(galList.slice(0, 4)); // Show first 4 on home
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="text-center space-y-3">
          <LoadingSpinner size={40} />
          <p className="text-sm font-semibold text-neutral-500 animate-pulse">Loading adventure platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">

      {/* 1. HERO BANNER SECTION (Inspired by screenshot) */}
      <section className="mx-auto max-w-8xl px-4 pt-6 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 shadow-xl shadow-neutral-900/10">

          {/* Hero background image */}
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{
            backgroundImage: "url('/image.png')"
          }} />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/50 to-neutral-950/20" />

          <div className="relative z-10 flex flex-col justify-between p-8 md:p-16 min-h-[550px]">

            {/* Header badges / Small metadata inside banner */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white">
                🗻 Uttarakhand Alpine Camps
              </span>
            </div>

            {/* Core Titles */}
            <div className="max-w-2xl mt-8">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                <span className="h-0.5 w-6 bg-emerald-400 rounded-full inline-block"></span>
                Adventure Starts Where the Road Ends
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.1] mb-4">
                Find your perfect <br />
                <span className="text-emerald-400">camping spot</span>
              </h1>

              {/* Glassmorphic Search Bar */}
              <Button asChild className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-6 font-semibold mt-5">
                <Link href={`/packages`}>
                  Explore Packages
                </Link>
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>

            {/* Banner Footer Grid: Badges & Overlay Cards */}
            <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

              {/* Bottom-left Camper Badges */}
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/20">
                <div className="flex -space-x-2">
                  <img className="size-8 rounded-full border-2 border-neutral-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="user" />
                  <img className="size-8 rounded-full border-2 border-neutral-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="user" />
                  <img className="size-8 rounded-full border-2 border-neutral-900 object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80" alt="user" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">10K+ Campers</span>
                  <span className="text-[10px] text-neutral-300">Visited this Season</span>
                </div>
              </div>

              {/* Bottom-Right Overlay Card: Curated List (Floating styling matching screenshot) */}
              <div className="max-w-[280px] rounded-2xl bg-white p-4 shadow-lg text-neutral-800 hidden md:block border border-neutral-100 animate-bounce-slow">
                <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider mb-1">Valley Highlight</span>
                <h4 className="text-xs font-bold text-neutral-800 leading-snug mb-2">
                  UNESCO World Heritage site is now blooming.
                </h4>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Compass className="size-3" /> Explore Spots
                  </span>
                  <span className="text-neutral-400">Updated: Today</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. ABOUT VALLEY OF FLOWERS SECTION */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-md border border-neutral-100 dark:border-neutral-800">
            <img
              src="https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1200&q=80"
              alt="Valley of Flowers Scenic"
              className="h-full w-full object-cover"
            />
            {/* Absolute badge */}
            <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5">
              <MapPin className="size-3.5 text-emerald-400" />
              Ghangaria Valley (3,048m)
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Discover Paradise</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              About Valley of Flowers
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Discovered in 1931 by mountaineer Frank S. Smythe, the **Valley of Flowers** is a legendary Indian National Park located in North Chamoli, Uttarakhand. Adorned with meadows of endemic alpine flowers and rich flora biodiversity, this UNESCO site is nested high in the West Himalayas.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Our campsite, based in the peaceful village of Ghangaria, serves as the primary base camp for all visitors trekking to this floral paradise and the sacred glacial lake of **Hemkund Sahib**.
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" className="rounded-xl border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 px-5">
                <Link href="/about" className="flex items-center gap-1.5">
                  Read Full Camp Story <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PACKAGES (Inspired by screenshot "Our finds in Ghangaria") */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Our finds in</h2>
              <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-1 text-sm font-bold text-neutral-800 cursor-pointer dark:bg-neutral-800 dark:text-neutral-100 transition-colors">
                <MapPin className="size-3.5 text-emerald-600" /> {selectedCity}
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Curated packages offering swiss luxury tents, basic explorer domes, and eco cottages.
            </p>
          </div>

          <Button asChild variant="ghost" className="text-emerald-600 hover:text-emerald-700 font-bold text-xs p-0 flex items-center gap-1 rounded-none hover:bg-transparent">
            <Link href="/packages">
              Explore All Packages <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Packages Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} item={pkg} />
          ))}
        </div>
      </section>

      {/* 4. WHY CHOOSE US SECTION */}
      <section className="bg-neutral-900 text-white py-16 rounded-[3rem] mx-4 md:mx-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Our Excellence</span>
            <h2 className="text-3xl font-bold tracking-tight">Why Campers Choose Us</h2>
            <p className="text-xs text-neutral-400 mt-2">
              Providing premium wilderness hospitality with extreme safety protocols at 10,000 feet.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {/* Box 1 */}
            <div className="space-y-3 bg-neutral-800/40 p-6 rounded-2xl border border-neutral-800">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/10">
                <Shield className="size-6" />
              </div>
              <h3 className="font-bold text-sm">Certified Safety Standards</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Oxygen cylinders, 24/7 medicine support, and emergency rescue ties.
              </p>
            </div>

            {/* Box 2 */}
            <div className="space-y-3 bg-neutral-800/40 p-6 rounded-2xl border border-neutral-800">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/10">
                <Users className="size-6" />
              </div>
              <h3 className="font-bold text-sm">Expert Himalayan Naturalists</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Trek leads who know every rare flower species and safe mountain paths.
              </p>
            </div>

            {/* Box 3 */}
            <div className="space-y-3 bg-neutral-800/40 p-6 rounded-2xl border border-neutral-800">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/10">
                <Heart className="size-6" />
              </div>
              <h3 className="font-bold text-sm">Traditional Garhwali Meals</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Fresh, organic meals cooked by local chefs keeping health in focus.
              </p>
            </div>

            {/* Box 4 */}
            <div className="space-y-3 bg-neutral-800/40 p-6 rounded-2xl border border-neutral-800">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/10">
                <Compass className="size-6" />
              </div>
              <h3 className="font-bold text-sm">Zero Ecological Waste</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Proud partners of Leave No Trace camping policies inside Ghangaria forest limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GALLERY PREVIEW SECTION */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Visual Memories</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Memories by campers</h2>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800">
            <Link href="/gallery">
              View All Photos
            </Link>
          </Button>
        </div>

        {/* Gallery Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {gallery.map((item) => (
            <GalleryCard key={item.id} item={item} onClick={(it) => setActiveImage(it)} />
          ))}
        </div>
      </section>

      {/* 6. REVIEWS TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1.5">Testimonials</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">What Campers Say</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((rev) => (
            <ReviewCard key={rev.id} item={rev} />
          ))}
        </div>
      </section>

      {/* 7. FAQ ACCORDION PREVIEW */}
      <section className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Have Questions?</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <Accordion className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${index}`}
              className="border border-neutral-100 rounded-2xl bg-white px-5 py-0.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm"
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

        <div className="text-center mt-6">
          <Button asChild variant="link" className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <Link href="/faq">
              View All Frequently Asked Questions
            </Link>
          </Button>
        </div>
      </section>

      {/* 8. CONTACT SECTION */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-3 items-start">

          {/* Details column */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Need Assistance?</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Get in touch</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                Have specific medical needs, booking customizations, or questions about reaching Govindghat? Message our camper support line.
              </p>
            </div>

            <div className="rounded-[2rem] bg-emerald-50 border border-emerald-100 p-6 dark:bg-emerald-950/20 dark:border-emerald-900/30">
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 mb-2">Emergency Helpdesk</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed mb-4">
                Our base camp office is operational 24/7 during the travel season (June to October) to aid helicopter flights, medical guides, and local coordination.
              </p>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Call Helpline: +91 98765 43210
              </div>
            </div>
          </div>

          {/* Form column */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

        </div>
      </section>

      {/* Fullscreen Image Preview Dialog */}
      <ImageModal
        item={activeImage}
        isOpen={activeImage !== null}
        onClose={() => setActiveImage(null)}
      />

    </div>
  );
}
