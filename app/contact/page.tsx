import { ContactForm } from "@/components/ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Helpdesk Support</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">Contact Our Camp Office</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Need help preparing your trek, hiring ponies, or organizing custom family packages? Write to us and we'll reply shortly.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Info Grid */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-5">
            <h3 className="font-bold text-base text-neutral-800 dark:text-white">Office Details</h3>
            
            <ul className="space-y-4 text-xs text-neutral-500 dark:text-neutral-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">Location</span>
                  <span>Ghangaria Campsite Base, Chamoli District, Uttarakhand, India</span>
                </div>
              </li>
              
              <li className="flex items-start gap-2.5">
                <Phone className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">Helpline</span>
                  <span>+91 98765 43210</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <Mail className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">Reservations</span>
                  <span>bookings@camplife.in</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <Clock className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">Working Hours</span>
                  <span>Daily: 7:00 AM - 10:00 PM (June to October)</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-[2rem] bg-emerald-50/50 border border-emerald-100 p-6 dark:bg-emerald-950/20 dark:border-emerald-900/30">
            <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 mb-1.5">Helicopter Bookings</h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
              If you require helicopter tickets from Govindghat to Ghangaria, please request them at least 15 days in advance during peak August floral periods.
            </p>
          </div>

        </div>

        {/* Form Column */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

      </div>

    </div>
  );
}
