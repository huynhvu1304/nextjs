"use client";
import { API_URL, IMAGE_URL, IMAGE_USER_URL } from "@/lib/api";
import Link from "next/link";
import React, { useEffect, useState, ChangeEvent } from "react";
import { FaEdit, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt, FaBox, FaTicketAlt, FaAddressBook, FaCog, FaHistory, FaHeart } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingPage from "@/components/Loading/Loadingpage";
import Footer from "@/components/Footer/Footer";

// Định nghĩa interface cho UserAddressType
interface UserAddressType {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  useraddress: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Cập nhật interface UserType
interface UserType {
  _id?: string;
  name: string;
  email: string;
  img?: string; 
  phone?: string;
  address?: UserAddressType | null;
  googleId?: string; 
}

// Interface cho Order
interface Order {
  _id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
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
  };
}

// Interface cho UserVoucher
interface UserVoucher {
  _id: string;
  userId: string;
  voucher_id: {
    _id: string;
    code: string;
    discount: number;
    minAmount: number;
    maxDiscount: number;
    startDate: string;
    endDate: string;
    description: string;
    type: string;
  };
  status: string;
  receivedAt: string;
  usedAt?: string;
}

const fieldLabels: Record<string, string> = {
  name: "Họ tên",
  email: "Email",
  password: "Mật khẩu",
  phone: "Số điện thoại",
  address: "Địa chỉ",
};

