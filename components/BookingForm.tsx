"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Package, BookingSubmission, TravelerDetail, User } from "@/services/api";
import { tokenStorage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "./LoadingSpinner";
import { 
  Calendar, 
  UserPlus, 
  Users, 
  MessageSquare, 
  BadgeInfo, 
  AlertCircle, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Upload, 
  Copy, 
  MapPin, 
  Banknote, 
  QrCode, 
  CreditCard,
  Sparkles,
  Eye,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { uploadPaymentScreenshot } from "@/lib/supabase";

interface BookingFormProps {
  initialPackageId?: string;
  packagesList?: Package[];
}

const DEFAULT_PACKAGES: Package[] = [];
const UPI_ID = "camplife@ybl";

export function BookingForm({ initialPackageId = "", packagesList = DEFAULT_PACKAGES }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<Package[]>(packagesList);
  
  // Wizard Step: 1 = Traveler Information, 2 = Payment & Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form Step 1 State: Traveler & Contact Info
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    packageId: initialPackageId || searchParams?.get("packageId") || "",
    adults: 1,
    children: 0,
    travelDate: "",
    specialRequests: "",
  });

  const [travelers, setTravelers] = useState<TravelerDetail[]>([
    { fullName: "", age: 25, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "" }
  ]);

  // Form Step 2 State: Payment Details
  const [paymentMethod, setPaymentMethod] = useState<"upi_qr" | "pay_on_spot">("upi_qr");
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingPackages, setIsLoadingPackages] = useState(packages.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isSubmittingRef = useRef(false);
  const formDirtyRef = useRef(false);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  // Mark form dirty for unsaved changes warning
  useEffect(() => {
    const hasData = formData.fullName || formData.email || formData.mobileNumber || formData.travelDate;
    formDirtyRef.current = !!hasData;
  }, [formData, travelers]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formDirtyRef.current && !isSubmitting) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  // Sync current logged-in user
  useEffect(() => {
    const syncUser = () => {
      const user = api.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: prev.fullName || user.name,
          email: prev.email || user.email
        }));
        setTravelers(prev => {
          const copy = [...prev];
          if (copy[0] && !copy[0].fullName) {
            copy[0].fullName = user.name;
          }
          return copy;
        });
      }
    };

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  const paramPackageId = searchParams ? searchParams.get("packageId") || "" : "";

  // Fetch package details if not provided via props
  useEffect(() => {
    if (packagesList.length > 0) {
      setPackages(packagesList);
      setIsLoadingPackages(false);
      return;
    }
    
    if (packages.length > 0) {
      setIsLoadingPackages(false);
      return;
    }
    
    const loadPackages = async () => {
      try {
        setIsLoadingPackages(true);
        const data = await api.getPackages();
        setPackages(data);
        
        if (data.length > 0 && !formData.packageId) {
          setFormData(prev => ({ ...prev, packageId: paramPackageId || data[0].id }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPackages(false);
      }
    };
    loadPackages();
  }, [packagesList, packages.length, paramPackageId]);

  useEffect(() => {
    if (paramPackageId) {
      setFormData(prev => ({ ...prev, packageId: paramPackageId }));
    }
  }, [paramPackageId]);

  // Sync travelers count with adults + children
  useEffect(() => {
    const totalCount = formData.adults + formData.children;
    if (totalCount < 1) return;

    setTravelers((prev) => {
      const updated = [...prev];
      if (updated.length < totalCount) {
        const diff = totalCount - updated.length;
        for (let i = 0; i < diff; i++) {
          const travelerIndex = updated.length;
          const isChild = travelerIndex >= formData.adults;
          updated.push({
            fullName: "",
            age: isChild ? 8 : 25,
            gender: "Male",
            idProofType: "Aadhaar Card",
            idProofNumber: ""
          });
        }
      } else if (updated.length > totalCount) {
        return updated.slice(0, totalCount);
      }
      return updated;
    });
  }, [formData.adults, formData.children]);

  // Restore draft booking if returning after login
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current) return;
    try {
      const draft = sessionStorage.getItem("draft_booking");
      if (draft) {
        draftRestoredRef.current = true;
        const parsed = JSON.parse(draft);
        if (parsed.formData) {
          setFormData((prev) => ({
            ...prev,
            ...parsed.formData,
            fullName: currentUser ? currentUser.name : parsed.formData.fullName,
            email: currentUser ? currentUser.email : parsed.formData.email
          }));
        }
        if (parsed.travelers && Array.isArray(parsed.travelers)) {
          setTravelers(parsed.travelers);
        }
      }
    } catch (e) {
      console.error("Failed to restore draft booking:", e);
    }
  }, [currentUser]);

  const validateStep1 = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) tempErrors.fullName = "Lead contact name is required";
    
    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email format";
    }

    if (!formData.mobileNumber.trim()) {
      tempErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.mobileNumber.replace(/[\s-]/g, ""))) {
      tempErrors.mobileNumber = "Invalid phone number (10-12 digits)";
    }

    if (!formData.packageId) tempErrors.packageId = "Please select a campsite package";
    if (!formData.travelDate) tempErrors.travelDate = "Please select a travel date";
    
    if (formData.adults < 1) tempErrors.adults = "At least 1 adult is required";
    if (formData.adults > 20) tempErrors.adults = "Maximum 20 adults allowed";
    if (formData.children > 15) tempErrors.children = "Maximum 15 children allowed";
    
    travelers.forEach((t, index) => {
      if (!t.fullName.trim()) {
        tempErrors[`traveler-${index}-name`] = `Traveler #${index + 1} name is required`;
      }
      if (!t.idProofNumber.trim()) {
        tempErrors[`traveler-${index}-idproof`] = `Traveler #${index + 1} ID number is required`;
      }
      const isChild = index >= formData.adults;
      if (isChild) {
        if (t.age < 1 || t.age > 17) {
          tempErrors[`traveler-${index}-age`] = `Child #${index + 1} age must be between 1-17`;
        }
      } else {
        if (t.age < 18 || t.age > 120) {
          tempErrors[`traveler-${index}-age`] = `Adult #${index + 1} age must be between 18-120`;
        }
      }
    });

    setErrors(tempErrors);
    return { isValid: Object.keys(tempErrors).length === 0, tempErrors };
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const { isValid, tempErrors } = validateStep1();
    if (!isValid) {
      const firstErrorKey = Object.keys(tempErrors)[0];
      if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!currentUser) {
      sessionStorage.setItem("draft_booking", JSON.stringify({ formData, travelers }));
      const redirectUrl = `/login?redirect=${encodeURIComponent(`/booking${formData.packageId ? `?packageId=${formData.packageId}` : ""}`)}`;
      router.push(redirectUrl);
      return;
    }

    // Move locally to Step 2 WITHOUT calling backend API (No Zombie Bookings!)
    setCurrentStep(2);
    wizardTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "adults" || name === "children" ? parseInt(value) || 0 : value
    }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleTravelerChange = (index: number, field: keyof TravelerDetail, value: any) => {
    setTravelers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === "age" ? parseInt(value) || 0 : value };
      return copy;
    });

    const errKey = field === "fullName" ? `traveler-${index}-name` : field === "age" ? `traveler-${index}-age` : `traveler-${index}-idproof`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errKey];
        return copy;
      });
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotName(file.name);
    }
  };

  // Final Atomic Submission Handler (Step 2 Submit)
  const handleFinalBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/booking`)}`);
      return;
    }

    if (paymentMethod === "upi_qr") {
      if (!utrNumber.trim()) {
        setSubmitError("Please enter the UTR / Transaction Reference Number");
        return;
      }
      if (utrNumber.trim().length < 8) {
        setSubmitError("Please enter a valid UTR number (minimum 8 digits)");
        return;
      }
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      sessionStorage.removeItem("draft_booking");
      formDirtyRef.current = false;
      const selectedPkg = packages.find(p => p.id === formData.packageId);

      const submission: BookingSubmission = {
        userId: currentUser.id,
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        packageId: formData.packageId,
        packageName: selectedPkg ? selectedPkg.name : "Custom Package",
        adults: formData.adults,
        children: formData.children,
        travelDate: formData.travelDate,
        specialRequests: formData.specialRequests,
        travelers: travelers
      };

      // 1. Submit Booking Record
      const bookingResponse = await api.submitBooking(submission);
      const bookingId = bookingResponse.bookingId;

      // 2. Submit Payment Details (UPI proof or Pay-on-Spot marker)
      let uploadedUrl = "";
      if (paymentMethod === "upi_qr") {
        if (screenshot) {
          const uploadResult = await uploadPaymentScreenshot(screenshot, bookingId);
          if (uploadResult.publicUrl) {
            uploadedUrl = uploadResult.publicUrl;
          }
        }
        const token = tokenStorage.getToken() || undefined;
        await api.submitPaymentProof(
          bookingId,
          utrNumber,
          screenshotName || "payment_proof.png",
          bookingResponse.totalAmount,
          screenshot || undefined,
          token,
          uploadedUrl
        );
      } else {
        // Pay on Spot method
        const token = tokenStorage.getToken() || undefined;
        await api.submitPaymentProof(
          bookingId,
          "PAY_ON_SPOT",
          "pay_on_spot.png",
          bookingResponse.totalAmount,
          undefined,
          token,
          "PAY_ON_SPOT"
        );
      }

      // 3. Redirect directly to Success Page
      router.push(`/success?bookingId=${bookingId}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Booking submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (isLoadingPackages) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedPkg = packages.find(p => p.id === formData.packageId) || packages[0];
  const packagePrice = selectedPkg ? selectedPkg.price : 5000;
  const adultsSubtotal = formData.adults * packagePrice;
  const childrenSubtotal = formData.children * (packagePrice * 0.5);
  const totalEstCost = adultsSubtotal + childrenSubtotal;

  const upiQrUri = `upi://pay?pa=${UPI_ID}&pn=CampLife%20Adventures&am=${totalEstCost}&tr=BK-DRAFT&tn=Campsite%20Booking&cu=INR`;

  return (
    <div ref={wizardTopRef} className="grid gap-8 lg:grid-cols-12 items-start">
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Order Review & Live Guest Roster (4 cols on lg screens)       */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
        
        <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b pb-4 border-neutral-100 dark:border-neutral-800">
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-base flex items-center gap-2">
              Order Review
            </h3>
            <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-extrabold px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="size-3 text-amber-600" /> Premium
            </span>
          </div>

          {/* Selected Package Card */}
          {selectedPkg && (
            <div className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <img
                  src={selectedPkg.images[0]}
                  alt={selectedPkg.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-neutral-800 shadow-sm dark:bg-neutral-950/90 dark:text-neutral-200">
                  {selectedPkg.duration}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
                  <MapPin className="size-3" /> {selectedPkg.location}
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight">
                  {selectedPkg.name}
                </h4>
              </div>
            </div>
          )}

          {/* Parameters summary */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-[10px] text-neutral-400 block mb-0.5">Travel Date</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <Calendar className="size-3 text-neutral-400" /> {formData.travelDate || "Not selected"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block mb-0.5">Travelers</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <Users className="size-3 text-neutral-400" /> {formData.adults} Adults, {formData.children} Kids
              </span>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 text-xs border-t pt-4 border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between text-neutral-500">
              <span>Adults ({formData.adults} × ₹{packagePrice.toLocaleString("en-IN")})</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{adultsSubtotal.toLocaleString("en-IN")}</span>
            </div>
            {formData.children > 0 && (
              <div className="flex justify-between text-neutral-500">
                <span>Children ({formData.children} × ₹{(packagePrice * 0.5).toLocaleString("en-IN")})</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">- ₹{childrenSubtotal.toLocaleString("en-IN")} (50% Off)</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>Forest Permit Handling Desk</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included</span>
            </div>

            <div className="border-t pt-3 mt-2 border-neutral-100 dark:border-neutral-800 flex justify-between items-baseline">
              <span className="font-extrabold text-neutral-900 dark:text-white text-sm">Total Price</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{totalEstCost.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Live Guest Roster Summary */}
          {travelers.some(t => t.fullName) && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Registered Guest Summary:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {travelers.map((t, i) => (
                  t.fullName ? (
                    <div key={i} className="text-[11px] flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">
                        #{i + 1} {t.fullName}
                      </span>
                      <span className="text-[9px] text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded font-mono">
                        {t.idProofType} ({t.idProofNumber || "N/A"})
                      </span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

        </div>

      </div>


      {/* ========================================================================= */}
      {/* RIGHT COLUMN: 2-Step Interactive Wizard Form (8 cols on lg screens)       */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8">
        
        <div className="rounded-[2.5rem] border border-neutral-100 bg-white p-6 md:p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 space-y-8">
          
          {/* Stepper Bar Header (Inspired by screenshot design) */}
          <div className="flex items-center justify-between border-b pb-6 border-neutral-100 dark:border-neutral-800 px-2">
            
            {/* Step 1 Badge */}
            <div className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep > 1 
                  ? "bg-emerald-600 text-white" 
                  : currentStep === 1 
                    ? "bg-neutral-900 text-white dark:bg-emerald-600" 
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
              }`}>
                {currentStep > 1 ? <Check className="size-4 stroke-[3]" /> : "1"}
              </div>
              <span className={`text-xs font-bold ${currentStep === 1 ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                Information
              </span>
            </div>

            <div className="h-0.5 flex-1 mx-4 bg-neutral-100 dark:bg-neutral-800" />

            {/* Step 2 Badge */}
            <div className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentStep === 2 
                  ? "bg-neutral-900 text-white dark:bg-emerald-600" 
                  : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
              }`}>
                2
              </div>
              <span className={`text-xs font-bold ${currentStep === 2 ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                Payment & Confirmation
              </span>
            </div>

            <div className="h-0.5 flex-1 mx-4 bg-neutral-100 dark:bg-neutral-800" />

            {/* Step 3 Badge */}
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 text-xs font-bold dark:bg-neutral-800">
                3
              </div>
              <span className="text-xs font-bold text-neutral-400 hidden sm:inline">
                Completed
              </span>
            </div>

          </div>

          {/* Submission error alert banner */}
          {submitError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
              <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
              <div>
                <strong className="text-destructive block mb-0.5">Submission Error</strong>
                <span className="text-destructive/80">{submitError}</span>
              </div>
            </div>
          )}

          {/* Guest Account Prompt */}
          {!currentUser && currentStep === 1 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                <BadgeInfo className="size-5 shrink-0 text-amber-600" />
                <span>Fill out traveler info below. You will be prompted to log in or create an account to proceed to payment.</span>
              </div>
              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                <Button asChild size="sm" variant="outline" className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold h-8">
                  <Link href={`/login?redirect=${encodeURIComponent(`/booking${formData.packageId ? `?packageId=${formData.packageId}` : ""}`)}`}>Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8">
                  <Link href={`/signup?redirect=${encodeURIComponent(`/booking${formData.packageId ? `?packageId=${formData.packageId}` : ""}`)}`}>Register</Link>
                </Button>
              </div>
            </div>
          )}


          {/* ===================================================================== */}
          {/* STEP 1 FORM: GUEST DETAILS & TRAVELER INFORMATION                     */}
          {/* ===================================================================== */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-8 animate-in fade-in duration-200">
              
              {/* 1. Contact Info */}
              <div>
                <h3 className="text-sm font-extrabold text-neutral-800 dark:text-white mb-4 border-b pb-2 border-neutral-100 dark:border-neutral-800">
                  1. Lead Contact Credentials
                </h3>
                
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Lead Contact Name *</label>
                    <Input
                      type="text"
                      name="fullName"
                      placeholder="Full name of primary traveler"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      className={`rounded-xl border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                        errors.fullName ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    {errors.fullName && <p className="text-[10px] font-semibold text-destructive">{errors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address *</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="e.g. lead@example.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      className={`rounded-xl border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                        errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    {errors.email && <p className="text-[10px] font-semibold text-destructive">{errors.email}</p>}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Mobile Number *</label>
                    <Input
                      type="tel"
                      name="mobileNumber"
                      placeholder="e.g. 9876543210"
                      value={formData.mobileNumber}
                      onChange={handleFormChange}
                      className={`rounded-xl border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                        errors.mobileNumber ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    {errors.mobileNumber && <p className="text-[10px] font-semibold text-destructive">{errors.mobileNumber}</p>}
                  </div>

                  {/* Package Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Select Campsite *</label>
                    <select
                      name="packageId"
                      value={formData.packageId}
                      onChange={handleFormChange}
                      className="flex h-10 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <option value="">-- Choose package --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (₹{pkg.price.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                    {errors.packageId && <p className="text-[10px] font-semibold text-destructive">{errors.packageId}</p>}
                  </div>

                  {/* Travel Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                      <Calendar className="size-3.5 text-neutral-400" /> Travel Date *
                    </label>
                    <Input
                      type="date"
                      name="travelDate"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.travelDate}
                      onChange={handleFormChange}
                      className={`rounded-xl border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                        errors.travelDate ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    {errors.travelDate && <p className="text-[10px] font-semibold text-destructive">{errors.travelDate}</p>}
                  </div>

                  {/* Group sizes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                        <Users className="size-3.5 text-neutral-400" /> Adults
                      </label>
                      <Input
                        type="number"
                        name="adults"
                        min={1}
                        max={20}
                        value={formData.adults}
                        onChange={handleFormChange}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800"
                      />
                      {errors.adults && <p className="text-[10px] font-semibold text-destructive">{errors.adults}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                        <UserPlus className="size-3.5 text-neutral-400" /> Children
                      </label>
                      <Input
                        type="number"
                        name="children"
                        min={0}
                        max={15}
                        value={formData.children}
                        onChange={handleFormChange}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC TRAVELERS DETAILS */}
              <div>
                <h3 className="text-sm font-extrabold text-neutral-800 dark:text-white mb-1 border-b pb-2 border-neutral-100 dark:border-neutral-800">
                  2. Individual Traveler Details
                </h3>
                <p className="text-[11px] text-neutral-400 mb-4">
                  Valley of Flowers Forest Department requires matching ID details at checking counters.
                </p>

                <div className="space-y-4">
                  {travelers.map((traveler, index) => {
                    const isChild = index >= formData.adults;
                    return (
                      <div 
                        key={index} 
                        className="rounded-2xl border border-neutral-100 p-5 dark:border-neutral-800 dark:bg-neutral-900/30 bg-slate-50/50 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Traveler #{index + 1} {index === 0 ? "(Lead Traveler)" : ""}
                          </span>
                          <span className="rounded-lg bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-neutral-800">
                            {isChild ? "Child (5-11 yrs)" : "Adult"}
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          {/* Full Name */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Full Name *</label>
                            <Input
                              type="text"
                              name={`traveler-${index}-name`}
                              placeholder="Passenger name"
                              value={traveler.fullName}
                              onChange={(e) => handleTravelerChange(index, "fullName", e.target.value)}
                              className={`rounded-xl h-9 text-xs border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                                errors[`traveler-${index}-name`] ? "border-destructive focus-visible:ring-destructive/30" : ""
                              }`}
                            />
                            {errors[`traveler-${index}-name`] && (
                              <p className="text-[9px] font-semibold text-destructive">{errors[`traveler-${index}-name`]}</p>
                            )}
                          </div>

                          {/* Age */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Age *</label>
                            <Input
                              type="number"
                              placeholder="Age"
                              min={1}
                              max={120}
                              value={traveler.age}
                              onChange={(e) => handleTravelerChange(index, "age", e.target.value)}
                              className={`rounded-xl h-9 text-xs border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                                errors[`traveler-${index}-age`] ? "border-destructive focus-visible:ring-destructive/30" : ""
                              }`}
                            />
                            {errors[`traveler-${index}-age`] && (
                              <p className="text-[9px] font-semibold text-destructive">{errors[`traveler-${index}-age`]}</p>
                            )}
                          </div>

                          {/* Gender */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Gender *</label>
                            <select
                              value={traveler.gender}
                              onChange={(e) => handleTravelerChange(index, "gender", e.target.value)}
                              className="flex h-9 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* ID Proof Type */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">ID Proof Type *</label>
                            <select
                              value={traveler.idProofType}
                              onChange={(e) => handleTravelerChange(index, "idProofType", e.target.value)}
                              className="flex h-9 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                              <option value="Aadhaar Card">Aadhaar Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Driving License">Driving License</option>
                            </select>
                          </div>

                          {/* ID Card Number */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">ID Card Number *</label>
                            <Input
                              type="text"
                              name={`traveler-${index}-idproof`}
                              placeholder="e.g. ID card number"
                              value={traveler.idProofNumber}
                              onChange={(e) => handleTravelerChange(index, "idProofNumber", e.target.value)}
                              className={`rounded-xl h-9 text-xs border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 ${
                                errors[`traveler-${index}-idproof`] ? "border-destructive focus-visible:ring-destructive/30" : ""
                              }`}
                            />
                            {errors[`traveler-${index}-idproof`] && (
                              <p className="text-[9px] font-semibold text-destructive">{errors[`traveler-${index}-idproof`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Special Requests */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <MessageSquare className="size-3.5 text-neutral-400" /> Special Requests or Medical Warnings
                </label>
                <Textarea
                  name="specialRequests"
                  placeholder="Please notify us about allergies, oxygen sensitivity, or dietary preferences..."
                  value={formData.specialRequests}
                  onChange={handleFormChange}
                  rows={3}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs"
                />
              </div>

              {/* Step 1 Action Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-neutral-900 hover:bg-emerald-600 text-white font-bold py-3.5 h-12 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] dark:bg-neutral-800 dark:hover:bg-emerald-600"
                >
                  Proceed to Payment Options &rarr;
                </Button>
              </div>

            </form>
          )}


          {/* ===================================================================== */}
          {/* STEP 2 FORM: PAYMENT SELECTION (UPI QR CODE vs PAY AT CAMPSITE)       */}
          {/* ===================================================================== */}
          {currentStep === 2 && (
            <form onSubmit={handleFinalBookingSubmit} className="space-y-8 animate-in fade-in duration-200">
              
              <div>
                <h3 className="text-sm font-extrabold text-neutral-800 dark:text-white mb-1">
                  Select Payment Method
                </h3>
                <p className="text-xs text-neutral-400 mb-6">
                  Choose how you would like to complete your payment for booking reference.
                </p>

                {/* Payment Method Cards (Inspired by Reference Screenshot) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  {/* Option A: UPI QR Code */}
                  <div
                    onClick={() => setPaymentMethod("upi_qr")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start gap-3 relative ${
                      paymentMethod === "upi_qr"
                        ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                      paymentMethod === "upi_qr" ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                    }`}>
                      <QrCode className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        UPI QR Code Payment
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Pay advance via GPay / PhonePe / Paytm and upload UTR
                      </p>
                    </div>
                  </div>

                  {/* Option B: Pay at Campsite / On Spot */}
                  <div
                    onClick={() => setPaymentMethod("pay_on_spot")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start gap-3 relative ${
                      paymentMethod === "pay_on_spot"
                        ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                      paymentMethod === "pay_on_spot" ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                    }`}>
                      <Banknote className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Pay at Campsite / On Spot
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Pay 100% when you arrive at Ghangaria Base Camp
                      </p>
                    </div>
                  </div>

                </div>
              </div>


              {/* ======================================================= */}
              {/* PAYMENT OPTION A: UPI QR CODE PANEL                      */}
              {/* ======================================================= */}
              {paymentMethod === "upi_qr" && (
                <div className="rounded-2xl border border-neutral-100 bg-slate-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-950/40 space-y-6 animate-in fade-in duration-200">
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-between border-b pb-6 border-neutral-200/60 dark:border-neutral-800">
                    
                    {/* Scannable QR Code */}
                    <div className="flex flex-col items-center">
                      <div className="relative rounded-2xl bg-white p-3 border border-neutral-200 dark:bg-white dark:border-neutral-800 flex flex-col items-center justify-center size-44 shadow-md">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiQrUri)}`}
                          alt="UPI QR Code"
                          className="size-36 object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-2 dark:bg-emerald-950 dark:text-emerald-400">
                        Scan with any UPI App
                      </span>
                    </div>

                    {/* UPI Copy details */}
                    <div className="space-y-3 flex-1 w-full">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Official UPI Address</span>
                        <div className="flex items-center justify-between rounded-xl bg-white border border-neutral-200 p-2.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200 shadow-sm">
                          <span className="pl-1 font-mono">{UPI_ID}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 transition-colors active:scale-95"
                          >
                            {copiedUpi ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-500 space-y-1 leading-relaxed">
                        <p>• Scan QR code using GPay, PhonePe, Paytm, or BHIM.</p>
                        <p>• Enter exact total amount: <strong className="text-neutral-900 dark:text-white">₹{totalEstCost.toLocaleString("en-IN")}</strong></p>
                        <p>• Copy the 12-digit UTR reference ID after payment.</p>
                      </div>
                    </div>

                  </div>

                  {/* UTR Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      UTR / Transaction Reference Number *
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter 12-digit UPI reference number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="rounded-xl border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30 text-xs h-10"
                    />
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Payment Receipt File (Optional)
                    </label>
                    <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-center hover:bg-slate-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      <Upload className="size-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {screenshotName ? screenshotName : "Click to select payment screenshot image"}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        PNG, JPG or WebP up to 5MB
                      </span>
                    </div>
                  </div>

                </div>
              )}


              {/* ======================================================= */}
              {/* PAYMENT OPTION B: PAY AT CAMPSITE / ON SPOT              */}
              {/* ======================================================= */}
              {paymentMethod === "pay_on_spot" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/20 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                        Zero Advance Required — Pay at Base Camp
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                        Your campsite tents and forest permit slot will be reserved immediately. You can pay 100% of the total amount (<strong>₹{totalEstCost.toLocaleString("en-IN")}</strong>) in Cash or UPI directly at our Ghangaria Base Camp registration counter on Day 1.
                      </p>
                    </div>
                  </div>

                  <ul className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 space-y-1 pl-9 list-disc">
                    <li>Free cancellation up to 48 hours prior to trek start date.</li>
                    <li>Trek coordinators will assist with forest department permits upon arrival.</li>
                  </ul>
                </div>
              )}


              {/* Navigation & Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                
                {/* Back to Step 1 Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    wizardTopRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="size-4" /> &larr; Edit Traveler Information
                </button>

                {/* Final Atomic Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 h-12 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size={18} className="text-white mr-1" />
                      Submitting Booking Request...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-5" /> Confirm & Complete Booking
                    </>
                  )}
                </Button>

              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}



