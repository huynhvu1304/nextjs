"use client";

import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingPage from "../../components/Loading/Loadingpage";
import Link from "next/link";
import { 
  FaArrowLeft, 
  FaGift, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaCopy, 
  FaRedo,
  FaFire,
  FaRocket,
  FaStar,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { VoucherService } from "@/service/voucher.service";
import { UserVoucher, Voucher } from "@/types/voucher.interface";
import VoucherCard from "@/components/voucherUser/VoucherCard";

const UserVoucherPage = () => {
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'received' | 'used' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 9;


  // Fetch user vouchers
  const fetchUserVouchers = async (isRefresh = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem voucher");
        setIsLoading(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      }

      const vouchers = await VoucherService.getUserVouchers(token);
      setUserVouchers(vouchers);
      
      if (isRefresh) {
        toast.success("Đã làm mới danh sách voucher");
      }
    } catch (error) {
      console.error("Lỗi khi lấy voucher:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách voucher");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserVouchers();
  }, []);

  // Kiểm tra voucher có hết hạn không
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Lọc voucher theo trạng thái
  const filteredVouchers = userVouchers.filter(voucher => {
    if (!voucher) {
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'expired') {
      return isExpired(voucher.endDate);
    }
    return voucher.status === filter;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);
  const startIndex = (currentPage - 1) * vouchersPerPage;
  const endIndex = startIndex + vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi filter
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Tính số ngày còn lại của voucher
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format số tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy icon và màu sắc theo trạng thái
  const getStatusInfo = (status: string, endDate: string) => {
    // Kiểm tra hết hạn trước
    if (isExpired(endDate)) {
      return {
        icon: <FaTimesCircle className="text-red-500" />,
        text: "Hết hạn",
        color: "text-red-500",
        bgColor: "bg-red-50"
      };
    }

    switch (status) {
      case 'received':
        return {
          icon: <FaGift className="text-green-500" />,
          text: "Có thể sử dụng",
          color: "text-green-500",
          bgColor: "bg-green-50"
        };
      case 'used':
        return {
          icon: <FaCheckCircle className="text-blue-500" />,
          text: "Đã sử dụng",
          color: "text-blue-500",
          bgColor: "bg-blue-50"
        };
      case 'expired':
        return {
          icon: <FaTimesCircle className="text-red-500" />,
          text: "Hết hạn",
          color: "text-red-500",
          bgColor: "bg-red-50"
        };
      case 'cancelled':
        return {
          icon: <FaTimesCircle className="text-gray-500" />,
          text: "Đã hủy",
          color: "text-gray-500",
          bgColor: "bg-gray-50"
        };
      default:
        return {
          icon: <FaClock className="text-yellow-500" />,
          text: "Không xác định",
          color: "text-yellow-500",
          bgColor: "bg-yellow-50"
        };
    }
  };

  // Đếm số lượng voucher theo trạng thái
  const getVoucherCount = (status: string) => {
    return userVouchers.filter(voucher => {
      if (!voucher) {
        return false;
      }
      
      if (status === 'expired') {
        return isExpired(voucher.endDate);
      }
      return voucher.status === status;
    }).length;
  };

  // Component phân trang
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        {/* Nút Previous */}
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <FaChevronLeft className="w-3 h-3" />
          Trước
        </button>

        {/* Số trang */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-green-700 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Nút Next */}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Sau
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const filterOptions = [
    {
      key: 'all' as const,
      label: 'Tất cả',
      icon: <FaStar className="w-4 h-4" />,
      count: userVouchers.length,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      key: 'received' as const,
      label: 'Có thể sử dụng',
      icon: <FaFire className="w-4 h-4" />,
      count: getVoucherCount('received'),
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      key: 'used' as const,
      label: 'Đã sử dụng',
      icon: <FaCheckCircle className="w-4 h-4" />,
      count: getVoucherCount('used'),
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      key: 'expired' as const,
      label: 'Hết hạn',
      icon: <FaTimesCircle className="w-4 h-4" />,
      count: getVoucherCount('expired'),
      gradient: 'from-red-500 to-orange-500',
      bgGradient: 'from-red-50 to-orange-50'
    }
  ];

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="container-custom mt-[20px] sm:mt-[100px] px-4 sm:px-6 lg:px-8">
      {/* Header with enhanced styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link 
            href="/user" 
            className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105"
            aria-label="Quay lại trang người dùng"
          >
            <FaArrowLeft className="text-lg sm:text-xl text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Kho Voucher
            </h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý voucher của bạn</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button
             onClick={() => fetchUserVouchers(true)}
             disabled={isLoading || isRefreshing}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
             aria-label="Làm mới danh sách voucher"
           >
            
            <FaRedo className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-medium">Làm mới</span>
            <span className="sm:hidden font-medium">Mới</span>
          </button>
        </div>
      </div>

      {/* Thẻ bộ lọc */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-2xl border border-green-200 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{getVoucherCount('received')}</div>
              <div className="text-sm text-green-700 font-medium">Có thể sử dụng</div>
            </div>
            <FaFire className="text-2xl text-green-500" />
          </div>
        </div>
                 <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-2xl border border-blue-200 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{getVoucherCount('used')}</div>
              <div className="text-sm text-blue-700 font-medium">Đã sử dụng</div>
            </div>
            <FaCheckCircle className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-100 p-4 rounded-2xl border border-red-200 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">{getVoucherCount('expired')}</div>
              <div className="text-sm text-red-700 font-medium">Hết hạn</div>
            </div>
            <FaTimesCircle className="text-2xl text-red-500" />
          </div>
        </div>
                 <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-2xl border border-purple-200 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">{userVouchers.length}</div>
              <div className="text-sm text-purple-700 font-medium">Tổng cộng</div>
            </div>
            <FaStar className="text-2xl text-purple-500" />
          </div>
        </div>
      </div>



      {/* Bộ lọc mobile */}
      <div className="md:hidden mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
                             className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                 filter === option.key
                   ? `bg-gradient-to-r ${option.gradient} text-white`
                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
               }`}
            >
              {option.icon}
              <span>{option.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                filter === option.key ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Filter Pills */}
      <div className="hidden md:flex gap-3 mb-6">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
                         className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
               filter === option.key
                 ? `bg-gradient-to-r ${option.gradient} text-white`
                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
             }`}
            aria-label={`Lọc theo ${option.label}`}
          >
            {option.icon}
            <span>{option.label}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              filter === option.key ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Hiển thị <strong>{currentVouchers.length}</strong> trong tổng số <strong>{filteredVouchers.length}</strong> voucher
            {filter !== 'all' && ` trong danh mục "${filterOptions.find(f => f.key === filter)?.label}"`}
            {totalPages > 1 && ` (Trang ${currentPage}/${totalPages})`}
          </span>
        </div>
      </div>

      {/* Danh sách voucher */}
      {currentVouchers.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 max-w-md mx-auto">
            <FaGift className="text-6xl sm:text-8xl text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-600 mb-3">
              {filter === 'all' ? 'Bạn chưa có voucher nào' : 'Không có voucher nào'}
            </h3>
            <p className="text-gray-500 px-4 leading-relaxed">
              {filter === 'all' 
                ? 'Hãy tham gia các chương trình khuyến mãi để nhận voucher nhé!' 
                : 'Không có voucher nào trong danh mục này'
              }
            </p>
            {/* {filter === 'all' && (
              //   <button className="mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
              //    Khám phá voucher mới
              //  </button>
            )} */}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentVouchers.map((userVoucher) => (
            <VoucherCard
              key={userVoucher._id}
              userVoucher={userVoucher}
            />
          ))}
        </div>
      )}

      {/* Phân trang */}
      <Pagination />
      <ToastContainer />
    </div>
  );
};

export default UserVoucherPage; 