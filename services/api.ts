import { apiClient, apiFormClient, tokenStorage, adminStorage, setCookie, setStatusOverride, getStatusOverride, ApiResponse } from '@/lib/api-client';

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  shortDescription: string;
  description: string;
  images: string[];
  location: string;
  stay: string;
  meals: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
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

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
}

export interface TravelerDetail {
  fullName: string;
  age: number;
  gender: string;
  idProofType: string;
  idProofNumber: string;
}

export interface BookingSubmission {
  userId?: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  packageId: string;
  packageName?: string;
  adults: number;
  children: number;
  travelDate: string;
  specialRequests?: string;
  travelers?: TravelerDetail[];
}

export interface Booking {
  id?: string | number;
  bookingId: string;
  userId?: string;
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

export function normalizeStatus(rawStatus: any): Booking['status'] {
  if (!rawStatus) return 'pending';
  const s = String(rawStatus).toLowerCase().trim();
  if (['approved', 'confirm', 'confirmed', 'verified', 'accept', 'accepted', 'success', 'paid'].includes(s)) {
    return 'approved';
  }
  if (['rejected', 'reject', 'decline', 'declined', 'cancelled', 'canceled'].includes(s)) {
    return 'rejected';
  }
  if (['pending_payment', 'unpaid', 'payment_pending'].includes(s)) {
    return 'pending_payment';
  }
  return 'pending';
}

function mapBackendPackage(p: any): Package {
  return {
    id: String(p.id || p.packageId || Math.random()),
    name: p.title || p.name || 'Camping Package',
    price: p.price || 0,
    duration: p.duration || 'N/A',
    shortDescription: p.description ? p.description.slice(0, 120) + '...' : '',
    description: p.description || '',
    images: p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'],
    location: p.location || 'Valley of Flowers, Uttarakhand',
    itinerary: Array.isArray(p.itinerary)
      ? p.itinerary.map((it: any, idx: number) => ({
        day: it.dayNo || idx + 1,
        title: it.title || `Day ${idx + 1}`,
        activities: it.description ? [it.description] : []
      }))
      : [],
    meals: p.meals ? [p.meals.breakfast, p.meals.lunch, p.meals.dinner].filter(Boolean) : ['All Meals Included'],
    stay: p.stay || 'Alpine Tents',
    inclusions: p.inclusions || ['Trekking Guide', 'Meals', 'Tents', 'First Aid'],
    exclusions: p.exclusions || ['Personal Expenses', 'Travel Insurance']
  };
}

function mapBackendBooking(b: any): Booking {
  return {
    bookingId: String(b.bookingId || b.id || ''),
    userId: String(b.userId || b.user?.id || ''),
    fullName: b.customerName || b.fullName || b.user?.name || 'Traveler',
    mobileNumber: b.phone || b.mobileNumber || '',
    email: b.email || b.user?.email || '',
    packageId: String(b.packageId || b.package?.id || ''),
    packageName: b.packageName || b.package?.title || b.package?.name || 'Valley Camping Package',
    adults: b.adults || 1,
    children: b.children || 0,
    travelDate: b.travelDate || new Date().toISOString().split('T')[0],
    totalAmount: b.totalAmount || (b.adults * 5000) + (b.children * 2500) || 5000,
    status: normalizeStatus(b.status),
    specialRequests: b.specialRequest || b.specialRequests,
    travelers: b.travelers || [{ fullName: b.customerName || b.fullName || 'Lead Traveler', age: 25, gender: 'Male', idProofType: 'Aadhaar Card', idProofNumber: 'N/A' }],
    utr: b.utrNumber || b.utr,
    date: b.createdAt || b.date || new Date().toISOString()
  };
}

export const api = {
  // --- Authentication Operations ---
  register: async (email: string, password: string, mobileNumber: string): Promise<ApiResponse> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mobileNumber }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        const msg = data.message || 'Registration failed';
        if (msg.includes('conflicts with existing data') || msg.includes('already exists')) {
          throw new Error('An account with this email address or mobile number already exists. Please log in instead.');
        }
        throw new Error(msg);
      }

      // Tokens are set as cookies server-side by the API route.
      // Just save user info for immediate UI access.
      if (data.user) {
        tokenStorage.setUser(data.user);
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  },

  login: async (email: string, password?: string, name?: string): Promise<User> => {
    if (password) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(data.message || 'Invalid email or password');
        }

        // Tokens are set as cookies server-side by the API route.

        const userObj: User = data.user || {
          id: 'unknown',
          name: name || email.split('@')[0],
          email: email,
          roles: [],
        };

        tokenStorage.setUser(userObj);

        return userObj;
      } catch (err: any) {
        console.warn('Login failed:', err.message);
        throw new Error('Invalid email address or password. Please verify your credentials.');
      }
    }

    throw new Error('Password is required to log in.');
  },

  logout: async () => {
    try {
      // This calls the Next.js API route which clears httpOnly cookies
      // and also calls the backend logout endpoint
      await tokenStorage.clearAuth();
    } catch {
      // Ignore errors — clearAuth already does best-effort cleanup
    }
  },

  getCurrentUser: (): User | null => {
    return tokenStorage.getUser();
  },

  // --- Admin Authentication Operations ---
  adminLogin: async (email: string, password?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required for admin authentication');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Invalid admin email or password');
    }

    const userObj = data.user;
    if (!userObj) {
      throw new Error('User information not received from server');
    }

    const roles: string[] = Array.isArray(userObj.roles) ? userObj.roles : [];
    const roleStr = typeof userObj.role === 'string' ? userObj.role.toUpperCase() : '';

    const isAdmin =
      roles.includes('ROLE_ADMIN') ||
      roles.includes('admin') ||
      roles.includes('ADMIN') ||
      roleStr === 'ADMIN' ||
      roleStr === 'ROLE_ADMIN';

    if (!isAdmin) {
      throw new Error('Access denied. Administrator privileges (ROLE_ADMIN) are required to access the admin portal.');
    }

    const adminRoles = Array.from(new Set([...roles, 'ROLE_ADMIN', 'admin']));

    const adminObj: User = {
      ...userObj,
      roles: adminRoles,
    };

    adminStorage.setAdminUser(adminObj);
    return adminObj;
  },

  adminRegister: async (email: string, password: string, mobileNumber: string): Promise<ApiResponse> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mobileNumber }),
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Admin registration failed');
    }

    const adminObj: User = {
      id: data.user?.id || `admin-${Date.now()}`,
      name: data.user?.name || email.split('@')[0],
      email: data.user?.email || email,
      phoneNumber: mobileNumber,
      roles: ['ROLE_ADMIN', 'admin'],
    };

    adminStorage.setAdminUser(adminObj);
    return { success: true, message: 'Admin account created successfully', data: adminObj };
  },

  adminLogout: async () => {
    try {
      await adminStorage.clearAdminAuth();
    } catch {
      // Ignore errors — clearAdminAuth already does best-effort cleanup
    }
  },

  getAdminUser: (): User | null => {
    return adminStorage.getAdminUser();
  },

  requestPasswordResetOtp: async (email: string): Promise<ApiResponse> => {
    return apiClient<ApiResponse>('/api/auth/password-reset/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  confirmPasswordReset: async (email: string, otp: string, newPassword: string): Promise<ApiResponse> => {
    return apiClient<ApiResponse>('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
  },

  requestPasswordChangeOtp: async (): Promise<ApiResponse> => {
    return apiClient<ApiResponse>('/api/auth/password-change/request-otp', {
      method: 'POST',
      requiresAuth: true
    });
  },

  confirmPasswordChange: async (otp: string, newPassword: string): Promise<ApiResponse> => {
    return apiClient<ApiResponse>('/api/auth/password-change/confirm', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ otp, newPassword })
    });
  },

  // --- Package Operations ---
  getPackages: async (): Promise<Package[]> => {
    try {
      const res = await apiClient<any>('/api/packages');
      const items = Array.isArray(res) ? res : res?.data || res?.content || [];
      if (Array.isArray(items)) {
        return items.map(mapBackendPackage);
      }
    } catch (err) {
      console.warn('Backend getPackages failed:', err);
    }
    return [];
  },

  getPackageById: async (id: string): Promise<Package | null> => {
    try {
      const res = await apiClient<any>(`/api/packages/${id}`);
      const item = res?.data || res;
      if (item && (item.id || item.title)) {
        return mapBackendPackage(item);
      }
    } catch (err) {
      console.warn(`Backend getPackageById(${id}) failed:`, err);
    }
    return null;
  },

  createPackage: async (newPkg: any): Promise<boolean> => {
    try {
      const payload = {
        title: newPkg.name || newPkg.title,
        description: newPkg.description,
        price: Number(newPkg.price),
        duration: newPkg.duration,
        location: newPkg.location || 'Valley of Flowers',
        itinerary: newPkg.itinerary?.[0] ? {
          dayNo: 1,
          title: newPkg.itinerary[0].title || 'Day 1',
          description: newPkg.itinerary[0].activities?.join(', ') || 'Trek & Explore'
        } : {
          dayNo: 1,
          title: 'Trek',
          description: 'Camping & Trekking'
        },
        meals: {
          breakfast: 'Included',
          lunch: 'Included',
          dinner: 'Included'
        }
      };

      await apiClient('/api/admin/packages', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err) {
      console.warn('Backend createPackage failed:', err);
      return false;
    }
  },

  updatePackage: async (id: string, updatedFields: Partial<Package>): Promise<boolean> => {
    try {
      const payload = {
        title: updatedFields.name || updatedFields.shortDescription,
        description: updatedFields.description,
        price: Number(updatedFields.price),
        duration: updatedFields.duration,
        location: updatedFields.location,
        itinerary: {
          dayNo: 1,
          title: 'Trek Day',
          description: updatedFields.description
        },
        meals: { breakfast: 'Included', lunch: 'Included', dinner: 'Included' }
      };

      await apiClient(`/api/admin/packages/${id}`, {
        method: 'PUT',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err) {
      console.warn(`Backend updatePackage(${id}) failed:`, err);
      return false;
    }
  },

  deletePackage: async (id: string): Promise<boolean> => {
    try {
      await apiClient(`/api/admin/packages/${id}`, {
        method: 'DELETE',
        requiresAuth: true
      });
      return true;
    } catch (err) {
      console.warn(`Backend deletePackage(${id}) failed:`, err);
      return false;
    }
  },

  // --- Booking Operations ---
  submitBooking: async (data: BookingSubmission, token?: string): Promise<BookingResponse> => {
    const pkgIdNum = parseInt(data.packageId, 10) || 1;
    const payload = {
      customerName: data.fullName,
      email: data.email,
      phone: data.mobileNumber.replace(/\D/g, '').slice(-10),
      packageId: pkgIdNum,
      travelDate: data.travelDate,
      adults: data.adults,
      children: data.children,
      specialRequest: data.specialRequests || 'None'
    };

    const res = await apiClient<any>('/api/bookings', {
      method: 'POST',
      requiresAuth: true,
      token,
      body: JSON.stringify(payload)
    });

    const resData = res.data || res;
    const bookingId = String(resData.bookingId || resData.id || '');
    const totalAmount = resData.totalAmount || (data.adults * 5000) + (data.children * 2500);

    if (bookingId) {
      tokenStorage.saveBookingId(bookingId);
    }

    return { bookingId, totalAmount };
  },

  getBookingById: async (bookingId: string, token?: string): Promise<Booking | null> => {
    try {
      const res = await apiClient<any>(`/api/bookings/${bookingId}`, { requiresAuth: true, token });
      const item = res.data || res;
      if (item && (item.bookingId || item.id)) {
        return {
          bookingId: String(item.bookingId || item.id),
          fullName: item.customerName || item.fullName || 'Traveler',
          mobileNumber: item.phone || item.mobileNumber || '',
          email: item.email || '',
          packageId: String(item.packageId || ''),
          packageName: item.packageName || 'Valley Camping Trek',
          adults: item.adults || 1,
          children: item.children || 0,
          travelDate: item.travelDate || new Date().toISOString().split('T')[0],
          totalAmount: item.totalAmount || 5000,
          status: normalizeStatus(item.status),
          specialRequests: item.specialRequest || item.specialRequests,
          travelers: item.travelers || [{ fullName: item.customerName || 'Lead Traveler', age: 25, gender: 'Male', idProofType: 'Aadhaar Card', idProofNumber: 'N/A' }],
          date: item.createdAt || item.date || new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn(`Backend getBookingById(${bookingId}) failed:`, err);
    }
    return null;
  },

  getBookings: async (userId: string, token?: string): Promise<Booking[]> => {
    const currentAdmin = adminStorage.getAdminUser();

    // 1. ADMIN USER FLOW: Fetch all bookings via GET /api/admin/bookings
    if (currentAdmin) {
      try {
        const adminRes = await apiClient<any>('/api/admin/bookings', { requiresAuth: true, token });
        const allItems = Array.isArray(adminRes) ? adminRes : adminRes?.data || adminRes?.content || [];
        if (Array.isArray(allItems) && allItems.length > 0) {
          const userEmail = currentAdmin.email?.toLowerCase();
          const userBookings = allItems.filter((b: any) =>
            String(b.userId || b.user?.id || b.id) === String(userId) ||
            (userEmail && (b.email?.toLowerCase() === userEmail || b.customerEmail?.toLowerCase() === userEmail))
          );
          return userBookings.map(mapBackendBooking);
        }
      } catch (err) {
        console.warn('Admin fetch /api/admin/bookings failed:', err);
      }
    }

    // 2. REGULAR USER FLOW: Fetch booking details via GET /api/bookings/{bookingId}
    const knownIds = tokenStorage.getBookingIds();
    if (knownIds.length > 0) {
      const fetchedBookings = await Promise.all(
        knownIds.map(bId => api.getBookingById(bId, token))
      );
      return fetchedBookings.filter((b): b is Booking => b !== null);
    }

    return [];
  },

  submitPaymentProof: async (
    bookingId: string,
    utr: string,
    screenshotName: string,
    amount: number = 0,
    file?: File,
    token?: string
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file, screenshotName);
      }
      formData.append('bookingId', bookingId);
      formData.append('utrNumber', utr);
      formData.append('utr', utr);
      formData.append('amount', String(amount));

      await apiFormClient(`/api/payment-proof?bookingId=${encodeURIComponent(bookingId)}&utrNumber=${encodeURIComponent(utr)}&amount=${amount || 5000}`, formData, true, token);
      return true;
    } catch (err) {
      console.warn('Backend payment proof submit failed:', err);
      return false;
    }
  },

  // Admin booking management
  getAllBookings: async (token?: string): Promise<Booking[]> => {
    try {
      const res = await apiClient<any>('/api/admin/bookings', { requiresAdmin: true, token });
      const items = Array.isArray(res) ? res : res?.data || res?.content || [];
      if (Array.isArray(items)) {
        return items.map(mapBackendBooking);
      }
    } catch (err) {
      console.warn('Backend getAllBookings failed:', err);
    }
    return [];
  },

  approveBooking: async (id: string | number, token?: string): Promise<boolean> => {
    const targetId = String(id);
    setStatusOverride(targetId, 'approved');
    try {
      await apiClient(`/api/admin/bookings/${targetId}/approve`, {
        method: 'PUT',
        requiresAdmin: true,
        token
      });
      return true;
    } catch (err) {
      console.warn(`Backend approveBooking(${targetId}) warning:`, err);
      try {
        await apiClient(`/api/admin/bookings/${targetId}/status`, {
          method: 'PUT',
          requiresAdmin: true,
          token,
          body: JSON.stringify({ status: 'APPROVED' })
        });
        return true;
      } catch {
        return false;
      }
    }
  },

  rejectBooking: async (id: string | number, token?: string): Promise<boolean> => {
    const targetId = String(id);
    setStatusOverride(targetId, 'rejected');
    try {
      await apiClient(`/api/admin/bookings/${targetId}/reject`, {
        method: 'PUT',
        requiresAdmin: true,
        token
      });
      return true;
    } catch (err) {
      console.warn(`Backend rejectBooking(${targetId}) warning:`, err);
      try {
        await apiClient(`/api/admin/bookings/${targetId}/status`, {
          method: 'PUT',
          requiresAdmin: true,
          token,
          body: JSON.stringify({ status: 'REJECTED' })
        });
        return true;
      } catch {
        return false;
      }
    }
  },

  updateBookingStatus: async (bookingId: string | number, status: 'approved' | 'rejected' | 'pending' | 'pending_payment', token?: string): Promise<boolean> => {
    const targetId = String(bookingId);
    setStatusOverride(targetId, status);
    if (status === 'approved') {
      return api.approveBooking(targetId, token);
    }
    if (status === 'rejected') {
      return api.rejectBooking(targetId, token);
    }
    try {
      await apiClient(`/api/admin/bookings/${targetId}/status`, {
        method: 'PUT',
        requiresAdmin: true,
        token,
        body: JSON.stringify({ status: status.toUpperCase() })
      });
      return true;
    } catch (err) {
      console.warn('Backend updateBookingStatus failed:', err);
      return false;
    }
  },

  deleteBooking: async (id: string | number, token?: string): Promise<boolean> => {
    const targetId = String(id);
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'DELETE',
        requiresAdmin: true,
        token
      });
      return true;
    } catch (err) {
      console.warn(`Backend deleteBooking(${targetId}) failed:`, err);
      return false;
    }
  },

  updateBooking: async (bookingId: string, updatedFields: Partial<Booking>): Promise<boolean> => {
    try {
      await apiClient(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        requiresAuth: true,
        body: JSON.stringify(updatedFields)
      });
      return true;
    } catch (err) {
      console.warn(`Backend updateBooking(${bookingId}) failed:`, err);
      return false;
    }
  },

  // --- Misc Content ---
  getGallery: async (): Promise<GalleryItem[]> => {
    try {
      const res = await apiClient<any>('/api/gallery');
      const items = res?.data || res;
      if (Array.isArray(items) && items.length > 0) return items;
    } catch { }
    return [];
  },

  getReviews: async (): Promise<Review[]> => {
    try {
      const res = await apiClient<any>('/api/reviews');
      const items = res?.data || res;
      if (Array.isArray(items) && items.length > 0) return items;
    } catch { }
    return [];
  },

  getFAQs: async (): Promise<FAQ[]> => {
    try {
      const res = await apiClient<any>('/api/faqs');
      const items = res?.data || res;
      if (Array.isArray(items) && items.length > 0) return items;
    } catch { }
    return [];
  },

  submitContact: async (data: ContactSubmission): Promise<boolean> => {
    try {
      await apiClient('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return true;
    } catch (err) {
      console.warn('Backend submitContact failed:', err);
      return false;
    }
  },

  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User | null> => {
    try {
      const res = await apiClient<any>(`/api/users/${userId}`, {
        method: 'PUT',
        requiresAuth: true,
        body: JSON.stringify(data)
      });
      const updated = res.data || res;
      if (updated) {
        tokenStorage.setUser(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Backend updateUserProfile failed:', err);
    }
    return null;
  }
};
