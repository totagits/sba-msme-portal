import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = new Date(date);
  if (format === 'datetime') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (format === 'long') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '…';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'status-draft', SUBMITTED: 'status-submitted', UNDER_REVIEW: 'status-review',
    VERIFIED: 'status-verified', APPROVED: 'status-approved', REJECTED: 'status-rejected',
    RETURNED_FOR_CORRECTION: 'status-returned', ARCHIVED: 'status-archived',
    ACTIVE: 'status-approved', SUSPENDED: 'status-rejected', LOCKED: 'status-rejected', PENDING: 'status-submitted',
  };
  return map[status] || 'status-draft';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
    RETURNED_FOR_CORRECTION: 'Needs Correction', VERIFIED: 'Verified', APPROVED: 'Approved',
    REJECTED: 'Rejected', ARCHIVED: 'Archived',
    ACTIVE: 'Active', SUSPENDED: 'Suspended', LOCKED: 'Locked', PENDING: 'Pending',
  };
  return map[status] || status;
}

export function getMSMECategoryColor(category: string): string {
  return category === 'MICRO' ? 'chip-gray' : category === 'SMALL' ? 'chip-blue' : 'chip-purple';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
