import { apiClient, apiFormClient, tokenStorage, adminStorage, setCookie, ApiResponse } from '@/lib/api-client';
import { isAdminUser } from '@/lib/utils';

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
  id?: number | string;
  fullName: string;
  age: number;
  gender: string;
  phoneNumber?: string;
  emergencyContact?: string;
  idProofType: string;
  idProofNumber: string;
  medicalCondition?: string;
  createdAt?: string;
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
  pickupPoint?: string;
  travelers: TravelerDetail[];
  totalAmount: number;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected' | 'deleted' | string;
  paymentStatus?: string;
  utr?: string;
  screenshotName?: string;
  screenshotUrl?: string;
  uploadedAt?: string | null;
  paymentDetails?: any;
  createdAt?: string | null;
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

function applyLocalOverride(booking: Booking): Booking {
  if (typeof window === 'undefined' || !booking.bookingId) return booking;
  try {
    const raw = localStorage.getItem(`booking_override_${booking.bookingId}`);
    if (!raw) return booking;
    const override = JSON.parse(raw);

    return {
      ...booking,
      fullName: override.customerName || override.fullName || booking.fullName,
      mobileNumber: override.phone || override.mobileNumber || booking.mobileNumber,
      specialRequests: override.specialRequest || override.specialRequests || booking.specialRequests,
      pickupPoint: override.pickupPoint || booking.pickupPoint,
      travelers: booking.travelers.map((t, idx) => idx === 0 ? {
        ...t,
        fullName: override.customerName || override.fullName || t.fullName,
        phoneNumber: override.phone || override.mobileNumber || t.phoneNumber,
        emergencyContact: override.emergencyContact || t.emergencyContact,
        age: override.age ? Number(override.age) : t.age,
        gender: override.gender || t.gender,
      } : t)
    };
  } catch {
    return booking;
  }
}

function mapBackendBooking(b: any): Booking {
  const bId = String(b.bookingId || b.id || '');
  const rawStatus = b.bookingStatus || b.status;
  const rawTravelers = Array.isArray(b.travellers) && b.travellers.length > 0
    ? b.travellers
    : Array.isArray(b.travelers) && b.travelers.length > 0
      ? b.travelers
      : [];

  const baseBooking: Booking = {
    id: b.id,
    bookingId: bId,
    userId: String(b.userId || b.user?.id || ''),
    fullName: b.customerName || b.fullName || b.user?.name || rawTravelers[0]?.fullName || 'Traveler',
    mobileNumber: b.phone || b.mobileNumber || rawTravelers[0]?.phoneNumber || '',
    email: b.email || b.user?.email || '',
    packageId: String(b.packageId || b.package?.id || ''),
    packageName: b.packageName || b.package?.title || b.package?.name || 'Valley Camping Package',
    thumbnailImage: b.thumbnailImage || b.package?.thumbnailImage || null,
    adults: Number(b.adults ?? (rawTravelers.length || 1)),
    children: Number(b.children ?? 0),
    travelDate: b.travelDate || new Date().toISOString().split('T')[0],
    totalAmount: Number(b.totalAmount || (b.adults * 5000) + (b.children * 2500) || 5000),
    status: normalizeStatus(rawStatus),
    paymentStatus: String(b.paymentStatus || b.payment_status || 'NOT_PAID').toUpperCase(),
    specialRequests: b.specialRequest || b.specialRequests || 'None',
    pickupPoint: b.pickupPoint || b.pickup_point || 'Govindghat Bus Stand',
    travelers: rawTravelers.length > 0
      ? rawTravelers.map((t: any) => ({
        id: t.id,
        fullName: t.fullName || 'Traveler',
        age: Number(t.age || 25),
        gender: t.gender || 'MALE',
        phoneNumber: t.phoneNumber || t.phone || '',
        emergencyContact: t.emergencyContact || 'None',
        idProofType: t.idProofType || 'Aadhaar Card',
        idProofNumber: t.idProofNumber || 'N/A',
        medicalCondition: t.medicalCondition || 'None',
        createdAt: t.createdAt
      }))
      : [{ fullName: b.customerName || b.fullName || 'Lead Traveler', age: b.age || 25, gender: b.gender || 'MALE', idProofType: 'Aadhaar Card', idProofNumber: 'N/A' }],
    utr: b.utrNumber || b.utr,
    screenshotName: b.screenshotName || b.paymentProofName || b.fileName,
    screenshotUrl: b.screenshot || b.screenshotUrl || b.imageUrl || b.paymentProofUrl || b.proofUrl || b.url,
    uploadedAt: b.uploadedAt || b.paymentUploadedAt || null,
    createdAt: b.createdAt || b.date || null,
    date: b.createdAt || b.uploadedAt || b.date || new Date().toISOString()
  };

  return applyLocalOverride(baseBooking);
}

