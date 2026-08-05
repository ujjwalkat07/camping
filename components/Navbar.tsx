"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Flame, Heart, Menu, LogIn, User as UserIcon, MapPin, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { api, User } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
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
          <DropdownMenu onOpenChange={setIsExploreOpen}>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 outline-none hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors group">
              <Compass className="size-4 text-emerald-600 dark:text-emerald-450" /> 
              <span>Explore Spots</span>
              <ChevronDown className={`size-3 text-neutral-400 group-hover:text-neutral-600 transition-transform duration-200 ${isExploreOpen ? "rotate-180" : ""}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 border border-neutral-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur-md">
              <DropdownMenuItem asChild>
                <Link href="/packages" className="flex items-start gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-650 dark:bg-emerald-950/50 dark:text-emerald-450">
                    <MapPin className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-250">All Packages</div>
                    <div className="text-[10px] text-neutral-450 font-normal leading-normal">Browse all campsite packages</div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gallery" className="flex items-start gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-650 dark:bg-sky-950/50 dark:text-sky-450">
                    <Compass className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-250">Photo Gallery</div>
                    <div className="text-[10px] text-neutral-450 font-normal leading-normal">Take a visual tour of Valley camps</div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="flex items-start gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-655 dark:bg-amber-950/50 dark:text-amber-450">
                    <UserIcon className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-250">About Camp</div>
                    <div className="text-[10px] text-neutral-450 font-normal leading-normal">Safety guidelines & our crew</div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/packages" className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
            <Heart className="size-4 text-rose-500 fill-rose-500/10" /> Packages
          </Link>

          <Link href="/faq" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
            FAQs
          </Link>

          <Link href="/contact" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
            Contact Us
          </Link>
        </nav>

        {/* Action Buttons (Auth Conditioned) */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
              >
                My Bookings
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-9 px-3">
                    <div className="size-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold dark:bg-emerald-950/60 dark:text-emerald-350">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="size-3 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border border-neutral-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur-md">
                  <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    <div className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Signed in as</div>
                    <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{user.name}</div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl p-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <UserIcon className="size-4 text-emerald-600 dark:text-emerald-450" /> 
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Traveler Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 rounded-xl p-2 cursor-pointer text-rose-600 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:bg-rose-50 focus:text-rose-600">
                    <LogOut className="size-4" /> 
                    <span className="text-xs font-bold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors">
                Sign Up
              </Link>
              <Button asChild size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/10 px-4 h-9 transition-all active:scale-[0.98]">
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
        <div className="border-t border-neutral-100 bg-white/95 backdrop-blur-lg px-5 py-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden animate-in slide-in-from-top duration-250">
          <nav className="flex flex-col gap-2.5">
            <Link href="/" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              Home
            </Link>
            <Link href="/packages" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              Explore Packages
            </Link>
            <Link href="/gallery" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              Gallery
            </Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              About Us
            </Link>
            <Link href="/faq" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              FAQs
            </Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
              Contact
            </Link>
            
            <hr className="border-neutral-100 dark:border-neutral-800 my-1" />
            
            {user ? (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2.5 px-3 py-1.5">
                  <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold dark:bg-emerald-950/60 dark:text-emerald-350">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 block truncate">{user.name}</span>
                    <span className="text-[10px] text-neutral-400 block truncate">{user.email}</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs font-bold h-10">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                    <UserIcon className="size-4 text-emerald-600" /> My Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start rounded-xl text-xs font-bold h-10 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  <LogOut className="size-4" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-2">
                <Button asChild variant="outline" className="w-full justify-center rounded-xl font-semibold h-10">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 h-10">
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Sign Up / Register
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
