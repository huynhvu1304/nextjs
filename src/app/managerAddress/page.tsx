"use client";
import { API_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModal from "@/components/ConfirmationModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading/Loadingcomponent";
import { FaArrowLeft, FaPlus, FaMapMarkerAlt, FaUser, FaPhone, FaTrash, FaEdit } from "react-icons/fa";

// Định nghĩa interface cho UserAddress
type UserAddress = {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  useraddress: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Định nghĩa trạng thái form
type AddressFormState = {
  name: string;
  phone: string;
  useraddress: string;
  setDefault: boolean;
};

// Định nghĩa interface cho các đơn vị hành chính
interface Province {
  code: number;
  name: string;
  codename: string;
}
interface District {
  code: number;
  name: string;
  codename: string;
}
interface Ward {
  code: number;
  name: string;
  codename: string;
}

// Hàm validateAddress - Giờ đây chỉ cần validate địa chỉ chi tiết
const validateAddress = (address: string): string | null => {
  const trimmed = address.trim();
  if (trimmed.length < 3 || trimmed.length > 100) {
    return "Địa chỉ chi tiết phải có từ 3 đến 100 ký tự.";
  }
  if (!/[a-zA-Z0-9À-ỹà-ỹ]/.test(trimmed)) {
    return "Địa chỉ chi tiết phải chứa ít nhất một ký tự chữ hoặc số.";
  }
  return null;
};

export default function AddressManagementPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<UserAddress | null>(null);

  // Thêm các state mới cho dropdown
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [streetAddress, setStreetAddress] = useState<string>("");

  const [formData, setFormData] = useState<AddressFormState>({
    name: "",
    phone: "",
    useraddress: "",
    setDefault: false,
  });

  const [formErrors, setFormErrors] = useState<Partial<AddressFormState>>({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  // Lấy danh sách Tỉnh/Thành phố
  const fetchProvinces = async () => {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/`);
      const data: Province[] = await res.json();
      setProvinces(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
      toast.error("Không thể tải danh sách tỉnh/thành phố.");
    }
  };

  // Cập nhật: Hàm này sẽ trả về dữ liệu để sử dụng ngay lập tức
  const fetchDistricts = async (provinceCode: number) => {
    setDistricts([]);
    setWards([]);
    setSelectedDistrict(null);
    setSelectedWard(null);
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data: { districts: District[] } = await res.json();
      setDistricts(data.districts);
      return data.districts; // Trả về dữ liệu
    } catch (error) {
      console.error("Lỗi khi tải danh sách quận/huyện:", error);
      toast.error("Không thể tải danh sách quận/huyện.");
      return [];
    }
  };

  // Cập nhật: Hàm này sẽ trả về dữ liệu để sử dụng ngay lập tức
  const fetchWards = async (districtCode: number) => {
    setWards([]);
    setSelectedWard(null);
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data: { wards: Ward[] } = await res.json();
      setWards(data.wards);
      return data.wards; // Trả về dữ liệu
    } catch (error) {
      console.error("Lỗi khi tải danh sách phường/xã:", error);
      toast.error("Không thể tải danh sách phường/xã.");
      return [];
    }
  };

  const fetchAddresses = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn cần đăng nhập để quản lý địa chỉ.");
      setLoading(false);
      return;
    }
    try {
      const allAddressesRes = await fetch(`${API_URL}/users/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allAddressesData = await allAddressesRes.json();
      if (allAddressesRes.ok) {
        setAddresses(allAddressesData);
      } else {
        throw new Error(
          allAddressesData.message || "Không thể tải danh sách địa chỉ."
        );
      }
      const defaultAddressRes = await fetch(
        `${API_URL}/users/addresses/default`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const defaultAddressData = await defaultAddressRes.json();
      if (defaultAddressRes.ok && defaultAddressData && defaultAddressData._id) {
        setDefaultAddressId(defaultAddressData._id);
      } else {
        setDefaultAddressId(null);
      }
    } catch (error: any) {
      console.error("Lỗi khi tải địa chỉ:", error);
      if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error(error.message || "Không thể tải danh sách địa chỉ.");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: AddressFormState) => {
    const errors: Partial<AddressFormState> = {};
    if (!data.name.trim()) errors.name = "Tên người nhận không được để trống.";
    const phoneTrimmed = data.phone.trim();
    if (!phoneTrimmed) {
      errors.phone = "Số điện thoại không được để trống.";
    } else if (!/^0(3|5|7|8|9)\d{8}$/.test(phoneTrimmed)) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }
    const addressError = validateAddress(streetAddress);
    if (addressError) {
      errors.useraddress = addressError;
    }
    // Thêm kiểm tra cho dropdown
    if (!selectedProvince) errors.useraddress = "Vui lòng chọn Tỉnh/Thành phố.";
    if (!selectedDistrict) errors.useraddress = "Vui lòng chọn Quận/Huyện.";
    if (!selectedWard) errors.useraddress = "Vui lòng chọn Phường/Xã.";
    return errors;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Cập nhật hàm xử lý khi chọn dropdown
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const province = provinces.find((p) => p.code === code);
    setSelectedProvince(province || null);
    if (province) {
      fetchDistricts(province.code);
    }
    setFormErrors((prev) => ({ ...prev, useraddress: "" }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const district = districts.find((d) => d.code === code);
    setSelectedDistrict(district || null);
    if (district) {
      fetchWards(district.code);
    }
    setFormErrors((prev) => ({ ...prev, useraddress: "" }));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const ward = wards.find((w) => w.code === code);
    setSelectedWard(ward || null);
    setFormErrors((prev) => ({ ...prev, useraddress: "" }));
  };

  const handleStreetAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStreetAddress(e.target.value);
    setFormErrors((prev) => ({ ...prev, useraddress: "" }));
  };

  const handleAddOrUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    // Nối chuỗi địa chỉ
    const fullAddress = `${streetAddress.trim()}, ${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`;
    const errors = validateForm({ ...formData, useraddress: fullAddress });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Vui lòng kiểm tra lại thông tin địa chỉ.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn cần đăng nhập để thực hiện hành động này.");
      return;
    }
    if (!isEditing && addresses.length >= 3) {
      toast.error("Bạn chỉ có thể lưu tối đa 3 địa chỉ.");
      closeForm();
      return;
    }

    try {
      let res;
      if (isEditing && currentAddress) {
        res = await fetch(`${API_URL}/users/addresses/${currentAddress._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            useraddress: fullAddress, // Sử dụng chuỗi địa chỉ đã nối
          }),
        });
      } else {
        res = await fetch(`${API_URL}/users/addresses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...formData, useraddress: fullAddress }), // Sử dụng chuỗi địa chỉ đã nối
        });
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }

      if (!isEditing && formData.setDefault) {
        await handleSetDefaultAddress(data._id);
      } else if (
        isEditing &&
        formData.setDefault &&
        defaultAddressId !== currentAddress?._id
      ) {
        await handleSetDefaultAddress(currentAddress!._id);
      }
      await fetchAddresses();
      toast.success(
        isEditing
          ? "Địa chỉ đã được cập nhật thành công!"
          : "Địa chỉ đã được thêm thành công!"
      );
      closeForm();
    } catch (error: any) {
      console.error("Lỗi khi thêm/cập nhật địa chỉ:", error);
      if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    }
  };

  const confirmDelete = (addressId: string) => {
    setAddressToDeleteId(addressId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (addressToDeleteId) {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn cần đăng nhập để thực hiện hành động này.");
        setShowConfirmModal(false);
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/users/addresses/${addressToDeleteId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
          throw new Error(data.message || "Không thể xóa địa chỉ.");
        }
        toast.success("Địa chỉ đã được xóa thành công!");
        await fetchAddresses();
      } catch (error: any) {
        console.error("Lỗi khi xóa địa chỉ:", error);
        if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
        }
      } finally {
        setShowConfirmModal(false);
        setAddressToDeleteId(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setAddressToDeleteId(null);
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn cần đăng nhập để thực hiện hành động này.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/addresses/set-default`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addressId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        throw new Error(data.message || "Không thể đặt địa chỉ mặc định.");
      }
      toast.success("Địa chỉ mặc định đã được cập nhật!");
      setDefaultAddressId(addressId);
      await fetchAddresses();
    } catch (error: any) {
      console.error("Lỗi khi đặt địa chỉ mặc định:", error);
      if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
    setIsEditing(false);
    setCurrentAddress(null);
    setFormData({ name: "", phone: "", useraddress: "", setDefault: false });
    setFormErrors({});
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setStreetAddress("");
  };

  const openEditForm = async (address: UserAddress) => {
    setIsFormOpen(true);
    setIsEditing(true);
    setCurrentAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      useraddress: address.useraddress,
      setDefault: address._id === defaultAddressId,
    });
    setFormErrors({});
  
    // Logic mới: Phân tích chuỗi địa chỉ để điền vào dropdown
    const addressParts = address.useraddress.split(",").map(part => part.trim()).filter(part => part);
    
    if (addressParts.length >= 3) {
      const provinceName = addressParts[addressParts.length - 1];
      const districtName = addressParts[addressParts.length - 2];
      const wardName = addressParts[addressParts.length - 3];
      const street = addressParts.slice(0, addressParts.length - 3).join(", ");
      setStreetAddress(street);
  
      const foundProvince = provinces.find(p => p.name === provinceName);
      if (foundProvince) {
        setSelectedProvince(foundProvince);
        const fetchedDistricts = await fetchDistricts(foundProvince.code);
        const foundDistrict = fetchedDistricts.find(d => d.name === districtName);
        
        if (foundDistrict) {
          setSelectedDistrict(foundDistrict);
          const fetchedWards = await fetchWards(foundDistrict.code);
          const foundWard = fetchedWards.find(w => w.name === wardName);
          
          if (foundWard) {
            setSelectedWard(foundWard);
          } else {
            console.warn("Không tìm thấy Phường/Xã trùng khớp. Vui lòng chọn lại.");
            toast.warn("Không tìm thấy Phường/Xã trùng khớp. Vui lòng chọn lại.");
          }
        } else {
          console.warn("Không tìm thấy Quận/Huyện trùng khớp. Vui lòng chọn lại.");
          toast.warn("Không tìm thấy Quận/Huyện trùng khớp. Vui lòng chọn lại.");
        }
      } else {
        console.warn("Không tìm thấy Tỉnh/Thành phố trùng khớp. Vui lòng chọn lại.");
        toast.warn("Không tìm thấy Tỉnh/Thành phố trùng khớp. Vui lòng chọn lại.");
      }
    } else {
      console.warn("Định dạng địa chỉ không hợp lệ, không thể điền tự động. Vui lòng chọn lại.");
      toast.warn("Định dạng địa chỉ không hợp lệ, không thể điền tự động. Vui lòng chọn lại.");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setCurrentAddress(null);
    setFormData({ name: "", phone: "", useraddress: "", setDefault: false });
    setFormErrors({});
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setStreetAddress("");
  };

  const isAddButtonDisabled = addresses.length >= 3;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl  my-10">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/user"
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          aria-label="Quay lại trang người dùng"
        >
          <FaArrowLeft className="text-xl text-gray-700" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Quản lý địa chỉ
        </h1>
      </div>
      
      <div className="mb-8">
        {addresses.length === 0 ? (
          <div className="text-center text-gray-600 text-lg py-12 border border-dashed rounded-lg bg-gray-50 flex flex-col items-center">
            <FaMapMarkerAlt className="text-4xl text-gray-400 mb-4" />
            <p className="font-medium">Bạn chưa có địa chỉ nào được lưu.</p>
            <p className="text-sm mt-1">Vui lòng thêm địa chỉ mới để tiếp tục.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`p-6 border rounded-xl shadow-sm transition-all duration-300 ${
                  defaultAddressId === address._id
                    ? "border-green-500 bg-green-50 ring-2 ring-green-300 transform scale-[1.01]"
                    : "border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-green-600 text-lg" />
                    <h3 className="font-semibold text-lg text-gray-900">
                      {address.name}
                    </h3>
                    {defaultAddressId === address._id && (
                      <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-[10px] sm:text-xs font-medium rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-3 items-center">
                    <button
                      onClick={() => openEditForm(address)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm"
                      title="Chỉnh sửa địa chỉ"
                    >
                      <FaEdit className="text-sm" />
                      Sửa
                    </button>
                    <button
                      onClick={() => confirmDelete(address._id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors duration-200 text-sm"
                      title="Xóa địa chỉ"
                    >
                      <FaTrash className="text-sm" />
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-gray-700">
                  <p className="flex items-center gap-2">
                    <FaPhone className="text-sm text-gray-500" />
                    <span className="font-medium">Số điện thoại:</span> {address.phone}
                  </p>
                  <p className="flex items-start gap-2">
                    <FaMapMarkerAlt className="text-sm text-gray-500 mt-1" />
                    <span className="font-medium">Địa chỉ:</span> {address.useraddress}
                  </p>
                </div>
                {defaultAddressId !== address._id && (
                  <button
                    onClick={() => handleSetDefaultAddress(address._id)}
                    className="mt-4 px-4 py-2 bg-white text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                  >
                    Đặt làm mặc định
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={openAddForm}
        disabled={isAddButtonDisabled}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors duration-300 ${
          isAddButtonDisabled
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg"
        }`}
        title={
          isAddButtonDisabled ? "Bạn đã đạt giới hạn 3 địa chỉ." : "Thêm địa chỉ mới"
        }
      >
        <FaPlus /> Thêm địa chỉ mới
      </button>
      {isAddButtonDisabled && (
        <p className="text-red-500 text-center mt-3 text-sm">
          Bạn chỉ có thể lưu tối đa 3 địa chỉ.
        </p>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center pt-20 z-50 overflow-y-auto">
         <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-6 w-full max-w-2xl relative animate-fade-in-up mt-7 mb-auto">
            <button
              onClick={closeForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold transition-transform transform hover:-rotate-12"
              aria-label="Đóng"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {isEditing ? "Chỉnh sửa Địa chỉ" : "Thêm Địa chỉ Mới"}
            </h2>
            <form onSubmit={handleAddOrUpdateAddress} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên người nhận
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      formErrors.name
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    }`}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      formErrors.phone
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    }`}
                    placeholder="09xxxxxxxx"
                    required
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố
                    </label>
                    <select
                      id="province"
                      name="province"
                      onChange={handleProvinceChange}
                      value={selectedProvince?.code || ""}
                      className={`w-full p-3 border rounded-lg focus:ring-2 ${
                        formErrors.useraddress
                          ? "border-red-500 ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      }`}
                      required
                    >
                      <option value="" disabled>-- Chọn Tỉnh/Thành phố --</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện
                    </label>
                    <select
                      id="district"
                      name="district"
                      onChange={handleDistrictChange}
                      value={selectedDistrict?.code || ""}
                      className={`w-full p-3 border rounded-lg focus:ring-2 ${
                        formErrors.useraddress
                          ? "border-red-500 ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      }`}
                      disabled={!selectedProvince}
                      required
                    >
                      <option value="" disabled>-- Chọn Quận/Huyện --</option>
                      {districts.map((district) => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã
                    </label>
                    <select
                      id="ward"
                      name="ward"
                      onChange={handleWardChange}
                      value={selectedWard?.code || ""}
                      className={`w-full p-3 border rounded-lg focus:ring-2 ${
                        formErrors.useraddress
                          ? "border-red-500 ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      }`}
                      disabled={!selectedDistrict}
                      required
                    >
                      <option value="" disabled>-- Chọn Phường/Xã --</option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ chi tiết (Số nhà, tên đường, ngõ, hẻm)
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={streetAddress}
                    onChange={handleStreetAddressChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      formErrors.useraddress
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    }`}
                    placeholder="Ví dụ: Số 123, đường ABC, ngõ 456"
                    required
                  />
                  {formErrors.useraddress && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.useraddress}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="setDefault"
                  name="setDefault"
                  type="checkbox"
                  checked={formData.setDefault}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label
                  htmlFor="setDefault"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Đặt làm địa chỉ mặc định
                </label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-full sm:w-auto px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium"
                >
                  {isEditing ? "Cập nhật Địa chỉ" : "Thêm Địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showConfirmModal}
        message="Bạn có chắc chắn muốn xóa địa chỉ này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}