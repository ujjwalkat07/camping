"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Booking, Package, ContactMessage, User as UserType, TravelerDetail, PaymentDetails } from "@/services/api";
import { tokenStorage, adminStorage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Compass,
  Calendar as CalendarIcon,
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  User,
  MapPin,
  Sparkles,
  Check,
  FileText,
  LogOut,
  ShieldCheck,
  Bell,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  Filter,
  Save
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<UserType | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab View Controller
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'contact' | 'packages'>('dashboard');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<'all' | 'unread' | 'replied'>('all');

  // Date State for Trek Departure Calendar Filter
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  // Edit Booking Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Booking | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Package Management Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    price: 5000,
    duration: '3 Days / 2 Nights',
    shortDescription: '',
    description: '',
    location: 'Valley of Flowers, Uttarakhand',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
  });
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Global Error Popup Modal State
  const [errorPopupMessage, setErrorPopupMessage] = useState<string | null>(null);

  // Payment Details Audit Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Email Reply Drawer State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Interactive Task List State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Verify UTR reference for Booking #BK-9023", time: "9:30 AM ET", completed: true },
    { id: 2, text: "Review Forest Department permits for Ghangaria camp", time: "11:00 AM PT", completed: false },
    { id: 3, text: "Dispatch email response for Contact Inquiry #MSG-101", time: "1:15 PM CT", completed: false },
    { id: 4, text: "Allocate guide slots for mid-August departures", time: "3:45 PM ET", completed: false }
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Load Admin Profile & Data
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user) {
      router.push("/login?redirect=/admin");
      return;
    }
    setAdminUser(user);
    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [bList, pList, cList] = await Promise.all([
        api.getAllBookings(),
        api.getPackages(),
        api.getContactMessages()
      ]);

      const normalizedBookings = bList.map(b => {
        const pkg = pList.find(p => String(p.id) === String(b.packageId) || (p.name && b.packageName && p.name.toLowerCase() === b.packageName.toLowerCase()));
        const basePrice = pkg ? pkg.price : 5000;
        const adultsCount = b.adults || (b.travelers ? b.travelers.length : 1) || 1;
        const childrenCount = b.children || 0;
        const calculatedTotal = (adultsCount * basePrice) + (childrenCount * Math.round(basePrice * 0.5));
        
        return {
          ...b,
          totalAmount: (b.totalAmount && b.totalAmount >= calculatedTotal) ? b.totalAmount : calculatedTotal
        };
      });

      setBookings(normalizedBookings);
      setPackages(pList);
      setContactMessages(cList);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text: newTaskText.trim(), time: "Just now", completed: false }
    ]);
    setNewTaskText("");
    setIsAddTaskOpen(false);
  };

  const handleApproveBooking = async (id: string) => {
    try {
      const token = adminStorage.getAdminToken() || tokenStorage.getToken() || undefined;
      const success = await api.approveBooking(id, token);
      if (success) {
        setBookings(prev => prev.map(b => b.bookingId === id ? { ...b, status: 'approved' } : b));
      }
    } catch (err) {
      console.error("Failed to approve booking:", err);
    }
  };

  const handleRejectBooking = async (id: string) => {
    if (!window.confirm(`Are you sure you want to reject booking #${id}?`)) return;
    try {
      const token = adminStorage.getAdminToken() || tokenStorage.getToken() || undefined;
      const success = await api.rejectBooking(id, token);
      if (success) {
        setBookings(prev => prev.map(b => b.bookingId === id ? { ...b, status: 'rejected' } : b));
      } else {
        setErrorPopupMessage(`Failed to reject booking #${id}.`);
      }
    } catch (err: any) {
      console.error("Failed to reject booking:", err);
      setErrorPopupMessage(err?.message || `Failed to reject booking #${id}.`);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete user booking #${id}?`)) return;
    try {
      const token = adminStorage.getAdminToken() || tokenStorage.getToken() || undefined;
      const res = await api.deleteBooking(id, token);
      
      const isSuccess = typeof res === 'boolean' ? res : res.success;
      if (isSuccess) {
        setBookings(prev => prev.filter(b => String(b.bookingId) !== String(id)));
      } else {
        // Fallback for foreign key constraint / active transaction data conflict:
        // Automatically reject the booking and remove it from active pipeline view.
        await api.rejectBooking(id, token);
        setBookings(prev => prev.filter(b => String(b.bookingId) !== String(id)));
        setErrorPopupMessage(`Booking #${id} has associated payment/permit records in the database. It has been marked as REJECTED and removed from your active pipeline.`);
      }
    } catch (err: any) {
      console.error("Failed to delete booking:", err);
      try {
        const token = adminStorage.getAdminToken() || tokenStorage.getToken() || undefined;
        await api.rejectBooking(id, token);
      } catch {}
      setBookings(prev => prev.filter(b => String(b.bookingId) !== String(id)));
    }
  };

  const handleViewPaymentDetails = async (bookingId: string) => {
    setIsLoadingPayment(true);
    setIsPaymentModalOpen(true);
    setSelectedPaymentDetails(null);
    try {
      const token = adminStorage.getAdminToken() || tokenStorage.getToken() || undefined;
      const details = await api.getBookingPaymentDetails(bookingId, token);
      const booking = bookings.find(b => b.bookingId === bookingId);
      
      // Determine correct payment status matching approved/rejected booking state
      let resolvedPaymentStatus = 'UNDER_VERIFICATION';
      if (booking?.status === 'approved') {
        resolvedPaymentStatus = 'APPROVED';
      } else if (booking?.status === 'rejected') {
        resolvedPaymentStatus = 'REJECTED';
      } else if (details?.paymentStatus && details.paymentStatus !== 'UNDER_VERIFICATION') {
        resolvedPaymentStatus = details.paymentStatus;
      } else if (details?.status && details.status !== 'UNDER_VERIFICATION') {
        resolvedPaymentStatus = details.status;
      }

      // Calculate total amount based on travelers
      const resolvedAmount = (booking?.totalAmount && booking.totalAmount > 0)
        ? booking.totalAmount
        : (details?.amount && details.amount > 0)
          ? details.amount
          : (details?.totalAmount && details.totalAmount > 0)
            ? details.totalAmount
            : 5000;

      if (details) {
        setSelectedPaymentDetails({
          bookingId: details.bookingId || bookingId,
          paymentStatus: resolvedPaymentStatus,
          amount: resolvedAmount,
          utrNumber: details.utrNumber || details.utr || booking?.utr || 'N/A',
          screenshotUrl: details.screenshotUrl || booking?.screenshotUrl || '',
          uploadedAt: details.uploadedAt || null,
          timestamp: details.timestamp || new Date().toISOString(),
          message: details.message || 'Payment details retrieved successfully.'
        });
      } else if (booking) {
        setSelectedPaymentDetails({
          bookingId: booking.bookingId,
          paymentStatus: resolvedPaymentStatus,
          amount: resolvedAmount,
          utrNumber: booking.utr || 'N/A',
          screenshotUrl: booking.screenshotUrl || '',
          uploadedAt: null,
          timestamp: new Date().toISOString(),
          message: 'Payment record retrieved from reservation ledger.'
        });
      }
    } catch (err) {
      console.error("Failed to fetch payment details:", err);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Package CRUD Handlers
  const handleOpenAddPackageModal = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: '',
      price: 5000,
      duration: '3 Days / 2 Nights',
      shortDescription: '',
      description: '',
      location: 'Valley of Flowers, Uttarakhand',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackageModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name || '',
      price: pkg.price || 5000,
      duration: pkg.duration || '3 Days / 2 Nights',
      shortDescription: pkg.shortDescription || '',
      description: pkg.description || pkg.shortDescription || '',
      location: pkg.location || 'Valley of Flowers, Uttarakhand',
      imageUrl: pkg.images?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageFormData.name.trim()) return;

    setIsSavingPackage(true);
    try {
      if (editingPackage) {
        // PUT /api/admin/packages/{id}
        await api.updatePackage(editingPackage.id, {
          name: packageFormData.name,
          price: Number(packageFormData.price),
          duration: packageFormData.duration,
          shortDescription: packageFormData.shortDescription || packageFormData.description,
          description: packageFormData.description,
          location: packageFormData.location,
          images: [packageFormData.imageUrl]
        });
      } else {
        // POST /api/admin/packages
        await api.createPackage({
          name: packageFormData.name,
          price: Number(packageFormData.price),
          duration: packageFormData.duration,
          shortDescription: packageFormData.shortDescription || packageFormData.description,
          description: packageFormData.description,
          location: packageFormData.location,
          imageUrl: packageFormData.imageUrl
        });
      }

      // Re-fetch packages from backend
      const updatedPackages = await api.getPackages();
      setPackages(updatedPackages);
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error("Failed to save package:", err);
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campsite package?")) return;
    try {
      // DELETE /api/admin/packages/{id}
      await api.deletePackage(id);
      setPackages(prev => prev.filter(p => String(p.id) !== String(id)));
    } catch (err: any) {
      console.error("Failed to delete package:", err);
      setErrorPopupMessage(err?.message || "Packages with existing bookings cannot be deleted.");
    }
  };

  // Open Edit Modal for a Booking
  const handleOpenEditModal = (booking: Booking) => {
    setEditFormData(JSON.parse(JSON.stringify(booking)));
    setIsEditModalOpen(true);
  };

  // Handle Edit Form Changes
  const handleEditInputChange = (field: keyof Booking, value: any) => {
    if (!editFormData) return;
    setEditFormData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      if (field === 'adults' || field === 'children') {
        const pkg = packages.find(p => String(p.id) === String(prev.packageId) || (p.name && prev.packageName && p.name.toLowerCase() === prev.packageName.toLowerCase()));
        const basePrice = pkg ? pkg.price : 5000;
        const adultsCount = field === 'adults' ? (parseInt(value) || 1) : (prev.adults || 1);
        const childrenCount = field === 'children' ? (parseInt(value) || 0) : (prev.children || 0);
        updated.totalAmount = (adultsCount * basePrice) + (childrenCount * Math.round(basePrice * 0.5));
      }
      return updated;
    });
  };

  const handleTravelerEditChange = (index: number, field: keyof TravelerDetail, value: any) => {
    if (!editFormData) return;
    const updatedTravelers = [...editFormData.travelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: field === 'age' ? parseInt(value) || 0 : value
    };
    setEditFormData(prev => prev ? { ...prev, travelers: updatedTravelers } : null);
  };

  // Save Booking Edit
  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setIsSavingEdit(true);
    try {
      const token = tokenStorage.getToken() || undefined;
      await api.updateBookingDetails(editFormData.bookingId, editFormData, token);

      setBookings(prev => prev.map(b => b.bookingId === editFormData.bookingId ? editFormData : b));
      setIsEditModalOpen(false);
      setEditFormData(null);
    } catch (err) {
      console.error("Failed to save booking edits:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenEmailComposer = (toEmail: string, defaultSubject = "", defaultMessage = "") => {
    setEmailTo(toEmail);
    setEmailSubject(defaultSubject || "Update regarding your Valley of Flowers Campsite Booking");
    setEmailBody(defaultMessage || `Dear Guest,\n\nThank you for reaching out to CampLife Adventures.\n\nWe have reviewed your request regarding your high-altitude campsite reservation...\n\nBest regards,\nCampLife Base Team`);
    setEmailFeedback(null);
    setIsEmailModalOpen(true);
  };

  const handleApplyEmailTemplate = (templateType: 'approval' | 'permit' | 'contact') => {
    if (templateType === 'approval') {
      setEmailSubject("Booking Confirmed — Valley of Flowers Campsite Slot Approved");
      setEmailBody(`Dear Camper,\n\nWe are pleased to inform you that your campsite reservation has been officially APPROVED!\n\nYour permits and trek guide allocation details will be sent to your registered mobile number 48 hours prior to your travel date.\n\nLocation: Ghangaria Base Camp, Uttarakhand\n\nWarm regards,\nCampLife Operations Desk`);
    } else if (templateType === 'permit') {
      setEmailSubject("Action Required — Forest Permit Identification Verification");
      setEmailBody(`Dear Camper,\n\nTo process your Valley of Flowers National Park entry permit, please ensure all guest ID proof numbers (Aadhaar / Passport) match your physical documents.\n\nOur team will collect permit fees at the Govindghat registration counter.\n\nBest regards,\nPermit Assistance Team`);
    } else if (templateType === 'contact') {
      setEmailSubject("Re: Your Query — CampLife Adventures Support Response");
      setEmailBody(`Hi there,\n\nThank you for contacting CampLife Support regarding your high-altitude trek query.\n\nAll alpine tents at Ghangaria base camp are equipped with high-density sleeping mats, waterproof outer flys, and 24/7 hot water supply.\n\nPlease let us know if you need any customized group arrangements!\n\nBest regards,\nCustomer Support`);
    }
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBody) {
      setEmailFeedback({ type: 'error', message: 'Please fill in all email fields' });
      return;
    }

    setIsSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await api.sendAdminEmail(
        emailTo,
        emailSubject,
        emailBody.replace(/\n/g, '<br/>'),
        emailBody
      );

      if (res.success) {
        setEmailFeedback({ type: 'success', message: res.message });
        setContactMessages(prev => prev.map(c => c.email.toLowerCase() === emailTo.toLowerCase() ? { ...c, status: 'replied', replyText: emailBody, repliedAt: new Date().toISOString() } : c));
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailFeedback(null);
        }, 2000);
      } else {
        setEmailFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      console.error(err);
      setEmailFeedback({ type: 'error', message: err.message || 'Failed to dispatch email' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Calendar Navigation Handlers
  const handlePrevDate = () => {
    setSelectedCalendarDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDate = () => {
    setSelectedCalendarDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleResetToToday = () => {
    setSelectedCalendarDate(new Date());
  };

  // Dates & Filtering Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = selectedCalendarDate.toISOString().split("T")[0];

  const todaysBookingsCount = bookings.filter(b => b.travelDate === todayStr || b.date === todayStr || ((b as any).createdAt && (b as any).createdAt.startsWith(todayStr))).length;
  const departuresForSelectedDate = bookings.filter(b => b.travelDate === selectedDateStr);

  const approvedBookingsCount = bookings.filter(b => b.status === 'approved').length;
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length;
  const rejectedBookingsCount = bookings.filter(b => b.status === 'rejected').length;

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const taskProgressPercent = Math.round((completedTasksCount / (tasks.length || 1)) * 100);

  // Filter Bookings for Bookings Tab
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.utr && b.utr.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Contact Messages
  const filteredContacts = contactMessages.filter(c => {
    if (contactFilter === 'all') return true;
    return c.status === contactFilter;
  });

  // Calendar 4-Day Pill Bar
  const calendarPillDays = [-1, 0, 1, 2].map(offset => {
    const d = new Date(selectedCalendarDate);
    d.setDate(d.getDate() + offset);
    return d;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="text-center space-y-3">
          <LoadingSpinner size={40} />
          <p className="text-sm font-semibold text-neutral-500 animate-pulse">Loading Admin Control Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-neutral-900 dark:bg-neutral-950 dark:text-white p-4 md:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* ========================================================================= */}
        {/* TOP NAVIGATION BAR                                                        */}
        {/* ========================================================================= */}
        <header className="rounded-[2.5rem] bg-white border border-neutral-100 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 px-6">

          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
            <Link href="/admin" className="flex items-center gap-2 font-black text-xl tracking-tight text-neutral-900 dark:text-white">
              <span className="size-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs font-black dark:bg-emerald-600">
                VA
              </span>
              ValleyAdmin
            </Link>

            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1.5 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                Bookings & Pipeline
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-4 py-2 rounded-xl transition-all relative ${activeTab === 'contact' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                Contact Messages
                {contactMessages.some(c => c.status === 'unread') && (
                  <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'packages' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                Campsites
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 relative hover:bg-slate-200 transition-colors">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200 dark:border-neutral-800">
              <div className="size-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-extrabold text-neutral-900 dark:text-white block leading-tight">{adminUser?.name || "Maya Chen"}</span>
                <span className="text-[10px] text-neutral-400">Valley Admin</span>
              </div>
            </div>
          </div>

        </header>


        {/* ========================================================================= */}
        {/* VIEW 1: MAIN DASHBOARD                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* TOP ROW: 3 Cards */}
            <div className="grid gap-6 md:grid-cols-3">

              {/* CARD 1: Hero Metric Card */}
              <div className="rounded-[2.5rem] bg-white p-7 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">
                    Bookings
                  </h2>
                  <p className="text-xs font-medium text-neutral-400">
                    High-altitude Valley of Flowers reservation ledger.
                  </p>
                </div>

                <div className="flex items-baseline justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
                  <div>
                    <div className="text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">
                      {bookings.length}
                    </div>
                    <p className="text-xs font-bold text-neutral-500">Total Bookings</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                      +{todaysBookingsCount}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Today's Bookings</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-neutral-950">
                    <span className="text-base font-black text-neutral-900 dark:text-white block">{approvedBookingsCount}</span>
                    <span className="text-[9px] font-bold text-emerald-600">Approved</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-neutral-950">
                    <span className="text-base font-black text-neutral-900 dark:text-white block">{pendingBookingsCount}</span>
                    <span className="text-[9px] font-bold text-amber-600">Verification</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-neutral-950">
                    <span className="text-base font-black text-neutral-900 dark:text-white block">{rejectedBookingsCount}</span>
                    <span className="text-[9px] font-bold text-rose-600">Cancelled</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Active Campsites Quick Overview & Management */}
              <div className="rounded-[2.5rem] bg-white p-7 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <MapPin className="size-4 text-emerald-600" /> Active Campsites
                    </h3>
                    <p className="text-xs font-medium text-neutral-400 mt-0.5">
                      {packages.length} Packages Configured
                    </p>
                  </div>
                  <Button
                    onClick={handleOpenAddPackageModal}
                    size="sm"
                    className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                  >
                    <Plus className="size-3.5" /> Add Package
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {packages.slice(0, 3).map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={pkg.images[0]} alt={pkg.name} className="size-10 rounded-xl object-cover shrink-0" />
                        <div>
                          <strong className="font-extrabold text-neutral-900 dark:text-white block line-clamp-1">{pkg.name}</strong>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">₹{pkg.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditPackageModal(pkg)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-900 transition-colors"
                          title="Edit Package"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-neutral-900 transition-colors"
                          title="Delete Package"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span>Valley of Flowers Base Camp</span>
                  <button onClick={() => setActiveTab('packages')} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
                    Manage all campsites &rarr;
                  </button>
                </div>
              </div>

              {/* CARD 3: Recent Bookings List Card */}
              <div className="rounded-[2.5rem] bg-white p-7 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b pb-3 border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    Recent Bookings
                  </h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {bookings.slice(0, 5).map((b, idx) => (
                    <div key={b.bookingId || idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/50 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center dark:bg-neutral-800 shrink-0">
                          {b.fullName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-neutral-800 dark:text-neutral-200 block leading-tight">{b.fullName}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{b.bookingId} • {b.travelDate}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-neutral-900 dark:text-white block text-xs">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${b.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                          {b.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>


            {/* BOTTOM ROW: 2 Cards */}
            <div className="grid gap-6 md:grid-cols-3">

              {/* CARD 4: Trek Departure Calendar Card */}
              <div className="md:col-span-2 rounded-[2.5rem] bg-white p-7 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-6 flex flex-col justify-between">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon className="size-5 text-emerald-600" /> Trek Departure Calendar & Date Filter
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Filter bookings by departure date using Previous/Next controls
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                    <Button
                      onClick={handlePrevDate}
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-neutral-200 dark:border-neutral-800 text-xs font-bold h-9 px-3"
                    >
                      <ChevronLeft className="size-4 mr-1" /> Prev Date
                    </Button>
                    <Button
                      onClick={handleResetToToday}
                      size="sm"
                      variant="outline"
                      className={`rounded-xl text-xs font-bold h-9 px-3 ${selectedDateStr === todayStr
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                    >
                      Today
                    </Button>
                    <Button
                      onClick={handleNextDate}
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-neutral-200 dark:border-neutral-800 text-xs font-bold h-9 px-3"
                    >
                      Next Date <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  {calendarPillDays.map((d, idx) => {
                    const dStr = d.toISOString().split("T")[0];
                    const isSelected = dStr === selectedDateStr;
                    const isToday = dStr === todayStr;
                    const countOnDate = bookings.filter(b => b.travelDate === dStr).length;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCalendarDate(d)}
                        className={`cursor-pointer rounded-2xl p-3.5 transition-all relative ${isSelected
                          ? 'bg-neutral-900 text-white dark:bg-emerald-600 shadow-md scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                          }`}
                      >
                        <span className="text-[10px] block font-bold uppercase opacity-80">
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className={`text-xl font-black block ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                          {d.getDate()}
                        </span>
                        <span className="text-[10px] block font-semibold opacity-80">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${isSelected
                          ? 'bg-white/20 text-white'
                          : countOnDate > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'
                          }`}>
                          {countOnDate} {countOnDate === 1 ? 'Trekker' : 'Trekkers'}
                        </span>

                        {isToday && (
                          <span className="absolute -top-1 -right-1 rounded-full bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 shadow-xs">
                            Today
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-neutral-800 dark:text-neutral-200">
                      Departures for {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}:
                    </span>
                    <span className="text-neutral-400 font-semibold">{departuresForSelectedDate.length} booking(s)</span>
                  </div>

                  {departuresForSelectedDate.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-2 bg-slate-50/40 dark:bg-neutral-950/40">
                      <CalendarIcon className="size-8 text-neutral-300 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        No trek departures scheduled for {selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                      </p>
                      <button
                        onClick={handleResetToToday}
                        className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400 inline-block"
                      >
                        Jump to Today's Departures &rarr;
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {departuresForSelectedDate.map((b) => (
                        <div
                          key={b.bookingId}
                          className="rounded-2xl border border-neutral-100 bg-slate-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <strong className="text-xs font-extrabold text-neutral-900 dark:text-white block">{b.fullName}</strong>
                              <span className="text-[10px] text-neutral-400 font-mono">{b.bookingId} • {b.packageName}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                              }`}>
                              {b.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs border-t pt-2 border-neutral-100 dark:border-neutral-800">
                            <span className="text-[10px] font-bold text-neutral-500">
                              {b.adults + b.children} Travelers ({b.adults}A, {b.children}C)
                            </span>
                            <Button
                              onClick={() => handleOpenEmailComposer(b.email, `Departure Reminder — ${b.bookingId}`, `Hi ${b.fullName},\n\nThis is a reminder for your trek departure scheduled for ${b.travelDate}.\n\nPlease arrive at Govindghat Base counter by 7:30 AM.\n\nWarm regards,\nValley Base Operations`)}
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-[10px] h-7 px-2 border-neutral-200 dark:border-neutral-800"
                            >
                              Send Reminder Email
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* CARD 5: Today's Admin Tasks Card */}
              <div className="rounded-[2.5rem] bg-white p-7 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-5 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b pb-3 border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    Today's Admin Tasks
                  </h3>
                  <span className="text-xs font-bold text-neutral-400">{completedTasksCount} of {tasks.length} completed</span>
                </div>

                <div className="space-y-3">
                  {tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className="cursor-pointer flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {t.completed ? (
                          <CheckSquare className="size-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="size-4 text-neutral-300 shrink-0" />
                        )}
                        <span className={`font-semibold ${t.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                          {t.text}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0 font-mono">{t.time}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                    <span>Task Completion</span>
                    <span>{taskProgressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${taskProgressPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setIsAddTaskOpen(true)}
                      className="text-xs font-bold text-neutral-800 hover:text-emerald-600 dark:text-neutral-200 dark:hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Plus className="size-3.5" /> Add task
                    </button>
                    <span className="text-[10px] text-neutral-400">View all &rarr;</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ========================================================================= */}
        {/* VIEW 2: CONTACT MESSAGES PANEL                                            */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-6">

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-neutral-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Mail className="size-5 text-emerald-600" /> User Contact Messages
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Messages submitted by trekkers via the contact form (`POST /api/contact`)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setContactFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${contactFilter === 'all' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500'
                        }`}
                    >
                      All ({contactMessages.length})
                    </button>
                    <button
                      onClick={() => setContactFilter('unread')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${contactFilter === 'unread' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500'
                        }`}
                    >
                      Unread ({contactMessages.filter(c => c.status === 'unread').length})
                    </button>
                    <button
                      onClick={() => setContactFilter('replied')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${contactFilter === 'replied' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500'
                        }`}
                    >
                      Replied ({contactMessages.filter(c => c.status === 'replied').length})
                    </button>
                  </div>
                  <Button
                    onClick={async () => {
                      const list = await api.getContactMessages();
                      setContactMessages(list);
                    }}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 h-9"
                  >
                    <RefreshCw className="size-3.5" /> Refresh
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-xs text-neutral-400">
                    No contact messages found in this category.
                  </div>
                ) : (
                  filteredContacts.map(msg => (
                    <div
                      key={msg.id}
                      className={`rounded-2xl border p-5 transition-all space-y-3 ${msg.status === 'unread'
                        ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-sm'
                        : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center dark:bg-neutral-800 shrink-0">
                            {msg.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-sm font-extrabold text-neutral-900 dark:text-white block leading-tight">{msg.name}</strong>
                            <span className="text-xs text-neutral-400 flex items-center gap-2">
                              <span>{msg.email}</span> • <span>{msg.phone}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(msg.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${msg.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                            }`}>
                            {msg.status === 'replied' ? '✓ Replied' : 'Unread'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        "{msg.message}"
                      </div>

                      {msg.replyText && (
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                          <strong className="text-[10px] font-extrabold uppercase tracking-wider block text-emerald-600">Admin Email Reply Sent:</strong>
                          <p className="italic">"{msg.replyText}"</p>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={() => handleOpenEmailComposer(
                            msg.email,
                            `Re: Your Campsite Inquiry — CampLife Adventures Support`,
                            `Hi ${msg.name},\n\nThank you for reaching out to CampLife Adventures!\n\nRegarding your inquiry:\n"${msg.message}"\n\nHeres the response:\n...\n\nWarm regards,\nCampLife Support Team`
                          )}
                          size="sm"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 flex items-center gap-1.5"
                        >
                          <Send className="size-3.5" /> Reply via Email Panel
                        </Button>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* VIEW 3: BOOKINGS & PIPELINE TABLE VIEW (WITH UTR, SCREENSHOT VIEW & EDIT) */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-6">

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-neutral-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Compass className="size-5 text-emerald-600" /> Bookings Pipeline
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Full customer reservation ledger, payment proof verification & editing</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex items-center flex-1 sm:w-64">
                    <Search className="size-4 text-neutral-400 absolute left-3" />
                    <Input
                      type="text"
                      placeholder="Search name, UTR, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-xl pl-9 text-xs h-9 border-neutral-200 dark:border-neutral-800"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-9 rounded-xl border border-neutral-200 bg-transparent px-3 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-neutral-950/80 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Session ID</th>
                      <th className="py-3.5 px-4">Camper Info</th>
                      <th className="py-3.5 px-4">Package</th>
                      <th className="py-3.5 px-4">Travel Date</th>
                      <th className="py-3.5 px-4 text-center">Guests</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Payment & UTR</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    {filteredBookings.map((b) => {
                      const truncatedId = b.bookingId.length > 14 ? `${b.bookingId.slice(0, 8)}...${b.bookingId.slice(-4)}` : b.bookingId;
                      return (
                        <tr key={b.bookingId} className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-[11px] font-mono font-bold border border-neutral-200 dark:border-neutral-700" title={b.bookingId}>
                              {truncatedId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <strong className="text-neutral-900 dark:text-white block font-black text-xs leading-tight">{b.fullName}</strong>
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">{b.mobileNumber}</span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">
                            {b.packageName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                            {b.travelDate}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]">
                              {b.adults + b.children}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-sm">
                            ₹{b.totalAmount.toLocaleString('en-IN')}
                          </td>

                          {/* PAYMENT & UTR COLUMN WITH SCREENSHOT & DETAILS VIEW */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="font-mono text-[11px] font-extrabold block text-neutral-700 dark:text-neutral-300">
                                {b.utr ? `UTR: ${b.utr}` : (b.screenshotUrl === 'PAY_ON_SPOT' ? 'Pay on Spot' : 'N/A')}
                              </span>
                              <button
                                onClick={() => handleViewPaymentDetails(b.bookingId)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold hover:bg-emerald-100 transition-colors border border-emerald-200/60 dark:border-emerald-900/50"
                              >
                                <Eye className="size-3" /> View Payment Details
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              b.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                : b.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                            }`}>
                              {b.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                onClick={() => handleOpenEditModal(b)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-[11px] h-7 px-2.5 border-neutral-200 dark:border-neutral-800 font-bold hover:bg-slate-100"
                                title="Edit details"
                              >
                                <Edit className="size-3 mr-1" /> Edit
                              </Button>

                              {b.status !== 'approved' && (
                                <Button
                                  onClick={() => handleApproveBooking(b.bookingId)}
                                  size="sm"
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-7 px-2.5 shadow-xs"
                                >
                                  Approve
                                </Button>
                              )}

                              {b.status !== 'rejected' && (
                                <Button
                                  onClick={() => handleRejectBooking(b.bookingId)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl text-[11px] h-7 px-2.5 font-bold text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/40"
                                >
                                  Reject
                                </Button>
                              )}

                              <Button
                                onClick={() => handleOpenEmailComposer(b.email, `Booking Update — ${b.bookingId}`, `Hi ${b.fullName},\n\nYour campsite booking status is ${b.status.toUpperCase()}.\n\nTotal Amount: ₹${b.totalAmount}\n\nBest regards,\nValley Base Team`)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-[11px] h-7 px-2.5 border-neutral-200 dark:border-neutral-800 font-bold"
                                title="Send email"
                              >
                                Email
                              </Button>

                              <Button
                                onClick={() => handleDeleteBooking(b.bookingId)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-[11px] h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/30 font-bold"
                                title="Delete Booking"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* VIEW 4: CAMPSITES / PACKAGES VIEW                                         */}
        {/* ========================================================================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-neutral-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <MapPin className="size-5 text-emerald-600" /> Active Campsite Packages
                  </h2>
                  <span className="text-xs text-neutral-400">Total packages: {packages.length}</span>
                </div>
                <Button
                  onClick={handleOpenAddPackageModal}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="size-4" /> Add New Package
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map(pkg => (
                  <div key={pkg.id} className="rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-3 bg-slate-50/50 dark:bg-neutral-950 flex flex-col justify-between">
                    <div className="space-y-3">
                      <img src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'} alt={pkg.name} className="aspect-video w-full rounded-xl object-cover" />
                      <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">{pkg.name}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2">{pkg.shortDescription || pkg.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-600">₹{pkg.price.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-bold text-neutral-400 bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border">{pkg.duration}</span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          onClick={() => handleOpenEditPackageModal(pkg)}
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-8 font-bold border-neutral-200 dark:border-neutral-800 flex items-center gap-1"
                        >
                          <Edit className="size-3.5" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeletePackage(pkg.id)}
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-8 font-bold text-rose-600 border-rose-100 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/30 flex items-center gap-1"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>


      {/* ========================================================================= */}
      {/* EDIT BOOKING DETAILS MODAL (Admin Editable Form!)                         */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl my-8 rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-6 relative max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Edit className="size-5 text-emerald-600" /> Edit Booking #{editFormData.bookingId}
                </h3>
                <span className="text-xs text-neutral-400">Update customer parameters, UTR, and traveler details</span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingEdit} className="space-y-5 text-xs">

              {/* Row 1: Contact Details */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Lead Full Name *</label>
                  <Input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Mobile Number *</label>
                  <Input
                    type="tel"
                    required
                    value={editFormData.mobileNumber}
                    onChange={(e) => handleEditInputChange('mobileNumber', e.target.value)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>

              {/* Row 2: Travel Date, Package, Amount */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Travel Date *</label>
                  <Input
                    type="date"
                    required
                    value={editFormData.travelDate}
                    onChange={(e) => handleEditInputChange('travelDate', e.target.value)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Adults *</label>
                  <Input
                    type="number"
                    min={1}
                    value={editFormData.adults}
                    onChange={(e) => handleEditInputChange('adults', parseInt(e.target.value) || 1)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Children</label>
                  <Input
                    type="number"
                    min={0}
                    value={editFormData.children}
                    onChange={(e) => handleEditInputChange('children', parseInt(e.target.value) || 0)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Total Amount (₹) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={editFormData.totalAmount}
                    onChange={(e) => handleEditInputChange('totalAmount', parseInt(e.target.value) || 0)}
                    className="rounded-xl h-9 text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>

              {/* Row 3: UTR & Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Payment UTR Number</label>
                  <Input
                    type="text"
                    placeholder="12-digit UTR number"
                    value={editFormData.utr || ""}
                    onChange={(e) => handleEditInputChange('utr', e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Booking Status *</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleEditInputChange('status', e.target.value as any)}
                    className="flex h-9 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Individual Traveler Details List */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[10px] block">
                  Individual Traveler Credentials ({editFormData.travelers.length}):
                </span>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {editFormData.travelers.map((t, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-4 p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block">Name</label>
                        <Input
                          type="text"
                          value={t.fullName}
                          onChange={(e) => handleTravelerEditChange(idx, 'fullName', e.target.value)}
                          className="rounded-lg h-7 text-[11px] border-neutral-200 dark:border-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block">Age</label>
                        <Input
                          type="number"
                          value={t.age}
                          onChange={(e) => handleTravelerEditChange(idx, 'age', e.target.value)}
                          className="rounded-lg h-7 text-[11px] border-neutral-200 dark:border-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block">ID Proof Type</label>
                        <select
                          value={t.idProofType}
                          onChange={(e) => handleTravelerEditChange(idx, 'idProofType', e.target.value)}
                          className="flex h-7 w-full rounded-lg border border-neutral-200 bg-transparent px-2 text-[11px] dark:border-neutral-800 dark:bg-neutral-900"
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Driving License">Driving License</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 block">ID Number</label>
                        <Input
                          type="text"
                          value={t.idProofNumber}
                          onChange={(e) => handleTravelerEditChange(idx, 'idProofNumber', e.target.value)}
                          className="rounded-lg h-7 text-[11px] border-neutral-200 dark:border-neutral-800 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (editFormData) {
                      setIsEditModalOpen(false);
                      handleDeleteBooking(editFormData.bookingId);
                    }
                  }}
                  className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/30 flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" /> Delete Booking
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl text-xs font-bold border-neutral-200 dark:border-neutral-800"
                  >
                    Cancel
                  </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <LoadingSpinner size={16} className="text-white mr-1" />
                      Saving Edits...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save Booking Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            </form>

          </div>
        </div>
      )}


      {/* INTERACTIVE EMAIL COMPOSER DRAWER / MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-6 relative">
            <div className="flex items-center justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Send className="size-5 text-emerald-600" /> Compose Email (SMTP Panel)
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Quick Email Templates:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyEmailTemplate('approval')}
                  className="rounded-xl border border-neutral-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  ✓ Booking Approval
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyEmailTemplate('permit')}
                  className="rounded-xl border border-neutral-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  📋 Permit Info Request
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyEmailTemplate('contact')}
                  className="rounded-xl border border-neutral-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  💬 Inquiry Reply
                </button>
              </div>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">To Email Address *</label>
                <Input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Subject *</label>
                <Input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Message Body *</label>
                <Textarea
                  required
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800 font-mono"
                />
              </div>

              {emailFeedback && (
                <div className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${emailFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                  }`}>
                  {emailFeedback.type === 'success' ? <CheckCircle className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{emailFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-xl text-xs font-bold border-neutral-200 dark:border-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingEmail}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  {isSendingEmail ? (
                    <>
                      <LoadingSpinner size={16} className="text-white mr-1" />
                      Sending via SMTP...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" /> Dispatch Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Add Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Add New Admin Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <Input
                type="text"
                placeholder="e.g. Verify forest checkpoint entries for Group B"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CAMPSITE PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl my-8 rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-6 relative max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <MapPin className="size-5 text-emerald-600" />
                  {editingPackage ? `Edit Package: ${editingPackage.name}` : 'Add New Campsite Package'}
                </h3>
                <span className="text-xs text-neutral-400">Configure trek details, pricing, and media</span>
              </div>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Package Title / Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Valley of Flowers Deluxe Trek"
                  value={packageFormData.name}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Price (₹) *</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={packageFormData.price}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">Duration *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 6 Days / 5 Nights"
                    value={packageFormData.duration}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Location *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Ghangaria Base Camp, Uttarakhand"
                  value={packageFormData.location}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Image URL *</label>
                <Input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={packageFormData.imageUrl}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Short Description *</label>
                <Textarea
                  required
                  rows={2}
                  placeholder="Brief summary of the trek package..."
                  value={packageFormData.shortDescription}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Detailed Description</label>
                <Textarea
                  rows={3}
                  placeholder="Full trek highlights, inclusions, and campsite features..."
                  value={packageFormData.description}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl text-xs border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="rounded-xl text-xs font-bold border-neutral-200 dark:border-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPackage}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  {isSavingPackage ? (
                    <>
                      <LoadingSpinner size={16} className="text-white mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {editingPackage ? 'Update Package' : 'Create Package'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILS AUDIT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-tight">
                    Payment Verification Audit
                  </h3>
                  <span className="text-xs text-neutral-400">Complete transaction details & receipt proof</span>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {isLoadingPayment ? (
              <div className="py-16 text-center space-y-3">
                <LoadingSpinner size={36} className="mx-auto text-emerald-600" />
                <p className="text-xs font-bold text-neutral-500 animate-pulse">Retrieving Payment Verification Ledger...</p>
              </div>
            ) : selectedPaymentDetails ? (
              <div className="space-y-5 text-xs">
                
                {/* System Message Banner */}
                {selectedPaymentDetails.message && (
                  <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                    <Sparkles className="size-4 shrink-0 text-emerald-600" />
                    <span>{selectedPaymentDetails.message}</span>
                  </div>
                )}

                {/* Grid 1: Key Payment Metrics */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Booking Reference ID</span>
                    <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 truncate" title={selectedPaymentDetails.bookingId}>
                      <span className="truncate block">{selectedPaymentDetails.bookingId}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Payment Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide ${
                      selectedPaymentDetails.paymentStatus === 'APPROVED' || selectedPaymentDetails.paymentStatus === 'VERIFIED' || selectedPaymentDetails.paymentStatus === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : selectedPaymentDetails.paymentStatus === 'REJECTED' || selectedPaymentDetails.paymentStatus === 'FAILED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                    }`}>
                      <span className="size-2 rounded-full bg-current" />
                      {selectedPaymentDetails.paymentStatus || selectedPaymentDetails.status || 'UNDER_VERIFICATION'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Amount</span>
                    <strong className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                      ₹{Number(selectedPaymentDetails.amount ?? selectedPaymentDetails.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">UTR Reference Number</span>
                    <div className="font-mono text-xs font-extrabold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <span>{selectedPaymentDetails.utrNumber || selectedPaymentDetails.utr || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Details Table List */}
                <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                  <div className="flex justify-between p-3">
                    <span className="text-neutral-400 font-semibold">Uploaded Date / Time:</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {selectedPaymentDetails.uploadedAt ? new Date(selectedPaymentDetails.uploadedAt).toLocaleString('en-US') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-neutral-400 font-semibold">Server Audit Timestamp:</span>
                    <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                      {selectedPaymentDetails.timestamp ? new Date(selectedPaymentDetails.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Screenshot Proof Card */}
                {selectedPaymentDetails.screenshotUrl && selectedPaymentDetails.screenshotUrl !== 'PAY_ON_SPOT' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Payment Screenshot Proof:</span>
                      <a
                        href={selectedPaymentDetails.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 flex items-center gap-1"
                      >
                        Open Original Image &rarr;
                      </a>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-2 text-center">
                      <img
                        src={selectedPaymentDetails.screenshotUrl}
                        alt="Payment Receipt Proof"
                        className="w-full max-h-72 object-contain mx-auto rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-center font-medium">
                    No screenshot proof uploaded (Zero advance / Pay on spot booking).
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-bold px-6 h-10 shadow-md"
                  >
                    Done & Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400">
                No payment details available for this booking.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTION RESTRICTED ERROR POPUP MODAL */}
      {errorPopupMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-5 text-center relative animate-in zoom-in-95 duration-200">
            <div className="size-14 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="size-7 shrink-0" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                Action Restricted
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
                {errorPopupMessage}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setErrorPopupMessage(null)}
                className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs h-11 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md"
              >
                Understand & Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
