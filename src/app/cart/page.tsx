"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateQuantity,
  removeFromCart,
  clearCart,
} from "@/redux/slices/cartSlice";
import { RootState } from "@/redux/store";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link"; // Import Link for navigation
import { TrashIcon } from "lucide-react";
import Footer from "@/components/Footer/Footer";
import Loading from "@/components/Loading/Loadingcomponent";
import VoucherSelector from "@/components/VoucherSelector/VoucherSelector";
import { UserVoucher } from "@/types/voucher.interface";
import { API_URL } from "@/lib/api";

// Define necessary types
type CustomerInfo = {
  _id?: string; // Optional: if you associate customer info with a user's selected address
  name: string;
  phone: string;
  address: string; // This holds the actual address string (either from selected or manual input)
  selectedAddressId?: string; // ID of the address selected from saved addresses
};

type UserAddress = {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  useraddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
};
// Define types for address data
type Province = {
  name: string;
  code: number;
};

type District = {
  name: string;
  code: number;
};

type Ward = {
  name: string;
  code: number;
};
type PaymentMethod = "cod" | "bank_transfer" | "vnpay";

export default function CartPage() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalAmount = useSelector((state: RootState) => state.cart.totalAmount);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    selectedAddressId: undefined,
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [bankCode, setBankCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("vn");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [defaultUserAddress, setDefaultUserAddress] =
    useState<UserAddress | null>(null);
  const [allUserAddresses, setAllUserAddresses] = useState<UserAddress[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher  | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
// *** BỔ SUNG STATE MỚI CHO ĐỊA CHỈ ***
const [provinces, setProvinces] = useState<Province[]>([]);
const [districts, setDistricts] = useState<District[]>([]);
const [wards, setWards] = useState<Ward[]>([]);

const [selectedProvince, setSelectedProvince] = useState("");
const [selectedDistrict, setSelectedDistrict] = useState("");
const [selectedWard, setSelectedWard] = useState("");
const [manualInput, setManualInput] = useState(""); // Dùng cho số nhà, tên đường
  const totalPrice = totalAmount;
  const finalPrice = totalPrice - voucherDiscount;
    useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (token) {
      fetchUserAddresses(); 
    } else {
      setIsAddressLoading(false);
    }
  }, []);

  // Thêm useEffect để đảm bảo địa chỉ hiển thị ngay khi có dữ liệu
  useEffect(() => {
    // Nếu có địa chỉ mặc định và thông tin khách hàng, nhưng customer.address rỗng
    // thì tự động cập nhật customer.address và selectedAddressId
    if (defaultUserAddress && customer.name && customer.phone && !customer.address.trim()) {
      setCustomer(prev => ({
        ...prev,
        address: defaultUserAddress.useraddress,
        selectedAddressId: defaultUserAddress._id
      }));
    }
  }, [defaultUserAddress, customer.name, customer.phone, customer.address]);


  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const item = cartItems.find((i) => i._id === itemId);
    if (!item) return;
  
    // Kiểm tra giới hạn flash sale
    const flashSaleQty = getFlashSaleQuantity(item.variantDetails._id);
    if (flashSaleQty !== null && newQuantity > flashSaleQty) {
      toast.warning(`Bạn chỉ có thể mua tối đa ${flashSaleQty} sản phẩm với giá flash sale!`);
      return;
    }
  
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ itemId, quantity: newQuantity }));
  };
 

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
  };

  const handleVoucherSelect = (voucher: UserVoucher  | null, discountAmount: number) => {
    setSelectedVoucher(voucher);
    setVoucherDiscount(discountAmount);
  };

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Refined function to fetch user's addresses (prioritizing isDefault: true)
  const fetchUserAddresses = async () => {
    setIsAddressLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAddressLoading(false);
      return;
    }

    try {
      const allAddressesRes = await fetch(`${API_URL}/users/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allAddressesData: UserAddress[] = await allAddressesRes.json();

      if (!allAddressesRes.ok) {
        setAllUserAddresses([]); // Clear addresses on error
        setDefaultUserAddress(null); // Clear default address
        setCustomer({
          name: "",
          phone: "",
          address: "",
          selectedAddressId: undefined,
        }); // Clear customer info
        setIsAddressLoading(false);
        return;
      }

      setAllUserAddresses(allAddressesData);

      let initialCustomerInfo: CustomerInfo = {
        name: "",
        phone: "",
        address: "",
        selectedAddressId: undefined,
      };
      let foundDefaultAddress: UserAddress | null = null;

      // 1. First, try to find the address explicitly marked as default (isDefault: true)
      foundDefaultAddress =
        allAddressesData.find((addr) => addr.isDefault) || null;

      if (foundDefaultAddress) {
        setDefaultUserAddress(foundDefaultAddress);
        initialCustomerInfo = {
          name: foundDefaultAddress.name,
          phone: foundDefaultAddress.phone,
          address: foundDefaultAddress.useraddress,
          selectedAddressId: foundDefaultAddress._id,
        };
      } else if (allAddressesData.length > 0) {
        // 2. If no explicit default, use the first address in the list
        const firstAddress = allAddressesData[0];
        setDefaultUserAddress(firstAddress); // Set first address as default for display
        initialCustomerInfo = {
          name: firstAddress.name,
          phone: firstAddress.phone,
          address: firstAddress.useraddress,
          selectedAddressId: firstAddress._id,
        };
      } else {
        // 3. If no addresses at all, leave customer info empty
        setDefaultUserAddress(null);
      }

      // Set customer state based on the determined initial address
      setCustomer(initialCustomerInfo);
    } catch (error) {
      console.error("Lỗi khi tải địa chỉ người dùng:", error);
      toast.error("Có lỗi khi tải thông tin địa chỉ.");
      setAllUserAddresses([]);
      setDefaultUserAddress(null);
      setCustomer({
        name: "",
        phone: "",
        address: "",
        selectedAddressId: undefined,
      });
    } finally {
      setIsAddressLoading(false);
    }
  };
  
  const [flashSales, setFlashSales] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await fetch(`${API_URL}/flashsales`);
        if (!res.ok) throw new Error("Không lấy được flash sale");
        const data = await res.json();
        setFlashSales(data.filter((fs: any) => fs.status === "Đang diễn ra"));
      } catch (error) {
        setFlashSales([]);
      }
    };
    fetchFlashSales();
  }, []);




  const handleSelectAddressFromModal = (address: UserAddress | null) => {
    if (address) {
      setCustomer({
        name: address.name,
        phone: address.phone,
        address: address.useraddress,
        selectedAddressId: address._id,
      });
    } else {
      // Option to manually enter new address
      setCustomer((prev) => ({
        ...prev,
        name: "",
        phone: "",
        address: "",
        selectedAddressId: undefined,
      }));
    }
    setIsAddressModalOpen(false);
    setErrors({});
  };
  const getFlashSaleQuantity = (variantId: string) => {
  for (const fs of flashSales) {
    const found = fs.products.find((p: any) => p.variant_id === variantId && p.quantity > 0);
    if (found) return found.quantity;
  }
  return null;
};
  const handleCheckout = async () => {
    const newErrors: Partial<CustomerInfo> = {};
    if (cartItems.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      toast.error("Giỏ hàng đang trống.");
      return;
    }

    if (!customer.name.trim())
      newErrors.name = "Vui lòng nhập họ và tên người nhận.";
    if (!customer.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại người nhận.";
    if (!/^0(3|5|7|8|9)\d{8}$/.test(customer.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ.";
    }

    // Kiểm tra địa chỉ - ưu tiên địa chỉ đã lưu, sau đó mới đến địa chỉ nhập tay
    if (customer.selectedAddressId && customer.address.trim()) {
      // Đã chọn địa chỉ từ danh sách đã lưu
      // Không cần kiểm tra gì thêm
    } else if (defaultUserAddress && customer.name && customer.phone) {
      // Có địa chỉ mặc định và thông tin khách hàng
      // Không cần kiểm tra gì thêm
    } else if (!customer.address.trim()) {
      newErrors.address = "Vui lòng chọn địa chỉ đã lưu hoặc nhập địa chỉ mới.";
    } else if (customer.address.trim().length < 5) {
      newErrors.address = "Địa chỉ chi tiết quá ngắn.";
    }

// *** LOGIC KIỂM TRA ĐỊA CHỈ MỚI ***
// Chỉ kiểm tra khi người dùng chưa chọn địa chỉ đã lưu
if (!customer.selectedAddressId) {
  // Yêu cầu bắt buộc phải chọn đầy đủ 3 cấp hành chính
  if (!selectedProvince) {
    newErrors.address = "Vui lòng chọn Tỉnh/Thành phố.";
  } else if (!selectedDistrict) {
    newErrors.address = "Vui lòng chọn Quận/Huyện.";
  } else if (!selectedWard) {
    newErrors.address = "Vui lòng chọn Phường/Xã.";
  }
  // // Yêu cầu nhập số nhà/tên đường
  // if (!manualInput.trim()) {
  //   // Có thể tùy chỉnh lỗi này
  //   newErrors.address = newErrors.address || "Vui lòng nhập số nhà, tên đường.";
  // }
}
    setErrors(newErrors);
    setErrorMessage(null);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng điền đầy đủ và chính xác thông tin khách hàng.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Bạn cần đăng nhập để đặt hàng.");
      toast.error("Bạn cần đăng nhập để đặt hàng.");
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let finalSelectedAddressId = customer.selectedAddressId;

      if (!finalSelectedAddressId && customer.address.trim()) {
        const newAddressData = {
          name: customer.name,
          phone: customer.phone,
          useraddress: customer.address,
          isDefault: false,
        };
        const newAddressRes = await fetch(`${API_URL}/users/addresses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddressData),
        });
        const newAddressResult = await newAddressRes.json();
        if (!newAddressRes.ok) {
          throw new Error(
            newAddressResult.message || "Không thể lưu địa chỉ mới."
          );
        }
        finalSelectedAddressId = newAddressResult._id;
      }

      if (!finalSelectedAddressId) {
        setErrorMessage("Vui lòng chọn hoặc nhập địa chỉ giao hàng.");
        toast.error("Vui lòng chọn hoặc nhập địa chỉ giao hàng.");
        setLoading(false);
        return;
      }

      const baseOrderData = {
        receiverAddress: customer.address,
        receiverName: customer.name,
        receiverPhone: customer.phone,
        selectedAddressId: finalSelectedAddressId,
        totalAmount: finalPrice,
        paymentMethod,
        voucher_id: selectedVoucher?.voucher_id || null,
        cartItems: cartItems.map((item) => ({
          productVariantId: item.variantDetails._id,
          quantity: item.quantity,
          price:
            item.variantDetails.cost_sale > 0
              ? item.variantDetails.cost_sale
              : item.variantDetails.cost_price,
        })),
      };

      let postBody: any = baseOrderData;

      if (paymentMethod === "vnpay") {
        postBody = {
          ...baseOrderData,
          bankCode: bankCode,
          language: language,
        };
      }

      const res = await fetch(`${API_URL}/orders/postorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postBody),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem("token");
          setErrorMessage(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }
        throw new Error(data.message || "Không thể đặt hàng.");
      }

      const result = await res.json();

      if (paymentMethod === "vnpay") {
        if (result.code === "00" && result.data) {
          toast.success("Đang chuyển hướng đến cổng thanh toán VNPAY...");
          dispatch(clearCart());
          window.location.href = result.data;
        } else {
          setErrorMessage(
            result.message || "Không thể tạo URL thanh toán VNPAY."
          );
          toast.error(result.message || "Không thể tạo URL thanh toán VNPAY.");
        }
      } else {
        // Lưu thông tin voucher và khách hàng trước khi clear cart
        const savedVoucher = selectedVoucher;
        const savedVoucherDiscount = voucherDiscount;
        const savedCustomer = { ...customer };
        
        dispatch(clearCart());
        setSuccessMessage("Đặt hàng thành công!");
        toast.success("Đặt hàng thành công!");
        
        // Khôi phục voucher và thông tin khách hàng
        setSelectedVoucher(savedVoucher);
        setVoucherDiscount(savedVoucherDiscount);
        setCustomer(savedCustomer);
        
        
        await fetchUserAddresses(); // Re-fetch to update states after order
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageLoading(true);
  }, []);
useEffect(() => {
  const fetchProvinces = async () => {
    try {
      const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
      const data = await res.json();
      setProvinces(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
    }
  };
  fetchProvinces();
}, []);
useEffect(() => {
  // Tìm tên của tỉnh, huyện, xã đã chọn
  // Ép kiểu các mảng về `any[]` để truy cập thuộc tính `code` và `name`
  const provinceName = (provinces as any[]).find(p => p.code === parseInt(selectedProvince))?.name || "";
  const districtName = (districts as any[]).find(d => d.code === parseInt(selectedDistrict))?.name || "";
  const wardName = (wards as any[]).find(w => w.code === parseInt(selectedWard))?.name || "";
  
  // Nối các phần lại, chỉ lấy những phần có giá trị
  const addressParts = [manualInput, wardName, districtName, provinceName].filter(part => part);
  const fullAddress = addressParts.join(", ");

  // Cập nhật state customer.address
  setCustomer(prev => ({
    ...prev,
    address: fullAddress,
  }));
}, [manualInput, selectedWard, selectedDistrict, selectedProvince, provinces, districts, wards]);

  if (pageLoading)
    return <Loading duration={2000} onDone={() => setPageLoading(false)} />;

  return (
    <div className="bg-[#F2F2F2]">
      <div className="container-custom  min-h-screen my-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-center mb-6 sm:mb-10 text-gray-900">
          Giỏ hàng & Thanh toán
        </h1>

        {/* Bảng sản phẩm trong giỏ hàng */}
<section className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8 sm:mb-14">
  <h2 className="text-xl sm:text-2xl font-semibold mb-4 border-b border-gray-300 pb-2 text-gray-800">
    Sản phẩm trong giỏ hàng
  </h2>

  {cartItems.length === 0 ? (
    <p className="text-center text-gray-500 py-16 text-base italic">
      Giỏ hàng đang trống.
    </p>
  ) : (
    <>
      {/* Bảng cho màn hình lớn (sm và lớn hơn) */}
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse text-gray-800 text-sm md:text-base">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100">
              <th className="py-2 px-3 text-left w-1/12">Ảnh</th>
              <th className="py-2 px-3 text-left w-5/12">Tên sản phẩm</th>
              <th className="py-2 px-3 text-right w-1/12">Giá</th>
              <th className="py-2 px-3 text-center w-2/12">Số lượng</th>
              <th className="py-2 px-3 text-right w-2/12">Thành tiền</th>
              <th className="py-2 px-3 text-center w-1/12">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => {
              const priceToUse =
                item.variantDetails.cost_sale > 0
                  ? item.variantDetails.cost_sale
                  : item.variantDetails.cost_price;

              return (
                <tr
                  key={item._id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-3">
                    <img
                      src={`${API_URL}/images/${item.variantDetails.image}`}
                      alt={item.productName}
                      className="w-16 h-16 object-contain rounded-lg"
                      loading="lazy"
                    />
                  </td>
                  <td className="py-2 px-3 font-medium">
                    {item.productName} ({item.variantDetails.size} -{" "}
                    {item.variantDetails.color})
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-gray-700">
                    {priceToUse.toLocaleString()} VND
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="inline-flex items-center border rounded-md overflow-hidden select-none bg-gray-100 border-gray-300">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item._id, item.quantity - 1)
                        }
                        className="px-2 py-1 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-10 text-center border-l border-r border-gray-300 py-1 bg-white focus:outline-none"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(
                            item._id,
                            Math.max(1, +e.target.value)
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item._id, item.quantity + 1)
                        }
                        className="px-2 py-1 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-lg text-red-600">
                    {(priceToUse * item.quantity).toLocaleString()} VND
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Layout dạng Card cho màn hình nhỏ (dưới sm) */}
      <div className="sm:hidden space-y-4">
        {cartItems.map((item) => {
          const priceToUse =
            item.variantDetails.cost_sale > 0
              ? item.variantDetails.cost_sale
              : item.variantDetails.cost_price;

          return (
            <div
              key={item._id}
              className="flex items-start border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex-shrink-0 mr-4">
                <img
                  src={`${API_URL}/images/${item.variantDetails.image}`}
                  alt={item.productName}
                  className="w-20 h-20 object-contain rounded-lg shadow-sm"
                  loading="lazy"
                />
              </div>

              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2 pr-2">
                    {item.productName}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  Size: {item.variantDetails.size} | Màu:{" "}
                  {item.variantDetails.color}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  Giá:{" "}
                  <span className="font-medium">
                    {priceToUse.toLocaleString()} VND
                  </span>
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center border rounded-md overflow-hidden select-none bg-gray-100 border-gray-300">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item._id, item.quantity - 1)
                      }
                      className="px-2 py-1 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="w-10 text-center border-l border-r border-gray-300 py-1 bg-white focus:outline-none text-sm font-medium"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(
                          item._id,
                          Math.max(1, +e.target.value)
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item._id, item.quantity + 1)
                      }
                      className="px-2 py-1 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-base text-red-600">
                    {(priceToUse * item.quantity).toLocaleString()} VND
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</section>

        {/* Thanh toán và Đơn hàng */}
        <section className="bg-white rounded-xl shadow-md p-3 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-12 lg:gap-16">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckout();
            }}
            className="flex flex-col md:flex-row gap-6 sm:gap-12 lg:gap-16 w-full"
            noValidate
          >
            {/* Form thông tin khách hàng */}
            <div className="md:w-2/3">
              <h2 className="text-xl sm:text-3xl font-semibold mb-4 sm:mb-7 border-b border-gray-300 pb-2 sm:pb-4 text-gray-800">
                Thông tin khách hàng
              </h2>

              {successMessage && (
                <div
                  className="mb-5 text-green-700 bg-green-100 border border-green-300 rounded px-4 py-3 font-medium"
                  role="alert"
                  aria-live="polite"
                >
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div
                  className="mb-5 text-red-700 bg-red-100 border border-red-300 rounded px-4 py-3 font-medium"
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              )}

              <div className="space-y-6">
                {/* Họ và tên */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    disabled={!!customer.selectedAddressId}
                    className={`w-full border rounded-md px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } ${
                      !!customer.selectedAddressId
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    placeholder="Nguyễn Văn A"
                    required
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-red-600 text-sm">{errors.name}</p>
                  )}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block mb-2 font-semibold text-gray-700"
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    disabled={!!customer.selectedAddressId}
                    className={`w-full border rounded-md px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } ${
                      !!customer.selectedAddressId
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    placeholder="09xxxxxxxx"
                    required
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-red-600 text-sm">{errors.phone}</p>
                  )}
                </div>

             {/* Địa chỉ nhận hàng */}
<div>
  <label
    htmlFor="address"
    className="block mb-2 font-semibold text-gray-700"
  >
    Địa chỉ nhận hàng
  </label>
  {isAddressLoading ? (
    <p className="text-gray-500 italic">Đang tải địa chỉ...</p>
  ) : (
    <>
      {/* Hiển thị địa chỉ đã chọn/mặc định */}
      {(customer.selectedAddressId && customer.address) || (defaultUserAddress && customer.name && customer.phone) ? (
        <div className="p-4 border rounded-md bg-green-50 flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-gray-800">
              {customer.name} ({customer.phone})
            </p>
            <p className="text-gray-700 text-sm">
              {customer.address || (defaultUserAddress ? defaultUserAddress.useraddress : "")}
            </p>
            {/* Nhãn "Mặc định" chỉ hiển thị nếu địa chỉ này khớp với defaultUserAddress */}
            {defaultUserAddress &&
              (customer.selectedAddressId === defaultUserAddress._id || (!customer.selectedAddressId && defaultUserAddress)) && (
                <span className="mt-2 inline-block px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-sm">
                  Mặc định
                </span>
              )}
          </div>
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="text-green-600 hover:underline font-medium text-sm ml-4 flex-shrink-0"
          >
            Thay đổi
          </button>
        </div>
      ) : (
        // Nếu chưa có địa chỉ nào được chọn (tức là cần nhập mới)
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Select Tỉnh/Thành phố */}
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
              <select
                id="province"
                value={selectedProvince}
                onChange={async (e) => {
                  const code = e.target.value;
                  setSelectedProvince(code);
                  setSelectedDistrict("");
                  setSelectedWard("");
                  if (code) {
                    const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
                    const data = await res.json();
                    setDistricts(data.districts);
                  } else {
                    setDistricts([]);
                    setWards([]);
                  }
                }}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 transition ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                required
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map((p: any) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Quận/Huyện */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-600 mb-1">Quận/Huyện</label>
              <select
                id="district"
                value={selectedDistrict}
                onChange={async (e) => {
                  const code = e.target.value;
                  setSelectedDistrict(code);
                  setSelectedWard("");
                  if (code) {
                    const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
                    const data = await res.json();
                    setWards(data.wards);
                  } else {
                    setWards([]);
                  }
                }}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 transition ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                disabled={!selectedProvince}
                required
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map((d: any) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Phường/Xã */}
            <div>
              <label htmlFor="ward" className="block text-sm font-medium text-gray-600 mb-1">Phường/Xã</label>
              <select
                id="ward"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 transition ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                disabled={!selectedDistrict}
                required
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map((w: any) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Textarea để nhập số nhà, tên đường */}
          <textarea
            id="manualAddress"
            name="manualAddress"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className={`w-full border rounded-md px-4 py-3 mt-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition resize-none ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
            placeholder="Ví dụ: Số 123, đường ABC, hẻm 1665..."
            rows={2}
          />

          <div className="text-center py-4 border rounded-md bg-gray-50 mt-3">
              <p className="text-gray-500 italic mb-2">
                Hoặc chọn từ danh sách đã lưu.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info("Bạn cần đăng nhập để chọn địa chỉ đã lưu.");
                    return;
                  }
                  setIsAddressModalOpen(true);
                }}
                className="text-green-600 hover:underline font-medium"
              >
                Chọn từ địa chỉ đã lưu
              </button>
            </div>
        </>
      )}
      {errors.address && (
        <p className="mt-1 text-red-600 text-sm">
          {errors.address}
        </p>
      )}
    </>
  )}
