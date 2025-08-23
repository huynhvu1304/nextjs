"use client";

import React from 'react';
import { UserVoucher, Voucher } from '@/types/voucher.interface';
import { FaGift, FaClock, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaPercent, FaMoneyBillWave } from "react-icons/fa";
import Link from 'next/link';

interface VoucherCardProps {
  userVoucher: UserVoucher;
}

const VoucherCard: React.FC<VoucherCardProps> = ({ userVoucher }) => {
  // Sử dụng dữ liệu trực tiếp từ userVoucher thay vì từ voucher_id
  const voucher = userVoucher;
  
  if (!voucher) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="text-center text-gray-500 text-sm">
          Voucher không hợp lệ
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (status: string, endDate: string) => {
    if (status === 'used') {
      return {
        icon: <FaCheckCircle className="text-white" />,
        text: '',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        mainColor: 'text-blue-700',
        discountBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        discountColor: 'text-white',
        accentColor: 'bg-blue-500',
        ticketColor: 'bg-blue-500'
      };
    }
    
    if (status === 'expired' || isExpired(endDate)) {
      return {
        icon: <FaTimesCircle className="text-red-500" />,
        text: 'Hết hạn',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        mainColor: 'text-red-700',
        discountBg: 'bg-gradient-to-r from-red-500 to-red-600',
        discountColor: 'text-white',
        accentColor: 'bg-red-500',
        ticketColor: 'bg-red-500'
      };
    }

    const daysRemaining = getDaysRemaining(endDate);
    if (daysRemaining <= 7) {
      return {
        icon: <FaClock className="text-red-500" />,
        text: `Còn ${daysRemaining} ngày`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        mainColor: 'text-orange-700',
        discountBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
        discountColor: 'text-white',
        accentColor: 'bg-orange-500',
        ticketColor: 'bg-orange-500'
      };
    }

    return {
      icon: <FaGift className="text-green-500" />,
      text: 'Có thể sử dụng',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      mainColor: 'text-green-700',
      discountBg: 'bg-gradient-to-r from-green-500 to-green-600',
      discountColor: 'text-white',
      accentColor: 'bg-green-500',
      ticketColor: 'bg-green-500'
    };
  };

  const statusInfo = getStatusInfo(userVoucher.status, voucher.endDate);
  const isAvailable = userVoucher.status === 'received' && !isExpired(voucher.endDate);

  return (
    <div className={`relative bg-white border-2 ${statusInfo.borderColor} rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${!isAvailable ? 'opacity-75' : ''}`}>
      <div className="flex">
        <div className={`${statusInfo.discountBg} w-2/5 p-3 relative flex flex-col justify-center items-center`}>
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className={`text-xl font-bold ${statusInfo.discountColor}`}>
                {voucher.discountType === 'percent' 
                  ? voucher.discountValue
                  : new Intl.NumberFormat('vi-VN').format(voucher.discountValue)
                }
              </span>
              {voucher.discountType === 'percent' ? (
                <FaPercent className="text-sm text-white" />
              ) : (
                <span className="text-xs text-white">₫</span>
              )}
            </div>
            {voucher.discountType === 'percent' && voucher.maxDiscountValue && (
              <div className="text-xs text-white opacity-90">
                Tối đa {new Intl.NumberFormat('vi-VN').format(voucher.maxDiscountValue)} ₫
              </div>
            )}
            {voucher.discountType !== 'percent' && (
              <div className="text-xs text-white opacity-90">
                Giảm trực tiếp
              </div>
            )}
          </div>
        </div>

        <div className="w-3/5 p-3">
          <div className="mb-2">
            <p className="text-xs text-gray-800 font-medium leading-tight line-clamp-2">
              {voucher.description || 'Không có mô tả'}
            </p>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FaMoneyBillWave className="text-gray-400 flex-shrink-0 text-xs" />
              <span>
                Tối thiểu: <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue)} ₫</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FaCalendarAlt className="text-gray-400 flex-shrink-0 text-xs" />
              <span>
                Hiệu lực: <span className="font-semibold">{formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}</span>
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            {/* Phần hiển thị trạng thái "Còn x ngày", "Đã sử dụng", "Hết hạn" */}
            <div className="flex items-center gap-1">
                {statusInfo.icon}
                <span className={`text-xs font-medium ${statusInfo.color}`}> 
                {statusInfo.text}
                </span>
            </div>
            {/* Nút "Sử dụng ngay" hoặc trạng thái không thể sử dụng */}
            <div>
                {isAvailable ? (
                    <Link
                        href="/cart"
                        className={`inline-block ${statusInfo.accentColor} text-white py-1 px-3 rounded-full hover:opacity-90 transition-all duration-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
                    >
                        Sử dụng ngay
                    </Link>
                ) : (
                    <div className={`inline-block py-1 px-3 rounded-full ${statusInfo.bgColor} ${statusInfo.color} font-medium text-xs border border-gray-200`}>
                        {userVoucher.status === 'used' ? 'Đã sử dụng' : 'Hết hạn'}
                    </div>
                )}
            </div>
          </div>  
        </div>
      </div>

      <div className="absolute left-2/5 top-0 bottom-0 w-0.5 flex flex-col justify-center">
        <div className="w-full h-0.5 bg-white rounded-full opacity-20"></div>
      </div>
      <div className="absolute left-2/5 top-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-20"></div>
      <div className="absolute left-2/5 top-1/2 w-0.5 h-0.5 bg-white rounded-full opacity-20"></div>
      <div className="absolute left-2/5 top-3/4 w-0.5 h-0.5 bg-white rounded-full opacity-20"></div>

      <div className={`h-0.5 ${statusInfo.ticketColor}`}></div>
    </div>
  );
};

export default VoucherCard; 