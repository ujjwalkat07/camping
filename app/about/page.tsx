import { MapPin, Compass, Users, Target, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-16">
      
      {/* 1. Header Hero section */}
      <div className="relative rounded-[2.5rem] bg-neutral-900 overflow-hidden min-h-[300px] flex items-center justify-center p-8 text-center shadow-lg shadow-neutral-900/10">
        <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1600&q=80')"
        }} />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">Our Story</span>
          <h1 className="text-4xl font-extrabold text-white md:text-5xl tracking-tight">About Camplife</h1>
          <p className="text-sm text-neutral-200 leading-relaxed max-w-lg mx-auto">
            Providing comfortable and ecological wilderness camps at the gateway to the Valley of Flowers since 2018.
          </p>
        </div>
      </div>

      {/* 2. Valley of Flowers Details Section */}
      <section className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">UNESCO Heritage Site</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Valley of Flowers</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            The Valley of Flowers is a vibrant and splendid National Park in Chamoli, Uttarakhand. Nested in the high-altitude West Himalayas, the valley is famous for its meadows of alpine flowers, glacial streams, and rare animal species like the snow leopard, musk deer, and blue sheep.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            The national park remains covered in thick snow during the winters. As summer approaches, the snow melts, and by July, the valley turns into a botanical paradise featuring over 500 varieties of wildflowers, including the famous Blue Poppy, Brahmakamal, and Cobra Lily.
          </p>
        </div>
        <div className="rounded-[2rem] overflow-hidden aspect-video shadow-md border border-neutral-100 dark:border-neutral-800">
          <img src="https://images.unsplash.com/photo-1478131148058-269e8020e980?auto=format&fit=crop&w=1000&q=80" alt="Valley Landscape" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* 3. Camp Base Details Section */}
      <section className="grid gap-8 md:grid-cols-2 items-center md:flex-row-reverse">
        <div className="md:order-last space-y-4">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Base camp Ghangaria</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Our Camp Information</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Our premium campsites are located on a scenic clearing in Ghangaria, the last human settlement before entering the national park. Since camping inside the national park is strictly prohibited by the Forest Department, Ghangaria acts as the perfect base camp.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            We provide different camping configurations to suit all budgets. From Swiss luxury tents with wooden beds and attached tiled bathrooms to standard domes for lone backpackers. Our dining facility serves organic Garhwali food made from local grains, keeping in mind the caloric needs of high-altitude trekkers.
          </p>
        </div>
        <div className="rounded-[2rem] overflow-hidden aspect-video shadow-md border border-neutral-100 dark:border-neutral-800">
          <img src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80" alt="Campsites" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* 4. Mission & Vision */}
      <section className="grid gap-6 sm:grid-cols-2">
        {/* Mission */}
        <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8 space-y-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Target className="size-5" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">Our Mission</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            To provide safe, comfortable, and memorable eco-trekking lodging experiences that connect visitors with the majestic Himalayan nature, while maintaining the highest ecological standards and empowering the local Garhwali community.
          </p>
        </div>

        {/* Vision */}
        <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8 space-y-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">Our Vision</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            To become the leading carbon-neutral camping network in the high-altitude Himalayas, recognized for sustainable nature conservation, expert botanical guiding, and premium customer hospitality.
          </p>
        </div>
      </section>

    </div>
  );
}
