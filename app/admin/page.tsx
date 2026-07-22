"use client";

import { useState, useEffect } from "react";
import { api, Booking, Package, TravelerDetail } from "@/services/api";
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
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  User,
  Info,
  MapPin,
  Sparkles,
  Check,
  FileText
} from "lucide-react";

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal control states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tab view controller
  const [activeTab, setActiveTab] = useState<'bookings' | 'packages'>('bookings');

  // Campsite/Package management states
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isEditingPkg, setIsEditingPkg] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    id: "",
    name: "",
    price: 0,
    duration: "",
    shortDescription: "",
    description: "",
    images: "",
    location: "",
    stay: "",
    meals: "",
    inclusions: "",
    exclusions: ""
  });

  const openAddPkgModal = () => {
    setIsEditingPkg(false);
    setPkgForm({
      id: "",
      name: "",
      price: 9999,
      duration: "3 Days / 2 Nights",
      shortDescription: "",
      description: "",
      images: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      location: "Valley Base Camp, Ghangaria",
      stay: "Alpine Tents",
      meals: "Breakfast, Lunch, Dinner",
      inclusions: "Forest Entry Permits, Experienced Guide, Stay on sharing basis, Meals as specified",
      exclusions: "Personal expenses, Porter or mule charges, Insurance, Travel to base point"
    });
    setIsPkgModalOpen(true);
  };

  const openEditPkgModal = (pkg: Package) => {
    setIsEditingPkg(true);
    setEditingPackage(pkg);
    setPkgForm({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      shortDescription: pkg.shortDescription,
      description: pkg.description,
      images: pkg.images.join(", "),
      location: pkg.location,
      stay: pkg.stay,
      meals: pkg.meals.join(", "),
      inclusions: pkg.inclusions.join(", "),
      exclusions: pkg.exclusions.join(", ")
    });
    setIsPkgModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate brief network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mealsArr = pkgForm.meals.split(",").map(s => s.trim()).filter(Boolean);
    const inclusionsArr = pkgForm.inclusions.split(",").map(s => s.trim()).filter(Boolean);
    const exclusionsArr = pkgForm.exclusions.split(",").map(s => s.trim()).filter(Boolean);
    const imagesArr = pkgForm.images.split(",").map(s => s.trim()).filter(Boolean);

    const durationDays = parseInt(pkgForm.duration) || 3;
    const itinerary = Array.from({ length: durationDays }).map((_, i) => ({
      day: i + 1,
      title: i === 0 ? "Arrival & Camp setup" : i === durationDays - 1 ? "Departure & Farewell" : "Explore Trails",
      activities: [`Activity details for Day ${i + 1} at the campsite.`]
    }));

    const packageData: Package = {
      id: isEditingPkg && editingPackage ? editingPackage.id : pkgForm.id || pkgForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: pkgForm.name,
      price: Number(pkgForm.price),
      duration: pkgForm.duration,
      shortDescription: pkgForm.shortDescription,
      description: pkgForm.description,
      images: imagesArr.length > 0 ? imagesArr : ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"],
      location: pkgForm.location,
      stay: pkgForm.stay,
      meals: mealsArr,
      inclusions: inclusionsArr,
      exclusions: exclusionsArr,
      itinerary: isEditingPkg && editingPackage ? editingPackage.itinerary : itinerary
    };

    let success = false;
    if (isEditingPkg && editingPackage) {
      success = await api.updatePackage(editingPackage.id, packageData);
    } else {
      success = await api.createPackage(packageData);
    }

    setIsSaving(false);
    if (success) {
      setIsPkgModalOpen(false);
      loadData();
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm("Are you sure you want to delete this campsite package?")) {
      setIsLoading(true);
      await api.deletePackage(id);
      loadData();
    }
  };

  // Form states for Editing/Adding
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [newBookingForm, setNewBookingForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    packageId: "",
    travelDate: "",
    adults: 1,
    children: 0,
    specialRequests: "",
    status: "approved" as Booking["status"],
    travelers: [] as TravelerDetail[]
  });

  // Load bookings and packages
  const loadData = async () => {
    try {
      setIsLoading(true);
      const pkgData = await api.getPackages();
      setPackages(pkgData);
      
      // Load all bookings
      const bookingData = await api.getAllBookings();
      setBookings(bookingData);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Seed Mock Bookings
  const handleSeedMockData = () => {
    const mockBookings: Booking[] = [
      {
        bookingId: "BK-829104",
        userId: "usr-4921",
        fullName: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        mobileNumber: "9876543210",
        packageId: "luxury-swiss-camp",
        packageName: "Valley Vista Swiss Luxury Camp",
        adults: 2,
        children: 1,
        travelDate: "2026-08-10",
        specialRequests: "Prefer ground floor camp near dining area.",
        travelers: [
          { fullName: "Aarav Sharma", age: 34, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "1234-5678-9012" },
          { fullName: "Priya Sharma", age: 31, gender: "Female", idProofType: "Aadhaar Card", idProofNumber: "9876-5432-1098" },
          { fullName: "Kabir Sharma", age: 7, gender: "Male", idProofType: "School ID", idProofNumber: "SCH-998" }
        ],
        totalAmount: 37497.5, // (2 * 14999) + (1 * 14999 * 0.5)
        status: "approved",
        utr: "UTR9928104812",
        screenshotName: "aarav_payment_receipt.png",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        bookingId: "BK-194012",
        userId: "usr-8812",
        fullName: "Meera Nair",
        email: "meera.nair@example.com",
        mobileNumber: "8899001122",
        packageId: "explorer-dome-camp",
        packageName: "Adventure Trekker's Dome Camp",
        adults: 1,
        children: 0,
        travelDate: "2026-08-15",
        specialRequests: "Vegetarian meals only.",
        travelers: [
          { fullName: "Meera Nair", age: 26, gender: "Female", idProofType: "Passport", idProofNumber: "L882910" }
        ],
        totalAmount: 8999,
        status: "pending",
        utr: "UTR8829104812",
        screenshotName: "meera_payment.jpg",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        bookingId: "BK-472091",
        userId: "usr-3209",
        fullName: "Rahul Verma",
        email: "rahul.verma@example.com",
        mobileNumber: "7766554433",
        packageId: "eco-wilderness-camp",
        packageName: "Valley Wilderness Eco Camp",
        adults: 2,
        children: 0,
        travelDate: "2026-09-02",
        specialRequests: "",
        travelers: [
          { fullName: "Rahul Verma", age: 29, gender: "Male", idProofType: "Voter ID", idProofNumber: "XYZ998124" },
          { fullName: "Siddharth Goel", age: 28, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "4455-6677-8899" }
        ],
        totalAmount: 11998,
        status: "pending_payment",
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        bookingId: "BK-991204",
        userId: "usr-5521",
        fullName: "Ananya Sen",
        email: "ananya.sen@example.com",
        mobileNumber: "9001122334",
        packageId: "luxury-swiss-camp",
        packageName: "Valley Vista Swiss Luxury Camp",
        adults: 3,
        children: 0,
        travelDate: "2026-08-22",
        specialRequests: "Arriving late evening, please save dinner.",
        travelers: [
          { fullName: "Ananya Sen", age: 42, gender: "Female", idProofType: "Passport", idProofNumber: "Z112233" },
          { fullName: "Sujata Sen", age: 67, gender: "Female", idProofType: "Aadhaar Card", idProofNumber: "8899-7766-5544" },
          { fullName: "Rohan Sen", age: 15, gender: "Male", idProofType: "School ID", idProofNumber: "SCH-771" }
        ],
        totalAmount: 44997,
        status: "rejected",
        utr: "UTR0012938120",
        screenshotName: "failed_tx_screenshot.png",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    localStorage.setItem("bookings", JSON.stringify(mockBookings));
    loadData();
  };

  // Delete a booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm(`Are you sure you want to delete Booking ${bookingId}?`)) {
      const success = await api.deleteBooking(bookingId);
      if (success) {
        setBookings(bookings.filter(b => b.bookingId !== bookingId));
      }
    }
  };

  // Change status of booking
  const handleStatusChange = async (bookingId: string, status: Booking["status"]) => {
    const success = await api.updateBookingStatus(bookingId, status);
    if (success) {
      setBookings(bookings.map(b => b.bookingId === bookingId ? { ...b, status } : b));
    }
  };

  // Open Details Modal
  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (booking: Booking) => {
    setEditingBooking({ ...booking });
    setIsEditModalOpen(true);
  };

  // Update traveler details in Edit form
  const handleEditTravelerChange = (index: number, field: keyof TravelerDetail, value: string | number) => {
    if (!editingBooking) return;
    const updatedTravelers = [...editingBooking.travelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value
    };
    setEditingBooking({
      ...editingBooking,
      travelers: updatedTravelers
    });
  };

  // Add/Remove traveler inside Edit Form
  const addEditTraveler = () => {
    if (!editingBooking) return;
    const newGuest: TravelerDetail = { fullName: "", age: 25, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "" };
    setEditingBooking({
      ...editingBooking,
      travelers: [...editingBooking.travelers, newGuest]
    });
  };

  const removeEditTraveler = (index: number) => {
    if (!editingBooking) return;
    const filtered = editingBooking.travelers.filter((_, i) => i !== index);
    setEditingBooking({
      ...editingBooking,
      travelers: filtered
    });
  };

  // Save Edits
  const saveBookingEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setIsSaving(true);
    // Simulate brief network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Resolve packageName
    const pkg = packages.find(p => p.id === editingBooking.packageId);
    const updatedFields: Partial<Booking> = {
      fullName: editingBooking.fullName,
      email: editingBooking.email,
      mobileNumber: editingBooking.mobileNumber,
      packageId: editingBooking.packageId,
      packageName: pkg ? pkg.name : editingBooking.packageName,
      travelDate: editingBooking.travelDate,
      adults: Number(editingBooking.adults),
      children: Number(editingBooking.children),
      specialRequests: editingBooking.specialRequests,
      status: editingBooking.status,
      travelers: editingBooking.travelers,
      utr: editingBooking.utr,
      screenshotName: editingBooking.screenshotName
    };

    const success = await api.updateBooking(editingBooking.bookingId, updatedFields);
    setIsSaving(false);
    if (success) {
      // Reload from localstorage to capture calculated amount
      const allData = await api.getAllBookings();
      setBookings(allData);
      setIsEditModalOpen(false);
      setEditingBooking(null);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setNewBookingForm({
      fullName: "",
      email: "",
      mobileNumber: "",
      packageId: packages[0]?.id || "",
      travelDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      adults: 1,
      children: 0,
      specialRequests: "",
      status: "approved",
      travelers: [{ fullName: "", age: 30, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "" }]
    });
    setIsAddModalOpen(true);
  };

  // Handle Add Form traveler update
  const handleAddTravelerChange = (index: number, field: keyof TravelerDetail, value: string | number) => {
    const updatedTravelers = [...newBookingForm.travelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value
    };
    setNewBookingForm({
      ...newBookingForm,
      travelers: updatedTravelers
    });
  };

  // Add/Remove traveler in Add Form
  const addAddTraveler = () => {
    const newGuest: TravelerDetail = { fullName: "", age: 30, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "" };
    setNewBookingForm({
      ...newBookingForm,
      travelers: [...newBookingForm.travelers, newGuest],
      adults: newBookingForm.adults + 1
    });
  };

  const removeAddTraveler = (index: number) => {
    const filtered = newBookingForm.travelers.filter((_, i) => i !== index);
    setNewBookingForm({
      ...newBookingForm,
      travelers: filtered,
      adults: Math.max(1, newBookingForm.adults - 1)
    });
  };

  // Submit Manual Booking Creation
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find(p => p.id === newBookingForm.packageId);
    if (!pkg) return;

    setIsSaving(true);
    // Simulate brief network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const rate = pkg.price;
    const adults = Number(newBookingForm.adults);
    const children = Number(newBookingForm.children);
    const totalAmount = (adults * rate) + (children * rate * 0.5);
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      bookingId,
      userId: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: newBookingForm.fullName,
      email: newBookingForm.email,
      mobileNumber: newBookingForm.mobileNumber,
      packageId: newBookingForm.packageId,
      packageName: pkg.name,
      adults,
      children,
      travelDate: newBookingForm.travelDate,
      specialRequests: newBookingForm.specialRequests,
      travelers: newBookingForm.travelers,
      totalAmount,
      status: newBookingForm.status,
      date: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
    existing.push(newBooking);
    localStorage.setItem("bookings", JSON.stringify(existing));

    loadData();
    setIsSaving(false);
    setIsAddModalOpen(false);
  };

  // Filter and sort computation
  const filteredBookings = bookings
    .filter((b) => {
      // Search term
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        b.bookingId.toLowerCase().includes(searchLower) ||
        b.fullName.toLowerCase().includes(searchLower) ||
        b.email.toLowerCase().includes(searchLower) ||
        b.packageName.toLowerCase().includes(searchLower);

      // Status
      const matchStatus = statusFilter === "all" || b.status === statusFilter;

      // Package
      const matchPackage = packageFilter === "all" || b.packageId === packageFilter;

      return matchSearch && matchStatus && matchPackage;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "price_high") {
        return b.totalAmount - a.totalAmount;
      } else if (sortBy === "price_low") {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });

  // Calculate statistics
  const totalCount = bookings.length;
  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const pendingApprovalCount = bookings.filter(b => b.status === "pending").length;
  const pendingPaymentCount = bookings.filter(b => b.status === "pending_payment").length;
  const totalRevenue = bookings
    .filter(b => b.status === "approved")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="size-3" /> System Console
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1.5">
            System Administration
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track user submissions, manage high-altitude campsite details, verify manual payment receipts, and configure camps.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'bookings' && (
            <>
              <Button
                onClick={handleSeedMockData}
                variant="outline"
                className="flex-1 md:flex-initial rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-950/20 text-xs font-bold h-10 px-4"
              >
                <RefreshCw className="size-3.5 mr-1.5 animate-spin-hover" /> Seed Mock Data
              </Button>
              <Button
                onClick={openAddModal}
                className="flex-1 md:flex-initial rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                <Plus className="size-4" /> Add Booking
              </Button>
            </>
          )}
          {activeTab === 'packages' && (
            <Button
              onClick={openAddPkgModal}
              className="flex-1 md:flex-initial rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
            >
              <Plus className="size-4" /> Add Campsite
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-800 gap-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-450 dark:text-emerald-450'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250'
          }`}
        >
          Bookings Registry
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2.5 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'packages'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-450 dark:text-emerald-450'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250'
          }`}
        >
          Manage Campsites
        </button>
      </div>

      {activeTab === 'bookings' && (
        <>
          {/* KPI Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        
        {/* KPI: Total Bookings */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between h-28">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Total Bookings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-neutral-800 dark:text-white">{totalCount}</span>
            <span className="text-[10px] font-bold text-neutral-400">campsites</span>
          </div>
          <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1">
            <Compass className="size-3 text-emerald-500" /> Active entries in localDB
          </div>
        </div>

        {/* KPI: Approved Revenue */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between h-28 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Approved Revenue</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="text-[9px] text-emerald-600/80 mt-2 flex items-center gap-1">
            <TrendingUp className="size-3" /> Fully verified deposits
          </div>
        </div>

        {/* KPI: Pending Verification */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between h-28">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Pending Approval</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingApprovalCount}</span>
            {pendingApprovalCount > 0 && (
              <span className="rounded bg-amber-50 px-1 text-[8px] font-extrabold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse">Action Required</span>
            )}
          </div>
          <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1">
            <Hourglass className="size-3 text-amber-500" /> Waiting for UTR review
          </div>
        </div>

        {/* KPI: Pending Checkout */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between h-28">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Pending Payment</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{pendingPaymentCount}</span>
          </div>
          <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1">
            <CreditCard className="size-3 text-orange-500" /> Checkout incomplete
          </div>
        </div>

        {/* KPI: Approved Count */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between h-28">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Approved Camps</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500">{approvedCount}</span>
          </div>
          <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1">
            <CheckCircle className="size-3 text-emerald-500" /> Permit codes allocated
          </div>
        </div>

      </div>

      {/* Interactive Filter and Control Bar */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
        
        {/* Row 1: Search & sorting */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Booking ID, Lead Guest, Email, or Camp Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-transparent py-2.5 pl-10 pr-4 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sort Select */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
              <SlidersHorizontal className="size-3.5 text-neutral-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none dark:border-neutral-800 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Amount: High to Low</option>
                <option value="price_low">Amount: Low to High</option>
              </select>
            </div>

            {/* Package Select */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
              <span>Campsite:</span>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none dark:border-neutral-800 dark:text-white"
              >
                <option value="all">All Campsites</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name.split(" ").slice(0, 3).join(" ")}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Status Pills filter */}
        <div className="flex flex-wrap gap-2 border-t pt-4 border-neutral-100 dark:border-neutral-800">
          {[
            { id: "all", label: "All Bookings", count: totalCount },
            { id: "pending", label: "Pending Approval", count: pendingApprovalCount, color: "bg-amber-100 text-amber-855 dark:bg-amber-950/40 dark:text-amber-300" },
            { id: "approved", label: "Approved / Verified", count: approvedCount, color: "bg-emerald-100 text-emerald-855 dark:bg-emerald-955/40 dark:text-emerald-300" },
            { id: "pending_payment", label: "Pending Payment", count: pendingPaymentCount, color: "bg-orange-100 text-orange-855 dark:bg-orange-955/40 dark:text-orange-350" },
            { id: "rejected", label: "Rejected", count: bookings.filter(b => b.status === "rejected").length, color: "bg-rose-100 text-rose-855 dark:bg-rose-955/40 dark:text-rose-300" }
          ].map(pill => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-neutral-800 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:bg-neutral-905/40 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                  isActive 
                    ? "bg-neutral-600 text-white dark:bg-neutral-200 dark:text-neutral-900" 
                    : pill.color || "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-350"
                }`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Bookings Registry Table / List */}
      <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 overflow-hidden">
        
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="size-12 text-neutral-350 mb-3" />
            <h3 className="text-base font-bold text-neutral-800 dark:text-white">No Bookings Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mt-1">
              {bookings.length === 0 
                ? "The database is currently empty. Click 'Seed Mock Data' above to populate bookings instantly." 
                : "No bookings match the selected status, campsite, or search filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                  <th className="py-4 px-5">Reference ID</th>
                  <th className="py-4 px-4">Camper Details</th>
                  <th className="py-4 px-4">Campsite & Travel Date</th>
                  <th className="py-4 px-4 text-center">Permits</th>
                  <th className="py-4 px-4 text-right">Total Price</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Manage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    {/* ID Reference & Date */}
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-extrabold tracking-tight text-neutral-900 dark:text-white">{booking.bookingId}</span>
                        <span className="block text-[9px] text-neutral-400 font-normal">
                          Booked {new Date(booking.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3 text-neutral-450" />
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">{booking.fullName}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-normal space-y-0.5">
                          <div className="flex items-center gap-1"><Mail className="size-3" /> {booking.email}</div>
                          <div className="flex items-center gap-1"><Phone className="size-3" /> {booking.mobileNumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Package details & Travel Date */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-emerald-600" />
                          <span className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{booking.packageName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-405 font-normal font-sans">
                          <Calendar className="size-3" />
                          <span>Check-in: <strong className="font-bold text-neutral-700 dark:text-neutral-300">{booking.travelDate}</strong></span>
                        </div>
                      </div>
                    </td>

                    {/* Travelers Count */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 rounded bg-neutral-100/60 dark:bg-neutral-805/80 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300">
                        <Users className="size-3" />
                        <span>{booking.adults + booking.children}</span>
                      </div>
                      <span className="block text-[9px] text-neutral-400 font-normal mt-0.5">
                        {booking.adults}A, {booking.children}C
                      </span>
                    </td>

                    {/* Price Amount */}
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-xs font-extrabold text-neutral-900 dark:text-white">
                        {formatCurrency(booking.totalAmount)}
                      </div>
                      <span className="block text-[8px] text-neutral-400 font-normal mt-0.5">
                        Includes permits & GST
                      </span>
                    </td>

                    {/* Status Select */}
                    <td className="py-4 px-4 text-center">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.bookingId, e.target.value as Booking["status"])}
                        className={`mx-auto rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide border-0 outline-none text-center block cursor-pointer transition-colors ${
                          booking.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : booking.status === "pending"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : booking.status === "pending_payment"
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        <option value="approved" className="bg-white dark:bg-neutral-900 text-emerald-600">Approved</option>
                        <option value="pending" className="bg-white dark:bg-neutral-900 text-amber-600">Pending Approval</option>
                        <option value="pending_payment" className="bg-white dark:bg-neutral-900 text-orange-600">Pending Payment</option>
                        <option value="rejected" className="bg-white dark:bg-neutral-900 text-rose-600">Rejected</option>
                      </select>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {booking.screenshotName && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsReceiptPreviewOpen(true);
                            }}
                            title="View uploaded payment receipt screenshot"
                            className="p-1.5 rounded-lg border border-neutral-200 text-emerald-600 hover:bg-emerald-50 dark:border-neutral-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-colors"
                          >
                            <FileText className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openDetails(booking)}
                          title="View permits & payment receipt details"
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(booking)}
                          title="Edit booking parameters"
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.bookingId)}
                          title="Delete booking permanently"
                          className="p-1.5 rounded-lg border border-neutral-200 text-rose-650 hover:bg-rose-50 dark:border-neutral-800 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 1. DETAIL DIALOG MODAL */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="font-mono text-xs font-extrabold text-neutral-400">BOOKING REFERENCE</span>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white font-mono mt-0.5">{selectedBooking.bookingId}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
              
              {/* Top Meta info grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 p-4 border border-neutral-100/50 dark:border-neutral-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Camp Reservation</span>
                  <div className="text-xs space-y-1 font-semibold text-neutral-850 dark:text-neutral-200">
                    <div>Camp: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.packageName}</span></div>
                    <div>Travel Date: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.travelDate}</span></div>
                    <div>Guests Count: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.adults} Adults, {selectedBooking.children} Children</span></div>
                    <div>Total Cost: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedBooking.totalAmount)}</span></div>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 p-4 border border-neutral-100/50 dark:border-neutral-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Lead Contact</span>
                  <div className="text-xs space-y-1 font-semibold text-neutral-850 dark:text-neutral-200">
                    <div>Full Name: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.fullName}</span></div>
                    <div>Email Address: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.email}</span></div>
                    <div>Mobile Phone: <span className="font-bold text-neutral-950 dark:text-white">{selectedBooking.mobileNumber}</span></div>
                    <div>Customer ID: <span className="font-mono text-neutral-500">{selectedBooking.userId}</span></div>
                  </div>
                </div>
              </div>

              {/* Traveler Permits details list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase text-neutral-405 tracking-wider">Camper Permits Details</h4>
                  <span className="text-[10px] bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded font-bold">
                    {selectedBooking.travelers.length} Registered
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedBooking.travelers.map((t, idx) => (
                    <div 
                      key={idx}
                      className="rounded-xl border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 flex items-start justify-between"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-neutral-905 dark:text-white">{t.fullName}</div>
                        <div className="text-[10px] text-neutral-450 font-normal">
                          <div>ID: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{t.idProofType}</strong></div>
                          <div>Number: <strong className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{t.idProofNumber}</strong></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-neutral-50 px-1.5 py-0.5 text-[9px] font-extrabold text-neutral-555 uppercase tracking-wide dark:bg-neutral-808/80">
                          {t.gender}, {t.age} yrs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests comments */}
              {selectedBooking.specialRequests && (
                <div className="rounded-xl border border-neutral-100 bg-amber-50/20 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40 text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">Camper Special Request Note:</span>
                  <p className="text-neutral-650 dark:text-neutral-400 italic">"{selectedBooking.specialRequests}"</p>
                </div>
              )}

              {/* Payment Proof details */}
              <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-neutral-400 tracking-wider">Payment Proof Verification</h4>
                
                {selectedBooking.utr || selectedBooking.screenshotName ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1 space-y-2">
                      <div className="text-xs">
                        <span className="text-[10px] text-neutral-400 block font-normal">UTR Transaction Reference</span>
                        <span className="font-mono font-extrabold text-neutral-800 dark:text-white">{selectedBooking.utr || "N/A"}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-[10px] text-neutral-400 block font-normal">File Uploaded</span>
                        <span className="font-bold text-neutral-800 dark:text-white break-all">{selectedBooking.screenshotName || "N/A"}</span>
                      </div>
                    </div>
                    
                    {/* Simulated Receipt Preview */}
                    <button
                      type="button"
                      onClick={() => setIsReceiptPreviewOpen(true)}
                      className="sm:col-span-2 rounded-xl border border-dashed border-emerald-350 bg-emerald-50/20 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/10 flex flex-col justify-center items-center text-center space-y-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all hover:border-emerald-500 dark:hover:border-emerald-700 group w-full"
                    >
                      <CreditCard className="size-8 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform" />
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-neutral-800 dark:text-white flex items-center gap-1 justify-center">
                          Verify Deposit Slip <Eye className="size-3 text-emerald-650" />
                        </div>
                        <div className="text-[10px] text-neutral-400 font-normal">File: {selectedBooking.screenshotName}</div>
                      </div>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-extrabold dark:bg-emerald-950 dark:text-emerald-400">
                        Click to View Screenshot Slip
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:bg-neutral-950/40 text-center text-xs text-neutral-500 font-normal flex items-center justify-center gap-2">
                    <Info className="size-4 text-neutral-450" />
                    <span>No deposit receipt or UTR number has been submitted for this campsite booking yet.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Quick Actions */}
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-neutral-450 font-normal">
                Status: <strong className="font-extrabold text-neutral-850 dark:text-white uppercase">{selectedBooking.status}</strong>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {selectedBooking.status !== "approved" && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedBooking.bookingId, "approved");
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 sm:flex-initial rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4"
                  >
                    Approve Permit
                  </Button>
                )}
                {selectedBooking.status !== "rejected" && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedBooking.bookingId, "rejected");
                      setIsDetailModalOpen(false);
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-initial rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-955/20 font-bold text-xs h-9 px-4"
                  >
                    Reject Booking
                  </Button>
                )}
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="outline"
                  className="flex-1 sm:flex-initial rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-900 font-bold text-xs h-9 px-4"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT DIALOG MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Edit Reservation Parameters</span>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">Reference ID: <span className="font-mono">{editingBooking.bookingId}</span></h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBooking(null);
                }}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Scrollable Edit Form */}
            <form onSubmit={saveBookingEdits} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
              
              {/* Primary Lead details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Primary Lead Guest Contact</h4>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Lead Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.fullName}
                      onChange={(e) => setEditingBooking({ ...editingBooking, fullName: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editingBooking.email}
                      onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={editingBooking.mobileNumber}
                      onChange={(e) => setEditingBooking({ ...editingBooking, mobileNumber: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Package & Trip details */}
              <div className="space-y-3 border-t pt-4 border-neutral-100 dark:border-neutral-800">
                <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Campsite & Travel Dates</h4>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Campsite Package</label>
                    <select
                      value={editingBooking.packageId}
                      onChange={(e) => setEditingBooking({ ...editingBooking, packageId: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-2.5 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:text-white"
                    >
                      {packages.map(p => (
                        <option key={p.id} value={p.id} className="text-neutral-800">{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Travel Date (Check-in)</label>
                    <input
                      type="date"
                      required
                      value={editingBooking.travelDate}
                      onChange={(e) => setEditingBooking({ ...editingBooking, travelDate: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Permit Status</label>
                    <select
                      value={editingBooking.status}
                      onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as Booking["status"] })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-2.5 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:text-white"
                    >
                      <option value="approved" className="text-neutral-800">Approved</option>
                      <option value="pending" className="text-neutral-800">Pending Owner Approval</option>
                      <option value="pending_payment" className="text-neutral-800">Pending Payment</option>
                      <option value="rejected" className="text-neutral-800">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Adult Travelers Count</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editingBooking.adults}
                      onChange={(e) => setEditingBooking({ ...editingBooking, adults: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Child Travelers Count</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editingBooking.children}
                      onChange={(e) => setEditingBooking({ ...editingBooking, children: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">UTR Code</label>
                    <input
                      type="text"
                      placeholder="UTR transaction code"
                      value={editingBooking.utr || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, utr: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500">Special Request Notes</label>
                <textarea
                  value={editingBooking.specialRequests || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, specialRequests: e.target.value })}
                  placeholder="Camper preferences..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                />
              </div>

              {/* Dynamic Travelers Details List */}
              <div className="space-y-3 border-t pt-4 border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Traveler Permits Information</h4>
                  <button
                    type="button"
                    onClick={addEditTraveler}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold uppercase tracking-wide flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add Traveler Row
                  </button>
                </div>

                {editingBooking.travelers.length === 0 ? (
                  <div className="text-center py-4 rounded-xl border border-dashed border-neutral-200 text-xs text-neutral-400 dark:border-neutral-800">
                    No travelers added. Click 'Add Traveler Row' to insert traveler credentials.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingBooking.travelers.map((traveler, index) => (
                      <div 
                        key={index}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-950/30 space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs border-b pb-1.5 border-neutral-100 dark:border-neutral-800">
                          <span className="font-extrabold text-neutral-500">Traveler #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeEditTraveler(index)}
                            className="text-rose-600 hover:text-rose-700 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-5">
                          <div className="space-y-0.5 sm:col-span-2">
                            <label className="text-[9px] font-bold text-neutral-500">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={traveler.fullName}
                              onChange={(e) => handleEditTravelerChange(index, "fullName", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">Age *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={traveler.age}
                              onChange={(e) => handleEditTravelerChange(index, "age", Number(e.target.value))}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">Gender</label>
                            <select
                              value={traveler.gender}
                              onChange={(e) => handleEditTravelerChange(index, "gender", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-1.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">ID Proof Type</label>
                            <select
                              value={traveler.idProofType}
                              onChange={(e) => handleEditTravelerChange(index, "idProofType", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-1.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Aadhaar Card">Aadhaar Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Driver License">Driver License</option>
                              <option value="School ID">School ID</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-neutral-500">ID Document Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 12-digit Aadhaar / Passport No."
                            value={traveler.idProofNumber}
                            onChange={(e) => handleEditTravelerChange(index, "idProofNumber", e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBooking(null);
                  }}
                  variant="outline"
                  className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-900 font-bold text-xs h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size={14} className="text-white" />
                      Saving changes...
                    </>
                  ) : (
                    "Save Booking parameters"
                  )}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD MANUAL DIALOG MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl dark:border-neutral-805 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Manual Reservation Desk</span>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white mt-0.5">Register New Campsite Reservation</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
              
              {/* Lead details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Primary Lead Guest Contact</h4>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Lead Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Joy Sengupta"
                      value={newBookingForm.fullName}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, fullName: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="joy@example.com"
                      value={newBookingForm.email}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, email: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9988776655"
                      value={newBookingForm.mobileNumber}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, mobileNumber: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Package & Trip details */}
              <div className="space-y-3 border-t pt-4 border-neutral-100 dark:border-neutral-800">
                <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Campsite & Travel Parameters</h4>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Campsite Package</label>
                    <select
                      value={newBookingForm.packageId}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, packageId: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-2.5 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:text-white"
                    >
                      {packages.map(p => (
                        <option key={p.id} value={p.id} className="text-neutral-800">{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Travel Date (Check-in)</label>
                    <input
                      type="date"
                      required
                      value={newBookingForm.travelDate}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, travelDate: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Initial Status</label>
                    <select
                      value={newBookingForm.status}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, status: e.target.value as Booking["status"] })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-2.5 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:text-white"
                    >
                      <option value="approved" className="text-neutral-800">Approved / Verified</option>
                      <option value="pending" className="text-neutral-800">Pending Owner Approval</option>
                      <option value="pending_payment" className="text-neutral-800">Pending Payment</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Adult Travelers Count</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newBookingForm.adults}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, adults: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Child Travelers Count</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newBookingForm.children}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, children: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500">Special Request Notes</label>
                <textarea
                  value={newBookingForm.specialRequests}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, specialRequests: e.target.value })}
                  placeholder="Any dietary restrictions, medical requirements, or travel notes..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 bg-transparent py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:text-white"
                />
              </div>

              {/* Dynamic Travelers Details List */}
              <div className="space-y-3 border-t pt-4 border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Camper Permits Documentation</h4>
                  <button
                    type="button"
                    onClick={addAddTraveler}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold uppercase tracking-wide flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add Traveler Row
                  </button>
                </div>

                {newBookingForm.travelers.length === 0 ? (
                  <div className="text-center py-4 rounded-xl border border-dashed border-neutral-200 text-xs text-neutral-400 dark:border-neutral-800">
                    No travelers registered. Click 'Add Traveler Row' to add guest documentation (required for forest permits).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newBookingForm.travelers.map((traveler, index) => (
                      <div 
                        key={index}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 dark:border-neutral-800/80 dark:bg-neutral-955/30 space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs border-b pb-1.5 border-neutral-100 dark:border-neutral-800">
                          <span className="font-extrabold text-neutral-500">Traveler #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeAddTraveler(index)}
                            className="text-rose-600 hover:text-rose-700 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-5">
                          <div className="space-y-0.5 sm:col-span-2">
                            <label className="text-[9px] font-bold text-neutral-500">Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Full Name"
                              value={traveler.fullName}
                              onChange={(e) => handleAddTravelerChange(index, "fullName", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">Age *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={traveler.age}
                              onChange={(e) => handleAddTravelerChange(index, "age", Number(e.target.value))}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">Gender</label>
                            <select
                              value={traveler.gender}
                              onChange={(e) => handleAddTravelerChange(index, "gender", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-1.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">ID Proof Type</label>
                            <select
                              value={traveler.idProofType}
                              onChange={(e) => handleAddTravelerChange(index, "idProofType", e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-1.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Aadhaar Card">Aadhaar Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Driver License">Driver License</option>
                              <option value="School ID">School ID</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-neutral-500">ID Document Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="Aadhaar No. / Passport / ID Number"
                            value={traveler.idProofNumber}
                            onChange={(e) => handleAddTravelerChange(index, "idProofNumber", e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 bg-white py-1 px-2 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  variant="outline"
                  className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-900 font-bold text-xs h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size={14} className="text-white" />
                      Creating...
                    </>
                  ) : (
                    "Create Booking Record"
                  )}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PAYMENT RECEIPT SCREENSHOT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isReceiptPreviewOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 flex flex-col relative overflow-hidden">
            
            {/* Decorative top stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Uploaded Attachment</span>
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 line-clamp-1">{selectedBooking.screenshotName || "payment_receipt.png"}</h3>
              </div>
              <button
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="rounded-lg p-1.5 text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="py-6 flex flex-col items-center">
              
              {/* Styled Invoice card */}
              <div className="w-full rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 space-y-5 relative shadow-inner">
                
                {/* UPI / Bank Transfer Logo */}
                <div className="flex items-center justify-between border-b pb-3 border-dashed border-neutral-200 dark:border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Compass className="size-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">Valley Pay</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider font-mono">Receipt Slip</span>
                </div>

                {/* Transfer Success badge */}
                <div className="text-center py-2 space-y-1">
                  <div className="mx-auto size-11 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-450 flex items-center justify-center shadow-sm">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                  <div className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider mt-2">Transaction Status: SUCCESS</div>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight mt-1 font-mono">
                    ₹{selectedBooking.totalAmount.toLocaleString("en-IN")}.00
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-[11px] border-t border-dashed pt-4 border-neutral-200 dark:border-neutral-800 font-sans">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Recipient</span>
                    <span className="font-extrabold text-neutral-800 dark:text-neutral-200">Valley of Flowers Camps</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Sender</span>
                    <span className="font-extrabold text-neutral-800 dark:text-neutral-200">{selectedBooking.fullName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Bank Reference (UTR)</span>
                    <span className="font-mono font-extrabold text-neutral-900 dark:text-white">{selectedBooking.utr || "8616494512564"}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Timestamp</span>
                    <span className="font-extrabold text-neutral-800 dark:text-neutral-200">
                      {new Date(selectedBooking.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Verified Signature</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-wide">
                      MATCHED
                    </span>
                  </div>

                </div>

                {/* Watermark/Footer */}
                <div className="text-center text-[9px] text-neutral-400 font-mono pt-2 border-t border-neutral-100 dark:border-neutral-800/40">
                  SYSTEM VERIFIED DEPOSIT SLIP
                </div>

              </div>

            </div>

            {/* Actions */}
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 flex justify-end">
              <Button
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 shadow-md shadow-emerald-600/10"
              >
                Close Preview
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )}

      {/* Packages Tab Section */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-neutral-800 dark:text-white">Active Campsite Locations</h2>
              <p className="text-[11px] text-neutral-400">Add, edit, or remove Swiss luxury or Alpine campsite package offerings</p>
            </div>
            <Button
              onClick={openAddPkgModal}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
            >
              <Plus className="size-4" /> Add Campsite
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={pkg.images[0]}
                      alt={pkg.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white">
                      {pkg.duration}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider block">
                        {pkg.stay}
                      </span>
                      <h3 className="font-extrabold text-neutral-800 dark:text-neutral-100 text-sm mt-0.5 line-clamp-1">
                        {pkg.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                        <MapPin className="size-3 text-neutral-400" /> {pkg.location}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-450 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {pkg.shortDescription || pkg.description}
                    </p>

                    <div className="flex items-baseline justify-between border-t border-neutral-50 dark:border-neutral-800/40 pt-3">
                      <span className="text-xs text-neutral-400">Rate (per person)</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450">
                        {formatCurrency(pkg.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="border-t border-neutral-50 bg-neutral-50/50 p-4 flex gap-2 dark:border-neutral-800/40 dark:bg-neutral-900/20">
                  <Button
                    onClick={() => openEditPkgModal(pkg)}
                    variant="outline"
                    className="flex-1 rounded-xl text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs h-9"
                  >
                    Edit Details
                  </Button>
                  <Button
                    onClick={() => handleDeletePackage(pkg.id)}
                    variant="outline"
                    className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:border-rose-950/30 dark:hover:bg-rose-950/20 font-bold text-xs h-9 px-3"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Campsite Package Modal */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                  {isEditingPkg ? "Campsite Configuration" : "New Campsite Record"}
                </span>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1">
                  {isEditingPkg ? "Edit Campsite Package" : "Create Campsite Package"}
                </h3>
              </div>
              <button
                onClick={() => setIsPkgModalOpen(false)}
                className="size-7 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* Row 1: Name & ID */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Campsite Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alpine Swiss Luxury Camp"
                    value={pkgForm.name}
                    onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Package ID (Slug) {isEditingPkg ? "(Immutable)" : "*"}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditingPkg}
                    placeholder="e.g. alpine-luxury-camp"
                    value={pkgForm.id}
                    onChange={(e) => setPkgForm({ ...pkgForm, id: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-950 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Row 2: Price, Duration, Location */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Price per head (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 12999"
                    value={pkgForm.price}
                    onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Duration *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Days / 2 Nights"
                    value={pkgForm.duration}
                    onChange={(e) => setPkgForm({ ...pkgForm, duration: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Stay Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiss Luxury Tents"
                    value={pkgForm.stay}
                    onChange={(e) => setPkgForm({ ...pkgForm, stay: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                  />
                </div>
              </div>

              {/* Row 3: Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghangaria Base Camp, Valley Base"
                  value={pkgForm.location}
                  onChange={(e) => setPkgForm({ ...pkgForm, location: e.target.value })}
                  className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                />
              </div>

              {/* Descriptions */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Short Description *</label>
                <input
                  type="text"
                  required
                  placeholder="A brief catchy summary shown on grid cards..."
                  value={pkgForm.shortDescription}
                  onChange={(e) => setPkgForm({ ...pkgForm, shortDescription: e.target.value })}
                  className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed explanation of the camping location, surroundings, and experience..."
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-855 dark:bg-neutral-955"
                />
              </div>

              {/* Images, Meals, Inclusions, Exclusions */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Images (Comma-separated URLs) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  value={pkgForm.images}
                  onChange={(e) => setPkgForm({ ...pkgForm, images: e.target.value })}
                  className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-850 dark:bg-neutral-955"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Meals Provided (Comma-separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="Breakfast, Lunch, Evening Snacks, Dinner"
                  value={pkgForm.meals}
                  onChange={(e) => setPkgForm({ ...pkgForm, meals: e.target.value })}
                  className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-855 dark:bg-neutral-955"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Inclusions (Comma-separated) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Forest Permits, Guide, Camping Gears..."
                    value={pkgForm.inclusions}
                    onChange={(e) => setPkgForm({ ...pkgForm, inclusions: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-855 dark:bg-neutral-955"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Exclusions (Comma-separated) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Personal Porter, Insurance, Meals not specified..."
                    value={pkgForm.exclusions}
                    onChange={(e) => setPkgForm({ ...pkgForm, exclusions: e.target.value })}
                    className="w-full rounded-xl border border-neutral-250 bg-white py-2 px-3 text-xs font-semibold dark:border-neutral-855 dark:bg-neutral-955"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  variant="outline"
                  className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-900 font-bold text-xs h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size={14} className="text-white" />
                      Saving campsite...
                    </>
                  ) : (
                    "Save Campsite Offering"
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
