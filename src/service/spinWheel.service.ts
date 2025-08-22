import { API_URL } from "@/lib/api";
import { toast } from "react-toastify";
export interface SpinEligibilityResponse {
  canSpin: boolean;
  message: string;
  remainingHours?: number;
  remainingTime?: number; // Thời gian còn lại tính bằng giây
  noVouchers?: boolean;
}

export interface SpinResult {
  message: string;
   spinResult: string;
  voucher: {
    _id: string;
    code: string;
    description: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    minOrderValue: number;
    maxDiscountValue: number;
    endDate: string;
    quantity: number;
    used: number;
    remaining: number;
  };
}

export interface SpinHistoryItem {
  _id: string;
  userId: string;
  voucherId: {
    _id: string;
    code: string;
    description: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    minOrderValue: number;
    maxDiscountValue?: number;
    endDate: string;
  };
  spinDate: string;
  isActive: boolean;
}

export interface SpinWheelVoucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  quantity: number;
  used: number;
  remaining: number;
    spinWheelType: 'fixed' | 'percent';
    isNoPrize: boolean;
}

export interface SpinWheelVouchersResponse {
  vouchers: SpinWheelVoucher[];
  hasVouchers: boolean;
  message: string;
}
const redirectToLogin = () => {
  localStorage.removeItem('token');
  toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
  window.location.href = "/login";
};
export class SpinWheelService {
  // Kiểm tra quyền quay
static async checkEligibility(): Promise<SpinEligibilityResponse> {
  try {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/spin-wheel/check-eligibility`, {
      method: "GET",
      headers,
    });

    if (response.status === 401) {
      redirectToLogin();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking spin eligibility:", error);
    throw error;
  }
}
  // Thực hiện quay
  static async spinWheel(): Promise<SpinResult> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      redirectToLogin();
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${API_URL}/spin-wheel/spin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      redirectToLogin();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to spin wheel");
    }

    return await response.json();
  } catch (error) {
    console.error("Error spinning wheel:", error);
    throw error;
  }
}

  // Lấy lịch sử quay
  static async getSpinHistory(): Promise<{ spinHistory: SpinHistoryItem[] }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/spin-wheel/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting spin history:', error);
      throw error;
    }
  }

  // Lấy danh sách voucher cho vòng quay
  static async getSpinWheelVouchers(): Promise<SpinWheelVouchersResponse> {
    try {
      const response = await fetch(`${API_URL}/spin-wheel/vouchers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting spin wheel vouchers:', error);
      throw error;
    }
  }
} 