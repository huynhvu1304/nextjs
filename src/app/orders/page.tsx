"use client";
import { API_URL, IMAGE_URL, IMAGE_USER_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { FaBoxOpen, FaSearch, FaSort, FaFilter, FaCalendarAlt, FaMoneyBillWave, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify"; 
import Swal from "sweetalert2"; 
import { useRouter } from "next/navigation";


interface Order {
  [x: string]: any;
  _id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  voucher_id?: {
    _id: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxDiscountValue?: number;
    minOrderValue: number;
    description?: string;
  } | null;
  items: {
    productId: string | null;
    productName: string;
    variant: {
      size: string;
      color: string;
      image: string;
    };
    quantity: number;
    price: number;
  }[];
  payment: {
    method: string;
    status: string;
    amount: number;
  };
  cancelReason?: string;       
  cancelReasonText?: string;   
}

const CANCEL_REASONS = [
  { value: "changed_mind", label: "Tôi không muốn mua nữa" },
  { value: "ordered_wrong", label: "Tôi đặt nhầm sản phẩm/size/số lượng" },
  { value: "found_cheaper", label: "Tôi tìm được sản phẩm giá rẻ hơn" },
  { value: "other", label: "Lý do khác" }
];

const OrdersPage = () => {
  const router = useRouter();

  // State lưu danh sách đơn hàng
  const [orders, setOrders] = useState<Order[]>([]);

  // Lưu id đơn hàng đang được mở rộng chi tiết
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cờ xác định đã render phía client chưa (do date format cần chạy phía client)
  const [isClient, setIsClient] = useState(false);

  // Trang hiện tại (pagination)
  const [currentPage, setCurrentPage] = useState(1);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Số lượng đơn mỗi trang
  const ordersPerPage = 5;

  // State cho việc hủy đơn hàng
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("changed_mind");
  const [cancelReasonText, setCancelReasonText] = useState("");

  // Gán isClient = true sau khi component render phía client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Gọi API để lấy danh sách đơn hàng khi component được mount
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token"); 

      const res = await fetch(`${API_URL}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

      // Nếu token hết hạn
      if (res.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login"; 
        return;
      }

      const data = await res.json(); 
      setOrders(data.orders); 
    };

    fetchOrders();
  }, []);

  // Toggle mở rộng / thu gọn đơn hàng
  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Hàm dịch trạng thái đơn hàng
  const translateStatus = (status: string) => {
    if (status === "pending") return "Đang chờ xác nhận";
    if (status === "confirmed") return "Đã xác nhận";
    if (status === "shipping") return "Đang giao hàng";
    if (status === "delivered") return "Đã giao";
    if (status === "cancelled") return "Đã hủy";
    return status;
  };

  // Hàm dịch phương thức thanh toán
  const translatePaymentMethod = (method: string) => {
    if (method === "vnpay") return "VNPAY";
    if (method === "cod") return "Thanh toán khi nhận hàng";
    return "Không xác định";
  };

  // Hàm dịch trạng thái thanh toán
  const translatePaymentStatus = (status: string) => {
    if (status === "paid") return "Đã thanh toán";
    if (status === "unpaid") return "Chưa thanh toán";
    return "Không xác định";
  };

  // Hàm mở popup
  const openCancelPopup = (orderId: string) => {
    setCancelOrderId(orderId);
    setCancelReason("changed_mind");
    setCancelReasonText("");
    setShowCancelPopup(true);
  };

  // Hàm đóng popup
  const closeCancelPopup = () => {
    setShowCancelPopup(false);
    setCancelOrderId(null);
    setCancelReason("changed_mind");
    setCancelReasonText("");
  };

  // Hàm xác nhận hủy đơn
  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/orders/cancel/${cancelOrderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cancelReason,
          cancelReasonText: cancelReason === "other" ? cancelReasonText : ""
        })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === cancelOrderId
              ? { ...o, status: "cancelled", cancelReason, cancelReasonText }
              : o
          )
        );
        closeCancelPopup();
        toast.success("Đơn hàng đã được hủy thành công!", { autoClose: 2500 });
      } else {
        toast.error("Hủy đơn thất bại.");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi hủy đơn hàng.");
    }
  };

  // Lọc đơn hàng theo nhiều tiêu chí
  const filteredOrders = orders.filter((order) => {
    // Lọc theo trạng thái
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    
    // Lọc theo phương thức thanh toán
    if (paymentFilter !== "all" && order.payment?.method !== paymentFilter) return false;
    
    // Lọc theo ngày
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          if (orderDate < today) return false;
          break;
        case "yesterday":
          if (orderDate < yesterday || orderDate >= today) return false;
          break;
        case "lastWeek":
          if (orderDate < lastWeek) return false;
          break;
        case "lastMonth":
          if (orderDate < lastMonth) return false;
          break;
      }
    }
    

    
    return true;
  });

  // Sắp xếp đơn hàng
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "highest":
        return b.totalAmount - a.totalAmount;
      case "lowest":
        return a.totalAmount - b.totalAmount;
      default:
        return 0;
    }
  });

  // Phân trang
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  const handleViewProductDetail = (productId: string) => {
    router.push(`/detail/${productId}`); 
  };

  // Reset tất cả bộ lọc
  const resetFilters = () => {
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getCancelReasonLabel = (reason: string) => {
    switch (reason) {
      case "changed_mind":
        return "Tôi không muốn mua nữa";
      case "ordered_wrong":
        return "Tôi đặt nhầm sản phẩm/size/số lượng";
      case "found_cheaper":
        return "Tôi tìm được sản phẩm giá rẻ hơn";
      case "other":
        return "Lý do khác";
      default:
        return "";
    }
  };

  const handleRepurchase = (productId: string) => {
    router.push(`/detail/${productId}`); 
  };

  return (
    <div className="container-custom mt-[20px] sm:mt-[100px]">
      <div className="flex items-center gap-3 mb-[30px]">
        <Link 
          href="/user" 
          className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105"
          aria-label="Quay lại trang người dùng"
        >
          <FaArrowLeft className="text-lg sm:text-xl text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Lịch sử đơn hàng
          </h1>
          {/* <p className="text-sm text-gray-500 mt-1">Lịch đơn hàng</p> */}
        </div>
      </div>
      <div className="w-full">
        {/* Tiêu đề */}
        <h1 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold mb-4 sm:mb-6 bg-[#0A9300] px-2 sm:px-4 py-2 sm:py-3 shadow text-white rounded">
          <FaBoxOpen className="text-white text-2xl sm:text-3xl" />
          Đơn hàng của tôi
        </h1>

        {/* Bộ lọc nâng cao */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-[#0A9300]" />
            <h3 className="font-semibold text-gray-800">Bộ lọc và tìm kiếm</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Lọc theo trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9300] focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="shipping">Đang giao hàng</option>
                <option value="delivered">Đã giao</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Lọc theo phương thức thanh toán */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán</label>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9300] focus:border-transparent"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="vnpay">VNPAY</option>
                <option value="cod">Thanh toán khi nhận hàng</option>
              </select>
            </div>

            {/* Lọc theo thời gian */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9300] focus:border-transparent"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="lastWeek">Tuần này</option>
                <option value="lastMonth">Tháng này</option>
              </select>
            </div>
          </div>

          {/* Sắp xếp và thống kê */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaSort className="text-[#0A9300]" />
                <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A9300] focus:border-transparent"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="highest">Giá cao nhất</option>
                  <option value="lowest">Giá thấp nhất</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <strong className="text-green-600">{sortedOrders.length}</strong> trong tổng số <strong className="text-green-600">{orders.length}</strong> đơn hàng
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>

        {sortedOrders.length === 0 ? (
        <div className="text-center py-8 sm:py-10 text-gray-600">
          <FaBoxOpen className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-lg font-medium mb-2">Chưa có đơn hàng nào</p>
          <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
        </div>
      ) : (
        <>
          {/* Danh sách đơn hàng */}
          {currentOrders.map((order) => {
            const isExpanded = order._id === expandedOrderId;
            return (
           <div
              key={order._id}
              className="mb-6 border-2 border-[#0A9300]/30 rounded-2xl overflow-hidden transition bg-white"
            >
              {/* Thông tin chính của đơn */}
              <div
                className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-[#e8ffe8] to-[#f8fff8] px-2 md:px-4 py-2 md:py-4 gap-2 w-full h-50 md:h-32"
              >
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  {isClient && (
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      {/* <FaCalendarAlt className="text-[#0A9300]" /> */}
                      Ngày đặt:{" "}
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")} -{" "}
                        {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  )}
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                    {/* <FaMoneyBillWave className="text-[#0A9300]" /> */}
                    Thanh toán:{" "}
                    <span className="capitalize font-medium">
                      {translatePaymentMethod(order.payment?.method)}
                    </span>{" "}
                    <span>-</span>{" "}
                    <span
                      className={
                        order.payment?.status === "paid"
                          ? "text-green-600 font-semibold"
                          : "text-red-500 font-semibold"
                      }
                    >
                      {translatePaymentStatus(order.payment?.status)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-auto w-full md:w-auto mt-1 md:mt-0">
                  <p className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-600">Trạng thái:</span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      order.status === "cancelled"
                        ? "text-red-600"
                        : order.status === "delivered"
                        ? "text-[#0A9300]"
                        : "text-yellow-600"
                    }`}>
                      {translateStatus(order.status)}
                    </span>
                  </p>
                  <div className="text-sm sm:text-base text-red-600 font-bold">
                    {order.totalAmount.toLocaleString("vi-VN")} ₫
                  </div>
                  {order.status === "pending" && (
                    <button
                      onClick={() => openCancelPopup(order._id)}
                      className="mt-2 text-xs sm:text-sm text-white bg-red-600 border border-red-600 px-3 md:px-4 py-1 rounded-full hover:bg-white hover:text-red-600 transition font-semibold shadow"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(order._id)}
                  className="text-[#0A9300] hover:text-black mt-2 md:mt-0 ml-2 p-1.5 md:p-2 rounded-full border border-[#0A9300]/20 bg-white shadow transition"
                  title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                >
                  <i
                    className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-lg`}
                  ></i>
                </button>
              </div>

                    {/* Chi tiết sản phẩm trong đơn - Sử dụng AnimatePresence và motion.div */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, scaleY: 0 }}
                          animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                          exit={{ opacity: 0, height: 0, scaleY: 0 }}
                          transition={{
                            duration: 0.2, 
                            ease: [0.4, 0, 0.2, 1], 
                          }}
                          style={{ originY: 0 }} 
                          className="bg-white px-4 py-3 border-t"
                        >
                          {/* Thông tin người nhận và voucher */}
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Thông tin người nhận */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                  <i className="fa-solid fa-user text-[#0A9300]"></i>
                                  Thông tin người nhận
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Tên:</span> {order.receiverName || 'Chưa cập nhật'}</p>
                                  <p><span className="font-medium">SĐT:</span> {order.receiverPhone || 'Chưa cập nhật'}</p>
                                  <p><span className="font-medium">Địa chỉ:</span> {order.receiverAddress || 'Chưa cập nhật'}</p>
                                </div>
                              </div>

                              {/* Thông tin voucher */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                  <i className="fa-solid fa-ticket text-[#0A9300]"></i>
                                  Voucher áp dụng
                                </h4>
                                {order.voucher_id ? (
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">Giảm giá:</span>
                                      <span className="text-red-600 ml-1 font-semibold">
                                        {order.voucher_id.discountType === 'percent'
                                          ? `${order.voucher_id.discountValue}%`
                                          : `${order.voucher_id.discountValue.toLocaleString('vi-VN')} ₫`}
                                      </span>
                                    </p>
                                    {order.voucher_id.description && (
                                      <p><span className="font-medium">Mô tả:</span> {order.voucher_id.description}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">Không áp dụng voucher</p>
                                )}
                              </div>

                              {/* Lý do hủy đơn hàng */}
                              <div>
                                {order.status === "cancelled" && (
                                  (order.cancelReasonText && order.cancelReasonText.trim()) ? (
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-ban text-red-600"></i>
                                        Lý do hủy đơn
                                      </h4>
                                      <div className="text-sm text-red-600 bg-red-50 rounded p-2 border border-red-100">
                                        {order.cancelReasonText}
                                      </div>
                                    </div>
                                  ) : (
                                    order.cancelReason && getCancelReasonLabel(order.cancelReason) && (
                                      <div>
                                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                          <i className="fa-solid fa-ban text-red-600"></i>
                                          Lý do hủy đơn
                                        </h4>
                                        <div className="text-sm text-red-600 bg-red-50 rounded p-2 border border-red-100">
                                          {getCancelReasonLabel(order.cancelReason)}
                                        </div>
                                      </div>
                                    )
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Danh sách sản phẩm */}
                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <i className="fa-solid fa-box text-[#0A9300]"></i>
                              Chi tiết sản phẩm
                            </h4>
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4 py-4 first:border-t-0 transition rounded-xl"
                              >
                                <img
                                  src={`${IMAGE_URL}/${item.variant.image}`}
                                  alt={item.productName}
                                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-contain border shadow"
                                />
                                <div className="flex-1">
                                  <h3 className="text-sm sm:text-base font-semibold text-[#0A9300]">{item.productName}</h3>
                                  <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Size: <span className="font-medium">{item.variant.size}</span> | Màu: <span className="font-medium">{item.variant.color}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Số lượng: <span className="font-semibold">{item.quantity}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end min-w-[100px]">
                                  <div className="text-sm sm:text-base text-red-600 font-bold">
                                    {item.price.toLocaleString("vi-VN")} ₫
                                  </div>
                                  {/* Đơn đã giao: hiện cả Đánh giá và Mua lại */}
                                  {order.status === "delivered" && item.productId && (
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        onClick={() => handleViewProductDetail(item.productId!)}
                                        className="text-xs sm:text-sm bg-white text-green-600 border-2 border-green-600 px-3 py-1 rounded hover:bg-green-600 hover:text-white transition font-semibold"
                                      >
                                        Đánh giá
                                      </button>
                                      <button
                                        onClick={() => handleRepurchase(item.productId!)}
                                        className="text-xs sm:text-sm bg-white text-red-600 border-2 border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition font-semibold"
                                      >
                                        Mua lại
                                      </button>
                                    </div>
                                  )}
                                  {/* Đơn đã hủy: chỉ hiện Mua lại */}
                                  {order.status === "cancelled" && item.productId && (
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        onClick={() => handleRepurchase(item.productId!)}
                                        className="text-xs sm:text-sm bg-white text-red-600 border-2 border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition font-semibold"
                                      >
                                        Mua lại
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`mx-0.5 sm:mx-1 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm ${
                      page === currentPage
                        ? "bg-[#0A9300] text-white font-semibold"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Popup xác nhận hủy đơn hàng */}
      {showCancelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90vw] max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={closeCancelPopup}
              aria-label="Đóng"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 className="text-lg font-bold mb-4 text-[#0A9300]">Chọn lý do hủy đơn</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                confirmCancelOrder();
              }}
            >
              <div className="space-y-2 mb-3">
                {CANCEL_REASONS.map(r => (
                  <label key={r.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={r.value}
                      checked={cancelReason === r.value}
                      onChange={() => setCancelReason(r.value)}
                      className="accent-[#0A9300]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              {cancelReason === "other" && (
                <textarea
                  className="w-full border rounded p-2 mb-3"
                  rows={3}
                  placeholder="Nhập lý do khác..."
                  value={cancelReasonText}
                  onChange={e => setCancelReasonText(e.target.value)}
                  required
                />
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                  disabled={cancelReason === "other" && !cancelReasonText.trim()}
                >
                  Xác nhận hủy đơn
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                  onClick={closeCancelPopup}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;