const Users = () => {
  const [user, setUser] = useState<UserType>({
    name: "",
    email: "",
    img: "",
    phone: "",
    address: null,
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [editValue, setEditValue] = useState<string>("");
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userImgSrc, setUserImgSrc] = useState<string | null>(null);
  
  // Thêm state cho số liệu thống kê
  const [orderCount, setOrderCount] = useState(0);
  const [voucherCount, setVoucherCount] = useState(0);
  
  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser({ name: "", email: "", img: "", phone: "", address: null });
        setUserImgSrc("/img/default.png"); 
        return;
    }

      const res = await fetch(`${API_URL}/users/getUser`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Có thể muốn clear user state nếu token không hợp lệ hoặc user không tồn tại
        setUser({ name: "", email: "", img: "", phone: "", address: null });
        return;
      }

      const data = await res.json();
      // LOGIC MỚI CHO ẢNH ĐẠI DIỆN TẠI ĐÂY
      const userImgUrl = data.img
      ? (data.img.startsWith('http://') || data.img.startsWith('https://'))
      ? data.img
      : `${IMAGE_USER_URL}/${data.img}`
  : "/img/default.png";

      setUser({
        name: data.name || "",
        email: data.email || "",
        img: userImgUrl,
        phone: data.phone || "",
        address: data.address || null,
        googleId: data.googleId || undefined,
      });
      setUserImgSrc(userImgUrl);
    } catch (error) {
      console.error("Lỗi khi fetch user info:", error);
    }
  };

  // lấy số lượng đơn hàng
  const fetchOrderCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrderCount(data.orders?.length || 0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy số đơn hàng:", error);
    }
  };

  // lấy số lượng mã giảm giá
  const fetchVoucherCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/vouchers/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const vouchers = await res.json();
        setVoucherCount(vouchers?.length || 0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy số voucher:", error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchOrderCount();
    fetchVoucherCount();
  }, []);

  const handleEditClick = (field: string) => {
    if (field === "address") return;

    setEditingField(field);
    setShowEditForm(true);
    setAvatarPreview(null);
    setAvatarFile(null);

    if (field === "password") {
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else if (field === "avatar") {
      // Logic riêng cho avatar nếu cần
    } else {
      setEditValue(user[field as keyof UserType]?.toString() || "");
    }
  };


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // bắt lỗi sđt
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    return phoneRegex.test(phone);
  };
  // bắt lỗi tên
  const isValidName = (name: string) => {
    return name.length >= 3 && name.length <= 20;
  };
  // bắt lỗi email
  const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'fpt.edu.vn'];
  const isValidEmail = (email: string) => {

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split('@')[1].toLowerCase();
    return allowedDomains.includes(domain);
  };

  // bắt lỗi mật khẩu
  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editingField) {
      return;
    }

    if (editingField === "password") {
      const { oldPassword, newPassword, confirmPassword } = passwords;
      if (!oldPassword || !newPassword || !confirmPassword) {
        toast.error("Vui lòng điền đầy đủ các trường mật khẩu");
        return;
      }
      if (!isValidPassword(newPassword)) {
        toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch(`${API_URL}/users/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Lỗi khi đổi mật khẩu:", err.message);
          setIsLoading(false);
          toast.error(`Đổi mật khẩu thất bại: ${err.message}`);
          return;
        }

        setShowEditForm(false);
        setIsLoading(false);
        toast.success("Đổi mật khẩu thành công!");
      } catch (error) {
        console.error("Lỗi khi gửi request đổi mật khẩu:", error);
        setIsLoading(false);
        toast.error("Có lỗi xảy ra khi đổi mật khẩu!");
      }
    } else {
      // Xử lý ảnh và các trường text (name, email, phone)
      const formData = new FormData();
      if (editingField === "avatar") {
        if (!avatarFile) {
          toast.error("Vui lòng chọn ảnh để cập nhật");
          return;
        }
        formData.append("img", avatarFile);
      } else {
        const value = editValue.trim();
        if (editingField === "name" && !isValidName(value)) {
          toast.error("Tên người dùng phải từ 3 đến 20 ký tự, không được để trống.");
          return;
        }
        if (editingField === "email" && !isValidEmail(value)) {
          toast.error("Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: example@gmail.com");
          return;
        }
        if (editingField === "phone" && !isValidPhone(value)) {
          toast.error(
            "Số điện thoại không hợp lệ! Phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09."
          );
          return;
        }
        formData.append(editingField, value);
      }

      setIsLoading(true);

      try {
        const res = await fetch(`${API_URL}/users/update`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Lỗi khi cập nhật user:", err.message);
          setIsLoading(false);
          toast.error(`Cập nhật thất bại: ${err.message}`);
          return;
        }

        const data = await res.json(); 
        console.log("Dữ liệu user sau khi cập nhật từ backend:", data);

        // Cập nhật state 'user' trong component với dữ liệu mới nhất từ backend
        // Điều này sẽ bao gồm tên file ảnh đã được đổi tên
        const updatedImgUrl = data.img
            ? (data.img.startsWith('http://') || data.img.startsWith('https://'))
                ? data.img
                : `${IMAGE_USER_URL}/${data.img}`
            : "/img/default.png";

        const updatedUserState = {
          name: data.name || "",
          email: data.email || "",
          img: updatedImgUrl, 
          phone: data.phone || "",
          address: data.address || null,
          googleId: data.googleId || undefined,
        };

        setUser(updatedUserState); // Cập nhật state user chính
        setUserImgSrc(updatedImgUrl); // Cập nhật state ảnh riêng
        localStorage.setItem("user", JSON.stringify(data));
        window.dispatchEvent(new Event("userInfoChanged"));

        setShowEditForm(false);
        setAvatarPreview(null);

        setIsLoading(false);
        toast.success("Cập nhật thành công!");
      } catch (error) {
        console.error("Lỗi khi gửi request cập nhật user:", error);
        setIsLoading(false);
        toast.error("Có lỗi xảy ra khi cập nhật!");
      }
    }
  };

const handleImageError = () => {
  setUserImgSrc("/img/default.png");
};

  return (
    <>
      {/* Hiển thị loading khi đang xử lý */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]">
          <LoadingPage />
        </div>
      )}
      
      <div className="bg-gray-50">
        <div className="container-custom mt-[20px] sm:mt-[50px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - User Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
               {/* Avatar Section */}
               <div className="text-center mb-6">
                 <div className="relative inline-block">
                   <img
                      src={avatarPreview || userImgSrc || "/img/default.png"}
                      alt="User Avatar"
                      className="w-24 h-24 rounded-full border-4 border-[#1a7a00] object-cover"
                      onError={handleImageError}
                    />
                     <button
                      onClick={() => handleEditClick("avatar")}
                      className="absolute bottom-0 right-0 bg-white p-2 rounded-full border-2 border-[#1a7a00] hover:bg-gray-50 transition"
                      aria-label="Chỉnh sửa ảnh đại diện"
                    >
                     <FaEdit className="text-[#1a7a00] text-sm" />
                   </button>
                 </div>
                 <h2 className="text-xl font-bold text-gray-800 mt-4">{user.name || "Chưa cập nhật"}</h2>
                 <p className="text-gray-600 text-sm">{user.email}</p>
               </div>

               {/* User Stats */}
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="text-center p-3 bg-gray-50 rounded-lg">
                   <div className="text-2xl font-bold text-[#1a7a00]">{orderCount}</div>
                   <div className="text-xs text-gray-600">Đơn hàng</div>
                 </div>
                 <div className="text-center p-3 bg-gray-50 rounded-lg">
                   <div className="text-2xl font-bold text-[#1a7a00]">{voucherCount}</div>
                   <div className="text-xs text-gray-600">Voucher</div>
                 </div>
               </div>

               {/* Quick Actions */}
               <div className="space-y-3">
                 <h3 className="font-semibold text-gray-800 mb-3">Truy cập nhanh</h3>
                 <Link href="/orders" className="flex items-center p-3 bg-gradient-to-r from-[#1a7a00] to-[#56c537] text-white rounded-lg transition">
                   <FaBox className="mr-3" />
                   <span>Đơn hàng của tôi</span>
                 </Link>
                 <Link href="/userVoucher" className="flex items-center p-3 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-lg transition">
                   <FaTicketAlt className="mr-3" />
                   <span>Kho voucher</span>
                 </Link>
                 <Link href="/managerAddress" className="flex items-center p-3 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white rounded-lg transition">
                   <FaAddressBook className="mr-3" />
                   <span>Quản lý địa chỉ</span>
                 </Link>
               </div>
             </div>
           </div>

           {/* RIGHT COLUMN - User Information */}
           <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                 <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h2>
                </div>

               <div className="space-y-4">
                 <UserInfoCard 
                   icon={<FaUser className="text-[#1a7a00]" />}
                   label="Họ tên" 
                   value={user.name || "Chưa cập nhật"} 
                   onEdit={() => handleEditClick("name")} 
                 />
                 <UserInfoCard 
                   icon={<FaEnvelope className="text-[#1a7a00]" />}
                   label="Email" 
                   value={user.email || "Chưa cập nhật"} 
                   onEdit={() => handleEditClick("email")} 
                 />
                 <UserInfoCard 
                   icon={<FaShieldAlt className="text-[#1a7a00]" />}
                   label="Mật khẩu" 
                   value="********" 
                   onEdit={() => handleEditClick("password")} 
                 />
                 <UserInfoCard 
                   icon={<FaPhone className="text-[#1a7a00]" />}
                   label="Số điện thoại" 
                   value={user.phone?.trim() || "Chưa cập nhật"} 
                   onEdit={() => handleEditClick("phone")} 
                 />
                 <UserInfoCard 
                   icon={<FaMapMarkerAlt className="text-[#1a7a00]" />}
                   label="Địa chỉ giao hàng" 
                   value={user.address?.useraddress?.trim() || "Chưa cập nhật"} 
                 />
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

       {/* Modal chỉnh sửa */}
       {showEditForm && editingField && (
         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-2">
            <div className="bg-white p-6 rounded-xl w-full max-w-md mx-auto">
             <h3 className="text-lg font-bold mb-4 text-gray-800">Chỉnh sửa {fieldLabels[editingField]}</h3>

             {editingField === "password" ? (
               <>
                 <InputField
                   key="oldPassword"
                   label="Mật khẩu cũ"
                   type="password"
                   name="oldPassword"
                   value={passwords.oldPassword}
                   onChange={handlePasswordChange}
                 />
                 <InputField
                   key="newPassword"
                   label="Mật khẩu mới"
                   type="password"
                   name="newPassword"
                   value={passwords.newPassword}
                   onChange={handlePasswordChange}
                 />
                 <InputField
                   key="confirmPassword"
                   label="Xác nhận mật khẩu"
                   type="password"
                   name="confirmPassword"
                   value={passwords.confirmPassword}
                   onChange={handlePasswordChange}
                 />
                 <Link href="/forgot-password" className="text-[#1a7a00] text-sm hover:underline">
                   Quên mật khẩu?
                 </Link>
               </>
             ) : editingField === "avatar" ? (
               <>
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ảnh đại diện</label>
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleAvatarChange}
                     className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7a00] focus:border-transparent"
                   />
                 </div>
                 {avatarPreview && (
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Xem trước</label>
                     <img
                       src={avatarPreview}
                       alt="Preview"
                       className="w-24 h-24 object-cover rounded-lg border"
                     />
                   </div>
                 )}
               </>
             ) : (
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">{fieldLabels[editingField]}</label>
                 <input
                   type={editingField === "email" ? "email" : "text"}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7a00] focus:border-transparent"
                   value={editValue}
                   onChange={handleInputChange}
                   placeholder={`Nhập ${fieldLabels[editingField].toLowerCase()}`}
                 />
               </div>
             )}

             <div className="flex justify-end gap-3 mt-6">
               <button
                 onClick={() => setShowEditForm(false)}
                 className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium transition"
               >
                 Hủy
               </button>
               <button
                 onClick={handleSave}
                 className="px-4 py-2 rounded-lg bg-[#1a7a00] text-white hover:bg-[#56c537] font-medium transition"
               >
                 Lưu
               </button>
             </div>
           </div>
         </div>
       )}
       
       <ToastContainer
         position="top-right"
         autoClose={3000}
         hideProgressBar={false}
         newestOnTop={false}
         closeOnClick
         rtl={false}
         pauseOnFocusLoss
         draggable
         pauseOnHover
       />
        <Footer />
     </>
   );
 };

 interface UserInfoCardProps {
   icon: React.ReactNode;
   label: string;
   value: string;
   onEdit?: () => void;
 }

 const UserInfoCard: React.FC<UserInfoCardProps> = ({ icon, label, value, onEdit }) => {
   return (
     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
       <div className="flex items-center space-x-3">
         <div className="p-2 bg-white rounded-lg">
           {icon}
         </div>
         <div>
           <div className="font-medium text-gray-800">{label}</div>
           <div className="text-sm text-gray-600">{value}</div>
         </div>
       </div>
       {onEdit && (
         <button 
           onClick={onEdit} 
           className="p-2 text-[#1a7a00] hover:bg-[#1a7a00] hover:text-white rounded-lg transition"
           aria-label={`Chỉnh sửa ${label.toLowerCase()}`}
         >
           <FaEdit />
         </button>
       )}
     </div>
   );
 };

 const InputField = ({
   label,
   type,
   name,
   value,
   onChange,
 }: {
   label: string;
   type: string;
   name: string;
   value: string;
   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
 }) => {
   let autoCompleteValue = "off";

   if (type === "password") {
     if (name === "oldPassword") {
       autoCompleteValue = "current-password";
     } else if (name === "newPassword" || name === "confirmPassword") {
       autoCompleteValue = "new-password";
     }
   }

   return (
     <div className="mb-4">
       <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
       <input
         type={type}
         name={name}
         value={value}
         onChange={onChange}
         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7a00] focus:border-transparent"
         autoComplete={autoCompleteValue}
       />
     </div>
   );
 };

 export default Users;