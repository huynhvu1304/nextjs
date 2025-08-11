"use client";

import React, { useState, useEffect } from 'react';
import { UserVoucher, Voucher } from '@/types/voucher.interface';
import { VoucherService } from '@/service/voucher.service';
import { toast } from 'react-toastify';

interface VoucherSelectorProps {
  totalAmount: number;
  onVoucherSelect: (voucher: any | null, discountAmount: number) => void;
  selectedVoucher: any | null;
}

const VoucherSelector: React.FC<VoucherSelectorProps> = ({
  totalAmount,
  onVoucherSelect,
  selectedVoucher
}) => {
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUserVouchers();
  }, []);

  const fetchUserVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const vouchers = await VoucherService.getUserVouchers(token);
      setUserVouchers(vouchers);
    } catch (error) {
      console.error('Error fetching user vouchers:', error);
      toast.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherSelect = (userVoucher: UserVoucher) => {
    if (userVoucher.status !== 'received') {
      toast.warning('Voucher này đã được sử dụng hoặc hết hạn');
      return;
    }

    // Sử dụng dữ liệu trực tiếp từ userVoucher
    const voucher = userVoucher;
    
    // Kiểm tra voucher có tồn tại không
    if (!voucher) {
      toast.error('Voucher không hợp lệ');
      return;
    }
    
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    if (now < startDate || now > endDate) {
      toast.warning('Voucher không trong thời gian hiệu lực');
      return;
    }

    if (totalAmount < voucher.minOrderValue) {
      toast.warning(`Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderValue.toLocaleString()} VND`);
      return;
    }

    // Tính toán giảm giá
    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = (totalAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscountValue && discountAmount > voucher.maxDiscountValue) {
        discountAmount = voucher.maxDiscountValue;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    onVoucherSelect(voucher, discountAmount);
    setIsModalOpen(false);
    toast.success('Đã áp dụng voucher thành công!');
  };

  const handleRemoveVoucher = () => {
    onVoucherSelect(null, 0);
    toast.info('Đã xóa voucher');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getVoucherStatus = (userVoucher: UserVoucher) => {
    // Sử dụng dữ liệu trực tiếp từ userVoucher
    const voucher = userVoucher;
    
    // Kiểm tra voucher có tồn tại không
    if (!voucher) {
      return 'Không hợp lệ';
    }
    
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    if (userVoucher.status === 'used') return 'Đã sử dụng';
    if (now < startDate) return 'Chưa hiệu lực';
    if (now > endDate) return 'Hết hạn';
    if (totalAmount < voucher.minOrderValue) return 'Chưa đủ điều kiện';
    return 'Có thể sử dụng';
  };

  const getVoucherStatusColor = (userVoucher: UserVoucher) => {
    const status = getVoucherStatus(userVoucher);
    switch (status) {
      case 'Có thể sử dụng': return 'text-green-600';
      case 'Đã sử dụng': return 'text-gray-500';
      case 'Hết hạn': return 'text-red-600';
      case 'Chưa hiệu lực': return 'text-yellow-600';
      case 'Chưa đủ điều kiện': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const availableVouchers = userVouchers.filter(uv => 
    uv.status === 'received' && 
    uv && // Kiểm tra voucher có tồn tại không
    new Date() >= new Date(uv.startDate) &&
    new Date() <= new Date(uv.endDate) &&
    totalAmount >= uv.minOrderValue
  );

  return (
    <div className="mb-6">
      {/* Voucher Selection Button */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Chọn voucher
        </button>
      </div>

      {/* Selected Voucher Display */}
      {selectedVoucher && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-green-800">Voucher đã áp dụng</h4>
              <p className="text-sm text-green-600">
                {selectedVoucher.code} - {selectedVoucher.description}
              </p>
              <p className="text-sm text-green-600">
                Giảm {selectedVoucher.discountType === 'percent' 
                  ? `${selectedVoucher.discountValue}%` 
                  : `${selectedVoucher.discountValue.toLocaleString()} VND`}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRemoveVoucher();
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Xóa
            </button>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden mt-[80px]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Chọn Voucher</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Đang tải voucher...</p>
                </div>
              ) : userVouchers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Bạn chưa có voucher nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userVouchers.map((userVoucher) => {
                    // Sử dụng dữ liệu trực tiếp từ userVoucher
                    const voucher = userVoucher;
                    
                    // Bỏ qua voucher không hợp lệ
                    if (!voucher) {
                      return null;
                    }
                    
                    const status = getVoucherStatus(userVoucher);
                    const statusColor = getVoucherStatusColor(userVoucher);
                    const isAvailable = status === 'Có thể sử dụng';

                    return (
                      <div
                        key={userVoucher._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          isAvailable 
                            ? 'border-green-200 hover:border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (isAvailable) {
                            handleVoucherSelect(userVoucher);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-lg">{voucher.code}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor} bg-white`}>
                                {status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                            Giảm: {voucher.discountType === 'percent' 
  ? `${voucher.discountValue ?? 0}%` 
  : `${(voucher.discountValue ?? 0).toLocaleString()} VND`}

                                {voucher.maxDiscountValue && voucher.discountType === 'percent' && (
                                  <span className="text-xs"> (Tối đa {voucher.maxDiscountValue.toLocaleString()} VND)</span>
                                )}
                              </p>
                              <p>Đơn hàng tối thiểu: {voucher.minOrderValue.toLocaleString()} VND</p>
                              <p>Hiệu lực: {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}</p>
                            </div>
                          </div>
                          {isAvailable && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVoucherSelect(userVoucher);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Chọn
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherSelector; 