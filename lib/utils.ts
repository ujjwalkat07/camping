import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAdminUser(user: { roles?: string[]; role?: string } | null | undefined): boolean {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.includes('ROLE_ADMIN') || user.role === 'ROLE_ADMIN';
}
