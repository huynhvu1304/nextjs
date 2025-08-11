"use client";
import { API_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModal from "@/components/ConfirmationModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading/Loadingcomponent";
import { FaArrowLeft } from "react-icons/fa";

// Định nghĩa interface cho UserAddress (nếu chưa có trong file riêng)
type UserAddress = {
    _id: string;
    userId: string; 
    name: string;
    phone: string;
    useraddress: string; 
    isDefault: boolean; // Thêm lại isDefault nếu API trả về (quan trọng cho logic mặc định)
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

// Hàm validateAddress: Đã được thêm vào đây
const validateAddress = (address: string): string | null => {
    const trimmed = address.trim();
    // Các từ khóa địa danh tiếng Việt cơ bản để kiểm tra
    const vietnamKeywords = [
        "tỉnh", "thành phố", "quận", "huyện", "phường", "xã", 
        "thị trấn", "thôn", "đường", "ngõ", "ngách", "hẻm", "số", "ấp", "khu phố"
    ];

    if (trimmed.length < 5 || trimmed.length > 100) { 
      return "Địa chỉ phải có từ 5 đến 100 ký tự.";
    }
    // Kiểm tra có ít nhất một chữ cái hoặc số
    if (!/[a-zA-Z0-9À-ỹà-ỹ]/.test(trimmed)) {
      return "Địa chỉ phải chứa ít nhất một ký tự chữ hoặc số.";
    }
    // Kiểm tra có chứa từ khóa địa danh tiếng Việt không
    if (!vietnamKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
      return "Địa chỉ nên chứa ít nhất một từ khóa địa danh hợp lệ (ví dụ: quận, phường, xã...).";
    }
    // Ngăn chặn các ký tự có thể gây lỗi XSS hoặc lỗi định dạng
    if (/[<>]/.test(trimmed)) {
      return "Địa chỉ không được chứa các ký tự không hợp lệ như < hoặc >.";
    }
    return null; // Không có lỗi
};


export default function AddressManagementPage() {
    const router = useRouter(); // Khởi tạo router
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<UserAddress | null>(null);

    const [formData, setFormData] = useState<AddressFormState>({
        name: "",
        phone: "",
        useraddress: "",
        setDefault: false,
    });

    const [formErrors, setFormErrors] = useState<Partial<AddressFormState>>({});

    // State for Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Bạn cần đăng nhập để quản lý địa chỉ.");
            setLoading(false);
            return;
        }

        try {
            // Fetch all addresses
            const allAddressesRes = await fetch(`${API_URL}/users/addresses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allAddressesData = await allAddressesRes.json();
            if (allAddressesRes.ok) {
                setAddresses(allAddressesData);
            } else {
                throw new Error(allAddressesData.message || "Không thể tải danh sách địa chỉ.");
            }

            // Fetch default address
            const defaultAddressRes = await fetch(`${API_URL}/users/addresses/default`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        
        const addressError = validateAddress(data.useraddress); 
        if (addressError) {
            errors.useraddress = addressError;
        }
        
        return errors;
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
        setFormErrors((prev) => ({ ...prev, [name]: "" })); 
    };

    const handleAddOrUpdateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateForm(formData); 
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

        // Kiểm tra số lượng địa chỉ trước khi thêm mới
        if (!isEditing && addresses.length >= 3) {
            toast.error("Bạn chỉ có thể lưu tối đa 3 địa chỉ.");
            closeForm(); // Đóng form nếu vượt quá giới hạn
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
                        useraddress: formData.useraddress,
                    }),
                });
            } else {
                res = await fetch(`${API_URL}/users/addresses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData), 
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
            } else if (isEditing && formData.setDefault && defaultAddressId !== currentAddress?._id) {
                await handleSetDefaultAddress(currentAddress!._id);
            }
            await fetchAddresses();
            toast.success(isEditing ? "Địa chỉ đã được cập nhật thành công!" : "Địa chỉ đã được thêm thành công!");
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

    // Hàm để mở modal xác nhận xóa
    const confirmDelete = (addressId: string) => {
        setAddressToDeleteId(addressId);
        setShowConfirmModal(true);
    };

    // Hàm xử lý khi người dùng xác nhận xóa trên modal
    const handleConfirmDelete = async () => {
        if (addressToDeleteId) {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Bạn cần đăng nhập để thực hiện hành động này.");
                setShowConfirmModal(false); // Close the modal
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/addresses/${addressToDeleteId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
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
                setShowConfirmModal(false); // Always close the modal after handling
                setAddressToDeleteId(null); // Reset ID
            }
        }
    };

    // Hàm xử lý khi người dùng hủy bỏ hành động trên modal
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
    };

    const openEditForm = (address: UserAddress) => {
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
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setIsEditing(false);
        setCurrentAddress(null);
        setFormData({ name: "", phone: "", useraddress: "", setDefault: false });
        setFormErrors({});
    };

    // Xác định xem nút "Thêm địa chỉ mới" có nên bị vô hiệu hóa hay không
    const isAddButtonDisabled = addresses.length >= 3;

    if (loading) {
        return (
           <Loading />
        );
    }

      return (
        <div className="max-w-[1280px] mx-auto mt-[20px] sm:mt-[100px] p-6 bg-white rounded-lg my-10">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Quản lý Địa chỉ Giao hàng</h1> */}

            {/* Nút trở lại trang trước đó - Thêm vào đây */}
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
                    Quản lý địa chỉ
                </h1>
                {/* <p className="text-sm text-gray-500 mt-1">Lịch đơn hàng</p> */}
                </div>
            </div>

            {/* Danh sách địa chỉ */}
            <div className="mb-8">
                {addresses.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg py-10 border rounded-md bg-gray-50">
                        Bạn chưa có địa chỉ nào được lưu. Vui lòng thêm địa chỉ mới.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className={`p-5 border rounded-lg shadow-sm transition-all duration-200 ${
                                    defaultAddressId === address._id
                                        ? "border-green-500 bg-green-50 ring-2 ring-green-300"
                                        : "border-gray-200 bg-white hover:shadow-md"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg text-black dark:text-900">
                                        <span className="font-medium">Tên:</span> {address.name}{" "}
                                        {defaultAddressId === address._id && (
                                           <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-[10px] sm:text-xs font-medium rounded-full">
                                             Mặc định
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => openEditForm(address)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                            title="Chỉnh sửa địa chỉ"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(address._id)}
                                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                            title="Xóa địa chỉ"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-1">
                                    <span className="font-medium">Số điện thoại:</span> {address.phone}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-medium">Địa chỉ:</span> {address.useraddress}
                                </p>
                                {defaultAddressId !== address._id && (
                                    <button
                                        onClick={() => handleSetDefaultAddress(address._id)}
                                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 text-sm"
                                    >
                                        Đặt làm mặc định
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Nút "Thêm địa chỉ mới" */}
            <button
                onClick={openAddForm}
                disabled={isAddButtonDisabled}
                className={`w-full py-3 rounded-md font-semibold text-lg ${
                    isAddButtonDisabled
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 transition-colors duration-300"
                }`}
                title={isAddButtonDisabled ? "Bạn đã đạt giới hạn 3 địa chỉ." : "Thêm địa chỉ mới"}
            >
                Thêm địa chỉ mới
            </button>
            {isAddButtonDisabled && (
                <p className="text-red-500 text-center mt-2">Bạn chỉ có thể lưu tối đa 3 địa chỉ.</p>
            )}

            {/* Form thêm/sửa địa chỉ (Modal) */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 mt-10">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                        <button
                            onClick={closeForm}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            aria-label="Đóng"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            {isEditing ? "Chỉnh sửa Địa chỉ" : "Thêm Địa chỉ Mới"}
                        </h2>
                        <form onSubmit={handleAddOrUpdateAddress} className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên người nhận
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className={`w-full p-3 border rounded-md focus:ring-2 ${
                                        formErrors.name ? "border-red-500 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    className={`w-full p-3 border rounded-md focus:ring-2 ${
                                        formErrors.phone ? "border-red-500 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                                    placeholder="09xxxxxxxx"
                                    required
                                />
                                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="useraddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ chi tiết
                                </label>
                                <textarea
                                    id="useraddress"
                                    name="useraddress"
                                    value={formData.useraddress}
                                    onChange={handleFormChange}
                                    rows={3}
                                    className={`w-full p-3 border rounded-md resize-y focus:ring-2 ${
                                        formErrors.useraddress ? "border-red-500 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                    }`}
                                    placeholder="Ví dụ: Số 123, đường ABC, phường X, quận Y, thành phố Z"
                                    required
                                ></textarea>
                                {formErrors.useraddress && <p className="text-red-500 text-xs mt-1">{formErrors.useraddress}</p>}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    {isEditing ? "Cập nhật Địa chỉ" : "Thêm Địa chỉ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                message="Bạn có chắc chắn muốn xóa địa chỉ này?"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}