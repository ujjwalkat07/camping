import packagesJson from '@/data/packages.json';
import reviewsJson from '@/data/reviews.json';
import galleryJson from '@/data/gallery.json';
import faqsJson from '@/data/faqs.json';

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  shortDescription: string;
  description: string;
  images: string[];
  location: string;
  itinerary: { day: number; title: string; activities: string[] }[];
  meals: string[];
  stay: string;
  inclusions: string[];
  exclusions: string[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// User Profile Schema
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
}

// Traveler Detail Schema (Phase 1 Dynamic Guest Forms)
export interface TravelerDetail {
  fullName: string;
  age: number;
  gender: string;
  idProofType: string;
  idProofNumber: string;
}

export interface BookingSubmission {
  userId: string;
  fullName: string; // Lead traveler contact name
  mobileNumber: string;
  email: string;
  packageId: string;
  packageName: string;
  adults: number;
  children: number;
  travelDate: string;
  specialRequests?: string;
  travelers: TravelerDetail[];
}

export interface Booking {
  bookingId: string;
  userId: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  packageId: string;
  packageName: string;
  adults: number;
  children: number;
  travelDate: string;
  specialRequests?: string;
  travelers: TravelerDetail[];
  totalAmount: number;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  utr?: string;
  screenshotName?: string;
  date: string;
}

export interface BookingResponse {
  bookingId: string;
  totalAmount: number;
}

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- Package & Content Fetching Methods ---
  getPackages: async (): Promise<Package[]> => {
    await delay(300);
    return packagesJson as Package[];
  },

  getPackageById: async (id: string): Promise<Package | null> => {
    await delay(200);
    const item = packagesJson.find(p => p.id === id);
    return item ? (item as Package) : null;
  },

  getGallery: async (): Promise<GalleryItem[]> => {
    await delay(300);
    return galleryJson as GalleryItem[];
  },

  getReviews: async (): Promise<Review[]> => {
    await delay(200);
    return reviewsJson as Review[];
  },

  getFAQs: async (): Promise<FAQ[]> => {
    await delay(200);
    return faqsJson as FAQ[];
  },

  submitContact: async (data: ContactSubmission): Promise<boolean> => {
    await delay(400);
    if (typeof window !== 'undefined') {
      const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
      contacts.push({ ...data, id: `con-${Date.now()}`, date: new Date().toISOString() });
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }
    return true;
  },

  // --- Authentication Mock Service ---
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  login: async (email: string, name?: string): Promise<User> => {
    await delay(500);
    
    // Simple mock: if user name is provided, register them, otherwise look up by email
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Register new user
      user = {
        id: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || email.split('@')[0],
        email: email
      };
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
    } else if (name) {
      // Update name if profile registration update
      user.name = name;
      localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('currentUser');
  },

  // --- Booking Operations Mock Service ---
  submitBooking: async (data: BookingSubmission): Promise<BookingResponse> => {
    await delay(600);
    
    const targetPackage = packagesJson.find(p => p.id === data.packageId);
    const rate = targetPackage ? targetPackage.price : 0;
    
    const totalAmount = (data.adults * rate) + (data.children * rate * 0.5);
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      ...data,
      bookingId,
      totalAmount,
      status: 'pending_payment',
      date: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
    }

    return { bookingId, totalAmount };
  },

  getBookingById: async (bookingId: string): Promise<Booking | null> => {
    await delay(200);
    if (typeof window === 'undefined') return null;
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const booking = bookings.find((b: any) => b.bookingId === bookingId);
    return booking || null;
  },

  getBookings: async (userId: string): Promise<Booking[]> => {
    await delay(400);
    if (typeof window === 'undefined') return [];
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    return bookings.filter((b: any) => b.userId === userId);
  },

  submitPaymentProof: async (
    bookingId: string,
    utr: string,
    screenshotName: string
  ): Promise<boolean> => {
    await delay(500);
    if (typeof window !== 'undefined') {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const index = bookings.findIndex((b: any) => b.bookingId === bookingId);
      if (index !== -1) {
        bookings[index].utr = utr;
        bookings[index].screenshotName = screenshotName;
        bookings[index].status = 'pending'; // Changed status to 'pending' as per request
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
      }
    }
    return false;
  },

  // Owner/Admin Simulation API to approve/reject bookings
  updateBookingStatus: async (bookingId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    await delay(300);
    if (typeof window !== 'undefined') {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const index = bookings.findIndex((b: any) => b.bookingId === bookingId);
      if (index !== -1) {
        bookings[index].status = status;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
      }
    }
    return false;
  },

  // Update user profile details
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User | null> => {
    await delay(400);
    if (typeof window === 'undefined') return null;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem('users', JSON.stringify(users));
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === userId) {
        const updated = { ...currentUser, ...data };
        localStorage.setItem('currentUser', JSON.stringify(updated));
      }
      return users[index];
    }
    return null;
  }
};
