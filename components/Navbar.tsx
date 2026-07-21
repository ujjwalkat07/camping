"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Flame, Heart, Menu, LogIn, User as UserIcon, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { api, User } from "@/services/api";

export function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Sync user profile state
  useEffect(() => {
    setUser(api.getCurrentUser());

    const syncAuth = () => {
      setUser(api.getCurrentUser());
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    router.push("/");
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-transform group-hover:scale-105">
            <Flame className="size-5 fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            camplife<span className="text-emerald-600">.in</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 outline-none hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
              <Compass className="size-4" /> Explore Spots
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1">
              <DropdownMenuItem asChild>
                <Link href="/packages" className="flex items-center gap-2 rounded-lg cursor-pointer">
                  <MapPin className="size-4 text-emerald-600" /> All Packages
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gallery" className="flex items-center gap-2 rounded-lg cursor-pointer">
                  <Compass className="size-4 text-emerald-600" /> Photo Gallery
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="flex items-center gap-2 rounded-lg cursor-pointer">
                  <UserIcon className="size-4 text-emerald-600" /> About Camp
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/packages" className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            <Heart className="size-4 text-rose-500 fill-rose-500/10" /> Packages
          </Link>

          <Link href="/faq" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            FAQs
          </Link>

          <Link href="/contact" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Contact Us
          </Link>
        </nav>

        {/* Action Buttons (Auth Conditioned) */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              >
                My Bookings
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
                    <div className="size-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold dark:bg-emerald-950/60 dark:text-emerald-300">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold">{user.name.split(" ")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-lg cursor-pointer">
                      <UserIcon className="size-4 text-emerald-600" /> Traveler Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="size-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
                Sign In
              </Link>
              <Button asChild size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-600/10 px-5 transition-all active:scale-[0.98]">
                <Link href="/packages" className="flex items-center gap-1.5">
                  <LogIn className="size-4" /> Book Now
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300 md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="border-t border-neutral-100 bg-white px-4 py-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950 md:hidden animate-in slide-in-from-top duration-250">
          <nav className="flex flex-col gap-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Home
            </Link>
            <Link href="/packages" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Explore Packages
            </Link>
            <Link href="/gallery" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Gallery
            </Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              About Us
            </Link>
            <Link href="/faq" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              FAQs
            </Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Contact
            </Link>
            
            <hr className="border-neutral-100 dark:border-neutral-800" />
            
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-left text-sm font-semibold text-destructive">
                  Log Out ({user.name})
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
