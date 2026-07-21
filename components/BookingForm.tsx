"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Package, BookingSubmission, TravelerDetail, User } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "./LoadingSpinner";
import { Calendar, UserPlus, Users, MessageSquare, LogIn, ShieldAlert, BadgeInfo } from "lucide-react";
import Link from "next/link";

interface BookingFormProps {
  initialPackageId?: string;
  packagesList?: Package[];
}

const DEFAULT_PACKAGES: Package[] = [];

export function BookingForm({ initialPackageId = "", packagesList = DEFAULT_PACKAGES }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<Package[]>(packagesList);
  
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

  // Dynamic state for each traveler in the group
  const [travelers, setTravelers] = useState<TravelerDetail[]>([
    { fullName: "", age: 25, gender: "Male", idProofType: "Aadhaar Card", idProofNumber: "" }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingPackages, setIsLoadingPackages] = useState(packages.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync auth user state
  useEffect(() => {
    const user = api.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        email: user.email
      }));
      // Pre-fill lead traveler name
      setTravelers(prev => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0].fullName = user.name;
        }
        return copy;
      });
    }
  }, []);

  const paramPackageId = searchParams ? searchParams.get("packageId") || "" : "";

  // Fetch packages list if not passed as a prop
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
        
        // Auto-select first package if none selected
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
  }, [packagesList, packages.length]);

  // Set packageId if it changes in searchParams
  useEffect(() => {
    if (paramPackageId) {
      setFormData(prev => ({ ...prev, packageId: paramPackageId }));
    }
  }, [paramPackageId]);

  // Dynamically update the size of the travelers array when Adults or Children counts change
  useEffect(() => {
    const totalCount = formData.adults + formData.children;
    if (totalCount < 1) return;

    setTravelers((prev) => {
      const updated = [...prev];
      
      // If we need more slots, pad with default items
      if (updated.length < totalCount) {
        const diff = totalCount - updated.length;
        for (let i = 0; i < diff; i++) {
          const travelerIndex = updated.length;
          // Determine default age: Children are 8, Adults are 25
          const isChild = travelerIndex >= formData.adults;
          updated.push({
            fullName: "",
            age: isChild ? 8 : 25,
            gender: "Male",
            idProofType: "Aadhaar Card",
            idProofNumber: ""
          });
        }
      } 
      // If we have too many slots, trim them (keeping previously filled)
      else if (updated.length > totalCount) {
        return updated.slice(0, totalCount);
      }

      return updated;
    });
  }, [formData.adults, formData.children]);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) tempErrors.fullName = "Full name is required";
    
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email format";
    }

    if (!formData.mobileNumber.trim()) {
      tempErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.mobileNumber.replace(/[\s-]/g, ""))) {
      tempErrors.mobileNumber = "Invalid phone number (10-12 digits)";
    }

    if (!formData.packageId) tempErrors.packageId = "Please select a camping package";
    if (!formData.travelDate) tempErrors.travelDate = "Please choose a travel date";
    
    if (formData.adults < 1) tempErrors.adults = "At least 1 adult is required";
    
    // Validate individual travelers
    travelers.forEach((t, index) => {
      if (!t.fullName.trim()) {
        tempErrors[`traveler-${index}-name`] = `Traveler #${index + 1} name is required`;
      }
      if (!t.idProofNumber.trim()) {
        tempErrors[`traveler-${index}-idproof`] = `Traveler #${index + 1} ID number is required`;
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
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

    // Clear error
    const errKey = field === "fullName" ? `traveler-${index}-name` : `traveler-${index}-idproof`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errKey];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
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

      const response = await api.submitBooking(submission);
      
      // Redirect to final verification / payment page
      router.push(`/payment?bookingId=${response.bookingId}`);
    } catch (err) {
      console.error(err);
      alert("Booking submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not authenticated, show a login gate
  if (!currentUser) {
    const loginRedirectPath = `/login?redirect=/booking${formData.packageId ? `?packageId=${formData.packageId}` : ""}`;
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-neutral-100 bg-white p-8 text-center shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 max-w-lg mx-auto my-6 animate-in fade-in duration-300">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 dark:bg-emerald-950/50 dark:text-emerald-400">
          <BadgeInfo className="size-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Authentication Required</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6">
          To secure permits and arrange base campsite accommodations, you must be logged into your account.
        </p>
        <Button asChild className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Link href={loginRedirectPath} className="flex items-center gap-1.5">
            <LogIn className="size-4" /> Sign In / Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoadingPackages) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedPkg = packages.find(p => p.id === formData.packageId);
  const estimatedPrice = selectedPkg
    ? (formData.adults * selectedPkg.price) + (formData.children * selectedPkg.price * 0.5)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
      
      {/* 1. General Booking & Contact Metadata */}
      <div>
        <h3 className="text-base font-extrabold text-neutral-800 dark:text-white mb-4 border-b pb-2 border-neutral-100 dark:border-neutral-800">
          1. Booking Contact Details
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
                value={formData.children}
                onChange={handleFormChange}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC TRAVELERS DETAILS LIST (Individual Fields!) */}
      <div>
        <h3 className="text-base font-extrabold text-neutral-800 dark:text-white mb-1 border-b pb-2 border-neutral-100 dark:border-neutral-800">
          2. Dynamic Individual Traveler Details
        </h3>
        <p className="text-[10px] text-neutral-400 mb-4">
          Please fill out individual credentials. Valley of Flowers Forest Department requires matching ID details at checking counters.
        </p>

        <div className="space-y-4">
          {travelers.map((traveler, index) => {
            const isChild = index >= formData.adults;
            return (
              <div 
                key={index} 
                className="rounded-2xl border border-neutral-100 p-5 dark:border-neutral-800 dark:bg-neutral-900/30 bg-slate-50/50 space-y-4 relative"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Traveler #{index + 1} {index === 0 ? "(Lead Traveler)" : ""}
                  </span>
                  <span className="rounded-lg bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-neutral-800">
                    {isChild ? "Child (5-11 yrs)" : "Adult"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Guest Full Name */}
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

                  {/* Guest Age */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Age *</label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={traveler.age}
                      onChange={(e) => handleTravelerChange(index, "age", e.target.value)}
                      className="rounded-xl h-9 text-xs border border-neutral-200 dark:border-neutral-800 focus-visible:ring-emerald-600/30"
                    />
                  </div>

                  {/* Guest Gender */}
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

                  {/* Guest ID Proof Type */}
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

                  {/* Guest ID Proof Number */}
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
          placeholder="Please notify us about allergies, oxygen sensitivity, or vegetarian preferences..."
          value={formData.specialRequests}
          onChange={handleFormChange}
          rows={3}
          className="rounded-xl border border-neutral-200 dark:border-neutral-800"
        />
      </div>

      {/* Cost Overview */}
      {selectedPkg && (
        <div className="rounded-2xl bg-slate-50 p-5 border border-neutral-100 dark:bg-neutral-950 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Price breakdown details:</span>
            <ul className="text-xs text-neutral-500 mt-1 space-y-0.5">
              <li>• Adults: {formData.adults} × ₹{selectedPkg.price.toLocaleString("en-IN")}</li>
              {formData.children > 0 && (
                <li>• Children: {formData.children} × ₹{(selectedPkg.price * 0.5).toLocaleString("en-IN")} (50% discount)</li>
              )}
            </ul>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Total Est. Cost</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{estimatedPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-12 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <LoadingSpinner size={20} className="text-white" />
          ) : (
            "Verify Details & Continue"
          )}
        </Button>
      </div>

    </form>
  );
}
