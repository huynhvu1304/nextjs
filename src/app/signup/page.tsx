"use client";

import Footer from "@/components/Footer/Footer";
import { API_URL } from "@/lib/api";
import { redirect } from "next/dist/server/api-utils";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hàm validateField trả về lỗi string, đồng thời cập nhật state errors
  const validateField = (field: string, value: string): string => {
    let errorMsg = "";

    switch (field) {
      case "name":
        if (!value.trim()) errorMsg = "Vui lòng nhập họ và tên";
        break;
      case "email":
        if (!value.trim()) errorMsg = "Vui lòng nhập email";
        else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value))
          errorMsg = "Email không hợp lệ!";
        break;
        case "phone":
        if (!value.trim()) errorMsg = "Vui lòng nhập số điện thoại";
        else if (!/^(03|05|07|08|09)[0-9]{8}$/.test(value))
          errorMsg = "Số điện thoại đủ 10 chữ số";
        break;

      case "password":
        if (!value) errorMsg = "Vui lòng nhập mật khẩu";
        else if (value.length < 8)
          errorMsg = "Mật khẩu phải dài ít nhất 8 ký tự";
        break;
      case "confirmPassword":
        if (!value) errorMsg = "Vui lòng xác nhận mật khẩu";
        else if (value !== password) errorMsg = "Mật khẩu xác nhận không khớp";
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    return errorMsg;
  };

  // Validate toàn bộ form, trả về true nếu không lỗi
  const validateForm = () => {
    const nameError = validateField("name", name);
    const emailError = validateField("email", email);
    const phoneError = validateField("phone", phone);
    const passwordError = validateField("password", password);
    const confirmPasswordError = validateField("confirmPassword", confirmPassword);

    const hasErrors = [nameError, emailError, passwordError, confirmPasswordError,phoneError].some(
      (e) => e !== ""
    );

    if (hasErrors) {
      setError("Vui lòng sửa các lỗi trước khi gửi");
      return false;
    }

    if (!name || !email || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    if (image) {
      formData.append("img", image);
    }

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Đã có lỗi xảy ra");
        setSuccess("");
      } else {
        toast.success("Đăng ký thành công");
        setTimeout(() => {
          document.location.href = "/login";
        }, 1000);
        setSuccess("Đăng ký thành công");
        setName("");
        setEmail("");
        setPhone("");
        setImage(null); 
        setFileName(""); 
        setPreview(null); 
        setPassword("");
        setConfirmPassword("");
        setErrors({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
        setError("");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
      setSuccess("");
    }
  };

  return (
    <>
    <div className="min-h-screen mt-10 flex items-center justify-center bg-gradient-to-r from-gray-200 to-gray-100">
      <div className="flex w-full max-w-4xl shadow-lg rounded-lg overflow-hidden bg-white">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Đăng Ký</h2>
          <p className="text-sm text-gray-600 mb-6">
            Tạo tài khoản chỉ trong ít phút, đăng ký ngay!
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-3 rounded border border-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 mb-3 rounded border border-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2" noValidate>
            <div className="form-group relative min-h-[60px]">
  <input
    type="text"
    id="name"
    value={name}
    onChange={(e) => {
      setName(e.target.value);
      validateField("name", e.target.value);
    }}
    placeholder="Họ và Tên"
    className={`w-full px-4 py-2 my-2 border rounded focus:outline-none focus:ring-2 ${
      errors.name
        ? "border-red-500 focus:ring-red-400"
        : "border-gray-300 focus:ring-green-400"
    }`}
  />
  {errors.name && (
    <p className="text-red-600 text-sm mt-1 absolute left-0 bottom-[-15px]">
      {errors.name}
    </p>
  )}
</div>


           <div className="form-group relative min-h-[60px]">
  <input
    type="email"
    id="email"
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      validateField("email", e.target.value);
    }}
    placeholder="Email"
    className={`w-full px-4 py-2 my-2 border rounded focus:outline-none focus:ring-2 ${
      errors.email
        ? "border-red-500 focus:ring-red-400"
        : "border-gray-300 focus:ring-green-400"
    }`}
  />
  {errors.email && (
    <p className="text-red-600 text-sm mt-1 absolute left-0 bottom-[-10px]">
      {errors.email}
    </p>
  )}
</div>

<div className="form-group relative min-h-[60px]">
  <input
    type="text"
    id="phone"
    value={phone}
    onChange={(e) => {
      setPhone(e.target.value);
      validateField("phone", e.target.value);
    }}
    placeholder="Số điện thoại"
    className={`w-full px-4 py-2 my-2 border rounded focus:outline-none focus:ring-2 ${
      errors.phone
        ? "border-red-500 focus:ring-red-400"
        : "border-gray-300 focus:ring-green-400"
    }`}
  />
  {errors.phone && (
    <p className="text-red-600 text-sm mt-1 absolute left-0 bottom-[-14px]">
      {errors.phone}
    </p>
  )}
</div>


    <div className="form-group relative min-h-[60px]"> {/* chiều cao cố định */}
  <input
    type={showPassword ? "text" : "password"}
    id="password"
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      validateField("password", e.target.value);
    }}
    placeholder="Mật Khẩu"
    className={`w-full px-4 py-2 my-2 border rounded pr-10 focus:outline-none focus:ring-2 ${
      errors.password
        ? "border-red-500 focus:ring-red-400"
        : "border-gray-300 focus:ring-green-400"
    }`}
  />
  <span
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
  {errors.password && (
    <p className="text-red-600 text-sm mt-1 absolute left-0 bottom-[-10px] text-sm">
      {errors.password}
    </p>
  )}
