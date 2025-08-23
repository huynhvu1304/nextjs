export interface Voucher {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  quantity: number;
  used: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isDeleted: boolean;
  isSpinWheelVoucher: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserVoucher {
  _id: string;
  user_id: string;
  voucher_id: string; // ID của voucher gốc
  received_at: string;
  usedAt?: string;
  status: 'received' | 'used' | 'expired' | 'cancelled';
  
  // Các trường voucher từ snapshot (được trả về trực tiếp từ backend)
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  startDate: string;
  endDate: string;
  isSpinWheelVoucher: boolean;
}

export interface VoucherValidationResult {
  isValid: boolean;
  message: string;
  voucher?: Voucher;
  discountAmount?: number;
  finalAmount?: number;
} 