import { Voucher, UserVoucher, VoucherValidationResult } from '@/types/voucher.interface';

import { API_URL } from "@/lib/api";

export class VoucherService {
  // Lấy danh sách voucher của user
  static async getUserVouchers(token: string): Promise<UserVoucher[]> {
    try {
      const response = await fetch(`${API_URL}/vouchers/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user vouchers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user vouchers:', error);
      throw error;
    }
  }

  // Kiểm tra và validate voucher
  static async validateVoucher(code: string, totalAmount: number, token: string): Promise<VoucherValidationResult> {
    try {
      const response = await fetch(`${API_URL}/vouchers/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          isValid: false,
          message: errorData.message || 'Voucher không hợp lệ',
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating voucher:', error);
      return {
        isValid: false,
        message: 'Có lỗi xảy ra khi kiểm tra voucher',
      };
    }
  }

  // Lấy tất cả voucher (cho admin)
  static async getAllVouchers(token: string): Promise<Voucher[]> {
    try {
      const response = await fetch(`${API_URL}/vouchers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vouchers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      throw error;
    }
  }

  // Tạo voucher mới (cho admin)
  static async createVoucher(voucherData: Partial<Voucher>, token: string): Promise<Voucher> {
    try {
      const response = await fetch(`${API_URL}/vouchers/createVoucher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create voucher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }
  }

  // Cập nhật voucher (cho admin)
  static async updateVoucher(id: string, voucherData: Partial<Voucher>, token: string): Promise<Voucher> {
    try {
      const response = await fetch(`${API_URL}/vouchers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update voucher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating voucher:', error);
      throw error;
    }
  }

  // Soft delete/restore voucher (cho admin)
  static async toggleDeleteVoucher(id: string, token: string): Promise<{ message: string; voucher: Voucher }> {
    try {
      const response = await fetch(`${API_URL}/vouchers/${id}/toggle-delete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle voucher delete status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling voucher delete status:', error);
      throw error;
    }
  }
} 