</div>


       <div className="form-group relative min-h-[60px]">
  <input
    type={showConfirmPassword ? "text" : "password"}
    id="confirmPassword"
    value={confirmPassword}
    onChange={(e) => {
      setConfirmPassword(e.target.value);
      validateField("confirmPassword", e.target.value);
    }}
    placeholder="Xác Nhận Mật Khẩu"
    className={`w-full px-4 py-2 my-2 border rounded pr-10 focus:outline-none focus:ring-2 ${
      errors.confirmPassword
        ? "border-red-500 focus:ring-red-400"
        : "border-gray-300 focus:ring-green-400"
    }`}
  />
  <span
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  >
    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
  {errors.confirmPassword && (
    <p className="text-red-600 text-sm mt-1 absolute left-0 bottom-[-10px] text-sm">
      {errors.confirmPassword}
    </p>
  )}
</div>



            <div>
              <input
                type="file"
                accept="image/*"
                id="fileInput"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImage(e.target.files[0]);
                    setPreview(URL.createObjectURL(e.target.files[0]));
                    setFileName(e.target.files[0].name);
                  } else {
                    setFileName("");
                    setPreview(null);
                    setImage(null);
                  }
                }}
              />

              <label
                htmlFor="fileInput"
                className="cursor-pointer block w-full px-4 py-2 my-2 border border-gray-300 rounded text-center text-[#1a7a00] hover:bg-[#d4eac4]"
              >
                {fileName || "Bạn có thể chọn ảnh của bạn để làm giao diện"}
              </label>

              {preview && (
                <img
                  src={preview}
                  alt="Ảnh preview"
                  className="w-40 h-40 object-contain  mx-auto"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Đăng Ký
            </button>
          </form>
        </div>

        {/* Right: Image */}
        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: `url('/img/Auraspeed_Fantome_1892x660.webp')`,
          }}
        >
          <div className="h-full w-full bg-black bg-opacity-30 flex items-center justify-center text-white text-center p-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">CHÀO MỪNG </h2>
              <p className="text-sm">
                Novashop nơi lý tưởng của bạn về uy tín, chất lượng sản phẩm cầu
                lông!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
        <Footer />
        </>
  );
}
