"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Booking, User } from "@/services/api";
import { tokenStorage } from "@/lib/api-client";
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
  Heart,
  Eye,
  Upload,
  Edit,
  X,
  Save
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

  // Edit Booking Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    alternateMobileNumber: "",
    emergencyContact: "",
    age: 25,
    gender: "Male",
    address: "",
    pickupPoint: "Govindghat Bus Stand",
    specialRequest: ""
  });
  const [isSavingBookingEdit, setIsSavingBookingEdit] = useState(false);
  const [bookingEditMessage, setBookingEditMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenEditBooking = (b: Booking) => {
    setEditingBooking(b);
    const firstTraveler = b.travelers && b.travelers.length > 0 ? b.travelers[0] : ({} as any);
    setEditForm({
      customerName: b.fullName || firstTraveler.fullName || "",
      phone: b.mobileNumber || "",
      alternateMobileNumber: b.mobileNumber || "",
      emergencyContact: firstTraveler.emergencyContact || "",
      age: firstTraveler.age || 25,
      gender: firstTraveler.gender || "Male",
      address: "",
      pickupPoint: "Govindghat Bus Stand",
      specialRequest: b.specialRequests || ""
    });
    setBookingEditMessage(null);
  };

  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsSavingBookingEdit(true);
    setBookingEditMessage(null);

    try {
      const token = tokenStorage.getToken() || undefined;
      const success = await api.updateBooking(editingBooking.bookingId, editForm, token);
      if (success) {
        setBookingEditMessage({ type: 'success', message: 'Booking details updated successfully!' });
        const updated = await api.getBookings(currentUser?.id || '', token);
        setBookings(updated);
        setTimeout(() => setEditingBooking(null), 1200);
      } else {
        setBookingEditMessage({ type: 'error', message: 'Failed to update booking details. Please try again.' });
      }
    } catch (err: any) {
      console.error(err);
      setBookingEditMessage({ type: 'error', message: err?.message || 'An error occurred while saving.' });
    } finally {
      setIsSavingBookingEdit(false);
    }
  };

  // Sync auth and fetch bookings
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    // Direct admins to the admin portal if they attempt to access user dashboard
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const roleStr = typeof (user as any).role === "string" ? (user as any).role.toUpperCase() : "";
    const isAdmin =
      roles.includes("ROLE_ADMIN") ||
      roles.includes("admin") ||
      roles.includes("ADMIN") ||
      roleStr === "ADMIN" ||
      roleStr === "ROLE_ADMIN";

    if (isAdmin) {
      router.push("/admin");
      return;
    }

    setCurrentUser(user);

    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const token = tokenStorage.getToken();
        const data = await api.getBookings(user.id, token || undefined);
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

    // Auto refresh when status changes in another tab/window
    const handleStorageChange = () => {
      loadBookings();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [router]);

  const handleLogout = () => {
    api.logout();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [uploadSuccessId, setUploadSuccessId] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      const token = tokenStorage.getToken() || undefined;
      await api.cancelBooking(bookingId, token);
      setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: 'rejected' } : b));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDashboardUpload = async (bookingId: string, file: File, currentUtr?: string, amount?: number) => {
    try {
      setUploadingBookingId(bookingId);
      setUploadSuccessId(null);

      const token = tokenStorage.getToken() || undefined;
      const utrVal = currentUtr && currentUtr !== "N/A (No receipt submitted)" ? currentUtr : "123456789012";
      await api.submitPaymentProof(
        bookingId,
        utrVal,
        file.name,
        amount,
        file,
        token
      );

      setBookings(prev => prev.map(b => {
        if (b.bookingId === bookingId) {
          return {
            ...b,
            screenshotName: file.name,
            utr: utrVal
          };
        }
        return b;
      }));

      setUploadSuccessId(bookingId);
      setTimeout(() => setUploadSuccessId(null), 4000);
    } catch (err) {
      console.error("Dashboard screenshot upload error:", err);
    } finally {
      setUploadingBookingId(null);
    }
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
    const s = String(status || '').toLowerCase();
    switch (s) {
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/50">
            <CreditCard className="size-3.5" /> Pending Payment
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-bold text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200/50">
            <Hourglass className="size-3.5" /> Pending Approval
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
            <CheckCircle className="size-3.5" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50">
            <XCircle className="size-3.5" /> Booking Rejected
          </span>
        );
      case "deleted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
            <XCircle className="size-3.5" /> Booking Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 uppercase">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (pStatus?: string) => {
    if (!pStatus) return null;
    const ps = pStatus.toUpperCase();
    if (ps === 'APPROVED' || ps === 'VERIFIED' || ps === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
          <CheckCircle className="size-3 text-emerald-600" /> Payment: Approved
        </span>
      );
    }
    if (ps === 'REJECTED' || ps === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60">
          <XCircle className="size-3 text-rose-600" /> Payment: Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60">
        <Hourglass className="size-3 text-amber-600" /> Payment: {ps.replace(/_/g, ' ')}
      </span>
    );
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
          className={`flex items-center gap-2 pb-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${activeTab === "bookings"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
        >
          <Compass className="size-4" /> My Bookings
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-4 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${activeTab === "profile"
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
                      {/* Top Bar: Booking ID and Status Badges */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 border-neutral-100 dark:border-neutral-800">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Booking ID</span>
                          <span className="text-xs font-extrabold text-neutral-800 dark:text-white font-mono">{booking.bookingId}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                      </div>

                      {/* Body: Camp Name, Date, Guests, Thumbnail */}
                      <div className="grid gap-4 sm:grid-cols-4 items-center text-xs">
                        {booking.thumbnailImage && (
                          <div className="sm:col-span-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-24 bg-neutral-950">
                            <img src={booking.thumbnailImage} alt={booking.packageName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={booking.thumbnailImage ? "sm:col-span-1" : "sm:col-span-1"}>
                          <span className="text-[10px] text-neutral-400 block mb-0.5 font-bold uppercase tracking-wider">Selected Package</span>
                          <span className="font-extrabold text-neutral-900 dark:text-white text-sm">{booking.packageName}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">Package #{booking.packageId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5 font-bold uppercase tracking-wider">Travel Date</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-emerald-600" /> {booking.travelDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5 font-bold uppercase tracking-wider">Permits / Guests</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Users className="size-3.5 text-emerald-600" /> {booking.adults} Adults, {booking.children} Children
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

                      {/* Bottom: Payment Copy details, Upload screenshot button & Next steps */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Transaction Reference</span>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300 font-mono">
                            {booking.utr ? booking.utr : "N/A (No receipt submitted)"}
                          </span>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {booking.screenshotUrl && booking.screenshotUrl !== "PAY_ON_SPOT" && (
                              <a
                                href={booking.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30"
                              >
                                <Eye className="size-3" /> View Current Receipt Image
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                          <div className="text-right sm:pr-2">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Total Amount</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.status === "pending_payment" && (
                              <Button asChild size="sm" className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                                <Link href={`/payment?bookingId=${booking.bookingId}`}>
                                  Complete Checkout <ArrowRight className="size-3.5 ml-1" />
                                </Link>
                              </Button>
                            )}

                            <Button
                              onClick={() => handleOpenEditBooking(booking)}
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 text-xs h-8 font-semibold"
                            >
                              <Edit className="size-3 mr-1" /> Edit Details
                            </Button>

                            {(booking.status === "pending_payment" || booking.status === "pending") && (
                              <Button
                                onClick={() => handleCancelBooking(booking.bookingId)}
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30 text-xs h-8"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
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

          {/* Right Column: Forest Permits Tip Card & Password Security */}
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
                <li>Emergency contact information is mandatory for generating high-altitude entry permits.</li>
                <li>A valid Government-issued ID must match your profile credentials during physical checks at the Ghangaria forest gate.</li>
                <li>Any mismatch can lead to temporary holds or cancellation of camp permissions.</li>
              </ul>
            </div>

            {/* Password Change Card */}
            <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <div className="flex items-center gap-2 text-neutral-800 dark:text-white">
                <Settings className="size-4 text-emerald-600" />
                <h3 className="text-sm font-bold">Account Security</h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Request an OTP sent to your registered email to change your account password.
              </p>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await api.requestPasswordChangeOtp();
                    alert("OTP sent to your email address!");
                  } catch (err: any) {
                    alert(err.message || "Failed to send password change OTP.");
                  }
                }}
                variant="outline"
                className="w-full rounded-xl text-xs font-bold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50"
              >
                Request Password Change OTP
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING DETAILS MODAL (PUT /api/bookings/{bookingId}) */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Edit Booking Details
                </h3>
                <p className="text-xs text-neutral-400">
                  Booking ID: #{editingBooking.bookingId}
                </p>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <X className="size-4" />
              </button>
            </div>

            {bookingEditMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                bookingEditMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}>
                {bookingEditMessage.message}
              </div>
            )}

            <form onSubmit={handleSaveBookingEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Alternate Mobile Number:
                  </label>
                  <input
                    type="text"
                    value={editForm.alternateMobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, alternateMobileNumber: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Emergency Contact:
                  </label>
                  <input
                    type="text"
                    value={editForm.emergencyContact}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Age:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Gender:
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Address:
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Full Residential Address"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Pickup Point:
                  </label>
                  <input
                    type="text"
                    value={editForm.pickupPoint}
                    onChange={(e) => setEditForm({ ...editForm, pickupPoint: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Special Request:
                  </label>
                  <input
                    type="text"
                    value={editForm.specialRequest}
                    onChange={(e) => setEditForm({ ...editForm, specialRequest: e.target.value })}
                    placeholder="Dietary, tent preferences, etc."
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBooking(null)}
                  className="rounded-xl text-xs font-semibold h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingBookingEdit}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 px-5 shadow-sm"
                >
                  {isSavingBookingEdit ? (
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <LoadingSpinner size={14} /> Saving Changes...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Save className="size-3.5" /> Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
