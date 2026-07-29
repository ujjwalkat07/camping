"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "./LoadingSpinner";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serverMessage, setServerMessage] = useState("");

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = "Full name is required";
    
    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
      tempErrors.phone = "Please enter a valid phone number (10-12 digits)";
    }

    if (!formData.message.trim()) tempErrors.message = "Message cannot be empty";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError("");
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await api.submitContact(formData);
      if (res.success) {
        setIsSuccess(true);
        setServerMessage(res.message || "Thank you for reaching out. Our support team will get back to you shortly.");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setSubmitError(res.message || "Failed to send message. Please try again.");
      }
    } catch (error: any) {
      console.error(error);
      setSubmitError(error.message || "Submission failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-neutral-100 bg-white p-8 text-center shadow-md dark:border-neutral-800 dark:bg-neutral-900 animate-in fade-in duration-300">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Message Sent Successfully!</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6">
          {serverMessage}
        </p>
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="rounded-xl px-5">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
      
      {submitError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
          <span className="text-destructive font-medium">{submitError}</span>
        </div>
      )}
      
      {/* Name Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Full Name</label>
        <Input
          type="text"
          name="name"
          placeholder="e.g. Rahul Sen"
          value={formData.name}
          onChange={handleChange}
          className={`rounded-xl border border-neutral-200 dark:border-neutral-800 h-10 px-3.5 focus-visible:ring-emerald-600/30 ${
            errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
          }`}
        />
        {errors.name && <p className="text-[11px] font-semibold text-destructive">{errors.name}</p>}
      </div>

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address</label>
        <Input
          type="email"
          name="email"
          placeholder="e.g. rahul@example.com"
          value={formData.email}
          onChange={handleChange}
          className={`rounded-xl border border-neutral-200 dark:border-neutral-800 h-10 px-3.5 focus-visible:ring-emerald-600/30 ${
            errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""
          }`}
        />
        {errors.email && <p className="text-[11px] font-semibold text-destructive">{errors.email}</p>}
      </div>

      {/* Phone Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Phone Number</label>
        <Input
          type="tel"
          name="phone"
          placeholder="e.g. 9876543210"
          value={formData.phone}
          onChange={handleChange}
          className={`rounded-xl border border-neutral-200 dark:border-neutral-800 h-10 px-3.5 focus-visible:ring-emerald-600/30 ${
            errors.phone ? "border-destructive focus-visible:ring-destructive/30" : ""
          }`}
        />
        {errors.phone && <p className="text-[11px] font-semibold text-destructive">{errors.phone}</p>}
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Message</label>
        <Textarea
          name="message"
          placeholder="Describe your query or ask about customized campsite options..."
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className={`rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 focus-visible:ring-emerald-600/30 ${
            errors.message ? "border-destructive focus-visible:ring-destructive/30" : ""
          }`}
        />
        {errors.message && <p className="text-[11px] font-semibold text-destructive">{errors.message}</p>}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 h-11 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99]"
      >
        {isLoading ? (
          <LoadingSpinner size={20} className="text-white" />
        ) : (
          <>
            <Send className="size-4" /> Send Message
          </>
        )}
      </Button>

    </form>
  );
}