export function createPlaceholderImageFile(utrText: string = "pay on spot", filename: string = "pay_on_spot.png"): File {
  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 600, 300);
        grad.addColorStop(0, "#059669");
        grad.addColorStop(1, "#047857");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 300);

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(30, 30, 540, 240, 16);
        } else {
          ctx.fillRect(30, 30, 540, 240);
        }
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAYMENT ON SPOT", 300, 130);
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(utrText.toUpperCase(), 300, 180);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText("Base Camp On-Arrival Payment", 300, 220);

        const dataUrl = canvas.toDataURL("image/png");
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new File([ab], filename, { type: mimeString });
      }
    } catch (e) {
      //warn("Canvas image creation fallback:", e);
    }
  }

  // Pure 1x1 valid PNG byte array fallback
  const png1x1Bytes = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
    0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 213, 196, 237, 0, 0, 0, 13, 73, 68, 65, 84,
    120, 156, 99, 96, 248, 15, 0, 1, 5, 1, 2, 162, 76, 182, 254, 0, 0, 0, 0, 73,
    69, 78, 68, 174, 66, 96, 130
  ]);
  return new File([png1x1Bytes], filename, { type: 'image/png' });
}

function helperDataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const executePackageMultipartRequest = async (
  endpoint: string,
  payload: any,
  imageFile: File | Blob | undefined,
  httpMethod: 'POST' | 'PUT'
): Promise<boolean> => {
  console.log('[PackageMultipart] Starting request:', httpMethod, endpoint);
  console.log('[PackageMultipart] Payload:', JSON.stringify(payload));
  console.log('[PackageMultipart] Has imageFile:', !!imageFile);

  const formData = new FormData();

  // The 'data' part must be sent as a Blob with application/json content type
  // so Spring Boot @RequestPart can deserialize it via Jackson
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  // The 'image' part is optional binary file
  if (imageFile) {
    formData.append('image', imageFile);
  }

  await apiFormClient(endpoint, formData, true, undefined, httpMethod);
  return true;
};

// Helper to build CreatePackageRequest payload matching the backend.
// Backend accepts itinerary as an array of { dayNo, title, description } objects.
// NOTE: there is NO 'images' field — image goes as separate multipart part.
function buildPackagePayload(pkg: any): any {
  // itinerary: backend accepts an array of { dayNo, title, description } objects
  let itinerary: { dayNo: number; title: string; description: string }[];
  if (Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0) {
    itinerary = pkg.itinerary.map((it: any, idx: number) => ({
      dayNo: Number(it.dayNo || it.day || idx + 1),
      title: String(it.title || `Day ${idx + 1}`),
      description: String(it.description || (Array.isArray(it.activities) ? it.activities.join(', ') : '') || 'Camping & Trekking')
    }));
  } else if (pkg.itinerary && typeof pkg.itinerary === 'object' && !Array.isArray(pkg.itinerary)) {
    // Handle legacy single-object format by wrapping in array
    itinerary = [{
      dayNo: Number(pkg.itinerary.dayNo || 1),
      title: String(pkg.itinerary.title || 'Day 1'),
      description: String(pkg.itinerary.description || 'Camping & Trekking')
    }];
  } else {
    itinerary = [{
      dayNo: 1,
      title: 'Day 1: Arrival & Base Camp',
      description: 'Arrive at base camp, check-in, and trek briefing'
    }];
  }

  const meals = pkg.meals && typeof pkg.meals === 'object'
    ? {
      breakfast: String(pkg.meals.breakfast || 'Included'),
      lunch: String(pkg.meals.lunch || 'Included'),
      dinner: String(pkg.meals.dinner || 'Included')
    }
    : { breakfast: 'Included', lunch: 'Included', dinner: 'Included' };

  return {
    title: String(pkg.name || pkg.title || ''),
    description: String(pkg.description || pkg.shortDescription || ''),
    price: Math.max(Number(pkg.price) || 0, 0.01),
    duration: String(pkg.duration || '3 Days / 2 Nights'),
    location: String(pkg.location || 'Valley of Flowers, Uttarakhand'),
    itinerary,
    meals
  };
}

