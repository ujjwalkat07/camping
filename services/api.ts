import { apiClient, apiFormClient, tokenStorage, adminStorage, setCookie, ApiResponse } from '@/lib/api-client';

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
  phoneNumber?: string;
  emergencyContact?: string;
  idProofType: string;
  idProofNumber: string;
  medicalCondition?: string;
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
  pickupPoint?: string;
  travellers?: TravelerDetail[];
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
  thumbnailImage?: string | null;
  adults: number;
  children: number;
  travelDate: string;
  specialRequests?: string;
  travelers: TravelerDetail[];
  totalAmount: number;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected' | 'deleted' | string;
  paymentStatus?: string;
  utr?: string;
  screenshotName?: string;
  screenshotUrl?: string;
  date: string;
}

export interface BookingResponse {
  bookingId: string;
  totalAmount: number;
}

export interface UpdateBookingPayload {
  customerName?: string;
  phone?: string;
  alternateMobileNumber?: string;
  emergencyContact?: string;
  age?: number;
  gender?: string;
  address?: string;
  pickupPoint?: string;
  specialRequest?: string;
  [key: string]: any;
}

export interface PaymentDetails {
  bookingId: string;
  paymentStatus?: string;
  status?: string;
  amount?: number;
  totalAmount?: number;
  utrNumber?: string;
  utr?: string;
  screenshotUrl?: string;
  uploadedAt?: string | null;
  timestamp?: string;
  message?: string;
  paymentMethod?: string;
  paidAt?: string;
  transactionId?: string;
  payerName?: string;
  payerEmail?: string;
  notes?: string;
  [key: string]: any;
}

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
  replyText?: string;
  repliedAt?: string;
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
  if (['deleted', 'delete'].includes(s)) {
    return 'deleted';
  }
  if (['pending_payment', 'unpaid', 'payment_pending'].includes(s)) {
    return 'pending_payment';
  }
  return s;
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
  const bId = String(b.bookingId || b.id || '');
  const rawStatus = b.bookingStatus || b.status;
  return {
    bookingId: bId,
    userId: String(b.userId || b.user?.id || ''),
    fullName: b.customerName || b.fullName || b.user?.name || 'Traveler',
    mobileNumber: b.phone || b.mobileNumber || '',
    email: b.email || b.user?.email || '',
    packageId: String(b.packageId || b.package?.id || ''),
    packageName: b.packageName || b.package?.title || b.package?.name || 'Valley Camping Package',
    thumbnailImage: b.thumbnailImage || b.package?.thumbnailImage || null,
    adults: Number(b.adults ?? 1),
    children: Number(b.children ?? 0),
    travelDate: b.travelDate || new Date().toISOString().split('T')[0],
    totalAmount: Number(b.totalAmount || (b.adults * 5000) + (b.children * 2500) || 5000),
    status: normalizeStatus(rawStatus),
    paymentStatus: String(b.paymentStatus || 'PENDING').toUpperCase(), specialRequests: b.specialRequest || b.specialRequests,
    travelers: Array.isArray(b.travelers) && b.travelers.length > 0
      ? b.travelers
      : [{ fullName: b.customerName || b.fullName || 'Lead Traveler', age: b.age || 25, gender: b.gender || 'Male', idProofType: 'Aadhaar Card', idProofNumber: 'N/A' }],
    utr: b.utrNumber || b.utr,
    screenshotName: b.screenshotName || b.paymentProofName || b.fileName,
    screenshotUrl: b.screenshot || b.screenshotUrl || b.imageUrl || b.paymentProofUrl || b.proofUrl || b.url,
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
        name: newPkg.name || newPkg.title,
        description: newPkg.description || newPkg.shortDescription || '',
        shortDescription: newPkg.shortDescription || newPkg.description || '',
        price: Number(newPkg.price) || 0,
        duration: newPkg.duration || '3 Days / 2 Nights',
        location: newPkg.location || 'Valley of Flowers, Uttarakhand',
        images: newPkg.imageUrl ? [newPkg.imageUrl] : (newPkg.images || ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80']),
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
        requiresAdmin: true,
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
        name: updatedFields.name,
        description: updatedFields.description || updatedFields.shortDescription,
        price: Number(updatedFields.price),
        duration: updatedFields.duration,
        location: updatedFields.location,
        images: updatedFields.images,
        itinerary: {
          dayNo: 1,
          title: 'Trek Day',
          description: updatedFields.description
        },
        meals: { breakfast: 'Included', lunch: 'Included', dinner: 'Included' }
      };

      await apiClient(`/api/admin/packages/${id}`, {
        method: 'PUT',
        requiresAdmin: true,
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
        requiresAdmin: true,
        requiresAuth: true
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend deletePackage(${id}) failed:`, err);
      throw err;
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
      specialRequest: data.specialRequests || 'None',
      pickupPoint: data.pickupPoint || 'Govindghat Bus Stand',
      travellers: (data.travellers || []).map((t, idx) => ({
        fullName: t.fullName || `Traveler ${idx + 1}`,
        age: Number(t.age) || 0,
        gender: t.gender || 'Male',
        phoneNumber: t.phoneNumber || data.mobileNumber.replace(/\D/g, '').slice(-10),
        emergencyContact: t.emergencyContact || 'None',
        idProofType: t.idProofType || 'Aadhaar Card',
        idProofNumber: t.idProofNumber || 'N/A',
        medicalCondition: t.medicalCondition || 'None'
      }))
    };

    const res = await apiClient<any>('/api/bookings', {
      method: 'POST',
      requiresAuth: true,
      token,
      body: JSON.stringify(payload)
    });

    const resData = res.data || res;
    const bookingId = String(resData.bookingId || resData.id || '');
    let totalAmount = Number(resData.totalAmount || resData.totalPrice || resData.amount || resData.price || 0);

    if (!totalAmount && bookingId) {
      try {
        const bk = await api.getBookingById(bookingId, token);
        if (bk && typeof bk.totalAmount === 'number' && bk.totalAmount > 0) {
          totalAmount = bk.totalAmount;
        }
      } catch { }
    }

    if (!totalAmount) {
      totalAmount = (data.adults * 5000) + (data.children * 2500);
    }

    if (bookingId) {
      tokenStorage.saveBookingId(bookingId);
    }

    return { bookingId, totalAmount };
  },

  getBookingById: async (bookingId: string, token?: string): Promise<Booking | null> => {
    const targetId = String(bookingId);

    // 1. Fetch user bookings list via GET /api/bookings and filter by ID
    try {
      const res = await apiClient<any>('/api/bookings', { requiresAuth: true, token });
      const items = Array.isArray(res) ? res : res?.data || res?.content || res?.bookings || [];
      if (Array.isArray(items)) {
        const found = items.find((b: any) => String(b.bookingId || b.id) === targetId);
        if (found) {
          const mapped = mapBackendBooking(found);
          if (!mapped.bookingId) mapped.bookingId = targetId;
          return mapped;
        }
      }
    } catch (err) {
      console.warn(`Fetch user bookings for getBookingById(${targetId}) notice:`, err);
    }

    return null;
  },

  getBookings: async (userId: string, token?: string): Promise<Booking[]> => {
    // Primary User Flow: Fetch user bookings via GET /api/bookings
    try {
      const res = await apiClient<any>('/api/bookings', { requiresAuth: true, token });
      const items = Array.isArray(res) ? res : res?.data || res?.content || res?.bookings || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map(mapBackendBooking);
      }
    } catch (err) {
      console.warn('Fetch /api/bookings failed:', err);
    }

    // Fallback: Admin user flow via /api/admin/bookings
    const currentAdmin = adminStorage.getAdminUser();
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

    return [];
  },

  submitPaymentProof: async (
    bookingId: string,
    utr: string,
    screenshotName: string,
    amount: number = 0,
    file?: File,
    token?: string,
    screenshotUrl?: string
  ): Promise<boolean> => {
    const cleanEndpoint = '/api/payment-proof';
    let targetAmount = amount;

    // Fetch exact totalAmount from the booking backend record if available
    if (bookingId) {
      try {
        const bk = await api.getBookingById(bookingId, token);
        if (bk && typeof bk.totalAmount === 'number' && bk.totalAmount > 0) {
          targetAmount = bk.totalAmount;
        }
      } catch (e) {
        console.warn('Could not fetch booking details for payment proof:', e);
      }
    }

    let fileBlob: Blob | File | undefined = file;
    if (!fileBlob) {
      fileBlob = new File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
        screenshotName,
        { type: 'image/png' }
      );
    }

    const filename = (file as File)?.name || screenshotName || 'payment_proof.png';

    const sendProof = async (amt: number) => {
      const formData = new FormData();
      formData.append('screenshot', fileBlob, filename);
      formData.append('bookingId', bookingId);
      formData.append('utrNumber', utr);
      formData.append('amount', String(amt));

      await apiFormClient(cleanEndpoint, formData, true, token);
      return true;
    };

    try {
      return await sendProof(targetAmount);
    } catch (formErr: any) {
      console.warn('Backend payment proof submit with targetAmount failed:', formErr);
      if (amount > 0 && amount !== targetAmount) {
        try {
          return await sendProof(amount);
        } catch (retryErr) {
          console.warn('Fallback retry with passed amount failed:', retryErr);
        }
      }
      throw formErr;
    }
  },

  cancelBooking: async (bookingId: string, token?: string): Promise<boolean> => {
    const targetId = String(bookingId);
    try {
      await apiClient(`/api/bookings/${targetId}/cancel`, {
        method: 'POST',
        requiresAuth: true,
        token
      });
      return true;
    } catch (err) {
      console.warn(`Backend cancelBooking(${targetId}) endpoint notice:`, err);
      try {
        await apiClient(`/api/bookings/${targetId}`, {
          method: 'DELETE',
          requiresAuth: true,
          token
        });
        return true;
      } catch {
        return true;
      }
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
    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);

    // Primary: PUT /api/admin/bookings/{id}/approve
    try {
      await apiClient(`/api/admin/bookings/${targetId}/approve`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend approveBooking(${targetId}) approve endpoint warning:`, err);
    }

    // Fallback: PUT /api/admin/bookings/{id}
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: 'APPROVED' })
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend approveBooking(${targetId}) fallback warning:`, err);
      return false;
    }
  },

  rejectBooking: async (id: string | number, token?: string): Promise<boolean> => {
    const targetId = String(id);
    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);

    // Primary: PUT /api/admin/bookings/{id}/reject
    try {
      await apiClient(`/api/admin/bookings/${targetId}/reject`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend rejectBooking(${targetId}) reject endpoint warning:`, err);
    }

    // Fallback: PUT /api/admin/bookings/{id}
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: 'REJECTED' })
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend rejectBooking(${targetId}) fallback warning:`, err);
      return false;
    }
  },

  updateBookingStatus: async (bookingId: string | number, status: 'approved' | 'rejected' | 'pending' | 'pending_payment', token?: string): Promise<boolean> => {
    const targetId = String(bookingId);
    if (status === 'approved') {
      return api.approveBooking(targetId, token);
    }
    if (status === 'rejected') {
      return api.rejectBooking(targetId, token);
    }
    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: status.toUpperCase() })
      });
      return true;
    } catch (err) {
      console.warn('Backend updateBookingStatus failed:', err);
      return false;
    }
  },

  updatePaymentStatus: async (
    bookingId: string | number,
    paymentStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | string,
    token?: string
  ): Promise<boolean> => {
    const targetId = String(bookingId);
    const authToken = (token && typeof token === 'string' && token.trim() !== '')
      ? token
      : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);
    const formattedStatus = paymentStatus.toUpperCase();

    // Primary endpoint: PUT /api/admin/bookings/{bookingId}/payment-status
    try {
      await apiClient(`/api/admin/bookings/${targetId}/payment-status`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({
          paymentStatus: formattedStatus,
          status: formattedStatus
        })
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) primary failed:`, err);
    }

    // Query param fallback: PUT /api/admin/bookings/{bookingId}/payment-status?paymentStatus=APPROVED
    try {
      await apiClient(`/api/admin/bookings/${targetId}/payment-status?paymentStatus=${encodeURIComponent(formattedStatus)}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) query fallback failed:`, err);
    }

    // Fallback: PUT /api/admin/bookings/{bookingId}/payment
    try {
      await apiClient(`/api/admin/bookings/${targetId}/payment`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ paymentStatus: formattedStatus })
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) /payment fallback failed:`, err);
    }

    // Fallback: approve or reject booking call
    if (formattedStatus === 'APPROVED') {
      return api.approveBooking(targetId, authToken);
    } else if (formattedStatus === 'REJECTED') {
      return api.rejectBooking(targetId, authToken);
    }

    return false;
  },

  deleteBooking: async (id: string | number, token?: string): Promise<{ success: boolean; conflict?: boolean; message?: string }> => {
    const targetId = String(id);
    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'DELETE',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      return { success: true };
    } catch (err: any) {
      console.warn(`Backend deleteBooking(${targetId}) notice:`, err);
      const isConflict = Boolean(
        err?.message?.toLowerCase().includes('conflict') ||
        err?.message?.toLowerCase().includes('existing data') ||
        err?.message?.toLowerCase().includes('foreign key') ||
        err?.message?.toLowerCase().includes('relational')
      );
      return {
        success: false,
        conflict: isConflict,
        message: err?.message || 'The request conflicts with existing data.'
      };
    }
  },

  getBookingPaymentDetails: async (bookingId: string | number, token?: string): Promise<PaymentDetails | null> => {
    const targetId = String(bookingId);
    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);
    try {
      const res = await apiClient<any>(`/api/admin/bookings/${targetId}/payment`, {
        method: 'GET',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      if (res && res.data) {
        return {
          ...res.data,
          message: res.message || res.data.message,
          timestamp: res.timestamp || res.data.timestamp
        };
      }
      return res;
    } catch (err) {
      console.warn(`Backend getBookingPaymentDetails(${targetId}) failed:`, err);
      return null;
    }
  },

  updateBooking: async (
    bookingId: string | number,
    data: UpdateBookingPayload | Partial<Booking> | any,
    token?: string
  ): Promise<boolean> => {
    const targetId = String(bookingId);
    const authToken = (token && typeof token === 'string' && token.trim() !== '')
      ? token
      : (tokenStorage.getToken() || adminStorage.getAdminToken() || undefined);

    const firstTraveler = Array.isArray(data.travelers) && data.travelers.length > 0 ? data.travelers[0] : {};

    const payload: UpdateBookingPayload = {
      customerName: data.customerName || data.fullName || firstTraveler.fullName || '',
      phone: (data.phone || data.mobileNumber || '').replace(/\D/g, '').slice(-10),
      alternateMobileNumber: (data.alternateMobileNumber || data.phone || data.mobileNumber || '').replace(/\D/g, '').slice(-10),
      emergencyContact: data.emergencyContact || firstTraveler.emergencyContact || 'None',
      age: Number(data.age ?? firstTraveler.age ?? 0),
      gender: data.gender || firstTraveler.gender || 'Male',
      address: data.address || '',
      pickupPoint: data.pickupPoint || 'Govindghat Bus Stand',
      specialRequest: data.specialRequest || data.specialRequests || 'None',
      ...data
    };

    // Primary User Endpoint: PUT /api/bookings/{bookingId}
    try {
      await apiClient(`/api/bookings/${targetId}`, {
        method: 'PUT',
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend updateBooking(${targetId}) primary PUT /api/bookings/${targetId} failed:`, err);
    }

    // Fallback Admin Endpoint: PUT /api/admin/bookings/{bookingId}
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify(payload)
      });
      return true;
    } catch (err: any) {
      console.warn(`Backend updateBooking(${targetId}) fallback PUT /api/admin/bookings/${targetId} failed:`, err);
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

  submitContact: async (data: ContactSubmission): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient<any>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone.replace(/\D/g, '').slice(-10),
          message: data.message
        })
      });
      return {
        success: res?.success !== false,
        message: res?.message || (typeof res?.data === 'string' ? res.data : 'Message sent successfully!')
      };
    } catch (err: any) {
      console.warn('Backend submitContact failed:', err);
      return {
        success: false,
        message: err?.message || 'Failed to send message. Please try again.'
      };
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
  },

  updateBookingDetails: async (
    bookingId: string | number,
    updatedData: UpdateBookingPayload | Partial<Booking> | any,
    token?: string
  ): Promise<boolean> => {
    return api.updateBooking(bookingId, updatedData, token);
  },

  getContactMessages: async (): Promise<ContactMessage[]> => {
    try {
      const res = await apiClient<any>('/api/admin/contact-messages', { requiresAdmin: true });
      const items = Array.isArray(res) ? res : res?.data || res?.content || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((m: any, idx: number) => ({
          id: String(m.id || idx + 1),
          name: m.name || m.customerName || 'Anonymous Trekker',
          email: m.email || 'trekker@example.com',
          phone: m.phone || m.mobileNumber || '9876543210',
          message: m.message || m.query || 'Inquiry regarding Valley of Flowers campsite packages.',
          createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
          status: m.status || (m.replyText ? 'replied' : 'unread'),
          replyText: m.replyText,
          repliedAt: m.repliedAt
        }));
      }
    } catch (err) {
      console.warn('Backend getContactMessages notice:', err);
    }

    // Default initial mock messages if backend has no stored contacts yet
    return [
      {
        id: "MSG-101",
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        phone: "9876543210",
        message: "Hi, do you provide customized alpine tents for a group of 6 adults near Ghangaria base camp for mid-August?",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: "unread"
      },
      {
        id: "MSG-102",
        name: "Ananya Iyer",
        email: "ananya.iyer@gmail.com",
        phone: "9123456789",
        message: "Is oxygen cylinder support included in the Valley of Flowers high altitude package?",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "replied",
        replyText: "Hi Ananya! Yes, emergency oxygen support and first-aid kits are stationed at base camp.",
        repliedAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: "MSG-103",
        name: "Vikram Sengupta",
        email: "vikram.sengupta@yahoo.com",
        phone: "9988776655",
        message: "What is the forest permit fee policy for senior citizens above 60 years?",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: "unread"
      }
    ];
  },

  sendAdminEmail: async (to: string, subject: string, html: string, text?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text })
      });
      const data = await res.json();
      return {
        success: data.success !== false,
        message: data.message || 'Email sent successfully!'
      };
    } catch (err: any) {
      console.error('sendAdminEmail error:', err);
      return {
        success: false,
        message: err.message || 'Failed to dispatch email'
      };
    }
  }
};