</div>
              </div>
            </div>

            {/* Thông tin đơn hàng bên phải */}
            <aside className="md:w-1/3 bg-blue-50 rounded-lg p-3 sm:p-6 shadow-inner mt-8 md:mt-0">
              <h2 className="text-xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b border-gray-300 pb-2 sm:pb-3">
                Đơn hàng
              </h2>

              <ul className="space-y-2 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-auto text-xs sm:text-base">
                {cartItems.map((item) => {
                  const {
                    _id,
                    productName,
                    quantity,
                    variantDetails: {
                      cost_sale,
                      cost_price,
                      size,
                      color,
                      image,
                    },
                  } = item;

                  const priceToUse = cost_sale > 0 ? cost_sale : cost_price;
                  return (
                    <li
                      key={_id}
                      className="flex justify-between items-center text-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`${API_URL}/images/${image}`}
                          alt={productName}
                          className="w-10 h-10 object-contain rounded"
                        />
                        <span>
                          {productName} ({size} - {color}){" "}
                          <span className="font-semibold">x{quantity}</span>
                        </span>
                      </div>
                      <span className="font-semibold">
                        {(priceToUse * quantity).toLocaleString()} VND
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Voucher Section */}
              {isAuthenticated && (
                <div className="mt-6 border-t border-gray-300 pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Mã giảm giá</h3>
                  <VoucherSelector
                    totalAmount={totalPrice}
                    onVoucherSelect={handleVoucherSelect}
                    selectedVoucher={selectedVoucher}
                  />
                </div>
              )}

              <div className="mt-6 sm:mt-8 border-t border-gray-300 pt-4 sm:pt-5 text-gray-800">
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Tổng tiền hàng:</span>
                    <span>{totalPrice.toLocaleString()} VND</span>
                  </div>
                )}
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>Giảm giá voucher:</span>
                    <span>-{voucherDiscount.toLocaleString()} VND</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base sm:text-xl border-t border-gray-300 pt-3 sm:pt-4 text-green-600">
                  <span>Tổng cộng:</span>
                  <span>{finalPrice.toLocaleString()} VND</span>
                </div>
              </div>

              {/* Chọn phương thức thanh toán */}
              <fieldset className="mt-8">
                <legend className="mb-3 font-semibold text-gray-700">
                  Phương thức thanh toán
                </legend>
                <div className="flex flex-col gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-gray-300 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="form-radio h-5 w-5 text-green-500"
                      required
                    />
                    <img
                      className="w-8 h-8 object-contain"
                      src="/img/cod.png"
                      alt="VNPAY Logo"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Thanh toán khi nhận hàng(COD)
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-gray-300 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === "vnpay"}
                      onChange={() => setPaymentMethod("vnpay")}
                      className="form-radio h-5 w-5 text-purple-500"
                      required
                    />
                    <img
                      className="w-8 h-8 object-contain"
                      src="/img/vnpay-logo.jpg"
                      alt="VNPAY Logo"
                    />
                    <span className="text-sm font-medium text-gray-800">Thanh toán VNPAY</span>
                  </label>
                </div>
              </fieldset>

              {/* HIỂN THỊ KHI paymentMethod LÀ VNPAY */}
              {paymentMethod === "vnpay" && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Tùy chọn VNPAY
                  </h3>
                  <div className="mb-4">
                    <label
                      htmlFor="bankCode"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Chọn Ngân hàng (Tùy chọn):
                    </label>
                    <select
                      id="bankCode"
                      name="bankCode"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Để trống để chọn trên cổng VNPAY</option>
                      <option value="NCB">Ngân hàng NCB</option>
                      <option value="VIETCOMBANK">Vietcombank</option>
                      <option value="AGRIBANK">Agribank</option>
                      {/* Thêm các ngân hàng khác nếu bạn muốn liệt kê */}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Nếu bạn không chọn ngân hàng, VNPAY sẽ hiển thị danh sách
                      để bạn lựa chọn.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="language"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Ngôn ngữ hiển thị VNPAY:
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="vn">Tiếng Việt</option>
                      <option value="en">Tiếng Anh</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className={`w-full mt-10 py-4 rounded-lg text-white font-bold text-xl transition-all duration-300 ease-in-out
                            ${
                              loading || cartItems.length === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105"
                            }`}
              >
                                 {loading
                   ? "Đang xử lý..."
                   : `Thanh toán ${finalPrice.toLocaleString()} VND`}
              </button>
            </aside>
          </form>
        </section>

        {/* Address Selection Modal */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                Chọn Địa chỉ Giao hàng
              </h2>

              {/* Close modal button */}
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-bold"
                aria-label="Đóng modal"
              >
                &times;
              </button>

              {allUserAddresses.length === 0 && !isAddressLoading ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Bạn chưa có địa chỉ nào được lưu.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressModalOpen(false); // Close modal
                      handleSelectAddressFromModal(null); // Set to manual input mode
                    }}
                    className="inline-block bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Tiếp tục thanh toán để lưu địa chỉ
                  </button>
                  <p className="mt-4 text-sm text-gray-500">
                    Hoặc bạn có thể{" "}
                    <Link
                      href="/managerAddress"
                      className="text-green-600 font-semibold hover:underline"
                    >
                      thêm địa chỉ tại đây
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
              {allUserAddresses.length < 3 && (
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 
                                        ${
                                          !customer.selectedAddressId
                                            ? "border-green-500 bg-green-50 ring-2 ring-green-300"
                                            : "border-gray-200 bg-white hover:shadow-md"
                                        }`}
                    onClick={() => handleSelectAddressFromModal(null)}
                  >
                    <h3 className="font-semibold text-lg text-gray-900 flex items-center">
                      Nhập địa chỉ mới
                      {!customer.selectedAddressId && (
                        <svg
                          className="h-6 w-6 text-green-500 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Điền thông tin địa chỉ thủ công.
                    </p>
                  </div>
              )}
                  {/* List of saved addresses */}
                  {allUserAddresses.map((address) => (
                    <div
                      key={address._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 
                                            ${
                                              customer.selectedAddressId ===
                                              address._id
                                                ? "border-green-500 bg-green-50 ring-2 ring-green-300" // Currently selected
                                                : "border-gray-200 bg-white hover:shadow-md" // Normal saved address
                                            }`}
                      onClick={() => handleSelectAddressFromModal(address)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 flex items-center">
                          {address.name} {/* Nhãn "Mặc định" trong modal */}
                          {address.isDefault && (
                            <span className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                              Mặc định
                            </span>
                          )}
                        </h3>
                        {customer.selectedAddressId === address._id && (
                          <svg
                            className="h-6 w-6 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-700 mb-1">SĐT: {address.phone}</p>
                      <p className="text-gray-600 text-sm">
                        {address.useraddress}
                      </p>
                    </div>
                  ))}
                </div>
              )}



              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
      <Footer />
    </div>
  );
}