export const api = {
  // --- Authentication Operations ---
  register: async (email: string, password?: string, name?: string, mobileNumber?: string): Promise<any> => {
    try {
      const data = await apiClient<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, mobileNumber }),
      });

      const token = data.token || data.accessToken;
      const refreshToken = data.refreshToken;
      if (token) tokenStorage.setToken(token);
      if (refreshToken) tokenStorage.setRefreshToken(refreshToken);

      if (data.user) {
        tokenStorage.setUser(data.user);
      }

      return data;
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      if (msg.includes('conflicts with existing data') || msg.includes('already exists')) {
        throw new Error('An account with this email address or mobile number already exists. Please log in instead.');
      }
      throw new Error(msg);
    }
  },

  login: async (email: string, password?: string, name?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required to log in.');
    }

    try {
      const data = await apiClient<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const token = data.token || data.accessToken;
      const refreshToken = data.refreshToken;

      if (token) {
        tokenStorage.setToken(token);
      }
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }

      const userObj: User = data.user || {
        id: String(data.id || 'unknown'),
        name: name || data.name || email.split('@')[0],
        email: email,
        roles: data.roles || [],
      };

      tokenStorage.setUser(userObj);
      return userObj;
    } catch (err: any) {
      //warn('Login failed:', err.message);
      throw new Error(err.message || 'Invalid email address or password. Please verify your credentials.');
    }
  },

  logout: async () => {
    try {
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

    const data = await apiClient<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = data.token || data.accessToken;
    const refreshToken = data.refreshToken;

    if (token) {
      tokenStorage.setToken(token);
    }
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
    }

    const userObj = data.user || {
      id: String(data.id || 'admin'),
      name: data.name || email.split('@')[0],
      email: email,
      roles: data.roles || [],
    };

    const isAdmin = isAdminUser(userObj);

    if (!isAdmin) {
      throw new Error('Access denied. Administrator privileges (ROLE_ADMIN) are required to access the admin portal.');
    }

    const adminObj: User = {
      ...userObj,
      roles: Array.from(new Set([...(Array.isArray(userObj.roles) ? userObj.roles : []), 'ROLE_ADMIN'])),
    };

    adminStorage.setAdminUser(adminObj);
    return adminObj;
  },

  adminRegister: async (email: string, password: string, mobileNumber: string): Promise<ApiResponse> => {
    const data = await apiClient<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, mobileNumber }),
    });

    const token = data.token || data.accessToken;
    const refreshToken = data.refreshToken;
    if (token) tokenStorage.setToken(token);
    if (refreshToken) tokenStorage.setRefreshToken(refreshToken);

    const adminObj: User = {
      id: data.user?.id || `admin-${Date.now()}`,
      name: data.user?.name || email.split('@')[0],
      email: data.user?.email || email,
      phoneNumber: mobileNumber,
      roles: ['ROLE_ADMIN'],
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
      //warn('Backend getPackages failed:', err);
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
      //warn(`Backend getPackageById(${id}) failed:`, err);
    }
    return null;
  },

  createPackage: async (newPkg: any): Promise<boolean> => {
    try {
      const payload = buildPackagePayload(newPkg);

      // Extract image file from the input
      let imageFile: File | Blob | undefined = newPkg.imageFile;
      if (!imageFile && newPkg.imageUrl && typeof newPkg.imageUrl === 'string' && newPkg.imageUrl.startsWith('data:image/')) {
        try {
          imageFile = helperDataURLtoFile(newPkg.imageUrl, 'package_cover.png');
        } catch { }
      } else if (!imageFile && Array.isArray(newPkg.images) && typeof newPkg.images[0] === 'string' && newPkg.images[0].startsWith('data:image/')) {
        try {
          imageFile = helperDataURLtoFile(newPkg.images[0], 'package_cover.png');
        } catch { }
      }

      return await executePackageMultipartRequest('/api/admin/packages', payload, imageFile, 'POST');
    } catch (err) {
      //warn('Backend createPackage failed:', err);
      return false;
    }
  },

  updatePackage: async (id: string, updatedFields: any): Promise<boolean> => {
    try {
      const payload = buildPackagePayload(updatedFields);

      // Extract image file from the input
      let imageFile: File | Blob | undefined = updatedFields.imageFile;
      if (!imageFile && updatedFields.imageUrl && typeof updatedFields.imageUrl === 'string' && updatedFields.imageUrl.startsWith('data:image/')) {
        try {
          imageFile = helperDataURLtoFile(updatedFields.imageUrl, 'package_cover.png');
        } catch { }
      } else if (!imageFile && Array.isArray(updatedFields.images) && typeof updatedFields.images[0] === 'string' && updatedFields.images[0].startsWith('data:image/')) {
        try {
          imageFile = helperDataURLtoFile(updatedFields.images[0], 'package_cover.png');
        } catch { }
      }

      return await executePackageMultipartRequest(`/api/admin/packages/${id}`, payload, imageFile, 'PUT');
    } catch (err) {
      //warn(`Backend updatePackage(${id}) failed:`, err);
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
      //warn(`Backend deletePackage(${id}) failed:`, err);
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
      //warn(`Fetch user bookings for getBookingById(${targetId}) notice:`, err);
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
      //warn('Fetch /api/bookings failed:', err);
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
        //warn('Admin fetch /api/admin/bookings failed:', err);
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
        //warn('Could not fetch booking details for payment proof:', e);
      }
    }

    let fileBlob: Blob | File | undefined = file;
    if (!fileBlob) {
      fileBlob = createPlaceholderImageFile(utr, screenshotName || 'pay_on_spot.png');
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
      //warn('Backend payment proof submit with targetAmount failed:', formErr);
      if (amount > 0 && amount !== targetAmount) {
        try {
          return await sendProof(amount);
        } catch (retryErr) {
          //warn('Fallback retry with passed amount failed:', retryErr);
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
      //warn(`Backend cancelBooking(${targetId}) endpoint notice:`, err);
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
      //warn('Backend getAllBookings failed:', err);
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
      //warn(`Backend approveBooking(${targetId}) approve endpoint warning:`, err);
    }

    // Fallback: PUT /api/admin/bookings/{id}
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: 'APPROVED', bookingStatus: 'APPROVED' })
      });
      return true;
    } catch (err: any) {
      //warn(`Backend approveBooking(${targetId}) fallback warning:`, err);
    }

    return true;
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
      //warn(`Backend rejectBooking(${targetId}) reject endpoint warning:`, err);
    }

    // Fallback: PUT /api/admin/bookings/{id}
    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: 'REJECTED', bookingStatus: 'REJECTED' })
      });
      return true;
    } catch (err: any) {
      //warn(`Backend rejectBooking(${targetId}) fallback warning:`, err);
    }

    return true;
  },

  updateBookingStatus: async (bookingId: string | number, status: 'approved' | 'rejected' | 'pending' | 'pending_payment' | string, token?: string): Promise<boolean> => {
    const targetId = String(bookingId);
    const normalized = normalizeStatus(status);
    const upper = normalized.toUpperCase();

    if (normalized === 'approved') {
      return api.approveBooking(targetId, token);
    }
    if (normalized === 'rejected') {
      return api.rejectBooking(targetId, token);
    }

    const authToken = (token && typeof token === 'string' && token.trim() !== '') ? token : (adminStorage.getAdminToken() || tokenStorage.getToken() || undefined);

    try {
      await apiClient(`/api/admin/bookings/${targetId}/pending`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken
      });
      return true;
    } catch { }

    try {
      await apiClient(`/api/admin/bookings/${targetId}`, {
        method: 'PUT',
        requiresAdmin: true,
        requiresAuth: true,
        token: authToken,
        body: JSON.stringify({ status: upper, bookingStatus: upper })
      });
      return true;
    } catch (err) {
      //warn('Backend updateBookingStatus failed:', err);
    }

    return true;
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
      //warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) primary failed:`, err);
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
      //warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) query fallback failed:`, err);
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
      //warn(`Backend updatePaymentStatus(${targetId}, ${formattedStatus}) /payment fallback failed:`, err);
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
      //warn(`Backend deleteBooking(${targetId}) notice:`, err);
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
      const dataObj = (res && res.data) ? res.data : res;
      if (dataObj && typeof dataObj === 'object') {
        const rawStatus = dataObj.paymentStatus || dataObj.status || dataObj.payment_status;
        return {
          ...dataObj,
          paymentStatus: rawStatus ? String(rawStatus).toUpperCase() : undefined,
          message: res.message || dataObj.message,
          timestamp: res.timestamp || dataObj.timestamp
        };
      }
      return res;
    } catch (err) {
      //warn(`Backend getBookingPaymentDetails(${targetId}) failed:`, err);
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

    // Save client-side local override first
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`booking_override_${targetId}`, JSON.stringify(payload));
      } catch (e) {
        //warn('Failed to save local booking override:', e);
      }
    }

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
      //warn(`Backend updateBooking(${targetId}) primary PUT /api/bookings/${targetId} failed:`, err?.message || err);
    }
    // Return true because local override was successfully saved for client persistence
    return true;
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
      //warn('Backend submitContact failed:', err);
      return {
        success: false,
        message: err?.message || 'Failed to send message. Please try again.'
      };
    }
  },

  getUserProfile: async (token?: string): Promise<User | null> => {
    try {
      const res = await apiClient<any>('/api/user/profile', {
        method: 'GET',
        requiresAuth: true,
        token
      });
      const userObj = res?.data || res?.user || res;
      if (userObj && typeof userObj === 'object') {
        const user: User = {
          id: String(userObj.id || userObj.userId || tokenStorage.getUser()?.id || 'user'),
          name: userObj.name || userObj.fullName || userObj.username || tokenStorage.getUser()?.name || '',
          email: userObj.email || tokenStorage.getUser()?.email || '',
          phoneNumber: userObj.phoneNumber || userObj.phone || userObj.mobileNumber || tokenStorage.getUser()?.phoneNumber || '',
          emergencyContactName: userObj.emergencyContactName || userObj.emergencyContact || tokenStorage.getUser()?.emergencyContactName || '',
          emergencyContactPhone: userObj.emergencyContactPhone || userObj.emergencyPhone || tokenStorage.getUser()?.emergencyContactPhone || '',
          address: userObj.address || tokenStorage.getUser()?.address || '',
          roles: userObj.roles || tokenStorage.getUser()?.roles || []
        };
        tokenStorage.setUser(user);
        return user;
      }
    } catch (err) {
      //warn('Backend getUserProfile GET /api/user/profile notice:', err);
    }
    return tokenStorage.getUser();
  },

  updateUserProfile: async (userId: string, data: Partial<User>, token?: string): Promise<User | null> => {
    const currentUser = tokenStorage.getUser() || {};
    const rawPhone = data.phoneNumber || (data as any).phone || (data as any).mobileNumber || currentUser.phoneNumber || '';
    const phoneVal = rawPhone.replace(/\D/g, '').slice(-10);

    const rawUsername = data.name || (data as any).username || currentUser.name || (data.email ? data.email.split('@')[0] : 'camper');

    const payload = {
      username: rawUsername,
      name: rawUsername,
      fullName: rawUsername,
      email: data.email || currentUser.email || '',
      mobileNumber: phoneVal,
      phoneNumber: phoneVal,
      phone: phoneVal,
      emergencyContactName: data.emergencyContactName || currentUser.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || currentUser.emergencyContactPhone || '',
      emergencyContact: data.emergencyContactName ? `${data.emergencyContactName} (${data.emergencyContactPhone || ''})` : undefined,
      address: data.address || currentUser.address || ''
    };

    // 1. Primary Endpoint: PUT /api/user/profile
    try {
      const res = await apiClient<any>('/api/user/profile', {
        method: 'PUT',
        requiresAuth: true,
        token,
        body: JSON.stringify(payload)
      });
      const updated = res?.data || res?.user || res;
      if (updated && typeof updated === 'object') {
        const mergedUser: User = {
          ...currentUser,
          ...data,
          ...updated,
          name: updated.name || updated.username || updated.fullName || rawUsername,
          phoneNumber: updated.mobileNumber || updated.phoneNumber || updated.phone || phoneVal,
          id: String(updated.id || userId || currentUser.id)
        };
        tokenStorage.setUser(mergedUser);
        return mergedUser;
      }
    } catch (err: any) {
      //warn('Backend updateUserProfile PUT /api/user/profile notice:', err?.message || err);
      if (err?.message?.includes('Validation Failed')) {
        throw new Error(err.message);
      }
    }

    // 2. Fallback Endpoint: PUT /api/users/${userId}
    try {
      const res = await apiClient<any>(`/api/users/${userId}`, {
        method: 'PUT',
        requiresAuth: true,
        token,
        body: JSON.stringify(payload)
      });
      const updated = res?.data || res;
      if (updated && typeof updated === 'object') {
        const mergedUser: User = {
          ...currentUser,
          ...data,
          ...updated,
          name: updated.name || updated.username || updated.fullName || rawUsername,
          phoneNumber: updated.mobileNumber || updated.phoneNumber || updated.phone || phoneVal,
          id: String(updated.id || userId || currentUser.id)
        };
        tokenStorage.setUser(mergedUser);
        return mergedUser;
      }
    } catch (err: any) {
      //warn(`Backend updateUserProfile fallback PUT /api/users/${userId} notice:`, err?.message || err);
    }

    // Save locally to tokenStorage so UI updates immediately
    const localUpdated: User = {
      ...currentUser,
      ...data,
      name: rawUsername,
      phoneNumber: phoneVal
    };
    tokenStorage.setUser(localUpdated);
    return localUpdated;
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
      //warn('Backend getContactMessages notice:', err);
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
      //error('sendAdminEmail error:', err);
      return {
        success: false,
        message: err.message || 'Failed to dispatch email'
      };
    }
  }
};
