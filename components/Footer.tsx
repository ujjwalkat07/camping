import Link from "next/link";
import { Flame, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-neutral-100 bg-neutral-900 text-neutral-400 dark:border-neutral-800 dark:bg-black">
      {/* Background Forest Silhouette Overlay Option (We can do this with styling or nice typography) */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <Flame className="size-4 fill-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                camplife<span className="text-emerald-500">.in</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Premium camps and unforgettable trekking experiences near the Valley of Flowers, Uttarakhand. Escape to the wilderness.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-emerald-500 transition-colors">Packages</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-emerald-500 transition-colors">Photo Gallery</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-500 transition-colors">About Us</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support & FAQ</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/faq" className="hover:text-emerald-500 transition-colors">FAQ Accordion</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-500 transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-emerald-500 transition-colors">Start a Booking</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Ghangaria Campsite Base, Valley of Flowers, Uttarakhand, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-emerald-500 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-emerald-500 shrink-0" />
                <span>bookings@camplife.in</span>
              </li>
            </ul>
          </div>

        </div>

        <hr className="my-8 border-neutral-800" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-xs">
          <p>
            &copy; {new Date().getFullYear()} Camplife.in. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-neutral-400">
            <span>All rights reserved with</span>
            <span className="font-semibold text-white">🔥 Camplife.in</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
