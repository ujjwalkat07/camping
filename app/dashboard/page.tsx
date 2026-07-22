"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Booking, User } from "@/services/api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Compass, 
  Calendar, 
  CreditCard, 
  Hourglass, 
  CheckCircle, 
  XCircle, 
  Users, 
  Settings, 
  ArrowRight,
  BadgeAlert,
  LogOut,
  MapPin,
  User as UserIcon,
  Mail,
  Phone,
  Home,
  Heart
} from "lucide-react";
import Link from "next/link";
import { BookingSteps } from "@/components/BookingSteps";

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Settings Form State
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    address: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  // Sync auth and fetch bookings
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    setCurrentUser(user);

    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const data = await api.getBookings(user.id);
        // Sort bookings by date descending
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setBookings(data);

        // Pre-fill profile state
        setProfileForm({
          name: user.name || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          emergencyContactName: user.emergencyContactName || "",
          emergencyContactPhone: user.emergencyContactPhone || "",
          address: user.address || ""
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };



  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSavingProfile(true);
    setProfileSuccessMessage("");
    setProfileErrorMessage("");
    
    try {
      const updated = await api.updateUserProfile(currentUser.id, {
        name: profileForm.name,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        emergencyContactName: profileForm.emergencyContactName,
        emergencyContactPhone: profileForm.emergencyContactPhone,
        address: profileForm.address
      });
      if (updated) {
        setCurrentUser(updated);
        setProfileSuccessMessage("Your profile credentials have been successfully updated!");
        // Dispatch storage event to notify Navbar of name change
        window.dispatchEvent(new Event("storage"));
      } else {
        setProfileErrorMessage("Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setProfileErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
            <CreditCard className="size-3.5" /> Pending Payment
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-bold text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400">
            <Hourglass className="size-3.5" /> Pending Owner Approval
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle className="size-3.5" /> Approved / Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <XCircle className="size-3.5" /> Booking Rejected
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Traveler Space</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
            Namaste, {currentUser.name}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your campsite permits, verify traveler details, and track owner approvals.
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 flex items-center gap-1.5 self-stretch md:self-auto justify-center h-10">
          <LogOut className="size-4" /> Log Out
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-850 gap-6">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 pb-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "bookings"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <Compass className="size-4" /> My Bookings
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "profile"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <UserIcon className="size-4" /> Profile Settings
        </button>
      </div>

      {activeTab === "bookings" ? (
        /* 1. MY BOOKINGS TAB */
        <div className="space-y-6">
          {bookings.some(b => b.status === "pending" || b.status === "pending_payment") && (
            <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Current Booking Progress</span>
              <BookingSteps currentStep={3} />
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Bookings List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <Compass className="size-5 text-emerald-600" /> Active Campsite Bookings
                </h2>
                <span className="text-xs font-semibold text-neutral-400">Total requests: {bookings.length}</span>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-[2rem] border border-neutral-100 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col items-center">
                  <MapPin className="size-12 text-neutral-300 mb-3" />
                  <h3 className="text-base font-bold text-neutral-800 dark:text-white">No active bookings yet</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mt-1 mb-6">
                    You haven't requested any Valley of Flowers base campsites. Explore our listings to start!
                  </p>
                  <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <Link href="/packages">
                      Browse Available Campsites
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.bookingId}
                      className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4 hover:shadow-md transition-shadow"
                    >
                      {/* Top Bar: Booking ID and Status */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 border-neutral-100 dark:border-neutral-800">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">ID Session Reference</span>
                          <span className="text-xs font-extrabold text-neutral-800 dark:text-white font-mono">{booking.bookingId}</span>
                        </div>
                        <div>{getStatusBadge(booking.status)}</div>
                      </div>

                      {/* Body: Camp Name, Date, Guests */}
                      <div className="grid gap-4 sm:grid-cols-3 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">Selected Package</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{booking.packageName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">Travel Date</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-neutral-400" /> {booking.travelDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">Permits Allocated</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Users className="size-3.5 text-neutral-400" /> {booking.adults + booking.children} Travelers
                          </span>
                        </div>
                      </div>

                      {/* Traveler Breakdown */}
                      <div className="rounded-xl bg-slate-50 dark:bg-neutral-950 p-4 border border-neutral-100 dark:border-neutral-800 space-y-2">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Registered Guest Credentials:</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {booking.travelers.map((t, idx) => (
                            <div key={idx} className="text-xs flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-100/50 dark:bg-neutral-900 dark:border-neutral-800">
                              <div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {t.fullName}
                                </span>
                                <span className="text-[10px] text-neutral-400 block">ID: {t.idProofType} ({t.idProofNumber})</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded font-medium dark:bg-neutral-800">
                                {t.gender}, {t.age}y
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom: Payment Copy details & Next steps */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Transaction Reference</span>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300 font-mono">
                            {booking.utr ? booking.utr : "N/A (No receipt submitted)"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
                          <div className="text-right sm:pr-2">
                            <span className="text-[9px] text-neutral-400 block">Amount Paid</span>
                            <span className="font-extrabold text-neutral-800 dark:text-white">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                          </div>

                          {booking.status === "pending_payment" && (
                            <Button asChild size="sm" className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                              <Link href={`/payment?bookingId=${booking.bookingId}`}>
                                Complete Checkout <ArrowRight className="size-3.5 ml-1" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. PROFILE SETTINGS TAB */
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <UserIcon className="size-5 text-emerald-600" /> Camper Information
                </h2>
                <p className="text-xs text-neutral-400 mt-1">Update your primary traveler information used for forest permits.</p>
              </div>

              {profileSuccessMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 text-xs font-semibold dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="size-4" /> {profileSuccessMessage}
                </div>
              )}
              {profileErrorMessage && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-center gap-2">
                  <XCircle className="size-4" /> {profileErrorMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 pl-10 pr-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address (Locked)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="email"
                        disabled
                        value={profileForm.email}
                        className="w-full rounded-xl border border-neutral-100 bg-neutral-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-neutral-400 cursor-not-allowed dark:border-neutral-900 dark:bg-neutral-950"
                        placeholder="camper@example.com"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 pl-10 pr-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Home City / State</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 pl-10 pr-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                        placeholder="e.g. Dehradun, Uttarakhand"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts Block */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                      <Heart className="size-4.5 text-rose-500" /> Emergency Contact
                    </h3>
                    <p className="text-[10px] text-neutral-400">Valley of Flowers park security requires active emergency details.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Contact Name</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContactName}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 px-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                        placeholder="Guardian / Friend Name"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Contact Number</label>
                      <input
                        type="tel"
                        value={profileForm.emergencyContactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 px-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                        placeholder="Emergency phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 h-10 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    {isSavingProfile ? <LoadingSpinner size={18} className="text-white" /> : "Save Profile Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Forest Permits Tip Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50/30 p-6 dark:border-neutral-800 dark:bg-neutral-900/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                <BadgeAlert className="size-5" />
                <h3 className="text-sm font-extrabold">Forest Entry Permit Rules</h3>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Valley of Flowers is a protected UNESCO World Heritage Site managed by the Uttarakhand Forest Department. 
              </p>
              <ul className="text-[10px] text-neutral-500 dark:text-neutral-400 space-y-2 list-disc pl-4">
                <li>Emergency contact information is **mandatory** for generating high-altitude entry permits.</li>
                <li>A valid Government-issued ID must match your profile credentials during physical checks at the Ghangaria forest gate.</li>
                <li>Any mismatch can lead to temporary holds or cancellation of camp permissions.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
